// Core: constants, DOM refs, runtime state, account/role helpers, notice rendering.
    const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:3000" : "";
    const API_ENDPOINT_RECORDS = `${API_BASE}/api/records`;
    const API_ENDPOINT_ACCOUNTANTS = `${API_BASE}/api/accountants`;
    const API_ENDPOINT_RECYCLE_BIN = `${API_BASE}/api/recycle-bin`;
    const API_ENDPOINT_ACCOUNTANT_OPERATION_LOGS = `${API_BASE}/api/accountant-operation-logs`;
    const API_ENDPOINT_AUTH_LOGIN = `${API_BASE}/api/auth/login`;
    const API_ENDPOINT_AUTH_PASSWORD = `${API_BASE}/api/auth/password`;
    const STORAGE_KEY_ACCOUNT = "dispatch_current_account_v1";
    const STORAGE_KEY_ACCOUNT_ROLE = "dispatch_current_account_role_v1";
    const STORAGE_KEY_SESSION_TOKEN = "dispatch_session_token_v1";
    const STORAGE_KEY_SAVED_LOGINS = "dispatch_saved_logins_v1";
    const STORAGE_KEY_VIEW_STATE = "dispatch_view_state_v1";
    const STORAGE_KEY_OPERATION_NOTICE_DISMISSED_PREFIX = "dispatch_operation_notice_dismissed_v2";
    const STORAGE_KEY_OPERATION_NOTICE_DISMISSED_LEGACY = "dispatch_operation_notice_dismissed_v1";
    const STORAGE_KEY_OPERATION_NOTICE_PENDING_PREFIX = "dispatch_operation_notice_pending_v1";
    const STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX = "dispatch_updated_row_dismissed_v1";
    const STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX = "dispatch_updated_row_highlight_v1";
    const ALLOWED_ACCOUNTS = ["1", "a", "c", "e", "k"];
    const DISPATCHER_LOGIN_PASSWORD = "11";
    const BOSS_LOGIN_ACCOUNT = "boss";
    const COMPLETE_FEEDBACK_IMAGE_MAX_COUNT = 8;
    const COMPLETE_FEEDBACK_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
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
      { label: "淘宝-全账通", platform: "淘宝", shopName: "全账通" }
    ];
    const ANALYSIS_BUTTON_QUERY_FLAG = "zem";
    const isAnalysisButtonEnabled = String(window.location.search || "")
      .toLowerCase()
      .includes(ANALYSIS_BUTTON_QUERY_FLAG);
    const DISPATCHER_TAGS = ["1", "A", "C", "E", "K"];
    const ACCOUNT_TO_DISPATCHER_TAG = {
      "1": "1",
      "a": "A",
      "c": "C",
      "e": "E",
      "k": "K"
    };
    const DISPATCHER_LOGIN_CODE_TO_ACCOUNT = {
      "1": "1",
      "a": "a",
      "c": "c",
      "e": "e",
      "k": "k",
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
    const loginCodeInput = document.getElementById("loginCodeInput");
    const loginPasswordInput = document.getElementById("loginPasswordInput");
    const loginRequestHint = document.getElementById("loginRequestHint");
    const enterBtn = document.getElementById("enterBtn");
    const savedLoginSection = document.getElementById("savedLoginSection");
    const savedLoginList = document.getElementById("savedLoginList");
    const switchAccountBtn = document.getElementById("switchAccountBtn");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
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
    const checkModal = document.getElementById("checkModal");
    const checkModalCard = checkModal.querySelector(".check-modal-card");
    const checkForm = document.getElementById("checkForm");
    const checkRecordIdInput = document.getElementById("checkRecordId");
    const checkCustomerInput = document.getElementById("checkCustomer");
    const checkSummaryInput = document.getElementById("checkSummary");
    const completeModal = document.getElementById("completeModal");
    const completeModalCard = completeModal.querySelector(".complete-modal-card");
    const completeModalTitle = document.getElementById("completeModalTitle");
    const completeForm = document.getElementById("completeForm");
    const completeRecordIdInput = document.getElementById("completeRecordId");
    const completeTimeInput = document.getElementById("completeTime");
    const completeCustomerFeedbackInput = document.getElementById("customerFeedback");
    const completeFeedbackUploader = document.getElementById("completeFeedbackUploader");
    const completeFeedbackImageSelectBtn = document.getElementById("completeFeedbackImageSelectBtn");
    const completeFeedbackImageInput = document.getElementById("completeFeedbackImageInput");
    const completeFeedbackImageCount = document.getElementById("completeFeedbackImageCount");
    const completeFeedbackDropHint = document.getElementById("completeFeedbackDropHint");
    const completeFeedbackImageList = document.getElementById("completeFeedbackImageList");
    const completeModalCloseBtn = document.getElementById("completeModalCloseBtn");
    const completeModalSubmitBtn = document.getElementById("completeModalSubmitBtn");
    const analysisModal = document.getElementById("analysisModal");
    const analysisModalCard = analysisModal.querySelector(".analysis-modal-card");
    const analysisContent = document.getElementById("analysisContent");
    const accountantModal = document.getElementById("accountantModal");
    const accountantModalCard = accountantModal.querySelector(".accountant-modal-card");
    const accountantForm = document.getElementById("accountantForm");
    const accountantUsernameInput = document.getElementById("accountantUsernameInput");
    const accountantNameInput = document.getElementById("accountantNameInput");
    const accountantList = document.getElementById("accountantList");
    const accountantEmptyState = document.getElementById("accountantEmptyState");
    const recycleModal = document.getElementById("recycleModal");
    const recycleModalCard = recycleModal.querySelector(".recycle-modal-card");
    const recycleTableBody = document.getElementById("recycleTableBody");
    const recycleEmptyState = document.getElementById("recycleEmptyState");
    const accountantLogList = document.getElementById("accountantLogList");
    const accountantLogEmptyState = document.getElementById("accountantLogEmptyState");

    const dateInput = document.getElementById("date");
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
    const sortableHeaders = Array.from(document.querySelectorAll(".sort-btn"));
    const filterMonthBtn = document.getElementById("filterMonthBtn");
    const filterDispatcherBtn = document.getElementById("filterDispatcherBtn");
    const filterAccountantBtn = document.getElementById("filterAccountantBtn");
    const filterPlatformBtn = document.getElementById("filterPlatformBtn");
    const filterShopBtn = document.getElementById("filterShopBtn");
    const filterSourceBtn = document.getElementById("filterSourceBtn");
    const filterStatusBtn = document.getElementById("filterStatusBtn");
    const filterMonthIndicator = document.getElementById("filterMonthIndicator");
    const filterDispatcherIndicator = document.getElementById("filterDispatcherIndicator");
    const filterAccountantIndicator = document.getElementById("filterAccountantIndicator");
    const filterPlatformIndicator = document.getElementById("filterPlatformIndicator");
    const filterShopIndicator = document.getElementById("filterShopIndicator");
    const filterSourceIndicator = document.getElementById("filterSourceIndicator");
    const filterStatusIndicator = document.getElementById("filterStatusIndicator");
    const filterMonthValue = document.getElementById("filterMonthValue");
    const filterDispatcherValue = document.getElementById("filterDispatcherValue");
    const filterAccountantValue = document.getElementById("filterAccountantValue");
    const filterPlatformValue = document.getElementById("filterPlatformValue");
    const filterShopValue = document.getElementById("filterShopValue");
    const filterSourceValue = document.getElementById("filterSourceValue");
    const filterStatusValue = document.getElementById("filterStatusValue");
    const filterMonthPopover = document.getElementById("filterMonthPopover");
    const filterDispatcherPopover = document.getElementById("filterDispatcherPopover");
    const filterAccountantPopover = document.getElementById("filterAccountantPopover");
    const filterPlatformPopover = document.getElementById("filterPlatformPopover");
    const filterShopPopover = document.getElementById("filterShopPopover");
    const filterSourcePopover = document.getElementById("filterSourcePopover");
    const filterStatusPopover = document.getElementById("filterStatusPopover");
    const filterMonthList = document.getElementById("filterMonthList");
    const filterDispatcherList = document.getElementById("filterDispatcherList");
    const filterAccountantList = document.getElementById("filterAccountantList");
    const filterPlatformList = document.getElementById("filterPlatformList");
    const filterShopList = document.getElementById("filterShopList");
    const filterSourceList = document.getElementById("filterSourceList");
    const filterStatusList = document.getElementById("filterStatusList");

    let currentAccount = "";
    let currentAccountRole = "";
    let currentSessionToken = "";
    let records = [];
    let accountants = [];
    let recycleBinRecords = [];
    let accountantOperationLogs = [];
    let hasFetchedRecords = false;
    let refreshTimer = null;
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
    let completeFeedbackImageItems = [];
    let completeModalMode = "edit";
    const sortState = {
      key: "date",
      direction: "desc"
    };
    const filterState = {
      month: "",
      dispatcher: "",
      accountant: "",
      platform: "",
      shopName: "",
      source: "",
      status: ""
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

    function normalizeAccountantProfile(rawProfile) {
      if (typeof rawProfile === "string") {
        const normalizedName = String(rawProfile || "").trim();
        if (!normalizedName) return null;
        return {
          username: normalizedName,
          displayName: normalizedName,
          name: normalizedName,
          loginPassword: ""
        };
      }
      if (!rawProfile || typeof rawProfile !== "object") return null;
      const username = String(
        rawProfile.username || rawProfile.loginName || rawProfile.account || rawProfile.name || ""
      ).trim();
      const displayName = String(
        rawProfile.displayName || rawProfile.chineseName || rawProfile.cnName || rawProfile.name || rawProfile.username || ""
      ).trim();
      if (!username || !displayName) return null;
      const loginPassword = String(rawProfile.loginPassword || rawProfile.password || "").trim();
      return {
        username,
        displayName,
        name: displayName,
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
      return accountants.find((item) => String(item.username || item.name || "").trim() === loginName) || null;
    }

    function getCurrentAccountantLoginProfile() {
      return getAccountantProfileByLoginName(currentAccount);
    }

    function getAccountantDisplayNameByLoginName(loginNameRaw) {
      const profile = getAccountantProfileByLoginName(loginNameRaw);
      if (!profile) return String(loginNameRaw || "").trim();
      return String(profile.displayName || profile.name || profile.username || "").trim();
    }

    function getCurrentAccountantDisplayName() {
      return getAccountantDisplayNameByLoginName(currentAccount);
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
      if (String(resolveLoginAccountInput(accountName) || "").trim().toLowerCase() === BOSS_LOGIN_ACCOUNT) {
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
      const updatedAt = Number(rawEntry.updatedAt);
      return {
        account,
        password,
        role: normalizedRole,
        updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : Date.now()
      };
    }

    function getSavedLoginEntryKey(accountNameRaw) {
      return String(resolveLoginAccountInput(accountNameRaw) || accountNameRaw || "").trim().toLowerCase();
    }

    function getSavedLoginRoleKey(accountNameRaw, roleRaw) {
      const role = normalizeLoginRole(roleRaw) || inferRoleByAccountName(accountNameRaw);
      if (role === "dispatcher" || role === "accountant" || role === "boss") return role;
      return "accountant";
    }

    function getSavedLoginGroupTitle(roleKey) {
      if (roleKey === "dispatcher") return "派单账号";
      if (roleKey === "boss") return "Boss账号";
      return "会计账号";
    }

    function getSavedLoginDisplayName(accountNameRaw, roleRaw) {
      const accountName = String(accountNameRaw || "").trim();
      const roleKey = getSavedLoginRoleKey(accountNameRaw, roleRaw);
      if (roleKey === "dispatcher") {
        const dispatcherTag = getDispatcherTagForAccount(accountNameRaw);
        return dispatcherTag ? `开心财税${dispatcherTag}` : accountName;
      }
      if (roleKey === "boss") {
        return "boss";
      }
      return accountName;
    }

    function renderSavedLoginList() {
      if (!savedLoginSection || !savedLoginList) return;
      savedLoginList.innerHTML = "";
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
      return normalized === BOSS_LOGIN_ACCOUNT;
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

      return [
        String(item.id || ""),
        String(item.createdAt || ""),
        String(item.date || ""),
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
        Number.isFinite(payment) ? payment : "",
        Number.isFinite(total) ? total : "",
        Number.isFinite(settlement) ? settlement : "",
        feedbackImages
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
      if (!dispatcherTag) return "";
      return `${STORAGE_KEY_UPDATED_ROW_DISMISSED_PREFIX}_${dispatcherTag}`;
    }

    function getUpdatedRowHighlightStorageKey(accountName = currentAccount) {
      const normalizedAccount = String(accountName || "").trim();
      if (isBossLogin(normalizedAccount)) {
        return `${STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX}_boss`;
      }
      const dispatcherTag = getDispatcherTagForAccount(normalizedAccount);
      if (!dispatcherTag) return "";
      return `${STORAGE_KEY_UPDATED_ROW_HIGHLIGHT_PREFIX}_${dispatcherTag}`;
    }

    function saveUpdatedRowDismissState() {
      const dismissKey = getUpdatedRowDismissStorageKey();
      const highlightKey = getUpdatedRowHighlightStorageKey();
      const highlightedIds = Array.from(highlightedUpdatedRecordIds || []).filter((recordId) =>
        Boolean(String(recordId || "").trim())
      );
      if (highlightKey) {
        if (highlightedIds.length) {
          localStorage.setItem(highlightKey, JSON.stringify(highlightedIds));
        } else {
          localStorage.removeItem(highlightKey);
        }
      }

      const entries = Object.entries(dismissedUpdatedRecordSignatures || {}).filter(([recordId, signature]) =>
        Boolean(String(recordId || "").trim()) && Boolean(String(signature || "").trim())
      );
      if (!dismissKey) return;
      if (!entries.length) {
        localStorage.removeItem(dismissKey);
        return;
      }
      localStorage.setItem(dismissKey, JSON.stringify(Object.fromEntries(entries)));
    }

    function loadUpdatedRowDismissState() {
      highlightedUpdatedRecordIds = new Set();
      dismissedUpdatedRecordSignatures = {};
      const highlightKey = getUpdatedRowHighlightStorageKey();
      if (highlightKey) {
        const highlightedRaw = String(localStorage.getItem(highlightKey) || "").trim();
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
      const raw = String(localStorage.getItem(dismissKey) || "").trim();
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

    function syncUpdatedRowHighlightState(previousRecords, nextRecords, options = {}) {
      const { trackChanges = false } = options;
      const previousList = Array.isArray(previousRecords) ? previousRecords : [];
      const nextList = Array.isArray(nextRecords) ? nextRecords : [];

      if (!currentAccount || isAccountantLogin()) {
        highlightedUpdatedRecordIds = new Set();
        return;
      }

      const previousSignatureMap = new Map();
      previousList.forEach((item) => {
        const recordId = String(item?.id || "").trim();
        if (!recordId) return;
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
        if (dismissedUpdatedRecordSignatures[recordId] === nextSignature) {
          nextDismissedSignatures[recordId] = nextSignature;
          return;
        }
        if (currentHighlightedIds.has(recordId)) {
          nextHighlightedIds.add(recordId);
        }
        if (!trackChanges) return;
        const previousSignature = previousSignatureMap.get(recordId);
        if (previousSignature !== nextSignature) {
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
      const set = new Set([...ALLOWED_ACCOUNTS, BOSS_LOGIN_ACCOUNT]);
      accountants.forEach((item) => {
        const loginName = String(item.username || item.name || "").trim();
        if (loginName) set.add(loginName);
      });
      return set;
    }

    function isValidLoginAccount(accountName) {
      const normalized = String(accountName || "").trim();
      if (!normalized) return false;
      return getAllowedLoginAccounts().has(normalized);
    }

    function resolveLoginAccountInput(rawInput) {
      const source = String(rawInput || "").trim();
      if (!source) return "";
      const lower = source.toLowerCase();
      return DISPATCHER_LOGIN_CODE_TO_ACCOUNT[lower] || source;
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
        completeFeedbackUploader.setAttribute("aria-label", isViewMode ? "客服反馈截图" : "添加客服反馈截图");
      }
      if (completeFeedbackImageInput) {
        completeFeedbackImageInput.disabled = isViewMode;
      }
      if (completeFeedbackImageSelectBtn) {
        completeFeedbackImageSelectBtn.hidden = isViewMode;
        completeFeedbackImageSelectBtn.disabled = isViewMode;
      }
      if (completeModalCloseBtn) {
        completeModalCloseBtn.hidden = !isViewMode;
      }
      if (completeModalSubmitBtn) {
        completeModalSubmitBtn.hidden = isViewMode;
      }
      renderCompleteFeedbackImageList();
    }

    function renderCompleteFeedbackImageList() {
      if (!completeFeedbackImageList || !completeFeedbackImageCount || !completeFeedbackDropHint || !completeFeedbackUploader) return;
      const items = Array.isArray(completeFeedbackImageItems) ? completeFeedbackImageItems : [];
      const isViewMode = isCompleteModalViewMode();
      completeFeedbackImageList.innerHTML = "";
      completeFeedbackImageCount.textContent = `${items.length} 张`;
      completeFeedbackDropHint.textContent = isViewMode
        ? (items.length ? "已上传的客服反馈截图" : "暂无客服反馈截图")
        : (items.length ? "继续补充客服和客户沟通截图" : "上传客服和客户沟通截图，支持拖入多张图片");
      completeFeedbackUploader.classList.toggle("has-images", Boolean(items.length));
      completeFeedbackUploader.classList.toggle("readonly", isViewMode);

      items.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "feedback-image-card";

        const image = document.createElement("img");
        image.className = "feedback-image-preview";
        image.src = item.previewUrl;
        image.alt = `客服反馈截图 ${index + 1}`;

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
        alert("只支持图片文件。");
        return;
      }
      if (imageFiles.length !== sourceFiles.length) {
        alert("已跳过非图片文件。");
      }
      const availableCount = COMPLETE_FEEDBACK_IMAGE_MAX_COUNT - completeFeedbackImageItems.length;
      if (availableCount <= 0) {
        alert(`最多添加 ${COMPLETE_FEEDBACK_IMAGE_MAX_COUNT} 张截图。`);
        return;
      }
      const acceptedFiles = imageFiles.slice(0, availableCount);
      if (imageFiles.length > availableCount) {
        alert(`最多添加 ${COMPLETE_FEEDBACK_IMAGE_MAX_COUNT} 张截图。`);
      }
      const nextItems = [...completeFeedbackImageItems];
      for (const file of acceptedFiles) {
        if (Number(file.size || 0) > COMPLETE_FEEDBACK_IMAGE_MAX_SIZE_BYTES) {
          alert(`图片“${file.name || "未命名图片"}”超过 5MB。`);
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

    function getPremiumValue(source) {
      const payment = Number(source?.paymentPrice);
      const total = Number(source?.totalPrice);
      if (!Number.isFinite(payment) || !Number.isFinite(total)) return Number.NaN;
      return payment - total;
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

    function setLoginRequestHint(text, state = "idle") {
      if (!loginRequestHint) return;
      loginRequestHint.textContent = text;
      loginRequestHint.className = `login-request-hint ${state}`;
    }

    function setRequestLogStatusBadge(text, state = "idle") {
      if (!requestLogStatusBadge) return;
      requestLogStatusBadge.textContent = text;
      requestLogStatusBadge.className = `request-log-status-badge ${state}`;
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
      localStorage.setItem(key, JSON.stringify(safeItems));
    }

    function loadPendingAccountantNotices() {
      const key = getOperationNoticePendingStorageKey();
      if (!key) return [];
      const raw = String(localStorage.getItem(key) || "").trim();
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
      localStorage.removeItem(key);
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
      const actionLabel = actionKey === "completed" ? "完成" : (actionKey === "returned" ? "退单" : "核对");
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
        parts.splice(2, 0, `派单 ${dispatcher}`);
      }
      if (summaryText) {
        parts.push(`简介 ${summaryText}`);
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
        title: "有新派单",
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
          const actionLabel = actionKey === "completed" ? "完成" : (actionKey === "returned" ? "退单" : "核对");
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
