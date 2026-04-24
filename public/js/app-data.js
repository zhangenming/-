// Data: API access, CRUD actions, accountant picker data sync, auto refresh, persisted view state.
    async function fetchWithClientLog(url, options = {}, meta = {}) {
      const { skipAuth = false } = meta;
      const headers = new Headers(options.headers || {});
      if (!skipAuth && currentSessionToken) {
        headers.set("X-Dispatch-Session", currentSessionToken);
      }
      const response = await fetch(url, {
        ...options,
        headers
      });
      if (!skipAuth && response.status === 401) {
        handleUnauthorizedSession();
        throw new Error("登录状态已失效，请重新登录。");
      }
      return response;
    }

    function handleUnauthorizedSession() {
      currentAccount = "";
      currentAccountRole = "";
      currentSessionToken = "";
      records = [];
      recycleBinRecords = [];
      accountantOperationLogs = [];
      hasFetchedRecords = false;
      currentOperationNoticeLogId = "";
      operationNoticeDismissed = false;
      dismissedOperationNoticeLogId = "";
      resetAccountantAssignmentNoticeState();
      resetUpdatedRowHighlightState();
      hideOperationNotice();
      stopAutoRefresh();
      saveToStorage();
      applyAccountToForm();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      setPageMode(false);
      renderRequestLogList();
      loginCodeInput.value = "";
      loginPasswordInput.value = "";
      setLoginRequestHint("请求状态：登录状态已失效，请重新登录", "error");
      loginCodeInput.focus();
    }

    function syncModalOpenState() {
      const hasOpenModal = !createModal.hidden
        || !checkModal.hidden
        || !completeModal.hidden
        || !analysisModal.hidden
        || !accountantModal.hidden
        || !recycleModal.hidden;
      document.body.classList.toggle("modal-open", hasOpenModal);
    }

    function syncSettlementPriceFromTotal() {
      const settlementRaw = String(settlementPriceInput.value || "").trim();
      const totalRaw = String(totalPriceInput.value || "").trim();
      if (!totalRaw) {
        if (settlementPriceAutoFilled) {
          settlementPriceInput.value = "";
          settlementPriceAutoFilled = false;
        }
        return;
      }

      const total = Number(totalRaw);
      if (!Number.isFinite(total)) return;
      if (!settlementRaw || settlementPriceAutoFilled) {
        settlementPriceInput.value = (total * 0.6).toFixed(2);
        settlementPriceAutoFilled = true;
      }
    }

    function syncPremiumPriceFromPrices() {
      if (!premiumHint) return;
      const paymentRaw = String(paymentPriceInput.value || "").trim();
      const totalRaw = String(totalPriceInput.value || "").trim();
      const payment = Number(paymentRaw);
      const total = Number(totalRaw);
      if (!paymentRaw || !totalRaw || !Number.isFinite(payment) || !Number.isFinite(total)) {
        premiumHint.hidden = true;
        premiumHint.textContent = "";
        premiumHint.classList.remove("active", "negative");
        return;
      }

      const premium = payment - total;
      premiumHint.hidden = false;
      premiumHint.textContent = `溢价：${premium.toFixed(2)} 元`;
      premiumHint.classList.toggle("active", premium >= 0);
      premiumHint.classList.toggle("negative", premium < 0);
    }

    function getRecordsRenderSignature(sourceRecords) {
      if (!Array.isArray(sourceRecords) || !sourceRecords.length) return "";
      return sourceRecords.map((item) => getRecordComparisonSignature(item)).join("\u0002");
    }

    async function fetchRecords() {
      if (!currentAccount || !currentSessionToken) return;
      const response = await fetchWithClientLog(
        API_ENDPOINT_RECORDS,
        { cache: "no-store" },
        { successMessage: "刷新数据" }
      );
      if (!response.ok) {
        throw new Error(`读取数据失败（${response.status}）`);
      }
      const payload = await response.json();
      const nextRecords = Array.isArray(payload.records) ? payload.records : [];
      const isSameRecords = getRecordsRenderSignature(nextRecords) === getRecordsRenderSignature(records);
      const shouldTrackRowChanges = hasFetchedRecords;
      const shouldSkipRender = hasFetchedRecords && isSameRecords;
      hasFetchedRecords = true;
      if (shouldSkipRender) {
        return;
      }
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: shouldTrackRowChanges });
      syncAccountantAssignmentNotice(nextRecords);
      records = nextRecords;
      syncAccountantsFromRecords();
      renderAccountantSelectOptions();
      renderTable();
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
    }

    async function fetchRecycleBinRecords() {
      if (!currentAccount || !currentSessionToken) return;
      const response = await fetchWithClientLog(
        API_ENDPOINT_RECYCLE_BIN,
        { cache: "no-store" },
        { successMessage: "读取回收站" }
      );
      if (!response.ok) {
        throw new Error(`读取回收站失败（${response.status}）`);
      }
      const payload = await response.json();
      recycleBinRecords = Array.isArray(payload.recycleBinRecords) ? payload.recycleBinRecords : [];
      accountantOperationLogs = Array.isArray(payload.accountantOperationLogs) ? payload.accountantOperationLogs : [];
      renderRequestLogList();
      if (!recycleModal.hidden) {
        renderRecycleBinTable();
        renderAccountantOperationLogs();
      }
    }

    async function fetchAccountantOperationLogs() {
      if (!currentAccount || !currentSessionToken) return;
      const response = await fetchWithClientLog(
        API_ENDPOINT_ACCOUNTANT_OPERATION_LOGS,
        { cache: "no-store" },
        { successMessage: "读取会计操作日志" }
      );
      if (!response.ok) {
        throw new Error(`读取会计操作日志失败（${response.status}）`);
      }
      const payload = await response.json();
      accountantOperationLogs = Array.isArray(payload.accountantOperationLogs) ? payload.accountantOperationLogs : [];
      renderRequestLogList();
      if (!recycleModal.hidden) {
        renderAccountantOperationLogs();
      }
    }

    function renderAccountantList() {
      accountantList.innerHTML = "";
      if (!accountants.length) {
        accountantEmptyState.style.display = "block";
        return;
      }
      accountantEmptyState.style.display = "none";

      const orderCountByAccountant = getAccountantOrderCountMap();
      const sortedProfiles = [...accountants].sort((left, right) =>
        compareAccountantNameByOrderCount(left.displayName || left.name, right.displayName || right.name, orderCountByAccountant)
      );

      sortedProfiles.forEach((profile) => {
        const li = document.createElement("li");
        li.className = "accountant-list-item";
        if (String(profile.username || profile.name || "").trim() === highlightedAccountantUsername) {
          li.classList.add("recently-created");
        }
        const identity = document.createElement("div");
        identity.className = "accountant-item-identity";

        const usernameText = String(profile.username || profile.name || "").trim();
        const displayName = String(profile.displayName || profile.name || "").trim();
        const titleRow = document.createElement("div");
        titleRow.className = "accountant-item-head";

        const usernameSpan = document.createElement("span");
        usernameSpan.className = "accountant-item-name";
        usernameSpan.textContent = usernameText;

        const displayNameSpan = document.createElement("span");
        displayNameSpan.className = "accountant-item-sub";
        displayNameSpan.textContent = displayName;

        titleRow.appendChild(usernameSpan);
        titleRow.appendChild(displayNameSpan);
        identity.appendChild(titleRow);

        const orderCount = orderCountByAccountant.get(displayName) || 0;

        const passwordSpan = document.createElement("span");
        passwordSpan.className = "accountant-item-password";
        passwordSpan.textContent = `密码：${profile.loginPassword || "123456"}`;

        const countSpan = document.createElement("span");
        countSpan.className = "accountant-item-count";
        countSpan.textContent = `${orderCount} 单`;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "accountant-delete-btn";
        deleteBtn.dataset.accountantUsername = String(profile.username || profile.name || "").trim();
        deleteBtn.dataset.accountantDisplayName = displayName;
        deleteBtn.dataset.relatedCount = String(orderCount);
        deleteBtn.disabled = orderCount > 0;
        deleteBtn.title = orderCount > 0 ? `当前有 ${orderCount} 条数据，暂不可删除` : "删除会计";
        deleteBtn.textContent = "删除";

        const meta = document.createElement("div");
        meta.className = "accountant-item-meta";
        meta.appendChild(passwordSpan);
        meta.appendChild(countSpan);
        meta.appendChild(deleteBtn);

        li.appendChild(identity);
        li.appendChild(meta);
        accountantList.appendChild(li);
      });
    }

    function syncAccountantsFromRecords() {
      const accountantNamesFromRecords = records.map((item) => String(item.accountant || "").trim());
      accountants = mergeAccountantProfiles(accountants, accountantNamesFromRecords);
    }

    function setAccountantPickerValue(value) {
      const normalizedValue = String(value || "").trim();
      accountantInput.value = normalizedValue;
      if (normalizedValue) {
        accountantPickerValue.textContent = normalizedValue;
        accountantPickerValue.classList.remove("placeholder");
        return;
      }
      accountantPickerValue.textContent = "";
      accountantPickerValue.classList.add("placeholder");
    }

    function setSourcePickerValue(value) {
      const normalizedValue = String(value || "").trim();
      sourceInput.value = normalizedValue;
      if (normalizedValue) {
        sourcePickerValue.textContent = normalizedValue;
        sourcePickerValue.classList.remove("placeholder");
        return;
      }
      sourcePickerValue.textContent = "";
      sourcePickerValue.classList.add("placeholder");
    }

    function getPlatformShopOptionByLabel(value) {
      const normalizedValue = String(value || "").trim();
      if (!normalizedValue) return null;
      return platformShopPickerOptions.find((item) => item.label === normalizedValue)
        || PLATFORM_SHOP_OPTIONS.find((item) => item.label === normalizedValue)
        || null;
    }

    function getPlatformShopPickerCurrentLabel() {
      const normalizedPlatform = String(platformInput.value || "").trim();
      const normalizedShopName = String(shopNameInput.value || "").trim();
      if (!normalizedPlatform || !normalizedShopName) return "";
      const matchedOption = platformShopPickerOptions.find((item) =>
        item.platform === normalizedPlatform && item.shopName === normalizedShopName
      ) || PLATFORM_SHOP_OPTIONS.find((item) =>
        item.platform === normalizedPlatform && item.shopName === normalizedShopName
      );
      return matchedOption ? matchedOption.label : "";
    }

    function setPlatformShopPickerValue(value) {
      const matchedOption = getPlatformShopOptionByLabel(value);
      if (matchedOption) {
        platformInput.value = matchedOption.platform;
        shopNameInput.value = matchedOption.shopName;
        platformShopPickerValue.textContent = matchedOption.label;
        platformShopPickerValue.classList.remove("placeholder");
        return;
      }
      platformInput.value = "";
      shopNameInput.value = "";
      platformShopPickerValue.textContent = "";
      platformShopPickerValue.classList.add("placeholder");
    }

    function setPlatformShopPickerFieldsValue(platformValue, shopValue) {
      const normalizedPlatform = String(platformValue || "").trim();
      const normalizedShopName = String(shopValue || "").trim();
      const matchedOption = platformShopPickerOptions.find((item) =>
        item.platform === normalizedPlatform && item.shopName === normalizedShopName
      ) || PLATFORM_SHOP_OPTIONS.find((item) =>
        item.platform === normalizedPlatform && item.shopName === normalizedShopName
      );

      if (matchedOption) {
        setPlatformShopPickerValue(matchedOption.label);
        return;
      }

      platformInput.value = normalizedPlatform;
      shopNameInput.value = normalizedShopName;
      const displayLabel = normalizedPlatform && normalizedShopName
        ? `${normalizedPlatform}-${normalizedShopName}`
        : "";
      platformShopPickerValue.textContent = displayLabel;
      platformShopPickerValue.classList.toggle("placeholder", !displayLabel);
    }

    function getAccountantPickerOptionButtons() {
      return Array.from(accountantPickerList.querySelectorAll(".accountant-picker-option"));
    }

    function getSourcePickerOptionButtons() {
      return Array.from(sourcePickerList.querySelectorAll(".accountant-picker-option"));
    }

    function getPlatformShopPickerOptionButtons() {
      return Array.from(platformShopPickerList.querySelectorAll(".accountant-picker-option"));
    }

    function renderAccountantPickerList(query = "") {
      const normalizedQuery = String(query || "").trim().toLowerCase();
      const selectedValue = String(accountantInput.value || "").trim();
      const filteredOptions = accountantPickerOptions.filter((name) =>
        String(name || "").toLowerCase().includes(normalizedQuery)
      );
      accountantPickerList.innerHTML = "";

      if (!filteredOptions.length) {
        accountantPickerEmpty.hidden = false;
        accountantPickerEmpty.textContent = normalizedQuery
          ? "没有匹配的会计，请换个关键词。"
          : "暂无可用会计，请先新增。";
        return;
      }

      accountantPickerEmpty.hidden = true;
      filteredOptions.forEach((name) => {
        const optionBtn = document.createElement("button");
        optionBtn.type = "button";
        optionBtn.className = "accountant-picker-option";
        optionBtn.dataset.value = name;
        optionBtn.setAttribute("role", "option");
        const isSelected = name === selectedValue;
        optionBtn.setAttribute("aria-selected", String(isSelected));
        if (isSelected) optionBtn.classList.add("selected");

        const textSpan = document.createElement("span");
        textSpan.textContent = name;
        optionBtn.appendChild(textSpan);

        const rightMeta = document.createElement("span");
        rightMeta.className = "accountant-picker-option-meta";

        const countBadge = document.createElement("span");
        countBadge.className = "accountant-picker-option-count";
        countBadge.textContent = `${accountantPickerOrderCountMap.get(name) || 0} 单`;
        rightMeta.appendChild(countBadge);

        if (isSelected) {
          const badge = document.createElement("span");
          badge.className = "accountant-picker-option-badge";
          badge.textContent = "当前";
          rightMeta.appendChild(badge);
        }

        optionBtn.appendChild(rightMeta);
        accountantPickerList.appendChild(optionBtn);
      });
    }

    function renderSourcePickerList() {
      const selectedValue = String(sourceInput.value || "").trim();
      const filteredOptions = sourcePickerOptions;
      sourcePickerList.innerHTML = "";

      if (!filteredOptions.length) {
        sourcePickerEmpty.hidden = false;
        sourcePickerEmpty.textContent = "暂无来源选项。";
        return;
      }

      sourcePickerEmpty.hidden = true;
      filteredOptions.forEach((name) => {
        const optionBtn = document.createElement("button");
        optionBtn.type = "button";
        optionBtn.className = "accountant-picker-option";
        optionBtn.dataset.value = name;
        optionBtn.setAttribute("role", "option");
        const isSelected = name === selectedValue;
        optionBtn.setAttribute("aria-selected", String(isSelected));
        if (isSelected) optionBtn.classList.add("selected");

        const textSpan = document.createElement("span");
        textSpan.textContent = name;
        optionBtn.appendChild(textSpan);

        if (isSelected) {
          const rightMeta = document.createElement("span");
          rightMeta.className = "accountant-picker-option-meta";
          const badge = document.createElement("span");
          badge.className = "accountant-picker-option-badge";
          badge.textContent = "当前";
          rightMeta.appendChild(badge);
          optionBtn.appendChild(rightMeta);
        }

        sourcePickerList.appendChild(optionBtn);
      });
    }

    function renderPlatformShopPickerList() {
      const selectedValue = getPlatformShopPickerCurrentLabel();
      const filteredOptions = platformShopPickerOptions;
      platformShopPickerList.innerHTML = "";

      if (!filteredOptions.length) {
        platformShopPickerEmpty.hidden = false;
        platformShopPickerEmpty.textContent = "暂无平台店铺选项。";
        return;
      }

      platformShopPickerEmpty.hidden = true;
      filteredOptions.forEach((item) => {
        const optionBtn = document.createElement("button");
        optionBtn.type = "button";
        optionBtn.className = "accountant-picker-option";
        optionBtn.dataset.value = item.label;
        optionBtn.setAttribute("role", "option");
        const isSelected = item.label === selectedValue;
        optionBtn.setAttribute("aria-selected", String(isSelected));
        if (isSelected) optionBtn.classList.add("selected");

        const textSpan = document.createElement("span");
        textSpan.textContent = item.label;
        optionBtn.appendChild(textSpan);

        if (isSelected) {
          const rightMeta = document.createElement("span");
          rightMeta.className = "accountant-picker-option-meta";
          const badge = document.createElement("span");
          badge.className = "accountant-picker-option-badge";
          badge.textContent = "当前";
          rightMeta.appendChild(badge);
          optionBtn.appendChild(rightMeta);
        }

        platformShopPickerList.appendChild(optionBtn);
      });
    }

    function closeAccountantPicker(options = {}) {
      const { focusTrigger = false } = options;
      if (accountantPickerDropdown.hidden) {
        if (focusTrigger) accountantPickerTrigger.focus();
        return;
      }
      accountantPickerDropdown.hidden = true;
      accountantPicker.classList.remove("open");
      accountantPickerTrigger.setAttribute("aria-expanded", "false");
      accountantPickerSearch.value = "";
      renderAccountantPickerList("");
      if (focusTrigger) accountantPickerTrigger.focus();
    }

    function closeSourcePicker(options = {}) {
      const { focusTrigger = false } = options;
      if (sourcePickerDropdown.hidden) {
        if (focusTrigger) sourcePickerTrigger.focus();
        return;
      }
      sourcePickerDropdown.hidden = true;
      sourcePicker.classList.remove("open");
      sourcePickerTrigger.setAttribute("aria-expanded", "false");
      renderSourcePickerList();
      if (focusTrigger) sourcePickerTrigger.focus();
    }

    function closePlatformShopPicker(options = {}) {
      const { focusTrigger = false } = options;
      if (platformShopPickerDropdown.hidden) {
        if (focusTrigger) platformShopPickerTrigger.focus();
        return;
      }
      platformShopPickerDropdown.hidden = true;
      platformShopPicker.classList.remove("open");
      platformShopPickerTrigger.setAttribute("aria-expanded", "false");
      renderPlatformShopPickerList();
      if (focusTrigger) platformShopPickerTrigger.focus();
    }

    function closeAllFormPickers(options = {}) {
      const { except = "" } = options;
      if (except !== "accountant") closeAccountantPicker();
      if (except !== "source") closeSourcePicker();
      if (except !== "platformShop") closePlatformShopPicker();
    }

    function openAccountantPicker(options = {}) {
      const { focusLastOption = false } = options;
      if (accountantPickerTrigger.disabled) return;
      if (typeof closeAllFilterPopovers === "function") {
        closeAllFilterPopovers();
      }
      closeAllFormPickers({ except: "accountant" });
      accountantPickerDropdown.hidden = false;
      accountantPicker.classList.add("open");
      accountantPickerTrigger.setAttribute("aria-expanded", "true");
      accountantPickerSearch.value = "";
      renderAccountantPickerList("");
      if (focusLastOption) {
        const optionButtons = getAccountantPickerOptionButtons();
        if (optionButtons.length) {
          optionButtons[optionButtons.length - 1].focus();
          return;
        }
      }
      accountantPickerSearch.focus();
      accountantPickerSearch.select();
    }

    function openSourcePicker(options = {}) {
      const { focusLastOption = false } = options;
      if (sourcePickerTrigger.disabled) return;
      if (typeof closeAllFilterPopovers === "function") {
        closeAllFilterPopovers();
      }
      closeAllFormPickers({ except: "source" });
      sourcePickerDropdown.hidden = false;
      sourcePicker.classList.add("open");
      sourcePickerTrigger.setAttribute("aria-expanded", "true");
      renderSourcePickerList();
      const optionButtons = getSourcePickerOptionButtons();
      if (optionButtons.length) {
        optionButtons[focusLastOption ? optionButtons.length - 1 : 0].focus();
      }
    }

    function openPlatformShopPicker(options = {}) {
      const { focusLastOption = false } = options;
      if (platformShopPickerTrigger.disabled) return;
      if (typeof closeAllFilterPopovers === "function") {
        closeAllFilterPopovers();
      }
      closeAllFormPickers({ except: "platformShop" });
      platformShopPickerDropdown.hidden = false;
      platformShopPicker.classList.add("open");
      platformShopPickerTrigger.setAttribute("aria-expanded", "true");
      renderPlatformShopPickerList();
      const optionButtons = getPlatformShopPickerOptionButtons();
      if (optionButtons.length) {
        optionButtons[focusLastOption ? optionButtons.length - 1 : 0].focus();
      }
    }

    function toggleAccountantPicker() {
      if (accountantPickerDropdown.hidden) {
        openAccountantPicker();
        return;
      }
      closeAccountantPicker();
    }

    function toggleSourcePicker() {
      if (sourcePickerDropdown.hidden) {
        openSourcePicker();
        return;
      }
      closeSourcePicker();
    }

    function togglePlatformShopPicker() {
      if (platformShopPickerDropdown.hidden) {
        openPlatformShopPicker();
        return;
      }
      closePlatformShopPicker();
    }

    function renderAccountantSelectOptions() {
      const wasOpen = !accountantPickerDropdown.hidden;
      const currentSearch = String(accountantPickerSearch.value || "");
      const currentAccountantName = isAccountantLogin() ? getCurrentAccountantDisplayName() : "";
      const orderCountByAccountant = getAccountantOrderCountMap();
      const availableAccountantNames = currentAccountantName
        ? [currentAccountantName]
        : getOrderSortedAccountantNames(
            accountants.map((item) => String(item.displayName || item.name || "").trim()),
            orderCountByAccountant
          );
      const currentValue = String(accountantInput.value || "").trim();
      accountantPickerOptions = availableAccountantNames;
      accountantPickerOrderCountMap = orderCountByAccountant;
      let nextValue = "";
      if (currentAccountantName && availableAccountantNames.includes(currentAccountantName)) {
        nextValue = currentAccountantName;
      } else if (currentValue && availableAccountantNames.includes(currentValue)) {
        nextValue = currentValue;
      } else if (availableAccountantNames.length === 1) {
        nextValue = availableAccountantNames[0];
      }

      setAccountantPickerValue(nextValue);
      renderAccountantPickerList("");

      const lockedByAccount = Boolean(currentAccountantName);
      const disabled = lockedByAccount || !availableAccountantNames.length;
      accountantPicker.classList.toggle("locked", lockedByAccount);
      accountantPicker.classList.toggle("disabled", disabled);
      accountantPickerTrigger.disabled = disabled;
      accountantPickerMeta.textContent = lockedByAccount
        ? "固定"
        : `${availableAccountantNames.length} 项`;
      if (wasOpen && !disabled) {
        accountantPickerDropdown.hidden = false;
        accountantPicker.classList.add("open");
        accountantPickerTrigger.setAttribute("aria-expanded", "true");
        accountantPickerSearch.value = currentSearch;
        renderAccountantPickerList(currentSearch);
      } else {
        closeAccountantPicker();
      }
    }

    function renderSourcePickerOptions() {
      const wasOpen = !sourcePickerDropdown.hidden;
      const currentValue = String(sourceInput.value || "").trim();
      sourcePickerOptions = [...SOURCE_OPTIONS];
      const nextValue = sourcePickerOptions.includes(currentValue) ? currentValue : "";

      setSourcePickerValue(nextValue);
      renderSourcePickerList();

      const disabled = !sourcePickerOptions.length;
      sourcePicker.classList.remove("locked");
      sourcePicker.classList.toggle("disabled", disabled);
      sourcePickerTrigger.disabled = disabled;
      sourcePickerMeta.textContent = `${sourcePickerOptions.length} 项`;
      if (wasOpen && !disabled) {
        sourcePickerDropdown.hidden = false;
        sourcePicker.classList.add("open");
        sourcePickerTrigger.setAttribute("aria-expanded", "true");
        renderSourcePickerList();
      } else {
        closeSourcePicker();
      }
    }

    function renderPlatformShopPickerOptions() {
      const wasOpen = !platformShopPickerDropdown.hidden;
      const currentLabel = getPlatformShopPickerCurrentLabel();
      platformShopPickerOptions = [...PLATFORM_SHOP_OPTIONS];
      const nextLabel = platformShopPickerOptions.some((item) => item.label === currentLabel)
        ? currentLabel
        : "";

      setPlatformShopPickerValue(nextLabel);
      renderPlatformShopPickerList();

      const disabled = !platformShopPickerOptions.length;
      platformShopPicker.classList.remove("locked");
      platformShopPicker.classList.toggle("disabled", disabled);
      platformShopPickerTrigger.disabled = disabled;
      platformShopPickerMeta.textContent = `${platformShopPickerOptions.length} 项`;
      if (wasOpen && !disabled) {
        platformShopPickerDropdown.hidden = false;
        platformShopPicker.classList.add("open");
        platformShopPickerTrigger.setAttribute("aria-expanded", "true");
        renderPlatformShopPickerList();
      } else {
        closePlatformShopPicker();
      }
    }

    async function fetchAccountantsForLogin() {
      const response = await fetchWithClientLog(
        API_ENDPOINT_ACCOUNTANTS,
        { cache: "no-store" },
        { successMessage: "读取会计列表" }
      );
      if (!response.ok) {
        throw new Error(`读取会计列表失败（${response.status}）`);
      }
      const payload = await response.json();
      const fetchedAccountants = Array.isArray(payload.accountants) ? payload.accountants : [];
      accountants = mergeAccountantProfiles(fetchedAccountants);
      syncAccountantsFromRecords();
      renderAccountantList();
      renderAccountantSelectOptions();
      renderSourcePickerOptions();
      renderPlatformShopPickerOptions();
    }

    async function fetchAccountants() {
      if (!currentAccount || !currentSessionToken) return;
      await fetchAccountantsForLogin();
      validateCurrentAccount();
    }

    async function verifyLoginByServer(account, password) {
      setLoginRequestHint("请求状态：登录验证中...", "pending");
      const response = await fetchWithClientLog(API_ENDPOINT_AUTH_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password })
      }, {
        skipAuth: true
      });
      if (!response.ok) {
        let message = "账号或密码错误。";
        try {
          const payload = await response.json();
          if (payload.error) {
            message = payload.error;
          }
        } catch (error) {
          console.error(error);
        }
        setLoginRequestHint(`请求状态：${message}`, "error");
        throw new Error(message);
      }
      const payload = await response.json();
      setLoginRequestHint("请求状态：登录成功", "ok");
      return payload;
    }

    async function createAccountant(username, displayName) {
      const response = await fetchWithClientLog(API_ENDPOINT_ACCOUNTANTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName })
      });

      if (!response.ok) {
        let message = `新增会计失败（${response.status}）`;
        try {
          const payload = await response.json();
          if (payload.error) message = payload.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }

      const payload = await response.json();
      const createdAccountants = Array.isArray(payload.accountants) ? payload.accountants : accountants;
      accountants = mergeAccountantProfiles(createdAccountants);
      highlightedAccountantUsername = String(payload?.accountant?.username || username || "").trim();
      syncAccountantsFromRecords();
      renderAccountantList();
      renderAccountantSelectOptions();
    }

    async function deleteAccountant(username) {
      const response = await fetchWithClientLog(`${API_ENDPOINT_ACCOUNTANTS}/${encodeURIComponent(username)}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        let message = `删除会计失败（${response.status}）`;
        try {
          const payload = await response.json();
          if (payload.error) message = payload.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }

      const payload = await response.json();
      const nextAccountants = Array.isArray(payload.accountants) ? payload.accountants : accountants;
      accountants = mergeAccountantProfiles(nextAccountants);
      syncAccountantsFromRecords();
      if (filterState.accountant === String(payload.deletedDisplayName || "").trim()) {
        filterState.accountant = "";
      }
      renderAccountantList();
      renderAccountantSelectOptions();
      renderTable();
    }

    async function changeAccountantPassword(accountantUsername, newPassword) {
      const response = await fetchWithClientLog(
        `${API_ENDPOINT_ACCOUNTANTS}/${encodeURIComponent(accountantUsername)}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword })
        }
      );

      if (!response.ok) {
        let message = `修改密码失败（${response.status}）`;
        try {
          const payload = await response.json();
          if (payload.error) message = payload.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }

      const payload = await response.json();
      const nextAccountants = Array.isArray(payload.accountants) ? payload.accountants : accountants;
      accountants = mergeAccountantProfiles(nextAccountants);
      syncAccountantsFromRecords();
      renderAccountantList();
      renderAccountantSelectOptions();
      updateSavedLoginPassword(accountantUsername, newPassword, "accountant");
    }

    async function changeDispatcherPassword(newPassword) {
      const response = await fetchWithClientLog(
        API_ENDPOINT_AUTH_PASSWORD,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword })
        }
      );

      if (!response.ok) {
        let message = `修改密码失败（${response.status}）`;
        try {
          const payload = await response.json();
          if (payload.error) message = payload.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }

      const payload = await response.json();
      updateSavedLoginPassword(currentAccount, newPassword, "dispatcher");
      return payload;
    }

    async function createRecord(item) {
      const response = await fetchWithClientLog(API_ENDPOINT_RECORDS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });

      if (!response.ok) {
        let message = `保存失败（${response.status}）`;
        try {
          const payload = await response.json();
          if (payload.error) message = payload.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }

      const payload = await response.json();
      const nextRecords = Array.isArray(payload.records) ? payload.records : [item, ...records];
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: true });
      records = nextRecords;
      renderTable();
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
    }

    async function updateRecordById(recordId, payload) {
      const response = await fetchWithClientLog(`${API_ENDPOINT_RECORDS}/${encodeURIComponent(recordId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, {
        successMessage: "修改数据",
        errorMessage: "修改数据"
      });

      if (!response.ok) {
        let message = `修改失败（${response.status}）`;
        try {
          const body = await response.json();
          if (body.error) message = body.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }

      const body = await response.json();
      const nextRecords = Array.isArray(body.records) ? body.records : records;
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: true });
      records = nextRecords;
      renderTable();
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
    }

    async function checkRecordById(recordId, payload) {
      const requestPayload = {
        ...(payload && typeof payload === "object" ? payload : {}),
        operatedBy: String(
          (payload && typeof payload === "object" && payload.operatedBy)
            ? payload.operatedBy
            : (currentAccount || "")
        ).trim()
      };
      const targetStatus = String(requestPayload.status || "").trim().toLowerCase();
      const checkActionText = targetStatus === "completed"
        ? "会计完成"
        : (targetStatus === "returned" ? "会计退单" : "会计核对");
      const response = await fetchWithClientLog(`${API_ENDPOINT_RECORDS}/${encodeURIComponent(recordId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      }, {
        successMessage: checkActionText,
        errorMessage: checkActionText
      });

      if (!response.ok) {
        let message = `更新失败（${response.status}）`;
        try {
          const body = await response.json();
          if (body.error) message = body.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }

      const body = await response.json();
      const nextRecords = Array.isArray(body.records) ? body.records : records;
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: true });
      records = nextRecords;
      renderTable();
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
    }

    async function deleteRecordById(recordId) {
      const response = await fetchWithClientLog(`${API_ENDPOINT_RECORDS}/${encodeURIComponent(recordId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletedBy: currentAccount || "未知账号" })
      });

      if (!response.ok) {
        let message = `删除失败（${response.status}）`;
        try {
          const payload = await response.json();
          if (payload.error) message = payload.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }

      const payload = await response.json();
      const nextRecords = Array.isArray(payload.records) ? payload.records : records;
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: false });
      records = nextRecords;
      renderTable();

      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
      if (!recycleModal.hidden) {
        await fetchRecycleBinRecords();
      }
    }

    function stopAutoRefresh() {
      if (!refreshTimer) return;
      clearInterval(refreshTimer);
      refreshTimer = null;
    }

    function startAutoRefresh() {
      stopAutoRefresh();
      refreshTimer = setInterval(async () => {
        if (!currentAccount || !currentSessionToken) return;
        if (document.hidden) return;
        try {
          await fetchRecords();
          if (!recycleModal.hidden) {
            await fetchRecycleBinRecords();
          } else {
            await fetchAccountantOperationLogs();
          }
        } catch (error) {
          console.error(error);
        }
      }, 1000);
    }

    function saveToStorage() {
      sessionStorage.setItem(STORAGE_KEY_ACCOUNT, currentAccount);
      sessionStorage.setItem(STORAGE_KEY_ACCOUNT_ROLE, normalizeLoginRole(currentAccountRole));
      if (currentSessionToken) {
        sessionStorage.setItem(STORAGE_KEY_SESSION_TOKEN, currentSessionToken);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_SESSION_TOKEN);
      }
    }

    function persistSavedLoginEntries() {
      const sanitizedEntries = Array.from(
        new Map(
          (Array.isArray(savedLoginEntries) ? savedLoginEntries : [])
            .map((entry) => normalizeSavedLoginEntry(entry))
            .filter(Boolean)
            .map((entry) => [getSavedLoginEntryKey(entry.account), entry])
        ).values()
      )
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .slice(0, 8);

      savedLoginEntries = sanitizedEntries;
      if (sanitizedEntries.length) {
        localStorage.setItem(STORAGE_KEY_SAVED_LOGINS, JSON.stringify(sanitizedEntries));
      } else {
        localStorage.removeItem(STORAGE_KEY_SAVED_LOGINS);
      }
      renderSavedLoginList();
    }

    function loadSavedLoginEntries() {
      const raw = String(localStorage.getItem(STORAGE_KEY_SAVED_LOGINS) || "").trim();
      if (!raw) {
        savedLoginEntries = [];
        renderSavedLoginList();
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const source = Array.isArray(parsed) ? parsed : [parsed];
        savedLoginEntries = source.map((entry) => normalizeSavedLoginEntry(entry)).filter(Boolean);
      } catch (error) {
        console.error(error);
        savedLoginEntries = [];
      }
      persistSavedLoginEntries();
    }

    function saveSuccessfulLoginEntry(accountName, password, role = "") {
      const normalized = normalizeSavedLoginEntry({
        account: accountName,
        password,
        role,
        updatedAt: Date.now()
      });
      if (!normalized) return;
      savedLoginEntries = [...savedLoginEntries, normalized];
      persistSavedLoginEntries();
    }

    function updateSavedLoginPassword(accountName, password, role = "") {
      const normalized = normalizeSavedLoginEntry({
        account: accountName,
        password,
        role,
        updatedAt: Date.now()
      });
      if (!normalized) return;
      const entryKey = getSavedLoginEntryKey(normalized.account);
      savedLoginEntries = (Array.isArray(savedLoginEntries) ? savedLoginEntries : [])
        .filter((entry) => getSavedLoginEntryKey(entry.account) !== entryKey);
      savedLoginEntries.unshift(normalized);
      persistSavedLoginEntries();
    }

    function loadFromStorage() {
      const storedAccount = String(sessionStorage.getItem(STORAGE_KEY_ACCOUNT) || "").trim();
      const storedSessionToken = String(sessionStorage.getItem(STORAGE_KEY_SESSION_TOKEN) || "").trim();
      let storedRole = normalizeLoginRole(sessionStorage.getItem(STORAGE_KEY_ACCOUNT_ROLE));
      if (!storedRole && storedAccount) {
        storedRole = inferRoleByAccountName(storedAccount);
      }
      if (storedAccount && !storedSessionToken) {
        currentAccount = "";
        currentAccountRole = "";
        currentSessionToken = "";
        saveToStorage();
        return;
      }
      const normalizedAccount = storedRole === "dispatcher"
        ? resolveLoginAccountInput(storedAccount)
        : storedAccount;
      currentAccount = String(normalizedAccount || "").trim();
      currentAccountRole = storedRole;
      currentSessionToken = storedSessionToken;
      if (storedRole === "dispatcher" && storedAccount && currentAccount && storedAccount !== currentAccount) {
        saveToStorage();
      }
      loadUpdatedRowDismissState();
    }

    function getOperationNoticeDismissStorageKey(accountName = currentAccount) {
      const normalizedAccount = String(accountName || "").trim();
      if (isBossLogin(normalizedAccount)) {
        return `${STORAGE_KEY_OPERATION_NOTICE_DISMISSED_PREFIX}_boss`;
      }
      const dispatcherTag = getDispatcherTagForAccount(normalizedAccount);
      if (!dispatcherTag) return "";
      return `${STORAGE_KEY_OPERATION_NOTICE_DISMISSED_PREFIX}_${dispatcherTag}`;
    }

    function saveOperationNoticePreference() {
      const key = getOperationNoticeDismissStorageKey();
      if (!key) return;
      if (dismissedOperationNoticeLogId) {
        localStorage.setItem(key, dismissedOperationNoticeLogId);
      } else {
        localStorage.removeItem(key);
      }
    }

    function loadOperationNoticePreference() {
      const key = getOperationNoticeDismissStorageKey();
      if (!key) {
        operationNoticeDismissed = false;
        dismissedOperationNoticeLogId = "";
        return;
      }
      const raw = String(localStorage.getItem(key) || "").trim();
      if (raw === "1") {
        localStorage.removeItem(key);
        dismissedOperationNoticeLogId = "";
      } else {
        dismissedOperationNoticeLogId = raw;
      }
      operationNoticeDismissed = false;
    }

    function getAllowedSortKeySet() {
      return new Set(
        sortableHeaders
          .map((button) => String(button.dataset.key || "").trim())
          .filter(Boolean)
      );
    }

    function saveViewState() {
      hasDispatcherFilterPreference = true;
      const payload = {
        sort: {
          key: sortState.key,
          direction: sortState.direction
        },
        filter: {
          month: filterState.month,
          dispatcher: filterState.dispatcher,
          accountant: filterState.accountant,
          platform: filterState.platform,
          shopName: filterState.shopName,
          source: filterState.source,
          status: filterState.status
        },
        layout: {
          sidebarCollapsed: isSidebarCollapsed
        }
      };
      localStorage.setItem(STORAGE_KEY_VIEW_STATE, JSON.stringify(payload));
    }

    function loadViewState() {
      const raw = localStorage.getItem(STORAGE_KEY_VIEW_STATE);
      if (!raw) {
        hasDispatcherFilterPreference = false;
        setSidebarCollapsed(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const parsedFilter = parsed && typeof parsed.filter === "object" && parsed.filter
          ? parsed.filter
          : {};
        hasDispatcherFilterPreference = Object.prototype.hasOwnProperty.call(parsedFilter, "dispatcher");
        const allowedSortKeys = getAllowedSortKeySet();
        const persistedSortKey = String(parsed?.sort?.key || "").trim();
        const persistedSortDirection = String(parsed?.sort?.direction || "").trim();
        const persistedMonth = String(parsedFilter.month || "").trim();
        const persistedDispatcher = String(parsedFilter.dispatcher || "").trim();
        const persistedAccountant = String(parsedFilter.accountant || "").trim();
        const persistedPlatform = String(parsedFilter.platform || "").trim();
        const persistedShopName = String(parsedFilter.shopName || "").trim();
        const persistedSource = String(parsedFilter.source || "").trim();
        const persistedStatus = String(parsedFilter.status || "").trim();
        const persistedSidebarCollapsed = Boolean(parsed?.layout?.sidebarCollapsed);

        if (allowedSortKeys.has(persistedSortKey)) {
          sortState.key = persistedSortKey;
        }
        if (persistedSortDirection === "asc" || persistedSortDirection === "desc") {
          sortState.direction = persistedSortDirection;
        }

        filterState.month = persistedMonth;
        filterState.dispatcher = persistedDispatcher;
        filterState.accountant = persistedAccountant;
        filterState.platform = persistedPlatform;
        filterState.shopName = persistedShopName;
        filterState.source = persistedSource;
        filterState.status = persistedStatus;
        setSidebarCollapsed(persistedSidebarCollapsed);
      } catch (error) {
        console.error(error);
        hasDispatcherFilterPreference = false;
        setSidebarCollapsed(false);
      }
    }
