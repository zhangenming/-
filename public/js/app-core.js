// Core: constants, DOM refs, runtime state, account/role helpers.
    const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:3000" : "";
    const API_ENDPOINT_RECORDS = `${API_BASE}/api/records`;
    const API_ENDPOINT_RECORDS_SETTLE = `${API_ENDPOINT_RECORDS}/settle`;
    const API_ENDPOINT_RECORDS_INVOICE = `${API_ENDPOINT_RECORDS}/invoice`;
    const API_ENDPOINT_RECORDS_PAYOUT = `${API_ENDPOINT_RECORDS}/payout`;
    const API_ENDPOINT_ACCOUNTANTS = `${API_BASE}/api/accountants`;
    const API_ENDPOINT_DISPATCHERS = `${API_BASE}/api/dispatchers`;
    const API_ENDPOINT_RECYCLE_BIN = `${API_BASE}/api/recycle-bin`;
    const API_ENDPOINT_ACCOUNTANT_OPERATION_LOGS = `${API_BASE}/api/accountant-operation-logs`;
    const API_ENDPOINT_BUILD_INFO = `${API_BASE}/build-info.json`;
    const API_ENDPOINT_AUTH_ACCOUNTANT_REGISTER = `${API_BASE}/api/auth/accountant-register`;
    const API_ENDPOINT_AUTH_LOGIN = `${API_BASE}/api/auth/login`;
    const API_ENDPOINT_AUTH_PASSWORD = `${API_BASE}/api/auth/password`;
    const STATIC_ASSET_VERSION = String(window.__STATIC_ASSET_VERSION__ || "").trim();
    const ECHARTS_ASSET_URL = "./public/vendor/echarts.min.js";
    const STORAGE_KEY_ACCOUNT = "dispatch_current_account_v1";
    const STORAGE_KEY_ACCOUNT_ROLE = "dispatch_current_account_role_v1";
    const STORAGE_KEY_ACCOUNT_DISPLAY_NAME = "dispatch_current_account_display_name_v1";
    const STORAGE_KEY_ACCOUNT_REAL_NAME = "dispatch_current_account_real_name_v1";
    const STORAGE_KEY_ACCOUNT_PHONE = "dispatch_current_account_phone_v1";
    const STORAGE_KEY_LOGIN_ACCOUNT = "dispatch_current_login_account_v1";
    const STORAGE_KEY_SAVED_LOGINS = "dispatch_saved_logins_v1";
    const STORAGE_KEY_DEV_TODO_ITEMS = "dispatch_dev_todo_items_v1";
    const STORAGE_KEY_VIEW_STATE = "dispatch_view_state_v1";
    const STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX = "dispatch_updated_row_dismissed_v1";
    const STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX = "dispatch_updated_row_highlight_v1";
    const DISPATCHER_LOGIN_PASSWORD = "11";
    const BOSS_LOGIN_ACCOUNT = "开心";
    const BOSS_LOGIN_LEGACY_ACCOUNT = "boss";
    const BOSS_LOGIN_ACCOUNTS = [BOSS_LOGIN_ACCOUNT, "管理员"];
    const BOSS_LOGIN_ACCOUNT_SET = new Set(BOSS_LOGIN_ACCOUNTS.map((item) => String(item || "").trim().toLowerCase()));
    const BOSS_LOGIN_CODE_TO_ACCOUNT = {
      [BOSS_LOGIN_ACCOUNT.toLowerCase()]: BOSS_LOGIN_ACCOUNT,
      [BOSS_LOGIN_LEGACY_ACCOUNT]: BOSS_LOGIN_ACCOUNT,
      "管理员": "管理员"
    };
    const SETTLEMENT_INVOICE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
    const NON_SETTLEMENT_ACCOUNTANT_NAME = "不结算";
    const EXTERNAL_ACCOUNTANT_NAME = "外部人员";
    const BUILT_IN_ACCOUNTANT_NAMES = [NON_SETTLEMENT_ACCOUNTANT_NAME, EXTERNAL_ACCOUNTANT_NAME];
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
      { label: "淘宝-全账通", platform: "淘宝", shopName: "全账通" },
      { label: "企业微信", platform: "企业微信", shopName: "企业微信" },
      { label: "其他", platform: "其他", shopName: "其他" }
    ];
    function normalizeAppEnvironment(value) {
      return String(value || "").trim().toLowerCase() === "development"
        ? "development"
        : "production";
    }
    function getInitialAppEnvironment() {
      const explicitEnvironment = String(document.documentElement?.dataset?.appEnv || window.__APP_ENV__ || "").trim();
      return normalizeAppEnvironment(explicitEnvironment || "production");
    }
    let runtimeAppEnvironment = getInitialAppEnvironment();
    let isTabScopedPersistenceEnabled = false;
    const authStateStorage = window.sessionStorage;
    let persistentStateStorage = window.localStorage;
    let legacyPersistentStateStorage = window.sessionStorage;
    let isDevTodoEnabled = false;
    let isQuickLoginEnabled = false;

    function isDevelopmentEnvironment() {
      return runtimeAppEnvironment === "development";
    }

    function isProductionEnvironment() {
      return runtimeAppEnvironment === "production";
    }

    function applyRuntimeEnvironment(rawEnvironment) {
      runtimeAppEnvironment = normalizeAppEnvironment(rawEnvironment);
      isTabScopedPersistenceEnabled = isDevelopmentEnvironment();
      persistentStateStorage = isTabScopedPersistenceEnabled ? window.sessionStorage : window.localStorage;
      legacyPersistentStateStorage = isTabScopedPersistenceEnabled ? window.localStorage : window.sessionStorage;
      isDevTodoEnabled = isDevelopmentEnvironment();
      isQuickLoginEnabled = isDevelopmentEnvironment();
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
    const DISPATCHER_TAGS = ["1", "A", "C", "E", "K"];
    const ACCOUNT_TO_DISPATCHER_TAG = {
      "1": "1",
      "a": "A",
      "c": "C",
      "e": "E",
      "k": "K",
      "开心财税": "开心财税"
    };
    const DISPATCHER_ACCOUNT_DISPLAY_NAME = {
      "1": "开心财税1",
      "a": "开心财税A",
      "c": "开心财税C",
      "e": "开心财税E",
      "k": "开心财税K",
      "开心财税": "开心财税"
    };
    const DISPATCHER_LOGIN_CODE_TO_ACCOUNT = {
      "1": "1",
      "a": "a",
      "c": "c",
      "e": "e",
      "k": "k",
      "开心财税": "开心财税",
      "开心财税1": "1",
      "开心财税a": "a",
      "开心财税c": "c",
      "开心财税e": "e",
      "开心财税k": "k"
    };

    const loginPage = document.getElementById("loginPage");
    const loginForm = document.getElementById("loginForm");
    const appPage = document.getElementById("appPage");
    const appSidebar = document.getElementById("appSidebar");
    const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
    const sidebarToggleIcon = document.getElementById("sidebarToggleIcon");
    const devTodoLauncher = document.getElementById("devTodoLauncher");
    const devTodoModal = document.getElementById("devTodoModal");
    const devTodoModalCard = devTodoModal ? devTodoModal.querySelector(".dev-todo-modal-card") : null;
    const devTodoForm = document.getElementById("devTodoForm");
    const devTodoInput = document.getElementById("devTodoInput");
    const devTodoList = document.getElementById("devTodoList");
    const devTodoEmptyState = document.getElementById("devTodoEmptyState");
    const loginCodeInput = document.getElementById("loginCodeInput");
    const loginPasswordInput = document.getElementById("loginPasswordInput");
    const loginRequestHint = document.getElementById("loginRequestHint");
    const appStatusHint = document.getElementById("appStatusHint");
    const openAccountantRegisterBtn = document.getElementById("openAccountantRegisterBtn");
    const enterBtn = document.getElementById("enterBtn");
    const savedLoginSection = document.getElementById("savedLoginSection");
    const savedLoginList = document.getElementById("savedLoginList");
    const accountantRegisterModal = document.getElementById("accountantRegisterModal");
    const accountantRegisterModalCard = accountantRegisterModal
      ? accountantRegisterModal.querySelector(".accountant-register-modal-card")
      : null;
    const accountantRegisterForm = document.getElementById("accountantRegisterForm");
    const accountantRegisterHint = document.getElementById("accountantRegisterHint");
    const accountantRegisterPasswordInput = document.getElementById("accountantRegisterPasswordInput");
    const accountantRegisterAliasInput = document.getElementById("accountantRegisterAliasInput");
    const accountantRegisterRealNameInput = document.getElementById("accountantRegisterRealNameInput");
    const accountantRegisterPhoneInput = document.getElementById("accountantRegisterPhoneInput");
    const accountantRegisterSubmitBtn = document.getElementById("accountantRegisterSubmitBtn");
    const switchAccountBtn = document.getElementById("switchAccountBtn");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const editProfileBtn = document.getElementById("editProfileBtn");
    const buildInfoPanel = document.getElementById("buildInfoPanel");
    const buildVersionText = document.getElementById("buildVersionText");
    const buildTimeText = document.getElementById("buildTimeText");
    const headerAccountText = document.getElementById("headerAccountText");
    const headerAccountSubText = document.getElementById("headerAccountSubText");
    const accountRoleBadge = document.getElementById("accountRoleBadge");
    const openCreateModalBtn = document.getElementById("openCreateModalBtn");
    const openDispatcherModalBtn = document.getElementById("openDispatcherModalBtn");
    const openAnalysisModalBtn = document.getElementById("openAnalysisModalBtn");
    const openRecycleModalBtn = document.getElementById("openRecycleModalBtn");
    const openAccountantModalBtn = document.getElementById("openAccountantModalBtn");
    const accountantSortableHeaders = Array.from(document.querySelectorAll(".accountant-sort-btn"));
    const createModal = document.getElementById("createModal");
    const createModalCard = createModal.querySelector(".modal-card");
    const recordModalTitle = document.getElementById("recordModalTitle");
    const recordFormHint = document.getElementById("recordFormHint");
    const checkModal = document.getElementById("checkModal");
    const checkModalCard = checkModal.querySelector(".check-modal-card");
    const checkFormHint = document.getElementById("checkFormHint");
    const checkForm = document.getElementById("checkForm");
    const checkFormSubmitBtn = checkForm ? checkForm.querySelector("button[type='submit']") : null;
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
    const completeCustomerFeedbackInput = document.getElementById("customerFeedback");
    const completeModalSubmitBtn = document.getElementById("completeModalSubmitBtn");
    const refundModal = document.getElementById("refundModal");
    const refundModalCard = refundModal.querySelector(".refund-modal-card");
    const refundModalMeta = document.getElementById("refundModalMeta");
    const refundFormHint = document.getElementById("refundFormHint");
    const refundForm = document.getElementById("refundForm");
    const refundFormSubmitBtn = refundForm ? refundForm.querySelector("button[type='submit']") : null;
    const refundRecordIdInput = document.getElementById("refundRecordId");
    const refundPaymentPriceInput = document.getElementById("refundPaymentPrice");
    const refundTotalPriceInput = document.getElementById("refundTotalPrice");
    const refundSettlementPriceInput = document.getElementById("refundSettlementPrice");
    const refundPremiumHint = document.getElementById("refundPremiumHint");
    const recordHistoryModal = document.getElementById("recordHistoryModal");
    const recordHistoryModalCard = recordHistoryModal.querySelector(".record-history-modal-card");
    const recordHistoryModalMeta = document.getElementById("recordHistoryModalMeta");
    const recordHistoryModalContent = document.getElementById("recordHistoryModalContent");
    const invoicePreviewModal = document.getElementById("invoicePreviewModal");
    const invoicePreviewModalCard = invoicePreviewModal
      ? invoicePreviewModal.querySelector(".invoice-preview-modal-card")
      : null;
    const invoicePreviewMeta = document.getElementById("invoicePreviewMeta");
    const invoicePreviewImage = document.getElementById("invoicePreviewImage");
    const bossSettlementSummaryModal = document.getElementById("bossSettlementSummaryModal");
    const bossSettlementSummaryModalCard = bossSettlementSummaryModal.querySelector(".settlement-summary-modal-card");
    const bossSettlementSummaryTitleCount = document.getElementById("bossSettlementSummaryTitleCount");
    const bossSettlementSummaryAmount = document.getElementById("bossSettlementSummaryAmount");
    const bossSettlementSummaryTax = document.getElementById("bossSettlementSummaryTax");
    const bossSettlementSummaryNote = document.getElementById("bossSettlementSummaryNote");
    const bossSettlementSummarySubmitBtn = document.getElementById("bossSettlementSummarySubmitBtn");
    const bossSettlementDetailModal = document.getElementById("bossSettlementDetailModal");
    const bossSettlementDetailModalCard = bossSettlementDetailModal
      ? bossSettlementDetailModal.querySelector(".settlement-detail-modal-card")
      : null;
    const bossSettlementDetailTitleCount = document.getElementById("bossSettlementDetailTitleCount");
    const bossSettlementDetailMeta = document.getElementById("bossSettlementDetailMeta");
    const bossSettlementDetailList = document.getElementById("bossSettlementDetailList");
    const analysisModal = document.getElementById("analysisModal");
    const analysisModalCard = analysisModal.querySelector(".analysis-modal-card");
    const analysisContent = document.getElementById("analysisContent");
    const openOperationRecordsBtn = document.getElementById("openOperationRecordsBtn");
    const operationRecordsModal = document.getElementById("operationRecordsModal");
    const operationRecordsModalCard = operationRecordsModal
      ? operationRecordsModal.querySelector(".operation-records-modal-card")
      : null;
    const operationRecordsMeta = document.getElementById("operationRecordsMeta");
    const operationRecordsList = document.getElementById("operationRecordsList");
    const openPriceCompositionBtn = document.getElementById("openPriceCompositionBtn");
    const priceCompositionModal = document.getElementById("priceCompositionModal");
    const priceCompositionModalCard = priceCompositionModal
      ? priceCompositionModal.querySelector(".price-composition-modal-card")
      : null;
    const dispatcherModal = document.getElementById("dispatcherModal");
    const dispatcherModalCard = dispatcherModal.querySelector(".accountant-modal-card");
    const dispatcherModalHint = document.getElementById("dispatcherModalHint");
    const dispatcherListWrap = document.getElementById("dispatcherListWrap");
    const dispatcherList = document.getElementById("dispatcherList");
    const dispatcherEmptyState = document.getElementById("dispatcherEmptyState");
    const accountantModal = document.getElementById("accountantModal");
    const accountantModalCard = accountantModal.querySelector(".accountant-modal-card");
    const accountantModalHint = document.getElementById("accountantModalHint");
    const closeAccountantModalBtn = document.getElementById("closeAccountantModalBtn");
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
    const accountantEditOriginalUsernameInput = document.getElementById("accountantEditOriginalUsernameInput");
    const accountantEditPasswordField = document.getElementById("accountantEditPasswordField");
    const accountantEditPasswordInput = document.getElementById("accountantEditPasswordInput");
    const accountantEditAliasInput = document.getElementById("accountantEditAliasInput");
    const accountantEditRealNameInput = document.getElementById("accountantEditRealNameInput");
    const accountantEditPhoneField = document.getElementById("accountantEditPhoneField");
    const accountantEditPhoneInput = document.getElementById("accountantEditPhoneInput");
    const accountantEditSubmitBtn = document.getElementById("accountantEditSubmitBtn");
    const recycleModal = document.getElementById("recycleModal");
    const recycleModalCard = recycleModal.querySelector(".recycle-modal-card");
    const recycleModalHint = document.getElementById("recycleModalHint");
    const recycleTableBody = document.getElementById("recycleTableBody");
    const recycleEmptyState = document.getElementById("recycleEmptyState");
    const accountantLogList = document.getElementById("accountantLogList");
    const accountantLogEmptyState = document.getElementById("accountantLogEmptyState");
    const changePasswordModal = document.getElementById("changePasswordModal");
    const changePasswordModalCard = changePasswordModal
      ? changePasswordModal.querySelector(".accountant-register-modal-card")
      : null;
    const changePasswordForm = document.getElementById("changePasswordForm");
    const changePasswordHint = document.getElementById("changePasswordHint");
    const changePasswordInput = document.getElementById("changePasswordInput");
    const changePasswordSubmitBtn = document.getElementById("changePasswordSubmitBtn");
    const confirmModal = document.getElementById("confirmModal");
    const confirmModalCard = confirmModal
      ? confirmModal.querySelector(".confirm-modal-card")
      : null;
    const confirmModalTitle = document.getElementById("confirmModalTitle");
    const confirmModalMessage = document.getElementById("confirmModalMessage");
    const confirmModalCancelBtn = document.getElementById("confirmModalCancelBtn");
    const confirmModalConfirmBtn = document.getElementById("confirmModalConfirmBtn");

    const dateInput = document.getElementById("date");
    const monthlySettlementCheckbox = document.getElementById("monthlySettlement");
    const dispatcherInput = document.getElementById("dispatcher");
    const dispatcherTagButtons = Array.from(document.querySelectorAll(".dispatcher-tag-btn"));
    const recordForm = document.getElementById("recordForm");
    const recordEditingIdInput = document.getElementById("recordEditingId");
    const recordSubmitBtn = document.getElementById("recordSubmitBtn");
    const accountantInput = document.getElementById("accountant");
    const accountantPicker = document.getElementById("accountantPicker");
    const accountantPickerTrigger = document.getElementById("accountantPickerTrigger");
    const accountantPickerValue = document.getElementById("accountantPickerValue");
    const accountantPickerMeta = document.getElementById("accountantPickerMeta");
    const accountantPickerDropdown = document.getElementById("accountantPickerDropdown");
    const accountantPickerSearch = document.getElementById("accountantPickerSearch");
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
    const platformShopPickerTrigger = document.getElementById("platformShopPickerTrigger");
    const platformShopPickerValue = document.getElementById("platformShopPickerValue");
    const platformShopPickerMeta = document.getElementById("platformShopPickerMeta");
    const platformShopPickerDropdown = document.getElementById("platformShopPickerDropdown");
    const platformShopPickerList = document.getElementById("platformShopPickerList");
    const platformShopPickerEmpty = document.getElementById("platformShopPickerEmpty");
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
      "select"
    ].join(", ");
    const SUGGESTION_GUARD_FIELD_SELECTOR = [
      "input[type='text']",
      "input[type='password']",
      "input[type='search']",
      "input[type='email']",
      "input[type='tel']",
      "input[type='url']",
      "textarea"
    ].join(", ");
    const tableBody = document.getElementById("tableBody");
    const mainTableWrap = tableBody ? tableBody.closest(".table-wrap") : null;
    const emptyState = document.getElementById("emptyState");
    const tableTotalCount = document.getElementById("tableTotalCount");
    const clearFilterBtn = document.getElementById("clearFilterBtn");
    const exportTableBtn = document.getElementById("exportTableBtn");
    const bossSettlementBtn = document.getElementById("bossSettlementBtn");
    const bossSettlementDetailBtn = document.getElementById("bossSettlementDetailBtn");
    const accountantInvoiceUploadBtn = document.getElementById("accountantInvoiceUploadBtn");
    const accountantInvoiceImageInput = document.getElementById("accountantInvoiceImageInput");
    const tableSelectCol = document.getElementById("tableSelectCol");
    const tableSelectHead = document.getElementById("tableSelectHead");
    const tableSelectAllCheckbox = document.getElementById("tableSelectAllCheckbox");
    const sortableHeaders = Array.from(document.querySelectorAll(".sort-btn"));
    const filterMonthBtn = document.getElementById("filterMonthBtn");
    const filterDispatcherBtn = document.getElementById("filterDispatcherBtn");
    const filterOrderBtn = document.getElementById("filterOrderBtn");
    const filterAccountantBtn = document.getElementById("filterAccountantBtn");
    const filterPlatformBtn = document.getElementById("filterPlatformBtn");
    const filterShopBtn = document.getElementById("filterShopBtn");
    const filterSourceBtn = document.getElementById("filterSourceBtn");
    const filterStatusBtn = document.getElementById("filterStatusBtn");
    const filterSettledBtn = document.getElementById("filterSettledBtn");
    const filterMonthIndicator = document.getElementById("filterMonthIndicator");
    const filterDispatcherIndicator = document.getElementById("filterDispatcherIndicator");
    const filterOrderIndicator = document.getElementById("filterOrderIndicator");
    const filterAccountantIndicator = document.getElementById("filterAccountantIndicator");
    const filterPlatformIndicator = document.getElementById("filterPlatformIndicator");
    const filterShopIndicator = document.getElementById("filterShopIndicator");
    const filterSourceIndicator = document.getElementById("filterSourceIndicator");
    const filterStatusIndicator = document.getElementById("filterStatusIndicator");
    const filterSettledIndicator = document.getElementById("filterSettledIndicator");
    const filterMonthValue = document.getElementById("filterMonthValue");
    const filterDispatcherValue = document.getElementById("filterDispatcherValue");
    const filterOrderValue = document.getElementById("filterOrderValue");
    const filterAccountantValue = document.getElementById("filterAccountantValue");
    const filterPlatformValue = document.getElementById("filterPlatformValue");
    const filterShopValue = document.getElementById("filterShopValue");
    const filterSourceValue = document.getElementById("filterSourceValue");
    const filterStatusValue = document.getElementById("filterStatusValue");
    const filterSettledValue = document.getElementById("filterSettledValue");
    const filterMonthPopover = document.getElementById("filterMonthPopover");
    const filterDispatcherPopover = document.getElementById("filterDispatcherPopover");
    const filterOrderPopover = document.getElementById("filterOrderPopover");
    const filterAccountantPopover = document.getElementById("filterAccountantPopover");
    const filterPlatformPopover = document.getElementById("filterPlatformPopover");
    const filterShopPopover = document.getElementById("filterShopPopover");
    const filterSourcePopover = document.getElementById("filterSourcePopover");
    const filterStatusPopover = document.getElementById("filterStatusPopover");
    const filterSettledPopover = document.getElementById("filterSettledPopover");
    const filterMonthList = document.getElementById("filterMonthList");
    const filterDispatcherList = document.getElementById("filterDispatcherList");
    const filterAccountantList = document.getElementById("filterAccountantList");
    const filterPlatformList = document.getElementById("filterPlatformList");
    const filterShopList = document.getElementById("filterShopList");
    const filterSourceList = document.getElementById("filterSourceList");
    const filterStatusList = document.getElementById("filterStatusList");
    const filterSettledList = document.getElementById("filterSettledList");
    const filterDateStartInput = document.getElementById("filterDateStartInput");
    const filterDateEndInput = document.getElementById("filterDateEndInput");
    const filterDateRangeApplyBtn = document.getElementById("filterDateRangeApplyBtn");
    const filterDateRangeClearBtn = document.getElementById("filterDateRangeClearBtn");
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
    let recycleBinRecords = [];
    let accountantOperationLogs = [];
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
    let savedLoginEntries = [];
    let highlightedAccountantUsername = "";
    let accountantRegisterReturnTarget = "";
    let pendingConfirmResolve = null;
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
    const bossSettlementDetailSortState = {
      key: "accountant",
      direction: "asc"
    };
    const sortState = {
      key: "date",
      direction: "desc"
    };
    const accountantSortState = {
      key: "orderCount",
      direction: "desc"
    };
    const filterState = {
      month: "",
      dateStart: "",
      dateEnd: "",
      dispatcher: "",
      orderNo: "",
      accountant: "",
      platform: "",
      shopName: "",
      source: "",
      status: "",
      settled: ""
    };

    function getAutocompleteDisabledFields() {
      return Array.from(document.querySelectorAll(AUTOCOMPLETE_DISABLED_FIELD_SELECTOR)).filter((field) => {
        if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement) && !(field instanceof HTMLSelectElement)) {
          return false;
        }
        if (field instanceof HTMLInputElement) {
          const inputType = String(field.type || "").toLowerCase();
          return !["hidden", "button", "submit", "reset", "checkbox", "radio", "range", "file"].includes(inputType);
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
      if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement) && !(field instanceof HTMLSelectElement)) return;

      const isPasswordField = field instanceof HTMLInputElement && String(field.type || "").toLowerCase() === "password";
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
      if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) return null;
      return field;
    }

    function lockSuggestionGuardField(field) {
      if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) return;
      if (field.disabled) return;
      field.setAttribute("readonly", "readonly");
    }

    function unlockSuggestionGuardField(field) {
      if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) return;
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
          const id = String(item.id || createDevTodoId()).trim() || createDevTodoId();
          const createdAtInput = String(item.createdAt || "").trim();
          const createdAtTime = parseDateTimeValue(createdAtInput);
          const createdAt = Number.isFinite(createdAtTime)
            ? formatDateTimeFromDate(new Date(createdAtTime))
            : getCurrentDateTimeString();
          return { id, text, createdAt };
        })
        .filter(Boolean)
        .sort((left, right) => parseDateTimeValue(right.createdAt) - parseDateTimeValue(left.createdAt));
    }

    function resolveAccountantProfileDisplayName(rawProfile) {
      if (!rawProfile || typeof rawProfile !== "object") return "";
      return String(
        rawProfile.displayName
        || rawProfile.alias
        || rawProfile.nickname
        || rawProfile.chineseName
        || rawProfile.cnName
        || rawProfile.name
        || rawProfile.phone
        || rawProfile.mobile
        || rawProfile.mobilePhone
        || rawProfile.username
        || ""
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
          loginPassword: ""
        };
      }
      if (!rawProfile || typeof rawProfile !== "object") return null;
      const username = String(
        rawProfile.username
        || rawProfile.loginName
        || rawProfile.account
        || rawProfile.phone
        || rawProfile.mobile
        || rawProfile.mobilePhone
        || rawProfile.name
        || ""
      ).trim();
      const displayName = String(resolveAccountantProfileDisplayName(rawProfile) || username).trim();
      if (!username || !displayName) return null;
      const aliasInput = String(rawProfile.alias || rawProfile.nickname || "").trim();
      const alias = aliasInput || (displayName !== username ? displayName : "");
      const realName = String(
        rawProfile.realName || rawProfile.fullName || rawProfile.legalName || ""
      ).trim();
      const phone = String(
        rawProfile.phone || rawProfile.mobile || rawProfile.mobilePhone || ""
      ).trim();
      const loginPassword = String(rawProfile.loginPassword || rawProfile.password || "").trim();
      return {
        username,
        displayName,
        name: displayName,
        alias,
        realName,
        phone,
        loginPassword
      };
    }

    function compareAccountantNameByOrderCount(leftName, rightName, orderCountMap) {
      const countDiff = (orderCountMap.get(rightName) || 0) - (orderCountMap.get(leftName) || 0);
      if (countDiff !== 0) return countDiff;
      return leftName.localeCompare(rightName, "zh-CN", { numeric: true, sensitivity: "base" });
    }

    function getOrderSortedAccountantNames(sourceNames, orderCountMap) {
      return Array.from(
        new Set(sourceNames.map((name) => String(name || "").trim()).filter(Boolean))
      ).sort((left, right) => compareAccountantNameByOrderCount(left, right, orderCountMap));
    }

    function withBuiltInAccountantOptions(sourceNames) {
      const names = Array.isArray(sourceNames) ? sourceNames : [];
      return [
        ...BUILT_IN_ACCOUNTANT_NAMES,
        ...names.filter((name) => !isBuiltInAccountantName(name))
      ];
    }

    function isNonSettlementAccountantName(value) {
      return String(value || "").trim() === NON_SETTLEMENT_ACCOUNTANT_NAME;
    }

    function isBuiltInAccountantName(value) {
      return BUILT_IN_ACCOUNTANT_NAMES.includes(String(value || "").trim());
    }

    function getAccountantOrderCountMap() {
      return records.reduce((map, item) => {
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
          if (isBuiltInAccountantName(profile.displayName) || isBuiltInAccountantName(profile.username)) return;
          const current = profileByUsername.get(profile.username);
          if (!current) {
            profileByUsername.set(profile.username, profile);
            return;
          }
          const next = {
            ...current,
            displayName: current.displayName || profile.displayName || current.username,
            name: current.displayName || profile.displayName || current.username,
            alias: current.alias || profile.alias || "",
            realName: current.realName || profile.realName || "",
            phone: current.phone || profile.phone || "",
            loginPassword: current.loginPassword || profile.loginPassword || ""
          };
          profileByUsername.set(profile.username, next);
        });

      extraNames.forEach((name) => {
        const normalizedDisplayName = String(name || "").trim();
        if (!normalizedDisplayName) return;
        if (isBuiltInAccountantName(normalizedDisplayName)) return;
        const exists = Array.from(profileByUsername.values()).some(
          (profile) => String(profile.displayName || "").trim() === normalizedDisplayName
        );
        if (!exists) {
          profileByUsername.set(normalizedDisplayName, {
            username: normalizedDisplayName,
            displayName: normalizedDisplayName,
            name: normalizedDisplayName,
            alias: "",
            realName: "",
            phone: "",
            loginPassword: ""
          });
        }
      });

      return Array.from(profileByUsername.values()).sort((left, right) =>
        String(left.displayName || "").localeCompare(String(right.displayName || ""), "zh-CN", { numeric: true, sensitivity: "base" })
      );
    }

    function getAccountantProfileByLoginName(loginNameRaw) {
      const loginName = String(loginNameRaw || "").trim();
      if (!loginName) return null;
      return accountants.find((item) => (
        String(item.username || item.name || "").trim() === loginName
        || String(item.phone || "").trim() === loginName
      )) || null;
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
      const displayName = String(profile.displayName || profile.name || profile.username || "").trim();
      if (
        normalizeLoginRole(currentAccountRole) === "accountant"
        && String(loginNameRaw || "").trim() === String(currentAccount || "").trim()
        && displayName
        && displayName !== currentAccountDisplayName
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

    function getAccountantRealNameByLoginName(loginNameRaw) {
      const realName = String(getAccountantProfileByLoginName(loginNameRaw)?.realName || "").trim();
      if (
        normalizeLoginRole(currentAccountRole) === "accountant"
        && String(loginNameRaw || "").trim() === String(currentAccount || "").trim()
        && realName
        && realName !== currentAccountRealName
      ) {
        currentAccountRealName = realName;
      }
      return realName;
    }

    function getCurrentAccountantRealName() {
      const realName = getAccountantRealNameByLoginName(currentAccount);
      return String(realName || currentAccountRealName || "").trim();
    }

    function getAccountantLoginPhoneByLoginName(loginNameRaw) {
      const phone = String(getAccountantProfileByLoginName(loginNameRaw)?.phone || "").trim();
      if (
        normalizeLoginRole(currentAccountRole) === "accountant"
        && String(loginNameRaw || "").trim() === String(currentAccount || "").trim()
        && phone
        && phone !== currentAccountPhone
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
      const role = String(rawRole || "").trim().toLowerCase();
      if (role === "dispatcher" || role === "accountant" || role === "boss") return role;
      return "";
    }

    function getDispatcherTagForAccount(accountNameRaw) {
      const normalizedAccount = String(resolveLoginAccountInput(accountNameRaw) || "").trim().toLowerCase();
      if (normalizedAccount && ACCOUNT_TO_DISPATCHER_TAG[normalizedAccount]) {
        return ACCOUNT_TO_DISPATCHER_TAG[normalizedAccount];
      }

      const source = String(accountNameRaw || "").trim().toLowerCase();
      if (!source) return "";
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
      const normalizedRole = normalizeLoginRole(rawEntry.role) || inferRoleByAccountName(account);
      const resolvedAccount = String(resolveLoginAccountInput(account) || account).trim();
      const updatedAt = Number(rawEntry.updatedAt);
      return {
        account: normalizedRole === "accountant"
          ? getAccountantLoginIdentifier(resolvedAccount)
          : resolvedAccount,
        password,
        role: normalizedRole,
        updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : Date.now()
      };
    }

    function getSavedLoginEntryKey(accountNameRaw) {
      const resolvedAccount = String(resolveLoginAccountInput(accountNameRaw) || accountNameRaw || "").trim();
      return String(getAccountantLoginIdentifier(resolvedAccount) || resolvedAccount).trim().toLowerCase();
    }

    function getSavedLoginRoleKey(accountNameRaw, roleRaw) {
      const role = normalizeLoginRole(roleRaw) || inferRoleByAccountName(accountNameRaw);
      if (role === "dispatcher" || role === "accountant" || role === "boss") return role;
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

    function getSavedLoginMetaText(accountNameRaw, roleRaw) {
      const accountName = String(accountNameRaw || "").trim();
      const roleKey = getSavedLoginRoleKey(accountNameRaw, roleRaw);
      if (roleKey === "dispatcher") {
        const dispatcherTag = getDispatcherTagForAccount(accountNameRaw);
        return dispatcherTag ? `接待号 ${dispatcherTag}` : "接待账号";
      }
      if (roleKey === "boss") {
        return "负责人视图";
      }
      const resolvedAccount = String(resolveLoginAccountInput(accountName) || accountName).trim();
      return resolvedAccount ? `账号 ${resolvedAccount}` : "会计账号";
    }

    function getDispatcherAccountDisplayName(accountNameRaw) {
      const accountName = String(accountNameRaw || "").trim();
      const normalizedAccount = String(resolveLoginAccountInput(accountNameRaw) || accountName || "").trim().toLowerCase();
      if (normalizedAccount && DISPATCHER_ACCOUNT_DISPLAY_NAME[normalizedAccount]) {
        return DISPATCHER_ACCOUNT_DISPLAY_NAME[normalizedAccount];
      }
      const dispatcherTag = getDispatcherTagForAccount(accountNameRaw);
      if (dispatcherTag === "开心财税") return "开心财税";
      return dispatcherTag ? `开心财税${dispatcherTag}` : accountName;
    }

    function getSavedLoginDisplayName(accountNameRaw, roleRaw) {
      const accountName = String(accountNameRaw || "").trim();
      const roleKey = getSavedLoginRoleKey(accountNameRaw, roleRaw);
      if (roleKey === "dispatcher") {
        return getDispatcherAccountDisplayName(accountNameRaw);
      }
      if (roleKey === "boss") {
        return String(resolveLoginAccountInput(accountNameRaw) || accountName || BOSS_LOGIN_ACCOUNT).trim();
      }
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
        const roleKey = getSavedLoginRoleKey(normalized.account, normalized.role);
        if (!groupedEntries.has(roleKey)) {
          groupedEntries.set(roleKey, []);
        }
        groupedEntries.get(roleKey).push(normalized);
      });

      groupOrder.forEach((roleKey) => {
        const entries = groupedEntries.get(roleKey) || [];
        if (!entries.length) return;

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
          const roleKey = getSavedLoginRoleKey(normalized.account, normalized.role);
          const itemButton = document.createElement("button");
          itemButton.type = "button";
          itemButton.className = "saved-login-item";
          itemButton.dataset.savedLoginKey = getSavedLoginEntryKey(normalized.account);

          const main = document.createElement("span");
          main.className = "saved-login-item-main";

          const name = document.createElement("span");
          name.className = "saved-login-item-name";
          name.textContent = getSavedLoginDisplayName(normalized.account, normalized.role);

          const meta = document.createElement("span");
          meta.className = "saved-login-item-meta";
          meta.textContent = getSavedLoginMetaText(normalized.account, normalized.role);

          const role = document.createElement("span");
          role.className = `saved-login-item-role ${roleKey}`;
          role.textContent = getSavedLoginRoleLabel(roleKey);

          main.appendChild(name);
          main.appendChild(meta);
          itemButton.appendChild(main);
          itemButton.appendChild(role);
          groupList.appendChild(itemButton);
        });

        group.appendChild(groupList);
        savedLoginList.appendChild(group);
      });
    }

    function isBossLogin(accountName = currentAccount) {
      const normalized = String(resolveLoginAccountInput(accountName) || "").trim().toLowerCase();
      if (!normalized) return false;
      const isCurrent = String(accountName || "").trim() === String(currentAccount || "").trim();
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
      return isBossLogin() || isDispatcherLogin();
    }

    function canCurrentAccountPayoutSettlementRecords() {
      return isBossLogin();
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
          .filter(Boolean)
      );
      selectedBossRecordIds = new Set(
        Array.from(selectedBossRecordIds).filter((recordId) => validRecordIds.has(recordId))
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
      if (value === true || value === 1) return true;
      const normalized = String(value || "").trim().toLowerCase();
      return normalized === "true"
        || normalized === "1"
        || normalized === "yes"
        || normalized === "已打款";
    }

    function isRecordSettlementPaid(record) {
      if (!record || typeof record !== "object") return false;
      return normalizeRecordSettlementPaidState(
        Object.prototype.hasOwnProperty.call(record, "isSettlementPaid")
          ? record.isSettlementPaid
          : record.settlementPaid
      );
    }

    function isBossSettlementPayoutRecordSelectable(record) {
      if (!canCurrentAccountPayoutSettlementRecords()) return false;
      if (!isRecordCompleted(record)) return false;
      return isRecordInvoiceUploaded(record) && !isRecordSettlementPaid(record);
    }

    function syncBossSettlementPayoutSelection(sourceRecords = records) {
      const validRecordIds = new Set(
        (Array.isArray(sourceRecords) ? sourceRecords : [])
          .filter((item) => isBossSettlementPayoutRecordSelectable(item))
          .map((item) => String(item?.id || "").trim())
          .filter(Boolean)
      );
      selectedBossSettlementPayoutRecordIds = new Set(
        Array.from(selectedBossSettlementPayoutRecordIds).filter((recordId) => validRecordIds.has(recordId))
      );
    }

    function isBossSettlementPayoutRecordSelected(recordId) {
      const normalizedRecordId = String(recordId || "").trim();
      return Boolean(normalizedRecordId && selectedBossSettlementPayoutRecordIds.has(normalizedRecordId));
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
      if (record.isSettled === true || record.isSettled === 1) return true;
      const normalized = String(record.isSettled || "").trim().toLowerCase();
      return normalized === "true"
        || normalized === "1"
        || normalized === "yes"
        || normalized === "已结算"
        || normalized === "已结算/待上传"
        || normalized === "已上传"
        || normalized === "已上传/待打款"
        || normalized === "已打款";
    }

    function isMonthlySettlementRecord(record) {
      if (!record || typeof record !== "object") return false;
      if (record.isMonthlySettlement === true || record.isMonthlySettlement === 1) return true;
      const normalized = String(record.isMonthlySettlement || "").trim().toLowerCase();
      return normalized === "true"
        || normalized === "1"
        || normalized === "yes"
        || normalized === "on"
        || normalized === "是"
        || normalized === "月结";
    }

    function getMonthlySettlementLabel(value) {
      return isMonthlySettlementRecord({ isMonthlySettlement: value }) ? "是" : "否";
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
      const url = resolveStoredAssetUrl(rawUrl || (fileName ? `/invoice-images/${encodeURIComponent(fileName)}` : ""));
      if (!url) return null;
      return {
        id: String(rawImage.id || "").trim(),
        name: String(rawImage.name || "").trim() || fileName || "发票图片",
        fileName,
        url
      };
    }

    function isRecordInvoiceUploaded(record) {
      return isRecordSettled(record) && Boolean(getSettlementInvoiceImage(record));
    }

    function getRecordWorkflowStatusLabelByKey(statusKey) {
      if (statusKey === "paid") return "已打款";
      if (statusKey === "uploaded") return "已上传/待打款";
      if (statusKey === "settled") return "已结算/待上传";
      if (statusKey === "partial_refunded") return "部分退款";
      if (statusKey === "refunded") return "退款";
      if (statusKey === "completed") return "已完成/待结算";
      if (statusKey === "checked") return "已确认/待完成";
      if (statusKey === "returned") return "已退单";
      return "已接待/待确认";
    }

    function normalizeSettlementWorkflowStatus(value) {
      const status = String(value || "").trim().toLowerCase();
      if (!status) return "";
      if (status === "已打款") return "paid";
      if (status === "已上传" || status === "已上传/待打款") return "uploaded";
      if (status === "已结算" || status === "已结算/待上传") return "settled";
      if (status === "未结算" || status === "待结算" || status === "已完成/待结算") return "completed";
      return "";
    }

    function getSettlementWorkflowStatusText(value) {
      const statusKey = normalizeSettlementWorkflowStatus(value);
      return statusKey ? getRecordWorkflowStatusLabelByKey(statusKey) : String(value || "").trim();
    }

    function getRecordSettlementLabel(record) {
      if (isRecordSettlementPaid(record)) return getRecordWorkflowStatusLabelByKey("paid");
      if (isRecordInvoiceUploaded(record)) return getRecordWorkflowStatusLabelByKey("uploaded");
      if (isRecordSettled(record)) return getRecordWorkflowStatusLabelByKey("settled");
      return isRecordCompleted(record) ? getRecordWorkflowStatusLabelByKey("completed") : "未结算";
    }

    function hasRecordRefundOperation(record) {
      return Boolean(getRecordRefundBadgeText(record));
    }

    function getRecordRefundBadgeText(record) {
      const refundStatus = String(record?.refundStatus || "").trim().toLowerCase();
      const checkStatus = String(record?.checkStatus || "").trim().toLowerCase();
      const total = Number(record?.totalPrice);
      const settlement = Number(record?.settlementPrice);
      const hasRefundMarker = refundStatus === "refunded"
        || refundStatus === "partial_refunded"
        || checkStatus === "refunded"
        || checkStatus === "partial_refunded"
        || Boolean(String(record?.refundedAt || "").trim());
      if (hasRefundMarker && Math.round(total * 100) === 0 && Math.round(settlement * 100) === 0) return "退单";
      if (refundStatus === "refunded" || checkStatus === "refunded") return "退单";
      if (refundStatus === "partial_refunded" || checkStatus === "partial_refunded") return "部分退款";
      return String(record?.refundedAt || "").trim() ? "部分退款" : "";
    }

    function isRecordCompleted(record) {
      const checkStatus = String(record?.checkStatus || "").trim().toLowerCase();
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
      const checkStatus = String(record?.checkStatus || "").trim().toLowerCase();
      return checkStatus === "checked"
        || checkStatus === "completed"
        || checkStatus === "partial_refunded"
        || checkStatus === "refunded"
        || checkStatus === "returned"
        || Boolean(String(record?.checkedAt || "").trim())
        || Boolean(String(record?.completedAt || "").trim())
        || Boolean(String(record?.returnedAt || "").trim());
    }

    function getRecordWorkflowStatusKey(record) {
      const checkStatus = String(record?.checkStatus || "").trim().toLowerCase();
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

    function getAccountantInvoiceUploadTargetRecords(sourceRecords = records) {
      if (!isAccountantLogin()) return [];
      return (Array.isArray(sourceRecords) ? sourceRecords : []).filter((item) => {
        return isRecordSettled(item)
          && !isRecordInvoiceUploaded(item)
          && isRecordCompletionStatus(item);
      });
    }

    function getAccountantInvoiceUploadSummary(sourceRecords = records) {
      const targetRecords = getAccountantInvoiceUploadTargetRecords(sourceRecords);
      const invoiceAmount = targetRecords.reduce((sum, item) => {
        const settlement = Number(item?.settlementPrice);
        return Number.isFinite(settlement) ? sum + settlement : sum;
      }, 0);
      const taxAmount = getSettlementTaxAmount(invoiceAmount);
      return {
        targetRecords,
        count: targetRecords.length,
        invoiceAmount,
        taxAmount,
        payableAmount: invoiceAmount - taxAmount
      };
    }

    function isBossSettlementDetailRecord(record) {
      if (!isRecordSettled(record)) return false;
      return isRecordCompletionStatus(record);
    }

    function getBossSettlementDetailRecords(sourceRecords = records) {
      return (Array.isArray(sourceRecords) ? sourceRecords : []).filter((item) => isBossSettlementDetailRecord(item));
    }

    function getBossSettlementRecordState(record) {
      if (isRecordSettled(record)) return "settled";
      const checkStatus = String(record?.checkStatus || "").trim().toLowerCase();
      if (checkStatus === "refunded") return "refunded";
      if (checkStatus === "returned") return "returned";
      if (!isRecordCompletionStatus(record)) return "not_completed";
      return "ready";
    }

    function getBossSettlementSelectionSummary(sourceRecords = records) {
      const selectedRecords = getSelectedBossRecords(sourceRecords);
      const readySelectedRecords = selectedRecords.filter((item) => getBossSettlementRecordState(item) === "ready");
      const alreadySettledCount = selectedRecords.filter((item) => getBossSettlementRecordState(item) === "settled").length;
      const returnedCount = selectedRecords.filter((item) => getBossSettlementRecordState(item) === "returned").length;
      const refundedCount = selectedRecords.filter((item) => getBossSettlementRecordState(item) === "refunded").length;
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
        totalSettlement
      };
    }

    function setRecentBossSettlementRecordIds(recordIds) {
      recentBossSettlementRecordIds = Array.from(
        new Set(
          (Array.isArray(recordIds) ? recordIds : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );
      if (!recentBossSettlementRecordIds.length && typeof closeBossSettlementDetailModal === "function") {
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
        ? item.serviceFeedbackImages.map((image) => {
          if (!image || typeof image !== "object") return "";
          return [
            String(image.id || ""),
            String(image.url || ""),
            String(image.fileName || "")
          ].join("\u0004");
        }).join("\u0003")
        : "";
      const invoiceImage = getSettlementInvoiceImage(item);
      const operationHistory = Array.isArray(item.operationHistory)
        ? item.operationHistory.map((entry) => {
          if (!entry || typeof entry !== "object") return "";
          const changes = Array.isArray(entry.changes)
            ? entry.changes.map((change) => {
              if (!change || typeof change !== "object") return "";
              return [
                String(change.field || ""),
                String(change.before ?? ""),
                String(change.after ?? "")
              ].join("\u0005");
            }).join("\u0004")
            : "";
          return [
            String(entry.historyId || ""),
            String(entry.operatedAt || ""),
            String(entry.operatedBy || ""),
            String(entry.operatedRole || ""),
            String(entry.actionKey || ""),
            String(entry.actionLabel || ""),
            changes
          ].join("\u0004");
        }).join("\u0003")
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
        invoiceImage ? [
          String(invoiceImage.id || ""),
          String(invoiceImage.url || ""),
          String(invoiceImage.fileName || "")
        ].join("\u0004") : "",
        String(item.invoiceUploadedAt || ""),
        String(item.invoiceUploadedBy || ""),
        String(item.invoiceUploadedByUsername || ""),
        Number.isFinite(payment) ? payment : "",
        Number.isFinite(total) ? total : "",
        Number.isFinite(settlement) ? settlement : "",
        feedbackImages,
        operationHistory
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
      const accountantKey = String(accountantProfile?.username || normalizedAccount).trim().toLowerCase();
      return accountantKey ? `${STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX}_acct_${accountantKey}` : "";
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
      const accountantKey = String(accountantProfile?.username || normalizedAccount).trim().toLowerCase();
      return accountantKey ? `${STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX}_acct_${accountantKey}` : "";
    }

    function saveUpdatedRowDismissState() {
      const dismissKey = getUpdatedRowDismissStorageKey();
      const highlightKey = getUpdatedRowHighlightStorageKey();
      const highlightedIds = Array.from(highlightedUpdatedRecordIds || []).filter((recordId) =>
        Boolean(String(recordId || "").trim())
      );
      if (highlightKey) {
        if (highlightedIds.length) {
          setPersistentStateItem(highlightKey, JSON.stringify(highlightedIds));
        } else {
          removePersistentStateItem(highlightKey);
        }
      }

      const entries = Object.entries(dismissedUpdatedRecordSignatures || {}).filter(([recordId, signature]) =>
        Boolean(String(recordId || "").trim()) && Boolean(String(signature || "").trim())
      );
      if (!dismissKey) return;
      if (!entries.length) {
        removePersistentStateItem(dismissKey);
        return;
      }
      setPersistentStateItem(dismissKey, JSON.stringify(Object.fromEntries(entries)));
    }

    function loadUpdatedRowDismissState() {
      highlightedUpdatedRecordIds = new Set();
      dismissedUpdatedRecordSignatures = {};
      const highlightKey = getUpdatedRowHighlightStorageKey();
      if (highlightKey) {
        const highlightedRaw = String(getPersistentStateItem(highlightKey) || "").trim();
        if (highlightedRaw) {
          try {
            const parsed = JSON.parse(highlightedRaw);
            if (Array.isArray(parsed)) {
              highlightedUpdatedRecordIds = new Set(
                parsed.filter((recordId) => Boolean(String(recordId || "").trim()))
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
          Object.entries(parsed).filter(([recordId, signature]) =>
            Boolean(String(recordId || "").trim()) && Boolean(String(signature || "").trim())
          )
        );
      } catch (error) {
        console.error(error);
        dismissedUpdatedRecordSignatures = {};
      }
    }

    function normalizeHighlightOperatorValue(value) {
      return String(value || "").trim().toLowerCase();
    }

    function getRecordHistoryEntrySignature(entry) {
      if (!entry || typeof entry !== "object") return "";
      const changes = Array.isArray(entry.changes)
        ? entry.changes.map((change) => {
          if (!change || typeof change !== "object") return "";
          return [
            String(change.field || ""),
            String(change.before ?? ""),
            String(change.after ?? "")
          ].join("\u0005");
        }).join("\u0004")
        : "";
      return [
        String(entry.historyId || ""),
        String(entry.operatedAt || ""),
        String(entry.operatedBy || ""),
        String(entry.operatedRole || ""),
        String(entry.actionKey || ""),
        String(entry.actionLabel || ""),
        changes
      ].join("\u0004");
    }

    function getLatestRecordHistoryEntry(record) {
      const historyItems = Array.isArray(record?.operationHistory) ? record.operationHistory : [];
      return historyItems.find((entry) => entry && typeof entry === "object") || null;
    }

    function getCurrentUserHighlightContext() {
      const accountName = String(currentAccount || "").trim();
      const role = normalizeLoginRole(currentAccountRole) || inferRoleByAccountName(accountName);
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
          addCandidate(dispatcherTag === "开心财税" ? "开心财税" : `开心财税${dispatcherTag}`);
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
      if (getRecordHistoryEntrySignature(previousLatestEntry) === getRecordHistoryEntrySignature(nextLatestEntry)) {
        return false;
      }
      return isCurrentUserOperationEntry(nextLatestEntry);
    }

    function syncUpdatedRowHighlightState(previousRecords, nextRecords, options = {}) {
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
          Boolean(String(recordId || "").trim())
        )
      );

      nextList.forEach((item) => {
        const recordId = String(item?.id || "").trim();
        if (!recordId) return;
        const nextSignature = getRecordComparisonSignature(item);
        if (!nextSignature) return;
        const previousRecord = previousRecordMap.get(recordId) || null;
        const latestOperatorIsCurrentUser = isCurrentUserOperationEntry(getLatestRecordHistoryEntry(item));
        const changedByCurrentUser = isRecordChangedByCurrentUser(previousRecord, item);
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
      if (actionKey === "settled") return "已结算";
      if (actionKey === "invoice_uploaded") return "发票已上传";
      if (actionKey === "updated") return "信息更新";
      return normalizeText(latestEntry?.actionLabel, 32) || "信息更新";
    }

    function dismissUpdatedRowHighlight(recordIdRaw) {
      const recordId = String(recordIdRaw || "").trim();
      if (!recordId) return;
      const targetRecord = records.find((item) => String(item?.id || "").trim() === recordId);
      if (!targetRecord) return;
      const nextSignature = getRecordComparisonSignature(targetRecord);
      if (!nextSignature) return;
      highlightedUpdatedRecordIds.delete(recordId);
      dismissedUpdatedRecordSignatures = {
        ...(dismissedUpdatedRecordSignatures || {}),
        [recordId]: nextSignature
      };
      saveUpdatedRowDismissState();
    }

    function addUpdatedRowHighlights(recordIds) {
      const normalizedIds = (Array.isArray(recordIds) ? recordIds : [recordIds])
        .map((item) => String(item || "").trim())
        .filter(Boolean);
      if (!normalizedIds.length) return;
      const nextHighlightedIds = new Set(highlightedUpdatedRecordIds || []);
      const nextDismissedSignatures = { ...(dismissedUpdatedRecordSignatures || {}) };
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
      const normalized = String(resolveLoginAccountInput(accountNameRaw) || accountNameRaw || "").trim().toLowerCase();
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
      return Boolean(String(currentAccount || "").trim() && String(currentLoginAccount || "").trim());
    }

    function validateCurrentAccount() {
      if (!currentAccount) return;
      if (inferRoleByAccountName(currentAccount) === "dispatcher") {
        const normalizedDispatcherAccount = resolveLoginAccountInput(currentAccount);
        if (normalizedDispatcherAccount && normalizedDispatcherAccount !== currentAccount) {
          currentAccount = normalizedDispatcherAccount;
          saveToStorage();
        }
      }
      if (normalizeLoginRole(currentAccountRole) === "boss") return;
      if (!normalizeLoginRole(currentAccountRole) && inferRoleByAccountName(currentAccount) === "boss") return;
      if (normalizeLoginRole(currentAccountRole) === "dispatcher") return;
      if (!normalizeLoginRole(currentAccountRole) && inferRoleByAccountName(currentAccount) === "dispatcher") return;
      if (!accountants.length) return;
      if (getAccountantProfileByLoginName(currentAccount)) return;
      clearCurrentAccountIdentity();
      saveToStorage();
    }

    function getVisibleRecords() {
      const dispatcherTag = isDispatcherLogin() ? getCurrentDispatcherTag() : "";
      const accountantName = isAccountantLogin() ? getCurrentAccountantDisplayName() : "";
      if (dispatcherTag) {
        return records.filter((item) => normalizeDispatcherTag(item.dispatcher) === dispatcherTag);
      }
      if (!accountantName) return records;
      return records.filter((item) => String(item.accountant || "").trim() === accountantName);
    }

    function getVisibleRecycleBinRecords() {
      const dispatcherTag = isDispatcherLogin() ? getCurrentDispatcherTag() : "";
      const accountantName = isAccountantLogin() ? getCurrentAccountantDisplayName() : "";
      if (dispatcherTag) {
        return recycleBinRecords.filter((entry) => {
          const record = entry && typeof entry === "object" ? (entry.record || {}) : {};
          return normalizeDispatcherTag(record.dispatcher) === dispatcherTag;
        });
      }
      if (!accountantName) return recycleBinRecords;
      return recycleBinRecords.filter((entry) => {
        const record = entry && typeof entry === "object" ? (entry.record || {}) : {};
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
          (entry) => String(entry?.operatedByUsername || entry?.operatedBy || "").trim() === accountName
        );
      }

      const dispatcherTag = getCurrentDispatcherTag();
      if (!dispatcherTag) return [];
      return accountantOperationLogs.filter(
        (entry) => normalizeDispatcherTag(entry?.dispatcher) === dispatcherTag
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
      const structuredMatch = source.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
      if (structuredMatch) {
        const year = Number(structuredMatch[1]);
        const month = Number(structuredMatch[2]);
        const day = Number(structuredMatch[3]);
        const hour = Number(structuredMatch[4] || 0);
        const minute = Number(structuredMatch[5] || 0);
        const second = Number(structuredMatch[6] || 0);
        const date = new Date(year, month - 1, day, hour, minute, second);
        if (
          date.getFullYear() === year
          && date.getMonth() === month - 1
          && date.getDate() === day
          && date.getHours() === hour
          && date.getMinutes() === minute
          && date.getSeconds() === second
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
      const timestamp = rawDateTime instanceof Date ? rawDateTime.getTime() : parseDateTimeValue(rawDateTime);
      if (!Number.isFinite(timestamp)) {
        return formatDateTimeLocalInputValue(new Date());
      }
      const date = new Date(timestamp);
      return `${formatDateFromDate(date)}T${padDateTimeNumber(date.getHours())}:${padDateTimeNumber(date.getMinutes())}:${padDateTimeNumber(date.getSeconds())}`;
    }

    function formatDateInputValue(rawDate = new Date()) {
      const timestamp = rawDate instanceof Date ? rawDate.getTime() : parseDateTimeValue(rawDate);
      if (!Number.isFinite(timestamp)) {
        return getTodayISODate();
      }
      return formatDateFromDate(new Date(timestamp));
    }

    function normalizeCompleteModalMode(modeRaw) {
      return String(modeRaw || "").trim().toLowerCase() === "view" ? "view" : "edit";
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
      if (typeof source?.totalPrice === "string" && source.totalPrice.trim() === "") return Number.NaN;
      if (typeof source?.settlementPrice === "string" && source.settlementPrice.trim() === "") return Number.NaN;
      const total = Number(source?.totalPrice);
      const settlement = Number(source?.settlementPrice);
      if (!Number.isFinite(total) || !Number.isFinite(settlement) || total <= 0) return Number.NaN;
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
      if (typeof source?.paymentPrice === "string" && source.paymentPrice.trim() === "") return Number.NaN;
      if (typeof source?.totalPrice === "string" && source.totalPrice.trim() === "") return Number.NaN;
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
      const terms = sourceList
        .map((value) => mapValue(value))
        .filter(Boolean);
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
              profit
            }
          ]
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
          profit: segmentProfit
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
        segments
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
        totalProfit: baseProfit + getTieredPremiumProfit(premium)
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
      const premiumText = parts.premium < 0
        ? `(${toMoney(parts.premium)} * ?%)`
        : `${toMoney(parts.premium)} * ?%`;
      return `${toMoney(parts.baseProfit)} + ${premiumText}`;
    }

    function getProfitTotal(sourceRecords) {
      const summary = (Array.isArray(sourceRecords) ? sourceRecords : []).reduce((current, item) => {
        const total = Number(item?.totalPrice);
        const premium = getPremiumValue(item);
        if (Number.isFinite(total)) {
          current.totalBase += total * getDispatcherBaseProfitRate(item);
        }
        if (Number.isFinite(premium)) {
          current.totalPremium += premium;
        }
        return current;
      }, { totalBase: 0, totalPremium: 0 });
      return summary.totalBase + getTieredPremiumProfit(summary.totalPremium);
    }

    function getProfitTotalBreakdown(sourceRecords) {
      const summary = (Array.isArray(sourceRecords) ? sourceRecords : []).reduce((current, item) => {
        const total = Number(item?.totalPrice);
        const premium = getPremiumValue(item);
        if (Number.isFinite(total)) {
          current.baseTerms.push(total * getDispatcherBaseProfitRate(item));
        }
        if (Number.isFinite(premium)) {
          current.premiumTerms.push(premium);
        }
        return current;
      }, { baseTerms: [], premiumTerms: [] });

      const totalBase = summary.baseTerms.reduce((sum, value) => sum + value, 0);
      const totalPremium = summary.premiumTerms.reduce((sum, value) => sum + value, 0);
      const premiumBreakdown = getTieredPremiumProfitBreakdown(totalPremium);
      const premiumProfit = premiumBreakdown ? premiumBreakdown.profit : Number.NaN;
      return {
        baseTerms: summary.baseTerms,
        premiumTerms: summary.premiumTerms,
        totalBase,
        totalPremium,
        premiumBreakdown,
        premiumProfit,
        totalProfit: totalBase + premiumProfit
      };
    }

    function formatProfitTotalTooltip(sourceRecords) {
      const breakdown = getProfitTotalBreakdown(sourceRecords);
      if (!Number.isFinite(breakdown.totalProfit)) return "";

      const baseExpression = formatMoneyExpression(
        breakdown.baseTerms,
        (value) => formatSignedMoneyFactor(value)
      );
      const premiumExpression = formatMoneyExpression(
        breakdown.premiumTerms,
        (value) => formatSignedMoneyFactor(value)
      );
      const premiumTierLines = (breakdown.premiumBreakdown?.segments || []).map((segment) => (
        `${formatSignedMoneyFactor(segment.amount)} * ${(segment.rate * 100).toFixed(0)}% = ${toMoney(segment.profit)}`
      ));

      return [
        `接待收益合计：${toMoney(breakdown.totalProfit)}`,
        `A部分：${baseExpression} = ${toMoney(breakdown.totalBase)}`,
        `B部分溢价合计：${premiumExpression} = ${toMoney(breakdown.totalPremium)}`,
        "B部分阶梯计算：",
        ...(premiumTierLines.length ? premiumTierLines : ["0.00 * 45% = 0.00"]),
        `总接待收益：${toMoney(breakdown.totalBase)} + ${toMoney(breakdown.premiumProfit)} = ${toMoney(breakdown.totalProfit)}`
      ].join("\n");
    }

    function formatDateTimeDisplay(rawDateTime) {
      const source = String(rawDateTime || "").trim();
      const timestamp = parseDateTimeValue(source);
      if (Number.isNaN(timestamp)) return source;
      return formatDateTimeFromDate(new Date(timestamp));
    }

    function normalizeBuildVersion(rawVersion) {
      const version = String(rawVersion || "").trim().replace(/^v/i, "");
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

    function getElementFormControls(root) {
      if (!(root instanceof HTMLElement)) return [];
      return Array.from(root.querySelectorAll("button, input, textarea, select")).filter((node) => (
        node instanceof HTMLButtonElement
        || node instanceof HTMLInputElement
        || node instanceof HTMLTextAreaElement
        || node instanceof HTMLSelectElement
      ));
    }

    function setButtonLoading(button, active, loadingText = "") {
      if (!(button instanceof HTMLButtonElement)) return;
      const isActive = Boolean(active);
      if (isActive) {
        if (!button.dataset.loadingOriginalHtml) {
          button.dataset.loadingOriginalHtml = button.innerHTML;
        }
        if (!button.dataset.loadingOriginalDisabled) {
          button.dataset.loadingOriginalDisabled = button.disabled ? "true" : "false";
        }
        const text = String(loadingText || button.textContent || "处理中...").trim() || "处理中...";
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
            control.dataset.loadingOriginalDisabled = control.disabled ? "true" : "false";
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
        region.dataset.loadingText = String(text || "加载中...").trim() || "加载中...";
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
        regionText = "加载中..."
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
          bar.style.setProperty("--skeleton-width", `${42 + ((rowIndex + cellIndex) % 5) * 11}%`);
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
        ? (container.closest("table")?.querySelectorAll("thead th").length || 6)
        : 4;
      for (let index = 0; index < 4; index += 1) {
        const row = document.createElement(isTableBody ? "tr" : "div");
        row.className = isTableBody ? "table-skeleton-row" : "list-skeleton-row";
        const cellTotal = isTableBody ? headerCellCount : 4;
        for (let cellIndex = 0; cellIndex < cellTotal; cellIndex += 1) {
          const cell = isTableBody ? document.createElement("td") : null;
          const bar = document.createElement("span");
          bar.className = "skeleton-bar";
          bar.style.setProperty("--skeleton-width", `${38 + ((index + cellIndex) % 4) * 14}%`);
          if (cell) {
            cell.appendChild(bar);
            row.appendChild(cell);
          } else {
            row.appendChild(bar);
          }
        }
        container.appendChild(row);
      }
      const region = container.closest(".table-wrap")
        || container.closest(".accountant-list-wrap")
        || (container.parentElement instanceof HTMLElement ? container.parentElement : container);
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
      return Array.from(cell.children).some((child) => (
        child instanceof HTMLElement && child.scrollWidth > child.clientWidth + 1
      ));
    }

    function shouldShowTableTooltipCell(cell) {
      if (!(cell instanceof HTMLElement)) return false;
      if (cell.dataset.tableTooltipMode === "always") return true;
      return isTableTooltipCellOverflowing(cell);
    }

    function placeTableHoverTooltip(event) {
      if (!(event instanceof MouseEvent) || tableHoverTooltip.hidden) return;
      const margin = 14;
      const offset = 16;
      const rect = tableHoverTooltip.getBoundingClientRect();
      let left = event.clientX + offset;
      let top = event.clientY + offset;

      if (left + rect.width + margin > window.innerWidth) {
        left = event.clientX - rect.width - offset;
      }
      if (top + rect.height + margin > window.innerHeight) {
        top = event.clientY - rect.height - offset;
      }

      tableHoverTooltip.style.left = `${Math.max(margin, Math.round(left))}px`;
      tableHoverTooltip.style.top = `${Math.max(margin, Math.round(top))}px`;
    }

    function showTableHoverTooltip(text, event) {
      const normalizedText = String(text || "").trim();
      if (!normalizedText) {
        hideTableHoverTooltip();
        return;
      }
      tableHoverTooltip.textContent = normalizedText;
      tableHoverTooltip.hidden = false;
      tableHoverTooltip.classList.add("visible");
      placeTableHoverTooltip(event);
    }

    function moveTableHoverTooltip(event) {
      placeTableHoverTooltip(event);
    }

    function hideTableHoverTooltip() {
      tableHoverTooltip.classList.remove("visible");
      tableHoverTooltip.hidden = true;
      tableHoverTooltip.textContent = "";
    }

    function setLoginRequestHint(text, state = "idle") {
      setHintState(loginRequestHint, "login-request-hint", text, state);
    }

    function setAppStatusHint(text, state = "idle") {
      setHintState(appStatusHint, "login-request-hint app-status-hint", text, state);
    }

    function setAccountantRegisterHint(text, state = "idle") {
      setHintState(accountantRegisterHint, "login-request-hint accountant-register-hint", text, state);
    }

    function setAccountantEditHint(text, state = "idle") {
      setHintState(accountantEditHint, "login-request-hint accountant-register-hint", text, state);
    }

    function setRecordFormHint(text, state = "idle") {
      setHintState(recordFormHint, "login-request-hint form-request-hint", text, state);
    }

    function setCheckFormHint(text, state = "idle") {
      setHintState(checkFormHint, "login-request-hint form-request-hint", text, state);
    }

    function setCompleteFormHint(text, state = "idle") {
      setHintState(completeFormHint, "login-request-hint form-request-hint", text, state);
    }

    function setRefundFormHint(text, state = "idle") {
      setHintState(refundFormHint, "login-request-hint form-request-hint", text, state);
    }

    function setAccountantModalHint(text, state = "idle") {
      setHintState(accountantModalHint, "login-request-hint form-request-hint", text, state);
    }

    function setDispatcherModalHint(text, state = "idle") {
      setHintState(dispatcherModalHint, "login-request-hint form-request-hint", text, state);
    }

    function setRecycleModalHint(text, state = "idle") {
      setHintState(recycleModalHint, "login-request-hint form-request-hint", text, state);
    }

    function setChangePasswordHint(text, state = "idle") {
      setHintState(changePasswordHint, "login-request-hint accountant-register-hint", text, state);
    }

    function getInlineValidationGroup(target) {
      if (!(target instanceof Element)) return null;
      return target.closest(
        ".detail-item, .meta-item, .price-item, .refund-price-item, .field-feedback-time, .field-feedback-text, .field, .accountant-picker"
      );
    }

    function getInlineValidationErrorNode(group) {
      if (!(group instanceof Element)) return null;
      return Array.from(group.children).find((node) => (
        node instanceof HTMLElement && node.classList.contains("field-inline-error")
      )) || null;
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
        target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
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

    function showInlineFormError({ form, hintSetter, target, message, open, selectText = false }) {
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
        if (typeof hintSetter === "function" && !form.querySelector(".field-validation-group-error")) {
          hintSetter("", "idle");
        }
      };
      form.addEventListener("input", clearHandler);
      form.addEventListener("change", clearHandler);
    }

    function messageIncludesAnyKeyword(message, keywords) {
      const text = String(message || "").trim();
      if (!text) return false;
      return (Array.isArray(keywords) ? keywords : []).some((keyword) => (
        keyword && text.includes(String(keyword))
      ));
    }

    function getRecordFormErrorPresentation(message, fallbackTarget = customerInput) {
      if (messageIncludesAnyKeyword(message, ["日期"])) {
        return { target: dateInput, open: null };
      }
      if (messageIncludesAnyKeyword(message, ["会计"])) {
        return { target: accountantPickerTrigger, open: () => openAccountantPicker() };
      }
      if (messageIncludesAnyKeyword(message, ["来源"])) {
        return { target: sourcePickerTrigger, open: () => openSourcePicker() };
      }
      if (messageIncludesAnyKeyword(message, ["平台", "店铺名"])) {
        return { target: platformShopPickerTrigger, open: () => openPlatformShopPicker() };
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
        target: fallbackTarget instanceof HTMLElement ? fallbackTarget : customerInput,
        open: null
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
      if (messageIncludesAnyKeyword(message, ["姓名"])) {
        return accountantRegisterRealNameInput;
      }
      if (messageIncludesAnyKeyword(message, ["密码"])) {
        return accountantRegisterPasswordInput;
      }
      return accountantRegisterPhoneInput || accountantRegisterPasswordInput;
    }

    function getAccountantEditErrorTarget(message, mode = accountantEditMode) {
      const canEditSensitiveFields = canEditAccountantSensitiveFields(mode);
      if (canEditSensitiveFields && messageIncludesAnyKeyword(message, ["账号", "手机号"])) {
        return accountantEditPhoneInput;
      }
      if (canEditSensitiveFields && messageIncludesAnyKeyword(message, ["密码"])) {
        return accountantEditPasswordInput;
      }
      if (messageIncludesAnyKeyword(message, ["别名", "显示名"])) {
        return accountantEditAliasInput;
      }
      if (messageIncludesAnyKeyword(message, ["姓名"])) {
        return accountantEditRealNameInput;
      }
      if (canEditSensitiveFields) {
        return accountantEditPhoneInput || accountantEditPasswordInput || accountantEditAliasInput;
      }
      return accountantEditAliasInput || accountantEditRealNameInput;
    }

    function showAppStatus(text, state = "error") {
      setAppStatusHint(text, state);
      if (appStatusHint) {
        appStatusHint.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
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
      if (!confirmModal || !confirmModalCard || !confirmModalConfirmBtn || !confirmModalCancelBtn) {
        return Promise.resolve(false);
      }
      const {
        title = "请确认",
        message = "",
        confirmText = "确认",
        cancelText = "取消",
        tone = "danger"
      } = options;
      if (pendingConfirmResolve) {
        const previousResolve = pendingConfirmResolve;
        pendingConfirmResolve = null;
        previousResolve(false);
      }
      if (confirmModalTitle) confirmModalTitle.textContent = String(title || "").trim() || "请确认";
      if (confirmModalMessage) confirmModalMessage.textContent = String(message || "").trim();
      confirmModalCancelBtn.textContent = String(cancelText || "").trim() || "取消";
      confirmModalConfirmBtn.textContent = String(confirmText || "").trim() || "确认";
      confirmModalConfirmBtn.className = tone === "danger" ? "btn-danger" : "btn-primary";
      confirmModal.hidden = false;
      confirmModal.classList.remove("modal-enter");
      confirmModalCard.classList.remove("modal-enter");
      void confirmModal.offsetWidth;
      confirmModal.classList.add("modal-enter");
      confirmModalCard.classList.add("modal-enter");
      syncModalOpenState();
      window.requestAnimationFrame(() => confirmModalCancelBtn.focus());
      return new Promise((resolve) => {
        pendingConfirmResolve = resolve;
      });
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
        (item) => String(item?.accountant || "").trim() === accountantName
      );
      const nextIdSet = new Set(
        visibleRecords
          .map((item) => String(item?.id || "").trim())
          .filter(Boolean)
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
      addUpdatedRowHighlights(newAssignedRecords.map((item) => String(item?.id || "").trim()));
    }
