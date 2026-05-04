// UI Flow: recycle/accountant/check/create modals, page mode switching, auth flow, table rendering.
    const RECYCLE_TABLE_COLUMNS = [
      { label: "删除时间", getValue: (entry) => formatDateTimeDisplay(entry.deletedAt) },
      { label: "删除人", getValue: (entry) => String(entry.deletedBy || "未知账号") },
      { label: "接单日期", getValue: (entry) => formatDateDisplay(entry?.record?.date) },
      { label: "接待人", className: "recycle-col-dispatcher", getValue: (entry) => getDispatcherDisplayNameByTag(entry?.record?.dispatcher) },
      { label: "会计", className: "recycle-col-accountant", getValue: (entry) => String(entry?.record?.accountant || "") },
      { label: "平台", getValue: (entry) => String(entry?.record?.platform || "") },
      { label: "店铺名", getValue: (entry) => String(entry?.record?.shopName || "") },
      { label: "订单号", getValue: (entry) => String(entry?.record?.orderNo || "") },
      { label: "来源", getValue: (entry) => String(entry?.record?.source || "") },
      { label: "客户", getValue: (entry) => String(entry?.record?.customer || "") },
      { label: "任务简介", className: "summary", getValue: (entry) => String(entry?.record?.summary || "") },
      { label: "付款价", className: "recycle-col-payment", getValue: (entry) => toMoney(entry?.record?.paymentPrice) },
      { label: "溢价", className: "recycle-col-premium", getValue: (entry) => formatPremiumWithPercent(entry?.record || {}) },
      { label: "会计价", className: "recycle-col-total", getValue: (entry) => toMoney(entry?.record?.totalPrice) },
      { label: "会计结算价", className: "recycle-col-settlement", getValue: (entry) => formatSettlementPriceDisplay(entry?.record || {}) },
      { label: "操作", className: "recycle-col-action", kind: "action" }
    ];

    function renderRecycleBinTableHead() {
      const headRow = recycleTableBody?.closest("table")?.querySelector("thead tr");
      if (!headRow) return;
      headRow.innerHTML = "";
      RECYCLE_TABLE_COLUMNS.forEach((column) => {
        const th = document.createElement("th");
        th.textContent = column.label;
        if (column.className) {
          th.className = column.className;
        }
        headRow.appendChild(th);
      });
    }

    function renderRecycleBinTable() {
      renderRecycleBinTableHead();
      recycleTableBody.innerHTML = "";
      const scopedRecycleRecords = getVisibleRecycleBinRecords();
      const canRestoreRecords = !isAccountantLogin();
      if (!scopedRecycleRecords.length) {
        recycleEmptyState.style.display = "block";
        return;
      }

      recycleEmptyState.style.display = "none";
      scopedRecycleRecords.forEach((entry) => {
        const tr = document.createElement("tr");
        RECYCLE_TABLE_COLUMNS.forEach((column) => {
          const td = document.createElement("td");
          if (column.className) {
            td.className = column.className;
          }
          if (column.kind === "action") {
            if (canRestoreRecords) {
              const restoreBtn = document.createElement("button");
              restoreBtn.type = "button";
              restoreBtn.className = "btn-secondary recycle-restore-btn";
              restoreBtn.dataset.recycleRestoreId = String(entry?.recycleId || "").trim();
              restoreBtn.textContent = "还原";
              td.appendChild(restoreBtn);
            }
          } else {
            td.textContent = column.getValue(entry);
          }
          tr.appendChild(td);
        });
        recycleTableBody.appendChild(tr);
      });
    }

    const TABLE_EXPORT_COLUMNS = [
      { label: "接单日期", getValue: (item) => String(item?.date || "").trim() },
      { label: "完工时间", getValue: (item) => formatDateTimeDisplay(item?.completedAt) },
      { label: "接待人", getValue: (item) => getDispatcherDisplayNameByTag(item?.dispatcher) },
      { label: "来源", getValue: (item) => String(item?.source || "").trim() },
      { label: "平台", getValue: (item) => String(item?.platform || "").trim() },
      { label: "店铺名", getValue: (item) => String(item?.shopName || "").trim() },
      { label: "订单号", getValue: (item) => String(item?.orderNo || "").trim() },
      { label: "会计", getValue: (item) => String(item?.accountant || "").trim() },
      { label: "客户", getValue: (item) => String(item?.customer || "").trim() },
      { label: "任务简介", getValue: (item) => String(item?.summary || "").trim() },
      { label: "备注", getValue: (item) => String(item?.remark || "").trim() },
      { label: "付款价", getValue: (item) => toMoney(item?.paymentPrice) },
      { label: "溢价", getValue: (item) => toMoney(getPremiumValue(item)) },
      { label: "接待收益", getValue: (item) => formatProfitDisplay(item), visible: () => shouldShowProfitColumn() },
      { label: "会计价", getValue: (item) => toMoney(item?.totalPrice) },
      { label: "会计结算价", getValue: (item) => toMoney(item?.settlementPrice) },
      { label: "状态", getValue: (item) => getRecordStatusWithSettlementText(item) }
    ];

    let stickyTableColumnSyncFrame = 0;

    function formatPremiumWithPercent(record) {
      const item = record && typeof record === "object" ? record : {};
      const premium = getPremiumValue(item);
      const payment = Number(item.paymentPrice);
      if (!Number.isFinite(premium)) return "";
      if (!Number.isFinite(payment) || payment === 0) return toMoney(premium);
      const percent = (premium / payment) * 100;
      if (percent === 0) return toMoney(premium);
      return `${toMoney(premium)} (${formatTrimmedPercent(percent)})`;
    }

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
        ? [historyWidth, refundWidth, checkWidth]
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
      return `数据表导出_${year}${month}${date}_${hours}${minutes}${seconds}.xlsx`;
    }

    function getNumericValueForExport(value) {
      if (value === null || value === undefined) return null;
      if (typeof value === "string" && value.trim() === "") return null;
      const num = Number(value);
      if (!Number.isFinite(num)) return null;
      return num;
    }

    function exportCurrentTableRecords() {
      if (!isBossLogin()) return;
      const exportRecords = getSortedRecords(getFilteredRecords());
      const exportColumns = getTableExportColumns();
      if (!exportRecords.length) {
        showAppStatus("当前没有可导出的数据。");
        return;
      }

      const totals = exportRecords.reduce((acc, item) => {
        const payment = Number(item?.paymentPrice);
        const premium = getPremiumValue(item);
        const profit = getProfitValue(item);
        const total = Number(item?.totalPrice);
        const settlement = Number(item?.settlementPrice);

        if (Number.isFinite(payment)) acc.totalPayment += payment;
        if (Number.isFinite(premium)) acc.totalPremium += premium;
        if (Number.isFinite(profit)) acc.totalProfit += profit;
        if (Number.isFinite(total)) acc.totalTotal += total;
        if (Number.isFinite(settlement)) acc.totalSettlement += settlement;

        return acc;
      }, { totalPayment: 0, totalPremium: 0, totalProfit: 0, totalTotal: 0, totalSettlement: 0 });

      const numericColumnLabels = ["付款价", "溢价", "会计价", "会计结算价"];

      const headerRow = exportColumns.map((column) => column.label);
      const totalRow = exportColumns.map((column) => {
        if (column.label === "付款价") return getNumericValueForExport(totals.totalPayment);
        if (column.label === "溢价") return getNumericValueForExport(totals.totalPremium);
        if (column.label === "接待收益") return toMoney(totals.totalProfit);
        if (column.label === "会计价") return getNumericValueForExport(totals.totalTotal);
        if (column.label === "会计结算价") return getNumericValueForExport(totals.totalSettlement);
        if (column.label === "接单日期") return "合计";
        return "";
      });
      const dataRows = exportRecords.map((item) => exportColumns.map((column) => {
        if (numericColumnLabels.includes(column.label)) {
          let value;
          if (column.label === "付款价") value = item?.paymentPrice;
          else if (column.label === "溢价") value = getPremiumValue(item);
          else if (column.label === "会计价") value = item?.totalPrice;
          else if (column.label === "会计结算价") value = item?.settlementPrice;
          return getNumericValueForExport(value);
        }
        return column.getValue(item);
      }));

      const ws = XLSX.utils.aoa_to_sheet([headerRow, totalRow, ...dataRows]);

      const headerStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "4472C4" } },
        font: { color: { rgb: "FFFFFF" }, bold: true }
      };
      const totalStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "D9E2F3" } },
        font: { bold: true }
      };

      const range = XLSX.utils.decode_range(ws["!ref"]);
      if (!ws["!cols"]) ws["!cols"] = [];

      const numericColumnIndices = exportColumns
        .map((col, index) => numericColumnLabels.includes(col.label) ? index : -1)
        .filter((index) => index >= 0);

      for (let col = range.s.c; col <= range.e.c; col++) {
        const colLetter = XLSX.utils.encode_col(col);
        const isNumericColumn = numericColumnIndices.includes(col);

        const headerCell = ws[`${colLetter}1`];
        if (headerCell) {
          headerCell.s = headerStyle;
        }

        const totalCell = ws[`${colLetter}2`];
        if (totalCell) {
          totalCell.s = totalStyle;
          if (isNumericColumn && totalCell.t === "n") {
            totalCell.z = "0.00";
          }
        }

        let maxWidth = 10;
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cell = ws[`${colLetter}${row + 1}`];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const cellWidth = String(cell.v).length;
            if (cellWidth > maxWidth) maxWidth = cellWidth;

            if (isNumericColumn && cell.t === "n") {
              cell.z = "0.00";
            }
          }
        }
        ws["!cols"][col] = { wch: Math.min(maxWidth + 2, 50) };
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "数据表");

      XLSX.writeFile(wb, getTableExportFileName());
    }

    function getDateCellDisplayParts(rawDateTime, fallbackDateTime = "") {
      const dateText = formatDateDisplay(rawDateTime);
      const timeText = formatTimeDisplay(fallbackDateTime || rawDateTime);
      return {
        dateText,
        timeText: timeText && timeText !== String(rawDateTime || "").trim() ? timeText : ""
      };
    }

    function getRecordCompletionDurationText(record) {
      const startTimestamp = parseDateDayLikeValue(record?.date);
      const endTimestamp = parseDateDayLikeValue(record?.completedAt);
      if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) return "";
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffDays = Math.max(0, Math.round((endTimestamp - startTimestamp) / oneDayMs));
      return `(${diffDays}天)`;
    }

    function getRecordDateTooltipText(record) {
      const createdAtTime = getDateCellDisplayParts(record?.date, record?.createdAt).timeText;
      if (createdAtTime) return createdAtTime;
      const rawDate = String(record?.date || "").trim();
      return /[ T]\d{1,2}:\d{2}/.test(rawDate) ? getDateCellDisplayParts(rawDate).timeText : "";
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
        const dispatcher = getDispatcherDisplayNameByTag(entry?.dispatcher);
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

    function openAccountantRegisterModal(options = {}) {
      if (!accountantRegisterModal || !accountantRegisterModalCard) return;
      const nextReturnTarget = String(options.returnTarget || accountantRegisterReturnTarget || "").trim();
      if (nextReturnTarget) {
        accountantRegisterReturnTarget = nextReturnTarget;
      }
      const shouldKeepAccountantModalOpen = accountantRegisterReturnTarget === "accountant-modal";
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantEditModal();
      if (!shouldKeepAccountantModalOpen) {
        closeAccountantModal();
      }
      closeChangePasswordModal();
      closeRecycleModal();
      closeDevTodoModal();
      resetAccountantRegisterForm();
      accountantRegisterModal.hidden = false;
      accountantRegisterModal.classList.toggle("modal-stacked", shouldKeepAccountantModalOpen);
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
      const isAccountantModalOpen = accountantModal && !accountantModal.hidden;
      const hintText = String(options.hintText || "").trim();
      const hintState = options.hintState || "idle";
      closeAccountantRegisterModal();
      if (!shouldRestore) return;
      if (!isAccountantModalOpen) {
        await openAccountantModal();
      }
      if (hintText) {
        setAccountantModalHint(hintText, hintState);
      }
      if (accountantListWrap && accountantModal && !accountantModal.hidden) {
        accountantListWrap.focus();
      }
    }

    function closeAccountantRegisterModal() {
      if (!accountantRegisterModal || !accountantRegisterModalCard) return;
      accountantRegisterModal.classList.remove("modal-enter");
      accountantRegisterModal.classList.remove("modal-stacked");
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

    function openPriceCompositionModal() {
      if (!priceCompositionModal || !priceCompositionModalCard) return;
      priceCompositionModal.hidden = false;
      priceCompositionModal.classList.remove("modal-enter");
      priceCompositionModalCard.classList.remove("modal-enter");
      void priceCompositionModal.offsetWidth;
      priceCompositionModal.classList.add("modal-enter");
      priceCompositionModalCard.classList.add("modal-enter");
      syncModalOpenState();
    }

    function closePriceCompositionModal() {
      if (!priceCompositionModal || !priceCompositionModalCard) return;
      priceCompositionModal.classList.remove("modal-enter");
      priceCompositionModalCard.classList.remove("modal-enter");
      priceCompositionModal.hidden = true;
      syncModalOpenState();
    }

    function getTodayDateKey() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const date = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${date}`;
    }

    function isReminderDue(reminder) {
      const date = String(reminder?.date || "").trim();
      return Boolean(date && date <= getTodayDateKey());
    }

    function getDueReminderCount() {
      return (Array.isArray(reminders) ? reminders : []).filter((item) => isReminderDue(item)).length;
    }

    function updateReminderEntryButton() {
      if (!openReminderModalBtn) return;
      const canUseReminders = canCurrentAccountUseReminders();
      const dueCount = getDueReminderCount();
      openReminderModalBtn.hidden = !canUseReminders;
      openReminderModalBtn.classList.toggle("is-due", dueCount > 0);
      openReminderModalBtn.textContent = dueCount > 0 ? `提醒（${dueCount}）` : "提醒";
      openReminderModalBtn.title = dueCount > 0
        ? `有 ${dueCount} 条提醒已到期，请打开检查具体提醒。`
        : "查看和新建提醒";
      openReminderModalBtn.setAttribute("aria-label", openReminderModalBtn.title);
    }

    function renderReminderModalContent() {
      if (!reminderModalMeta || !reminderList || !reminderEmptyState) return;
      const sortedReminders = [...(Array.isArray(reminders) ? reminders : [])].sort((left, right) => {
        const dateCompare = String(left?.date || "").localeCompare(String(right?.date || ""));
        if (dateCompare !== 0) return dateCompare;
        return String(right?.createdAt || "").localeCompare(String(left?.createdAt || ""));
      });
      const dueCount = sortedReminders.filter((item) => isReminderDue(item)).length;
      reminderModalMeta.textContent = dueCount > 0
        ? `有 ${dueCount} 条提醒已到期`
        : `共 ${sortedReminders.length} 条提醒`;
      reminderList.innerHTML = "";
      reminderEmptyState.hidden = sortedReminders.length > 0;

      sortedReminders.forEach((item) => {
        const row = document.createElement("article");
        row.className = "reminder-item";
        row.classList.toggle("is-due", isReminderDue(item));

        const dateBlock = document.createElement("div");
        dateBlock.className = "reminder-item-date-block";

        const main = document.createElement("div");
        main.className = "reminder-item-main";

        const date = document.createElement("span");
        date.className = "reminder-item-date";
        date.textContent = formatDateDisplay(item?.date) || String(item?.date || "").trim();
        dateBlock.appendChild(date);

        const status = document.createElement("span");
        status.className = "reminder-item-status";
        status.textContent = isReminderDue(item) ? "已到期" : "待提醒";
        dateBlock.appendChild(status);

        const order = document.createElement("strong");
        order.className = "reminder-item-order";
        order.textContent = `订单 ${String(item?.orderNo || "").trim()}`;
        main.appendChild(order);

        const wechat = document.createElement("span");
        wechat.className = "reminder-item-wechat";
        wechat.textContent = `微信 ${String(item?.customerWechat || "").trim()}`;
        main.appendChild(wechat);

        const meta = document.createElement("span");
        meta.className = "reminder-item-meta";
        meta.textContent = [
          String(item?.createdBy || "").trim(),
          formatDateTimeDisplay(item?.createdAt)
        ].filter(Boolean).join(" · ");
        main.appendChild(meta);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "reminder-delete-btn";
        deleteBtn.dataset.reminderId = String(item?.id || "").trim();
        deleteBtn.textContent = "删除";

        row.appendChild(dateBlock);
        row.appendChild(main);
        row.appendChild(deleteBtn);
        reminderList.appendChild(row);
      });
    }

    async function openReminderModal() {
      if (!reminderModal || !reminderModalCard) return;
      if (!canCurrentAccountUseReminders()) return;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeBossSettlementDetailModal();
      closeAnalysisModal();
      closeDispatcherModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      reminderForm.reset();
      reminderDateInput.value = getTodayDateKey();
      renderReminderModalContent();
      reminderModal.hidden = false;
      reminderModal.classList.remove("modal-enter");
      reminderModalCard.classList.remove("modal-enter");
      void reminderModal.offsetWidth;
      reminderModal.classList.add("modal-enter");
      reminderModalCard.classList.add("modal-enter");
      syncModalOpenState();
      try {
        await fetchReminders();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取提醒失败，请稍后重试。");
      }
      reminderDateInput.focus();
    }

    function closeReminderModal() {
      if (!reminderModal || !reminderModalCard) return;
      reminderModal.classList.remove("modal-enter");
      reminderModalCard.classList.remove("modal-enter");
      reminderModal.hidden = true;
      syncModalOpenState();
    }

    function getOperationRecordInfoText(record) {
      const parts = [
        formatDateDisplay(record?.date),
        getDispatcherDisplayNameByTag(record?.dispatcher),
        String(record?.accountant || "").trim(),
        String(record?.customer || "").trim() || "未填客户"
      ].filter(Boolean);
      const orderNo = String(record?.orderNo || "").trim();
      if (orderNo) parts.push(`订单号 ${orderNo}`);
      return parts.join(" · ");
    }

    function getOperationRecordChangeSummary(changes) {
      const source = Array.isArray(changes) ? changes : [];
      const labels = source
        .map((change) => getRecordHistoryFieldLabel(change?.field, change?.label))
        .map((label) => String(label || "").trim())
        .filter(Boolean);
      if (!labels.length) return "无字段变更";
      const shown = labels.slice(0, 4).join("、");
      return labels.length > 4 ? `${shown} 等 ${labels.length} 项` : shown;
    }

    function getAllOperationRecordRows() {
      return (Array.isArray(records) ? records : []).flatMap((record) => {
        const historyItems = Array.isArray(record?.operationHistory) ? record.operationHistory : [];
        return historyItems.map((entry) => ({
          record,
          entry,
          timeValue: Date.parse(entry?.operatedAt || "") || 0
        }));
      }).sort((left, right) => right.timeValue - left.timeValue);
    }

    function renderOperationRecordsModalContent() {
      if (!operationRecordsMeta || !operationRecordsList) return;
      const rows = getAllOperationRecordRows();
      const visibleRows = rows.slice(0, 200);
      operationRecordsMeta.textContent = rows.length
        ? `最近 ${visibleRows.length} 条 / 全部 ${rows.length} 条`
        : "暂无操作记录";
      operationRecordsList.innerHTML = "";

      if (!visibleRows.length) {
        const empty = document.createElement("div");
        empty.className = "operation-records-empty";
        empty.textContent = "暂无操作记录。";
        operationRecordsList.appendChild(empty);
        return;
      }

      visibleRows.forEach(({ record, entry }) => {
        const item = document.createElement("article");
        item.className = "operation-record-item";

        const top = document.createElement("div");
        top.className = "operation-record-item-top";

        const time = document.createElement("span");
        time.className = "operation-record-time";
        time.textContent = formatDateTimeDisplay(entry?.operatedAt) || "时间未知";
        top.appendChild(time);

        const operator = document.createElement("span");
        operator.className = "operation-record-operator";
        operator.textContent = [
          String(entry?.operatedBy || "").trim() || "未记录账号",
          getRecordHistoryRoleText(entry?.operatedRole)
        ].filter(Boolean).join(" · ");
        top.appendChild(operator);

        const action = document.createElement("span");
        action.className = "operation-record-action";
        action.textContent = String(entry?.actionLabel || "").trim() || "修改";
        top.appendChild(action);

        const detail = document.createElement("div");
        detail.className = "operation-record-detail";
        detail.textContent = getOperationRecordInfoText(record);

        const changes = document.createElement("div");
        changes.className = "operation-record-changes";
        changes.textContent = getOperationRecordChangeSummary(entry?.changes);

        item.appendChild(top);
        item.appendChild(detail);
        item.appendChild(changes);
        operationRecordsList.appendChild(item);
      });
    }

    function openOperationRecordsModal() {
      if (!operationRecordsModal || !operationRecordsModalCard) return;
      if (!isBossLogin()) {
        showAppStatus("操作记录仅管理员可用。");
        return;
      }
      renderOperationRecordsModalContent();
      operationRecordsModal.hidden = false;
      operationRecordsModal.classList.remove("modal-enter");
      operationRecordsModalCard.classList.remove("modal-enter");
      void operationRecordsModal.offsetWidth;
      operationRecordsModal.classList.add("modal-enter");
      operationRecordsModalCard.classList.add("modal-enter");
      syncModalOpenState();
      operationRecordsModalCard.focus();
    }

    function closeOperationRecordsModal() {
      if (!operationRecordsModal || !operationRecordsModalCard) return;
      operationRecordsModal.classList.remove("modal-enter");
      operationRecordsModalCard.classList.remove("modal-enter");
      operationRecordsModal.hidden = true;
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
      closeOperationRecordsModal();
      closePriceCompositionModal();
      disposeAnalysisTrendChart();
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
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      setDispatcherModalHint("", "idle");
      dispatcherModal.hidden = false;
      dispatcherModal.classList.remove("modal-enter");
      dispatcherModalCard.classList.remove("modal-enter");
      void dispatcherModal.offsetWidth;
      dispatcherModal.classList.add("modal-enter");
      dispatcherModalCard.classList.add("modal-enter");
      syncModalOpenState();
      renderListLoadingState(dispatcherList, dispatcherEmptyState, "正在读取接待列表...");
      try {
        await fetchDispatchers();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取接待列表失败，请稍后重试。");
        closeDispatcherModal();
        return;
      } finally {
        setRegionLoading(dispatcherListWrap, false);
      }
      if (dispatcherModal.hidden) return;
      renderDispatcherList();
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
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeDispatcherModal();
      closeAccountantEditModal();
      closeRecycleModal();
      closeDevTodoModal();
      setAccountantModalHint("", "idle");
      accountantModal.hidden = false;
      accountantModal.classList.remove("modal-enter");
      accountantModalCard.classList.remove("modal-enter");
      void accountantModal.offsetWidth;
      accountantModal.classList.add("modal-enter");
      accountantModalCard.classList.add("modal-enter");
      syncModalOpenState();
      renderListLoadingState(accountantList, accountantEmptyState, "正在读取会计列表...");
      try {
        await fetchAccountants();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取会计列表失败，请稍后重试。");
        closeAccountantModal();
        return;
      } finally {
        setRegionLoading(accountantListWrap, false);
      }
      if (accountantModal.hidden) return;
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
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeDispatcherModal();
      closeAccountantEditModal();
      closeAccountantModal();
      closeDevTodoModal();
      setRecycleModalHint("", "idle");
      recycleModal.hidden = false;
      recycleModal.classList.remove("modal-enter");
      recycleModalCard.classList.remove("modal-enter");
      void recycleModal.offsetWidth;
      recycleModal.classList.add("modal-enter");
      recycleModalCard.classList.add("modal-enter");
      renderListLoadingState(recycleTableBody, recycleEmptyState, "正在读取回收站...");
      renderListLoadingState(accountantLogList, accountantLogEmptyState, "正在读取会计操作日志...");
      syncModalOpenState();
      try {
        await fetchRecycleBinRecords();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取回收站失败，请稍后重试。");
        closeRecycleModal();
        return;
      } finally {
        setRegionLoading(recycleTableBody.closest(".table-wrap"), false);
        setRegionLoading(accountantLogList.parentElement, false);
      }
      if (recycleModal.hidden) return;
      renderRecycleBinTable();
      renderAccountantOperationLogs();
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

    function normalizeChangeLogItems(payload) {
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.changes)
          ? payload.changes
          : [];
      return items
        .map((item) => ({
          type: String(item?.type || "").trim(),
          version: String(item?.version || "").trim(),
          time: String(item?.time || item?.date || "").trim(),
          content: String(item?.content || item?.message || item?.change || "").trim()
        }))
        .filter((item) => item.time || item.content)
        .sort((left, right) => {
          const rightTime = Date.parse(String(right.time || "").replace(" ", "T"));
          const leftTime = Date.parse(String(left.time || "").replace(" ", "T"));
          if (Number.isFinite(rightTime) && Number.isFinite(leftTime) && rightTime !== leftTime) {
            return rightTime - leftTime;
          }
          return String(right.time || "").localeCompare(String(left.time || ""));
        });
    }

    function renderChangeLogItems(items) {
      if (!changeLogList || !changeLogEmptyState) return;
      changeLogList.innerHTML = "";
      if (!items.length) {
        changeLogEmptyState.hidden = false;
        return;
      }
      changeLogEmptyState.hidden = true;
      items.forEach((item) => {
        const entry = document.createElement("article");
        entry.className = "change-log-entry";
        const time = document.createElement("time");
        time.className = "change-log-time";
        time.textContent = item.time || "时间未记录";
        const meta = document.createElement("div");
        meta.className = "change-log-meta";
        if (item.type) {
          const type = document.createElement("span");
          type.className = "change-log-badge";
          type.textContent = item.type;
          meta.appendChild(type);
        }
        if (item.version) {
          const version = document.createElement("span");
          version.className = "change-log-version";
          version.textContent = item.version;
          meta.appendChild(version);
        }
        const content = document.createElement("div");
        content.className = "change-log-content";
        content.textContent = item.content || "修改内容未记录";
        entry.append(time);
        if (meta.childNodes.length) {
          entry.appendChild(meta);
        }
        entry.appendChild(content);
        changeLogList.appendChild(entry);
      });
    }

    async function loadChangeLogItems() {
      if (!changeLogList || !changeLogEmptyState) return;
      changeLogList.innerHTML = "";
      changeLogEmptyState.hidden = false;
      changeLogEmptyState.textContent = "正在读取更新日志...";
      try {
        const response = await fetch(API_ENDPOINT_CHANGE_LOG, { cache: "no-store" });
        if (!response.ok) throw new Error("读取更新日志失败");
        renderChangeLogItems(normalizeChangeLogItems(await response.json()));
        changeLogEmptyState.textContent = "暂无更新日志。";
      } catch (error) {
        console.error(error);
        changeLogList.innerHTML = "";
        changeLogEmptyState.hidden = false;
        changeLogEmptyState.textContent = "更新日志读取失败。";
      }
    }

    function openChangeLogModal() {
      if (!changeLogModal || !changeLogModalCard) return;
      changeLogModal.hidden = false;
      changeLogModal.classList.remove("modal-enter");
      changeLogModalCard.classList.remove("modal-enter");
      void changeLogModal.offsetWidth;
      changeLogModal.classList.add("modal-enter");
      changeLogModalCard.classList.add("modal-enter");
      syncModalOpenState();
      void loadChangeLogItems();
    }

    function closeChangeLogModal() {
      if (!changeLogModal || !changeLogModalCard) return;
      changeLogModal.classList.remove("modal-enter");
      changeLogModalCard.classList.remove("modal-enter");
      changeLogModal.hidden = true;
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
      setCompleteModalMode("edit");
      resetInlineFormState(completeForm, setCompleteFormHint);
      syncModalOpenState();
    }

    function syncRefundPremiumPriceFromPrices() {
      if (!refundPremiumHint) return;
      const paymentRaw = String(refundPaymentPriceInput.value || "").trim();
      const totalRaw = String(refundTotalPriceInput.value || "").trim();
      const payment = Number(paymentRaw);
      const total = Number(totalRaw);
      if (!paymentRaw || !totalRaw || !Number.isFinite(payment) || !Number.isFinite(total)) {
        refundPremiumHint.hidden = true;
        refundPremiumHint.textContent = "";
        refundPremiumHint.classList.remove("active", "negative");
        return;
      }

      const premium = payment - total;
      refundPremiumHint.hidden = false;
      refundPremiumHint.textContent = `溢价：${premium.toFixed(2)} 元`;
      refundPremiumHint.classList.toggle("active", premium >= 0);
      refundPremiumHint.classList.toggle("negative", premium < 0);
    }

    function openRefundModal(record) {
      if (!record || typeof record !== "object") {
        showAppStatus("退款数据无效。", "error");
        return;
      }
      if (!isRecordRefundable(record)) {
        showAppStatus("当前状态支持已确认或已完成订单退款。", "error");
        return;
      }
      const settlementPrice = Number(record.settlementPrice);
      if (!Number.isFinite(settlementPrice) || settlementPrice < 0) {
        showAppStatus("当前会计结算价无效。", "error");
        return;
      }
      const paymentPrice = Number(record.paymentPrice);
      const totalPrice = Number(record.totalPrice);
      const isAccountantRefund = isAccountantLogin();
      if (!isAccountantRefund && (!Number.isFinite(paymentPrice) || paymentPrice < 0)) {
        showAppStatus("当前付款价无效。", "error");
        return;
      }
      if (!Number.isFinite(totalPrice) || totalPrice < 0) {
        showAppStatus("当前会计价无效。", "error");
        return;
      }
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
      resetInlineFormState(refundForm, setRefundFormHint);
      refundRecordIdInput.value = String(record.id || "").trim();
      refundPaymentPriceInput.value = isAccountantRefund ? "" : toMoney(paymentPrice);
      refundPaymentPriceInput.dataset.originalPaymentPrice = String(paymentPrice);
      refundTotalPriceInput.value = toMoney(totalPrice);
      refundTotalPriceInput.dataset.originalTotalPrice = String(totalPrice);
      refundSettlementPriceInput.value = toMoney(settlementPrice);
      refundSettlementPriceInput.dataset.originalSettlementPrice = String(settlementPrice);
      refundPaymentPriceInput.disabled = isAccountantRefund;
      refundTotalPriceInput.disabled = false;
      refundPaymentPriceInput.closest(".refund-price-item").hidden = isAccountantRefund;
      refundTotalPriceInput.closest(".refund-price-item").hidden = false;
      syncRefundPremiumPriceFromPrices();
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
      const focusInput = isAccountantRefund ? refundTotalPriceInput : refundPaymentPriceInput;
      focusInput.focus();
      focusInput.select();
    }

    function closeRefundModal() {
      refundModal.classList.remove("modal-enter");
      refundModalCard.classList.remove("modal-enter");
      refundModal.hidden = true;
      refundRecordIdInput.value = "";
      refundPaymentPriceInput.value = "";
      refundPaymentPriceInput.dataset.originalPaymentPrice = "";
      refundTotalPriceInput.value = "";
      refundTotalPriceInput.dataset.originalTotalPrice = "";
      refundSettlementPriceInput.value = "";
      refundSettlementPriceInput.dataset.originalSettlementPrice = "";
      refundPaymentPriceInput.disabled = false;
      refundTotalPriceInput.disabled = false;
      refundPaymentPriceInput.closest(".refund-price-item").hidden = false;
      refundTotalPriceInput.closest(".refund-price-item").hidden = false;
      syncRefundPremiumPriceFromPrices();
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
      "refundStatus",
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
      "totalPrice",
      "settlementPrice",
      "refundStatus",
      "checkStatus",
      "isSettled",
      "completedAt",
      "customerFeedback"
    ];
    const ACCOUNTANT_RECORD_HISTORY_FIELD_SET = new Set(ACCOUNTANT_RECORD_HISTORY_FIELD_ORDER);
    const ALWAYS_VISIBLE_RECORD_HISTORY_FIELDS = new Set([
      "customerFeedback"
    ]);

    const RECORD_HISTORY_FIELD_LABELS = {
      checkStatus: "状态",
      refundStatus: "退款",
      paymentPrice: "付款价",
      totalPrice: "会计价",
      premiumPrice: "溢价",
      settlementPrice: "会计结算价",
      isSettled: "结算",
      settledAt: "结算时间",
      settledBy: "结算人",
      settlementInvoiceImage: "发票",
      invoiceUploadedAt: "发票上传时间",
      invoiceUploadedBy: "发票上传人",
      date: "接单日期",
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
      if (normalizedField === "refundStatus") {
        return getRecordRefundBadgeText(item);
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
        return getDispatcherDisplayNameByTag(item.dispatcher) || String(item.dispatcher || "").trim();
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
      if (ALWAYS_VISIBLE_RECORD_HISTORY_FIELDS.has(normalizedField)) return true;
      if ([
        "checkStatus",
        "refundStatus",
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
        "remark",
        "completedAt"
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
      if (normalizedField === "refundStatus") {
        return String(value || "").trim() || "空";
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

      bossSettlementDetailTitleCount.textContent = "";
      bossSettlementDetailTitleCount.hidden = true;
      bossSettlementDetailMeta.textContent = "";
      bossSettlementDetailList.innerHTML = "";

      if (settlementDetailActiveTab === "dispatcher") {
        renderDispatcherSettlementDetail();
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

    function renderDispatcherSettlementDetail() {
      const {
        groups,
        recordCount,
        dispatcherCount,
        totalPremium,
        totalDispatcherPrice,
        totalInvoiceAmount,
        totalTaxAmount,
        totalPayableAmount
      } = getDispatcherSettlementSummary();

      if (!groups.length) {
        const empty = document.createElement("div");
        empty.className = "settlement-detail-empty";
        empty.textContent = "暂无接待结算明细。";
        bossSettlementDetailList.appendChild(empty);
        return;
      }

      const section = document.createElement("section");
      section.className = "settlement-detail-section";

      const sectionHeading = document.createElement("div");
      sectionHeading.className = "settlement-detail-section-heading";

      const sectionTitle = document.createElement("h3");
      sectionTitle.className = "settlement-detail-section-title";
      sectionTitle.textContent = "接待结算";
      sectionHeading.appendChild(sectionTitle);

      section.appendChild(sectionHeading);

      const tableWrap = document.createElement("div");
      tableWrap.className = "settlement-detail-table-wrap";

      const table = document.createElement("table");
      table.className = "settlement-detail-table";

      const colgroup = document.createElement("colgroup");
      [
        "dispatcher",
        "money",
        "money",
        "money",
        "money",
        "money"
      ].forEach((columnClass) => {
        const col = document.createElement("col");
        col.className = `settlement-detail-col-${columnClass}`;
        colgroup.appendChild(col);
      });
      table.appendChild(colgroup);

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      const headerColumns = [
        { key: "dispatcher", label: "接待", summary: `${dispatcherCount}位/${recordCount || 0}单`, align: "dispatcher" },
        { key: "premium", label: "溢价(50%)", summary: `合计 ${toMoney(totalPremium)} 元`, align: "money" },
        { key: "dispatcherPrice", label: "接待价", summary: `合计 ${toMoney(totalDispatcherPrice)} 元`, align: "money" },
        { key: "invoiceAmount", label: "开票金额", summary: `合计 ${toMoney(totalInvoiceAmount)} 元`, align: "money" },
        { key: "taxAmount", label: "个税", summary: `合计 ${toMoney(totalTaxAmount)} 元`, align: "money" },
        { key: "payableAmount", label: "应打款金额", summary: `合计 ${toMoney(totalPayableAmount)} 元`, align: "money" }
      ];
      headerColumns.forEach((column) => {
        const th = document.createElement("th");
        th.scope = "col";
        th.className = `settlement-detail-heading-cell ${column.align}`;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "settlement-detail-sort-btn";

        const label = document.createElement("span");
        label.className = "settlement-detail-sort-label";
        label.textContent = column.label;
        button.appendChild(label);

        const summary = document.createElement("span");
        summary.className = "settlement-detail-sort-summary";
        summary.textContent = column.summary;
        button.appendChild(summary);

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

      groups.forEach((group) => {
        const row = document.createElement("tr");
        row.className = "settlement-detail-row tone-dispatcher";

        const dispatcherTd = document.createElement("td");
        dispatcherTd.className = "settlement-detail-dispatcher-cell settlement-detail-col-dispatcher";

        const dispatcherName = document.createElement("strong");
        dispatcherName.className = "settlement-detail-dispatcher";
        dispatcherName.textContent = group.dispatcher;
        dispatcherTd.appendChild(dispatcherName);

        const dispatcherMeta = document.createElement("span");
        dispatcherMeta.className = "settlement-detail-dispatcher-meta";
        dispatcherMeta.textContent = `${group.recordCount}单`;
        dispatcherTd.appendChild(dispatcherMeta);
        row.appendChild(dispatcherTd);

        row.appendChild(createMoneyCell(group.premium));
        row.appendChild(createMoneyCell(group.dispatcherPrice));
        row.appendChild(createMoneyCell(group.invoiceAmount));
        row.appendChild(createMoneyCell(group.taxAmount));
        row.appendChild(createMoneyCell(group.payableAmount));

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      tableWrap.appendChild(table);
      section.appendChild(tableWrap);
      bossSettlementDetailList.appendChild(section);
    }

    function updateBossSettlementDetailControls() {
      if (!bossSettlementDetailBtn) return;
      const canPayoutRecords = canCurrentAccountPayoutSettlementRecords();
      const {
        recordCount,
        accountantCount,
        pendingRecordCount,
        uploadedRecordCount
      } = getBossSettlementDetailSummary();
      const shouldShow = canPayoutRecords && (pendingRecordCount > 0 || uploadedRecordCount > 0);

      bossSettlementDetailBtn.hidden = !shouldShow;
      bossSettlementDetailBtn.disabled = !shouldShow;
      bossSettlementDetailBtn.textContent = accountantCount > 0 ? `打款（${accountantCount}）` : "打款";
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
      if (isInvoiceUploadSubmitting) {
        const spinner = document.createElement("span");
        spinner.className = "loading-spinner";
        spinner.setAttribute("aria-hidden", "true");
        title.appendChild(spinner);
      }
      const titleText = document.createElement("span");
      titleText.className = "invoice-upload-btn-title-text";
      titleText.textContent = count > 0
        ? `${isInvoiceUploadSubmitting ? "上传中" : "上传发票"}（${count}）`
        : "上传发票";
      title.appendChild(titleText);
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
      accountantInvoiceUploadBtn.classList.toggle("is-loading", Boolean(isInvoiceUploadSubmitting));
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
      try {
        renderBossSettlementSummaryContent();
        const { settledRecordIds, skippedRecordIds } = await withLoading(
          {
            button: bossSettlementSummarySubmitBtn,
            region: bossSettlementSummaryModalCard,
            buttonText: "结算中...",
            regionText: "正在结算..."
          },
          () => settleRecordsByIds(recordIds)
        );
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
      try {
        renderBossSettlementDetailModalContent();
        const { paidRecordIds, skippedRecordIds } = await withLoading(
          {
            region: bossSettlementDetailList,
            regionText: "正在打款..."
          },
          () => payoutSettlementRecordsByIds(normalizedRecordIds)
        );
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

    function formatMonthFilterChipLabel(rawValue, startRaw = filterState.dateStart, endRaw = filterState.dateEnd) {
      return getDateFilterChipMeta(rawValue, startRaw, endRaw).label;
    }

    function syncDateRangeFilterInputs(force = false, options = {}) {
      const {
        startInput = filterDateStartInput,
        endInput = filterDateEndInput,
        startValue = filterState.dateStart,
        endValue = filterState.dateEnd
      } = options;
      if (startInput && (force || document.activeElement !== startInput)) {
        startInput.value = String(startValue || "").trim();
      }
      if (endInput && (force || document.activeElement !== endInput)) {
        endInput.value = String(endValue || "").trim();
      }
    }

    function clearDateFilterState() {
      filterState.month = "";
      filterState.dateStart = "";
      filterState.dateEnd = "";
      syncDateRangeFilterInputs(true);
    }

    function clearCompletedAtFilterState() {
      filterState.completedAtMonth = "";
      filterState.completedAtStart = "";
      filterState.completedAtEnd = "";
      syncDateRangeFilterInputs(true, {
        startInput: filterCompletedAtStartInput,
        endInput: filterCompletedAtEndInput,
        startValue: filterState.completedAtStart,
        endValue: filterState.completedAtEnd
      });
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

    function applyCompletedAtRangeFilter() {
      const normalizedRange = getNormalizedDateRangeFilter(
        filterCompletedAtStartInput?.value || "",
        filterCompletedAtEndInput?.value || ""
      );
      filterState.completedAtMonth = "";
      filterState.completedAtStart = normalizedRange.start;
      filterState.completedAtEnd = normalizedRange.end;
      syncDateRangeFilterInputs(true, {
        startInput: filterCompletedAtStartInput,
        endInput: filterCompletedAtEndInput,
        startValue: filterState.completedAtStart,
        endValue: filterState.completedAtEnd
      });
    }

    const FILTER_ICON_PATH = "M3 5h18l-7 8v5l-4 2v-7z";
    const SEARCH_ICON_PATH = "M10.5 4a6.5 6.5 0 0 1 5.18 10.43l4.44 4.45-1.24 1.24-4.45-4.44A6.5 6.5 0 1 1 10.5 4Zm0 1.75a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5Z";
    const CLOSE_ICON_PATH = "M6.4 5.2 12 10.8l5.6-5.6 1.2 1.2-5.6 5.6 5.6 5.6-1.2 1.2-5.6-5.6-5.6 5.6-1.2-1.2 5.6-5.6-5.6-5.6z";

    function syncFilterIconButton(button, isActive, defaultIconPath, activeLabel, inactiveLabel) {
      if (!button) return;
      const iconPath = button.querySelector("svg path");
      if (iconPath) {
        iconPath.setAttribute("d", isActive ? CLOSE_ICON_PATH : defaultIconPath);
      }
      const label = isActive ? activeLabel : inactiveLabel;
      button.setAttribute("aria-label", label);
      button.title = label;
    }

    function updateFilterButtonUI() {
      const hasDateFilter = hasDateFilterSelected();
      const hasCompletedAtFilter = hasDateFilterSelected({
        month: filterState.completedAtMonth,
        dateStart: filterState.completedAtStart,
        dateEnd: filterState.completedAtEnd
      });
      const dateFilterChip = getDateFilterChipMeta();
      const completedAtFilterChip = getDateFilterChipMeta(
        filterState.completedAtMonth,
        filterState.completedAtStart,
        filterState.completedAtEnd
      );
      filterMonthBtn.classList.toggle("active", hasDateFilter);
      filterCompletedAtBtn.classList.toggle("active", hasCompletedAtFilter);
      filterDispatcherBtn.classList.toggle("active", Boolean(filterState.dispatcher));
      filterOrderBtn.classList.toggle("active", Boolean(filterState.orderNo));
      filterAccountantBtn.classList.toggle("active", Boolean(filterState.accountant));
      filterPlatformBtn.classList.toggle("active", Boolean(filterState.platform));
      filterShopBtn.classList.toggle("active", Boolean(filterState.shopName));
      filterSourceBtn.classList.toggle("active", Boolean(filterState.source));
      filterStatusBtn.classList.toggle("active", Boolean(filterState.status));
      filterSettledBtn.classList.toggle("active", Boolean(filterState.settled));
      if (filterMonthIndicator) filterMonthIndicator.classList.toggle("active", hasDateFilter);
      if (filterCompletedAtIndicator) filterCompletedAtIndicator.classList.toggle("active", hasCompletedAtFilter);
      if (filterDispatcherIndicator) filterDispatcherIndicator.classList.toggle("active", Boolean(filterState.dispatcher));
      if (filterOrderIndicator) filterOrderIndicator.classList.toggle("active", Boolean(filterState.orderNo));
      if (filterAccountantIndicator) filterAccountantIndicator.classList.toggle("active", Boolean(filterState.accountant));
      if (filterPlatformIndicator) filterPlatformIndicator.classList.toggle("active", Boolean(filterState.platform));
      if (filterShopIndicator) filterShopIndicator.classList.toggle("active", Boolean(filterState.shopName));
      if (filterSourceIndicator) filterSourceIndicator.classList.toggle("active", Boolean(filterState.source));
      if (filterStatusIndicator) filterStatusIndicator.classList.toggle("active", Boolean(filterState.status));
      if (filterSettledIndicator) filterSettledIndicator.classList.toggle("active", Boolean(filterState.settled));
      filterMonthBtn.setAttribute("aria-expanded", String(!filterMonthPopover.hidden));
      filterCompletedAtBtn.setAttribute("aria-expanded", String(!filterCompletedAtPopover.hidden));
      filterDispatcherBtn.setAttribute("aria-expanded", String(!filterDispatcherPopover.hidden));
      filterOrderBtn.setAttribute("aria-expanded", String(!filterOrderPopover.hidden));
      filterAccountantBtn.setAttribute("aria-expanded", String(!filterAccountantPopover.hidden));
      filterPlatformBtn.setAttribute("aria-expanded", String(!filterPlatformPopover.hidden));
      filterShopBtn.setAttribute("aria-expanded", String(!filterShopPopover.hidden));
      filterSourceBtn.setAttribute("aria-expanded", String(!filterSourcePopover.hidden));
      filterStatusBtn.setAttribute("aria-expanded", String(!filterStatusPopover.hidden));
      filterSettledBtn.setAttribute("aria-expanded", String(!filterSettledPopover.hidden));
      syncFilterIconButton(filterMonthBtn, hasDateFilter, FILTER_ICON_PATH, "清空日期筛选", "筛选日期");
      syncFilterIconButton(filterCompletedAtBtn, hasCompletedAtFilter, FILTER_ICON_PATH, "清空完工日期筛选", "筛选完工日期");
      syncFilterIconButton(filterDispatcherBtn, Boolean(filterState.dispatcher), FILTER_ICON_PATH, "清空接待人筛选", "筛选接待人");
      syncFilterIconButton(filterOrderBtn, Boolean(filterState.orderNo), SEARCH_ICON_PATH, "清空订单号查询", "查询订单号");
      syncFilterIconButton(filterAccountantBtn, Boolean(filterState.accountant), FILTER_ICON_PATH, "清空会计筛选", "筛选会计");
      syncFilterIconButton(filterPlatformBtn, Boolean(filterState.platform), FILTER_ICON_PATH, "清空平台筛选", "筛选平台");
      syncFilterIconButton(filterShopBtn, Boolean(filterState.shopName), FILTER_ICON_PATH, "清空店铺名筛选", "筛选店铺名");
      syncFilterIconButton(filterSourceBtn, Boolean(filterState.source), FILTER_ICON_PATH, "清空来源筛选", "筛选来源");
      syncFilterIconButton(filterStatusBtn, Boolean(filterState.status), FILTER_ICON_PATH, "清空状态筛选", "筛选状态");
      syncFilterIconButton(filterSettledBtn, Boolean(filterState.settled), FILTER_ICON_PATH, "清空结算筛选", "筛选结算状态");
      syncDateRangeFilterInputs();
      syncDateRangeFilterInputs(false, {
        startInput: filterCompletedAtStartInput,
        endInput: filterCompletedAtEndInput,
        startValue: filterState.completedAtStart,
        endValue: filterState.completedAtEnd
      });

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

      if (hasCompletedAtFilter) {
        const monthLabel = completedAtFilterChip.label || formatMonthFilterChipLabel(
          filterState.completedAtMonth,
          filterState.completedAtStart,
          filterState.completedAtEnd
        );
        filterCompletedAtValue.hidden = false;
        filterCompletedAtValue.textContent = monthLabel;
        filterCompletedAtValue.title = completedAtFilterChip.title || monthLabel;
      } else {
        filterCompletedAtValue.hidden = true;
        filterCompletedAtValue.textContent = "";
        filterCompletedAtValue.title = "";
      }

      if (filterState.dispatcher) {
        filterDispatcherValue.hidden = false;
        filterDispatcherValue.textContent = getDispatcherDisplayNameByTag(filterState.dispatcher);
      } else {
        filterDispatcherValue.hidden = true;
        filterDispatcherValue.textContent = "";
      }

      if (filterState.orderNo) {
        const orderNoList = String(filterState.orderNo || "")
          .split(/[\n\r]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        const displayText = orderNoList.length > 1
          ? `(${orderNoList.length}) ${orderNoList.join(" ")}`
          : filterState.orderNo;
        filterOrderValue.hidden = false;
        filterOrderValue.textContent = displayText;
        filterOrderValue.title = displayText;
      } else {
        filterOrderValue.hidden = true;
        filterOrderValue.textContent = "";
        filterOrderValue.title = "";
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
      filterCompletedAtPopover.hidden = true;
      filterDispatcherPopover.hidden = true;
      filterOrderPopover.hidden = true;
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
        filterCompletedAtPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterOrderPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
        filterSettledPopover.hidden = true;
      }
      if (key === "completedAt") {
        updateFilterOptions();
        const open = filterCompletedAtPopover.hidden;
        filterCompletedAtPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterOrderPopover.hidden = true;
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
        filterCompletedAtPopover.hidden = true;
        filterOrderPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
        filterSettledPopover.hidden = true;
      }
      if (key === "orderNo") {
        const open = filterOrderPopover.hidden;
        filterOrderPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterCompletedAtPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterAccountantPopover.hidden = true;
        filterPlatformPopover.hidden = true;
        filterShopPopover.hidden = true;
        filterSourcePopover.hidden = true;
        filterStatusPopover.hidden = true;
        filterSettledPopover.hidden = true;
        if (open && filterOrderInput) {
          window.setTimeout(() => {
            filterOrderInput.focus();
            filterOrderInput.select();
          }, 0);
        }
      }
      if (key === "accountant") {
        updateFilterOptions();
        const open = filterAccountantPopover.hidden;
        filterAccountantPopover.hidden = !open;
        filterMonthPopover.hidden = true;
        filterCompletedAtPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterOrderPopover.hidden = true;
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
        filterCompletedAtPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterOrderPopover.hidden = true;
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
        filterCompletedAtPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterOrderPopover.hidden = true;
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
        filterCompletedAtPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterOrderPopover.hidden = true;
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
        filterCompletedAtPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterOrderPopover.hidden = true;
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
        filterCompletedAtPopover.hidden = true;
        filterDispatcherPopover.hidden = true;
        filterOrderPopover.hidden = true;
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
      document.body.classList.toggle("login-mode", !isLoggedIn);
      const isAccountant = isAccountantLogin();
      const isBoss = isBossLogin();
      const isDispatcher = Boolean(isLoggedIn && !isAccountant && !isBoss);
      const canSettleRecords = Boolean(isLoggedIn && canCurrentAccountSettleRecords());
      if (sortState.key === "profitPrice") {
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
      openCreateModalBtn.hidden = isAccountant;
      openDispatcherModalBtn.hidden = !isBoss;
      openAnalysisModalBtn.hidden = !isBoss;
      openRecycleModalBtn.hidden = isAccountant;
      openAccountantModalBtn.hidden = isAccountant;
      updateReminderEntryButton();
      if (exportTableBtn) {
        exportTableBtn.hidden = !isBoss;
      }
      if (bossSettlementSummaryBtn) {
        bossSettlementSummaryBtn.hidden = !isBoss;
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
      setPageMode(false);
      loginCodeInput.focus();
      return false;
    }

    async function syncDataAfterLogin() {
      renderTableLoadingState("正在加载工作数据...");
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
        renderTable();
      }
      try {
        await fetchAccountantOperationLogs();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取会计操作日志失败，请稍后重试。");
      } finally {
        setRegionLoading(mainTableWrap, false);
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
        authResult = await withLoading(
          {
            button: enterBtn,
            form: loginForm,
            buttonText: "登录中..."
          },
          () => verifyLoginByServer(rawName, rawPassword)
        );
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
      clearAuthenticatedRuntimeState();
      saveToStorage();
      applyAccountToForm();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
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

      if (filterState.orderNo) {
        const orderNoList = String(filterState.orderNo || "")
          .split(/[\n\r]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        if (orderNoList.length > 1) {
          const scopedOrderNoSet = new Set(
            scopedRecords.map(item => String(item.orderNo || "").toLowerCase().trim())
          );
          const notFoundOrderNos = orderNoList.filter(query => !scopedOrderNoSet.has(query.toLowerCase()));
          if (notFoundOrderNos.length > 0) {
            const notFoundText = notFoundOrderNos.length > 1
              ? `以下订单号未找到：${notFoundOrderNos.join("、")}`
              : `订单号“${notFoundOrderNos[0]}”未找到`;
            showAppStatus(notFoundText, "error");
          }
        }
      } else {
        setAppStatusHint("", "idle");
      }
      const hasFilter = Boolean(
        hasDateFilterSelected()
        || hasDateFilterSelected({
          month: filterState.completedAtMonth,
          dateStart: filterState.completedAtStart,
          dateEnd: filterState.completedAtEnd
        })
        || filterState.dispatcher
        || filterState.orderNo
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
          getDateCellDisplayParts(item.date).dateText,
          [getDateCellDisplayParts(item.completedAt).dateText, getRecordCompletionDurationText(item)].filter(Boolean).join(""),
          getDispatcherDisplayNameByTag(dispatcherTag),
          String(item.source || ""),
          String(item.platform || ""),
          String(item.shopName || ""),
          String(item.orderNo || ""),
          String(item.accountant || ""),
          String(item.customer || ""),
          String(item.summary || ""),
          String(item.remark || ""),
          toMoney(item.paymentPrice),
          formatPremiumWithPercent(item),
          toMoney(item.totalPrice),
          formatSettlementPriceDisplay(item),
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
            td.classList.add("data-col-completed-at");
            td.textContent = value;
            const completedAtTooltip = getDateCellDisplayParts(item.completedAt).timeText;
            if (completedAtTooltip) {
              tooltipText = completedAtTooltip;
              tooltipMode = "always";
              td.setAttribute("aria-label", `${String(value || "").trim()}，${completedAtTooltip}`);
            }
          } else if (index === 2) {
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
            const refundBadgeText = getRecordRefundBadgeText(item);
            if (refundBadgeText) {
              const refundBadge = document.createElement("span");
              refundBadge.className = `record-status-refund-badge${refundBadgeText === "退单" ? " returned" : ""}`;
              refundBadge.textContent = refundBadgeText;
              statusWrap.appendChild(refundBadge);
              const statusText = String(value || "").trim();
              td.setAttribute("aria-label", statusText ? `${statusText}，${refundBadgeText}` : refundBadgeText);
            }
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
          if (index === 3) td.classList.add("data-col-source");
          if (index === 4) td.classList.add("data-col-platform");
          if (index === 5) td.classList.add("data-col-shop");
          if (index === 6) td.classList.add("data-col-order");
          if (index === 7) td.classList.add("data-col-accountant");
          if (index === 9) td.classList.add("summary");
          if (index === 10) td.classList.add("remark", "data-col-remark");
          if (index === 11) td.classList.add("data-col-payment");
          if (index === 12) td.classList.add("data-col-premium");
          if (index === 13) td.classList.add("data-col-total");
          if (index === 14) td.classList.add("data-col-settlement");
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
        if (recordId) {
          if (isRecordRefundable(item)) {
            const refundBtn = document.createElement("button");
            refundBtn.type = "button";
            refundBtn.className = "row-refund-btn";
            refundBtn.dataset.recordId = recordId;
            refundBtn.textContent = "退款";
            refundBtn.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!requireAccount()) return;
              openRefundModal(item);
            });
            actionWrap.appendChild(refundBtn);
          } else if (!hasRecordAccountantConfirmation(item)) {
            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "row-edit-btn";
            editBtn.dataset.recordId = recordId;
            editBtn.textContent = "修改";
            if (canEditRecords) {
              actionWrap.appendChild(editBtn);
            }
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
          if (!isRecordCompletionStatus(item) && checkStatus !== "returned") {
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
