// Core: constants, DOM refs, runtime state, account/role helpers, notice rendering.
    const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:3000" : "";
    const API_ENDPOINT_RECORDS = `${API_BASE}/api/records`;
    const API_ENDPOINT_RECORDS_SETTLE = `${API_ENDPOINT_RECORDS}/settle`;
    const API_ENDPOINT_RECORDS_INVOICE = `${API_ENDPOINT_RECORDS}/invoice`;
    const API_ENDPOINT_ACCOUNTANTS = `${API_BASE}/api/accountants`;
    const API_ENDPOINT_RECYCLE_BIN = `${API_BASE}/api/recycle-bin`;
    const API_ENDPOINT_ACCOUNTANT_OPERATION_LOGS = `${API_BASE}/api/accountant-operation-logs`;
    const API_ENDPOINT_AUTH_ACCOUNTANT_REGISTER = `${API_BASE}/api/auth/accountant-register`;
    const API_ENDPOINT_AUTH_LOGIN = `${API_BASE}/api/auth/login`;
    const API_ENDPOINT_AUTH_PASSWORD = `${API_BASE}/api/auth/password`;
    const STORAGE_KEY_ACCOUNT = "dispatch_current_account_v1";
    const STORAGE_KEY_ACCOUNT_ROLE = "dispatch_current_account_role_v1";
    const STORAGE_KEY_ACCOUNT_DISPLAY_NAME = "dispatch_current_account_display_name_v1";
    const STORAGE_KEY_ACCOUNT_REAL_NAME = "dispatch_current_account_real_name_v1";
    const STORAGE_KEY_ACCOUNT_PHONE = "dispatch_current_account_phone_v1";
    const STORAGE_KEY_SESSION_TOKEN = "dispatch_session_token_v1";
    const STORAGE_KEY_SAVED_LOGINS = "dispatch_saved_logins_v1";
    const STORAGE_KEY_DEV_TODO_ITEMS = "dispatch_dev_todo_items_v1";
    const STORAGE_KEY_VIEW_STATE = "dispatch_view_state_v1";
    const STORAGE_KEY_OPERATION_NOTICE_DISMISSED_PREFIX = "dispatch_operation_notice_dismissed_v2";
    const STORAGE_KEY_OPERATION_NOTICE_DISMISSED_LEGACY = "dispatch_operation_notice_dismissed_v1";
    const STORAGE_KEY_OPERATION_NOTICE_PENDING_PREFIX = "dispatch_operation_notice_pending_v1";
    const STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX = "dispatch_updated_row_dismissed_v1";
    const STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX = "dispatch_updated_row_highlight_v1";
    const ALLOWED_ACCOUNTS = ["1", "a", "c", "e", "k", "开心财税"];
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
    const COMPLETE_FEEDBACK_IMAGE_MAX_COUNT = 8;
    const COMPLETE_FEEDBACK_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
    const SETTLEMENT_INVOICE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
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
    const ANALYSIS_BUTTON_QUERY_FLAG = "zem";
    const isAnalysisButtonEnabled = String(window.location.search || "")
      .toLowerCase()
      .includes(ANALYSIS_BUTTON_QUERY_FLAG);
    const normalizedHostname = String(window.location.hostname || "").trim().toLowerCase();
    const isDevEnvironment = window.location.protocol === "file:"
      || normalizedHostname === "127.0.0.1"
      || normalizedHostname === "localhost"
      || normalizedHostname === "::1";
    const isTabScopedPersistenceEnabled = normalizedHostname === "127.0.0.1";
    const persistentStateStorage = isTabScopedPersistenceEnabled ? window.sessionStorage : window.localStorage;
    const legacyPersistentStateStorage = isTabScopedPersistenceEnabled ? window.localStorage : window.sessionStorage;
    const isDevTodoEnabled = isTabScopedPersistenceEnabled;
    const isQuickLoginEnabled = isDevEnvironment;

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
      "开心财税": "1"
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
    const headerAccountText = document.getElementById("headerAccountText");
    const headerAccountSubText = document.getElementById("headerAccountSubText");
    const accountRoleBadge = document.getElementById("accountRoleBadge");
    const operationNoticeStack = document.getElementById("operationNoticeStack");
    const requestLogStatusBadge = document.getElementById("requestLogStatusBadge");
    const requestLogList = document.getElementById("requestLogList");
    const requestLogEmptyState = document.getElementById("requestLogEmptyState");
    const openCreateModalBtn = document.getElementById("openCreateModalBtn");
    const openAnalysisModalBtn = document.getElementById("openAnalysisModalBtn");
    const openRecycleModalBtn = document.getElementById("openRecycleModalBtn");
    const openAccountantModalBtn = document.getElementById("openAccountantModalBtn");
    const createModal = document.getElementById("createModal");
    const createModalCard = createModal.querySelector(".modal-card");
    const recordModalTitle = document.getElementById("recordModalTitle");
    const recordFormHint = document.getElementById("recordFormHint");
    const checkModal = document.getElementById("checkModal");
    const checkModalCard = checkModal.querySelector(".check-modal-card");
    const checkFormHint = document.getElementById("checkFormHint");
    const checkForm = document.getElementById("checkForm");
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
    const completeFeedbackUploader = document.getElementById("completeFeedbackUploader");
    const completeFeedbackImageSelectBtn = document.getElementById("completeFeedbackImageSelectBtn");
    const completeFeedbackImageInput = document.getElementById("completeFeedbackImageInput");
    const completeFeedbackImageCount = document.getElementById("completeFeedbackImageCount");
    const completeFeedbackImageList = document.getElementById("completeFeedbackImageList");
    const completeModalSubmitBtn = document.getElementById("completeModalSubmitBtn");
    const returnPriceModal = document.getElementById("returnPriceModal");
    const returnPriceModalCard = returnPriceModal.querySelector(".return-price-modal-card");
    const returnPriceModalMeta = document.getElementById("returnPriceModalMeta");
    const returnPriceModalContent = document.getElementById("returnPriceModalContent");
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
    const bossSettlementDetailAccountantCount = document.getElementById("bossSettlementDetailAccountantCount");
    const bossSettlementDetailInvoiceProgress = document.getElementById("bossSettlementDetailInvoiceProgress");
    const bossSettlementDetailAmount = document.getElementById("bossSettlementDetailAmount");
    const bossSettlementDetailList = document.getElementById("bossSettlementDetailList");
    const analysisModal = document.getElementById("analysisModal");
    const analysisModalCard = analysisModal.querySelector(".analysis-modal-card");
    const analysisContent = document.getElementById("analysisContent");
    const accountantModal = document.getElementById("accountantModal");
    const accountantModalCard = accountantModal.querySelector(".accountant-modal-card");
    const accountantModalHint = document.getElementById("accountantModalHint");
    const accountantForm = document.getElementById("accountantForm");
    const accountantUsernameInput = document.getElementById("accountantUsernameInput");
    const accountantNameInput = document.getElementById("accountantNameInput");
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
    const recordReturnBtn = document.getElementById("recordReturnBtn");
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
    const emptyState = document.getElementById("emptyState");
    const tableTotalCount = document.getElementById("tableTotalCount");
    const clearFilterBtn = document.getElementById("clearFilterBtn");
    const exportTableBtn = document.getElementById("exportTableBtn");
    const bossSettlementBtn = document.getElementById("bossSettlementBtn");
    const bossSettlementDetailBtn = document.getElementById("bossSettlementDetailBtn");
    const accountantInvoiceUploadBtn = document.getElementById("accountantInvoiceUploadBtn");
    const accountantInvoiceImageInput = document.getElementById("accountantInvoiceImageInput");
    const invoiceSummaryPanel = document.getElementById("invoiceSummaryPanel");
    const invoiceSummaryTitle = document.getElementById("invoiceSummaryTitle");
    const invoiceSummaryMeta = document.getElementById("invoiceSummaryMeta");
    const invoiceSummaryList = document.getElementById("invoiceSummaryList");
    const tableSelectCol = document.getElementById("tableSelectCol");
    const tableSelectHead = document.getElementById("tableSelectHead");
    const tableSelectAllCheckbox = document.getElementById("tableSelectAllCheckbox");
    const sortableHeaders = Array.from(document.querySelectorAll(".sort-btn"));
    const filterMonthBtn = document.getElementById("filterMonthBtn");
    const filterDispatcherBtn = document.getElementById("filterDispatcherBtn");
    const filterAccountantBtn = document.getElementById("filterAccountantBtn");
    const filterPlatformBtn = document.getElementById("filterPlatformBtn");
    const filterShopBtn = document.getElementById("filterShopBtn");
    const filterSourceBtn = document.getElementById("filterSourceBtn");
    const filterStatusBtn = document.getElementById("filterStatusBtn");
    const filterSettledBtn = document.getElementById("filterSettledBtn");
    const filterMonthIndicator = document.getElementById("filterMonthIndicator");
    const filterDispatcherIndicator = document.getElementById("filterDispatcherIndicator");
    const filterAccountantIndicator = document.getElementById("filterAccountantIndicator");
    const filterPlatformIndicator = document.getElementById("filterPlatformIndicator");
    const filterShopIndicator = document.getElementById("filterShopIndicator");
    const filterSourceIndicator = document.getElementById("filterSourceIndicator");
    const filterStatusIndicator = document.getElementById("filterStatusIndicator");
    const filterSettledIndicator = document.getElementById("filterSettledIndicator");
    const filterMonthValue = document.getElementById("filterMonthValue");
    const filterDispatcherValue = document.getElementById("filterDispatcherValue");
    const filterAccountantValue = document.getElementById("filterAccountantValue");
    const filterPlatformValue = document.getElementById("filterPlatformValue");
    const filterShopValue = document.getElementById("filterShopValue");
    const filterSourceValue = document.getElementById("filterSourceValue");
    const filterStatusValue = document.getElementById("filterStatusValue");
    const filterSettledValue = document.getElementById("filterSettledValue");
    const filterMonthPopover = document.getElementById("filterMonthPopover");
    const filterDispatcherPopover = document.getElementById("filterDispatcherPopover");
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

    let currentAccount = "";
    let currentAccountRole = "";
    let currentAccountDisplayName = "";
    let currentAccountRealName = "";
    let currentAccountPhone = "";
    let currentSessionToken = "";
    let records = [];
    let accountants = [];
    let recycleBinRecords = [];
    let accountantOperationLogs = [];
    let hasFetchedRecords = false;
    let refreshTimer = null;
    let refreshInFlightPromise = null;
    let lastRefreshStartedAt = 0;
    let settlementPriceAutoFilled = false;
    let accountantPickerOptions = [];
    let accountantPickerOrderCountMap = new Map();
    let sourcePickerOptions = [...SOURCE_OPTIONS];
    let platformShopPickerOptions = [...PLATFORM_SHOP_OPTIONS];
    let currentOperationNoticeLogId = "";
    let dispatcherOperationNoticeItem = null;
    let pendingAccountantNoticeItems = [];
    let operationNoticeDismissed = false;
    let dismissedOperationNoticeLogId = "";
    let accountantKnownRecordIds = new Set();
    let accountantKnownRecordIdsInitialized = false;
    let highlightedUpdatedRecordIds = new Set();
    let dismissedUpdatedRecordSignatures = {};
    let hasDispatcherFilterPreference = false;
    let isSidebarCollapsed = false;
    let savedLoginEntries = [];
    let highlightedAccountantUsername = "";
    let pendingConfirmResolve = null;
    let editingAccountantUsername = "";
    let accountantEditMode = "admin";
    let recentBossSettlementRecordIds = [];
    let completeFeedbackImageItems = [];
    let completeModalMode = "edit";
    let devTodoItems = [];
    let selectedBossRecordIds = new Set();
    let isBossSettlementSubmitting = false;
    let isInvoiceUploadSubmitting = false;
    const sortState = {
      key: "date",
      direction: "desc"
    };
    const filterState = {
      month: "",
      dateStart: "",
      dateEnd: "",
      dispatcher: "",
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
          const createdAtTime = createdAtInput ? new Date(createdAtInput).getTime() : Number.NaN;
          const createdAt = Number.isFinite(createdAtTime)
            ? new Date(createdAtTime).toISOString()
            : new Date().toISOString();
          return { id, text, createdAt };
        })
        .filter(Boolean)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    }

    function getLockedDispatcherFilterValue() {
      if (!isDispatcherLogin()) return "";
      return getCurrentDispatcherTag();
    }

    function syncDispatcherFilterByLogin(options = {}) {
      const { force = false } = options;
      const lockedDispatcher = getLockedDispatcherFilterValue();
      if (!lockedDispatcher) return;
      if (!force && hasDispatcherFilterPreference) return;
      if (!force && filterState.dispatcher) return;
      filterState.dispatcher = lockedDispatcher;
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

    function getSortedAccountantNames(sourceNames) {
      return Array.from(
        new Set(sourceNames.map((name) => String(name || "").trim()).filter(Boolean))
      ).sort((left, right) => left.localeCompare(right, "zh-CN", { numeric: true, sensitivity: "base" }));
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
      return "会计手机号";
    }

    function getDispatcherAccountDisplayName(accountNameRaw) {
      const accountName = String(accountNameRaw || "").trim();
      const normalizedAccount = String(resolveLoginAccountInput(accountNameRaw) || accountName || "").trim().toLowerCase();
      if (normalizedAccount && DISPATCHER_ACCOUNT_DISPLAY_NAME[normalizedAccount]) {
        return DISPATCHER_ACCOUNT_DISPLAY_NAME[normalizedAccount];
      }
      const dispatcherTag = getDispatcherTagForAccount(accountNameRaw);
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
          const itemButton = document.createElement("button");
          itemButton.type = "button";
          itemButton.className = "saved-login-item";
          itemButton.dataset.savedLoginKey = getSavedLoginEntryKey(normalized.account);

          const main = document.createElement("span");
          main.className = "saved-login-item-main";

          const name = document.createElement("span");
          name.className = "saved-login-item-name";
          name.textContent = getSavedLoginDisplayName(normalized.account, normalized.role);

          main.appendChild(name);
          itemButton.appendChild(main);
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
        return `该数据当前状态是${getRecordWorkflowStatusLabelByKey("settled")}。`;
      }
      if (state === "returned") {
        return "该数据已退单。";
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
      if (!isBossLogin()) {
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
        || normalized === "已上传/待打款";
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
      if (statusKey === "uploaded") return "已上传/待打款";
      if (statusKey === "settled") return "已结算/待上传";
      if (statusKey === "completed") return "已完成/待结算";
      if (statusKey === "checked") return "已确认/待完成";
      if (statusKey === "returned") return "已退单";
      return "已接待/待确认";
    }

    function normalizeSettlementWorkflowStatus(value) {
      const status = String(value || "").trim().toLowerCase();
      if (!status) return "";
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
      if (isRecordInvoiceUploaded(record)) return getRecordWorkflowStatusLabelByKey("uploaded");
      if (isRecordSettled(record)) return getRecordWorkflowStatusLabelByKey("settled");
      return isRecordCompleted(record) ? getRecordWorkflowStatusLabelByKey("completed") : "未结算";
    }

    function isRecordCompleted(record) {
      return String(record?.checkStatus || "").trim().toLowerCase() === "completed";
    }

    function getRecordWorkflowStatusKey(record) {
      const checkStatus = String(record?.checkStatus || "").trim().toLowerCase();
      if (checkStatus === "returned") return "returned";
      if (checkStatus === "completed") {
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

    function getRecordSettlementChipClass(record) {
      if (isRecordInvoiceUploaded(record)) return "uploaded";
      if (isRecordSettled(record)) return "settled";
      return "pending";
    }

    function getAccountantInvoiceUploadTargetRecords(sourceRecords = records) {
      if (!isAccountantLogin()) return [];
      return (Array.isArray(sourceRecords) ? sourceRecords : []).filter((item) => {
        const checkStatus = String(item?.checkStatus || "").trim().toLowerCase();
        return isRecordSettled(item) && !isRecordInvoiceUploaded(item) && checkStatus === "completed";
      });
    }

    function getBossSettlementRecordState(record) {
      if (isRecordSettled(record)) return "settled";
      const checkStatus = String(record?.checkStatus || "").trim().toLowerCase();
      if (checkStatus === "returned") return "returned";
      if (checkStatus !== "completed") return "not_completed";
      return "ready";
    }

    function getBossSettlementSelectionSummary(sourceRecords = records) {
      const selectedRecords = getSelectedBossRecords(sourceRecords);
      const readySelectedRecords = selectedRecords.filter((item) => getBossSettlementRecordState(item) === "ready");
      const alreadySettledCount = selectedRecords.filter((item) => getBossSettlementRecordState(item) === "settled").length;
      const returnedCount = selectedRecords.filter((item) => getBossSettlementRecordState(item) === "returned").length;
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
        skippedCount: alreadySettledCount + returnedCount,
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

    function getRecentBossSettlementRecords(sourceRecords = records) {
      if (!recentBossSettlementRecordIds.length) return [];
      const recordMap = new Map(
        (Array.isArray(sourceRecords) ? sourceRecords : []).map((item) => [String(item?.id || "").trim(), item])
      );
      return recentBossSettlementRecordIds
        .map((recordId) => recordMap.get(recordId) || null)
        .filter(Boolean);
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
          addCandidate(`开心财税${dispatcherTag}`);
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

    function getAllowedLoginAccounts() {
      const set = new Set([...ALLOWED_ACCOUNTS, ...BOSS_LOGIN_ACCOUNTS]);
      accountants.forEach((item) => {
        const loginName = String(item.username || item.name || "").trim();
        const phone = String(item.phone || "").trim();
        if (loginName) set.add(loginName);
        if (phone) set.add(phone);
      });
      return set;
    }

    function isValidLoginAccount(accountName) {
      const normalized = String(resolveLoginAccountInput(accountName) || accountName || "").trim();
      if (!normalized) return false;
      return getAllowedLoginAccounts().has(normalized)
        || getAllowedLoginAccounts().has(getAccountantLoginIdentifier(normalized));
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

    function isDispatcherPasswordValid(accountName, passwordInput) {
      if (!isDispatcherLogin(accountName)) return false;
      const password = String(passwordInput || "").trim();
      return password === DISPATCHER_LOGIN_PASSWORD;
    }

    function isAccountantPasswordValid(accountName, passwordInput) {
      const profile = getAccountantProfileByLoginName(accountName);
      if (!profile) return false;
      const password = String(passwordInput || "").trim();
      return Boolean(password) && password === String(profile.loginPassword || "").trim();
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
      currentAccount = "";
      currentAccountRole = "";
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

    function getTodayISODate() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    function formatDateTimeLocalInputValue(rawDateTime = new Date()) {
      const source = rawDateTime instanceof Date ? rawDateTime : String(rawDateTime || "").trim();
      const date = rawDateTime instanceof Date ? rawDateTime : new Date(source);
      if (Number.isNaN(date.getTime())) {
        return formatDateTimeLocalInputValue(new Date());
      }
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
    }

    function formatDateInputValue(rawDate = new Date()) {
      const source = rawDate instanceof Date ? rawDate : String(rawDate || "").trim();
      const date = rawDate instanceof Date ? rawDate : new Date(source);
      if (Number.isNaN(date.getTime())) {
        return getTodayISODate();
      }
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    function generateCompleteFeedbackImageId() {
      return `fbimg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizeCompleteFeedbackImageItem(rawItem, index = 0) {
      if (!rawItem) return null;
      const fallbackName = `截图${index + 1}`;
      if (typeof rawItem === "string") {
        const dataUrl = rawItem.trim();
        if (!dataUrl.startsWith("data:image/")) return null;
        return {
          id: generateCompleteFeedbackImageId(),
          name: fallbackName,
          previewUrl: dataUrl,
          dataUrl,
          url: "",
          fileName: ""
        };
      }
      if (typeof rawItem !== "object") return null;
      const dataUrl = String(rawItem.dataUrl || "").trim();
      const url = String(rawItem.url || "").trim();
      const previewUrl = dataUrl || url;
      if (!previewUrl) return null;
      return {
        id: String(rawItem.id || "").trim() || generateCompleteFeedbackImageId(),
        name: String(rawItem.name || "").trim() || fallbackName,
        previewUrl,
        dataUrl,
        url,
        fileName: String(rawItem.fileName || "").trim()
      };
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
        completeModalTitle.textContent = isViewMode ? "查看反馈" : "完成数据";
      }
      if (completeForm) {
        completeForm.classList.toggle("readonly", isViewMode);
      }
      if (completeTimeInput) {
        completeTimeInput.readOnly = isViewMode;
      }
      if (completeCustomerFeedbackInput) {
        completeCustomerFeedbackInput.readOnly = isViewMode;
      }
      if (completeFeedbackUploader) {
        completeFeedbackUploader.classList.toggle("readonly", isViewMode);
        completeFeedbackUploader.tabIndex = isViewMode ? -1 : 0;
        completeFeedbackUploader.setAttribute("role", isViewMode ? "group" : "button");
        completeFeedbackUploader.setAttribute("aria-disabled", isViewMode ? "true" : "false");
        completeFeedbackUploader.setAttribute("aria-label", isViewMode ? "客户反馈截图" : "添加客户反馈截图");
      }
      if (completeFeedbackImageInput) {
        completeFeedbackImageInput.disabled = isViewMode;
      }
      if (completeFeedbackImageSelectBtn) {
        completeFeedbackImageSelectBtn.hidden = isViewMode;
        completeFeedbackImageSelectBtn.disabled = isViewMode;
      }
      if (completeModalSubmitBtn) {
        completeModalSubmitBtn.hidden = isViewMode;
      }
      renderCompleteFeedbackImageList();
    }

    function renderCompleteFeedbackImageList() {
      if (!completeFeedbackImageList || !completeFeedbackImageCount || !completeFeedbackUploader) return;
      const items = Array.isArray(completeFeedbackImageItems) ? completeFeedbackImageItems : [];
      const isViewMode = isCompleteModalViewMode();
      completeFeedbackImageList.innerHTML = "";
      completeFeedbackImageCount.textContent = `${items.length} 张`;
      completeFeedbackUploader.classList.toggle("has-images", Boolean(items.length));
      completeFeedbackUploader.classList.toggle("readonly", isViewMode);

      items.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "feedback-image-card";

        const image = document.createElement("img");
        image.className = "feedback-image-preview";
        image.src = item.previewUrl;
        image.alt = `客户反馈截图 ${index + 1}`;

        const footer = document.createElement("div");
        footer.className = "feedback-image-card-footer";

        const name = document.createElement("span");
        name.className = "feedback-image-name";
        name.textContent = item.name || `截图${index + 1}`;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "feedback-image-remove-btn";
        removeBtn.dataset.feedbackImageId = String(item.id || "");
        removeBtn.textContent = "移除";

        footer.appendChild(name);
        if (!isViewMode) {
          footer.appendChild(removeBtn);
        }
        card.appendChild(image);
        card.appendChild(footer);
        completeFeedbackImageList.appendChild(card);
      });
    }

    function setCompleteFeedbackImageItems(items) {
      const source = Array.isArray(items) ? items : [];
      completeFeedbackImageItems = source
        .map((item, index) => normalizeCompleteFeedbackImageItem(item, index))
        .filter(Boolean)
        .slice(0, COMPLETE_FEEDBACK_IMAGE_MAX_COUNT);
      renderCompleteFeedbackImageList();
    }

    function removeCompleteFeedbackImageItem(imageId) {
      const targetId = String(imageId || "").trim();
      if (!targetId) return;
      completeFeedbackImageItems = completeFeedbackImageItems.filter((item) => item.id !== targetId);
      renderCompleteFeedbackImageList();
    }

    function resetCompleteFeedbackImageItems() {
      if (completeFeedbackImageInput) {
        completeFeedbackImageInput.value = "";
      }
      if (completeFeedbackUploader) {
        completeFeedbackUploader.classList.remove("dragging");
      }
      setCompleteFeedbackImageItems([]);
    }

    function setCompleteFeedbackUploaderDragging(isDragging) {
      if (!completeFeedbackUploader) return;
      completeFeedbackUploader.classList.toggle("dragging", Boolean(isDragging));
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("读取图片失败"));
        reader.readAsDataURL(file);
      });
    }

    async function appendCompleteFeedbackFiles(fileList) {
      const sourceFiles = Array.from(fileList || []);
      if (!sourceFiles.length) return;
      const imageFiles = sourceFiles.filter((file) => String(file?.type || "").toLowerCase().startsWith("image/"));
      if (!imageFiles.length) {
        showInlineFormError({
          form: completeForm,
          hintSetter: setCompleteFormHint,
          target: completeFeedbackUploader,
          message: "只支持图片文件。"
        });
        return;
      }
      if (imageFiles.length !== sourceFiles.length) {
        setCompleteFormHint("已跳过非图片文件。", "error");
      }
      const availableCount = COMPLETE_FEEDBACK_IMAGE_MAX_COUNT - completeFeedbackImageItems.length;
      if (availableCount <= 0) {
        showInlineFormError({
          form: completeForm,
          hintSetter: setCompleteFormHint,
          target: completeFeedbackUploader,
          message: `最多添加 ${COMPLETE_FEEDBACK_IMAGE_MAX_COUNT} 张截图。`
        });
        return;
      }
      const acceptedFiles = imageFiles.slice(0, availableCount);
      if (imageFiles.length > availableCount) {
        setCompleteFormHint(`最多添加 ${COMPLETE_FEEDBACK_IMAGE_MAX_COUNT} 张截图。`, "error");
      }
      const nextItems = [...completeFeedbackImageItems];
      for (const file of acceptedFiles) {
        if (Number(file.size || 0) > COMPLETE_FEEDBACK_IMAGE_MAX_SIZE_BYTES) {
          setCompleteFormHint(`图片“${file.name || "未命名图片"}”超过 5MB。`, "error");
          continue;
        }
        const dataUrl = await readFileAsDataUrl(file);
        const nextItem = normalizeCompleteFeedbackImageItem({
          id: generateCompleteFeedbackImageId(),
          name: String(file.name || "").trim(),
          dataUrl
        }, nextItems.length);
        if (nextItem) {
          nextItems.push(nextItem);
        }
      }
      setCompleteFeedbackImageItems(nextItems);
      clearInlineFieldError(completeFeedbackUploader);
      if (!completeForm.querySelector(".field-validation-group-error")) {
        setCompleteFormHint("", "idle");
      }
    }

    function getCompleteFeedbackImagePayload() {
      return completeFeedbackImageItems.map((item) => {
        const payload = {
          id: String(item.id || "").trim(),
          name: String(item.name || "").trim()
        };
        if (item.dataUrl) {
          payload.dataUrl = item.dataUrl;
        }
        if (item.url) {
          payload.url = item.url;
        }
        if (item.fileName) {
          payload.fileName = item.fileName;
        }
        return payload;
      });
    }

    function toISOStringFromDateTimeLocal(rawValue) {
      const source = String(rawValue || "").trim();
      if (!source) return "";
      const normalizedValue = source.length === 16 ? `${source}:00` : source;
      const date = new Date(normalizedValue);
      if (Number.isNaN(date.getTime())) return "";
      return date.toISOString();
    }

    function toMoney(value) {
      const num = Number(value);
      if (Number.isNaN(num)) return "";
      return num.toFixed(2);
    }

    function getSettlementTaxAmount(value) {
      const income = Number(value);
      if (!Number.isFinite(income) || income <= 0) return 0;
      if (income <= 4000) {
        return Math.max(income - 800, 0) * 0.2;
      }
      return income * 0.8 * 0.2;
    }

    function getPremiumValue(source) {
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

    function getReturnedPriceSnapshot(record) {
      const source = record && typeof record === "object" ? record.returnedPriceSnapshot : null;
      if (!source || typeof source !== "object") return null;
      const paymentPrice = Number(source.paymentPrice);
      const totalPrice = Number(source.totalPrice);
      const settlementPrice = Number(source.settlementPrice);
      const premiumInput = Number(source.premiumPrice);
      const premiumPrice = Number.isFinite(premiumInput)
        ? premiumInput
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

    function formatDateTimeDisplay(rawDateTime) {
      const source = String(rawDateTime || "").trim();
      const timestamp = Date.parse(source);
      if (Number.isNaN(timestamp)) return source;
      const date = new Date(timestamp);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
    }

    function formatTimeDisplay(rawDateTime) {
      const source = String(rawDateTime || "").trim();
      const timestamp = Date.parse(source);
      if (Number.isNaN(timestamp)) return source;
      const date = new Date(timestamp);
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    }

    function setHintState(node, className, text, state = "idle") {
      if (!node) return;
      const normalizedText = String(text || "").trim();
      node.textContent = normalizedText;
      node.className = `${className} ${state}`;
      node.hidden = !normalizedText;
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

    function setAccountantModalHint(text, state = "idle") {
      setHintState(accountantModalHint, "login-request-hint form-request-hint", text, state);
    }

    function setRecycleModalHint(text, state = "idle") {
      setHintState(recycleModalHint, "login-request-hint form-request-hint", text, state);
    }

    function setChangePasswordHint(text, state = "idle") {
      setHintState(changePasswordHint, "login-request-hint accountant-register-hint", text, state);
    }

    function setRequestLogStatusBadge(text, state = "idle") {
      if (!requestLogStatusBadge) return;
      requestLogStatusBadge.textContent = text;
      requestLogStatusBadge.className = `request-log-status-badge ${state}`;
    }

    function getInlineValidationGroup(target) {
      if (!(target instanceof Element)) return null;
      return target.closest(
        ".detail-item, .meta-item, .price-item, .field-feedback-time, .field-feedback-text, .field-feedback-images, .field, .accountant-picker, .feedback-image-uploader"
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
      if (messageIncludesAnyKeyword(message, ["结算价"])) {
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
      if (messageIncludesAnyKeyword(message, ["客户反馈"])) {
        return completeCustomerFeedbackInput;
      }
      if (messageIncludesAnyKeyword(message, ["截图", "图片"])) {
        return completeFeedbackUploader;
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

    function getOperationNoticePendingStorageKey(accountName = currentAccount) {
      const normalizedAccount = String(accountName || "").trim();
      if (!normalizedAccount) return "";
      return `${STORAGE_KEY_OPERATION_NOTICE_PENDING_PREFIX}_${encodeURIComponent(normalizedAccount)}`;
    }

    function normalizePendingAccountantNotice(raw) {
      if (!raw || typeof raw !== "object") return null;
      const id = String(raw.id || "").trim();
      if (!id) return null;
      const rawUnitPrice = Number(
        raw.unitPrice !== undefined && raw.unitPrice !== null && raw.unitPrice !== ""
          ? raw.unitPrice
          : (raw.settlementPrice !== undefined && raw.settlementPrice !== null && raw.settlementPrice !== ""
            ? raw.settlementPrice
            : raw.totalPrice)
      );
      const unitPrice = Number.isFinite(rawUnitPrice) ? rawUnitPrice : Number.NaN;
      return {
        type: "accountant_assignment",
        id,
        date: String(raw.date || "").trim(),
        dispatcher: normalizeDispatcherTag(raw.dispatcher),
        accountant: String(raw.accountant || "").trim(),
        customer: String(raw.customer || "").trim(),
        summary: String(raw.summary || "").trim(),
        unitPrice
      };
    }

    function savePendingAccountantNotices(items) {
      const key = getOperationNoticePendingStorageKey();
      if (!key) return;
      const safeItems = Array.isArray(items)
        ? items.map((item) => normalizePendingAccountantNotice(item)).filter(Boolean)
        : [];
      setPersistentStateItem(key, JSON.stringify(safeItems));
    }

    function loadPendingAccountantNotices() {
      const key = getOperationNoticePendingStorageKey();
      if (!key) return [];
      const raw = String(getPersistentStateItem(key) || "").trim();
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        const source = Array.isArray(parsed) ? parsed : [parsed];
        const noticeById = new Map();
        source.forEach((item) => {
          const normalized = normalizePendingAccountantNotice(item);
          if (!normalized) return;
          noticeById.set(normalized.id, normalized);
        });
        return Array.from(noticeById.values());
      } catch (error) {
        return [];
      }
    }

    function clearPendingAccountantNotices() {
      const key = getOperationNoticePendingStorageKey();
      if (!key) return;
      removePersistentStateItem(key);
    }

    function restorePendingOperationNotice() {
      if (!isAccountantLogin()) return;
      pendingAccountantNoticeItems = loadPendingAccountantNotices();
      renderOperationNoticeStack();
    }

    function resetAccountantAssignmentNoticeState() {
      accountantKnownRecordIds = new Set();
      accountantKnownRecordIdsInitialized = false;
      pendingAccountantNoticeItems = [];
      dispatcherOperationNoticeItem = null;
    }

    function hideOperationNotice(options = {}) {
      if (!operationNoticeStack) return;
      const { keepCurrentId = false } = options;
      operationNoticeStack.hidden = true;
      operationNoticeStack.innerHTML = "";
      if (!keepCurrentId) {
        currentOperationNoticeLogId = "";
      }
    }

    function buildDispatcherNoticeItem(entry) {
      if (!entry || typeof entry !== "object") return null;
      const logId = String(entry?.logId || "").trim();
      if (!logId) return null;
      const actionKeyRaw = String(entry?.actionKey || "").trim().toLowerCase();
      const actionKey = actionKeyRaw === "completed" || actionKeyRaw === "returned" ? actionKeyRaw : "checked";
      const actionLabel = actionKey === "completed" ? "完成" : (actionKey === "returned" ? "退单" : "确认");
      const operator = String(entry?.operatedBy || "").trim() || "未知会计";
      const dispatcher = normalizeDispatcherTag(entry?.dispatcher);
      const accountantName = String(entry?.accountant || "").trim() || "未填会计";
      const customerName = String(entry?.customer || "").trim() || "未填客户";
      const summaryText = String(entry?.summary || "").trim();
      const parts = [
        `${formatDateDisplay(entry?.date)} ${formatTimeDisplay(entry?.operatedAt)}`,
        `${operator} 已${actionLabel}`,
        `会计 ${accountantName}`,
        `客户 ${customerName}`
      ];
      if (!isDispatcherLogin()) {
        parts.splice(2, 0, `接待 ${dispatcher}`);
      }
      if (summaryText) {
        parts.push(`任务简介 ${summaryText}`);
      }
      return {
        key: `dispatcher:${logId}`,
        kind: "dispatcher",
        title: "会计列表有新操作",
        main: parts.join(" | ")
      };
    }

    function buildAccountantNoticeItem(entry) {
      const normalized = normalizePendingAccountantNotice(entry);
      if (!normalized) return null;
      const priceText = Number.isFinite(normalized.unitPrice)
        ? `${toMoney(normalized.unitPrice)}`
        : "--";
      return {
        key: `assign:${normalized.id}`,
        kind: "accountant_assignment",
        title: "有新接待",
        main: `单价：${priceText}元`
      };
    }

    function renderOperationNoticeStack() {
      if (!operationNoticeStack) return;
      let items = [];
      if (!currentAccount) {
        items = [];
      } else if (isAccountantLogin()) {
        items = pendingAccountantNoticeItems
          .map((item) => buildAccountantNoticeItem(item))
          .filter(Boolean);
      } else if (!operationNoticeDismissed && dispatcherOperationNoticeItem) {
        items = [dispatcherOperationNoticeItem];
      }

      if (!items.length) {
        operationNoticeStack.hidden = true;
        operationNoticeStack.innerHTML = "";
        return;
      }

      operationNoticeStack.hidden = false;
      operationNoticeStack.innerHTML = items.map((item) => `
        <div class="operation-notice" data-notice-key="${escapeHtml(item.key)}" data-notice-kind="${escapeHtml(item.kind)}">
          <div class="operation-notice-top">
            <span class="operation-notice-title">${escapeHtml(item.title)}</span>
            <button class="operation-notice-close" type="button" aria-label="关闭提示" data-notice-close="1">×</button>
          </div>
          <div class="operation-notice-main">${escapeHtml(item.main)}</div>
        </div>
      `).join("");
    }

    function showAccountantAssignmentNotice(newRecords) {
      if (!Array.isArray(newRecords) || !newRecords.length) return;
      const pendingById = new Map(
        pendingAccountantNoticeItems
          .map((item) => normalizePendingAccountantNotice(item))
          .filter(Boolean)
          .map((item) => [item.id, item])
      );
      const nextItems = [];
      newRecords.forEach((record) => {
        const normalized = normalizePendingAccountantNotice(record);
        if (!normalized) return;
        if (pendingById.has(normalized.id)) return;
        nextItems.push(normalized);
      });
      if (!nextItems.length) return;
      pendingAccountantNoticeItems = [...nextItems, ...pendingAccountantNoticeItems];
      savePendingAccountantNotices(pendingAccountantNoticeItems);
      renderOperationNoticeStack();
    }

    function syncAccountantAssignmentNotice(nextRecords) {
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
      currentOperationNoticeLogId = `assign:${String(newAssignedRecords[0]?.id || "").trim()}`;
      showAccountantAssignmentNotice(newAssignedRecords);
    }

    function syncOperationNotice(logEntries) {
      if (appPage.classList.contains("accountant-view")) {
        dispatcherOperationNoticeItem = null;
        renderOperationNoticeStack();
        return;
      }
      const scopedLogs = Array.isArray(logEntries) ? logEntries : [];
      if (!scopedLogs.length) {
        dispatcherOperationNoticeItem = null;
        renderOperationNoticeStack();
        return;
      }
      const latest = scopedLogs[0] || null;
      const latestLogId = String(latest?.logId || "").trim();
      if (!latestLogId) {
        dispatcherOperationNoticeItem = null;
        renderOperationNoticeStack();
        return;
      }
      if (dismissedOperationNoticeLogId && dismissedOperationNoticeLogId !== latestLogId) {
        dismissedOperationNoticeLogId = "";
        saveOperationNoticePreference();
      }
      operationNoticeDismissed = Boolean(
        dismissedOperationNoticeLogId && dismissedOperationNoticeLogId === latestLogId
      );
      if (operationNoticeDismissed) {
        dispatcherOperationNoticeItem = null;
        renderOperationNoticeStack();
        return;
      }
      if (currentOperationNoticeLogId !== latestLogId || !dispatcherOperationNoticeItem) {
        currentOperationNoticeLogId = latestLogId;
        operationNoticeDismissed = false;
        dispatcherOperationNoticeItem = buildDispatcherNoticeItem(latest);
        renderOperationNoticeStack();
      }
    }

    function renderRequestLogList() {
      if (!requestLogList || !requestLogEmptyState) return;
      const shouldSyncDispatcherNotice = !isAccountantLogin();
      const scopedLogs = getVisibleAccountantOperationLogs().slice(0, 18);
      if (!scopedLogs.length) {
        requestLogList.innerHTML = "";
        requestLogEmptyState.hidden = false;
        setRequestLogStatusBadge("等待会计操作", "idle");
        if (shouldSyncDispatcherNotice) {
          syncOperationNotice(scopedLogs);
        }
        return;
      }

      requestLogEmptyState.hidden = true;
      requestLogList.innerHTML = scopedLogs
        .map((entry) => {
          const actionKeyRaw = String(entry?.actionKey || "").trim().toLowerCase();
          const actionKey = actionKeyRaw === "completed" || actionKeyRaw === "returned" ? actionKeyRaw : "checked";
          const actionLabel = actionKey === "completed" ? "完成" : (actionKey === "returned" ? "退单" : "确认");
          const operator = String(entry?.operatedBy || "").trim() || "未知会计";
          const dispatcher = normalizeDispatcherTag(entry?.dispatcher);
          const accountantName = String(entry?.accountant || "").trim() || "未填会计";
          const customerName = String(entry?.customer || "").trim() || "未填客户";
          const detailParts = [
            formatDateDisplay(entry?.date),
            accountantName,
            customerName
          ];
          if (!isDispatcherLogin()) {
            detailParts.splice(1, 0, dispatcher);
          }
          const detailText = detailParts.filter(Boolean).join(" · ");
          return `
            <div class="request-log-item ${actionKey === "completed" ? "ok" : (actionKey === "returned" ? "error" : "")}">
              <div class="request-log-item-top">
                <span class="request-log-time">${escapeHtml(formatTimeDisplay(entry?.operatedAt))}</span>
                <span class="request-log-method">${escapeHtml(actionLabel)}</span>
                <span class="request-log-endpoint" title="${escapeHtml(operator)}">${escapeHtml(operator)}</span>
              </div>
              <div class="request-log-item-bottom">
                <span class="request-log-status">${escapeHtml(detailText)}</span>
              </div>
            </div>
          `;
        })
        .join("");
      setRequestLogStatusBadge("会计列表操作", "ok");
      if (shouldSyncDispatcherNotice) {
        syncOperationNotice(scopedLogs);
      }
    }
