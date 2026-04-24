// UI Flow: recycle/accountant/check/create modals, page mode switching, auth flow, table rendering.
    function renderRecycleBinTable() {
      recycleTableBody.innerHTML = "";
      const scopedRecycleRecords = getVisibleRecycleBinRecords();
      if (!scopedRecycleRecords.length) {
        recycleEmptyState.style.display = "block";
        return;
      }

      recycleEmptyState.style.display = "none";
      scopedRecycleRecords.forEach((entry) => {
        const record = entry && typeof entry === "object" ? (entry.record || {}) : {};
        const tr = document.createElement("tr");
        const values = [
          formatDateTimeDisplay(entry.deletedAt),
          String(entry.deletedBy || "未知账号"),
          formatDateDisplay(record.date),
          normalizeDispatcherTag(record.dispatcher),
          String(record.accountant || ""),
          String(record.platform || ""),
          String(record.shopName || ""),
          String(record.orderNo || ""),
          String(record.source || ""),
          String(record.customer || ""),
          String(record.summary || ""),
          toMoney(record.paymentPrice),
          toMoney(record.totalPrice),
          toMoney(getPremiumValue(record)),
          toMoney(record.settlementPrice)
        ];

        values.forEach((value, index) => {
          const td = document.createElement("td");
          td.textContent = value;
          if (index === 3) td.classList.add("recycle-col-dispatcher");
          if (index === 4) td.classList.add("recycle-col-accountant");
          if (index === 10) td.classList.add("summary");
          if (index === 11) td.classList.add("recycle-col-payment");
          if (index === 12) td.classList.add("recycle-col-total");
          if (index === 13) td.classList.add("recycle-col-premium");
          tr.appendChild(td);
        });
        recycleTableBody.appendChild(tr);
      });
    }

    function renderAccountantOperationLogs() {
      accountantLogList.innerHTML = "";
      const scopedLogs = getVisibleAccountantOperationLogs();
      if (!scopedLogs.length) {
        accountantLogEmptyState.style.display = "block";
        return;
      }

      accountantLogEmptyState.style.display = "none";
      scopedLogs.forEach((entry) => {
        const actionKeyRaw = String(entry?.actionKey || "").trim().toLowerCase();
        const actionKey = actionKeyRaw === "completed" || actionKeyRaw === "returned" ? actionKeyRaw : "checked";
        const actionLabel = actionKey === "completed" ? "完成" : (actionKey === "returned" ? "退单" : "核对");
        const operator = String(entry?.operatedBy || "").trim() || "未知会计";
        const dispatcher = normalizeDispatcherTag(entry?.dispatcher);
        const detailParts = [
          formatDateDisplay(entry?.date),
          String(entry?.accountant || "").trim(),
          String(entry?.customer || "").trim() || "未填客户"
        ];
        if (!isDispatcherLogin()) {
          detailParts.splice(1, 0, dispatcher);
        }

        const item = document.createElement("div");
        item.className = "recycle-log-item";

        const top = document.createElement("div");
        top.className = "recycle-log-item-top";

        const timeSpan = document.createElement("span");
        timeSpan.className = "recycle-log-time";
        timeSpan.textContent = formatDateTimeDisplay(entry?.operatedAt);
        top.appendChild(timeSpan);

        const operatorSpan = document.createElement("span");
        operatorSpan.className = "recycle-log-operator";
        operatorSpan.textContent = operator;
        top.appendChild(operatorSpan);

        const actionSpan = document.createElement("span");
        actionSpan.className = `recycle-log-action ${actionKey}`;
        actionSpan.textContent = actionLabel;
        top.appendChild(actionSpan);

        const detail = document.createElement("div");
        detail.className = "recycle-log-detail";
        detail.textContent = detailParts.join(" · ");

        item.appendChild(top);
        item.appendChild(detail);
        accountantLogList.appendChild(item);
      });
    }

    function openAnalysisModal() {
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRecycleModal();
      renderAnalysisPanel();
      analysisModal.hidden = false;
      analysisModal.classList.remove("modal-enter");
      analysisModalCard.classList.remove("modal-enter");
      void analysisModal.offsetWidth;
      analysisModal.classList.add("modal-enter");
      analysisModalCard.classList.add("modal-enter");
      syncModalOpenState();
    }

    function syncDispatcherSelfViewState() {
      if (!isDispatcherLogin()) return;
      filterState.dispatcher = "";
      filterDispatcherPopover.hidden = true;
      if (sortState.key === "dispatcher") {
        sortState.key = "date";
        sortState.direction = "desc";
      }
    }

    function closeAnalysisModal() {
      analysisModal.classList.remove("modal-enter");
      analysisModalCard.classList.remove("modal-enter");
      analysisModal.hidden = true;
      syncModalOpenState();
    }

    async function openAccountantModal() {
      if (!requireAccount()) return;
      if (isAccountantLogin()) {
        alert("当前账号可直接使用分配的会计身份，无需管理会计列表。");
        return;
      }
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeAnalysisModal();
      closeRecycleModal();
      try {
        await fetchAccountants();
      } catch (error) {
        console.error(error);
        alert(error.message || "读取会计列表失败，请稍后重试。");
        return;
      }
      accountantModal.hidden = false;
      accountantModal.classList.remove("modal-enter");
      accountantModalCard.classList.remove("modal-enter");
      void accountantModal.offsetWidth;
      accountantModal.classList.add("modal-enter");
      accountantModalCard.classList.add("modal-enter");
      syncModalOpenState();
      accountantUsernameInput.focus();
    }

    function closeAccountantModal() {
      highlightedAccountantUsername = "";
      accountantModal.classList.remove("modal-enter");
      accountantModalCard.classList.remove("modal-enter");
      accountantModal.hidden = true;
      syncModalOpenState();
    }

    async function openRecycleModal() {
      if (!requireAccount()) return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeAnalysisModal();
      closeAccountantModal();
      try {
        await fetchRecycleBinRecords();
      } catch (error) {
        console.error(error);
        alert(error.message || "读取回收站失败，请稍后重试。");
        return;
      }
      recycleModal.hidden = false;
      recycleModal.classList.remove("modal-enter");
      recycleModalCard.classList.remove("modal-enter");
      void recycleModal.offsetWidth;
      recycleModal.classList.add("modal-enter");
      recycleModalCard.classList.add("modal-enter");
      renderRecycleBinTable();
      renderAccountantOperationLogs();
      syncModalOpenState();
    }

    function closeRecycleModal() {
      recycleModal.classList.remove("modal-enter");
      recycleModalCard.classList.remove("modal-enter");
      recycleModal.hidden = true;
      syncModalOpenState();
    }

    function openCheckModal(record) {
      if (!record || typeof record !== "object") return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeCompleteModal();
      closeAccountantPicker();
      checkRecordIdInput.value = String(record.id || "").trim();
      checkCustomerInput.value = String(record.customer || "").trim();
      checkSummaryInput.value = String(record.summary || "").trim();
      checkModal.hidden = false;
      checkModal.classList.remove("modal-enter");
      checkModalCard.classList.remove("modal-enter");
      void checkModal.offsetWidth;
      checkModal.classList.add("modal-enter");
      checkModalCard.classList.add("modal-enter");
      syncModalOpenState();
      checkCustomerInput.focus();
    }

    function closeCheckModal() {
      checkModal.classList.remove("modal-enter");
      checkModalCard.classList.remove("modal-enter");
      checkModal.hidden = true;
      syncModalOpenState();
    }

    function openCompleteModal(record, options = {}) {
      if (!record || typeof record !== "object") return;
      const mode = normalizeCompleteModalMode(options.mode);
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeAccountantPicker();
      setCompleteModalMode(mode);
      completeRecordIdInput.value = String(record.id || "").trim();
      completeTimeInput.value = formatDateTimeLocalInputValue(record.completedAt || new Date());
      completeCustomerFeedbackInput.value = String(record.customerFeedback || "").trim();
      setCompleteFeedbackImageItems(record.serviceFeedbackImages);
      completeModal.hidden = false;
      completeModal.classList.remove("modal-enter");
      completeModalCard.classList.remove("modal-enter");
      void completeModal.offsetWidth;
      completeModal.classList.add("modal-enter");
      completeModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (isCompleteModalViewMode() && completeModalCloseBtn) {
        completeModalCloseBtn.focus();
        return;
      }
      completeTimeInput.focus();
    }

    function closeCompleteModal() {
      completeModal.classList.remove("modal-enter");
      completeModalCard.classList.remove("modal-enter");
      completeModal.hidden = true;
      completeRecordIdInput.value = "";
      completeTimeInput.value = "";
      completeCustomerFeedbackInput.value = "";
      resetCompleteFeedbackImageItems();
      setCompleteModalMode("edit");
      syncModalOpenState();
    }

    function formatMonthFilterChipLabel(rawValue) {
      const source = String(rawValue || "").trim();
      let match = source.match(/^(\d{4})-(\d{1,2})$/);
      if (match) {
        return `${Number(match[2])}月`;
      }
      match = source.match(/^(\d{1,2})月$/);
      if (match) {
        return `${Number(match[1])}月`;
      }
      return source;
    }

    function updateFilterButtonUI() {
      filterMonthBtn.classList.toggle("active", Boolean(filterState.month));
      filterDispatcherBtn.classList.toggle("active", Boolean(filterState.dispatcher));
      filterAccountantBtn.classList.toggle("active", Boolean(filterState.accountant));
      filterPlatformBtn.classList.toggle("active", Boolean(filterState.platform));
      filterShopBtn.classList.toggle("active", Boolean(filterState.shopName));
      filterSourceBtn.classList.toggle("active", Boolean(filterState.source));
      filterStatusBtn.classList.toggle("active", Boolean(filterState.status));
      if (filterMonthIndicator) filterMonthIndicator.classList.toggle("active", Boolean(filterState.month));
      if (filterDispatcherIndicator) filterDispatcherIndicator.classList.toggle("active", Boolean(filterState.dispatcher));
      if (filterAccountantIndicator) filterAccountantIndicator.classList.toggle("active", Boolean(filterState.accountant));
      if (filterPlatformIndicator) filterPlatformIndicator.classList.toggle("active", Boolean(filterState.platform));
      if (filterShopIndicator) filterShopIndicator.classList.toggle("active", Boolean(filterState.shopName));
      if (filterSourceIndicator) filterSourceIndicator.classList.toggle("active", Boolean(filterState.source));
      if (filterStatusIndicator) filterStatusIndicator.classList.toggle("active", Boolean(filterState.status));
      filterMonthBtn.setAttribute("aria-expanded", String(!filterMonthPopover.hidden));
      filterDispatcherBtn.setAttribute("aria-expanded", String(!filterDispatcherPopover.hidden));
      filterAccountantBtn.setAttribute("aria-expanded", String(!filterAccountantPopover.hidden));
      filterPlatformBtn.setAttribute("aria-expanded", String(!filterPlatformPopover.hidden));
      filterShopBtn.setAttribute("aria-expanded", String(!filterShopPopover.hidden));
      filterSourceBtn.setAttribute("aria-expanded", String(!filterSourcePopover.hidden));
      filterStatusBtn.setAttribute("aria-expanded", String(!filterStatusPopover.hidden));

      if (filterState.month) {
        filterMonthValue.hidden = false;
        filterMonthValue.textContent = formatMonthFilterChipLabel(filterState.month);
        filterMonthValue.title = filterState.month;
      } else {
        filterMonthValue.hidden = true;
        filterMonthValue.textContent = "";
        filterMonthValue.title = "";
      }

      if (filterState.dispatcher) {
        filterDispatcherValue.hidden = false;
        filterDispatcherValue.textContent = filterState.dispatcher;
      } else {
        filterDispatcherValue.hidden = true;
        filterDispatcherValue.textContent = "";
      }

      if (filterState.accountant) {
        filterAccountantValue.hidden = false;
        filterAccountantValue.textContent = filterState.accountant;
        filterAccountantValue.title = filterState.accountant;
      } else {
        filterAccountantValue.hidden = true;
        filterAccountantValue.textContent = "";
        filterAccountantValue.title = "";
      }

      if (filterState.platform) {
        filterPlatformValue.hidden = false;
        filterPlatformValue.textContent = filterState.platform;
        filterPlatformValue.title = filterState.platform;
      } else {
        filterPlatformValue.hidden = true;
        filterPlatformValue.textContent = "";
        filterPlatformValue.title = "";
      }

      if (filterState.shopName) {
        filterShopValue.hidden = false;
        filterShopValue.textContent = filterState.shopName;
        filterShopValue.title = filterState.shopName;
      } else {
        filterShopValue.hidden = true;
        filterShopValue.textContent = "";
        filterShopValue.title = "";
      }

      if (filterState.source) {
        filterSourceValue.hidden = false;
        filterSourceValue.textContent = filterState.source;
        filterSourceValue.title = filterState.source;
      } else {
        filterSourceValue.hidden = true;
        filterSourceValue.textContent = "";
        filterSourceValue.title = "";
      }

      if (filterState.status) {
        filterStatusValue.hidden = false;
        filterStatusValue.textContent = filterState.status;
        filterStatusValue.title = filterState.status;
      } else {
        filterStatusValue.hidden = true;
        filterStatusValue.textContent = "";
        filterStatusValue.title = "";
      }
    }

    function closeAllFilterPopovers() {
      filterMonthPopover.hidden = true;
      filterDispatcherPopover.hidden = true;
      filterAccountantPopover.hidden = true;
      filterPlatformPopover.hidden = true;
      filterShopPopover.hidden = true;
      filterSourcePopover.hidden = true;
      filterStatusPopover.hidden = true;
      updateFilterButtonUI();
    }

    function syncSidebarToggleUI() {
      const isExpanded = !isSidebarCollapsed;
      const actionLabel = isExpanded ? "收起左侧栏" : "展开左侧栏";
      appPage.classList.toggle("sidebar-collapsed", isSidebarCollapsed);
      if (appSidebar) {
        appSidebar.setAttribute("aria-hidden", String(isSidebarCollapsed));
        appSidebar.toggleAttribute("inert", isSidebarCollapsed);
      }
      if (sidebarToggleBtn) {
        sidebarToggleBtn.setAttribute("aria-expanded", String(isExpanded));
        sidebarToggleBtn.setAttribute("aria-label", actionLabel);
        sidebarToggleBtn.title = actionLabel;
      }
      if (sidebarToggleIcon) {
        sidebarToggleIcon.textContent = isExpanded ? "<" : ">";
      }
    }

    function setSidebarCollapsed(collapsed) {
      isSidebarCollapsed = Boolean(collapsed);
      syncSidebarToggleUI();
    }

    function toggleSidebarCollapsed() {
      closeAllFilterPopovers();
      isSidebarCollapsed = !isSidebarCollapsed;
      syncSidebarToggleUI();
      saveViewState();
    }

    function toggleFilterPopover(key) {
      if (typeof closeAllFormPickers === "function") {
        closeAllFormPickers();
      }
      if (key === "month") {
        updateFilterOptions();
        const open = filterMonthPopover.hidden;
        filterMonthPopover.hidden = !open;
        filterDispatcherPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
      }
      if (key === "dispatcher") {
        updateFilterOptions();
        const open = filterDispatcherPopover.hidden;
        filterDispatcherPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
      }
      if (key === "accountant") {
        updateFilterOptions();
        const open = filterAccountantPopover.hidden;
        filterAccountantPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
      }
      if (key === "platform") {
        updateFilterOptions();
        const open = filterPlatformPopover.hidden;
        filterPlatformPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
      }
      if (key === "shopName") {
        updateFilterOptions();
        const open = filterShopPopover.hidden;
        filterShopPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
      }
      if (key === "source") {
        updateFilterOptions();
        const open = filterSourcePopover.hidden;
        filterSourcePopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterStatusPopover.hidden = true;
      }
      if (key === "status") {
        updateFilterOptions();
        const open = filterStatusPopover.hidden;
        filterStatusPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
      }
      updateFilterButtonUI();
    }

    function setPageMode(isLoggedIn) {
      loginPage.hidden = isLoggedIn;
      appPage.hidden = !isLoggedIn;
      const isAccountant = isAccountantLogin();
      const isBoss = isBossLogin();
      const isDispatcher = Boolean(isLoggedIn && !isAccountant && !isBoss);
      appPage.classList.toggle("accountant-view", Boolean(isLoggedIn && isAccountant));
      document.body.classList.toggle("dispatcher-self-view", Boolean(isLoggedIn && isDispatcher));
      const baseLoginLabel = String(currentAccount || "").trim();
      const loginLabel = isAccountant
        ? getCurrentAccountantDisplayName()
        : (isBoss ? "boss" : `开心财税${normalizeDispatcherTag(baseLoginLabel)}`);
      headerAccountText.textContent = isLoggedIn ? loginLabel : "";
      headerAccountSubText.textContent = isLoggedIn && isBoss ? "全部数据" : "";
      accountRoleBadge.textContent = isLoggedIn
        ? (isAccountant ? "会计账号" : (isBoss ? "Boss账号" : "派单账号"))
        : "";
      accountRoleBadge.className = isLoggedIn
        ? `account-role-badge ${isAccountant ? "accountant" : (isBoss ? "boss" : "dispatcher")}`
        : "account-role-badge";
      const canOpenAnalysis = isBoss || isAnalysisButtonEnabled;
      openCreateModalBtn.hidden = isAccountant;
      openAnalysisModalBtn.hidden = isAccountant || !canOpenAnalysis;
      openRecycleModalBtn.hidden = isAccountant;
      openAccountantModalBtn.hidden = isAccountant;
      changePasswordBtn.hidden = !(isLoggedIn && (isAccountant || isDispatcher));
      filterDispatcherBtn.disabled = false;
      if (isDispatcher) {
        syncDispatcherSelfViewState();
        filterDispatcherPopover.hidden = true;
      }
      if (!isLoggedIn) {
        dispatcherOperationNoticeItem = null;
        pendingAccountantNoticeItems = [];
        hideOperationNotice({ keepCurrentId: true });
      }
      if (isDispatcher && operationNoticeDismissed) {
        dispatcherOperationNoticeItem = null;
      }
      renderRequestLogList();
      if (isLoggedIn && isAccountant) {
        restorePendingOperationNotice();
      } else {
        renderOperationNoticeStack();
      }
    }

    function applyAccountToForm() {
      dateInput.value = getTodayISODate();
      setDispatcherTag(getDefaultDispatcherTag());
      setSourcePickerValue("");
      setPlatformShopPickerValue("");
      renderSourcePickerOptions();
      renderPlatformShopPickerOptions();
    }

    function resetRecordFormMode() {
      recordEditingIdInput.value = "";
      dateInput.readOnly = true;
      recordModalTitle.textContent = "新建数据";
      recordReturnBtn.hidden = true;
      recordSubmitBtn.textContent = "保存数据";
    }

    function showRecordModal(initialFocusTarget = accountantPickerTrigger) {
      createModal.hidden = false;
      createModal.classList.remove("modal-enter");
      createModalCard.classList.remove("modal-enter");
      void createModal.offsetWidth;
      createModal.classList.add("modal-enter");
      createModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (initialFocusTarget && typeof initialFocusTarget.focus === "function") {
        initialFocusTarget.focus();
      }
    }

    function requireAccount() {
      if (currentAccount && currentSessionToken) return true;
      stopAutoRefresh();
      setPageMode(false);
      loginCodeInput.focus();
      return false;
    }

    async function syncDataAfterLogin() {
      try {
        await fetchAccountants();
      } catch (error) {
        console.error(error);
        alert(error.message || "读取会计列表失败，请稍后重试。");
      }
      try {
        await fetchRecords();
      } catch (error) {
        console.error(error);
        alert("读取共享数据失败，请确认 Node 服务已启动。");
      }
      try {
        await fetchAccountantOperationLogs();
      } catch (error) {
        console.error(error);
        alert(error.message || "读取会计操作日志失败，请稍后重试。");
      }
      if (currentAccount && currentSessionToken) {
        startAutoRefresh();
      }
    }

    async function loginAccount(name, password) {
      const rawName = String(name || "").trim();
      const rawPassword = String(password || "").trim();
      if (!rawName || !rawPassword) {
        setLoginRequestHint("请求状态：请输入账号和密码", "error");
        alert("账号或密码错误。");
        if (!rawName) {
          loginCodeInput.focus();
        } else {
          loginPasswordInput.focus();
        }
        return;
      }
      let authResult;
      try {
        authResult = await verifyLoginByServer(rawName, rawPassword);
      } catch (error) {
        console.error(error);
        setLoginRequestHint(`请求状态：${error.message || "登录失败"}`, "error");
        alert(error.message || "登录失败，请稍后重试。");
        loginPasswordInput.focus();
        return;
      }
      const normalized = resolveLoginAccountInput(authResult?.account || rawName);
      const sessionToken = String(authResult?.sessionToken || "").trim();
      if (!sessionToken) {
        setLoginRequestHint("请求状态：登录状态创建失败", "error");
        alert("登录失败，请重新登录。");
        loginPasswordInput.focus();
        return;
      }
      currentAccount = normalized;
      currentAccountRole = normalizeLoginRole(authResult?.role) || inferRoleByAccountName(normalized);
      currentSessionToken = sessionToken;
      hasFetchedRecords = false;
      resetAccountantAssignmentNoticeState();
      loadOperationNoticePreference();
      loadUpdatedRowDismissState();
      saveSuccessfulLoginEntry(authResult?.account || rawName, rawPassword, currentAccountRole);
      loginCodeInput.value = "";
      loginPasswordInput.value = "";
      applyAccountToForm();
      setPageMode(true);
      saveToStorage();
      await syncDataAfterLogin();
    }

    function logoutAccount() {
      stopAutoRefresh();
      currentAccount = "";
      currentAccountRole = "";
      currentSessionToken = "";
      hasFetchedRecords = false;
      accountantOperationLogs = [];
      currentOperationNoticeLogId = "";
      operationNoticeDismissed = false;
      dismissedOperationNoticeLogId = "";
      resetAccountantAssignmentNoticeState();
      resetUpdatedRowHighlightState();
      hideOperationNotice();
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
      setLoginRequestHint("请求状态：待发送", "idle");
      loginCodeInput.focus();
    }

    async function openChangePasswordFlow() {
      if (!requireAccount()) return;
      const canChangePassword = isAccountantLogin() || isDispatcherLogin();
      if (!canChangePassword) return;
      const accountName = String(currentAccount || "").trim();
      if (!accountName) return;

      const newPassword = String(window.prompt("请输入新密码", "") || "").trim();
      if (!newPassword) return;

      try {
        if (isDispatcherLogin()) {
          await changeDispatcherPassword(newPassword);
        } else {
          await changeAccountantPassword(accountName, newPassword);
        }
      } catch (error) {
        console.error(error);
        alert(error.message || "修改密码失败，请稍后重试。");
        return;
      }
      alert("密码修改成功。");
    }

    function renderTable() {
      tableBody.innerHTML = "";
      updateFilterOptions();
      saveViewState();
      const canEditRecords = !isAccountantLogin();
      const canDeleteRecords = !isAccountantLogin();
      const canCheckRecords = isAccountantLogin();
      const scopedRecords = getVisibleRecords();
      const currentDispatcherTag = getCurrentDispatcherTag();
      const filteredRecords = getFilteredRecords();
      const hasFilter = Boolean(
        filterState.month
        || filterState.dispatcher
        || filterState.accountant
        || filterState.platform
        || filterState.shopName
        || filterState.source
        || filterState.status
      );
      tableTotalCount.textContent = hasFilter
        ? `共 ${filteredRecords.length}/${scopedRecords.length} 条`
        : `共 ${scopedRecords.length} 条`;
      clearFilterBtn.hidden = !hasFilter;
      updateSortHeaderUI(filteredRecords);
      if (!filteredRecords.length) {
        emptyState.style.display = "block";
        emptyState.textContent = scopedRecords.length ? "当前筛选无数据。" : "暂无数据，先录入一条。";
        return;
      }
      emptyState.style.display = "none";
      getSortedRecords(filteredRecords).forEach((item) => {
        const tr = document.createElement("tr");
        const recordId = String(item.id || "").trim();
        const dispatcherTag = normalizeDispatcherTag(item.dispatcher);
        const checkStatus = normalizeRecordCheckStatus(item.checkStatus);
        const isCurrentDispatcher = Boolean(currentDispatcherTag && dispatcherTag === currentDispatcherTag);
        const isUpdatedRow = Boolean(recordId && isUpdatedRecordHighlighted(recordId));
        if (isCurrentDispatcher) {
          tr.classList.add("dispatcher-current-row");
        }
        if (isUpdatedRow) {
          tr.classList.add("updated-record-row");
        }
        const values = [
          formatDateDisplay(item.date),
          dispatcherTag,
          String(item.source || ""),
          String(item.platform || ""),
          String(item.shopName || ""),
          String(item.orderNo || ""),
          String(item.accountant || ""),
          String(item.customer || ""),
          String(item.summary || ""),
          toMoney(item.paymentPrice),
          toMoney(item.totalPrice),
          toMoney(getPremiumValue(item)),
          toMoney(item.settlementPrice),
          getRecordStatusChipText(item)
        ];
        values.forEach((value, index) => {
          const td = document.createElement("td");
          if (index === 0) {
            td.classList.add("data-col-date");
            const dateWrap = document.createElement("div");
            dateWrap.className = "row-date-cell";
            if (isUpdatedRow) {
              const dot = document.createElement("span");
              dot.className = "row-update-dot";
              dot.setAttribute("aria-hidden", "true");
              dateWrap.appendChild(dot);
            }

            const dateText = document.createElement("span");
            dateText.className = "row-date-text";
            dateText.textContent = String(value || "");
            dateWrap.appendChild(dateText);

            if (isUpdatedRow && recordId) {
              const dismissBtn = document.createElement("button");
              dismissBtn.type = "button";
              dismissBtn.className = "row-update-dismiss-btn";
              dismissBtn.dataset.recordDismissHighlight = recordId;
              dismissBtn.setAttribute("aria-label", "关闭本行高亮");
              dismissBtn.title = "关闭高亮";
              dismissBtn.textContent = "×";
              dateWrap.appendChild(dismissBtn);
            }

            td.appendChild(dateWrap);
          } else if (index === 1) {
            td.classList.add("data-col-dispatcher");
            const chip = document.createElement("span");
            chip.className = "dispatcher-chip";
            chip.textContent = value;
            td.appendChild(chip);
          } else if (index === 13) {
            const statusChip = document.createElement("span");
            statusChip.className = `record-status-chip ${checkStatus}`;
            statusChip.textContent = String(value || "");
            td.appendChild(statusChip);
          } else {
            td.textContent = value;
          }
          if (index === 2) td.classList.add("data-col-source");
          if (index === 3) td.classList.add("data-col-platform");
          if (index === 4) td.classList.add("data-col-shop");
          if (index === 5) td.classList.add("data-col-order");
          if (index === 6) td.classList.add("data-col-accountant");
          if (index === 8) td.classList.add("summary");
          if (index === 9) td.classList.add("data-col-payment");
          if (index === 10) td.classList.add("data-col-total");
          if (index === 11) td.classList.add("data-col-premium");
          tr.appendChild(td);
        });

        const actionTd = document.createElement("td");
        actionTd.className = "row-action-cell";
        if (canEditRecords && recordId) {
          const editBtn = document.createElement("button");
          editBtn.type = "button";
          editBtn.className = "row-edit-btn";
          editBtn.dataset.recordId = recordId;
          editBtn.textContent = "修改";
          actionTd.appendChild(editBtn);
        }
        if (canDeleteRecords && recordId) {
          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "row-delete-btn";
          deleteBtn.dataset.recordId = recordId;
          deleteBtn.dataset.customer = String(item.customer || "");
          deleteBtn.dataset.date = formatDateDisplay(item.date);
          deleteBtn.textContent = "删除";
          actionTd.appendChild(deleteBtn);
        }
        if (recordId && checkStatus === "completed") {
          const checkBtn = document.createElement("button");
          checkBtn.type = "button";
          checkBtn.className = "row-check-btn view";
          checkBtn.dataset.recordId = recordId;
          checkBtn.dataset.checkAction = "view-feedback";
          checkBtn.textContent = "查看";
          actionTd.appendChild(checkBtn);
        }
        if (canCheckRecords && recordId) {
          if (checkStatus !== "completed" && checkStatus !== "returned") {
            const checkBtn = document.createElement("button");
            checkBtn.type = "button";
            let checkButtonText = "核对";
            let checkButtonAction = "verify";
            let checkButtonExtraClass = "";
            if (checkStatus === "checked") {
              checkButtonText = "完成";
              checkButtonAction = "complete";
              checkButtonExtraClass = " complete";
            }
            checkBtn.className = `row-check-btn${checkButtonExtraClass}`;
            checkBtn.dataset.recordId = recordId;
            checkBtn.dataset.checkAction = checkButtonAction;
            checkBtn.textContent = checkButtonText;
            actionTd.appendChild(checkBtn);
          }
        }
        tr.appendChild(actionTd);
        tableBody.appendChild(tr);
      });
    }

    function openCreateModal() {
      if (!requireAccount()) return;
      closeAllFilterPopovers();
      closeCheckModal();
      closeCompleteModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      recordForm.reset();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      resetRecordFormMode();
      renderAccountantSelectOptions();
      renderSourcePickerOptions();
      renderPlatformShopPickerOptions();
      settlementPriceAutoFilled = false;
      applyAccountToForm();
      syncPremiumPriceFromPrices();
      showRecordModal(accountantPickerTrigger);
    }

    function openEditModal(record) {
      if (!record || typeof record !== "object") return;
      if (!requireAccount() || isAccountantLogin()) return;
      closeAllFilterPopovers();
      closeCheckModal();
      closeCompleteModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      recordForm.reset();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      resetRecordFormMode();
      renderAccountantSelectOptions();
      renderSourcePickerOptions();
      renderPlatformShopPickerOptions();
      settlementPriceAutoFilled = false;

      recordEditingIdInput.value = String(record.id || "").trim();
      dateInput.readOnly = false;
      recordModalTitle.textContent = "修改数据";
      recordReturnBtn.hidden = false;
      recordSubmitBtn.textContent = "保存修改";
      dateInput.value = formatDateInputValue(record.date || getTodayISODate());
      setDispatcherTag(normalizeDispatcherTag(record.dispatcher) || getDefaultDispatcherTag());
      setAccountantPickerValue(String(record.accountant || "").trim());
      renderAccountantPickerList("");
      setSourcePickerValue(String(record.source || "").trim());
      renderSourcePickerList();
      setPlatformShopPickerFieldsValue(record.platform, record.shopName);
      renderPlatformShopPickerList();
      orderNoInput.value = String(record.orderNo || "").trim();
      customerInput.value = String(record.customer || "").trim();
      summaryInput.value = String(record.summary || "").trim();
      paymentPriceInput.value = Number.isFinite(Number(record.paymentPrice)) ? String(record.paymentPrice) : "";
      totalPriceInput.value = Number.isFinite(Number(record.totalPrice)) ? String(record.totalPrice) : "";
      settlementPriceInput.value = Number.isFinite(Number(record.settlementPrice)) ? String(record.settlementPrice) : "";
      syncPremiumPriceFromPrices();
      showRecordModal(orderNoInput);
    }

    function closeCreateModal() {
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      resetRecordFormMode();
      createModal.classList.remove("modal-enter");
      createModalCard.classList.remove("modal-enter");
      createModal.hidden = true;
      syncModalOpenState();
    }
