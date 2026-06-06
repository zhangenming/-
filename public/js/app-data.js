// Data: API access, CRUD actions, accountant picker data sync, auto refresh, persisted view state.
    function getEncodedLoginAccountHeaderValue() {
      const loginAccount = String(currentLoginAccount || "").trim();
      return loginAccount ? encodeURIComponent(loginAccount) : "";
    }

    function closeForceRefreshEventSource() {
      if (forceRefreshReloadTimer) {
        window.clearTimeout(forceRefreshReloadTimer);
        forceRefreshReloadTimer = null;
      }
      if (!forceRefreshEventSource) return;
      forceRefreshEventSource.close();
      forceRefreshEventSource = null;
    }

    function scheduleForcedAccountantPageReload(payload = {}) {
      if (!isAccountantLogin()) return;
      const message = String(payload?.message || "").trim();
      if (message) {
        showAppStatus(message, "ok");
      } else {
        showAppStatus("管理员已触发强制刷新，页面即将更新。", "ok");
      }
      if (forceRefreshReloadTimer) {
        window.clearTimeout(forceRefreshReloadTimer);
      }
      forceRefreshReloadTimer = window.setTimeout(() => {
        window.location.reload();
      }, 120);
    }

    function ensureForceRefreshSubscription() {
      if (!window.EventSource) return;
      if (!hasAuthenticatedAccount() || !isAccountantLogin()) {
        closeForceRefreshEventSource();
        return;
      }
      const encodedLoginAccount = getEncodedLoginAccountHeaderValue();
      if (!encodedLoginAccount) {
        closeForceRefreshEventSource();
        return;
      }
      const expectedUrl = `${API_ENDPOINT_FORCE_REFRESH_EVENTS}?account=${encodedLoginAccount}`;
      if (forceRefreshEventSource?.url === expectedUrl) {
        return;
      }
      closeForceRefreshEventSource();
      const source = new EventSource(expectedUrl);
      source.addEventListener("force-refresh", (event) => {
        let payload = {};
        try {
          payload = event?.data ? JSON.parse(event.data) : {};
        } catch {
          payload = {};
        }
        scheduleForcedAccountantPageReload(payload);
      });
      source.onerror = () => {
        if (!hasAuthenticatedAccount() || !isAccountantLogin()) {
          closeForceRefreshEventSource();
        }
      };
      forceRefreshEventSource = source;
    }

    function getNetworkRequestErrorMessage(error, url) {
      const endpointText = String(url || "").trim();
      const suffix = endpointText ? `（${endpointText}）` : "";
      if (error?.name === "AbortError") {
        return `请求已中断${suffix}，请稍后重试。`;
      }
      return `网络连接异常${suffix}，请确认服务已启动或网络连接正常。`;
    }

    function showNetworkRequestError(error, url, meta = {}) {
      if (meta.surfaceNetworkError === false) return;
      const message = getNetworkRequestErrorMessage(error, url);
      showAppStatus(message, "error");
      if (!hasAuthenticatedAccount()) {
        setLoginRequestHint(message, "error");
      }
    }

    async function fetchWithClientLog(url, options = {}, meta = {}) {
      const { skipAuth = false } = meta;
      const buildHeaders = () => {
        const headers = new Headers(options.headers || {});
        const encodedLoginAccount = getEncodedLoginAccountHeaderValue();
        if (!skipAuth && encodedLoginAccount) {
          headers.set("X-Dispatch-Account", encodedLoginAccount);
        }
        return headers;
      };

      let response;
      try {
        response = await fetch(url, {
          ...options,
          headers: buildHeaders()
        });
      } catch (error) {
        if (error?.name === "AbortError") {
          throw error;
        }
        showNetworkRequestError(error, url, meta);
        throw new Error(getNetworkRequestErrorMessage(error, url));
      }

      if (!skipAuth && response.status === 401) {
        handleUnauthorizedSession();
        throw new Error("登录状态已失效，请重新登录。");
      }
      return response;
    }

    function handleUnauthorizedSession() {
      closeForceRefreshEventSource();
      clearAuthenticatedRuntimeState();
      saveToStorage();
      applyAccountToForm();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRecordHistoryModal();
      closeInvoicePreviewModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeDispatcherModal();
      closeAccountantModal();
      closeAccountantEditModal();
      closeAccountantRegisterModal();
      closeChangePasswordModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeChangeLogModal();
      closeConfirmDialog(false);
      setPageMode(false);
      loginCodeInput.value = "";
      loginPasswordInput.value = "";
      setLoginRequestHint("登录状态已失效，请重新登录", "error");
      loginCodeInput.focus();
    }

    function clearAuthenticatedRuntimeState() {
      closeForceRefreshEventSource();
      clearCurrentAccountIdentity();
      records = [];
      recycleBinRecords = [];
      accountantOperationLogs = [];
      dispatchers = [];
      hasFetchedRecords = false;
      clearBossRecordSelection();
      clearBossSettlementPayoutSelection();
      setRecentBossSettlementRecordIds([]);
      resetAccountantAssignmentTrackingState();
      resetUpdatedRowHighlightState();
    }

    function storeAuthenticatedSession(authResult, accountName, password, options = {}) {
      const { persistSavedLogin = true } = options;
      const loginAccount = String(accountName || authResult?.loginAccount || "").trim();
      const normalized = resolveLoginAccountInput(authResult?.account || loginAccount);
      if (!loginAccount || !normalized) {
        throw new Error("登录标识无效");
      }
      currentAccount = normalized;
      currentLoginAccount = loginAccount;
      currentAccountRole = normalizeLoginRole(authResult?.role) || inferRoleByAccountName(normalized);
      currentAccountDisplayName = currentAccountRole === "accountant"
        ? String(authResult?.profile?.displayName || authResult?.profile?.name || "").trim()
        : "";
      currentAccountRealName = currentAccountRole === "accountant"
        ? String(authResult?.profile?.realName || "").trim()
        : "";
      currentAccountPhone = currentAccountRole === "accountant"
        ? String(authResult?.profile?.phone || "").trim()
        : "";
      setRecentBossSettlementRecordIds([]);
      clearBossSettlementPayoutSelection();
      hasFetchedRecords = false;
      resetAccountantAssignmentTrackingState();
      loadUpdatedRowDismissState();
      if (persistSavedLogin) {
        saveSuccessfulLoginEntry(loginAccount, password, currentAccountRole);
      }
      saveToStorage();
      ensureForceRefreshSubscription();
    }

    function syncModalOpenState() {
      const hasOpenModal = !createModal.hidden
        || !checkModal.hidden
        || !completeModal.hidden
        || !refundModal.hidden
        || !recordHistoryModal.hidden
        || (invoicePreviewModal && !invoicePreviewModal.hidden)
        || !bossSettlementSummaryModal.hidden
        || (bossSettlementDetailModal && !bossSettlementDetailModal.hidden)
        || (analysisAccountantDetailModal && !analysisAccountantDetailModal.hidden)
        || (customerFeedbackModal && !customerFeedbackModal.hidden)
        || (operationRecordsModal && !operationRecordsModal.hidden)
        || (reminderModal && !reminderModal.hidden)
        || !dispatcherModal.hidden
        || !accountantModal.hidden
        || (accountantEditModal && !accountantEditModal.hidden)
        || (accountantRegisterModal && !accountantRegisterModal.hidden)
        || (changePasswordModal && !changePasswordModal.hidden)
        || (confirmModal && !confirmModal.hidden)
        || !recycleModal.hidden
        || (devTodoModal && !devTodoModal.hidden)
        || (changeLogModal && !changeLogModal.hidden);
      document.body.classList.toggle("modal-open", hasOpenModal);
    }

    function setGlobalDevTodoStorageItem(value) {
      window.localStorage.setItem(STORAGE_KEY_DEV_TODO_ITEMS, value);
      window.sessionStorage.removeItem(STORAGE_KEY_DEV_TODO_ITEMS);
    }

    function getGlobalDevTodoStorageItem() {
      const raw = window.localStorage.getItem(STORAGE_KEY_DEV_TODO_ITEMS);
      if (raw !== null) return raw;
      const legacyRaw = window.sessionStorage.getItem(STORAGE_KEY_DEV_TODO_ITEMS);
      if (legacyRaw === null) return null;
      window.localStorage.setItem(STORAGE_KEY_DEV_TODO_ITEMS, legacyRaw);
      window.sessionStorage.removeItem(STORAGE_KEY_DEV_TODO_ITEMS);
      return legacyRaw;
    }

    function removeGlobalDevTodoStorageItem() {
      window.localStorage.removeItem(STORAGE_KEY_DEV_TODO_ITEMS);
      window.sessionStorage.removeItem(STORAGE_KEY_DEV_TODO_ITEMS);
    }

    function saveDevTodoItems() {
      if (!isDevTodoEnabled) return;
      const sanitizedItems = sanitizeDevTodoItems(devTodoItems);
      devTodoItems = sanitizedItems;
      if (sanitizedItems.length) {
        setGlobalDevTodoStorageItem(JSON.stringify(sanitizedItems));
      } else {
        removeGlobalDevTodoStorageItem();
      }
    }

    function loadDevTodoItems() {
      if (!isDevTodoEnabled) {
        devTodoItems = [];
        return;
      }
      const raw = String(getGlobalDevTodoStorageItem() || "").trim();
      if (!raw) {
        devTodoItems = [];
        return;
      }
      try {
        devTodoItems = sanitizeDevTodoItems(JSON.parse(raw));
      } catch {
        devTodoItems = [];
        removeGlobalDevTodoStorageItem();
      }
    }

    function addDevTodoItem(rawText) {
      if (!isDevTodoEnabled) return false;
      const text = normalizeDevTodoText(rawText);
      if (!text) return false;
      devTodoItems = [
        {
          id: createDevTodoId(),
          text,
          createdAt: getCurrentDateTimeString()
        },
        ...devTodoItems
      ];
      saveDevTodoItems();
      return true;
    }

    function removeDevTodoItemById(itemId) {
      if (!isDevTodoEnabled) return;
      const normalizedId = String(itemId || "").trim();
      if (!normalizedId) return;
      devTodoItems = devTodoItems.filter((item) => String(item?.id || "").trim() !== normalizedId);
      saveDevTodoItems();
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
        settlementPriceInput.value = (total * getSelectedAccountantSettlementRatioDecimal()).toFixed(2);
        settlementPriceAutoFilled = true;
      }
    }

    function getSelectedAccountantSettlementRatioDecimal() {
      return DEFAULT_EXISTING_ACCOUNTANT_SETTLEMENT_RATIO / 100;
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
      premiumHint.textContent = `溢价：${premium.toFixed(2)}`;
      premiumHint.classList.toggle("active", premium >= 0);
      premiumHint.classList.toggle("negative", premium < 0);
    }

    function syncNonSettlementPriceDefaults(accountantName) {
      if (!isNonSettlementAccountantName(accountantName)) return;
      totalPriceInput.value = "0";
      settlementPriceInput.value = "0";
      settlementPriceAutoFilled = false;
      clearInlineFieldError(totalPriceInput);
      clearInlineFieldError(settlementPriceInput);
      syncPremiumPriceFromPrices();
    }

    function syncSettlementPriceForAccountantRatio() {
      const totalRaw = String(totalPriceInput.value || "").trim();
      if (!totalRaw || !settlementPriceAutoFilled) return;
      const total = Number(totalRaw);
      if (!Number.isFinite(total)) return;
      settlementPriceInput.value = (total * getSelectedAccountantSettlementRatioDecimal()).toFixed(2);
    }

    function getRecordsRenderSignature(sourceRecords) {
      if (!Array.isArray(sourceRecords) || !sourceRecords.length) return "";
      return sourceRecords.map((item) => getRecordComparisonSignature(item)).join("\u0002");
    }

    async function fetchBuildInfo() {
      if (buildInfoPanel) {
        setRegionLoading(buildInfoPanel, true, "正在读取版本...");
        if (buildVersionText) buildVersionText.textContent = "版本读取中...";
        if (buildTimeText) buildTimeText.textContent = "Build 读取中...";
      }
      try {
        const buildInfoResponse = await fetch(API_ENDPOINT_BUILD_INFO, { cache: "no-store" });

        if (!buildInfoResponse.ok) {
          renderBuildInfo();
          return null;
        }

        const buildInfo = await buildInfoResponse.json();

        const buildInfoWithVersion = {
          ...buildInfo,
          version: String(buildInfo?.version || "").trim() || "1.0"
        };

        renderBuildInfo(buildInfoWithVersion);
        return buildInfoWithVersion;
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取版本信息失败，请稍后重试。", "error");
        renderBuildInfo();
        return null;
      } finally {
        setRegionLoading(buildInfoPanel, false);
      }
    }

    async function fetchRecords() {
      if (!hasAuthenticatedAccount()) return;
      const shouldRenderSkeleton = !hasFetchedRecords;
      const loadingMessage = shouldRenderSkeleton
        ? "正在读取订单记录..."
        : "正在刷新订单记录...";
      const requestStartedAt = Date.now();
      const getWaitingMessage = () => {
        const elapsedSeconds = Math.max(1, Math.floor((Date.now() - requestStartedAt) / 1000));
        return `records接口仍在等待，已加载 ${elapsedSeconds} 秒...`;
      };
      let waitingTimer = null;
      let waitingInterval = null;
      if (shouldRenderSkeleton) {
        renderTableLoadingState(loadingMessage);
      } else {
        setRegionLoading(mainTableWrap, true, loadingMessage);
      }
      waitingTimer = window.setTimeout(() => {
        setRegionLoading(mainTableWrap, true, getWaitingMessage());
        waitingInterval = window.setInterval(() => {
          setRegionLoading(mainTableWrap, true, getWaitingMessage());
        }, 1000);
      }, RECORDS_REQUEST_WAITING_MS);

      let payload;
      try {
        const response = await fetchWithClientLog(
          API_ENDPOINT_RECORDS,
          { cache: "no-store" },
          { successMessage: "刷新数据" }
        );
        if (!response.ok) {
          throw new Error(`读取数据失败（${response.status}）`);
        }
        payload = await response.json();
      } finally {
        if (waitingTimer) window.clearTimeout(waitingTimer);
        if (waitingInterval) window.clearInterval(waitingInterval);
        setRegionLoading(mainTableWrap, false);
      }
      const nextRecords = Array.isArray(payload.records) ? payload.records : [];
      const isSameRecords = getRecordsRenderSignature(nextRecords) === getRecordsRenderSignature(records);
      const shouldTrackRowChanges = hasFetchedRecords;
      const shouldSkipRender = hasFetchedRecords && isSameRecords;
      hasFetchedRecords = true;
      if (shouldSkipRender) {
        maybeShowInvoiceUploadReminder();
        return;
      }
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: shouldTrackRowChanges });
      syncAccountantAssignmentHighlights(nextRecords);
      records = nextRecords;
      syncAccountantsFromRecords();
      renderAccountantSelectOptions();
      renderTable();
      maybeShowInvoiceUploadReminder();
      if (recordHistoryModal && !recordHistoryModal.hidden) {
        const openRecordId = String(recordHistoryModal.dataset.recordId || "").trim();
        const activeRecord = nextRecords.find((item) => String(item?.id || "").trim() === openRecordId) || null;
        if (activeRecord) {
          renderRecordHistoryModalContent(activeRecord);
        } else {
          closeRecordHistoryModal();
        }
      }
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!dispatcherModal.hidden) {
        renderDispatcherList();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
      if (canCurrentAccountUseReminders()) {
        try {
          await fetchReminders();
        } catch (error) {
          console.error(error);
        }
      } else {
        reminders = [];
        updateReminderEntryButton();
      }
    }

    async function fetchRecycleBinRecords() {
      if (!hasAuthenticatedAccount()) return;
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
      if (!recycleModal.hidden) {
        renderRecycleBinTable();
        renderAccountantOperationLogs();
      }
    }

    async function fetchAccountantOperationLogs() {
      if (!hasAuthenticatedAccount()) return;
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
      if (!recycleModal.hidden) {
        renderAccountantOperationLogs();
      }
    }

    async function fetchReminders() {
      if (!hasAuthenticatedAccount() || !canCurrentAccountUseReminders()) return;
      const response = await fetchWithClientLog(
        API_ENDPOINT_REMINDERS,
        { cache: "no-store" },
        { successMessage: "读取提醒" }
      );
      if (!response.ok) {
        throw new Error(`读取提醒失败（${response.status}）`);
      }
      const payload = await response.json();
      reminders = Array.isArray(payload.reminders) ? payload.reminders : [];
      updateReminderEntryButton();
      if (reminderModal && !reminderModal.hidden) {
        renderReminderModalContent();
      }
    }

    async function createReminder(payload) {
      const response = await fetchWithClientLog(
        API_ENDPOINT_REMINDERS,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload || {})
        },
        { successMessage: "新建提醒", errorMessage: "新建提醒" }
      );
      if (!response.ok) {
        let message = `新建提醒失败（${response.status}）`;
        try {
          const body = await response.json();
          if (body.error) message = body.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }
      const body = await response.json();
      reminders = Array.isArray(body.reminders) ? body.reminders : reminders;
      updateReminderEntryButton();
      renderReminderModalContent();
    }

    async function deleteReminderById(reminderId) {
      const normalizedId = String(reminderId || "").trim();
      if (!normalizedId) return;
      const response = await fetchWithClientLog(
        `${API_ENDPOINT_REMINDERS}/${encodeURIComponent(normalizedId)}`,
        { method: "DELETE" },
        { successMessage: "删除提醒", errorMessage: "删除提醒" }
      );
      if (!response.ok) {
        let message = `删除提醒失败（${response.status}）`;
        try {
          const body = await response.json();
          if (body.error) message = body.error;
        } catch (error) {
          console.error(error);
        }
        throw new Error(message);
      }
      const body = await response.json();
      reminders = Array.isArray(body.reminders) ? body.reminders : reminders.filter((item) => String(item.id || "").trim() !== normalizedId);
      updateReminderEntryButton();
      renderReminderModalContent();
    }

    function getAccountantSearchTerms() {
      return String(accountantSearchInput?.value || "")
        .split(/\r?\n/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    }

    function getAccountantSearchFields(profile) {
      const invoiceRecipientInfo = normalizeInvoiceRecipientInfo(profile?.invoiceRecipientInfo);
      return [
        profile?.phone,
        profile?.username,
        profile?.displayName,
        profile?.alias,
        profile?.name,
        profile?.realName,
        invoiceRecipientInfo.name,
        invoiceRecipientInfo.declarationPhone,
        formatAccountantSettlementRatio(profile?.accountingSettlementRatio)
      ]
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean);
    }

    function doesAccountantMatchSearch(profile, terms) {
      if (!terms.length) return true;
      const fields = getAccountantSearchFields(profile);
      const compactFields = fields.map((item) => item.replace(/\s+/g, ""));
      return terms.some((term) => {
        const compactTerm = term.replace(/\s+/g, "");
        return fields.some((field) => field.includes(term))
          || compactFields.some((field) => field.includes(compactTerm));
      });
    }

    function renderAccountantList() {
      accountantList.innerHTML = "";
      const orderCountByAccountant = getAccountantOrderCountMap();
      const searchTerms = getAccountantSearchTerms();
      const filteredAccountants = accountants.filter((profile) => doesAccountantMatchSearch(profile, searchTerms));
      const showActionColumn = isBossLogin();
      if (accountantSearchClearBtn) {
        accountantSearchClearBtn.hidden = !searchTerms.length;
      }
      renderAccountantSortHeaderUI(filteredAccountants, orderCountByAccountant);
      const showRecipientColumn = !isDispatcherLogin() && filteredAccountants.some((profile) =>
        Object.values(normalizeInvoiceRecipientInfo(profile?.invoiceRecipientInfo)).every(Boolean)
      );
      const recipientHeader = document.querySelector(".accountant-col-recipient");
      if (recipientHeader) {
        recipientHeader.hidden = !showRecipientColumn;
      }
      const actionHeader = document.querySelector(".accountant-col-action");
      if (actionHeader) {
        actionHeader.hidden = !showActionColumn;
      }
      if (!accountants.length) {
        accountantEmptyState.textContent = "暂无会计资料。";
        accountantEmptyState.style.display = "block";
        return;
      }
      if (!filteredAccountants.length) {
        accountantEmptyState.textContent = "暂无匹配会计资料。";
        accountantEmptyState.style.display = "block";
        return;
      }
      accountantEmptyState.style.display = "none";

      const sortedProfiles = getSortedAccountantProfiles(filteredAccountants, orderCountByAccountant);

      sortedProfiles.forEach((profile) => {
        const setNodeText = (node, text, fallback = "—") => {
          const normalized = String(text || "").trim();
          node.textContent = normalized || fallback;
          node.title = normalized;
        };
        const formatRecipientLine = (label, value) => {
          const normalized = String(value || "").trim();
          return `${label}：${normalized || "—"}`;
        };
        const row = document.createElement("tr");
        row.className = "accountant-list-item";
        if (String(profile.username || profile.name || "").trim() === highlightedAccountantUsername) {
          row.classList.add("recently-created");
        }
        const usernameText = String(profile.username || profile.name || "").trim();
        const displayName = String(profile.displayName || profile.name || "").trim();
        const realName = String(profile.realName || "").trim();
        const phone = String(profile.phone || "").trim();
        const invoiceRecipientInfo = normalizeInvoiceRecipientInfo(profile.invoiceRecipientInfo);
        const settlementRatioText = formatAccountantSettlementRatio(profile.accountingSettlementRatio);
        const hasInvoiceRecipientInfo = Object.values(invoiceRecipientInfo).every(Boolean);
        const recipientSummary = hasInvoiceRecipientInfo
          ? [
              invoiceRecipientInfo.name || realName,
              invoiceRecipientInfo.bankName,
              invoiceRecipientInfo.bankCardNo,
              invoiceRecipientInfo.declarationPhone
            ]
              .map((item) => String(item || "").trim())
              .filter(Boolean)
              .join(" · ")
          : "";
        const orderCount = orderCountByAccountant.get(displayName) || 0;

        const displayNameCell = document.createElement("td");
        displayNameCell.className = "accountant-col-display";
        displayNameCell.dataset.label = "微信名";
        const displayNameSpan = document.createElement("span");
        displayNameSpan.className = "accountant-item-sub";
        setNodeText(displayNameSpan, displayName);
        displayNameCell.appendChild(displayNameSpan);

        const phoneCell = document.createElement("td");
        phoneCell.className = "accountant-col-phone";
        phoneCell.dataset.label = "手机号";
        setNodeText(phoneCell, phone);

        const passwordSpan = document.createElement("span");
        passwordSpan.className = "accountant-item-password";
        setNodeText(passwordSpan, profile.loginPassword);
        const passwordCell = document.createElement("td");
        passwordCell.className = "accountant-col-password";
        passwordCell.dataset.label = "密码";
        passwordCell.appendChild(passwordSpan);

        const settlementRatioCell = document.createElement("td");
        settlementRatioCell.className = "accountant-col-settlement-ratio";
        settlementRatioCell.dataset.label = "会计结算价比例";
        settlementRatioCell.textContent = settlementRatioText;
        settlementRatioCell.title = settlementRatioText;

        const countSpan = document.createElement("span");
        countSpan.className = "accountant-item-count";
        countSpan.textContent = `${orderCount} 单`;
        const countCell = document.createElement("td");
        countCell.className = "accountant-col-count";
        countCell.dataset.label = "单量";
        countCell.appendChild(countSpan);

        const recipientCell = document.createElement("td");
        recipientCell.className = "accountant-col-recipient";
        recipientCell.dataset.label = "结算申报信息";
        recipientCell.hidden = !showRecipientColumn;
        const recipientWrap = document.createElement("div");
        recipientWrap.className = "accountant-recipient-info";
        if (hasInvoiceRecipientInfo) {
          [
            formatRecipientLine("姓名", invoiceRecipientInfo.name || realName),
            formatRecipientLine("身份证号", invoiceRecipientInfo.idCardNo),
            formatRecipientLine("开户行", invoiceRecipientInfo.bankName),
            formatRecipientLine("银行卡号", invoiceRecipientInfo.bankCardNo),
            formatRecipientLine("申报手机号", invoiceRecipientInfo.declarationPhone)
          ].forEach((line) => {
            const item = document.createElement("span");
            item.className = "accountant-recipient-line";
            item.textContent = line;
            recipientWrap.appendChild(item);
          });
        } else {
          const empty = document.createElement("span");
          empty.className = "accountant-recipient-empty";
          empty.textContent = "未录入";
          recipientWrap.appendChild(empty);
        }
        recipientCell.appendChild(recipientWrap);
        recipientCell.title = recipientSummary || "未录入";

        row.appendChild(phoneCell);
        row.appendChild(passwordCell);
        row.appendChild(displayNameCell);
        row.appendChild(settlementRatioCell);
        if (showRecipientColumn) {
          row.appendChild(recipientCell);
        }
        row.appendChild(countCell);
        if (showActionColumn) {
          const actionLabel = displayName || phone || usernameText || "会计";
          const editBtn = document.createElement("button");
          editBtn.type = "button";
          editBtn.className = "accountant-action-btn accountant-edit-btn";
          editBtn.dataset.accountantUsername = usernameText;
          editBtn.dataset.accountantPhone = phone;
          editBtn.setAttribute("aria-label", `修改${actionLabel}`);
          editBtn.textContent = "修改";

          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "accountant-action-btn accountant-delete-btn";
          deleteBtn.dataset.accountantUsername = String(profile.username || profile.name || "").trim();
          deleteBtn.dataset.accountantPhone = phone;
          deleteBtn.dataset.accountantDisplayName = displayName;
          deleteBtn.dataset.relatedCount = String(orderCount);
          deleteBtn.disabled = orderCount > 0;
          deleteBtn.title = orderCount > 0 ? `当前有 ${orderCount} 条数据，暂不可删除` : "删除会计";
          deleteBtn.setAttribute(
            "aria-label",
            orderCount > 0 ? `${actionLabel}当前有 ${orderCount} 条数据，暂不可删除` : `删除${actionLabel}`
          );
          deleteBtn.textContent = "删除";
          const actionGroup = document.createElement("div");
          actionGroup.className = "accountant-action-group";
          actionGroup.setAttribute("aria-label", `${actionLabel}操作`);
          actionGroup.appendChild(editBtn);
          actionGroup.appendChild(deleteBtn);
          const actionCell = document.createElement("td");
          actionCell.className = "accountant-col-action";
          actionCell.dataset.label = "操作";
          actionCell.appendChild(actionGroup);
          row.appendChild(actionCell);
        }
        accountantList.appendChild(row);
      });
    }

    function getAccountantSortFieldValue(profile, key, orderCountByAccountant) {
      const displayName = String(profile?.displayName || profile?.name || "").trim();
      const realName = String(profile?.realName || "").trim();
      const phone = String(profile?.phone || "").trim();
      const password = String(profile?.loginPassword || "").trim();
      const settlementRatio = normalizeAccountantSettlementRatio(profile?.accountingSettlementRatio);
      const orderCount = orderCountByAccountant.get(displayName) || 0;
      const invoiceRecipientInfo = normalizeInvoiceRecipientInfo(profile?.invoiceRecipientInfo);
      const recipientText = [
        invoiceRecipientInfo.name || realName,
        invoiceRecipientInfo.idCardNo,
        invoiceRecipientInfo.bankName,
        invoiceRecipientInfo.bankCardNo,
        invoiceRecipientInfo.declarationPhone
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .join(" ");

      if (key === "displayName") return displayName;
      if (key === "phone") return phone;
      if (key === "password") return password;
      if (key === "accountingSettlementRatio") return settlementRatio;
      if (key === "recipient") return recipientText;
      if (key === "orderCount") return orderCount;
      if (key === "action") return orderCount > 0 ? 1 : 0;
      return displayName;
    }

    function compareAccountantSortValues(leftValue, rightValue) {
      const leftIsNumber = typeof leftValue === "number" && Number.isFinite(leftValue);
      const rightIsNumber = typeof rightValue === "number" && Number.isFinite(rightValue);
      if (leftIsNumber || rightIsNumber) {
        const safeLeft = leftIsNumber ? leftValue : Number.POSITIVE_INFINITY;
        const safeRight = rightIsNumber ? rightValue : Number.POSITIVE_INFINITY;
        if (safeLeft === safeRight) return 0;
        return safeLeft < safeRight ? -1 : 1;
      }

      const leftText = String(leftValue || "").trim();
      const rightText = String(rightValue || "").trim();
      if (!leftText && !rightText) return 0;
      if (!leftText) return 1;
      if (!rightText) return -1;
      return leftText.localeCompare(rightText, "zh-CN", { numeric: true, sensitivity: "base" });
    }

    function getSortedAccountantProfiles(sourceProfiles, orderCountByAccountant) {
      const directionFactor = accountantSortState.direction === "asc" ? 1 : -1;
      return [...sourceProfiles]
        .map((profile, index) => ({ profile, index }))
        .sort((left, right) => {
          const leftValue = getAccountantSortFieldValue(left.profile, accountantSortState.key, orderCountByAccountant);
          const rightValue = getAccountantSortFieldValue(right.profile, accountantSortState.key, orderCountByAccountant);
          const primaryCompare = compareAccountantSortValues(leftValue, rightValue);
          if (primaryCompare !== 0) return primaryCompare * directionFactor;

          const leftName = String(left.profile?.displayName || left.profile?.name || "").trim();
          const rightName = String(right.profile?.displayName || right.profile?.name || "").trim();
          const nameCompare = compareAccountantSortValues(leftName, rightName);
          if (nameCompare !== 0) return nameCompare;

          return left.index - right.index;
        })
        .map((entry) => entry.profile);
    }

    function renderAccountantSortHeaderUI(sourceProfiles = accountants, orderCountByAccountant = getAccountantOrderCountMap()) {
      const profileList = Array.isArray(sourceProfiles) ? sourceProfiles : [];
      const totalAccountantCount = profileList.length;
      const activeAccountantCount = profileList.reduce((count, profile) => {
        const displayName = String(profile?.displayName || profile?.name || "").trim();
        return count + ((orderCountByAccountant.get(displayName) || 0) > 0 ? 1 : 0);
      }, 0);
      const totalOrderCount = profileList.reduce((count, profile) => {
        const displayName = String(profile?.displayName || profile?.name || "").trim();
        return count + (orderCountByAccountant.get(displayName) || 0);
      }, 0);
      if (accountantModalAccountantCount) {
        accountantModalAccountantCount.textContent = `${activeAccountantCount}/${totalAccountantCount}`;
      }
      if (accountantModalOrderCount) {
        accountantModalOrderCount.textContent = `${totalOrderCount}单`;
      }
      accountantSortableHeaders.forEach((button) => {
        const key = String(button?.dataset?.key || "").trim();
        const label = String(button?.dataset?.label || "").trim();
        const active = key === accountantSortState.key;
        const arrow = active
          ? (accountantSortState.direction === "asc" ? " ↑" : " ↓")
          : "";
        button.classList.toggle("active", active);
        const labelNode = document.createElement("span");
        labelNode.className = "sort-btn-label";
        labelNode.textContent = `${label}${arrow}`;
        if (key === "displayName" || key === "orderCount") {
          const countNode = document.createElement("span");
          countNode.className = "accountant-sort-count";
          countNode.textContent = key === "displayName"
            ? `${activeAccountantCount}/${totalAccountantCount}`
            : `${totalOrderCount}单`;
          button.replaceChildren(labelNode, countNode);
        } else {
          button.replaceChildren(labelNode);
        }
      });
    }

    function toggleAccountantSort(key) {
      const normalizedKey = String(key || "").trim();
      if (!normalizedKey) return;
      if (accountantSortState.key === normalizedKey) {
        accountantSortState.direction = accountantSortState.direction === "asc" ? "desc" : "asc";
      } else {
        accountantSortState.key = normalizedKey;
        accountantSortState.direction = normalizedKey === "orderCount" ? "desc" : "asc";
      }
      renderAccountantList();
    }

    function compareDispatcherSortValues(leftValue, rightValue) {
      return compareDispatcherTags(leftValue, rightValue);
    }

    function renderDispatcherSortHeaderUI() {
      dispatcherSortableHeaders.forEach((button) => {
        const key = String(button?.dataset?.key || "").trim();
        const label = String(button?.dataset?.label || "").trim();
        const active = key === dispatcherSortState.key;
        const arrow = active
          ? (dispatcherSortState.direction === "asc" ? " ↑" : " ↓")
          : "";
        button.classList.toggle("active", active);
        const labelNode = document.createElement("span");
        labelNode.className = "sort-btn-label";
        labelNode.textContent = `${label}${arrow}`;
        button.replaceChildren(labelNode);
      });
    }

    function toggleDispatcherSort(key) {
      const normalizedKey = String(key || "").trim();
      if (!normalizedKey) return;
      if (dispatcherSortState.key === normalizedKey) {
        dispatcherSortState.direction = dispatcherSortState.direction === "asc" ? "desc" : "asc";
      } else {
        dispatcherSortState.key = normalizedKey;
        dispatcherSortState.direction = normalizedKey === "displayName" ? "asc" : "desc";
      }
      renderDispatcherList();
    }

    function renderDispatcherList() {
      renderDispatcherSortHeaderUI();
      dispatcherList.innerHTML = "";
      if (!dispatchers.length) {
        dispatcherEmptyState.style.display = "block";
        return;
      }
      dispatcherEmptyState.style.display = "none";

      const orderCountByAccountant = getAccountantOrderCountMap();
      const orderCountByDispatcher = records.reduce((map, item) => {
        const dispatcherTag = normalizeDispatcherTag(item?.dispatcher);
        if (!dispatcherTag) return map;
        map.set(dispatcherTag, (map.get(dispatcherTag) || 0) + 1);
        return map;
      }, new Map());

      const dispatcherRows = dispatchers.map((dispatcherProfile, index) => {
        const row = document.createElement("tr");
        row.className = "accountant-list-item";

        const displayName = String(dispatcherProfile.displayName || "").trim();
        const accountText = String(dispatcherProfile.accountLabel || dispatcherProfile.account || "").trim();
        const passwordText = String(dispatcherProfile.passwordLabel || dispatcherProfile.password || "").trim();
        const dispatcherTag = String(dispatcherProfile.dispatcherTag || "").trim();
        const orderCount = dispatcherTag
          ? (orderCountByDispatcher.get(dispatcherTag) || 0)
          : Number(dispatcherProfile.orderCount || 0);

        const displayCell = document.createElement("td");
        displayCell.className = "dispatcher-col-display";
        displayCell.dataset.label = "接待";
        const displaySpan = document.createElement("span");
        displaySpan.className = "accountant-item-sub";
        displaySpan.textContent = displayName || "—";
        displaySpan.title = displayName;
        displayCell.appendChild(displaySpan);

        const accountCell = document.createElement("td");
        accountCell.className = "dispatcher-col-account";
        accountCell.dataset.label = "账号";
        accountCell.textContent = accountText || "—";
        accountCell.title = accountText;

        const passwordCell = document.createElement("td");
        passwordCell.className = "dispatcher-col-password";
        passwordCell.dataset.label = "密码";
        const passwordSpan = document.createElement("span");
        passwordSpan.className = "accountant-item-password";
        passwordSpan.textContent = passwordText || "—";
        passwordSpan.title = passwordText;
        passwordCell.appendChild(passwordSpan);

        const linkedAccountant = getLinkedAccountantByTag(dispatcherTag);
        const linkedAccountantAlias = linkedAccountant
          ? (linkedAccountant.displayName || linkedAccountant.alias || linkedAccountant.name || "")
          : "";
        const linkedAccountantPhone = linkedAccountant ? (linkedAccountant.phone || "") : "";
        const linkedAccountantOrderCount = linkedAccountantAlias
          ? (orderCountByAccountant.get(linkedAccountantAlias) || 0)
          : 0;

        const linkedAccountantAliasCell = document.createElement("td");
        linkedAccountantAliasCell.className = "dispatcher-col-linked-accountant-alias";
        linkedAccountantAliasCell.dataset.label = "关联会计微信名";
        linkedAccountantAliasCell.textContent = linkedAccountantAlias || "—";
        linkedAccountantAliasCell.title = linkedAccountantAlias;

        const linkedAccountantPhoneCell = document.createElement("td");
        linkedAccountantPhoneCell.className = "dispatcher-col-linked-accountant-phone";
        linkedAccountantPhoneCell.dataset.label = "关联会计手机号";
        const linkedAccountantPhoneSpan = document.createElement("span");
        linkedAccountantPhoneSpan.className = "accountant-item-password";
        linkedAccountantPhoneSpan.textContent = linkedAccountantPhone || "—";
        linkedAccountantPhoneSpan.title = linkedAccountantPhone;
        linkedAccountantPhoneCell.appendChild(linkedAccountantPhoneSpan);

        const linkedAccountantCountCell = document.createElement("td");
        linkedAccountantCountCell.className = "dispatcher-col-accountant-count";
        linkedAccountantCountCell.dataset.label = "接单数";
        const linkedAccountantCountSpan = document.createElement("span");
        linkedAccountantCountSpan.className = "accountant-item-count";
        linkedAccountantCountSpan.textContent = `${linkedAccountantOrderCount} 单`;
        linkedAccountantCountCell.appendChild(linkedAccountantCountSpan);

        const countCell = document.createElement("td");
        countCell.className = "dispatcher-col-count";
        countCell.dataset.label = "派单数";
        const countSpan = document.createElement("span");
        countSpan.className = "accountant-item-count";
        countSpan.textContent = `${orderCount} 单`;
        countCell.appendChild(countSpan);

        row.appendChild(displayCell);
        row.appendChild(accountCell);
        row.appendChild(passwordCell);
        row.appendChild(linkedAccountantAliasCell);
        row.appendChild(linkedAccountantPhoneCell);
        row.appendChild(countCell);
        row.appendChild(linkedAccountantCountCell);

        return {
          row,
          index,
          dispatchCount: orderCount,
          accountantOrderCount: linkedAccountantOrderCount,
          displayName
        };
      });

      const directionFactor = dispatcherSortState.direction === "asc" ? 1 : -1;
      dispatcherRows
        .sort((left, right) => {
          const key = ["displayName", "accountantOrderCount"].includes(dispatcherSortState.key)
            ? dispatcherSortState.key
            : "dispatchCount";
          const primaryCompare = key === "displayName"
            ? compareDispatcherSortValues(left.displayName, right.displayName)
            : compareAccountantSortValues(left[key], right[key]);
          if (primaryCompare !== 0) return primaryCompare * directionFactor;
          const nameCompare = compareDispatcherSortValues(left.displayName, right.displayName);
          if (nameCompare !== 0) return nameCompare;
          return left.index - right.index;
        })
        .forEach((entry) => {
          dispatcherList.appendChild(entry.row);
        });
    }

    function syncAccountantsFromRecords() {
      const accountantNamesFromRecords = records.map((item) => String(item.accountant || "").trim());
      accountants = mergeAccountantProfiles(accountants, accountantNamesFromRecords);
    }

    function setAccountantPickerValue(value) {
      const normalizedValue = String(value || "").trim();
      accountantInput.value = normalizedValue;
      accountantPicker.classList.toggle("non-settlement-selected", isNonSettlementAccountantName(normalizedValue));
      if (normalizedValue) {
        accountantPickerValue.textContent = normalizedValue;
        accountantPickerValue.classList.remove("placeholder");
        syncNonSettlementPriceDefaults(normalizedValue);
        return;
      }
      accountantPickerValue.textContent = "";
      accountantPickerValue.classList.add("placeholder");
    }

    function setSourcePickerValue(value, options = {}) {
      const normalizedValue = String(value || "").trim();
      const hasExplicitAutoFilled = Object.prototype.hasOwnProperty.call(options, "autoFilled");
      if (hasExplicitAutoFilled) {
        sourcePickerAutoFilled = Boolean(options.autoFilled && normalizedValue);
      } else if (!normalizedValue) {
        sourcePickerAutoFilled = false;
      }
      sourceInput.value = normalizedValue;
      if (normalizedValue) {
        sourcePickerValue.textContent = normalizedValue;
        sourcePickerValue.classList.remove("placeholder");
        return;
      }
      sourcePickerValue.textContent = "";
      sourcePickerValue.classList.add("placeholder");
    }

    function getAutoSourceValueForPlatformShopOption(option) {
      const explicitSource = String(option?.source || "").trim();
      if (explicitSource && SOURCE_OPTIONS.includes(explicitSource)) {
        return explicitSource;
      }
      const platformValue = String(option?.platform || "").trim();
      if (platformValue && SOURCE_OPTIONS.includes(platformValue)) {
        return platformValue;
      }
      return "";
    }

    function syncSourcePickerFromPlatformShopOption(option) {
      const currentSourceValue = String(sourceInput.value || "").trim();
      const nextSourceValue = getAutoSourceValueForPlatformShopOption(option);
      if (currentSourceValue && !sourcePickerAutoFilled) return;
      if (!nextSourceValue) {
        if (sourcePickerAutoFilled) {
          setSourcePickerValue("", { autoFilled: false });
          if (!sourcePickerDropdown.hidden) {
            renderSourcePickerList();
          }
        }
        return;
      }
      setSourcePickerValue(nextSourceValue, { autoFilled: true });
      clearInlineFieldError(sourcePickerTrigger);
      if (recordForm && !recordForm.querySelector(".field-validation-group-error")) {
        setRecordFormHint("", "idle");
      }
      if (!sourcePickerDropdown.hidden) {
        renderSourcePickerList();
      }
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
      if (!normalizedPlatform && !normalizedShopName) return "";
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
        syncSourcePickerFromPlatformShopOption(matchedOption);
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
        : normalizedPlatform || normalizedShopName;
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
        const isBuiltInOption = isBuiltInAccountantName(name);
        const optionBtn = document.createElement("button");
        optionBtn.type = "button";
        optionBtn.className = "accountant-picker-option";
        optionBtn.dataset.value = name;
        optionBtn.setAttribute("role", "option");
        if (isBuiltInOption) {
          optionBtn.classList.add("non-settlement");
          optionBtn.title = "内置会计选项";
        }
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

        if (isBuiltInOption) {
          const systemBadge = document.createElement("span");
          systemBadge.className = "accountant-picker-option-badge non-settlement-badge";
          systemBadge.textContent = "内置";
          rightMeta.appendChild(systemBadge);
        }

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
      const groupedOptions = new Map();
      filteredOptions.forEach((item) => {
        const groupName = String(item.platform || "其他").trim() || "其他";
        if (!groupedOptions.has(groupName)) groupedOptions.set(groupName, []);
        groupedOptions.get(groupName).push(item);
      });

      ["闲鱼", "淘宝", "拼多多", "中信银行", "企业微信", "其他"].forEach((groupName) => {
        const groupItems = groupedOptions.get(groupName) || [];
        if (!groupItems.length) return;

        const groupEl = document.createElement("div");
        groupEl.className = "platform-shop-picker-group";
        groupEl.dataset.group = groupName;

        const groupTitle = document.createElement("div");
        groupTitle.className = "platform-shop-picker-group-title";
        groupTitle.textContent = groupName;
        groupEl.appendChild(groupTitle);

        const groupOptions = document.createElement("div");
        groupOptions.className = "platform-shop-picker-group-options";

        groupItems.forEach((item) => {
          const optionBtn = document.createElement("button");
          optionBtn.type = "button";
          optionBtn.className = "accountant-picker-option platform-shop-picker-option";
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

          groupOptions.appendChild(optionBtn);
        });

        groupEl.appendChild(groupOptions);
        platformShopPickerList.appendChild(groupEl);
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
        : withBuiltInAccountantOptions(getOrderSortedAccountantNames(
            accountants.map((item) => String(item.displayName || item.name || "").trim()),
            orderCountByAccountant
          ));
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

      setSourcePickerValue(nextValue, { autoFilled: nextValue ? sourcePickerAutoFilled : false });
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
      if (normalizeLoginRole(currentAccountRole) === "accountant") {
        const previousPhone = String(currentAccountPhone || "").trim();
        const displayName = getAccountantDisplayNameByLoginName(currentAccount);
        const normalizedDisplayName = String(displayName || "").trim();
        const realName = getCurrentAccountantRealName();
        const normalizedRealName = String(realName || "").trim();
        const phone = getCurrentAccountantLoginPhone();
        const normalizedPhone = String(phone || "").trim();
        let shouldPersistAccountSnapshot = false;
        if (normalizedDisplayName && normalizedDisplayName !== currentAccountDisplayName) {
          currentAccountDisplayName = normalizedDisplayName;
          shouldPersistAccountSnapshot = true;
        }
        if (normalizedRealName && normalizedRealName !== currentAccountRealName) {
          currentAccountRealName = normalizedRealName;
          shouldPersistAccountSnapshot = true;
        }
        if (normalizedPhone && normalizedPhone !== currentAccountPhone) {
          currentAccountPhone = normalizedPhone;
          shouldPersistAccountSnapshot = true;
        }
        if (currentLoginAccount && previousPhone && currentLoginAccount === previousPhone && normalizedPhone && normalizedPhone !== currentLoginAccount) {
          currentLoginAccount = normalizedPhone;
          shouldPersistAccountSnapshot = true;
        }
        if (shouldPersistAccountSnapshot) {
          saveToStorage();
          setPageMode(hasAuthenticatedAccount());
        }
      }
      syncAccountantsFromRecords();
      persistSavedLoginEntries();
      renderAccountantList();
      renderAccountantSelectOptions();
      renderSourcePickerOptions();
      renderPlatformShopPickerOptions();
    }

    async function fetchDispatchers() {
      if (!hasAuthenticatedAccount()) return;
      const response = await fetchWithClientLog(
        API_ENDPOINT_DISPATCHERS,
        { cache: "no-store" },
        { successMessage: "读取接待列表" }
      );
      if (!response.ok) {
        throw new Error(`读取接待列表失败（${response.status}）`);
      }
      const payload = await response.json();
      dispatchers = Array.isArray(payload.dispatchers) ? payload.dispatchers : [];
      dispatcherAccountantMappings =
        payload.dispatcherAccountantMappings && typeof payload.dispatcherAccountantMappings === "object"
          ? payload.dispatcherAccountantMappings
          : {};
      linkedDispatcherAccountants =
        payload.linkedDispatcherAccountants && typeof payload.linkedDispatcherAccountants === "object"
          ? payload.linkedDispatcherAccountants
          : {};
      if (!dispatcherModal.hidden) {
        renderDispatcherList();
      }
      renderTable();
    }

    async function triggerForceRefreshForAccountantPages() {
      const response = await fetchWithClientLog(
        API_ENDPOINT_FORCE_REFRESH,
        {
          method: "POST"
        },
        { successMessage: "强制刷新会计页面" }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || `强制刷新失败（${response.status}）`);
      }
      return response.json();
    }

    async function fetchAccountants() {
      if (!hasAuthenticatedAccount()) return;
      await fetchAccountantsForLogin();
      validateCurrentAccount();
    }

    async function verifyLoginByServer(account, password, options = {}) {
      const { silent = false } = options;
      if (!silent) {
        setLoginRequestHint("登录验证中...", "pending");
      }
      const response = await fetchWithClientLog(API_ENDPOINT_AUTH_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password })
      }, {
        skipAuth: true
      });
      if (!response.ok) {
        let message = "登录标识或密码错误。";
        try {
          const payload = await response.json();
          if (payload.error) {
            message = payload.error;
          }
        } catch (error) {
          console.error(error);
        }
        if (!silent) {
          setLoginRequestHint(message, "error");
        }
        throw new Error(message);
      }
      const payload = await response.json();
      if (!silent) {
        setLoginRequestHint("登录成功", "ok");
      }
      return payload;
    }

    async function registerAccountantProfile(profile) {
      const response = await fetchWithClientLog(API_ENDPOINT_AUTH_ACCOUNTANT_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      }, {
        skipAuth: true
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
      const createdProfile = payload?.accountant ? normalizeAccountantProfile(payload.accountant) : null;
      if (createdProfile) {
        highlightedAccountantUsername = String(createdProfile.username || createdProfile.name || "").trim();
        accountants = mergeAccountantProfiles([...accountants, createdProfile]);
        syncAccountantsFromRecords();
        renderAccountantList();
        renderAccountantSelectOptions();
      }
      return payload;
    }

    async function updateAccountantProfile(originalUsername, profile) {
      const previousLoginAccount = getAccountantLoginIdentifier(originalUsername);
      const response = await fetchWithClientLog(`${API_ENDPOINT_ACCOUNTANTS}/${encodeURIComponent(originalUsername)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      }, {
        successMessage: "修改会计资料",
        errorMessage: "修改会计资料"
      });

      if (!response.ok) {
        let message = `修改会计资料失败（${response.status}）`;
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
      const nextRecords = Array.isArray(payload.records) ? payload.records : records;
      accountants = mergeAccountantProfiles(nextAccountants);
      highlightedAccountantUsername = String(payload?.accountant?.username || profile?.username || originalUsername || "").trim();
      if (profile && typeof profile === "object" && Object.prototype.hasOwnProperty.call(profile, "password")) {
        const nextLoginAccount = String(
          payload?.accountant?.phone
          || getAccountantLoginIdentifier(String(payload?.accountant?.username || originalUsername || "").trim())
          || originalUsername
        ).trim();
        updateSavedLoginPassword(
          nextLoginAccount,
          String(profile.password || "").trim(),
          "accountant"
        );
        if (previousLoginAccount && previousLoginAccount !== nextLoginAccount) {
          removeSavedLoginEntry(previousLoginAccount);
        }
      }
      if (normalizeLoginRole(currentAccountRole) === "accountant" && String(currentAccount || "").trim() === String(originalUsername || "").trim()) {
        const nextCurrentProfile = normalizeAccountantProfile(payload?.accountant);
        if (nextCurrentProfile) {
          const previousCanonicalAccount = String(currentAccount || "").trim();
          const previousPhone = String(currentAccountPhone || "").trim();
          const usedPhoneLogin = Boolean(currentLoginAccount && previousPhone && currentLoginAccount === previousPhone);
          const usedUsernameLogin = String(currentLoginAccount || "").trim() === previousCanonicalAccount;
          currentAccount = String(nextCurrentProfile.username || previousCanonicalAccount).trim();
          currentAccountDisplayName = String(nextCurrentProfile.displayName || nextCurrentProfile.name || currentAccountDisplayName || currentAccount).trim();
          currentAccountRealName = String(nextCurrentProfile.realName || currentAccountRealName || "").trim();
          currentAccountPhone = String(nextCurrentProfile.phone || currentAccountPhone || "").trim();
          if (usedPhoneLogin && currentAccountPhone) {
            currentLoginAccount = currentAccountPhone;
          } else if (usedUsernameLogin && currentAccount) {
            currentLoginAccount = currentAccount;
          }
          saveToStorage();
        }
      }
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: true });
      records = nextRecords;
      {
        const previousDisplayName = String(payload.previousDisplayName || "").trim();
        const nextDisplayName = String(payload.nextDisplayName || "").trim();
        if (previousDisplayName && nextDisplayName) {
          setAccountantFilterValues(
            getSelectedAccountantFilters().map((value) => (
              value === previousDisplayName ? nextDisplayName : value
            ))
          );
        }
      }
      syncAccountantsFromRecords();
      renderAccountantList();
      renderAccountantSelectOptions();
      setPageMode(hasAuthenticatedAccount());
      renderTable();
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
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
      {
        const deletedDisplayName = String(payload.deletedDisplayName || "").trim();
        if (deletedDisplayName) {
          setAccountantFilterValues(
            getSelectedAccountantFilters().filter((value) => value !== deletedDisplayName)
          );
        }
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
      updateSavedLoginPassword(
        String(payload?.accountant?.phone || getAccountantLoginIdentifier(accountantUsername) || accountantUsername).trim(),
        newPassword,
        "accountant"
      );
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
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: false });
      records = nextRecords;
      resetTableViewToDefault();
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

    async function settleRecordsByIds(recordIds) {
      const normalizedRecordIds = Array.from(
        new Set(
          (Array.isArray(recordIds) ? recordIds : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );
      if (!normalizedRecordIds.length) {
        throw new Error("请选择要结算的数据。");
      }

      const response = await fetchWithClientLog(API_ENDPOINT_RECORDS_SETTLE, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds: normalizedRecordIds })
      }, {
        successMessage: "批量结算",
        errorMessage: "批量结算"
      });

      if (!response.ok) {
        let message = `结算失败（${response.status}）`;
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
      clearBossRecordSelection();
      clearBossSettlementPayoutSelection();
      renderTable();
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }

      return {
        settledRecordIds: Array.isArray(body.settledRecordIds) ? body.settledRecordIds : [],
        skippedRecordIds: Array.isArray(body.skippedRecordIds) ? body.skippedRecordIds : []
      };
    }

    async function revokeSettlementByIds(recordIds) {
      const normalizedRecordIds = Array.from(
        new Set(
          (Array.isArray(recordIds) ? recordIds : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );
      if (!normalizedRecordIds.length) {
        throw new Error("请选择要撤销核对的数据。");
      }

      const response = await fetchWithClientLog(API_ENDPOINT_RECORDS_SETTLE_REVOKE, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds: normalizedRecordIds })
      }, {
        successMessage: "撤销核对",
        errorMessage: "撤销核对"
      });

      if (!response.ok) {
        let message = `撤销核对失败（${response.status}）`;
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
      clearBossRecordSelection();
      clearBossSettlementPayoutSelection();
      renderTable();
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }

      return {
        revokedRecordIds: Array.isArray(body.revokedRecordIds) ? body.revokedRecordIds : [],
        skippedRecordIds: Array.isArray(body.skippedRecordIds) ? body.skippedRecordIds : []
      };
    }

    async function uploadSettlementInvoice(payload) {
      const source = payload && typeof payload === "object" ? payload : {};
      const response = await fetchWithClientLog(API_ENDPOINT_RECORDS_INVOICE, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: source.image || source.invoiceImage || source.settlementInvoiceImage || source,
          invoiceRecipientInfo: source.invoiceRecipientInfo || source.recipientInfo || {},
          replaceRecordIds: Array.isArray(source.replaceRecordIds) ? source.replaceRecordIds : []
        })
      }, {
        successMessage: "上传发票",
        errorMessage: "上传发票"
      });

      if (!response.ok) {
        let message = `发票上传失败（${response.status}）`;
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
      return {
        uploadedRecordIds: Array.isArray(body.uploadedRecordIds) ? body.uploadedRecordIds : [],
        invoiceImage: body.invoiceImage || null
      };
    }

    async function payoutSettlementRecordsByIds(recordIds) {
      const normalizedPayoutTargets = Array.from(
        new Set(
          (Array.isArray(recordIds) ? recordIds : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );
      if (!normalizedPayoutTargets.length) {
        throw new Error("请选择要打款的数据。");
      }

      const response = await fetchWithClientLog(API_ENDPOINT_RECORDS_PAYOUT, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds: normalizedPayoutTargets, payoutTargets: normalizedPayoutTargets })
      }, {
        successMessage: "打款",
        errorMessage: "打款"
      });

      if (!response.ok) {
        let message = `打款失败（${response.status}）`;
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
      syncBossSettlementPayoutSelection(records);
      renderTable();
      if (bossSettlementDetailModal && !bossSettlementDetailModal.hidden) {
        renderBossSettlementDetailModalContent();
      }
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
      return {
        paidRecordIds: Array.isArray(body.paidRecordIds) ? body.paidRecordIds : [],
        skippedRecordIds: Array.isArray(body.skippedRecordIds) ? body.skippedRecordIds : []
      };
    }

    async function revokeSettlementPayoutByIds(recordIds) {
      const normalizedPayoutTargets = Array.from(
        new Set(
          (Array.isArray(recordIds) ? recordIds : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );
      if (!normalizedPayoutTargets.length) {
        throw new Error("请选择要撤销打款的数据。");
      }

      const response = await fetchWithClientLog(API_ENDPOINT_RECORDS_PAYOUT_REVOKE, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds: normalizedPayoutTargets, payoutTargets: normalizedPayoutTargets })
      }, {
        successMessage: "撤销打款",
        errorMessage: "撤销打款"
      });

      if (!response.ok) {
        let message = `撤销打款失败（${response.status}）`;
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
      syncBossSettlementPayoutSelection(records);
      renderTable();
      if (bossSettlementDetailModal && !bossSettlementDetailModal.hidden) {
        renderBossSettlementDetailModalContent();
      }
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
      return {
        revokedRecordIds: Array.isArray(body.revokedRecordIds) ? body.revokedRecordIds : [],
        skippedRecordIds: Array.isArray(body.skippedRecordIds) ? body.skippedRecordIds : []
      };
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
        : (targetStatus === "returned" ? "会计退单" : "会计确认");
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

    async function restoreRecycleBinRecordById(recycleId) {
      const response = await fetchWithClientLog(
        `${API_ENDPOINT_RECYCLE_BIN}/${encodeURIComponent(recycleId)}/restore`,
        { method: "POST" }
      );

      if (!response.ok) {
        let message = `还原失败（${response.status}）`;
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
      const nextRecycleBinRecords = Array.isArray(payload.recycleBinRecords)
        ? payload.recycleBinRecords
        : recycleBinRecords;
      syncUpdatedRowHighlightState(records, nextRecords, { trackChanges: false });
      records = nextRecords;
      recycleBinRecords = nextRecycleBinRecords;
      syncAccountantsFromRecords();
      renderAccountantSelectOptions();
      renderTable();
      renderRecycleBinTable();
      if (!analysisModal.hidden) {
        renderAnalysisPanel();
      }
      if (!accountantModal.hidden) {
        renderAccountantList();
      }
    }

    function saveToStorage() {
      setAuthStateItem(STORAGE_KEY_ACCOUNT, currentAccount);
      setAuthStateItem(STORAGE_KEY_ACCOUNT_ROLE, normalizeLoginRole(currentAccountRole));
      if (normalizeLoginRole(currentAccountRole) === "accountant" && currentAccountDisplayName) {
        setAuthStateItem(STORAGE_KEY_ACCOUNT_DISPLAY_NAME, currentAccountDisplayName);
      } else {
        removeAuthStateItem(STORAGE_KEY_ACCOUNT_DISPLAY_NAME);
      }
      if (normalizeLoginRole(currentAccountRole) === "accountant" && currentAccountRealName) {
        setAuthStateItem(STORAGE_KEY_ACCOUNT_REAL_NAME, currentAccountRealName);
      } else {
        removeAuthStateItem(STORAGE_KEY_ACCOUNT_REAL_NAME);
      }
      if (normalizeLoginRole(currentAccountRole) === "accountant" && currentAccountPhone) {
        setAuthStateItem(STORAGE_KEY_ACCOUNT_PHONE, currentAccountPhone);
      } else {
        removeAuthStateItem(STORAGE_KEY_ACCOUNT_PHONE);
      }
      if (currentLoginAccount) {
        setAuthStateItem(STORAGE_KEY_LOGIN_ACCOUNT, currentLoginAccount);
      } else {
        removeAuthStateItem(STORAGE_KEY_LOGIN_ACCOUNT);
      }
    }

    function persistSavedLoginEntries() {
      if (isQuickLoginDebugEnabled) {
        renderSavedLoginList();
        return;
      }
      if (!isQuickLoginEnabled) {
        savedLoginEntries = [];
        renderSavedLoginList();
        return;
      }
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
        setPersistentStateItem(STORAGE_KEY_SAVED_LOGINS, JSON.stringify(sanitizedEntries));
      } else {
        removePersistentStateItem(STORAGE_KEY_SAVED_LOGINS);
      }
      renderSavedLoginList();
    }

    async function fetchDebugQuickLoginEntries() {
      const response = await fetchWithClientLog(
        API_ENDPOINT_AUTH_QUICK_LOGINS,
        { cache: "no-store" },
        { skipAuth: true }
      );
      if (!response.ok) {
        throw new Error(`读取快捷登录列表失败（${response.status}）`);
      }
      const payload = await response.json();
      const source = Array.isArray(payload.quickLogins) ? payload.quickLogins : [];
      savedLoginEntries = source.map((entry) => {
        const normalized = normalizeSavedLoginEntry(entry);
        const role = normalizeLoginRole(entry?.role);
        return normalized && role ? { ...normalized, role } : normalized;
      }).filter(Boolean);
      renderSavedLoginList();
    }

    async function loadSavedLoginEntries() {
      if (!isQuickLoginEnabled) {
        savedLoginEntries = [];
        renderSavedLoginList();
        return;
      }
      if (isQuickLoginDebugEnabled) {
        try {
          await fetchDebugQuickLoginEntries();
        } catch (error) {
          console.error(error);
          savedLoginEntries = [];
          renderSavedLoginList();
          setLoginRequestHint(error.message || "读取快捷登录列表失败。", "error");
        }
        return;
      }
      const raw = String(getPersistentStateItem(STORAGE_KEY_SAVED_LOGINS) || "").trim();
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
      if (isQuickLoginDebugEnabled) return;
      if (!isQuickLoginEnabled) return;
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
      if (isQuickLoginDebugEnabled) return;
      if (!isQuickLoginEnabled) return;
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

    function removeSavedLoginEntry(accountName) {
      if (isQuickLoginDebugEnabled) return;
      if (!isQuickLoginEnabled) return;
      const entryKey = getSavedLoginEntryKey(accountName);
      if (!entryKey) return;
      savedLoginEntries = (Array.isArray(savedLoginEntries) ? savedLoginEntries : [])
        .filter((entry) => getSavedLoginEntryKey(entry.account) !== entryKey);
      persistSavedLoginEntries();
    }

    function loadFromStorage() {
      const storedAccount = String(getAuthStateItem(STORAGE_KEY_ACCOUNT) || "").trim();
      const storedLoginAccount = String(getAuthStateItem(STORAGE_KEY_LOGIN_ACCOUNT) || "").trim();
      const storedDisplayName = String(getAuthStateItem(STORAGE_KEY_ACCOUNT_DISPLAY_NAME) || "").trim();
      const storedRealName = String(getAuthStateItem(STORAGE_KEY_ACCOUNT_REAL_NAME) || "").trim();
      const storedPhone = String(getAuthStateItem(STORAGE_KEY_ACCOUNT_PHONE) || "").trim();
      let storedRole = normalizeLoginRole(getAuthStateItem(STORAGE_KEY_ACCOUNT_ROLE));
      if (!storedRole && storedAccount) {
        storedRole = inferRoleByAccountName(storedAccount);
      }
      if ((storedAccount && !storedLoginAccount) || (!storedAccount && storedLoginAccount)) {
        clearCurrentAccountIdentity();
        saveToStorage();
        return;
      }
      const normalizedAccount = storedRole === "dispatcher" || storedRole === "boss"
        ? resolveLoginAccountInput(storedAccount)
        : storedAccount;
      currentAccount = String(normalizedAccount || "").trim();
      currentAccountRole = storedRole;
      currentAccountDisplayName = storedRole === "accountant" ? storedDisplayName : "";
      currentAccountRealName = storedRole === "accountant" ? storedRealName : "";
      currentAccountPhone = storedRole === "accountant" ? storedPhone : "";
      currentLoginAccount = storedLoginAccount;
      ensureForceRefreshSubscription();
      if ((storedRole === "dispatcher" || storedRole === "boss") && storedAccount && currentAccount && storedAccount !== currentAccount) {
        saveToStorage();
      }
      loadUpdatedRowDismissState();
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
          direction: sortState.direction,
          premiumMode: sortState.premiumMode,
          settlementMode: sortState.settlementMode
        },
        filter: {
          month: filterState.month,
          dateStart: filterState.dateStart,
          dateEnd: filterState.dateEnd,
          completedAtMonth: filterState.completedAtMonth,
          completedAtStart: filterState.completedAtStart,
          completedAtEnd: filterState.completedAtEnd,
          dispatcher: getSelectedDispatcherFilters(),
          orderNo: filterState.orderNo,
          accountant: getSelectedAccountantFilters(),
          settlementRatio: filterState.settlementRatio,
          customer: filterState.customer,
          summary: filterState.summary,
          remark: filterState.remark,
          platform: filterState.platform,
          shopName: filterState.shopName,
          source: filterState.source,
          monthlySettlement: filterState.monthlySettlement,
          status: getSelectedStatusFilters(),
          settled: ""
        },
        layout: {
          sidebarCollapsed: isSidebarCollapsed,
          tableColumns: normalizeTableColumnVisibilityState(tableColumnVisibilityState)
        }
      };
      setPersistentStateItem(STORAGE_KEY_VIEW_STATE, JSON.stringify(payload));
    }

    function loadViewState() {
      const raw = getPersistentStateItem(STORAGE_KEY_VIEW_STATE);
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
        const persistedPremiumMode = String(parsed?.sort?.premiumMode || "").trim();
        const persistedSettlementMode = String(parsed?.sort?.settlementMode || "").trim();
        const persistedMonth = normalizeDateShortcutFilterValues(parsedFilter.month);
        const persistedDateStart = String(parsedFilter.dateStart || "").trim();
        const persistedDateEnd = String(parsedFilter.dateEnd || "").trim();
        const persistedCompletedAtMonth = normalizeDateShortcutFilterValues(parsedFilter.completedAtMonth);
        const persistedCompletedAtStart = String(parsedFilter.completedAtStart || "").trim();
        const persistedCompletedAtEnd = String(parsedFilter.completedAtEnd || "").trim();
        const persistedDispatcher = normalizeDispatcherFilterValues(parsedFilter.dispatcher);
        const persistedOrderNo = String(parsedFilter.orderNo || "").trim();
        const persistedAccountant = normalizeAccountantFilterValues(parsedFilter.accountant);
        const persistedSettlementRatio = String(parsedFilter.settlementRatio || "").trim();
        const persistedCustomer = String(parsedFilter.customer || "").trim();
        const persistedSummary = String(parsedFilter.summary || "").trim();
        const persistedRemark = String(parsedFilter.remark || "").trim();
        const persistedPlatform = String(parsedFilter.platform || "").trim();
        const persistedShopName = String(parsedFilter.shopName || "").trim();
        const persistedSource = String(parsedFilter.source || "").trim();
        const persistedMonthlySettlement = String(parsedFilter.monthlySettlement || "").trim();
        const persistedStatus = normalizeStatusFilterValues(parsedFilter.status);
        const persistedSettled = "";
        const persistedSidebarCollapsed = Boolean(parsed?.layout?.sidebarCollapsed);
        const persistedTableColumns = normalizeTableColumnVisibilityState(parsed?.layout?.tableColumns);

        if (allowedSortKeys.has(persistedSortKey)) {
          sortState.key = persistedSortKey;
        }
        if (persistedSortDirection === "asc" || persistedSortDirection === "desc") {
          sortState.direction = persistedSortDirection;
        }
        if (persistedPremiumMode === "amount" || persistedPremiumMode === "percent") {
          sortState.premiumMode = persistedPremiumMode;
        }
        if (persistedSettlementMode === "amount" || persistedSettlementMode === "percent") {
          sortState.settlementMode = persistedSettlementMode;
        }

        const normalizedDateRange = typeof getNormalizedDateRangeFilter === "function"
          ? getNormalizedDateRangeFilter(persistedDateStart, persistedDateEnd)
          : { start: persistedDateStart, end: persistedDateEnd };
        setDateShortcutFilterValues(persistedMonth);
        filterState.dateStart = normalizedDateRange.start;
        filterState.dateEnd = normalizedDateRange.end;
        const normalizedCompletedAtRange = typeof getNormalizedDateRangeFilter === "function"
          ? getNormalizedDateRangeFilter(persistedCompletedAtStart, persistedCompletedAtEnd)
          : { start: persistedCompletedAtStart, end: persistedCompletedAtEnd };
        setCompletedAtShortcutFilterValues(persistedCompletedAtMonth);
        filterState.completedAtStart = normalizedCompletedAtRange.start;
        filterState.completedAtEnd = normalizedCompletedAtRange.end;
        setDispatcherFilterValues(persistedDispatcher);
        filterState.orderNo = persistedOrderNo;
        if (filterOrderInput) filterOrderInput.value = persistedOrderNo || "";
        setAccountantFilterValues(persistedAccountant);
        filterState.settlementRatio = persistedSettlementRatio === SETTLEMENT_RATIO_NON_50_FILTER
          ? persistedSettlementRatio
          : "";
        filterState.customer = persistedCustomer;
        filterState.summary = persistedSummary;
        filterState.remark = persistedRemark;
        if (filterCustomerInput) filterCustomerInput.value = persistedCustomer || "";
        if (filterSummaryInput) filterSummaryInput.value = persistedSummary || "";
        if (filterRemarkInput) filterRemarkInput.value = persistedRemark || "";
        filterState.platform = persistedPlatform;
        filterState.shopName = persistedShopName;
        filterState.source = persistedSource;
        filterState.monthlySettlement = ["是", "否"].includes(persistedMonthlySettlement)
          ? persistedMonthlySettlement
          : "";
        setStatusFilterValues(persistedStatus);
        filterState.settled = persistedSettled;
        setSidebarCollapsed(persistedSidebarCollapsed);
        setTableColumnVisibilityState(persistedTableColumns);
        setSettlementScheduleCollapsed(false);
      } catch (error) {
        console.error(error);
        hasDispatcherFilterPreference = false;
        setSidebarCollapsed(false);
        setSettlementScheduleCollapsed(false);
      }
    }
