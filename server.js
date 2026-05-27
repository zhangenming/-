const http = require("http");
const nativeFs = require("fs");
const fs = require("fs/promises");
const path = require("path");
const APP_PACKAGE = require("./package.json");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const APP_ENV = String(process.env.APP_ENV || "production").trim().toLowerCase() === "development"
  ? "development"
  : "production";
const IS_DEVELOPMENT = APP_ENV === "development";
const IS_DEV_LIVE_RELOAD_ENABLED = IS_DEVELOPMENT && String(process.env.ENABLE_DEV_LIVE_RELOAD || "").trim() === "1";
const DATA_NAMESPACE = IS_DEVELOPMENT ? "development" : "production";

const ROOT_DIR = __dirname;
const SOURCE_HTML_FILE = path.join(ROOT_DIR, "派单结算录入.html");
const SOURCE_DESKTOP_HTML_FILE = path.join(ROOT_DIR, "派单结算录入电脑版.html");
const SOURCE_MOBILE_HTML_FILE = path.join(ROOT_DIR, "派单结算录入手机版.html");
const SOURCE_PUBLIC_DIR = path.join(ROOT_DIR, "public");
const SOURCE_BUILD_INFO_FILE = path.join(ROOT_DIR, "build-info.json");
const SOURCE_CHANGE_LOG_FILE = path.join(ROOT_DIR, "CHANGELOG.json");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const HTML_DIR = IS_DEVELOPMENT ? ROOT_DIR : DIST_DIR;
const DESKTOP_HTML_FILE = IS_DEVELOPMENT ? SOURCE_DESKTOP_HTML_FILE : path.join(DIST_DIR, "派单结算录入电脑版.html");
const MOBILE_HTML_FILE = IS_DEVELOPMENT ? SOURCE_MOBILE_HTML_FILE : path.join(DIST_DIR, "派单结算录入手机版.html");
const PUBLIC_DIR = IS_DEVELOPMENT ? SOURCE_PUBLIC_DIR : path.join(DIST_DIR, "public");
const BUILD_INFO_FILE = IS_DEVELOPMENT ? SOURCE_BUILD_INFO_FILE : path.join(DIST_DIR, "build-info.json");
const CHANGE_LOG_FILE = IS_DEVELOPMENT ? SOURCE_CHANGE_LOG_FILE : path.join(DIST_DIR, "CHANGELOG.json");
const DATA_DIR = path.join(ROOT_DIR, IS_DEVELOPMENT ? "data-dev" : "data");
const DATA_FILE = path.join(DATA_DIR, "records.json");
const RECYCLE_BIN_FILE = path.join(DATA_DIR, "recycle-bin.json");
const ACCOUNTANTS_FILE = path.join(DATA_DIR, "accountants.json");
const DISPATCHER_PASSWORDS_FILE = path.join(DATA_DIR, "dispatcher-passwords.json");
const ACCOUNTANT_OPERATION_LOG_FILE = path.join(DATA_DIR, "accountant-operation-logs.json");
const REMINDERS_FILE = path.join(DATA_DIR, "reminders.json");
const FEEDBACK_IMAGE_DIR = path.join(DATA_DIR, "feedback-images");
const FEEDBACK_IMAGE_URL_PREFIX = "/feedback-images/";
const INVOICE_IMAGE_DIR = path.join(DATA_DIR, "invoice-images");
const INVOICE_IMAGE_URL_PREFIX = "/invoice-images/";
const SERVER_LOG_FILE = path.join(ROOT_DIR, "server.log");
const DEV_LIVE_RELOAD_PATHNAME = "/__dev/events";
const FORCE_REFRESH_EVENTS_PATHNAME = "/api/events/force-refresh";
const FORCE_REFRESH_TRIGGER_PATHNAME = "/api/force-refresh";
const DISPATCHER_ACCOUNT_LIST = ["1", "a", "c", "d", "e", "k", "开心财税", "开心财税1旧", "开心财税k旧"];
const DISPATCHER_ACCOUNTS = new Set(DISPATCHER_ACCOUNT_LIST);
const DISPATCHER_LOGIN_PASSWORD = "11";
const BOSS_LOGIN_ACCOUNT = "开心";
const BOSS_LOGIN_LEGACY_ACCOUNT = "boss";
const BOSS_LOGIN_ACCOUNTS = [
  { account: BOSS_LOGIN_ACCOUNT, password: "boss123", aliases: [BOSS_LOGIN_ACCOUNT, BOSS_LOGIN_LEGACY_ACCOUNT] }
];
const BOSS_LOGIN_ACCOUNT_SET = new Set(BOSS_LOGIN_ACCOUNTS.map((item) => item.account.toLowerCase()));
const BOSS_LOGIN_CODE_TO_ACCOUNT = BOSS_LOGIN_ACCOUNTS.reduce((result, item) => {
  const aliases = Array.isArray(item.aliases) ? item.aliases : [];
  aliases.concat(item.account).forEach((alias) => {
    const normalizedAlias = String(alias || "").trim().toLowerCase();
    if (normalizedAlias) {
      result[normalizedAlias] = item.account;
    }
  });
  return result;
}, Object.create(null));
const DEFAULT_ACCOUNTANT_LOGIN_PASSWORD = "123456";
const NON_SETTLEMENT_ACCOUNTANT_NAME = "不结算";
const EXTERNAL_ACCOUNTANT_NAME = "外部人员";
const BUILT_IN_ACCOUNTANT_NAMES = [NON_SETTLEMENT_ACCOUNTANT_NAME, EXTERNAL_ACCOUNTANT_NAME];
const FEEDBACK_IMAGE_MAX_COUNT = 8;
const FEEDBACK_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const SETTLEMENT_INVOICE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const API_JSON_BODY_MAX_SIZE_BYTES = 8 * 1024 * 1024;
const AUTH_ACCOUNT_HEADER = "x-dispatch-account";
const DISPATCHER_LOGIN_CODE_TO_ACCOUNT = {
  "1": "1",
  a: "a",
  c: "c",
  d: "d",
  e: "e",
  k: "k",
  "开心财税": "开心财税",
  "开心财税1旧": "开心财税1旧",
  "开心财税k旧": "开心财税k旧",
  "开心财税1": "1",
  "开心财税a": "a",
  "开心财税c": "c",
  "开心财税d": "d",
  "开心财税e": "e",
  "开心财税k": "k",
  "1旧": "开心财税1旧",
  "k旧": "开心财税k旧"
};

let writeQueue = Promise.resolve();
const devLiveReloadClients = new Set();
const forceRefreshClients = new Set();
let devLiveReloadHeartbeat = null;
let forceRefreshHeartbeat = null;
let devLiveReloadDebounceTimer = null;
let devWatchersStarted = false;
let staticAssetVersion = "";

const STATIC_MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon"
};
const BEIJING_TIME_ZONE = "Asia/Shanghai";
const STRUCTURED_DATE_TIME_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
const TRUTHY_STATE_TEXT_VALUES = new Set(["true", "1", "yes"]);
const SETTLED_WORKFLOW_STATE_VALUES = new Set([
  "已核对客户确认/待上传",
  "已上传",
  "已上传/待结算",
  "已结算"
]);
const MONTHLY_SETTLEMENT_STATE_VALUES = new Set(["on", "是", "月结"]);
const PAID_WORKFLOW_STATE_VALUES = new Set(["已结算"]);
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

function appendServerLogLine(line) {
  fs.appendFile(SERVER_LOG_FILE, `${line}\n`, "utf8").catch(() => {});
}

function attachRequestLogger(req, res) {
  const startAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startAt;
    const method = String(req.method || "GET").toUpperCase();
    const url = String(req.url || "/");
    const status = Number(res.statusCode || 0);
    const line = `[${getCurrentBeijingDateTime()}] ${method} ${url} ${status} ${durationMs}ms`;
    console.log(line);
    appendServerLogLine(line);
  });
}

function setApiCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Dispatch-Account");
}

function sendJson(res, statusCode, payload) {
  setApiCorsHeaders(res);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(text);
}

function appendHtmlBeforeBody(html, content) {
  if (html.includes("</body>")) {
    return html.replace("</body>", `${content}\n</body>`);
  }

  return `${html}\n${content}\n`;
}

function toInlineJson(value) {
  return JSON.stringify(value).replace(/[<>&]/g, (char) => ({
    "<": "\\u003c",
    ">": "\\u003e",
    "&": "\\u0026"
  }[char]));
}

function buildEnvironmentIconSvg() {
  const isDevelopment = APP_ENV === "development";
  const label = isDevelopment ? "开发" : "生产";
  const backgroundColor = isDevelopment ? "#fff7e6" : "#eaf7f1";
  const borderColor = isDevelopment ? "#d89a2b" : "#0e7c66";
  const textColor = isDevelopment ? "#8a5a10" : "#0b5c4b";
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    `<rect width="64" height="64" rx="14" fill="${backgroundColor}"/>`,
    `<rect x="4" y="4" width="56" height="56" rx="12" fill="none" stroke="${borderColor}" stroke-width="4"/>`,
    `<text x="32" y="38" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="24" font-weight="800" fill="${textColor}">${label}</text>`,
    "</svg>"
  ].join("");
}

function getEnvironmentIconHref() {
  return `data:image/svg+xml,${encodeURIComponent(buildEnvironmentIconSvg())}`;
}

function normalizeStaticAssetVersion(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function getStaticAssetVersion() {
  return staticAssetVersion || normalizeStaticAssetVersion(APP_PACKAGE?.version || "1.0.0");
}

async function loadStaticAssetVersion() {
  if (IS_DEVELOPMENT) {
    staticAssetVersion = normalizeStaticAssetVersion(`${APP_PACKAGE?.version || "1.0.0"}-dev`);
    return;
  }

  try {
    const content = await fs.readFile(BUILD_INFO_FILE, "utf8");
    const payload = JSON.parse(content);
    staticAssetVersion = normalizeStaticAssetVersion(
      payload?.version || payload?.builtAt || APP_PACKAGE?.version || "1.0.0"
    );
  } catch {
    staticAssetVersion = normalizeStaticAssetVersion(APP_PACKAGE?.version || "1.0.0");
  }
}

function appendVersionToStaticAssetUrl(rawUrl, assetVersion) {
  const normalizedUrl = String(rawUrl || "").trim();
  const normalizedVersion = normalizeStaticAssetVersion(assetVersion);
  if (!normalizedUrl || !normalizedVersion || normalizedUrl.startsWith("data:")) {
    return normalizedUrl;
  }

  const hashIndex = normalizedUrl.indexOf("#");
  const beforeHash = hashIndex >= 0 ? normalizedUrl.slice(0, hashIndex) : normalizedUrl;
  const hash = hashIndex >= 0 ? normalizedUrl.slice(hashIndex) : "";
  const [pathPart, queryPart = ""] = beforeHash.split("?");
  const params = new URLSearchParams(queryPart);
  params.delete("v");
  params.set("v", normalizedVersion);
  const query = params.toString();
  return `${pathPart}${query ? `?${query}` : ""}${hash}`;
}

function withStaticAssetVersion(html, assetVersion) {
  const normalizedVersion = normalizeStaticAssetVersion(assetVersion);
  if (!normalizedVersion) {
    return html;
  }

  return html.replace(/\b(href|src)="(\.\/public\/[^"]+)"/g, (match, attrName, assetUrl) => (
    `${attrName}="${appendVersionToStaticAssetUrl(assetUrl, normalizedVersion)}"`
  ));
}

function getPublicAssetCacheControl() {
  return IS_DEVELOPMENT ? "no-store" : "public, max-age=31536000, immutable";
}

function withRuntimeConfig(html) {
  const iconHref = getEnvironmentIconHref();
  const assetVersion = getStaticAssetVersion();
  const content = [
    `<link rel="icon" type="image/svg+xml" href="${iconHref}" />`,
    `<link rel="shortcut icon" type="image/svg+xml" href="${iconHref}" />`,
    `<script>window.__APP_ENV__ = ${toInlineJson(APP_ENV)};window.__STATIC_ASSET_VERSION__ = ${toInlineJson(assetVersion)};</script>`
  ].join("\n  ");
  if (html.includes("</head>")) {
    return html.replace("</head>", `  ${content}\n</head>`);
  }
  return `${content}\n${html}`;
}

function withDevLiveReload(html) {
  if (!IS_DEV_LIVE_RELOAD_ENABLED) {
    return html;
  }

  const script = `
  <script>
    (() => {
      const source = new EventSource("${DEV_LIVE_RELOAD_PATHNAME}");
      let reloadTimer = null;
      source.onmessage = () => {
        if (reloadTimer) {
          window.clearTimeout(reloadTimer);
        }
        reloadTimer = window.setTimeout(() => {
          window.location.reload();
        }, 80);
      };
    })();
  </script>`;
  return appendHtmlBeforeBody(html, script);
}

function removeDevLiveReloadClient(res) {
  devLiveReloadClients.delete(res);
  if (!devLiveReloadClients.size && devLiveReloadHeartbeat) {
    clearInterval(devLiveReloadHeartbeat);
    devLiveReloadHeartbeat = null;
  }
}

function removeForceRefreshClient(client) {
  forceRefreshClients.delete(client);
  if (!forceRefreshClients.size && forceRefreshHeartbeat) {
    clearInterval(forceRefreshHeartbeat);
    forceRefreshHeartbeat = null;
  }
}

function startDevLiveReloadHeartbeat() {
  if (devLiveReloadHeartbeat || !devLiveReloadClients.size) {
    return;
  }

  devLiveReloadHeartbeat = setInterval(() => {
    if (!devLiveReloadClients.size) {
      clearInterval(devLiveReloadHeartbeat);
      devLiveReloadHeartbeat = null;
      return;
    }

    for (const client of [...devLiveReloadClients]) {
      try {
        client.write(": ping\n\n");
      } catch {
        removeDevLiveReloadClient(client);
      }
    }
  }, 15000);
}

function startForceRefreshHeartbeat() {
  if (forceRefreshHeartbeat || !forceRefreshClients.size) {
    return;
  }

  forceRefreshHeartbeat = setInterval(() => {
    if (!forceRefreshClients.size) {
      clearInterval(forceRefreshHeartbeat);
      forceRefreshHeartbeat = null;
      return;
    }

    for (const client of [...forceRefreshClients]) {
      try {
        client.res.write(": ping\n\n");
      } catch {
        removeForceRefreshClient(client);
      }
    }
  }, 15000);
}

function broadcastDevLiveReload(payload) {
  if (!devLiveReloadClients.size) {
    return;
  }

  const body = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of [...devLiveReloadClients]) {
    try {
      client.write(body);
    } catch {
      removeDevLiveReloadClient(client);
    }
  }
}

function broadcastForceRefresh(payload = {}) {
  if (!forceRefreshClients.size) {
    return 0;
  }

  const body = [
    "event: force-refresh",
    `data: ${JSON.stringify(payload)}`,
    "",
    ""
  ].join("\n");
  let deliveredCount = 0;
  for (const client of [...forceRefreshClients]) {
    try {
      client.res.write(body);
      deliveredCount += 1;
    } catch {
      removeForceRefreshClient(client);
    }
  }
  return deliveredCount;
}

function scheduleDevLiveReload(changedPath) {
  if (!IS_DEV_LIVE_RELOAD_ENABLED) {
    return;
  }

  if (devLiveReloadDebounceTimer) {
    clearTimeout(devLiveReloadDebounceTimer);
  }

  devLiveReloadDebounceTimer = setTimeout(() => {
    devLiveReloadDebounceTimer = null;
    const relativePath = changedPath ? path.relative(ROOT_DIR, changedPath) : "";
    broadcastDevLiveReload({
      path: relativePath,
      time: getCurrentBeijingDateTime()
    });
  }, 120);
}

function isDevLiveReloadSource(relativePath) {
  const normalizedPath = String(relativePath || "").split(path.sep).join("/");
  return normalizedPath === "派单结算录入.html"
    || normalizedPath === "派单结算录入电脑版.html"
    || normalizedPath === "派单结算录入手机版.html"
    || normalizedPath.startsWith("public/");
}

function createDevWatcher(targetPath, options, onChange) {
  const watcher = nativeFs.watch(targetPath, options, (_eventType, fileName) => {
    onChange(fileName);
  });
  watcher.on("error", (error) => {
    const line = `[dev-live-reload] watch error ${targetPath}: ${error.message}`;
    console.error(line);
    appendServerLogLine(line);
  });
  return watcher;
}

function startDevWatchers() {
  if (!IS_DEV_LIVE_RELOAD_ENABLED || devWatchersStarted) {
    return;
  }

  try {
    createDevWatcher(ROOT_DIR, { recursive: true }, (fileName) => {
      if (!isDevLiveReloadSource(fileName)) {
        return;
      }
      const changedPath = typeof fileName === "string" && fileName ? path.join(ROOT_DIR, fileName) : ROOT_DIR;
      scheduleDevLiveReload(changedPath);
    });
  } catch (error) {
    createDevWatcher(SOURCE_HTML_FILE, {}, () => {
      scheduleDevLiveReload(SOURCE_HTML_FILE);
    });
    createDevWatcher(SOURCE_DESKTOP_HTML_FILE, {}, () => {
      scheduleDevLiveReload(SOURCE_DESKTOP_HTML_FILE);
    });
    createDevWatcher(SOURCE_PUBLIC_DIR, { recursive: true }, (fileName) => {
      const changedPath = typeof fileName === "string" && fileName
        ? path.join(SOURCE_PUBLIC_DIR, fileName)
        : SOURCE_PUBLIC_DIR;
      scheduleDevLiveReload(changedPath);
    });
    const fallbackLine = `[dev-live-reload] fallback watcher enabled: ${error.message}`;
    console.warn(fallbackLine);
    appendServerLogLine(fallbackLine);
  }

  devWatchersStarted = true;
  const line = `[dev-live-reload] watching ${SOURCE_HTML_FILE} and ${SOURCE_PUBLIC_DIR}`;
  console.log(line);
  appendServerLogLine(line);
}

function serveDevLiveReloadStream(req, res) {
  if (!IS_DEV_LIVE_RELOAD_ENABLED) {
    sendText(res, 404, "Not Found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive"
  });
  res.write("retry: 500\n\n");
  devLiveReloadClients.add(res);
  startDevLiveReloadHeartbeat();
  req.on("close", () => {
    removeDevLiveReloadClient(res);
  });
}

async function serveForceRefreshEventStream(req, res) {
  const host = req.headers.host || `127.0.0.1:${PORT}`;
  const url = new URL(req.url || FORCE_REFRESH_EVENTS_PATHNAME, `http://${host}`);
  const session = await resolveAuthSessionByLoginAccount(url.searchParams.get("account"));
  if (!session) {
    sendJson(res, 401, { error: "未登录或登录已失效" });
    return;
  }

  if (session.role !== "accountant") {
    sendJson(res, 403, { error: "仅会计账号可订阅强制刷新" });
    return;
  }

  setApiCorsHeaders(res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive"
  });
  res.write("retry: 1000\n\n");
  const client = {
    res,
    session
  };
  forceRefreshClients.add(client);
  startForceRefreshHeartbeat();
  req.on("close", () => {
    removeForceRefreshClient(client);
  });
}

async function serveForceRefreshTrigger(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  const session = await requireAuthSession(req, res, ["boss"]);
  if (!session) return;

  const payload = {
    triggeredAt: getCurrentBeijingDateTime(),
    triggeredBy: session.account,
    targetRole: "accountant"
  };
  const deliveredCount = broadcastForceRefresh(payload);
  sendJson(res, 200, {
    ok: true,
    deliveredCount,
    payload
  });
}

async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(FEEDBACK_IMAGE_DIR, { recursive: true });
  await fs.mkdir(INVOICE_IMAGE_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]\n", "utf8");
  }
  try {
    await fs.access(RECYCLE_BIN_FILE);
  } catch {
    await fs.writeFile(RECYCLE_BIN_FILE, "[]\n", "utf8");
  }
  try {
    await fs.access(ACCOUNTANTS_FILE);
  } catch {
    await fs.writeFile(ACCOUNTANTS_FILE, "[]\n", "utf8");
  }
  try {
    await fs.access(DISPATCHER_PASSWORDS_FILE);
  } catch {
    await fs.writeFile(DISPATCHER_PASSWORDS_FILE, `${JSON.stringify(getDefaultDispatcherPasswords(), null, 2)}\n`, "utf8");
  }
  try {
    await fs.access(ACCOUNTANT_OPERATION_LOG_FILE);
  } catch {
    await fs.writeFile(ACCOUNTANT_OPERATION_LOG_FILE, "[]\n", "utf8");
  }
  try {
    await fs.access(REMINDERS_FILE);
  } catch {
    await fs.writeFile(REMINDERS_FILE, "[]\n", "utf8");
  }
}

async function readRecords() {
  const parsed = await readJsonFile(DATA_FILE, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function readRecycleBin() {
  const parsed = await readJsonFile(RECYCLE_BIN_FILE, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function readAccountants() {
  const parsed = await readJsonFile(ACCOUNTANTS_FILE, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function readDispatcherPasswords() {
  const parsed = await readJsonFile(DISPATCHER_PASSWORDS_FILE, {});
  return normalizeDispatcherPasswords(parsed);
}

async function readDispatcherAccountantMappings() {
  const parsed = await readJsonFile(DISPATCHER_PASSWORDS_FILE, {});
  return normalizeDispatcherAccountantMappings(parsed);
}

function normalizeDispatcherFullConfig(rawConfig) {
  if (!rawConfig) {
    return null;
  }
  if (typeof rawConfig === "string") {
    return {
      password: normalizeDispatcherPassword(rawConfig),
      linkedAccountantPhone: null
    };
  }
  if (typeof rawConfig === "object") {
    const password = normalizeDispatcherPassword(rawConfig.password);
    const linkedAccountantPhone = normalizeDispatcherAccountantPhone(rawConfig);
    return {
      password: password || DISPATCHER_LOGIN_PASSWORD,
      linkedAccountantPhone
    };
  }
  return null;
}

function normalizeDispatcherFullConfigs(rawConfigs) {
  const normalized = {};
  const source = rawConfigs && typeof rawConfigs === "object" ? rawConfigs : {};
  DISPATCHER_ACCOUNT_LIST.forEach((account) => {
    const rawConfig = source[account];
    const config = normalizeDispatcherFullConfig(rawConfig);
    if (config) {
      normalized[account] = config;
    }
  });
  return normalized;
}

async function readDispatcherFullConfigs() {
  const parsed = await readJsonFile(DISPATCHER_PASSWORDS_FILE, {});
  return normalizeDispatcherFullConfigs(parsed);
}

async function readAccountantOperationLogs() {
  const parsed = await readJsonFile(ACCOUNTANT_OPERATION_LOG_FILE, []);
  return Array.isArray(parsed) ? parsed.map((entry) => normalizeAccountantOperationLogEntry(entry)).filter(Boolean) : [];
}

function normalizeReminderDate(value) {
  const text = normalizeText(value, 24);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return text;
}

function normalizeReminderEntry(rawEntry) {
  const source = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
  const reminderDate = normalizeReminderDate(source.date || source.reminderDate);
  const orderNo = normalizeText(source.orderNo, 80);
  const customerWechat = normalizeText(source.customerWechat, 80);
  if (!reminderDate || !orderNo || !customerWechat) return null;
  return {
    id: normalizeText(source.id, 80) || generateId("rem"),
    date: reminderDate,
    orderNo,
    customerWechat,
    createdAt: normalizeText(source.createdAt, 32) || getCurrentBeijingDateTime(),
    createdBy: normalizeText(source.createdBy, 48),
    createdRole: normalizeLoginRole(source.createdRole)
  };
}

async function readReminders() {
  const parsed = await readJsonFile(REMINDERS_FILE, []);
  return Array.isArray(parsed) ? parsed.map((entry) => normalizeReminderEntry(entry)).filter(Boolean) : [];
}

async function readJsonFile(filePath, fallbackValue) {
  await ensureStorage();
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw || JSON.stringify(fallbackValue));
}

async function writeJsonFileAtomic(filePath, value) {
  await ensureStorage();
  const tempFile = `${filePath}.tmp`;
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(tempFile, payload, "utf8");
  await fs.rename(tempFile, filePath);
}

async function writeRecords(records) {
  await writeJsonFileAtomic(DATA_FILE, records);
}

async function writeRecycleBin(recycleBinRecords) {
  await writeJsonFileAtomic(RECYCLE_BIN_FILE, recycleBinRecords);
}

async function writeAccountants(accountants) {
  await writeJsonFileAtomic(ACCOUNTANTS_FILE, accountants);
}

async function writeDispatcherPasswords(passwords) {
  await ensureStorage();
  const existingFullConfigs = await readDispatcherFullConfigs();
  const mergedConfigs = {};
  DISPATCHER_ACCOUNT_LIST.forEach((account) => {
    const existingConfig = existingFullConfigs[account];
    const newPassword = passwords?.[account];
    if (newPassword && typeof newPassword === "object") {
      const normalized = normalizeDispatcherFullConfig(newPassword);
      if (normalized) {
        mergedConfigs[account] = normalized;
        return;
      }
    }
    if (typeof newPassword === "string" && newPassword) {
      mergedConfigs[account] = {
        password: normalizeDispatcherPassword(newPassword),
        linkedAccountantPhone: existingConfig?.linkedAccountantPhone || null
      };
      return;
    }
    if (existingConfig) {
      mergedConfigs[account] = existingConfig;
    } else {
      mergedConfigs[account] = {
        password: DISPATCHER_LOGIN_PASSWORD,
        linkedAccountantPhone: null
      };
    }
  });
  await writeJsonFileAtomic(DISPATCHER_PASSWORDS_FILE, mergedConfigs);
}

async function writeAccountantOperationLogs(logs) {
  await writeJsonFileAtomic(ACCOUNTANT_OPERATION_LOG_FILE, logs);
}

async function writeReminders(reminders) {
  await writeJsonFileAtomic(REMINDERS_FILE, reminders);
}

function withWriteLock(task) {
  const next = writeQueue.then(task, task);
  writeQueue = next.catch(() => {});
  return next;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > API_JSON_BODY_MAX_SIZE_BYTES) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("JSON 格式错误"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeText(value, maxLength = 200) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeDispatcherPassword(value) {
  if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "password")) {
    return normalizeText(value.password, 200);
  }
  return normalizeText(value, 200);
}

function normalizeDispatcherAccountantPhone(value) {
  if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "linkedAccountantPhone")) {
    return normalizeText(value.linkedAccountantPhone, 48) || null;
  }
  return null;
}

function getDefaultDispatcherPasswords() {
  return DISPATCHER_ACCOUNT_LIST.reduce((result, account) => {
    result[account] = DISPATCHER_LOGIN_PASSWORD;
    return result;
  }, {});
}

function getDefaultDispatcherAccountantMappings() {
  return DISPATCHER_ACCOUNT_LIST.reduce((result, account) => {
    result[account] = null;
    return result;
  }, {});
}

function normalizeDispatcherPasswords(rawPasswords) {
  const normalized = getDefaultDispatcherPasswords();
  const source = rawPasswords && typeof rawPasswords === "object" ? rawPasswords : {};
  Object.entries(source).forEach(([rawAccount, rawPassword]) => {
    const account = normalizeText(rawAccount, 16).toLowerCase();
    if (!DISPATCHER_ACCOUNTS.has(account)) return;
    const password = normalizeDispatcherPassword(rawPassword);
    if (!password) return;
    normalized[account] = password;
  });
  return normalized;
}

function normalizeDispatcherAccountantMappings(rawPasswords) {
  const normalized = getDefaultDispatcherAccountantMappings();
  const source = rawPasswords && typeof rawPasswords === "object" ? rawPasswords : {};
  Object.entries(source).forEach(([rawAccount, rawConfig]) => {
    const account = normalizeText(rawAccount, 16).toLowerCase();
    if (!DISPATCHER_ACCOUNTS.has(account)) return;
    const linkedAccountantPhone = normalizeDispatcherAccountantPhone(rawConfig);
    if (linkedAccountantPhone) {
      normalized[account] = linkedAccountantPhone;
    }
  });
  return normalized;
}

function padDateNumber(value) {
  return String(Math.trunc(Number(value) || 0)).padStart(2, "0");
}

function getBeijingDateTimeParts(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const parts = {};
  BEIJING_DATE_TIME_FORMATTER.formatToParts(date).forEach(({ type, value }) => {
    if (type !== "literal") {
      parts[type] = value;
    }
  });
  return parts.year && parts.month && parts.day && parts.hour && parts.minute && parts.second
    ? parts
    : null;
}

function formatBeijingDateTime(dateInput = new Date()) {
  const parts = getBeijingDateTimeParts(dateInput);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function formatBeijingDate(dateInput = new Date()) {
  const parts = getBeijingDateTimeParts(dateInput);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getCurrentBeijingDateTime() {
  return formatBeijingDateTime(new Date());
}

function getCurrentBeijingDate() {
  return formatBeijingDate(new Date());
}

function parseStructuredDateTimeValue(rawValue) {
  const source = normalizeText(rawValue, 64);
  if (!source) return null;
  const match = source.match(STRUCTURED_DATE_TIME_PATTERN);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = typeof match[4] === "undefined" ? 0 : Number(match[4]);
  const minute = typeof match[5] === "undefined" ? 0 : Number(match[5]);
  const second = typeof match[6] === "undefined" ? 0 : Number(match[6]);
  const formattedDate = `${String(year).padStart(4, "0")}-${padDateNumber(month)}-${padDateNumber(day)}`;
  const formattedDateTime = `${formattedDate} ${padDateNumber(hour)}:${padDateNumber(minute)}:${padDateNumber(second)}`;
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second));
  if (formatBeijingDateTime(utcDate) !== formattedDateTime) return null;
  return {
    hasTime: typeof match[4] !== "undefined",
    formattedDate,
    formattedDateTime,
    date: utcDate
  };
}

function normalizeDateTimeValue(value) {
  const source = normalizeText(value, 64);
  if (!source) return "";
  const structured = parseStructuredDateTimeValue(source);
  if (structured) {
    return structured.hasTime ? structured.formattedDateTime : `${structured.formattedDate} 00:00:00`;
  }
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return "";
  return formatBeijingDateTime(date);
}

function getFeedbackImageUrl(fileName) {
  const normalizedFileName = normalizeText(fileName, 180);
  if (!normalizedFileName) return "";
  return `${FEEDBACK_IMAGE_URL_PREFIX}${encodeURIComponent(normalizedFileName)}`;
}

function getInvoiceImageUrl(fileName) {
  const normalizedFileName = normalizeText(fileName, 180);
  if (!normalizedFileName) return "";
  return `${INVOICE_IMAGE_URL_PREFIX}${encodeURIComponent(normalizedFileName)}`;
}

function normalizeStoredFeedbackImage(rawImage) {
  if (!rawImage || typeof rawImage !== "object") return null;
  const fileName = normalizeText(rawImage.fileName, 180);
  if (!fileName) return null;
  return {
    id: normalizeText(rawImage.id, 80) || generateId("img"),
    name: normalizeText(rawImage.name, 120) || fileName,
    fileName,
    url: getFeedbackImageUrl(fileName)
  };
}

function normalizeStoredFeedbackImages(rawImages) {
  const source = Array.isArray(rawImages) ? rawImages : [];
  const seen = new Set();
  return source
    .map((item) => normalizeStoredFeedbackImage(item))
    .filter((item) => {
      if (!item) return false;
      if (seen.has(item.fileName)) return false;
      seen.add(item.fileName);
      return true;
    })
    .slice(0, FEEDBACK_IMAGE_MAX_COUNT);
}

function normalizeMoneyValue(value) {
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === "string" && value.trim() === "") return Number.NaN;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

function normalizeOptionalMoneyField(value) {
  const amount = normalizeMoneyValue(value);
  return Number.isFinite(amount) ? amount : "";
}

function normalizeStateFlag(value, extraTruthyValues = null) {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "number") return value === 1;
  const normalized = normalizeText(value, 32).toLowerCase();
  return TRUTHY_STATE_TEXT_VALUES.has(normalized)
    || Boolean(extraTruthyValues?.has(normalized));
}

function normalizeRecordSettlementState(value) {
  return normalizeStateFlag(value, SETTLED_WORKFLOW_STATE_VALUES);
}

function normalizeMonthlySettlementState(value) {
  return normalizeStateFlag(value, MONTHLY_SETTLEMENT_STATE_VALUES);
}

function getNormalizedRecordSettlementFields(record) {
  const source = record && typeof record === "object" ? record : {};
  const isSettled = normalizeRecordSettlementState(source.isSettled);
  return {
    isSettled,
    settledAt: isSettled ? normalizeDateTimeValue(source.settledAt) : "",
    settledBy: isSettled ? normalizeText(source.settledBy, 48) : ""
  };
}

function normalizeRecordSettlementPaidState(value) {
  return normalizeStateFlag(value, PAID_WORKFLOW_STATE_VALUES);
}

function getNormalizedRecordSettlementPaymentFields(record) {
  const source = record && typeof record === "object" ? record : {};
  const isSettlementPaid = normalizeRecordSettlementPaidState(
    Object.prototype.hasOwnProperty.call(source, "isSettlementPaid")
      ? source.isSettlementPaid
      : source.settlementPaid
  );
  return {
    isSettlementPaid,
    settlementPaidAt: isSettlementPaid ? normalizeDateTimeValue(source.settlementPaidAt) : "",
    settlementPaidBy: isSettlementPaid ? normalizeText(source.settlementPaidBy, 48) : ""
  };
}

function getNormalizedRecordDispatcherSettlementPaymentFields(record) {
  const source = record && typeof record === "object" ? record : {};
  const isDispatcherSettlementPaid = normalizeRecordSettlementPaidState(
    Object.prototype.hasOwnProperty.call(source, "isDispatcherSettlementPaid")
      ? source.isDispatcherSettlementPaid
      : source.dispatcherSettlementPaid
  );
  return {
    isDispatcherSettlementPaid,
    dispatcherSettlementPaidAt: isDispatcherSettlementPaid ? normalizeDateTimeValue(source.dispatcherSettlementPaidAt) : "",
    dispatcherSettlementPaidBy: isDispatcherSettlementPaid ? normalizeText(source.dispatcherSettlementPaidBy, 48) : ""
  };
}

function buildReturnedPriceSnapshot(currentRecord, rawSnapshot) {
  const current = currentRecord && typeof currentRecord === "object" ? currentRecord : {};
  const source = rawSnapshot && typeof rawSnapshot === "object" ? rawSnapshot : {};
  const currentSnapshot = current.returnedPriceSnapshot && typeof current.returnedPriceSnapshot === "object"
    ? current.returnedPriceSnapshot
    : {};
  const isCurrentReturned = normalizeText(current.checkStatus, 24).toLowerCase() === "returned";
  const paymentPrice = normalizeMoneyValue(
    isCurrentReturned && Object.prototype.hasOwnProperty.call(currentSnapshot, "paymentPrice")
      ? currentSnapshot.paymentPrice
      : (Object.prototype.hasOwnProperty.call(source, "paymentPrice")
      ? source.paymentPrice
      : (Object.prototype.hasOwnProperty.call(currentSnapshot, "paymentPrice")
          ? currentSnapshot.paymentPrice
          : current.paymentPrice))
  );
  const totalPrice = normalizeMoneyValue(
    isCurrentReturned && Object.prototype.hasOwnProperty.call(currentSnapshot, "totalPrice")
      ? currentSnapshot.totalPrice
      : (Object.prototype.hasOwnProperty.call(source, "totalPrice")
      ? source.totalPrice
      : (Object.prototype.hasOwnProperty.call(currentSnapshot, "totalPrice")
          ? currentSnapshot.totalPrice
          : current.totalPrice))
  );
  const settlementPrice = normalizeMoneyValue(
    isCurrentReturned && Object.prototype.hasOwnProperty.call(currentSnapshot, "settlementPrice")
      ? currentSnapshot.settlementPrice
      : (Object.prototype.hasOwnProperty.call(source, "settlementPrice")
      ? source.settlementPrice
      : (Object.prototype.hasOwnProperty.call(currentSnapshot, "settlementPrice")
          ? currentSnapshot.settlementPrice
          : current.settlementPrice))
  );
  const premiumInput = isCurrentReturned && Object.prototype.hasOwnProperty.call(currentSnapshot, "premiumPrice")
    ? currentSnapshot.premiumPrice
    : (Object.prototype.hasOwnProperty.call(source, "premiumPrice")
        ? source.premiumPrice
        : currentSnapshot.premiumPrice);
  const premiumCandidate = normalizeMoneyValue(premiumInput);
  const premiumPrice = Number.isFinite(premiumCandidate)
    ? premiumCandidate
    : (Number.isFinite(paymentPrice) && Number.isFinite(totalPrice) ? paymentPrice - totalPrice : Number.NaN);

  if (!Number.isFinite(paymentPrice) || !Number.isFinite(totalPrice) || !Number.isFinite(settlementPrice) || !Number.isFinite(premiumPrice)) {
    return null;
  }

  return {
    paymentPrice,
    totalPrice,
    premiumPrice,
    settlementPrice
  };
}

function parseFeedbackImageDataUrl(dataUrl) {
  const source = typeof dataUrl === "string" ? dataUrl.trim() : "";
  const match = source.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    throw new Error("截图格式无效，请重新上传。");
  }
  return {
    mimeType: String(match[1] || "").toLowerCase(),
    buffer: Buffer.from(String(match[2] || "").replace(/\s+/g, ""), "base64")
  };
}

function getFeedbackImageExtension(mimeType, originalName) {
  const normalizedMimeType = String(mimeType || "").trim().toLowerCase();
  const originalExtension = String(path.extname(String(originalName || "")).toLowerCase() || "").replace(/^\./, "");
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(originalExtension)) {
    return originalExtension;
  }
  if (normalizedMimeType === "image/png") return "png";
  if (normalizedMimeType === "image/jpeg") return "jpg";
  if (normalizedMimeType === "image/webp") return "webp";
  if (normalizedMimeType === "image/gif") return "gif";
  return "png";
}

async function deleteFeedbackImageFiles(rawImages) {
  const images = normalizeStoredFeedbackImages(rawImages);
  await Promise.all(images.map(async (item) => {
    const filePath = path.resolve(FEEDBACK_IMAGE_DIR, item.fileName);
    if (!isPathInDirectory(filePath, FEEDBACK_IMAGE_DIR)) return;
    try {
      await fs.unlink(filePath);
    } catch {}
  }));
}

async function resolveFeedbackImagesForUpdate(previousRawImages, incomingRawImages, recordId) {
  const previousImages = normalizeStoredFeedbackImages(previousRawImages);
  const previousImageByFileName = new Map(previousImages.map((item) => [item.fileName, item]));
  const incomingImages = Array.isArray(incomingRawImages) ? incomingRawImages.slice(0, FEEDBACK_IMAGE_MAX_COUNT) : [];
  const nextImages = [];
  const keptFileNames = new Set();

  for (let index = 0; index < incomingImages.length; index += 1) {
    const rawItem = incomingImages[index];
    if (rawItem && typeof rawItem === "object") {
      const existingFileName = normalizeText(rawItem.fileName, 180);
      if (existingFileName && previousImageByFileName.has(existingFileName)) {
        const previousImage = previousImageByFileName.get(existingFileName);
        keptFileNames.add(existingFileName);
        nextImages.push({
          ...previousImage,
          name: normalizeText(rawItem.name, 120) || previousImage.name
        });
        continue;
      }
    }

    const dataUrl = typeof rawItem === "string"
      ? rawItem.trim()
      : String(rawItem?.dataUrl || "").trim();
    if (!dataUrl) continue;
    const { mimeType, buffer } = parseFeedbackImageDataUrl(dataUrl);
    if (!buffer.length) {
      throw new Error("截图内容为空，请重新上传。");
    }
    if (buffer.length > FEEDBACK_IMAGE_MAX_SIZE_BYTES) {
      throw new Error("单张截图不能超过 5MB。");
    }

    const extension = getFeedbackImageExtension(mimeType, rawItem?.name);
    const fileName = `${recordId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_${index + 1}.${extension}`;
    const filePath = path.resolve(FEEDBACK_IMAGE_DIR, fileName);
    await fs.writeFile(filePath, buffer);
    keptFileNames.add(fileName);
    nextImages.push({
      id: generateId("img"),
      name: normalizeText(rawItem?.name, 120) || `截图${index + 1}.${extension}`,
      fileName,
      url: getFeedbackImageUrl(fileName)
    });
  }

  const imagesToDelete = previousImages.filter((item) => !keptFileNames.has(item.fileName));
  await deleteFeedbackImageFiles(imagesToDelete);
  return nextImages;
}

function normalizeAccountantDisplayName(value) {
  return normalizeText(value, 48);
}

function isNonSettlementAccountantName(value) {
  return normalizeAccountantDisplayName(value) === NON_SETTLEMENT_ACCOUNTANT_NAME;
}

function isBuiltInAccountantName(value) {
  const normalizedName = normalizeAccountantDisplayName(value);
  return BUILT_IN_ACCOUNTANT_NAMES.includes(normalizedName);
}

function shouldAutoCompleteAccountantRecord(value) {
  return isBuiltInAccountantName(value);
}

function applyBuiltInAccountantCompletion(record, completedAt = getCurrentBeijingDateTime()) {
  const source = record && typeof record === "object" ? record : {};
  if (!shouldAutoCompleteAccountantRecord(source.accountant)) return source;
  return {
    ...source,
    checkStatus: "completed",
    checkedAt: "",
    checkedBy: "",
    completedAt: normalizeDateTimeValue(source.completedAt) || completedAt,
    completedBy: normalizeText(source.completedBy, 48) || "系统",
    returnedAt: "",
    returnedBy: ""
  };
}

function normalizeAccountantUsername(value) {
  return normalizeText(value, 64);
}

function normalizeStoredInvoiceImage(rawImage) {
  if (!rawImage || typeof rawImage !== "object") return null;
  const fileName = normalizeText(rawImage.fileName, 180);
  if (!fileName) return null;
  return {
    id: normalizeText(rawImage.id, 80) || generateId("inv"),
    name: normalizeText(rawImage.name, 120) || fileName,
    fileName,
    url: getInvoiceImageUrl(fileName)
  };
}

function getNormalizedRecordInvoiceFields(record) {
  const source = record && typeof record === "object" ? record : {};
  const image = normalizeStoredInvoiceImage(source.settlementInvoiceImage || source.invoiceImage);
  const info = normalizeInvoiceRecipientInfo(source.invoiceRecipientInfo || source);
  return {
    settlementInvoiceImage: image,
    invoiceUploadedAt: image ? normalizeDateTimeValue(source.invoiceUploadedAt || source.settlementInvoiceUploadedAt) : "",
    invoiceUploadedBy: image ? normalizeText(source.invoiceUploadedBy || source.settlementInvoiceUploadedBy, 48) : "",
    invoiceUploadedByUsername: image
      ? normalizeAccountantUsername(source.invoiceUploadedByUsername || source.settlementInvoiceUploadedByUsername)
      : "",
    invoiceRecipientInfo: image ? info : null,
    invoiceRecipientName: image ? info.name : "",
    invoiceRecipientBankName: image ? info.bankName : "",
    invoiceRecipientBankCardNo: image ? info.bankCardNo : "",
    invoiceRecipientIdCardNo: image ? info.idCardNo : "",
    invoiceRecipientDeclarationPhone: image ? info.declarationPhone : ""
  };
}

function getNormalizedRecordDispatcherInvoiceFields(record) {
  const source = record && typeof record === "object" ? record : {};
  const image = normalizeStoredInvoiceImage(source.dispatcherSettlementInvoiceImage || source.dispatcherInvoiceImage);
  const info = normalizeInvoiceRecipientInfo(source.dispatcherInvoiceRecipientInfo || source);
  return {
    dispatcherSettlementInvoiceImage: image,
    dispatcherInvoiceUploadedAt: image ? normalizeDateTimeValue(source.dispatcherInvoiceUploadedAt || source.dispatcherSettlementInvoiceUploadedAt) : "",
    dispatcherInvoiceUploadedBy: image ? normalizeText(source.dispatcherInvoiceUploadedBy || source.dispatcherSettlementInvoiceUploadedBy, 48) : "",
    dispatcherInvoiceUploadedByUsername: image
      ? normalizeAccountantUsername(source.dispatcherInvoiceUploadedByUsername || source.dispatcherSettlementInvoiceUploadedByUsername)
      : "",
    dispatcherInvoiceRecipientInfo: image ? info : null,
    dispatcherInvoiceRecipientName: image ? info.name : "",
    dispatcherInvoiceRecipientBankName: image ? info.bankName : "",
    dispatcherInvoiceRecipientBankCardNo: image ? info.bankCardNo : "",
    dispatcherInvoiceRecipientIdCardNo: image ? info.idCardNo : "",
    dispatcherInvoiceRecipientDeclarationPhone: image ? info.declarationPhone : ""
  };
}

function normalizeInvoiceRecipientInfo(input) {
  const source = input && typeof input === "object" ? input : {};
  const info = {
    name: normalizeText(source.name || source.invoiceRecipientName, 48),
    bankName: normalizeText(source.bankName || source.bank || source.invoiceRecipientBankName, 120),
    bankCardNo: normalizeText(source.bankCardNo || source.bankCard || source.cardNo || source.invoiceRecipientBankCardNo, 40),
    idCardNo: normalizeText(source.idCardNo || source.idCard || source.identityNo || source.invoiceRecipientIdCardNo, 24),
    declarationPhone: normalizeText(source.declarationPhone || source.phone || source.invoiceRecipientDeclarationPhone, 24)
  };
  return info;
}

function validateInvoiceRecipientInfo(input) {
  const info = normalizeInvoiceRecipientInfo(input);
  if (!info.name) throw new Error("请输入姓名。");
  if (!info.bankName) throw new Error("请输入开户行。");
  if (!info.bankCardNo) throw new Error("请输入银行卡号。");
  if (!info.idCardNo) throw new Error("请输入身份证号。");
  if (!info.declarationPhone) throw new Error("请输入申报手机号。");
  return info;
}

async function saveSettlementInvoiceImage(rawImage, accountantUsername) {
  const source = rawImage && typeof rawImage === "object" ? rawImage : {};
  const dataUrl = typeof rawImage === "string"
    ? rawImage.trim()
    : String(source.dataUrl || "").trim();
  if (!dataUrl) {
    throw new Error("请选择发票图片。");
  }

  const { mimeType, buffer } = parseFeedbackImageDataUrl(dataUrl);
  if (!buffer.length) {
    throw new Error("发票图片内容为空，请重新上传。");
  }
  if (buffer.length > SETTLEMENT_INVOICE_IMAGE_MAX_SIZE_BYTES) {
    throw new Error("发票图片不能超过 5MB。");
  }

  await ensureStorage();
  const extension = getFeedbackImageExtension(mimeType, source.name);
  const safeAccountant = normalizeAccountantUsername(accountantUsername)
    .replace(/[^a-z0-9_-]+/gi, "_")
    .slice(0, 48) || "accountant";
  const fileName = `invoice_${safeAccountant}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const filePath = path.resolve(INVOICE_IMAGE_DIR, fileName);
  await fs.writeFile(filePath, buffer);
  return {
    id: generateId("inv"),
    name: normalizeText(source.name, 120) || `发票.${extension}`,
    fileName,
    url: getInvoiceImageUrl(fileName)
  };
}

function normalizeAccountantAlias(value) {
  return normalizeAccountantDisplayName(value);
}

function normalizeAccountantRealName(value) {
  return normalizeText(value, 48);
}

function normalizeAccountantPhone(value) {
  return normalizeText(value, 32);
}

function resolveAccountantProfileDisplayName(raw) {
  if (!raw || typeof raw !== "object") return "";
  return normalizeAccountantDisplayName(
    raw.displayName
      || raw.alias
      || raw.nickname
      || raw.chineseName
      || raw.cnName
      || raw.name
      || raw.phone
      || raw.mobile
      || raw.mobilePhone
      || raw.username
  );
}

function isReservedAccountantUsername(username) {
  return isBossAccount(username) || isDispatcherAccount(username);
}

function ensureAccountantUsernameAvailable(username, savedAccountants) {
  if (isBuiltInAccountantName(username)) {
    throw new Error("账号已被系统占用");
  }
  if (isReservedAccountantUsername(username)) {
    throw new Error("账号已被系统占用");
  }
  if (savedAccountants.some((item) => normalizeAccountantUsername(item.username) === username)) {
    throw new Error("账号已存在");
  }
}

function ensureAccountantDisplayNameAvailable(displayName, savedAccountants, errorMessage = "微信名已存在") {
  if (!displayName) {
    throw new Error(errorMessage);
  }
  if (isBuiltInAccountantName(displayName)) {
    throw new Error("微信名已被系统占用");
  }
  if (savedAccountants.some((item) => normalizeAccountantDisplayName(item.displayName) === displayName)) {
    throw new Error(errorMessage);
  }
}

function ensureAccountantPhoneAvailable(phone, savedAccountants, exceptUsername = "") {
  const normalizedPhone = normalizeAccountantPhone(phone);
  const normalizedExceptUsername = normalizeAccountantUsername(exceptUsername);
  if (!normalizedPhone) {
    throw new Error("手机号不能为空");
  }
  const normalizedPhoneAsUsername = normalizeAccountantUsername(normalizedPhone);
  if (savedAccountants.some((item) => {
    const itemUsername = normalizeAccountantUsername(item.username);
    if (normalizedExceptUsername && itemUsername === normalizedExceptUsername) {
      return false;
    }
    return (
      normalizeAccountantPhone(item.phone) === normalizedPhone
      || itemUsername === normalizedPhoneAsUsername
    );
  })) {
    throw new Error("手机号已存在");
  }
}

function findAccountantByLoginAccount(accountants, loginAccount) {
  const normalizedLoginAccount = normalizeText(loginAccount, 64);
  if (!normalizedLoginAccount) return null;
  const phoneMatch = accountants.find(
    (item) => normalizeAccountantPhone(item.phone) === normalizedLoginAccount
  );
  if (phoneMatch) {
    return phoneMatch;
  }
  const username = normalizeAccountantUsername(normalizedLoginAccount);
  return accountants.find(
    (item) => normalizeAccountantUsername(item.username || item.name) === username
  ) || null;
}

function resolveLoginAccountInput(rawValue) {
  const source = normalizeText(rawValue, 64);
  if (!source) return "";
  const lower = source.toLowerCase();
  if (BOSS_LOGIN_CODE_TO_ACCOUNT[lower]) {
    return BOSS_LOGIN_CODE_TO_ACCOUNT[lower];
  }
  if (DISPATCHER_LOGIN_CODE_TO_ACCOUNT[lower]) {
    return DISPATCHER_LOGIN_CODE_TO_ACCOUNT[lower];
  }
  return source;
}

function getBossLoginConfig(accountNameRaw) {
  const resolvedAccount = normalizeText(resolveLoginAccountInput(accountNameRaw) || accountNameRaw, 64);
  if (!resolvedAccount) return null;
  const normalizedAccount = resolvedAccount.toLowerCase();
  if (!BOSS_LOGIN_ACCOUNT_SET.has(normalizedAccount)) return null;
  return BOSS_LOGIN_ACCOUNTS.find((item) => item.account.toLowerCase() === normalizedAccount) || null;
}

function isDispatcherAccount(accountName) {
  const normalized = normalizeText(accountName, 16).toLowerCase();
  return DISPATCHER_ACCOUNTS.has(normalized);
}

function isBossAccount(accountName) {
  return Boolean(getBossLoginConfig(accountName));
}

function normalizeLoginRole(rawRole) {
  const role = normalizeText(rawRole, 24).toLowerCase();
  if (role === "dispatcher" || role === "accountant" || role === "boss") {
    return role;
  }
  return "";
}

function normalizeDispatcherTag(rawValue) {
  const source = normalizeText(rawValue, 48);
  if (!source) return "";
  const lower = source.toLowerCase();
  if (lower === "开心财税") return "开心财税";
  if (lower === "1旧" || lower.includes("财税1旧")) return "1旧";
  if (lower === "k旧" || lower.includes("财税k旧")) return "K旧";
  if (lower === "1" || lower.includes("财税1")) return "1";
  if (lower === "a" || lower.includes("财税a")) return "A";
  if (lower === "c" || lower.includes("财税c")) return "C";
  if (lower === "d" || lower.includes("财税d")) return "D";
  if (lower === "e" || lower.includes("财税e")) return "E";
  if (lower === "k" || lower.includes("财税k")) return "K";
  return "";
}

function getDispatcherTagForAccount(accountNameRaw) {
  const account = resolveLoginAccountInput(accountNameRaw);
  const lower = normalizeText(account, 16).toLowerCase();
  if (lower === "开心财税") return "开心财税";
  if (lower === "开心财税1旧" || lower === "1旧") return "1旧";
  if (lower === "开心财税k旧" || lower === "k旧") return "K旧";
  if (lower === "1") return "1";
  if (lower === "a") return "A";
  if (lower === "c") return "C";
  if (lower === "d") return "D";
  if (lower === "e") return "E";
  if (lower === "k") return "K";
  return "";
}

function getDispatcherAccountByTag(dispatcherTagRaw) {
  const dispatcherTag = normalizeDispatcherTag(dispatcherTagRaw);
  return DISPATCHER_ACCOUNT_LIST.find((account) => getDispatcherTagForAccount(account) === dispatcherTag) || "";
}

function getDispatcherDisplayNameByTag(dispatcherTagRaw) {
  const dispatcherTag = normalizeDispatcherTag(dispatcherTagRaw);
  if (dispatcherTag === "开心财税") return "开心财税";
  return dispatcherTag ? `开心财税${dispatcherTag.toLowerCase()}` : "";
}

function buildDispatcherManagementRows(records, dispatcherPasswords) {
  const orderCountByTag = Array.isArray(records)
    ? records.reduce((map, item) => {
      const dispatcherTag = normalizeDispatcherTag(item?.dispatcher);
      if (!dispatcherTag) return map;
      map.set(dispatcherTag, (map.get(dispatcherTag) || 0) + 1);
      return map;
    }, new Map())
    : new Map();
  const tagOrder = ["开心财税", "1", "A", "C", "D", "E", "K", "1旧", "K旧"];
  const rows = tagOrder.map((dispatcherTag) => {
    const accounts = DISPATCHER_ACCOUNT_LIST.filter((account) => getDispatcherTagForAccount(account) === dispatcherTag);
    const accountPasswordPairs = accounts.map((account) => ({
      account,
      password: normalizeDispatcherPassword(dispatcherPasswords?.[account]) || DISPATCHER_LOGIN_PASSWORD
    }));
    const uniquePasswords = Array.from(new Set(accountPasswordPairs.map((item) => item.password)));
    const accountLabel = accounts.join(" / ");
    const passwordLabel = uniquePasswords.length === 1
      ? uniquePasswords[0]
      : accountPasswordPairs.map((item) => `${item.account}:${item.password}`).join(" / ");
    return {
      dispatcherTag,
      displayName: getDispatcherDisplayNameByTag(dispatcherTag),
      accountLabel,
      passwordLabel,
      orderCount: orderCountByTag.get(dispatcherTag) || 0
    };
  });

  return rows.sort((left, right) => {
    const countDiff = Number(right.orderCount || 0) - Number(left.orderCount || 0);
    if (countDiff !== 0) return countDiff;
    return tagOrder.indexOf(left.dispatcherTag) - tagOrder.indexOf(right.dispatcherTag);
  });
}

async function buildDebugQuickLoginEntries() {
  const [dispatcherPasswords, dispatcherAccountantMappings, accountantResult] = await Promise.all([
    readDispatcherPasswords(),
    readDispatcherAccountantMappings(),
    withWriteLock(async () => loadAccountantsWithMigration())
  ]);
  const entries = [];
  const addEntry = (entry) => {
    const account = normalizeText(entry?.account, 64);
    const password = normalizeText(entry?.password, 200);
    const role = normalizeLoginRole(entry?.role);
    if (!account || !password || !role) return;
    entries.push({
      account,
      password,
      role,
      displayName: normalizeText(entry?.displayName, 64),
      alias: normalizeText(entry?.alias, 64)
    });
  };

  BOSS_LOGIN_ACCOUNTS.forEach((item) => {
    addEntry({
      account: item.account,
      password: item.password,
      role: "boss"
    });
  });

  DISPATCHER_ACCOUNT_LIST.forEach((account) => {
    addEntry({
      account,
      password: normalizeDispatcherPassword(dispatcherPasswords?.[account]) || DISPATCHER_LOGIN_PASSWORD,
      role: "dispatcher"
    });
  });

  const linkedAccountantPhoneOrder = new Map();
  DISPATCHER_ACCOUNT_LIST.forEach((account) => {
    const phone = normalizeAccountantPhone(dispatcherAccountantMappings?.[account]);
    if (phone && !linkedAccountantPhoneOrder.has(phone)) {
      linkedAccountantPhoneOrder.set(phone, linkedAccountantPhoneOrder.size);
    }
  });

  const sortedAccountants = [...accountantResult.accountants].sort((left, right) => {
    const leftPhone = normalizeAccountantPhone(left?.phone);
    const rightPhone = normalizeAccountantPhone(right?.phone);
    const leftOrder = linkedAccountantPhoneOrder.has(leftPhone) ? linkedAccountantPhoneOrder.get(leftPhone) : Number.POSITIVE_INFINITY;
    const rightOrder = linkedAccountantPhoneOrder.has(rightPhone) ? linkedAccountantPhoneOrder.get(rightPhone) : Number.POSITIVE_INFINITY;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return 0;
  });

  sortedAccountants.forEach((profile) => {
    addEntry({
      account: profile.phone || profile.username,
      password: normalizeAccountantLoginPassword(profile.loginPassword) || DEFAULT_ACCOUNTANT_LOGIN_PASSWORD,
      role: "accountant",
      displayName: profile.displayName || profile.name || profile.username,
      alias: profile.alias || ""
    });
  });

  return entries;
}

function buildScopedAccountantProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  return {
    username: profile.username,
    displayName: profile.displayName,
    name: profile.displayName,
    realName: profile.realName || "",
    phone: profile.phone || ""
  };
}

function decodeTransportLoginAccount(rawLoginAccount) {
  const source = normalizeText(rawLoginAccount, 256);
  if (!source) return "";
  try {
    return normalizeText(decodeURIComponent(source), 64);
  } catch {
    return normalizeText(source, 64);
  }
}

async function resolveAuthSessionByLoginAccount(rawLoginAccount) {
  const loginAccount = decodeTransportLoginAccount(rawLoginAccount);
  if (!loginAccount) return null;
  const resolvedAccount = resolveLoginAccountInput(loginAccount);
  const bossConfig = getBossLoginConfig(resolvedAccount);
  if (bossConfig) {
    return {
      loginAccount,
      account: bossConfig.account,
      role: "boss",
      displayName: "",
      profile: null
    };
  }
  if (isDispatcherAccount(resolvedAccount)) {
    return {
      loginAccount,
      account: resolvedAccount,
      role: "dispatcher",
      displayName: "",
      profile: null
    };
  }
  const accountants = await withWriteLock(async () => {
    const result = await loadAccountantsWithMigration();
    return result.accountants;
  });
  const profile = findAccountantByLoginAccount(accountants, loginAccount);
  if (!profile) return null;
  return {
    loginAccount,
    account: profile.username,
    role: "accountant",
    displayName: profile.displayName,
    profile: buildScopedAccountantProfile(profile)
  };
}

async function getAuthSessionFromRequest(req) {
  return resolveAuthSessionByLoginAccount(req.headers[AUTH_ACCOUNT_HEADER]);
}

function getSessionAccountantDisplayName(session) {
  return normalizeAccountantDisplayName(session?.displayName || session?.account);
}

function getSessionAccountantPhone(session) {
  return normalizeAccountantPhone(session?.profile?.phone);
}

function getDispatcherTagsLinkedToSessionAccountant(session, dispatcherAccountantMappings) {
  if (session?.role !== "accountant") return [];
  const phone = getSessionAccountantPhone(session);
  if (!phone) return [];
  return Object.entries(dispatcherAccountantMappings || {})
    .filter(([, mappedPhone]) => normalizeAccountantPhone(mappedPhone) === phone)
    .map(([account]) => getDispatcherTagForAccount(account))
    .filter(Boolean);
}

function getAccountantDisplayNameByPhone(accountants, phone) {
  const normalizedPhone = normalizeAccountantPhone(phone);
  if (!normalizedPhone) return "";
  const profile = (Array.isArray(accountants) ? accountants : []).find(
    (item) => normalizeAccountantPhone(item?.phone) === normalizedPhone
  );
  return normalizeAccountantDisplayName(profile?.displayName || profile?.name || profile?.username);
}

function getLinkedAccountantDisplayNameByDispatcherTag(dispatcherTag, dispatcherAccountantMappings, accountants) {
  const account = normalizeText(getDispatcherAccountByTag(dispatcherTag), 16).toLowerCase();
  if (!account) return "";
  const phone = normalizeAccountantPhone(dispatcherAccountantMappings?.[account]);
  return getAccountantDisplayNameByPhone(accountants, phone);
}

function scopeDispatcherAccountantMappingsBySession(session, dispatcherAccountantMappings) {
  const mappings = dispatcherAccountantMappings && typeof dispatcherAccountantMappings === "object"
    ? dispatcherAccountantMappings
    : {};
  if (session?.role === "boss") return mappings;
  if (session?.role === "accountant") {
    const phone = getSessionAccountantPhone(session);
    if (!phone) return {};
    return Object.fromEntries(
      Object.entries(mappings).filter(([, mappedPhone]) => normalizeAccountantPhone(mappedPhone) === phone)
    );
  }
  if (session?.role === "dispatcher") {
    const account = normalizeText(session.account, 16).toLowerCase();
    return Object.prototype.hasOwnProperty.call(mappings, account)
      ? { [account]: mappings[account] }
      : {};
  }
  return {};
}

async function requireAuthSession(req, res, allowedRoles = []) {
  const session = await getAuthSessionFromRequest(req);
  if (!session) {
    sendJson(res, 401, { error: "登录已失效，请重新登录。" });
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(session.role)) {
    sendJson(res, 403, { error: "当前账号无权执行此操作。" });
    return null;
  }
  return session;
}

function canAccessRecord(session, record, options = {}) {
  if (!session || !record || typeof record !== "object") return false;
  if (session.role === "boss") return true;
  const includeLinkedSettlementPeers = Boolean(options.includeLinkedSettlementPeers);
  const dispatcherAccountantMappings = options.dispatcherAccountantMappings || {};
  const accountants = Array.isArray(options.accountants) ? options.accountants : [];
  if (session.role === "dispatcher") {
    const accountTag = getDispatcherTagForAccount(session.account);
    const recordTag = normalizeDispatcherTag(record.dispatcher);
    if (accountTag && recordTag && accountTag === recordTag) return true;
    if (!includeLinkedSettlementPeers || !accountTag) return false;
    const linkedAccountantName = getLinkedAccountantDisplayNameByDispatcherTag(
      accountTag,
      dispatcherAccountantMappings,
      accountants
    );
    return Boolean(linkedAccountantName && normalizeAccountantDisplayName(record.accountant) === linkedAccountantName);
  }
  if (session.role === "accountant") {
    if (normalizeAccountantDisplayName(record.accountant) === getSessionAccountantDisplayName(session)) return true;
    if (!includeLinkedSettlementPeers) return false;
    const linkedTags = getDispatcherTagsLinkedToSessionAccountant(session, dispatcherAccountantMappings);
    const recordTag = normalizeDispatcherTag(record.dispatcher);
    return Boolean(recordTag && linkedTags.includes(recordTag));
  }
  return false;
}

function getRecordWorkflowStatusKey(record) {
  const checkStatus = normalizeText(record?.checkStatus, 24).toLowerCase();
  if (checkStatus === "refunded" || checkStatus === "partial_refunded") {
    if (getNormalizedRecordSettlementPaymentFields(record).isSettlementPaid) return "paid";
    if (getNormalizedRecordInvoiceFields(record).settlementInvoiceImage) return "uploaded";
    if (getNormalizedRecordSettlementFields(record).isSettled) return "settled";
    return "completed";
  }
  if (checkStatus === "returned") return "returned";
  if (checkStatus === "completed") {
    if (getNormalizedRecordSettlementPaymentFields(record).isSettlementPaid) return "paid";
    if (getNormalizedRecordInvoiceFields(record).settlementInvoiceImage) return "uploaded";
    if (getNormalizedRecordSettlementFields(record).isSettled) return "settled";
    return "completed";
  }
  if (checkStatus === "checked") return "checked";
  return "pending";
}

function canDeleteRecord(session, record) {
  if (!session || !record || typeof record !== "object") return false;
  if (session.role === "boss") return true;
  if (session.role === "dispatcher") {
    return DISPATCHER_DELETABLE_WORKFLOW_STATUS_KEYS.has(getRecordWorkflowStatusKey(record));
  }
  return false;
}

const DISPATCHER_DELETABLE_WORKFLOW_STATUS_KEYS = new Set([
  "pending",
  "checked",
  "completed"
]);

const DISPATCHER_EDITABLE_WORKFLOW_STATUS_KEYS = new Set([
  "pending",
  "checked",
  "completed"
]);

function canEditRecord(session, record) {
  if (!session || !record || typeof record !== "object") return false;
  if (session.role === "boss") return true;
  if (session.role === "dispatcher") {
    return DISPATCHER_EDITABLE_WORKFLOW_STATUS_KEYS.has(getRecordWorkflowStatusKey(record));
  }
  if (session.role === "accountant") return true;
  return false;
}

function canUploadInvoiceToRecord(session, record, options = {}) {
  if (!session || !record || typeof record !== "object") return false;
  if (session.role === "accountant") {
    if (normalizeAccountantDisplayName(record.accountant) === getSessionAccountantDisplayName(session)) return true;
    const linkedTags = getDispatcherTagsLinkedToSessionAccountant(
      session,
      options.dispatcherAccountantMappings || {}
    );
    const recordTag = normalizeDispatcherTag(record.dispatcher);
    return Boolean(recordTag && linkedTags.includes(recordTag));
  }
  if (session.role === "dispatcher") {
    const accountTag = getDispatcherTagForAccount(session.account);
    if (!accountTag) return false;
    const linkedAccountantName = getLinkedAccountantDisplayNameByDispatcherTag(
      accountTag,
      options.dispatcherAccountantMappings || {},
      Array.isArray(options.accountants) ? options.accountants : []
    );
    const recordTag = normalizeDispatcherTag(record.dispatcher);
    return Boolean(linkedAccountantName && recordTag === accountTag);
  }
  return false;
}

function getInvoiceUploadFieldScopeForRecord(session, record, options = {}) {
  if (!session || !record || typeof record !== "object") return "";
  if (session.role === "accountant") {
    const linkedTags = getDispatcherTagsLinkedToSessionAccountant(
      session,
      options.dispatcherAccountantMappings || {}
    );
    const recordTag = normalizeDispatcherTag(record.dispatcher);
    if (recordTag && linkedTags.includes(recordTag)) {
      return "dispatcher";
    }
    if (normalizeAccountantDisplayName(record.accountant) === getSessionAccountantDisplayName(session)) {
      return "accountant";
    }
    return "";
  }
  if (session.role === "dispatcher") {
    const accountTag = getDispatcherTagForAccount(session.account);
    if (!accountTag) return "";
    const linkedAccountantName = getLinkedAccountantDisplayNameByDispatcherTag(
      accountTag,
      options.dispatcherAccountantMappings || {},
      Array.isArray(options.accountants) ? options.accountants : []
    );
    const recordTag = normalizeDispatcherTag(record.dispatcher);
    return linkedAccountantName &&
      recordTag === accountTag
      ? "dispatcher"
      : "";
  }
  return "";
}

const ACCOUNTANT_RECORD_HISTORY_VISIBLE_FIELDS = new Set([
  "date",
  "dispatcher",
  "customer",
  "summary",
  "totalPrice",
  "settlementPrice",
  "checkStatus",
  "isSettled",
  "isSettlementPaid",
  "completedAt",
  "customerFeedback"
]);

function sanitizeRecordHistoryEntryForAccountant(rawEntry) {
  const entry = normalizeOperationHistoryEntry(rawEntry);
  if (!entry) return null;
  const sourceChanges = Array.isArray(entry.changes) ? entry.changes : [];
  const changes = sourceChanges.filter((change) => (
    ACCOUNTANT_RECORD_HISTORY_VISIBLE_FIELDS.has(normalizeText(change?.field, 64))
  ));
  const hasInvoiceUploadChange = sourceChanges.some((change) => {
    const field = normalizeText(change?.field, 64);
    return field === "settlementInvoiceImage" && normalizeText(change?.after, 1000);
  });

  if ((entry.actionKey === "invoice_uploaded" || entry.actionKey === "invoice_reuploaded") && hasInvoiceUploadChange && !changes.some((change) => change.field === "isSettled")) {
    changes.push({
      field: "isSettled",
      label: "结算",
      before: getRecordWorkflowStatusLabelByKey("settled"),
      after: getRecordWorkflowStatusLabelByKey("uploaded")
    });
  }

  if (!changes.length) return null;
  return {
    ...entry,
    changes
  };
}

function sanitizeOperationHistoryForAccountant(rawHistory) {
  return (Array.isArray(rawHistory) ? rawHistory : [])
    .map((entry) => sanitizeRecordHistoryEntryForAccountant(entry))
    .filter(Boolean);
}

function sanitizeRecordForAccountant(record) {
  const source = record && typeof record === "object" ? record : {};
  const settlementFields = getNormalizedRecordSettlementFields(source);
  const invoiceFields = getNormalizedRecordInvoiceFields(source);
  const dispatcherInvoiceFields = getNormalizedRecordDispatcherInvoiceFields(source);
  const paymentFields = getNormalizedRecordSettlementPaymentFields(source);
  const dispatcherPaymentFields = getNormalizedRecordDispatcherSettlementPaymentFields(source);
  const paymentPrice = normalizeMoneyValue(source.paymentPrice);
  const totalPrice = normalizeMoneyValue(source.totalPrice);
  const settlementPrice = normalizeMoneyValue(source.settlementPrice);
  const premiumPrice = getRecordPremiumPrice(source);
  return {
    id: normalizeText(source.id, 120),
    createdAt: normalizeDateTimeValue(source.createdAt),
    date: normalizeText(source.date, 32),
    dispatcher: normalizeDispatcherTag(source.dispatcher) || normalizeText(source.dispatcher, 48),
    accountant: normalizeAccountantDisplayName(source.accountant),
    customer: normalizeText(source.customer, 120),
    summary: normalizeText(source.summary, 500),
    paymentPrice: Number.isFinite(paymentPrice) ? paymentPrice : "",
    totalPrice: Number.isFinite(totalPrice) ? totalPrice : "",
    premiumPrice: Number.isFinite(premiumPrice) ? premiumPrice : "",
    settlementPrice: Number.isFinite(settlementPrice) ? settlementPrice : "",
    isMonthlySettlement: normalizeMonthlySettlementState(source.isMonthlySettlement),
    checkStatus: normalizeText(source.checkStatus, 24).toLowerCase() || "pending",
    refundStatus: normalizeText(source.refundStatus, 24).toLowerCase(),
    refundedAt: normalizeDateTimeValue(source.refundedAt),
    refundedBy: normalizeText(source.refundedBy, 48),
    completedAt: normalizeDateTimeValue(source.completedAt),
    customerFeedback: normalizeText(source.customerFeedback, 1000),
    serviceFeedbackImages: normalizeStoredFeedbackImages(source.serviceFeedbackImages),
    returnedAt: normalizeDateTimeValue(source.returnedAt),
    isSettled: settlementFields.isSettled,
    settlementInvoiceImage: invoiceFields.settlementInvoiceImage,
    invoiceUploadedAt: invoiceFields.invoiceUploadedAt,
    invoiceUploadedBy: invoiceFields.invoiceUploadedBy,
    invoiceUploadedByUsername: invoiceFields.invoiceUploadedByUsername,
    invoiceRecipientInfo: invoiceFields.invoiceRecipientInfo,
    invoiceRecipientName: invoiceFields.invoiceRecipientName,
    invoiceRecipientBankName: invoiceFields.invoiceRecipientBankName,
    invoiceRecipientBankCardNo: invoiceFields.invoiceRecipientBankCardNo,
    invoiceRecipientIdCardNo: invoiceFields.invoiceRecipientIdCardNo,
    invoiceRecipientDeclarationPhone: invoiceFields.invoiceRecipientDeclarationPhone,
    dispatcherSettlementInvoiceImage: dispatcherInvoiceFields.dispatcherSettlementInvoiceImage,
    dispatcherInvoiceUploadedAt: dispatcherInvoiceFields.dispatcherInvoiceUploadedAt,
    dispatcherInvoiceUploadedBy: dispatcherInvoiceFields.dispatcherInvoiceUploadedBy,
    dispatcherInvoiceUploadedByUsername: dispatcherInvoiceFields.dispatcherInvoiceUploadedByUsername,
    dispatcherInvoiceRecipientInfo: dispatcherInvoiceFields.dispatcherInvoiceRecipientInfo,
    dispatcherInvoiceRecipientName: dispatcherInvoiceFields.dispatcherInvoiceRecipientName,
    dispatcherInvoiceRecipientBankName: dispatcherInvoiceFields.dispatcherInvoiceRecipientBankName,
    dispatcherInvoiceRecipientBankCardNo: dispatcherInvoiceFields.dispatcherInvoiceRecipientBankCardNo,
    dispatcherInvoiceRecipientIdCardNo: dispatcherInvoiceFields.dispatcherInvoiceRecipientIdCardNo,
    dispatcherInvoiceRecipientDeclarationPhone: dispatcherInvoiceFields.dispatcherInvoiceRecipientDeclarationPhone,
    isSettlementPaid: paymentFields.isSettlementPaid,
    settlementPaidAt: paymentFields.settlementPaidAt,
    settlementPaidBy: paymentFields.settlementPaidBy,
    isDispatcherSettlementPaid: dispatcherPaymentFields.isDispatcherSettlementPaid,
    dispatcherSettlementPaidAt: dispatcherPaymentFields.dispatcherSettlementPaidAt,
    dispatcherSettlementPaidBy: dispatcherPaymentFields.dispatcherSettlementPaidBy,
    operationHistory: sanitizeOperationHistoryForAccountant(source.operationHistory)
  };
}

function scopeRecordBySession(session, record, options = {}) {
  const source = options.hiddenFromMainTable
    ? { ...record, hiddenFromMainTable: true }
    : record;
  if (session?.role === "accountant") {
    const scoped = sanitizeRecordForAccountant(source);
    return options.hiddenFromMainTable
      ? { ...scoped, hiddenFromMainTable: true }
      : scoped;
  }
  return source;
}

function scopeRecordsBySession(session, sourceRecords, options = {}) {
  return sourceRecords
    .filter((item) => canAccessRecord(session, item, options))
    .map((item) => {
      const isDirectRecord = canAccessRecord(session, item);
      return scopeRecordBySession(session, item, {
        hiddenFromMainTable: Boolean(options.includeLinkedSettlementPeers && !isDirectRecord)
      });
    });
}

function scopeRecycleBinBySession(session, sourceEntries) {
  return sourceEntries
    .filter((entry) => {
      const record = entry && typeof entry === "object" ? (entry.record || {}) : {};
      return canAccessRecord(session, record);
    })
    .map((entry) => {
      if (session?.role !== "accountant") return entry;
      const source = entry && typeof entry === "object" ? entry : {};
      return {
        recycleId: normalizeText(source.recycleId, 120),
        deletedAt: normalizeDateTimeValue(source.deletedAt),
        deletedBy: normalizeText(source.deletedBy, 48),
        record: sanitizeRecordForAccountant(source.record)
      };
    });
}

function canAccessAccountantOperationLog(session, entry) {
  if (!session || !entry || typeof entry !== "object") return false;
  if (session.role === "boss") return true;
  if (session.role === "dispatcher") {
    const accountTag = getDispatcherTagForAccount(session.account);
    const entryTag = normalizeDispatcherTag(entry.dispatcher);
    return Boolean(accountTag && entryTag && accountTag === entryTag);
  }
  if (session.role === "accountant") {
    return normalizeAccountantUsername(entry.operatedByUsername || entry.operatedBy) === normalizeAccountantUsername(session.account);
  }
  return false;
}

function scopeAccountantOperationLogsBySession(session, sourceLogs) {
  const scopedLogs = sourceLogs.filter((entry) => canAccessAccountantOperationLog(session, entry));
  if (session?.role !== "accountant") return scopedLogs;
  return scopedLogs.map((entry) => {
    const sanitizedEntry = entry && typeof entry === "object" ? { ...entry } : {};
    delete sanitizedEntry.remark;
    if (sanitizedEntry.record && typeof sanitizedEntry.record === "object") {
      sanitizedEntry.record = sanitizeRecordForAccountant(sanitizedEntry.record);
    }
    return sanitizedEntry;
  });
}

function getDispatcherVisibleAccountantIdentifier(rawProfile) {
  return normalizeAccountantDisplayName(
    rawProfile?.displayName || rawProfile?.name || rawProfile?.alias || rawProfile?.username
  );
}

function sanitizeAccountantProfileForDispatcher(rawProfile) {
  const profile = normalizeAccountantProfile(rawProfile);
  if (!profile) return null;
  return {
    ...profile,
    username: getDispatcherVisibleAccountantIdentifier(profile) || profile.username,
    phone: "",
    loginPassword: ""
  };
}

function scopeAccountantBySession(session, rawProfile) {
  const profile = normalizeAccountantProfile(rawProfile);
  if (!profile) return null;
  if (session?.role === "dispatcher") {
    return sanitizeAccountantProfileForDispatcher(profile);
  }
  return profile;
}

function scopeAccountantsBySession(session, sourceAccountants) {
  const accountants = Array.isArray(sourceAccountants) ? sourceAccountants : [];
  if (!session) {
    return accountants.map((item) => scopeAccountantBySession(session, item)).filter(Boolean);
  }
  if (session.role === "accountant") {
    return accountants
      .filter(
        (item) => normalizeAccountantUsername(item?.username || item?.name) === normalizeAccountantUsername(session.account)
      )
      .map((item) => scopeAccountantBySession(session, item))
      .filter(Boolean);
  }
  return accountants.map((item) => scopeAccountantBySession(session, item)).filter(Boolean);
}

function resolveAccountantByIdentifier(sourceAccountants, accountantIdentifierRaw) {
  const accountants = Array.isArray(sourceAccountants) ? sourceAccountants : [];
  const normalizedUsername = normalizeAccountantUsername(accountantIdentifierRaw);
  const normalizedDisplayName = normalizeAccountantDisplayName(accountantIdentifierRaw);
  if (!normalizedUsername && !normalizedDisplayName) return null;
  return accountants.find((item) => {
    const itemUsername = normalizeAccountantUsername(item?.username || item?.name);
    const itemDisplayName = normalizeAccountantDisplayName(item?.displayName || item?.name || item?.alias);
    return Boolean(
      (normalizedUsername && itemUsername === normalizedUsername)
      || (normalizedDisplayName && itemDisplayName === normalizedDisplayName)
    );
  }) || null;
}

function normalizeAccountantLoginPassword(value) {
  return normalizeText(value, 200);
}

function normalizeAccountantProfile(raw) {
  if (typeof raw === "string") {
    const displayName = normalizeAccountantDisplayName(raw);
    return displayName
      ? {
          username: displayName,
          displayName,
          name: displayName,
          alias: "",
          realName: "",
          phone: "",
          loginPassword: ""
        }
      : null;
  }
  if (!raw || typeof raw !== "object") return null;
  const username = normalizeAccountantUsername(
    raw.username || raw.loginName || raw.account || raw.phone || raw.mobile || raw.mobilePhone || raw.name
  );
  const displayName = resolveAccountantProfileDisplayName(raw) || username;
  if (!username || !displayName) return null;
  const aliasInput = normalizeAccountantAlias(raw.alias || raw.nickname);
  const alias = aliasInput || (displayName !== username ? displayName : "");
  const realName = normalizeAccountantRealName(
    raw.realName || raw.fullName || raw.legalName
  );
  const phone = normalizeAccountantPhone(
    raw.phone || raw.mobile || raw.mobilePhone
  );
  const loginPassword = normalizeAccountantLoginPassword(
    raw.loginPassword || raw.password
  );
  const invoiceRecipientInfo = normalizeInvoiceRecipientInfo(raw.invoiceRecipientInfo || raw);
  const hasInvoiceRecipientInfo = Object.values(invoiceRecipientInfo).some(Boolean);
  return {
    username,
    displayName,
    name: displayName,
    alias,
    realName,
    phone,
    loginPassword,
    invoiceRecipientInfo: hasInvoiceRecipientInfo ? invoiceRecipientInfo : null
  };
}

function sortAccountantProfiles(profiles) {
  return [...profiles].sort((left, right) =>
    String(left.displayName || left.name || "").localeCompare(
      String(right.displayName || right.name || ""),
      "zh-CN",
      { numeric: true, sensitivity: "base" }
    ) || String(left.username || "").localeCompare(String(right.username || ""))
  );
}

function buildAccountantProfiles(savedAccountants, namesFromRecords = []) {
  const byUsername = new Map();

  savedAccountants.forEach((item) => {
    const profile = normalizeAccountantProfile(item);
    if (!profile) return;
    if (isBuiltInAccountantName(profile.displayName) || isBuiltInAccountantName(profile.username)) return;
    const current = byUsername.get(profile.username);
    if (!current) {
      byUsername.set(profile.username, profile);
      return;
    }
    const merged = {
      ...current,
      displayName: current.displayName || profile.displayName || current.username,
      name: current.displayName || profile.displayName || current.username,
      alias: current.alias || profile.alias || "",
      realName: current.realName || profile.realName || "",
      phone: current.phone || profile.phone || "",
      loginPassword: current.loginPassword || profile.loginPassword || "",
      invoiceRecipientInfo: current.invoiceRecipientInfo || profile.invoiceRecipientInfo || null
    };
    byUsername.set(profile.username, merged);
  });

  namesFromRecords.forEach((rawDisplayName) => {
    const displayName = normalizeAccountantDisplayName(rawDisplayName);
    if (!displayName) return;
    if (isBuiltInAccountantName(displayName)) return;
    const exists = Array.from(byUsername.values()).some(
      (profile) => normalizeAccountantDisplayName(profile.displayName) === displayName
    );
    if (!exists) {
      byUsername.set(displayName, {
        username: displayName,
        displayName,
        name: displayName,
        alias: "",
        realName: "",
        phone: "",
        loginPassword: "",
        invoiceRecipientInfo: null
      });
    }
  });

  const profiles = sortAccountantProfiles(Array.from(byUsername.values()));

  profiles.forEach((profile) => {
    profile.name = profile.displayName;
    profile.alias = normalizeAccountantAlias(profile.alias) || (profile.displayName !== profile.username ? profile.displayName : "");
    profile.realName = normalizeAccountantRealName(profile.realName);
    profile.phone = normalizeAccountantPhone(profile.phone);
    const invoiceRecipientInfo = normalizeInvoiceRecipientInfo(profile.invoiceRecipientInfo);
    profile.invoiceRecipientInfo = Object.values(invoiceRecipientInfo).every(Boolean)
      ? invoiceRecipientInfo
      : null;
    if (!profile.loginPassword) {
      profile.loginPassword = DEFAULT_ACCOUNTANT_LOGIN_PASSWORD;
    }
  });

  return profiles;
}

function resolveInvoiceRecipientProfileIndex(accountants, session, dispatcherAccountantMappings = {}) {
  if (!Array.isArray(accountants) || !session) return -1;
  if (session.role === "accountant") {
    const loginAccount = normalizeText(session.account, 120);
    return accountants.findIndex((item) => {
      const profile = normalizeAccountantProfile(item);
      if (!profile) return false;
      return [profile.username, profile.displayName, profile.name, profile.alias, profile.phone]
        .map((value) => normalizeText(value, 120))
        .filter(Boolean)
        .includes(loginAccount);
    });
  }
  if (session.role === "dispatcher") {
    const dispatcherTag = getDispatcherTagForAccount(session.account);
    const linkedPhone = dispatcherAccountantMappings[String(session.account || "").trim().toLowerCase()];
    const linkedDisplayName = getLinkedAccountantDisplayNameByDispatcherTag(
      dispatcherTag,
      dispatcherAccountantMappings,
      accountants
    );
    return accountants.findIndex((item) => {
      const profile = normalizeAccountantProfile(item);
      if (!profile) return false;
      return Boolean(
        (linkedPhone && normalizeAccountantPhone(profile.phone) === normalizeAccountantPhone(linkedPhone)) ||
        (linkedDisplayName && normalizeAccountantDisplayName(profile.displayName) === normalizeAccountantDisplayName(linkedDisplayName))
      );
    });
  }
  return -1;
}

function getLockedInvoiceRecipientInfoForSession(accountants, session, submittedInfo, dispatcherAccountantMappings = {}) {
  const profileIndex = resolveInvoiceRecipientProfileIndex(accountants, session, dispatcherAccountantMappings);
  const savedInfo = profileIndex >= 0
    ? normalizeInvoiceRecipientInfo(accountants[profileIndex]?.invoiceRecipientInfo)
    : normalizeInvoiceRecipientInfo(null);
  const hasSavedInfo = Object.values(savedInfo).every(Boolean);
  if (hasSavedInfo) {
    return { info: savedInfo, profileIndex, changed: false };
  }
  const info = validateInvoiceRecipientInfo(submittedInfo);
  if (profileIndex < 0) {
    return { info, profileIndex, changed: false };
  }
  accountants[profileIndex] = {
    ...accountants[profileIndex],
    invoiceRecipientInfo: info
  };
  return { info, profileIndex, changed: true };
}

function getAccountantUploadIdentitySet(accountantName, accountants = []) {
  const normalizedName = normalizeAccountantDisplayName(accountantName);
  const identities = new Set();
  const addIdentity = (value, normalizer = normalizeText) => {
    const text = normalizer(value);
    if (text) identities.add(text);
  };

  addIdentity(normalizedName, normalizeAccountantDisplayName);
  const profile = resolveAccountantByIdentifier(accountants, normalizedName);
  if (profile) {
    addIdentity(profile.displayName, normalizeAccountantDisplayName);
    addIdentity(profile.name, normalizeAccountantDisplayName);
    addIdentity(profile.alias, normalizeAccountantDisplayName);
    addIdentity(profile.username, normalizeAccountantUsername);
    addIdentity(profile.phone, normalizeAccountantPhone);
  }

  return identities;
}

function isInvoiceUploadedByAccountant(record, accountantName, accountants = []) {
  const identities = getAccountantUploadIdentitySet(accountantName, accountants);
  if (!identities.size) return false;
  const invoiceFields = getNormalizedRecordInvoiceFields(record);
  if (!invoiceFields.settlementInvoiceImage) return false;
  const uploadedBy = normalizeText(invoiceFields.invoiceUploadedBy, 48);
  const uploadedByUsername = normalizeAccountantUsername(invoiceFields.invoiceUploadedByUsername);
  return identities.has(uploadedBy) || identities.has(uploadedByUsername);
}

function isInvoiceUploadedByAccountantOrLinkedDispatcher(record, accountantName, options = {}) {
  const accountants = Array.isArray(options.accountants) ? options.accountants : [];
  if (isInvoiceUploadedByAccountant(record, accountantName, accountants)) return true;
  const normalizedAccountant = normalizeAccountantDisplayName(accountantName);
  const invoiceFields = getNormalizedRecordInvoiceFields(record);
  if (!normalizedAccountant || !invoiceFields.settlementInvoiceImage) return false;
  const uploadedDispatcherTag = normalizeDispatcherTag(invoiceFields.invoiceUploadedByUsername);
  if (!uploadedDispatcherTag) return false;
  const linkedAccountantName = getLinkedAccountantDisplayNameByDispatcherTag(
    uploadedDispatcherTag,
    options.dispatcherAccountantMappings || {},
    accountants
  );
  return Boolean(linkedAccountantName && linkedAccountantName === normalizedAccountant);
}

function isDispatcherInvoiceUploadedByAccountantOrLinkedDispatcher(record, accountantName, options = {}) {
  const dispatcherInvoiceFields = getNormalizedRecordDispatcherInvoiceFields(record);
  if (!dispatcherInvoiceFields.dispatcherSettlementInvoiceImage) return false;
  return isInvoiceUploadedByAccountantOrLinkedDispatcher({
    ...record,
    settlementInvoiceImage: dispatcherInvoiceFields.dispatcherSettlementInvoiceImage,
    invoiceUploadedAt: dispatcherInvoiceFields.dispatcherInvoiceUploadedAt,
    invoiceUploadedBy: dispatcherInvoiceFields.dispatcherInvoiceUploadedBy,
    invoiceUploadedByUsername: dispatcherInvoiceFields.dispatcherInvoiceUploadedByUsername
  }, accountantName, options);
}

function isRecordInvoiceUploadedByRecordAccountant(record, accountants = []) {
  return isInvoiceUploadedByAccountant(record, record?.accountant, accountants);
}

function isRecordInvoiceUploadedByRecordAccountantOrLinkedDispatcher(record, options = {}) {
  return isInvoiceUploadedByAccountantOrLinkedDispatcher(record, record?.accountant, options);
}

function isRecordInvoiceOptionalForPayout(record) {
  return isBuiltInAccountantName(record?.accountant);
}

function normalizePayoutTarget(rawTarget) {
  const source = normalizeText(rawTarget, 160);
  if (!source) return null;
  const separatorIndex = source.indexOf(":");
  if (separatorIndex < 0) {
    return { key: source, type: "accountant", recordId: source };
  }
  const type = normalizeText(source.slice(0, separatorIndex), 32).toLowerCase();
  const recordId = normalizeText(source.slice(separatorIndex + 1), 120);
  if (!recordId) return null;
  if (type === "dispatcher") {
    return { key: `dispatcher:${recordId}`, type: "dispatcher", recordId };
  }
  return { key: recordId, type: "accountant", recordId };
}

function normalizePayoutTargets(rawTargets, fallbackRecordIds = []) {
  const sourceTargets = Array.isArray(rawTargets) && rawTargets.length ? rawTargets : fallbackRecordIds;
  const targetMap = new Map();
  (Array.isArray(sourceTargets) ? sourceTargets : [])
    .map((item) => normalizePayoutTarget(item))
    .filter(Boolean)
    .forEach((target) => {
      targetMap.set(target.key, target);
    });
  return Array.from(targetMap.values());
}

function isDispatcherPayoutTargetLinkedToAccountant(record, options = {}) {
  const accountants = Array.isArray(options.accountants) ? options.accountants : [];
  const dispatcherAccountantMappings = options.dispatcherAccountantMappings || {};
  const recordTag = normalizeDispatcherTag(record?.dispatcher);
  if (!recordTag) return false;
  const linkedAccountantName = getLinkedAccountantDisplayNameByDispatcherTag(
    recordTag,
    dispatcherAccountantMappings,
    accountants
  );
  return Boolean(linkedAccountantName);
}
function generateId(prefix = "rec") {
  const ts = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}${random}`;
}

function getRecordPremiumPrice(record) {
  const source = record && typeof record === "object" ? record : {};
  const paymentPrice = normalizeMoneyValue(source.paymentPrice);
  const totalPrice = normalizeMoneyValue(source.totalPrice);
  if (!Number.isFinite(paymentPrice) || !Number.isFinite(totalPrice)) return Number.NaN;
  return paymentPrice - totalPrice;
}

const RECORD_HISTORY_ACTION_LABELS = {
  created: "新建",
  updated: "修改",
  checked: "确认",
  completed: "完成",
  partial_refunded: "部分退款",
  refunded: "退款",
  returned: "退单",
  settled: "结算",
  invoice_uploaded: "上传发票",
  invoice_reuploaded: "修改发票",
  settlement_paid: "打款"
};

function getRecordWorkflowStatusLabelByKey(statusKey) {
  if (statusKey === "paid") return "已结算";
  if (statusKey === "uploaded") return "已上传/待结算";
  if (statusKey === "settled") return "已核对客户确认/待上传";
  if (statusKey === "partial_refunded") return "部分退款";
  if (statusKey === "refunded") return "退款";
  if (statusKey === "completed") return "已完成/待核对客户确认";
  if (statusKey === "checked") return "已确认/待完成";
  if (statusKey === "returned") return "已退单";
  return "已派单/待确认";
}

function getRecordSettlementWorkflowStatusLabel(record, accountants = []) {
  const invoiceFields = getNormalizedRecordInvoiceFields(record);
  const paymentFields = getNormalizedRecordSettlementPaymentFields(record);
  if (paymentFields.isSettlementPaid) return getRecordWorkflowStatusLabelByKey("paid");
  if (invoiceFields.settlementInvoiceImage && isRecordInvoiceUploadedByRecordAccountant(record, accountants)) {
    return getRecordWorkflowStatusLabelByKey("uploaded");
  }
  return getNormalizedRecordSettlementFields(record).isSettled
    ? getRecordWorkflowStatusLabelByKey("settled")
    : getRecordWorkflowStatusLabelByKey("completed");
}

function resolveActionLabel(actionKey, rawActionLabel) {
  const normalizedActionKey = normalizeText(actionKey, 32).toLowerCase();
  if (normalizedActionKey === "checked") return RECORD_HISTORY_ACTION_LABELS.checked;
  return normalizeText(rawActionLabel, 32) || RECORD_HISTORY_ACTION_LABELS[normalizedActionKey] || "修改";
}

function normalizeAccountantOperationLogEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== "object") return null;
  const actionKey = normalizeText(rawEntry.actionKey, 32).toLowerCase() || "updated";
  return {
    ...rawEntry,
    logId: normalizeText(rawEntry.logId, 80) || generateId("alog"),
    operatedAt: normalizeDateTimeValue(rawEntry.operatedAt),
    operatedBy: normalizeText(rawEntry.operatedBy, 48),
    operatedByUsername: normalizeAccountantUsername(rawEntry.operatedByUsername || rawEntry.operatedBy),
    actionKey,
    actionLabel: resolveActionLabel(actionKey, rawEntry.actionLabel),
    recordId: normalizeText(rawEntry.recordId, 80),
    date: normalizeText(rawEntry.date, 32),
    dispatcher: normalizeText(rawEntry.dispatcher, 48),
    accountant: normalizeText(rawEntry.accountant, 48),
    customer: normalizeText(rawEntry.customer, 120),
    summary: normalizeText(rawEntry.summary, 500),
    remark: normalizeText(rawEntry.remark, 500),
    customerFeedback: normalizeText(rawEntry.customerFeedback, 1000),
    completedAt: normalizeDateTimeValue(rawEntry.completedAt)
  };
}

const RECORD_HISTORY_FIELD_DEFINITIONS = [
  { field: "checkStatus", label: "状态", kind: "status" },
  { field: "refundStatus", label: "退款", kind: "status" },
  { field: "paymentPrice", label: "付款价", kind: "money" },
  { field: "totalPrice", label: "会计价", kind: "money" },
  {
    field: "premiumPrice",
    label: "溢价",
    kind: "money",
    getValue: (record) => getRecordPremiumPrice(record)
  },
  { field: "settlementPrice", label: "会计结算价", kind: "money" },
  {
    field: "isSettled",
    label: "结算",
    kind: "text",
    getValue: (record) => getRecordSettlementWorkflowStatusLabel(record)
  },
  { field: "settledAt", label: "结算时间", kind: "datetime" },
  { field: "settledBy", label: "结算人", kind: "text" },
  {
    field: "settlementInvoiceImage",
    label: "发票",
    kind: "text",
    getValue: (record) => {
      const image = normalizeStoredInvoiceImage(record?.settlementInvoiceImage || record?.invoiceImage);
      return image ? (image.name || image.url || image.fileName) : "";
    }
  },
  { field: "invoiceUploadedAt", label: "发票上传时间", kind: "datetime" },
  { field: "invoiceUploadedBy", label: "发票上传人", kind: "text" },
  { field: "invoiceRecipientName", label: "发票姓名", kind: "text" },
  { field: "invoiceRecipientBankName", label: "开户行", kind: "text" },
  { field: "invoiceRecipientBankCardNo", label: "银行卡号", kind: "text" },
  { field: "invoiceRecipientIdCardNo", label: "身份证号", kind: "text" },
  { field: "invoiceRecipientDeclarationPhone", label: "申报手机号", kind: "text" },
  {
    field: "isSettlementPaid",
    label: "打款",
    kind: "text",
    getValue: (record) => getNormalizedRecordSettlementPaymentFields(record).isSettlementPaid ? "已结算" : ""
  },
  { field: "settlementPaidAt", label: "打款时间", kind: "datetime" },
  { field: "settlementPaidBy", label: "打款人", kind: "text" },
  {
    field: "isDispatcherSettlementPaid",
    label: "接待打款",
    kind: "text",
    getValue: (record) => getNormalizedRecordDispatcherSettlementPaymentFields(record).isDispatcherSettlementPaid ? "已结算" : ""
  },
  { field: "dispatcherSettlementPaidAt", label: "接待打款时间", kind: "datetime" },
  { field: "dispatcherSettlementPaidBy", label: "接待打款人", kind: "text" },
  { field: "date", label: "接单日期", kind: "text" },
  {
    field: "isMonthlySettlement",
    label: "月结勾选",
    kind: "text",
    getValue: (record) => normalizeMonthlySettlementState(record?.isMonthlySettlement) ? "是" : "否"
  },
  {
    field: "dispatcher",
    label: "派单人",
    kind: "text",
    getValue: (record) => getDispatcherDisplayNameByTag(record?.dispatcher) || normalizeText(record?.dispatcher, 48)
  },
  {
    field: "accountant",
    label: "会计",
    kind: "text",
    getValue: (record) => normalizeAccountantDisplayName(record?.accountant)
  },
  { field: "customer", label: "客户", kind: "text" },
  { field: "summary", label: "任务简介", kind: "text" },
  { field: "remark", label: "备注", kind: "text" },
  { field: "source", label: "来源", kind: "text" },
  { field: "platform", label: "平台", kind: "text" },
  { field: "shopName", label: "店铺", kind: "text" },
  { field: "orderNo", label: "订单号", kind: "text" },
  { field: "completedAt", label: "完工时间", kind: "datetime" },
  { field: "customerFeedback", label: "客户反馈", kind: "text" }
];

function getRecordHistoryFieldDefinition(field) {
  const normalizedField = normalizeText(field, 64);
  if (!normalizedField) return null;
  return RECORD_HISTORY_FIELD_DEFINITIONS.find((item) => item.field === normalizedField) || null;
}

function normalizeRecordHistoryValue(value, kind = "text") {
  if (kind === "money") {
    const amount = normalizeMoneyValue(value);
    return Number.isFinite(amount) ? amount : "";
  }
  if (kind === "datetime") {
    return normalizeDateTimeValue(value);
  }
  if (kind === "status") {
    return normalizeText(value, 24).toLowerCase();
  }
  return normalizeText(value, 1000);
}

function isRecordHistoryValueEmpty(value) {
  return !(typeof value === "number" && Number.isFinite(value)) && !normalizeText(value, 1000);
}

function isSameRecordHistoryValue(left, right) {
  const leftIsNumber = typeof left === "number" && Number.isFinite(left);
  const rightIsNumber = typeof right === "number" && Number.isFinite(right);
  if (leftIsNumber || rightIsNumber) {
    return leftIsNumber && rightIsNumber && left === right;
  }
  return normalizeText(left, 1000) === normalizeText(right, 1000);
}

function getRecordHistoryFieldValue(record, definition) {
  const source = record && typeof record === "object" ? record : {};
  const rawValue = typeof definition?.getValue === "function"
    ? definition.getValue(source)
    : source?.[definition?.field];
  return normalizeRecordHistoryValue(rawValue, definition?.kind);
}

function normalizeRecordHistoryChange(rawChange) {
  if (!rawChange || typeof rawChange !== "object") return null;
  const field = normalizeText(rawChange.field, 64);
  const definition = getRecordHistoryFieldDefinition(field);
  const label = normalizeText(rawChange.label, 64) || definition?.label;
  if (!field || !label) return null;
  return {
    field,
    label,
    before: normalizeRecordHistoryValue(rawChange.before, definition?.kind),
    after: normalizeRecordHistoryValue(rawChange.after, definition?.kind)
  };
}

function normalizeOperationHistoryEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== "object") return null;
  const actionKey = normalizeText(rawEntry.actionKey, 32).toLowerCase() || "updated";
  if (actionKey === "created") return null;
  const actionLabel = resolveActionLabel(actionKey, rawEntry.actionLabel);
  const operatedAt = normalizeDateTimeValue(rawEntry.operatedAt);
  const operatedBy = normalizeText(rawEntry.operatedBy, 48);
  const operatedRole = normalizeLoginRole(rawEntry.operatedRole) || normalizeText(rawEntry.operatedRole, 24);
  const changes = (Array.isArray(rawEntry.changes) ? rawEntry.changes : [])
    .map((item) => normalizeRecordHistoryChange(item))
    .filter(Boolean);
  const stableHistoryId = normalizeText(
    `${actionKey}_${operatedAt}_${operatedBy}`.replace(/[^a-z0-9_-]+/gi, "_"),
    80
  );
  const historyId = normalizeText(rawEntry.historyId, 80) || stableHistoryId || generateId("rhis");

  if (!operatedAt && !operatedBy && !changes.length) {
    return null;
  }

  return {
    historyId,
    operatedAt,
    operatedBy,
    operatedRole,
    actionKey,
    actionLabel,
    changes
  };
}

function normalizeOperationHistory(rawHistory) {
  return (Array.isArray(rawHistory) ? rawHistory : [])
    .map((item) => normalizeOperationHistoryEntry(item))
    .filter(Boolean);
}

function buildFieldChangeList(beforeRecord, afterRecord) {
  return RECORD_HISTORY_FIELD_DEFINITIONS
    .map((definition) => {
      const before = getRecordHistoryFieldValue(beforeRecord, definition);
      const after = getRecordHistoryFieldValue(afterRecord, definition);
      if (isSameRecordHistoryValue(before, after)) return null;
      if (isRecordHistoryValueEmpty(before) && isRecordHistoryValueEmpty(after)) return null;
      return {
        field: definition.field,
        label: definition.label,
        before,
        after
      };
    })
    .filter(Boolean);
}

function getRecordHistoryOperator(session) {
  const currentSession = session && typeof session === "object" ? session : {};
  const operatedRole = normalizeLoginRole(currentSession.role);
  if (!operatedRole) {
    return { operatedBy: "", operatedRole: "" };
  }
  if (operatedRole === "accountant") {
    return {
      operatedBy: getSessionAccountantDisplayName(currentSession) || normalizeAccountantUsername(currentSession.account),
      operatedRole
    };
  }
  if (operatedRole === "dispatcher") {
    const dispatcherTag = getDispatcherTagForAccount(currentSession.account) || normalizeDispatcherTag(currentSession.account);
    return {
      operatedBy: getDispatcherDisplayNameByTag(dispatcherTag) || normalizeText(currentSession.account, 48),
      operatedRole
    };
  }
  return {
    operatedBy: normalizeText(currentSession.account, 48),
    operatedRole
  };
}

function buildRecordHistoryEntry(options = {}) {
  const beforeRecord = options.beforeRecord && typeof options.beforeRecord === "object" ? options.beforeRecord : {};
  const afterRecord = options.afterRecord && typeof options.afterRecord === "object" ? options.afterRecord : {};
  const operator = getRecordHistoryOperator(options.session);
  return normalizeOperationHistoryEntry({
    historyId: generateId("rhis"),
    operatedAt: normalizeDateTimeValue(options.operatedAt) || getCurrentBeijingDateTime(),
    operatedBy: normalizeText(options.operatedBy, 48) || operator.operatedBy || "系统",
    operatedRole: normalizeLoginRole(options.operatedRole) || operator.operatedRole,
    actionKey: normalizeText(options.actionKey, 32).toLowerCase() || "updated",
    actionLabel: normalizeText(options.actionLabel, 32),
    changes: buildFieldChangeList(beforeRecord, afterRecord)
  });
}

function appendRecordHistory(record, entry) {
  const source = record && typeof record === "object" ? record : {};
  const currentHistory = normalizeOperationHistory(source.operationHistory);
  const nextEntry = normalizeOperationHistoryEntry(entry);
  return {
    ...source,
    operationHistory: nextEntry ? [nextEntry, ...currentHistory] : currentHistory
  };
}

function ensureRecordIds(sourceRecords) {
  let changed = false;
  const records = sourceRecords.map((item) => {
    const current = item && typeof item === "object" ? item : {};
    const currentId = normalizeText(current.id, 80);
    const normalizedCreatedAt = normalizeDateTimeValue(current.createdAt) || getCurrentBeijingDateTime();
    const normalizedCheckedAt = normalizeDateTimeValue(current.checkedAt);
    const normalizedCompletedAt = normalizeDateTimeValue(current.completedAt);
    const normalizedReturnedAt = normalizeDateTimeValue(current.returnedAt);
    const isBuiltInAccountantRecord = shouldAutoCompleteAccountantRecord(current.accountant);
    const normalizedHistory = normalizeOperationHistory(current.operationHistory);
    const normalizedSettlementFields = getNormalizedRecordSettlementFields(current);
    const normalizedInvoiceFields = getNormalizedRecordInvoiceFields(current);
    const normalizedDispatcherInvoiceFields = getNormalizedRecordDispatcherInvoiceFields(current);
    const normalizedSettlementPaymentFields = getNormalizedRecordSettlementPaymentFields(current);
    const normalizedDispatcherSettlementPaymentFields = getNormalizedRecordDispatcherSettlementPaymentFields(current);
    const normalizedMonthlySettlement = normalizeMonthlySettlementState(current.isMonthlySettlement);
    const hasNormalizedHistory = Array.isArray(current.operationHistory)
      && JSON.stringify(current.operationHistory) === JSON.stringify(normalizedHistory);
    const hasNormalizedSettlement = current.isSettled === normalizedSettlementFields.isSettled
      && normalizeDateTimeValue(current.settledAt) === normalizedSettlementFields.settledAt
      && normalizeText(current.settledBy, 48) === normalizedSettlementFields.settledBy;
    const hasNormalizedInvoice = JSON.stringify(normalizeStoredInvoiceImage(current.settlementInvoiceImage || current.invoiceImage))
      === JSON.stringify(normalizedInvoiceFields.settlementInvoiceImage)
      && normalizeDateTimeValue(current.invoiceUploadedAt || current.settlementInvoiceUploadedAt) === normalizedInvoiceFields.invoiceUploadedAt
      && normalizeText(current.invoiceUploadedBy || current.settlementInvoiceUploadedBy, 48) === normalizedInvoiceFields.invoiceUploadedBy
      && normalizeAccountantUsername(current.invoiceUploadedByUsername || current.settlementInvoiceUploadedByUsername) === normalizedInvoiceFields.invoiceUploadedByUsername
      && JSON.stringify(normalizeInvoiceRecipientInfo(current.invoiceRecipientInfo || current)) === JSON.stringify(normalizedInvoiceFields.invoiceRecipientInfo || normalizeInvoiceRecipientInfo({}));
    const hasNormalizedDispatcherInvoice = JSON.stringify(normalizeStoredInvoiceImage(current.dispatcherSettlementInvoiceImage || current.dispatcherInvoiceImage))
      === JSON.stringify(normalizedDispatcherInvoiceFields.dispatcherSettlementInvoiceImage)
      && normalizeDateTimeValue(current.dispatcherInvoiceUploadedAt || current.dispatcherSettlementInvoiceUploadedAt) === normalizedDispatcherInvoiceFields.dispatcherInvoiceUploadedAt
      && normalizeText(current.dispatcherInvoiceUploadedBy || current.dispatcherSettlementInvoiceUploadedBy, 48) === normalizedDispatcherInvoiceFields.dispatcherInvoiceUploadedBy
      && normalizeAccountantUsername(current.dispatcherInvoiceUploadedByUsername || current.dispatcherSettlementInvoiceUploadedByUsername) === normalizedDispatcherInvoiceFields.dispatcherInvoiceUploadedByUsername
      && JSON.stringify(normalizeInvoiceRecipientInfo(current.dispatcherInvoiceRecipientInfo || current)) === JSON.stringify(normalizedDispatcherInvoiceFields.dispatcherInvoiceRecipientInfo || normalizeInvoiceRecipientInfo({}));
    const hasNormalizedSettlementPayment = current.isSettlementPaid === normalizedSettlementPaymentFields.isSettlementPaid
      && normalizeDateTimeValue(current.settlementPaidAt) === normalizedSettlementPaymentFields.settlementPaidAt
      && normalizeText(current.settlementPaidBy, 48) === normalizedSettlementPaymentFields.settlementPaidBy;
    const hasNormalizedDispatcherSettlementPayment = current.isDispatcherSettlementPaid === normalizedDispatcherSettlementPaymentFields.isDispatcherSettlementPaid
      && normalizeDateTimeValue(current.dispatcherSettlementPaidAt) === normalizedDispatcherSettlementPaymentFields.dispatcherSettlementPaidAt
      && normalizeText(current.dispatcherSettlementPaidBy, 48) === normalizedDispatcherSettlementPaymentFields.dispatcherSettlementPaidBy;
    const hasNormalizedMonthlySettlement = current.isMonthlySettlement === normalizedMonthlySettlement;
    const hasBuiltInCompletion = !isBuiltInAccountantRecord
      || (
        normalizeText(current.checkStatus, 24).toLowerCase() === "completed"
        && normalizeText(current.checkedAt, 64) === ""
        && normalizeText(current.checkedBy, 48) === ""
        && Boolean(normalizeDateTimeValue(current.completedAt))
        && Boolean(normalizeText(current.completedBy, 48))
        && normalizeText(current.returnedAt, 64) === ""
        && normalizeText(current.returnedBy, 48) === ""
      );
    if (
      item
      && typeof item === "object"
      && currentId
      && normalizeText(current.createdAt, 64) === normalizedCreatedAt
      && normalizeText(current.checkedAt, 64) === normalizedCheckedAt
      && normalizeText(current.completedAt, 64) === normalizedCompletedAt
      && normalizeText(current.returnedAt, 64) === normalizedReturnedAt
      && hasNormalizedHistory
      && hasNormalizedSettlement
      && hasNormalizedInvoice
      && hasNormalizedDispatcherInvoice
      && hasNormalizedSettlementPayment
      && hasNormalizedDispatcherSettlementPayment
      && hasNormalizedMonthlySettlement
      && hasBuiltInCompletion
    ) {
      return item;
    }
    changed = true;
    return applyBuiltInAccountantCompletion({
      ...current,
      id: currentId || generateId("rec"),
      createdAt: normalizedCreatedAt,
      checkedAt: normalizedCheckedAt,
      completedAt: normalizedCompletedAt,
      returnedAt: normalizedReturnedAt,
      isMonthlySettlement: normalizedMonthlySettlement,
      operationHistory: normalizedHistory,
      ...normalizedSettlementFields,
      ...normalizedInvoiceFields,
      ...normalizedDispatcherInvoiceFields,
      ...normalizedSettlementPaymentFields,
      ...normalizedDispatcherSettlementPaymentFields
    }, normalizedCreatedAt);
  });
  return { records, changed };
}

async function loadAccountantsWithMigration() {
  const savedAccountants = await readAccountants();
  const allRecords = await readRecords();
  const migration = ensureRecordIds(allRecords);
  if (migration.changed) {
    await writeRecords(migration.records);
  }
  const accountantsFromRecords = migration.records.map((item) => normalizeAccountantDisplayName(item.accountant));
  const profiles = buildAccountantProfiles(savedAccountants, accountantsFromRecords);
  const rawText = JSON.stringify(savedAccountants);
  const normalizedText = JSON.stringify(profiles);
  if (rawText !== normalizedText) {
    await writeAccountants(profiles);
  }
  return { accountants: profiles, records: migration.records };
}

function normalizeRecord(input) {
  const normalizedDate = normalizeText(input.date, 32);
  const createdAt = getCurrentBeijingDateTime();
  const accountant = normalizeText(input.accountant, 48);
  const shouldAutoComplete = shouldAutoCompleteAccountantRecord(accountant);
  const item = {
    id: generateId("rec"),
    createdAt,
    date: normalizedDate || getCurrentBeijingDate(),
    isMonthlySettlement: normalizeMonthlySettlementState(input.isMonthlySettlement),
    dispatcher: normalizeDispatcherTag(input.dispatcher) || normalizeText(input.dispatcher, 48),
    accountant,
    platform: normalizeText(input.platform, 80),
    shopName: normalizeText(input.shopName, 160),
    orderNo: normalizeText(input.orderNo, 120),
    source: normalizeText(input.source, 120),
    customer: normalizeText(input.customer, 120),
    summary: normalizeText(input.summary, 500),
    remark: normalizeText(input.remark, 500),
    paymentPrice: normalizeOptionalMoneyField(input.paymentPrice),
    totalPrice: normalizeOptionalMoneyField(input.totalPrice),
    settlementPrice: normalizeOptionalMoneyField(input.settlementPrice),
    isSettled: false,
    settledAt: "",
    settledBy: "",
    settlementInvoiceImage: null,
    invoiceUploadedAt: "",
    invoiceUploadedBy: "",
    invoiceUploadedByUsername: "",
    invoiceRecipientInfo: null,
    invoiceRecipientName: "",
    invoiceRecipientBankName: "",
    invoiceRecipientBankCardNo: "",
    invoiceRecipientIdCardNo: "",
    invoiceRecipientDeclarationPhone: "",
    dispatcherSettlementInvoiceImage: null,
    dispatcherInvoiceUploadedAt: "",
    dispatcherInvoiceUploadedBy: "",
    dispatcherInvoiceUploadedByUsername: "",
    dispatcherInvoiceRecipientInfo: null,
    dispatcherInvoiceRecipientName: "",
    dispatcherInvoiceRecipientBankName: "",
    dispatcherInvoiceRecipientBankCardNo: "",
    dispatcherInvoiceRecipientIdCardNo: "",
    dispatcherInvoiceRecipientDeclarationPhone: "",
    isSettlementPaid: false,
    settlementPaidAt: "",
    settlementPaidBy: "",
    isDispatcherSettlementPaid: false,
    dispatcherSettlementPaidAt: "",
    dispatcherSettlementPaidBy: "",
    checkStatus: shouldAutoComplete ? "completed" : "pending",
    checkedAt: "",
    completedAt: shouldAutoComplete ? createdAt : "",
    completedBy: shouldAutoComplete ? "系统" : "",
    customerFeedback: "",
    serviceFeedbackImages: normalizeStoredFeedbackImages(input.serviceFeedbackImages)
  };

  return {
    ...item,
    operationHistory: []
  };
}

function buildEditableRecordUpdate(currentRecord, payload, session) {
  const current = currentRecord && typeof currentRecord === "object" ? currentRecord : {};
  const source = payload && typeof payload === "object" ? payload : {};
  const currentSettlementFields = getNormalizedRecordSettlementFields(current);
  const currentInvoiceFields = getNormalizedRecordInvoiceFields(current);
  const currentSettlementPaymentFields = getNormalizedRecordSettlementPaymentFields(current);
  const targetStatus = normalizeText(source.status, 24).toLowerCase();
  const shouldReturn = targetStatus === "returned";
  const returnedPriceSnapshot = shouldReturn ? buildReturnedPriceSnapshot(current, source.returnedPriceSnapshot) : null;
  const nextDate = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "date") ? source.date : current.date,
    32
  ) || getCurrentBeijingDate();
  const nextIsMonthlySettlement = normalizeMonthlySettlementState(
    Object.prototype.hasOwnProperty.call(source, "isMonthlySettlement")
      ? source.isMonthlySettlement
      : current.isMonthlySettlement
  );
  const nextDispatcherInput = session?.role === "dispatcher"
    ? getDispatcherTagForAccount(session.account)
    : (Object.prototype.hasOwnProperty.call(source, "dispatcher") ? source.dispatcher : current.dispatcher);
  const nextDispatcher = normalizeDispatcherTag(nextDispatcherInput) || normalizeText(nextDispatcherInput, 48);
  const nextAccountant = normalizeAccountantDisplayName(
    Object.prototype.hasOwnProperty.call(source, "accountant") ? source.accountant : current.accountant
  );
  const nextPlatform = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "platform") ? source.platform : current.platform,
    80
  );
  const nextShopName = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "shopName") ? source.shopName : current.shopName,
    160
  );
  const nextOrderNo = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "orderNo") ? source.orderNo : current.orderNo,
    120
  );
  const nextSource = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "source") ? source.source : current.source,
    120
  );
  const nextCustomer = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "customer") ? source.customer : current.customer,
    120
  );
  const nextSummary = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "summary") ? source.summary : current.summary,
    500
  );
  const nextRemark = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "remark") ? source.remark : current.remark,
    500
  );
  const nextPaymentPrice = normalizeOptionalMoneyField(
    Object.prototype.hasOwnProperty.call(source, "paymentPrice") ? source.paymentPrice : current.paymentPrice
  );
  const nextTotalPrice = normalizeOptionalMoneyField(
    Object.prototype.hasOwnProperty.call(source, "totalPrice") ? source.totalPrice : current.totalPrice
  );
  const nextSettlementPrice = normalizeOptionalMoneyField(
    Object.prototype.hasOwnProperty.call(source, "settlementPrice") ? source.settlementPrice : current.settlementPrice
  );

  const nextRecord = {
    ...current,
    ...currentSettlementFields,
    ...currentInvoiceFields,
    ...currentSettlementPaymentFields,
    date: nextDate,
    isMonthlySettlement: nextIsMonthlySettlement,
    dispatcher: nextDispatcher,
    accountant: nextAccountant,
    platform: nextPlatform,
    shopName: nextShopName,
    orderNo: nextOrderNo,
    source: nextSource,
    customer: nextCustomer,
    summary: nextSummary,
    remark: nextRemark,
    paymentPrice: nextPaymentPrice,
    totalPrice: nextTotalPrice,
    settlementPrice: nextSettlementPrice,
    serviceFeedbackImages: normalizeStoredFeedbackImages(current.serviceFeedbackImages)
  };

  if (shouldReturn) {
    return {
      ...nextRecord,
      paymentPrice: 0,
      totalPrice: 0,
      settlementPrice: 0,
      checkStatus: "returned",
      checkedAt: "",
      checkedBy: "",
      completedAt: "",
      completedBy: "",
      customerFeedback: "",
      serviceFeedbackImages: [],
      ...(returnedPriceSnapshot ? { returnedPriceSnapshot } : {}),
      returnedAt: getCurrentBeijingDateTime(),
      returnedBy: normalizeText(session?.account, 48),
      isSettled: false,
      settledAt: "",
      settledBy: "",
      settlementInvoiceImage: null,
      invoiceUploadedAt: "",
      invoiceUploadedBy: "",
      invoiceUploadedByUsername: "",
      invoiceRecipientInfo: null,
      invoiceRecipientName: "",
      invoiceRecipientBankName: "",
      invoiceRecipientBankCardNo: "",
      invoiceRecipientIdCardNo: "",
      invoiceRecipientDeclarationPhone: "",
      isSettlementPaid: false,
      settlementPaidAt: "",
      settlementPaidBy: ""
    };
  }

  return applyBuiltInAccountantCompletion(nextRecord);
}

function moneyToCents(value) {
  const amount = normalizeMoneyValue(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

function isRefundableCheckStatus(value) {
  const status = normalizeText(value, 24).toLowerCase();
  return status === "checked" || status === "completed" || status === "partial_refunded";
}

function isCompletedCheckStatus(value) {
  const status = normalizeText(value, 24).toLowerCase();
  return status === "completed" || status === "partial_refunded";
}

function resolveRefundMarkerStatus(values) {
  const sourceValues = Array.isArray(values) ? values : [];
  const hasValues = sourceValues.length > 0;
  const allZero = hasValues && sourceValues.every((value) => moneyToCents(value) === 0);
  return allZero ? "refunded" : "partial_refunded";
}

function buildRefundRecordUpdate(currentRecord, payload, session) {
  const current = currentRecord && typeof currentRecord === "object" ? currentRecord : {};
  const source = payload && typeof payload === "object" ? payload : {};
  const currentSettlementFields = getNormalizedRecordSettlementFields(current);
  const currentInvoiceFields = getNormalizedRecordInvoiceFields(current);
  const currentStatus = normalizeText(current.checkStatus, 24).toLowerCase();
  if (!isRefundableCheckStatus(currentStatus)) {
    throw new Error("当前仅支持已确认或已完成订单退款。");
  }
  if (currentSettlementFields.isSettled || currentInvoiceFields.settlementInvoiceImage) {
    throw new Error("订单已进入待上传或后续状态，请先处理发票或打款记录。");
  }

  const currentPaymentPrice = normalizeMoneyValue(current.paymentPrice);
  const currentTotalPrice = normalizeMoneyValue(current.totalPrice);
  const currentSettlementPrice = normalizeMoneyValue(current.settlementPrice);
  const isAccountantRefund = session?.role === "accountant";
  const nextTotalPrice = normalizeMoneyValue(
    Object.prototype.hasOwnProperty.call(source, "totalPrice") ? source.totalPrice : current.totalPrice
  );
  const nextSettlementPrice = normalizeMoneyValue(
    Object.prototype.hasOwnProperty.call(source, "settlementPrice") ? source.settlementPrice : current.settlementPrice
  );
  if (!Number.isFinite(currentSettlementPrice) || currentSettlementPrice < 0) {
    throw new Error("当前会计结算价无效。");
  }
  if (!Number.isFinite(nextSettlementPrice) || nextSettlementPrice < 0) {
    throw new Error("会计结算价格式无效。");
  }

  if (isAccountantRefund) {
    const currentPaymentCents = moneyToCents(currentPaymentPrice);
    if (!Number.isFinite(currentPaymentCents) || currentPaymentCents < 0) {
      throw new Error("当前付款价无效。");
    }
    if (!Number.isFinite(currentTotalPrice) || currentTotalPrice < 0) {
      throw new Error("当前会计价无效。");
    }
    if (!Number.isFinite(nextTotalPrice) || nextTotalPrice < 0) {
      throw new Error("会计价格式无效。");
    }
    const currentTotalCents = moneyToCents(currentTotalPrice);
    const currentSettlementCents = moneyToCents(currentSettlementPrice);
    const nextTotalCents = moneyToCents(nextTotalPrice);
    const nextSettlementCents = moneyToCents(nextSettlementPrice);
    if (nextTotalCents > currentTotalCents) {
      throw new Error("会计价需要小于或等于当前会计价。");
    }
    if (nextSettlementCents > currentSettlementCents) {
      throw new Error("会计结算价需要小于或等于当前会计结算价。");
    }
    if (nextTotalCents >= currentTotalCents && nextSettlementCents >= currentSettlementCents) {
      throw new Error("会计价、会计结算价至少一项需要小于原数据。");
    }
    const operatedAt = getCurrentBeijingDateTime();
    const operatedBy = normalizeText(session?.account, 48);
    const nextRefundStatus = resolveRefundMarkerStatus([nextTotalPrice, nextSettlementPrice]);
    return {
      ...current,
      ...currentSettlementFields,
      ...currentInvoiceFields,
      totalPrice: nextTotalPrice,
      settlementPrice: nextSettlementPrice,
      checkStatus: currentStatus || "pending",
      refundStatus: nextRefundStatus,
      refundedAt: operatedAt,
      refundedBy: operatedBy
    };
  }

  const nextPaymentPrice = normalizeMoneyValue(source.paymentPrice);
  if (!Number.isFinite(currentPaymentPrice) || currentPaymentPrice < 0) {
    throw new Error("当前付款价无效。");
  }
  if (!Number.isFinite(currentTotalPrice) || currentTotalPrice < 0) {
    throw new Error("当前会计价无效。");
  }
  if (!Number.isFinite(nextPaymentPrice) || nextPaymentPrice < 0) {
    throw new Error("付款价格式无效。");
  }
  if (!Number.isFinite(nextTotalPrice) || nextTotalPrice < 0) {
    throw new Error("会计价格式无效。");
  }

  const currentPaymentCents = moneyToCents(currentPaymentPrice);
  const currentTotalCents = moneyToCents(currentTotalPrice);
  const currentSettlementCents = moneyToCents(currentSettlementPrice);
  const nextPaymentCents = moneyToCents(nextPaymentPrice);
  const nextTotalCents = moneyToCents(nextTotalPrice);
  const nextSettlementCents = moneyToCents(nextSettlementPrice);
  if (nextPaymentCents > currentPaymentCents) {
    throw new Error("付款价需要小于或等于当前付款价。");
  }
  if (nextTotalCents > currentTotalCents) {
    throw new Error("会计价需要小于或等于当前会计价。");
  }
  if (nextSettlementCents > currentSettlementCents) {
    throw new Error("会计结算价需要小于或等于当前会计结算价。");
  }
  if (
    nextPaymentCents >= currentPaymentCents
    && nextTotalCents >= currentTotalCents
    && nextSettlementCents >= currentSettlementCents
  ) {
    throw new Error("付款价、会计价、会计结算价至少一项需要小于原数据。");
  }

  const operatedAt = getCurrentBeijingDateTime();
  const operatedBy = normalizeText(session?.account, 48);
  const nextRefundStatus = resolveRefundMarkerStatus([nextPaymentPrice, nextTotalPrice, nextSettlementPrice]);
  return {
    ...current,
    ...currentSettlementFields,
    ...currentInvoiceFields,
    paymentPrice: nextPaymentPrice,
    totalPrice: nextTotalPrice,
    settlementPrice: nextSettlementPrice,
    checkStatus: currentStatus || "pending",
    refundStatus: nextRefundStatus,
    refundedAt: operatedAt,
    refundedBy: operatedBy
  };
}

function isAccountantEditableRecordPayload(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const editableKeys = [
    "date",
    "isMonthlySettlement",
    "dispatcher",
    "accountant",
    "platform",
    "shopName",
    "orderNo",
    "source",
    "paymentPrice",
    "totalPrice",
    "settlementPrice"
  ];
  return editableKeys.some((key) => Object.prototype.hasOwnProperty.call(source, key));
}

async function serveHtmlFile(res, filePath, options = {}) {
  const { headOnly = false, missingMessage = "" } = options;
  try {
    const html = await fs.readFile(filePath, "utf8");
    const htmlWithRuntime = withDevLiveReload(withRuntimeConfig(
      withStaticAssetVersion(html, getStaticAssetVersion())
    ));
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Vary": "User-Agent, Sec-CH-UA-Mobile"
    });
    if (headOnly) {
      res.end();
      return;
    }
    res.end(htmlWithRuntime);
  } catch (error) {
    if (error && error.code === "ENOENT" && missingMessage) {
      sendText(res, 503, missingMessage);
      return;
    }
    throw error;
  }
}

function isMobileHtmlRequest(req) {
  const clientHintMobile = String(req.headers["sec-ch-ua-mobile"] || "").trim();
  if (clientHintMobile === "?1") {
    return true;
  }
  if (clientHintMobile === "?0") {
    return false;
  }

  const userAgent = String(req.headers["user-agent"] || "");
  return /Android|iPhone|iPod|Windows Phone|IEMobile|Opera Mini|Mobile/i.test(userAgent);
}

function getAdaptiveHtmlFile(req) {
  return isMobileHtmlRequest(req) ? MOBILE_HTML_FILE : DESKTOP_HTML_FILE;
}

async function serveHtml(req, res, options = {}) {
  await serveHtmlFile(res, getAdaptiveHtmlFile(req), {
    ...options,
    missingMessage: "生产静态资源还未生成，请先执行 npm run build。"
  });
}

async function serveRootHtmlAsset(res, pathname, options = {}) {
  const { headOnly = false } = options;
  const normalizedPathname = String(pathname || "").trim();
  if (!normalizedPathname.startsWith("/") || !normalizedPathname.toLowerCase().endsWith(".html")) {
    sendText(res, 404, "Not Found");
    return;
  }

  const relativePath = normalizedPathname.slice(1);
  if (!relativePath) {
    sendText(res, 404, "Not Found");
    return;
  }

  const filePath = path.resolve(HTML_DIR, relativePath);
  if (!isPathInDirectory(filePath, HTML_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      sendText(res, 404, "Not Found");
      return;
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendText(res, 404, "Not Found");
      return;
    }
    throw error;
  }

  await serveHtmlFile(res, filePath, { headOnly });
}

function getDefaultBuildInfo() {
  const baseVersion = String(APP_PACKAGE?.version || "1.0.0").trim() || "1.0.0";
  const betaBaseVersion = baseVersion.replace(/\.0$/, "");
  const buildNumber = 0;
  return {
    version: buildNumber > 0 ? `${betaBaseVersion}.${buildNumber}.beta` : baseVersion,
    baseVersion,
    buildNumber,
    builtAt: "",
    appEnv: APP_ENV,
    html: path.basename(SOURCE_HTML_FILE),
    desktopHtml: path.basename(SOURCE_DESKTOP_HTML_FILE),
    mobileHtml: path.basename(SOURCE_MOBILE_HTML_FILE),
    publicDir: path.basename(SOURCE_PUBLIC_DIR)
  };
}

async function serveBuildInfo(res, options = {}) {
  const { headOnly = false } = options;
  try {
    const content = await fs.readFile(BUILD_INFO_FILE, "utf8");
    const payload = {
      ...(JSON.parse(content) || {}),
      appEnv: APP_ENV
    };
    setApiCorsHeaders(res);
    if (headOnly) {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(JSON.stringify(payload));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      if (headOnly) {
        setApiCorsHeaders(res);
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        res.end();
        return;
      }
      sendJson(res, 200, getDefaultBuildInfo());
      return;
    }
    throw error;
  }
}

async function serveChangeLog(res, options = {}) {
  const { headOnly = false } = options;
  try {
    const content = await fs.readFile(CHANGE_LOG_FILE, "utf8");
    setApiCorsHeaders(res);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(headOnly ? undefined : content);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      setApiCorsHeaders(res);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(headOnly ? undefined : "[]");
      return;
    }
    throw error;
  }
}

function toStaticMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return STATIC_MIME_TYPES[ext] || "application/octet-stream";
}

function isPathInDirectory(targetPath, rootPath) {
  const normalizedRoot = `${path.resolve(rootPath)}${path.sep}`;
  const normalizedTarget = path.resolve(targetPath);
  return normalizedTarget.startsWith(normalizedRoot);
}

async function servePublicAsset(res, pathname, options = {}) {
  const { headOnly = false } = options;
  const normalizedPathname = String(pathname || "").trim();
  if (!normalizedPathname.startsWith("/public/")) {
    sendText(res, 404, "Not Found");
    return;
  }

  const relativePath = normalizedPathname.slice("/public/".length);
  if (!relativePath) {
    sendText(res, 404, "Not Found");
    return;
  }

  const filePath = path.resolve(PUBLIC_DIR, relativePath);
  if (!isPathInDirectory(filePath, PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      sendText(res, 404, "Not Found");
      return;
    }
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": toStaticMimeType(filePath),
      "Cache-Control": getPublicAssetCacheControl(),
      "Content-Length": stat.size,
      "Last-Modified": stat.mtime.toUTCString()
    });
    if (headOnly) {
      res.end();
      return;
    }
    res.end(content);
  } catch {
    sendText(res, 404, "Not Found");
  }
}

async function serveFeedbackImageAsset(res, pathname) {
  const normalizedPathname = String(pathname || "").trim();
  if (!normalizedPathname.startsWith(FEEDBACK_IMAGE_URL_PREFIX)) {
    sendText(res, 404, "Not Found");
    return;
  }

  const relativePath = normalizedPathname.slice(FEEDBACK_IMAGE_URL_PREFIX.length);
  if (!relativePath) {
    sendText(res, 404, "Not Found");
    return;
  }

  const filePath = path.resolve(FEEDBACK_IMAGE_DIR, relativePath);
  if (!isPathInDirectory(filePath, FEEDBACK_IMAGE_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      sendText(res, 404, "Not Found");
      return;
    }
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": toStaticMimeType(filePath),
      "Cache-Control": "no-store"
    });
    res.end(content);
  } catch {
    sendText(res, 404, "Not Found");
  }
}

async function serveInvoiceImageAsset(res, pathname) {
  const normalizedPathname = String(pathname || "").trim();
  if (!normalizedPathname.startsWith(INVOICE_IMAGE_URL_PREFIX)) {
    sendText(res, 404, "Not Found");
    return;
  }

  const relativePath = normalizedPathname.slice(INVOICE_IMAGE_URL_PREFIX.length);
  if (!relativePath) {
    sendText(res, 404, "Not Found");
    return;
  }

  const filePath = path.resolve(INVOICE_IMAGE_DIR, relativePath);
  if (!isPathInDirectory(filePath, INVOICE_IMAGE_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      sendText(res, 404, "Not Found");
      return;
    }
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": toStaticMimeType(filePath),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": stat.size,
      "Last-Modified": stat.mtime.toUTCString()
    });
    res.end(content);
  } catch {
    sendText(res, 404, "Not Found");
  }
}

async function serveRecords(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
  if (!session) return;

  if (req.method === "GET") {
    const records = await withWriteLock(async () => {
      const all = await readRecords();
      const migration = ensureRecordIds(all);
      const [dispatcherAccountantMappings, savedAccountants] = await Promise.all([
        readDispatcherAccountantMappings(),
        readAccountants()
      ]);
      const accountantsFromRecords = migration.records.map((item) => normalizeAccountantDisplayName(item.accountant));
      const accountants = buildAccountantProfiles(savedAccountants, accountantsFromRecords);
      const shouldUpdateAccountants = JSON.stringify(savedAccountants) !== JSON.stringify(accountants);
      if (shouldUpdateAccountants) {
        await writeAccountants(accountants);
      }
      if (migration.changed) {
        await writeRecords(migration.records);
      }
      return scopeRecordsBySession(session, migration.records, {
        includeLinkedSettlementPeers: true,
        dispatcherAccountantMappings,
        accountants
      });
    });
    sendJson(res, 200, { records });
    return;
  }

  if (req.method === "POST") {
    if (session.role === "accountant") {
      sendJson(res, 403, { error: "当前账号无权新增数据。" });
      return;
    }
    try {
      const body = await parseBody(req);
      const payload = {
        ...(body && typeof body === "object" ? body : {})
      };
      if (session.role === "dispatcher") {
        payload.dispatcher = getDispatcherTagForAccount(session.account);
      }
      const item = normalizeRecord(payload);
      const records = await withWriteLock(async () => {
        const all = await readRecords();
        const migration = ensureRecordIds(all);
        migration.records.unshift(item);
        await writeRecords(migration.records);
        return scopeRecordsBySession(session, migration.records);
      });
      sendJson(res, 201, { ok: true, item, records });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "请求参数错误" });
    }
    return;
  }

  sendJson(res, 405, { error: "方法不支持" });
}

async function serveRecordSettlement(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "boss"]);
  if (!session) return;

  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const body = await parseBody(req);
    const recordIds = Array.from(
      new Set(
        (Array.isArray(body?.recordIds) ? body.recordIds : [])
          .map((item) => normalizeText(item, 120))
          .filter(Boolean)
      )
    );
    if (!recordIds.length) {
      sendJson(res, 400, { error: "请选择要结算的数据。" });
      return;
    }

    const recordIdSet = new Set(recordIds);
    const settledAt = getCurrentBeijingDateTime();
    const settledBy = normalizeText(session.account, 48) || BOSS_LOGIN_ACCOUNT;

    const result = await withWriteLock(async () => {
      const all = await readRecords();
      const migration = ensureRecordIds(all);
      const foundRecordIds = new Set();
      const settledRecordIds = [];
      const skippedRecordIds = [];

      const nextRecords = migration.records.map((item) => {
        const current = item && typeof item === "object" ? item : {};
        const recordId = normalizeText(current.id, 120);
        if (!recordId || !recordIdSet.has(recordId)) {
          return current;
        }

        foundRecordIds.add(recordId);
        const currentSettlementFields = getNormalizedRecordSettlementFields(current);
        if (!canAccessRecord(session, current)) {
          skippedRecordIds.push(recordId);
          return {
            ...current,
            ...currentSettlementFields
          };
        }
        const checkStatus = normalizeText(current.checkStatus, 24).toLowerCase();
        if (currentSettlementFields.isSettled || !isCompletedCheckStatus(checkStatus)) {
          skippedRecordIds.push(recordId);
          return {
            ...current,
            ...currentSettlementFields
          };
        }

        const nextRecord = {
          ...current,
          ...currentSettlementFields,
          isSettled: true,
          settledAt,
          settledBy
        };
        settledRecordIds.push(recordId);
        return appendRecordHistory(nextRecord, buildRecordHistoryEntry({
          beforeRecord: {
            ...current,
            ...currentSettlementFields
          },
          afterRecord: nextRecord,
          session,
          actionKey: "settled",
          actionLabel: RECORD_HISTORY_ACTION_LABELS.settled,
          operatedAt: settledAt,
          operatedBy: settledBy
        }));
      });

      recordIds.forEach((recordId) => {
        if (!foundRecordIds.has(recordId)) {
          skippedRecordIds.push(recordId);
        }
      });

      if (migration.changed || settledRecordIds.length > 0) {
        await writeRecords(nextRecords);
      }

      return {
        records: scopeRecordsBySession(session, nextRecords),
        settledRecordIds,
        skippedRecordIds
      };
    });

    sendJson(res, 200, {
      ok: true,
      records: result.records,
      settledRecordIds: result.settledRecordIds,
      skippedRecordIds: result.skippedRecordIds
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "结算失败" });
  }
}

async function serveRecordInvoiceUpload(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["accountant"]);
  if (!session) return;

  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const body = await parseBody(req);
    const rawImage = body?.image || body?.invoiceImage || body?.settlementInvoiceImage;
    const replaceRecordIds = Array.from(
      new Set(
        (Array.isArray(body?.replaceRecordIds) ? body.replaceRecordIds : [])
          .map((item) => normalizeText(item, 120))
          .filter(Boolean)
      )
    );
    const isReplaceMode = replaceRecordIds.length > 0;
    const replaceRecordIdSet = new Set(replaceRecordIds);
    const uploadedAt = getCurrentBeijingDateTime();
    const uploadedByUsername = session.role === "accountant"
      ? normalizeAccountantUsername(session.account)
      : normalizeText(session.account, 48);
    const uploadedBy = session.role === "accountant"
      ? (getSessionAccountantDisplayName(session) || uploadedByUsername)
      : (getDispatcherDisplayNameByTag(getDispatcherTagForAccount(session.account)) || uploadedByUsername);

    const result = await withWriteLock(async () => {
      const all = await readRecords();
      const migration = ensureRecordIds(all);
      const [dispatcherAccountantMappings, savedAccountants] = await Promise.all([
        readDispatcherAccountantMappings(),
        readAccountants()
      ]);
      const accountantsFromRecords = migration.records.map((item) => normalizeAccountantDisplayName(item.accountant));
      const accountants = buildAccountantProfiles(savedAccountants, accountantsFromRecords);
      let shouldUpdateAccountants = JSON.stringify(savedAccountants) !== JSON.stringify(accountants);
      const profileIndex = resolveInvoiceRecipientProfileIndex(accountants, session, dispatcherAccountantMappings);
      const savedInvoiceRecipientInfo = profileIndex >= 0
        ? normalizeInvoiceRecipientInfo(accountants[profileIndex]?.invoiceRecipientInfo)
        : normalizeInvoiceRecipientInfo(null);
      const hasSavedInvoiceRecipientInfo = Object.values(savedInvoiceRecipientInfo).every(Boolean);
      if (!hasSavedInvoiceRecipientInfo) {
        if (shouldUpdateAccountants) {
          await writeAccountants(accountants);
        }
        if (migration.changed) {
          await writeRecords(migration.records);
        }
        return { missingInvoiceRecipientInfo: true };
      }
      const invoiceRecipientInfo = savedInvoiceRecipientInfo;
      const accessOptions = {
        includeLinkedSettlementPeers: true,
        dispatcherAccountantMappings,
        accountants
      };
      const targetIndexes = [];

      migration.records.forEach((item, index) => {
        const current = item && typeof item === "object" ? item : {};
        if (!canUploadInvoiceToRecord(session, current, accessOptions)) return;
        const settlementFields = getNormalizedRecordSettlementFields(current);
        const invoiceFields = getNormalizedRecordInvoiceFields(current);
        const dispatcherInvoiceFields = getNormalizedRecordDispatcherInvoiceFields(current);
        const uploadFieldScope = getInvoiceUploadFieldScopeForRecord(session, current, accessOptions);
        if (uploadFieldScope !== "dispatcher" && !settlementFields.isSettled) return;
        const checkStatus = normalizeText(current.checkStatus, 24).toLowerCase();
        const recordId = normalizeText(current.id, 120);
        if (isReplaceMode && (!recordId || !replaceRecordIdSet.has(recordId))) return;
        const hasTargetInvoice = uploadFieldScope === "dispatcher"
          ? dispatcherInvoiceFields.dispatcherSettlementInvoiceImage
          : invoiceFields.settlementInvoiceImage;
        if (!uploadFieldScope
          || (isReplaceMode ? !hasTargetInvoice : hasTargetInvoice)
          || !isCompletedCheckStatus(checkStatus)) return;
        targetIndexes.push(index);
      });

      if (!targetIndexes.length) {
        if (shouldUpdateAccountants) {
          await writeAccountants(accountants);
        }
        if (migration.changed) {
          await writeRecords(migration.records);
        }
        return { empty: true };
      }

      const invoiceImage = await saveSettlementInvoiceImage(rawImage, uploadedByUsername || uploadedBy);
      const uploadedRecordIds = [];
      const targetIndexSet = new Set(targetIndexes);
      const nextRecords = migration.records.map((item, index) => {
        const current = item && typeof item === "object" ? item : {};
        const settlementFields = getNormalizedRecordSettlementFields(current);
        const invoiceFields = getNormalizedRecordInvoiceFields(current);
        const dispatcherInvoiceFields = getNormalizedRecordDispatcherInvoiceFields(current);
        if (!targetIndexSet.has(index)) {
          return {
            ...current,
            ...settlementFields,
            ...invoiceFields,
            ...dispatcherInvoiceFields
          };
        }

        const beforeRecord = {
          ...current,
          ...settlementFields,
          ...invoiceFields,
          ...dispatcherInvoiceFields
        };
        const uploadFieldScope = getInvoiceUploadFieldScopeForRecord(session, current, accessOptions);
        const nextRecord = uploadFieldScope === "dispatcher"
          ? {
              ...beforeRecord,
              dispatcherSettlementInvoiceImage: invoiceImage,
              dispatcherInvoiceUploadedAt: uploadedAt,
              dispatcherInvoiceUploadedBy: uploadedBy,
              dispatcherInvoiceUploadedByUsername: uploadedByUsername,
              dispatcherInvoiceRecipientInfo: invoiceRecipientInfo,
              dispatcherInvoiceRecipientName: invoiceRecipientInfo.name,
              dispatcherInvoiceRecipientBankName: invoiceRecipientInfo.bankName,
              dispatcherInvoiceRecipientBankCardNo: invoiceRecipientInfo.bankCardNo,
              dispatcherInvoiceRecipientIdCardNo: invoiceRecipientInfo.idCardNo,
              dispatcherInvoiceRecipientDeclarationPhone: invoiceRecipientInfo.declarationPhone
            }
          : {
              ...beforeRecord,
              settlementInvoiceImage: invoiceImage,
              invoiceUploadedAt: uploadedAt,
              invoiceUploadedBy: uploadedBy,
              invoiceUploadedByUsername: uploadedByUsername,
              invoiceRecipientInfo,
              invoiceRecipientName: invoiceRecipientInfo.name,
              invoiceRecipientBankName: invoiceRecipientInfo.bankName,
              invoiceRecipientBankCardNo: invoiceRecipientInfo.bankCardNo,
              invoiceRecipientIdCardNo: invoiceRecipientInfo.idCardNo,
              invoiceRecipientDeclarationPhone: invoiceRecipientInfo.declarationPhone
            };
        const recordId = normalizeText(nextRecord.id, 120);
        if (recordId) {
          uploadedRecordIds.push(recordId);
        }
        return appendRecordHistory(nextRecord, buildRecordHistoryEntry({
          beforeRecord,
          afterRecord: nextRecord,
          session,
          actionKey: isReplaceMode ? "invoice_reuploaded" : "invoice_uploaded",
          actionLabel: isReplaceMode
            ? RECORD_HISTORY_ACTION_LABELS.invoice_reuploaded
            : RECORD_HISTORY_ACTION_LABELS.invoice_uploaded,
          operatedAt: uploadedAt,
          operatedBy: uploadedBy
        }));
      });

      if (shouldUpdateAccountants) {
        await writeAccountants(accountants);
      }
      await writeRecords(nextRecords);
      return {
        records: scopeRecordsBySession(session, nextRecords),
        uploadedRecordIds,
        invoiceImage
      };
    });

    if (result.missingInvoiceRecipientInfo) {
      sendJson(res, 400, { error: "请先录入结算申报信息。" });
      return;
    }

    if (result.empty) {
      sendJson(res, 400, {
        error: isReplaceMode
          ? "当前没有可修改的已上传发票记录。"
          : `当前没有${getRecordWorkflowStatusLabelByKey("settled")}数据可上传发票。`
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      records: result.records,
      uploadedRecordIds: result.uploadedRecordIds,
      invoiceImage: result.invoiceImage
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "发票上传失败" });
  }
}

async function serveRecordSettlementPayout(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["boss"]);
  if (!session) return;

  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const body = await parseBody(req);
    const payoutTargets = normalizePayoutTargets(body?.payoutTargets, body?.recordIds);
    if (!payoutTargets.length) {
      sendJson(res, 400, { error: "请选择要打款的数据。" });
      return;
    }

    const targetMapByRecordId = payoutTargets.reduce((map, target) => {
      const list = map.get(target.recordId) || [];
      list.push(target);
      map.set(target.recordId, list);
      return map;
    }, new Map());
    const paidAt = getCurrentBeijingDateTime();
    const paidBy = normalizeText(session.account, 48) || BOSS_LOGIN_ACCOUNT;

    const result = await withWriteLock(async () => {
      const all = await readRecords();
      const migration = ensureRecordIds(all);
      const [dispatcherAccountantMappings, savedAccountants] = await Promise.all([
        readDispatcherAccountantMappings(),
        readAccountants()
      ]);
      const accountantsFromRecords = migration.records.map((item) => normalizeAccountantDisplayName(item.accountant));
      const accountants = buildAccountantProfiles(savedAccountants, accountantsFromRecords);
      const foundRecordIds = new Set();
      const paidRecordIds = [];
      const skippedRecordIds = [];

      const nextRecords = migration.records.map((item) => {
        const current = item && typeof item === "object" ? item : {};
        const recordId = normalizeText(current.id, 120);
        const recordTargets = recordId ? (targetMapByRecordId.get(recordId) || []) : [];
        const settlementFields = getNormalizedRecordSettlementFields(current);
        const invoiceFields = getNormalizedRecordInvoiceFields(current);
        const dispatcherInvoiceFields = getNormalizedRecordDispatcherInvoiceFields(current);
        const paymentFields = getNormalizedRecordSettlementPaymentFields(current);
        const dispatcherPaymentFields = getNormalizedRecordDispatcherSettlementPaymentFields(current);
        if (!recordId || !recordTargets.length) {
          return {
            ...current,
            ...settlementFields,
            ...invoiceFields,
            ...dispatcherInvoiceFields,
            ...paymentFields,
            ...dispatcherPaymentFields
          };
        }

        foundRecordIds.add(recordId);
        const checkStatus = normalizeText(current.checkStatus, 24).toLowerCase();
        const canPayBaseRecord = canAccessRecord(session, current)
          && settlementFields.isSettled
          && isCompletedCheckStatus(checkStatus);
        const canPayAccountantTarget = canPayBaseRecord
          && (
            isRecordInvoiceUploadedByRecordAccountantOrLinkedDispatcher({
              ...current,
              ...invoiceFields
            }, {
              dispatcherAccountantMappings,
              accountants
            })
            || isRecordInvoiceOptionalForPayout(current)
          )
          && !paymentFields.isSettlementPaid;
        const shouldPayAccountantTarget = recordTargets.some((target) => target.type === "accountant");
        const canPayDispatcherTarget = canPayBaseRecord
          && isDispatcherPayoutTargetLinkedToAccountant({
            ...current,
            ...dispatcherInvoiceFields
          }, {
            dispatcherAccountantMappings,
            accountants
          })
          && isDispatcherInvoiceUploadedByAccountantOrLinkedDispatcher({
            ...current,
            ...dispatcherInvoiceFields
          }, getLinkedAccountantDisplayNameByDispatcherTag(
            normalizeDispatcherTag(current.dispatcher),
            dispatcherAccountantMappings,
            accountants
          ), {
            dispatcherAccountantMappings,
            accountants
          })
          && !dispatcherPaymentFields.isDispatcherSettlementPaid;
        const shouldPayDispatcherTarget = recordTargets.some((target) => target.type === "dispatcher");
        if (
          (!shouldPayAccountantTarget || !canPayAccountantTarget)
          && (!shouldPayDispatcherTarget || !canPayDispatcherTarget)
        ) {
          recordTargets.forEach((target) => {
            if (
              (target.type === "accountant" && !canPayAccountantTarget)
              || (target.type === "dispatcher" && !canPayDispatcherTarget)
            ) {
              skippedRecordIds.push(target.key);
            }
          });
          return {
            ...current,
            ...settlementFields,
            ...invoiceFields,
            ...dispatcherInvoiceFields,
            ...paymentFields,
            ...dispatcherPaymentFields
          };
        }

        const beforeRecord = {
          ...current,
          ...settlementFields,
          ...invoiceFields,
          ...dispatcherInvoiceFields,
          ...paymentFields,
          ...dispatcherPaymentFields
        };
        const nextRecord = {
          ...beforeRecord
        };
        if (shouldPayAccountantTarget && canPayAccountantTarget) {
          nextRecord.isSettlementPaid = true;
          nextRecord.settlementPaidAt = paidAt;
          nextRecord.settlementPaidBy = paidBy;
          paidRecordIds.push(recordId);
        } else if (shouldPayAccountantTarget) {
          skippedRecordIds.push(recordId);
        }
        if (shouldPayDispatcherTarget && canPayDispatcherTarget) {
          nextRecord.isDispatcherSettlementPaid = true;
          nextRecord.dispatcherSettlementPaidAt = paidAt;
          nextRecord.dispatcherSettlementPaidBy = paidBy;
          paidRecordIds.push(`dispatcher:${recordId}`);
        } else if (shouldPayDispatcherTarget) {
          skippedRecordIds.push(`dispatcher:${recordId}`);
        }
        return appendRecordHistory(nextRecord, buildRecordHistoryEntry({
          beforeRecord,
          afterRecord: nextRecord,
          session,
          actionKey: "settlement_paid",
          actionLabel: RECORD_HISTORY_ACTION_LABELS.settlement_paid,
          operatedAt: paidAt,
          operatedBy: paidBy
        }));
      });

      payoutTargets.forEach((target) => {
        if (!foundRecordIds.has(target.recordId)) {
          skippedRecordIds.push(target.key);
        }
      });

      if (migration.changed || paidRecordIds.length > 0) {
        await writeRecords(nextRecords);
      }

      return {
        records: scopeRecordsBySession(session, nextRecords),
        paidRecordIds,
        skippedRecordIds
      };
    });

    sendJson(res, 200, {
      ok: true,
      records: result.records,
      paidRecordIds: result.paidRecordIds,
      skippedRecordIds: result.skippedRecordIds
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "打款失败" });
  }
}

async function serveRecordSettlementPayoutRevoke(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["boss"]);
  if (!session) return;

  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const body = await parseBody(req);
    const payoutTargets = normalizePayoutTargets(body?.payoutTargets, body?.recordIds);
    if (!payoutTargets.length) {
      sendJson(res, 400, { error: "请选择要撤销打款的数据。" });
      return;
    }

      const targetMapByRecordId = payoutTargets.reduce((map, target) => {
        const list = map.get(target.recordId) || [];
        list.push(target);
        map.set(target.recordId, list);
        return map;
      }, new Map());

    const result = await withWriteLock(async () => {
      const all = await readRecords();
      const migration = ensureRecordIds(all);
      const revokedRecordIds = [];
      const skippedRecordIds = [];
      const foundRecordIds = new Set();

      const nextRecords = migration.records.map((item) => {
        const current = item && typeof item === "object" ? item : {};
        const recordId = normalizeText(current.id, 120);
        const settlementFields = getNormalizedRecordSettlementFields(current);
        const invoiceFields = getNormalizedRecordInvoiceFields(current);
        const dispatcherInvoiceFields = getNormalizedRecordDispatcherInvoiceFields(current);
        const paymentFields = getNormalizedRecordSettlementPaymentFields(current);
        const dispatcherPaymentFields = getNormalizedRecordDispatcherSettlementPaymentFields(current);
        const normalizedRecord = {
          ...current,
          ...settlementFields,
          ...invoiceFields,
          ...dispatcherInvoiceFields,
          ...paymentFields,
          ...dispatcherPaymentFields
        };
        const recordTargets = recordId ? (targetMapByRecordId.get(recordId) || []) : [];
        if (!recordId || !recordTargets.length) {
          return normalizedRecord;
        }

        foundRecordIds.add(recordId);
        if (!canAccessRecord(session, current)) {
          recordTargets.forEach((target) => skippedRecordIds.push(target.key));
          return normalizedRecord;
        }

        const shouldRevokeAccountantTarget = recordTargets.some((target) => target.type === "accountant");
        const shouldRevokeDispatcherTarget = recordTargets.some((target) => target.type === "dispatcher");
        const fieldsToRemoveFromHistory = new Set();
        const nextRecord = {
          ...normalizedRecord
        };

        if (shouldRevokeAccountantTarget && paymentFields.isSettlementPaid) {
          nextRecord.isSettlementPaid = false;
          nextRecord.settlementPaidAt = "";
          nextRecord.settlementPaidBy = "";
          revokedRecordIds.push(recordId);
          ["isSettled", "isSettlementPaid", "settlementPaidAt", "settlementPaidBy"].forEach((field) => fieldsToRemoveFromHistory.add(field));
        } else if (shouldRevokeAccountantTarget) {
          skippedRecordIds.push(recordId);
        }

        if (shouldRevokeDispatcherTarget && dispatcherPaymentFields.isDispatcherSettlementPaid) {
          nextRecord.isDispatcherSettlementPaid = false;
          nextRecord.dispatcherSettlementPaidAt = "";
          nextRecord.dispatcherSettlementPaidBy = "";
          revokedRecordIds.push(`dispatcher:${recordId}`);
          ["isDispatcherSettlementPaid", "dispatcherSettlementPaidAt", "dispatcherSettlementPaidBy"].forEach((field) => fieldsToRemoveFromHistory.add(field));
        } else if (shouldRevokeDispatcherTarget) {
          skippedRecordIds.push(`dispatcher:${recordId}`);
        }

        if (!fieldsToRemoveFromHistory.size) {
          return normalizedRecord;
        }

        const operationHistory = normalizeOperationHistory(current.operationHistory)
          .map((entry) => {
            if (normalizeText(entry?.actionKey, 32).toLowerCase() !== "settlement_paid") return entry;
            const changes = (Array.isArray(entry.changes) ? entry.changes : [])
              .filter((change) => !fieldsToRemoveFromHistory.has(normalizeText(change?.field, 64)));
            return changes.length ? { ...entry, changes } : null;
          })
          .filter(Boolean);

        return {
          ...nextRecord,
          operationHistory
        };
      });

      payoutTargets.forEach((target) => {
        if (!foundRecordIds.has(target.recordId)) {
          skippedRecordIds.push(target.key);
        }
      });

      if (migration.changed || revokedRecordIds.length > 0) {
        await writeRecords(nextRecords);
      }

      return {
        records: scopeRecordsBySession(session, nextRecords),
        revokedRecordIds,
        skippedRecordIds
      };
    });

    sendJson(res, 200, {
      ok: true,
      records: result.records,
      revokedRecordIds: result.revokedRecordIds,
      skippedRecordIds: result.skippedRecordIds
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "撤销打款失败" });
  }
}

async function serveRecordById(req, res, recordIdRaw) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "DELETE") {
    const session = await requireAuthSession(req, res, ["dispatcher", "boss"]);
    if (!session) return;
    try {
      const deletedBy = normalizeText(session.account, 48) || "未知账号";
      const recordId = normalizeText(recordIdRaw, 120);
      if (!recordId) {
        sendJson(res, 400, { error: "记录ID无效" });
        return;
      }

      const result = await withWriteLock(async () => {
        const all = await readRecords();
        const migration = ensureRecordIds(all);
        const index = migration.records.findIndex((item) => String(item.id || "") === recordId);
        if (index < 0) {
          if (migration.changed) {
            await writeRecords(migration.records);
          }
          return { found: false };
        }

        const targetRecord = migration.records[index];
        if (!canAccessRecord(session, targetRecord)) {
          if (migration.changed) {
            await writeRecords(migration.records);
          }
          return { forbidden: true };
        }

        if (!canDeleteRecord(session, targetRecord)) {
          if (migration.changed) {
            await writeRecords(migration.records);
          }
          return { deleteForbidden: true };
        }

        const [deletedRecord] = migration.records.splice(index, 1);
        const recycleBinRecords = await readRecycleBin();
        recycleBinRecords.unshift({
          recycleId: generateId("del"),
          deletedAt: getCurrentBeijingDateTime(),
          deletedBy,
          record: deletedRecord
        });

        await writeRecords(migration.records);
        await writeRecycleBin(recycleBinRecords);

        return {
          found: true,
          records: scopeRecordsBySession(session, migration.records),
          deletedRecord
        };
      });

      if (result.forbidden) {
        sendJson(res, 403, { error: "当前账号无权删除这条数据。" });
        return;
      }

      if (result.deleteForbidden) {
        sendJson(res, 403, { error: "当前状态无权删除这条数据。" });
        return;
      }

      if (!result.found) {
        sendJson(res, 404, { error: "记录不存在或已删除" });
        return;
      }

      sendJson(res, 200, { ok: true, records: result.records, deletedRecord: result.deletedRecord });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "删除失败" });
    }
    return;
  }

  if (req.method === "PATCH") {
    const session = await requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
    if (!session) return;
    try {
      const body = await parseBody(req);
      const recordId = normalizeText(recordIdRaw, 120);
      if (!recordId) {
        sendJson(res, 400, { error: "记录ID无效" });
        return;
      }

      const result = await withWriteLock(async () => {
        const all = await readRecords();
        const migration = ensureRecordIds(all);
        const index = migration.records.findIndex((item) => String(item.id || "") === recordId);
        if (index < 0) {
          if (migration.changed) {
            await writeRecords(migration.records);
          }
          return { found: false };
        }

        const current = migration.records[index] && typeof migration.records[index] === "object"
          ? migration.records[index]
          : {};
        const currentSettlementFields = getNormalizedRecordSettlementFields(current);
        if (!canAccessRecord(session, current)) {
          if (migration.changed) {
            await writeRecords(migration.records);
          }
          return { forbidden: true };
        }
        if (!canEditRecord(session, current)) {
          if (migration.changed) {
            await writeRecords(migration.records);
          }
          return { forbidden: true };
        }
        let updatedRecord;

        if (session.role === "accountant") {
          const targetStatus = normalizeText(body.status, 24).toLowerCase();
          const shouldComplete = targetStatus === "completed";
          const shouldReturn = targetStatus === "returned";
          const shouldRefund = targetStatus === "refunded" || targetStatus === "partial_refunded";
          const shouldEditRecord = isAccountantEditableRecordPayload(body);
          const operatedByUsername = normalizeAccountantUsername(session.account);
          const operatedBy = getSessionAccountantDisplayName(session) || operatedByUsername;
          const operatedAt = getCurrentBeijingDateTime();
          const completedAtInput = normalizeDateTimeValue(body.completedAt || body.completeTime || body.finishedAt);
          const customerFeedback = Object.prototype.hasOwnProperty.call(body, "customerFeedback")
            ? normalizeText(body.customerFeedback, 1000)
            : normalizeText(current.customerFeedback, 1000);
          const currentServiceFeedbackImages = normalizeStoredFeedbackImages(current.serviceFeedbackImages);

          if (shouldRefund) {
            updatedRecord = buildRefundRecordUpdate(current, body, session);
          } else if (shouldComplete) {
            const serviceFeedbackImages = Object.prototype.hasOwnProperty.call(body, "serviceFeedbackImages")
              ? await resolveFeedbackImagesForUpdate(currentServiceFeedbackImages, body.serviceFeedbackImages, recordId)
              : currentServiceFeedbackImages;
            updatedRecord = {
              ...current,
              ...currentSettlementFields,
              checkStatus: "completed",
              completedAt: completedAtInput || operatedAt,
              completedBy: operatedBy || normalizeText(current.completedBy, 48),
              customerFeedback,
              serviceFeedbackImages
            };
          } else if (shouldReturn) {
            await deleteFeedbackImageFiles(currentServiceFeedbackImages);
            const customer = Object.prototype.hasOwnProperty.call(body, "customer")
              ? normalizeText(body.customer, 120)
              : normalizeText(current.customer, 120);
            const summary = Object.prototype.hasOwnProperty.call(body, "summary")
              ? normalizeText(body.summary, 500)
              : normalizeText(current.summary, 500);
            const remark = Object.prototype.hasOwnProperty.call(body, "remark")
              ? normalizeText(body.remark, 500)
              : normalizeText(current.remark, 500);
            const returnedPriceSnapshot = buildReturnedPriceSnapshot(current, body.returnedPriceSnapshot);
            updatedRecord = {
              ...current,
              customer,
              summary,
              remark,
              paymentPrice: 0,
              totalPrice: 0,
              settlementPrice: 0,
              checkStatus: "returned",
              checkedAt: "",
              checkedBy: "",
              completedAt: "",
              completedBy: "",
              customerFeedback: "",
              serviceFeedbackImages: [],
              ...(returnedPriceSnapshot ? { returnedPriceSnapshot } : {}),
              returnedAt: operatedAt,
              returnedBy: operatedBy || normalizeText(current.returnedBy, 48),
              isSettled: false,
              settledAt: "",
              settledBy: "",
              settlementInvoiceImage: null,
              invoiceUploadedAt: "",
              invoiceUploadedBy: "",
              invoiceUploadedByUsername: "",
              invoiceRecipientInfo: null,
              invoiceRecipientName: "",
              invoiceRecipientBankName: "",
              invoiceRecipientBankCardNo: "",
              invoiceRecipientIdCardNo: "",
              invoiceRecipientDeclarationPhone: "",
              isSettlementPaid: false,
              settlementPaidAt: "",
              settlementPaidBy: ""
            };
          } else if (shouldEditRecord) {
            updatedRecord = buildEditableRecordUpdate(current, {
              ...body,
              accountant: getSessionAccountantDisplayName(session) || normalizeText(current.accountant, 120)
            }, session);
          } else {
            const customer = Object.prototype.hasOwnProperty.call(body, "customer")
              ? normalizeText(body.customer, 120)
              : normalizeText(current.customer, 120);
            const summary = Object.prototype.hasOwnProperty.call(body, "summary")
              ? normalizeText(body.summary, 500)
              : normalizeText(current.summary, 500);
            if (!customer) {
              throw new Error("客户不能为空");
            }
            if (!summary) {
              throw new Error("任务简介不能为空");
            }
            updatedRecord = {
              ...current,
              ...currentSettlementFields,
              customer,
              summary,
              checkStatus: "checked",
              checkedAt: operatedAt,
              checkedBy: operatedBy || normalizeText(current.checkedBy, 48),
              serviceFeedbackImages: currentServiceFeedbackImages
            };
          }
          const actionKey = shouldRefund
            ? "partial_refunded"
            : (shouldComplete ? "completed" : (shouldReturn ? "returned" : (shouldEditRecord ? "updated" : "checked")));
          updatedRecord = appendRecordHistory(updatedRecord, buildRecordHistoryEntry({
            beforeRecord: current,
            afterRecord: updatedRecord,
            session,
            actionKey,
            actionLabel: RECORD_HISTORY_ACTION_LABELS[actionKey] || RECORD_HISTORY_ACTION_LABELS.updated,
            operatedAt,
            operatedBy
          }));
          migration.records[index] = updatedRecord;
          await writeRecords(migration.records);

          if (operatedByUsername || operatedBy) {
            const logs = await readAccountantOperationLogs();
            logs.unshift({
              logId: generateId("alog"),
              operatedAt,
              operatedBy,
              operatedByUsername,
              actionKey,
              actionLabel: RECORD_HISTORY_ACTION_LABELS[actionKey] || RECORD_HISTORY_ACTION_LABELS.updated,
              recordId,
              date: normalizeText(updatedRecord.date, 32),
              dispatcher: normalizeText(updatedRecord.dispatcher, 48),
              accountant: normalizeText(updatedRecord.accountant, 48),
              customer: normalizeText(updatedRecord.customer, 120),
              summary: normalizeText(updatedRecord.summary, 500),
              remark: normalizeText(updatedRecord.remark, 500),
              customerFeedback: normalizeText(updatedRecord.customerFeedback, 1000),
              completedAt: normalizeDateTimeValue(updatedRecord.completedAt)
            });
            await writeAccountantOperationLogs(logs);
          }
        } else {
          const targetStatus = normalizeText(body.status, 24).toLowerCase();
          const shouldRefund = targetStatus === "refunded" || targetStatus === "partial_refunded";
          updatedRecord = shouldRefund
            ? buildRefundRecordUpdate(current, body, session)
            : buildEditableRecordUpdate(current, body, session);
          const actionKey = shouldRefund
            ? "partial_refunded"
            : (targetStatus === "returned" ? "returned" : "updated");
          updatedRecord = appendRecordHistory(updatedRecord, buildRecordHistoryEntry({
            beforeRecord: current,
            afterRecord: updatedRecord,
            session,
            actionKey,
            actionLabel: RECORD_HISTORY_ACTION_LABELS[actionKey] || RECORD_HISTORY_ACTION_LABELS.updated
          }));
          migration.records[index] = updatedRecord;
          await writeRecords(migration.records);
        }

        return {
          found: true,
          records: scopeRecordsBySession(session, migration.records),
          record: scopeRecordBySession(session, updatedRecord)
        };
      });

      if (result.forbidden) {
        sendJson(res, 403, { error: "当前账号无权更新这条数据。" });
        return;
      }

      if (!result.found) {
        sendJson(res, 404, { error: "记录不存在" });
        return;
      }

      sendJson(res, 200, { ok: true, record: result.record, records: result.records });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "更新记录失败" });
    }
    return;
  }

  sendJson(res, 405, { error: "方法不支持" });
}

async function serveRecycleBin(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
  if (!session) return;

  if (req.method === "GET") {
    const recycleBinRecords = await readRecycleBin();
    const accountantOperationLogs = await readAccountantOperationLogs();
    sendJson(res, 200, {
      recycleBinRecords: scopeRecycleBinBySession(session, recycleBinRecords),
      accountantOperationLogs: scopeAccountantOperationLogsBySession(session, accountantOperationLogs)
    });
    return;
  }

  sendJson(res, 405, { error: "方法不支持" });
}

async function serveRecycleBinRestore(req, res, recycleIdRaw) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "boss"]);
  if (!session) return;

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const recycleId = normalizeText(recycleIdRaw, 120);
    if (!recycleId) {
      sendJson(res, 400, { error: "回收站记录ID无效" });
      return;
    }

    const result = await withWriteLock(async () => {
      const allRecords = await readRecords();
      const migration = ensureRecordIds(allRecords);
      const recycleBinRecords = await readRecycleBin();
      const recycleIndex = recycleBinRecords.findIndex((item) => String(item?.recycleId || "") === recycleId);

      if (recycleIndex < 0) {
        if (migration.changed) {
          await writeRecords(migration.records);
        }
        return { found: false };
      }

      const recycleEntry = recycleBinRecords[recycleIndex];
      const rawRecord = recycleEntry && typeof recycleEntry === "object" ? recycleEntry.record : null;
      if (!rawRecord || typeof rawRecord !== "object") {
        throw new Error("回收站记录已损坏，无法还原。");
      }

      const restoredRecord = ensureRecordIds([rawRecord]).records[0];
      if (!canAccessRecord(session, restoredRecord)) {
        if (migration.changed) {
          await writeRecords(migration.records);
        }
        return { forbidden: true };
      }

      const restoredRecordId = normalizeText(restoredRecord.id, 80);
      if (!restoredRecordId) {
        throw new Error("回收站记录缺少有效ID，无法还原。");
      }
      if (migration.records.some((item) => String(item?.id || "") === restoredRecordId)) {
        throw new Error("当前数据中已存在同ID记录，无法还原。");
      }

      recycleBinRecords.splice(recycleIndex, 1);
      migration.records.unshift(restoredRecord);

      await writeRecords(migration.records);
      await writeRecycleBin(recycleBinRecords);

      return {
        found: true,
        restoredRecord,
        records: scopeRecordsBySession(session, migration.records),
        recycleBinRecords: scopeRecycleBinBySession(session, recycleBinRecords)
      };
    });

    if (result.forbidden) {
      sendJson(res, 403, { error: "当前账号无权还原这条数据。" });
      return;
    }

    if (!result.found) {
      sendJson(res, 404, { error: "回收站记录不存在" });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      restoredRecord: result.restoredRecord,
      records: result.records,
      recycleBinRecords: result.recycleBinRecords
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "还原失败" });
  }
}

async function serveAccountantOperationLogs(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
  if (!session) return;

  if (req.method === "GET") {
    const accountantOperationLogs = await readAccountantOperationLogs();
    sendJson(res, 200, {
      accountantOperationLogs: scopeAccountantOperationLogsBySession(session, accountantOperationLogs)
    });
    return;
  }

  sendJson(res, 405, { error: "方法不支持" });
}

async function serveReminders(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "boss"]);
  if (!session) return;

  if (req.method === "GET") {
    const reminders = await readReminders();
    sendJson(res, 200, { reminders });
    return;
  }

  if (req.method === "POST") {
    try {
      const body = await parseBody(req);
      const reminder = normalizeReminderEntry({
        date: body?.date,
        orderNo: body?.orderNo,
        customerWechat: body?.customerWechat,
        createdAt: getCurrentBeijingDateTime(),
        createdBy: session.account,
        createdRole: session.role
      });
      if (!reminder) {
        sendJson(res, 400, { error: "请填写日期、订单号、客户微信。" });
        return;
      }
      const reminders = await withWriteLock(async () => {
        const current = await readReminders();
        const next = [reminder, ...current];
        await writeReminders(next);
        return next;
      });
      sendJson(res, 201, { ok: true, reminder, reminders });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "新增提醒失败" });
    }
    return;
  }

  sendJson(res, 405, { error: "方法不支持" });
}

async function serveReminderById(req, res, reminderIdRaw) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "boss"]);
  if (!session) return;
  const reminderId = normalizeText(reminderIdRaw, 80);
  if (!reminderId) {
    sendJson(res, 400, { error: "提醒编号无效。" });
    return;
  }

  if (req.method === "DELETE") {
    const result = await withWriteLock(async () => {
      const current = await readReminders();
      const next = current.filter((item) => String(item.id || "").trim() !== reminderId);
      if (next.length !== current.length) {
        await writeReminders(next);
      }
      return { found: next.length !== current.length, reminders: next };
    });
    if (!result.found) {
      sendJson(res, 404, { error: "提醒不存在。" });
      return;
    }
    sendJson(res, 200, { ok: true, reminders: result.reminders });
    return;
  }

  sendJson(res, 405, { error: "方法不支持" });
}

async function serveDispatchers(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
  if (!session) return;

  if (req.method === "GET") {
    const [records, dispatcherPasswords, dispatcherAccountantMappings, savedAccountants] = await Promise.all([
      readRecords(),
      readDispatcherPasswords(),
      readDispatcherAccountantMappings(),
      readAccountants()
    ]);
    const accountantsFromRecords = Array.isArray(records)
      ? records.map((item) => normalizeAccountantDisplayName(item.accountant))
      : [];
    const accountants = buildAccountantProfiles(savedAccountants, accountantsFromRecords);
    let linkedDispatcherAccountants = {};
    if (session.role === "dispatcher") {
      const dispatcherTag = getDispatcherTagForAccount(session.account);
      const linkedName = getLinkedAccountantDisplayNameByDispatcherTag(
        dispatcherTag,
        dispatcherAccountantMappings,
        accountants
      );
      if (dispatcherTag && linkedName) {
        linkedDispatcherAccountants = { [dispatcherTag]: linkedName };
      }
    } else if (session.role === "accountant") {
      const linkedTags = getDispatcherTagsLinkedToSessionAccountant(session, dispatcherAccountantMappings);
      const currentAccountantName = getSessionAccountantDisplayName(session);
      linkedDispatcherAccountants = Object.fromEntries(
        linkedTags
          .filter(Boolean)
          .map((dispatcherTag) => [dispatcherTag, currentAccountantName])
      );
    }
    sendJson(res, 200, {
      dispatchers: session.role === "boss" ? buildDispatcherManagementRows(records, dispatcherPasswords) : [],
      dispatcherAccountantMappings: scopeDispatcherAccountantMappingsBySession(session, dispatcherAccountantMappings),
      linkedDispatcherAccountants
    });
    return;
  }

  sendJson(res, 405, { error: "方法不支持" });
}

async function serveAccountants(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
  if (!session) return;

  if (req.method === "GET") {
    const accountants = await withWriteLock(async () => {
      const result = await loadAccountantsWithMigration();
      return scopeAccountantsBySession(session, result.accountants);
    });
    sendJson(res, 200, { accountants });
    return;
  }

  if (req.method === "POST") {
    if (session.role === "accountant") {
      sendJson(res, 403, { error: "当前账号无权新增会计。" });
      return;
    }
    try {
      const body = await parseBody(req);
      const phone = normalizeAccountantPhone(body.phone || body.mobile || body.mobilePhone);
      const username = normalizeAccountantUsername(body.username || body.account || phone);
      const displayName = normalizeAccountantDisplayName(body.displayName || body.name);
      if (!username) {
        sendJson(res, 400, { error: "用户名不能为空" });
        return;
      }
      if (!displayName) {
        sendJson(res, 400, { error: "中文名不能为空" });
        return;
      }

      const result = await withWriteLock(async () => {
        const { accountants: savedAccountants, records } = await loadAccountantsWithMigration();
        ensureAccountantUsernameAvailable(username, savedAccountants);
        if (phone) {
          ensureAccountantPhoneAvailable(phone, savedAccountants);
        }
        ensureAccountantDisplayNameAvailable(displayName, savedAccountants, "中文名已存在");
        const accountantsFromRecords = records.map((item) => normalizeAccountantDisplayName(item.accountant));
        const nextProfile = normalizeAccountantProfile({
          username,
          displayName,
          alias: displayName,
          realName: body.realName,
          phone,
          loginPassword: body.password || DEFAULT_ACCOUNTANT_LOGIN_PASSWORD
        });
        const merged = buildAccountantProfiles(
          [...savedAccountants, nextProfile],
          accountantsFromRecords
        );
        await writeAccountants(merged);
        const profile = merged.find((item) => item.username === username) || null;
        return {
          accountants: scopeAccountantsBySession(session, merged),
          accountant: scopeAccountantBySession(session, profile)
        };
      });

      sendJson(res, 201, { ok: true, accountants: result.accountants, accountant: result.accountant });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "新增会计失败" });
    }
    return;
  }

  sendJson(res, 405, { error: "方法不支持" });
}

async function serveAccountantPassword(req, res, accountantUsernameRaw) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  const accountantIdentifier = normalizeText(accountantUsernameRaw, 120);
  if (!accountantIdentifier) {
    sendJson(res, 400, { error: "会计标识无效" });
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
  if (!session) return;

  try {
    const body = await parseBody(req);
    const newPassword = normalizeAccountantLoginPassword(body.newPassword);
    if (!newPassword) {
      sendJson(res, 400, { error: "新密码不能为空" });
      return;
    }

    const result = await withWriteLock(async () => {
      const { accountants } = await loadAccountantsWithMigration();
      const target = resolveAccountantByIdentifier(accountants, accountantIdentifier);
      if (!target) {
        return { notFound: true };
      }
      const accountantUsername = normalizeAccountantUsername(target.username);
      if (session.role === "accountant" && accountantUsername !== normalizeAccountantUsername(session.account)) {
        return { forbidden: true };
      }

      const index = accountants.findIndex((item) => item.username === target.username);
      if (index < 0) {
        return { notFound: true };
      }

      const nextAccountants = sortAccountantProfiles(
        accountants.map((item, itemIndex) => (
          itemIndex === index
            ? { ...item, loginPassword: newPassword }
            : item
        ))
      );
      await writeAccountants(nextAccountants);
      return {
        accountants: scopeAccountantsBySession(session, nextAccountants),
        accountant: scopeAccountantBySession(session, nextAccountants.find((item) => item.username === target.username)) || {
          username: accountantUsername,
          displayName: accountantUsername,
          name: accountantUsername,
          loginPassword: newPassword
        }
      };
    });

    if (result.forbidden) {
      sendJson(res, 403, { error: "当前账号无权修改这个会计的密码。" });
      return;
    }

    if (result.notFound) {
      sendJson(res, 404, { error: "会计不存在" });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      accountant: result.accountant,
      accountants: result.accountants
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "修改密码失败" });
  }
}

async function serveAccountantByName(req, res, accountantUsernameRaw) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const accountantIdentifier = normalizeText(accountantUsernameRaw, 120);
  if (!accountantIdentifier) {
    sendJson(res, 400, { error: "会计标识无效" });
    return;
  }

  if (req.method === "PATCH") {
    const session = await requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
    if (!session) return;
    try {
      const body = await parseBody(req);
      const result = await withWriteLock(async () => {
        const { accountants, records } = await loadAccountantsWithMigration();
        const target = resolveAccountantByIdentifier(accountants, accountantIdentifier);
        if (!target) {
          return { notFound: true };
        }

        const accountantUsername = normalizeAccountantUsername(target.username);
        const otherAccountants = accountants.filter((item) => item.username !== accountantUsername);
        const isAccountantSelfEdit = session.role === "accountant";
        if (isAccountantSelfEdit && accountantUsername !== normalizeAccountantUsername(session.account)) {
          return { forbidden: true };
        }
        const nextPhone = normalizeAccountantPhone(
          body.phone || body.mobile || body.mobilePhone || target.phone
        );
        const targetPhoneUsername = normalizeAccountantUsername(target.phone);
        const shouldFollowPhoneAsUsername = Boolean(
          targetPhoneUsername && normalizeAccountantUsername(target.username) === targetPhoneUsername
        );
        const nextUsername = isAccountantSelfEdit
          ? (shouldFollowPhoneAsUsername ? normalizeAccountantUsername(nextPhone || accountantUsername) : accountantUsername)
          : normalizeAccountantUsername(
            body.username
              || body.account
              || (shouldFollowPhoneAsUsername ? nextPhone : target.username)
          );
        const hasPassword = (
          Object.prototype.hasOwnProperty.call(body, "password")
          || Object.prototype.hasOwnProperty.call(body, "loginPassword")
        );
        const nextPassword = normalizeAccountantLoginPassword(
          hasPassword ? (body.password || body.loginPassword) : (target.loginPassword || DEFAULT_ACCOUNTANT_LOGIN_PASSWORD)
        );
        const hasInvoiceRecipientInfo = (
          Object.prototype.hasOwnProperty.call(body, "invoiceRecipientInfo")
          || Object.prototype.hasOwnProperty.call(body, "recipientInfo")
        );
        const nextInvoiceRecipientInfo = hasInvoiceRecipientInfo
          ? validateInvoiceRecipientInfo(body.invoiceRecipientInfo || body.recipientInfo)
          : (target.invoiceRecipientInfo || null);
        const invoiceRecipientOnlyUpdate = hasInvoiceRecipientInfo
          && !Object.prototype.hasOwnProperty.call(body, "phone")
          && !Object.prototype.hasOwnProperty.call(body, "mobile")
          && !Object.prototype.hasOwnProperty.call(body, "mobilePhone")
          && !Object.prototype.hasOwnProperty.call(body, "username")
          && !Object.prototype.hasOwnProperty.call(body, "account")
          && !Object.prototype.hasOwnProperty.call(body, "alias")
          && !Object.prototype.hasOwnProperty.call(body, "displayName")
          && !Object.prototype.hasOwnProperty.call(body, "nickname")
          && !Object.prototype.hasOwnProperty.call(body, "realName")
          && !Object.prototype.hasOwnProperty.call(body, "password")
          && !Object.prototype.hasOwnProperty.call(body, "loginPassword");
        const alias = normalizeAccountantAlias(body.alias || body.displayName || body.nickname);
        const preservedDisplayName = normalizeAccountantDisplayName(target.displayName) || nextUsername;
        const nextDisplayName = normalizeAccountantDisplayName(
          alias || (invoiceRecipientOnlyUpdate || session.role === "dispatcher" ? preservedDisplayName : nextUsername)
        );

        if (!nextUsername) {
          throw new Error("账号不能为空");
        }
        if (!nextPhone) {
          throw new Error("手机号不能为空");
        }
        if (!nextPassword) {
          throw new Error("密码不能为空");
        }
        if (nextUsername !== accountantUsername) {
          ensureAccountantUsernameAvailable(nextUsername, otherAccountants);
        }
        if (nextPhone !== normalizeAccountantPhone(target.phone)) {
          ensureAccountantPhoneAvailable(nextPhone, otherAccountants);
        }
        if (nextDisplayName !== normalizeAccountantDisplayName(target.displayName)) {
          ensureAccountantDisplayNameAvailable(nextDisplayName, otherAccountants, "微信名已存在");
        }

        const nextProfile = normalizeAccountantProfile({
          ...target,
          username: nextUsername,
          displayName: nextDisplayName,
          alias: invoiceRecipientOnlyUpdate ? target.alias : alias,
          realName: invoiceRecipientOnlyUpdate ? target.realName : body.realName,
          phone: nextPhone,
          loginPassword: nextPassword,
          invoiceRecipientInfo: nextInvoiceRecipientInfo
        });
        if (!nextProfile) {
          throw new Error("会计资料无效");
        }

        const previousDisplayName = normalizeAccountantDisplayName(target.displayName);
        let nextRecords = records;
        if (previousDisplayName && previousDisplayName !== nextDisplayName) {
          const operatedAt = getCurrentBeijingDateTime();
          const operatedBy = normalizeText(session.account, 48) || "系统";
          nextRecords = records.map((item) => {
            if (normalizeAccountantDisplayName(item.accountant) !== previousDisplayName) {
              return item;
            }
            const nextRecord = {
              ...item,
              accountant: nextDisplayName
            };
            return appendRecordHistory(nextRecord, buildRecordHistoryEntry({
              beforeRecord: item,
              afterRecord: nextRecord,
              session,
              actionKey: "updated",
              actionLabel: RECORD_HISTORY_ACTION_LABELS.updated,
              operatedAt,
              operatedBy
            }));
          });
          await writeRecords(nextRecords);
        }

        const accountantsFromRecords = nextRecords.map((item) => normalizeAccountantDisplayName(item.accountant));
        const merged = buildAccountantProfiles([...otherAccountants, nextProfile], accountantsFromRecords);
        await writeAccountants(merged);
        const scopedSession = isAccountantSelfEdit
          ? { ...session, account: nextProfile.username, displayName: nextProfile.displayName }
          : session;

        return {
          accountant: scopeAccountantBySession(scopedSession, merged.find((item) => item.username === nextProfile.username) || nextProfile),
          accountants: scopeAccountantsBySession(scopedSession, merged),
          records: scopeRecordsBySession(scopedSession, nextRecords),
          previousDisplayName,
          nextDisplayName
        };
      });

      if (result.forbidden) {
        sendJson(res, 403, { error: "当前账号无权修改这位会计的资料。" });
        return;
      }

      if (result.notFound) {
        sendJson(res, 404, { error: "会计不存在" });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        accountant: result.accountant,
        accountants: result.accountants,
        records: result.records,
        previousDisplayName: result.previousDisplayName,
        nextDisplayName: result.nextDisplayName
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "修改会计失败" });
    }
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher", "boss"]);
  if (!session) return;

  if (req.method !== "DELETE") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const result = await withWriteLock(async () => {
      const { accountants, records } = await loadAccountantsWithMigration();
      const target = resolveAccountantByIdentifier(accountants, accountantIdentifier);
      if (!target) {
        return { notFound: true };
      }

      const accountantUsername = normalizeAccountantUsername(target.username);
      const relatedRecordCount = records.filter(
        (item) => normalizeAccountantDisplayName(item.accountant) === normalizeAccountantDisplayName(target.displayName)
      ).length;
      if (relatedRecordCount > 0) {
        return { blocked: true, relatedRecordCount, displayName: target.displayName };
      }

      const nextAccountants = accountants.filter((item) => item.username !== accountantUsername);
      await writeAccountants(nextAccountants);
      return {
        accountants: scopeAccountantsBySession(session, nextAccountants),
        deletedUsername: scopeAccountantBySession(session, target)?.username || accountantUsername,
        deletedDisplayName: target.displayName
      };
    });

    if (result.notFound) {
      sendJson(res, 404, { error: "会计不存在" });
      return;
    }

    if (result.blocked) {
      sendJson(res, 400, { error: `会计“${result.displayName}”有 ${result.relatedRecordCount} 条数据，先处理数据后再删除` });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      accountants: result.accountants,
      deletedUsername: result.deletedUsername,
      deletedDisplayName: result.deletedDisplayName
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "删除会计失败" });
  }
}

async function serveAuthPassword(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  const session = await requireAuthSession(req, res, ["dispatcher"]);
  if (!session) return;

  const account = normalizeText(session.account, 16).toLowerCase();
  if (!isDispatcherAccount(account)) {
    sendJson(res, 403, { error: "当前账号无权修改派单密码。" });
    return;
  }

  try {
    const body = await parseBody(req);
    const newPassword = normalizeDispatcherPassword(body.newPassword);
    if (!newPassword) {
      sendJson(res, 400, { error: "新密码不能为空" });
      return;
    }

    await withWriteLock(async () => {
      const passwords = await readDispatcherPasswords();
      passwords[account] = newPassword;
      await writeDispatcherPasswords(passwords);
    });

    sendJson(res, 200, { ok: true, account, role: "dispatcher" });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "修改密码失败" });
  }
}

async function serveAuthLogout(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "退出登录失败" });
  }
}

async function serveAuthAccountantRegister(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const body = await parseBody(req);
    const phone = normalizeAccountantPhone(body.phone || body.mobile || body.mobilePhone);
    const username = normalizeAccountantUsername(phone || body.username || body.account);
    const loginPassword = normalizeAccountantLoginPassword(body.loginPassword || body.password);
    const alias = normalizeAccountantAlias(body.alias || body.displayName || body.nickname);
    const realName = normalizeAccountantRealName(body.realName || body.fullName || body.legalName);
    const displayName = normalizeAccountantDisplayName(alias || username);

    const invoiceRecipientInfoInput = body.invoiceRecipientInfo || null;
    let invoiceRecipientInfo = null;
    if (invoiceRecipientInfoInput && typeof invoiceRecipientInfoInput === "object") {
      const idCardNo = normalizeText(invoiceRecipientInfoInput.idCardNo || invoiceRecipientInfoInput.idCard || invoiceRecipientInfoInput.idNumber, 50);
      const bankName = normalizeText(invoiceRecipientInfoInput.bankName || invoiceRecipientInfoInput.bank, 100);
      const bankCardNo = normalizeText(invoiceRecipientInfoInput.bankCardNo || invoiceRecipientInfoInput.bankCard || invoiceRecipientInfoInput.bankAccount, 50);
      const declarationPhone = normalizeAccountantPhone(invoiceRecipientInfoInput.declarationPhone || invoiceRecipientInfoInput.declarationMobile || invoiceRecipientInfoInput.contactPhone);
      const recipientName = normalizeAccountantRealName(invoiceRecipientInfoInput.name || invoiceRecipientInfoInput.realName || realName);
      const hasAnyRecipientInfo = recipientName || idCardNo || bankName || bankCardNo || declarationPhone;
      if (hasAnyRecipientInfo) {
        invoiceRecipientInfo = {
          name: recipientName,
          idCardNo,
          bankName,
          bankCardNo,
          declarationPhone
        };
      }
    }

    if (!username) {
      sendJson(res, 400, { error: "账号不能为空" });
      return;
    }
    if (!loginPassword) {
      sendJson(res, 400, { error: "密码不能为空" });
      return;
    }
    if (!alias) {
      sendJson(res, 400, { error: "微信名不能为空" });
      return;
    }
    if (!phone) {
      sendJson(res, 400, { error: "手机号不能为空" });
      return;
    }

    const result = await withWriteLock(async () => {
      const { accountants: savedAccountants, records } = await loadAccountantsWithMigration();
      ensureAccountantPhoneAvailable(phone, savedAccountants);
      ensureAccountantUsernameAvailable(username, savedAccountants);
      ensureAccountantDisplayNameAvailable(
        displayName,
        savedAccountants,
        alias ? "微信名已存在" : "账号已存在或与现有微信名冲突"
      );

      const nextProfile = normalizeAccountantProfile({
        username,
        displayName,
        alias,
        realName,
        phone,
        loginPassword,
        invoiceRecipientInfo
      });
      const accountantsFromRecords = records.map((item) => normalizeAccountantDisplayName(item.accountant));
      const merged = buildAccountantProfiles(
        [...savedAccountants, nextProfile],
        accountantsFromRecords
      );
      await writeAccountants(merged);
      return merged.find((item) => item.username === username) || null;
    });

    if (!result) {
      throw new Error("注册失败");
    }

    sendJson(res, 201, {
      ok: true,
      accountant: {
        username: result.username,
        displayName: result.displayName,
        name: result.displayName,
        alias: result.alias || "",
        realName: result.realName || "",
        phone: result.phone || "",
        invoiceRecipientInfo: result.invoiceRecipientInfo || null
      }
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "注册失败" });
  }
}

async function serveAuthLogin(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const body = await parseBody(req);
    const accountInput = normalizeText(body.account, 64);
    const passwordInput = normalizeText(body.password, 64);
    const account = resolveLoginAccountInput(accountInput);
    if (!account || !passwordInput) {
      sendJson(res, 401, { error: "登录标识或密码错误。" });
      return;
    }

    const bossConfig = getBossLoginConfig(account);
    if (bossConfig) {
      if (passwordInput === normalizeText(bossConfig.password, 64)) {
        sendJson(res, 200, {
          ok: true,
          account: bossConfig.account,
          loginAccount: accountInput || bossConfig.account,
          role: "boss"
        });
        return;
      }
      sendJson(res, 401, { error: "登录标识或密码错误。" });
      return;
    }

    if (isDispatcherAccount(account)) {
      const dispatcherPasswords = await readDispatcherPasswords();
      const dispatcherPassword = normalizeDispatcherPassword(dispatcherPasswords[account]);
      if (passwordInput === dispatcherPassword) {
        sendJson(res, 200, {
          ok: true,
          account,
          loginAccount: accountInput || account,
          role: "dispatcher"
        });
        return;
      }
      sendJson(res, 401, { error: "登录标识或密码错误。" });
      return;
    }

    const accountants = await withWriteLock(async () => {
      const result = await loadAccountantsWithMigration();
      return result.accountants;
    });
    const profile = findAccountantByLoginAccount(accountants, account);
    if (!profile) {
      sendJson(res, 401, { error: "登录标识或密码错误。" });
      return;
    }
    const storedPassword = normalizeAccountantLoginPassword(profile.loginPassword);
    if (!storedPassword || storedPassword !== passwordInput) {
      sendJson(res, 401, { error: "登录标识或密码错误。" });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      account: profile.username,
      loginAccount: accountInput || profile.phone || profile.username,
      role: "accountant",
      profile: buildScopedAccountantProfile(profile)
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "登录失败" });
  }
}

async function serveAuthQuickLogins(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  try {
    const quickLogins = await buildDebugQuickLoginEntries();
    sendJson(res, 200, { quickLogins });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "读取快捷登录列表失败" });
  }
}

const server = http.createServer(async (req, res) => {
  attachRequestLogger(req, res);
  try {
    const host = req.headers.host || `127.0.0.1:${PORT}`;
    const url = new URL(req.url || "/", `http://${host}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/api/health") {
      sendJson(res, 200, { ok: true, time: getCurrentBeijingDateTime() });
      return;
    }

    if (pathname === "/api/records") {
      await serveRecords(req, res);
      return;
    }

    if (pathname === "/api/records/settle") {
      await serveRecordSettlement(req, res);
      return;
    }

    if (pathname === "/api/records/invoice") {
      await serveRecordInvoiceUpload(req, res);
      return;
    }

    if (pathname === "/api/records/payout") {
      await serveRecordSettlementPayout(req, res);
      return;
    }

    if (pathname === "/api/records/payout/revoke") {
      await serveRecordSettlementPayoutRevoke(req, res);
      return;
    }

    const recordByIdMatch = pathname.match(/^\/api\/records\/([^/]+)$/);
    if (recordByIdMatch) {
      await serveRecordById(req, res, recordByIdMatch[1]);
      return;
    }

    if (pathname === "/api/recycle-bin") {
      await serveRecycleBin(req, res);
      return;
    }

    const recycleBinRestoreMatch = pathname.match(/^\/api\/recycle-bin\/([^/]+)\/restore$/);
    if (recycleBinRestoreMatch) {
      await serveRecycleBinRestore(req, res, recycleBinRestoreMatch[1]);
      return;
    }

    if (pathname === "/api/accountant-operation-logs") {
      await serveAccountantOperationLogs(req, res);
      return;
    }

    if (pathname === "/api/reminders") {
      await serveReminders(req, res);
      return;
    }

    const reminderByIdMatch = pathname.match(/^\/api\/reminders\/([^/]+)$/);
    if (reminderByIdMatch) {
      await serveReminderById(req, res, reminderByIdMatch[1]);
      return;
    }

    if (pathname === "/api/dispatchers") {
      await serveDispatchers(req, res);
      return;
    }

    if (pathname === "/api/accountants") {
      await serveAccountants(req, res);
      return;
    }

    const accountantPasswordMatch = pathname.match(/^\/api\/accountants\/([^/]+)\/password$/);
    if (accountantPasswordMatch) {
      await serveAccountantPassword(req, res, accountantPasswordMatch[1]);
      return;
    }

    const accountantByNameMatch = pathname.match(/^\/api\/accountants\/([^/]+)$/);
    if (accountantByNameMatch) {
      await serveAccountantByName(req, res, accountantByNameMatch[1]);
      return;
    }

    if (pathname === "/api/auth/password") {
      await serveAuthPassword(req, res);
      return;
    }

    if (pathname === "/api/auth/accountant-register") {
      await serveAuthAccountantRegister(req, res);
      return;
    }

    if (pathname === "/api/auth/logout") {
      await serveAuthLogout(req, res);
      return;
    }

    if (pathname === "/api/auth/login") {
      await serveAuthLogin(req, res);
      return;
    }

    if (pathname === "/api/auth/quick-logins") {
      await serveAuthQuickLogins(req, res);
      return;
    }

    if (req.method === "GET" && pathname.startsWith(FEEDBACK_IMAGE_URL_PREFIX)) {
      await serveFeedbackImageAsset(res, pathname);
      return;
    }

    if (req.method === "GET" && pathname.startsWith(INVOICE_IMAGE_URL_PREFIX)) {
      await serveInvoiceImageAsset(res, pathname);
      return;
    }

    if (req.method === "GET" && pathname === DEV_LIVE_RELOAD_PATHNAME) {
      serveDevLiveReloadStream(req, res);
      return;
    }

    if (req.method === "GET" && pathname === FORCE_REFRESH_EVENTS_PATHNAME) {
      await serveForceRefreshEventStream(req, res);
      return;
    }

    if (pathname === FORCE_REFRESH_TRIGGER_PATHNAME) {
      await serveForceRefreshTrigger(req, res);
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && pathname.startsWith("/public/")) {
      await servePublicAsset(res, pathname, { headOnly: req.method === "HEAD" });
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && pathname === "/build-info.json") {
      await serveBuildInfo(res, { headOnly: req.method === "HEAD" });
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && pathname === "/CHANGELOG.json") {
      await serveChangeLog(res, { headOnly: req.method === "HEAD" });
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && (pathname === "/" || pathname === "/派单结算录入.html")) {
      await serveHtml(req, res, { headOnly: req.method === "HEAD" });
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && pathname.toLowerCase().endsWith(".html")) {
      await serveRootHtmlAsset(res, pathname, { headOnly: req.method === "HEAD" });
      return;
    }

    sendText(res, 404, "Not Found");
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "服务器错误" });
  }
});

async function bootstrapServer() {
  await ensureStorage();
  await loadStaticAssetVersion();

  if (IS_DEV_LIVE_RELOAD_ENABLED) {
    startDevWatchers();
  }

  server.listen(PORT, HOST, () => {
    const bootLines = [
      `Server running at http://${HOST}:${PORT}`,
      `App environment: ${APP_ENV}`,
      `Dev live reload: ${IS_DEV_LIVE_RELOAD_ENABLED ? "enabled" : "disabled"}`,
      `Data namespace: ${DATA_NAMESPACE}`,
      `Static root: ${IS_DEVELOPMENT ? ROOT_DIR : DIST_DIR}`,
      `Data root: ${DATA_DIR}`,
      `Data file: ${DATA_FILE}`,
      `Recycle bin file: ${RECYCLE_BIN_FILE}`,
      `Accountants file: ${ACCOUNTANTS_FILE}`,
      `Accountant operation log file: ${ACCOUNTANT_OPERATION_LOG_FILE}`,
      `Feedback image dir: ${FEEDBACK_IMAGE_DIR}`,
      `Invoice image dir: ${INVOICE_IMAGE_DIR}`
    ];
    bootLines.forEach((line) => {
      console.log(line);
      appendServerLogLine(line);
    });
  });
}

bootstrapServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
