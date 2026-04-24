const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);

const ROOT_DIR = __dirname;
const HTML_FILE = path.join(ROOT_DIR, "派单结算录入.html");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "records.json");
const RECYCLE_BIN_FILE = path.join(DATA_DIR, "recycle-bin.json");
const ACCOUNTANTS_FILE = path.join(DATA_DIR, "accountants.json");
const DISPATCHER_PASSWORDS_FILE = path.join(DATA_DIR, "dispatcher-passwords.json");
const ACCOUNTANT_OPERATION_LOG_FILE = path.join(DATA_DIR, "accountant-operation-logs.json");
const FEEDBACK_IMAGE_DIR = path.join(DATA_DIR, "feedback-images");
const FEEDBACK_IMAGE_URL_PREFIX = "/feedback-images/";
const SERVER_LOG_FILE = path.join(ROOT_DIR, "server.log");
const DISPATCHER_ACCOUNT_LIST = ["1", "a", "c", "e", "k"];
const DISPATCHER_ACCOUNTS = new Set(DISPATCHER_ACCOUNT_LIST);
const DISPATCHER_LOGIN_PASSWORD = "11";
const BOSS_LOGIN_ACCOUNT = "boss";
const BOSS_LOGIN_PASSWORD = "boss123";
const DEFAULT_ACCOUNTANT_LOGIN_PASSWORD = "123456";
const FEEDBACK_IMAGE_MAX_COUNT = 8;
const FEEDBACK_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const AUTH_SESSION_HEADER = "x-dispatch-session";
const DISPATCHER_LOGIN_CODE_TO_ACCOUNT = {
  "1": "1",
  a: "a",
  c: "c",
  e: "e",
  k: "k",
  "开心财税1": "1",
  "开心财税a": "a",
  "开心财税c": "c",
  "开心财税e": "e",
  "开心财税k": "k"
};

let writeQueue = Promise.resolve();
const authSessions = new Map();

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
    const line = `[${new Date().toISOString()}] ${method} ${url} ${status} ${durationMs}ms`;
    console.log(line);
    appendServerLogLine(line);
  });
}

function setApiCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Dispatch-Session");
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

async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(FEEDBACK_IMAGE_DIR, { recursive: true });
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
}

async function readRecords() {
  await ensureStorage();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function readRecycleBin() {
  await ensureStorage();
  const raw = await fs.readFile(RECYCLE_BIN_FILE, "utf8");
  const parsed = JSON.parse(raw || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function readAccountants() {
  await ensureStorage();
  const raw = await fs.readFile(ACCOUNTANTS_FILE, "utf8");
  const parsed = JSON.parse(raw || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function readDispatcherPasswords() {
  await ensureStorage();
  const raw = await fs.readFile(DISPATCHER_PASSWORDS_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return normalizeDispatcherPasswords(parsed);
}

async function readAccountantOperationLogs() {
  await ensureStorage();
  const raw = await fs.readFile(ACCOUNTANT_OPERATION_LOG_FILE, "utf8");
  const parsed = JSON.parse(raw || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function writeRecords(records) {
  await ensureStorage();
  const tempFile = `${DATA_FILE}.tmp`;
  const payload = `${JSON.stringify(records, null, 2)}\n`;
  await fs.writeFile(tempFile, payload, "utf8");
  await fs.rename(tempFile, DATA_FILE);
}

async function writeRecycleBin(recycleBinRecords) {
  await ensureStorage();
  const tempFile = `${RECYCLE_BIN_FILE}.tmp`;
  const payload = `${JSON.stringify(recycleBinRecords, null, 2)}\n`;
  await fs.writeFile(tempFile, payload, "utf8");
  await fs.rename(tempFile, RECYCLE_BIN_FILE);
}

async function writeAccountants(accountants) {
  await ensureStorage();
  const tempFile = `${ACCOUNTANTS_FILE}.tmp`;
  const payload = `${JSON.stringify(accountants, null, 2)}\n`;
  await fs.writeFile(tempFile, payload, "utf8");
  await fs.rename(tempFile, ACCOUNTANTS_FILE);
}

async function writeDispatcherPasswords(passwords) {
  await ensureStorage();
  const tempFile = `${DISPATCHER_PASSWORDS_FILE}.tmp`;
  const payload = `${JSON.stringify(normalizeDispatcherPasswords(passwords), null, 2)}\n`;
  await fs.writeFile(tempFile, payload, "utf8");
  await fs.rename(tempFile, DISPATCHER_PASSWORDS_FILE);
}

async function writeAccountantOperationLogs(logs) {
  await ensureStorage();
  const tempFile = `${ACCOUNTANT_OPERATION_LOG_FILE}.tmp`;
  const payload = `${JSON.stringify(logs, null, 2)}\n`;
  await fs.writeFile(tempFile, payload, "utf8");
  await fs.rename(tempFile, ACCOUNTANT_OPERATION_LOG_FILE);
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
      if (data.length > 1024 * 1024) {
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
  return normalizeText(value, 200);
}

function getDefaultDispatcherPasswords() {
  return DISPATCHER_ACCOUNT_LIST.reduce((result, account) => {
    result[account] = DISPATCHER_LOGIN_PASSWORD;
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

function normalizeDateTimeValue(value) {
  const source = normalizeText(value, 64);
  if (!source) return "";
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function getFeedbackImageUrl(fileName) {
  const normalizedFileName = normalizeText(fileName, 180);
  if (!normalizedFileName) return "";
  return `${FEEDBACK_IMAGE_URL_PREFIX}${encodeURIComponent(normalizedFileName)}`;
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

function normalizeAccountantUsername(value) {
  return normalizeText(value, 64);
}

function resolveLoginAccountInput(rawValue) {
  const source = normalizeText(rawValue, 64);
  if (!source) return "";
  const lower = source.toLowerCase();
  if (DISPATCHER_LOGIN_CODE_TO_ACCOUNT[lower]) {
    return DISPATCHER_LOGIN_CODE_TO_ACCOUNT[lower];
  }
  return source;
}

function isDispatcherAccount(accountName) {
  const normalized = normalizeText(accountName, 16).toLowerCase();
  return DISPATCHER_ACCOUNTS.has(normalized);
}

function isBossAccount(accountName) {
  return normalizeText(accountName, 16).toLowerCase() === BOSS_LOGIN_ACCOUNT;
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
  if (lower === "1" || lower.includes("财税1")) return "1";
  if (lower === "a" || lower.includes("财税a")) return "A";
  if (lower === "c" || lower.includes("财税c")) return "C";
  if (lower === "e" || lower.includes("财税e")) return "E";
  if (lower === "k" || lower.includes("财税k")) return "K";
  return "";
}

function getDispatcherTagForAccount(accountNameRaw) {
  const account = resolveLoginAccountInput(accountNameRaw);
  const lower = normalizeText(account, 16).toLowerCase();
  if (lower === "1") return "1";
  if (lower === "a") return "A";
  if (lower === "c") return "C";
  if (lower === "e") return "E";
  if (lower === "k") return "K";
  return "";
}

function generateSessionToken() {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 16)}`;
}

function createAuthSession(account, role, extra = {}) {
  const normalizedAccount = normalizeText(account, 64);
  const normalizedRole = normalizeLoginRole(role);
  const normalizedDisplayName = normalizeAccountantDisplayName(extra.displayName);
  const token = generateSessionToken();
  authSessions.set(token, {
    account: normalizedAccount,
    role: normalizedRole,
    displayName: normalizedDisplayName,
    createdAt: new Date().toISOString()
  });
  return token;
}

function getAuthSessionFromRequest(req) {
  const token = normalizeText(req.headers[AUTH_SESSION_HEADER], 240);
  if (!token) return null;
  const rawSession = authSessions.get(token);
  if (!rawSession || typeof rawSession !== "object") return null;
  const account = normalizeText(rawSession.account, 64);
  const role = normalizeLoginRole(rawSession.role);
  const displayName = normalizeAccountantDisplayName(rawSession.displayName);
  if (!account || !role) return null;
  return { token, account, role, displayName };
}

function getSessionAccountantDisplayName(session) {
  return normalizeAccountantDisplayName(session?.displayName || session?.account);
}

function requireAuthSession(req, res, allowedRoles = []) {
  const session = getAuthSessionFromRequest(req);
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

function canAccessRecord(session, record) {
  if (!session || !record || typeof record !== "object") return false;
  if (session.role === "boss") return true;
  if (session.role === "dispatcher") {
    const accountTag = getDispatcherTagForAccount(session.account);
    const recordTag = normalizeDispatcherTag(record.dispatcher);
    return Boolean(accountTag && recordTag && accountTag === recordTag);
  }
  if (session.role === "accountant") {
    return normalizeAccountantDisplayName(record.accountant) === getSessionAccountantDisplayName(session);
  }
  return false;
}

function scopeRecordsBySession(session, sourceRecords) {
  return sourceRecords.filter((item) => canAccessRecord(session, item));
}

function scopeRecycleBinBySession(session, sourceEntries) {
  return sourceEntries.filter((entry) => {
    const record = entry && typeof entry === "object" ? (entry.record || {}) : {};
    return canAccessRecord(session, record);
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
  return sourceLogs.filter((entry) => canAccessAccountantOperationLog(session, entry));
}

function scopeAccountantsBySession(session, sourceAccountants) {
  if (!session || session.role === "boss" || session.role === "dispatcher") {
    return sourceAccountants;
  }
  return sourceAccountants.filter(
    (item) => normalizeAccountantUsername(item?.username || item?.name) === normalizeAccountantUsername(session.account)
  );
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
          loginPassword: ""
        }
      : null;
  }
  if (!raw || typeof raw !== "object") return null;
  const username = normalizeAccountantUsername(
    raw.username || raw.loginName || raw.account || raw.name
  );
  const displayName = normalizeAccountantDisplayName(
    raw.displayName || raw.chineseName || raw.cnName || raw.name || raw.username
  );
  if (!username || !displayName) return null;
  const loginPassword = normalizeAccountantLoginPassword(
    raw.loginPassword || raw.password
  );
  return {
    username,
    displayName,
    name: displayName,
    loginPassword
  };
}

function generateRandomSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateUniqueSixDigitCode(usedCodes, errorMessage) {
  for (let i = 0; i < 10000; i += 1) {
    const code = generateRandomSixDigitCode();
    if (!usedCodes.has(code)) {
      return code;
    }
  }
  throw new Error(errorMessage);
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
    const current = byUsername.get(profile.username);
    if (!current) {
      byUsername.set(profile.username, profile);
      return;
    }
    const merged = {
      ...current,
      displayName: current.displayName || profile.displayName || current.username,
      name: current.displayName || profile.displayName || current.username,
      loginPassword: current.loginPassword || profile.loginPassword || ""
    };
    byUsername.set(profile.username, merged);
  });

  namesFromRecords.forEach((rawDisplayName) => {
    const displayName = normalizeAccountantDisplayName(rawDisplayName);
    if (!displayName) return;
    const exists = Array.from(byUsername.values()).some(
      (profile) => normalizeAccountantDisplayName(profile.displayName) === displayName
    );
    if (!exists) {
      byUsername.set(displayName, {
        username: displayName,
        displayName,
        name: displayName,
        loginPassword: ""
      });
    }
  });

  const profiles = sortAccountantProfiles(Array.from(byUsername.values()));

  profiles.forEach((profile) => {
    profile.name = profile.displayName;
    if (!profile.loginPassword) {
      profile.loginPassword = DEFAULT_ACCOUNTANT_LOGIN_PASSWORD;
    }
  });

  return profiles;
}
function generateId(prefix = "rec") {
  const ts = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}${random}`;
}

function ensureRecordIds(sourceRecords) {
  let changed = false;
  const records = sourceRecords.map((item) => {
    if (item && typeof item === "object" && normalizeText(item.id, 80)) {
      return item;
    }
    changed = true;
    return {
      ...(item && typeof item === "object" ? item : {}),
      id: generateId("rec")
    };
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
  const item = {
    id: generateId("rec"),
    createdAt: new Date().toISOString(),
    date: normalizeText(input.date, 32),
    dispatcher: normalizeDispatcherTag(input.dispatcher) || normalizeText(input.dispatcher, 48),
    accountant: normalizeText(input.accountant, 48),
    platform: normalizeText(input.platform, 80),
    shopName: normalizeText(input.shopName, 160),
    orderNo: normalizeText(input.orderNo, 120),
    source: normalizeText(input.source, 120),
    customer: normalizeText(input.customer, 120),
    summary: normalizeText(input.summary, 500),
    paymentPrice: Number(input.paymentPrice),
    totalPrice: Number(input.totalPrice),
    settlementPrice: Number(input.settlementPrice),
    checkStatus: "pending",
    checkedAt: "",
    serviceFeedbackImages: normalizeStoredFeedbackImages(input.serviceFeedbackImages)
  };

  if (!item.date) {
    item.date = new Date().toISOString().slice(0, 10);
  }

  if (!item.dispatcher) {
    throw new Error("派单人不能为空");
  }
  if (!item.accountant) {
    throw new Error("会计不能为空");
  }
  if (!Number.isFinite(item.paymentPrice) || item.paymentPrice < 0) {
    throw new Error("付款价格式错误");
  }
  if (!Number.isFinite(item.totalPrice) || item.totalPrice < 0) {
    throw new Error("会计价格式错误");
  }
  if (!Number.isFinite(item.settlementPrice) || item.settlementPrice < 0) {
    throw new Error("结算价格式错误");
  }

  return item;
}

function buildEditableRecordUpdate(currentRecord, payload, session) {
  const current = currentRecord && typeof currentRecord === "object" ? currentRecord : {};
  const source = payload && typeof payload === "object" ? payload : {};
  const targetStatus = normalizeText(source.status, 24).toLowerCase();
  const shouldReturn = targetStatus === "returned";
  const nextDate = normalizeText(
    Object.prototype.hasOwnProperty.call(source, "date") ? source.date : current.date,
    32
  ) || new Date().toISOString().slice(0, 10);
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
  const nextPaymentPrice = Number(
    Object.prototype.hasOwnProperty.call(source, "paymentPrice") ? source.paymentPrice : current.paymentPrice
  );
  const nextTotalPrice = Number(
    Object.prototype.hasOwnProperty.call(source, "totalPrice") ? source.totalPrice : current.totalPrice
  );
  const nextSettlementPrice = Number(
    Object.prototype.hasOwnProperty.call(source, "settlementPrice") ? source.settlementPrice : current.settlementPrice
  );

  if (!nextDispatcher) {
    throw new Error("派单人不能为空");
  }
  if (!nextAccountant) {
    throw new Error("会计不能为空");
  }
  if (!Number.isFinite(nextPaymentPrice) || nextPaymentPrice < 0) {
    throw new Error("付款价格式错误");
  }
  if (!Number.isFinite(nextTotalPrice) || nextTotalPrice < 0) {
    throw new Error("会计价格式错误");
  }
  if (!Number.isFinite(nextSettlementPrice) || nextSettlementPrice < 0) {
    throw new Error("结算价格式错误");
  }

  const nextRecord = {
    ...current,
    date: nextDate,
    dispatcher: nextDispatcher,
    accountant: nextAccountant,
    platform: nextPlatform,
    shopName: nextShopName,
    orderNo: nextOrderNo,
    source: nextSource,
    customer: nextCustomer,
    summary: nextSummary,
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
      returnedAt: new Date().toISOString(),
      returnedBy: normalizeText(session?.account, 48)
    };
  }

  return nextRecord;
}

async function serveHtml(res) {
  const html = await fs.readFile(HTML_FILE, "utf8");
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(html);
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

async function servePublicAsset(res, pathname) {
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
      "Cache-Control": "no-store"
    });
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

async function serveRecords(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
  if (!session) return;

  if (req.method === "GET") {
    const records = await withWriteLock(async () => {
      const all = await readRecords();
      const migration = ensureRecordIds(all);
      if (migration.changed) {
        await writeRecords(migration.records);
      }
      return scopeRecordsBySession(session, migration.records);
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

async function serveRecordById(req, res, recordIdRaw) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "DELETE") {
    const session = requireAuthSession(req, res, ["dispatcher", "boss"]);
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

        const [deletedRecord] = migration.records.splice(index, 1);
        const recycleBinRecords = await readRecycleBin();
        recycleBinRecords.unshift({
          recycleId: generateId("del"),
          deletedAt: new Date().toISOString(),
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
    const session = requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
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
        if (!canAccessRecord(session, current)) {
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
          const operatedByUsername = normalizeAccountantUsername(session.account);
          const operatedBy = getSessionAccountantDisplayName(session) || operatedByUsername;
          const operatedAt = new Date().toISOString();
          const completedAtInput = normalizeDateTimeValue(body.completedAt || body.completeTime || body.finishedAt);
          const customerFeedback = Object.prototype.hasOwnProperty.call(body, "customerFeedback")
            ? normalizeText(body.customerFeedback, 1000)
            : normalizeText(current.customerFeedback, 1000);
          const currentServiceFeedbackImages = normalizeStoredFeedbackImages(current.serviceFeedbackImages);

          if (shouldComplete) {
            const serviceFeedbackImages = Object.prototype.hasOwnProperty.call(body, "serviceFeedbackImages")
              ? await resolveFeedbackImagesForUpdate(currentServiceFeedbackImages, body.serviceFeedbackImages, recordId)
              : currentServiceFeedbackImages;
            updatedRecord = {
              ...current,
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
            updatedRecord = {
              ...current,
              customer,
              summary,
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
              returnedAt: operatedAt,
              returnedBy: operatedBy || normalizeText(current.returnedBy, 48)
            };
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
              throw new Error("简介不能为空");
            }
            updatedRecord = {
              ...current,
              customer,
              summary,
              checkStatus: "checked",
              checkedAt: operatedAt,
              checkedBy: operatedBy || normalizeText(current.checkedBy, 48),
              serviceFeedbackImages: currentServiceFeedbackImages
            };
          }

          migration.records[index] = updatedRecord;
          await writeRecords(migration.records);

          if (operatedByUsername || operatedBy) {
            const logs = await readAccountantOperationLogs();
            logs.unshift({
              logId: generateId("alog"),
              operatedAt,
              operatedBy,
              operatedByUsername,
              actionKey: shouldComplete ? "completed" : (shouldReturn ? "returned" : "checked"),
              actionLabel: shouldComplete ? "完成" : (shouldReturn ? "退单" : "核对"),
              recordId,
              date: normalizeText(updatedRecord.date, 32),
              dispatcher: normalizeText(updatedRecord.dispatcher, 48),
              accountant: normalizeText(updatedRecord.accountant, 48),
              customer: normalizeText(updatedRecord.customer, 120),
              summary: normalizeText(updatedRecord.summary, 500),
              customerFeedback: normalizeText(updatedRecord.customerFeedback, 1000),
              completedAt: normalizeDateTimeValue(updatedRecord.completedAt)
            });
            await writeAccountantOperationLogs(logs);
          }
        } else {
          updatedRecord = buildEditableRecordUpdate(current, body, session);
          migration.records[index] = updatedRecord;
          await writeRecords(migration.records);
        }

        return {
          found: true,
          records: scopeRecordsBySession(session, migration.records),
          record: updatedRecord
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

  const session = requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
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

async function serveAccountantOperationLogs(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
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

async function serveAccountants(req, res) {
  if (req.method === "OPTIONS") {
    setApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const session = requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
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
      const username = normalizeAccountantUsername(body.username || body.account);
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
        if (savedAccountants.some((item) => normalizeAccountantUsername(item.username) === username)) {
          throw new Error("用户名已存在");
        }
        if (savedAccountants.some((item) => normalizeAccountantDisplayName(item.displayName) === displayName)) {
          throw new Error("中文名已存在");
        }
        const accountantsFromRecords = records.map((item) => normalizeAccountantDisplayName(item.accountant));
        const merged = buildAccountantProfiles(
          [...savedAccountants, { username, displayName, loginPassword: DEFAULT_ACCOUNTANT_LOGIN_PASSWORD }],
          accountantsFromRecords
        );
        await writeAccountants(merged);
        const profile = merged.find((item) => item.username === username) || null;
        return {
          accountants: scopeAccountantsBySession(session, merged),
          accountant: profile
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

  const accountantUsername = normalizeAccountantUsername(accountantUsernameRaw);
  if (!accountantUsername) {
    sendJson(res, 400, { error: "会计用户名无效" });
    return;
  }

  const session = requireAuthSession(req, res, ["dispatcher", "accountant", "boss"]);
  if (!session) return;
  if (session.role === "accountant" && accountantUsername !== normalizeAccountantUsername(session.account)) {
    sendJson(res, 403, { error: "当前账号无权修改这个会计的密码。" });
    return;
  }

  try {
    const body = await parseBody(req);
    const newPassword = normalizeAccountantLoginPassword(body.newPassword);
    if (!newPassword) {
      sendJson(res, 400, { error: "新密码不能为空" });
      return;
    }

    const result = await withWriteLock(async () => {
      const { accountants } = await loadAccountantsWithMigration();
      const index = accountants.findIndex((item) => item.username === accountantUsername);
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
        accountant: nextAccountants.find((item) => item.username === accountantUsername) || {
          username: accountantUsername,
          displayName: accountantUsername,
          name: accountantUsername,
          loginPassword: newPassword
        }
      };
    });

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

  if (req.method !== "DELETE") {
    sendJson(res, 405, { error: "方法不支持" });
    return;
  }

  const accountantUsername = normalizeAccountantUsername(accountantUsernameRaw);
  if (!accountantUsername) {
    sendJson(res, 400, { error: "会计用户名无效" });
    return;
  }

  const session = requireAuthSession(req, res, ["dispatcher", "boss"]);
  if (!session) return;

  try {
    const result = await withWriteLock(async () => {
      const { accountants, records } = await loadAccountantsWithMigration();
      const target = accountants.find((item) => item.username === accountantUsername);
      if (!target) {
        return { notFound: true };
      }

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
        deletedUsername: accountantUsername,
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

  const session = requireAuthSession(req, res, ["dispatcher"]);
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
      sendJson(res, 401, { error: "账号或密码错误。" });
      return;
    }

    if (isBossAccount(account)) {
      if (passwordInput === BOSS_LOGIN_PASSWORD) {
        const sessionToken = createAuthSession(BOSS_LOGIN_ACCOUNT, "boss");
        sendJson(res, 200, { ok: true, account: BOSS_LOGIN_ACCOUNT, role: "boss", sessionToken });
        return;
      }
      sendJson(res, 401, { error: "账号或密码错误。" });
      return;
    }

    if (isDispatcherAccount(account)) {
      const dispatcherPasswords = await readDispatcherPasswords();
      const dispatcherPassword = normalizeDispatcherPassword(dispatcherPasswords[account]);
      if (passwordInput === dispatcherPassword) {
        const sessionToken = createAuthSession(account, "dispatcher");
        sendJson(res, 200, { ok: true, account, role: "dispatcher", sessionToken });
        return;
      }
      sendJson(res, 401, { error: "账号或密码错误。" });
      return;
    }

    const accountants = await withWriteLock(async () => {
      const result = await loadAccountantsWithMigration();
      return result.accountants;
    });
    const profile = accountants.find((item) => normalizeAccountantUsername(item.username || item.name) === account);
    if (!profile) {
      sendJson(res, 401, { error: "账号或密码错误。" });
      return;
    }
    const storedPassword = normalizeAccountantLoginPassword(profile.loginPassword);
    if (!storedPassword || storedPassword !== passwordInput) {
      sendJson(res, 401, { error: "账号或密码错误。" });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      account: profile.username,
      role: "accountant",
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        name: profile.displayName
      },
      sessionToken: createAuthSession(profile.username, "accountant", { displayName: profile.displayName })
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "登录失败" });
  }
}

const server = http.createServer(async (req, res) => {
  attachRequestLogger(req, res);
  try {
    const host = req.headers.host || `127.0.0.1:${PORT}`;
    const url = new URL(req.url || "/", `http://${host}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/api/health") {
      sendJson(res, 200, { ok: true, time: new Date().toISOString() });
      return;
    }

    if (pathname === "/api/records") {
      await serveRecords(req, res);
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

    if (pathname === "/api/accountant-operation-logs") {
      await serveAccountantOperationLogs(req, res);
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

    if (pathname === "/api/auth/login") {
      await serveAuthLogin(req, res);
      return;
    }

    if (req.method === "GET" && pathname.startsWith(FEEDBACK_IMAGE_URL_PREFIX)) {
      await serveFeedbackImageAsset(res, pathname);
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/public/")) {
      await servePublicAsset(res, pathname);
      return;
    }

    if (req.method === "GET" && (pathname === "/" || pathname === "/派单结算录入.html")) {
      await serveHtml(res);
      return;
    }

    sendText(res, 404, "Not Found");
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "服务器错误" });
  }
});

server.listen(PORT, HOST, () => {
  const bootLines = [
    `Server running at http://${HOST}:${PORT}`,
    `Data file: ${DATA_FILE}`,
    `Recycle bin file: ${RECYCLE_BIN_FILE}`,
    `Accountants file: ${ACCOUNTANTS_FILE}`,
    `Accountant operation log file: ${ACCOUNTANT_OPERATION_LOG_FILE}`,
    `Feedback image dir: ${FEEDBACK_IMAGE_DIR}`
  ];
  bootLines.forEach((line) => {
    console.log(line);
    appendServerLogLine(line);
  });
});
