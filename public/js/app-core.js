// Core: constants, DOM refs, runtime state, account/role helpers.
const API_BASE =
  window.location.protocol === "file:" ? "http://127.0.0.1:3000" : "";
const API_ENDPOINT_RECORDS = `${API_BASE}/api/records`;
const API_ENDPOINT_RECORDS_SETTLE = `${API_ENDPOINT_RECORDS}/settle`;
const API_ENDPOINT_RECORDS_INVOICE = `${API_ENDPOINT_RECORDS}/invoice`;
const API_ENDPOINT_RECORDS_PAYOUT = `${API_ENDPOINT_RECORDS}/payout`;
const API_ENDPOINT_RECORDS_PAYOUT_REVOKE = `${API_ENDPOINT_RECORDS}/payout/revoke`;
const API_ENDPOINT_ACCOUNTANTS = `${API_BASE}/api/accountants`;
const API_ENDPOINT_DISPATCHERS = `${API_BASE}/api/dispatchers`;
const API_ENDPOINT_RECYCLE_BIN = `${API_BASE}/api/recycle-bin`;
const API_ENDPOINT_ACCOUNTANT_OPERATION_LOGS = `${API_BASE}/api/accountant-operation-logs`;
const API_ENDPOINT_REMINDERS = `${API_BASE}/api/reminders`;
const API_ENDPOINT_BUILD_INFO = `${API_BASE}/build-info.json`;
const API_ENDPOINT_CHANGE_LOG = `${API_BASE}/CHANGELOG.json`;
const API_ENDPOINT_AUTH_ACCOUNTANT_REGISTER = `${API_BASE}/api/auth/accountant-register`;
const API_ENDPOINT_AUTH_LOGIN = `${API_BASE}/api/auth/login`;
const API_ENDPOINT_AUTH_PASSWORD = `${API_BASE}/api/auth/password`;
const API_ENDPOINT_AUTH_QUICK_LOGINS = `${API_BASE}/api/auth/quick-logins`;
const STATIC_ASSET_VERSION = String(
  window.__STATIC_ASSET_VERSION__ || "",
).trim();
const ECHARTS_ASSET_URL = "./public/vendor/echarts.min.js";
const STORAGE_KEY_ACCOUNT = "dispatch_current_account_v1";
const STORAGE_KEY_ACCOUNT_ROLE = "dispatch_current_account_role_v1";
const STORAGE_KEY_ACCOUNT_DISPLAY_NAME =
  "dispatch_current_account_display_name_v1";
const STORAGE_KEY_ACCOUNT_REAL_NAME = "dispatch_current_account_real_name_v1";
const STORAGE_KEY_ACCOUNT_PHONE = "dispatch_current_account_phone_v1";
const STORAGE_KEY_LOGIN_ACCOUNT = "dispatch_current_login_account_v1";
const STORAGE_KEY_SAVED_LOGINS = "dispatch_saved_logins_v1";
const STORAGE_KEY_DEV_TODO_ITEMS = "dispatch_dev_todo_items_v1";
const STORAGE_KEY_VIEW_STATE = "dispatch_view_state_v1";
const STORAGE_KEY_SETTLEMENT_SCHEDULE_COLLAPSED =
  "dispatch_settlement_schedule_collapsed_v1";
const STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX =
  "dispatch_updated_row_dismissed_v1";
const STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX =
  "dispatch_updated_row_highlight_v1";
const DISPATCHER_LOGIN_PASSWORD = "11";
const BOSS_LOGIN_ACCOUNT = "开心";
const BOSS_LOGIN_LEGACY_ACCOUNT = "boss";
const BOSS_LOGIN_ACCOUNTS = [BOSS_LOGIN_ACCOUNT];
const BOSS_LOGIN_ACCOUNT_SET = new Set(
  BOSS_LOGIN_ACCOUNTS.map((item) =>
    String(item || "")
      .trim()
      .toLowerCase(),
  ),
);
const BOSS_LOGIN_CODE_TO_ACCOUNT = {
  [BOSS_LOGIN_ACCOUNT.toLowerCase()]: BOSS_LOGIN_ACCOUNT,
  [BOSS_LOGIN_LEGACY_ACCOUNT]: BOSS_LOGIN_ACCOUNT,
};
const TRUTHY_STATE_TEXT_VALUES = new Set(["true", "1", "yes"]);
const SETTLED_WORKFLOW_STATE_VALUES = new Set([
  "已核对客户确认/待上传",
  "已上传",
  "已上传/待结算",
  "已结算",
]);
const MONTHLY_SETTLEMENT_STATE_VALUES = new Set(["on", "是", "月结"]);
const PAID_WORKFLOW_STATE_VALUES = new Set(["已结算"]);
const SETTLEMENT_INVOICE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const NON_SETTLEMENT_ACCOUNTANT_NAME = "不结算";
const EXTERNAL_ACCOUNTANT_NAME = "外部人员";
const BUILT_IN_ACCOUNTANT_NAMES = [
  NON_SETTLEMENT_ACCOUNTANT_NAME,
  EXTERNAL_ACCOUNTANT_NAME,
];
const SOURCE_OPTIONS = ["小红书", "淘宝", "闲鱼", "抖音", "其他"];
const PLATFORM_SHOP_OPTIONS = [
  { label: "闲鱼-开心财税", platform: "闲鱼", shopName: "开心财税" },
  { label: "闲鱼-果果财税", platform: "闲鱼", shopName: "果果财税" },
  { label: "闲鱼-年年有鱼", platform: "闲鱼", shopName: "年年有鱼" },
  { label: "闲鱼-天天向上", platform: "闲鱼", shopName: "天天向上" },
  { label: "闲鱼-喜乐财税", platform: "闲鱼", shopName: "喜乐财税" },
  { label: "淘宝-开心财税", platform: "淘宝", shopName: "开心财税" },
  { label: "淘宝-轻松财税", platform: "淘宝", shopName: "轻松财税" },
  { label: "淘宝-智算财税", platform: "淘宝", shopName: "智算财税" },
  { label: "淘宝-佳和财税", platform: "淘宝", shopName: "佳和财税" },
  { label: "淘宝-全账通", platform: "淘宝", shopName: "全账通" },
  { label: "企业微信", platform: "企业微信", shopName: "企业微信" },
  { label: "其他", platform: "其他", shopName: "其他" },
];
function normalizeAppEnvironment(value) {
  return String(value || "")
    .trim()
    .toLowerCase() === "development"
    ? "development"
    : "production";
}
function getInitialAppEnvironment() {
  const explicitEnvironment = String(
    document.documentElement?.dataset?.appEnv || window.__APP_ENV__ || "",
  ).trim();
  return normalizeAppEnvironment(explicitEnvironment || "production");
}
let runtimeAppEnvironment = getInitialAppEnvironment();
let isTabScopedPersistenceEnabled = false;
const authStateStorage = window.sessionStorage;
let persistentStateStorage = window.localStorage;
let legacyPersistentStateStorage = window.sessionStorage;
let isDevTodoEnabled = false;
let isQuickLoginEnabled = false;
let isQuickLoginDebugEnabled = false;

function hasDebugQueryFlag() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    return params.has("dbg");
  } catch {
    return false;
  }
}

isQuickLoginDebugEnabled = hasDebugQueryFlag();
document.body?.classList.toggle("quick-login-debug", isQuickLoginDebugEnabled);

function isDevelopmentEnvironment() {
  return runtimeAppEnvironment === "development";
}

function isProductionEnvironment() {
  return runtimeAppEnvironment === "production";
}

function applyRuntimeEnvironment(rawEnvironment) {
  runtimeAppEnvironment = normalizeAppEnvironment(rawEnvironment);
  isTabScopedPersistenceEnabled = isDevelopmentEnvironment();
  persistentStateStorage = isTabScopedPersistenceEnabled
    ? window.sessionStorage
    : window.localStorage;
  legacyPersistentStateStorage = isTabScopedPersistenceEnabled
    ? window.localStorage
    : window.sessionStorage;
  isDevTodoEnabled = isDevelopmentEnvironment() || isQuickLoginDebugEnabled;
  isQuickLoginEnabled = isDevelopmentEnvironment() || isQuickLoginDebugEnabled;
}

applyRuntimeEnvironment(runtimeAppEnvironment);

function setAuthStateItem(key, value) {
  authStateStorage.setItem(key, value);
  window.localStorage.removeItem(key);
}

function getAuthStateItem(key) {
  const raw = authStateStorage.getItem(key);
  if (raw !== null) return raw;
  return null;
}

function removeAuthStateItem(key) {
  authStateStorage.removeItem(key);
  window.localStorage.removeItem(key);
}

function setPersistentStateItem(key, value) {
  persistentStateStorage.setItem(key, value);
  legacyPersistentStateStorage.removeItem(key);
}

function getPersistentStateItem(key) {
  const raw = persistentStateStorage.getItem(key);
  if (raw !== null) return raw;
  if (isTabScopedPersistenceEnabled) return null;
  const legacyRaw = legacyPersistentStateStorage.getItem(key);
  if (legacyRaw === null) return null;
  persistentStateStorage.setItem(key, legacyRaw);
  legacyPersistentStateStorage.removeItem(key);
  return legacyRaw;
}

function removePersistentStateItem(key) {
  persistentStateStorage.removeItem(key);
  legacyPersistentStateStorage.removeItem(key);
}

function normalizeStateFlag(value, extraTruthyValues = null) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return (
    TRUTHY_STATE_TEXT_VALUES.has(normalized) ||
    Boolean(extraTruthyValues?.has(normalized))
  );
}

const DISPATCHER_TAGS = ["1", "A", "C", "D", "E", "K", "1旧", "K旧"];
const ACCOUNT_TO_DISPATCHER_TAG = {
  1: "1",
  a: "A",
  c: "C",
  d: "D",
  e: "E",
  k: "K",
  开心财税: "开心财税",
  开心财税1旧: "1旧",
  开心财税k旧: "K旧",
  "1旧": "1旧",
  k旧: "K旧",
};
const DISPATCHER_TAG_TO_ACCOUNT = {
  1: "1",
  A: "a",
  C: "c",
  D: "d",
  E: "e",
  K: "k",
  开心财税: "开心财税",
  "1旧": "开心财税1旧",
  K旧: "开心财税k旧",
};
const DISPATCHER_ACCOUNT_DISPLAY_NAME = {
  1: "开心财税1",
  a: "开心财税a",
  c: "开心财税c",
  d: "开心财税d",
  e: "开心财税e",
  k: "开心财税k",
  开心财税: "开心财税",
  开心财税1旧: "开心财税1旧",
  开心财税k旧: "开心财税k旧",
  "1旧": "开心财税1旧",
  k旧: "开心财税k旧",
};
const DISPATCHER_LOGIN_CODE_TO_ACCOUNT = {
  1: "1",
  a: "a",
  c: "c",
  d: "d",
  e: "e",
  k: "k",
  开心财税: "开心财税",
  开心财税1旧: "开心财税1旧",
  开心财税k旧: "开心财税k旧",
  开心财税1: "1",
  开心财税a: "a",
  开心财税c: "c",
  开心财税d: "d",
  开心财税e: "e",
  开心财税k: "k",
  "1旧": "开心财税1旧",
  k旧: "开心财税k旧",
};

function getDispatcherDisplayNameByTag(dispatcherTagRaw) {
  const dispatcherTag = normalizeDispatcherTag(dispatcherTagRaw);
  if (dispatcherTag === "开心财税") return "开心财税";
  return dispatcherTag ? `开心财税${dispatcherTag.toLowerCase()}` : "";
}

function getDispatcherAccountByTag(dispatcherTag) {
  const tag = String(dispatcherTag || "").trim();
  return DISPATCHER_TAG_TO_ACCOUNT[tag] || null;
}

function getLinkedAccountantPhoneByAccount(dispatcherAccount) {
  const account = String(dispatcherAccount || "")
    .trim()
    .toLowerCase();
  const phone = dispatcherAccountantMappings[account];
  return phone ? String(phone).trim() : null;
}

function getAccountantByPhone(phone) {
  const phoneValue = String(phone || "").trim();
  if (!phoneValue) return null;
  return (
    (Array.isArray(accountants) ? accountants : []).find(
      (item) => String(item?.phone || "").trim() === phoneValue,
    ) || null
  );
}

function getLinkedAccountantByTag(dispatcherTag) {
  const account = getDispatcherAccountByTag(dispatcherTag);
  if (!account) return null;
  const phone = getLinkedAccountantPhoneByAccount(account);
  if (!phone) return null;
  return getAccountantByPhone(phone);
}

function getLinkedAccountantDisplayNameByTag(dispatcherTag) {
  const normalizedTag = normalizeDispatcherTag(dispatcherTag);
  const mappedDisplayName = String(
    linkedDispatcherAccountants?.[normalizedTag] || "",
  ).trim();
  if (mappedDisplayName) return mappedDisplayName;
  const accountant = getLinkedAccountantByTag(dispatcherTag);
  return accountant ? String(accountant?.displayName || "").trim() : null;
}

function isAccountantLinkedToDispatcher(accountantName) {
  const normalizedName = String(accountantName || "").trim();
  if (!normalizedName) return false;

  const profile =
    (Array.isArray(accountants) ? accountants : []).find((item) => {
      const displayName = String(item?.displayName || "").trim();
      const name = String(item?.name || "").trim();
      const username = String(item?.username || "").trim();
      const phone = String(item?.phone || "").trim();
      return (
        displayName === normalizedName ||
        name === normalizedName ||
        username === normalizedName ||
        phone === normalizedName
      );
    }) || null;

  if (!profile) return false;
  const phone = String(profile.phone || "").trim();
  if (!phone) return false;
  const mappingValues = Object.values(dispatcherAccountantMappings || {});
  return mappingValues.some((value) => value && String(value).trim() === phone);
}

function getDispatcherTagsLinkedToAccountant(accountantName) {
  const normalizedName = String(accountantName || "").trim();
  if (!normalizedName) return [];

  const mappedTags = Object.entries(linkedDispatcherAccountants || {})
    .filter(
      ([, displayName]) => String(displayName || "").trim() === normalizedName,
    )
    .map(([tag]) => normalizeDispatcherTag(tag))
    .filter(Boolean);
  if (mappedTags.length) {
    return Array.from(new Set(mappedTags));
  }

  const profile =
    (Array.isArray(accountants) ? accountants : []).find((item) => {
      const displayName = String(item?.displayName || "").trim();
      const name = String(item?.name || "").trim();
      const username = String(item?.username || "").trim();
      const phone = String(item?.phone || "").trim();
      return (
        displayName === normalizedName ||
        name === normalizedName ||
        username === normalizedName ||
        phone === normalizedName
      );
    }) || null;

  if (!profile) return [];
  const phone = String(profile.phone || "").trim();
  if (!phone) return [];

  const linkedTags = [];
  const mappings = dispatcherAccountantMappings || {};
  Object.keys(mappings).forEach((tag) => {
    const mappedPhone = String(mappings[tag] || "").trim();
    if (mappedPhone === phone) {
      const normalizedTag = normalizeDispatcherTag(tag);
      if (normalizedTag) {
        linkedTags.push(normalizedTag);
      }
    }
  });
  return linkedTags;
}

function getLinkedDispatcherSettlementAmount(
  accountantName,
  sourceRecords = records,
  options = {},
) {
  const dispatcherTags = getDispatcherTagsLinkedToAccountant(accountantName);
  if (!dispatcherTags.length) return null;

  const hasPaidFilter =
    options &&
    typeof options === "object" &&
    Object.prototype.hasOwnProperty.call(options, "paid");
  const paidFilter = Boolean(options?.paid);
  const includeUnsettled = Boolean(options?.includeUnsettled);
  const detailRecords = includeUnsettled
    ? (Array.isArray(sourceRecords) ? sourceRecords : []).filter((item) =>
        isRecordCompletionStatus(item),
      )
    : getBossSettlementDetailRecords(sourceRecords);
  let totalRawPremium = 0;
  let totalDispatcherPrice = 0;
  const dispatcherCommissionMap = new Map();
  let recordCount = 0;
  const recordIds = [];

  let pendingCount = 0;
  let uploadedCount = 0;
  let paidCount = 0;
  const payoutRecordIds = [];
  const payoutTargets = [];
  const revokeTargets = [];
  const paidAtValues = [];
  let latestPaidAt = "";
  let latestPaidAtTime = 0;
  const invoiceMap = new Map();
  let latestUploadedAt = "";
  let latestUploadedBy = "";

  detailRecords.forEach((record) => {
    const dispatcher = normalizeDispatcherTag(record?.dispatcher);
    if (!dispatcherTags.includes(dispatcher)) return;
    if (hasPaidFilter && isRecordDispatcherSettlementPaid(record) !== paidFilter) return;

    const recordId = String(record?.id || "").trim();
    if (recordId && !recordIds.includes(recordId)) {
      recordIds.push(recordId);
    }
    recordCount += 1;

    const isUploaded =
      isRecordDispatcherInvoiceUploaded(record) &&
      isInvoiceUploadedByAccountant(
        {
          ...record,
          settlementInvoiceImage: getDispatcherSettlementInvoiceImage(record),
          invoiceUploadedAt: record?.dispatcherInvoiceUploadedAt,
          invoiceUploadedBy: record?.dispatcherInvoiceUploadedBy,
          invoiceUploadedByUsername: record?.dispatcherInvoiceUploadedByUsername,
        },
        accountantName,
      );
    const uploadedAt = String(record?.dispatcherInvoiceUploadedAt || "").trim();
    const uploadedBy = String(
      record?.dispatcherInvoiceUploadedBy ||
        record?.dispatcherInvoiceUploadedByUsername ||
        "",
    ).trim();
    const uploadedAtTime = parseDateTimeValue(uploadedAt);
    const invoiceImage = getDispatcherSettlementInvoiceImage(record);
    const isPaid = isRecordDispatcherSettlementPaid(record);
    const paidAt = String(record?.dispatcherSettlementPaidAt || "").trim();
    const paidAtTime = parseDateTimeValue(paidAt);
    const payoutTarget = recordId ? `dispatcher:${recordId}` : "";

    if (isUploaded) {
      uploadedCount += 1;
      const currentUploadedAtTime = parseDateTimeValue(latestUploadedAt);
      if (!latestUploadedAt || uploadedAtTime >= currentUploadedAtTime) {
        latestUploadedAt = uploadedAt;
        latestUploadedBy = uploadedBy;
      }
      if (
        invoiceImage &&
        isInvoiceUploadedByAccountant(
          {
            ...record,
            settlementInvoiceImage: invoiceImage,
            invoiceUploadedAt: uploadedAt,
            invoiceUploadedBy: uploadedBy,
            invoiceUploadedByUsername: record?.dispatcherInvoiceUploadedByUsername,
          },
          accountantName,
        )
      ) {
        const invoiceKey = [
          String(invoiceImage.fileName || invoiceImage.url || "").trim(),
          uploadedAt,
          uploadedBy,
        ].join("\u0001");
        const invoiceItem = invoiceMap.get(invoiceKey) || {
          key: invoiceKey,
          image: invoiceImage,
          firstRecord: record,
          recordIds: [],
          totalSettlement: 0,
          uploadedAt,
          uploadedBy,
        };
        if (recordId) {
          invoiceItem.recordIds.push(recordId);
        }
        invoiceMap.set(invoiceKey, invoiceItem);
      }
    } else {
      pendingCount += 1;
    }

    if (isPaid) {
      paidCount += 1;
      if (payoutTarget) {
        revokeTargets.push(payoutTarget);
      }
      if (paidAt) {
        const normalizedPaidAtTime = Number.isNaN(paidAtTime) ? 0 : paidAtTime;
        paidAtValues.push(paidAt);
        if (!latestPaidAt || normalizedPaidAtTime >= latestPaidAtTime) {
          latestPaidAt = paidAt;
          latestPaidAtTime = normalizedPaidAtTime;
        }
      }
    } else if (payoutTarget) {
      payoutRecordIds.push(recordId);
      payoutTargets.push(payoutTarget);
    }

    const premium = getPremiumValue(record);
    if (Number.isFinite(premium)) {
      totalRawPremium += premium;
    }

    const totalPrice = Number(record?.totalPrice);
    const baseRate = getDispatcherBaseProfitRate(record);
    const dispatcherPrice = Number.isFinite(totalPrice)
      ? totalPrice * baseRate
      : 0;
    if (Number.isFinite(dispatcherPrice)) {
      totalDispatcherPrice += dispatcherPrice;
    }
    if (Number.isFinite(totalPrice) && Number.isFinite(baseRate)) {
      dispatcherCommissionMap.set(
        baseRate,
        (dispatcherCommissionMap.get(baseRate) || 0) + totalPrice,
      );
    }
  });

  if (recordCount === 0) return null;

  const premiumBreakdown = getTieredPremiumProfitBreakdown(totalRawPremium);
  const premiumProfit = premiumBreakdown ? premiumBreakdown.profit : Number.NaN;
  const invoiceAmount =
    Number.isFinite(premiumProfit) && Number.isFinite(totalDispatcherPrice)
      ? premiumProfit + totalDispatcherPrice
      : 0;
  const taxAmount = Number.isFinite(invoiceAmount)
    ? getSettlementTaxAmount(invoiceAmount)
    : 0;
  const payableAmount =
    Number.isFinite(invoiceAmount) && Number.isFinite(taxAmount)
      ? invoiceAmount - taxAmount
      : 0;

  return {
    dispatcherTags,
    recordIds,
    recordCount,
    pendingCount,
    uploadedCount,
    paidCount,
    payoutRecordIds,
    payoutTargets,
    revokeTargets,
    paidAtValues,
    latestPaidAt,
    latestPaidAtTime,
    latestUploadedAt,
    latestUploadedBy,
    invoiceMap,
    rawPremium: totalRawPremium,
    premium: Number.isFinite(premiumProfit) ? premiumProfit : 0,
    premiumBreakdown,
    dispatcherPrice: totalDispatcherPrice,
    dispatcherCommissionTerms: Array.from(
      dispatcherCommissionMap.entries(),
    ).map(([rate, amount]) => ({ rate, amount })),
    invoiceAmount,
    taxAmount,
    payableAmount,
  };
}

const loginPage = document.getElementById("loginPage");
const loginForm = document.getElementById("loginForm");
const appPage = document.getElementById("appPage");
const appSidebar = document.getElementById("appSidebar");
const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
const sidebarToggleIcon = document.getElementById("sidebarToggleIcon");
const settlementScheduleToggleBtn = document.getElementById("settlementScheduleToggleBtn");
const settlementScheduleToggleIcon = document.getElementById("settlementScheduleToggleIcon");
const settlementScheduleBody = document.getElementById("settlementScheduleBody");
const devTodoLauncher = document.getElementById("devTodoLauncher");
const devTodoModal = document.getElementById("devTodoModal");
const devTodoModalCard = devTodoModal
  ? devTodoModal.querySelector(".dev-todo-modal-card")
  : null;
const devTodoForm = document.getElementById("devTodoForm");
const devTodoInput = document.getElementById("devTodoInput");
const devTodoList = document.getElementById("devTodoList");
const devTodoEmptyState = document.getElementById("devTodoEmptyState");
const loginCodeInput = document.getElementById("loginCodeInput");
const loginPasswordInput = document.getElementById("loginPasswordInput");
const loginRequestHint = document.getElementById("loginRequestHint");
const appStatusHint = document.getElementById("appStatusHint");
const openAccountantRegisterBtn = document.getElementById(
  "openAccountantRegisterBtn",
);
const enterBtn = document.getElementById("enterBtn");
const savedLoginSection = document.getElementById("savedLoginSection");
const savedLoginList = document.getElementById("savedLoginList");
const accountantRegisterModal = document.getElementById(
  "accountantRegisterModal",
);
const accountantRegisterModalCard = accountantRegisterModal
  ? accountantRegisterModal.querySelector(".accountant-register-modal-card")
  : null;
const accountantRegisterForm = document.getElementById(
  "accountantRegisterForm",
);
const accountantRegisterHint = document.getElementById(
  "accountantRegisterHint",
);
const accountantRegisterPasswordInput = document.getElementById(
  "accountantRegisterPasswordInput",
);
const accountantRegisterAliasInput = document.getElementById(
  "accountantRegisterAliasInput",
);
const accountantRegisterPhoneInput = document.getElementById(
  "accountantRegisterPhoneInput",
);
const accountantRegisterSubmitBtn = document.getElementById(
  "accountantRegisterSubmitBtn",
);
const switchAccountBtn = document.getElementById("switchAccountBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const editProfileBtn = document.getElementById("editProfileBtn");
const buildInfoPanel = document.getElementById("buildInfoPanel");
const buildVersionText = document.getElementById("buildVersionText");
const buildTimeText = document.getElementById("buildTimeText");
const openChangeLogBtn = document.getElementById("openChangeLogBtn");
const headerAccountText = document.getElementById("headerAccountText");
const headerAccountSubText = document.getElementById("headerAccountSubText");
const accountRoleBadge = document.getElementById("accountRoleBadge");
const openCreateModalBtn = document.getElementById("openCreateModalBtn");
const openDataModalBtn = document.getElementById("openDataModalBtn");
const openDispatcherModalBtn = document.getElementById(
  "openDispatcherModalBtn",
);
const openAnalysisModalBtn = document.getElementById("openAnalysisModalBtn");
const openRecycleModalBtn = document.getElementById("openRecycleModalBtn");
const openAccountantModalBtn = document.getElementById(
  "openAccountantModalBtn",
);
const openReminderModalBtn = document.getElementById("openReminderModalBtn");
const accountantSortableHeaders = Array.from(
  document.querySelectorAll(".accountant-sort-btn"),
);
const dispatcherSortableHeaders = Array.from(
  document.querySelectorAll(".dispatcher-sort-btn"),
);
const createModal = document.getElementById("createModal");
const createModalCard = createModal.querySelector(".modal-card");
const recordModalTitle = document.getElementById("recordModalTitle");
const recordFormHint = document.getElementById("recordFormHint");
const checkModal = document.getElementById("checkModal");
const checkModalCard = checkModal.querySelector(".check-modal-card");
const checkFormHint = document.getElementById("checkFormHint");
const checkForm = document.getElementById("checkForm");
const checkFormSubmitBtn = checkForm
  ? checkForm.querySelector("button[type='submit']")
  : null;
const checkRecordIdInput = document.getElementById("checkRecordId");
const checkCustomerInput = document.getElementById("checkCustomer");
const checkSummaryInput = document.getElementById("checkSummary");
const completeModal = document.getElementById("completeModal");
const completeModalCard = completeModal.querySelector(".complete-modal-card");
const completeModalTitle = document.getElementById("completeModalTitle");
const completeFormHint = document.getElementById("completeFormHint");
const completeForm = document.getElementById("completeForm");
const completeRecordIdInput = document.getElementById("completeRecordId");
const completeTimeInput = document.getElementById("completeTime");
const completeCustomerFeedbackInput =
  document.getElementById("customerFeedback");
const completeModalSubmitBtn = document.getElementById(
  "completeModalSubmitBtn",
);
const refundModal = document.getElementById("refundModal");
const refundModalCard = refundModal.querySelector(".refund-modal-card");
const refundModalMeta = document.getElementById("refundModalMeta");
const refundFormHint = document.getElementById("refundFormHint");
const refundForm = document.getElementById("refundForm");
const refundFormSubmitBtn = refundForm
  ? refundForm.querySelector("button[type='submit']")
  : null;
const refundRecordIdInput = document.getElementById("refundRecordId");
const refundPaymentPriceInput = document.getElementById("refundPaymentPrice");
const refundTotalPriceInput = document.getElementById("refundTotalPrice");
const refundSettlementPriceInput = document.getElementById(
  "refundSettlementPrice",
);
const refundPremiumHint = document.getElementById("refundPremiumHint");
const recordHistoryModal = document.getElementById("recordHistoryModal");
const recordHistoryModalCard = recordHistoryModal.querySelector(
  ".record-history-modal-card",
);
const recordHistoryModalMeta = document.getElementById(
  "recordHistoryModalMeta",
);
const recordHistoryModalContent = document.getElementById(
  "recordHistoryModalContent",
);
const invoicePreviewModal = document.getElementById("invoicePreviewModal");
const invoicePreviewModalCard = invoicePreviewModal
  ? invoicePreviewModal.querySelector(".invoice-preview-modal-card")
  : null;
const invoicePreviewMeta = document.getElementById("invoicePreviewMeta");
const invoicePreviewImage = document.getElementById("invoicePreviewImage");
const bossSettlementSummaryModal = document.getElementById(
  "bossSettlementSummaryModal",
);
const bossSettlementSummaryModalCard = bossSettlementSummaryModal.querySelector(
  ".settlement-summary-modal-card",
);
const bossSettlementSummaryTitleCount = document.getElementById(
  "bossSettlementSummaryTitleCount",
);
const bossSettlementSummaryAmount = document.getElementById(
  "bossSettlementSummaryAmount",
);
const bossSettlementSummaryTax = document.getElementById(
  "bossSettlementSummaryTax",
);
const bossSettlementSummaryNote = document.getElementById(
  "bossSettlementSummaryNote",
);
const bossSettlementSummarySubmitBtn = document.getElementById(
  "bossSettlementSummarySubmitBtn",
);
const bossSettlementDetailModal = document.getElementById(
  "bossSettlementDetailModal",
);
const bossSettlementDetailModalCard = bossSettlementDetailModal
  ? bossSettlementDetailModal.querySelector(".settlement-detail-modal-card")
  : null;
const bossSettlementDetailTitleCount = document.getElementById(
  "bossSettlementDetailTitleCount",
);
const bossSettlementDetailMeta = document.getElementById(
  "bossSettlementDetailMeta",
);
const bossSettlementDetailList = document.getElementById(
  "bossSettlementDetailList",
);
const settlementDetailTabAccountant = document.getElementById(
  "settlementDetailTabAccountant",
);
const settlementDetailTabDispatcher = document.getElementById(
  "settlementDetailTabDispatcher",
);
const analysisModal = document.getElementById("analysisModal");
const analysisModalCard = analysisModal.querySelector(".analysis-modal-card");
const analysisContent = document.getElementById("analysisContent");
const openOperationRecordsBtn = document.getElementById(
  "openOperationRecordsBtn",
);
const operationRecordsModal = document.getElementById("operationRecordsModal");
const operationRecordsModalCard = operationRecordsModal
  ? operationRecordsModal.querySelector(".operation-records-modal-card")
  : null;
const operationRecordsMeta = document.getElementById("operationRecordsMeta");
const operationRecordsList = document.getElementById("operationRecordsList");
const paidSettlementDetailModal = document.getElementById(
  "paidSettlementDetailModal",
);
const paidSettlementDetailModalCard = paidSettlementDetailModal
  ? paidSettlementDetailModal.querySelector(
      ".paid-settlement-detail-modal-card",
    )
  : null;
const paidSettlementDetailMeta = document.getElementById(
  "paidSettlementDetailMeta",
);
const paidSettlementDetailList = document.getElementById(
  "paidSettlementDetailList",
);
const uploadedSettlementDetailModal = document.getElementById(
  "uploadedSettlementDetailModal",
);
const uploadedSettlementDetailModalCard = uploadedSettlementDetailModal
  ? uploadedSettlementDetailModal.querySelector(
      ".uploaded-settlement-detail-modal-card",
    )
  : null;
const uploadedSettlementDetailMeta = document.getElementById(
  "uploadedSettlementDetailMeta",
);
const uploadedSettlementDetailList = document.getElementById(
  "uploadedSettlementDetailList",
);
const openPriceCompositionBtn = document.getElementById(
  "openPriceCompositionBtn",
);
const priceCompositionModal = document.getElementById("priceCompositionModal");
const priceCompositionModalCard = priceCompositionModal
  ? priceCompositionModal.querySelector(".price-composition-modal-card")
  : null;
const receptionDetailModal = document.getElementById("receptionDetailModal");
const receptionDetailModalCard = receptionDetailModal
  ? receptionDetailModal.querySelector(".paid-settlement-detail-modal-card")
  : null;
const receptionDetailMeta = document.getElementById("receptionDetailMeta");
const receptionDetailList = document.getElementById("receptionDetailList");
const accountantDetailModal = document.getElementById("accountantDetailModal");
const accountantDetailModalCard = accountantDetailModal
  ? accountantDetailModal.querySelector(".paid-settlement-detail-modal-card")
  : null;
const accountantDetailMeta = document.getElementById("accountantDetailMeta");
const accountantDetailList = document.getElementById("accountantDetailList");
const reminderModal = document.getElementById("reminderModal");
const reminderModalCard = reminderModal
  ? reminderModal.querySelector(".reminder-modal-card")
  : null;
const reminderModalMeta = document.getElementById("reminderModalMeta");
const reminderForm = document.getElementById("reminderForm");
const reminderDateInput = document.getElementById("reminderDateInput");
const reminderOrderInput = document.getElementById("reminderOrderInput");
const reminderWechatInput = document.getElementById("reminderWechatInput");
const reminderSubmitBtn = document.getElementById("reminderSubmitBtn");
const reminderList = document.getElementById("reminderList");
const reminderEmptyState = document.getElementById("reminderEmptyState");
const dispatcherModal = document.getElementById("dispatcherModal");
const dispatcherModalCard = dispatcherModal.querySelector(
  ".accountant-modal-card",
);
const dispatcherModalHint = document.getElementById("dispatcherModalHint");
const dispatcherListWrap = document.getElementById("dispatcherListWrap");
const dispatcherList = document.getElementById("dispatcherList");
const dispatcherEmptyState = document.getElementById("dispatcherEmptyState");
const accountantModal = document.getElementById("accountantModal");
const accountantModalCard = accountantModal.querySelector(
  ".accountant-modal-card",
);
const accountantModalHint = document.getElementById("accountantModalHint");
const closeAccountantModalBtn = document.getElementById(
  "closeAccountantModalBtn",
);
const accountantListWrap = document.getElementById("accountantListWrap");
const accountantList = document.getElementById("accountantList");
const accountantEmptyState = document.getElementById("accountantEmptyState");
const accountantEditModal = document.getElementById("accountantEditModal");
const accountantEditModalCard = accountantEditModal
  ? accountantEditModal.querySelector(".accountant-register-modal-card")
  : null;
const accountantEditTitle = document.getElementById("accountantEditTitle");
const accountantEditHint = document.getElementById("accountantEditHint");
const accountantEditForm = document.getElementById("accountantEditForm");
const accountantEditOriginalUsernameInput = document.getElementById(
  "accountantEditOriginalUsernameInput",
);
const accountantEditPasswordField = document.getElementById(
  "accountantEditPasswordField",
);
const accountantEditPasswordInput = document.getElementById(
  "accountantEditPasswordInput",
);
const accountantEditAliasInput = document.getElementById(
  "accountantEditAliasInput",
);
const accountantEditRecipientFieldset = document.getElementById(
  "accountantEditRecipientFieldset",
);
const accountantEditRecipientNameInput = document.getElementById(
  "accountantEditRecipientNameInput",
);
const accountantEditRecipientIdCardInput = document.getElementById(
  "accountantEditRecipientIdCardInput",
);
const accountantEditRecipientBankInput = document.getElementById(
  "accountantEditRecipientBankInput",
);
const accountantEditRecipientBankCardInput = document.getElementById(
  "accountantEditRecipientBankCardInput",
);
const accountantEditRecipientPhoneInput = document.getElementById(
  "accountantEditRecipientPhoneInput",
);
const accountantEditPhoneField = document.getElementById(
  "accountantEditPhoneField",
);
const accountantEditPhoneInput = document.getElementById(
  "accountantEditPhoneInput",
);
const accountantEditSubmitBtn = document.getElementById(
  "accountantEditSubmitBtn",
);
const recycleModal = document.getElementById("recycleModal");
const recycleModalCard = recycleModal.querySelector(".recycle-modal-card");
const recycleModalHint = document.getElementById("recycleModalHint");
const recycleTableBody = document.getElementById("recycleTableBody");
const recycleEmptyState = document.getElementById("recycleEmptyState");
const accountantLogList = document.getElementById("accountantLogList");
const accountantLogEmptyState = document.getElementById(
  "accountantLogEmptyState",
);
const changeLogModal = document.getElementById("changeLogModal");
const changeLogModalCard = changeLogModal
  ? changeLogModal.querySelector(".change-log-modal-card")
  : null;
const closeChangeLogModalBtn = document.getElementById(
  "closeChangeLogModalBtn",
);
const changeLogList = document.getElementById("changeLogList");
const changeLogEmptyState = document.getElementById("changeLogEmptyState");
const changePasswordModal = document.getElementById("changePasswordModal");
const changePasswordModalCard = changePasswordModal
  ? changePasswordModal.querySelector(".accountant-register-modal-card")
  : null;
const changePasswordForm = document.getElementById("changePasswordForm");
const changePasswordHint = document.getElementById("changePasswordHint");
const changePasswordInput = document.getElementById("changePasswordInput");
const changePasswordSubmitBtn = document.getElementById(
  "changePasswordSubmitBtn",
);
const confirmModal = document.getElementById("confirmModal");
const confirmModalCard = confirmModal
  ? confirmModal.querySelector(".confirm-modal-card")
  : null;
const confirmModalTitle = document.getElementById("confirmModalTitle");
const confirmModalMessage = document.getElementById("confirmModalMessage");
const confirmModalContent = document.getElementById("confirmModalContent");
const confirmModalMathChallenge = document.getElementById(
  "confirmModalMathChallenge",
);
const confirmModalMathLabel = document.getElementById("confirmModalMathLabel");
const confirmModalMathInput = document.getElementById("confirmModalMathInput");
const confirmModalMathHint = document.getElementById("confirmModalMathHint");
const confirmModalCancelBtn = document.getElementById("confirmModalCancelBtn");
const confirmModalConfirmBtn = document.getElementById(
  "confirmModalConfirmBtn",
);

const dateInput = document.getElementById("date");
const monthlySettlementCheckbox = document.getElementById("monthlySettlement");
const dispatcherInput = document.getElementById("dispatcher");
const dispatcherTagButtons = Array.from(
  document.querySelectorAll(".dispatcher-tag-btn"),
);
const recordForm = document.getElementById("recordForm");
const recordEditingIdInput = document.getElementById("recordEditingId");
const recordSubmitBtn = document.getElementById("recordSubmitBtn");
const accountantInput = document.getElementById("accountant");
const accountantPicker = document.getElementById("accountantPicker");
const accountantPickerTrigger = document.getElementById(
  "accountantPickerTrigger",
);
const accountantPickerValue = document.getElementById("accountantPickerValue");
const accountantPickerMeta = document.getElementById("accountantPickerMeta");
const accountantPickerDropdown = document.getElementById(
  "accountantPickerDropdown",
);
const accountantPickerSearch = document.getElementById(
  "accountantPickerSearch",
);
const accountantPickerList = document.getElementById("accountantPickerList");
const accountantPickerEmpty = document.getElementById("accountantPickerEmpty");
const sourceInput = document.getElementById("source");
const sourcePicker = document.getElementById("sourcePicker");
const sourcePickerTrigger = document.getElementById("sourcePickerTrigger");
const sourcePickerValue = document.getElementById("sourcePickerValue");
const sourcePickerMeta = document.getElementById("sourcePickerMeta");
const sourcePickerDropdown = document.getElementById("sourcePickerDropdown");
const sourcePickerList = document.getElementById("sourcePickerList");
const sourcePickerEmpty = document.getElementById("sourcePickerEmpty");
const platformInput = document.getElementById("platform");
const shopNameInput = document.getElementById("shopName");
const platformShopPicker = document.getElementById("platformShopPicker");
const platformShopPickerTrigger = document.getElementById(
  "platformShopPickerTrigger",
);
const platformShopPickerValue = document.getElementById(
  "platformShopPickerValue",
);
const platformShopPickerMeta = document.getElementById(
  "platformShopPickerMeta",
);
const platformShopPickerDropdown = document.getElementById(
  "platformShopPickerDropdown",
);
const platformShopPickerList = document.getElementById(
  "platformShopPickerList",
);
const platformShopPickerEmpty = document.getElementById(
  "platformShopPickerEmpty",
);
const orderNoInput = document.getElementById("orderNo");
const customerInput = document.getElementById("customer");
const summaryInput = document.getElementById("summary");
const remarkInput = document.getElementById("remark");
const paymentPriceInput = document.getElementById("paymentPrice");
const totalPriceInput = document.getElementById("totalPrice");
const settlementPriceInput = document.getElementById("settlementPrice");
const premiumHint = document.getElementById("premiumHint");
const AUTOCOMPLETE_DISABLED_FIELD_SELECTOR = [
  "input:not([type='hidden'])",
  "textarea",
  "select",
].join(", ");
const SUGGESTION_GUARD_FIELD_SELECTOR = [
  "input[type='text']",
  "input[type='password']",
  "input[type='search']",
  "input[type='email']",
  "input[type='tel']",
  "input[type='url']",
  "textarea",
].join(", ");
const tableBody = document.getElementById("tableBody");
const mainTableWrap = tableBody ? tableBody.closest(".table-wrap") : null;
const emptyState = document.getElementById("emptyState");
const tableTotalCount = document.getElementById("tableTotalCount");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const exportTableBtn = document.getElementById("exportTableBtn");
const bossSettlementBtn = document.getElementById("bossSettlementBtn");
const bossSettlementSummaryBtn = document.getElementById(
  "bossSettlementSummaryBtn",
);
const bossSettlementDetailBtn = document.getElementById(
  "bossSettlementDetailBtn",
);
const accountantInvoiceUploadBtn = document.getElementById(
  "accountantInvoiceUploadBtn",
);
const accountantInvoiceUploadSummary = document.getElementById(
  "accountantInvoiceUploadSummary",
);
const invoiceRecipientInfoBtn = document.getElementById(
  "invoiceRecipientInfoBtn",
);
const appSideNotice = document.getElementById("appSideNotice");
const accountantUploadedSettlementDetailBtn = document.getElementById(
  "accountantUploadedSettlementDetailBtn",
);
const invoiceUploadModal = document.getElementById("invoiceUploadModal");
const invoiceUploadModalCard = invoiceUploadModal
  ? invoiceUploadModal.querySelector(".invoice-upload-modal-card")
  : null;
const invoiceUploadModalMeta = document.getElementById(
  "invoiceUploadModalMeta",
);
const invoiceUploadFormHint = document.getElementById("invoiceUploadFormHint");
const invoiceUploadForm = document.getElementById("invoiceUploadForm");
const invoiceUploadImageName = document.getElementById(
  "invoiceUploadImageName",
);
const invoiceUploadImagePreviewWrap = document.getElementById(
  "invoiceUploadImagePreviewWrap",
);
const invoiceUploadImagePreview = document.getElementById(
  "invoiceUploadImagePreview",
);
const accountantInvoiceImageInput = document.getElementById(
  "accountantInvoiceImageInput",
);
const invoiceUploadCancelBtn = document.getElementById(
  "invoiceUploadCancelBtn",
);
const invoiceUploadSubmitBtn = document.getElementById(
  "invoiceUploadSubmitBtn",
);
const invoiceRecipientInfoModal = document.getElementById(
  "invoiceRecipientInfoModal",
);
const invoiceRecipientInfoModalCard = invoiceRecipientInfoModal
  ? invoiceRecipientInfoModal.querySelector(".accountant-register-modal-card")
  : null;
const invoiceRecipientInfoHint = document.getElementById(
  "invoiceRecipientInfoHint",
);
const invoiceRecipientInfoForm = document.getElementById(
  "invoiceRecipientInfoForm",
);
const invoiceRecipientNameInput = document.getElementById(
  "invoiceRecipientNameInput",
);
const invoiceRecipientIdCardInput = document.getElementById(
  "invoiceRecipientIdCardInput",
);
const invoiceRecipientBankInput = document.getElementById(
  "invoiceRecipientBankInput",
);
const invoiceRecipientBankCardInput = document.getElementById(
  "invoiceRecipientBankCardInput",
);
const invoiceRecipientPhoneInput = document.getElementById(
  "invoiceRecipientPhoneInput",
);
const invoiceRecipientInfoSubmitBtn = document.getElementById(
  "invoiceRecipientInfoSubmitBtn",
);
const invoiceRecipientInfoCancelBtn = document.getElementById(
  "invoiceRecipientInfoCancelBtn",
);
const tableSelectCol = document.getElementById("tableSelectCol");
const tableSelectHead = document.getElementById("tableSelectHead");
const tableSelectAllCheckbox = document.getElementById(
  "tableSelectAllCheckbox",
);
const sortableHeaders = Array.from(document.querySelectorAll(".sort-btn"));
const filterMonthBtn = document.getElementById("filterMonthBtn");
const filterCompletedAtBtn = document.getElementById("filterCompletedAtBtn");
const filterDispatcherBtn = document.getElementById("filterDispatcherBtn");
const filterOrderBtn = document.getElementById("filterOrderBtn");
const filterAccountantBtn = document.getElementById("filterAccountantBtn");
const filterPlatformBtn = document.getElementById("filterPlatformBtn");
const filterShopBtn = document.getElementById("filterShopBtn");
const filterSourceBtn = document.getElementById("filterSourceBtn");
const filterStatusBtn = document.getElementById("filterStatusBtn");
const filterSettledBtn = document.getElementById("filterSettledBtn");
const filterMonthIndicator = document.getElementById("filterMonthIndicator");
const filterCompletedAtIndicator = document.getElementById(
  "filterCompletedAtIndicator",
);
const filterDispatcherIndicator = document.getElementById(
  "filterDispatcherIndicator",
);
const filterOrderIndicator = document.getElementById("filterOrderIndicator");
const filterAccountantIndicator = document.getElementById(
  "filterAccountantIndicator",
);
const filterPlatformIndicator = document.getElementById(
  "filterPlatformIndicator",
);
const filterShopIndicator = document.getElementById("filterShopIndicator");
const filterSourceIndicator = document.getElementById("filterSourceIndicator");
const filterStatusIndicator = document.getElementById("filterStatusIndicator");
const filterSettledIndicator = document.getElementById(
  "filterSettledIndicator",
);
const filterMonthValue = document.getElementById("filterMonthValue");
const filterCompletedAtValue = document.getElementById(
  "filterCompletedAtValue",
);
const filterDispatcherValue = document.getElementById("filterDispatcherValue");
const filterOrderValue = document.getElementById("filterOrderValue");
const filterAccountantValue = document.getElementById("filterAccountantValue");
const filterPlatformValue = document.getElementById("filterPlatformValue");
const filterShopValue = document.getElementById("filterShopValue");
const filterSourceValue = document.getElementById("filterSourceValue");
const filterStatusValue = document.getElementById("filterStatusValue");
const filterSettledValue = document.getElementById("filterSettledValue");
const filterMonthPopover = document.getElementById("filterMonthPopover");
const filterCompletedAtPopover = document.getElementById(
  "filterCompletedAtPopover",
);
const filterDispatcherPopover = document.getElementById(
  "filterDispatcherPopover",
);
const filterOrderPopover = document.getElementById("filterOrderPopover");
const filterAccountantPopover = document.getElementById(
  "filterAccountantPopover",
);
const filterPlatformPopover = document.getElementById("filterPlatformPopover");
const filterShopPopover = document.getElementById("filterShopPopover");
const filterSourcePopover = document.getElementById("filterSourcePopover");
const filterStatusPopover = document.getElementById("filterStatusPopover");
const filterSettledPopover = document.getElementById("filterSettledPopover");
const filterMonthList = document.getElementById("filterMonthList");
const filterCompletedAtList = document.getElementById("filterCompletedAtList");
const filterDispatcherList = document.getElementById("filterDispatcherList");
const filterAccountantList = document.getElementById("filterAccountantList");
const filterPlatformList = document.getElementById("filterPlatformList");
const filterShopList = document.getElementById("filterShopList");
const filterSourceList = document.getElementById("filterSourceList");
const filterStatusList = document.getElementById("filterStatusList");
const filterSettledList = document.getElementById("filterSettledList");
const filterDateStartInput = document.getElementById("filterDateStartInput");
const filterDateEndInput = document.getElementById("filterDateEndInput");
const filterDateRangeApplyBtn = document.getElementById(
  "filterDateRangeApplyBtn",
);
const filterDateRangeClearBtn = document.getElementById(
  "filterDateRangeClearBtn",
);
const filterCompletedAtStartInput = document.getElementById(
  "filterCompletedAtStartInput",
);
const filterCompletedAtEndInput = document.getElementById(
  "filterCompletedAtEndInput",
);
const filterCompletedAtRangeApplyBtn = document.getElementById(
  "filterCompletedAtRangeApplyBtn",
);
const filterCompletedAtRangeClearBtn = document.getElementById(
  "filterCompletedAtRangeClearBtn",
);
const filterOrderInput = document.getElementById("filterOrderInput");
const tableHoverTooltip = document.createElement("div");
tableHoverTooltip.id = "tableHoverTooltip";
tableHoverTooltip.className = "table-hover-tooltip";
tableHoverTooltip.hidden = true;
document.body.appendChild(tableHoverTooltip);

let currentAccount = "";
let currentAccountRole = "";
let currentAccountDisplayName = "";
let currentAccountRealName = "";
let currentAccountPhone = "";
let currentLoginAccount = "";
let records = [];
let accountants = [];
let dispatchers = [];
let dispatcherAccountantMappings = {};
let linkedDispatcherAccountants = {};
let recycleBinRecords = [];
let accountantOperationLogs = [];
let reminders = [];
let isReminderSubmitting = false;
let hasFetchedRecords = false;
let settlementPriceAutoFilled = false;
let accountantPickerOptions = [];
let accountantPickerOrderCountMap = new Map();
let sourcePickerOptions = [...SOURCE_OPTIONS];
let sourcePickerAutoFilled = false;
let platformShopPickerOptions = [...PLATFORM_SHOP_OPTIONS];
let accountantKnownRecordIds = new Set();
let accountantKnownRecordIdsInitialized = false;
let highlightedUpdatedRecordIds = new Set();
let dismissedUpdatedRecordSignatures = {};
let hasDispatcherFilterPreference = false;
let isSidebarCollapsed = false;
let isSettlementScheduleCollapsed = false;
let savedLoginEntries = [];
let highlightedAccountantUsername = "";
let accountantRegisterReturnTarget = "";
let hasUploadedSettlementInvoiceThisSession = false;
let pendingConfirmResolve = null;
let pendingConfirmMathAnswer = null;
let editingAccountantUsername = "";
let accountantEditMode = "admin";
let recentBossSettlementRecordIds = [];
let completeModalMode = "edit";
let devTodoItems = [];
let selectedBossRecordIds = new Set();
let selectedBossSettlementPayoutRecordIds = new Set();
let isBossSettlementSubmitting = false;
let isBossSettlementPayoutSubmitting = false;
let isInvoiceUploadSubmitting = false;
let invoiceUploadReplaceRecordIds = [];
const bossSettlementDetailSortState = {
  key: "accountant",
  direction: "asc",
};
let bossSettlementDetailPayoutStatusFilter = "";
let settlementDetailActiveTab = "accountant";
const sortState = {
  key: "date",
  direction: "desc",
  premiumMode: "amount",
};
const accountantSortState = {
  key: "orderCount",
  direction: "desc",
};
const dispatcherSortState = {
  key: "dispatchCount",
  direction: "desc",
};
const filterState = {
  month: "",
  dateStart: "",
  dateEnd: "",
  completedAtMonth: "",
  completedAtStart: "",
  completedAtEnd: "",
  dispatcher: [],
  orderNo: "",
  accountant: [],
  platform: "",
  shopName: "",
  source: "",
  status: [],
  settled: "",
};

function normalizeMultiFilterValues(rawValue) {
  const values = Array.isArray(rawValue)
    ? rawValue
    : rawValue
      ? [rawValue]
      : [];
  const seen = new Set();
  return values
    .map((value) => String(value || "").trim())
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function normalizeStatusFilterValues(rawValue) {
  return normalizeMultiFilterValues(rawValue);
}

function setStatusFilterValues(values) {
  filterState.status = normalizeStatusFilterValues(values);
}

function getSelectedStatusFilters() {
  const normalizedValues = normalizeStatusFilterValues(filterState.status);
  if (
    !Array.isArray(filterState.status) ||
    normalizedValues.length !== filterState.status.length
  ) {
    filterState.status = normalizedValues;
  }
  return normalizedValues;
}

function hasStatusFilterSelected() {
  return getSelectedStatusFilters().length > 0;
}

function isStatusFilterValueSelected(value) {
  return getSelectedStatusFilters().includes(String(value || "").trim());
}

function toggleStatusFilterValue(value) {
  const selectedValue = String(value || "").trim();
  if (!selectedValue) return;
  const selectedValues = getSelectedStatusFilters();
  setStatusFilterValues(
    selectedValues.includes(selectedValue)
      ? selectedValues.filter((item) => item !== selectedValue)
      : [...selectedValues, selectedValue],
  );
}

function normalizeAccountantFilterValues(rawValue) {
  return normalizeMultiFilterValues(rawValue);
}

function setAccountantFilterValues(values) {
  filterState.accountant = normalizeAccountantFilterValues(values);
}

function getSelectedAccountantFilters() {
  const normalizedValues = normalizeAccountantFilterValues(filterState.accountant);
  if (
    !Array.isArray(filterState.accountant) ||
    normalizedValues.length !== filterState.accountant.length
  ) {
    filterState.accountant = normalizedValues;
  }
  return normalizedValues;
}

function hasAccountantFilterSelected() {
  return getSelectedAccountantFilters().length > 0;
}

function toggleAccountantFilterValue(value) {
  const selectedValue = String(value || "").trim();
  if (!selectedValue) return;
  const selectedValues = getSelectedAccountantFilters();
  setAccountantFilterValues(
    selectedValues.includes(selectedValue)
      ? selectedValues.filter((item) => item !== selectedValue)
      : [...selectedValues, selectedValue],
  );
}

function normalizeDispatcherFilterValues(rawValue) {
  return normalizeMultiFilterValues(rawValue)
    .map((value) => normalizeDispatcherTag(value))
    .filter(Boolean);
}

function setDispatcherFilterValues(values) {
  filterState.dispatcher = normalizeDispatcherFilterValues(values);
}

function getSelectedDispatcherFilters() {
  const normalizedValues = normalizeDispatcherFilterValues(filterState.dispatcher);
  if (
    !Array.isArray(filterState.dispatcher) ||
    normalizedValues.length !== filterState.dispatcher.length
  ) {
    filterState.dispatcher = normalizedValues;
  }
  return normalizedValues;
}

function hasDispatcherFilterSelected() {
  return getSelectedDispatcherFilters().length > 0;
}

function toggleDispatcherFilterValue(value) {
  const selectedValue = normalizeDispatcherTag(value);
  if (!selectedValue) return;
  const selectedValues = getSelectedDispatcherFilters();
  setDispatcherFilterValues(
    selectedValues.includes(selectedValue)
      ? selectedValues.filter((item) => item !== selectedValue)
      : [...selectedValues, selectedValue],
  );
}

function getAutocompleteDisabledFields() {
  return Array.from(
    document.querySelectorAll(AUTOCOMPLETE_DISABLED_FIELD_SELECTOR),
  ).filter((field) => {
    if (
      !(field instanceof HTMLInputElement) &&
      !(field instanceof HTMLTextAreaElement) &&
      !(field instanceof HTMLSelectElement)
    ) {
      return false;
    }
    if (field instanceof HTMLInputElement) {
      const inputType = String(field.type || "").toLowerCase();
      return ![
        "hidden",
        "button",
        "submit",
        "reset",
        "checkbox",
        "radio",
        "range",
        "file",
      ].includes(inputType);
    }
    return true;
  });
}

function getSuggestionGuardInputs() {
  return getAutocompleteDisabledFields().filter((field) => {
    return field.matches(SUGGESTION_GUARD_FIELD_SELECTOR);
  });
}

function applyAutocompleteDisabledAttributes(field) {
  if (
    !(field instanceof HTMLInputElement) &&
    !(field instanceof HTMLTextAreaElement) &&
    !(field instanceof HTMLSelectElement)
  )
    return;

  const isPasswordField =
    field instanceof HTMLInputElement &&
    String(field.type || "").toLowerCase() === "password";
  field.setAttribute("autocomplete", isPasswordField ? "new-password" : "off");
  field.setAttribute("autocapitalize", "off");
  field.setAttribute("autocorrect", "off");
  field.setAttribute("spellcheck", "false");
  field.setAttribute("data-form-type", "other");
  field.setAttribute("data-lpignore", "true");
  field.setAttribute("data-1p-ignore", "true");
  field.setAttribute("data-bwignore", "true");
  if (field.matches(SUGGESTION_GUARD_FIELD_SELECTOR)) {
    field.setAttribute("data-no-suggest", "true");
  }
}

function getSuggestionGuardField(target) {
  if (!(target instanceof Element)) return null;
  const field = target.closest(SUGGESTION_GUARD_FIELD_SELECTOR);
  if (
    !(field instanceof HTMLInputElement) &&
    !(field instanceof HTMLTextAreaElement)
  )
    return null;
  return field;
}

function lockSuggestionGuardField(field) {
  if (
    !(field instanceof HTMLInputElement) &&
    !(field instanceof HTMLTextAreaElement)
  )
    return;
  if (field.disabled) return;
  field.setAttribute("readonly", "readonly");
}

function unlockSuggestionGuardField(field) {
  if (
    !(field instanceof HTMLInputElement) &&
    !(field instanceof HTMLTextAreaElement)
  )
    return;
  field.removeAttribute("readonly");
}

function initializeSuggestionGuard() {
  document.querySelectorAll("form").forEach((form) => {
    form.setAttribute("autocomplete", "off");
    form.setAttribute("data-form-type", "other");
  });

  getAutocompleteDisabledFields().forEach((field) => {
    applyAutocompleteDisabledAttributes(field);
  });

  getSuggestionGuardInputs().forEach((field) => {
    lockSuggestionGuardField(field);
  });

  document.addEventListener("focusin", (event) => {
    const field = getSuggestionGuardField(event.target);
    if (!field) return;
    window.queueMicrotask(() => {
      unlockSuggestionGuardField(field);
    });
  });

  document.addEventListener("focusout", (event) => {
    const field = getSuggestionGuardField(event.target);
    if (!field) return;
    window.requestAnimationFrame(() => {
      if (document.activeElement === field) return;
      lockSuggestionGuardField(field);
    });
  });
}

function normalizeText(value, maxLength = 200) {
  return String(value || "")
    .replace(/\r\n?/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeDevTodoText(value, maxLength = 320) {
  return String(value || "")
    .replace(/\r\n?/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeOrderNoInput(value, allowMultiLine = false) {
  const text = String(value || "");
  if (allowMultiLine) {
    return text
      .split(/(\r\n|\n|\r)/)
      .map((part, index) => {
        if (index % 2 === 1) return part;
        return part.replace(/[^0-9/]/g, "");
      })
      .join("");
  }
  return text.replace(/[^0-9/]/g, "");
}

function createDevTodoId() {
  return `todo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeDevTodoItems(sourceItems) {
  if (!Array.isArray(sourceItems)) return [];
  return sourceItems
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const text = normalizeDevTodoText(item.text);
      if (!text) return null;
      const id =
        String(item.id || createDevTodoId()).trim() || createDevTodoId();
      const createdAtInput = String(item.createdAt || "").trim();
      const createdAtTime = parseDateTimeValue(createdAtInput);
      const createdAt = Number.isFinite(createdAtTime)
        ? formatDateTimeFromDate(new Date(createdAtTime))
        : getCurrentDateTimeString();
      return { id, text, createdAt };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        parseDateTimeValue(right.createdAt) -
        parseDateTimeValue(left.createdAt),
    );
}

function resolveAccountantProfileDisplayName(rawProfile) {
  if (!rawProfile || typeof rawProfile !== "object") return "";
  return String(
    rawProfile.displayName ||
      rawProfile.alias ||
      rawProfile.nickname ||
      rawProfile.chineseName ||
      rawProfile.cnName ||
      rawProfile.name ||
      rawProfile.phone ||
      rawProfile.mobile ||
      rawProfile.mobilePhone ||
      rawProfile.username ||
      "",
  ).trim();
}

function normalizeAccountantProfile(rawProfile) {
  if (typeof rawProfile === "string") {
    const normalizedName = String(rawProfile || "").trim();
    if (!normalizedName) return null;
    return {
      username: normalizedName,
      displayName: normalizedName,
      name: normalizedName,
      alias: "",
      realName: "",
      phone: "",
      loginPassword: "",
    };
  }
  if (!rawProfile || typeof rawProfile !== "object") return null;
  const username = String(
    rawProfile.username ||
      rawProfile.loginName ||
      rawProfile.account ||
      rawProfile.phone ||
      rawProfile.mobile ||
      rawProfile.mobilePhone ||
      rawProfile.name ||
      "",
  ).trim();
  const displayName = String(
    resolveAccountantProfileDisplayName(rawProfile) || username,
  ).trim();
  if (!username || !displayName) return null;
  const aliasInput = String(
    rawProfile.alias || rawProfile.nickname || "",
  ).trim();
  const alias = aliasInput || (displayName !== username ? displayName : "");
  const realName = String(
    rawProfile.realName || rawProfile.fullName || rawProfile.legalName || "",
  ).trim();
  const phone = String(
    rawProfile.phone || rawProfile.mobile || rawProfile.mobilePhone || "",
  ).trim();
  const loginPassword = String(
    rawProfile.loginPassword || rawProfile.password || "",
  ).trim();
  const invoiceRecipientInfo = normalizeInvoiceRecipientInfo(
    rawProfile.invoiceRecipientInfo || rawProfile,
  );
  const hasInvoiceRecipientInfo = Object.values(invoiceRecipientInfo).some(
    Boolean,
  );
  return {
    username,
    displayName,
    name: displayName,
    alias,
    realName,
    phone,
    loginPassword,
    invoiceRecipientInfo: hasInvoiceRecipientInfo ? invoiceRecipientInfo : null,
  };
}

function compareAccountantNameByOrderCount(leftName, rightName, orderCountMap) {
  const countDiff =
    (orderCountMap.get(rightName) || 0) - (orderCountMap.get(leftName) || 0);
  if (countDiff !== 0) return countDiff;
  return leftName.localeCompare(rightName, "zh-CN", {
    numeric: true,
    sensitivity: "base",
  });
}

function getOrderSortedAccountantNames(sourceNames, orderCountMap) {
  return Array.from(
    new Set(
      sourceNames.map((name) => String(name || "").trim()).filter(Boolean),
    ),
  ).sort((left, right) =>
    compareAccountantNameByOrderCount(left, right, orderCountMap),
  );
}

function withBuiltInAccountantOptions(sourceNames) {
  const names = Array.isArray(sourceNames) ? sourceNames : [];
  return [
    ...BUILT_IN_ACCOUNTANT_NAMES,
    ...names.filter((name) => !isBuiltInAccountantName(name)),
  ];
}

function isNonSettlementAccountantName(value) {
  return String(value || "").trim() === NON_SETTLEMENT_ACCOUNTANT_NAME;
}

function isBuiltInAccountantName(value) {
  return BUILT_IN_ACCOUNTANT_NAMES.includes(String(value || "").trim());
}

function getAccountantOrderCountMap(sourceRecords = getVisibleRecords()) {
  const list = Array.isArray(sourceRecords) ? sourceRecords : [];
  return list.reduce((map, item) => {
    const key = String(item.accountant || "").trim();
    if (!key) return map;
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
}

function mergeAccountantProfiles(sourceProfiles, extraNames = []) {
  const profileByUsername = new Map();
  sourceProfiles
    .map((item) => normalizeAccountantProfile(item))
    .filter(Boolean)
    .forEach((profile) => {
      if (
        isBuiltInAccountantName(profile.displayName) ||
        isBuiltInAccountantName(profile.username)
      )
        return;
      const current = profileByUsername.get(profile.username);
      if (!current) {
        profileByUsername.set(profile.username, profile);
        return;
      }
      const next = {
        ...current,
        displayName:
          current.displayName || profile.displayName || current.username,
        name: current.displayName || profile.displayName || current.username,
        alias: current.alias || profile.alias || "",
        realName: current.realName || profile.realName || "",
        phone: current.phone || profile.phone || "",
        loginPassword: current.loginPassword || profile.loginPassword || "",
        invoiceRecipientInfo:
          current.invoiceRecipientInfo || profile.invoiceRecipientInfo || null,
      };
      profileByUsername.set(profile.username, next);
    });

  extraNames.forEach((name) => {
    const normalizedDisplayName = String(name || "").trim();
    if (!normalizedDisplayName) return;
    if (isBuiltInAccountantName(normalizedDisplayName)) return;
    const exists = Array.from(profileByUsername.values()).some(
      (profile) =>
        String(profile.displayName || "").trim() === normalizedDisplayName,
    );
    if (!exists) {
      profileByUsername.set(normalizedDisplayName, {
        username: normalizedDisplayName,
        displayName: normalizedDisplayName,
        name: normalizedDisplayName,
        alias: "",
        realName: "",
        phone: "",
        loginPassword: "",
        invoiceRecipientInfo: null,
      });
    }
  });

  return Array.from(profileByUsername.values()).sort((left, right) =>
    String(left.displayName || "").localeCompare(
      String(right.displayName || ""),
      "zh-CN",
      { numeric: true, sensitivity: "base" },
    ),
  );
}

function normalizeInvoiceRecipientInfo(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    name: String(source.name || source.invoiceRecipientName || "").trim(),
    bankName: String(
      source.bankName || source.bank || source.invoiceRecipientBankName || "",
    ).trim(),
    bankCardNo: String(
      source.bankCardNo ||
        source.bankCard ||
        source.cardNo ||
        source.invoiceRecipientBankCardNo ||
        "",
    ).trim(),
    idCardNo: String(
      source.idCardNo ||
        source.idCard ||
        source.identityNo ||
        source.invoiceRecipientIdCardNo ||
        "",
    ).trim(),
    declarationPhone: String(
      source.declarationPhone ||
        source.phone ||
        source.invoiceRecipientDeclarationPhone ||
        "",
    ).trim(),
  };
}

function getAccountantProfileByLoginName(loginNameRaw) {
  const loginName = String(loginNameRaw || "").trim();
  if (!loginName) return null;
  return (
    accountants.find((item) => {
      const displayName = String(item?.displayName || "").trim();
      const name = String(item?.name || "").trim();
      const username = String(item?.username || "").trim();
      const phone = String(item?.phone || "").trim();
      return (
        displayName === loginName ||
        name === loginName ||
        username === loginName ||
        phone === loginName
      );
    }) || null
  );
}

function getAccountantLoginIdentifier(loginNameRaw) {
  const loginName = String(loginNameRaw || "").trim();
  if (!loginName) return "";
  const profile = getAccountantProfileByLoginName(loginName);
  const phone = String(profile?.phone || "").trim();
  return phone || loginName;
}

function getCurrentAccountantLoginProfile() {
  return getAccountantProfileByLoginName(currentAccount);
}

function getAccountantDisplayNameByLoginName(loginNameRaw) {
  const profile = getAccountantProfileByLoginName(loginNameRaw);
  if (!profile) return String(loginNameRaw || "").trim();
  const displayName = String(
    profile.displayName || profile.name || profile.username || "",
  ).trim();
  if (
    normalizeLoginRole(currentAccountRole) === "accountant" &&
    String(loginNameRaw || "").trim() === String(currentAccount || "").trim() &&
    displayName &&
    displayName !== currentAccountDisplayName
  ) {
    currentAccountDisplayName = displayName;
  }
  return displayName;
}

function getCurrentAccountantDisplayName() {
  const displayName = getAccountantDisplayNameByLoginName(currentAccount);
  if (displayName && displayName !== String(currentAccount || "").trim()) {
    return displayName;
  }
  return String(currentAccountDisplayName || currentAccount || "").trim();
}

function getAccountantUploadIdentitySet(accountantName) {
  const normalizedName = String(accountantName || "").trim();
  const identities = new Set();
  const addIdentity = (value) => {
    const text = String(value || "").trim();
    if (text) {
      identities.add(text);
    }
  };

  addIdentity(normalizedName);

  const profile = getAccountantProfileByLoginName(normalizedName);
  if (profile) {
    addIdentity(profile.displayName);
    addIdentity(profile.name);
    addIdentity(profile.alias);
    addIdentity(profile.username);
    addIdentity(profile.phone);
  }

  return identities;
}

function isInvoiceUploadedByLinkedDispatcher(record, accountantName) {
  const normalizedAccountant = String(accountantName || "").trim();
  if (!normalizedAccountant || !record || typeof record !== "object")
    return false;
  const uploadedByUsername = String(
    record?.invoiceUploadedByUsername || "",
  ).trim();
  const uploadedDispatcherTag = normalizeDispatcherTag(uploadedByUsername);
  if (!uploadedDispatcherTag) return false;
  const linkedAccountant = getLinkedAccountantDisplayNameByTag(
    uploadedDispatcherTag,
  );
  return Boolean(linkedAccountant && linkedAccountant === normalizedAccountant);
}

function isInvoiceUploadedByAccountant(record, accountantName) {
  const identities = getAccountantUploadIdentitySet(accountantName);
  if (!identities.size) return false;

  const uploadedBy = String(record?.invoiceUploadedBy || "").trim();
  const uploadedByUsername = String(
    record?.invoiceUploadedByUsername || "",
  ).trim();
  return (
    identities.has(uploadedBy) ||
    identities.has(uploadedByUsername) ||
    isInvoiceUploadedByLinkedDispatcher(record, accountantName)
  );
}

function isRecordInvoiceUploadedByRecordAccountant(record) {
  const accountantName = String(record?.accountant || "").trim();
  return (
    isRecordInvoiceUploaded(record) &&
    isInvoiceUploadedByAccountant(record, accountantName)
  );
}

function getAccountantRealNameByLoginName(loginNameRaw) {
  const realName = String(
    getAccountantProfileByLoginName(loginNameRaw)?.realName || "",
  ).trim();
  if (
    normalizeLoginRole(currentAccountRole) === "accountant" &&
    String(loginNameRaw || "").trim() === String(currentAccount || "").trim() &&
    realName &&
    realName !== currentAccountRealName
  ) {
    currentAccountRealName = realName;
  }
  return realName;
}

function getAccountantSettlementNameByLoginName(loginNameRaw) {
  const profile = getAccountantProfileByLoginName(loginNameRaw);
  const recipientInfo = normalizeInvoiceRecipientInfo(profile?.invoiceRecipientInfo);
  return String(recipientInfo.name || profile?.realName || "").trim();
}

function getCurrentAccountantRealName() {
  const realName = getAccountantRealNameByLoginName(currentAccount);
  return String(realName || currentAccountRealName || "").trim();
}

function getAccountantLoginPhoneByLoginName(loginNameRaw) {
  const phone = String(
    getAccountantProfileByLoginName(loginNameRaw)?.phone || "",
  ).trim();
  if (
    normalizeLoginRole(currentAccountRole) === "accountant" &&
    String(loginNameRaw || "").trim() === String(currentAccount || "").trim() &&
    phone &&
    phone !== currentAccountPhone
  ) {
    currentAccountPhone = phone;
  }
  return phone;
}

function getCurrentAccountantLoginPhone() {
  const phone = getAccountantLoginPhoneByLoginName(currentAccount);
  return String(phone || currentAccountPhone || "").trim();
}

function normalizeLoginRole(rawRole) {
  const role = String(rawRole || "")
    .trim()
    .toLowerCase();
  if (role === "dispatcher" || role === "accountant" || role === "boss")
    return role;
  return "";
}

function getDispatcherTagForAccount(accountNameRaw) {
  const normalizedAccount = String(
    resolveLoginAccountInput(accountNameRaw) || "",
  )
    .trim()
    .toLowerCase();
  if (normalizedAccount && ACCOUNT_TO_DISPATCHER_TAG[normalizedAccount]) {
    return ACCOUNT_TO_DISPATCHER_TAG[normalizedAccount];
  }

  const source = String(accountNameRaw || "")
    .trim()
    .toLowerCase();
  if (!source) return "";
  if (source.includes("财税1旧")) return "1旧";
  if (source.includes("财税k旧")) return "K旧";
  if (source.includes("财税a")) return "A";
  if (source.includes("财税c")) return "C";
  if (source.includes("财税e")) return "E";
  if (source.includes("财税k")) return "K";
  if (source.includes("财税1")) return "1";
  return "";
}

function inferRoleByAccountName(accountNameRaw) {
  const accountName = String(accountNameRaw || "").trim();
  if (!accountName) return "";
  if (isBossAccountName(accountName)) {
    return "boss";
  }
  return getDispatcherTagForAccount(accountName) ? "dispatcher" : "accountant";
}

function normalizeSavedLoginEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== "object") return null;
  const account = String(rawEntry.account || "").trim();
  const password = String(rawEntry.password || "").trim();
  if (!account || !password) return null;
  const normalizedRole =
    normalizeLoginRole(rawEntry.role) || inferRoleByAccountName(account);
  const resolvedAccount = String(
    resolveLoginAccountInput(account) || account,
  ).trim();
  const updatedAt = Number(rawEntry.updatedAt);
  const displayName = String(
    rawEntry.displayName || rawEntry.name || "",
  ).trim();
  const alias = String(rawEntry.alias || rawEntry.nickname || "").trim();
  return {
    account:
      normalizedRole === "accountant"
        ? getAccountantLoginIdentifier(resolvedAccount)
        : resolvedAccount,
    password,
    role: normalizedRole,
    displayName,
    alias,
    updatedAt:
      Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : Date.now(),
  };
}

function getSavedLoginEntryKey(accountNameRaw) {
  const resolvedAccount = String(
    resolveLoginAccountInput(accountNameRaw) || accountNameRaw || "",
  ).trim();
  return String(
    getAccountantLoginIdentifier(resolvedAccount) || resolvedAccount,
  )
    .trim()
    .toLowerCase();
}

function getSavedLoginRoleKey(accountNameRaw, roleRaw) {
  const role =
    normalizeLoginRole(roleRaw) || inferRoleByAccountName(accountNameRaw);
  if (role === "dispatcher" || role === "accountant" || role === "boss")
    return role;
  return "accountant";
}

function getSavedLoginGroupTitle(roleKey) {
  if (roleKey === "dispatcher") return "接待账号";
  if (roleKey === "boss") return "管理员账号";
  return "会计账号";
}

function getSavedLoginRoleLabel(roleKey) {
  if (roleKey === "dispatcher") return "接待";
  if (roleKey === "boss") return "管理";
  return "会计";
}

function getSavedLoginMetaText(accountNameRaw, roleRaw, entryRaw = null) {
  const accountName = String(accountNameRaw || "").trim();
  const roleKey = getSavedLoginRoleKey(accountNameRaw, roleRaw);
  if (roleKey === "dispatcher") {
    const dispatcherTag = getDispatcherTagForAccount(accountNameRaw);
    return dispatcherTag ? `接待号 ${dispatcherTag}` : "接待账号";
  }
  if (roleKey === "boss") {
    return "负责人视图";
  }
  const resolvedAccount = String(
    resolveLoginAccountInput(accountName) || accountName,
  ).trim();
  return resolvedAccount ? `账号 ${resolvedAccount}` : "会计账号";
}

function getDispatcherAccountDisplayName(accountNameRaw) {
  const accountName = String(accountNameRaw || "").trim();
  const normalizedAccount = String(
    resolveLoginAccountInput(accountNameRaw) || accountName || "",
  )
    .trim()
    .toLowerCase();
  if (normalizedAccount && DISPATCHER_ACCOUNT_DISPLAY_NAME[normalizedAccount]) {
    return DISPATCHER_ACCOUNT_DISPLAY_NAME[normalizedAccount];
  }
  const dispatcherTag = getDispatcherTagForAccount(accountNameRaw);
  return getDispatcherDisplayNameByTag(dispatcherTag) || accountName;
}

function getSavedLoginDisplayName(accountNameRaw, roleRaw, entryRaw = null) {
  const accountName = String(accountNameRaw || "").trim();
  const roleKey = getSavedLoginRoleKey(accountNameRaw, roleRaw);
  if (roleKey === "dispatcher") {
    return getDispatcherAccountDisplayName(accountNameRaw);
  }
  if (roleKey === "boss") {
    return String(
      resolveLoginAccountInput(accountNameRaw) ||
        accountName ||
        BOSS_LOGIN_ACCOUNT,
    ).trim();
  }
  const entryAlias = String(entryRaw?.alias || "").trim();
  const entryDisplayName = String(entryRaw?.displayName || "").trim();
  if (entryAlias) return entryAlias;
  if (entryDisplayName) return entryDisplayName;
  return getAccountantDisplayNameByLoginName(accountName) || accountName;
}

function renderSavedLoginList() {
  if (!savedLoginSection || !savedLoginList) return;
  savedLoginList.innerHTML = "";
  if (!isQuickLoginEnabled) {
    savedLoginSection.hidden = true;
    return;
  }
  const items = Array.isArray(savedLoginEntries) ? savedLoginEntries : [];
  savedLoginSection.hidden = !items.length;
  if (!items.length) return;

  const groupOrder = ["boss", "dispatcher", "accountant"];
  const groupedEntries = new Map(groupOrder.map((roleKey) => [roleKey, []]));
  items.forEach((entry) => {
    const normalized = normalizeSavedLoginEntry(entry);
    if (!normalized) return;
    const explicitRole = normalizeLoginRole(entry?.role);
    const roleKey =
      explicitRole || getSavedLoginRoleKey(normalized.account, normalized.role);
    if (!groupedEntries.has(roleKey)) {
      groupedEntries.set(roleKey, []);
    }
    groupedEntries.get(roleKey).push(normalized);
  });

  const buildSavedLoginGroup = (roleKey, entries) => {
    const group = document.createElement("section");
    group.className = `saved-login-group ${roleKey}`;

    const header = document.createElement("div");
    header.className = "saved-login-group-header";

    const title = document.createElement("span");
    title.className = "saved-login-group-title";
    title.textContent = getSavedLoginGroupTitle(roleKey);

    const count = document.createElement("span");
    count.className = "saved-login-group-count";
    count.textContent = `${entries.length}个`;

    const groupList = document.createElement("div");
    groupList.className = "saved-login-group-list";

    header.appendChild(title);
    header.appendChild(count);
    group.appendChild(header);

    entries.forEach((normalized) => {
      const itemRoleKey = normalizeLoginRole(normalized.role) || roleKey;
      const itemButton = document.createElement("button");
      itemButton.type = "button";
      itemButton.className = "saved-login-item";
      itemButton.dataset.savedLoginKey = getSavedLoginEntryKey(
        normalized.account,
      );

      const main = document.createElement("span");
      main.className = "saved-login-item-main";

      const name = document.createElement("span");
      name.className = "saved-login-item-name";
      name.textContent = getSavedLoginDisplayName(
        normalized.account,
        itemRoleKey,
        normalized,
      );

      const meta = document.createElement("span");
      meta.className = "saved-login-item-meta";
      meta.textContent = getSavedLoginMetaText(
        normalized.account,
        itemRoleKey,
        normalized,
      );

      const role = document.createElement("span");
      role.className = `saved-login-item-role ${itemRoleKey}`;
      role.textContent = getSavedLoginRoleLabel(itemRoleKey);

      main.appendChild(name);
      main.appendChild(meta);
      itemButton.appendChild(main);
      itemButton.appendChild(role);
      groupList.appendChild(itemButton);
    });

    group.appendChild(groupList);
    savedLoginList.appendChild(group);
  };

  if (isQuickLoginDebugEnabled) {
    groupOrder.forEach((roleKey) => {
      buildSavedLoginGroup(roleKey, groupedEntries.get(roleKey) || []);
    });
    return;
  }

  groupOrder.forEach((roleKey) => {
    const entries = groupedEntries.get(roleKey) || [];
    if (!entries.length) return;
    buildSavedLoginGroup(roleKey, entries);
  });
}

function isBossLogin(accountName = currentAccount) {
  const normalized = String(resolveLoginAccountInput(accountName) || "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  const isCurrent =
    String(accountName || "").trim() === String(currentAccount || "").trim();
  if (isCurrent) {
    const role = normalizeLoginRole(currentAccountRole);
    if (role === "boss") return true;
    if (role === "dispatcher" || role === "accountant") return false;
  }
  return BOSS_LOGIN_ACCOUNT_SET.has(normalized);
}

function isDispatcherLogin(accountName = currentAccount) {
  const normalized = String(accountName || "").trim();
  if (!normalized) return false;
  const isCurrent = normalized === String(currentAccount || "").trim();
  if (isCurrent) {
    const role = normalizeLoginRole(currentAccountRole);
    if (role === "dispatcher") return true;
    if (role === "boss") return false;
    if (role === "accountant") return false;
  }
  return Boolean(getDispatcherTagForAccount(normalized));
}

function isAccountantLogin(accountName = currentAccount) {
  const normalized = String(accountName || "").trim();
  if (!normalized) return false;
  const isCurrent = normalized === String(currentAccount || "").trim();
  if (isCurrent) {
    const role = normalizeLoginRole(currentAccountRole);
    if (role === "accountant") return true;
    if (role === "boss") return false;
    if (role === "dispatcher") return false;
  }
  return !isBossLogin(normalized) && !isDispatcherLogin(normalized);
}

function canCurrentAccountSettleRecords() {
  return isBossLogin();
}

function canCurrentAccountUseReminders() {
  return isBossLogin() || isDispatcherLogin();
}

function canCurrentAccountExportTableRecords() {
  return (
    hasAuthenticatedAccount() &&
    (isBossLogin() || isDispatcherLogin() || isAccountantLogin())
  );
}

function canCurrentAccountUploadSettlementInvoice() {
  return isAccountantLogin();
}

function canCurrentAccountManageInvoiceRecipientInfo() {
  return isAccountantLogin();
}

function canCurrentAccountPayoutSettlementRecords() {
  return isBossLogin();
}

function canCurrentAccountDeleteRecord(record) {
  if (!record || typeof record !== "object") return false;
  if (isBossLogin()) return true;
  if (isDispatcherLogin()) return getRecordWorkflowStatusKey(record) === "pending";
  return false;
}

function shouldShowProfitColumn(accountName = currentAccount) {
  return isDispatcherLogin(accountName);
}

function canEditAccountantSensitiveFields(mode = "admin") {
  return mode === "self" || isBossLogin();
}

function clearBossRecordSelection() {
  selectedBossRecordIds = new Set();
}

function getBossSettlementSelectionDisabledReason(record) {
  const recordId = String(record?.id || "").trim();
  if (!recordId) {
    return "数据缺少记录编号，当前不可结算。";
  }
  const state = getBossSettlementRecordState(record);
  if (state === "settled") {
    return `该数据当前状态是${getRecordSettlementLabel(record)}。`;
  }
  if (state === "returned") {
    return "该数据已退单。";
  }
  if (state === "refunded") {
    return "该数据已退款。";
  }
  if (state === "not_completed") {
    return `当前支持结算的状态是${getRecordWorkflowStatusLabelByKey("completed")}。`;
  }
  return "";
}

function isBossSettlementRecordSelectable(record) {
  return !getBossSettlementSelectionDisabledReason(record);
}

function syncBossRecordSelection(sourceRecords = records) {
  if (!canCurrentAccountSettleRecords()) {
    clearBossRecordSelection();
    return;
  }
  const validRecordIds = new Set(
    (Array.isArray(sourceRecords) ? sourceRecords : [])
      .filter((item) => isBossSettlementRecordSelectable(item))
      .map((item) => String(item?.id || "").trim())
      .filter(Boolean),
  );
  selectedBossRecordIds = new Set(
    Array.from(selectedBossRecordIds).filter((recordId) =>
      validRecordIds.has(recordId),
    ),
  );
}

function isBossRecordSelected(recordId) {
  const normalizedRecordId = String(recordId || "").trim();
  if (!normalizedRecordId) return false;
  return selectedBossRecordIds.has(normalizedRecordId);
}

function setBossRecordSelected(recordId, isSelected) {
  const normalizedRecordId = String(recordId || "").trim();
  if (!normalizedRecordId) return;
  if (isSelected) {
    selectedBossRecordIds.add(normalizedRecordId);
    return;
  }
  selectedBossRecordIds.delete(normalizedRecordId);
}

function setBossRecordSelectionForRecords(sourceRecords, isSelected) {
  if (!Array.isArray(sourceRecords)) return;
  sourceRecords.forEach((item) => {
    if (!isBossSettlementRecordSelectable(item)) return;
    const recordId = String(item?.id || "").trim();
    if (!recordId) return;
    setBossRecordSelected(recordId, isSelected);
  });
}

function getSelectedBossRecords(sourceRecords = records) {
  return (Array.isArray(sourceRecords) ? sourceRecords : []).filter((item) => {
    const recordId = String(item?.id || "").trim();
    return recordId ? selectedBossRecordIds.has(recordId) : false;
  });
}

function clearBossSettlementPayoutSelection() {
  selectedBossSettlementPayoutRecordIds = new Set();
}

function normalizeRecordSettlementPaidState(value) {
  return normalizeStateFlag(value, PAID_WORKFLOW_STATE_VALUES);
}

function isRecordSettlementPaid(record) {
  if (!record || typeof record !== "object") return false;
  return normalizeRecordSettlementPaidState(
    Object.prototype.hasOwnProperty.call(record, "isSettlementPaid")
      ? record.isSettlementPaid
      : record.settlementPaid,
  );
}

function isRecordDispatcherSettlementPaid(record) {
  if (!record || typeof record !== "object") return false;
  return normalizeRecordSettlementPaidState(
    Object.prototype.hasOwnProperty.call(record, "isDispatcherSettlementPaid")
      ? record.isDispatcherSettlementPaid
      : record.dispatcherSettlementPaid,
  );
}

function isBossSettlementPayoutRecordSelectable(record) {
  if (!canCurrentAccountPayoutSettlementRecords()) return false;
  if (!isRecordCompleted(record)) return false;
  return isRecordSettled(record) && !isRecordSettlementPaid(record);
}

function getBossSettlementPayoutTargetsForRecord(record) {
  if (!canCurrentAccountPayoutSettlementRecords()) return [];
  if (!isRecordCompleted(record)) return [];
  const recordId = String(record?.id || "").trim();
  if (!recordId) return [];

  const targets = [];
  if (isRecordSettled(record) && !isRecordSettlementPaid(record)) {
    targets.push(recordId);
  }

  const dispatcher = normalizeDispatcherTag(record?.dispatcher);
  const linkedAccountant = dispatcher
    ? getLinkedAccountantDisplayNameByTag(dispatcher)
    : "";
  if (
    linkedAccountant &&
    isRecordSettled(record) &&
    !isRecordDispatcherSettlementPaid(record)
  ) {
    targets.push(`dispatcher:${recordId}`);
  }

  return targets;
}

function syncBossSettlementPayoutSelection(sourceRecords = records) {
  const validRecordIds = new Set();
  (Array.isArray(sourceRecords) ? sourceRecords : [])
    .forEach((item) => {
      getBossSettlementPayoutTargetsForRecord(item).forEach((target) => validRecordIds.add(target));
    });
  selectedBossSettlementPayoutRecordIds = new Set(
    Array.from(selectedBossSettlementPayoutRecordIds)
      .map((target) => String(target || "").trim())
      .filter((target) => validRecordIds.has(target)),
  );
}

function isBossSettlementPayoutRecordSelected(recordId) {
  const normalizedRecordId = String(recordId || "").trim();
  return Boolean(
    normalizedRecordId &&
    selectedBossSettlementPayoutRecordIds.has(normalizedRecordId),
  );
}

function setBossSettlementPayoutRecordSelected(recordIds, isSelected) {
  const ids = (Array.isArray(recordIds) ? recordIds : [recordIds])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  ids.forEach((recordId) => {
    if (isSelected) {
      selectedBossSettlementPayoutRecordIds.add(recordId);
    } else {
      selectedBossSettlementPayoutRecordIds.delete(recordId);
    }
  });
}

function getSelectedBossSettlementPayoutRecordIds() {
  return Array.from(selectedBossSettlementPayoutRecordIds).filter(Boolean);
}

function isRecordSettled(record) {
  if (!record || typeof record !== "object") return false;
  return normalizeStateFlag(record.isSettled, SETTLED_WORKFLOW_STATE_VALUES);
}

function isMonthlySettlementRecord(record) {
  if (!record || typeof record !== "object") return false;
  return normalizeStateFlag(
    record.isMonthlySettlement,
    MONTHLY_SETTLEMENT_STATE_VALUES,
  );
}

function getMonthlySettlementLabel(value) {
  return isMonthlySettlementRecord({ isMonthlySettlement: value })
    ? "是"
    : "否";
}

function getDispatcherBaseProfitRate(record) {
  return isMonthlySettlementRecord(record) ? 0.13 : 0.08;
}

function resolveStoredAssetUrl(url) {
  const source = String(url || "").trim();
  if (!source) return "";
  if (API_BASE && source.startsWith("/")) {
    return `${API_BASE}${source}`;
  }
  return source;
}

function getSettlementInvoiceImage(record) {
  const source = record && typeof record === "object" ? record : {};
  const rawImage = source.settlementInvoiceImage || source.invoiceImage;
  if (!rawImage || typeof rawImage !== "object") return null;
  const rawUrl = String(rawImage.url || "").trim();
  const fileName = String(rawImage.fileName || "").trim();
  const url = resolveStoredAssetUrl(
    rawUrl ||
      (fileName ? `/invoice-images/${encodeURIComponent(fileName)}` : ""),
  );
  if (!url) return null;
  return {
    id: String(rawImage.id || "").trim(),
    name: String(rawImage.name || "").trim() || fileName || "发票图片",
    fileName,
    url,
  };
}

function getDispatcherSettlementInvoiceImage(record) {
  const source = record && typeof record === "object" ? record : {};
  const rawImage =
    source.dispatcherSettlementInvoiceImage || source.dispatcherInvoiceImage;
  if (!rawImage || typeof rawImage !== "object") return null;
  const rawUrl = String(rawImage.url || "").trim();
  const fileName = String(rawImage.fileName || "").trim();
  const url = resolveStoredAssetUrl(
    rawUrl ||
      (fileName ? `/invoice-images/${encodeURIComponent(fileName)}` : ""),
  );
  if (!url) return null;
  return {
    id: String(rawImage.id || "").trim(),
    name: String(rawImage.name || "").trim() || fileName || "发票图片",
    fileName,
    url,
  };
}

function isRecordInvoiceUploaded(record) {
  return isRecordSettled(record) && Boolean(getSettlementInvoiceImage(record));
}

function isRecordDispatcherInvoiceUploaded(record) {
  return (
    isRecordSettled(record) &&
    Boolean(getDispatcherSettlementInvoiceImage(record))
  );
}

function getRecordWorkflowStatusLabelByKey(statusKey) {
  if (statusKey === "paid") return "已结算";
  if (statusKey === "uploaded") return "已上传/待结算";
  if (statusKey === "settled") return "已核对客户确认/待上传";
  if (statusKey === "partial_refunded") return "部分退款";
  if (statusKey === "refunded") return "退款";
  if (statusKey === "completed") return "已完成/待核对客户确认";
  if (statusKey === "checked") return "已确认/待完成";
  if (statusKey === "returned") return "已退单";
  return "已接待/待确认";
}

function normalizeSettlementWorkflowStatus(value) {
  const status = String(value || "")
    .trim()
    .toLowerCase();
  if (!status) return "";
  if (status === "已结算") return "paid";
  if (status === "已上传" || status === "已上传/待结算") return "uploaded";
  if (status === "已核对客户确认/待上传")
    return "settled";
  if (status === "已完成/待核对客户确认")
    return "completed";
  return "";
}

function getSettlementWorkflowStatusText(value) {
  const statusKey = normalizeSettlementWorkflowStatus(value);
  return statusKey
    ? getRecordWorkflowStatusLabelByKey(statusKey)
    : String(value || "").trim();
}

function getRecordSettlementLabel(record) {
  if (isRecordSettlementPaid(record))
    return getRecordWorkflowStatusLabelByKey("paid");
  if (isRecordInvoiceUploadedByRecordAccountant(record))
    return getRecordWorkflowStatusLabelByKey("uploaded");
  if (isRecordSettled(record))
    return getRecordWorkflowStatusLabelByKey("settled");
  return isRecordCompleted(record)
    ? getRecordWorkflowStatusLabelByKey("completed")
    : getRecordWorkflowStatusLabelByKey("completed");
}

function hasRecordRefundOperation(record) {
  return Boolean(getRecordRefundBadgeText(record));
}

function getRecordRefundBadgeText(record) {
  const refundStatus = String(record?.refundStatus || "")
    .trim()
    .toLowerCase();
  const checkStatus = String(record?.checkStatus || "")
    .trim()
    .toLowerCase();
  const total = Number(record?.totalPrice);
  const settlement = Number(record?.settlementPrice);
  const hasRefundMarker =
    refundStatus === "refunded" ||
    refundStatus === "partial_refunded" ||
    checkStatus === "refunded" ||
    checkStatus === "partial_refunded" ||
    Boolean(String(record?.refundedAt || "").trim());
  if (
    hasRefundMarker &&
    Math.round(total * 100) === 0 &&
    Math.round(settlement * 100) === 0
  )
    return "退单";
  if (refundStatus === "refunded" || checkStatus === "refunded") return "退单";
  if (refundStatus === "partial_refunded" || checkStatus === "partial_refunded")
    return "部分退款";
  return String(record?.refundedAt || "").trim() ? "部分退款" : "";
}

function isRecordCompleted(record) {
  const checkStatus = String(record?.checkStatus || "")
    .trim()
    .toLowerCase();
  return checkStatus === "completed" || checkStatus === "partial_refunded";
}

function isRecordCompletionStatus(record) {
  return isRecordCompleted(record);
}

function isRecordRefundable(record) {
  const statusKey = getRecordWorkflowStatusKey(record);
  return statusKey === "checked" || statusKey === "completed";
}

function hasRecordAccountantConfirmation(record) {
  const checkStatus = String(record?.checkStatus || "")
    .trim()
    .toLowerCase();
  return (
    checkStatus === "checked" ||
    checkStatus === "completed" ||
    checkStatus === "partial_refunded" ||
    checkStatus === "refunded" ||
    checkStatus === "returned" ||
    Boolean(String(record?.checkedAt || "").trim()) ||
    Boolean(String(record?.completedAt || "").trim()) ||
    Boolean(String(record?.returnedAt || "").trim())
  );
}

function getRecordWorkflowStatusKey(record) {
  const checkStatus = String(record?.checkStatus || "")
    .trim()
    .toLowerCase();
  if (checkStatus === "refunded" || checkStatus === "partial_refunded") {
    if (isRecordSettlementPaid(record)) return "paid";
    if (isRecordInvoiceUploaded(record)) return "uploaded";
    if (isRecordSettled(record)) return "settled";
    return "completed";
  }
  if (checkStatus === "returned") return "returned";
  if (checkStatus === "completed") {
    if (isRecordSettlementPaid(record)) return "paid";
    if (isRecordInvoiceUploaded(record)) return "uploaded";
    if (isRecordSettled(record)) return "settled";
    return "completed";
  }
  if (checkStatus === "checked") return "checked";
  return "pending";
}

function getRecordWorkflowStatusFilterLabel(record) {
  const statusKey = getRecordWorkflowStatusKey(record);
  return getRecordWorkflowStatusLabelByKey(statusKey);
}

function getRecordWorkflowStatusText(record) {
  const statusKey = getRecordWorkflowStatusKey(record);
  if (statusKey === "checked") return getRecordStatusChipText(record);
  return getRecordWorkflowStatusFilterLabel(record);
}

function getRecordSettlementFilterLabel(record) {
  return isRecordCompleted(record) ? getRecordSettlementLabel(record) : "";
}

function getRecordStatusWithSettlementText(record) {
  return getRecordWorkflowStatusText(record);
}

function isLinkedDispatcherRecordForCurrentAccount(record) {
  if (!record || typeof record !== "object") return false;
  const recordDispatcherTag = normalizeDispatcherTag(record?.dispatcher);
  if (isDispatcherLogin()) {
    const currentDispatcherTag = getCurrentDispatcherTag();
    if (!currentDispatcherTag) return false;
    const linkedAccountant =
      getLinkedAccountantDisplayNameByTag(currentDispatcherTag);
    return Boolean(linkedAccountant && recordDispatcherTag === currentDispatcherTag);
  }
  if (isAccountantLogin()) {
    const currentAccountant = getCurrentAccountantDisplayName();
    const dispatcherTags =
      getDispatcherTagsLinkedToAccountant(currentAccountant);
    return Boolean(
      recordDispatcherTag && dispatcherTags.includes(recordDispatcherTag),
    );
  }
  return false;
}

function shouldUseFullInvoiceUploadSource() {
  if (isDispatcherLogin()) {
    const currentDispatcherTag = getCurrentDispatcherTag();
    return Boolean(
      currentDispatcherTag &&
        getLinkedAccountantDisplayNameByTag(currentDispatcherTag),
    );
  }
  if (isAccountantLogin()) {
    const currentAccountant = getCurrentAccountantDisplayName();
    return getDispatcherTagsLinkedToAccountant(currentAccountant).length > 0;
  }
  return false;
}

function getInvoiceUploadSourceRecords(sourceRecords = records) {
  const source = Array.isArray(sourceRecords) ? sourceRecords : [];
  if (!shouldUseFullInvoiceUploadSource()) return source;
  return Array.isArray(records) && records.length ? records : source;
}

function canCurrentAccountUploadInvoiceToRecord(record) {
  if (!record || typeof record !== "object") return false;
  if (!isRecordCompletionStatus(record)) return false;
  if (!isRecordSettled(record)) return false;
  if (isAccountantLogin()) {
    const currentAccountant = getCurrentAccountantDisplayName();
    if (!currentAccountant) return false;
    if (isLinkedDispatcherRecordForCurrentAccount(record)) {
      return !getDispatcherSettlementInvoiceImage(record);
    }
    if (String(record?.accountant || "").trim() === currentAccountant)
      return !getSettlementInvoiceImage(record);
    return false;
  }
  if (isDispatcherLogin()) {
    const currentDispatcherTag = getCurrentDispatcherTag();
    const linkedAccountant =
      getLinkedAccountantDisplayNameByTag(currentDispatcherTag);
    return Boolean(
      currentDispatcherTag &&
      linkedAccountant &&
      normalizeDispatcherTag(record?.dispatcher) === currentDispatcherTag &&
      !getDispatcherSettlementInvoiceImage(record),
    );
  }
  return false;
}

function getAccountantInvoiceUploadTargetRecords(sourceRecords = records) {
  if (!canCurrentAccountUploadSettlementInvoice()) return [];
  const uploadSourceRecords = getInvoiceUploadSourceRecords(sourceRecords);
  return (Array.isArray(uploadSourceRecords) ? uploadSourceRecords : []).filter((item) => {
    return (
      isRecordCompletionStatus(item) &&
      canCurrentAccountUploadInvoiceToRecord(item)
    );
  });
}

function getCurrentInvoiceUploadAccountantName() {
  if (isAccountantLogin()) {
    return getCurrentAccountantDisplayName();
  }
  if (isDispatcherLogin()) {
    const currentDispatcherTag = getCurrentDispatcherTag();
    return getLinkedAccountantDisplayNameByTag(currentDispatcherTag) || "";
  }
  return "";
}

function getCurrentInvoiceUploadSettlementGroup(sourceRecords = records) {
  if (typeof getBossSettlementDetailSummary !== "function") return null;
  const accountantName = getCurrentInvoiceUploadAccountantName();
  if (!accountantName) return null;
  const { groups } = getBossSettlementDetailSummary(sourceRecords);
  return (
    (Array.isArray(groups) ? groups : []).find(
      (group) => String(group?.accountant || "").trim() === accountantName,
    ) || null
  );
}

function getAccountantInvoiceUploadSummary(sourceRecords = records) {
  const uploadSourceRecords = getInvoiceUploadSourceRecords(sourceRecords);
  const targetRecords = getAccountantInvoiceUploadTargetRecords(uploadSourceRecords);
  const settlementGroup = getCurrentInvoiceUploadSettlementGroup(uploadSourceRecords);
  if (settlementGroup) {
    const invoiceAmount = Number(settlementGroup.invoiceAmount) || 0;
    const taxAmount =
      Number(settlementGroup.taxAmount) ||
      getSettlementTaxAmount(invoiceAmount);
    const payableAmount =
      Number(settlementGroup.payableAmount) || invoiceAmount - taxAmount;
    return {
      targetRecords,
      count: Number(settlementGroup.recordCount) || targetRecords.length,
      uploadableCount: targetRecords.length,
      invoiceAmount,
      taxAmount,
      payableAmount,
      accountantInvoiceAmount:
        Number(settlementGroup.accountantInvoiceAmount) || 0,
      dispatcherInvoiceAmount:
        Number(settlementGroup.dispatcherInvoiceAmount) || 0,
      dispatcherPremiumSegments: Array.isArray(
        settlementGroup.dispatcherPremiumSegments,
      )
        ? settlementGroup.dispatcherPremiumSegments
        : [],
      dispatcherCommissionTerms: Array.isArray(
        settlementGroup.dispatcherCommissionTerms,
      )
        ? settlementGroup.dispatcherCommissionTerms
        : [],
      dispatcherPremiumAmount:
        Number(settlementGroup.dispatcherPremiumAmount) || 0,
      dispatcherCommissionAmount:
        Number(settlementGroup.dispatcherCommissionAmount) || 0,
      hasIncomeBreakdown: true,
      hasLinkedDispatcher: Boolean(settlementGroup.hasLinkedDispatcher),
      hasDispatcherIncomeBreakdown:
        Number(settlementGroup.dispatcherInvoiceAmount) > 0,
    };
  }

  let invoiceAmount = 0;
  let accountantInvoiceAmount = 0;
  let dispatcherInvoiceAmount = 0;

  if (isDispatcherLogin()) {
    const currentDispatcherTag = getCurrentDispatcherTag();
    const linkedAccountantName =
      getLinkedAccountantDisplayNameByTag(currentDispatcherTag);
    const dispatcherRecords = targetRecords.filter(
      (item) =>
        normalizeDispatcherTag(item?.dispatcher) === currentDispatcherTag,
    );
    accountantInvoiceAmount = linkedAccountantName
      ? targetRecords.reduce((sum, item) => {
          if (String(item?.accountant || "").trim() !== linkedAccountantName)
            return sum;
          const settlement = Number(item?.settlementPrice);
          return Number.isFinite(settlement) ? sum + settlement : sum;
        }, 0)
      : 0;
    const totalRawPremium = dispatcherRecords.reduce((sum, item) => {
      const premium = getPremiumValue(item);
      return Number.isFinite(premium) ? sum + premium : sum;
    }, 0);
    const premiumProfit = getTieredPremiumProfit(totalRawPremium);
    const dispatcherPrice = dispatcherRecords.reduce((sum, item) => {
      const totalPrice = Number(item?.totalPrice);
      const baseRate = getDispatcherBaseProfitRate(item);
      const price = Number.isFinite(totalPrice) ? totalPrice * baseRate : 0;
      return Number.isFinite(price) ? sum + price : sum;
    }, 0);
    dispatcherInvoiceAmount =
      (Number.isFinite(premiumProfit) ? premiumProfit : 0) +
      (Number.isFinite(dispatcherPrice) ? dispatcherPrice : 0);
    invoiceAmount = accountantInvoiceAmount + dispatcherInvoiceAmount;
  } else if (isAccountantLogin()) {
    const currentAccountant = getCurrentAccountantDisplayName();
    accountantInvoiceAmount = targetRecords.reduce((sum, item) => {
      if (isLinkedDispatcherRecordForCurrentAccount(item)) return sum;
      if (String(item?.accountant || "").trim() !== currentAccountant)
        return sum;
      const settlement = Number(item?.settlementPrice);
      return Number.isFinite(settlement) ? sum + settlement : sum;
    }, 0);
    const linkedDispatcherAmount = getLinkedDispatcherSettlementAmount(
      currentAccountant,
      uploadSourceRecords,
      {
        paid: false,
      },
    );
    const activeLinkedDispatcherAmount = linkedDispatcherAmount;
    dispatcherInvoiceAmount =
      Number(activeLinkedDispatcherAmount?.invoiceAmount) || 0;
    invoiceAmount = accountantInvoiceAmount + dispatcherInvoiceAmount;
    var dispatcherPremiumSegments = Array.isArray(
      activeLinkedDispatcherAmount?.premiumBreakdown?.segments,
    )
      ? activeLinkedDispatcherAmount.premiumBreakdown.segments
      : [];
    var dispatcherCommissionTerms = Array.isArray(
      activeLinkedDispatcherAmount?.dispatcherCommissionTerms,
    )
      ? activeLinkedDispatcherAmount.dispatcherCommissionTerms
      : [];
    var dispatcherPremiumAmount = Number(activeLinkedDispatcherAmount?.premium) || 0;
    var dispatcherCommissionAmount =
      Number(activeLinkedDispatcherAmount?.dispatcherPrice) || 0;
  }

  const taxAmount = getSettlementTaxAmount(invoiceAmount);
  return {
    targetRecords,
    count: targetRecords.length,
    uploadableCount: targetRecords.length,
    invoiceAmount,
    taxAmount,
    payableAmount: invoiceAmount - taxAmount,
    accountantInvoiceAmount,
    dispatcherInvoiceAmount,
    dispatcherPremiumSegments: Array.isArray(dispatcherPremiumSegments)
      ? dispatcherPremiumSegments
      : [],
    dispatcherCommissionTerms: Array.isArray(dispatcherCommissionTerms)
      ? dispatcherCommissionTerms
      : [],
    dispatcherPremiumAmount: Number(dispatcherPremiumAmount) || 0,
    dispatcherCommissionAmount: Number(dispatcherCommissionAmount) || 0,
    hasIncomeBreakdown: true,
    hasLinkedDispatcher: dispatcherInvoiceAmount > 0,
    hasDispatcherIncomeBreakdown: dispatcherInvoiceAmount > 0,
  };
}

function isBossSettlementDetailRecord(record) {
  if (!isRecordSettled(record)) return false;
  return isRecordCompletionStatus(record);
}

function getBossSettlementDetailRecords(sourceRecords = records) {
  return (Array.isArray(sourceRecords) ? sourceRecords : []).filter((item) =>
    isBossSettlementDetailRecord(item),
  );
}

function getDispatcherSettlementSummary(sourceRecords = records) {
  const detailRecords = getBossSettlementDetailRecords(sourceRecords);
  const groupMap = new Map();

  detailRecords.forEach((record) => {
    const dispatcher = String(record?.dispatcher || "").trim() || "未分配接待";
    const linkedAccountantDisplayName =
      getLinkedAccountantDisplayNameByTag(dispatcher);
    if (linkedAccountantDisplayName) {
      return;
    }
    const current = groupMap.get(dispatcher) || {
      dispatcher,
      recordIds: [],
      recordCount: 0,
      premiumList: [],
      dispatcherPriceList: [],
    };

    const recordId = String(record?.id || "").trim();
    if (recordId && !current.recordIds.includes(recordId)) {
      current.recordIds.push(recordId);
    }
    current.recordCount += 1;

    const premium = getPremiumValue(record);
    if (Number.isFinite(premium)) {
      current.premiumList.push(premium);
    }

    const totalPrice = Number(record?.totalPrice);
    const baseRate = getDispatcherBaseProfitRate(record);
    const dispatcherPrice = Number.isFinite(totalPrice)
      ? totalPrice * baseRate
      : 0;
    if (Number.isFinite(dispatcherPrice)) {
      current.dispatcherPriceList.push(dispatcherPrice);
    }

    groupMap.set(dispatcher, current);
  });

  const groups = Array.from(groupMap.values())
    .map((group) => {
      const totalRawPremium = group.premiumList.reduce(
        (sum, value) => sum + value,
        0,
      );
      const premium = getTieredPremiumProfit(totalRawPremium);
      const dispatcherPrice = group.dispatcherPriceList.reduce(
        (sum, value) => sum + value,
        0,
      );
      const invoiceAmount =
        Number.isFinite(premium) && Number.isFinite(dispatcherPrice)
          ? premium + dispatcherPrice
          : Number.NaN;
      const taxAmount = Number.isFinite(invoiceAmount)
        ? getSettlementTaxAmount(invoiceAmount)
        : 0;
      const payableAmount =
        Number.isFinite(invoiceAmount) && Number.isFinite(taxAmount)
          ? invoiceAmount - taxAmount
          : Number.NaN;

      return {
        dispatcher: group.dispatcher,
        recordIds: group.recordIds,
        recordCount: group.recordCount,
        premium: Number.isFinite(premium) ? premium : 0,
        dispatcherPrice: Number.isFinite(dispatcherPrice) ? dispatcherPrice : 0,
        invoiceAmount: Number.isFinite(invoiceAmount) ? invoiceAmount : 0,
        taxAmount: Number.isFinite(taxAmount) ? taxAmount : 0,
        payableAmount: Number.isFinite(payableAmount) ? payableAmount : 0,
      };
    })
    .sort((left, right) => {
      const nameCompare = String(left.dispatcher || "").localeCompare(
        String(right.dispatcher || ""),
        "zh-CN",
        {
          numeric: true,
          sensitivity: "base",
        },
      );
      if (nameCompare !== 0) return nameCompare;
      return right.recordCount - left.recordCount;
    });

  const totalPremium = groups.reduce((sum, g) => sum + (g.premium || 0), 0);
  const totalDispatcherPrice = groups.reduce(
    (sum, g) => sum + (g.dispatcherPrice || 0),
    0,
  );
  const totalInvoiceAmount = groups.reduce(
    (sum, g) => sum + (g.invoiceAmount || 0),
    0,
  );
  const totalTaxAmount = groups.reduce((sum, g) => sum + (g.taxAmount || 0), 0);
  const totalPayableAmount = groups.reduce(
    (sum, g) => sum + (g.payableAmount || 0),
    0,
  );

  return {
    groups,
    recordCount: detailRecords.length,
    dispatcherCount: groups.length,
    totalPremium,
    totalDispatcherPrice,
    totalInvoiceAmount,
    totalTaxAmount,
    totalPayableAmount,
  };
}

function getBossSettlementRecordState(record) {
  if (isRecordSettled(record)) return "settled";
  const checkStatus = String(record?.checkStatus || "")
    .trim()
    .toLowerCase();
  if (checkStatus === "refunded") return "refunded";
  if (checkStatus === "returned") return "returned";
  if (!isRecordCompletionStatus(record)) return "not_completed";
  return "ready";
}

function getBossSettlementSelectionSummary(sourceRecords = records) {
  const selectedRecords = getSelectedBossRecords(sourceRecords);
  const readySelectedRecords = selectedRecords.filter(
    (item) => getBossSettlementRecordState(item) === "ready",
  );
  const alreadySettledCount = selectedRecords.filter(
    (item) => getBossSettlementRecordState(item) === "settled",
  ).length;
  const returnedCount = selectedRecords.filter(
    (item) => getBossSettlementRecordState(item) === "returned",
  ).length;
  const refundedCount = selectedRecords.filter(
    (item) => getBossSettlementRecordState(item) === "refunded",
  ).length;
  const totalSettlement = readySelectedRecords.reduce((sum, item) => {
    const settlement = Number(item?.settlementPrice);
    return Number.isFinite(settlement) ? sum + settlement : sum;
  }, 0);
  return {
    selectedRecords,
    readySelectedRecords,
    count: selectedRecords.length,
    readyCount: readySelectedRecords.length,
    alreadySettledCount,
    returnedCount,
    refundedCount,
    skippedCount: alreadySettledCount + returnedCount + refundedCount,
    totalSettlement,
  };
}

function setRecentBossSettlementRecordIds(recordIds) {
  recentBossSettlementRecordIds = Array.from(
    new Set(
      (Array.isArray(recordIds) ? recordIds : [])
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  );
  if (
    !recentBossSettlementRecordIds.length &&
    typeof closeBossSettlementDetailModal === "function"
  ) {
    closeBossSettlementDetailModal();
  }
  if (typeof updateBossSettlementDetailControls === "function") {
    updateBossSettlementDetailControls();
  }
}

function getBossSettlementDetailStatusKey(recordCount, uploadedCount) {
  if (recordCount > 0 && uploadedCount >= recordCount) return "uploaded";
  if (uploadedCount > 0) return "partial";
  return "pending";
}

function getRecordComparisonSignature(record) {
  const item = record && typeof record === "object" ? record : {};
  const payment = Number(item.paymentPrice);
  const total = Number(item.totalPrice);
  const settlement = Number(item.settlementPrice);
  const feedbackImages = Array.isArray(item.serviceFeedbackImages)
    ? item.serviceFeedbackImages
        .map((image) => {
          if (!image || typeof image !== "object") return "";
          return [
            String(image.id || ""),
            String(image.url || ""),
            String(image.fileName || ""),
          ].join("\u0004");
        })
        .join("\u0003")
    : "";
  const invoiceImage = getSettlementInvoiceImage(item);
  const operationHistory = Array.isArray(item.operationHistory)
    ? item.operationHistory
        .map((entry) => {
          if (!entry || typeof entry !== "object") return "";
          const changes = Array.isArray(entry.changes)
            ? entry.changes
                .map((change) => {
                  if (!change || typeof change !== "object") return "";
                  return [
                    String(change.field || ""),
                    String(change.before ?? ""),
                    String(change.after ?? ""),
                  ].join("\u0005");
                })
                .join("\u0004")
            : "";
          return [
            String(entry.historyId || ""),
            String(entry.operatedAt || ""),
            String(entry.operatedBy || ""),
            String(entry.operatedRole || ""),
            String(entry.actionKey || ""),
            String(entry.actionLabel || ""),
            changes,
          ].join("\u0004");
        })
        .join("\u0003")
    : "";

  return [
    String(item.id || ""),
    String(item.createdAt || ""),
    String(item.date || ""),
    isMonthlySettlementRecord(item) ? "1" : "0",
    String(item.dispatcher || ""),
    String(item.accountant || ""),
    String(item.platform || ""),
    String(item.shopName || ""),
    String(item.orderNo || ""),
    String(item.source || ""),
    String(item.customer || ""),
    String(item.summary || ""),
    String(item.checkStatus || ""),
    String(item.checkedAt || ""),
    String(item.checkedBy || ""),
    String(item.completedAt || ""),
    String(item.completedBy || ""),
    String(item.customerFeedback || ""),
    String(item.returnedAt || ""),
    String(item.returnedBy || ""),
    isRecordSettled(item) ? "1" : "0",
    String(item.settledAt || ""),
    String(item.settledBy || ""),
    invoiceImage
      ? [
          String(invoiceImage.id || ""),
          String(invoiceImage.url || ""),
          String(invoiceImage.fileName || ""),
        ].join("\u0004")
      : "",
    String(item.invoiceUploadedAt || ""),
    String(item.invoiceUploadedBy || ""),
    String(item.invoiceUploadedByUsername || ""),
    Number.isFinite(payment) ? payment : "",
    Number.isFinite(total) ? total : "",
    Number.isFinite(settlement) ? settlement : "",
    feedbackImages,
    operationHistory,
  ].join("\u0001");
}

function resetUpdatedRowHighlightState() {
  highlightedUpdatedRecordIds = new Set();
  dismissedUpdatedRecordSignatures = {};
}

function getUpdatedRowDismissStorageKey(accountName = currentAccount) {
  const normalizedAccount = String(accountName || "").trim();
  if (isBossLogin(normalizedAccount)) {
    return `${STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX}_boss`;
  }
  const dispatcherTag = getDispatcherTagForAccount(normalizedAccount);
  if (dispatcherTag) {
    return `${STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX}_${dispatcherTag}`;
  }
  const accountantProfile = getAccountantProfileByLoginName(normalizedAccount);
  const accountantKey = String(accountantProfile?.username || normalizedAccount)
    .trim()
    .toLowerCase();
  return accountantKey
    ? `${STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX}_acct_${accountantKey}`
    : "";
}

function getUpdatedRowHighlightStorageKey(accountName = currentAccount) {
  const normalizedAccount = String(accountName || "").trim();
  if (isBossLogin(normalizedAccount)) {
    return `${STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX}_boss`;
  }
  const dispatcherTag = getDispatcherTagForAccount(normalizedAccount);
  if (dispatcherTag) {
    return `${STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX}_${dispatcherTag}`;
  }
  const accountantProfile = getAccountantProfileByLoginName(normalizedAccount);
  const accountantKey = String(accountantProfile?.username || normalizedAccount)
    .trim()
    .toLowerCase();
  return accountantKey
    ? `${STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX}_acct_${accountantKey}`
    : "";
}

function saveUpdatedRowDismissState() {
  const dismissKey = getUpdatedRowDismissStorageKey();
  const highlightKey = getUpdatedRowHighlightStorageKey();
  const highlightedIds = Array.from(highlightedUpdatedRecordIds || []).filter(
    (recordId) => Boolean(String(recordId || "").trim()),
  );
  if (highlightKey) {
    if (highlightedIds.length) {
      setPersistentStateItem(highlightKey, JSON.stringify(highlightedIds));
    } else {
      removePersistentStateItem(highlightKey);
    }
  }

  const entries = Object.entries(dismissedUpdatedRecordSignatures || {}).filter(
    ([recordId, signature]) =>
      Boolean(String(recordId || "").trim()) &&
      Boolean(String(signature || "").trim()),
  );
  if (!dismissKey) return;
  if (!entries.length) {
    removePersistentStateItem(dismissKey);
    return;
  }
  setPersistentStateItem(
    dismissKey,
    JSON.stringify(Object.fromEntries(entries)),
  );
}

function loadUpdatedRowDismissState() {
  highlightedUpdatedRecordIds = new Set();
  dismissedUpdatedRecordSignatures = {};
  const highlightKey = getUpdatedRowHighlightStorageKey();
  if (highlightKey) {
    const highlightedRaw = String(
      getPersistentStateItem(highlightKey) || "",
    ).trim();
    if (highlightedRaw) {
      try {
        const parsed = JSON.parse(highlightedRaw);
        if (Array.isArray(parsed)) {
          highlightedUpdatedRecordIds = new Set(
            parsed.filter((recordId) => Boolean(String(recordId || "").trim())),
          );
        }
      } catch (error) {
        console.error(error);
        highlightedUpdatedRecordIds = new Set();
      }
    }
  }

  const dismissKey = getUpdatedRowDismissStorageKey();
  if (!dismissKey) return;
  const raw = String(getPersistentStateItem(dismissKey) || "").trim();
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
    dismissedUpdatedRecordSignatures = Object.fromEntries(
      Object.entries(parsed).filter(
        ([recordId, signature]) =>
          Boolean(String(recordId || "").trim()) &&
          Boolean(String(signature || "").trim()),
      ),
    );
  } catch (error) {
    console.error(error);
    dismissedUpdatedRecordSignatures = {};
  }
}

function normalizeHighlightOperatorValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getRecordHistoryEntrySignature(entry) {
  if (!entry || typeof entry !== "object") return "";
  const changes = Array.isArray(entry.changes)
    ? entry.changes
        .map((change) => {
          if (!change || typeof change !== "object") return "";
          return [
            String(change.field || ""),
            String(change.before ?? ""),
            String(change.after ?? ""),
          ].join("\u0005");
        })
        .join("\u0004")
    : "";
  return [
    String(entry.historyId || ""),
    String(entry.operatedAt || ""),
    String(entry.operatedBy || ""),
    String(entry.operatedRole || ""),
    String(entry.actionKey || ""),
    String(entry.actionLabel || ""),
    changes,
  ].join("\u0004");
}

function getLatestRecordHistoryEntry(record) {
  const historyItems = Array.isArray(record?.operationHistory)
    ? record.operationHistory
    : [];
  return (
    historyItems.find((entry) => entry && typeof entry === "object") || null
  );
}

function getCurrentUserHighlightContext() {
  const accountName = String(currentAccount || "").trim();
  const role =
    normalizeLoginRole(currentAccountRole) ||
    inferRoleByAccountName(accountName);
  if (!accountName || !role) return null;
  const candidates = new Set();
  const addCandidate = (value) => {
    const normalized = normalizeHighlightOperatorValue(value);
    if (normalized) {
      candidates.add(normalized);
    }
  };
  addCandidate(accountName);
  addCandidate(resolveLoginAccountInput(accountName));
  if (role === "accountant") {
    addCandidate(getCurrentAccountantDisplayName());
  } else if (role === "dispatcher") {
    const dispatcherTag = getDispatcherTagForAccount(accountName);
    if (dispatcherTag) {
      addCandidate(getDispatcherDisplayNameByTag(dispatcherTag));
    }
  } else if (role === "boss") {
    BOSS_LOGIN_ACCOUNTS.forEach((value) => addCandidate(value));
    addCandidate(BOSS_LOGIN_LEGACY_ACCOUNT);
  }
  if (!candidates.size) return null;
  return { role, candidates };
}

function isCurrentUserOperationEntry(entry) {
  const currentUser = getCurrentUserHighlightContext();
  if (!currentUser || !entry || typeof entry !== "object") return false;
  const operatedBy = normalizeHighlightOperatorValue(entry.operatedBy);
  const operatedRole = normalizeLoginRole(entry.operatedRole);
  if (!operatedBy) return false;
  if (operatedRole && operatedRole !== currentUser.role) return false;
  return currentUser.candidates.has(operatedBy);
}

function isRecordChangedByCurrentUser(previousRecord, nextRecord) {
  const previousLatestEntry = getLatestRecordHistoryEntry(previousRecord);
  const nextLatestEntry = getLatestRecordHistoryEntry(nextRecord);
  if (!nextLatestEntry) return false;
  if (
    getRecordHistoryEntrySignature(previousLatestEntry) ===
    getRecordHistoryEntrySignature(nextLatestEntry)
  ) {
    return false;
  }
  return isCurrentUserOperationEntry(nextLatestEntry);
}

function syncUpdatedRowHighlightState(
  previousRecords,
  nextRecords,
  options = {},
) {
  const { trackChanges = false } = options;
  const previousList = Array.isArray(previousRecords) ? previousRecords : [];
  const nextList = Array.isArray(nextRecords) ? nextRecords : [];

  if (!currentAccount) {
    highlightedUpdatedRecordIds = new Set();
    dismissedUpdatedRecordSignatures = {};
    return;
  }

  const previousSignatureMap = new Map();
  const previousRecordMap = new Map();
  previousList.forEach((item) => {
    const recordId = String(item?.id || "").trim();
    if (!recordId) return;
    previousRecordMap.set(recordId, item);
    previousSignatureMap.set(recordId, getRecordComparisonSignature(item));
  });

  const nextDismissedSignatures = {};
  const nextHighlightedIds = new Set();
  const currentHighlightedIds = new Set(
    Array.from(highlightedUpdatedRecordIds || []).filter((recordId) =>
      Boolean(String(recordId || "").trim()),
    ),
  );

  nextList.forEach((item) => {
    const recordId = String(item?.id || "").trim();
    if (!recordId) return;
    const nextSignature = getRecordComparisonSignature(item);
    if (!nextSignature) return;
    const previousRecord = previousRecordMap.get(recordId) || null;
    const latestOperatorIsCurrentUser = isCurrentUserOperationEntry(
      getLatestRecordHistoryEntry(item),
    );
    const changedByCurrentUser = isRecordChangedByCurrentUser(
      previousRecord,
      item,
    );
    if (dismissedUpdatedRecordSignatures[recordId] === nextSignature) {
      nextDismissedSignatures[recordId] = nextSignature;
      return;
    }
    if (currentHighlightedIds.has(recordId) && !latestOperatorIsCurrentUser) {
      nextHighlightedIds.add(recordId);
    }
    if (!trackChanges) return;
    const previousSignature = previousSignatureMap.get(recordId);
    if (previousSignature !== nextSignature && !changedByCurrentUser) {
      nextHighlightedIds.add(recordId);
    }
  });

  dismissedUpdatedRecordSignatures = nextDismissedSignatures;
  highlightedUpdatedRecordIds = nextHighlightedIds;
  saveUpdatedRowDismissState();
}

function isUpdatedRecordHighlighted(recordIdRaw) {
  const recordId = String(recordIdRaw || "").trim();
  if (!recordId) return false;
  return highlightedUpdatedRecordIds.has(recordId);
}

function getUpdatedRecordIndicatorLabel(record) {
  const item = record && typeof record === "object" ? record : {};
  const latestEntry = getLatestRecordHistoryEntry(item);
  const actionKey = normalizeText(latestEntry?.actionKey, 32).toLowerCase();
  if (!actionKey) {
    return "新派单";
  }
  if (actionKey === "checked") return "已确认";
  if (actionKey === "completed") return "已完成";
  if (actionKey === "partial_refunded") return "部分退款";
  if (actionKey === "refunded") return "已退款";
  if (actionKey === "returned") return "已退单";
  if (actionKey === "settled") return "已核对客户确认";
  if (actionKey === "invoice_uploaded") return "发票已上传";
  if (actionKey === "invoice_reuploaded") return "发票已修改";
  if (actionKey === "updated") return "信息更新";
  return normalizeText(latestEntry?.actionLabel, 32) || "信息更新";
}

function dismissUpdatedRowHighlight(recordIdRaw) {
  const recordId = String(recordIdRaw || "").trim();
  if (!recordId) return;
  const targetRecord = records.find(
    (item) => String(item?.id || "").trim() === recordId,
  );
  if (!targetRecord) return;
  const nextSignature = getRecordComparisonSignature(targetRecord);
  if (!nextSignature) return;
  highlightedUpdatedRecordIds.delete(recordId);
  dismissedUpdatedRecordSignatures = {
    ...(dismissedUpdatedRecordSignatures || {}),
    [recordId]: nextSignature,
  };
  saveUpdatedRowDismissState();
}

function addUpdatedRowHighlights(recordIds) {
  const normalizedIds = (Array.isArray(recordIds) ? recordIds : [recordIds])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  if (!normalizedIds.length) return;
  const nextHighlightedIds = new Set(highlightedUpdatedRecordIds || []);
  const nextDismissedSignatures = {
    ...(dismissedUpdatedRecordSignatures || {}),
  };
  normalizedIds.forEach((recordId) => {
    nextHighlightedIds.add(recordId);
    delete nextDismissedSignatures[recordId];
  });
  highlightedUpdatedRecordIds = nextHighlightedIds;
  dismissedUpdatedRecordSignatures = nextDismissedSignatures;
  saveUpdatedRowDismissState();
}

function resolveLoginAccountInput(rawInput) {
  const source = String(rawInput || "").trim();
  if (!source) return "";
  const lower = source.toLowerCase();
  if (BOSS_LOGIN_CODE_TO_ACCOUNT[lower]) {
    return BOSS_LOGIN_CODE_TO_ACCOUNT[lower];
  }
  return DISPATCHER_LOGIN_CODE_TO_ACCOUNT[lower] || source;
}

function isBossAccountName(accountNameRaw) {
  const normalized = String(
    resolveLoginAccountInput(accountNameRaw) || accountNameRaw || "",
  )
    .trim()
    .toLowerCase();
  return Boolean(normalized && BOSS_LOGIN_ACCOUNT_SET.has(normalized));
}

function clearCurrentAccountIdentity() {
  currentAccount = "";
  currentAccountRole = "";
  currentAccountDisplayName = "";
  currentAccountRealName = "";
  currentAccountPhone = "";
  currentLoginAccount = "";
}

function hasAuthenticatedAccount() {
  return Boolean(
    String(currentAccount || "").trim() &&
    String(currentLoginAccount || "").trim(),
  );
}

function validateCurrentAccount() {
  if (!currentAccount) return;
  if (inferRoleByAccountName(currentAccount) === "dispatcher") {
    const normalizedDispatcherAccount =
      resolveLoginAccountInput(currentAccount);
    if (
      normalizedDispatcherAccount &&
      normalizedDispatcherAccount !== currentAccount
    ) {
      currentAccount = normalizedDispatcherAccount;
      saveToStorage();
    }
  }
  if (normalizeLoginRole(currentAccountRole) === "boss") return;
  if (
    !normalizeLoginRole(currentAccountRole) &&
    inferRoleByAccountName(currentAccount) === "boss"
  )
    return;
  if (normalizeLoginRole(currentAccountRole) === "dispatcher") return;
  if (
    !normalizeLoginRole(currentAccountRole) &&
    inferRoleByAccountName(currentAccount) === "dispatcher"
  )
    return;
  if (!accountants.length) return;
  if (getAccountantProfileByLoginName(currentAccount)) return;
  clearCurrentAccountIdentity();
  saveToStorage();
}

function getVisibleRecords() {
  const dispatcherTag = isDispatcherLogin() ? getCurrentDispatcherTag() : "";
  const accountantName = isAccountantLogin()
    ? getCurrentAccountantDisplayName()
    : "";
  const mainTableRecords = records.filter((item) => !item?.hiddenFromMainTable);
  if (dispatcherTag) {
    return mainTableRecords.filter(
      (item) => normalizeDispatcherTag(item.dispatcher) === dispatcherTag,
    );
  }
  if (!accountantName) return mainTableRecords;
  return mainTableRecords.filter(
    (item) => String(item.accountant || "").trim() === accountantName,
  );
}

function getVisibleRecycleBinRecords() {
  const dispatcherTag = isDispatcherLogin() ? getCurrentDispatcherTag() : "";
  const accountantName = isAccountantLogin()
    ? getCurrentAccountantDisplayName()
    : "";
  if (dispatcherTag) {
    return recycleBinRecords.filter((entry) => {
      const record =
        entry && typeof entry === "object" ? entry.record || {} : {};
      return normalizeDispatcherTag(record.dispatcher) === dispatcherTag;
    });
  }
  if (!accountantName) return recycleBinRecords;
  return recycleBinRecords.filter((entry) => {
    const record = entry && typeof entry === "object" ? entry.record || {} : {};
    return String(record.accountant || "").trim() === accountantName;
  });
}

function getVisibleAccountantOperationLogs() {
  const accountName = String(currentAccount || "").trim();
  if (!accountName) return [];

  if (isBossLogin(accountName)) {
    return accountantOperationLogs;
  }

  if (isAccountantLogin(accountName)) {
    return accountantOperationLogs.filter(
      (entry) =>
        String(entry?.operatedByUsername || entry?.operatedBy || "").trim() ===
        accountName,
    );
  }

  const dispatcherTag = getCurrentDispatcherTag();
  if (!dispatcherTag) return [];
  return accountantOperationLogs.filter(
    (entry) => normalizeDispatcherTag(entry?.dispatcher) === dispatcherTag,
  );
}

function padDateTimeNumber(value) {
  return String(Math.trunc(Number(value) || 0)).padStart(2, "0");
}

function formatDateFromDate(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = padDateTimeNumber(date.getMonth() + 1);
  const d = padDateTimeNumber(date.getDate());
  return `${y}-${m}-${d}`;
}

function formatDateTimeFromDate(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  const hh = padDateTimeNumber(date.getHours());
  const mm = padDateTimeNumber(date.getMinutes());
  const ss = padDateTimeNumber(date.getSeconds());
  const dateText = formatDateFromDate(date);
  return dateText ? `${dateText} ${hh}:${mm}:${ss}` : "";
}

function parseDateTimeValue(rawDateTime) {
  const source = String(rawDateTime || "").trim();
  if (!source) return Number.NaN;
  const structuredMatch = source.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (structuredMatch) {
    const year = Number(structuredMatch[1]);
    const month = Number(structuredMatch[2]);
    const day = Number(structuredMatch[3]);
    const hour = Number(structuredMatch[4] || 0);
    const minute = Number(structuredMatch[5] || 0);
    const second = Number(structuredMatch[6] || 0);
    const date = new Date(year, month - 1, day, hour, minute, second);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date.getHours() === hour &&
      date.getMinutes() === minute &&
      date.getSeconds() === second
    ) {
      return date.getTime();
    }
  }
  const timestamp = Date.parse(source);
  return Number.isNaN(timestamp) ? Number.NaN : timestamp;
}

function getCurrentDateTimeString() {
  return formatDateTimeFromDate(new Date());
}

function getTodayISODate() {
  return formatDateFromDate(new Date());
}

function formatDateTimeLocalInputValue(rawDateTime = new Date()) {
  const timestamp =
    rawDateTime instanceof Date
      ? rawDateTime.getTime()
      : parseDateTimeValue(rawDateTime);
  if (!Number.isFinite(timestamp)) {
    return formatDateTimeLocalInputValue(new Date());
  }
  const date = new Date(timestamp);
  return `${formatDateFromDate(date)}T${padDateTimeNumber(date.getHours())}:${padDateTimeNumber(date.getMinutes())}:${padDateTimeNumber(date.getSeconds())}`;
}

function formatDateInputValue(rawDate = new Date()) {
  const timestamp =
    rawDate instanceof Date ? rawDate.getTime() : parseDateTimeValue(rawDate);
  if (!Number.isFinite(timestamp)) {
    return getTodayISODate();
  }
  return formatDateFromDate(new Date(timestamp));
}

function normalizeCompleteModalMode(modeRaw) {
  return String(modeRaw || "")
    .trim()
    .toLowerCase() === "view"
    ? "view"
    : "edit";
}

function isCompleteModalViewMode() {
  return normalizeCompleteModalMode(completeModalMode) === "view";
}

function setCompleteModalMode(modeRaw) {
  completeModalMode = normalizeCompleteModalMode(modeRaw);
  const isViewMode = isCompleteModalViewMode();
  if (completeModalTitle) {
    completeModalTitle.textContent = isViewMode ? "查看客户反馈" : "完成数据";
  }
  if (completeForm) {
    completeForm.classList.toggle("readonly", isViewMode);
  }
  if (completeTimeInput) {
    completeTimeInput.readOnly = true;
    completeTimeInput.tabIndex = -1;
    completeTimeInput.setAttribute("aria-readonly", "true");
  }
  if (completeCustomerFeedbackInput) {
    completeCustomerFeedbackInput.readOnly = isViewMode;
  }
  if (completeModalSubmitBtn) {
    completeModalSubmitBtn.hidden = isViewMode;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

function toISOStringFromDateTimeLocal(rawValue) {
  const source = String(rawValue || "").trim();
  if (!source) return "";
  const timestamp = parseDateTimeValue(source);
  if (!Number.isFinite(timestamp)) return "";
  return formatDateTimeFromDate(new Date(timestamp));
}

function toMoney(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" && value.trim() === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return num.toFixed(2);
}

function formatTrimmedPercent(value) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return "";
  return `${Number(percent.toFixed(2))}%`;
}

function getSettlementPercentValue(source) {
  if (typeof source?.totalPrice === "string" && source.totalPrice.trim() === "")
    return Number.NaN;
  if (
    typeof source?.settlementPrice === "string" &&
    source.settlementPrice.trim() === ""
  )
    return Number.NaN;
  const total = Number(source?.totalPrice);
  const settlement = Number(source?.settlementPrice);
  if (!Number.isFinite(total) || !Number.isFinite(settlement) || total <= 0)
    return Number.NaN;
  return (settlement / total) * 100;
}

function formatSettlementPercentDisplay(source) {
  const percent = getSettlementPercentValue(source);
  if (!Number.isFinite(percent)) return "";
  const roundedPercent = Math.round(percent * 100) / 100;
  if (Math.abs(roundedPercent - 60) < 0.005) return "";
  return formatTrimmedPercent(roundedPercent);
}

function formatSettlementPriceDisplay(source) {
  const priceText = toMoney(source?.settlementPrice);
  if (!priceText) return "";
  const percentText = formatSettlementPercentDisplay(source);
  return percentText ? `${priceText}（${percentText}）` : priceText;
}

function getSettlementTaxAmount(value) {
  const income = Number(value);
  if (!Number.isFinite(income) || income <= 0) return 0;
  if (income <= 800) return 0;
  if (income <= 4000) {
    return (income - 800) * 0.2;
  }
  return income * 0.16;
}

function getPremiumValue(source) {
  if (
    typeof source?.paymentPrice === "string" &&
    source.paymentPrice.trim() === ""
  )
    return Number.NaN;
  if (typeof source?.totalPrice === "string" && source.totalPrice.trim() === "")
    return Number.NaN;
  const payment = Number(source?.paymentPrice);
  const total = Number(source?.totalPrice);
  if (!Number.isFinite(payment) || !Number.isFinite(total)) return Number.NaN;
  return payment - total;
}

function formatSignedMoneyFactor(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return amount < 0 ? `(${toMoney(amount)})` : toMoney(amount);
}

function formatMoneyExpression(values, mapValue) {
  const sourceList = Array.isArray(values) ? values : [];
  const terms = sourceList.map((value) => mapValue(value)).filter(Boolean);
  return terms.length ? terms.join(" + ") : "0.00";
}

function getTieredPremiumProfitBreakdown(rawPremium) {
  const premium = Number(rawPremium);
  if (!Number.isFinite(premium)) return null;
  if (premium <= 0) {
    const profit = premium * 0.45;
    return {
      premium,
      profit,
      segments: [
        {
          amount: premium,
          rate: 0.45,
          profit,
        },
      ],
    };
  }

  let remaining = premium;
  let profit = 0;
  const segments = [];

  const appendSegment = (amount, rate) => {
    if (amount <= 0) return;
    const segmentProfit = amount * rate;
    segments.push({
      amount,
      rate,
      profit: segmentProfit,
    });
    profit += segmentProfit;
    remaining -= amount;
  };

  appendSegment(Math.min(remaining, 1000), 0.45);
  appendSegment(Math.min(remaining, 1000), 0.5);
  appendSegment(remaining, 0.55);

  return {
    premium,
    profit,
    segments,
  };
}

function getProfitParts(source) {
  const total = Number(source?.totalPrice);
  const premium = getPremiumValue(source);
  if (!Number.isFinite(total) || !Number.isFinite(premium)) return null;
  const baseProfitRate = getDispatcherBaseProfitRate(source);
  const baseProfit = total * baseProfitRate;
  return {
    baseProfit,
    baseProfitRate,
    premium,
    totalProfit: baseProfit + getTieredPremiumProfit(premium),
  };
}

function getTieredPremiumProfit(rawPremium) {
  const breakdown = getTieredPremiumProfitBreakdown(rawPremium);
  return breakdown ? breakdown.profit : Number.NaN;
}

function getProfitValue(source) {
  const parts = getProfitParts(source);
  if (!parts) return Number.NaN;
  return parts.totalProfit;
}

function formatProfitDisplay(source) {
  const parts = getProfitParts(source);
  if (!parts) return "";
  const premiumText =
    parts.premium < 0
      ? `(${toMoney(parts.premium)} * ?%)`
      : `${toMoney(parts.premium)} * ?%`;
  return `${toMoney(parts.baseProfit)} + ${premiumText}`;
}

function getProfitTotal(sourceRecords) {
  const summary = (Array.isArray(sourceRecords) ? sourceRecords : []).reduce(
    (current, item) => {
      const total = Number(item?.totalPrice);
      const premium = getPremiumValue(item);
      if (Number.isFinite(total)) {
        current.totalBase += total * getDispatcherBaseProfitRate(item);
      }
      if (Number.isFinite(premium)) {
        current.totalPremium += premium;
      }
      return current;
    },
    { totalBase: 0, totalPremium: 0 },
  );
  return summary.totalBase + getTieredPremiumProfit(summary.totalPremium);
}

function getProfitTotalBreakdown(sourceRecords) {
  const summary = (Array.isArray(sourceRecords) ? sourceRecords : []).reduce(
    (current, item) => {
      const total = Number(item?.totalPrice);
      const premium = getPremiumValue(item);
      if (Number.isFinite(total)) {
        current.baseTerms.push(total * getDispatcherBaseProfitRate(item));
      }
      if (Number.isFinite(premium)) {
        current.premiumTerms.push(premium);
      }
      return current;
    },
    { baseTerms: [], premiumTerms: [] },
  );

  const totalBase = summary.baseTerms.reduce((sum, value) => sum + value, 0);
  const totalPremium = summary.premiumTerms.reduce(
    (sum, value) => sum + value,
    0,
  );
  const premiumBreakdown = getTieredPremiumProfitBreakdown(totalPremium);
  const premiumProfit = premiumBreakdown ? premiumBreakdown.profit : Number.NaN;
  return {
    baseTerms: summary.baseTerms,
    premiumTerms: summary.premiumTerms,
    totalBase,
    totalPremium,
    premiumBreakdown,
    premiumProfit,
    totalProfit: totalBase + premiumProfit,
  };
}

function formatProfitTotalTooltip(sourceRecords) {
  const breakdown = getProfitTotalBreakdown(sourceRecords);
  if (!Number.isFinite(breakdown.totalProfit)) return "";

  const baseExpression = formatMoneyExpression(breakdown.baseTerms, (value) =>
    formatSignedMoneyFactor(value),
  );
  const premiumExpression = formatMoneyExpression(
    breakdown.premiumTerms,
    (value) => formatSignedMoneyFactor(value),
  );
  const premiumTierLines = (breakdown.premiumBreakdown?.segments || []).map(
    (segment) =>
      `${formatSignedMoneyFactor(segment.amount)} * ${(segment.rate * 100).toFixed(0)}% = ${toMoney(segment.profit)}`,
  );

  return [
    `接待收益合计：${toMoney(breakdown.totalProfit)}`,
    `A部分：${baseExpression} = ${toMoney(breakdown.totalBase)}`,
    `B部分溢价合计：${premiumExpression} = ${toMoney(breakdown.totalPremium)}`,
    "B部分阶梯计算：",
    ...(premiumTierLines.length ? premiumTierLines : ["0.00 * 45% = 0.00"]),
    `总接待收益：${toMoney(breakdown.totalBase)} + ${toMoney(breakdown.premiumProfit)} = ${toMoney(breakdown.totalProfit)}`,
  ].join("\n");
}

function formatDateTimeDisplay(rawDateTime) {
  const source = String(rawDateTime || "").trim();
  const timestamp = parseDateTimeValue(source);
  if (Number.isNaN(timestamp)) return source;
  return formatDateTimeFromDate(new Date(timestamp));
}

function normalizeBuildVersion(rawVersion) {
  const version = String(rawVersion || "")
    .trim()
    .replace(/^v/i, "");
  return version ? `v${version}` : "v--";
}

function renderBuildInfo(buildInfo) {
  const source = buildInfo && typeof buildInfo === "object" ? buildInfo : {};
  applyRuntimeEnvironment(source.appEnv || runtimeAppEnvironment);
  if (!buildInfoPanel || !buildVersionText || !buildTimeText) return;
  const builtAt = String(source.builtAt || "").trim();
  buildVersionText.textContent = `版本 ${normalizeBuildVersion(source.version)}`;
  buildTimeText.textContent = builtAt
    ? `Build ${formatDateTimeDisplay(builtAt)}`
    : "Build --";
}

function formatTimeDisplay(rawDateTime) {
  const source = String(rawDateTime || "").trim();
  const timestamp = parseDateTimeValue(source);
  if (Number.isNaN(timestamp)) return source;
  const date = new Date(timestamp);
  const hh = padDateTimeNumber(date.getHours());
  const mm = padDateTimeNumber(date.getMinutes());
  const ss = padDateTimeNumber(date.getSeconds());
  return `${hh}:${mm}:${ss}`;
}

function setHintState(node, className, text, state = "idle") {
  if (!node) return;
  const normalizedText = String(text || "").trim();
  node.textContent = normalizedText;
  node.className = `${className} ${state}`;
  node.hidden = !normalizedText;
}

function mountAppStatusHint() {
  if (!appStatusHint || appStatusHint.parentElement === document.body) return;
  document.body.appendChild(appStatusHint);
}

function getElementFormControls(root) {
  if (!(root instanceof HTMLElement)) return [];
  return Array.from(
    root.querySelectorAll("button, input, textarea, select"),
  ).filter(
    (node) =>
      node instanceof HTMLButtonElement ||
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement ||
      node instanceof HTMLSelectElement,
  );
}

function setButtonLoading(button, active, loadingText = "") {
  if (!(button instanceof HTMLButtonElement)) return;
  const isActive = Boolean(active);
  if (isActive) {
    if (!button.dataset.loadingOriginalHtml) {
      button.dataset.loadingOriginalHtml = button.innerHTML;
    }
    if (!button.dataset.loadingOriginalDisabled) {
      button.dataset.loadingOriginalDisabled = button.disabled
        ? "true"
        : "false";
    }
    const text =
      String(loadingText || button.textContent || "处理中...").trim() ||
      "处理中...";
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.classList.add("is-loading");
    button.innerHTML = "";
    const spinner = document.createElement("span");
    spinner.className = "loading-spinner";
    spinner.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "loading-label";
    label.textContent = text;
    button.appendChild(spinner);
    button.appendChild(label);
    return;
  }

  const originalHtml = button.dataset.loadingOriginalHtml;
  if (typeof originalHtml === "string") {
    button.innerHTML = originalHtml;
  }
  button.disabled = button.dataset.loadingOriginalDisabled === "true";
  button.removeAttribute("aria-busy");
  button.classList.remove("is-loading");
  delete button.dataset.loadingOriginalHtml;
  delete button.dataset.loadingOriginalDisabled;
}

function setFormLoading(form, active) {
  if (!(form instanceof HTMLElement)) return;
  const controls = getElementFormControls(form);
  if (active) {
    form.setAttribute("aria-busy", "true");
    form.classList.add("is-loading");
    controls.forEach((control) => {
      if (!control.dataset.loadingOriginalDisabled) {
        control.dataset.loadingOriginalDisabled = control.disabled
          ? "true"
          : "false";
      }
      control.disabled = true;
    });
    return;
  }
  form.removeAttribute("aria-busy");
  form.classList.remove("is-loading");
  controls.forEach((control) => {
    if (control.dataset.loadingOriginalDisabled) {
      control.disabled = control.dataset.loadingOriginalDisabled === "true";
      delete control.dataset.loadingOriginalDisabled;
    }
  });
}

function setRegionLoading(region, active, text = "加载中...") {
  if (!(region instanceof HTMLElement)) return;
  const isActive = Boolean(active);
  region.classList.toggle("is-loading", isActive);
  if (isActive) {
    region.setAttribute("aria-busy", "true");
    region.dataset.loadingText =
      String(text || "加载中...").trim() || "加载中...";
  } else {
    region.removeAttribute("aria-busy");
    delete region.dataset.loadingText;
  }
}

async function withLoading(options = {}, task) {
  const {
    button = null,
    form = null,
    region = null,
    buttonText = "",
    regionText = "加载中...",
  } = options || {};
  if (button) setButtonLoading(button, true, buttonText);
  if (form) setFormLoading(form, true);
  if (region) setRegionLoading(region, true, regionText);
  try {
    return await task();
  } finally {
    if (region) setRegionLoading(region, false);
    if (button) setButtonLoading(button, false);
    if (form) setFormLoading(form, false);
  }
}

function renderTableLoadingState(message = "正在加载工作数据...") {
  if (!tableBody) return;
  tableBody.innerHTML = "";
  const rowCount = 7;
  const cellCount = 16 + (canCurrentAccountSettleRecords() ? 1 : 0);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("tr");
    row.className = "table-skeleton-row";
    for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 1) {
      const cell = document.createElement("td");
      const bar = document.createElement("span");
      bar.className = "skeleton-bar";
      bar.style.setProperty(
        "--skeleton-width",
        `${42 + ((rowIndex + cellIndex) % 5) * 11}%`,
      );
      cell.appendChild(bar);
      row.appendChild(cell);
    }
    tableBody.appendChild(row);
  }
  emptyState.style.display = "none";
  setRegionLoading(mainTableWrap, true, message);
  if (tableTotalCount) tableTotalCount.textContent = "加载中...";
}

function renderListLoadingState(container, emptyNode, message = "加载中...") {
  if (!(container instanceof HTMLElement)) return;
  container.innerHTML = "";
  if (emptyNode instanceof HTMLElement) {
    emptyNode.style.display = "none";
  }
  const isTableBody = container.tagName.toLowerCase() === "tbody";
  const headerCellCount = isTableBody
    ? container.closest("table")?.querySelectorAll("thead th").length || 6
    : 4;
  for (let index = 0; index < 4; index += 1) {
    const row = document.createElement(isTableBody ? "tr" : "div");
    row.className = isTableBody ? "table-skeleton-row" : "list-skeleton-row";
    const cellTotal = isTableBody ? headerCellCount : 4;
    for (let cellIndex = 0; cellIndex < cellTotal; cellIndex += 1) {
      const cell = isTableBody ? document.createElement("td") : null;
      const bar = document.createElement("span");
      bar.className = "skeleton-bar";
      bar.style.setProperty(
        "--skeleton-width",
        `${38 + ((index + cellIndex) % 4) * 14}%`,
      );
      if (cell) {
        cell.appendChild(bar);
        row.appendChild(cell);
      } else {
        row.appendChild(bar);
      }
    }
    container.appendChild(row);
  }
  const region =
    container.closest(".table-wrap") ||
    container.closest(".accountant-list-wrap") ||
    (container.parentElement instanceof HTMLElement
      ? container.parentElement
      : container);
  setRegionLoading(region, true, message);
}

function getTableTooltipCell(target) {
  if (!(target instanceof Element)) return null;
  const cell = target.closest("[data-table-tooltip]");
  if (!cell || !tableBody || !tableBody.contains(cell)) return null;
  return cell;
}

function isTableTooltipCellOverflowing(cell) {
  if (!(cell instanceof HTMLElement)) return false;
  if (cell.scrollWidth > cell.clientWidth + 1) return true;
  return Array.from(cell.children).some(
    (child) =>
      child instanceof HTMLElement && child.scrollWidth > child.clientWidth + 1,
  );
}

function shouldShowTableTooltipCell(cell) {
  if (!(cell instanceof HTMLElement)) return false;
  if (cell.dataset.tableTooltipMode === "always") return true;
  return isTableTooltipCellOverflowing(cell);
}

function placeTableHoverTooltip(source) {
  if (tableHoverTooltip.hidden) return;
  const margin = 14;
  const offset = 16;
  const rect = tableHoverTooltip.getBoundingClientRect();
  const isElementSource = source instanceof HTMLElement;
  const sourceRect = isElementSource ? source.getBoundingClientRect() : null;
  const sourceX = sourceRect ? sourceRect.left + sourceRect.width / 2 : source?.clientX;
  const sourceY = sourceRect ? sourceRect.top : source?.clientY;
  let left = sourceRect ? sourceRect.left + sourceRect.width / 2 - rect.width / 2 : sourceX + offset;
  let top = sourceRect ? sourceRect.top - rect.height - 10 : sourceY + offset;

  if (left + rect.width + margin > window.innerWidth) {
    left = sourceRect ? window.innerWidth - rect.width - margin : sourceX - rect.width - offset;
  }
  if (left < margin) {
    left = margin;
  }
  if (top + rect.height + margin > window.innerHeight) {
    top = sourceRect ? sourceRect.bottom + 10 : sourceY - rect.height - offset;
  }
  if (top < margin && sourceRect) {
    top = sourceRect.bottom + 10;
  }

  tableHoverTooltip.style.left = `${Math.max(margin, Math.round(left))}px`;
  tableHoverTooltip.style.top = `${Math.max(margin, Math.round(top))}px`;
}

function showTableHoverTooltip(source, event) {
  const isElementSource = source instanceof HTMLElement;
  const imageUrl = isElementSource
    ? String(source.dataset.tableTooltipImage || "").trim()
    : "";
  const imageAlt = isElementSource
    ? String(source.dataset.tableTooltipImageAlt || "").trim()
    : "";
  const isCompact = isElementSource && source.dataset.tableTooltipVariant === "compact";
  const normalizedText = String(
    isElementSource ? source.dataset.tableTooltip : source || "",
  ).trim();
  if (!normalizedText) {
    hideTableHoverTooltip();
    return;
  }
  tableHoverTooltip.classList.toggle("image", Boolean(imageUrl));
  tableHoverTooltip.classList.toggle("compact", isCompact);
  tableHoverTooltip.innerHTML = "";
  if (imageUrl) {
    const image = document.createElement("img");
    image.className = "table-hover-tooltip-image";
    image.src = imageUrl;
    image.alt = imageAlt || normalizedText || "发票图片";
    image.addEventListener("load", () => placeTableHoverTooltip(event), {
      once: true,
    });
    tableHoverTooltip.appendChild(image);
    const caption = document.createElement("span");
    caption.className = "table-hover-tooltip-caption";
    caption.textContent = normalizedText;
    tableHoverTooltip.appendChild(caption);
  } else {
    tableHoverTooltip.textContent = normalizedText;
  }
  tableHoverTooltip.hidden = false;
  tableHoverTooltip.classList.add("visible");
  placeTableHoverTooltip(isCompact && isElementSource ? source : event);
}

function moveTableHoverTooltip(event) {
  placeTableHoverTooltip(event);
}

function hideTableHoverTooltip() {
  tableHoverTooltip.classList.remove("visible");
  tableHoverTooltip.classList.remove("image");
  tableHoverTooltip.classList.remove("compact");
  tableHoverTooltip.hidden = true;
  tableHoverTooltip.innerHTML = "";
}

function setLoginRequestHint(text, state = "idle") {
  setHintState(loginRequestHint, "login-request-hint", text, state);
}

function setAppStatusHint(text, state = "idle") {
  setHintState(
    appStatusHint,
    "login-request-hint app-status-hint",
    text,
    state,
  );
}

function setAccountantRegisterHint(text, state = "idle") {
  setHintState(
    accountantRegisterHint,
    "login-request-hint accountant-register-hint",
    text,
    state,
  );
}

function setAccountantEditHint(text, state = "idle") {
  setHintState(
    accountantEditHint,
    "login-request-hint accountant-register-hint",
    text,
    state,
  );
}

function setRecordFormHint(text, state = "idle") {
  setHintState(
    recordFormHint,
    "login-request-hint form-request-hint",
    text,
    state,
  );
}

function setCheckFormHint(text, state = "idle") {
  setHintState(
    checkFormHint,
    "login-request-hint form-request-hint",
    text,
    state,
  );
}

function setCompleteFormHint(text, state = "idle") {
  setHintState(
    completeFormHint,
    "login-request-hint form-request-hint",
    text,
    state,
  );
}

function setRefundFormHint(text, state = "idle") {
  setHintState(
    refundFormHint,
    "login-request-hint form-request-hint",
    text,
    state,
  );
}

function setInvoiceUploadFormHint(text, state = "idle") {
  setHintState(
    invoiceUploadFormHint,
    "login-request-hint form-request-hint",
    text,
    state,
  );
}

function setInvoiceRecipientInfoHint(text, state = "idle") {
  setHintState(
    invoiceRecipientInfoHint,
    "login-request-hint accountant-register-hint",
    text,
    state,
  );
}

function setAccountantModalHint(text, state = "idle") {
  setHintState(
    accountantModalHint,
    "login-request-hint form-request-hint",
    text,
    state,
  );
}

function setDispatcherModalHint(text, state = "idle") {
  setHintState(
    dispatcherModalHint,
    "login-request-hint form-request-hint",
    text,
    state,
  );
}

function setRecycleModalHint(text, state = "idle") {
  setHintState(
    recycleModalHint,
    "login-request-hint form-request-hint",
    text,
    state,
  );
}

function setChangePasswordHint(text, state = "idle") {
  setHintState(
    changePasswordHint,
    "login-request-hint accountant-register-hint",
    text,
    state,
  );
}

function getInlineValidationGroup(target) {
  if (!(target instanceof Element)) return null;
  return target.closest(
    ".detail-item, .meta-item, .price-item, .refund-price-item, .field-feedback-time, .field-feedback-text, .field, .accountant-picker",
  );
}

function getInlineValidationErrorNode(group) {
  if (!(group instanceof Element)) return null;
  return (
    Array.from(group.children).find(
      (node) =>
        node instanceof HTMLElement &&
        node.classList.contains("field-inline-error"),
    ) || null
  );
}

function ensureInlineValidationErrorNode(group) {
  if (!(group instanceof Element)) return null;
  const existing = getInlineValidationErrorNode(group);
  if (existing) return existing;
  const node = document.createElement("p");
  node.className = "field-inline-error";
  group.appendChild(node);
  return node;
}

function focusInlineValidationTarget(target) {
  if (!(target instanceof HTMLElement)) return;
  window.requestAnimationFrame(() => {
    target.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
    if (typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  });
}

function clearInlineFieldError(target) {
  if (!(target instanceof Element)) return;
  const group = getInlineValidationGroup(target);
  if (target instanceof HTMLElement) {
    target.classList.remove("field-control-error");
    target.removeAttribute("aria-invalid");
  }
  if (group) {
    group.classList.remove("field-validation-group-error");
    const errorNode = getInlineValidationErrorNode(group);
    if (errorNode) {
      errorNode.remove();
    }
  }
}

function clearInlineFormErrors(form) {
  if (!(form instanceof HTMLElement)) return;
  form.querySelectorAll(".field-control-error").forEach((node) => {
    node.classList.remove("field-control-error");
    node.removeAttribute("aria-invalid");
  });
  form.querySelectorAll(".field-validation-group-error").forEach((group) => {
    group.classList.remove("field-validation-group-error");
  });
  form.querySelectorAll(".field-inline-error").forEach((node) => {
    node.remove();
  });
}

function resetInlineFormState(form, hintSetter = null) {
  clearInlineFormErrors(form);
  if (typeof hintSetter === "function") {
    hintSetter("", "idle");
  }
}

function showInlineFormError({
  form,
  hintSetter,
  target,
  message,
  open,
  selectText = false,
}) {
  const normalizedMessage = String(message || "").trim();
  if (!(form instanceof HTMLElement) || !normalizedMessage) return;
  clearInlineFormErrors(form);
  if (typeof hintSetter === "function") {
    hintSetter(normalizedMessage, "error");
  }
  const control = target instanceof HTMLElement ? target : null;
  const group = control ? getInlineValidationGroup(control) : null;
  if (group) {
    group.classList.add("field-validation-group-error");
    const errorNode = ensureInlineValidationErrorNode(group);
    if (errorNode) {
      errorNode.textContent = normalizedMessage;
    }
  }
  if (control) {
    control.classList.add("field-control-error");
    control.setAttribute("aria-invalid", "true");
  }
  if (typeof open === "function") {
    open();
  }
  if (control) {
    focusInlineValidationTarget(control);
    if (selectText && typeof control.select === "function") {
      window.requestAnimationFrame(() => control.select());
    }
  }
}

function bindInlineValidation(form, hintSetter = null) {
  if (!(form instanceof HTMLElement)) return;
  const clearHandler = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    clearInlineFieldError(target);
    if (
      typeof hintSetter === "function" &&
      !form.querySelector(".field-validation-group-error")
    ) {
      hintSetter("", "idle");
    }
  };
  form.addEventListener("input", clearHandler);
  form.addEventListener("change", clearHandler);
}

function messageIncludesAnyKeyword(message, keywords) {
  const text = String(message || "").trim();
  if (!text) return false;
  return (Array.isArray(keywords) ? keywords : []).some(
    (keyword) => keyword && text.includes(String(keyword)),
  );
}

function getRecordFormErrorPresentation(
  message,
  fallbackTarget = customerInput,
) {
  if (messageIncludesAnyKeyword(message, ["日期"])) {
    return { target: dateInput, open: null };
  }
  if (messageIncludesAnyKeyword(message, ["会计"])) {
    return {
      target: accountantPickerTrigger,
      open: () => openAccountantPicker(),
    };
  }
  if (messageIncludesAnyKeyword(message, ["来源"])) {
    return { target: sourcePickerTrigger, open: () => openSourcePicker() };
  }
  if (messageIncludesAnyKeyword(message, ["平台", "店铺名"])) {
    return {
      target: platformShopPickerTrigger,
      open: () => openPlatformShopPicker(),
    };
  }
  if (messageIncludesAnyKeyword(message, ["订单号"])) {
    return { target: orderNoInput, open: null };
  }
  if (messageIncludesAnyKeyword(message, ["客户"])) {
    return { target: customerInput, open: null };
  }
  if (messageIncludesAnyKeyword(message, ["任务简介", "简介"])) {
    return { target: summaryInput, open: null };
  }
  if (messageIncludesAnyKeyword(message, ["付款价"])) {
    return { target: paymentPriceInput, open: null };
  }
  if (messageIncludesAnyKeyword(message, ["会计价"])) {
    return { target: totalPriceInput, open: null };
  }
  if (messageIncludesAnyKeyword(message, ["会计结算价", "结算价"])) {
    return { target: settlementPriceInput, open: null };
  }
  return {
    target:
      fallbackTarget instanceof HTMLElement ? fallbackTarget : customerInput,
    open: null,
  };
}

function getCheckFormErrorTarget(message) {
  if (messageIncludesAnyKeyword(message, ["客户"])) {
    return checkCustomerInput;
  }
  if (messageIncludesAnyKeyword(message, ["任务简介", "简介"])) {
    return checkSummaryInput;
  }
  return checkSummaryInput;
}

function getCompleteFormErrorTarget(message) {
  if (messageIncludesAnyKeyword(message, ["时间"])) {
    return completeTimeInput;
  }
  if (messageIncludesAnyKeyword(message, ["服务记录", "客户反馈"])) {
    return completeCustomerFeedbackInput;
  }
  return completeTimeInput;
}

function getAccountantRegisterErrorTarget(message) {
  if (messageIncludesAnyKeyword(message, ["账号", "手机号"])) {
    return accountantRegisterPhoneInput;
  }
  if (messageIncludesAnyKeyword(message, ["别名", "显示名"])) {
    return accountantRegisterAliasInput;
  }
  if (messageIncludesAnyKeyword(message, ["密码"])) {
    return accountantRegisterPasswordInput;
  }
  return accountantRegisterPhoneInput || accountantRegisterPasswordInput;
}

function getAccountantEditErrorTarget(message, mode = accountantEditMode) {
  const canEditSensitiveFields = canEditAccountantSensitiveFields(mode);
  if (
    canEditSensitiveFields &&
    messageIncludesAnyKeyword(message, ["账号", "手机号"])
  ) {
    return accountantEditPhoneInput;
  }
  if (canEditSensitiveFields && messageIncludesAnyKeyword(message, ["密码"])) {
    return accountantEditPasswordInput;
  }
  if (messageIncludesAnyKeyword(message, ["别名", "显示名"])) {
    return accountantEditAliasInput;
  }
  if (canEditSensitiveFields) {
    return (
      accountantEditPhoneInput ||
      accountantEditPasswordInput ||
      accountantEditAliasInput
    );
  }
  return accountantEditAliasInput || accountantEditPhoneInput;
}

function showAppStatus(text, state = "error") {
  mountAppStatusHint();
  setAppStatusHint(text, state);
}

function showSettlementSummaryStatus(text, state = "error") {
  if (!bossSettlementSummaryNote) return;
  const normalizedText = String(text || "").trim();
  bossSettlementSummaryNote.textContent = normalizedText;
  bossSettlementSummaryNote.className = `settlement-summary-note ${state}`;
  bossSettlementSummaryNote.hidden = !normalizedText;
}

function resetSettlementSummaryStatus() {
  if (!bossSettlementSummaryNote) return;
  bossSettlementSummaryNote.className = "settlement-summary-note";
}

function resetChangePasswordForm() {
  if (changePasswordForm) {
    changePasswordForm.reset();
  }
  if (changePasswordSubmitBtn) {
    changePasswordSubmitBtn.disabled = false;
    changePasswordSubmitBtn.textContent = "保存密码";
  }
  resetInlineFormState(changePasswordForm, setChangePasswordHint);
}

function openConfirmDialog(options = {}) {
  if (
    !confirmModal ||
    !confirmModalCard ||
    !confirmModalConfirmBtn ||
    !confirmModalCancelBtn
  ) {
    return Promise.resolve(false);
  }
  const {
    title = "请确认",
    message = "",
    content = null,
    confirmText = "确认",
    cancelText = "取消",
    tone = "danger",
    requireMathChallenge = false,
  } = options;
  if (pendingConfirmResolve) {
    const previousResolve = pendingConfirmResolve;
    pendingConfirmResolve = null;
    previousResolve(false);
  }
  if (confirmModalTitle)
    confirmModalTitle.textContent = String(title || "").trim() || "请确认";
  if (confirmModalMessage)
    confirmModalMessage.textContent = String(message || "").trim();
  if (confirmModalContent) {
    confirmModalContent.innerHTML = "";
    if (content instanceof Node) {
      confirmModalContent.appendChild(content);
      confirmModalContent.hidden = false;
    } else {
      confirmModalContent.hidden = true;
    }
  }
  pendingConfirmMathAnswer = null;
  if (confirmModalMathChallenge) {
    confirmModalMathChallenge.hidden = !requireMathChallenge;
  }
  if (confirmModalMathInput) {
    confirmModalMathInput.value = "";
  }
  if (confirmModalMathHint) {
    confirmModalMathHint.textContent = "";
    confirmModalMathHint.hidden = true;
  }
  if (requireMathChallenge && confirmModalMathLabel) {
    const addendA = Math.floor(Math.random() * 90) + 10;
    const addendB = Math.floor(Math.random() * 90) + 10;
    pendingConfirmMathAnswer = addendA + addendB;
    confirmModalMathLabel.textContent = `请输入 ${addendA} + ${addendB} 的结果`;
  }
  confirmModalCancelBtn.textContent = String(cancelText || "").trim() || "取消";
  confirmModalConfirmBtn.textContent =
    String(confirmText || "").trim() || "确认";
  confirmModalConfirmBtn.className =
    tone === "danger" ? "btn-danger" : "btn-primary";
  confirmModal.hidden = false;
  confirmModal.classList.remove("modal-enter");
  confirmModalCard.classList.remove("modal-enter");
  void confirmModal.offsetWidth;
  confirmModal.classList.add("modal-enter");
  confirmModalCard.classList.add("modal-enter");
  syncModalOpenState();
  window.requestAnimationFrame(() => {
    if (requireMathChallenge && confirmModalMathInput) {
      confirmModalMathInput.focus();
      return;
    }
    confirmModalCancelBtn.focus();
  });
  return new Promise((resolve) => {
    pendingConfirmResolve = resolve;
  });
}

function confirmDialogMathChallengePassed() {
  if (pendingConfirmMathAnswer === null) return true;
  if (!confirmModalMathInput) return false;
  const value = Number(String(confirmModalMathInput.value || "").trim());
  if (Number.isFinite(value) && value === pendingConfirmMathAnswer) {
    return true;
  }
  if (confirmModalMathHint) {
    confirmModalMathHint.textContent = "口算结果有误，请重新输入。";
    confirmModalMathHint.hidden = false;
  }
  confirmModalMathInput.focus();
  confirmModalMathInput.select();
  return false;
}

function closeConfirmDialog(result = false) {
  if (!confirmModal || !confirmModalCard || confirmModal.hidden) {
    if (pendingConfirmResolve) {
      const resolve = pendingConfirmResolve;
      pendingConfirmResolve = null;
      resolve(Boolean(result));
    }
    return;
  }
  confirmModal.classList.remove("modal-enter");
  confirmModalCard.classList.remove("modal-enter");
  confirmModal.hidden = true;
  if (confirmModalContent) {
    confirmModalContent.innerHTML = "";
    confirmModalContent.hidden = true;
  }
  pendingConfirmMathAnswer = null;
  if (confirmModalMathChallenge) {
    confirmModalMathChallenge.hidden = true;
  }
  if (confirmModalMathInput) {
    confirmModalMathInput.value = "";
  }
  if (confirmModalMathHint) {
    confirmModalMathHint.textContent = "";
    confirmModalMathHint.hidden = true;
  }
  syncModalOpenState();
  if (pendingConfirmResolve) {
    const resolve = pendingConfirmResolve;
    pendingConfirmResolve = null;
    resolve(Boolean(result));
  }
}

function resetAccountantAssignmentTrackingState() {
  accountantKnownRecordIds = new Set();
  accountantKnownRecordIdsInitialized = false;
}

function syncAccountantAssignmentHighlights(nextRecords) {
  if (!isAccountantLogin()) return;
  if (!Array.isArray(nextRecords)) return;
  const accountantName = getCurrentAccountantDisplayName();
  if (!accountantName) return;

  const visibleRecords = nextRecords.filter(
    (item) => String(item?.accountant || "").trim() === accountantName,
  );
  const nextIdSet = new Set(
    visibleRecords.map((item) => String(item?.id || "").trim()).filter(Boolean),
  );

  if (!accountantKnownRecordIdsInitialized) {
    accountantKnownRecordIds = nextIdSet;
    accountantKnownRecordIdsInitialized = true;
    return;
  }

  const newAssignedRecords = visibleRecords.filter((item) => {
    const recordId = String(item?.id || "").trim();
    return Boolean(recordId) && !accountantKnownRecordIds.has(recordId);
  });

  accountantKnownRecordIds = nextIdSet;
  if (!newAssignedRecords.length) return;
  addUpdatedRowHighlights(
    newAssignedRecords.map((item) => String(item?.id || "").trim()),
  );
}
