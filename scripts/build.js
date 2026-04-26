const fs = require("fs/promises");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PACKAGE_FILE = path.join(ROOT_DIR, "package.json");
const SOURCE_HTML_FILE = path.join(ROOT_DIR, "派单结算录入.html");
const SOURCE_PUBLIC_DIR = path.join(ROOT_DIR, "public");
const SOURCE_BUILD_INFO_FILE = path.join(ROOT_DIR, "build-info.json");
const TARGET_HTML_FILE = path.join(DIST_DIR, "派单结算录入.html");
const TARGET_PUBLIC_DIR = path.join(DIST_DIR, "public");
const TARGET_BUILD_INFO_FILE = path.join(DIST_DIR, "build-info.json");

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

async function createBuildInfo() {
  const packageJson = await readJsonFile(PACKAGE_FILE);
  const previousBuildInfo = await readJsonFile(SOURCE_BUILD_INFO_FILE);
  const baseVersion = String(packageJson?.version || "1.0.0").trim() || "1.0.0";
  const previousBaseVersion = String(previousBuildInfo?.baseVersion || "").trim();
  const previousBuildNumber = Number(previousBuildInfo?.buildNumber);
  const buildNumber = previousBaseVersion === baseVersion && Number.isInteger(previousBuildNumber)
    ? previousBuildNumber + 1
    : 1;

  return {
    version: `${baseVersion}.${buildNumber}`,
    baseVersion,
    buildNumber,
    builtAt: new Date().toISOString(),
    html: path.basename(SOURCE_HTML_FILE),
    publicDir: path.basename(SOURCE_PUBLIC_DIR)
  };
}

async function main() {
  const buildInfo = await createBuildInfo();
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.copyFile(SOURCE_HTML_FILE, TARGET_HTML_FILE);
  await fs.cp(SOURCE_PUBLIC_DIR, TARGET_PUBLIC_DIR, { recursive: true });
  const buildInfoJson = `${JSON.stringify(buildInfo, null, 2)}\n`;
  await fs.writeFile(SOURCE_BUILD_INFO_FILE, buildInfoJson, "utf8");
  await fs.writeFile(TARGET_BUILD_INFO_FILE, buildInfoJson, "utf8");

  console.log(`Build completed: ${DIST_DIR} (${buildInfo.version})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
