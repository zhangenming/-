// UI Flow: recycle/accountant/check/create modals, page mode switching, auth flow, table rendering.
    const RECYCLE_TABLE_COLUMNS = [
      { label: "删除时间", getValue: (entry) => formatDateTimeDisplay(entry.deletedAt) },
      { label: "删除人", getValue: (entry) => String(entry.deletedBy || "未知账号") },
      { label: "接单日期", getValue: (entry) => formatDateDisplay(entry?.record?.date) },
      { label: "会计", className: "recycle-col-accountant", getValue: (entry) => String(entry?.record?.accountant || "") },
      { label: "平台", getValue: (entry) => String(entry?.record?.platform || "") },
      { label: "店铺名", getValue: (entry) => String(entry?.record?.shopName || "") },
      { label: "订单号", getValue: (entry) => String(entry?.record?.orderNo || "") },
      { label: "接待人", className: "recycle-col-dispatcher", getValue: (entry) => getDispatcherDisplayNameByTag(entry?.record?.dispatcher) },
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

    function getBossSettlementDetailOwnOrderCount(group) {
      const { own } = getBossSettlementDetailOrderParts(group);
      return own;
    }

    function getBossSettlementDetailOwnOrderTotal(groups) {
      const source = Array.isArray(groups) ? groups : [];
      return source.reduce((sum, group) => sum + getBossSettlementDetailOwnOrderCount(group), 0);
    }

    function formatSettlementHeaderOrderCount(groups) {
      return `${getBossSettlementDetailOwnOrderTotal(groups)}单`;
    }

    function formatSettlementHeaderMoneyFormula(accountantValue, dispatcherValue, totalValue) {
      const accountantAmount = Number(accountantValue) || 0;
      const dispatcherAmount = Number(dispatcherValue) || 0;
      const totalAmount = Number(totalValue) || 0;
      return `合计 ${toMoney(accountantAmount)}+${toMoney(dispatcherAmount)}=${toMoney(totalAmount)}`;
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
      { key: "date", label: "接单日期", getValue: (item) => String(item?.date || "").trim() },
      { key: "completedAt", label: "完工时间", getValue: (item) => formatDateTimeDisplay(item?.completedAt) },
      { key: "dispatcher", label: "接待人", getValue: (item) => getDispatcherDisplayNameByTag(item?.dispatcher) },
      { key: "source", label: "来源", getValue: (item) => String(item?.source || "").trim() },
      { key: "platform", label: "平台", getValue: (item) => String(item?.platform || "").trim() },
      { key: "shop", label: "店铺名", getValue: (item) => String(item?.shopName || "").trim() },
      { key: "order", label: "订单号", getValue: (item) => String(item?.orderNo || "").trim() },
      { key: "accountant", label: "会计", getValue: (item) => String(item?.accountant || "").trim() },
      { key: "customer", label: "客户", getValue: (item) => String(item?.customer || "").trim() },
      { key: "summary", label: "任务简介", getValue: (item) => String(item?.summary || "").trim() },
      { key: "remark", label: "备注", getValue: (item) => String(item?.remark || "").trim() },
      { key: "payment", label: "付款价", getValue: (item) => toMoney(item?.paymentPrice) },
      { key: "premium", label: "溢价", getValue: (item) => toMoney(getPremiumValue(item)) },
      { label: "接待收益", getValue: (item) => formatProfitDisplay(item), visible: () => shouldShowProfitColumn() },
      { key: "total", label: "会计价", getValue: (item) => toMoney(item?.totalPrice) },
      { key: "settlement", label: "会计结算价", getValue: (item) => toMoney(item?.settlementPrice) },
      { key: "monthlySettlement", label: "是否月结", getValue: (item) => getMonthlySettlementTableDisplay(item) },
      { key: "monthlySettlement", label: "月结ID", getValue: (item) => getRecordMonthlySettlement(item).id },
      { key: "monthlySettlement", label: "月结月数", getValue: (item) => String(getRecordMonthlySettlement(item).monthCount || "").trim() },
      { key: "monthlySettlement", label: "月结序号", getValue: (item) => String(getRecordMonthlySettlement(item).sequence || "").trim() },
      { key: "monthlySettlement", label: "月结单总付款价", getValue: (item) => toMoney(getRecordMonthlySettlement(item).totalPaymentPrice), visible: () => !isAccountantLogin() },
      { label: "状态", getValue: (item) => getRecordStatusWithSettlementText(item) }
    ];

    let stickyTableColumnSyncFrame = 0;

    function renderTableColumnSettings() {
      if (!tableColumnSettingsList) return;
      tableColumnSettingsList.innerHTML = "";
      TABLE_COLUMN_SETTINGS.filter(isTableColumnAvailable).forEach((column) => {
        const label = document.createElement("label");
        label.className = "table-column-option";
        label.htmlFor = `tableColumnSetting_${column.key}`;

        const checkbox = document.createElement("input");
        checkbox.id = `tableColumnSetting_${column.key}`;
        checkbox.type = "checkbox";
        checkbox.className = "table-column-option-checkbox";
        checkbox.dataset.tableColumnKey = column.key;
        checkbox.checked = isTableColumnVisible(column.key);

        const text = document.createElement("span");
        text.textContent = column.label;

        label.appendChild(checkbox);
        label.appendChild(text);
        tableColumnSettingsList.appendChild(label);
      });
    }

    function updateTableColumnSettingsButton() {
      if (!tableColumnSettingsBtn) return;
      const hiddenCount = TABLE_COLUMN_SETTINGS
        .filter(isTableColumnAvailable)
        .filter((column) => !isTableColumnVisible(column.key)).length;
      tableColumnSettingsBtn.classList.toggle("active", hiddenCount > 0);
      tableColumnSettingsBtn.title = hiddenCount > 0 ? `已隐藏 ${hiddenCount} 列` : "设置数据表显示列";
    }

    function applyTableColumnVisibility() {
      const table = tableBody ? tableBody.closest("table") : null;
      if (!table) return;
      TABLE_COLUMN_SETTINGS.forEach((column) => {
        const hidden = !isTableColumnAvailable(column) || !isTableColumnVisible(column.key);
        column.selectors.forEach((selector) => {
          table.querySelectorAll(selector).forEach((node) => {
            node.hidden = hidden;
          });
        });
      });
      renderTableColumnSettings();
      updateTableColumnSettingsButton();
      scheduleStickyTableColumnWidthSync();
    }

    function setTableColumnVisible(key, visible) {
      const column = getTableColumnSetting(key);
      if (!column) return;
      tableColumnVisibilityState[column.key] = Boolean(visible);
      saveViewState();
      applyTableColumnVisibility();
    }

    function openTableColumnSettings() {
      if (!tableColumnSettingsDropdown || !tableColumnSettingsBtn) return;
      renderTableColumnSettings();
      tableColumnSettingsDropdown.hidden = false;
      tableColumnSettingsBtn.setAttribute("aria-expanded", "true");
    }

    function closeTableColumnSettings() {
      if (!tableColumnSettingsDropdown || !tableColumnSettingsBtn) return;
      tableColumnSettingsDropdown.hidden = true;
      tableColumnSettingsBtn.setAttribute("aria-expanded", "false");
    }

    function toggleTableColumnSettings() {
      if (!tableColumnSettingsDropdown) return;
      if (tableColumnSettingsDropdown.hidden) openTableColumnSettings();
      else closeTableColumnSettings();
    }

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
        (typeof column.visible !== "function" || column.visible())
        && (!column.key || isTableColumnAvailable(column.key))
        && (!column.key || isTableColumnVisible(column.key))
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
      if (!canCurrentAccountExportTableRecords()) return;
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

    function getSettlementPayoutExportFileName(monthKey = "") {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const date = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const normalizedMonthKey = normalizeSettlementMonthKey(monthKey).replace("-", "");
      const monthPart = normalizedMonthKey ? `${normalizedMonthKey}_` : "";
      return `打款数据导出_${monthPart}${year}${month}${date}_${hours}${minutes}${seconds}.xlsx`;
    }

    function exportSettlementPayout() {
      if (!canCurrentAccountSettleRecords()) return;
      const activeMonthKey = resolveBossSettlementDetailMonthKey(records);
      const { groups } = getBossSettlementDetailSummary(records, { monthKey: activeMonthKey });
      const payoutGroups = groups.filter((group) => {
        const targets = Array.isArray(group.payoutTargets) ? group.payoutTargets : group.payoutRecordIds;
        return Array.isArray(targets) && targets.length > 0;
      });
      if (!payoutGroups.length) {
        showAppStatus("当前没有可打款的数据。");
        return;
      }

      const headerRow = ["姓名", "证件类型", "证件号码", "工资账号", "收款机构编号", "金额", "手机号"];
      const dataRows = [];

      payoutGroups.forEach((group) => {
        const profile = getAccountantProfileByLoginName(group.accountant);
        const recipientInfo = normalizeInvoiceRecipientInfo(profile?.invoiceRecipientInfo);
        const realName = getAccountantRealNameByLoginName(group.accountant);
        const amount = Object.prototype.hasOwnProperty.call(group, "payoutPayableAmount")
          ? (Number(group.payoutPayableAmount) || 0)
          : (Number(group.payableAmount) || 0);

        dataRows.push([
          realName || recipientInfo.name || group.accountant,
          "身份证",
          recipientInfo.idCardNo || "",
          recipientInfo.bankCardNo || "",
          recipientInfo.bankName || "",
          getNumericValueForExport(amount),
          recipientInfo.declarationPhone || (profile?.phone || "")
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

      const headerStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "4472C4" } },
        font: { color: { rgb: "FFFFFF" }, bold: true }
      };

      const range = XLSX.utils.decode_range(ws["!ref"]);
      if (!ws["!cols"]) ws["!cols"] = [];

      const amountColumnIndex = 5;

      for (let col = range.s.c; col <= range.e.c; col++) {
        const colLetter = XLSX.utils.encode_col(col);
        const isAmountColumn = col === amountColumnIndex;

        const headerCell = ws[`${colLetter}1`];
        if (headerCell) {
          headerCell.s = headerStyle;
        }

        let maxWidth = 10;
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cell = ws[`${colLetter}${row + 1}`];
          if (cell && cell.v !== undefined && cell.v !== null) {
            const cellWidth = String(cell.v).length;
            if (cellWidth > maxWidth) maxWidth = cellWidth;

            if (isAmountColumn && cell.t === "n") {
              cell.z = "0.00";
            }
          }
        }
        ws["!cols"][col] = { wch: Math.min(maxWidth + 2, 50) };
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "打款数据");

      XLSX.writeFile(wb, getSettlementPayoutExportFileName(activeMonthKey));
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
        accountantRegisterSubmitBtn.textContent = "确认注册";
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
      if (accountantEditRecipientFieldset) {
        accountantEditRecipientFieldset.hidden = true;
      }
      if (accountantEditRecipientNameInput) accountantEditRecipientNameInput.value = "";
      if (accountantEditRecipientIdCardInput) accountantEditRecipientIdCardInput.value = "";
      if (accountantEditRecipientBankInput) accountantEditRecipientBankInput.value = "";
      if (accountantEditRecipientBankCardInput) accountantEditRecipientBankCardInput.value = "";
      if (accountantEditRecipientPhoneInput) accountantEditRecipientPhoneInput.value = "";
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
      const canEditRecipientFields = mode === "admin";
      if (accountantEditRecipientFieldset) {
        accountantEditRecipientFieldset.hidden = !canEditRecipientFields;
      }
      [
        accountantEditRecipientNameInput,
        accountantEditRecipientIdCardInput,
        accountantEditRecipientBankInput,
        accountantEditRecipientBankCardInput,
        accountantEditRecipientPhoneInput
      ].forEach((input) => {
        if (!input) return;
        input.readOnly = !canEditRecipientFields;
        input.disabled = !canEditRecipientFields;
        input.required = canEditRecipientFields;
        input.toggleAttribute("readonly", !canEditRecipientFields);
        input.toggleAttribute("disabled", !canEditRecipientFields);
        input.toggleAttribute("required", canEditRecipientFields);
      });
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
      if (accountantEditSettlementRatioInput) {
        const canEditSettlementRatio = mode === "admin" && isBossLogin();
        const ratioField = accountantEditSettlementRatioInput.closest(".field");
        if (ratioField) ratioField.hidden = !canEditSettlementRatio;
        accountantEditSettlementRatioInput.disabled = !canEditSettlementRatio;
        accountantEditSettlementRatioInput.required = canEditSettlementRatio;
        accountantEditSettlementRatioInput.value = canEditSettlementRatio ? String(normalizeAccountantSettlementRatio(profile.accountingSettlementRatio)) : "";
      }
      if (accountantEditAliasInput) accountantEditAliasInput.value = alias;
      const recipientInfo = normalizeInvoiceRecipientInfo(profile.invoiceRecipientInfo);
      if (accountantEditRecipientFieldset) {
        accountantEditRecipientFieldset.hidden = mode !== "admin";
      }
      if (accountantEditRecipientNameInput) accountantEditRecipientNameInput.value = recipientInfo.name || String(profile.realName || "").trim();
      if (accountantEditRecipientIdCardInput) accountantEditRecipientIdCardInput.value = recipientInfo.idCardNo || "";
      if (accountantEditRecipientBankInput) accountantEditRecipientBankInput.value = recipientInfo.bankName || "";
      if (accountantEditRecipientBankCardInput) accountantEditRecipientBankCardInput.value = recipientInfo.bankCardNo || "";
      if (accountantEditRecipientPhoneInput) accountantEditRecipientPhoneInput.value = recipientInfo.declarationPhone || "";
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

    function isAnalysisPageRouteActive() {
      try {
        const params = new URLSearchParams(window.location.search || "");
        return params.get("view") === "analysis";
      } catch {
        return false;
      }
    }

    function updateAnalysisPageRoute(isActive, { replace = false } = {}) {
      if (!window.history || !window.history.pushState) return;
      const url = new URL(window.location.href);
      if (isActive) {
        url.searchParams.set("view", "analysis");
      } else {
        url.searchParams.delete("view");
      }
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl === currentUrl) return;
      const method = replace ? "replaceState" : "pushState";
      window.history[method]({ view: isActive ? "analysis" : "table" }, "", nextUrl);
    }

    function openAnalysisModal(options = {}) {
      const shouldUpdateRoute = options.updateRoute !== false;
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeDispatcherModal();
      closeRecycleModal();
      closeAccountantEditModal();
      closeCustomerFeedbackModal();
      closeDevTodoModal();
      renderAnalysisPanel();
      analysisModal.hidden = false;
      analysisModal.classList.remove("analysis-page-enter");
      analysisModalCard.classList.remove("analysis-page-enter");
      void analysisModal.offsetWidth;
      analysisModal.classList.add("analysis-page-enter");
      analysisModalCard.classList.add("analysis-page-enter");
      document.body.classList.add("analysis-page-active");
      if (shouldUpdateRoute) {
        updateAnalysisPageRoute(true);
      }
      syncModalOpenState();
    }

    function syncAnalysisPageRoute() {
      if (hasAuthenticatedAccount() && isBossLogin() && isAnalysisPageRouteActive()) {
        openAnalysisModal({ updateRoute: false });
        return;
      }
      closeAnalysisModal({ updateRoute: false });
    }

    function getCustomerFeedbackSourceRecords() {
      return typeof getFilteredRecords === "function"
        ? getFilteredRecords()
        : getVisibleRecords();
    }

    function buildCustomerFeedbackGroups(sourceRecords) {
      const groups = new Map();
      sourceRecords.forEach((record) => {
        const feedback = String(record?.customerFeedback || "").trim();
        if (!feedback) return;
        const accountantName = String(record?.accountant || "").trim() || "未填会计";
        const key = accountantName;
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            accountantName,
            records: [],
          });
        }
        groups.get(key).records.push(record);
      });
      return Array.from(groups.values()).sort((left, right) => {
        if (left.key === "未填会计") return 1;
        if (right.key === "未填会计") return -1;
        return left.accountantName.localeCompare(right.accountantName, "zh-CN");
      });
    }

    function renderCustomerFeedbackModal() {
      if (!customerFeedbackList || !customerFeedbackModalMeta) return;
      const sourceRecords = getCustomerFeedbackSourceRecords();
      const groups = buildCustomerFeedbackGroups(sourceRecords);
      const feedbackCount = groups.reduce((sum, group) => sum + group.records.length, 0);
      customerFeedbackModalMeta.textContent = `当前表格范围 ${sourceRecords.length} 单，含反馈 ${feedbackCount} 单`;
      customerFeedbackList.innerHTML = "";
      if (!feedbackCount) {
        const empty = document.createElement("div");
        empty.className = "customer-feedback-empty";
        empty.textContent = "当前表格范围暂无客服反馈。";
        customerFeedbackList.appendChild(empty);
        return;
      }
      groups.forEach((group) => {
        const section = document.createElement("section");
        section.className = "customer-feedback-group";
        const head = document.createElement("div");
        head.className = "customer-feedback-group-head";
        const title = document.createElement("h3");
        title.textContent = group.accountantName;
        const count = document.createElement("span");
        count.textContent = `${group.records.length} 单`;
        head.append(title, count);
        const list = document.createElement("div");
        list.className = "customer-feedback-group-list";
        group.records.forEach((record) => {
          const orderNo = String(record?.orderNo || "").trim() || "未填订单号";
          const feedback = String(record?.customerFeedback || "").trim();
          const item = document.createElement("article");
          item.className = "customer-feedback-item";
          const feedbackNode = document.createElement("div");
          feedbackNode.className = "customer-feedback-item-text";
          feedbackNode.textContent = feedback;
          const orderNode = document.createElement("strong");
          orderNode.className = "customer-feedback-order";
          orderNode.textContent = orderNo;
          item.append(feedbackNode, orderNode);
          list.appendChild(item);
        });
        section.append(head, list);
        customerFeedbackList.appendChild(section);
      });
    }

    function openCustomerFeedbackModal() {
      if (!customerFeedbackModal || !customerFeedbackModalCard) return;
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
      renderCustomerFeedbackModal();
      customerFeedbackModal.hidden = false;
      customerFeedbackModal.classList.remove("modal-enter");
      customerFeedbackModalCard.classList.remove("modal-enter");
      void customerFeedbackModal.offsetWidth;
      customerFeedbackModal.classList.add("modal-enter");
      customerFeedbackModalCard.classList.add("modal-enter");
      syncModalOpenState();
    }

    function openPriceCompositionModal() {
      if (!priceCompositionModal || !priceCompositionModalCard) return;
      updatePriceCompositionModal();
      priceCompositionModal.hidden = false;
      priceCompositionModal.classList.remove("modal-enter");
      priceCompositionModalCard.classList.remove("modal-enter");
      void priceCompositionModal.offsetWidth;
      priceCompositionModal.classList.add("modal-enter");
      priceCompositionModalCard.classList.add("modal-enter");
      syncModalOpenState();
    }

    function formatPriceCompositionMoney(value) {
      const amount = Number(value);
      if (!Number.isFinite(amount)) return "0.00";
      return amount.toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    function formatPriceCompositionValue(value, paymentTotal) {
      const amount = Number(value);
      const base = Number(paymentTotal);
      const percent = Number.isFinite(amount) && Number.isFinite(base) && base !== 0
        ? (amount / base) * 100
        : 0;
      return `${formatPriceCompositionMoney(amount)} [${percent.toFixed(1)}%]`;
    }

    function formatPriceCompositionPercent(value, paymentTotal) {
      const amount = Number(value);
      const base = Number(paymentTotal);
      const percent = Number.isFinite(amount) && Number.isFinite(base) && base !== 0
        ? (amount / base) * 100
        : 0;
      return `${percent.toFixed(1)}%`;
    }

    function roundPercentages(values, total, decimals = 1) {
      const multiplier = Math.pow(10, decimals);
      const floors = values.map((v, index) => {
        const percent = total > 0 ? (Number(v) / total) * 100 : 0;
        return {
          index,
          value: v,
          floor: Math.floor(percent * multiplier) / multiplier,
          remainder: (percent * multiplier) % 1
        };
      });
      const floorSum = floors.reduce((sum, item) => sum + item.floor, 0);
      const targetSum = values.reduce((sum, v) => sum + (Number(v) || 0), 0) / total * 100;
      const difference = Math.round((targetSum - floorSum) * multiplier) / multiplier;
      const sorted = [...floors].sort((a, b) => b.remainder - a.remainder);
      let remaining = difference;
      for (const item of sorted) {
        if (remaining <= 0) break;
        item.floor += 1 / multiplier;
        remaining -= 1 / multiplier;
      }
      const resultMap = new Map();
      floors.forEach(item => {
        resultMap.set(item.index, item.floor);
      });
      return resultMap;
    }

    function getPriceCompositionWeight(value) {
      return `${Math.max(Number(value) || 0, 0.0001)}fr`;
    }

    function getPriceCompositionPercent(value, paymentTotal) {
      const amount = Number(value);
      const base = Number(paymentTotal);
      if (!Number.isFinite(amount) || !Number.isFinite(base) || base === 0) {
        return 0;
      }
      return Math.max((amount / base) * 100, 0);
    }

    function getPriceCompositionRecords() {
      if (typeof getFilteredRecords === "function") {
        return getFilteredRecords();
      }
      return getVisibleRecords();
    }

    function updatePriceCompositionModal() {
      if (!priceCompositionModal) return;
      const sourceRecords = getPriceCompositionRecords();
      const totals = (Array.isArray(sourceRecords) ? sourceRecords : []).reduce(
        (summary, item) => {
          const payment = Number(item?.paymentPrice);
          const total = Number(item?.totalPrice);
          const settlement = Number(item?.settlementPrice);
          const premium = getPremiumValue(item);
          if (Number.isFinite(payment)) summary.payment += payment;
          if (Number.isFinite(total)) summary.total += total;
          if (Number.isFinite(settlement)) summary.settlement += settlement;
          if (Number.isFinite(premium)) summary.premium += premium;
          return summary;
        },
        { payment: 0, premium: 0, total: 0, settlement: 0 },
      );
      const profitBreakdown = getProfitTotalBreakdown(sourceRecords);
      const dispatcherProfit = Number.isFinite(profitBreakdown.totalProfit)
        ? profitBreakdown.totalProfit
        : 0;
      const baseProfitAmount = Number.isFinite(profitBreakdown.totalBase)
        ? profitBreakdown.totalBase
        : 0;
      const premiumReceptionAmount = Number.isFinite(profitBreakdown.premiumProfit)
        ? profitBreakdown.premiumProfit
        : 0;
      const platformAmount = totals.payment - dispatcherProfit - totals.settlement;
      const premiumPlatformAmount = totals.premium - premiumReceptionAmount;
      const totalReceptionAmount = baseProfitAmount;
      const totalPlatformAmount = platformAmount - premiumPlatformAmount;
      const split = {
        payment: totals.payment,
        premium: totals.premium,
        total: totals.total,
        settlement: totals.settlement,
        premiumPlatform: premiumPlatformAmount,
        premiumReception: premiumReceptionAmount,
        totalPlatform: totalPlatformAmount,
        totalReception: totalReceptionAmount,
        totalAccounting: totals.settlement,
        platform: platformAmount,
        reception: dispatcherProfit,
        accounting: totals.settlement
      };
      const premiumPercent = getPriceCompositionPercent(split.premium, split.payment);
      const totalPercent = getPriceCompositionPercent(split.total, split.payment);
      const premiumWidth = Math.min(premiumPercent, 100);
      const totalWidth = Math.min(totalPercent, 100);
      const resultWidth = getPriceCompositionPercent(split.platform + split.reception + split.accounting, split.payment);
      const layout = {
        premiumLeft: 0,
        premiumWidth,
        premiumCenter: premiumWidth / 2,
        totalLeft: premiumWidth,
        totalWidth,
        totalCenter: premiumWidth + (totalWidth / 2),
        resultLeft: getPriceCompositionPercent(split.payment - split.platform - split.reception - split.accounting, split.payment),
        resultWidth: Math.min(resultWidth, 100)
      };
      const allFieldsWithPercent = ["payment", "premium", "total", "premiumPlatform", "premiumReception", "totalPlatform", "totalReception", "totalAccounting", "platform", "reception", "accounting"];
      const premiumGroupPercentMap = roundPercentages([split.premiumPlatform, split.premiumReception], split.payment);
      const totalGroupPercentMap = roundPercentages([split.totalPlatform, split.totalReception, split.totalAccounting], split.payment);
      const resultGroupPercentMap = roundPercentages([split.platform, split.reception, split.accounting], split.payment);
      const fieldToIndexMap = {
        premiumPlatform: 0,
        premiumReception: 1,
        totalPlatform: 0,
        totalReception: 1,
        totalAccounting: 2,
        platform: 0,
        reception: 1,
        accounting: 2
      };
      const getRoundedPercent = (field, value) => {
        const index = fieldToIndexMap[field];
        if (field === "premiumPlatform" || field === "premiumReception") {
          return premiumGroupPercentMap.get(index);
        }
        if (field === "totalPlatform" || field === "totalReception" || field === "totalAccounting") {
          return totalGroupPercentMap.get(index);
        }
        if (field === "platform" || field === "reception" || field === "accounting") {
          return resultGroupPercentMap.get(index);
        }
        return getPriceCompositionPercent(value, split.payment);
      };
      Object.entries(split).forEach(([field, value]) => {
        const node = priceCompositionModal.querySelector(
          `[data-price-composition-field="${field}"]`,
        );
        if (!node) return;
        const amountText = formatPriceCompositionMoney(value);
        node.textContent = amountText;
        if (allFieldsWithPercent.includes(field)) {
          const percentNode = priceCompositionModal.querySelector(
            `[data-price-composition-percent="${field}"]`,
          );
          if (percentNode) {
            const roundedPercent = getRoundedPercent(field, value);
            percentNode.textContent = `${roundedPercent.toFixed(1)}%`;
          }
        }
      });
      const chart = priceCompositionModal.querySelector(".price-composition-chart");
      if (chart) {
        chart.style.setProperty("--price-premium-left", `${layout.premiumLeft}%`);
        chart.style.setProperty("--price-premium-width", `${layout.premiumWidth}%`);
        chart.style.setProperty("--price-premium-center", `${layout.premiumCenter}%`);
        chart.style.setProperty("--price-total-left", `${layout.totalLeft}%`);
        chart.style.setProperty("--price-total-width", `${layout.totalWidth}%`);
        chart.style.setProperty("--price-total-center", `${layout.totalCenter}%`);
        chart.style.setProperty("--price-result-left", `${layout.resultLeft}%`);
        chart.style.setProperty("--price-result-width", `${layout.resultWidth}%`);
        chart.style.setProperty(
          "--price-premium-columns",
          [split.premiumPlatform, split.premiumReception].map(getPriceCompositionWeight).join(" "),
        );
        chart.style.setProperty(
          "--price-total-columns",
          [split.totalPlatform, split.totalReception, split.totalAccounting].map(getPriceCompositionWeight).join(" "),
        );
        chart.style.setProperty(
          "--price-result-columns",
          [split.platform, split.reception, split.accounting].map(getPriceCompositionWeight).join(" "),
        );
        const sumPositive = (values) => values.reduce((sum, value) => {
          const amount = Number(value);
          return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
        }, 0);
        const getSegmentCenter = (left, width, values, index) => {
          const total = sumPositive(values);
          if (total <= 0 || width <= 0) return left + (width / 2);
          const before = values.slice(0, index).reduce((sum, value) => {
            const amount = Number(value);
            return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
          }, 0);
          const current = Math.max(Number(values[index]) || 0, 0);
          return left + (width * ((before + (current / 2)) / total));
        };
        const toFlowX = (percent) => {
          const value = Math.min(Math.max(Number(percent) || 0, 0), 100);
          return Number((value * 10).toFixed(2));
        };
        const premiumValues = [split.premiumPlatform, split.premiumReception];
        const totalValues = [split.totalPlatform, split.totalReception, split.totalAccounting];
        const resultValues = [split.platform, split.reception, split.accounting];
        const premiumPlatformX = toFlowX(getSegmentCenter(layout.premiumLeft, layout.premiumWidth, premiumValues, 0));
        const premiumReceptionX = toFlowX(getSegmentCenter(layout.premiumLeft, layout.premiumWidth, premiumValues, 1));
        const totalPlatformX = toFlowX(getSegmentCenter(layout.totalLeft, layout.totalWidth, totalValues, 0));
        const totalReceptionX = toFlowX(getSegmentCenter(layout.totalLeft, layout.totalWidth, totalValues, 1));
        const totalAccountingX = toFlowX(getSegmentCenter(layout.totalLeft, layout.totalWidth, totalValues, 2));
        const resultPlatformX = toFlowX(getSegmentCenter(layout.resultLeft, layout.resultWidth, resultValues, 0));
        const resultReceptionX = toFlowX(getSegmentCenter(layout.resultLeft, layout.resultWidth, resultValues, 1));
        const resultAccountingX = toFlowX(getSegmentCenter(layout.resultLeft, layout.resultWidth, resultValues, 2));
        const premiumSourceX = toFlowX(layout.premiumCenter);
        const totalSourceX = toFlowX(layout.totalCenter);
        const premiumForkY = 44;
        const totalForkY = 48;
        const mergeY = 80;
        const setSplitTrunk = (selector, sourceX, forkY) => {
          const trunk = chart.querySelector(selector);
          if (trunk) trunk.setAttribute("d", `M ${sourceX} 0 V ${forkY}`);
        };
        const setSplitPath = (selector, sourceX, targetX, forkY) => {
          const line = chart.querySelector(selector);
          if (line) line.setAttribute("d", `M ${sourceX} ${forkY} V ${mergeY} H ${targetX} V 100`);
        };
        const setSplitArrow = (selector, targetX) => {
          const arrow = chart.querySelector(selector);
          if (arrow) arrow.setAttribute("d", `M ${targetX - 8} 98 L ${targetX} 118 L ${targetX + 8} 98 Z`);
        };
        setSplitTrunk(".price-split-trunk.premium", premiumSourceX, premiumForkY);
        setSplitTrunk(".price-split-trunk.total", totalSourceX, totalForkY);
        setSplitPath(".price-split-line.platform.premium", premiumSourceX, premiumPlatformX, premiumForkY);
        setSplitPath(".price-split-line.reception.premium", premiumSourceX, premiumReceptionX, premiumForkY);
        setSplitPath(".price-split-line.platform.total", totalSourceX, totalPlatformX, totalForkY);
        setSplitPath(".price-split-line.reception.total", totalSourceX, totalReceptionX, totalForkY);
        setSplitPath(".price-split-line.accounting.total", totalSourceX, totalAccountingX, totalForkY);
        setSplitArrow(".price-split-arrow.platform.premium", premiumPlatformX);
        setSplitArrow(".price-split-arrow.reception.premium", premiumReceptionX);
        setSplitArrow(".price-split-arrow.platform.total", totalPlatformX);
        setSplitArrow(".price-split-arrow.reception.total", totalReceptionX);
        setSplitArrow(".price-split-arrow.accounting.total", totalAccountingX);
        const platformLines = chart.querySelectorAll(".price-flow-line.platform");
        const receptionLines = chart.querySelectorAll(".price-flow-line.reception");
        const accountingLine = chart.querySelector(".price-flow-line.accounting");
        const platformArrow = chart.querySelector(".price-flow-arrow.platform");
        const receptionArrow = chart.querySelector(".price-flow-arrow.reception");
        const accountingArrow = chart.querySelector(".price-flow-arrow.accounting");
        const platformMergeY = 64;
        const receptionMergeY = 88;
        const trunkY = 138;
        if (platformLines[0]) platformLines[0].setAttribute("d", `M ${premiumPlatformX} 0 V ${platformMergeY} H ${resultPlatformX} V ${trunkY}`);
        if (platformLines[1]) platformLines[1].setAttribute("d", `M ${totalPlatformX} 0 V ${platformMergeY} H ${resultPlatformX} V ${trunkY}`);
        if (receptionLines[0]) receptionLines[0].setAttribute("d", `M ${premiumReceptionX} 0 V ${receptionMergeY} H ${resultReceptionX} V ${trunkY}`);
        if (receptionLines[1]) receptionLines[1].setAttribute("d", `M ${totalReceptionX} 0 V ${receptionMergeY} H ${resultReceptionX} V ${trunkY}`);
        if (accountingLine) accountingLine.setAttribute("d", `M ${totalAccountingX} 0 V ${trunkY}`);
        if (platformArrow) platformArrow.setAttribute("d", `M ${resultPlatformX - 12} ${trunkY - 2} L ${resultPlatformX} ${trunkY + 20} L ${resultPlatformX + 12} ${trunkY - 2} Z`);
        if (receptionArrow) receptionArrow.setAttribute("d", `M ${resultReceptionX - 12} ${trunkY - 2} L ${resultReceptionX} ${trunkY + 20} L ${resultReceptionX + 12} ${trunkY - 2} Z`);
        if (accountingArrow) accountingArrow.setAttribute("d", `M ${resultAccountingX - 12} ${trunkY - 2} L ${resultAccountingX} ${trunkY + 20} L ${resultAccountingX + 12} ${trunkY - 2} Z`);
      }
      if (chart) {
        chart.setAttribute(
          "aria-label",
          `当前筛选${sourceRecords.length}条，付款价${formatPriceCompositionValue(split.payment, split.payment)}，溢价${formatPriceCompositionValue(split.premium, split.payment)}，会计价${formatPriceCompositionValue(split.total, split.payment)}，会计结算价${formatPriceCompositionValue(split.settlement, split.payment)}，平台${formatPriceCompositionValue(split.platform, split.payment)}，接待${formatPriceCompositionValue(split.reception, split.payment)}，会计${formatPriceCompositionValue(split.accounting, split.payment)}`,
        );
      }
    }

    function closePriceCompositionModal() {
      if (!priceCompositionModal || !priceCompositionModalCard) return;
      priceCompositionModal.classList.remove("modal-enter");
      priceCompositionModalCard.classList.remove("modal-enter");
      priceCompositionModal.hidden = true;
      syncModalOpenState();
    }

    function openReceptionDetailModal() {
      if (!receptionDetailModal || !receptionDetailModalCard) return;
      renderReceptionDetailModalContent();
      receptionDetailModal.hidden = false;
      receptionDetailModal.classList.remove("modal-enter");
      receptionDetailModalCard.classList.remove("modal-enter");
      void receptionDetailModal.offsetWidth;
      receptionDetailModal.classList.add("modal-enter");
      receptionDetailModalCard.classList.add("modal-enter");
      syncModalOpenState();
    }

    function closeReceptionDetailModal() {
      if (!receptionDetailModal || !receptionDetailModalCard) return;
      receptionDetailModal.classList.remove("modal-enter");
      receptionDetailModalCard.classList.remove("modal-enter");
      receptionDetailModal.hidden = true;
      syncModalOpenState();
    }

    function openAccountantDetailModal() {
      if (!accountantDetailModal || !accountantDetailModalCard) return;
      renderAccountantDetailModalContent();
      accountantDetailModal.hidden = false;
      accountantDetailModal.classList.remove("modal-enter");
      accountantDetailModalCard.classList.remove("modal-enter");
      void accountantDetailModal.offsetWidth;
      accountantDetailModal.classList.add("modal-enter");
      accountantDetailModalCard.classList.add("modal-enter");
      syncModalOpenState();
    }

    function closeAccountantDetailModal() {
      if (!accountantDetailModal || !accountantDetailModalCard) return;
      accountantDetailModal.classList.remove("modal-enter");
      accountantDetailModalCard.classList.remove("modal-enter");
      accountantDetailModal.hidden = true;
      syncModalOpenState();
    }

    function renderAccountantDetailModalContent() {
      if (!accountantDetailMeta || !accountantDetailList) return;
      const sourceRecords = typeof getFilteredRecords === "function" ? getFilteredRecords() : getVisibleRecords();
      const scopedRecords = Array.isArray(sourceRecords) ? sourceRecords : [];
      const accountantMap = new Map();
      let totalSettlement = 0;

      scopedRecords.forEach((record) => {
        const accountantName = normalizeText(record?.accountant, 80) || "未知会计";
        const current = accountantMap.get(accountantName) || {
          name: accountantName,
          orderCount: 0,
          settlementPrice: 0
        };
        const settlementPrice = Number(record?.settlementPrice);
        current.orderCount += 1;
        if (Number.isFinite(settlementPrice)) {
          current.settlementPrice += settlementPrice;
          totalSettlement += settlementPrice;
        }
        accountantMap.set(accountantName, current);
      });

      const accountantList = Array.from(accountantMap.values())
        .sort((left, right) => {
          const amountDiff = Number(right.settlementPrice) - Number(left.settlementPrice);
          if (amountDiff) return amountDiff;
          return String(left.name || "").localeCompare(String(right.name || ""), "zh-CN", {
            numeric: true,
            sensitivity: "base"
          });
        });

      accountantDetailMeta.textContent = accountantList.length
        ? `共 ${accountantList.length} 位会计 / ${scopedRecords.length} 条记录 / 会计结算价合计 ${toMoney(totalSettlement)}`
        : "暂无会计结算数据";
      accountantDetailList.innerHTML = "";

      if (!accountantList.length) {
        const empty = document.createElement("div");
        empty.className = "paid-settlement-detail-empty";
        empty.textContent = "暂无会计结算数据。";
        accountantDetailList.appendChild(empty);
        return;
      }

      const tableWrap = document.createElement("div");
      tableWrap.className = "settlement-detail-table-wrap settlement-detail-table-wrap-paid";

      const table = document.createElement("table");
      table.className = "settlement-detail-table settlement-detail-uploaded-table";

      const colgroup = document.createElement("colgroup");
      ["accountant", "order", "money", "money"].forEach((columnClass) => {
        const col = document.createElement("col");
        col.className = `settlement-detail-col-${columnClass}`;
        colgroup.appendChild(col);
      });
      table.appendChild(colgroup);

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      [
        { label: "会计", summary: `${accountantList.length}位`, align: "accountant" },
        { label: "订单数", summary: `${scopedRecords.length}条`, align: "order" },
        { label: "会计结算价", summary: `合计 ${toMoney(totalSettlement)}`, align: "money" },
        { label: "占比", summary: "", align: "money" }
      ].forEach((column) => {
        const th = document.createElement("th");
        th.scope = "col";
        th.className = `settlement-detail-heading-cell ${column.align}`;

        const label = document.createElement("span");
        label.className = "settlement-detail-sort-label";
        label.textContent = column.label;
        th.appendChild(label);

        const summary = document.createElement("span");
        summary.className = "settlement-detail-sort-summary";
        summary.textContent = column.summary;
        th.appendChild(summary);

        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      accountantList.forEach((item) => {
        const row = document.createElement("tr");
        row.className = "settlement-detail-row tone-payable";

        const nameTd = document.createElement("td");
        nameTd.className = "settlement-detail-accountant-cell settlement-detail-col-accountant";
        const name = document.createElement("strong");
        name.className = "settlement-detail-accountant";
        name.textContent = item.name;
        nameTd.appendChild(name);
        row.appendChild(nameTd);

        const countTd = document.createElement("td");
        countTd.className = "settlement-detail-order-cell settlement-detail-col-order";
        countTd.textContent = `${item.orderCount}单`;
        row.appendChild(countTd);

        const amountTd = document.createElement("td");
        amountTd.className = "settlement-detail-money settlement-detail-col-money";
        amountTd.textContent = toMoney(item.settlementPrice);
        row.appendChild(amountTd);

        const percentTd = document.createElement("td");
        percentTd.className = "settlement-detail-money settlement-detail-col-money";
        const percent = totalSettlement > 0 ? (item.settlementPrice / totalSettlement) * 100 : 0;
        percentTd.textContent = `${percent.toFixed(1)}%`;
        row.appendChild(percentTd);

        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      accountantDetailList.appendChild(tableWrap);
    }

    function getReceptionProfitBreakdown(record) {
      const profit = getProfitParts(record);
      if (!profit) {
        return {
          baseProfit: 0,
          premiumReceptionProfit: 0,
          totalProfit: 0
        };
      }
      const premiumReceptionProfit = Number(profit.premiumProfit);
      return {
        baseProfit: Number.isFinite(profit.baseProfit) ? profit.baseProfit : 0,
        premiumReceptionProfit: Number.isFinite(premiumReceptionProfit) ? premiumReceptionProfit : 0,
        totalProfit: Number.isFinite(profit.totalProfit) ? profit.totalProfit : 0
      };
    }

    function renderReceptionDetailModalContent() {
      if (!receptionDetailMeta || !receptionDetailList) return;
      const sourceRecords = getFilteredRecords();
      const records = Array.isArray(sourceRecords) ? sourceRecords : [];

      let totalBaseProfit = 0;
      let totalPremiumProfit = 0;
      let totalProfit = 0;
      const receptionRecords = [];

      records.forEach((record) => {
        const breakdown = getReceptionProfitBreakdown(record);
        if (breakdown.totalProfit > 0) {
          totalBaseProfit += breakdown.baseProfit;
          totalPremiumProfit += breakdown.premiumReceptionProfit;
          totalProfit += breakdown.totalProfit;
          receptionRecords.push({
            ...record,
            baseProfit: breakdown.baseProfit,
            premiumProfit: breakdown.premiumReceptionProfit,
            totalProfit: breakdown.totalProfit
          });
        }
      });

      receptionDetailMeta.textContent = receptionRecords.length
        ? `共 ${receptionRecords.length} 条记录 / 接待收益合计 ${toMoney(totalProfit)}（基础收益 ${toMoney(totalBaseProfit)} / 溢价收益 ${toMoney(totalPremiumProfit)}）`
        : "暂无接待数据";
      receptionDetailList.innerHTML = "";

      if (!receptionRecords.length) {
        const empty = document.createElement("div");
        empty.className = "paid-settlement-detail-empty";
        empty.textContent = "暂无接待收益数据。";
        receptionDetailList.appendChild(empty);
        return;
      }

      const tableWrap = document.createElement("div");
      tableWrap.className = "settlement-detail-table-wrap settlement-detail-table-wrap-paid";

      const table = document.createElement("table");
      table.className = "settlement-detail-table settlement-detail-uploaded-table";

      const colgroup = document.createElement("colgroup");
      [
        "dispatcher",
        "date",
        "order",
        "accountant",
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
        { label: "接待人", summary: "", align: "dispatcher" },
        { label: "接单日期", summary: "", align: "date" },
        { label: "订单号", summary: "", align: "order" },
        { label: "会计", summary: "", align: "accountant" },
        { label: "基础收益", summary: `合计 ${toMoney(totalBaseProfit)}`, align: "money" },
        { label: "溢价收益", summary: `合计 ${toMoney(totalPremiumProfit)}`, align: "money" },
        { label: "接待收益总计", summary: `合计 ${toMoney(totalProfit)}`, align: "money" }
      ];
      headerColumns.forEach((column) => {
        const th = document.createElement("th");
        th.scope = "col";
        th.className = `settlement-detail-heading-cell ${column.align}`;

        const label = document.createElement("span");
        label.className = "settlement-detail-sort-label";
        label.textContent = column.label;
        th.appendChild(label);

        const summary = document.createElement("span");
        summary.className = "settlement-detail-sort-summary";
        summary.textContent = column.summary;
        th.appendChild(summary);

        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      receptionRecords.forEach((record) => {
        const row = document.createElement("tr");
        row.className = "settlement-detail-row tone-payable";

        const dispatcherTd = document.createElement("td");
        dispatcherTd.className = "settlement-detail-accountant-cell settlement-detail-col-dispatcher";
        const dispatcherName = document.createElement("strong");
        dispatcherName.className = "settlement-detail-accountant";
        dispatcherName.textContent = getDispatcherDisplayNameByTag(record.dispatcher) || record.dispatcher;
        dispatcherTd.appendChild(dispatcherName);
        row.appendChild(dispatcherTd);

        const dateTd = document.createElement("td");
        dateTd.className = "settlement-detail-name-cell settlement-detail-col-date";
        dateTd.textContent = formatDateDisplay(record.date) || "-";
        row.appendChild(dateTd);

        const orderTd = document.createElement("td");
        orderTd.className = "settlement-detail-name-cell settlement-detail-col-order";
        orderTd.textContent = record.orderNo || "-";
        row.appendChild(orderTd);

        const accountantTd = document.createElement("td");
        accountantTd.className = "settlement-detail-name-cell settlement-detail-col-accountant";
        accountantTd.textContent = record.accountant || "-";
        row.appendChild(accountantTd);

        const baseTd = document.createElement("td");
        baseTd.className = "settlement-detail-money settlement-detail-col-money";
        baseTd.textContent = toMoney(record.baseProfit);
        row.appendChild(baseTd);

        const premiumTd = document.createElement("td");
        premiumTd.className = "settlement-detail-money settlement-detail-col-money";
        premiumTd.textContent = toMoney(record.premiumProfit);
        row.appendChild(premiumTd);

        const totalTd = document.createElement("td");
        totalTd.className = "settlement-detail-money settlement-detail-col-money";
        totalTd.textContent = toMoney(record.totalProfit);
        row.appendChild(totalTd);

        tbody.appendChild(row);
      });
      table.appendChild(tbody);

      tableWrap.appendChild(table);
      receptionDetailList.appendChild(tableWrap);
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
      const isBoss = isBossLogin();
      const currentLoginName = String(currentAccount || "").trim();
      return (Array.isArray(reminders) ? reminders : []).filter((item) => {
        if (!isReminderDue(item)) return false;
        if (isBoss) return true;
        return String(item?.createdBy || "").trim() === currentLoginName;
      }).length;
    }

    function updateReminderEntryButton() {
      if (!openReminderModalBtn) return;
      openReminderModalBtn.hidden = true;
      openReminderModalBtn.classList.remove("is-due");
      openReminderModalBtn.textContent = "提醒";
      openReminderModalBtn.removeAttribute("title");
      openReminderModalBtn.removeAttribute("aria-label");
    }

    function getReminderDispatcherKey(reminder) {
      return String(reminder?.createdBy || "").trim();
    }

    function getReminderDispatcherLabel(dispatcherKey) {
      return getDispatcherDisplayNameByTag(dispatcherKey) || String(dispatcherKey || "").trim() || "未标记";
    }

    function getVisibleReminderSource() {
      const isBoss = isBossLogin();
      const currentLoginName = String(currentAccount || "").trim();
      return (Array.isArray(reminders) ? reminders : []).filter((item) => {
        if (isBoss) return true;
        return getReminderDispatcherKey(item) === currentLoginName;
      });
    }

    function renderReminderDispatcherTabs(sourceReminders) {
      if (!reminderTabs) return;
      const source = Array.isArray(sourceReminders) ? sourceReminders : [];
      const counts = new Map();
      source.forEach((item) => {
        const key = getReminderDispatcherKey(item);
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      const dispatcherKeys = Array.from(counts.keys()).sort((left, right) => {
        return getReminderDispatcherLabel(left).localeCompare(getReminderDispatcherLabel(right), "zh-Hans-CN");
      });
      if (activeReminderDispatcherFilter && !counts.has(activeReminderDispatcherFilter)) {
        activeReminderDispatcherFilter = "";
      }
      reminderTabs.innerHTML = "";
      const tabItems = [
        { key: "", label: "全部", count: source.length },
        ...dispatcherKeys.map((key) => ({ key, label: getReminderDispatcherLabel(key), count: counts.get(key) || 0 }))
      ];
      reminderTabs.hidden = tabItems.length <= 1;
      tabItems.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reminder-tab";
        button.dataset.reminderDispatcher = item.key;
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", item.key === activeReminderDispatcherFilter ? "true" : "false");
        button.textContent = `${item.label} ${item.count}`;
        reminderTabs.appendChild(button);
      });
    }

    function renderReminderModalContent() {
      if (!reminderModalMeta || !reminderList || !reminderEmptyState) return;
      const visibleReminders = getVisibleReminderSource();
      renderReminderDispatcherTabs(visibleReminders);
      const filteredReminders = activeReminderDispatcherFilter
        ? visibleReminders.filter((item) => getReminderDispatcherKey(item) === activeReminderDispatcherFilter)
        : visibleReminders;
      const sortedReminders = filteredReminders.sort((left, right) => {
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
        order.textContent = `订单号 ${String(item?.orderNo || "").trim()}`;
        main.appendChild(order);

        const wechat = document.createElement("span");
        wechat.className = "reminder-item-wechat";
        wechat.textContent = `客户微信 ${String(item?.customerWechat || "").trim()}`;
        main.appendChild(wechat);

        const meta = document.createElement("span");
        meta.className = "reminder-item-meta";
        const metaParts = [];
        if (isBossLogin()) {
          const createdBy = getReminderDispatcherKey(item);
          if (createdBy) {
            metaParts.push(`接待: ${getReminderDispatcherLabel(createdBy)}`);
          }
        }
        metaParts.push(formatDateTimeDisplay(item?.createdAt));
        meta.textContent = metaParts.filter(Boolean).join(" · ");
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
      if (reminderForm) reminderForm.reset();
      if (reminderDateInput) reminderDateInput.value = getTodayDateKey();
      activeReminderDispatcherFilter = "";
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
      if (reminderDateInput) reminderDateInput.focus();
    }

    function closeReminderModal() {
      if (!reminderModal || !reminderModalCard) return;
      reminderModal.classList.remove("modal-enter");
      reminderModalCard.classList.remove("modal-enter");
      reminderModal.hidden = true;
      syncModalOpenState();
    }

    reminderTabs?.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-reminder-dispatcher]");
      if (!tab || !reminderTabs.contains(tab)) return;
      activeReminderDispatcherFilter = String(tab.dataset.reminderDispatcher || "").trim();
      renderReminderModalContent();
    });

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

    function attachLinkedDispatcherInvoicePopover(cell, accountantValue, group) {
      const formatFormulaMoney = (value) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return "0";
        return Number(amount.toFixed(2)).toString();
      };
      const formatFormulaPercent = (rate) => `${Number((Number(rate) * 100).toFixed(2))}%`;
      const formatPremiumFormulaSegment = (segment) => {
        const label = String(segment?.formulaLabel || "").trim();
        const prefix = label ? `${label}:` : "";
        return `${prefix}${formatFormulaMoney(segment.amount)}*${formatFormulaPercent(segment.rate)}`;
      };
      const premiumSegments = Array.isArray(group?.dispatcherPremiumSegments)
        ? group.dispatcherPremiumSegments
        : [];
      const commissionTerms = Array.isArray(group?.dispatcherCommissionTerms)
        ? group.dispatcherCommissionTerms
        : [];
      const premiumFormula = premiumSegments.length
        ? premiumSegments.map(formatPremiumFormulaSegment).join("+")
        : "0";
      const commissionFormula = commissionTerms.length
        ? commissionTerms.map((term) => `${formatFormulaMoney(term.amount)}*${formatFormulaPercent(term.rate)}`).join("+")
        : "0";
      const premiumValue = premiumSegments.reduce((sum, segment) => {
        const profit = Number(segment?.profit);
        return Number.isFinite(profit) ? sum + profit : sum;
      }, 0);
      const commissionValue = Number(group?.dispatcherCommissionAmount);
      const rows = [
        ["溢价", `${premiumFormula}=${formatFormulaMoney(premiumValue)};`],
        ["提成", `${commissionFormula}=${formatFormulaMoney(Number.isFinite(commissionValue) ? commissionValue : 0)};`]
      ];
      const popover = document.createElement("span");
      popover.className = "settlement-detail-money-popover";
      popover.setAttribute("aria-hidden", "true");
      rows.forEach(([labelText, value]) => {
        const row = document.createElement("span");
        row.className = "settlement-detail-money-popover-row";

        const label = document.createElement("span");
        label.className = "settlement-detail-money-popover-label";
        label.textContent = `${labelText}：`;
        row.appendChild(label);

        const amount = document.createElement("span");
        amount.className = "settlement-detail-money-popover-value";
        amount.textContent = value;
        row.appendChild(amount);

        popover.appendChild(row);
      });
      cell.appendChild(popover);
    }

    function appendLinkedDispatcherInvoiceFormula(cell, accountantValue, dispatcherValue, totalValue) {
      const fragments = [
        { text: toMoney(accountantValue) },
        { text: " + " },
        { text: toMoney(dispatcherValue), className: "settlement-detail-money-dispatcher-part" },
        { text: " = " },
        { text: toMoney(totalValue) }
      ];
      fragments.forEach((fragment) => {
        const span = document.createElement("span");
        if (fragment.className) span.className = fragment.className;
        span.textContent = fragment.text;
        cell.appendChild(span);
      });
    }

    function createInvoiceUploadAmountPopover(summary) {
      const formatFormulaMoney = (value) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return "0";
        return Number(amount.toFixed(2)).toString();
      };
      const formatFormulaPercent = (rate) => `${Number((Number(rate) * 100).toFixed(2))}%`;
      const formatPremiumFormulaSegment = (segment) => {
        const label = String(segment?.formulaLabel || "").trim();
        const prefix = label ? `${label}:` : "";
        return `${prefix}${formatFormulaMoney(segment.amount)}*${formatFormulaPercent(segment.rate)}`;
      };
      const premiumSegments = Array.isArray(summary?.dispatcherPremiumSegments)
        ? summary.dispatcherPremiumSegments
        : [];
      const commissionTerms = Array.isArray(summary?.dispatcherCommissionTerms)
        ? summary.dispatcherCommissionTerms
        : [];
      const premiumFormula = premiumSegments.length
        ? premiumSegments.map(formatPremiumFormulaSegment).join("+")
        : "0";
      const commissionFormula = commissionTerms.length
        ? commissionTerms.map((term) => `${formatFormulaMoney(term.amount)}*${formatFormulaPercent(term.rate)}`).join("+")
        : "0";
      const rows = [
        ["做单", toMoney(summary?.accountantInvoiceAmount)],
        ["接待提成", `${commissionFormula}=${formatFormulaMoney(summary?.dispatcherCommissionAmount)};`],
        ["接待溢价", `${premiumFormula}=${formatFormulaMoney(summary?.dispatcherPremiumAmount)};`]
      ];
      const popover = document.createElement("span");
      popover.className = "invoice-upload-amount-popover";
      popover.setAttribute("aria-hidden", "true");
      rows.forEach(([labelText, value]) => {
        const row = document.createElement("span");
        row.className = "invoice-upload-amount-popover-row";

        const label = document.createElement("span");
        label.className = "invoice-upload-amount-popover-label";
        label.textContent = `${labelText}：`;
        row.appendChild(label);

        const amount = document.createElement("span");
        amount.className = "invoice-upload-amount-popover-value";
        amount.textContent = value;
        row.appendChild(amount);

        popover.appendChild(row);
      });
      return popover;
    }

    function getUploadedPendingSettlementDetailGroups(sourceRecords = records) {
      const { groups } = getBossSettlementDetailSummary(sourceRecords);
      return getSortedBossSettlementDetailGroups(
        groups.filter((group) => {
          const targets = Array.isArray(group.payoutTargets) ? group.payoutTargets : group.payoutRecordIds;
          return Array.isArray(targets) && targets.length > 0;
        })
      );
    }

    function syncDispatcherSelfViewState() {
      if (!isDispatcherLogin()) return;
      setDispatcherFilterValues([]);
      filterDispatcherPopover.hidden = true;
      if (sortState.key === "dispatcher") {
        sortState.key = "date";
        sortState.direction = "desc";
      }
    }

    function closeAnalysisModal(options = {}) {
      const shouldUpdateRoute = options.updateRoute !== false;
      if (!analysisModal) return;
      closeOperationRecordsModal();
      closePriceCompositionModal();
      closeAnalysisAccountantDetailModal();
      disposeAnalysisTrendChart();
      analysisModal.classList.remove("analysis-page-enter");
      if (analysisModalCard) {
        analysisModalCard.classList.remove("analysis-page-enter");
      }
      analysisModal.hidden = true;
      document.body.classList.remove("analysis-page-active");
      if (shouldUpdateRoute) {
        updateAnalysisPageRoute(false, { replace: true });
      }
      syncModalOpenState();
    }

    function openAnalysisAccountantDetailModal() {
      if (!analysisAccountantDetailModal || !analysisAccountantDetailModalCard) return;
      renderAnalysisAccountantDetailModalContent();
      analysisAccountantDetailModal.hidden = false;
      analysisAccountantDetailModal.classList.remove("modal-enter");
      analysisAccountantDetailModalCard.classList.remove("modal-enter");
      void analysisAccountantDetailModal.offsetWidth;
      analysisAccountantDetailModal.classList.add("modal-enter");
      analysisAccountantDetailModalCard.classList.add("modal-enter");
      syncModalOpenState();
      analysisAccountantDetailModalCard.focus();
    }

    function closeAnalysisAccountantDetailModal() {
      if (!analysisAccountantDetailModal || !analysisAccountantDetailModalCard) return;
      analysisAccountantDetailModal.classList.remove("modal-enter");
      analysisAccountantDetailModalCard.classList.remove("modal-enter");
      analysisAccountantDetailModal.hidden = true;
      syncModalOpenState();
    }

    function closeCustomerFeedbackModal() {
      if (!customerFeedbackModal || !customerFeedbackModalCard || customerFeedbackModal.hidden) return;
      customerFeedbackModal.classList.remove("modal-enter");
      customerFeedbackModalCard.classList.remove("modal-enter");
      customerFeedbackModal.hidden = true;
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
      if (!requireAccount()) return;
      if (isAccountantLogin()) {
        showAppStatus("更新日志仅管理员和接待可用。");
        return;
      }
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
      refundPremiumHint.textContent = `溢价：${premium.toFixed(2)}`;
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
      "settlementInvoiceImage",
      "invoiceUploadedAt",
      "invoiceUploadedBy",
      "invoiceRecipientName",
      "invoiceRecipientBankName",
      "invoiceRecipientBankCardNo",
      "invoiceRecipientIdCardNo",
      "invoiceRecipientDeclarationPhone",
      "date",
      "isMonthlySettlement",
      "monthlySettlementId",
      "monthlySettlementEndDate",
      "monthlySettlementMonthCount",
      "monthlySettlementSequence",
      "monthlySettlementTotalPaymentPrice",
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
      "monthlySettlementId",
      "monthlySettlementEndDate",
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
      settlementInvoiceImage: "发票",
      invoiceUploadedAt: "发票上传时间",
      invoiceUploadedBy: "发票上传人",
      invoiceRecipientName: "姓名",
      invoiceRecipientBankName: "开户行",
      invoiceRecipientBankCardNo: "银行卡号",
      invoiceRecipientIdCardNo: "身份证号",
      invoiceRecipientDeclarationPhone: "申报手机号",
      date: "接单日期",
      isMonthlySettlement: "是否月结",
      monthlySettlementId: "月结ID",
      monthlySettlementEndDate: "月结结束时间",
      monthlySettlementMonthCount: "月结月数",
      monthlySettlementSequence: "月结序号",
      monthlySettlementTotalPaymentPrice: "月结单总付款价",
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
        return getMonthlySettlementTableDisplay(item);
      }
      if (normalizedField === "monthlySettlementEndDate") {
        return getMonthlySettlementEndDate(item);
      }
      if (normalizedField === "monthlySettlementId") {
        return getRecordMonthlySettlement(item).id;
      }
      if (normalizedField === "monthlySettlementMonthCount") {
        return getRecordMonthlySettlement(item).monthCount;
      }
      if (normalizedField === "monthlySettlementSequence") {
        return getRecordMonthlySettlement(item).sequence;
      }
      if (normalizedField === "monthlySettlementTotalPaymentPrice") {
        return getRecordMonthlySettlement(item).totalPaymentPrice;
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
        "monthlySettlementId",
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
      if (["platform", "source", "customer", "orderNo", "dispatcher", "accountant", "date", "monthlySettlementId", "monthlySettlementEndDate", "monthlySettlementTotalPaymentPrice", "invoiceUploadedBy"].includes(normalizedField)) {
        return "136px";
      }
      return "124px";
    }

    function getRecordHistoryValueText(field, value) {
      const normalizedField = String(field || "").trim();
      if (["paymentPrice", "totalPrice", "premiumPrice", "settlementPrice", "monthlySettlementTotalPaymentPrice"].includes(normalizedField)) {
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
      if (normalizedField === "monthlySettlementEndDate") {
        const text = normalizeDateOnlyValue(value);
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

    function setSettlementDetailInvoiceThumbPreviewData(thumb, item, ownerName = "") {
      if (!thumb || !item || typeof item !== "object") return;
      const image = item.image || {};
      thumb.dataset.recordId = String(item.firstRecord?.id || "").trim();
      thumb.dataset.invoiceOwner = String(ownerName || "").trim();
      thumb.dataset.invoiceUploadedAt = String(item.uploadedAt || "").trim();
      thumb.dataset.invoiceUploadedBy = String(item.uploadedBy || "").trim();
      thumb.dataset.invoiceImageId = String(image.id || "").trim();
      thumb.dataset.invoiceImageName = String(image.name || "").trim();
      thumb.dataset.invoiceImageFileName = String(image.fileName || "").trim();
      thumb.dataset.invoiceImageUrl = String(image.url || "").trim();
    }

    function createSettlementDetailInvoiceThumb(item, index, ownerName = "") {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "settlement-detail-invoice-thumb";
      setSettlementDetailInvoiceThumbPreviewData(thumb, item, ownerName);
      thumb.title = `${ownerName} 发票 ${index + 1}，双击放大`;
      thumb.setAttribute("aria-label", `${ownerName} 发票 ${index + 1}，双击放大`);

      const image = document.createElement("img");
      image.src = item.image.url;
      image.alt = item.image.name || "发票图片";
      thumb.appendChild(image);

      return thumb;
    }

    function createSettlementInvoiceReplaceButton(recordIds = []) {
      const normalizedIds = Array.from(
        new Set(
          (Array.isArray(recordIds) ? recordIds : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );
      if (!normalizedIds.length || !canCurrentAccountUploadSettlementInvoice()) return null;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "settlement-detail-invoice-replace-btn";
      button.dataset.invoiceReplaceRecordIds = normalizedIds.join(",");
      button.textContent = "修改";
      button.title = "重新上传发票";
      button.setAttribute("aria-label", "重新上传发票");
      return button;
    }

    function normalizeInvoicePreviewImage(rawImage) {
      if (!rawImage || typeof rawImage !== "object") return null;
      const rawUrl = String(rawImage.url || "").trim();
      const fileName = String(rawImage.fileName || "").trim();
      const url = resolveStoredAssetUrl(
        rawUrl || (fileName ? `/invoice-images/${encodeURIComponent(fileName)}` : "")
      );
      if (!url) return null;
      return {
        id: String(rawImage.id || "").trim(),
        name: String(rawImage.name || "").trim() || fileName || "发票图片",
        fileName,
        url
      };
    }

    function openInvoicePreviewModal(record, previewOptions = {}) {
      if (!invoicePreviewModal || !invoicePreviewModalCard || !invoicePreviewImage || !invoicePreviewMeta) return;
      const previewImage = normalizeInvoicePreviewImage(previewOptions?.image);
      const image = previewImage || getSettlementInvoiceImage(record);
      if (!image) return;
      const usesPreviewImage = Boolean(previewImage);
      const shouldStackOverSettlementDetail = Boolean(
        bossSettlementDetailModal && !bossSettlementDetailModal.hidden
      );
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRecordHistoryModal();
      if (shouldStackOverSettlementDetail) {
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
        String(previewOptions?.ownerName || record?.accountant || "").trim(),
        String(usesPreviewImage ? previewOptions?.uploadedBy : record?.invoiceUploadedBy || "").trim(),
        formatDateTimeDisplay(usesPreviewImage ? previewOptions?.uploadedAt : record?.invoiceUploadedAt)
      ].filter(Boolean);
      invoicePreviewMeta.textContent = metaParts.join(" · ");
      invoicePreviewImage.src = image.url;
      invoicePreviewImage.alt = image.name || "发票图片";
      invoicePreviewModal.hidden = false;
      invoicePreviewModal.classList.remove("modal-enter");
      invoicePreviewModalCard.classList.remove("modal-enter");
      void invoicePreviewModal.offsetWidth;
      invoicePreviewModal.classList.toggle("invoice-preview-stacked", shouldStackOverSettlementDetail);
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
        return;
      }
    }

    function resetInvoiceUploadImageName() {
      if (!invoiceUploadImageName) return;
      const file = accountantInvoiceImageInput?.files && accountantInvoiceImageInput.files[0]
        ? accountantInvoiceImageInput.files[0]
        : null;
      invoiceUploadImageName.textContent = file ? (file.name || "已选择图片") : "选择图片上传发票";
    }

    let invoiceUploadImagePreviewUrl = "";

    function clearInvoiceUploadImagePreview() {
      if (invoiceUploadImagePreviewUrl) {
        URL.revokeObjectURL(invoiceUploadImagePreviewUrl);
        invoiceUploadImagePreviewUrl = "";
      }
      if (invoiceUploadImagePreview) {
        invoiceUploadImagePreview.removeAttribute("src");
        invoiceUploadImagePreview.alt = "已选择的发票图片";
      }
      if (invoiceUploadImagePreviewWrap) {
        invoiceUploadImagePreviewWrap.hidden = true;
      }
    }

    function updateInvoiceUploadImagePreview() {
      clearInvoiceUploadImagePreview();
      const file = accountantInvoiceImageInput?.files && accountantInvoiceImageInput.files[0]
        ? accountantInvoiceImageInput.files[0]
        : null;
      if (!file || !String(file.type || "").toLowerCase().startsWith("image/")) return;
      invoiceUploadImagePreviewUrl = URL.createObjectURL(file);
      if (invoiceUploadImagePreview) {
        invoiceUploadImagePreview.src = invoiceUploadImagePreviewUrl;
        invoiceUploadImagePreview.alt = file.name || "已选择的发票图片";
      }
      if (invoiceUploadImagePreviewWrap) {
        invoiceUploadImagePreviewWrap.hidden = false;
      }
    }

    function getLockedInvoiceRecipientInfoForCurrentAccount() {
      const profile = isAccountantLogin()
        ? getCurrentAccountantLoginProfile()
        : getLinkedAccountantByTag(getCurrentDispatcherTag());
      const info = normalizeInvoiceRecipientInfo(profile?.invoiceRecipientInfo);
      return Object.values(info).every(Boolean) ? info : null;
    }

    function getInvoiceRecipientProfileForCurrentAccount() {
      return isAccountantLogin()
        ? getCurrentAccountantLoginProfile()
        : getLinkedAccountantByTag(getCurrentDispatcherTag());
    }

    function getDefaultInvoiceRecipientInfoForCurrentAccount() {
      const profile = getInvoiceRecipientProfileForCurrentAccount();
      const info = normalizeInvoiceRecipientInfo(profile?.invoiceRecipientInfo);
      return {
        ...info,
        name: info.name
      };
    }

    function syncInvoiceRecipientInfoFields(info) {
      const fields = [
        { element: invoiceRecipientNameInput, value: info?.name || "" },
        { element: invoiceRecipientIdCardInput, value: info?.idCardNo || "" },
        { element: invoiceRecipientBankInput, value: info?.bankName || "" },
        { element: invoiceRecipientBankCardInput, value: info?.bankCardNo || "" },
        { element: invoiceRecipientPhoneInput, value: info?.declarationPhone || "" }
      ];
      fields.forEach(({ element, value }) => {
        if (!element) return;
        element.value = value;
      });
    }

    function setInvoiceRecipientInfoReadonly(isReadonly) {
      const fields = [
        invoiceRecipientNameInput,
        invoiceRecipientIdCardInput,
        invoiceRecipientBankInput,
        invoiceRecipientBankCardInput,
        invoiceRecipientPhoneInput
      ];
      fields.forEach((input) => {
        if (!input) return;
        input.readOnly = Boolean(isReadonly);
        input.disabled = Boolean(isReadonly);
        input.toggleAttribute("readonly", Boolean(isReadonly));
        input.toggleAttribute("disabled", Boolean(isReadonly));
        input.setAttribute("aria-readonly", String(Boolean(isReadonly)));
      });
      if (invoiceRecipientInfoSubmitBtn) {
        invoiceRecipientInfoSubmitBtn.hidden = Boolean(isReadonly);
      }
      if (invoiceRecipientInfoCancelBtn) {
        invoiceRecipientInfoCancelBtn.textContent = isReadonly ? "关闭" : "取消";
      }
      invoiceRecipientInfoForm?.classList.toggle("readonly", Boolean(isReadonly));
    }

    function openInvoiceRecipientInfoModal() {
      if (!invoiceRecipientInfoModal || !invoiceRecipientInfoModalCard || !invoiceRecipientInfoForm) return;
      if (!canCurrentAccountManageInvoiceRecipientInfo()) return;
      const lockedInfo = getLockedInvoiceRecipientInfoForCurrentAccount();
      const profileInfo = getDefaultInvoiceRecipientInfoForCurrentAccount();
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRefundModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeDevTodoModal();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      invoiceRecipientInfoForm.reset();
      syncInvoiceRecipientInfoFields(lockedInfo || profileInfo);
      setInvoiceRecipientInfoReadonly(Boolean(lockedInfo));
      resetInlineFormState(invoiceRecipientInfoForm, setInvoiceRecipientInfoHint);
      invoiceRecipientInfoModal.hidden = false;
      invoiceRecipientInfoModal.classList.remove("modal-enter");
      invoiceRecipientInfoModalCard.classList.remove("modal-enter");
      void invoiceRecipientInfoModal.offsetWidth;
      invoiceRecipientInfoModal.classList.add("modal-enter");
      invoiceRecipientInfoModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (lockedInfo) {
        invoiceRecipientInfoCancelBtn?.focus();
      } else {
        invoiceRecipientNameInput?.focus();
      }
    }

    function closeInvoiceRecipientInfoModal() {
      if (!invoiceRecipientInfoModal || !invoiceRecipientInfoForm) return;
      invoiceRecipientInfoModal.classList.remove("modal-enter");
      if (invoiceRecipientInfoModalCard) invoiceRecipientInfoModalCard.classList.remove("modal-enter");
      invoiceRecipientInfoModal.hidden = true;
      invoiceRecipientInfoForm.reset();
      setInvoiceRecipientInfoReadonly(false);
      resetInlineFormState(invoiceRecipientInfoForm, setInvoiceRecipientInfoHint);
      syncModalOpenState();
    }

    function maybeShowMissingInvoiceRecipientInfoModal() {
      if (!canCurrentAccountManageInvoiceRecipientInfo()) return false;
      if (getLockedInvoiceRecipientInfoForCurrentAccount()) return false;
      if (invoiceRecipientInfoModal && !invoiceRecipientInfoModal.hidden) return true;
      if (invoiceUploadModal && !invoiceUploadModal.hidden) return false;
      if (invoicePreviewModal && !invoicePreviewModal.hidden) return false;
      if (bossSettlementDetailModal && !bossSettlementDetailModal.hidden) return false;
      openInvoiceRecipientInfoModal();
      return true;
    }

    async function requireInvoiceRecipientInfoBeforeUpload() {
      if (getLockedInvoiceRecipientInfoForCurrentAccount()) return true;
      if (!canCurrentAccountManageInvoiceRecipientInfo()) {
        return false;
      }
      const confirmed = await openConfirmDialog({
        title: "录入结算申报信息",
        message: "请录入结算申报信息后再上传发票。",
        confirmText: "确认",
        cancelText: "取消",
        tone: "primary"
      });
      if (confirmed) {
        openInvoiceRecipientInfoModal();
      }
      return false;
    }

    function setInvoiceUploadReplaceRecordIds(recordIds = []) {
      invoiceUploadReplaceRecordIds = Array.from(
        new Set(
          (Array.isArray(recordIds) ? recordIds : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );
    }

    function clearInvoiceUploadReplaceMode() {
      setInvoiceUploadReplaceRecordIds([]);
    }

    function getInvoiceUploadReplaceRecords(sourceRecords = records) {
      const replaceIdSet = new Set(invoiceUploadReplaceRecordIds);
      if (!replaceIdSet.size) return [];
      return (Array.isArray(sourceRecords) ? sourceRecords : []).filter((record) => (
        replaceIdSet.has(String(record?.id || "").trim())
      ));
    }

    async function openInvoiceUploadModal(options = {}) {
      if (!invoiceUploadModal || !invoiceUploadModalCard || !invoiceUploadForm) return;
      if (!canCurrentAccountUploadSettlementInvoice()) return;
      if (!(await requireInvoiceRecipientInfoBeforeUpload())) return;
      const replaceRecordIds = Array.isArray(options?.replaceRecordIds) ? options.replaceRecordIds : [];
      setInvoiceUploadReplaceRecordIds(replaceRecordIds);
      const isReplaceMode = invoiceUploadReplaceRecordIds.length > 0;
      const replaceRecords = isReplaceMode ? getInvoiceUploadReplaceRecords(records) : [];
      const summary = isReplaceMode ? null : getAccountantInvoiceUploadSummary(records);
      if (isReplaceMode && !replaceRecords.length) {
        clearInvoiceUploadReplaceMode();
        showAppStatus("当前发票记录已刷新，请重新打开明细。", "error");
        return;
      }
      if (!isReplaceMode && !Number(summary.uploadableCount || 0)) {
        clearInvoiceUploadReplaceMode();
        updateAccountantInvoiceUploadControls();
        return;
      }
      closeAllFilterPopovers();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRefundModal();
      closeRecordHistoryModal();
      closeBossSettlementSummaryModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      closeInvoiceRecipientInfoModal();
      closeDevTodoModal();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
      invoiceUploadForm.reset();
      resetInvoiceUploadImageName();
      clearInvoiceUploadImagePreview();
      resetInlineFormState(invoiceUploadForm, setInvoiceUploadFormHint);
      if (invoiceUploadModal) {
        invoiceUploadModal.classList.toggle("is-replace-mode", isReplaceMode);
      }
      const titleNode = invoiceUploadModalCard.querySelector(".return-price-title");
      if (titleNode) {
        titleNode.textContent = isReplaceMode ? "修改发票" : "上传发票";
      }
      if (invoiceUploadSubmitBtn) {
        invoiceUploadSubmitBtn.textContent = isReplaceMode ? "确认修改" : "确认上传";
      }
      if (invoiceUploadImageName) {
        invoiceUploadImageName.textContent = isReplaceMode ? "选择新图片重新上传" : "选择图片上传发票";
      }
      if (invoiceUploadModalMeta) {
        invoiceUploadModalMeta.innerHTML = "";
        const countItem = isReplaceMode
          ? { label: "修改范围", value: `${replaceRecords.length}`, unit: "条" }
          : { label: "待上传订单", value: `${summary.count || summary.uploadableCount || 0}`, unit: "条" };
        const moneyItems = isReplaceMode
          ? [{ label: "操作类型", value: "重新上传", tone: "amount" }]
          : [
              { label: "开票金额", value: toMoney(summary.invoiceAmount), tone: "amount" },
              { label: "个税", value: toMoney(summary.taxAmount), tone: "tax" },
              { label: "应打款", value: toMoney(summary.payableAmount), tone: "payable" }
            ];
        const appendMetaItem = (item, parentNode) => {
          const itemNode = document.createElement("span");
          itemNode.className = item.tone
            ? `invoice-upload-meta-item is-${item.tone}`
            : "invoice-upload-meta-item";
          const labelNode = document.createElement("span");
          labelNode.className = "invoice-upload-meta-label";
          labelNode.textContent = item.label;
          const valueNode = document.createElement("strong");
          valueNode.className = "invoice-upload-meta-value";
          valueNode.textContent = item.value;
          itemNode.appendChild(labelNode);
          itemNode.appendChild(valueNode);
          if (item.unit) {
            const unitNode = document.createElement("span");
            unitNode.className = "invoice-upload-meta-unit";
            unitNode.textContent = item.unit;
            itemNode.appendChild(unitNode);
          }
          parentNode.appendChild(itemNode);
        };
        appendMetaItem(countItem, invoiceUploadModalMeta);
        const moneyGroupNode = document.createElement("span");
        moneyGroupNode.className = "invoice-upload-meta-money-group";
        moneyItems.forEach((item) => appendMetaItem(item, moneyGroupNode));
        invoiceUploadModalMeta.appendChild(moneyGroupNode);
      }
      invoiceUploadModal.hidden = false;
      invoiceUploadModal.classList.remove("modal-enter");
      invoiceUploadModalCard.classList.remove("modal-enter");
      void invoiceUploadModal.offsetWidth;
      invoiceUploadModal.classList.add("modal-enter");
      invoiceUploadModalCard.classList.add("modal-enter");
      syncModalOpenState();
      accountantInvoiceImageInput?.focus();
    }

    function closeInvoiceUploadModal() {
      if (!invoiceUploadModal || !invoiceUploadForm) return;
      invoiceUploadModal.classList.remove("modal-enter");
      if (invoiceUploadModalCard) invoiceUploadModalCard.classList.remove("modal-enter");
      invoiceUploadModal.hidden = true;
      invoiceUploadForm.reset();
      resetInvoiceUploadImageName();
      clearInvoiceUploadImagePreview();
      if (invoiceUploadModalMeta) invoiceUploadModalMeta.textContent = "";
      if (invoiceUploadModal) invoiceUploadModal.classList.remove("is-replace-mode");
      if (invoiceUploadSubmitBtn) invoiceUploadSubmitBtn.textContent = "确认上传";
      if (invoiceUploadImageName) invoiceUploadImageName.textContent = "选择图片上传发票";
      clearInvoiceUploadReplaceMode();
      resetInlineFormState(invoiceUploadForm, setInvoiceUploadFormHint);
      syncModalOpenState();
    }

    async function maybeShowInvoiceUploadReminder() {
      if (!canCurrentAccountUploadSettlementInvoice()) {
        return;
      }
      if (maybeShowMissingInvoiceRecipientInfoModal()) {
        return;
      }
      if (invoiceUploadModal && !invoiceUploadModal.hidden) return;
      const summary = getAccountantInvoiceUploadSummary(records);
      if (!Number(summary.uploadableCount || 0)) {
        return;
      }
      await openInvoiceUploadModal();
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
      bossSettlementSummaryAmount.textContent = `${toMoney(totalSettlement)}`;
      bossSettlementSummaryTax.textContent = `${toMoney(settlementTax)}`;
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
          bossSettlementBtn.textContent = "核对用户确认";
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
          bossSettlementBtn.textContent = "核对用户确认";
        } else if (readyCount === count) {
          bossSettlementBtn.textContent = `核对用户确认（${count}）`;
        } else {
          bossSettlementBtn.textContent = `核对用户确认（${readyCount}/${count}）`;
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

      const recordCount = Number(group.recordCount) || 0;
      const pendingCount = Number(group.pendingCount) || 0;
      const uploadedCount = Number(group.uploadedCount) || 0;
      const paidCount = Number(group.paidCount) || 0;

      if (recordCount > 0 && paidCount >= recordCount) return "paid";
      if (pendingCount > 0) return "pending";
      if (uploadedCount > 0 && paidCount >= uploadedCount) return "paid";
      if (Array.isArray(group.payoutTargets) && group.payoutTargets.length > 0) return "payable";
      if (Array.isArray(group.payoutRecordIds) && group.payoutRecordIds.length > 0) return "payable";
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
        if (Array.isArray(group.payoutTargets)) return group.payoutTargets.length;
        if (Array.isArray(group.payoutRecordIds)) return group.payoutRecordIds.length;
        return Number(group.paidCount) || 0;
      }
      if (key === "accountant") return String(group.accountant || "").trim();
      return "";
    }

    function getBossSettlementDetailSpecialAccountantRank(group) {
      const index = BUILT_IN_ACCOUNTANT_NAMES.indexOf(String(group?.accountant || "").trim());
      if (index >= 0) return index;
      return group?.hasLinkedDispatcher || isAccountantLinkedToDispatcher(group?.accountant)
        ? BUILT_IN_ACCOUNTANT_NAMES.length
        : BUILT_IN_ACCOUNTANT_NAMES.length + 1;
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
      return [...source].sort((left, right) => {
        const specialRankDiff =
          getBossSettlementDetailSpecialAccountantRank(left) -
          getBossSettlementDetailSpecialAccountantRank(right);
        if (specialRankDiff !== 0) return specialRankDiff;
        return compareBossSettlementDetailGroups(left, right, sortKey) * direction;
      });
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

    function getBossSettlementDetailPayoutStatusKeys(group) {
      if (!group || typeof group !== "object") return ["pending_invoice"];
      const keys = [];
      const payoutTargets = Array.isArray(group.payoutTargets) ? group.payoutTargets : group.payoutRecordIds;
      const revokeTargets = Array.isArray(group.revokeTargets) ? group.revokeTargets : [];
      const pendingInvoiceCount = Object.prototype.hasOwnProperty.call(group, "pendingInvoiceCount")
        ? Number(group.pendingInvoiceCount)
        : Number(group.pendingCount);
      if (pendingInvoiceCount > 0) keys.push("pending_invoice");
      if (Array.isArray(payoutTargets) && payoutTargets.length > 0) keys.push("payable");
      if (
        revokeTargets.length > 0 ||
        (Number(group.recordCount) > 0 && Number(group.paidCount) >= Number(group.recordCount))
      ) {
        keys.push("paid");
      }
      return keys.length ? Array.from(new Set(keys)) : ["pending_invoice"];
    }

    function getBossSettlementDetailPayoutStatusKey(group) {
      if (!group || typeof group !== "object") return "pending_invoice";
      const statusKeys = getBossSettlementDetailPayoutStatusKeys(group);
      const payoutTargets = Array.isArray(group.payoutTargets) ? group.payoutTargets : group.payoutRecordIds;
      if (Array.isArray(payoutTargets) && payoutTargets.length > 0) return "payable";
      if (statusKeys.includes("paid")) return "paid";
      return statusKeys[0] || "pending_invoice";
    }

    function getBossSettlementDetailPayoutStatusLabel(statusKey, group = null) {
      const labelMap = {
        pending_invoice: "待上传",
        payable: "待结算",
        paid: "已结算"
      };
      const statusKeys = group && typeof group === "object"
        ? getBossSettlementDetailPayoutStatusKeys(group)
        : [statusKey];
      const labels = statusKeys
        .map((key) => labelMap[key] || "")
        .filter(Boolean);
      if (labels.length > 1) return labels.join(" / ");
      if (statusKey === "paid") return "已结算";
      if (statusKey === "payable") return "待结算";
      return "待上传";
    }

    function setBossSettlementDetailPayoutStatusFilter(statusKey) {
      bossSettlementDetailPayoutStatusFilter = String(statusKey || "").trim();
      renderBossSettlementDetailModalContent();
    }

    function hasCompleteInvoiceRecipientInfoForAccountant(accountantName) {
      const profile = getAccountantProfileByLoginName(accountantName);
      const recipientInfo = normalizeInvoiceRecipientInfo(profile?.invoiceRecipientInfo);
      return Object.values(recipientInfo).every(Boolean);
    }

    function getBossSettlementDetailDisplayName(accountantName) {
      return getAccountantSettlementNameByLoginName(accountantName) || "-";
    }

    function appendBossSettlementDetailAccountantName(accountantTd, group) {
      const accountantName = document.createElement("strong");
      accountantName.className = "settlement-detail-accountant";
      accountantName.classList.toggle(
        "missing-recipient-info",
        !hasCompleteInvoiceRecipientInfoForAccountant(group.accountant)
      );
      accountantName.textContent = group.accountant;
      accountantTd.appendChild(accountantName);

      const realName = document.createElement("span");
      realName.className = "settlement-detail-accountant-real-name";
      realName.textContent = getBossSettlementDetailDisplayName(group.accountant);
      accountantTd.appendChild(realName);

      if (isBuiltInAccountantName(group.accountant)) {
        const specialBadge = document.createElement("span");
        specialBadge.className = "settlement-detail-special-accountant-badge";
        specialBadge.textContent = "特殊结算";
        accountantTd.appendChild(specialBadge);
      }
    }

    function getBossSettlementDetailOrderParts(group) {
      const total = Number(group?.recordCount) || 0;
      const dispatcher = Math.max(0, Number(group?.dispatcherRecordCount) || 0);
      const own = Math.max(0, total - dispatcher);
      return { own, dispatcher, total };
    }

    function getBossSettlementDetailOrderLabel(group) {
      const { own, dispatcher, total } = getBossSettlementDetailOrderParts(group);
      if (group?.hasLinkedDispatcher) return `${own}+${dispatcher}=${total}`;
      return `${total}单`;
    }

    function createBossSettlementDetailOrderCell(group) {
      const orderTd = document.createElement("td");
      orderTd.className = "settlement-detail-order-cell settlement-detail-col-order";
      if (group?.hasLinkedDispatcher) {
        const { own, dispatcher, total } = getBossSettlementDetailOrderParts(group);
        [
          { text: String(own) },
          { text: "+" },
          { text: String(dispatcher), className: "settlement-detail-order-dispatcher-part" },
          { text: "=" },
          { text: String(total) }
        ].forEach((fragment) => {
          const span = document.createElement("span");
          if (fragment.className) span.className = fragment.className;
          span.textContent = fragment.text;
          orderTd.appendChild(span);
        });
      } else {
        orderTd.textContent = getBossSettlementDetailOrderLabel(group);
      }
      return orderTd;
    }

    function getBossSettlementDetailGroupTotals(groups) {
      const source = Array.isArray(groups) ? groups : [];
      return {
        accountantCount: source.length,
        recordCount: source.reduce((sum, item) => sum + (Number(item.recordCount) || 0), 0),
        totalInvoiceAmount: source.reduce((sum, item) => sum + (Number(item.invoiceAmount) || 0), 0),
        accountantTaxAmount: source.reduce((sum, item) => sum + (Number(item.accountantTaxAmount) || 0), 0),
        dispatcherTaxAmount: source.reduce((sum, item) => sum + (Number(item.dispatcherTaxAmount) || 0), 0),
        totalTaxAmount: source.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0),
        accountantPayableAmount: source.reduce((sum, item) => sum + (Number(item.accountantPayableAmount) || 0), 0),
        dispatcherPayableAmount: source.reduce((sum, item) => sum + (Number(item.dispatcherPayableAmount) || 0), 0),
        totalPayableAmount: source.reduce((sum, item) => sum + (Number(item.payableAmount) || 0), 0),
        uploadedAccountantCount: source.filter((item) => Number(item.uploadedCount) > 0).length,
        pendingAccountantCount: source.filter((item) => Number(item.uploadedCount) <= 0).length,
        uploadedRecordCount: source.reduce((sum, item) => sum + (Number(item.uploadedCount) || 0), 0),
        paidRecordCount: source.reduce((sum, item) => sum + (Number(item.paidCount) || 0), 0),
        payoutRecordCount: source.reduce((sum, item) => {
          const targets = Array.isArray(item.payoutTargets) ? item.payoutTargets : item.payoutRecordIds;
          return sum + (Array.isArray(targets) ? targets.length : 0);
        }, 0)
      };
    }

    function getBossSettlementDetailMonthKeys(sourceRecords = records) {
      const keys = new Set();
      getBossSettlementDetailRecords(sourceRecords).forEach((record) => {
        const accountantMonthKey = getBossSettlementTargetMonthKey(record, "accountant");
        const dispatcherMonthKey = getBossSettlementTargetMonthKey(record, "dispatcher");
        if (accountantMonthKey) keys.add(accountantMonthKey);
        if (dispatcherMonthKey) keys.add(dispatcherMonthKey);
      });
      return Array.from(keys).sort((left, right) => String(right).localeCompare(String(left)));
    }

    function getBossSettlementDetailMonthOptions(sourceRecords = records) {
      return getBossSettlementDetailMonthKeys(sourceRecords)
        .map((monthKey) => {
          const summary = getBossSettlementDetailSummary(sourceRecords, { monthKey });
          return {
            key: monthKey,
            label: formatSettlementMonthLabel(monthKey),
            shortLabel: formatSettlementMonthLabel(monthKey, { short: true }),
            accountantCount: summary.accountantCount,
            recordCount: summary.recordCount,
            pendingRecordCount: summary.pendingRecordCount,
            uploadedRecordCount: summary.uploadedRecordCount,
            payoutRecordCount: summary.payoutRecordCount,
            paidRecordCount: summary.paidRecordCount
          };
        })
        .filter((item) => item.recordCount > 0 || item.accountantCount > 0);
    }

    function resolveBossSettlementDetailMonthKey(sourceRecords = records, options = {}) {
      const monthOptions = getBossSettlementDetailMonthOptions(sourceRecords);
      const currentMonthKey = getCurrentSettlementMonthKey();
      const preferredMonthKey = normalizeSettlementMonthKey(options.preferredMonthKey);
      const activeMonthKey = normalizeSettlementMonthKey(bossSettlementDetailMonthKey);
      const availableKeys = new Set(monthOptions.map((item) => item.key));

      if (preferredMonthKey && availableKeys.has(preferredMonthKey)) {
        bossSettlementDetailMonthKey = preferredMonthKey;
        return bossSettlementDetailMonthKey;
      }
      if (!activeMonthKey && availableKeys.has(currentMonthKey)) {
        bossSettlementDetailMonthKey = currentMonthKey;
        return bossSettlementDetailMonthKey;
      }
      if (activeMonthKey && availableKeys.has(activeMonthKey)) {
        bossSettlementDetailMonthKey = activeMonthKey;
        return bossSettlementDetailMonthKey;
      }
      bossSettlementDetailMonthKey = monthOptions[0]?.key || currentMonthKey;
      return bossSettlementDetailMonthKey;
    }

    function initializeBossSettlementDetailMonthKey(sourceRecords = records) {
      bossSettlementDetailMonthKey = "";
      return resolveBossSettlementDetailMonthKey(sourceRecords, {
        preferredMonthKey: getCurrentSettlementMonthKey()
      });
    }

    function renderBossSettlementDetailMonthTabs(monthOptions, activeMonthKey) {
      if (!bossSettlementDetailMonthTabs) return;
      bossSettlementDetailMonthTabs.innerHTML = "";
      const options = Array.isArray(monthOptions) ? monthOptions : [];
      bossSettlementDetailMonthTabs.hidden = options.length === 0;
      if (!options.length) return;

      options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "settlement-detail-month-tab-btn";
        button.dataset.settlementDetailMonthKey = option.key;
        button.setAttribute("aria-pressed", option.key === activeMonthKey ? "true" : "false");
        button.title = `${option.label}，${option.recordCount}单`;

        const label = document.createElement("span");
        label.className = "settlement-detail-month-label";
        label.textContent = option.shortLabel || option.label;
        button.appendChild(label);

        const meta = document.createElement("span");
        meta.className = "settlement-detail-month-meta";
        meta.textContent = `${option.accountantCount}位`;
        button.appendChild(meta);

        bossSettlementDetailMonthTabs.appendChild(button);
      });
    }

    function setBossSettlementDetailMonthKey(monthKey) {
      const normalizedMonthKey = normalizeSettlementMonthKey(monthKey);
      if (!normalizedMonthKey || normalizedMonthKey === bossSettlementDetailMonthKey) return;
      bossSettlementDetailMonthKey = normalizedMonthKey;
      clearBossSettlementPayoutSelection();
      renderBossSettlementDetailModalContent();
    }

    function formatBossSettlementDetailMonthMeta(summary, monthKey) {
      const totals = getBossSettlementDetailGroupTotals(summary?.groups || []);
      const label = formatSettlementMonthLabel(monthKey) || "当前月份";
      const payoutGroupCount = getBossSettlementPayoutGroupCount(summary?.groups || []);
      return `${label} · 待上传 ${summary?.pendingRecordCount || 0}单 / 待结算 ${payoutGroupCount}位 / 已结算 ${totals.paidRecordCount || 0}单`;
    }

    function getSelectedBossSettlementPayoutPayableAmount(groups, selectedTargetSet) {
      const source = Array.isArray(groups) ? groups : [];
      if (!(selectedTargetSet instanceof Set) || selectedTargetSet.size === 0) return 0;

      return source.reduce((sum, group) => {
        const targets = Array.isArray(group.payoutTargets) ? group.payoutTargets : group.payoutRecordIds;
        if (!Array.isArray(targets) || targets.length === 0) return sum;

        const selectedCount = targets.filter((target) => selectedTargetSet.has(target)).length;
        if (selectedCount === 0) return sum;

        const payableAmount = Object.prototype.hasOwnProperty.call(group, "payoutPayableAmount")
          ? (Number(group.payoutPayableAmount) || 0)
          : (Number(group.payableAmount) || 0);
        if (selectedCount >= targets.length) return sum + payableAmount;

        return sum + (payableAmount * selectedCount / targets.length);
      }, 0);
    }

    function getBossSettlementPayoutGroupCount(groups, targetSet = null) {
      const source = Array.isArray(groups) ? groups : [];
      return source.filter((group) => {
        const targets = Array.isArray(group.payoutTargets) ? group.payoutTargets : group.payoutRecordIds;
        if (!Array.isArray(targets) || targets.length === 0) return false;
        if (!(targetSet instanceof Set)) return true;
        return targets.some((target) => targetSet.has(target));
      }).length;
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

    function getBossSettlementPayoutRevokeConfirmGroups(recordIds) {
      const targetIds = new Set(
        (Array.isArray(recordIds) ? recordIds : [])
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      );
      const { paidGroups } = getBossSettlementDetailSummary();
      return getSortedBossSettlementDetailGroups(paidGroups)
        .filter((group) => {
          const targets = Array.isArray(group.revokeTargets) ? group.revokeTargets : group.recordIds;
          return Array.isArray(targets) && targets.some((recordId) => targetIds.has(String(recordId || "").trim()));
        });
    }

    function createBossSettlementPayoutRevokeConfirmTable(recordIds) {
      const matchedGroups = getBossSettlementPayoutRevokeConfirmGroups(recordIds);
      if (!matchedGroups.length) return null;

      const tableWrap = document.createElement("div");
      tableWrap.className = "settlement-detail-table-wrap settlement-detail-table-wrap-paid confirm-modal-revoke-table-wrap";

      const table = document.createElement("table");
      table.className = "settlement-detail-table settlement-detail-paid-table confirm-modal-revoke-table";

      const colgroup = document.createElement("colgroup");
      [
        ["accountant", "16%"],
        ["order", "10%"],
        ["money", "14%"],
        ["money", "13%"],
        ["money", "15%"],
        ["invoice", "150px"],
        ["payout", "150px"]
      ].forEach(([columnClass, width]) => {
        const col = document.createElement("col");
        col.className = `settlement-detail-col-${columnClass}`;
        col.style.width = width;
        colgroup.appendChild(col);
      });
      table.appendChild(colgroup);

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      [
        { label: "会计", align: "accountant" },
        { label: "订单", align: "order" },
        { label: "开票金额", align: "money" },
        { label: "个税", align: "money" },
        { label: "应打款金额", align: "money" },
        { label: "上传的发票", align: "invoice" },
        { label: "打款状态", align: "payout" }
      ].forEach((column) => {
        const th = document.createElement("th");
        th.scope = "col";
        th.className = `settlement-detail-heading-cell ${column.align}`;
        th.textContent = column.label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const createPaidMoneyCell = (group, amountType) => {
        const td = document.createElement("td");
        td.className = "settlement-detail-money settlement-detail-col-money";

        if (amountType === "invoiceAmount") {
          const totalValue = group.invoiceAmount;
          const accountantValue = group.accountantInvoiceAmount;
          const dispatcherValue = group.dispatcherInvoiceAmount;

          if (group.hasLinkedDispatcher) {
            td.classList.add("settlement-detail-money-formula");
            appendLinkedDispatcherInvoiceFormula(td, accountantValue, dispatcherValue, totalValue);
            td.tabIndex = 0;
            attachLinkedDispatcherInvoicePopover(td, accountantValue, group);
          } else {
            td.textContent = `${toMoney(totalValue)}`;
          }
        } else {
          const totalValue = amountType === "taxAmount" ? group.taxAmount : group.payableAmount;
          td.textContent = `${toMoney(totalValue)}`;
        }

        return td;
      };

      const tbody = document.createElement("tbody");
      matchedGroups.forEach((group) => {
        const row = document.createElement("tr");
        row.className = `settlement-detail-row ${group.statusKey} tone-paid`;

        const accountantTd = document.createElement("td");
        accountantTd.className = "settlement-detail-accountant-cell settlement-detail-col-accountant";
        appendBossSettlementDetailAccountantName(accountantTd, group);
        if (group.hasLinkedDispatcher) {
          const dispatcherBadge = document.createElement("span");
          dispatcherBadge.className = "settlement-detail-dispatcher-badge";
          const tags = group.linkedDispatcherTags || [];
          dispatcherBadge.textContent = tags.length > 0 ? tags.join("/") : "";
          accountantTd.appendChild(dispatcherBadge);
        }
        row.appendChild(accountantTd);

        row.appendChild(createBossSettlementDetailOrderCell(group));
        row.appendChild(createPaidMoneyCell(group, "invoiceAmount"));
        row.appendChild(createPaidMoneyCell(group, "taxAmount"));
        row.appendChild(createPaidMoneyCell(group, "payableAmount"));

        const invoiceTd = document.createElement("td");
        invoiceTd.className = "settlement-detail-invoice-cell settlement-detail-col-invoice";
        if (group.uploadedInvoices.length) {
          const invoiceList = document.createElement("div");
          invoiceList.className = "settlement-detail-invoice-list";
          const invoiceItem = group.uploadedInvoices[0];
          invoiceList.appendChild(createSettlementDetailInvoiceThumb(invoiceItem, 0, group.accountant));
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
        payoutState.textContent = paidDate ? `已结算 ${paidDate}` : "已结算";
        const paidTooltip = getSettlementPaidTimeTooltip(group);
        if (paidTooltip) {
          payoutState.title = paidTooltip;
        }
        payoutTd.appendChild(payoutState);
        row.appendChild(payoutTd);

        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      return tableWrap;
    }

    function getBossSettlementPayoutRevokeConfirmMessage(recordIds) {
      const targetCount = (Array.isArray(recordIds) ? recordIds : [])
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .length;
      return `确认撤销 ${targetCount} 条数据的打款状态和打款记录？`;
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
      if (!normalizedAccountant || !record || typeof record !== "object") return false;
      const uploadedByUsername = String(record?.invoiceUploadedByUsername || "").trim();
      const uploadedDispatcherTag = normalizeDispatcherTag(uploadedByUsername);
      if (!uploadedDispatcherTag) return false;
      const linkedAccountant = getLinkedAccountantDisplayNameByTag(uploadedDispatcherTag);
      return Boolean(linkedAccountant && linkedAccountant === normalizedAccountant);
    }

    function isInvoiceUploadedByAccountant(record, accountantName) {
      const identities = getAccountantUploadIdentitySet(accountantName);
      if (!identities.size) return false;

      const uploadedBy = String(record?.invoiceUploadedBy || "").trim();
      const uploadedByUsername = String(record?.invoiceUploadedByUsername || "").trim();
      return identities.has(uploadedBy)
        || identities.has(uploadedByUsername)
        || isInvoiceUploadedByLinkedDispatcher(record, accountantName);
    }

    function getBossSettlementDetailSummary(sourceRecords = records, options = {}) {
      const monthKey = normalizeSettlementMonthKey(options?.monthKey);
      const detailRecords = getBossSettlementDetailRecords(sourceRecords);
      const groupMap = new Map();
      let latestSettledAt = "";
      let latestSettledAtTime = 0;

      const createGroup = (accountant, options = {}) => ({
        accountant,
        recordIds: [],
        recordCount: 0,
        pendingCount: 0,
        pendingInvoiceCount: 0,
        uploadedCount: 0,
        paidCount: 0,
        payoutRecordIds: [],
        payoutTargets: [],
        revokeTargets: [],
        paidAtValues: [],
        latestPaidAt: "",
        latestPaidAtTime: 0,
        invoiceAmount: 0,
        payoutInvoiceAmount: 0,
        paidInvoiceAmount: 0,
        isLinkedDispatcherOnly: Boolean(options.isLinkedDispatcherOnly),
        latestUploadedAt: "",
        latestUploadedBy: "",
        invoiceMap: new Map()
      });

      const getOrCreateGroup = (accountant, options = {}) => {
        const normalizedAccountant = String(accountant || "").trim() || "未分配会计";
        const existing = groupMap.get(normalizedAccountant);
        if (existing) return existing;
        const nextGroup = createGroup(normalizedAccountant, options);
        groupMap.set(normalizedAccountant, nextGroup);
        return nextGroup;
      };

      const addPaidAtValue = (group, paidAt, paidAtTime) => {
        const source = String(paidAt || "").trim();
        if (!source) return;
        const normalizedPaidAtTime = Number.isNaN(paidAtTime) ? 0 : paidAtTime;
        group.paidAtValues.push(source);
        if (!group.latestPaidAt || normalizedPaidAtTime >= group.latestPaidAtTime) {
          group.latestPaidAt = source;
          group.latestPaidAtTime = normalizedPaidAtTime;
        }
      };

      detailRecords.forEach((record) => {
        if (!isBossSettlementTargetInMonth(record, "accountant", monthKey)) return;
        const accountant = String(record?.accountant || "").trim() || "未分配会计";
        const settlement = Number(record?.settlementPrice);
        const settledAt = String(record?.settledAt || "").trim();
        const settledAtTime = parseDateTimeValue(settledAt);
        const uploadedAt = String(record?.invoiceUploadedAt || "").trim();
        const uploadedAtTime = parseDateTimeValue(uploadedAt);
        const uploadedBy = String(record?.invoiceUploadedBy || record?.invoiceUploadedByUsername || "").trim();
        const isUploaded = isRecordInvoiceUploaded(record) && isInvoiceUploadedByAccountant(record, accountant);
        const isInvoiceOptionalForPayout = isRecordInvoiceOptionalForPayout(record);
        const invoiceImage = getSettlementInvoiceImage(record);
        const isPaid = isRecordSettlementPaid(record);
        const paidAt = String(record?.settlementPaidAt || "").trim();
        const paidAtTime = parseDateTimeValue(paidAt);
        const recordId = String(record?.id || "").trim();
        const current = getOrCreateGroup(accountant);

        if (recordId && !current.recordIds.includes(recordId)) {
          current.recordIds.push(recordId);
        }
        current.recordCount += 1;
        if (Number.isFinite(settlement)) {
          current.invoiceAmount += settlement;
        }

        if (isUploaded) {
          current.uploadedCount += 1;
          const currentUploadedAtTime = parseDateTimeValue(current.latestUploadedAt);
          if (!current.latestUploadedAt || uploadedAtTime >= currentUploadedAtTime) {
            current.latestUploadedAt = uploadedAt;
            current.latestUploadedBy = uploadedBy;
          }
          if (invoiceImage && isInvoiceUploadedByAccountant(record, accountant)) {
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
          if (!isInvoiceOptionalForPayout) {
            current.pendingInvoiceCount += 1;
          }
        }

        if (isPaid) {
          current.paidCount += 1;
          if (Number.isFinite(settlement)) {
            current.paidInvoiceAmount += settlement;
          }
          if (recordId) {
            current.revokeTargets.push(recordId);
          }
          addPaidAtValue(current, paidAt, paidAtTime);
        } else if ((isUploaded || isInvoiceOptionalForPayout) && recordId) {
          current.payoutRecordIds.push(recordId);
          current.payoutTargets.push(recordId);
          if (Number.isFinite(settlement)) {
            current.payoutInvoiceAmount += settlement;
          }
        }

        if (settledAt && settledAtTime >= latestSettledAtTime) {
          latestSettledAt = settledAt;
          latestSettledAtTime = settledAtTime;
        }
      });

      const detailDispatchers = new Set(
        detailRecords
          .filter((record) => isBossSettlementTargetInMonth(record, "dispatcher", monthKey))
          .map((record) => normalizeDispatcherTag(record?.dispatcher))
          .filter(Boolean)
      );
      Object.entries(dispatcherAccountantMappings || {}).forEach(([tag, phone]) => {
        const normalizedTag = normalizeDispatcherTag(tag);
        if (!detailDispatchers.has(normalizedTag)) return;
        const accountant = getAccountantByPhone(phone);
        const accountantName = accountant?.displayName || accountant?.name || accountant?.username;
        if (!accountantName || groupMap.has(accountantName)) return;
        const linkedDispatcherAmount = getLinkedDispatcherSettlementAmount(accountantName, sourceRecords, {
          monthKey
        });
        if (linkedDispatcherAmount && linkedDispatcherAmount.recordCount > 0) {
          groupMap.set(accountantName, createGroup(accountantName, { isLinkedDispatcherOnly: true }));
        }
      });

      const buildGroups = (sourceMap) => Array.from(sourceMap.values())
        .map((group) => {
          const linkedDispatcherAmount = getLinkedDispatcherSettlementAmount(group.accountant, sourceRecords, {
            monthKey
          });

          const accountantInvoiceAmount = group.invoiceAmount;
          const accountantTaxAmount = getSettlementTaxAmount(accountantInvoiceAmount);
          const accountantPayableAmount = accountantInvoiceAmount - accountantTaxAmount;

          const dispatcherInvoiceAmount = Number(linkedDispatcherAmount?.invoiceAmount) || 0;
          const dispatcherTaxAmount = Number(linkedDispatcherAmount?.taxAmount) || 0;
          const dispatcherPayableAmount = Number(linkedDispatcherAmount?.payableAmount) || 0;
          const dispatcherRecordCount = Number(linkedDispatcherAmount?.recordCount) || 0;
          const dispatcherPremiumAmount = Number(linkedDispatcherAmount?.premium) || 0;
          const dispatcherCommissionAmount = Number(linkedDispatcherAmount?.dispatcherPrice) || 0;
          const dispatcherPremiumSegments = linkedDispatcherAmount?.premiumBreakdown?.segments || [];
          const dispatcherCommissionTerms = linkedDispatcherAmount?.dispatcherCommissionTerms || [];
          const linkedPaidDispatcherAmount = getLinkedDispatcherSettlementAmount(group.accountant, sourceRecords, {
            paid: true,
            monthKey
          });
          const accountantPaidInvoiceAmount = Number(group.paidInvoiceAmount) || 0;
          const accountantPaidTaxAmount = getSettlementTaxAmount(accountantPaidInvoiceAmount);
          const accountantPaidPayableAmount = accountantPaidInvoiceAmount - accountantPaidTaxAmount;
          const accountantPaidRecordCount = Number(group.paidCount) || 0;
          const dispatcherPaidInvoiceAmount = Number(linkedPaidDispatcherAmount?.invoiceAmount) || 0;
          const dispatcherPaidTaxAmount = Number(linkedPaidDispatcherAmount?.taxAmount) || 0;
          const dispatcherPaidPayableAmount = Number(linkedPaidDispatcherAmount?.payableAmount) || 0;
          const dispatcherPaidRecordCount = Number(linkedPaidDispatcherAmount?.recordCount) || 0;
          const paidInvoiceAmount = accountantPaidInvoiceAmount + dispatcherPaidInvoiceAmount;
          const paidTaxAmount = getSettlementTaxAmount(paidInvoiceAmount);
          const paidPayableAmount = paidInvoiceAmount - paidTaxAmount;
          const hasLinkedDispatcher = isAccountantLinkedToDispatcher(group.accountant);
          const linkedDispatcherTags = getDispatcherTagsLinkedToAccountant(group.accountant);

          const totalInvoiceAmount = accountantInvoiceAmount + dispatcherInvoiceAmount;
          const totalTaxAmount = getSettlementTaxAmount(totalInvoiceAmount);
          const totalPayableAmount = totalInvoiceAmount - totalTaxAmount;
          const combinedRecordIds = Array.from(new Set([
            ...group.recordIds,
            ...(linkedDispatcherAmount?.recordIds || [])
          ]));
          const combinedRecordCount = combinedRecordIds.length;
          const combinedPendingCount = group.pendingCount + (Number(linkedDispatcherAmount?.pendingCount) || 0);
          const combinedPendingInvoiceCount = group.pendingInvoiceCount + (Number(linkedDispatcherAmount?.pendingInvoiceCount) || 0);
          const combinedUploadedCount = group.uploadedCount + (Number(linkedDispatcherAmount?.uploadedCount) || 0);
          const combinedPaidCount = group.paidCount + (Number(linkedDispatcherAmount?.paidCount) || 0);
          const combinedPayoutRecordIds = Array.from(new Set([
            ...group.payoutRecordIds,
            ...(linkedDispatcherAmount?.payoutRecordIds || [])
          ]));
          const combinedPayoutTargets = Array.from(new Set([
            ...group.payoutTargets,
            ...(linkedDispatcherAmount?.payoutTargets || [])
          ]));
          const combinedRevokeTargets = Array.from(new Set([
            ...group.revokeTargets,
            ...(linkedDispatcherAmount?.revokeTargets || [])
          ]));
          const combinedInvoiceMap = new Map(group.invoiceMap);
          if (linkedDispatcherAmount?.invoiceMap) {
            linkedDispatcherAmount.invoiceMap.forEach((item, key) => {
              combinedInvoiceMap.set(key, item);
            });
          }
          const combinedUploadedInvoices = Array.from(combinedInvoiceMap.values()).sort((left, right) => {
            const timeDiff = parseDateTimeValue(right.uploadedAt) - parseDateTimeValue(left.uploadedAt);
            if (timeDiff) return timeDiff;
            return String(left.image?.name || "").localeCompare(String(right.image?.name || ""), "zh-CN", {
              numeric: true,
              sensitivity: "base"
            });
          });
          const combinedLatestUploadedAt = linkedDispatcherAmount?.latestUploadedAt
            && parseDateTimeValue(linkedDispatcherAmount.latestUploadedAt) >= parseDateTimeValue(group.latestUploadedAt)
              ? linkedDispatcherAmount.latestUploadedAt
              : group.latestUploadedAt;
          const combinedLatestUploadedBy = combinedLatestUploadedAt === linkedDispatcherAmount?.latestUploadedAt
            ? linkedDispatcherAmount.latestUploadedBy
            : group.latestUploadedBy;
          const linkedLatestPaidAt = String(linkedDispatcherAmount?.latestPaidAt || "").trim();
          const linkedLatestPaidAtTime = Number(linkedDispatcherAmount?.latestPaidAtTime) || parseDateTimeValue(linkedLatestPaidAt);
          const useLinkedLatestPaidAt = linkedLatestPaidAt
            && (!group.latestPaidAt || linkedLatestPaidAtTime >= group.latestPaidAtTime);
          const combinedLatestPaidAt = useLinkedLatestPaidAt ? linkedLatestPaidAt : group.latestPaidAt;
          const combinedLatestPaidAtTime = useLinkedLatestPaidAt ? linkedLatestPaidAtTime : group.latestPaidAtTime;
          const combinedPaidAtValues = Array.from(new Set([
            ...group.paidAtValues,
            ...(linkedDispatcherAmount?.paidAtValues || [])
          ]));
          const combinedStatusKey = getBossSettlementDetailStatusKey(combinedRecordCount, combinedUploadedCount);
          const payoutInvoiceAmount =
            (Number(group.payoutInvoiceAmount) || 0) +
            (Number(linkedDispatcherAmount?.payoutInvoiceAmount) || 0);
          const payoutTaxAmount = getSettlementTaxAmount(payoutInvoiceAmount);
          const payoutPayableAmount = payoutInvoiceAmount - payoutTaxAmount;
          const rowToneKeySource = {
            recordCount: combinedRecordCount,
            pendingCount: combinedPendingCount,
            uploadedCount: combinedUploadedCount,
            paidCount: combinedPaidCount,
            payoutRecordIds: combinedPayoutRecordIds,
            payoutTargets: combinedPayoutTargets
          };

          return {
            accountant: group.accountant,
            recordIds: combinedRecordIds,
            recordCount: combinedRecordCount,
            pendingCount: combinedPendingCount,
            pendingInvoiceCount: combinedPendingInvoiceCount,
            uploadedCount: combinedUploadedCount,
            paidCount: combinedPaidCount,
            payoutRecordIds: combinedPayoutRecordIds,
            payoutTargets: combinedPayoutTargets,
            revokeTargets: combinedRevokeTargets,
            paidAtValues: combinedPaidAtValues,
            latestPaidAt: combinedLatestPaidAt,
            latestPaidAtTime: combinedLatestPaidAtTime,

            accountantInvoiceAmount,
            accountantTaxAmount,
            accountantPayableAmount,

            hasLinkedDispatcher,
            linkedDispatcherTags,
            dispatcherInvoiceAmount,
            dispatcherTaxAmount,
            dispatcherPayableAmount,
            dispatcherRecordCount,
            dispatcherPremiumAmount,
            dispatcherCommissionAmount,
            dispatcherPremiumSegments,
            dispatcherCommissionTerms,

            invoiceAmount: totalInvoiceAmount,
            taxAmount: totalTaxAmount,
            payableAmount: totalPayableAmount,
            payoutInvoiceAmount,
            payoutTaxAmount,
            payoutPayableAmount,
            accountantPaidInvoiceAmount,
            accountantPaidTaxAmount,
            accountantPaidPayableAmount,
            accountantPaidRecordCount,
            dispatcherPaidInvoiceAmount,
            dispatcherPaidTaxAmount,
            dispatcherPaidPayableAmount,
            dispatcherPaidRecordCount,
            paidInvoiceAmount,
            paidTaxAmount,
            paidPayableAmount,

            latestUploadedAt: combinedLatestUploadedAt,
            latestUploadedBy: combinedLatestUploadedBy,
            uploadedInvoices: combinedUploadedInvoices,
            statusKey: combinedStatusKey,
            rowToneKey: getBossSettlementDetailRowToneKey(rowToneKeySource),
            statusLabel: formatBossSettlementDetailStatusLabel(combinedStatusKey),
            isLinkedDispatcherOnly: Boolean(group.isLinkedDispatcherOnly)
          };
        });
      const groups = buildGroups(groupMap);
      const paidGroups = groups
        .filter((item) => {
          const targets = Array.isArray(item.revokeTargets) ? item.revokeTargets : [];
          return targets.length > 0;
        })
        .map((item) => {
          const paidRecordCount =
            (Number(item.accountantPaidRecordCount) || 0) +
            (Number(item.dispatcherPaidRecordCount) || 0);
          return {
            ...item,
            recordCount: paidRecordCount,
            pendingCount: 0,
            pendingInvoiceCount: 0,
            uploadedCount: paidRecordCount,
            paidCount: paidRecordCount,
            payoutRecordIds: [],
            payoutTargets: [],
            accountantInvoiceAmount: Number(item.accountantPaidInvoiceAmount) || 0,
            accountantTaxAmount: Number(item.accountantPaidTaxAmount) || 0,
            accountantPayableAmount: Number(item.accountantPaidPayableAmount) || 0,
            dispatcherInvoiceAmount: Number(item.dispatcherPaidInvoiceAmount) || 0,
            dispatcherTaxAmount: Number(item.dispatcherPaidTaxAmount) || 0,
            dispatcherPayableAmount: Number(item.dispatcherPaidPayableAmount) || 0,
            dispatcherRecordCount: Number(item.dispatcherPaidRecordCount) || 0,
            invoiceAmount: Number(item.paidInvoiceAmount) || 0,
            taxAmount: Number(item.paidTaxAmount) || 0,
            payableAmount: Number(item.paidPayableAmount) || 0,
            statusKey: "uploaded",
            rowToneKey: "paid",
            statusLabel: formatBossSettlementDetailStatusLabel("uploaded")
          };
        });

      const uploadedAccountantCount = groups.filter((item) => item.uploadedCount > 0).length;
      const partialAccountantCount = groups.filter((item) => item.statusKey === "partial").length;
      const pendingAccountantCount = groups.filter((item) => item.uploadedCount <= 0).length;
      const uploadedRecordCount = groups.reduce((sum, item) => sum + item.uploadedCount, 0);
      const pendingRecordCount = groups.reduce((sum, item) => sum + item.pendingCount, 0);
      const paidRecordCount = groups.reduce((sum, item) => sum + item.paidCount, 0);
      const payoutRecordCount = groups.reduce((sum, item) => {
        const targets = Array.isArray(item.payoutTargets) ? item.payoutTargets : item.payoutRecordIds;
        return sum + (Array.isArray(targets) ? targets.length : 0);
      }, 0);
      const totalInvoiceAmount = groups.reduce((sum, item) => sum + item.invoiceAmount, 0);
      const totalTaxAmount = groups.reduce((sum, item) => sum + item.taxAmount, 0);
      const totalPayableAmount = groups.reduce((sum, item) => sum + item.payableAmount, 0);
      const scopedDetailRecordIds = new Set(
        groups.flatMap((item) => Array.isArray(item.recordIds) ? item.recordIds : [])
      );
      const scopedDetailRecords = detailRecords.filter((item) => {
        const recordId = String(item?.id || "").trim();
        return recordId && scopedDetailRecordIds.has(recordId);
      });

      return {
        detailRecords: scopedDetailRecords,
        groups,
        paidGroups,
        recordCount: scopedDetailRecordIds.size,
        accountantCount: groups.length,
        totalInvoiceAmount,
        totalTaxAmount,
        totalPayableAmount,
        latestSettledAt,
        uploadedAccountantCount,
        partialAccountantCount,
        pendingAccountantCount,
        pendingRecordCount,
        uploadedRecordCount,
        paidRecordCount,
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

      const monthOptions = getBossSettlementDetailMonthOptions(records);
      const activeMonthKey = resolveBossSettlementDetailMonthKey(records);
      renderBossSettlementDetailMonthTabs(monthOptions, activeMonthKey);

      if (settlementDetailActiveTab === "dispatcher") {
        const dispatcherSummary = getDispatcherSettlementSummary(records, { monthKey: activeMonthKey });
        bossSettlementDetailTitleCount.textContent = formatSettlementMonthLabel(activeMonthKey, { short: true });
        bossSettlementDetailTitleCount.hidden = false;
        bossSettlementDetailMeta.textContent = `${formatSettlementMonthLabel(activeMonthKey)} · 接待 ${dispatcherSummary.dispatcherCount}位 / ${dispatcherSummary.recordCount || 0}单`;
        renderDispatcherSettlementDetail(activeMonthKey);
        return;
      }

      const summary = getBossSettlementDetailSummary(records, { monthKey: activeMonthKey });
      const {
        groups,
        payoutRecordCount: rawPayoutRecordCount
      } = summary;
      bossSettlementDetailTitleCount.textContent = formatSettlementMonthLabel(activeMonthKey, { short: true });
      bossSettlementDetailTitleCount.hidden = false;
      bossSettlementDetailMeta.textContent = formatBossSettlementDetailMonthMeta(summary, activeMonthKey);
      syncBossSettlementPayoutSelection(records);
      const allDetailGroups = groups.map((group) => {
        const payoutStatusKey = getBossSettlementDetailPayoutStatusKey(group);
        const payoutStatusKeys = getBossSettlementDetailPayoutStatusKeys(group);
        return {
          ...group,
          payoutStatusKeys,
          payoutStatusKey,
          payoutStatusLabel: getBossSettlementDetailPayoutStatusLabel(payoutStatusKey, group)
        };
      });
      const payoutStatusFilter = String(bossSettlementDetailPayoutStatusFilter || "").trim();
      const visibleGroups = payoutStatusFilter
        ? allDetailGroups.filter((group) => {
            const keys = Array.isArray(group.payoutStatusKeys) ? group.payoutStatusKeys : [group.payoutStatusKey];
            return keys.includes(payoutStatusFilter);
          })
        : allDetailGroups;
      const sortedGroups = getSortedBossSettlementDetailGroups(visibleGroups);
      const activeTableTotals = getBossSettlementDetailGroupTotals(sortedGroups);
      const canPayoutSettlementRecords = canCurrentAccountPayoutSettlementRecords();
      const allPayoutTargets = Array.from(
        new Set(groups.flatMap((group) => {
          if (Array.isArray(group.payoutTargets)) return group.payoutTargets;
          return Array.isArray(group.payoutRecordIds) ? group.payoutRecordIds : [];
        }))
      );
      getSelectedBossSettlementPayoutRecordIds()
        .filter((target) => !allPayoutTargets.includes(target))
        .forEach((target) => setBossSettlementPayoutRecordSelected(target, false));
      const selectedPayoutTargets = getSelectedBossSettlementPayoutRecordIds()
        .filter((target) => allPayoutTargets.includes(target));
      const selectedPayoutRecordIdSet = new Set(selectedPayoutTargets);
      const payoutRecordCount = allPayoutTargets.length;
      const payoutGroupCount = getBossSettlementPayoutGroupCount(sortedGroups);
      const selectedPayoutGroupCount = getBossSettlementPayoutGroupCount(sortedGroups, selectedPayoutRecordIdSet);
      const areAllPayoutRecordsSelected = allPayoutTargets.length > 0
        && allPayoutTargets.every((target) => selectedPayoutRecordIdSet.has(target));

      if (!allDetailGroups.length) {
        const empty = document.createElement("div");
        empty.className = "settlement-detail-empty";
        empty.textContent = "暂无结算明细。";
        bossSettlementDetailList.appendChild(empty);
        return;
      }

      const section = document.createElement("section");
      section.className = "settlement-detail-section";

      const tableWrap = document.createElement("div");
      tableWrap.className = "settlement-detail-table-wrap";

      if (canPayoutSettlementRecords && (payoutRecordCount > 0 || rawPayoutRecordCount > 0)) {
        const payoutToolbar = document.createElement("div");
        payoutToolbar.className = "settlement-detail-payout-toolbar";

        const payoutToolbarText = document.createElement("span");
        payoutToolbarText.className = "settlement-detail-payout-toolbar-text";
        payoutToolbarText.textContent = selectedPayoutTargets.length > 0
          ? `已选 ${selectedPayoutGroupCount}位`
          : `可结算 ${payoutGroupCount}位`;
        payoutToolbar.appendChild(payoutToolbarText);

        const payoutSelectAllBtn = document.createElement("button");
        payoutSelectAllBtn.type = "button";
        payoutSelectAllBtn.className = "settlement-detail-payout-select-all-btn";
        payoutSelectAllBtn.dataset.settlementPayoutSelectAll = "true";
        payoutSelectAllBtn.dataset.recordIds = allPayoutTargets.join(",");
        payoutSelectAllBtn.disabled = isBossSettlementPayoutSubmitting || allPayoutTargets.length === 0;
        payoutSelectAllBtn.setAttribute("aria-pressed", areAllPayoutRecordsSelected ? "true" : "false");
        payoutSelectAllBtn.textContent = areAllPayoutRecordsSelected ? "取消全选" : "全选";
        payoutToolbar.appendChild(payoutSelectAllBtn);

        const payoutToolbarBtn = document.createElement("button");
        payoutToolbarBtn.type = "button";
        payoutToolbarBtn.className = "settlement-detail-payout-batch-btn";
        payoutToolbarBtn.dataset.settlementPayoutSelected = "true";
        payoutToolbarBtn.disabled = selectedPayoutTargets.length === 0 || isBossSettlementPayoutSubmitting;
        payoutToolbarBtn.textContent = isBossSettlementPayoutSubmitting
          ? "结算中"
          : (selectedPayoutTargets.length > 0 ? `批量结算（${selectedPayoutTargets.length}）` : "批量结算");
        payoutToolbar.appendChild(payoutToolbarBtn);

        const exportBtn = document.createElement("button");
        exportBtn.type = "button";
        exportBtn.className = "btn-secondary table-export-btn settlement-detail-payout-export-btn";
        exportBtn.dataset.settlementPayoutExport = "true";
        exportBtn.textContent = "导出";
        payoutToolbar.appendChild(exportBtn);

        section.appendChild(payoutToolbar);
      }

      const table = document.createElement("table");
      table.className = "settlement-detail-table";

      const colgroup = document.createElement("colgroup");
      [
        "accountant",
        "order",
        "money",
        "money",
        "money",
        "invoice",
        "payout",
        "action"
      ].forEach((columnClass) => {
        const col = document.createElement("col");
        col.className = `settlement-detail-col-${columnClass}`;
        colgroup.appendChild(col);
      });
      table.appendChild(colgroup);

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      const headerColumns = [
        { key: "accountant", label: "会计", summary: `${activeTableTotals.accountantCount}位`, align: "accountant" },
        { key: "orderCount", label: "订单", summary: formatSettlementHeaderOrderCount(sortedGroups), align: "order" },
        { key: "invoiceAmount", label: "开票金额", summary: `合计 ${toMoney(activeTableTotals.totalInvoiceAmount)}`, align: "money" },
        { key: "taxAmount", label: "个税", summary: `合计 ${toMoney(activeTableTotals.totalTaxAmount)}`, align: "money" },
        { key: "payableAmount", label: "应打款金额", summary: `合计 ${toMoney(activeTableTotals.totalPayableAmount)}`, align: "money" },
        { key: "invoiceCount", label: "上传的发票", summary: `${activeTableTotals.uploadedAccountantCount}人已上传 / ${activeTableTotals.pendingAccountantCount}人未上传`, align: "invoice" },
        { key: "payout", label: "打款状态", align: "payout", hideSummary: true, filterable: true },
        { key: "action", label: "操作", align: "action", hideSummary: true }
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
        if (column.filterable) {
          const filterWrap = document.createElement("div");
          filterWrap.className = "settlement-detail-status-filter";

          [
            { key: "", label: "全部" },
            { key: "pending_invoice", label: "待上传" },
            { key: "payable", label: "待结算" },
            { key: "paid", label: "已结算" }
          ].forEach((option) => {
            const optionBtn = document.createElement("button");
            optionBtn.type = "button";
            optionBtn.className = "settlement-detail-status-filter-btn";
            optionBtn.dataset.detailPayoutStatusFilter = option.key;
            optionBtn.textContent = option.label;
            optionBtn.setAttribute("aria-pressed", payoutStatusFilter === option.key ? "true" : "false");
            filterWrap.appendChild(optionBtn);
          });

          th.appendChild(filterWrap);
        }
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      if (!sortedGroups.length) {
        const row = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = headerColumns.length;
        td.className = "settlement-detail-empty-cell";
        td.textContent = "当前筛选下暂无结算明细。";
        row.appendChild(td);
        tbody.appendChild(row);
      }
      const createMoneyCell = (group, amountType) => {
        const td = document.createElement("td");
        td.className = "settlement-detail-money settlement-detail-col-money";

        if (amountType === "invoiceAmount") {
          const totalValue = group.invoiceAmount;
          const accountantValue = group.accountantInvoiceAmount;
          const dispatcherValue = group.dispatcherInvoiceAmount;

          if (group.hasLinkedDispatcher) {
            td.classList.add("settlement-detail-money-formula");
            appendLinkedDispatcherInvoiceFormula(td, accountantValue, dispatcherValue, totalValue);
            td.tabIndex = 0;
            attachLinkedDispatcherInvoicePopover(td, accountantValue, group);
          } else {
            td.textContent = `${toMoney(totalValue)}`;
          }
        } else {
          const totalValue = amountType === "taxAmount" ? group.taxAmount : group.payableAmount;
          td.textContent = `${toMoney(totalValue)}`;
        }

        return td;
      };

      sortedGroups.forEach((group) => {
        const row = document.createElement("tr");
        row.className = `settlement-detail-row ${group.statusKey} tone-${group.rowToneKey} payout-${group.payoutStatusKey}`;
        if (isBuiltInAccountantName(group.accountant)) {
          row.classList.add("special-accountant");
        }

        const accountantTd = document.createElement("td");
        accountantTd.className = "settlement-detail-accountant-cell settlement-detail-col-accountant";

        appendBossSettlementDetailAccountantName(accountantTd, group);

        if (group.hasLinkedDispatcher) {
          const dispatcherBadge = document.createElement("span");
          dispatcherBadge.className = "settlement-detail-dispatcher-badge";
          const tags = group.linkedDispatcherTags || [];
          dispatcherBadge.textContent = tags.length > 0 ? tags.join("/") : "";
          accountantTd.appendChild(dispatcherBadge);
        }

        row.appendChild(accountantTd);
        row.appendChild(createBossSettlementDetailOrderCell(group));
        row.appendChild(createMoneyCell(group, "invoiceAmount"));
        row.appendChild(createMoneyCell(group, "taxAmount"));
        row.appendChild(createMoneyCell(group, "payableAmount"));

        const invoiceTd = document.createElement("td");
        invoiceTd.className = "settlement-detail-invoice-cell settlement-detail-col-invoice";

        if (group.uploadedInvoices.length) {
          const invoiceList = document.createElement("div");
          invoiceList.className = "settlement-detail-invoice-list";
          const invoiceItem = group.uploadedInvoices[0];
          invoiceList.appendChild(createSettlementDetailInvoiceThumb(invoiceItem, 0, group.accountant));
          const replaceBtn = createSettlementInvoiceReplaceButton(invoiceItem.recordIds || group.recordIds);
          if (replaceBtn) invoiceList.appendChild(replaceBtn);
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

        const groupPayoutRecordIds = Array.isArray(group.payoutTargets) ? group.payoutTargets : group.payoutRecordIds;
        const groupRevokeTargets = Array.isArray(group.revokeTargets) ? group.revokeTargets : [];

        const payoutState = document.createElement("span");
        payoutState.className = `settlement-detail-payout-state ${group.payoutStatusKey}`;
        const paidDate = formatSettlementPaidDateDisplay(group.latestPaidAt);
        payoutState.textContent = group.payoutStatusKeys?.length === 1 && group.payoutStatusKey === "paid" && paidDate
          ? `已结算 ${paidDate}`
          : group.payoutStatusLabel;
        const paidTooltip = (Array.isArray(group.payoutStatusKeys) ? group.payoutStatusKeys : [group.payoutStatusKey]).includes("paid")
          ? getSettlementPaidTimeTooltip(group)
          : "";
        if (paidTooltip) {
          payoutState.title = paidTooltip;
        }
        payoutTd.appendChild(payoutState);
        row.appendChild(payoutTd);

        const actionTd = document.createElement("td");
        actionTd.className = "settlement-detail-action-cell settlement-detail-col-action";

        if (canPayoutSettlementRecords && (groupPayoutRecordIds.length > 0 || groupRevokeTargets.length > 0)) {
          const actionWrap = document.createElement("div");
          actionWrap.className = "settlement-detail-payout-actions";

          if (groupPayoutRecordIds.length > 0) {
            const payoutSelectLabel = document.createElement("label");
            payoutSelectLabel.className = "settlement-detail-payout-select";

            const payoutCheckbox = document.createElement("input");
            payoutCheckbox.type = "checkbox";
            payoutCheckbox.className = "settlement-detail-payout-checkbox";
            payoutCheckbox.dataset.recordIds = groupPayoutRecordIds.join(",");
            payoutCheckbox.checked = groupPayoutRecordIds.every((recordId) => selectedPayoutRecordIdSet.has(recordId));
            payoutCheckbox.disabled = isBossSettlementPayoutSubmitting;
            payoutSelectLabel.appendChild(payoutCheckbox);

            const payoutSelectText = document.createElement("span");
            payoutSelectText.textContent = "选择";
            payoutSelectLabel.appendChild(payoutSelectText);
            actionWrap.appendChild(payoutSelectLabel);

            const payoutBtn = document.createElement("button");
            payoutBtn.type = "button";
            payoutBtn.className = "settlement-detail-payout-btn";
            payoutBtn.dataset.recordIds = groupPayoutRecordIds.join(",");
            payoutBtn.disabled = isBossSettlementPayoutSubmitting;
            payoutBtn.textContent = isBossSettlementPayoutSubmitting ? "结算中" : "结算";
            actionWrap.appendChild(payoutBtn);
          }

          if (groupRevokeTargets.length > 0) {
            const revokeBtn = document.createElement("button");
            revokeBtn.type = "button";
            revokeBtn.className = "settlement-detail-payout-revoke-btn";
            revokeBtn.dataset.recordIds = groupRevokeTargets.join(",");
            revokeBtn.dataset.tableTooltip = `撤销 ${groupRevokeTargets.length} 条打款状态和打款记录`;
            revokeBtn.dataset.tableTooltipMode = "always";
            revokeBtn.dataset.tableTooltipVariant = "compact";
            revokeBtn.disabled = isBossSettlementPayoutSubmitting;
            revokeBtn.textContent = isBossSettlementPayoutSubmitting ? "处理中" : "撤销";
            revokeBtn.setAttribute("aria-label", revokeBtn.dataset.tableTooltip || "撤销打款");
            actionWrap.appendChild(revokeBtn);
          }

          actionTd.appendChild(actionWrap);
        }

        row.appendChild(actionTd);
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      tableWrap.appendChild(table);
      section.appendChild(tableWrap);
      bossSettlementDetailList.appendChild(section);
    }

    function renderDispatcherSettlementDetail(monthKey = bossSettlementDetailMonthKey) {
      const {
        groups,
        recordCount,
        dispatcherCount,
        totalPremium,
        totalDispatcherPrice,
        totalInvoiceAmount,
        totalTaxAmount,
        totalPayableAmount
      } = getDispatcherSettlementSummary(records, { monthKey });

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
        { key: "premium", label: "溢价收益", summary: `合计 ${toMoney(totalPremium)}`, align: "money" },
        { key: "dispatcherPrice", label: "接待价", summary: `合计 ${toMoney(totalDispatcherPrice)}`, align: "money" },
        { key: "invoiceAmount", label: "开票金额", summary: `合计 ${toMoney(totalInvoiceAmount)}`, align: "money" },
        { key: "taxAmount", label: "个税", summary: `合计 ${toMoney(totalTaxAmount)}`, align: "money" },
        { key: "payableAmount", label: "应打款金额", summary: `合计 ${toMoney(totalPayableAmount)}`, align: "money" }
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
        td.textContent = `${toMoney(value)}`;
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
      bossSettlementDetailBtn.textContent = accountantCount > 0 ? `结算（${accountantCount}）` : "结算";
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

    function updateAccountantUploadedSettlementDetailControls() {
      if (!accountantUploadedSettlementDetailBtn) return;
      const isAccountant = isAccountantLogin();
      const uploadedGroups = isAccountant ? getUploadedPendingSettlementDetailGroups(getVisibleRecords()) : [];
      const uploadedTotals = getBossSettlementDetailGroupTotals(uploadedGroups);
      const uploadSummary = isAccountant ? getAccountantInvoiceUploadSummary(getVisibleRecords()) : null;
      const hasPendingInvoiceUploads = Number(uploadSummary?.uploadableCount || 0) > 0;
      const shouldShow = isAccountant && !hasPendingInvoiceUploads && uploadedTotals.uploadedRecordCount > 0;

      accountantUploadedSettlementDetailBtn.hidden = !shouldShow;
      accountantUploadedSettlementDetailBtn.disabled = !shouldShow;
      accountantUploadedSettlementDetailBtn.textContent = "已上传/待结算详细";
      accountantUploadedSettlementDetailBtn.title = shouldShow
        ? `查看 ${uploadedTotals.uploadedRecordCount} 条已上传/待结算数据`
        : "";

      if (!shouldShow && bossSettlementDetailPayoutStatusFilter === "payable") {
        bossSettlementDetailPayoutStatusFilter = "";
      }
    }

    function updateAccountantInvoiceUploadControls(sourceRecords = records) {
      if (!accountantInvoiceUploadBtn) return;
      const {
        count,
        uploadableCount,
        invoiceAmount,
        taxAmount,
        payableAmount,
        accountantInvoiceAmount,
        dispatcherInvoiceAmount,
        dispatcherPremiumSegments,
        dispatcherCommissionTerms,
        dispatcherPremiumAmount,
        dispatcherCommissionAmount,
        hasIncomeBreakdown
      } = getAccountantInvoiceUploadSummary(sourceRecords);
      const activeUploadableCount = Number(uploadableCount) || 0;
      const shouldShow = canCurrentAccountUploadSettlementInvoice() && activeUploadableCount > 0;
      const shouldShowRecipientInfoEntry = canCurrentAccountManageInvoiceRecipientInfo();
      const shouldShowIncomeBreakdown = Boolean(
        hasIncomeBreakdown &&
        isAccountantLogin() &&
        isAccountantLinkedToDispatcher(getCurrentAccountantDisplayName())
      );
      const hasRecipientInfo = Boolean(getLockedInvoiceRecipientInfoForCurrentAccount());
      if (invoiceRecipientInfoBtn) {
        invoiceRecipientInfoBtn.hidden = !shouldShowRecipientInfoEntry;
        invoiceRecipientInfoBtn.classList.toggle("needs-info", !hasRecipientInfo);
        invoiceRecipientInfoBtn.textContent = hasRecipientInfo
          ? "结算申报信息查看"
          : "结算申报信息录入";
      }
      if (appSideNotice) {
        appSideNotice.hidden = !shouldShowRecipientInfoEntry || hasRecipientInfo;
      }
      accountantInvoiceUploadBtn.hidden = !shouldShow;
      accountantInvoiceUploadBtn.disabled = !shouldShow || isInvoiceUploadSubmitting;
      accountantInvoiceUploadBtn.replaceChildren();
      if (accountantInvoiceUploadSummary) {
        accountantInvoiceUploadSummary.hidden = !shouldShow;
        accountantInvoiceUploadSummary.setAttribute("aria-hidden", String(!shouldShow));
        accountantInvoiceUploadSummary.replaceChildren();
      }

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
      titleText.textContent = activeUploadableCount > 0
        ? `${isInvoiceUploadSubmitting ? "上传中" : "上传发票"}`
        : "上传发票";
      title.appendChild(titleText);
      accountantInvoiceUploadBtn.appendChild(title);

      if (activeUploadableCount > 0 && accountantInvoiceUploadSummary) {
        const summaryTitle = document.createElement("span");
        summaryTitle.className = "invoice-upload-summary-title";
        summaryTitle.textContent = `上传发票（${count}）`;
        accountantInvoiceUploadSummary.appendChild(summaryTitle);

        const stats = document.createElement("span");
        stats.className = "invoice-upload-btn-stats";
        const statRows = [
          ["开票金额", invoiceAmount, "invoiceAmount"],
          ["个税", taxAmount],
          ["应打款金额", payableAmount]
        ];
        statRows.forEach(([labelText, value]) => {
          const row = document.createElement("span");
          row.className = "invoice-upload-btn-stat";

          const label = document.createElement("span");
          label.className = "invoice-upload-btn-label";
          label.textContent = labelText;

          const amount = document.createElement("strong");
          amount.className = "invoice-upload-btn-value";
          amount.textContent = `${toMoney(value)}`;

          row.appendChild(label);
          row.appendChild(amount);
          if (labelText === "开票金额" && shouldShowIncomeBreakdown) {
            row.classList.add("invoice-upload-btn-stat-popover-host");
            row.tabIndex = 0;
            row.setAttribute(
              "aria-label",
              `开票金额 ${toMoney(invoiceAmount)}，做单 ${toMoney(accountantInvoiceAmount)}，接待 ${toMoney(dispatcherInvoiceAmount)}`
            );
            row.appendChild(createInvoiceUploadAmountPopover({
              accountantInvoiceAmount,
              dispatcherInvoiceAmount,
              invoiceAmount,
              dispatcherPremiumSegments,
              dispatcherCommissionTerms,
              dispatcherPremiumAmount,
              dispatcherCommissionAmount
            }));
          }
          stats.appendChild(row);
        });
        accountantInvoiceUploadSummary.appendChild(stats);
      }

      accountantInvoiceUploadBtn.setAttribute("aria-busy", String(isInvoiceUploadSubmitting));
      accountantInvoiceUploadBtn.classList.toggle("is-loading", Boolean(isInvoiceUploadSubmitting));
      accountantInvoiceUploadBtn.setAttribute(
        "aria-label",
        activeUploadableCount > 0
          ? `上传发票，${count} 条，开票金额 ${toMoney(invoiceAmount)}，做单 ${toMoney(accountantInvoiceAmount)}，接待 ${toMoney(dispatcherInvoiceAmount)}，个税 ${toMoney(taxAmount)}，应打款金额 ${toMoney(payableAmount)}`
          : "上传发票"
      );
      accountantInvoiceUploadBtn.removeAttribute("title");
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
      initializeBossSettlementDetailMonthKey(records);
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
        showAppStatus("请先选择要结算的数据。");
        return;
      }

      const confirmed = await openConfirmDialog({
        title: "确认结算",
        message: `确认结算 ${normalizedRecordIds.length} 条数据？`,
        confirmText: "确认结算",
        cancelText: "取消"
      });
      if (!confirmed) return;

      isBossSettlementPayoutSubmitting = true;
      try {
        renderBossSettlementDetailModalContent();
        const { paidRecordIds, skippedRecordIds } = await withLoading(
          {
            region: bossSettlementDetailList,
            regionText: "正在结算..."
          },
          () => payoutSettlementRecordsByIds(normalizedRecordIds)
        );
        const messageParts = [];
        if (paidRecordIds.length) {
          messageParts.push(`已结算 ${paidRecordIds.length} 条`);
        }
        if (skippedRecordIds.length) {
          messageParts.push(`跳过 ${skippedRecordIds.length} 条`);
        }
        showAppStatus(messageParts.length ? `${messageParts.join("，")}。` : "未处理任何数据。", paidRecordIds.length ? "ok" : "error");
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "结算失败，请稍后重试。");
      } finally {
        isBossSettlementPayoutSubmitting = false;
        renderBossSettlementDetailModalContent();
      }
    }

    async function submitBossSettlementPayoutRevoke(recordIds) {
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
        showAppStatus("请先选择要撤销打款的数据。");
        return;
      }

      if (!isQuickLoginDebugEnabled) {
        const confirmed = await openConfirmDialog({
          title: "撤销打款",
          message: getBossSettlementPayoutRevokeConfirmMessage(normalizedRecordIds),
          content: createBossSettlementPayoutRevokeConfirmTable(normalizedRecordIds),
          confirmText: "确认撤销",
          cancelText: "取消",
          tone: "danger",
          requireMathChallenge: true
        });
        if (!confirmed) return;
      }

      isBossSettlementPayoutSubmitting = true;
      try {
        renderBossSettlementDetailModalContent();
        const { revokedRecordIds, skippedRecordIds } = await withLoading(
          {
            region: bossSettlementDetailList,
            regionText: "正在撤销打款..."
          },
          () => revokeSettlementPayoutByIds(normalizedRecordIds)
        );
        const messageParts = [];
        if (revokedRecordIds.length) {
          messageParts.push(`已撤销 ${revokedRecordIds.length} 条`);
        }
        if (skippedRecordIds.length) {
          messageParts.push(`跳过 ${skippedRecordIds.length} 条`);
        }
        showAppStatus(messageParts.length ? `${messageParts.join("，")}。` : "未处理任何数据。", revokedRecordIds.length ? "ok" : "error");
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "撤销打款失败，请稍后重试。");
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
      setDateShortcutFilterValues([]);
      filterState.dateStart = "";
      filterState.dateEnd = "";
      syncDateRangeFilterInputs(true);
    }

    function clearCompletedAtFilterState() {
      setCompletedAtShortcutFilterValues([]);
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
      setDateShortcutFilterValues([]);
      filterState.dateStart = normalizedRange.start;
      filterState.dateEnd = normalizedRange.end;
      syncDateRangeFilterInputs(true);
    }

    function applyCompletedAtRangeFilter() {
      const normalizedRange = getNormalizedDateRangeFilter(
        filterCompletedAtStartInput?.value || "",
        filterCompletedAtEndInput?.value || ""
      );
      setCompletedAtShortcutFilterValues([]);
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
      const selectedDateShortcutFilters = getSelectedDateShortcutFilters();
      const selectedCompletedAtShortcutFilters = getSelectedCompletedAtShortcutFilters();
      const dateFilterChip = getDateFilterChipMeta();
      const completedAtFilterChip = getDateFilterChipMeta(
        filterState.completedAtMonth,
        filterState.completedAtStart,
        filterState.completedAtEnd
      );
      filterMonthBtn.classList.toggle("active", hasDateFilter);
      filterCompletedAtBtn.classList.toggle("active", hasCompletedAtFilter);
      const selectedDispatcherFilters = getSelectedDispatcherFilters();
      const hasDispatcherFilter = selectedDispatcherFilters.length > 0;
      const selectedAccountantFilters = getSelectedAccountantFilters();
      const hasAccountantFilter = selectedAccountantFilters.length > 0;
      filterDispatcherBtn.classList.toggle("active", hasDispatcherFilter);
      filterOrderBtn.classList.toggle("active", Boolean(filterState.orderNo));
      filterAccountantBtn.classList.toggle("active", hasAccountantFilter);
      filterSettlementRatioBtn.classList.toggle("active", Boolean(filterState.settlementRatio));
      filterCustomerBtn.classList.toggle("active", Boolean(filterState.customer));
      filterSummaryBtn.classList.toggle("active", Boolean(filterState.summary));
      filterRemarkBtn.classList.toggle("active", Boolean(filterState.remark));
      filterPlatformBtn.classList.toggle("active", Boolean(filterState.platform));
      filterShopBtn.classList.toggle("active", Boolean(filterState.shopName));
      filterSourceBtn.classList.toggle("active", Boolean(filterState.source));
      const selectedStatusFilters = getSelectedStatusFilters();
      const hasStatusFilter = selectedStatusFilters.length > 0;
      filterStatusBtn.classList.toggle("active", hasStatusFilter);
      filterSettledBtn.classList.toggle("active", Boolean(filterState.settled));
      if (filterMonthIndicator) filterMonthIndicator.classList.toggle("active", hasDateFilter);
      if (filterCompletedAtIndicator) filterCompletedAtIndicator.classList.toggle("active", hasCompletedAtFilter);
      if (filterDispatcherIndicator) filterDispatcherIndicator.classList.toggle("active", hasDispatcherFilter);
      if (filterOrderIndicator) filterOrderIndicator.classList.toggle("active", Boolean(filterState.orderNo));
      if (filterAccountantIndicator) filterAccountantIndicator.classList.toggle("active", hasAccountantFilter);
      if (filterSettlementRatioIndicator) filterSettlementRatioIndicator.classList.toggle("active", Boolean(filterState.settlementRatio));
      if (filterCustomerIndicator) filterCustomerIndicator.classList.toggle("active", Boolean(filterState.customer));
      if (filterSummaryIndicator) filterSummaryIndicator.classList.toggle("active", Boolean(filterState.summary));
      if (filterRemarkIndicator) filterRemarkIndicator.classList.toggle("active", Boolean(filterState.remark));
      if (filterPlatformIndicator) filterPlatformIndicator.classList.toggle("active", Boolean(filterState.platform));
      if (filterShopIndicator) filterShopIndicator.classList.toggle("active", Boolean(filterState.shopName));
      if (filterSourceIndicator) filterSourceIndicator.classList.toggle("active", Boolean(filterState.source));
      if (filterMonthlySettlementIndicator) filterMonthlySettlementIndicator.classList.toggle("active", Boolean(filterState.monthlySettlement));
      if (filterStatusIndicator) filterStatusIndicator.classList.toggle("active", hasStatusFilter);
      if (filterSettledIndicator) filterSettledIndicator.classList.toggle("active", Boolean(filterState.settled));
      filterMonthBtn.setAttribute("aria-expanded", String(!filterMonthPopover.hidden));
      filterCompletedAtBtn.setAttribute("aria-expanded", String(!filterCompletedAtPopover.hidden));
      filterDispatcherBtn.setAttribute("aria-expanded", String(!filterDispatcherPopover.hidden));
      filterOrderBtn.setAttribute("aria-expanded", String(!filterOrderPopover.hidden));
      filterAccountantBtn.setAttribute("aria-expanded", String(!filterAccountantPopover.hidden));
      filterSettlementRatioBtn.setAttribute("aria-expanded", String(!filterSettlementRatioPopover.hidden));
      filterCustomerBtn.setAttribute("aria-expanded", String(!filterCustomerPopover.hidden));
      filterSummaryBtn.setAttribute("aria-expanded", String(!filterSummaryPopover.hidden));
      filterRemarkBtn.setAttribute("aria-expanded", String(!filterRemarkPopover.hidden));
      filterPlatformBtn.setAttribute("aria-expanded", String(!filterPlatformPopover.hidden));
      filterShopBtn.setAttribute("aria-expanded", String(!filterShopPopover.hidden));
      filterSourceBtn.setAttribute("aria-expanded", String(!filterSourcePopover.hidden));
      filterMonthlySettlementBtn.setAttribute("aria-expanded", String(!filterMonthlySettlementPopover.hidden));
      filterStatusBtn.setAttribute("aria-expanded", String(!filterStatusPopover.hidden));
      filterSettledBtn.setAttribute("aria-expanded", String(!filterSettledPopover.hidden));
      syncFilterIconButton(filterMonthBtn, hasDateFilter, FILTER_ICON_PATH, "清空日期筛选", "筛选日期");
      syncFilterIconButton(filterCompletedAtBtn, hasCompletedAtFilter, FILTER_ICON_PATH, "清空完工日期筛选", "筛选完工日期");
      syncFilterIconButton(filterDispatcherBtn, hasDispatcherFilter, FILTER_ICON_PATH, "清空接待人筛选", "筛选接待人");
      syncFilterIconButton(filterOrderBtn, Boolean(filterState.orderNo), SEARCH_ICON_PATH, "清空订单号查询", "查询订单号");
      syncFilterIconButton(filterAccountantBtn, hasAccountantFilter, FILTER_ICON_PATH, "清空会计筛选", "筛选会计");
      syncFilterIconButton(filterSettlementRatioBtn, Boolean(filterState.settlementRatio), FILTER_ICON_PATH, "清空结算比例筛选", "筛选结算比例");
      syncFilterIconButton(filterCustomerBtn, Boolean(filterState.customer), SEARCH_ICON_PATH, "清空客户搜索", "搜索客户");
      syncFilterIconButton(filterSummaryBtn, Boolean(filterState.summary), SEARCH_ICON_PATH, "清空任务简介搜索", "搜索任务简介");
      syncFilterIconButton(filterRemarkBtn, Boolean(filterState.remark), SEARCH_ICON_PATH, "清空备注搜索", "搜索备注");
      syncFilterIconButton(filterPlatformBtn, Boolean(filterState.platform), FILTER_ICON_PATH, "清空平台筛选", "筛选平台");
      syncFilterIconButton(filterShopBtn, Boolean(filterState.shopName), FILTER_ICON_PATH, "清空店铺名筛选", "筛选店铺名");
      syncFilterIconButton(filterSourceBtn, Boolean(filterState.source), FILTER_ICON_PATH, "清空来源筛选", "筛选来源");
      syncFilterIconButton(filterMonthlySettlementBtn, Boolean(filterState.monthlySettlement), FILTER_ICON_PATH, "清空是否月结筛选", "筛选是否月结");
      syncFilterIconButton(filterStatusBtn, hasStatusFilter, FILTER_ICON_PATH, "清空状态筛选", "筛选状态");
      syncFilterIconButton(filterSettledBtn, Boolean(filterState.settled), FILTER_ICON_PATH, "清空结算筛选", "筛选结算状态");
      syncDateRangeFilterInputs();
      syncDateRangeFilterInputs(false, {
        startInput: filterCompletedAtStartInput,
        endInput: filterCompletedAtEndInput,
        startValue: filterState.completedAtStart,
        endValue: filterState.completedAtEnd
      });

      if (hasDateFilter) {
        const monthLabel = dateFilterChip.label || formatMonthFilterChipLabel(selectedDateShortcutFilters);
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
          selectedCompletedAtShortcutFilters,
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

      if (hasDispatcherFilter) {
        const dispatcherLabel = selectedDispatcherFilters.map((value) => getDispatcherDisplayNameByTag(value)).join("、");
        filterDispatcherValue.hidden = false;
        filterDispatcherValue.textContent = dispatcherLabel;
        filterDispatcherValue.title = dispatcherLabel;
      } else {
        filterDispatcherValue.hidden = true;
        filterDispatcherValue.textContent = "";
        filterDispatcherValue.title = "";
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

      if (hasAccountantFilter) {
        const accountantLabel = selectedAccountantFilters.join("、");
        filterAccountantValue.hidden = false;
        filterAccountantValue.textContent = accountantLabel;
        filterAccountantValue.title = accountantLabel;
      } else {
        filterAccountantValue.hidden = true;
        filterAccountantValue.textContent = "";
        filterAccountantValue.title = "";
      }

      if (filterState.settlementRatio) {
        filterSettlementRatioValue.hidden = false;
        filterSettlementRatioValue.textContent = filterState.settlementRatio;
        filterSettlementRatioValue.title = filterState.settlementRatio;
      } else {
        filterSettlementRatioValue.hidden = true;
        filterSettlementRatioValue.textContent = "";
        filterSettlementRatioValue.title = "";
      }

      [
        { valueNode: filterCustomerValue, rawValue: filterState.customer },
        { valueNode: filterSummaryValue, rawValue: filterState.summary },
        { valueNode: filterRemarkValue, rawValue: filterState.remark },
      ].forEach(({ valueNode, rawValue }) => {
        const value = String(rawValue || "").trim();
        if (value) {
          const terms = value.split(/[\n\r]+/).map((item) => item.trim()).filter(Boolean);
          const displayText = terms.length > 1
            ? `(${terms.length}) ${terms.join(" ")}`
            : value;
          valueNode.hidden = false;
          valueNode.textContent = displayText;
          valueNode.title = displayText;
        } else {
          valueNode.hidden = true;
          valueNode.textContent = "";
          valueNode.title = "";
        }
      });

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

      if (filterState.monthlySettlement) {
        filterMonthlySettlementValue.hidden = false;
        filterMonthlySettlementValue.textContent = filterState.monthlySettlement;
        filterMonthlySettlementValue.title = filterState.monthlySettlement;
      } else {
        filterMonthlySettlementValue.hidden = true;
        filterMonthlySettlementValue.textContent = "";
        filterMonthlySettlementValue.title = "";
      }

      if (hasStatusFilter) {
        const statusText = selectedStatusFilters.length === 1
          ? selectedStatusFilters[0]
          : `已选 ${selectedStatusFilters.length} 项`;
        filterStatusValue.hidden = false;
        filterStatusValue.textContent = statusText;
        filterStatusValue.title = selectedStatusFilters.join("、");
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
      filterSettlementRatioPopover.hidden = true;
      filterCustomerPopover.hidden = true;
      filterSummaryPopover.hidden = true;
      filterRemarkPopover.hidden = true;
      filterPlatformPopover.hidden = true;
      filterShopPopover.hidden = true;
      filterSourcePopover.hidden = true;
      filterMonthlySettlementPopover.hidden = true;
      filterStatusPopover.hidden = true;
      filterSettledPopover.hidden = true;
      updateFilterButtonUI();
    }

    function clearTableFilterState() {
      clearDateFilterState();
      clearCompletedAtFilterState();
      setDispatcherFilterValues([]);
      filterState.orderNo = "";
      setAccountantFilterValues([]);
      filterState.settlementRatio = "";
      filterState.customer = "";
      filterState.summary = "";
      filterState.remark = "";
      filterState.platform = "";
      filterState.shopName = "";
      filterState.source = "";
      filterState.monthlySettlement = "";
      setStatusFilterValues([]);
      filterState.settled = "";
      if (filterOrderInput) filterOrderInput.value = "";
      if (filterCustomerInput) filterCustomerInput.value = "";
      if (filterSummaryInput) filterSummaryInput.value = "";
      if (filterRemarkInput) filterRemarkInput.value = "";
    }

    function resetTableViewToDefault() {
      clearTableFilterState();
      sortState.key = "date";
      sortState.direction = "desc";
      sortState.premiumMode = "amount";
      sortState.settlementMode = "amount";
      closeAllFilterPopovers();
    }

    function applyMonthlySettlementQuickFilter() {
      clearTableFilterState();
      filterState.monthlySettlement = "是";
      sortState.key = "monthlySettlementEndDate";
      sortState.direction = "asc";
      sortState.premiumMode = "amount";
      sortState.settlementMode = "amount";
      closeAllFilterPopovers();
      renderTable();
    }

    function isMonthlySettlementDueToday(record) {
      return Boolean(
        isMonthlySettlementRecord(record)
          && getMonthlySettlementEndDate(record) === getTodayISODate()
      );
    }

    function updateMonthlySettlementQuickButton(sourceRecords = getVisibleRecords()) {
      if (!applyMonthlySettlementFilterBtn) return;
      const dueCount = (Array.isArray(sourceRecords) ? sourceRecords : [])
        .filter((item) => isMonthlySettlementDueToday(item))
        .length;
      applyMonthlySettlementFilterBtn.classList.toggle("is-due-today", dueCount > 0);
      applyMonthlySettlementFilterBtn.textContent = dueCount > 0 ? `月结（${dueCount}）` : "月结";
      applyMonthlySettlementFilterBtn.title = dueCount > 0
        ? `今日有 ${dueCount} 条月结订单到期，点击查看所有月结订单。`
        : "筛选所有月结订单，并按月结结束时间排序";
      applyMonthlySettlementFilterBtn.setAttribute("aria-label", applyMonthlySettlementFilterBtn.title);
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

    function syncSettlementScheduleToggleUI() {
      if (!settlementScheduleToggleBtn || !settlementScheduleToggleIcon || !settlementScheduleBody) return;
      const isExpanded = !isSettlementScheduleCollapsed;
      const actionLabel = "关闭结算时间节点";
      const scheduleRoot = settlementScheduleToggleBtn.closest(".accountant-settlement-schedule");
      if (scheduleRoot) {
        scheduleRoot.classList.toggle("is-collapsed", isSettlementScheduleCollapsed);
        scheduleRoot.hidden = isSettlementScheduleCollapsed;
      }
      settlementScheduleBody.hidden = false;
      settlementScheduleToggleBtn.setAttribute("aria-expanded", String(isExpanded));
      settlementScheduleToggleBtn.setAttribute("aria-label", actionLabel);
      settlementScheduleToggleBtn.title = actionLabel;
      settlementScheduleToggleIcon.textContent = "×";
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

    function setSettlementScheduleCollapsed(collapsed) {
      isSettlementScheduleCollapsed = Boolean(collapsed);
      syncSettlementScheduleToggleUI();
    }

    function toggleSettlementScheduleCollapsed() {
      isSettlementScheduleCollapsed = true;
      syncSettlementScheduleToggleUI();
    }

    function toggleFilterPopover(key) {
      if (typeof closeAllFormPickers === "function") {
        closeAllFormPickers();
      }
      const hideOtherFilterPopovers = (activePopover) => {
        [
          filterMonthPopover,
          filterCompletedAtPopover,
          filterDispatcherPopover,
          filterOrderPopover,
          filterAccountantPopover,
          filterSettlementRatioPopover,
          filterCustomerPopover,
          filterSummaryPopover,
          filterRemarkPopover,
          filterPlatformPopover,
          filterShopPopover,
          filterSourcePopover,
          filterMonthlySettlementPopover,
          filterStatusPopover,
          filterSettledPopover,
        ].forEach((popover) => {
          if (popover && popover !== activePopover) {
            popover.hidden = true;
          }
        });
      };
      if (key === "month") {
        updateFilterOptions();
        const open = filterMonthPopover.hidden;
        filterMonthPopover.hidden = !open;
        hideOtherFilterPopovers(filterMonthPopover);
      }
      if (key === "completedAt") {
        updateFilterOptions();
        const open = filterCompletedAtPopover.hidden;
        filterCompletedAtPopover.hidden = !open;
        hideOtherFilterPopovers(filterCompletedAtPopover);
      }
      if (key === "dispatcher") {
        updateFilterOptions();
        const open = filterDispatcherPopover.hidden;
        filterDispatcherPopover.hidden = !open;
        hideOtherFilterPopovers(filterDispatcherPopover);
      }
      if (key === "orderNo") {
        const open = filterOrderPopover.hidden;
        filterOrderPopover.hidden = !open;
        hideOtherFilterPopovers(filterOrderPopover);
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
        hideOtherFilterPopovers(filterAccountantPopover);
        if (open && filterAccountantSearchInput) {
          window.setTimeout(() => {
            filterAccountantSearchInput.focus();
            filterAccountantSearchInput.select();
          }, 0);
        }
      }
      if (key === "settlementRatio") {
        updateFilterOptions();
        const open = filterSettlementRatioPopover.hidden;
        filterSettlementRatioPopover.hidden = !open;
        hideOtherFilterPopovers(filterSettlementRatioPopover);
      }
      if (key === "customer") {
        const open = filterCustomerPopover.hidden;
        filterCustomerPopover.hidden = !open;
        hideOtherFilterPopovers(filterCustomerPopover);
        if (open && filterCustomerInput) {
          window.setTimeout(() => {
            filterCustomerInput.focus();
            filterCustomerInput.select();
          }, 0);
        }
      }
      if (key === "summary") {
        const open = filterSummaryPopover.hidden;
        filterSummaryPopover.hidden = !open;
        hideOtherFilterPopovers(filterSummaryPopover);
        if (open && filterSummaryInput) {
          window.setTimeout(() => {
            filterSummaryInput.focus();
            filterSummaryInput.select();
          }, 0);
        }
      }
      if (key === "remark") {
        const open = filterRemarkPopover.hidden;
        filterRemarkPopover.hidden = !open;
        hideOtherFilterPopovers(filterRemarkPopover);
        if (open && filterRemarkInput) {
          window.setTimeout(() => {
            filterRemarkInput.focus();
            filterRemarkInput.select();
          }, 0);
        }
      }
      if (key === "platform") {
        updateFilterOptions();
        const open = filterPlatformPopover.hidden;
        filterPlatformPopover.hidden = !open;
        hideOtherFilterPopovers(filterPlatformPopover);
      }
      if (key === "shopName") {
        updateFilterOptions();
        const open = filterShopPopover.hidden;
        filterShopPopover.hidden = !open;
        hideOtherFilterPopovers(filterShopPopover);
      }
      if (key === "source") {
        updateFilterOptions();
        const open = filterSourcePopover.hidden;
        filterSourcePopover.hidden = !open;
        hideOtherFilterPopovers(filterSourcePopover);
      }
      if (key === "monthlySettlement") {
        updateFilterOptions();
        const open = filterMonthlySettlementPopover.hidden;
        filterMonthlySettlementPopover.hidden = !open;
        hideOtherFilterPopovers(filterMonthlySettlementPopover);
      }
      if (key === "status") {
        updateFilterOptions();
        const open = filterStatusPopover.hidden;
        filterStatusPopover.hidden = !open;
        hideOtherFilterPopovers(filterStatusPopover);
      }
      if (key === "settled") {
        updateFilterOptions();
        const open = filterSettledPopover.hidden;
        filterSettledPopover.hidden = !open;
        hideOtherFilterPopovers(filterSettledPopover);
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
      document.body.classList.toggle("boss-view", Boolean(isLoggedIn && isBoss));
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
        accountantMetaParts.push(`微信名：${accountantAlias}`);
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
      if (openDataModalBtn) openDataModalBtn.hidden = !isBoss;
      if (openCustomerFeedbackModalBtn) openCustomerFeedbackModalBtn.hidden = !isBoss;
      openDispatcherModalBtn.hidden = !isBoss;
      openAnalysisModalBtn.hidden = !isBoss;
      openRecycleModalBtn.hidden = isAccountant;
      openAccountantModalBtn.hidden = isAccountant;
      if (forceRefreshAccountantPagesBtn) {
        forceRefreshAccountantPagesBtn.hidden = !isBoss;
      }
      if (openChangeLogBtn) {
        openChangeLogBtn.hidden = isAccountant;
      }
      updateReminderEntryButton();
      if (applyMonthlySettlementFilterBtn) {
        applyMonthlySettlementFilterBtn.hidden = !isLoggedIn;
        updateMonthlySettlementQuickButton(getVisibleRecords());
      }
      if (exportTableBtn) {
        exportTableBtn.hidden = !canCurrentAccountExportTableRecords();
      }
      if (bossSettlementSummaryBtn) {
        bossSettlementSummaryBtn.hidden = !isBoss;
      }
      updateAccountantUploadedSettlementDetailControls();
      changePasswordBtn.hidden = !(isLoggedIn && isDispatcher);
      if (editProfileBtn) {
        editProfileBtn.hidden = !(isLoggedIn && isAccountant);
      }
      syncAnalysisPageRoute();
      if (!canSettleRecords) {
        clearBossRecordSelection();
        clearBossSettlementPayoutSelection();
        setRecentBossSettlementRecordIds([]);
        closeBossSettlementSummaryModal();
      }
      const scopedRecords = getVisibleRecords();
      updateAccountantInvoiceUploadControls(scopedRecords);
      filterDispatcherBtn.disabled = false;
      if (isDispatcher) {
        syncDispatcherSelfViewState();
        filterDispatcherPopover.hidden = true;
      }
      updateBossSettlementControls();
      updateBossSettlementDetailControls();
      if (analysisModal && !analysisModal.hidden) {
        renderAnalysisPanel();
      }
      syncSettlementScheduleToggleUI();
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

    function syncMonthlySettlementCalculatedFields() {
      const isMonthly = Boolean(monthlySettlementCheckbox?.checked);
      const isCreateMode = !String(recordEditingIdInput?.value || "").trim();
      const canUseMonthlySettlementToggle = hasDebugQueryFlag();
      const shouldUseCalculatedMonthlyFields = isMonthly && isCreateMode;
      const monthlyTotalControl = monthlySettlementTotalPaymentPriceInput?.closest(".monthly-settlement-control");
      const monthlyCountControl = monthlySettlementMonthCountInput?.closest(".monthly-settlement-control");

      if (monthlySettlementCheckbox) {
        monthlySettlementCheckbox.disabled = !canUseMonthlySettlementToggle;
        monthlySettlementCheckbox.title = canUseMonthlySettlementToggle
          ? ""
          : "月结勾选暂时关闭，调试链接可使用。";
      }
      if (monthlyTotalControl) monthlyTotalControl.hidden = !isCreateMode;
      if (monthlyCountControl) monthlyCountControl.hidden = !isCreateMode;

      if (monthlySettlementTotalPaymentPriceInput) {
        monthlySettlementTotalPaymentPriceInput.required = shouldUseCalculatedMonthlyFields && isProductionEnvironment();
      }
      if (monthlySettlementMonthCountInput) {
        monthlySettlementMonthCountInput.required = shouldUseCalculatedMonthlyFields && isProductionEnvironment();
      }
      if (recordReminderDateInput) {
        recordReminderDateInput.readOnly = shouldUseCalculatedMonthlyFields;
        recordReminderDateInput.setAttribute("aria-readonly", shouldUseCalculatedMonthlyFields ? "true" : "false");
      }
      if (paymentPriceInput) {
        paymentPriceInput.readOnly = shouldUseCalculatedMonthlyFields;
        paymentPriceInput.setAttribute("aria-readonly", shouldUseCalculatedMonthlyFields ? "true" : "false");
      }

      if (!shouldUseCalculatedMonthlyFields) return;

      const monthCount = parsePositiveIntegerValue(monthlySettlementMonthCountInput?.value);
      const monthlyTotalPayment = Number(String(monthlySettlementTotalPaymentPriceInput?.value || "").trim());
      const hasValidMonthCount = Number.isInteger(monthCount) && monthCount > 0;
      const hasValidMonthlyTotal = Number.isFinite(monthlyTotalPayment) && monthlyTotalPayment >= 0;

      if (recordReminderDateInput) {
        recordReminderDateInput.value = hasValidMonthCount
          ? addCalendarMonthsClamped(dateInput?.value || getTodayISODate(), monthCount)
          : "";
      }
      if (paymentPriceInput) {
        paymentPriceInput.value = hasValidMonthCount && hasValidMonthlyTotal
          ? formatMoneyInputValue(monthlyTotalPayment / monthCount)
          : "";
        syncPremiumPriceFromPrices();
      }
    }

    function resetRecordFormMode() {
      recordEditingIdInput.value = "";
      setRecordDateInputValue(getTodayISODate());
      setRecordCreateRequiredState(true);
      resetInlineFormState(recordForm, setRecordFormHint);
      recordModalTitle.textContent = "新建数据";
      recordSubmitBtn.textContent = "保存数据";
      if (monthlySettlementCheckbox) {
        monthlySettlementCheckbox.checked = false;
      }
      if (recordReminderDateField) {
        recordReminderDateField.hidden = true;
      }
      if (recordReminderDateInput) {
        recordReminderDateInput.value = "";
      }
      if (monthlySettlementTotalPaymentPriceInput) {
        monthlySettlementTotalPaymentPriceInput.value = "";
      }
      if (monthlySettlementMonthCountInput) {
        monthlySettlementMonthCountInput.value = "";
      }
      syncMonthlySettlementCalculatedFields();
    }

    function shouldSkipRecordModalAutoFocus() {
      return Boolean(
        window.matchMedia
          && window.matchMedia("(hover: none), (pointer: coarse), (max-width: 860px)").matches
      );
    }

    function shouldSkipLoginAutoFocus() {
      return Boolean(
        window.matchMedia
          && window.matchMedia("(hover: none), (pointer: coarse), (max-width: 860px)").matches
      );
    }

    function showRecordModal(initialFocusTarget = accountantPickerTrigger) {
      createModal.hidden = false;
      createModal.classList.remove("modal-enter");
      createModalCard.classList.remove("modal-enter");
      void createModal.offsetWidth;
      createModal.classList.add("modal-enter");
      createModalCard.classList.add("modal-enter");
      syncModalOpenState();
      if (!shouldSkipRecordModalAutoFocus() && initialFocusTarget && typeof initialFocusTarget.focus === "function") {
        initialFocusTarget.focus();
      }
    }

    function requireAccount() {
      if (hasAuthenticatedAccount()) return true;
      setPageMode(false);
      if (!shouldSkipLoginAutoFocus()) {
        loginCodeInput.focus();
      }
      return false;
    }

    async function syncDataAfterLogin() {
      renderTableLoadingState("正在加载基础资料...");
      try {
        await fetchAccountants();
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "读取会计列表失败，请稍后重试。");
      }
      try {
        await fetchDispatchers();
      } catch (error) {
        console.error(error);
      }
      try {
        await fetchRecords();
      } catch (error) {
        console.error(error);
        showAppStatus("读取共享数据失败，请确认 Node 服务已启动。");
        renderTable();
      }
      setRegionLoading(mainTableWrap, false);
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
      if (isQuickLoginDebugEnabled) {
        await loadSavedLoginEntries();
      }
      if (!shouldSkipLoginAutoFocus()) {
        loginCodeInput.focus();
      }
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
      const canCheckRecords = isAccountantLogin();
      const isBoss = isBossLogin();
      const canSettleRecords = canCurrentAccountSettleRecords();
      const scopedRecords = getVisibleRecords();
      const currentDispatcherTag = getCurrentDispatcherTag();
      const filteredRecords = getFilteredRecords();
      const sortedRecords = getSortedRecords(filteredRecords);
      updateMonthlySettlementQuickButton(scopedRecords);

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
        || hasDispatcherFilterSelected()
        || filterState.orderNo
        || hasAccountantFilterSelected()
        || filterState.settlementRatio
        || filterState.customer
        || filterState.summary
        || filterState.remark
        || filterState.platform
        || filterState.shopName
        || filterState.source
        || filterState.monthlySettlement
        || hasStatusFilterSelected()
        || filterState.settled
      );
      tableTotalCount.textContent = hasFilter
        ? `共 ${filteredRecords.length}/${scopedRecords.length} 条`
        : `共 ${scopedRecords.length} 条`;
      clearFilterBtn.hidden = !hasFilter;
      if (exportTableBtn) {
        const canExportRecords = canCurrentAccountExportTableRecords();
        exportTableBtn.hidden = !canExportRecords;
        exportTableBtn.disabled = !canExportRecords || filteredRecords.length === 0;
        exportTableBtn.title = canExportRecords
          ? (filteredRecords.length ? "导出当前筛选数据" : "当前没有可导出数据")
          : "";
      }
      updateAccountantInvoiceUploadControls(scopedRecords);
      updateAccountantUploadedSettlementDetailControls();
      updateSortHeaderUI(filteredRecords);
      updateBossSettlementControls(sortedRecords);
      updateBossSettlementDetailControls();
      if (!filteredRecords.length) {
        emptyState.style.display = "block";
        emptyState.textContent = scopedRecords.length ? "当前筛选无数据。" : "暂无数据，先录入一条。";
        applyTableColumnVisibility();
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
        const isMonthlyDueToday = isMonthlySettlementDueToday(item);
        if (isCurrentDispatcher) {
          tr.classList.add("dispatcher-current-row");
        }
        if (isUpdatedRow) {
          tr.classList.add("updated-record-row");
        }
        if (isMonthlyDueToday) {
          tr.classList.add("monthly-settlement-due-row");
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
          String(item.accountant || ""),
          String(item.customer || ""),
          String(item.summary || ""),
          String(item.remark || ""),
          toMoney(item.paymentPrice),
          formatPremiumWithPercent(item),
          toMoney(item.totalPrice),
          formatSettlementPriceDisplay(item),
          String(item.source || ""),
          String(item.platform || ""),
          String(item.shopName || ""),
          String(item.orderNo || ""),
          String(item.customerFeedback || ""),
          getMonthlySettlementTableDisplay(item),
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
          } else if (index === 3) {
            td.classList.add("data-col-accountant");
            const accountantText = String(value || "").trim();
            const accountantWrap = document.createElement("span");
            accountantWrap.className = "accountant-cell";
            const accountantName = document.createElement("span");
            accountantName.className = "accountant-cell-name";
            accountantName.textContent = accountantText;
            accountantWrap.appendChild(accountantName);
            const badgeText = getAccountantDispatcherBadgeText(accountantText);
            if (badgeText) {
              const badge = document.createElement("span");
              badge.className = "accountant-dispatcher-badge";
              badge.textContent = badgeText;
              badge.title = `关联接待：${getDispatcherDisplayNameByTag(badgeText) || badgeText}`;
              badge.setAttribute("aria-label", badge.title);
              accountantWrap.appendChild(badge);
              tooltipText = accountantText ? `${accountantText}，${badge.title}` : badge.title;
              tooltipMode = "always";
            }
            td.appendChild(accountantWrap);
          } else if (index === 11) {
            td.classList.add("data-col-source");
            td.textContent = value;
          } else if (index === 12) {
            td.classList.add("data-col-platform");
            td.textContent = value;
          } else if (index === 13) {
            td.classList.add("data-col-shop");
            td.textContent = value;
          } else if (index === 14) {
            td.classList.add("data-col-order");
            td.textContent = value;
          } else if (index === 15) {
            td.classList.add("data-col-feedback");
            td.textContent = value;
          } else if (index === 16) {
            td.classList.add("data-col-monthly-settlement");
            td.textContent = value;
            const monthlyEndDate = getMonthlySettlementEndDate(item);
            if (monthlyEndDate) {
              tooltipText = `月结结束时间：${monthlyEndDate}`;
              tooltipMode = "always";
              td.setAttribute("aria-label", tooltipText);
            }
          } else if (index === 17) {
            td.classList.add("data-col-status");
            const statusWrap = document.createElement("div");
            statusWrap.className = "row-status-cell";
            const statusChip = document.createElement("span");
            const statusKey = getRecordWorkflowStatusDisplayKey(item);
            const invoiceImage = statusKey === "uploaded" ? getRecordStatusPreviewInvoiceImage(item) : null;
            statusChip.className = `record-status-chip ${statusKey}`;
            statusChip.textContent = String(value || "");
            if (invoiceImage) {
              tooltipText = "双击查看发票图片";
              tooltipMode = "always";
              td.dataset.recordId = recordId;
              td.dataset.tableTooltipImage = invoiceImage.url;
              td.dataset.tableTooltipImageAlt = invoiceImage.name || "发票图片";
              td.setAttribute("aria-label", `${String(value || "").trim()}，双击查看发票图片`);
              statusChip.classList.add("has-invoice-preview");
              statusChip.tabIndex = 0;
              statusChip.setAttribute("role", "button");
              statusChip.setAttribute("aria-label", `${String(value || "").trim()}，双击查看发票图片`);
            }
            statusWrap.appendChild(statusChip);
            const refundBadgeText = getRecordRefundBadgeText(item);
            if (refundBadgeText) {
              const refundBadge = document.createElement("span");
              refundBadge.className = `record-status-refund-badge${refundBadgeText === "退单" ? " returned" : ""}`;
              refundBadge.textContent = refundBadgeText;
              statusWrap.appendChild(refundBadge);
              const statusText = String(value || "").trim();
              td.setAttribute(
                "aria-label",
                statusText
                  ? `${statusText}，${refundBadgeText}${invoiceImage ? "，双击查看发票图片" : ""}`
                  : refundBadgeText
              );
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
          if (index === 4) td.classList.add("data-col-customer");
          if (index === 5) td.classList.add("summary", "data-col-summary");
          if (index === 6) td.classList.add("remark", "data-col-remark");
          if (index === 7) td.classList.add("data-col-payment");
          if (index === 8) td.classList.add("data-col-premium");
          if (index === 9) td.classList.add("data-col-total");
          if (index === 10) td.classList.add("data-col-settlement");
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
          }
          if (canCurrentAccountEditRecord(item)) {
            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "row-edit-btn";
            editBtn.dataset.recordId = recordId;
            editBtn.textContent = "修改";
            actionWrap.appendChild(editBtn);
          }
        }
        if (recordId && canCurrentAccountDeleteRecord(item)) {
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
      applyTableColumnVisibility();
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
      if (recordReminderDateField) {
        recordReminderDateField.hidden = !isMonthlySettlementRecord(record);
      }
      if (recordReminderDateInput) {
        recordReminderDateInput.value = getMonthlySettlementEndDate(record);
      }
      const monthlySettlement = getRecordMonthlySettlement(record);
      if (monthlySettlementTotalPaymentPriceInput) {
        monthlySettlementTotalPaymentPriceInput.value = Number.isFinite(Number(monthlySettlement.totalPaymentPrice))
          ? String(monthlySettlement.totalPaymentPrice)
          : "";
      }
      if (monthlySettlementMonthCountInput) {
        monthlySettlementMonthCountInput.value = Number.isInteger(Number(monthlySettlement.monthCount))
          ? String(monthlySettlement.monthCount)
          : "";
      }
      paymentPriceInput.value = Number.isFinite(Number(record.paymentPrice)) ? String(record.paymentPrice) : "";
      totalPriceInput.value = Number.isFinite(Number(record.totalPrice)) ? String(record.totalPrice) : "";
      settlementPriceInput.value = Number.isFinite(Number(record.settlementPrice)) ? String(record.settlementPrice) : "";
      syncMonthlySettlementCalculatedFields();
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
