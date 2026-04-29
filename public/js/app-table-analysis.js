// Table & Analysis: date/status formatting, sorting/filtering, analytics aggregations and panel rendering.
    let analysisTrendChartInstance = null;
    let analysisTrendChartRenderFrame = 0;

    function parseDateValue(rawDate) {
      const source = String(rawDate || "").trim();
      let match = source.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
      if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
      }

      match = source.match(/^(\d{1,2})月(\d{1,2})日$/);
      if (match) {
        const year = new Date().getFullYear();
        return new Date(year, Number(match[1]) - 1, Number(match[2])).getTime();
      }

      return Number.NaN;
    }

    function formatDateDisplay(rawDate) {
      const source = String(rawDate || "").trim();
      let match = source.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
      if (match) {
        return `${Number(match[2])}月${Number(match[3])}日`;
      }

      match = source.match(/^(\d{1,2})月(\d{1,2})日$/);
      if (match) {
        return `${Number(match[1])}月${Number(match[2])}日`;
      }

      const timestamp = typeof parseDateTimeValue === "function"
        ? parseDateTimeValue(source)
        : Date.parse(source);
      if (!Number.isNaN(timestamp)) {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }

      return source;
    }

    function getDateMonthKey(rawDate) {
      const timestamp = parseDateValue(rawDate);
      if (Number.isNaN(timestamp)) return "";
      return toMonthLabel(timestamp);
    }

    function getDateDayKey(rawDate) {
      const timestamp = parseDateValue(rawDate);
      if (Number.isNaN(timestamp)) return "";
      return toDayLabel(timestamp);
    }

    function getTodayFilterValue() {
      return "__today__";
    }

    function getCurrentMonthFilterValue() {
      return toMonthLabel(Date.now());
    }

    function isTodayFilterValue(rawValue) {
      return String(rawValue || "").trim() === getTodayFilterValue();
    }

    function formatDateFilterOptionLabel(rawValue) {
      const source = String(rawValue || "").trim();
      if (!source) return "";
      if (isTodayFilterValue(source)) return "当天";
      if (source === getCurrentMonthFilterValue()) return "当月";
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

    function normalizeDateFilterInputValue(rawValue) {
      const source = String(rawValue || "").trim();
      if (!source) return "";
      const timestamp = parseDateValue(source);
      if (Number.isNaN(timestamp)) return "";
      return toDayLabel(timestamp);
    }

    function getNormalizedDateRangeFilter(startRaw, endRaw) {
      let start = normalizeDateFilterInputValue(startRaw);
      let end = normalizeDateFilterInputValue(endRaw);
      if (start && end && start > end) {
        [start, end] = [end, start];
      }
      return { start, end };
    }

    function hasDateFilterSelected(dateState = filterState) {
      const month = String(dateState?.month || "").trim();
      if (month) return true;
      const normalizedRange = getNormalizedDateRangeFilter(dateState?.dateStart, dateState?.dateEnd);
      return Boolean(normalizedRange.start || normalizedRange.end);
    }

    function formatCompactDayFilterLabel(rawValue) {
      const timestamp = parseDateValue(rawValue);
      if (Number.isNaN(timestamp)) return String(rawValue || "").trim();
      const date = new Date(timestamp);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    function getDateFilterChipMeta(monthRaw = filterState.month, startRaw = filterState.dateStart, endRaw = filterState.dateEnd) {
      const month = String(monthRaw || "").trim();
      if (month) {
        const label = formatDateFilterOptionLabel(month);
        return { label, title: label };
      }

      const normalizedRange = getNormalizedDateRangeFilter(startRaw, endRaw);
      const { start, end } = normalizedRange;
      if (!start && !end) {
        return { label: "", title: "" };
      }
      if (start && end) {
        if (start === end) {
          return {
            label: formatCompactDayFilterLabel(start),
            title: start
          };
        }
        return {
          label: `${formatCompactDayFilterLabel(start)}-${formatCompactDayFilterLabel(end)}`,
          title: `${start} 至 ${end}`
        };
      }
      if (start) {
        return {
          label: `${formatCompactDayFilterLabel(start)}起`,
          title: `${start} 起`
        };
      }
      return {
        label: `至${formatCompactDayFilterLabel(end)}`,
        title: `至 ${end}`
      };
    }

    function isDateFilterMatched(rawDate, filterValueRaw, startRaw = "", endRaw = "") {
      const filterValue = String(filterValueRaw || "").trim();
      if (filterValue) {
        if (isTodayFilterValue(filterValue)) {
          return getDateDayKey(rawDate) === toDayLabel(Date.now());
        }
        return getDateMonthKey(rawDate) === filterValue;
      }

      const normalizedRange = getNormalizedDateRangeFilter(startRaw, endRaw);
      if (!normalizedRange.start && !normalizedRange.end) {
        return true;
      }
      const dayKey = getDateDayKey(rawDate);
      if (!dayKey) return false;
      if (normalizedRange.start && dayKey < normalizedRange.start) return false;
      if (normalizedRange.end && dayKey > normalizedRange.end) return false;
      return true;
    }

    function normalizeDispatcherTag(rawValue) {
      const source = String(rawValue || "").trim();
      if (!source) return "";
      const lower = source.toLowerCase();
      if (lower === "开心财税") return "开心财税";
      const upper = lower.toUpperCase();
      if (DISPATCHER_TAGS.includes(upper)) return upper;
      if (lower.includes("财税a")) return "A";
      if (lower.includes("财税c")) return "C";
      if (lower.includes("财税e")) return "E";
      if (lower.includes("财税k")) return "K";
      if (lower.includes("财税1")) return "1";
      return source;
    }

    function normalizeRecordCheckStatus(rawValue) {
      const status = String(rawValue || "").trim().toLowerCase();
      if (status === "partial_refunded" || status === "部分退款") return "partial_refunded";
      if (status === "refunded" || status === "退款") return "refunded";
      if (status === "completed" || status === "已完成" || status.includes("待结算")) return "completed";
      if (status === "checked" || status === "已确认" || status.includes("待完成")) return "checked";
      if (status === "returned" || status === "已退单") return "returned";
      return "pending";
    }

    function getRecordCheckStatusLabel(record) {
      const status = normalizeRecordCheckStatus(record?.checkStatus);
      return getRecordWorkflowStatusLabelByKey(status);
    }

    function parseDateOrDateTimeValue(rawValue) {
      const source = String(rawValue || "").trim();
      if (!source) return Number.NaN;
      const timestamp = typeof parseDateTimeValue === "function"
        ? parseDateTimeValue(source)
        : Date.parse(source);
      if (!Number.isNaN(timestamp)) return timestamp;
      return parseDateValue(source);
    }

    function toStartOfDay(timestamp) {
      const date = new Date(timestamp);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    function getElapsedDaysFromNow(startTimestamp) {
      if (!Number.isFinite(startTimestamp)) return 0;
      const oneDayMs = 24 * 60 * 60 * 1000;
      const todayStart = toStartOfDay(Date.now());
      const startDay = toStartOfDay(startTimestamp);
      const diff = Math.floor((todayStart - startDay) / oneDayMs);
      return diff > 0 ? diff : 0;
    }

    function getCheckedStatusElapsedDays(record) {
      const checkedAt = parseDateOrDateTimeValue(record?.checkedAt);
      if (Number.isFinite(checkedAt)) {
        return getElapsedDaysFromNow(checkedAt);
      }
      const dateValue = parseDateOrDateTimeValue(record?.date);
      if (Number.isFinite(dateValue)) {
        return getElapsedDaysFromNow(dateValue);
      }
      const createdAt = parseDateOrDateTimeValue(record?.createdAt);
      if (Number.isFinite(createdAt)) {
        return getElapsedDaysFromNow(createdAt);
      }
      return 0;
    }

    function getRecordStatusChipText(record, options = {}) {
      const status = normalizeRecordCheckStatus(record?.checkStatus);
      const shouldShowElapsedDays = options.showElapsedDays !== false;
      if (status === "checked" && shouldShowElapsedDays) {
        const elapsedDays = getCheckedStatusElapsedDays(record);
        return `${getRecordCheckStatusLabel(record)} ${elapsedDays}天`;
      }
      return getRecordCheckStatusLabel(record);
    }

    function getDefaultDispatcherTag() {
      return getDispatcherTagForAccount(currentAccount) || "1";
    }

    function getCurrentDispatcherTag() {
      if (!isDispatcherLogin()) return "";
      return getDispatcherTagForAccount(currentAccount);
    }

    function setDispatcherTag(tagValue) {
      const normalized = normalizeDispatcherTag(tagValue);
      dispatcherInput.value = normalized;
      dispatcherTagButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.dispatcherTag === normalized);
      });
    }

    function getSortValue(item, key) {
      if (key === "premiumPrice") {
        return getPremiumValue(item);
      }
      if (key === "profitPrice") {
        return getProfitValue(item);
      }
      if (key === "paymentPrice" || key === "totalPrice" || key === "settlementPrice") {
        return Number(item[key]);
      }
      if (key === "date") {
        return parseDateValue(item.date);
      }
      if (key === "dispatcher") {
        return normalizeDispatcherTag(item.dispatcher);
      }
      if (key === "checkStatus") {
        const status = getRecordWorkflowStatusKey(item);
        if (status === "checked") return 1;
        if (status === "completed") return 2;
        if (status === "partial_refunded") return 2.5;
        if (status === "settled") return 3;
        if (status === "uploaded") return 4;
        if (status === "returned") return 5;
        if (status === "refunded") return 6;
        return 0;
      }
      if (key === "settled") {
        if (getRecordWorkflowStatusKey(item) === "settled") return 2;
        if (getRecordWorkflowStatusKey(item) === "uploaded") return 3;
        if (!isRecordCompleted(item)) return 0;
        if (isRecordInvoiceUploaded(item)) return 3;
        if (isRecordSettled(item)) return 2;
        return 1;
      }
      return String(item[key] || "").trim();
    }

    function compareSortValue(a, b) {
      const aNumber = typeof a === "number" && !Number.isNaN(a);
      const bNumber = typeof b === "number" && !Number.isNaN(b);
      if (aNumber && bNumber) return a - b;
      return String(a).localeCompare(String(b), "zh-CN", { numeric: true, sensitivity: "base" });
    }

    function compareSummaryRowsByCount(left, right) {
      const countGap = right.count - left.count;
      if (countGap !== 0) return countGap;
      const settlementGap = right.settlement - left.settlement;
      if (settlementGap !== 0) return settlementGap;
      return String(left.key || "").localeCompare(String(right.key || ""), "zh-CN", {
        numeric: true,
        sensitivity: "base"
      });
    }

    function compareCoopRowsByCount(left, right) {
      const countGap = right.count - left.count;
      if (countGap !== 0) return countGap;
      const settlementGap = right.settlement - left.settlement;
      if (settlementGap !== 0) return settlementGap;
      const dispatcherGap = String(left.dispatcher || "").localeCompare(String(right.dispatcher || ""), "zh-CN", {
        numeric: true,
        sensitivity: "base"
      });
      if (dispatcherGap !== 0) return dispatcherGap;
      return String(left.accountant || "").localeCompare(String(right.accountant || ""), "zh-CN", {
        numeric: true,
        sensitivity: "base"
      });
    }

    function getColumnTotal(sourceRecords, key) {
      if (key === "profitPrice") {
        return getProfitTotal(sourceRecords);
      }
      return sourceRecords.reduce((sum, item) => {
        let value = Number(item[key]);
        if (key === "premiumPrice") {
          value = getPremiumValue(item);
        }
        return Number.isFinite(value) ? sum + value : sum;
      }, 0);
    }

    function getSortedRecords(sourceRecords) {
      if (!sortState.key) return sourceRecords;

      const directionFactor = sortState.direction === "asc" ? 1 : -1;
      const accountantCountMap = sortState.key === "accountant"
        ? buildValueCountMap(sourceRecords, (item) => String(item.accountant || "").trim())
        : null;
      return sourceRecords
        .map((item, index) => ({ item, index }))
        .sort((left, right) => {
          if (sortState.key === "accountant" && accountantCountMap) {
            const leftName = String(left.item.accountant || "").trim();
            const rightName = String(right.item.accountant || "").trim();
            const leftCount = accountantCountMap.get(leftName) || 0;
            const rightCount = accountantCountMap.get(rightName) || 0;
            const countCompare = leftCount - rightCount;
            if (countCompare !== 0) return countCompare * directionFactor;
            const nameCompare = leftName.localeCompare(rightName, "zh-CN", {
              numeric: true,
              sensitivity: "base"
            });
            if (nameCompare !== 0) return nameCompare * directionFactor;
            const settlementCompare = compareSortValue(
              toNumber(left.item.settlementPrice),
              toNumber(right.item.settlementPrice)
            );
            if (settlementCompare !== 0) return settlementCompare * directionFactor;
            return left.index - right.index;
          }
          const leftValue = getSortValue(left.item, sortState.key);
          const rightValue = getSortValue(right.item, sortState.key);
          const compare = compareSortValue(leftValue, rightValue);
          if (compare !== 0) return compare * directionFactor;
          return left.index - right.index;
        })
        .map((entry) => entry.item);
    }

    function updateSortHeaderUI(sourceRecords = []) {
      const profitBreakdown = getProfitTotalBreakdown(sourceRecords);
      sortableHeaders.forEach((button) => {
        const key = button.dataset.key;
        const label = button.dataset.label || "";
        const active = key === sortState.key;
        let arrow = "";
        if (active) {
          arrow = sortState.direction === "asc" ? " ↑" : " ↓";
        }
        button.classList.toggle("active", active);
        const labelNode = document.createElement("span");
        labelNode.className = "sort-btn-label";
        labelNode.textContent = `${label}${arrow}`;
        if (
          key === "paymentPrice"
          || key === "totalPrice"
          || key === "premiumPrice"
          || key === "settlementPrice"
          || key === "profitPrice"
        ) {
          const total = toMoney(getColumnTotal(sourceRecords, key));
          const metaNode = document.createElement("span");
          metaNode.className = "sort-btn-meta";
          if (key === "totalPrice" && Number.isFinite(profitBreakdown.totalBase)) {
            metaNode.textContent = `合计 ${total}（${toMoney(profitBreakdown.totalBase)}）`;
            metaNode.title = [
              `会计价合计：${total}`,
              `接待收益基础部分：${toMoney(profitBreakdown.totalBase)}`,
              formatProfitTotalTooltip(sourceRecords)
            ].filter(Boolean).join("\n");
          } else if (key === "premiumPrice" && Number.isFinite(profitBreakdown.premiumProfit)) {
            metaNode.textContent = `合计 ${total}（${toMoney(profitBreakdown.premiumProfit)}）`;
            metaNode.title = [
              `溢价合计：${total}`,
              `接待收益溢价部分：${toMoney(profitBreakdown.premiumProfit)}`,
              formatProfitTotalTooltip(sourceRecords)
            ].filter(Boolean).join("\n");
          } else {
            metaNode.textContent = `合计 ${total}`;
            metaNode.title = key === "profitPrice"
              ? formatProfitTotalTooltip(sourceRecords)
              : `合计：${total}`;
          }
          button.replaceChildren(labelNode, metaNode);
          return;
        }
        button.replaceChildren(labelNode);
      });
    }

    function toggleSort(key) {
      if (!key) return;
      if (key === "profitPrice" && !shouldShowProfitColumn()) return;
      if (sortState.key === key) {
        sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
      } else {
        sortState.key = key;
        sortState.direction = "asc";
      }
      closeAllFilterPopovers();
      renderTable();
    }

    function buildValueCountMap(sourceRecords, pickValue) {
      const map = new Map();
      sourceRecords.forEach((item) => {
        const value = String(pickValue(item) || "").trim();
        if (!value) return;
        map.set(value, (map.get(value) || 0) + 1);
      });
      return map;
    }

    function getPlatformFilterValue(item) {
      return String(item.platform || "").trim();
    }

    function getShopNameFilterValue(item) {
      return String(item.shopName || "").trim();
    }

    function getSourceFilterValue(item) {
      return String(item.source || "").trim();
    }

    function sortFilterValuesByCount(values, countMap) {
      return [...values].sort((left, right) => {
        const countGap = (countMap.get(right) || 0) - (countMap.get(left) || 0);
        if (countGap !== 0) return countGap;
        return left.localeCompare(right, "zh-CN", { numeric: true, sensitivity: "base" });
      });
    }

    function buildFilterOptionList(listElement, values, type, selectedValue, countMap) {
      listElement.innerHTML = "";

      values.forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-option-btn";
        button.dataset.filterType = type;
        button.dataset.filterValue = value;
        const count = countMap.get(value) || 0;
        const label = document.createElement("span");
        label.className = "filter-option-label";
        label.textContent = type === "month" ? formatDateFilterOptionLabel(value) : value;
        const countBadge = document.createElement("span");
        countBadge.className = "filter-option-count";
        countBadge.textContent = String(count);
        button.appendChild(label);
        button.appendChild(countBadge);
        button.classList.toggle("active", selectedValue === value);
        listElement.appendChild(button);
      });
    }

    function updateFilterOptions() {
      const scopedRecords = getVisibleRecords();
      const rawMonthValues = Array.from(
        new Set(scopedRecords.map((item) => getDateMonthKey(item.date)).filter(Boolean))
      ).sort((left, right) => right.localeCompare(left, "zh-CN", { numeric: true, sensitivity: "base" }));
      const monthValues = [getTodayFilterValue(), ...rawMonthValues];

      const dispatcherValues = Array.from(
        new Set(scopedRecords.map((item) => normalizeDispatcherTag(item.dispatcher)))
      ).sort((left, right) => DISPATCHER_TAGS.indexOf(left) - DISPATCHER_TAGS.indexOf(right));

      const rawAccountantValues = Array.from(
        new Set(scopedRecords.map((item) => String(item.accountant || "").trim()).filter(Boolean))
      );
      const rawPlatformValues = Array.from(
        new Set(scopedRecords.map((item) => getPlatformFilterValue(item)).filter(Boolean))
      );
      const rawShopValues = Array.from(
        new Set(scopedRecords.map((item) => getShopNameFilterValue(item)).filter(Boolean))
      );
      const rawSourceValues = Array.from(
        new Set(scopedRecords.map((item) => getSourceFilterValue(item)).filter(Boolean))
      );
      const rawStatusValues = Array.from(
        new Set(scopedRecords.map((item) => getRecordWorkflowStatusFilterLabel(item)))
      );
      const statusValues = ["已接待/待确认", "已确认/待完成", "已完成/待结算", "部分退款", "已结算/待上传", "已上传/待打款", "已打款", "退款", "已退单"]
        .filter((value) => rawStatusValues.includes(value));
      const rawSettledValues = Array.from(
        new Set(scopedRecords.map((item) => getRecordSettlementFilterLabel(item)).filter(Boolean))
      );
      const settledValues = ["已完成/待结算", "已结算/待上传", "已上传/待打款", "已打款"]
        .filter((value) => rawSettledValues.includes(value));

      if (filterState.month && !monthValues.includes(filterState.month)) {
        filterState.month = "";
      }
      if (filterState.dispatcher && !dispatcherValues.includes(filterState.dispatcher)) {
        filterState.dispatcher = "";
      }
      if (filterState.platform && !rawPlatformValues.includes(filterState.platform)) {
        filterState.platform = "";
      }
      if (filterState.shopName && !rawShopValues.includes(filterState.shopName)) {
        filterState.shopName = "";
      }
      if (filterState.source && !rawSourceValues.includes(filterState.source)) {
        filterState.source = "";
      }
      if (filterState.status && !statusValues.includes(filterState.status)) {
        filterState.status = "";
      }
      if (filterState.settled && !settledValues.includes(filterState.settled)) {
        filterState.settled = "";
      }

      const filterMatchers = {
        month: (item) => isDateFilterMatched(item.date, filterState.month, filterState.dateStart, filterState.dateEnd),
        dispatcher: (item) => !filterState.dispatcher
          || normalizeDispatcherTag(item.dispatcher) === filterState.dispatcher,
        accountant: (item) => !filterState.accountant
          || String(item.accountant || "").trim() === filterState.accountant,
        platform: (item) => !filterState.platform || getPlatformFilterValue(item) === filterState.platform,
        shopName: (item) => !filterState.shopName || getShopNameFilterValue(item) === filterState.shopName,
        source: (item) => !filterState.source || getSourceFilterValue(item) === filterState.source,
        status: (item) => !filterState.status || getRecordWorkflowStatusFilterLabel(item) === filterState.status,
        settled: (item) => !filterState.settled || getRecordSettlementFilterLabel(item) === filterState.settled
      };
      const getScopedRecordsByFilter = (excludedKey) => scopedRecords.filter((item) => (
        Object.entries(filterMatchers).every(([key, matcher]) => key === excludedKey || matcher(item))
      ));
      const monthScopedRecords = getScopedRecordsByFilter("month");
      const dispatcherScopedRecords = getScopedRecordsByFilter("dispatcher");
      const accountantScopedRecords = getScopedRecordsByFilter("accountant");
      const platformScopedRecords = getScopedRecordsByFilter("platform");
      const shopScopedRecords = getScopedRecordsByFilter("shopName");
      const sourceScopedRecords = getScopedRecordsByFilter("source");
      const statusScopedRecords = getScopedRecordsByFilter("status");
      const settledScopedRecords = getScopedRecordsByFilter("settled");
      const monthCountMap = buildValueCountMap(
        monthScopedRecords,
        (item) => getDateMonthKey(item.date)
      );
      monthCountMap.set(
        getTodayFilterValue(),
        monthScopedRecords.filter((item) => getDateDayKey(item.date) === toDayLabel(Date.now())).length
      );
      const dispatcherCountMap = buildValueCountMap(
        dispatcherScopedRecords,
        (item) => normalizeDispatcherTag(item.dispatcher)
      );
      const accountantCountMap = buildValueCountMap(
        accountantScopedRecords,
        (item) => String(item.accountant || "").trim()
      );
      const platformCountMap = buildValueCountMap(
        platformScopedRecords,
        (item) => getPlatformFilterValue(item)
      );
      const shopCountMap = buildValueCountMap(
        shopScopedRecords,
        (item) => getShopNameFilterValue(item)
      );
      const sourceCountMap = buildValueCountMap(
        sourceScopedRecords,
        (item) => getSourceFilterValue(item)
      );
      const statusCountMap = buildValueCountMap(
        statusScopedRecords,
        (item) => getRecordWorkflowStatusFilterLabel(item)
      );
      const settledCountMap = buildValueCountMap(
        settledScopedRecords,
        (item) => getRecordSettlementFilterLabel(item)
      );
      const accountantValues = sortFilterValuesByCount(rawAccountantValues, accountantCountMap);
      const platformValues = sortFilterValuesByCount(rawPlatformValues, platformCountMap);
      const shopValues = sortFilterValuesByCount(rawShopValues, shopCountMap);
      const sourceValues = sortFilterValuesByCount(rawSourceValues, sourceCountMap);

      if (filterState.accountant && !accountantValues.includes(filterState.accountant)) {
        filterState.accountant = "";
      }

      buildFilterOptionList(
        filterMonthList,
        monthValues,
        "month",
        filterState.month,
        monthCountMap
      );
      buildFilterOptionList(
        filterDispatcherList,
        dispatcherValues,
        "dispatcher",
        filterState.dispatcher,
        dispatcherCountMap
      );
      buildFilterOptionList(
        filterAccountantList,
        accountantValues,
        "accountant",
        filterState.accountant,
        accountantCountMap
      );
      buildFilterOptionList(
        filterPlatformList,
        platformValues,
        "platform",
        filterState.platform,
        platformCountMap
      );
      buildFilterOptionList(
        filterShopList,
        shopValues,
        "shopName",
        filterState.shopName,
        shopCountMap
      );
      buildFilterOptionList(
        filterSourceList,
        sourceValues,
        "source",
        filterState.source,
        sourceCountMap
      );
      buildFilterOptionList(
        filterStatusList,
        statusValues,
        "status",
        filterState.status,
        statusCountMap
      );
      buildFilterOptionList(
        filterSettledList,
        settledValues,
        "settled",
        filterState.settled,
        settledCountMap
      );
      updateFilterButtonUI();
    }

    function getFilteredRecords() {
      const scopedRecords = getVisibleRecords();
      return scopedRecords.filter((item) => {
        const monthMatched = isDateFilterMatched(item.date, filterState.month, filterState.dateStart, filterState.dateEnd);
        const dispatcherMatched = !filterState.dispatcher
          || normalizeDispatcherTag(item.dispatcher) === filterState.dispatcher;
        const accountantMatched = !filterState.accountant
          || String(item.accountant || "").trim() === filterState.accountant;
        const platformMatched = !filterState.platform || getPlatformFilterValue(item) === filterState.platform;
        const shopMatched = !filterState.shopName || getShopNameFilterValue(item) === filterState.shopName;
        const sourceMatched = !filterState.source || getSourceFilterValue(item) === filterState.source;
        const statusMatched = !filterState.status || getRecordWorkflowStatusFilterLabel(item) === filterState.status;
        const settledMatched = !filterState.settled || getRecordSettlementFilterLabel(item) === filterState.settled;
        return monthMatched
          && dispatcherMatched
          && accountantMatched
          && platformMatched
          && shopMatched
          && sourceMatched
          && statusMatched
          && settledMatched;
      });
    }

    function escapeHtml(rawText) {
      return String(rawText)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function toNumber(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    }

    function formatPercent(value, digits = 1) {
      if (!Number.isFinite(value)) return "0%";
      return `${(value * 100).toFixed(digits)}%`;
    }

    function formatCount(value) {
      return Number(value || 0).toLocaleString("zh-CN");
    }

    function formatCurrency(value) {
      return toNumber(value).toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    function median(values) {
      if (!values.length) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 1) return sorted[middle];
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    function quantile(values, q) {
      if (!values.length) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const position = (sorted.length - 1) * q;
      const base = Math.floor(position);
      const rest = position - base;
      const next = sorted[base + 1];
      return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
    }

    function stddev(values) {
      if (!values.length) return 0;
      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
      return Math.sqrt(variance);
    }

    function pearsonCorrelation(xValues, yValues) {
      const n = Math.min(xValues.length, yValues.length);
      if (n < 2) return 0;

      const x = xValues.slice(0, n);
      const y = yValues.slice(0, n);
      const avgX = x.reduce((sum, value) => sum + value, 0) / n;
      const avgY = y.reduce((sum, value) => sum + value, 0) / n;

      let numerator = 0;
      let denomX = 0;
      let denomY = 0;
      for (let i = 0; i < n; i += 1) {
        const dx = x[i] - avgX;
        const dy = y[i] - avgY;
        numerator += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
      }
      const denominator = Math.sqrt(denomX * denomY);
      if (!denominator) return 0;
      return numerator / denominator;
    }

    function formatMoM(current, previous) {
      if (!Number.isFinite(current) || !Number.isFinite(previous)) return "--";
      if (previous === 0) return current === 0 ? "0.0%" : "新增";
      const value = (current - previous) / previous;
      const prefix = value > 0 ? "+" : "";
      return `${prefix}${(value * 100).toFixed(1)}%`;
    }

    function toWeekdayLabel(timestamp) {
      const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const date = new Date(timestamp);
      return labels[date.getDay()] || "未知";
    }

    function toMonthLabel(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    function toDayLabel(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function summarizeBy(recordsSource, keyResolver) {
      const groups = new Map();
      recordsSource.forEach((item) => {
        const key = String(keyResolver(item) || "未分类");
        const total = toNumber(item.totalPrice);
        const settlement = toNumber(item.settlementPrice);
        const bucket = groups.get(key) || { key, count: 0, total: 0, settlement: 0 };
        bucket.count += 1;
        bucket.total += total;
        bucket.settlement += settlement;
        groups.set(key, bucket);
      });
      return Array.from(groups.values()).map((row) => {
        const ratio = row.total > 0 ? row.settlement / row.total : 0;
        return {
          ...row,
          margin: row.total - row.settlement,
          ratio,
          avgTotal: row.count ? row.total / row.count : 0
        };
      });
    }

    function buildBandRows(values, edges, labels) {
      const rows = labels.map((label) => ({ label, count: 0 }));
      values.forEach((value) => {
        for (let i = 0; i < edges.length - 1; i += 1) {
          const left = edges[i];
          const right = edges[i + 1];
          if (value >= left && value < right) {
            rows[i].count += 1;
            break;
          }
        }
      });
      return rows;
    }

    function buildCoopRows(scopeRecords) {
      const map = new Map();
      scopeRecords.forEach((item) => {
        const dispatcher = normalizeDispatcherTag(item.dispatcher);
        const accountant = String(item.accountant || "").trim() || "未填";
        const key = `${dispatcher}|${accountant}`;
        const bucket = map.get(key) || {
          dispatcher,
          accountant,
          count: 0,
          total: 0,
          settlement: 0
        };
        bucket.count += 1;
        bucket.total += toNumber(item.totalPrice);
        bucket.settlement += toNumber(item.settlementPrice);
        map.set(key, bucket);
      });

      return Array.from(map.values())
        .map((row) => ({
          ...row,
          ratio: row.total > 0 ? row.settlement / row.total : 0
        }))
        .sort(compareCoopRowsByCount);
    }

    function buildKeywordRows(scopeRecords) {
      const keywords = [
        "利润表", "利润", "对账", "抖音", "视频号", "拼多多", "补账", "建账",
        "进销存", "运费", "统计", "报表", "调整", "算账", "调表", "设计", "菜品"
      ];
      const counts = new Map(keywords.map((key) => [key, { count: 0, settlement: 0 }]));

      scopeRecords.forEach((item) => {
        const summary = String(item.summary || "").trim();
        const settlement = toNumber(item.settlementPrice);
        if (!summary) return;
        keywords.forEach((key) => {
          if (summary.includes(key)) {
            const bucket = counts.get(key);
            bucket.count += 1;
            bucket.settlement += settlement;
          }
        });
      });

      const rows = Array.from(counts.entries())
        .map(([keyword, data]) => ({ keyword, ...data }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count || b.settlement - a.settlement);

      if (rows.length) return rows;

      const fallback = summarizeBy(scopeRecords, (item) => String(item.summary || "").trim() || "未填")
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map((row) => ({ keyword: row.key, count: row.count, settlement: row.settlement }));
      return fallback;
    }

    function getTrendSummaryLabel(rawValue) {
      const source = String(rawValue || "").trim();
      if (!source) return "未填";
      return source.length > 18 ? `${source.slice(0, 18)}...` : source;
    }

    function buildAnalysisTrendRows(scopeRecords) {
      const groups = new Map();
      scopeRecords.forEach((item) => {
        const timestamp = parseDateValue(item.date);
        const dayKey = Number.isNaN(timestamp) ? "未知日期" : toDayLabel(timestamp);
        const bucket = groups.get(dayKey) || {
          key: dayKey,
          sortValue: Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : toStartOfDay(timestamp),
          count: 0,
          total: 0,
          settlement: 0,
          summaries: new Map()
        };
        const summary = getTrendSummaryLabel(item.summary);
        bucket.count += 1;
        bucket.total += toNumber(item.totalPrice);
        bucket.settlement += toNumber(item.settlementPrice);
        bucket.summaries.set(summary, (bucket.summaries.get(summary) || 0) + 1);
        groups.set(dayKey, bucket);
      });

      return Array.from(groups.values())
        .sort((a, b) => a.sortValue - b.sortValue || a.key.localeCompare(b.key, "zh-CN", {
          numeric: true,
          sensitivity: "base"
        }))
        .map((row) => {
          const summaryText = Array.from(row.summaries.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN", {
              numeric: true,
              sensitivity: "base"
            }))
            .slice(0, 3)
            .map(([text, count]) => `${text} ${formatCount(count)}单`)
            .join(" / ");
          return {
            key: row.key,
            count: row.count,
            total: row.total,
            settlement: row.settlement,
            summaryText
          };
        });
    }

    function isWeekendTrendDateKey(rawDateKey) {
      const timestamp = parseDateValue(rawDateKey);
      if (Number.isNaN(timestamp)) return false;
      const day = new Date(timestamp).getDay();
      return day === 0 || day === 6;
    }

    function formatTrendAxisDayLabel(rawDateKey) {
      const timestamp = parseDateValue(rawDateKey);
      if (Number.isNaN(timestamp)) return String(rawDateKey || "").trim();
      return `${new Date(timestamp).getDate()}日`;
    }

    function formatAverageCount(value) {
      return Number(value || 0).toLocaleString("zh-CN", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
    }

    function buildAnalysisTrendSummaryItems(trendRows, keywordRows) {
      if (!trendRows.length) return [];
      const latest = [...trendRows].reverse().find((row) => row.key !== "未知日期") || trendRows[trendRows.length - 1];
      const latestIndex = trendRows.lastIndexOf(latest);
      const previous = trendRows.slice(0, latestIndex).reverse().find((row) => row.key !== "未知日期");
      const peak = trendRows.reduce((best, row) => (row.count > best.count ? row : best), trendRows[0]);
      const orderTotal = trendRows.reduce((sum, row) => sum + row.count, 0);
      const avgDailyCount = trendRows.length ? orderTotal / trendRows.length : 0;
      const countChange = previous ? latest.count - previous.count : latest.count;
      const countChangeText = previous
        ? `${countChange >= 0 ? "+" : ""}${formatCount(countChange)} 较前一日`
        : "首个日期";
      const topKeyword = keywordRows[0]
        ? `${getTrendSummaryLabel(keywordRows[0].keyword)} / ${formatCount(keywordRows[0].count)}次`
        : (latest.summaryText || "待积累");

      return [
        {
          label: "最新接单",
          value: `${formatCount(latest.count)} 单`,
          meta: `${formatDateDisplay(latest.key)} / ${countChangeText}`
        },
        {
          label: "峰值接单日",
          value: `${formatCount(peak.count)} 单`,
          meta: `${formatDateDisplay(peak.key)} / ${formatCurrency(peak.settlement)} 会计结算价`
        },
        {
          label: "日均接单",
          value: `${formatAverageCount(avgDailyCount)} 单`,
          meta: `${formatCount(trendRows.length)} 个有单日期`
        },
        {
          label: "高频总结",
          value: topKeyword,
          meta: latest.summaryText ? `最新：${latest.summaryText}` : "任务简介关键词"
        }
      ];
    }

    function buildAnalysisTrendSummaryHtml(items) {
      return items
        .map((item) => `
          <div class="analysis-trend-summary-item">
            <div class="analysis-trend-summary-label">${escapeHtml(item.label)}</div>
            <div class="analysis-trend-summary-value">${escapeHtml(item.value)}</div>
            <div class="analysis-trend-summary-meta">${escapeHtml(item.meta)}</div>
          </div>
        `)
        .join("");
    }

    function disposeAnalysisTrendChart() {
      if (analysisTrendChartRenderFrame) {
        window.cancelAnimationFrame(analysisTrendChartRenderFrame);
        analysisTrendChartRenderFrame = 0;
      }
      if (analysisTrendChartInstance) {
        analysisTrendChartInstance.dispose();
        analysisTrendChartInstance = null;
      }
    }

    function renderAnalysisTrendChart(trendRows) {
      const chartElement = document.getElementById("analysisTrendChart");
      if (!chartElement) {
        disposeAnalysisTrendChart();
        return;
      }
      if (!window.echarts) {
        chartElement.innerHTML = '<div class="analysis-chart-state">ECharts 图表库加载中</div>';
        return;
      }

      if (analysisTrendChartInstance) {
        analysisTrendChartInstance.dispose();
      }
      chartElement.innerHTML = "";
      analysisTrendChartInstance = window.echarts.init(chartElement, null, {
        renderer: "canvas"
      });

      const visiblePercent = trendRows.length > 18 ? Math.max(0, 100 - (18 / trendRows.length) * 100) : 0;
      const dataZoom = trendRows.length > 18
        ? [
          {
            type: "inside",
            start: visiblePercent,
            end: 100,
            minValueSpan: 3
          },
          {
            type: "slider",
            start: visiblePercent,
            end: 100,
            height: 18,
            bottom: 6,
            borderColor: "#d3e2db",
            fillerColor: "rgba(35, 118, 91, 0.14)",
            handleStyle: {
              color: "#23765b"
            },
            textStyle: {
              color: "#61746c"
            }
          }
        ]
        : [];

      analysisTrendChartInstance.setOption({
        color: ["#23765b", "#d48634", "#2f63aa"],
        animationDuration: 220,
        tooltip: {
          trigger: "axis",
          confine: true,
          backgroundColor: "#fbfdfc",
          borderColor: "#cfe0d8",
          textStyle: {
            color: "#1d4137"
          },
          formatter(params) {
            const dataIndex = params[0]?.dataIndex || 0;
            const row = trendRows[dataIndex];
            if (!row) return "";
            const dateClass = isWeekendTrendDateKey(row.key) ? ' class="analysis-chart-weekend-date"' : "";
            return `
              <div class="analysis-chart-tooltip">
                <strong${dateClass}>${escapeHtml(formatTrendAxisDayLabel(row.key))}</strong>
                <span>接单量：${escapeHtml(formatCount(row.count))} 单</span>
                <span>会计价：${escapeHtml(formatCurrency(row.total))}</span>
                <span>会计结算价：${escapeHtml(formatCurrency(row.settlement))}</span>
                <span>总结：${escapeHtml(row.summaryText || "待积累")}</span>
              </div>
            `;
          }
        },
        legend: {
          top: 0,
          right: 4,
          itemWidth: 12,
          itemHeight: 8,
          textStyle: {
            color: "#43645a",
            fontSize: 12
          }
        },
        grid: {
          top: 42,
          right: 48,
          bottom: trendRows.length > 18 ? 52 : 24,
          left: 42,
          containLabel: true
        },
        xAxis: {
          type: "category",
          boundaryGap: true,
          data: trendRows.map((row) => formatTrendAxisDayLabel(row.key)),
          axisLine: {
            lineStyle: {
              color: "#d6e4dd"
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            interval: 0,
            formatter(value, index) {
              const row = trendRows[index];
              const styleName = row && isWeekendTrendDateKey(row.key) ? "weekend" : "normal";
              return `{${styleName}|${value}}`;
            },
            rich: {
              normal: {
                color: "#61746c",
                fontSize: 11
              },
              weekend: {
                color: "#d7352d",
                fontSize: 11,
                fontWeight: 700
              }
            }
          }
        },
        yAxis: [
          {
            type: "value",
            name: "单量",
            minInterval: 1,
            splitLine: {
              lineStyle: {
                color: "#e8f0ec"
              }
            },
            axisLabel: {
              color: "#61746c"
            },
            nameTextStyle: {
              color: "#61746c"
            }
          },
          {
            type: "value",
            name: "金额",
            splitLine: {
              show: false
            },
            axisLabel: {
              color: "#61746c",
              formatter(value) {
                if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(1)}万`;
                return value;
              }
            },
            nameTextStyle: {
              color: "#61746c"
            }
          }
        ],
        dataZoom,
        series: [
          {
            name: "接单量",
            type: "bar",
            yAxisIndex: 0,
            barMaxWidth: 24,
            itemStyle: {
              borderRadius: [5, 5, 0, 0]
            },
            data: trendRows.map((row) => row.count)
          },
          {
            name: "会计价走势",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            symbolSize: 6,
            lineStyle: {
              width: 2
            },
            data: trendRows.map((row) => Number(row.total.toFixed(2)))
          },
          {
            name: "会计结算价走势",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            symbolSize: 6,
            lineStyle: {
              width: 2
            },
            data: trendRows.map((row) => Number(row.settlement.toFixed(2)))
          }
        ]
      });
      analysisTrendChartInstance.resize();
    }

    function scheduleAnalysisTrendChartRender(trendRows) {
      if (analysisTrendChartRenderFrame) {
        window.cancelAnimationFrame(analysisTrendChartRenderFrame);
      }
      analysisTrendChartRenderFrame = window.requestAnimationFrame(() => {
        analysisTrendChartRenderFrame = 0;
        renderAnalysisTrendChart(trendRows);
      });
    }

    function resizeAnalysisTrendChart() {
      if (analysisTrendChartInstance && analysisModal && !analysisModal.hidden) {
        analysisTrendChartInstance.resize();
      }
    }

    function buildHtmlTable(columns, rows) {
      if (!rows.length) {
        return '<div class="analysis-empty">暂无可展示数据</div>';
      }
      const head = columns.map((col) => `<th>${escapeHtml(col)}</th>`).join("");
      const body = rows
        .map((row) => {
          const tds = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");
      return `<table class="analysis-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    }

    function buildAnalysisTags(scopeRecords) {
      if (!scopeRecords.length) return [];
      const showDispatcherSections = !isDispatcherLogin();
      const sumTotal = scopeRecords.reduce((sum, item) => sum + toNumber(item.totalPrice), 0);
      const sumSettlement = scopeRecords.reduce((sum, item) => sum + toNumber(item.settlementPrice), 0);
      const ratio = sumTotal > 0 ? sumSettlement / sumTotal : 0;

      const byDispatcher = summarizeBy(scopeRecords, (item) => normalizeDispatcherTag(item.dispatcher))
        .sort((a, b) => b.settlement - a.settlement);
      const byAccountant = summarizeBy(scopeRecords, (item) => String(item.accountant || "").trim() || "未填")
        .sort(compareSummaryRowsByCount);

      const tags = [];
      if (showDispatcherSections && byDispatcher.length) {
        tags.push(`接待人主力：${byDispatcher[0].key}（${formatCurrency(byDispatcher[0].settlement)}）`);
      }
      if (byAccountant.length) {
        tags.push(`会计主力：${byAccountant[0].key}（${formatCurrency(byAccountant[0].settlement)}）`);
      }
      tags.push(`整体结算率：${formatPercent(ratio)}`);
      tags.push(`总毛利空间：${formatCurrency(sumTotal - sumSettlement)}`);
      const uniqueCustomers = summarizeBy(
        scopeRecords,
        (item) => String(item.customer || "").trim() || "未填"
      );
      const repeatCustomers = uniqueCustomers.filter((row) => row.count >= 2);
      const repeatShare = uniqueCustomers.length ? repeatCustomers.length / uniqueCustomers.length : 0;
      tags.push(`复购客户占比：${formatPercent(repeatShare)}`);
      return tags;
    }

    function renderAnalysisPanel() {
      disposeAnalysisTrendChart();
      const scopeRecords = getFilteredRecords();
      const allRecords = getVisibleRecords();
      const showDispatcherSections = !isDispatcherLogin();

      if (!scopeRecords.length) {
        analysisContent.innerHTML = '<div class="analysis-empty">当前筛选范围无数据，分析面板暂时无可用结果。</div>';
        return;
      }

      const totalValues = scopeRecords.map((item) => toNumber(item.totalPrice));
      const settlementValues = scopeRecords.map((item) => toNumber(item.settlementPrice));

      const sumTotal = totalValues.reduce((sum, value) => sum + value, 0);
      const sumSettlement = settlementValues.reduce((sum, value) => sum + value, 0);
      const sumMargin = sumTotal - sumSettlement;
      const avgTotal = sumTotal / scopeRecords.length;
      const avgSettlement = sumSettlement / scopeRecords.length;
      const avgRatio = sumTotal > 0 ? sumSettlement / sumTotal : 0;
      const medianTotal = median(totalValues);
      const medianSettlement = median(settlementValues);

      const byDispatcher = summarizeBy(scopeRecords, (item) => normalizeDispatcherTag(item.dispatcher))
        .sort((a, b) => b.settlement - a.settlement);
      const byAccountant = summarizeBy(scopeRecords, (item) => String(item.accountant || "").trim() || "未填")
        .sort(compareSummaryRowsByCount);
      const byCustomer = summarizeBy(scopeRecords, (item) => String(item.customer || "").trim() || "未填")
        .sort((a, b) => b.settlement - a.settlement);
      const coopRows = buildCoopRows(scopeRecords);
      const keywordRows = buildKeywordRows(scopeRecords);
      const trendRows = buildAnalysisTrendRows(scopeRecords);
      const trendSummaryHtml = buildAnalysisTrendSummaryHtml(buildAnalysisTrendSummaryItems(trendRows, keywordRows));
      const uniqueCustomerCount = byCustomer.length;
      const repeatCustomerRows = byCustomer.filter((row) => row.count >= 2);
      const repeatCustomerCount = repeatCustomerRows.length;
      const repeatCustomerShare = uniqueCustomerCount ? repeatCustomerCount / uniqueCustomerCount : 0;
      const repeatOrderShare = scopeRecords.length
        ? repeatCustomerRows.reduce((sum, row) => sum + row.count, 0) / scopeRecords.length
        : 0;
      const p90Total = quantile(totalValues, 0.9);
      const cvTotal = avgTotal > 0 ? stddev(totalValues) / avgTotal : 0;
      const corrTotalSettlement = pearsonCorrelation(totalValues, settlementValues);

      const monthRows = summarizeBy(scopeRecords, (item) => {
        const ts = parseDateValue(item.date);
        if (Number.isNaN(ts)) return "未知月份";
        return toMonthLabel(ts);
      }).sort((a, b) => a.key.localeCompare(b.key, "zh-CN", { numeric: true }));
      const monthMoMRows = monthRows.map((row, index) => {
        const prev = monthRows[index - 1];
        return {
          ...row,
          momCount: prev ? formatMoM(row.count, prev.count) : "--",
          momTotal: prev ? formatMoM(row.total, prev.total) : "--",
          momSettlement: prev ? formatMoM(row.settlement, prev.settlement) : "--"
        };
      });

      const weekdayRows = summarizeBy(scopeRecords, (item) => {
        const ts = parseDateValue(item.date);
        if (Number.isNaN(ts)) return "未知";
        return toWeekdayLabel(ts);
      }).sort((a, b) => a.key.localeCompare(b.key, "zh-CN", { numeric: true }));

      const totalBandRows = buildBandRows(
        totalValues,
        [0, 100, 300, 500, 1000, Infinity],
        ["0-100", "100-300", "300-500", "500-1000", "1000+"]
      );

      const anomalies = scopeRecords
        .map((item) => {
          const total = toNumber(item.totalPrice);
          const settlement = toNumber(item.settlementPrice);
          const ratio = total > 0 ? settlement / total : 0;
          const reasons = [];
          if (settlement > total) reasons.push("会计结算价高于会计价");
          return {
            date: formatDateDisplay(item.date),
            dispatcher: normalizeDispatcherTag(item.dispatcher),
            accountant: String(item.accountant || "").trim() || "未填",
            customer: String(item.customer || "").trim() || "未填",
            total,
            settlement,
            ratio,
            reasons
          };
        })
        .filter((item) => item.reasons.length)
        .sort((a, b) => b.total - a.total)
        .slice(0, 20);

      const customerTopSettlement = byCustomer.slice(0, 10);
      const customerTotalSettlement = byCustomer.reduce((sum, row) => sum + row.settlement, 0);
      const topCustomerShare = customerTotalSettlement > 0 && customerTopSettlement.length
        ? customerTopSettlement[0].settlement / customerTotalSettlement
        : 0;
      const top5Share = customerTotalSettlement > 0
        ? customerTopSettlement.slice(0, 5).reduce((sum, row) => sum + row.settlement, 0) / customerTotalSettlement
        : 0;

      const tagsHtml = buildAnalysisTags(scopeRecords)
        .map((text) => `<span class="analysis-tag">${escapeHtml(text)}</span>`)
        .join("");

      const dispatcherTable = buildHtmlTable(
        ["接待人", "单量", "会计价", "会计结算价", "结算率", "均单会计价"],
        byDispatcher.slice(0, 10).map((row) => [
          row.key,
          formatCount(row.count),
          formatCurrency(row.total),
          formatCurrency(row.settlement),
          formatPercent(row.ratio),
          formatCurrency(row.avgTotal)
        ])
      );

      const accountantTable = buildHtmlTable(
        ["会计", "单量", "会计价", "会计结算价", "结算率", "毛利空间"],
        byAccountant.slice(0, 12).map((row) => [
          row.key,
          formatCount(row.count),
          formatCurrency(row.total),
          formatCurrency(row.settlement),
          formatPercent(row.ratio),
          formatCurrency(row.margin)
        ])
      );

      const customerTable = buildHtmlTable(
        ["客户", "单量", "会计结算价", "会计价", "结算率"],
        byCustomer.slice(0, 12).map((row) => [
          row.key,
          formatCount(row.count),
          formatCurrency(row.settlement),
          formatCurrency(row.total),
          formatPercent(row.ratio)
        ])
      );

      const monthTable = buildHtmlTable(
        ["月份", "单量", "会计价", "会计结算价", "结算率"],
        monthRows.map((row) => [
          row.key,
          formatCount(row.count),
          formatCurrency(row.total),
          formatCurrency(row.settlement),
          formatPercent(row.ratio)
        ])
      );

      const weekdayTable = buildHtmlTable(
        ["星期", "单量", "会计价", "会计结算价", "结算率"],
        weekdayRows.map((row) => [
          row.key,
          formatCount(row.count),
          formatCurrency(row.total),
          formatCurrency(row.settlement),
          formatPercent(row.ratio)
        ])
      );

      const totalBandTable = buildHtmlTable(
        ["会计价区间", "数量", "占比"],
        totalBandRows.map((row) => [
          row.label,
          formatCount(row.count),
          formatPercent(scopeRecords.length ? row.count / scopeRecords.length : 0)
        ])
      );

      const anomalyTable = showDispatcherSections
        ? buildHtmlTable(
          ["日期", "接待人", "会计", "客户", "会计价", "会计结算价", "结算率", "原因"],
          anomalies.map((row) => [
            row.date,
            row.dispatcher,
            row.accountant,
            row.customer,
            formatCurrency(row.total),
            formatCurrency(row.settlement),
            formatPercent(row.ratio),
            row.reasons.join("、")
          ])
        )
        : buildHtmlTable(
          ["日期", "会计", "客户", "会计价", "会计结算价", "结算率", "原因"],
          anomalies.map((row) => [
            row.date,
            row.accountant,
            row.customer,
            formatCurrency(row.total),
            formatCurrency(row.settlement),
            formatPercent(row.ratio),
            row.reasons.join("、")
          ])
        );

      const coopTable = buildHtmlTable(
        ["接待人", "会计", "单量", "会计价", "会计结算价", "结算率"],
        coopRows.slice(0, 15).map((row) => [
          row.dispatcher,
          row.accountant,
          formatCount(row.count),
          formatCurrency(row.total),
          formatCurrency(row.settlement),
          formatPercent(row.ratio)
        ])
      );

      const repeatTable = buildHtmlTable(
        ["客户", "单量", "会计结算价", "会计价", "结算率"],
        repeatCustomerRows.slice(0, 15).map((row) => [
          row.key,
          formatCount(row.count),
          formatCurrency(row.settlement),
          formatCurrency(row.total),
          formatPercent(row.ratio)
        ])
      );

      const monthMoMTable = buildHtmlTable(
        ["月份", "单量", "会计价", "会计结算价", "单量环比", "会计价环比", "结算环比"],
        monthMoMRows.map((row) => [
          row.key,
          formatCount(row.count),
          formatCurrency(row.total),
          formatCurrency(row.settlement),
          row.momCount,
          row.momTotal,
          row.momSettlement
        ])
      );

      const keywordTable = buildHtmlTable(
        ["关键词", "命中数", "会计结算价贡献", "占比"],
        keywordRows.slice(0, 15).map((row) => [
          row.keyword,
          formatCount(row.count),
          formatCurrency(row.settlement),
          formatPercent(scopeRecords.length ? row.count / scopeRecords.length : 0)
        ])
      );

      analysisContent.innerHTML = `
        <section class="analysis-trend-card">
          <div class="analysis-trend-main">
            <div class="analysis-trend-head">
              <div>
                <h3>数据走势</h3>
                <p>按日期汇总接单量、会计价和会计结算价</p>
              </div>
              <span class="analysis-trend-badge">${formatCount(trendRows.length)} 个日期</span>
            </div>
            <div id="analysisTrendChart" class="analysis-trend-chart" role="img" aria-label="数据走势、接单量和金额趋势图"></div>
          </div>
          <aside class="analysis-trend-summary" aria-label="趋势总结">
            <h3>趋势总结</h3>
            <div class="analysis-trend-summary-list">${trendSummaryHtml}</div>
          </aside>
        </section>
        <div class="analysis-scope">
          分析范围：当前筛选 ${formatCount(scopeRecords.length)} 条 / 全部 ${formatCount(allRecords.length)} 条
        </div>
        <div class="analysis-kpis">
          <div class="analysis-kpi"><div class="analysis-kpi-label">记录数</div><div class="analysis-kpi-value">${formatCount(scopeRecords.length)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">会计价合计</div><div class="analysis-kpi-value">${formatCurrency(sumTotal)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">会计结算价合计</div><div class="analysis-kpi-value">${formatCurrency(sumSettlement)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">毛利空间</div><div class="analysis-kpi-value">${formatCurrency(sumMargin)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">整体结算率</div><div class="analysis-kpi-value">${formatPercent(avgRatio)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">均单会计价</div><div class="analysis-kpi-value">${formatCurrency(avgTotal)}</div></div>
        </div>
        <div class="analysis-kpis">
          <div class="analysis-kpi"><div class="analysis-kpi-label">客户总数</div><div class="analysis-kpi-value">${formatCount(uniqueCustomerCount)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">复购客户占比</div><div class="analysis-kpi-value">${formatPercent(repeatCustomerShare)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">复购订单占比</div><div class="analysis-kpi-value">${formatPercent(repeatOrderShare)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">会计价P90</div><div class="analysis-kpi-value">${formatCurrency(p90Total)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">会计价波动系数</div><div class="analysis-kpi-value">${formatPercent(cvTotal)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">金额相关性</div><div class="analysis-kpi-value">${corrTotalSettlement.toFixed(2)}</div></div>
        </div>
        <div class="analysis-kpis">
          <div class="analysis-kpi"><div class="analysis-kpi-label">均单会计结算价</div><div class="analysis-kpi-value">${formatCurrency(avgSettlement)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">会计价中位数</div><div class="analysis-kpi-value">${formatCurrency(medianTotal)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">结算中位数</div><div class="analysis-kpi-value">${formatCurrency(medianSettlement)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">客户集中度Top1</div><div class="analysis-kpi-value">${formatPercent(topCustomerShare)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">客户集中度Top5</div><div class="analysis-kpi-value">${formatPercent(top5Share)}</div></div>
          <div class="analysis-kpi"><div class="analysis-kpi-label">数据异常数</div><div class="analysis-kpi-value">${formatCount(anomalies.length)}</div></div>
        </div>
        <div class="analysis-tags">${tagsHtml || '<span class="analysis-empty">暂无关键结论</span>'}</div>
        <div class="analysis-grid">
          ${showDispatcherSections ? `<section class="analysis-panel"><h3>接待人维度</h3>${dispatcherTable}</section>` : ""}
          <section class="analysis-panel"><h3>会计维度</h3>${accountantTable}</section>
          ${showDispatcherSections ? `<section class="analysis-panel"><h3>接待-会计协同矩阵</h3>${coopTable}</section>` : ""}
          <section class="analysis-panel"><h3>客户复购分析</h3>${repeatTable}</section>
          <section class="analysis-panel"><h3>客户维度</h3>${customerTable}</section>
          <section class="analysis-panel"><h3>月度维度</h3>${monthTable}</section>
          <section class="analysis-panel"><h3>月度环比变化</h3>${monthMoMTable}</section>
          <section class="analysis-panel"><h3>星期维度</h3>${weekdayTable}</section>
          <section class="analysis-panel"><h3>任务简介关键词热度</h3>${keywordTable}</section>
          <section class="analysis-panel"><h3>会计价区间分布</h3>${totalBandTable}</section>
          <section class="analysis-panel"><h3>数据异常样本</h3>${anomalyTable}</section>
        </div>
      `;
      scheduleAnalysisTrendChartRender(trendRows);
    }
