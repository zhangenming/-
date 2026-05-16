// Mobile shell: renders touch-first views while delegating business actions to the shared app.
(() => {
  const isMobileEntry = document.body?.classList.contains("mobile-app");
  if (!isMobileEntry) return;

  const FILTER_BUTTONS = [
    { key: "month", label: "接单日期", button: () => filterMonthBtn, value: () => getDateFilterSummary(filterState.month, filterState.dateStart, filterState.dateEnd) },
    { key: "completedAt", label: "完工日期", button: () => filterCompletedAtBtn, value: () => getDateFilterSummary(filterState.completedAtMonth, filterState.completedAtStart, filterState.completedAtEnd) },
    { key: "dispatcher", label: "接待人", button: () => filterDispatcherBtn, value: () => getSelectedDispatcherFilters().map((item) => getDispatcherDisplayNameByTag(item)).join("、") },
    { key: "orderNo", label: "订单号", button: () => filterOrderBtn, value: () => filterState.orderNo },
    { key: "accountant", label: "会计", button: () => filterAccountantBtn, value: () => getSelectedAccountantFilters().join("、") },
    { key: "platform", label: "平台", button: () => filterPlatformBtn, value: () => filterState.platform },
    { key: "shopName", label: "店铺名", button: () => filterShopBtn, value: () => filterState.shopName },
    { key: "source", label: "来源", button: () => filterSourceBtn, value: () => filterState.source },
    { key: "status", label: "状态", button: () => filterStatusBtn, value: () => getSelectedStatusFilters().join("、") },
    { key: "settled", label: "结算状态", button: () => filterSettledBtn, value: () => filterState.settled },
  ];

  let mobileShell = null;
  let mobileList = null;
  let mobileCount = null;
  let mobileAccount = null;
  let mobileRole = null;
  let mobileSheet = null;
  let activeSheet = "";
  let renderFrame = 0;
  let enhanceFrame = 0;
  let mobileMutationObserver = null;
  const expandedMobileRecordIds = new Set();

  function syncMobileDispatcherField() {
    const field = document.querySelector("#createModal .field-dispatcher");
    if (!field || !dispatcherInput) return;
    const shouldLock = isDispatcherLogin();
    field.classList.toggle("mobile-dispatcher-locked", shouldLock);
    if (!shouldLock) {
      field.removeAttribute("data-mobile-dispatcher");
      return;
    }
    const dispatcherTag = getCurrentDispatcherTag() || getDefaultDispatcherTag();
    dispatcherInput.value = dispatcherTag;
    field.setAttribute("data-mobile-dispatcher", getDispatcherDisplayNameByTag(dispatcherTag) || getMobileAccountText());
  }

  function syncMobileRecordSubmitText() {
    if (!recordSubmitBtn || !recordEditingIdInput) return;
    if (!String(recordEditingIdInput.value || "").trim()) {
      recordSubmitBtn.textContent = "指派订单";
    }
  }

  function callClick(button) {
    if (!button || button.hidden || button.disabled) return false;
    button.click();
    return true;
  }

  function getDateFilterSummary(month, start, end) {
    const parts = [];
    if (month) parts.push(formatDateFilterOptionLabel(month));
    if (start || end) parts.push(`${start || "开始"} 至 ${end || "结束"}`);
    return parts.join(" / ");
  }

  function getMobileRoleText() {
    if (isAccountantLogin()) return "会计账号";
    if (isBossLogin()) return "管理员账号";
    if (isDispatcherLogin()) return "接待账号";
    return "";
  }

  function getMobileAccountText() {
    if (isAccountantLogin()) {
      return getCurrentAccountantLoginPhone() || getCurrentAccountantDisplayName() || currentAccount;
    }
    if (isBossLogin()) return BOSS_LOGIN_ACCOUNT;
    if (isDispatcherLogin()) return getDispatcherAccountDisplayName(currentAccount);
    return currentAccount || "";
  }

  function createButton({ className, text, onClick, hidden = false, disabled = false, type = "button", ariaLabel = "" }) {
    const button = document.createElement("button");
    button.type = type;
    button.className = className;
    button.textContent = text;
    button.hidden = hidden;
    button.disabled = disabled;
    if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
    button.addEventListener("click", onClick);
    return button;
  }

  function getActiveFilterItems() {
    return FILTER_BUTTONS.map((item) => ({
      key: item.key,
      label: item.label,
      value: String(item.value() || "").trim(),
    })).filter((item) => item.value);
  }

  function renderMobileFilterChips() {
    const wrap = mobileShell?.querySelector("#mobileActiveFilters");
    if (!wrap) return;
    wrap.innerHTML = "";
    const activeItems = getActiveFilterItems();
    if (!activeItems.length) {
      const empty = document.createElement("span");
      empty.className = "mobile-filter-chip empty";
      empty.textContent = "全部数据";
      wrap.appendChild(empty);
      return;
    }
    activeItems.forEach((item) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "mobile-filter-chip";
      chip.textContent = `${item.label}：${item.value}`;
      chip.addEventListener("click", () => openMobileSheet("filter"));
      wrap.appendChild(chip);
    });
    if (!clearFilterBtn.hidden) {
      wrap.appendChild(createButton({
        className: "mobile-filter-chip clear",
        text: "清空",
        onClick: () => callClick(clearFilterBtn),
      }));
    }
  }

  function ensureMobileShell() {
    if (mobileShell || !appPage) return mobileShell;

    mobileShell = document.createElement("section");
    mobileShell.id = "mobileShell";
    mobileShell.className = "mobile-shell";
    mobileShell.innerHTML = `
      <div class="mobile-content">
        <section id="mobileScheduleCard" class="mobile-schedule-card" hidden>
          <div class="mobile-section-head">
            <h2 class="mobile-section-title">月度节点提醒</h2>
            <button id="mobileScheduleCloseBtn" class="settlement-schedule-close-btn" type="button" aria-label="关闭月度节点提醒">×</button>
          </div>
          <ol class="mobile-schedule-list">
            <li><strong>5号前（含当日）</strong><span>核对截止上月完工订单，客户已确认收货的纳入本期归集，未确认收货的顺延下期</span></li>
            <li><strong>8号前（含当日）</strong><span>上传发票</span></li>
            <li><strong>11号前（含当日）</strong><span>核对发票</span></li>
            <li><strong>15号前（含当日）</strong><span>结算打款</span></li>
          </ol>
        </section>
        <section id="mobileRecordList" class="mobile-record-list" aria-label="手机数据列表"></section>
      </div>
      <nav class="mobile-bottom-nav" aria-label="手机底部导航">
        <button id="mobileNavDataBtn" class="mobile-nav-btn active" type="button" aria-label="数据列表">
          <span class="mobile-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 6.5h14M5 12h14M5 17.5h14"></path></svg>
          </span>
          <span class="mobile-nav-label">数据</span>
        </button>
        <button id="mobileNavCreateBtn" class="mobile-nav-btn" type="button" aria-label="指派订单">
          <span class="mobile-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
          </span>
          <span class="mobile-nav-label">指派</span>
        </button>
        <button id="mobileNavAccountBtn" class="mobile-nav-btn" type="button" aria-label="账号">
          <span class="mobile-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 19c1.15-2.35 3.35-3.6 6.5-3.6s5.35 1.25 6.5 3.6"></path></svg>
          </span>
          <span class="mobile-nav-label">账号</span>
        </button>
      </nav>
    `;

    appPage.appendChild(mobileShell);
    mobileList = mobileShell.querySelector("#mobileRecordList");
    mobileCount = mobileShell.querySelector("#mobileCount");

    mobileShell.querySelector("#mobileScheduleCloseBtn")?.addEventListener("click", () => callClick(settlementScheduleToggleBtn));
    mobileShell.querySelector("#mobileNavCreateBtn")?.addEventListener("click", () => callClick(openCreateModalBtn));
    mobileShell.querySelector("#mobileNavAccountBtn")?.addEventListener("click", () => openMobileSheet("account"));
    mobileShell.querySelector("#mobileNavDataBtn")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.classList.add("mobile-ready");
    return mobileShell;
  }

  function getQuickActions() {
    return [
      { text: "新建", className: "mobile-action-btn primary", button: openCreateModalBtn },
      { text: "导出", className: "mobile-action-btn", button: exportTableBtn },
      { text: "上传发票", className: "mobile-action-btn", button: accountantInvoiceUploadBtn },
      { text: "结算", className: "mobile-action-btn", button: bossSettlementBtn },
      { text: "打款", className: "mobile-action-btn", button: bossSettlementDetailBtn },
      { text: "已上传/待结算详细", className: "mobile-action-btn", button: accountantUploadedSettlementDetailBtn },
      { text: "提醒", className: "mobile-action-btn", button: openReminderModalBtn },
    ].filter((item) => item.button && !item.button.hidden);
  }

  function renderQuickActions() {
    const wrap = mobileShell?.querySelector("#mobileQuickActions");
    if (!wrap) return;
    wrap.innerHTML = "";
    getQuickActions().forEach((item) => {
      wrap.appendChild(createButton({
        className: item.className,
        text: item.text,
        disabled: item.button.disabled,
        onClick: () => callClick(item.button),
      }));
    });
  }

  function getRowButton(recordId, selector) {
    if (!recordId) return null;
    const escapedId = window.CSS?.escape ? CSS.escape(recordId) : recordId.replace(/"/g, '\\"');
    return tableBody?.querySelector(`${selector}[data-record-id="${escapedId}"]`) || null;
  }

  function getMobileRecordActions(record) {
    const recordId = String(record?.id || "").trim();
    const actions = [];
    if (canCurrentAccountSettleRecords() && isBossSettlementRecordSelectable(record)) {
      actions.push({
        text: selectedBossRecordIds.has(recordId) ? "取消选择" : "选择结算",
        className: "mobile-row-btn primary",
        onClick: () => {
          const checkbox = getRowButton(recordId, ".row-select-checkbox");
          if (!checkbox) return;
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        },
      });
    }
    return actions.concat([
      { text: "历史", className: "mobile-row-btn", button: getRowButton(recordId, ".row-history-btn") },
      { text: "修改", className: "mobile-row-btn", button: getRowButton(recordId, ".row-edit-btn") },
      { text: "退款", className: "mobile-row-btn", button: getRowButton(recordId, ".row-refund-btn") },
      { text: "删除", className: "mobile-row-btn danger", button: getRowButton(recordId, ".row-delete-btn") },
      { text: "确认", className: "mobile-row-btn primary", button: getRowButton(recordId, ".row-check-btn") },
    ].filter((item) => item.button));
  }

  function createMeta(label, value) {
    const node = document.createElement("div");
    node.className = "mobile-meta-item";
    node.innerHTML = `<span></span><strong></strong>`;
    node.querySelector("span").textContent = label;
    node.querySelector("strong").textContent = String(value || "");
    return node;
  }

  function createMobileStatus(statusKey, statusText) {
    const status = document.createElement("span");
    status.className = `mobile-status ${statusKey}`;
    const statusParts = String(statusText || "").split("/").map((part) => part.trim()).filter(Boolean);
    if (statusParts.length > 1) {
      statusParts.forEach((part) => {
        const line = document.createElement("span");
        line.textContent = part;
        status.appendChild(line);
      });
      return status;
    }
    status.textContent = statusText;
    return status;
  }

  function createMobileRecordMoney(record) {
    const money = document.createElement("div");
    money.className = "mobile-record-money";
    const accountant = document.createElement("span");
    accountant.className = "mobile-record-accountant";
    accountant.textContent = String(record?.accountant || "未分配会计").trim();
    const amount = document.createElement("strong");
    amount.className = "mobile-record-amount";
    amount.textContent = toMoney(record?.paymentPrice);
    money.append(accountant, amount);
    return money;
  }

  function createMobileRecordMain(record) {
    const main = document.createElement("div");
    main.className = "mobile-record-main";
    const title = document.createElement("div");
    title.className = "mobile-record-title";
    title.textContent = String(record?.customer || "未填客户").trim();
    const sub = document.createElement("div");
    sub.className = "mobile-record-sub";
    sub.textContent = String(record?.summary || "").trim() || "未填写任务简介";
    main.append(title, sub);
    return main;
  }

  function createMobileRecordHead(record, { isExpanded, statusKey }) {
    const recordId = String(record?.id || "").trim();
    const head = document.createElement("button");
    head.type = "button";
    head.className = "mobile-record-head";
    head.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    head.addEventListener("click", () => {
      const shouldCollapse = expandedMobileRecordIds.has(recordId);
      expandedMobileRecordIds.clear();
      if (!shouldCollapse) {
        expandedMobileRecordIds.add(recordId);
      }
      syncMobileRecordExpansionDom();
    });

    const date = document.createElement("div");
    date.className = "mobile-record-date";
    date.textContent = formatDateDisplay(record?.date) || "-";

    const toggle = document.createElement("span");
    toggle.className = "mobile-record-toggle";
    toggle.setAttribute("aria-hidden", "true");
    toggle.textContent = "⌄";

    head.append(
      date,
      createMobileRecordMoney(record),
      createMobileRecordMain(record),
      createMobileStatus(statusKey, getRecordWorkflowStatusText(record)),
      toggle,
    );
    return head;
  }

  function createMobileRecordFinance(record) {
    const finance = document.createElement("div");
    finance.className = "mobile-record-finance";
    finance.append(
      createMeta("付款", toMoney(record?.paymentPrice)),
      createMeta("溢价", formatPremiumWithPercent(record)),
      createMeta("会计价", toMoney(record?.totalPrice)),
      createMeta("结算价", formatSettlementPriceDisplay(record)),
    );
    return finance;
  }

  function createMobileRecordMeta(record) {
    const meta = document.createElement("div");
    meta.className = "mobile-record-meta compact";
    meta.append(
      createMeta("接待", getDispatcherDisplayNameByTag(record?.dispatcher)),
      createMeta("会计", record?.accountant),
      createMeta("平台", [record?.platform, record?.shopName].filter(Boolean).join("-")),
      createMeta("来源", record?.source),
    );
    return meta;
  }

  function createMobileRecordSummary(record) {
    const summary = document.createElement("div");
    summary.className = "mobile-record-summary";
    summary.append(
      createMeta("任务简介", String(record?.summary || "").trim() || "未填写"),
      createMeta("客户反馈", String(record?.customerFeedback || "").trim() || "无"),
      createMeta("备注", String(record?.remark || "").trim() || "无"),
    );
    return summary;
  }

  function createMobileRecordActions(record) {
    const actions = document.createElement("div");
    actions.className = "mobile-record-actions";
    getMobileRecordActions(record).forEach((item) => {
      actions.appendChild(createButton({
        className: item.className,
        text: item.text,
        onClick: item.onClick || (() => callClick(item.button)),
      }));
    });
    return actions;
  }

  function createMobileRecordDetails(record, isExpanded) {
    const details = document.createElement("div");
    details.className = "mobile-record-details";
    details.setAttribute("aria-hidden", isExpanded ? "false" : "true");
    if (isExpanded) {
      details.style.maxHeight = "none";
    }
    const inner = document.createElement("div");
    inner.className = "mobile-record-details-inner";
    inner.append(
      createMobileRecordFinance(record),
      createMobileRecordMeta(record),
      createMobileRecordSummary(record),
    );
    const actions = createMobileRecordActions(record);
    if (actions.children.length) inner.appendChild(actions);
    details.appendChild(inner);
    return details;
  }

  function animateMobileRecordDetails(details, shouldExpand) {
    if (!details) return;
    if (details.mobileExpandAnimation) {
      details.mobileExpandAnimation.cancel();
      details.mobileExpandAnimation = null;
    }

    const inner = details.querySelector(".mobile-record-details-inner");
    const targetHeight = inner?.scrollHeight || details.scrollHeight || 0;
    const startHeight = shouldExpand ? 0 : details.getBoundingClientRect().height;
    const endHeight = shouldExpand ? targetHeight : 0;

    details.style.overflow = "hidden";
    details.style.maxHeight = `${startHeight}px`;

    const animation = details.animate(
      [
        {
          maxHeight: `${startHeight}px`,
          opacity: shouldExpand ? 0 : 1,
          transform: shouldExpand ? "translateY(-4px)" : "translateY(0)",
        },
        {
          maxHeight: `${endHeight}px`,
          opacity: shouldExpand ? 1 : 0,
          transform: shouldExpand ? "translateY(0)" : "translateY(-4px)",
        },
      ],
      {
        duration: 240,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      },
    );

    details.mobileExpandAnimation = animation;
    animation.onfinish = () => {
      details.mobileExpandAnimation = null;
      details.style.maxHeight = shouldExpand ? "none" : "0px";
      details.style.opacity = shouldExpand ? "1" : "";
      details.style.transform = shouldExpand ? "translateY(0)" : "";
    };
    animation.oncancel = () => {
      details.mobileExpandAnimation = null;
    };
  }

  function renderMobileRecord(record) {
    const card = document.createElement("article");
    const recordId = String(record?.id || "").trim();
    const statusKey = getRecordWorkflowStatusKey(record);
    const dispatcherTag = normalizeDispatcherTag(record?.dispatcher);
    const isCurrentDispatcher = Boolean(getCurrentDispatcherTag() && dispatcherTag === getCurrentDispatcherTag());
    const isExpanded = expandedMobileRecordIds.has(recordId);
    card.className = `mobile-record-card mobile-record-row${isCurrentDispatcher ? " is-current" : ""}${selectedBossRecordIds.has(recordId) ? " is-selected" : ""}${isExpanded ? " is-expanded" : ""}`;
    card.dataset.recordId = recordId;
    card.append(
      createMobileRecordHead(record, { isExpanded, statusKey }),
      createMobileRecordDetails(record, isExpanded),
    );
    return card;
  }

  function syncMobileRecordExpansionDom() {
    if (!mobileList) return;
    Array.from(mobileList.querySelectorAll(".mobile-record-card")).forEach((card) => {
      const recordId = String(card.dataset.recordId || "").trim();
      const isExpanded = expandedMobileRecordIds.has(recordId);
      const wasExpanded = card.classList.contains("is-expanded");
      const details = card.querySelector(".mobile-record-details");
      const head = card.querySelector(".mobile-record-head");
      if (!details) return;
      if (wasExpanded === isExpanded) {
        head?.setAttribute("aria-expanded", isExpanded ? "true" : "false");
        details.setAttribute("aria-hidden", isExpanded ? "false" : "true");
        return;
      }

      card.classList.toggle("is-expanded", isExpanded);
      head?.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      details.setAttribute("aria-hidden", isExpanded ? "false" : "true");
      animateMobileRecordDetails(details, isExpanded);
    });
  }

  function renderMobileRecords() {
    if (!ensureMobileShell() || !mobileList) return;
    const scopedRecords = getVisibleRecords();
    const filteredRecords = getFilteredRecords();
    const sortedRecords = getSortedRecords(filteredRecords);
    const scheduleCard = mobileShell.querySelector("#mobileScheduleCard");

    if (mobileAccount && mobileRole) {
      mobileAccount.textContent = getMobileAccountText();
      mobileRole.textContent = getMobileRoleText();
    }
    syncMobileDispatcherField();
    if (mobileCount) {
      mobileCount.textContent = `共 ${filteredRecords.length}/${scopedRecords.length} 条`;
    }
    if (scheduleCard) {
      scheduleCard.hidden = !(isAccountantLogin() && !isSettlementScheduleCollapsed);
    }

    mobileList.innerHTML = "";
    if (!sortedRecords.length) {
      const empty = document.createElement("div");
      empty.className = "mobile-empty";
      empty.textContent = scopedRecords.length ? "当前筛选无数据。" : "暂无数据，先录入一条。";
      mobileList.appendChild(empty);
      return;
    }
    sortedRecords.forEach((record) => {
      mobileList.appendChild(renderMobileRecord(record));
    });
  }

  function getMobileSortLabel() {
    const labelMap = {
      date: "接单日期",
      completedAt: "完工日期",
      dispatcher: "接待人",
      source: "来源",
      platform: "平台",
      shopName: "店铺名",
      orderNo: "订单号",
      customerFeedback: "客户反馈",
      accountant: "会计",
      customer: "客户",
      paymentPrice: "付款价",
      premiumPrice: "溢价",
      totalPrice: "会计价",
      settlementPrice: "会计结算价",
      checkStatus: "状态",
    };
    const label = labelMap[sortState.key] || "当前字段";
    return `${label} · ${sortState.direction === "asc" ? "升序" : "降序"}`;
  }

  function scheduleMobileRender() {
    if (renderFrame) window.cancelAnimationFrame(renderFrame);
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = 0;
      if (hasAuthenticatedAccount()) renderMobileRecords();
    });
  }

  function closeMobileSheet() {
    if (mobileSheet) mobileSheet.hidden = true;
    activeSheet = "";
    document.body.classList.remove("mobile-sheet-open");
  }

  function ensureMobileSheet() {
    if (mobileSheet) return mobileSheet;
    mobileSheet = document.createElement("section");
    mobileSheet.id = "mobileSheet";
    mobileSheet.className = "mobile-sheet";
    mobileSheet.hidden = true;
    mobileSheet.innerHTML = `
      <div class="mobile-sheet-card">
        <div class="mobile-sheet-head">
          <h2 id="mobileSheetTitle" class="mobile-sheet-title"></h2>
          <button id="mobileSheetCloseBtn" class="mobile-sheet-close" type="button" aria-label="关闭">×</button>
        </div>
        <div id="mobileSheetBody"></div>
      </div>
    `;
    document.body.appendChild(mobileSheet);
    mobileSheet.addEventListener("click", (event) => {
      if (event.target === mobileSheet) closeMobileSheet();
    });
    mobileSheet.querySelector("#mobileSheetCloseBtn")?.addEventListener("click", closeMobileSheet);
    return mobileSheet;
  }

  function renderFilterSheet(body) {
    const grid = document.createElement("div");
    grid.className = "mobile-filter-grid";
    FILTER_BUTTONS.forEach((item) => {
      const sourceButton = item.button();
      if (!sourceButton || sourceButton.hidden || sourceButton.disabled) return;
      const value = String(item.value() || "").trim();
      grid.appendChild(createButton({
        className: `mobile-filter-button${value ? " active" : ""}`,
        text: item.label,
        onClick: () => {
          closeMobileSheet();
          sourceButton.click();
        },
      }));
      grid.lastElementChild.appendChild(Object.assign(document.createElement("span"), {
        className: "mobile-filter-value",
        textContent: value || "全部",
      }));
    });
    if (!clearFilterBtn.hidden) {
      grid.appendChild(createButton({
        className: "mobile-panel-button",
        text: "清空筛选",
        onClick: () => {
          closeMobileSheet();
          callClick(clearFilterBtn);
        },
      }));
    }
    body.appendChild(grid);
  }

  function renderActionsSheet(body) {
    const grid = document.createElement("div");
    grid.className = "mobile-action-grid";
    [
      { text: "排序", action: () => openMobileSheet("sort") },
      { text: "管理接待", button: openDispatcherModalBtn },
      { text: "管理会计", button: openAccountantModalBtn },
      { text: "分析数据", button: openAnalysisModalBtn },
      { text: "回收站", button: openRecycleModalBtn },
      { text: "提醒", button: openReminderModalBtn },
      { text: "结算申报信息录入", button: invoiceRecipientInfoBtn },
      { text: "更新日志", button: openChangeLogBtn },
    ].forEach((item) => {
      if (!item.action && (!item.button || item.button.hidden || item.button.disabled)) return;
      grid.appendChild(createButton({
        className: "mobile-panel-button",
        text: item.text,
        onClick: () => {
          closeMobileSheet();
          if (item.action) {
            item.action();
            return;
          }
          callClick(item.button);
        },
      }));
    });
    body.appendChild(grid);
  }

  function renderSortSheet(body) {
    const grid = document.createElement("div");
    grid.className = "mobile-action-grid";
    [
      { key: "date", label: "接单日期" },
      { key: "completedAt", label: "完工日期" },
      { key: "dispatcher", label: "接待人" },
      { key: "accountant", label: "会计" },
      { key: "customer", label: "客户" },
      { key: "paymentPrice", label: "付款价" },
      { key: "premiumPrice", label: "溢价" },
      { key: "totalPrice", label: "会计价" },
      { key: "settlementPrice", label: "会计结算价" },
      { key: "source", label: "来源" },
      { key: "platform", label: "平台" },
      { key: "shopName", label: "店铺名" },
      { key: "orderNo", label: "订单号" },
      { key: "customerFeedback", label: "客户反馈" },
      { key: "checkStatus", label: "状态" },
    ].forEach((item) => {
      const active = sortState.key === item.key;
      const direction = active ? (sortState.direction === "asc" ? "升序" : "降序") : "";
      const button = createButton({
        className: `mobile-panel-button${active ? " active" : ""}`,
        text: item.label,
        onClick: () => {
          closeMobileSheet();
          toggleSort(item.key);
        },
      });
      const meta = document.createElement("span");
      meta.className = "mobile-filter-value";
      meta.textContent = direction || "点击排序";
      button.appendChild(meta);
      grid.appendChild(button);
    });
    body.appendChild(grid);
  }

  function renderAccountSheet(body) {
    const panel = document.createElement("section");
    panel.className = "mobile-panel-card";
    panel.innerHTML = `
      <div class="mobile-record-meta">
        <div class="mobile-meta-item"><span>账号</span><strong>${escapeHtml(getMobileAccountText())}</strong></div>
        <div class="mobile-meta-item"><span>角色</span><strong>${escapeHtml(getMobileRoleText())}</strong></div>
      </div>
      <div class="mobile-action-grid" style="margin-top: 12px;"></div>
    `;
    const grid = panel.querySelector(".mobile-action-grid");
    [
      { text: "修改密码", button: changePasswordBtn },
      { text: "修改个人信息", button: editProfileBtn },
      { text: "退出登录", button: switchAccountBtn },
    ].forEach((item) => {
      if (!item.button || item.button.hidden || item.button.disabled) return;
      grid.appendChild(createButton({
        className: "mobile-panel-button",
        text: item.text,
        onClick: () => {
          closeMobileSheet();
          callClick(item.button);
        },
      }));
    });
    body.appendChild(panel);
  }

  function openMobileSheet(kind) {
    ensureMobileSheet();
    activeSheet = kind;
    const title = mobileSheet.querySelector("#mobileSheetTitle");
    const body = mobileSheet.querySelector("#mobileSheetBody");
    body.innerHTML = "";
    title.textContent = kind === "filter" ? "筛选" : kind === "account" ? "账号" : kind === "sort" ? "排序" : "更多操作";
    if (kind === "filter") renderFilterSheet(body);
    if (kind === "actions") renderActionsSheet(body);
    if (kind === "account") renderAccountSheet(body);
    if (kind === "sort") renderSortSheet(body);
    mobileSheet.hidden = false;
    document.body.classList.add("mobile-sheet-open");
  }

  function getMobileHeaderLabel(th) {
    if (!th) return "";
    const preferred = th.querySelector(".settlement-detail-sort-label, .sort-btn-label, .sort-btn")?.textContent;
    return String(preferred || th.textContent || "").replace(/\s+/g, " ").trim();
  }

  function enhanceMobileTables(root = document) {
    if (!document.body?.classList.contains("mobile-app")) return;
    const tables = Array.from(root.querySelectorAll?.(
      ".modal-card table, .accountant-table, .dispatcher-table, .recycle-table, .settlement-detail-table, .analysis-table",
    ) || []);
    tables.forEach((table) => {
      if (!table.closest(".modal-card") && !table.matches(".accountant-table, .dispatcher-table, .recycle-table, .settlement-detail-table, .analysis-table")) {
        return;
      }
      const headers = Array.from(table.querySelectorAll("thead th")).map(getMobileHeaderLabel);
      table.classList.add("mobile-card-table");
      Array.from(table.querySelectorAll("tbody tr")).forEach((row) => {
        Array.from(row.children || []).forEach((cell, index) => {
          const label = headers[index] || cell.dataset.mobileLabel || cell.dataset.label || "";
          if (label) cell.dataset.mobileLabel = label;
        });
      });
    });
  }

  function enhanceRecordHistoryGrids(root = document) {
    if (!document.body?.classList.contains("mobile-app")) return;
    const grids = Array.from(root.querySelectorAll?.(".record-history-grid-table") || []);
    grids.forEach((grid) => {
      const headRow = grid.querySelector(".record-history-grid-row.head");
      const headerLabels = Array.from(headRow?.children || []).map((cell) => String(cell.textContent || "").replace(/\s+/g, " ").trim());
      grid.classList.add("mobile-history-grid");
      Array.from(grid.querySelectorAll(".record-history-grid-row:not(.head)")).forEach((row) => {
        Array.from(row.children || []).forEach((cell, index) => {
          const label = headerLabels[index] || cell.dataset.mobileLabel || cell.dataset.field || "";
          if (label) cell.dataset.mobileLabel = label;
        });
      });
    });
  }

  function scheduleMobileEnhance(root = document) {
    if (enhanceFrame) window.cancelAnimationFrame(enhanceFrame);
    enhanceFrame = window.requestAnimationFrame(() => {
      enhanceFrame = 0;
      enhanceMobileTables(root);
      enhanceRecordHistoryGrids(root);
    });
  }

  function startMobileEnhancer() {
    if (mobileMutationObserver) return;
    mobileMutationObserver = new MutationObserver(() => scheduleMobileEnhance(document));
    mobileMutationObserver.observe(document.body, { childList: true, subtree: true });
    scheduleMobileEnhance(document);
  }

  const originalRenderTable = renderTable;
  renderTable = function renderTableWithMobileShell(...args) {
    const result = originalRenderTable.apply(this, args);
    scheduleMobileRender();
    scheduleMobileEnhance(document);
    return result;
  };

  const originalSetPageMode = setPageMode;
  setPageMode = function setPageModeWithMobileShell(isLoggedIn, ...args) {
    const result = originalSetPageMode.call(this, isLoggedIn, ...args);
    if (isLoggedIn) {
      ensureMobileShell();
      startMobileEnhancer();
      scheduleMobileRender();
      scheduleMobileEnhance(document);
    } else {
      closeMobileSheet();
      document.body.classList.remove("mobile-ready");
      if (mobileShell) mobileShell.remove();
      mobileShell = null;
      mobileList = null;
    }
    return result;
  };

  document.addEventListener("click", () => {
    if (activeSheet) scheduleMobileRender();
  }, true);

  openCreateModalBtn?.addEventListener("click", () => {
    window.requestAnimationFrame(syncMobileDispatcherField);
    window.requestAnimationFrame(syncMobileRecordSubmitText);
  });
})();
