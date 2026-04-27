// UI Flow: recycle/accountant/check/create modals, page mode switching, auth flow, table rendering.
    function renderRecycleBinTable() {
      recycleTableBody.innerHTML = "";
      const scopedRecycleRecords = getVisibleRecycleBinRecords();
      const canRestoreRecords = !isAccountantLogin();
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
          toMoney(record.settlementPrice),
          formatProfitDisplay(record)
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
          if (index === 14) td.classList.add("recycle-col-settlement");
          if (index === 15) td.classList.add("recycle-col-profit");
          tr.appendChild(td);
        });

        const actionTd = document.createElement("td");
        actionTd.className = "recycle-col-action";
        if (canRestoreRecords) {
          const restoreBtn = document.createElement("button");
          restoreBtn.type = "button";
          restoreBtn.className = "btn-secondary recycle-restore-btn";
          restoreBtn.dataset.recycleRestoreId = String(entry?.recycleId || "").trim();
          restoreBtn.textContent = "还原";
          actionTd.appendChild(restoreBtn);
        }
        tr.appendChild(actionTd);
        recycleTableBody.appendChild(tr);
      });
    }

    const TABLE_EXPORT_COLUMNS = [
      { label: "日期", getValue: (item) => String(item?.date || "").trim() },
      { label: "接待人", getValue: (item) => normalizeDispatcherTag(item?.dispatcher) },
      { label: "来源", getValue: (item) => String(item?.source || "").trim() },
      { label: "平台", getValue: (item) => String(item?.platform || "").trim() },
      { label: "店铺名", getValue: (item) => String(item?.shopName || "").trim() },
      { label: "订单号", getValue: (item) => String(item?.orderNo || "").trim() },
      { label: "会计", getValue: (item) => String(item?.accountant || "").trim() },
      { label: "客户", getValue: (item) => String(item?.customer || "").trim() },
      { label: "任务简介", getValue: (item) => String(item?.summary || "").trim() },
      { label: "备注", getValue: (item) => String(item?.remark || "").trim() },
      { label: "付款价", getValue: (item) => toMoney(item?.paymentPrice) },
      { label: "会计价", getValue: (item) => toMoney(item?.totalPrice) },
      { label: "溢价", getValue: (item) => toMoney(getPremiumValue(item)) },
      { label: "结算价", getValue: (item) => toMoney(item?.settlementPrice) },
      { label: "接待收益", getValue: (item) => formatProfitDisplay(item), visible: () => shouldShowProfitColumn() },
      { label: "状态", getValue: (item) => getRecordStatusWithSettlementText(item) }
    ];

    let stickyTableColumnSyncFrame = 0;

    function getHorizontalPadding(node) {
      if (!node) return 0;
      const computedStyle = window.getComputedStyle(node);
      return (parseFloat(computedStyle.paddingLeft) || 0)
        + (parseFloat(computedStyle.paddingRight) || 0);
    }

    function getStickyColumnCellWidth(cell, contentNode) {
      if (!cell) return 0;
      const horizontalPadding = getHorizontalPadding(cell);
      const target = contentNode || cell;
      const contentWidth = Math.ceil(
        Math.max(target.scrollWidth || 0, target.getBoundingClientRect?.().width || 0)
      );
      return Math.ceil(contentWidth + horizontalPadding);
    }

    function getMeasuredButtonWidth(selector, options = {}) {
      const { minWidth = 0 } = options;
      const measuredWidth = Array.from(tableBody?.querySelectorAll(selector) || []).reduce((maxWidthSoFar, node) => {
        const rectWidth = Math.ceil(node.getBoundingClientRect?.().width || 0);
        const scrollWidth = Math.ceil(node.scrollWidth || 0);
        return Math.max(maxWidthSoFar, rectWidth, scrollWidth);
      }, 0);
      return Math.max(minWidth, measuredWidth);
    }

    function measureStickyColumnWidth(measurements, options = {}) {
      const {
        minWidth = 0,
        maxWidth = 360,
        extraWidth = 0
      } = options;
      const measuredWidth = measurements.reduce((maxWidthSoFar, item) => {
        if (!item?.cell) return maxWidthSoFar;
        return Math.max(maxWidthSoFar, getStickyColumnCellWidth(item.cell, item.contentNode));
      }, 0);
      return Math.min(maxWidth, Math.max(minWidth, measuredWidth + extraWidth));
    }

    function syncStickyTableColumnWidths() {
      const table = tableBody ? tableBody.closest("table") : null;
      if (!table || !appPage) return;

      const statusCol = table.querySelector("col.col-status");
      const actionCol = table.querySelector("col.col-action");
      const actionHeader = table.querySelector("thead th.data-col-action");
      const statusCells = Array.from(table.querySelectorAll("tbody td.data-col-status"));
      const actionCells = Array.from(table.querySelectorAll("tbody td.row-action-cell"));
      const historyWidth = getMeasuredButtonWidth(".row-history-btn", { minWidth: 0 });
      const editWidth = getMeasuredButtonWidth(".row-edit-btn", { minWidth: 0 });
      const deleteWidth = getMeasuredButtonWidth(".row-delete-btn", { minWidth: 0 });
      const checkWidth = getMeasuredButtonWidth(".row-check-btn", { minWidth: 0 });
      const isAccountantView = Boolean(appPage?.classList.contains("accountant-view"));
      const actionGap = isAccountantView ? 4 : 6;
      const actionTrackWidths = isAccountantView
        ? [historyWidth, checkWidth]
        : [historyWidth, editWidth, deleteWidth, checkWidth];
      const visibleTrackWidths = actionTrackWidths.filter((width) => width > 0);
      const actionPadding = getHorizontalPadding(actionCells[0] || actionHeader);
      const statusWidth = measureStickyColumnWidth(
        [
          ...statusCells.map((cell) => ({
            cell,
            contentNode: cell.querySelector(".row-status-cell") || cell
          }))
        ],
        { minWidth: 112, maxWidth: 360, extraWidth: 10 }
      );
      const actionWidth = Math.min(
        360,
        Math.max(
          88,
          Math.ceil(
            visibleTrackWidths.reduce((sum, width) => sum + width, 0)
            + Math.max(0, visibleTrackWidths.length - 1) * actionGap
            + actionPadding
          )
        )
      );

      appPage.style.setProperty("--table-sticky-status-width", `${statusWidth}px`);
      appPage.style.setProperty("--table-sticky-action-width", `${actionWidth}px`);
      appPage.style.setProperty("--table-action-history-width", `${historyWidth}px`);
      appPage.style.setProperty("--table-action-edit-width", `${editWidth}px`);
      appPage.style.setProperty("--table-action-delete-width", `${deleteWidth}px`);
      appPage.style.setProperty("--table-action-check-width", `${checkWidth}px`);
      if (statusCol) statusCol.style.width = `${statusWidth}px`;
      if (actionCol) actionCol.style.width = `${actionWidth}px`;
    }

    function scheduleStickyTableColumnWidthSync() {
      if (stickyTableColumnSyncFrame) {
        window.cancelAnimationFrame(stickyTableColumnSyncFrame);
      }
      stickyTableColumnSyncFrame = window.requestAnimationFrame(() => {
        stickyTableColumnSyncFrame = 0;
        syncStickyTableColumnWidths();
      });
    }

    function getTableExportColumns() {
      return TABLE_EXPORT_COLUMNS.filter((column) => (
        typeof column.visible !== "function" || column.visible()
      ));
    }

    function escapeCsvValue(rawValue) {
      let text = String(rawValue ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      if (/^[=+@]/.test(text) || (/^-/.test(text) && !Number.isFinite(Number(text)))) {
        text = `'${text}`;
      }
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, "\"\"")}"`;
      }
      return text;
    }

    function getTableExportFileName() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const date = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return `数据表导出_${year}${month}${date}_${hours}${minutes}${seconds}.csv`;
    }

    function exportCurrentTableRecords() {
      if (!isBossLogin()) return;
      const exportRecords = getSortedRecords(getFilteredRecords());
      const exportColumns = getTableExportColumns();
      if (!exportRecords.length) {
        showAppStatus("当前没有可导出的数据。");
        return;
      }

      const rows = [
        exportColumns.map((column) => column.label),
        ...exportRecords.map((item) => exportColumns.map((column) => column.getValue(item)))
      ];
      const csvContent = `\uFEFF${rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(",")).join("\r\n")}`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = getTableExportFileName();
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 0);
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
        const actionLabel = actionKey === "completed" ? "完成" : (actionKey === "returned" ? "退单" : "确认");
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

    function syncDevTodoEntryPoint() {
      if (!devTodoLauncher) return;
      devTodoLauncher.hidden = !isDevTodoEnabled;
    }

    function renderDevTodoList() {
      if (!devTodoList || !devTodoEmptyState) return;
      if (!isDevTodoEnabled) {
        devTodoList.innerHTML = "";
        devTodoEmptyState.hidden = true;
        return;
      }
      devTodoList.innerHTML = "";
      if (!devTodoItems.length) {
        devTodoEmptyState.hidden = false;
        return;
      }
      devTodoEmptyState.hidden = true;
      devTodoItems.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "dev-todo-item";

        const serial = document.createElement("span");
        serial.className = "dev-todo-item-serial";
        serial.textContent = String(index + 1).padStart(2, "0");
        card.appendChild(serial);

        const text = document.createElement("div");
        text.className = "dev-todo-item-text";
        text.textContent = String(item.text || "");
        card.appendChild(text);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "dev-todo-item-delete";
        deleteBtn.dataset.todoId = String(item.id || "");
        deleteBtn.textContent = "删除";
        card.appendChild(deleteBtn);
        devTodoList.appendChild(card);
      });
    }

    function resetAccountantRegisterForm() {
      if (accountantRegisterForm) {
        accountantRegisterForm.reset();
      }
      if (accountantRegisterSubmitBtn) {
        accountantRegisterSubmitBtn.disabled = false;
        accountantRegisterSubmitBtn.textContent = "确认新增";
      }
      resetInlineFormState(accountantRegisterForm, setAccountantRegisterHint);
    }

    function resetAccountantEditForm() {
      editingAccountantUsername = "";
      accountantEditMode = "admin";
      if (accountantEditForm) {
        accountantEditForm.reset();
      }
      if (accountantEditOriginalUsernameInput) {
        accountantEditOriginalUsernameInput.value = "";
      }
      if (accountantEditTitle) {
        accountantEditTitle.textContent = "修改会计资料";
      }
      syncAccountantEditSensitiveFieldVisibility("admin");
      if (accountantEditSubmitBtn) {
        accountantEditSubmitBtn.disabled = false;
        accountantEditSubmitBtn.textContent = "保存修改";
      }
      resetInlineFormState(accountantEditForm, setAccountantEditHint);
    }

    function syncAccountantEditSensitiveFieldVisibility(mode = accountantEditMode) {
      const canEditSensitiveFields = canEditAccountantSensitiveFields(mode);
      if (accountantEditPasswordField) {
        accountantEditPasswordField.hidden = !canEditSensitiveFields;
      }
      if (accountantEditPhoneField) {
        accountantEditPhoneField.hidden = !canEditSensitiveFields;
      }
      if (accountantEditPasswordInput) {
        accountantEditPasswordInput.required = canEditSensitiveFields;
        if (!canEditSensitiveFields) {
          accountantEditPasswordInput.value = "";
        }
      }
      if (accountantEditPhoneInput) {
        accountantEditPhoneInput.required = canEditSensitiveFields;
        if (!canEditSensitiveFields) {
          accountantEditPhoneInput.value = "";
        }
      }
    }

    function openAccountantEditModal(profile, options = {}) {
      if (!profile || typeof profile !== "object") return;
      if (!accountantEditModal || !accountantEditModalCard) return;
      const mode = options.mode === "self" ? "self" : "admin";
      resetAccountantEditForm();
      accountantEditMode = mode;
      const username = String(profile.username || profile.name || "").trim();
      const displayName = String(profile.displayName || profile.name || "").trim();
      const alias = String(profile.alias || (displayName !== username ? displayName : "") || "").trim();
      editingAccountantUsername = username;
      if (accountantEditOriginalUsernameInput) {
        accountantEditOriginalUsernameInput.value = username;
      }
      if (accountantEditTitle) {
        accountantEditTitle.textContent = mode === "self" ? "修改个人信息" : "修改会计资料";
      }
      const canEditSensitiveFields = canEditAccountantSensitiveFields(mode);
      syncAccountantEditSensitiveFieldVisibility(mode);
      if (accountantEditPasswordInput) {
        accountantEditPasswordInput.value = canEditSensitiveFields ? String(profile.loginPassword || "").trim() : "";
      }
      if (accountantEditAliasInput) accountantEditAliasInput.value = alias;
      if (accountantEditRealNameInput) accountantEditRealNameInput.value = String(profile.realName || "").trim();
      if (accountantEditPhoneInput) {
        accountantEditPhoneInput.value = canEditSensitiveFields ? String(profile.phone || "").trim() : "";
      }
      accountantEditModal.hidden = false;
      accountantEditModal.classList.remove("modal-enter");
      accountantEditModalCard.classList.remove("modal-enter");
      void accountantEditModal.offsetWidth;
      accountantEditModal.classList.add("modal-enter");
      accountantEditModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (canEditSensitiveFields && accountantEditPhoneInput) {
        accountantEditPhoneInput.focus();
        accountantEditPhoneInput.select();
      } else if (accountantEditAliasInput) {
        accountantEditAliasInput.focus();
        accountantEditAliasInput.select();
      }
    }

    function openAccountantProfileEditFlow() {
      if (!requireAccount()) return;
      if (!isAccountantLogin()) return;
      const profile = getCurrentAccountantLoginProfile();
      if (!profile) {
        showAppStatus("当前会计资料不存在，请稍后刷新后重试。");
        return;
      }
      openAccountantEditModal(profile, { mode: "self" });
    }

    function closeAccountantEditModal() {
      if (!accountantEditModal || !accountantEditModalCard) return;
      accountantEditModal.classList.remove("modal-enter");
      accountantEditModalCard.classList.remove("modal-enter");
      accountantEditModal.hidden = true;
      resetAccountantEditForm();
      syncModalOpenState();
    }

    function openChangePasswordModal() {
      if (!changePasswordModal || !changePasswordModalCard) return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeAccountantRegisterModal();
      closeChangePasswordModal();
      closeRecycleModal();
      closeDevTodoModal();
      resetChangePasswordForm();
      changePasswordModal.hidden = false;
      changePasswordModal.classList.remove("modal-enter");
      changePasswordModalCard.classList.remove("modal-enter");
      void changePasswordModal.offsetWidth;
      changePasswordModal.classList.add("modal-enter");
      changePasswordModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (changePasswordInput) {
        changePasswordInput.focus();
      }
    }

    function closeChangePasswordModal() {
      if (!changePasswordModal || !changePasswordModalCard) return;
      changePasswordModal.classList.remove("modal-enter");
      changePasswordModalCard.classList.remove("modal-enter");
      changePasswordModal.hidden = true;
      resetChangePasswordForm();
      syncModalOpenState();
    }

    function openAccountantRegisterModal() {
      if (!accountantRegisterModal || !accountantRegisterModalCard) return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeChangePasswordModal();
      closeRecycleModal();
      closeDevTodoModal();
      resetAccountantRegisterForm();
      accountantRegisterModal.hidden = false;
      accountantRegisterModal.classList.remove("modal-enter");
      accountantRegisterModalCard.classList.remove("modal-enter");
      void accountantRegisterModal.offsetWidth;
      accountantRegisterModal.classList.add("modal-enter");
      accountantRegisterModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (accountantRegisterPhoneInput) {
        accountantRegisterPhoneInput.focus();
      }
    }

    async function restoreAccountantModalAfterRegister(options = {}) {
      const shouldRestore = accountantRegisterReturnTarget === "accountant-modal"
        && Boolean(currentAccount)
        && !isAccountantLogin();
      const hintText = String(options.hintText || "").trim();
      const hintState = options.hintState || "idle";
      closeAccountantRegisterModal();
      if (!shouldRestore) return;
      await openAccountantModal();
      if (hintText) {
        setAccountantModalHint(hintText, hintState);
      }
    }

    function closeAccountantRegisterModal() {
      if (!accountantRegisterModal || !accountantRegisterModalCard) return;
      accountantRegisterModal.classList.remove("modal-enter");
      accountantRegisterModalCard.classList.remove("modal-enter");
      accountantRegisterModal.hidden = true;
      accountantRegisterReturnTarget = "";
      syncModalOpenState();
    }

    function openAnalysisModal() {
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeDispatcherModal();
      closeRecycleModal();
      closeAccountantEditModal();
      closeDevTodoModal();
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

    async function openDispatcherModal() {
      if (!requireAccount()) return;
      if (!isBossLogin()) {
        showAppStatus("接待管理仅管理员可用。");
        return;
      }
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      try {
        await fetchDispatchers();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取接待列表失败，请稍后重试。");
        return;
      }
      setDispatcherModalHint("", "idle");
      dispatcherModal.hidden = false;
      dispatcherModal.classList.remove("modal-enter");
      dispatcherModalCard.classList.remove("modal-enter");
      void dispatcherModal.offsetWidth;
      renderDispatcherList();
      dispatcherModal.classList.add("modal-enter");
      dispatcherModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (dispatcherListWrap) {
        dispatcherListWrap.focus();
      }
    }

    function closeDispatcherModal() {
      dispatcherModal.classList.remove("modal-enter");
      dispatcherModalCard.classList.remove("modal-enter");
      dispatcherModal.hidden = true;
      syncModalOpenState();
    }

    async function openAccountantModal() {
      if (!requireAccount()) return;
      if (isAccountantLogin()) {
        showAppStatus("当前账号可直接使用分配的会计身份，无需管理会计列表。");
        return;
      }
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeDispatcherModal();
      closeAccountantEditModal();
      closeRecycleModal();
      closeDevTodoModal();
      try {
        await fetchAccountants();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取会计列表失败，请稍后重试。");
        return;
      }
      setAccountantModalHint("", "idle");
      accountantModal.hidden = false;
      accountantModal.classList.remove("modal-enter");
      accountantModalCard.classList.remove("modal-enter");
      void accountantModal.offsetWidth;
      accountantModal.classList.add("modal-enter");
      accountantModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (accountantListWrap) {
        accountantListWrap.focus();
      }
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
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeDispatcherModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeDevTodoModal();
      try {
        await fetchRecycleBinRecords();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取回收站失败，请稍后重试。");
        return;
      }
      setRecycleModalHint("", "idle");
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

    function openDevTodoModal() {
      if (!isDevTodoEnabled || !devTodoModal) return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeAccountantEditModal();
      closeChangePasswordModal();
      closeRecycleModal();
      loadDevTodoItems();
      renderDevTodoList();
      devTodoModal.hidden = false;
      devTodoModal.classList.remove("modal-enter");
      if (devTodoModalCard) {
        devTodoModalCard.classList.remove("modal-enter");
      }
      void devTodoModal.offsetWidth;
      devTodoModal.classList.add("modal-enter");
      if (devTodoModalCard) {
        devTodoModalCard.classList.add("modal-enter");
      }
      syncModalOpenState();
      if (devTodoInput) {
        devTodoInput.focus();
      }
    }

    function closeDevTodoModal() {
      if (!devTodoModal) return;
      devTodoModal.classList.remove("modal-enter");
      if (devTodoModalCard) {
        devTodoModalCard.classList.remove("modal-enter");
      }
      devTodoModal.hidden = true;
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
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeDevTodoModal();
      closeChangePasswordModal();
      closeAccountantPicker();
      resetInlineFormState(checkForm, setCheckFormHint);
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
      resetInlineFormState(checkForm, setCheckFormHint);
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
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeChangePasswordModal();
      closeAccountantPicker();
      setCompleteModalMode(mode);
      resetInlineFormState(completeForm, setCompleteFormHint);
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
      completeCustomerFeedbackInput.focus();
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
      resetInlineFormState(completeForm, setCompleteFormHint);
      syncModalOpenState();
    }

    function renderReturnPriceModalContent(record) {
      if (!returnPriceModalContent || !returnPriceModalMeta) return;
      returnPriceModalContent.innerHTML = "";
      const snapshot = getReturnedPriceSnapshot(record);
      const metaParts = [
        formatDateDisplay(record?.date),
        String(record?.customer || "").trim() || "未填客户"
      ].filter(Boolean);
      const orderNo = String(record?.orderNo || "").trim();
      if (orderNo && !isAccountantLogin()) {
        metaParts.push(`订单号 ${orderNo}`);
      }
      const returnedAt = String(formatDateTimeDisplay(record?.returnedAt)).trim();
      if (returnedAt) {
        metaParts.push(`退单时间 ${returnedAt}`);
      }
      returnPriceModalMeta.textContent = metaParts.join(" · ");

      if (!snapshot) {
        const emptyState = document.createElement("div");
        emptyState.className = "return-price-empty";
        emptyState.textContent = "未保存退单前价格";
        returnPriceModalContent.appendChild(emptyState);
        return;
      }

      const grid = document.createElement("div");
      grid.className = "return-price-grid";
      [
        { label: "付款价", value: snapshot.paymentPrice },
        { label: "会计价", value: snapshot.totalPrice },
        { label: "溢价", value: snapshot.premiumPrice },
        { label: "结算价", value: snapshot.settlementPrice }
      ].forEach((entry) => {
        const item = document.createElement("section");
        item.className = "return-price-item";

        const label = document.createElement("span");
        label.className = "return-price-label";
        label.textContent = entry.label;

        const value = document.createElement("strong");
        value.className = "return-price-value";
        value.textContent = Number.isFinite(Number(entry.value)) ? toMoney(entry.value) : "未记录";

        item.appendChild(label);
        item.appendChild(value);
        grid.appendChild(item);
      });
      returnPriceModalContent.appendChild(grid);
    }

    function openReturnPriceModal(record) {
      if (!record || typeof record !== "object") return;
      if (isAccountantLogin()) return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeRecordHistoryModal();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      renderReturnPriceModalContent(record);
      returnPriceModal.hidden = false;
      returnPriceModal.classList.remove("modal-enter");
      returnPriceModalCard.classList.remove("modal-enter");
      void returnPriceModal.offsetWidth;
      returnPriceModal.classList.add("modal-enter");
      returnPriceModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (returnPriceModalCard) {
        returnPriceModalCard.focus();
      }
    }

    function closeReturnPriceModal() {
      returnPriceModal.classList.remove("modal-enter");
      returnPriceModalCard.classList.remove("modal-enter");
      returnPriceModal.hidden = true;
      if (returnPriceModalMeta) {
        returnPriceModalMeta.textContent = "";
      }
      if (returnPriceModalContent) {
        returnPriceModalContent.innerHTML = "";
      }
      syncModalOpenState();
    }

    function getRecordHistoryRoleText(role) {
      const normalizedRole = String(role || "").trim().toLowerCase();
      if (normalizedRole === "dispatcher") return "接待员";
      if (normalizedRole === "accountant") return "会计";
      if (normalizedRole === "boss") return "管理员";
      return "";
    }

    function getRecordHistoryStatusText(value) {
      const normalizedStatus = normalizeRecordCheckStatus(value);
      if (!normalizedStatus) return "空";
      return getRecordStatusChipText({ checkStatus: normalizedStatus }, { showElapsedDays: false });
    }

    const RECORD_HISTORY_FIELD_ORDER = [
      "checkStatus",
      "paymentPrice",
      "totalPrice",
      "premiumPrice",
      "settlementPrice",
      "isSettled",
      "settledAt",
      "settledBy",
      "settlementInvoiceImage",
      "invoiceUploadedAt",
      "invoiceUploadedBy",
      "date",
      "isMonthlySettlement",
      "dispatcher",
      "accountant",
      "platform",
      "shopName",
      "source",
      "orderNo",
      "customer",
      "summary",
      "remark",
      "completedAt",
      "customerFeedback"
    ];

    const ACCOUNTANT_RECORD_HISTORY_FIELD_ORDER = [
      "date",
      "dispatcher",
      "customer",
      "summary",
      "remark",
      "settlementPrice",
      "checkStatus",
      "isSettled"
    ];
    const ACCOUNTANT_RECORD_HISTORY_FIELD_SET = new Set(ACCOUNTANT_RECORD_HISTORY_FIELD_ORDER);

    const RECORD_HISTORY_FIELD_LABELS = {
      checkStatus: "状态",
      paymentPrice: "付款价",
      totalPrice: "会计价",
      premiumPrice: "溢价",
      settlementPrice: "结算价",
      isSettled: "结算",
      settledAt: "结算时间",
      settledBy: "结算人",
      settlementInvoiceImage: "发票",
      invoiceUploadedAt: "发票上传时间",
      invoiceUploadedBy: "发票上传人",
      date: "日期",
      isMonthlySettlement: "月结勾选",
      dispatcher: "接待人",
      accountant: "会计",
      platform: "平台",
      shopName: "店铺名",
      source: "来源",
      orderNo: "订单号",
      customer: "客户",
      summary: "任务简介",
      remark: "备注",
      completedAt: "完工时间",
      customerFeedback: "客户反馈"
    };

    function getRecordHistoryFieldSortWeight(field) {
      const index = RECORD_HISTORY_FIELD_ORDER.indexOf(String(field || "").trim());
      return index >= 0 ? index : RECORD_HISTORY_FIELD_ORDER.length;
    }

    function getRecordHistoryFieldLabel(field, fallbackLabel = "") {
      const normalizedField = String(field || "").trim();
      const preferredLabel = String(fallbackLabel || "").trim();
      if (isAccountantLogin() && RECORD_HISTORY_FIELD_LABELS[normalizedField]) {
        return RECORD_HISTORY_FIELD_LABELS[normalizedField];
      }
      if (preferredLabel) return preferredLabel;
      return RECORD_HISTORY_FIELD_LABELS[normalizedField] || normalizedField;
    }

    function isRecordHistoryFieldAllowed(field) {
      const normalizedField = String(field || "").trim();
      if (!normalizedField) return false;
      if (!isAccountantLogin()) return true;
      return ACCOUNTANT_RECORD_HISTORY_FIELD_SET.has(normalizedField);
    }

    function getRecordHistoryFieldOrder() {
      return isAccountantLogin()
        ? [...ACCOUNTANT_RECORD_HISTORY_FIELD_ORDER]
        : [...RECORD_HISTORY_FIELD_ORDER];
    }

    function getRecordHistoryRecordValue(record, field) {
      const item = record && typeof record === "object" ? record : {};
      const normalizedField = String(field || "").trim();
      if (!normalizedField) return "";
      if (normalizedField === "premiumPrice") {
        return getPremiumValue(item);
      }
      if (normalizedField === "checkStatus") {
        return normalizeRecordCheckStatus(item.checkStatus);
      }
      if (normalizedField === "isMonthlySettlement") {
        return getMonthlySettlementLabel(item?.isMonthlySettlement);
      }
      if (normalizedField === "isSettled") {
        if (!isRecordCompleted(item) && !isRecordSettled(item) && !isRecordInvoiceUploaded(item)) {
          return "";
        }
        return getRecordSettlementLabel(item);
      }
      if (normalizedField === "settlementInvoiceImage") {
        const image = getSettlementInvoiceImage(item);
        return image ? (image.name || image.url || image.fileName) : "";
      }
      if (normalizedField === "dispatcher") {
        return normalizeDispatcherTag(item.dispatcher) || String(item.dispatcher || "").trim();
      }
      if (normalizedField === "accountant") {
        return String(item.accountant || "").trim();
      }
      return item?.[normalizedField];
    }

    function collectRecordHistoryChangedFieldLabels(historyItems) {
      const labelMap = new Map();
      const chronologicalItems = Array.isArray(historyItems) ? [...historyItems].reverse() : [];
      chronologicalItems.forEach((entry) => {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        changes.forEach((change) => {
          const field = String(change?.field || "").trim();
          if (!field || !isRecordHistoryFieldAllowed(field) || labelMap.has(field)) return;
          labelMap.set(field, String(change?.label || "").trim());
        });
      });
      return labelMap;
    }

    function shouldDisplayRecordHistoryBaselineField(field, value) {
      const normalizedField = String(field || "").trim();
      if (!normalizedField || !isRecordHistoryFieldAllowed(normalizedField)) return false;
      if ([
        "checkStatus",
        "paymentPrice",
        "totalPrice",
        "premiumPrice",
        "settlementPrice",
        "date",
        "dispatcher",
        "accountant",
        "platform",
        "shopName",
        "source",
        "orderNo",
        "customer",
        "summary",
        "remark"
      ].includes(normalizedField)) {
        return getRecordHistoryValueText(normalizedField, value) !== "空";
      }
      return false;
    }

    function getRecordHistoryFieldColumns(record, historyItems) {
      const changedFieldLabels = collectRecordHistoryChangedFieldLabels(historyItems);
      const orderedFields = getRecordHistoryFieldOrder();
      changedFieldLabels.forEach((_, field) => {
        if (isRecordHistoryFieldAllowed(field) && !orderedFields.includes(field)) {
          orderedFields.push(field);
        }
      });
      const initialSnapshot = buildRecordHistoryInitialSnapshot(record, orderedFields, historyItems);
      const fieldColumns = orderedFields.filter((field) => (
        changedFieldLabels.has(field) || shouldDisplayRecordHistoryBaselineField(field, initialSnapshot[field])
      )).map((field) => ({
        field,
        label: getRecordHistoryFieldLabel(field, changedFieldLabels.get(field))
      })).sort((left, right) => {
        const weightDiff = getRecordHistoryFieldSortWeight(left.field) - getRecordHistoryFieldSortWeight(right.field);
        if (weightDiff !== 0) return weightDiff;
        return String(left.label || "").localeCompare(String(right.label || ""), "zh-CN", {
          numeric: true,
          sensitivity: "base"
        });
      });
      return {
        fieldColumns,
        initialSnapshot
      };
    }

    function buildRecordHistoryInitialSnapshot(record, fields, historyItems) {
      const snapshot = {};
      (Array.isArray(fields) ? fields : []).forEach((entry) => {
        const field = typeof entry === "string" ? entry : String(entry?.field || "").trim();
        if (!field) return;
        snapshot[field] = getRecordHistoryRecordValue(record, field);
      });
      (Array.isArray(historyItems) ? historyItems : []).forEach((entry) => {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        changes.forEach((change) => {
          const field = String(change?.field || "").trim();
          if (!field || !Object.prototype.hasOwnProperty.call(snapshot, field)) return;
          snapshot[field] = change?.before;
        });
      });
      return snapshot;
    }

    function createRecordHistoryValueNode(field, value, variant = "neutral") {
      const valueNode = document.createElement("span");
      valueNode.className = `record-history-table-value ${variant}`;
      valueNode.textContent = getRecordHistoryValueText(field, value);
      return valueNode;
    }

    function getRecordHistoryFieldWidth(field) {
      const normalizedField = String(field || "").trim();
      if (["summary", "remark", "customerFeedback"].includes(normalizedField)) return "220px";
      if (["shopName"].includes(normalizedField)) return "172px";
      if (["settlementInvoiceImage", "invoiceUploadedAt"].includes(normalizedField)) return "168px";
      if (["platform", "source", "customer", "orderNo", "dispatcher", "accountant", "date", "settledBy", "invoiceUploadedBy"].includes(normalizedField)) {
        return "136px";
      }
      return "124px";
    }

    function getRecordHistoryValueText(field, value) {
      const normalizedField = String(field || "").trim();
      if (["paymentPrice", "totalPrice", "premiumPrice", "settlementPrice"].includes(normalizedField)) {
        const amount = Number(value);
        return Number.isFinite(amount) ? toMoney(amount) : "空";
      }
      if (normalizedField === "checkStatus") {
        return getRecordHistoryStatusText(value);
      }
      if (normalizedField === "isSettled") {
        const text = getSettlementWorkflowStatusText(value);
        return text || "空";
      }
      if (normalizedField === "isMonthlySettlement") {
        const text = getMonthlySettlementLabel(value);
        return text || "空";
      }
      if (normalizedField === "completedAt" || normalizedField === "settledAt" || normalizedField === "invoiceUploadedAt") {
        const text = String(formatDateTimeDisplay(value)).trim();
        return text || "空";
      }
      const text = String(value || "").trim();
      return text || "空";
    }

    function renderAccountantRecordHistoryTable(record, historyItems, fieldColumns, initialSnapshot) {
      const chronologicalHistory = [...historyItems].reverse();

      const tableWrap = document.createElement("div");
      tableWrap.className = "record-history-grid-wrap accountant-history-grid-wrap";

      const matrix = document.createElement("div");
      matrix.className = "record-history-grid-table accountant-history-grid-table";
      matrix.setAttribute("role", "table");

      const gridTemplateColumns = fieldColumns.map((column) => getRecordHistoryFieldWidth(column.field)).join(" ");

      const headRow = document.createElement("div");
      headRow.className = "record-history-grid-row head";
      headRow.setAttribute("role", "row");
      headRow.style.gridTemplateColumns = gridTemplateColumns;
      fieldColumns.forEach((column) => {
        const headCell = document.createElement("div");
        headCell.className = "record-history-grid-head field";
        headCell.dataset.field = column.field;
        headCell.setAttribute("role", "columnheader");
        headCell.textContent = column.label;
        headRow.appendChild(headCell);
      });
      matrix.appendChild(headRow);

      const initialRow = document.createElement("div");
      initialRow.className = "record-history-grid-row initial";
      initialRow.setAttribute("role", "row");
      initialRow.style.gridTemplateColumns = gridTemplateColumns;
      const initialLabel = `初始值 ${formatDateTimeDisplay(record?.createdAt) || ""}`.trim();
      if (initialLabel) {
        initialRow.title = initialLabel;
        initialRow.setAttribute("aria-label", initialLabel);
      }
      fieldColumns.forEach((column) => {
        const cell = document.createElement("div");
        cell.className = "record-history-grid-cell initial";
        cell.dataset.field = column.field;
        cell.appendChild(createRecordHistoryValueNode(column.field, initialSnapshot[column.field], "initial"));
        initialRow.appendChild(cell);
      });
      matrix.appendChild(initialRow);

      const appendChangeRow = (entry, index, changedMap) => {
        const row = document.createElement("div");
        row.className = "record-history-grid-row";
        row.setAttribute("role", "row");
        row.style.gridTemplateColumns = gridTemplateColumns;
        const rowLabel = [
          String(index + 1).padStart(2, "0"),
          String(entry?.actionLabel || "").trim() || "修改",
          String(entry?.operatedBy || "").trim(),
          formatDateTimeDisplay(entry?.operatedAt)
        ].filter(Boolean).join(" · ");
        if (rowLabel) {
          row.title = rowLabel;
          row.setAttribute("aria-label", rowLabel);
        }

        fieldColumns.forEach((column) => {
          const cell = document.createElement("div");
          cell.className = "record-history-grid-cell";
          cell.dataset.field = column.field;
          const change = changedMap.get(column.field);
          if (!change) {
            cell.classList.add("empty");
            cell.textContent = "·";
            row.appendChild(cell);
            return;
          }

          cell.classList.add("changed");
          cell.title = `${getRecordHistoryValueText(column.field, change.before)} -> ${getRecordHistoryValueText(column.field, change.after)}`;
          cell.appendChild(createRecordHistoryValueNode(column.field, change.after, "changed"));
          row.appendChild(cell);
        });
        matrix.appendChild(row);
      };

      chronologicalHistory.forEach((entry, index) => {
        const changedMap = new Map();
        (Array.isArray(entry?.changes) ? entry.changes : []).forEach((change) => {
          const field = String(change?.field || "").trim();
          if (!isRecordHistoryFieldAllowed(field)) return;
          changedMap.set(field, change);
        });
        if (!changedMap.size) return;
        appendChangeRow(entry, index, changedMap);
      });

      tableWrap.appendChild(matrix);
      recordHistoryModalContent.appendChild(tableWrap);
    }

    function renderRecordHistoryModalContent(record) {
      if (!recordHistoryModal || !recordHistoryModalMeta || !recordHistoryModalContent) return;
      recordHistoryModalContent.innerHTML = "";
      recordHistoryModal.dataset.recordId = String(record?.id || "").trim();

      const metaParts = [
        formatDateDisplay(record?.date),
        String(record?.customer || "").trim() || "未填客户",
        getRecordStatusChipText(record)
      ].filter(Boolean);
      const orderNo = String(record?.orderNo || "").trim();
      if (orderNo && !isAccountantLogin()) {
        metaParts.splice(2, 0, `订单号 ${orderNo}`);
      }
      recordHistoryModalMeta.textContent = metaParts.join(" · ");

      const historyItems = Array.isArray(record?.operationHistory) ? record.operationHistory : [];
      if (!historyItems.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "record-history-empty";
        emptyState.textContent = "暂无操作历史";
        recordHistoryModalContent.appendChild(emptyState);
        return;
      }

      const { fieldColumns, initialSnapshot } = getRecordHistoryFieldColumns(record, historyItems);
      if (!fieldColumns.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "record-history-empty";
        emptyState.textContent = isAccountantLogin() ? "当前历史没有可展示字段" : "当前历史没有字段变更";
        recordHistoryModalContent.appendChild(emptyState);
        return;
      }

      if (isAccountantLogin()) {
        renderAccountantRecordHistoryTable(record, historyItems, fieldColumns, initialSnapshot);
        return;
      }

      const chronologicalHistory = [...historyItems].reverse();

      const tableWrap = document.createElement("div");
      tableWrap.className = "record-history-grid-wrap";

      const matrix = document.createElement("div");
      matrix.className = "record-history-grid-table";
      matrix.setAttribute("role", "table");
      matrix.style.setProperty("--record-history-step-width", "120px");
      matrix.style.setProperty("--record-history-operator-width", "156px");
      matrix.style.setProperty("--record-history-time-width", "168px");

      const gridTemplateColumns = [
        "var(--record-history-step-width)",
        "var(--record-history-operator-width)",
        "var(--record-history-time-width)",
        ...fieldColumns.map((column) => getRecordHistoryFieldWidth(column.field))
      ].join(" ");

      const headRow = document.createElement("div");
      headRow.className = "record-history-grid-row head";
      headRow.setAttribute("role", "row");
      headRow.style.gridTemplateColumns = gridTemplateColumns;

      [
        { key: "step", label: "阶段" },
        { key: "operator", label: "操作人" },
        { key: "time", label: "时间" }
      ].forEach((column) => {
        const headCell = document.createElement("div");
        headCell.className = `record-history-grid-head meta ${column.key}`;
        headCell.setAttribute("role", "columnheader");
        headCell.textContent = column.label;
        headRow.appendChild(headCell);
      });
      fieldColumns.forEach((column) => {
        const headCell = document.createElement("div");
        headCell.className = "record-history-grid-head field";
        headCell.dataset.field = column.field;
        headCell.setAttribute("role", "columnheader");
        headCell.textContent = column.label;
        headRow.appendChild(headCell);
      });
      matrix.appendChild(headRow);

      const initialRow = document.createElement("div");
      initialRow.className = "record-history-grid-row initial";
      initialRow.setAttribute("role", "row");
      initialRow.style.gridTemplateColumns = gridTemplateColumns;

      const initialStepCell = document.createElement("div");
      initialStepCell.className = "record-history-grid-meta-cell step";
      const initialBadge = document.createElement("span");
      initialBadge.className = "record-history-grid-step-badge initial";
      initialBadge.textContent = "初始值";
      initialStepCell.appendChild(initialBadge);
      initialRow.appendChild(initialStepCell);

      const initialOperatorCell = document.createElement("div");
      initialOperatorCell.className = "record-history-grid-meta-cell operator";
      initialOperatorCell.textContent = "记录起点";
      initialRow.appendChild(initialOperatorCell);

      const initialTimeCell = document.createElement("div");
      initialTimeCell.className = "record-history-grid-meta-cell time";
      initialTimeCell.textContent = formatDateTimeDisplay(record?.createdAt) || "空";
      initialRow.appendChild(initialTimeCell);

      fieldColumns.forEach((column) => {
        const cell = document.createElement("div");
        cell.className = "record-history-grid-cell initial";
        cell.dataset.field = column.field;
        cell.appendChild(createRecordHistoryValueNode(column.field, initialSnapshot[column.field], "initial"));
        initialRow.appendChild(cell);
      });
      matrix.appendChild(initialRow);

      chronologicalHistory.forEach((entry, index) => {
        const row = document.createElement("div");
        row.className = "record-history-grid-row";
        row.setAttribute("role", "row");
        row.style.gridTemplateColumns = gridTemplateColumns;

        const stepCell = document.createElement("div");
        stepCell.className = "record-history-grid-meta-cell step";

        const stepBadge = document.createElement("span");
        stepBadge.className = "record-history-grid-step-badge";
        stepBadge.textContent = String(index + 1).padStart(2, "0");

        const stepLabel = document.createElement("strong");
        stepLabel.className = "record-history-grid-step-label";
        stepLabel.textContent = String(entry?.actionLabel || "").trim() || "修改";

        stepCell.appendChild(stepBadge);
        stepCell.appendChild(stepLabel);
        row.appendChild(stepCell);

        const operatorCell = document.createElement("div");
        operatorCell.className = "record-history-grid-meta-cell operator";
        operatorCell.textContent = [
          String(entry?.operatedBy || "").trim() || "未记录账号",
          getRecordHistoryRoleText(entry?.operatedRole)
        ].filter(Boolean).join(" · ");
        row.appendChild(operatorCell);

        const timeCell = document.createElement("div");
        timeCell.className = "record-history-grid-meta-cell time";
        timeCell.textContent = formatDateTimeDisplay(entry?.operatedAt) || "空";
        row.appendChild(timeCell);

        const changedMap = new Map();
        (Array.isArray(entry?.changes) ? entry.changes : []).forEach((change) => {
          const field = String(change?.field || "").trim();
          if (!field) return;
          changedMap.set(field, change);
        });

        fieldColumns.forEach((column) => {
          const cell = document.createElement("div");
          cell.className = "record-history-grid-cell";
          cell.dataset.field = column.field;
          const change = changedMap.get(column.field);
          if (!change) {
            cell.classList.add("empty");
            cell.textContent = "·";
            row.appendChild(cell);
            return;
          }

          cell.classList.add("changed");
          cell.title = `${getRecordHistoryValueText(column.field, change.before)} -> ${getRecordHistoryValueText(column.field, change.after)}`;
          cell.appendChild(createRecordHistoryValueNode(column.field, change.after, "changed"));
          row.appendChild(cell);
        });

        matrix.appendChild(row);
      });

      tableWrap.appendChild(matrix);
      recordHistoryModalContent.appendChild(tableWrap);
    }

    function openRecordHistoryModal(record) {
      if (!record || typeof record !== "object") return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      renderRecordHistoryModalContent(record);
      recordHistoryModal.hidden = false;
      recordHistoryModal.classList.remove("modal-enter");
      recordHistoryModalCard.classList.remove("modal-enter");
      void recordHistoryModal.offsetWidth;
      recordHistoryModal.classList.add("modal-enter");
      recordHistoryModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (recordHistoryModalCard) {
        recordHistoryModalCard.focus();
      }
    }

    function closeRecordHistoryModal() {
      if (!recordHistoryModal) return;
      recordHistoryModal.classList.remove("modal-enter");
      recordHistoryModalCard.classList.remove("modal-enter");
      recordHistoryModal.hidden = true;
      recordHistoryModal.dataset.recordId = "";
      if (recordHistoryModalMeta) {
        recordHistoryModalMeta.textContent = "";
      }
      if (recordHistoryModalContent) {
        recordHistoryModalContent.innerHTML = "";
      }
      syncModalOpenState();
    }

    function openInvoicePreviewModal(record) {
      if (!invoicePreviewModal || !invoicePreviewModalCard || !invoicePreviewImage || !invoicePreviewMeta) return;
      const image = getSettlementInvoiceImage(record);
      if (!image) return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      const metaParts = [
        String(record?.accountant || "").trim(),
        String(record?.invoiceUploadedBy || "").trim(),
        formatDateTimeDisplay(record?.invoiceUploadedAt)
      ].filter(Boolean);
      invoicePreviewMeta.textContent = metaParts.join(" · ");
      invoicePreviewImage.src = image.url;
      invoicePreviewImage.alt = image.name || "发票图片";
      invoicePreviewModal.hidden = false;
      invoicePreviewModal.classList.remove("modal-enter");
      invoicePreviewModalCard.classList.remove("modal-enter");
      void invoicePreviewModal.offsetWidth;
      invoicePreviewModal.classList.add("modal-enter");
      invoicePreviewModalCard.classList.add("modal-enter");
      syncModalOpenState();
      invoicePreviewModalCard.focus();
    }

    function closeInvoicePreviewModal() {
      if (!invoicePreviewModal || !invoicePreviewModalCard) return;
      invoicePreviewModal.classList.remove("modal-enter");
      invoicePreviewModalCard.classList.remove("modal-enter");
      invoicePreviewModal.hidden = true;
      if (invoicePreviewMeta) {
        invoicePreviewMeta.textContent = "";
      }
      if (invoicePreviewImage) {
        invoicePreviewImage.removeAttribute("src");
        invoicePreviewImage.alt = "";
      }
      syncModalOpenState();
    }

    function renderBossSettlementSummaryContent() {
      if (!bossSettlementSummaryTitleCount || !bossSettlementSummaryAmount || !bossSettlementSummaryTax) return;
      const {
        count,
        readyCount,
        alreadySettledCount,
        returnedCount,
        totalSettlement
      } = getBossSettlementSelectionSummary();
      const settlementTax = getSettlementTaxAmount(totalSettlement);
      bossSettlementSummaryTitleCount.textContent = `${readyCount} 条`;
      bossSettlementSummaryAmount.textContent = `${toMoney(totalSettlement)} 元`;
      bossSettlementSummaryTax.textContent = `${toMoney(settlementTax)} 元`;
      if (bossSettlementSummaryNote) {
        const noteParts = [];
        if (alreadySettledCount > 0) {
          noteParts.push(`${getRecordWorkflowStatusLabelByKey("settled")} ${alreadySettledCount} 条`);
        }
        if (returnedCount > 0) {
          noteParts.push(`退单 ${returnedCount} 条`);
        }
        if (count > readyCount) {
          noteParts.unshift(`已选 ${count} 条`);
        }
        resetSettlementSummaryStatus();
        bossSettlementSummaryNote.textContent = noteParts.join("，");
        bossSettlementSummaryNote.hidden = noteParts.length === 0;
      }
      if (bossSettlementSummarySubmitBtn) {
        if (isBossSettlementSubmitting) {
          bossSettlementSummarySubmitBtn.disabled = true;
          bossSettlementSummarySubmitBtn.textContent = "结算中...";
          return;
        }
        bossSettlementSummarySubmitBtn.disabled = readyCount === 0;
        bossSettlementSummarySubmitBtn.textContent = readyCount > 0
          ? "确认结算"
          : "已全部结算";
      }
    }

    function updateBossSettlementControls(visibleRecords = getSortedRecords(getFilteredRecords())) {
      const canSettleRecords = canCurrentAccountSettleRecords();
      syncBossRecordSelection(records);

      if (bossSettlementBtn) {
        bossSettlementBtn.hidden = !canSettleRecords;
      }
      if (tableSelectCol) {
        tableSelectCol.hidden = !canSettleRecords;
      }
      if (tableSelectHead) {
        tableSelectHead.hidden = !canSettleRecords;
      }

      if (!canSettleRecords) {
        if (tableSelectAllCheckbox) {
          tableSelectAllCheckbox.checked = false;
          tableSelectAllCheckbox.indeterminate = false;
          tableSelectAllCheckbox.disabled = true;
        }
        if (bossSettlementBtn) {
          bossSettlementBtn.disabled = true;
          bossSettlementBtn.textContent = "结算";
        }
        return;
      }

      const visibleRecordIds = (Array.isArray(visibleRecords) ? visibleRecords : [])
        .filter((item) => isBossSettlementRecordSelectable(item))
        .map((item) => String(item?.id || "").trim())
        .filter(Boolean);
      const selectedVisibleCount = visibleRecordIds.filter((recordId) => isBossRecordSelected(recordId)).length;
      const hasVisibleRecords = visibleRecordIds.length > 0;
      const allVisibleSelected = hasVisibleRecords && selectedVisibleCount === visibleRecordIds.length;

      if (tableSelectAllCheckbox) {
        tableSelectAllCheckbox.checked = allVisibleSelected;
        tableSelectAllCheckbox.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleRecordIds.length;
        tableSelectAllCheckbox.disabled = !hasVisibleRecords;
      }

      const { count, readyCount } = getBossSettlementSelectionSummary();
      if (bossSettlementBtn) {
        bossSettlementBtn.disabled = count === 0;
        if (count === 0) {
          bossSettlementBtn.textContent = "结算";
        } else if (readyCount === count) {
          bossSettlementBtn.textContent = `结算（${count}）`;
        } else {
          bossSettlementBtn.textContent = `结算（${readyCount}/${count}）`;
        }
      }

      if (!bossSettlementSummaryModal.hidden) {
        renderBossSettlementSummaryContent();
      }
    }

    function formatBossSettlementDetailStatusLabel(statusKey) {
      if (statusKey === "uploaded") return "已上传";
      if (statusKey === "partial") return "部分上传";
      return "待上传";
    }

    function getBossSettlementDetailSummary(sourceRecords = records) {
      const recentRecords = getRecentBossSettlementRecords(sourceRecords);
      const groupMap = new Map();
      let totalSettlement = 0;
      let latestSettledAt = "";
      let latestSettledAtTime = 0;

      recentRecords.forEach((record) => {
        const accountant = String(record?.accountant || "").trim() || "未分配会计";
        const settlement = Number(record?.settlementPrice);
        const settledAt = String(record?.settledAt || "").trim();
        const settledAtTime = new Date(settledAt || 0).getTime();
        const uploadedAt = String(record?.invoiceUploadedAt || "").trim();
        const uploadedAtTime = new Date(uploadedAt || 0).getTime();
        const uploadedBy = String(record?.invoiceUploadedBy || record?.invoiceUploadedByUsername || "").trim();
        const isUploaded = isRecordInvoiceUploaded(record);
        const current = groupMap.get(accountant) || {
          accountant,
          recordCount: 0,
          uploadedCount: 0,
          totalSettlement: 0,
          latestUploadedAt: "",
          latestUploadedBy: ""
        };

        current.recordCount += 1;
        if (Number.isFinite(settlement)) {
          current.totalSettlement += settlement;
          totalSettlement += settlement;
        }
        if (isUploaded) {
          current.uploadedCount += 1;
          const currentUploadedAtTime = new Date(current.latestUploadedAt || 0).getTime();
          if (!current.latestUploadedAt || uploadedAtTime >= currentUploadedAtTime) {
            current.latestUploadedAt = uploadedAt;
            current.latestUploadedBy = uploadedBy;
          }
        }
        if (settledAt && settledAtTime >= latestSettledAtTime) {
          latestSettledAt = settledAt;
          latestSettledAtTime = settledAtTime;
        }

        groupMap.set(accountant, current);
      });

      const statusPriority = { pending: 0, partial: 1, uploaded: 2 };
      const groups = Array.from(groupMap.values())
        .map((group) => {
          const statusKey = getBossSettlementDetailStatusKey(group.recordCount, group.uploadedCount);
          return {
            ...group,
            statusKey,
            statusLabel: formatBossSettlementDetailStatusLabel(statusKey)
          };
        })
        .sort((left, right) => {
          const priorityDiff = (statusPriority[left.statusKey] ?? 99) - (statusPriority[right.statusKey] ?? 99);
          if (priorityDiff) return priorityDiff;
          return left.accountant.localeCompare(right.accountant, "zh-CN", { numeric: true, sensitivity: "base" });
        });

      const uploadedAccountantCount = groups.filter((item) => item.statusKey === "uploaded").length;
      const partialAccountantCount = groups.filter((item) => item.statusKey === "partial").length;
      const pendingAccountantCount = groups.filter((item) => item.statusKey === "pending").length;
      const uploadedRecordCount = groups.reduce((sum, item) => sum + item.uploadedCount, 0);

      return {
        recentRecords,
        groups,
        recordCount: recentRecords.length,
        accountantCount: groups.length,
        totalSettlement,
        latestSettledAt,
        uploadedAccountantCount,
        partialAccountantCount,
        pendingAccountantCount,
        uploadedRecordCount
      };
    }

    function renderBossSettlementDetailModalContent() {
      if (
        !bossSettlementDetailTitleCount
        || !bossSettlementDetailMeta
        || !bossSettlementDetailAccountantCount
        || !bossSettlementDetailInvoiceProgress
        || !bossSettlementDetailAmount
        || !bossSettlementDetailList
      ) {
        return;
      }

      const {
        groups,
        recordCount,
        accountantCount,
        totalSettlement,
        latestSettledAt,
        uploadedRecordCount
      } = getBossSettlementDetailSummary();

      bossSettlementDetailTitleCount.textContent = `${recordCount} 条`;
      bossSettlementDetailMeta.textContent = latestSettledAt
        ? `本次结算时间 ${formatDateTimeDisplay(latestSettledAt)}`
        : "";
      bossSettlementDetailAccountantCount.textContent = `${accountantCount} 位`;
      bossSettlementDetailInvoiceProgress.textContent = `${uploadedRecordCount}/${recordCount || 0} 条`;
      bossSettlementDetailAmount.textContent = `${toMoney(totalSettlement)} 元`;
      bossSettlementDetailList.innerHTML = "";

      if (!groups.length) {
        const empty = document.createElement("div");
        empty.className = "settlement-detail-empty";
        empty.textContent = "当前没有刚结算完成的数据。";
        bossSettlementDetailList.appendChild(empty);
        return;
      }

      groups.forEach((group) => {
        const card = document.createElement("article");
        card.className = `settlement-detail-card ${group.statusKey}`;

        const top = document.createElement("div");
        top.className = "settlement-detail-card-top";

        const heading = document.createElement("div");
        heading.className = "settlement-detail-card-heading";

        const accountant = document.createElement("strong");
        accountant.className = "settlement-detail-accountant";
        accountant.textContent = group.accountant;

        const summary = document.createElement("div");
        summary.className = "settlement-detail-card-summary";
        summary.textContent = `${group.recordCount} 条 · 结算价 ${toMoney(group.totalSettlement)} 元`;

        heading.appendChild(accountant);
        heading.appendChild(summary);

        const status = document.createElement("span");
        status.className = `record-status-chip ${group.statusKey}`;
        status.textContent = group.statusLabel;

        top.appendChild(heading);
        top.appendChild(status);

        const facts = document.createElement("div");
        facts.className = "settlement-detail-card-facts";

        const progress = document.createElement("span");
        progress.className = "settlement-detail-fact";
        progress.textContent = `发票 ${group.uploadedCount}/${group.recordCount} 条`;
        facts.appendChild(progress);

        const uploader = document.createElement("span");
        uploader.className = "settlement-detail-fact";
        uploader.textContent = group.latestUploadedBy
          ? `上传人 ${group.latestUploadedBy}`
          : "等待会计上传发票";
        facts.appendChild(uploader);

        const uploadedAt = document.createElement("span");
        uploadedAt.className = "settlement-detail-fact";
        uploadedAt.textContent = group.latestUploadedAt
          ? `上传时间 ${formatDateTimeDisplay(group.latestUploadedAt)}`
          : "上传时间 待上传";
        facts.appendChild(uploadedAt);

        card.appendChild(top);
        card.appendChild(facts);
        bossSettlementDetailList.appendChild(card);
      });
    }

    function updateBossSettlementDetailControls() {
      if (!bossSettlementDetailBtn) return;
      const canSettleRecords = canCurrentAccountSettleRecords();
      const { recordCount, accountantCount } = getBossSettlementDetailSummary();
      const shouldShow = canSettleRecords && recordCount > 0;

      bossSettlementDetailBtn.hidden = !shouldShow;
      bossSettlementDetailBtn.disabled = !shouldShow;
      bossSettlementDetailBtn.textContent = accountantCount > 0 ? `结算详细（${accountantCount}）` : "结算详细";
      bossSettlementDetailBtn.title = shouldShow ? `查看刚结算完成的 ${recordCount} 条数据` : "";

      if (!shouldShow) {
        if (bossSettlementDetailModal && !bossSettlementDetailModal.hidden) {
          closeBossSettlementDetailModal();
        }
        return;
      }

      if (bossSettlementDetailModal && !bossSettlementDetailModal.hidden) {
        renderBossSettlementDetailModalContent();
      }
    }

    function updateAccountantInvoiceUploadControls() {
      if (!accountantInvoiceUploadBtn) return;
      const targetRecords = getAccountantInvoiceUploadTargetRecords(records);
      const count = targetRecords.length;
      const shouldShow = isAccountantLogin() && count > 0;
      accountantInvoiceUploadBtn.hidden = !shouldShow;
      accountantInvoiceUploadBtn.disabled = !shouldShow || isInvoiceUploadSubmitting;
      accountantInvoiceUploadBtn.textContent = count > 0 ? `上传发票（${count}）` : "上传发票";
      accountantInvoiceUploadBtn.title = count > 0
        ? `上传后 ${count} 条数据会显示为${getRecordWorkflowStatusLabelByKey("uploaded")}`
        : "";
    }

    function getInvoiceSummaryItems(sourceRecords = []) {
      const itemMap = new Map();
      (Array.isArray(sourceRecords) ? sourceRecords : []).forEach((record) => {
        const invoiceImage = getSettlementInvoiceImage(record);
        if (!invoiceImage) return;
        const accountant = String(record?.accountant || "").trim() || "未记录会计";
        const uploadedAt = String(record?.invoiceUploadedAt || "").trim();
        const uploadedBy = String(record?.invoiceUploadedBy || "").trim();
        const key = [
          accountant,
          String(invoiceImage.fileName || invoiceImage.url || "").trim(),
          uploadedAt,
          uploadedBy
        ].join("\u0001");
        const current = itemMap.get(key) || {
          key,
          accountant,
          uploadedAt,
          uploadedBy,
          image: invoiceImage,
          recordIds: [],
          firstRecord: record,
          totalSettlement: 0
        };
        const recordId = String(record?.id || "").trim();
        if (recordId) {
          current.recordIds.push(recordId);
        }
        const settlement = Number(record?.settlementPrice);
        if (Number.isFinite(settlement)) {
          current.totalSettlement += settlement;
        }
        itemMap.set(key, current);
      });
      return Array.from(itemMap.values()).sort((left, right) => {
        const timeDiff = new Date(right.uploadedAt || 0).getTime() - new Date(left.uploadedAt || 0).getTime();
        if (timeDiff) return timeDiff;
        return left.accountant.localeCompare(right.accountant, "zh-CN", { numeric: true, sensitivity: "base" });
      });
    }

    function renderInvoiceSummaryPanel(visibleRecords = []) {
      if (!invoiceSummaryPanel || !invoiceSummaryTitle || !invoiceSummaryMeta || !invoiceSummaryList) return;
      const canViewInvoices = isBossLogin() || isAccountantLogin();
      const items = canViewInvoices ? getInvoiceSummaryItems(visibleRecords) : [];
      invoiceSummaryPanel.hidden = !items.length;
      invoiceSummaryList.innerHTML = "";
      if (!items.length) {
        invoiceSummaryTitle.textContent = "发票";
        invoiceSummaryMeta.textContent = "";
        return;
      }

      const recordCount = items.reduce((sum, item) => sum + item.recordIds.length, 0);
      invoiceSummaryTitle.textContent = `发票 ${items.length} 张`;
      invoiceSummaryMeta.textContent = `覆盖 ${recordCount} 条数据`;

      items.forEach((item) => {
        const card = document.createElement("article");
        card.className = "invoice-summary-card";

        const thumbBtn = document.createElement("button");
        thumbBtn.type = "button";
        thumbBtn.className = "invoice-summary-thumb";
        thumbBtn.dataset.recordId = String(item.firstRecord?.id || "").trim();
        thumbBtn.title = "查看发票图片";

        const thumbImage = document.createElement("img");
        thumbImage.src = item.image.url;
        thumbImage.alt = item.image.name || "发票图片";
        thumbBtn.appendChild(thumbImage);

        const body = document.createElement("div");
        body.className = "invoice-summary-body";

        const top = document.createElement("div");
        top.className = "invoice-summary-card-top";

        const accountant = document.createElement("strong");
        accountant.className = "invoice-summary-accountant";
        accountant.textContent = item.accountant;
        top.appendChild(accountant);

        const count = document.createElement("span");
        count.className = "invoice-summary-count";
        count.textContent = `${item.recordIds.length} 条`;
        top.appendChild(count);

        const meta = document.createElement("div");
        meta.className = "invoice-summary-card-meta";
        meta.textContent = [
          item.uploadedBy ? `上传人 ${item.uploadedBy}` : "",
          formatDateTimeDisplay(item.uploadedAt)
        ].filter(Boolean).join(" · ");

        const amount = document.createElement("div");
        amount.className = "invoice-summary-amount";
        amount.textContent = `结算价合计 ${toMoney(item.totalSettlement)} 元`;

        body.appendChild(top);
        body.appendChild(meta);
        body.appendChild(amount);

        card.appendChild(thumbBtn);
        card.appendChild(body);
        invoiceSummaryList.appendChild(card);
      });
    }

    function openBossSettlementSummaryModal() {
      if (!canCurrentAccountSettleRecords()) return;
      const { count } = getBossSettlementSelectionSummary();
      if (!count) {
        showAppStatus("请先选择要结算的数据。");
        return;
      }
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      renderBossSettlementSummaryContent();
      bossSettlementSummaryModal.hidden = false;
      bossSettlementSummaryModal.classList.remove("modal-enter");
      bossSettlementSummaryModalCard.classList.remove("modal-enter");
      void bossSettlementSummaryModal.offsetWidth;
      bossSettlementSummaryModal.classList.add("modal-enter");
      bossSettlementSummaryModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (bossSettlementSummarySubmitBtn) {
        bossSettlementSummarySubmitBtn.focus();
      }
    }

    function openBossSettlementDetailModal() {
      if (!bossSettlementDetailModal || !bossSettlementDetailModalCard) return;
      if (!canCurrentAccountSettleRecords()) return;
      const { recordCount } = getBossSettlementDetailSummary();
      if (!recordCount) {
        showAppStatus("当前没有刚结算完成的数据。");
        return;
      }
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      renderBossSettlementDetailModalContent();
      bossSettlementDetailModal.hidden = false;
      bossSettlementDetailModal.classList.remove("modal-enter");
      bossSettlementDetailModalCard.classList.remove("modal-enter");
      void bossSettlementDetailModal.offsetWidth;
      bossSettlementDetailModal.classList.add("modal-enter");
      bossSettlementDetailModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (bossSettlementDetailModalCard) {
        bossSettlementDetailModalCard.focus();
      }
    }

    function closeBossSettlementSummaryModal() {
      if (!bossSettlementSummaryModal) return;
      if (bossSettlementDetailModal && !bossSettlementDetailModal.hidden) {
        closeBossSettlementDetailModal();
      }
      bossSettlementSummaryModal.classList.remove("modal-enter");
      bossSettlementSummaryModalCard.classList.remove("modal-enter");
      bossSettlementSummaryModal.hidden = true;
      renderBossSettlementSummaryContent();
      syncModalOpenState();
    }

    function closeBossSettlementDetailModal() {
      if (!bossSettlementDetailModal || !bossSettlementDetailModalCard) return;
      bossSettlementDetailModal.classList.remove("modal-enter");
      bossSettlementDetailModalCard.classList.remove("modal-enter");
      bossSettlementDetailModal.hidden = true;
      syncModalOpenState();
    }

    async function submitBossSettlementSelection() {
      if (!canCurrentAccountSettleRecords()) return;
      if (isBossSettlementSubmitting) return;

      const {
        readySelectedRecords,
        readyCount,
        count,
        alreadySettledCount,
        returnedCount
      } = getBossSettlementSelectionSummary();
      if (!readyCount) {
        if (!count) {
          showSettlementSummaryStatus("请先选择要结算的数据。");
          return;
        }
        const messageParts = [`已选 ${count} 条`, "可结算 0 条"];
        if (alreadySettledCount > 0) {
          messageParts.push(`${getRecordWorkflowStatusLabelByKey("settled")} ${alreadySettledCount} 条`);
        }
        if (returnedCount > 0) {
          messageParts.push(`退单 ${returnedCount} 条`);
        }
        showSettlementSummaryStatus(`${messageParts.join("，")}。`);
        return;
      }

      const recordIds = readySelectedRecords
        .map((item) => String(item?.id || "").trim())
        .filter(Boolean);
      if (!recordIds.length) {
        showSettlementSummaryStatus("请选择要结算的数据。");
        return;
      }

      isBossSettlementSubmitting = true;
      showSettlementSummaryStatus("", "idle");
      renderBossSettlementSummaryContent();
      try {
        const { settledRecordIds, skippedRecordIds } = await settleRecordsByIds(recordIds);
        setRecentBossSettlementRecordIds(settledRecordIds);
        closeBossSettlementSummaryModal();
        const messageParts = [];
        if (settledRecordIds.length) {
          messageParts.push(`${getRecordWorkflowStatusLabelByKey("settled")} ${settledRecordIds.length} 条`);
        }
        if (skippedRecordIds.length) {
          messageParts.push(`跳过 ${skippedRecordIds.length} 条`);
        }
        showAppStatus(messageParts.length ? `${messageParts.join("，")}。` : "未处理任何数据。", settledRecordIds.length ? "ok" : "error");
      } catch (error) {
        console.error(error);
        showSettlementSummaryStatus(error.message || "结算失败，请稍后重试。");
      } finally {
        isBossSettlementSubmitting = false;
        renderBossSettlementSummaryContent();
      }
    }

    function formatMonthFilterChipLabel(rawValue) {
      return getDateFilterChipMeta(rawValue, filterState.dateStart, filterState.dateEnd).label;
    }

    function syncDateRangeFilterInputs(force = false) {
      if (filterDateStartInput && (force || document.activeElement !== filterDateStartInput)) {
        filterDateStartInput.value = String(filterState.dateStart || "").trim();
      }
      if (filterDateEndInput && (force || document.activeElement !== filterDateEndInput)) {
        filterDateEndInput.value = String(filterState.dateEnd || "").trim();
      }
    }

    function clearDateFilterState() {
      filterState.month = "";
      filterState.dateStart = "";
      filterState.dateEnd = "";
      syncDateRangeFilterInputs(true);
    }

    function applyDateRangeFilter() {
      const normalizedRange = getNormalizedDateRangeFilter(
        filterDateStartInput?.value || "",
        filterDateEndInput?.value || ""
      );
      filterState.month = "";
      filterState.dateStart = normalizedRange.start;
      filterState.dateEnd = normalizedRange.end;
      syncDateRangeFilterInputs(true);
    }

    function updateFilterButtonUI() {
      const hasDateFilter = hasDateFilterSelected();
      const dateFilterChip = getDateFilterChipMeta();
      filterMonthBtn.classList.toggle("active", hasDateFilter);
      filterDispatcherBtn.classList.toggle("active", Boolean(filterState.dispatcher));
      filterAccountantBtn.classList.toggle("active", Boolean(filterState.accountant));
      filterPlatformBtn.classList.toggle("active", Boolean(filterState.platform));
      filterShopBtn.classList.toggle("active", Boolean(filterState.shopName));
      filterSourceBtn.classList.toggle("active", Boolean(filterState.source));
      filterStatusBtn.classList.toggle("active", Boolean(filterState.status));
      filterSettledBtn.classList.toggle("active", Boolean(filterState.settled));
      if (filterMonthIndicator) filterMonthIndicator.classList.toggle("active", hasDateFilter);
      if (filterDispatcherIndicator) filterDispatcherIndicator.classList.toggle("active", Boolean(filterState.dispatcher));
      if (filterAccountantIndicator) filterAccountantIndicator.classList.toggle("active", Boolean(filterState.accountant));
      if (filterPlatformIndicator) filterPlatformIndicator.classList.toggle("active", Boolean(filterState.platform));
      if (filterShopIndicator) filterShopIndicator.classList.toggle("active", Boolean(filterState.shopName));
      if (filterSourceIndicator) filterSourceIndicator.classList.toggle("active", Boolean(filterState.source));
      if (filterStatusIndicator) filterStatusIndicator.classList.toggle("active", Boolean(filterState.status));
      if (filterSettledIndicator) filterSettledIndicator.classList.toggle("active", Boolean(filterState.settled));
      filterMonthBtn.setAttribute("aria-expanded", String(!filterMonthPopover.hidden));
      filterDispatcherBtn.setAttribute("aria-expanded", String(!filterDispatcherPopover.hidden));
      filterAccountantBtn.setAttribute("aria-expanded", String(!filterAccountantPopover.hidden));
      filterPlatformBtn.setAttribute("aria-expanded", String(!filterPlatformPopover.hidden));
      filterShopBtn.setAttribute("aria-expanded", String(!filterShopPopover.hidden));
      filterSourceBtn.setAttribute("aria-expanded", String(!filterSourcePopover.hidden));
      filterStatusBtn.setAttribute("aria-expanded", String(!filterStatusPopover.hidden));
      filterSettledBtn.setAttribute("aria-expanded", String(!filterSettledPopover.hidden));
      syncDateRangeFilterInputs();

      if (hasDateFilter) {
        const monthLabel = dateFilterChip.label || formatMonthFilterChipLabel(filterState.month);
        filterMonthValue.hidden = false;
        filterMonthValue.textContent = monthLabel;
        filterMonthValue.title = dateFilterChip.title || monthLabel;
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

      if (filterState.settled) {
        filterSettledValue.hidden = false;
        filterSettledValue.textContent = filterState.settled;
        filterSettledValue.title = filterState.settled;
      } else {
        filterSettledValue.hidden = true;
        filterSettledValue.textContent = "";
        filterSettledValue.title = "";
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
      filterSettledPopover.hidden = true;
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
        filterSettledPopover.hidden = true;
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
        filterSettledPopover.hidden = true;
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
        filterSettledPopover.hidden = true;
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
        filterSettledPopover.hidden = true;
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
        filterSettledPopover.hidden = true;
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
        filterSettledPopover.hidden = true;
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
        filterSettledPopover.hidden = true;
      }
      if (key === "settled") {
        updateFilterOptions();
        const open = filterSettledPopover.hidden;
        filterSettledPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
      }
      updateFilterButtonUI();
    }

    function setPageMode(isLoggedIn) {
      loginPage.hidden = isLoggedIn;
      appPage.hidden = !isLoggedIn;
      const isAccountant = isAccountantLogin();
      const isBoss = isBossLogin();
      const isDispatcher = Boolean(isLoggedIn && !isAccountant && !isBoss);
      const canSettleRecords = Boolean(isLoggedIn && canCurrentAccountSettleRecords());
      if (!shouldShowProfitColumn() && sortState.key === "profitPrice") {
        sortState.key = "date";
        sortState.direction = "desc";
      }
      appPage.classList.toggle("accountant-view", Boolean(isLoggedIn && isAccountant));
      document.body.classList.toggle("dispatcher-self-view", Boolean(isLoggedIn && isDispatcher));
      const baseLoginLabel = String(currentAccount || "").trim();
      const loginLabel = isAccountant
        ? getCurrentAccountantDisplayName()
        : (isBoss ? (resolveLoginAccountInput(baseLoginLabel) || BOSS_LOGIN_ACCOUNT) : getDispatcherAccountDisplayName(baseLoginLabel));
      const accountantRealName = isAccountant ? getCurrentAccountantRealName() : "";
      const accountantPhone = isAccountant ? getCurrentAccountantLoginPhone() : "";
      const accountantMetaParts = [];
      if (accountantRealName) {
        accountantMetaParts.push(`姓名：${accountantRealName}`);
      }
      if (accountantPhone) {
        accountantMetaParts.push(`登录手机号：${accountantPhone}`);
      }
      headerAccountText.textContent = isLoggedIn ? loginLabel : "";
      headerAccountSubText.textContent = isLoggedIn && isAccountant && accountantMetaParts.length
        ? accountantMetaParts.join(" · ")
        : "";
      accountRoleBadge.textContent = isLoggedIn
        ? (isAccountant ? "会计" : (isBoss ? "管理员账号" : "接待账号"))
        : "";
      accountRoleBadge.className = isLoggedIn
        ? `account-role-badge ${isAccountant ? "accountant" : (isBoss ? "boss" : "dispatcher")}`
        : "account-role-badge";
      const canOpenAnalysis = isBoss || isAnalysisButtonEnabled;
      openCreateModalBtn.hidden = isAccountant;
      openDispatcherModalBtn.hidden = !isBoss;
      openAnalysisModalBtn.hidden = isAccountant || !canOpenAnalysis;
      openRecycleModalBtn.hidden = isAccountant;
      openAccountantModalBtn.hidden = isAccountant;
      if (exportTableBtn) {
        exportTableBtn.hidden = !isBoss;
      }
      changePasswordBtn.hidden = !(isLoggedIn && isDispatcher);
      if (editProfileBtn) {
        editProfileBtn.hidden = !(isLoggedIn && isAccountant);
      }
      if (!canSettleRecords) {
        clearBossRecordSelection();
        setRecentBossSettlementRecordIds([]);
        closeBossSettlementSummaryModal();
      }
      updateAccountantInvoiceUploadControls();
      if (!isLoggedIn) {
        renderInvoiceSummaryPanel([]);
      }
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
      updateBossSettlementControls();
      updateBossSettlementDetailControls();
    }

    function applyAccountToForm() {
      setRecordDateInputValue(getTodayISODate());
      setDispatcherTag(getDefaultDispatcherTag());
      setSourcePickerValue("", { autoFilled: false });
      setPlatformShopPickerValue("");
      renderSourcePickerOptions();
      renderPlatformShopPickerOptions();
    }

    function setRecordDateInputValue(rawValue = getTodayISODate()) {
      const nextValue = String(rawValue || "").trim() || getTodayISODate();
      dateInput.readOnly = false;
      dateInput.removeAttribute("readonly");
      dateInput.value = formatDateInputValue(nextValue);
    }

    function setRecordCreateRequiredState(isCreateMode) {
      const shouldRequire = Boolean(isCreateMode) && !isDevelopmentPort;
      dateInput.required = shouldRequire;
      orderNoInput.required = shouldRequire;
      customerInput.required = shouldRequire;
      sourceInput.required = shouldRequire;
      platformInput.required = shouldRequire;
      shopNameInput.required = shouldRequire;
      paymentPriceInput.required = shouldRequire;
      totalPriceInput.required = shouldRequire;
      settlementPriceInput.required = shouldRequire;
    }

    function resetRecordFormMode() {
      recordEditingIdInput.value = "";
      setRecordDateInputValue(getTodayISODate());
      setRecordCreateRequiredState(true);
      resetInlineFormState(recordForm, setRecordFormHint);
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
        showAppStatus(error.message || "读取会计列表失败，请稍后重试。");
      }
      try {
        await fetchRecords();
      } catch (error) {
        console.error(error);
        showAppStatus("读取共享数据失败，请确认 Node 服务已启动。");
      }
      try {
        await fetchAccountantOperationLogs();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取会计操作日志失败，请稍后重试。");
      }
      if (currentAccount && currentSessionToken) {
        startAutoRefresh();
      }
    }

    async function loginAccount(name, password) {
      const rawName = String(name || "").trim();
      const rawPassword = String(password || "").trim();
      if (!rawName || !rawPassword) {
        setLoginRequestHint("请输入登录标识和密码", "error");
        showInlineFormError({
          form: loginForm || loginPage,
          hintSetter: setLoginRequestHint,
          target: !rawName ? loginCodeInput : loginPasswordInput,
          message: !rawName ? "请输入登录标识。" : "请输入密码。"
        });
        return;
      }
      clearInlineFieldError(loginCodeInput);
      clearInlineFieldError(loginPasswordInput);
      let authResult;
      try {
        authResult = await verifyLoginByServer(rawName, rawPassword);
      } catch (error) {
        console.error(error);
        setLoginRequestHint(error.message || "登录失败", "error");
        showInlineFormError({
          form: loginForm || loginPage,
          hintSetter: setLoginRequestHint,
          target: loginPasswordInput,
          message: error.message || "登录失败，请稍后重试。"
        });
        return;
      }
      try {
        storeAuthenticatedSession(authResult, rawName, rawPassword, { persistSavedLogin: true });
      } catch (error) {
        console.error(error);
        setLoginRequestHint("登录状态创建失败", "error");
        showInlineFormError({
          form: loginForm || loginPage,
          hintSetter: setLoginRequestHint,
          target: loginPasswordInput,
          message: "登录失败，请重新登录。"
        });
        return;
      }
      closeAccountantRegisterModal();
      loginCodeInput.value = "";
      loginPasswordInput.value = "";
      applyAccountToForm();
      setPageMode(true);
      await syncDataAfterLogin();
    }

    async function logoutAccount() {
      const tokenToLogout = String(currentSessionToken || "").trim();
      stopAutoRefresh();
      await logoutSessionByServer(tokenToLogout);
      currentAccount = "";
      currentAccountRole = "";
      currentAccountDisplayName = "";
      currentAccountRealName = "";
      currentAccountPhone = "";
      currentSessionToken = "";
      hasFetchedRecords = false;
      clearBossRecordSelection();
      setRecentBossSettlementRecordIds([]);
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
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeInvoicePreviewModal();
      closeBossSettlementSummaryModal();
      closeBossSettlementDetailModal();
      closeAnalysisModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeAccountantRegisterModal();
      closeChangePasswordModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeConfirmDialog(false);
      setPageMode(false);
      renderRequestLogList();
      loginCodeInput.value = "";
      loginPasswordInput.value = "";
      setLoginRequestHint("", "idle");
      loginCodeInput.focus();
    }

    async function openChangePasswordFlow() {
      if (!requireAccount()) return;
      const canChangePassword = isAccountantLogin() || isDispatcherLogin();
      if (!canChangePassword) return;
      openChangePasswordModal();
    }

    function renderTable() {
      tableBody.innerHTML = "";
      updateFilterOptions();
      saveViewState();
      syncBossRecordSelection(records);
      const canEditRecords = !isAccountantLogin();
      const canDeleteRecords = !isAccountantLogin();
      const canCheckRecords = isAccountantLogin();
      const isBoss = isBossLogin();
      const canSettleRecords = canCurrentAccountSettleRecords();
      const scopedRecords = getVisibleRecords();
      const currentDispatcherTag = getCurrentDispatcherTag();
      const filteredRecords = getFilteredRecords();
      const sortedRecords = getSortedRecords(filteredRecords);
      const hasFilter = Boolean(
        hasDateFilterSelected()
        || filterState.dispatcher
        || filterState.accountant
        || filterState.platform
        || filterState.shopName
        || filterState.source
        || filterState.status
        || filterState.settled
      );
      tableTotalCount.textContent = hasFilter
        ? `共 ${filteredRecords.length}/${scopedRecords.length} 条`
        : `共 ${scopedRecords.length} 条`;
      clearFilterBtn.hidden = !hasFilter;
      if (exportTableBtn) {
        exportTableBtn.hidden = !isBoss;
        exportTableBtn.disabled = !isBoss || filteredRecords.length === 0;
        exportTableBtn.title = isBoss
          ? (filteredRecords.length ? "导出当前筛选数据" : "当前没有可导出数据")
          : "";
      }
      updateAccountantInvoiceUploadControls();
      updateSortHeaderUI(filteredRecords);
      updateBossSettlementControls(sortedRecords);
      updateBossSettlementDetailControls();
      renderInvoiceSummaryPanel(sortedRecords);
      if (!filteredRecords.length) {
        emptyState.style.display = "block";
        emptyState.textContent = scopedRecords.length ? "当前筛选无数据。" : "暂无数据，先录入一条。";
        scheduleStickyTableColumnWidthSync();
        return;
      }
      emptyState.style.display = "none";
      sortedRecords.forEach((item) => {
        const tr = document.createElement("tr");
        const recordId = String(item.id || "").trim();
        const dispatcherTag = normalizeDispatcherTag(item.dispatcher);
        const checkStatus = normalizeRecordCheckStatus(item.checkStatus);
        const isCurrentDispatcher = Boolean(currentDispatcherTag && dispatcherTag === currentDispatcherTag);
        const isUpdatedRow = Boolean(recordId && isUpdatedRecordHighlighted(recordId));
        const isSelected = Boolean(recordId && isBossRecordSelected(recordId));
        const updateNoticeText = isUpdatedRow ? getUpdatedRecordIndicatorLabel(item) : "";
        const settlementSelectable = isBossSettlementRecordSelectable(item);
        const settlementDisabledReason = getBossSettlementSelectionDisabledReason(item);
        if (isCurrentDispatcher) {
          tr.classList.add("dispatcher-current-row");
        }
        if (isUpdatedRow) {
          tr.classList.add("updated-record-row");
        }
        if (isSelected) {
          tr.classList.add("boss-selected-row");
        }
        if (canSettleRecords) {
          const selectTd = document.createElement("td");
          selectTd.className = "table-select-cell";
          if (!settlementSelectable) {
            selectTd.classList.add("disabled");
          }
          if (settlementDisabledReason) {
            selectTd.title = settlementDisabledReason;
          }
          const selectCheckbox = document.createElement("input");
          selectCheckbox.type = "checkbox";
          selectCheckbox.className = "table-select-checkbox row-select-checkbox";
          selectCheckbox.dataset.recordId = recordId;
          selectCheckbox.checked = isSelected;
          selectCheckbox.disabled = !recordId || !settlementSelectable;
          const checkboxLabel = `${formatDateDisplay(item.date)} ${String(item.customer || "").trim() || "未填客户"}`;
          selectCheckbox.setAttribute(
            "aria-label",
            settlementDisabledReason ? `${checkboxLabel}，${settlementDisabledReason}` : `选择 ${checkboxLabel}`
          );
          if (settlementDisabledReason) {
            selectCheckbox.title = settlementDisabledReason;
          }
          selectTd.appendChild(selectCheckbox);
          tr.appendChild(selectTd);
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
          String(item.remark || ""),
          toMoney(item.paymentPrice),
          toMoney(item.totalPrice),
          toMoney(getPremiumValue(item)),
          toMoney(item.settlementPrice),
          formatProfitDisplay(item),
          getRecordWorkflowStatusText(item)
        ];
        values.forEach((value, index) => {
          const td = document.createElement("td");
          if (index === 0) {
            td.classList.add("data-col-date");
            const dateWrap = document.createElement("div");
            dateWrap.className = "row-date-cell";
            if (updateNoticeText) {
              const updateNotice = document.createElement("span");
              updateNotice.className = "row-date-update";
              updateNotice.textContent = updateNoticeText;
              dateWrap.appendChild(updateNotice);
            }
            const dateText = document.createElement("span");
            dateText.className = "row-date-text";
            dateText.textContent = String(value || "");
            dateWrap.appendChild(dateText);

            td.appendChild(dateWrap);
          } else if (index === 1) {
            td.classList.add("data-col-dispatcher");
            const chip = document.createElement("span");
            chip.className = "dispatcher-chip";
            chip.textContent = value;
            td.appendChild(chip);
          } else if (index === 15) {
            td.classList.add("data-col-status");
            const statusWrap = document.createElement("div");
            statusWrap.className = "row-status-cell";
            const statusChip = document.createElement("span");
            statusChip.className = `record-status-chip ${getRecordWorkflowStatusKey(item)}`;
            statusChip.textContent = String(value || "");
            statusWrap.appendChild(statusChip);
            td.appendChild(statusWrap);
          } else {
            td.textContent = value;
          }
          if (index === 2) td.classList.add("data-col-source");
          if (index === 3) td.classList.add("data-col-platform");
          if (index === 4) td.classList.add("data-col-shop");
          if (index === 5) td.classList.add("data-col-order");
          if (index === 6) td.classList.add("data-col-accountant");
          if (index === 8) td.classList.add("summary");
          if (index === 9) td.classList.add("remark");
          if (index === 10) td.classList.add("data-col-payment");
          if (index === 11) td.classList.add("data-col-total");
          if (index === 12) td.classList.add("data-col-premium");
          if (index === 13) td.classList.add("data-col-settlement");
          if (index === 14) td.classList.add("data-col-profit");
          tr.appendChild(td);
        });

        const actionTd = document.createElement("td");
        actionTd.className = "row-action-cell";
        const actionWrap = document.createElement("div");
        actionWrap.className = "row-action-wrap";
        const historyCount = Array.isArray(item.operationHistory) ? item.operationHistory.length : 0;
        if (recordId && historyCount > 0) {
          const historyBtn = document.createElement("button");
          historyBtn.type = "button";
          historyBtn.className = "row-history-btn persistent";
          historyBtn.dataset.recordId = recordId;
          const historyLabel = document.createElement("span");
          historyLabel.className = "row-history-btn-label";
          historyLabel.textContent = "历史";
          historyBtn.appendChild(historyLabel);

          const historyCountText = document.createElement("span");
          historyCountText.className = "row-history-btn-count";
          historyCountText.textContent = String(historyCount);
          historyBtn.appendChild(historyCountText);
          historyBtn.setAttribute("aria-label", `查看历史，共 ${historyCount} 条`);
          historyBtn.title = "查看历史";
          actionWrap.appendChild(historyBtn);
        }
        if (canEditRecords && recordId) {
          const editBtn = document.createElement("button");
          editBtn.type = "button";
          editBtn.className = "row-edit-btn";
          editBtn.dataset.recordId = recordId;
          editBtn.textContent = "修改";
          actionWrap.appendChild(editBtn);
        }
        if (canDeleteRecords && recordId) {
          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "row-delete-btn";
          deleteBtn.dataset.recordId = recordId;
          deleteBtn.dataset.customer = String(item.customer || "");
          deleteBtn.dataset.date = formatDateDisplay(item.date);
          deleteBtn.textContent = "删除";
          actionWrap.appendChild(deleteBtn);
        }
        if (canCheckRecords && recordId) {
          if (checkStatus !== "completed" && checkStatus !== "returned") {
            const checkBtn = document.createElement("button");
            checkBtn.type = "button";
            let checkButtonText = "确认";
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
            actionWrap.appendChild(checkBtn);
          }
        }
        actionTd.appendChild(actionWrap);
        tr.appendChild(actionTd);
        tableBody.appendChild(tr);
      });
      scheduleStickyTableColumnWidthSync();
    }

    function openCreateModal() {
      if (!requireAccount()) return;
      closeAllFilterPopovers();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
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
      showRecordModal(dateInput);
    }

    function openEditModal(record) {
      if (!record || typeof record !== "object") return;
      if (!requireAccount()) return;
      closeAllFilterPopovers();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
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
      setRecordDateInputValue(record.date || getTodayISODate());
      setRecordCreateRequiredState(false);
      recordModalTitle.textContent = "修改数据";
      recordReturnBtn.hidden = isAccountantLogin();
      recordSubmitBtn.textContent = "保存修改";
      setDispatcherTag(normalizeDispatcherTag(record.dispatcher) || getDefaultDispatcherTag());
      setAccountantPickerValue(String(record.accountant || "").trim());
      renderAccountantPickerList("");
      setSourcePickerValue(String(record.source || "").trim(), { autoFilled: false });
      renderSourcePickerList();
      setPlatformShopPickerFieldsValue(record.platform, record.shopName);
      renderPlatformShopPickerList();
      orderNoInput.value = String(record.orderNo || "").trim();
      customerInput.value = String(record.customer || "").trim();
      summaryInput.value = String(record.summary || "").trim();
      if (remarkInput) {
        remarkInput.value = String(record.remark || "").trim();
      }
      if (monthlySettlementCheckbox) {
        monthlySettlementCheckbox.checked = isMonthlySettlementRecord(record);
      }
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
