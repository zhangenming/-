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
      const refundWidth = getMeasuredButtonWidth(".row-refund-btn", { minWidth: 0 });
      const deleteWidth = getMeasuredButtonWidth(".row-delete-btn", { minWidth: 0 });
      const checkWidth = getMeasuredButtonWidth(".row-check-btn", { minWidth: 0 });
      const isAccountantView = Boolean(appPage?.classList.contains("accountant-view"));
      const actionGap = isAccountantView ? 4 : 6;
      const actionTrackWidths = isAccountantView
        ? [historyWidth, checkWidth]
        : [historyWidth, Math.max(editWidth, refundWidth), deleteWidth, checkWidth];
      const visibleTrackWidths = actionTrackWidths.filter((width) => width > 0);
      const actionPadding = getHorizontalPadding(actionCells[0] || actionHeader);
      const statusWidth = measureStickyColumnWidth(
        [
          ...statusCells.map((cell) => ({
            cell,
            contentNode: cell.querySelector(".record-status-chip")
              || cell.querySelector(".row-status-cell")
              || cell
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
      appPage.style.setProperty("--table-action-edit-width", `${Math.max(editWidth, refundWidth)}px`);
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

    function getRecordDateTooltipText(record) {
      const createdAtTime = formatTimeDisplay(record?.createdAt);
      if (createdAtTime) return createdAtTime;
      const rawDate = String(record?.date || "").trim();
      return /[ T]\d{1,2}:\d{2}/.test(rawDate) ? formatTimeDisplay(rawDate) : "";
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

    function openRefundModal(record) {
      if (!record || typeof record !== "object") return;
      if (!isRecordRefundable(record)) return;
      const paymentPrice = Number(record.paymentPrice);
      if (!Number.isFinite(paymentPrice) || paymentPrice < 0) return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeRecordHistoryModal();
      closeReturnPriceModal();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      resetInlineFormState(refundForm, setRefundFormHint);
      refundRecordIdInput.value = String(record.id || "").trim();
      refundPaymentPriceInput.value = toMoney(paymentPrice);
      refundPaymentPriceInput.dataset.originalPaymentPrice = String(paymentPrice);
      refundCurrentPaymentText.textContent = toMoney(paymentPrice);
      const metaParts = [
        formatDateDisplay(record?.date),
        String(record?.customer || "").trim() || "未填客户"
      ].filter(Boolean);
      const orderNo = String(record?.orderNo || "").trim();
      if (orderNo) {
        metaParts.push(`订单号 ${orderNo}`);
      }
      refundModalMeta.textContent = metaParts.join(" · ");
      refundModal.hidden = false;
      refundModal.classList.remove("modal-enter");
      refundModalCard.classList.remove("modal-enter");
      void refundModal.offsetWidth;
      refundModal.classList.add("modal-enter");
      refundModalCard.classList.add("modal-enter");
      syncModalOpenState();
      refundPaymentPriceInput.focus();
      refundPaymentPriceInput.select();
    }

    function closeRefundModal() {
      refundModal.classList.remove("modal-enter");
      refundModalCard.classList.remove("modal-enter");
      refundModal.hidden = true;
      refundRecordIdInput.value = "";
      refundPaymentPriceInput.value = "";
      refundPaymentPriceInput.dataset.originalPaymentPrice = "";
      refundCurrentPaymentText.textContent = "0.00";
      refundModalMeta.textContent = "";
      resetInlineFormState(refundForm, setRefundFormHint);
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
      const shouldKeepBossSettlementDetailOpen = Boolean(
        bossSettlementDetailModal && !bossSettlementDetailModal.hidden
      );
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeReturnPriceModal();
      closeRecordHistoryModal();
      if (shouldKeepBossSettlementDetailOpen) {
        if (bossSettlementSummaryModal && !bossSettlementSummaryModal.hidden) {
          bossSettlementSummaryModal.classList.remove("modal-enter");
          bossSettlementSummaryModalCard.classList.remove("modal-enter");
          bossSettlementSummaryModal.hidden = true;
          renderBossSettlementSummaryContent();
        }
      } else {
        closeBossSettlementSummaryModal();
      }
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
      invoicePreviewModal.classList.toggle("invoice-preview-stacked", shouldKeepBossSettlementDetailOpen);
      invoicePreviewModal.classList.add("modal-enter");
      invoicePreviewModalCard.classList.add("modal-enter");
      syncModalOpenState();
      invoicePreviewModalCard.focus();
    }

    function closeInvoicePreviewModal() {
      if (!invoicePreviewModal || !invoicePreviewModalCard) return;
      invoicePreviewModal.classList.remove("modal-enter");
      invoicePreviewModal.classList.remove("invoice-preview-stacked");
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
      if (bossSettlementDetailModal && !bossSettlementDetailModal.hidden && bossSettlementDetailModalCard) {
        bossSettlementDetailModalCard.focus();
      }
    }

    function renderBossSettlementSummaryContent() {
      if (!bossSettlementSummaryTitleCount || !bossSettlementSummaryAmount || !bossSettlementSummaryTax) return;
      const {
        count,
        readyCount,
        alreadySettledCount,
        returnedCount,
        refundedCount,
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
        if (refundedCount > 0) {
          noteParts.push(`退款 ${refundedCount} 条`);
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
      if (statusKey === "uploaded") return getRecordWorkflowStatusLabelByKey("uploaded");
      if (statusKey === "partial") return "部分上传";
      return getRecordWorkflowStatusLabelByKey("settled");
    }

    function getBossSettlementDetailRowToneKey(group) {
      if (!group || typeof group !== "object") return "pending";
      if (Array.isArray(group.payoutRecordIds) && group.payoutRecordIds.length > 0) return "payable";

      const recordCount = Number(group.recordCount) || 0;
      const pendingCount = Number(group.pendingCount) || 0;
      const uploadedCount = Number(group.uploadedCount) || 0;
      const paidCount = Number(group.paidCount) || 0;
      if (recordCount > 0 && paidCount >= recordCount) return "paid";
      if (pendingCount > 0) return "pending";
      if (uploadedCount > 0 && paidCount >= uploadedCount) return "paid";
      return "payable";
    }

    function getBossSettlementDetailSortValue(group, key) {
      if (!group || typeof group !== "object") return "";
      if (key === "invoiceAmount") return Number(group.invoiceAmount) || 0;
      if (key === "taxAmount") return Number(group.taxAmount) || 0;
      if (key === "payableAmount") return Number(group.payableAmount) || 0;
      if (key === "invoiceCount") return Array.isArray(group.uploadedInvoices) ? group.uploadedInvoices.length : 0;
      if (key === "payout") {
        const paidAtTime = parseDateTimeValue(group.latestPaidAt);
        if (!Number.isNaN(paidAtTime)) return paidAtTime;
        if (Array.isArray(group.payoutRecordIds)) return group.payoutRecordIds.length;
        return Number(group.paidCount) || 0;
      }
      if (key === "accountant") return String(group.accountant || "").trim();
      return "";
    }

    function compareBossSettlementDetailGroups(left, right, key) {
      const leftValue = getBossSettlementDetailSortValue(left, key);
      const rightValue = getBossSettlementDetailSortValue(right, key);
      if (typeof leftValue === "number" || typeof rightValue === "number") {
        const diff = (Number(leftValue) || 0) - (Number(rightValue) || 0);
        if (diff) return diff;
      } else {
        const textDiff = String(leftValue).localeCompare(String(rightValue), "zh-CN", {
          numeric: true,
          sensitivity: "base"
        });
        if (textDiff) return textDiff;
      }
      return String(left?.accountant || "").localeCompare(String(right?.accountant || ""), "zh-CN", {
        numeric: true,
        sensitivity: "base"
      });
    }

    function getSortedBossSettlementDetailGroups(groups) {
      const source = Array.isArray(groups) ? groups : [];
      const sortKey = String(bossSettlementDetailSortState.key || "accountant").trim();
      const direction = bossSettlementDetailSortState.direction === "desc" ? -1 : 1;
      return [...source].sort((left, right) => compareBossSettlementDetailGroups(left, right, sortKey) * direction);
    }

    function updateBossSettlementDetailSort(key) {
      const normalizedKey = String(key || "").trim();
      if (!normalizedKey) return;
      if (bossSettlementDetailSortState.key === normalizedKey) {
        bossSettlementDetailSortState.direction = bossSettlementDetailSortState.direction === "asc" ? "desc" : "asc";
      } else {
        bossSettlementDetailSortState.key = normalizedKey;
        bossSettlementDetailSortState.direction = normalizedKey === "accountant" ? "asc" : "desc";
      }
      renderBossSettlementDetailModalContent();
    }

    function getBossSettlementDetailGroupTotals(groups) {
      const source = Array.isArray(groups) ? groups : [];
      return {
        accountantCount: source.length,
        recordCount: source.reduce((sum, item) => sum + (Number(item.recordCount) || 0), 0),
        totalInvoiceAmount: source.reduce((sum, item) => sum + (Number(item.invoiceAmount) || 0), 0),
        totalTaxAmount: source.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0),
        totalPayableAmount: source.reduce((sum, item) => sum + (Number(item.payableAmount) || 0), 0),
        uploadedAccountantCount: source.filter((item) => Number(item.uploadedCount) > 0).length,
        pendingAccountantCount: source.filter((item) => Number(item.uploadedCount) <= 0).length,
        uploadedRecordCount: source.reduce((sum, item) => sum + (Number(item.uploadedCount) || 0), 0),
        paidRecordCount: source.reduce((sum, item) => sum + (Number(item.paidCount) || 0), 0),
        payoutRecordCount: source.reduce(
          (sum, item) => sum + (Array.isArray(item.payoutRecordIds) ? item.payoutRecordIds.length : 0),
          0
        )
      };
    }

    function formatSettlementPaidDateDisplay(rawDateTime) {
      const source = String(rawDateTime || "").trim();
      if (!source) return "";
      return formatDateDisplay(source) || source;
    }

    function getSettlementPaidTimeTooltip(group) {
      const sourceValues = Array.isArray(group?.paidAtValues) ? group.paidAtValues : [group?.latestPaidAt];
      const values = Array.from(
        new Set(sourceValues.map((value) => String(formatDateTimeDisplay(value)).trim()).filter(Boolean))
      );
      if (!values.length) return "";
      return `打款时间：${values.join(" / ")}`;
    }

    function getBossSettlementDetailSummary(sourceRecords = records) {
      const detailRecords = getBossSettlementDetailRecords(sourceRecords);
      const groupMap = new Map();
      const paidGroupMap = new Map();
      let totalInvoiceAmount = 0;
      let latestSettledAt = "";
      let latestSettledAtTime = 0;

      detailRecords.forEach((record) => {
        const accountant = String(record?.accountant || "").trim() || "未分配会计";
        const settlement = Number(record?.settlementPrice);
        const settledAt = String(record?.settledAt || "").trim();
        const settledAtTime = parseDateTimeValue(settledAt);
        const uploadedAt = String(record?.invoiceUploadedAt || "").trim();
        const uploadedAtTime = parseDateTimeValue(uploadedAt);
        const uploadedBy = String(record?.invoiceUploadedBy || record?.invoiceUploadedByUsername || "").trim();
        const isUploaded = isRecordInvoiceUploaded(record);
        const invoiceImage = getSettlementInvoiceImage(record);
        const isPaid = isRecordSettlementPaid(record);
        const paidAt = String(record?.settlementPaidAt || "").trim();
        const paidAtTime = parseDateTimeValue(paidAt);
        const recordId = String(record?.id || "").trim();
        const targetGroupMap = isPaid ? paidGroupMap : groupMap;
        const current = targetGroupMap.get(accountant) || {
          accountant,
          recordIds: [],
          recordCount: 0,
          pendingCount: 0,
          uploadedCount: 0,
          paidCount: 0,
          payoutRecordIds: [],
          paidAtValues: [],
          latestPaidAt: "",
          latestPaidAtTime: 0,
          invoiceAmount: 0,
          latestUploadedAt: "",
          latestUploadedBy: "",
          invoiceMap: new Map()
        };

        if (recordId) {
          current.recordIds.push(recordId);
        }
        current.recordCount += 1;
        if (Number.isFinite(settlement)) {
          current.invoiceAmount += settlement;
          totalInvoiceAmount += settlement;
        }
        if (isUploaded) {
          current.uploadedCount += 1;
          if (isPaid) {
            current.paidCount += 1;
            if (paidAt) {
              const normalizedPaidAtTime = Number.isNaN(paidAtTime) ? 0 : paidAtTime;
              current.paidAtValues.push(paidAt);
              if (!current.latestPaidAt || normalizedPaidAtTime >= current.latestPaidAtTime) {
                current.latestPaidAt = paidAt;
                current.latestPaidAtTime = normalizedPaidAtTime;
              }
            }
          } else if (recordId) {
            current.payoutRecordIds.push(recordId);
          }
          const currentUploadedAtTime = parseDateTimeValue(current.latestUploadedAt);
          if (!current.latestUploadedAt || uploadedAtTime >= currentUploadedAtTime) {
            current.latestUploadedAt = uploadedAt;
            current.latestUploadedBy = uploadedBy;
          }
          if (invoiceImage) {
            const invoiceKey = [
              String(invoiceImage.fileName || invoiceImage.url || "").trim(),
              uploadedAt,
              uploadedBy
            ].join("\u0001");
            const invoiceItem = current.invoiceMap.get(invoiceKey) || {
              key: invoiceKey,
              image: invoiceImage,
              firstRecord: record,
              recordIds: [],
              totalSettlement: 0,
              uploadedAt,
              uploadedBy
            };
            if (recordId) {
              invoiceItem.recordIds.push(recordId);
            }
            if (Number.isFinite(settlement)) {
              invoiceItem.totalSettlement += settlement;
            }
            current.invoiceMap.set(invoiceKey, invoiceItem);
          }
        } else {
          current.pendingCount += 1;
        }
        if (settledAt && settledAtTime >= latestSettledAtTime) {
          latestSettledAt = settledAt;
          latestSettledAtTime = settledAtTime;
        }

        targetGroupMap.set(accountant, current);
      });

      const buildGroups = (sourceMap) => Array.from(sourceMap.values())
        .map((group) => {
          const statusKey = getBossSettlementDetailStatusKey(group.recordCount, group.uploadedCount);
          const taxAmount = getSettlementTaxAmount(group.invoiceAmount);
          const uploadedInvoices = Array.from(group.invoiceMap.values()).sort((left, right) => {
            const timeDiff = parseDateTimeValue(right.uploadedAt) - parseDateTimeValue(left.uploadedAt);
            if (timeDiff) return timeDiff;
            return String(left.image?.name || "").localeCompare(String(right.image?.name || ""), "zh-CN", {
              numeric: true,
              sensitivity: "base"
            });
          });
          return {
            accountant: group.accountant,
            recordIds: group.recordIds,
            recordCount: group.recordCount,
            pendingCount: group.pendingCount,
            uploadedCount: group.uploadedCount,
            paidCount: group.paidCount,
            payoutRecordIds: group.payoutRecordIds,
            paidAtValues: group.paidAtValues,
            latestPaidAt: group.latestPaidAt,
            invoiceAmount: group.invoiceAmount,
            taxAmount,
            payableAmount: group.invoiceAmount - taxAmount,
            latestUploadedAt: group.latestUploadedAt,
            latestUploadedBy: group.latestUploadedBy,
            uploadedInvoices,
            statusKey,
            rowToneKey: getBossSettlementDetailRowToneKey(group),
            statusLabel: formatBossSettlementDetailStatusLabel(statusKey)
          };
        });
      const groups = buildGroups(groupMap);
      const paidGroups = buildGroups(paidGroupMap);
      const allGroups = groups.concat(paidGroups);

      const uploadedAccountantCount = allGroups.filter((item) => item.uploadedCount > 0).length;
      const partialAccountantCount = allGroups.filter((item) => item.statusKey === "partial").length;
      const pendingAccountantCount = allGroups.filter((item) => item.uploadedCount <= 0).length;
      const uploadedRecordCount = allGroups.reduce((sum, item) => sum + item.uploadedCount, 0);
      const pendingRecordCount = allGroups.reduce((sum, item) => sum + item.pendingCount, 0);
      const payoutRecordCount = groups.reduce((sum, item) => sum + item.payoutRecordIds.length, 0);
      const totalTaxAmount = allGroups.reduce((sum, item) => sum + item.taxAmount, 0);
      const totalPayableAmount = allGroups.reduce((sum, item) => sum + item.payableAmount, 0);

      return {
        detailRecords,
        groups,
        paidGroups,
        recordCount: detailRecords.length,
        accountantCount: new Set(allGroups.map((item) => String(item.accountant || "").trim()).filter(Boolean)).size,
        totalInvoiceAmount,
        totalTaxAmount,
        totalPayableAmount,
        latestSettledAt,
        uploadedAccountantCount,
        partialAccountantCount,
        pendingAccountantCount,
        pendingRecordCount,
        uploadedRecordCount,
        payoutRecordCount
      };
    }

    function renderBossSettlementDetailModalContent() {
      if (
        !bossSettlementDetailTitleCount
        || !bossSettlementDetailMeta
        || !bossSettlementDetailList
      ) {
        return;
      }

      const {
        groups,
        paidGroups,
        recordCount,
        accountantCount,
        payoutRecordCount
      } = getBossSettlementDetailSummary();
      syncBossSettlementPayoutSelection(records);
      const sortedGroups = getSortedBossSettlementDetailGroups(groups);
      const sortedPaidGroups = getSortedBossSettlementDetailGroups(paidGroups);
      const activeTableTotals = getBossSettlementDetailGroupTotals(sortedGroups);
      const paidTableTotals = getBossSettlementDetailGroupTotals(sortedPaidGroups);
      const canPayoutSettlementRecords = canCurrentAccountPayoutSettlementRecords();
      const selectedPayoutRecordIds = getSelectedBossSettlementPayoutRecordIds();
      const selectedPayoutRecordIdSet = new Set(selectedPayoutRecordIds);
      const allPayoutRecordIds = Array.from(
        new Set(groups.flatMap((group) => Array.isArray(group.payoutRecordIds) ? group.payoutRecordIds : []))
      );
      const areAllPayoutRecordsSelected = allPayoutRecordIds.length > 0
        && allPayoutRecordIds.every((recordId) => selectedPayoutRecordIdSet.has(recordId));

      bossSettlementDetailTitleCount.textContent = "";
      bossSettlementDetailTitleCount.hidden = true;
      bossSettlementDetailMeta.textContent = "";
      bossSettlementDetailList.innerHTML = "";

      if (!groups.length && !paidGroups.length) {
        const empty = document.createElement("div");
        empty.className = "settlement-detail-empty";
        empty.textContent = "暂无结算明细。";
        bossSettlementDetailList.appendChild(empty);
        return;
      }

      if (sortedGroups.length) {
      const section = document.createElement("section");
      section.className = "settlement-detail-section";

      const sectionHeading = document.createElement("div");
      sectionHeading.className = "settlement-detail-section-heading";

      const sectionTitle = document.createElement("h3");
      sectionTitle.className = "settlement-detail-section-title";
      sectionTitle.textContent = "待打款";
      sectionHeading.appendChild(sectionTitle);

      section.appendChild(sectionHeading);

      const tableWrap = document.createElement("div");
      tableWrap.className = "settlement-detail-table-wrap";

      if (canPayoutSettlementRecords && payoutRecordCount > 0) {
        const payoutToolbar = document.createElement("div");
        payoutToolbar.className = "settlement-detail-payout-toolbar";

        const payoutToolbarText = document.createElement("span");
        payoutToolbarText.className = "settlement-detail-payout-toolbar-text";
        payoutToolbarText.textContent = selectedPayoutRecordIds.length > 0
          ? `已选 ${selectedPayoutRecordIds.length}单`
          : `可打款 ${payoutRecordCount}单`;
        payoutToolbar.appendChild(payoutToolbarText);

        const payoutSelectAllBtn = document.createElement("button");
        payoutSelectAllBtn.type = "button";
        payoutSelectAllBtn.className = "settlement-detail-payout-select-all-btn";
        payoutSelectAllBtn.dataset.settlementPayoutSelectAll = "true";
        payoutSelectAllBtn.dataset.recordIds = allPayoutRecordIds.join(",");
        payoutSelectAllBtn.disabled = isBossSettlementPayoutSubmitting || allPayoutRecordIds.length === 0;
        payoutSelectAllBtn.setAttribute("aria-pressed", areAllPayoutRecordsSelected ? "true" : "false");
        payoutSelectAllBtn.textContent = areAllPayoutRecordsSelected ? "取消全选" : "全选";
        payoutToolbar.appendChild(payoutSelectAllBtn);

        const payoutToolbarBtn = document.createElement("button");
        payoutToolbarBtn.type = "button";
        payoutToolbarBtn.className = "settlement-detail-payout-batch-btn";
        payoutToolbarBtn.dataset.settlementPayoutSelected = "true";
        payoutToolbarBtn.disabled = selectedPayoutRecordIds.length === 0 || isBossSettlementPayoutSubmitting;
        payoutToolbarBtn.textContent = isBossSettlementPayoutSubmitting
          ? "打款中"
          : (selectedPayoutRecordIds.length > 0 ? `批量打款（${selectedPayoutRecordIds.length}）` : "批量打款");
        payoutToolbar.appendChild(payoutToolbarBtn);

        sectionHeading.appendChild(payoutToolbar);
      }

      const table = document.createElement("table");
      table.className = "settlement-detail-table";

      const colgroup = document.createElement("colgroup");
      [
        "accountant",
        "money",
        "money",
        "money",
        "invoice",
        "payout"
      ].forEach((columnClass) => {
        const col = document.createElement("col");
        col.className = `settlement-detail-col-${columnClass}`;
        colgroup.appendChild(col);
      });
      table.appendChild(colgroup);

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      const headerColumns = [
        { key: "accountant", label: "会计", summary: `${activeTableTotals.accountantCount}位/${activeTableTotals.recordCount || 0}单`, align: "accountant" },
        { key: "invoiceAmount", label: "开票金额", summary: `合计 ${toMoney(activeTableTotals.totalInvoiceAmount)} 元`, align: "money" },
        { key: "taxAmount", label: "个税", summary: `合计 ${toMoney(activeTableTotals.totalTaxAmount)} 元`, align: "money" },
        { key: "payableAmount", label: "应打款金额", summary: `合计 ${toMoney(activeTableTotals.totalPayableAmount)} 元`, align: "money" },
        { key: "invoiceCount", label: "上传的发票", summary: `${activeTableTotals.uploadedAccountantCount}人已上传 / ${activeTableTotals.pendingAccountantCount}人未上传`, align: "invoice" },
        { key: "payout", label: "打款", align: "payout", hideSummary: true }
      ];
      headerColumns.forEach((column) => {
        const th = document.createElement("th");
        th.scope = "col";
        th.className = `settlement-detail-heading-cell ${column.align}`;
        th.setAttribute(
          "aria-sort",
          bossSettlementDetailSortState.key === column.key
            ? (bossSettlementDetailSortState.direction === "desc" ? "descending" : "ascending")
            : "none"
        );

        const button = document.createElement("button");
        button.type = "button";
        button.className = column.hideSummary
          ? "settlement-detail-sort-btn is-summary-hidden"
          : "settlement-detail-sort-btn";
        button.dataset.detailSortKey = column.key;

        const label = document.createElement("span");
        label.className = "settlement-detail-sort-label";
        label.textContent = column.label;
        button.appendChild(label);

        if (!column.hideSummary) {
          const summary = document.createElement("span");
          summary.className = "settlement-detail-sort-summary";
          summary.textContent = column.summary;
          button.appendChild(summary);
        }

        if (bossSettlementDetailSortState.key === column.key) {
          const mark = document.createElement("span");
          mark.className = "settlement-detail-sort-mark";
          mark.textContent = bossSettlementDetailSortState.direction === "desc" ? "↓" : "↑";
          button.appendChild(mark);
        }

        th.appendChild(button);
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      const createMoneyCell = (value) => {
        const td = document.createElement("td");
        td.className = "settlement-detail-money settlement-detail-col-money";
        td.textContent = `${toMoney(value)} 元`;
        return td;
      };

      sortedGroups.forEach((group) => {
        const row = document.createElement("tr");
        row.className = `settlement-detail-row ${group.statusKey} tone-${group.rowToneKey}`;

        const accountantTd = document.createElement("td");
        accountantTd.className = "settlement-detail-accountant-cell settlement-detail-col-accountant";

        const accountantName = document.createElement("strong");
        accountantName.className = "settlement-detail-accountant";
        accountantName.textContent = group.accountant;
        accountantTd.appendChild(accountantName);

        const accountantMeta = document.createElement("span");
        accountantMeta.className = "settlement-detail-accountant-meta";
        accountantMeta.textContent = `${group.recordCount}单`;
        accountantTd.appendChild(accountantMeta);
        row.appendChild(accountantTd);

        row.appendChild(createMoneyCell(group.invoiceAmount));
        row.appendChild(createMoneyCell(group.taxAmount));
        row.appendChild(createMoneyCell(group.payableAmount));

        const invoiceTd = document.createElement("td");
        invoiceTd.className = "settlement-detail-invoice-cell settlement-detail-col-invoice";

        if (group.uploadedInvoices.length) {
          const invoiceList = document.createElement("div");
          invoiceList.className = "settlement-detail-invoice-list";
          group.uploadedInvoices.slice(0, 3).forEach((item, index) => {
            const thumb = document.createElement("button");
            thumb.type = "button";
            thumb.className = "settlement-detail-invoice-thumb";
            thumb.dataset.recordId = String(item.firstRecord?.id || "").trim();
            thumb.title = `${group.accountant} 发票 ${index + 1}`;

            const image = document.createElement("img");
            image.src = item.image.url;
            image.alt = item.image.name || "发票图片";
            thumb.appendChild(image);

            invoiceList.appendChild(thumb);
          });
          if (group.uploadedInvoices.length > 3) {
            const more = document.createElement("span");
            more.className = "settlement-detail-invoice-more";
            more.textContent = `+${group.uploadedInvoices.length - 3}`;
            invoiceList.appendChild(more);
          }
          invoiceTd.appendChild(invoiceList);
        } else {
          const pending = document.createElement("span");
          pending.className = "settlement-detail-invoice-pending";
          pending.textContent = "待上传";
          invoiceTd.appendChild(pending);
        }

        row.appendChild(invoiceTd);

        const payoutTd = document.createElement("td");
        payoutTd.className = "settlement-detail-payout-cell settlement-detail-col-payout";

        if (canPayoutSettlementRecords && group.payoutRecordIds.length > 0) {
          const payoutWrap = document.createElement("div");
          payoutWrap.className = "settlement-detail-payout-actions";

          const payoutSelectLabel = document.createElement("label");
          payoutSelectLabel.className = "settlement-detail-payout-select";

          const payoutCheckbox = document.createElement("input");
          payoutCheckbox.type = "checkbox";
          payoutCheckbox.className = "settlement-detail-payout-checkbox";
          payoutCheckbox.dataset.recordIds = group.payoutRecordIds.join(",");
          payoutCheckbox.checked = group.payoutRecordIds.every((recordId) => selectedPayoutRecordIdSet.has(recordId));
          payoutCheckbox.disabled = isBossSettlementPayoutSubmitting;
          payoutSelectLabel.appendChild(payoutCheckbox);

          const payoutSelectText = document.createElement("span");
          payoutSelectText.textContent = "选择";
          payoutSelectLabel.appendChild(payoutSelectText);
          payoutWrap.appendChild(payoutSelectLabel);

          const payoutBtn = document.createElement("button");
          payoutBtn.type = "button";
          payoutBtn.className = "settlement-detail-payout-btn";
          payoutBtn.dataset.recordIds = group.payoutRecordIds.join(",");
          payoutBtn.disabled = isBossSettlementPayoutSubmitting;
          payoutBtn.textContent = isBossSettlementPayoutSubmitting ? "打款中" : "打款";
          payoutWrap.appendChild(payoutBtn);

          payoutTd.appendChild(payoutWrap);
        } else if (group.uploadedCount > 0 && group.paidCount >= group.uploadedCount) {
          const payoutState = document.createElement("span");
          payoutState.className = "settlement-detail-payout-state paid";
          payoutState.textContent = "已打款";
          payoutTd.appendChild(payoutState);
        }

        row.appendChild(payoutTd);
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      tableWrap.appendChild(table);
      section.appendChild(tableWrap);
      bossSettlementDetailList.appendChild(section);
      }

      if (sortedPaidGroups.length) {
        const paidSection = document.createElement("section");
        paidSection.className = "settlement-detail-section settlement-detail-section-paid";

        const paidSectionHeading = document.createElement("div");
        paidSectionHeading.className = "settlement-detail-section-heading";

        const paidSectionTitle = document.createElement("h3");
        paidSectionTitle.className = "settlement-detail-section-title";
        paidSectionTitle.textContent = "已打款";
        paidSectionHeading.appendChild(paidSectionTitle);

        paidSection.appendChild(paidSectionHeading);

        const paidTableWrap = document.createElement("div");
        paidTableWrap.className = "settlement-detail-table-wrap settlement-detail-table-wrap-paid";

        const paidTable = document.createElement("table");
        paidTable.className = "settlement-detail-table settlement-detail-paid-table";

        const paidColgroup = document.createElement("colgroup");
        [
          "accountant",
          "money",
          "money",
          "money",
          "invoice",
          "payout"
        ].forEach((columnClass) => {
          const col = document.createElement("col");
          col.className = `settlement-detail-col-${columnClass}`;
          paidColgroup.appendChild(col);
        });
        paidTable.appendChild(paidColgroup);

        const paidThead = document.createElement("thead");
        const paidHeadRow = document.createElement("tr");
        const paidHeaderColumns = [
          { key: "accountant", label: "会计", summary: `${paidTableTotals.accountantCount}位/${paidTableTotals.recordCount || 0}单`, align: "accountant" },
          { key: "invoiceAmount", label: "开票金额", summary: `合计 ${toMoney(paidTableTotals.totalInvoiceAmount)} 元`, align: "money" },
          { key: "taxAmount", label: "个税", summary: `合计 ${toMoney(paidTableTotals.totalTaxAmount)} 元`, align: "money" },
          { key: "payableAmount", label: "应打款金额", summary: `合计 ${toMoney(paidTableTotals.totalPayableAmount)} 元`, align: "money" },
          { key: "invoiceCount", label: "上传的发票", summary: `${paidTableTotals.uploadedAccountantCount}人已上传`, align: "invoice" },
          { key: "payout", label: "打款状态", summary: `已打款 ${paidTableTotals.paidRecordCount || 0}单`, align: "payout" }
        ];
        paidHeaderColumns.forEach((column) => {
          const th = document.createElement("th");
          th.scope = "col";
          th.className = `settlement-detail-heading-cell ${column.align}`;
          th.setAttribute(
            "aria-sort",
            bossSettlementDetailSortState.key === column.key
              ? (bossSettlementDetailSortState.direction === "desc" ? "descending" : "ascending")
              : "none"
          );

          const button = document.createElement("button");
          button.type = "button";
          button.className = "settlement-detail-sort-btn";
          button.dataset.detailSortKey = column.key;

          const label = document.createElement("span");
          label.className = "settlement-detail-sort-label";
          label.textContent = column.label;
          button.appendChild(label);

          const summary = document.createElement("span");
          summary.className = "settlement-detail-sort-summary";
          summary.textContent = column.summary;
          button.appendChild(summary);

          if (bossSettlementDetailSortState.key === column.key) {
            const mark = document.createElement("span");
            mark.className = "settlement-detail-sort-mark";
            mark.textContent = bossSettlementDetailSortState.direction === "desc" ? "↓" : "↑";
            button.appendChild(mark);
          }

          th.appendChild(button);
          paidHeadRow.appendChild(th);
        });
        paidThead.appendChild(paidHeadRow);
        paidTable.appendChild(paidThead);

        const paidTbody = document.createElement("tbody");
        const createPaidMoneyCell = (value) => {
          const td = document.createElement("td");
          td.className = "settlement-detail-money settlement-detail-col-money";
          td.textContent = `${toMoney(value)} 元`;
          return td;
        };

        sortedPaidGroups.forEach((group) => {
          const row = document.createElement("tr");
          row.className = `settlement-detail-row ${group.statusKey} tone-paid`;

          const accountantTd = document.createElement("td");
          accountantTd.className = "settlement-detail-accountant-cell settlement-detail-col-accountant";

          const accountantName = document.createElement("strong");
          accountantName.className = "settlement-detail-accountant";
          accountantName.textContent = group.accountant;
          accountantTd.appendChild(accountantName);

          const accountantMeta = document.createElement("span");
          accountantMeta.className = "settlement-detail-accountant-meta";
          accountantMeta.textContent = `${group.recordCount}单`;
          accountantTd.appendChild(accountantMeta);
          row.appendChild(accountantTd);

          row.appendChild(createPaidMoneyCell(group.invoiceAmount));
          row.appendChild(createPaidMoneyCell(group.taxAmount));
          row.appendChild(createPaidMoneyCell(group.payableAmount));

          const invoiceTd = document.createElement("td");
          invoiceTd.className = "settlement-detail-invoice-cell settlement-detail-col-invoice";

          if (group.uploadedInvoices.length) {
            const invoiceList = document.createElement("div");
            invoiceList.className = "settlement-detail-invoice-list";
            group.uploadedInvoices.slice(0, 3).forEach((item, index) => {
              const thumb = document.createElement("button");
              thumb.type = "button";
              thumb.className = "settlement-detail-invoice-thumb";
              thumb.dataset.recordId = String(item.firstRecord?.id || "").trim();
              thumb.title = `${group.accountant} 发票 ${index + 1}`;

              const image = document.createElement("img");
              image.src = item.image.url;
              image.alt = item.image.name || "发票图片";
              thumb.appendChild(image);

              invoiceList.appendChild(thumb);
            });
            if (group.uploadedInvoices.length > 3) {
              const more = document.createElement("span");
              more.className = "settlement-detail-invoice-more";
              more.textContent = `+${group.uploadedInvoices.length - 3}`;
              invoiceList.appendChild(more);
            }
            invoiceTd.appendChild(invoiceList);
          } else {
            const pending = document.createElement("span");
            pending.className = "settlement-detail-invoice-pending";
            pending.textContent = "待上传";
            invoiceTd.appendChild(pending);
          }

          row.appendChild(invoiceTd);

          const payoutTd = document.createElement("td");
          payoutTd.className = "settlement-detail-payout-cell settlement-detail-col-payout";

          const payoutState = document.createElement("span");
          payoutState.className = "settlement-detail-payout-state paid";
          const paidDate = formatSettlementPaidDateDisplay(group.latestPaidAt);
          payoutState.textContent = paidDate ? `已打款 ${paidDate}` : "已打款";
          const paidTooltip = getSettlementPaidTimeTooltip(group);
          if (paidTooltip) {
            payoutState.title = paidTooltip;
          }
          payoutTd.appendChild(payoutState);

          row.appendChild(payoutTd);
          paidTbody.appendChild(row);
        });

        paidTable.appendChild(paidTbody);
        paidTableWrap.appendChild(paidTable);
        paidSection.appendChild(paidTableWrap);
        bossSettlementDetailList.appendChild(paidSection);
      }
    }

    function updateBossSettlementDetailControls() {
      if (!bossSettlementDetailBtn) return;
      const canSettleRecords = canCurrentAccountSettleRecords();
      const {
        recordCount,
        accountantCount,
        pendingRecordCount,
        uploadedRecordCount
      } = getBossSettlementDetailSummary();
      const shouldShow = canSettleRecords && (pendingRecordCount > 0 || uploadedRecordCount > 0);

      bossSettlementDetailBtn.hidden = !shouldShow;
      bossSettlementDetailBtn.disabled = !shouldShow;
      bossSettlementDetailBtn.textContent = accountantCount > 0 ? `结算详细（${accountantCount}）` : "结算详细";
      bossSettlementDetailBtn.title = shouldShow
        ? `查看 ${recordCount}单结算明细，待上传 ${pendingRecordCount}单，已上传 ${uploadedRecordCount}单`
        : "";

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
      const {
        count,
        invoiceAmount,
        taxAmount,
        payableAmount
      } = getAccountantInvoiceUploadSummary(records);
      const shouldShow = isAccountantLogin() && count > 0;
      accountantInvoiceUploadBtn.hidden = !shouldShow;
      accountantInvoiceUploadBtn.disabled = !shouldShow || isInvoiceUploadSubmitting;
      accountantInvoiceUploadBtn.replaceChildren();

      const title = document.createElement("span");
      title.className = "invoice-upload-btn-title";
      title.textContent = count > 0
        ? `${isInvoiceUploadSubmitting ? "上传中" : "上传发票"}（${count}）`
        : "上传发票";
      accountantInvoiceUploadBtn.appendChild(title);

      if (count > 0) {
        const stats = document.createElement("span");
        stats.className = "invoice-upload-btn-stats";
        [
          ["开票金额", invoiceAmount],
          ["个税", taxAmount],
          ["应打款金额", payableAmount]
        ].forEach(([labelText, value]) => {
          const row = document.createElement("span");
          row.className = "invoice-upload-btn-stat";

          const label = document.createElement("span");
          label.className = "invoice-upload-btn-label";
          label.textContent = labelText;

          const amount = document.createElement("strong");
          amount.className = "invoice-upload-btn-value";
          amount.textContent = `${toMoney(value)} 元`;

          row.appendChild(label);
          row.appendChild(amount);
          stats.appendChild(row);
        });
        accountantInvoiceUploadBtn.appendChild(stats);
      }

      accountantInvoiceUploadBtn.setAttribute("aria-busy", String(isInvoiceUploadSubmitting));
      accountantInvoiceUploadBtn.setAttribute(
        "aria-label",
        count > 0
          ? `上传发票，${count} 条，开票金额 ${toMoney(invoiceAmount)} 元，个税 ${toMoney(taxAmount)} 元，应打款金额 ${toMoney(payableAmount)} 元`
          : "上传发票"
      );
      accountantInvoiceUploadBtn.title = count > 0
        ? `上传后 ${count} 条数据会显示为${getRecordWorkflowStatusLabelByKey("uploaded")}`
        : "";
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
        showAppStatus("暂无结算明细。");
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
        returnedCount,
        refundedCount
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
        if (refundedCount > 0) {
          messageParts.push(`退款 ${refundedCount} 条`);
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

    async function submitBossSettlementPayout(recordIds) {
      if (!isBossLogin()) return;
      if (isBossSettlementPayoutSubmitting) return;
      const normalizedRecordIds = Array.from(
        new Set(
          (Array.isArray(recordIds) ? recordIds : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );
      if (!normalizedRecordIds.length) {
        showAppStatus("请先选择要打款的数据。");
        return;
      }

      isBossSettlementPayoutSubmitting = true;
      renderBossSettlementDetailModalContent();
      try {
        const { paidRecordIds, skippedRecordIds } = await payoutSettlementRecordsByIds(normalizedRecordIds);
        const messageParts = [];
        if (paidRecordIds.length) {
          messageParts.push(`已打款 ${paidRecordIds.length} 条`);
        }
        if (skippedRecordIds.length) {
          messageParts.push(`跳过 ${skippedRecordIds.length} 条`);
        }
        showAppStatus(messageParts.length ? `${messageParts.join("，")}。` : "未处理任何数据。", paidRecordIds.length ? "ok" : "error");
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "打款失败，请稍后重试。");
      } finally {
        isBossSettlementPayoutSubmitting = false;
        renderBossSettlementDetailModalContent();
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
      const accountantAlias = isAccountant ? getCurrentAccountantDisplayName() : "";
      const accountantPhone = isAccountant ? getCurrentAccountantLoginPhone() : "";
      const loginLabel = isAccountant
        ? (accountantPhone || accountantAlias)
        : (isBoss ? (resolveLoginAccountInput(baseLoginLabel) || BOSS_LOGIN_ACCOUNT) : getDispatcherAccountDisplayName(baseLoginLabel));
      const accountantRealName = isAccountant ? getCurrentAccountantRealName() : "";
      const accountantMetaParts = [];
      if (accountantRealName) {
        accountantMetaParts.push(`姓名：${accountantRealName}`);
      }
      if (accountantAlias) {
        accountantMetaParts.push(`别名：${accountantAlias}`);
      }
      headerAccountText.textContent = isLoggedIn ? loginLabel : "";
      headerAccountSubText.textContent = "";
      if (isLoggedIn && isAccountant && accountantMetaParts.length) {
        accountantMetaParts.forEach((part) => {
          const separatorIndex = part.indexOf("：");
          const label = separatorIndex >= 0 ? part.slice(0, separatorIndex + 1) : "";
          const value = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : part;
          const item = document.createElement("span");
          item.className = "account-panel-meta";
          if (label) {
            const labelNode = document.createElement("span");
            labelNode.className = "account-panel-meta-label";
            labelNode.textContent = label;
            item.appendChild(labelNode);
          }
          const valueNode = document.createElement("span");
          valueNode.className = "account-panel-meta-value";
          valueNode.textContent = value;
          item.appendChild(valueNode);
          headerAccountSubText.appendChild(item);
        });
      }
      accountRoleBadge.textContent = isLoggedIn
        ? (isAccountant ? "会计账号" : (isBoss ? "管理员账号" : "接待账号"))
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
        clearBossSettlementPayoutSelection();
        setRecentBossSettlementRecordIds([]);
        closeBossSettlementSummaryModal();
      }
      updateAccountantInvoiceUploadControls();
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
      const shouldRequire = Boolean(isCreateMode) && isProductionEnvironment();
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
      if (hasAuthenticatedAccount()) return true;
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
      if (hasAuthenticatedAccount()) {
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
      stopAutoRefresh();
      clearAuthenticatedRuntimeState();
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
          let tooltipText = String(value || "").trim();
          let tooltipMode = "";
          if (index === 0) {
            td.classList.add("data-col-date");
            const dateTooltipText = getRecordDateTooltipText(item);
            if (dateTooltipText) {
              tooltipText = dateTooltipText;
              tooltipMode = "always";
            }
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
            if (dateTooltipText) {
              td.setAttribute("aria-label", `${String(value || "").trim()}，${dateTooltipText}`);
            }
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
          if (tooltipText) {
            td.dataset.tableTooltip = tooltipText;
          }
          if (tooltipMode) {
            td.dataset.tableTooltipMode = tooltipMode;
          }
          if (index === 2) td.classList.add("data-col-source");
          if (index === 3) td.classList.add("data-col-platform");
          if (index === 4) td.classList.add("data-col-shop");
          if (index === 5) td.classList.add("data-col-order");
          if (index === 6) td.classList.add("data-col-accountant");
          if (index === 8) td.classList.add("summary");
          if (index === 9) td.classList.add("remark", "data-col-remark");
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
          if (isRecordRefundable(item)) {
            const refundBtn = document.createElement("button");
            refundBtn.type = "button";
            refundBtn.className = "row-refund-btn";
            refundBtn.dataset.recordId = recordId;
            refundBtn.textContent = "退款";
            actionWrap.appendChild(refundBtn);
          } else {
            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "row-edit-btn";
            editBtn.dataset.recordId = recordId;
            editBtn.textContent = "修改";
            actionWrap.appendChild(editBtn);
          }
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
