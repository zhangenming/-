const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const BEIJING_TIME_ZONE = "Asia/Shanghai";
const DEFAULT_OUTPUT_FILE = "/private/tmp/dispatch-settlement-audit.json";
const DEFAULT_DATA_DIR = "data";
const CURRENT_RATIO_RULE_START_DATE = "2026-05-27";
const PREMIUM_NEW_FORMULA_START_DATE = "2026-06-01";

const DISPATCHER_ACCOUNT_LIST = ["1", "a", "c", "d", "e", "k", "开心财税", "开心财税1旧", "开心财税k旧"];
const SETTLED_WORKFLOW_STATE_VALUES = new Set(["已核对客户确认/待上传", "已上传", "已上传/待结算", "已结算"]);
const MONTHLY_SETTLEMENT_STATE_VALUES = new Set(["on", "是", "月结"]);
const PAID_WORKFLOW_STATE_VALUES = new Set(["已结算"]);
const BUILT_IN_ACCOUNTANT_NAMES = ["不结算", "外部人员"];

function parseArgs(argv) {
  const options = {
    dataDir: DEFAULT_DATA_DIR,
    outputFile: DEFAULT_OUTPUT_FILE,
    monthKey: ""
  };
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--data-dir") {
      options.dataDir = argv[index + 1] || options.dataDir;
      index += 1;
    } else if (item === "--out") {
      options.outputFile = argv[index + 1] || options.outputFile;
      index += 1;
    } else if (item === "--month") {
      options.monthKey = argv[index + 1] || options.monthKey;
      index += 1;
    }
  }
  return options;
}

function readJsonFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) return fallbackValue;
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw || JSON.stringify(fallbackValue));
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function toNumber(value) {
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === "string" && value.trim() === "") return Number.NaN;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

function roundMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return Number.NaN;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function formatMoney(value) {
  const amount = roundMoney(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "";
}

function normalizeStateFlag(value, extraTruthyValues = null) {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "number") return value === 1;
  const normalized = normalizeText(value).toLowerCase();
  return normalized === "true"
    || normalized === "1"
    || normalized === "yes"
    || Boolean(extraTruthyValues?.has(normalized));
}

function getBeijingDateTime(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const parts = {};
  new Intl.DateTimeFormat("en-CA", {
    timeZone: BEIJING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23"
  }).formatToParts(date).forEach(({ type, value }) => {
    if (type !== "literal") parts[type] = value;
  });
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function normalizeDateOnly(value) {
  const source = normalizeText(value).replace(/[/.]/g, "-");
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(source);
  if (!match) return "";
  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}-${String(Number(match[3])).padStart(2, "0")}`;
}

function normalizeMonthKey(value) {
  const source = normalizeText(value);
  const match = /^(\d{4})[-/.](\d{1,2})/.exec(source);
  if (!match) return "";
  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}`;
}

function getCurrentBeijingMonthKey() {
  return normalizeMonthKey(getBeijingDateTime());
}

function getMonthKeyFromDateTime(value) {
  return normalizeMonthKey(normalizeText(value));
}

function isRecordSettled(record) {
  return normalizeStateFlag(record?.isSettled, SETTLED_WORKFLOW_STATE_VALUES);
}

function isRecordPaid(record) {
  return normalizeStateFlag(
    Object.prototype.hasOwnProperty.call(record || {}, "isSettlementPaid")
      ? record.isSettlementPaid
      : record?.settlementPaid,
    PAID_WORKFLOW_STATE_VALUES
  );
}

function isDispatcherPaid(record) {
  return normalizeStateFlag(
    Object.prototype.hasOwnProperty.call(record || {}, "isDispatcherSettlementPaid")
      ? record.isDispatcherSettlementPaid
      : record?.dispatcherSettlementPaid,
    PAID_WORKFLOW_STATE_VALUES
  );
}

function isCompletedStatus(record) {
  const status = normalizeText(record?.checkStatus).toLowerCase();
  return status === "completed" || status === "partial_refunded";
}

function normalizeDispatcherTag(rawValue) {
  const source = normalizeText(rawValue);
  if (!source) return "";
  const lower = source.toLowerCase();
  if (lower === "开心财税") return "开心财税";
  if (lower === "1旧" || lower.includes("财税1旧")) return "1旧";
  if (lower === "k旧" || lower.includes("财税k旧")) return "K旧";
  if (lower === "1" || lower.includes("财税1")) return "1";
  if (lower === "a" || lower.includes("财税a")) return "A";
  if (lower === "c" || lower.includes("财税c")) return "C";
  if (lower === "d" || lower.includes("财税d")) return "D";
  if (lower === "e" || lower.includes("财税e")) return "E";
  if (lower === "k" || lower.includes("财税k")) return "K";
  return "";
}

function getDispatcherTagForAccount(accountName) {
  const lower = normalizeText(accountName).toLowerCase();
  if (lower === "开心财税") return "开心财税";
  if (lower === "开心财税1旧" || lower === "1旧") return "1旧";
  if (lower === "开心财税k旧" || lower === "k旧") return "K旧";
  if (lower === "1") return "1";
  if (lower === "a") return "A";
  if (lower === "c") return "C";
  if (lower === "d") return "D";
  if (lower === "e") return "E";
  if (lower === "k") return "K";
  return "";
}

function getDispatcherAccountByTag(tag) {
  const normalizedTag = normalizeDispatcherTag(tag);
  return DISPATCHER_ACCOUNT_LIST.find((account) => getDispatcherTagForAccount(account) === normalizedTag) || "";
}

function getPremiumValue(record) {
  const paymentPrice = toNumber(record?.paymentPrice);
  const totalPrice = toNumber(record?.totalPrice);
  if (!Number.isFinite(paymentPrice) || !Number.isFinite(totalPrice)) return Number.NaN;
  return paymentPrice - totalPrice;
}

function isMonthlySettlementRecord(record) {
  const detail = record?.monthlySettlement && typeof record.monthlySettlement === "object"
    ? record.monthlySettlement
    : {};
  const value = Object.prototype.hasOwnProperty.call(detail, "enabled")
    ? detail.enabled
    : record?.isMonthlySettlement;
  return normalizeStateFlag(value, MONTHLY_SETTLEMENT_STATE_VALUES);
}

function getMonthlySettlement(record) {
  const detail = record?.monthlySettlement && typeof record.monthlySettlement === "object"
    ? record.monthlySettlement
    : {};
  return {
    enabled: isMonthlySettlementRecord(record),
    sequence: detail.sequence ?? record?.monthlySettlementSequence ?? "",
    renewal: normalizeStateFlag(detail.renewal ?? record?.monthlySettlementRenewal, MONTHLY_SETTLEMENT_STATE_VALUES),
    endDate: normalizeDateOnly(detail.endDate || record?.monthlySettlementEndDate || record?.reminderDate || "")
  };
}

function getSystemBaseRate(record) {
  if (!isMonthlySettlementRecord(record)) return 0.08;
  const monthly = getMonthlySettlement(record);
  if (monthly.renewal) return 0.13;
  const sequence = Number(monthly.sequence);
  return Number.isInteger(sequence) && sequence === 1 ? 0.08 : 0.13;
}

function getFlatMonthlyRuleBaseRate(record) {
  return isMonthlySettlementRecord(record) ? 0.13 : 0.08;
}

function getPremiumFormulaKey(record) {
  const date = normalizeDateOnly(record?.date);
  return date && date >= PREMIUM_NEW_FORMULA_START_DATE ? "new" : "legacy";
}

function getPremiumFormula(formulaKey) {
  if (formulaKey === "new") {
    return {
      label: "2026-06-01起",
      nonPositiveRate: 0.4,
      tiers: [
        { amount: 3000, rate: 0.4 },
        { amount: 2000, rate: 0.45 },
        { amount: Number.POSITIVE_INFINITY, rate: 0.5 }
      ]
    };
  }
  return {
    label: "2026-06-01前",
    nonPositiveRate: 0.45,
    tiers: [
      { amount: 1000, rate: 0.45 },
      { amount: 1000, rate: 0.5 },
      { amount: Number.POSITIVE_INFINITY, rate: 0.55 }
    ]
  };
}

function getTieredPremiumBreakdown(rawPremium, formulaKey) {
  const premium = toNumber(rawPremium);
  if (!Number.isFinite(premium)) return null;
  const formula = getPremiumFormula(formulaKey);
  if (premium <= 0) {
    const profit = premium * formula.nonPositiveRate;
    return {
      formulaKey,
      formulaLabel: formula.label,
      premium,
      profit,
      segments: [{ amount: premium, rate: formula.nonPositiveRate, profit, formulaKey, formulaLabel: formula.label }]
    };
  }
  let remaining = premium;
  let profit = 0;
  const segments = [];
  formula.tiers.forEach((tier) => {
    const amount = Math.min(remaining, tier.amount);
    if (amount <= 0) return;
    const segmentProfit = amount * tier.rate;
    segments.push({ amount, rate: tier.rate, profit: segmentProfit, formulaKey, formulaLabel: formula.label });
    profit += segmentProfit;
    remaining -= amount;
  });
  return { formulaKey, formulaLabel: formula.label, premium, profit, segments };
}

function getPremiumBreakdownFromTerms(terms) {
  const premiumByFormula = new Map();
  terms.forEach((term) => {
    const amount = toNumber(term.amount);
    if (!Number.isFinite(amount)) return;
    const formulaKey = term.formulaKey || "legacy";
    premiumByFormula.set(formulaKey, (premiumByFormula.get(formulaKey) || 0) + amount);
  });
  if (!premiumByFormula.size) premiumByFormula.set("new", 0);
  const formulaBreakdowns = Array.from(premiumByFormula.entries())
    .map(([formulaKey, premium]) => getTieredPremiumBreakdown(premium, formulaKey))
    .filter(Boolean);
  return {
    premium: formulaBreakdowns.reduce((sum, item) => sum + item.premium, 0),
    profit: formulaBreakdowns.reduce((sum, item) => sum + item.profit, 0),
    formulaBreakdowns,
    segments: formulaBreakdowns.flatMap((item) => item.segments)
  };
}

function getTaxAmount(value) {
  const income = toNumber(value);
  if (!Number.isFinite(income) || income <= 0) return 0;
  if (income <= 800) return 0;
  if (income <= 4000) return (income - 800) * 0.2;
  return income * 0.16;
}

function isInvoiceOptionalForPayout(record) {
  return BUILT_IN_ACCOUNTANT_NAMES.includes(normalizeText(record?.accountant));
}

function getStoredInvoiceImage(record, scope) {
  if (scope === "dispatcher") {
    return record?.dispatcherSettlementInvoiceImage || record?.dispatcherInvoiceImage || null;
  }
  return record?.settlementInvoiceImage || record?.invoiceImage || null;
}

function isInvoiceUploaded(record, scope) {
  return Boolean(getStoredInvoiceImage(record, scope));
}

function getSettlementTargetMonthKey(record, targetType, currentMonthKey) {
  if (targetType === "dispatcher") {
    return isDispatcherPaid(record)
      ? getMonthKeyFromDateTime(record?.dispatcherSettlementPaidAt) || currentMonthKey
      : currentMonthKey;
  }
  return isRecordPaid(record)
    ? getMonthKeyFromDateTime(record?.settlementPaidAt) || currentMonthKey
    : currentMonthKey;
}

function isSettlementTargetInMonth(record, targetType, monthKey, currentMonthKey) {
  const normalized = normalizeMonthKey(monthKey);
  if (!normalized) return true;
  return getSettlementTargetMonthKey(record, targetType, currentMonthKey) === normalized;
}

function buildAccountantIndexes(accountants) {
  const phoneToName = new Map();
  const nameToProfile = new Map();
  accountants.forEach((item) => {
    const displayName = normalizeText(item.displayName || item.name || item.alias || item.username);
    if (!displayName) return;
    nameToProfile.set(displayName, item);
    const phone = normalizeText(item.phone);
    if (phone) phoneToName.set(phone, displayName);
  });
  return { phoneToName, nameToProfile };
}

function getDispatcherMappings(dispatcherConfigs, accountantIndexes) {
  const tagToAccountant = new Map();
  const accountantToTags = new Map();
  DISPATCHER_ACCOUNT_LIST.forEach((account) => {
    const tag = getDispatcherTagForAccount(account);
    const phone = normalizeText(dispatcherConfigs?.[account]?.linkedAccountantPhone);
    const accountant = phone ? accountantIndexes.phoneToName.get(phone) || "" : "";
    tagToAccountant.set(tag, accountant);
    if (accountant) {
      const tags = accountantToTags.get(accountant) || [];
      tags.push(tag);
      accountantToTags.set(accountant, tags);
    }
  });
  return { tagToAccountant, accountantToTags };
}

function getAccountantRatio(accountantIndexes, accountantName) {
  const profile = accountantIndexes.nameToProfile.get(normalizeText(accountantName));
  return toNumber(profile?.accountingSettlementRatio);
}

function getSettlementRatio(record) {
  const total = toNumber(record?.totalPrice);
  const settlement = toNumber(record?.settlementPrice);
  if (!Number.isFinite(total) || total === 0 || !Number.isFinite(settlement)) return Number.NaN;
  return roundMoney((settlement / total) * 100);
}

function getFirstSeenByAccountant(records, operationLogs) {
  const firstSeen = new Map();
  const add = (name, time, source) => {
    const accountant = normalizeText(name);
    const stamp = normalizeText(time);
    if (!accountant || !stamp) return;
    const current = firstSeen.get(accountant);
    if (!current || stamp < current.time) {
      firstSeen.set(accountant, { time: stamp, source });
    }
  };
  records.forEach((record) => {
    add(record.accountant, record.createdAt || record.date, "record");
  });
  operationLogs.forEach((log) => {
    add(log.accountant, log.operatedAt || log.date, "operation-log-accountant");
    add(log.operatedBy, log.operatedAt, "operation-log-operator");
  });
  return firstSeen;
}

function createMoneyBucket() {
  return {
    count: 0,
    recordIds: [],
    totalPrice: 0,
    paymentPrice: 0,
    settlementPrice: 0,
    baseProfit: 0,
    premiumTerms: [],
    monthlyCount: 0,
    monthlyFirstCount: 0
  };
}

function appendRecordToBucket(bucket, record, rateFn) {
  bucket.count += 1;
  const recordId = normalizeText(record?.id);
  if (recordId) bucket.recordIds.push(recordId);
  const total = toNumber(record?.totalPrice);
  const payment = toNumber(record?.paymentPrice);
  const settlement = toNumber(record?.settlementPrice);
  if (Number.isFinite(total)) {
    bucket.totalPrice += total;
    bucket.baseProfit += total * rateFn(record);
  }
  if (Number.isFinite(payment)) bucket.paymentPrice += payment;
  if (Number.isFinite(settlement)) bucket.settlementPrice += settlement;
  const premium = getPremiumValue(record);
  if (Number.isFinite(premium)) {
    bucket.premiumTerms.push({ amount: premium, formulaKey: getPremiumFormulaKey(record) });
  }
  const monthly = getMonthlySettlement(record);
  if (monthly.enabled) {
    bucket.monthlyCount += 1;
    if (!monthly.renewal && Number(monthly.sequence) === 1) {
      bucket.monthlyFirstCount += 1;
    }
  }
}

function finalizeMoneyBucket(bucket) {
  const premiumBreakdown = getPremiumBreakdownFromTerms(bucket.premiumTerms);
  const premiumProfit = premiumBreakdown?.profit || 0;
  const invoiceAmount = bucket.baseProfit + premiumProfit;
  const taxAmount = getTaxAmount(invoiceAmount);
  return {
    ...bucket,
    rawPremium: premiumBreakdown?.premium || 0,
    premiumProfit,
    premiumSegments: premiumBreakdown?.segments || [],
    invoiceAmount,
    taxAmount,
    payableAmount: invoiceAmount - taxAmount
  };
}

function summarizeDispatcher(records, dispatcherMappings, options = {}) {
  const rateFn = options.rateFn || getSystemBaseRate;
  const excludeLinked = Boolean(options.excludeLinked);
  const groupMap = new Map();
  records.forEach((record) => {
    const dispatcher = normalizeDispatcherTag(record.dispatcher) || "未分配接待";
    const linkedAccountant = dispatcherMappings.tagToAccountant.get(dispatcher) || "";
    if (excludeLinked && linkedAccountant) return;
    const bucket = groupMap.get(dispatcher) || {
      dispatcher,
      linkedAccountant,
      ...createMoneyBucket()
    };
    appendRecordToBucket(bucket, record, rateFn);
    groupMap.set(dispatcher, bucket);
  });
  return Array.from(groupMap.values())
    .map(finalizeMoneyBucket)
    .sort((left, right) => left.dispatcher.localeCompare(right.dispatcher, "zh-CN", { numeric: true, sensitivity: "base" }));
}

function getLinkedDispatcherSettlementAmount(accountantName, records, dispatcherMappings, options = {}) {
  const tags = dispatcherMappings.accountantToTags.get(accountantName) || [];
  if (!tags.length) return null;
  const currentMonthKey = options.currentMonthKey;
  const monthKey = normalizeMonthKey(options.monthKey);
  const hasPaidFilter = Object.prototype.hasOwnProperty.call(options, "paid");
  const paidFilter = Boolean(options.paid);
  const bucket = createMoneyBucket();
  let pendingCount = 0;
  let pendingInvoiceCount = 0;
  let uploadedCount = 0;
  let paidCount = 0;
  const payoutRecordIds = [];
  const revokeTargets = [];
  const paidAtValues = [];
  records.forEach((record) => {
    const dispatcher = normalizeDispatcherTag(record.dispatcher);
    if (!tags.includes(dispatcher)) return;
    if (!isSettlementTargetInMonth(record, "dispatcher", monthKey, currentMonthKey)) return;
    if (hasPaidFilter && isDispatcherPaid(record) !== paidFilter) return;
    appendRecordToBucket(bucket, record, getSystemBaseRate);
    const recordId = normalizeText(record.id);
    const uploaded = isInvoiceUploaded(record, "dispatcher");
    const paid = isDispatcherPaid(record);
    if (uploaded) uploadedCount += 1;
    if (paid) {
      paidCount += 1;
      if (recordId) revokeTargets.push(`dispatcher:${recordId}`);
      const paidAt = normalizeText(record.dispatcherSettlementPaidAt);
      if (paidAt) paidAtValues.push(paidAt);
    } else if (uploaded && recordId) {
      payoutRecordIds.push(recordId);
    }
    if (!uploaded) {
      pendingCount += 1;
      pendingInvoiceCount += 1;
    }
  });
  if (bucket.count === 0) return null;
  const finalized = finalizeMoneyBucket(bucket);
  const payoutRecords = records.filter((record) => {
    const dispatcher = normalizeDispatcherTag(record.dispatcher);
    return tags.includes(dispatcher)
      && isSettlementTargetInMonth(record, "dispatcher", monthKey, currentMonthKey)
      && isInvoiceUploaded(record, "dispatcher")
      && !isDispatcherPaid(record);
  });
  const payoutBucket = createMoneyBucket();
  payoutRecords.forEach((record) => appendRecordToBucket(payoutBucket, record, getSystemBaseRate));
  const payout = finalizeMoneyBucket(payoutBucket);
  return {
    ...finalized,
    pendingCount,
    pendingInvoiceCount,
    uploadedCount,
    paidCount,
    payoutRecordIds,
    payoutTargets: payoutRecordIds.map((recordId) => `dispatcher:${recordId}`),
    revokeTargets,
    paidAtValues,
    payoutInvoiceAmount: payout.invoiceAmount,
    payoutTaxAmount: getTaxAmount(payout.invoiceAmount),
    payoutPayableAmount: payout.invoiceAmount - getTaxAmount(payout.invoiceAmount),
    dispatcherTags: tags
  };
}

function summarizeBossSettlementGroups(records, dispatcherMappings, options) {
  const currentMonthKey = options.currentMonthKey;
  const monthKey = normalizeMonthKey(options.monthKey);
  const groupMap = new Map();
  const getGroup = (accountant) => {
    const key = normalizeText(accountant) || "未分配会计";
    const current = groupMap.get(key);
    if (current) return current;
    const next = {
      accountant: key,
      recordIds: [],
      recordCount: 0,
      pendingCount: 0,
      pendingInvoiceCount: 0,
      uploadedCount: 0,
      paidCount: 0,
      payoutRecordIds: [],
      payoutTargets: [],
      revokeTargets: [],
      accountantInvoiceAmount: 0,
      accountantPaidInvoiceAmount: 0,
      accountantPayoutInvoiceAmount: 0
    };
    groupMap.set(key, next);
    return next;
  };
  records.forEach((record) => {
    if (!isSettlementTargetInMonth(record, "accountant", monthKey, currentMonthKey)) return;
    const settlement = toNumber(record.settlementPrice);
    const recordId = normalizeText(record.id);
    const group = getGroup(record.accountant);
    group.recordCount += 1;
    if (recordId) group.recordIds.push(recordId);
    if (Number.isFinite(settlement)) group.accountantInvoiceAmount += settlement;
    const uploaded = isInvoiceUploaded(record, "accountant");
    const invoiceOptional = isInvoiceOptionalForPayout(record);
    const paid = isRecordPaid(record);
    if (uploaded) uploadedCountAdd(group);
    if (!uploaded) {
      group.pendingCount += 1;
      if (!invoiceOptional) group.pendingInvoiceCount += 1;
    }
    if (paid) {
      group.paidCount += 1;
      if (Number.isFinite(settlement)) group.accountantPaidInvoiceAmount += settlement;
      if (recordId) group.revokeTargets.push(`accountant:${recordId}`);
    } else if ((uploaded || invoiceOptional) && recordId) {
      group.payoutRecordIds.push(recordId);
      group.payoutTargets.push(`accountant:${recordId}`);
      if (Number.isFinite(settlement)) group.accountantPayoutInvoiceAmount += settlement;
    }
  });

  dispatcherMappings.accountantToTags.forEach((tags, accountant) => {
    const linkedAmount = getLinkedDispatcherSettlementAmount(accountant, records, dispatcherMappings, {
      monthKey,
      currentMonthKey
    });
    if (linkedAmount?.count > 0) getGroup(accountant);
  });

  return Array.from(groupMap.values())
    .map((group) => {
      const linkedAmount = getLinkedDispatcherSettlementAmount(group.accountant, records, dispatcherMappings, {
        monthKey,
        currentMonthKey
      });
      const linkedPaidAmount = getLinkedDispatcherSettlementAmount(group.accountant, records, dispatcherMappings, {
        monthKey,
        currentMonthKey,
        paid: true
      });
      const accountantTaxAmount = getTaxAmount(group.accountantInvoiceAmount);
      const dispatcherInvoiceAmount = linkedAmount?.invoiceAmount || 0;
      const invoiceAmount = group.accountantInvoiceAmount + dispatcherInvoiceAmount;
      const taxAmount = getTaxAmount(invoiceAmount);
      const accountantPaidInvoiceAmount = group.accountantPaidInvoiceAmount;
      const dispatcherPaidInvoiceAmount = linkedPaidAmount?.invoiceAmount || 0;
      const paidInvoiceAmount = accountantPaidInvoiceAmount + dispatcherPaidInvoiceAmount;
      const paidTaxAmount = getTaxAmount(paidInvoiceAmount);
      const payoutInvoiceAmount = group.accountantPayoutInvoiceAmount + (linkedAmount?.payoutInvoiceAmount || 0);
      const payoutTaxAmount = getTaxAmount(payoutInvoiceAmount);
      return {
        ...group,
        linkedDispatcherTags: linkedAmount?.dispatcherTags || dispatcherMappings.accountantToTags.get(group.accountant) || [],
        dispatcherRecordCount: linkedAmount?.count || 0,
        dispatcherInvoiceAmount,
        dispatcherPremiumProfit: linkedAmount?.premiumProfit || 0,
        dispatcherBaseProfit: linkedAmount?.baseProfit || 0,
        accountantTaxAmount,
        accountantPayableAmount: group.accountantInvoiceAmount - accountantTaxAmount,
        invoiceAmount,
        taxAmount,
        payableAmount: invoiceAmount - taxAmount,
        paidInvoiceAmount,
        paidTaxAmount,
        paidPayableAmount: paidInvoiceAmount - paidTaxAmount,
        payoutInvoiceAmount,
        payoutTaxAmount,
        payoutPayableAmount: payoutInvoiceAmount - payoutTaxAmount,
        combinedRecordCount: new Set([
          ...group.recordIds,
          ...(linkedAmount?.recordIds || [])
        ]).size,
        combinedPendingInvoiceCount: group.pendingInvoiceCount + (linkedAmount?.pendingInvoiceCount || 0),
        combinedUploadedCount: group.uploadedCount + (linkedAmount?.uploadedCount || 0),
        combinedPaidCount: group.paidCount + (linkedAmount?.paidCount || 0),
        combinedPayoutTargets: [
          ...group.payoutTargets,
          ...(linkedAmount?.payoutTargets || [])
        ]
      };
    })
    .sort((left, right) => right.invoiceAmount - left.invoiceAmount);
}

function uploadedCountAdd(group) {
  group.uploadedCount += 1;
}

function summarizeAccountants(records, accountantIndexes) {
  const groupMap = new Map();
  records.forEach((record) => {
    const accountant = normalizeText(record.accountant) || "未分配会计";
    const group = groupMap.get(accountant) || {
      accountant,
      count: 0,
      totalPrice: 0,
      settlementPrice: 0,
      currentRatioExpected: 0,
      ratioBuckets: {}
    };
    group.count += 1;
    const total = toNumber(record.totalPrice);
    const settlement = toNumber(record.settlementPrice);
    const ratio = getSettlementRatio(record);
    if (Number.isFinite(total)) group.totalPrice += total;
    if (Number.isFinite(settlement)) group.settlementPrice += settlement;
    const currentRatio = getAccountantRatio(accountantIndexes, accountant);
    if (Number.isFinite(total) && Number.isFinite(currentRatio)) {
      group.currentRatioExpected += roundMoney(total * currentRatio / 100);
    }
    const ratioBucket = Number.isFinite(ratio) ? String(ratio) : "invalid";
    group.ratioBuckets[ratioBucket] = (group.ratioBuckets[ratioBucket] || 0) + 1;
    groupMap.set(accountant, group);
  });
  return Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      currentRatioDiff: group.settlementPrice - group.currentRatioExpected
    }))
    .sort((left, right) => Math.abs(right.currentRatioDiff) - Math.abs(left.currentRatioDiff));
}

function buildAuditIssues(records, accountantIndexes, firstSeenByAccountant) {
  const issues = [];
  const addIssue = (type, record, detail, severity = "review") => {
    issues.push({
      type,
      severity,
      id: normalizeText(record.id),
      date: normalizeDateOnly(record.date),
      createdAt: normalizeText(record.createdAt),
      dispatcher: normalizeDispatcherTag(record.dispatcher),
      accountant: normalizeText(record.accountant),
      customer: normalizeText(record.customer),
      checkStatus: normalizeText(record.checkStatus),
      isSettled: isRecordSettled(record),
      isAccountantPaid: isRecordPaid(record),
      isDispatcherPaid: isDispatcherPaid(record),
      detail
    });
  };
  records.forEach((record) => {
    const payment = toNumber(record.paymentPrice);
    const total = toNumber(record.totalPrice);
    const settlement = toNumber(record.settlementPrice);
    const premium = getPremiumValue(record);
    const storedPremium = toNumber(record.premiumPrice);
    if (!Number.isFinite(payment) || payment < 0) addIssue("金额字段异常", record, `付款价=${record.paymentPrice}`, "money");
    if (!Number.isFinite(total) || total < 0) addIssue("金额字段异常", record, `会计价=${record.totalPrice}`, "money");
    if (!Number.isFinite(settlement) || settlement < 0) addIssue("金额字段异常", record, `会计结算价=${record.settlementPrice}`, "money");
    if (Number.isFinite(payment) && Number.isFinite(total) && payment + 0.01 < total) {
      const premiumProfit = getTieredPremiumBreakdown(payment - total, getPremiumFormulaKey(record))?.profit || 0;
      addIssue("付款价低于会计价", record, `付款价=${formatMoney(payment)} 会计价=${formatMoney(total)} 溢价收益影响=${formatMoney(premiumProfit)}`, isRecordSettled(record) ? "money" : "review");
    }
    if (Number.isFinite(settlement) && Number.isFinite(total) && settlement - total > 0.01) {
      addIssue("会计结算价高于会计价", record, `结算=${formatMoney(settlement)} 会计价=${formatMoney(total)} 差额=${formatMoney(settlement - total)}`, isCompletedStatus(record) ? "money" : "review");
    }
    if (Number.isFinite(storedPremium) && Number.isFinite(premium) && Math.abs(storedPremium - premium) >= 0.01) {
      addIssue("溢价字段不一致", record, `存储溢价=${formatMoney(storedPremium)} 付款价-会计价=${formatMoney(premium)}`, "review");
    }
    if (isRecordSettled(record) && !isCompletedStatus(record)) {
      addIssue("结算状态异常", record, `已结算状态=${normalizeText(record.checkStatus)}`, "money");
    }
    if (isRecordPaid(record) && !isInvoiceUploaded(record, "accountant") && !isInvoiceOptionalForPayout(record)) {
      addIssue("会计打款流程异常", record, "会计已打款且缺少会计发票", "money");
    }
    if (isDispatcherPaid(record) && !isInvoiceUploaded(record, "dispatcher")) {
      addIssue("接待打款流程异常", record, "接待已打款且缺少接待发票", "money");
    }

    const firstSeen = firstSeenByAccountant.get(normalizeText(record.accountant));
    const ratio = getSettlementRatio(record);
    if (
      firstSeen
      && normalizeDateOnly(firstSeen.time) >= CURRENT_RATIO_RULE_START_DATE
      && Number.isFinite(ratio)
      && Math.abs(ratio - 60) < 0.01
      && isRecordSettled(record)
      && isCompletedStatus(record)
    ) {
      addIssue(
        "5月27日后会计仍按60%结算",
        record,
        `最早出现=${firstSeen.time} 来源=${firstSeen.source} 实际比例=${formatMoney(ratio)}%`,
        "money"
      );
    }
  });
  return issues;
}

function countBy(items, getter) {
  return items.reduce((result, item) => {
    const key = getter(item);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function sumField(rows, field) {
  return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
}

function moneyView(row, keys) {
  const result = {};
  keys.forEach((key) => {
    result[key] = roundMoney(row[key]);
  });
  return result;
}

function buildAudit() {
  const options = parseArgs(process.argv);
  const dataDir = path.resolve(ROOT_DIR, options.dataDir);
  const records = readJsonFile(path.join(dataDir, "records.json"), []);
  const accountants = readJsonFile(path.join(dataDir, "accountants.json"), []);
  const dispatcherConfigs = readJsonFile(path.join(dataDir, "dispatcher-passwords.json"), {});
  const operationLogs = readJsonFile(path.join(dataDir, "accountant-operation-logs.json"), []);
  const currentMonthKey = getCurrentBeijingMonthKey();
  const monthKey = normalizeMonthKey(options.monthKey) || currentMonthKey;
  const accountantIndexes = buildAccountantIndexes(accountants);
  const dispatcherMappings = getDispatcherMappings(dispatcherConfigs, accountantIndexes);
  const firstSeenByAccountant = getFirstSeenByAccountant(records, operationLogs);

  const completedRecords = records.filter(isCompletedStatus);
  const settledRecords = records.filter((record) => isRecordSettled(record) && isCompletedStatus(record));
  const completedUnsettledRecords = records.filter((record) => isCompletedStatus(record) && !isRecordSettled(record));
  const checkedRecords = records.filter((record) => normalizeText(record.checkStatus).toLowerCase() === "checked");
  const pendingRecords = records.filter((record) => normalizeText(record.checkStatus).toLowerCase() === "pending");
  const currentMonthAccountantRecords = settledRecords.filter((record) => isSettlementTargetInMonth(record, "accountant", monthKey, currentMonthKey));
  const currentMonthDispatcherRecords = settledRecords.filter((record) => isSettlementTargetInMonth(record, "dispatcher", monthKey, currentMonthKey));

  const allDispatcherSystem = summarizeDispatcher(settledRecords, dispatcherMappings, { rateFn: getSystemBaseRate });
  const allDispatcherFlatMonthly = summarizeDispatcher(settledRecords, dispatcherMappings, { rateFn: getFlatMonthlyRuleBaseRate });
  const flatMonthlyByDispatcher = new Map(allDispatcherFlatMonthly.map((row) => [row.dispatcher, row]));
  const dispatcherRuleDiff = allDispatcherSystem.map((row) => {
    const flat = flatMonthlyByDispatcher.get(row.dispatcher);
    return {
      dispatcher: row.dispatcher,
      linkedAccountant: row.linkedAccountant,
      count: row.count,
      monthlyCount: row.monthlyCount,
      monthlyFirstCount: row.monthlyFirstCount,
      systemInvoiceAmount: roundMoney(row.invoiceAmount),
      flatMonthlyInvoiceAmount: roundMoney(flat?.invoiceAmount || 0),
      diff: roundMoney((flat?.invoiceAmount || 0) - row.invoiceAmount)
    };
  });

  const standaloneDispatcher = summarizeDispatcher(currentMonthDispatcherRecords, dispatcherMappings, {
    rateFn: getSystemBaseRate,
    excludeLinked: true
  });
  const bossSettlementGroups = summarizeBossSettlementGroups(settledRecords, dispatcherMappings, {
    monthKey,
    currentMonthKey
  });
  const issues = buildAuditIssues(records, accountantIndexes, firstSeenByAccountant);
  const moneyIssues = issues.filter((issue) => issue.severity === "money");
  const reviewIssues = issues.filter((issue) => issue.severity === "review");
  const settledPaymentBelowTotalIssues = issues.filter((issue) => issue.type === "付款价低于会计价" && issue.isSettled);
  const ratioAudit = summarizeAccountants(settledRecords, accountantIndexes);
  const postRule60Issues = issues.filter((issue) => issue.type === "5月27日后会计仍按60%结算");

  const output = {
    generatedAt: getBeijingDateTime(),
    dataDir,
    monthKey,
    rules: {
      accountantRatioRule: "可审计旁证：账号文件无注册时间字段，按会计最早出现在订单或操作日志的时间辅助判断5月27日比例规则。",
      dispatcherPremium: {
        before20260601: "0-1000:45%, 1000-2000:50%, 2000以上:55%",
        from20260601: "0-3000:40%, 3000-5000:45%, 5000以上:50%"
      },
      dispatcherBaseProfit: {
        currentSystem: "普通单8%；月结首月8%；月结后续和续费13%",
        flatMonthlyRuleCheck: "普通单8%；全部月结13%"
      }
    },
    counts: {
      records: records.length,
      completed: completedRecords.length,
      settled: settledRecords.length,
      completedUnsettled: completedUnsettledRecords.length,
      checked: checkedRecords.length,
      pending: pendingRecords.length,
      accountantPaid: records.filter(isRecordPaid).length,
      dispatcherPaid: records.filter(isDispatcherPaid).length,
      currentMonthAccountantRecords: currentMonthAccountantRecords.length,
      currentMonthDispatcherRecords: currentMonthDispatcherRecords.length,
      moneyIssueCount: moneyIssues.length,
      reviewIssueCount: reviewIssues.length,
      postRule60IssueCount: postRule60Issues.length,
      settledPaymentBelowTotalCount: settledPaymentBelowTotalIssues.length
    },
    totals: {
      allSettledDispatcherSystem: {
        invoiceAmount: roundMoney(sumField(allDispatcherSystem, "invoiceAmount")),
        taxAmount: roundMoney(sumField(allDispatcherSystem, "taxAmount")),
        payableAmount: roundMoney(sumField(allDispatcherSystem, "payableAmount"))
      },
      currentMonthStandaloneDispatcher: {
        invoiceAmount: roundMoney(sumField(standaloneDispatcher, "invoiceAmount")),
        taxAmount: roundMoney(sumField(standaloneDispatcher, "taxAmount")),
        payableAmount: roundMoney(sumField(standaloneDispatcher, "payableAmount"))
      },
      currentMonthBossSettlementGroups: {
        invoiceAmount: roundMoney(sumField(bossSettlementGroups, "invoiceAmount")),
        taxAmount: roundMoney(sumField(bossSettlementGroups, "taxAmount")),
        payableAmount: roundMoney(sumField(bossSettlementGroups, "payableAmount")),
        payoutInvoiceAmount: roundMoney(sumField(bossSettlementGroups, "payoutInvoiceAmount")),
        payoutPayableAmount: roundMoney(sumField(bossSettlementGroups, "payoutPayableAmount")),
        paidInvoiceAmount: roundMoney(sumField(bossSettlementGroups, "paidInvoiceAmount")),
        paidPayableAmount: roundMoney(sumField(bossSettlementGroups, "paidPayableAmount"))
      }
    },
    issueCounts: countBy(issues, (item) => item.type),
    moneyIssues,
    reviewIssues,
    dispatcherRuleDiff,
    allDispatcherSystem: allDispatcherSystem.map((row) => ({
      dispatcher: row.dispatcher,
      linkedAccountant: row.linkedAccountant,
      count: row.count,
      monthlyCount: row.monthlyCount,
      monthlyFirstCount: row.monthlyFirstCount,
      ...moneyView(row, ["totalPrice", "paymentPrice", "settlementPrice", "baseProfit", "rawPremium", "premiumProfit", "invoiceAmount", "taxAmount", "payableAmount"])
    })),
    currentMonthStandaloneDispatcher: standaloneDispatcher.map((row) => ({
      dispatcher: row.dispatcher,
      linkedAccountant: row.linkedAccountant,
      count: row.count,
      ...moneyView(row, ["baseProfit", "rawPremium", "premiumProfit", "invoiceAmount", "taxAmount", "payableAmount"])
    })),
    currentMonthBossSettlementGroups: bossSettlementGroups.map((row) => ({
      accountant: row.accountant,
      linkedDispatcherTags: row.linkedDispatcherTags,
      combinedRecordCount: row.combinedRecordCount,
      pendingInvoiceCount: row.combinedPendingInvoiceCount,
      uploadedCount: row.combinedUploadedCount,
      paidCount: row.combinedPaidCount,
      payoutTargetCount: row.combinedPayoutTargets.length,
      ...moneyView(row, [
        "accountantInvoiceAmount",
        "dispatcherInvoiceAmount",
        "dispatcherBaseProfit",
        "dispatcherPremiumProfit",
        "invoiceAmount",
        "taxAmount",
        "payableAmount",
        "payoutInvoiceAmount",
        "payoutPayableAmount",
        "paidInvoiceAmount",
        "paidPayableAmount"
      ])
    })),
    ratioAudit,
    firstSeenByAccountant: Array.from(firstSeenByAccountant.entries()).map(([accountant, info]) => ({
      accountant,
      ...info
    }))
  };

  fs.mkdirSync(path.dirname(options.outputFile), { recursive: true });
  fs.writeFileSync(options.outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  return { output, outputFile: options.outputFile };
}

const { output, outputFile } = buildAudit();
console.log(`settlement audit generated: ${outputFile}`);
console.log(`records=${output.counts.records} settled=${output.counts.settled} completedUnsettled=${output.counts.completedUnsettled}`);
console.log(`month=${output.monthKey} bossGroups=${output.currentMonthBossSettlementGroups.length} standaloneDispatchers=${output.currentMonthStandaloneDispatcher.length}`);
console.log(`moneyIssues=${output.counts.moneyIssueCount} reviewIssues=${output.counts.reviewIssueCount} postRule60=${output.counts.postRule60IssueCount}`);
console.log(`currentMonthBossInvoice=${formatMoney(output.totals.currentMonthBossSettlementGroups.invoiceAmount)} currentMonthBossPayable=${formatMoney(output.totals.currentMonthBossSettlementGroups.payableAmount)}`);
