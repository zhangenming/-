const nativeFs = require("fs");
const fs = require("fs/promises");
const path = require("path");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SOURCE_HTML_FILE = path.join(ROOT_DIR, "派单结算录入.html");
const SOURCE_PUBLIC_DIR = path.join(ROOT_DIR, "public");
const SOURCE_BUILD_INFO_FILE = path.join(ROOT_DIR, "build-info.json");
const SOURCE_CHANGE_LOG_FILE = path.join(ROOT_DIR, "CHANGELOG.json");
const TARGET_HTML_FILE = path.join(DIST_DIR, "派单结算录入.html");
const TARGET_PUBLIC_DIR = path.join(DIST_DIR, "public");
const TARGET_BUILD_INFO_FILE = path.join(DIST_DIR, "build-info.json");
const TARGET_CHANGE_LOG_FILE = path.join(DIST_DIR, "CHANGELOG.json");
const APP_ENV = String(process.env.APP_ENV || "production").trim().toLowerCase() === "development"
  ? "development"
  : "production";
const ROOT_HTML_BASENAME = path.basename(SOURCE_HTML_FILE);
const SERVER_PORT = 3000;
const SERVER_HOST = "0.0.0.0";
const SERVER_READY_HOST = "127.0.0.1";
const SERVER_APP_ENV = "production";
const SERVER_LOG_FILE = "/private/tmp/dispatch_server.log";
const SERVER_ERROR_LOG_FILE = "/private/tmp/dispatch_server.err.log";
const execFileAsync = promisify(execFile);
const BEIJING_TIME_ZONE = "Asia/Shanghai";
const BEIJING_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: BEIJING_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  hourCycle: "h23"
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatBeijingDateTime(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const parts = {};
  BEIJING_DATE_TIME_FORMATTER.formatToParts(date).forEach(({ type, value }) => {
    if (type !== "literal") {
      parts[type] = value;
    }
  });
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

async function listListeningPids(port) {
  try {
    const { stdout } = await execFileAsync("lsof", [
      `-iTCP:${port}`,
      "-sTCP:LISTEN",
      "-n",
      "-P",
      "-t"
    ], { cwd: ROOT_DIR });
    return String(stdout || "")
      .split(/\s+/)
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0);
  } catch (error) {
    if (error && typeof error.code === "number" && error.code === 1) {
      return [];
    }
    throw error;
  }
}

async function waitForListeningPidChange(port, previousPids, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  const previousPidSet = new Set(previousPids);
  while (Date.now() < deadline) {
    const currentPids = await listListeningPids(port);
    const hasNewPid = currentPids.some((pid) => !previousPidSet.has(pid));
    if (hasNewPid) {
      return { restarted: true, pids: currentPids };
    }
    if (!currentPids.length) {
      return { restarted: false, pids: [] };
    }
    await sleep(150);
  }
  return {
    restarted: false,
    pids: await listListeningPids(port)
  };
}

async function waitForServerReady(port, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const currentPids = await listListeningPids(port);
    if (currentPids.length) {
      return currentPids;
    }
    await sleep(200);
  }
  throw new Error(`后端服务未在 ${timeoutMs}ms 内监听 ${SERVER_READY_HOST}:${port}`);
}

async function signalProcess(pid, signalName) {
  const normalizedPid = Number(pid);
  if (!Number.isInteger(normalizedPid) || normalizedPid <= 0) {
    return false;
  }
  const signalFlag = signalName === "SIGKILL" ? "-KILL" : "-TERM";
  try {
    await execFileAsync("kill", [signalFlag, String(normalizedPid)], { cwd: ROOT_DIR });
    return true;
  } catch (commandError) {
    try {
      process.kill(normalizedPid, signalName);
      return true;
    } catch {
      return false;
    }
  }
}

async function terminateListeningProcesses(port) {
  const initialPids = await listListeningPids(port);
  if (!initialPids.length) {
    return { initialPids, restartedBySupervisor: false };
  }

  await Promise.all(initialPids.map((pid) => signalProcess(pid, "SIGTERM")));

  let state = await waitForListeningPidChange(port, initialPids, 2500);
  if (state.restarted) {
    return { initialPids, restartedBySupervisor: true, currentPids: state.pids };
  }
  if (!state.pids.length) {
    return { initialPids, restartedBySupervisor: false, currentPids: [] };
  }

  await Promise.all(
    state.pids
      .filter((pid) => initialPids.includes(pid))
      .map((pid) => signalProcess(pid, "SIGKILL"))
  );

  state = await waitForListeningPidChange(port, initialPids, 2500);
  if (state.restarted) {
    return { initialPids, restartedBySupervisor: true, currentPids: state.pids };
  }

  const remainingPids = await listListeningPids(port);
  if (remainingPids.length) {
    throw new Error(`端口 ${port} 仍被占用，PID: ${remainingPids.join(", ")}`);
  }

  return { initialPids, restartedBySupervisor: false, currentPids: [] };
}

async function startBackendServer() {
  await fs.mkdir(path.dirname(SERVER_LOG_FILE), { recursive: true });
  const stdoutFd = nativeFs.openSync(SERVER_LOG_FILE, "a");
  const stderrFd = nativeFs.openSync(SERVER_ERROR_LOG_FILE, "a");
  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT_DIR,
    detached: true,
    env: {
      ...process.env,
      HOST: SERVER_HOST,
      PORT: String(SERVER_PORT),
      APP_ENV: SERVER_APP_ENV
    },
    stdio: ["ignore", stdoutFd, stderrFd]
  });
  child.unref();
  nativeFs.closeSync(stdoutFd);
  nativeFs.closeSync(stderrFd);
  const readyPids = await waitForServerReady(SERVER_PORT);
  return { pid: child.pid, readyPids };
}

async function restartBackendServer() {
  const result = await terminateListeningProcesses(SERVER_PORT);
  if (result.restartedBySupervisor) {
    const readyPids = await waitForServerReady(SERVER_PORT);
    console.log(`Backend restarted by existing supervisor on port ${SERVER_PORT} (PID: ${readyPids.join(", ")})`);
    return;
  }

  const started = await startBackendServer();
  console.log(`Backend restarted on port ${SERVER_PORT} (PID: ${started.readyPids.join(", ")})`);
}

async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function parseVersionXY(versionStr) {
  const version = String(versionStr || "").trim();
  const parts = version.split(".");
  const x = parseInt(parts[0]) || 1;
  const y = parseInt(parts[1]) || 0;
  return { x, y, baseVersion: `${x}.${y}` };
}

async function getBaseVersionFromChangeLog() {
  const changeLog = await readJsonFile(SOURCE_CHANGE_LOG_FILE);
  let baseVersion = "1.0";
  if (Array.isArray(changeLog) && changeLog.length > 0) {
    const latestVersion = String(changeLog[0]?.version || "").trim();
    if (latestVersion) {
      baseVersion = parseVersionXY(latestVersion).baseVersion;
    }
  }
  return baseVersion;
}

async function createBuildInfo() {
  const previousBuildInfo = await readJsonFile(SOURCE_BUILD_INFO_FILE);
  const previousBuildNumber = Number(previousBuildInfo?.buildNumber);
  const newBuildNumber = Number.isInteger(previousBuildNumber) && previousBuildNumber >= 0
    ? previousBuildNumber + 1
    : 0;

  const baseVersion = await getBaseVersionFromChangeLog();
  const fullVersion = `${baseVersion}.${newBuildNumber}`;
  const builtAt = formatBeijingDateTime(new Date());

  return {
    buildNumber: newBuildNumber,
    builtAt: builtAt,
    appEnv: APP_ENV,
    version: fullVersion
  };
}

async function copyAdditionalHtmlFiles() {
  const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html") && entry.name !== ROOT_HTML_BASENAME)
    .map((entry) => entry.name);

  await Promise.all(htmlFiles.map(async (fileName) => {
    await fs.copyFile(path.join(ROOT_DIR, fileName), path.join(DIST_DIR, fileName));
  }));
}

async function main() {
  const buildInfo = await createBuildInfo();
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.copyFile(SOURCE_HTML_FILE, TARGET_HTML_FILE);
  await copyAdditionalHtmlFiles();
  await fs.cp(SOURCE_PUBLIC_DIR, TARGET_PUBLIC_DIR, { recursive: true });
  await fs.copyFile(SOURCE_CHANGE_LOG_FILE, TARGET_CHANGE_LOG_FILE);
  const buildInfoJson = `${JSON.stringify(buildInfo, null, 2)}\n`;
  await fs.writeFile(SOURCE_BUILD_INFO_FILE, buildInfoJson, "utf8");
  await fs.writeFile(TARGET_BUILD_INFO_FILE, buildInfoJson, "utf8");
  await restartBackendServer();

  console.log(`Build completed: ${DIST_DIR}`);
  console.log(`Build time: ${buildInfo.builtAt}`);
  console.log(`Build version: ${buildInfo.version}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
