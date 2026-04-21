const summaryBlock = document.getElementById("summary-block");
const uploadStatus = document.getElementById("upload-status");
const resultSummary = document.getElementById("result-summary");
const resultsHead = document.getElementById("results-head");
const resultsBody = document.getElementById("results-body");
const monthlyPlanHead = document.getElementById("monthly-plan-head");
const monthlyPlanBody = document.getElementById("monthly-plan-body");
const productMixHead = document.getElementById("product-mix-head");
const productMixBody = document.getElementById("product-mix-body");
const loadSampleBtn = document.getElementById("load-sample-btn");
const updateLiveInventoryBtn = document.getElementById("update-live-inventory-btn");
const dataUploadForm = document.getElementById("data-upload-form");
const planForm = document.getElementById("plan-form");
const safetyRuleNote = document.getElementById("safety-rule-note");
const uploadFileInput = dataUploadForm.querySelector('input[name="files"]');
const uploadTypeInput = dataUploadForm.querySelector('select[name="uploadType"]');
const railButtons = Array.from(document.querySelectorAll("[data-page-target]"));
const pages = {
  planning: document.getElementById("page-planning"),
  kpis: document.getElementById("page-kpis"),
};
const hostedKpiButton = railButtons.find((button) => button.dataset.pageTarget === "kpis");
const railChip = document.getElementById("rail-chip");
const railTitle = document.getElementById("rail-title");
const railLead = document.getElementById("rail-lead");
const appRail = document.getElementById("app-rail");
const railToggle = document.getElementById("rail-toggle");
const kpiFilterForm = document.getElementById("kpi-filter-form");
const kpiOutputInput = document.getElementById("kpi-output");
const kpiDateBasisInput = document.getElementById("kpi-date-basis");
const kpiOrderBucketInput = document.getElementById("kpi-order-bucket");
const kpiStartDateInput = document.getElementById("kpi-start-date");
const kpiEndDateInput = document.getElementById("kpi-end-date");
const kpiBadgesRow = document.getElementById("kpi-badges-row");
const kpiQualityRow = document.getElementById("kpi-quality-row");
const kpiCardsGrid = document.getElementById("kpi-cards-grid");
const kpiDetailToggle = document.getElementById("kpi-detail-toggle");
const kpiCardDetailTitle = document.getElementById("kpi-card-detail-title");
const kpiCardDetailCopy = document.getElementById("kpi-card-detail-copy");
const kpiCardDetailFormula = document.getElementById("kpi-card-detail-formula");
const kpiCardDetailFields = document.getElementById("kpi-card-detail-fields");
const kpiCardDetailHead = document.getElementById("kpi-card-detail-head");
const kpiCardDetailBody = document.getElementById("kpi-card-detail-body");
const kpiTabButtons = Array.from(document.querySelectorAll("[data-kpi-tab]"));
const kpiWorkspaceTitle = document.getElementById("kpi-workspace-title");
const kpiWorkspaceContent = document.getElementById("kpi-workspace-content");
const forecastSummaryTitle = document.getElementById("forecast-summary-title");
const forecastSummaryCopy = document.getElementById("forecast-summary-copy");
const forecastSummaryList = document.getElementById("forecast-summary-list");
const openForecastSettingsButton = document.getElementById("open-forecast-settings");
const forecastDialog = document.getElementById("forecast-settings-dialog");
const closeForecastSettingsButton = document.getElementById("close-forecast-settings");
const forecastMonthPicker = document.getElementById("forecast-month-picker");
const forecastYearInput = document.getElementById("forecast-year-input");
const forecastMonthUplift = document.getElementById("forecast-month-uplift");
const forecastProductMixInputs = document.getElementById("forecast-product-mix-inputs");
const forecastMixTotal = document.getElementById("forecast-mix-total");
const forecastStatusPill = document.getElementById("forecast-status-pill");
const forecastBaselineCopy = document.getElementById("forecast-baseline-copy");
const saveForecastSettingsButton = document.getElementById("save-forecast-settings");
const resetForecastSettingsButton = document.getElementById("reset-forecast-settings");
const planningYearInput = document.getElementById("planning-year");
const planningYearSwitcher = document.getElementById("planning-year-switcher");
const plannerCompareLink = document.getElementById("planner-compare-link");
const plannerCurrentLink = document.getElementById("planner-current-link");
const monthlyPlanCopy = document.getElementById("monthly-plan-copy");
const historySectionCopy = document.getElementById("history-section-copy");
const historicalTrendCopy = document.getElementById("historical-trend-copy");
const launchPlanningCopy = document.getElementById("launch-planning-copy");
const historyTabButtons = Array.from(document.querySelectorAll("[data-history-tab]"));
const historyPanels = Array.from(document.querySelectorAll("[data-history-panel]"));
const historicalTotalsHead = document.getElementById("historical-totals-head");
const historicalTotalsBody = document.getElementById("historical-totals-body");
const historicalProductsHead = document.getElementById("historical-products-head");
const historicalProductsBody = document.getElementById("historical-products-body");
const historicalYoyHead = document.getElementById("historical-yoy-head");
const historicalYoyBody = document.getElementById("historical-yoy-body");
const launchReferenceHead = document.getElementById("launch-reference-head");
const launchReferenceBody = document.getElementById("launch-reference-body");
const launchScenariosHead = document.getElementById("launch-scenarios-head");
const launchScenariosBody = document.getElementById("launch-scenarios-body");

let inventoryUploaded = false;
let forecastSettings = {};
let monthlyActualMix = {};
let monthlyActuals = {};
let forecastYear = new Date().getFullYear();
let activePage = "planning";
let activeKpiTab = "orders";
let latestKpiPayload = null;
let latestPlanPayload = null;
let activeKpiCard = "grossProductSales";
let activeKpiCharts = [];
let activeForecastDialogMonth = "";
let activeHistoryTab = "monthly";
const plannerVariant = new URLSearchParams(window.location.search).get("plannerVariant") || "current";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CORE_PRODUCTS = [
  "Birria Bomb 2-Pack",
  "Chile Colorado Bomb 2-Pack",
  "Pozole Bomb 2-Pack",
  "Pozole Verde Bomb 2-Pack",
  "Tinga Bomb 2-Pack",
  "Brine Bomb",
  "Variety Pack",
];
const FORECAST_STORAGE_KEY = "demand-planning-rail-collapsed";
const PAGE_CONTENT = {
  planning: {
    chip: "Demand Planning",
    title: "Lean planner, separate surface.",
    lead: "This planner uses your real core products, rolls bundle sales into them, and helps you decide what to reorder next.",
  },
  kpis: {
    chip: "TikTok KPIs",
    title: "Lean TikTok KPI surface.",
    lead: "This dashboard rebuilds just the order metrics you actually use: sales, AOV, customer counts, and location data.",
  },
};

function number(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value));
}

function integer(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value));
}

function money(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

function moneyPrecise(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function percent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0%";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value) * 100)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanUploadText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\uFEFF/g, "").replace(/\u200B/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUploadColumnName(value) {
  return cleanUploadText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickUploadColumn(columns, exactCandidates, keywordGroups) {
  const normalizedMap = new Map(columns.map((column) => [column, normalizeUploadColumnName(column)]));
  const exact = new Set(exactCandidates.map((candidate) => normalizeUploadColumnName(candidate)));
  for (const [column, normalized] of normalizedMap.entries()) {
    if (exact.has(normalized)) return column;
  }
  for (const keywords of keywordGroups) {
    for (const [column, normalized] of normalizedMap.entries()) {
      if (keywords.every((keyword) => normalized.includes(keyword))) return column;
    }
  }
  return null;
}

function parseUploadNumber(value) {
  const cleaned = cleanUploadText(value)
    .replaceAll(",", "")
    .replaceAll("$", "")
    .replace(/^\((.*)\)$/, "-$1");
  if (!cleaned) return 0;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseUploadDate(value) {
  const raw = cleanUploadText(value);
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (!match) return null;
  let [, month, day, year, hour = "0", minute = "0", second = "0", meridiem = ""] = match;
  let hours = Number(hour);
  if (meridiem) {
    const upper = meridiem.toUpperCase();
    if (upper === "PM" && hours < 12) hours += 12;
    if (upper === "AM" && hours === 12) hours = 0;
  }
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), hours, Number(minute), Number(second)));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function parseCsvText(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim().length);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) => cleanUploadText(header));
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function detectPlanningComponents(productName) {
  const name = cleanUploadText(productName).toLowerCase();
  if (!name) return [];
  if (name.includes("variety pack")) return [["Variety Pack", 1]];
  const components = [];
  const hasChileColorado = name.includes("chile colorado");
  const hasPozoleVerde = name.includes("pozole verde");
  const hasRegularPozole = name.includes("pozole verde and pozole")
    || name.includes("pozole verde + pozole")
    || (name.includes("pozole") && !name.includes("pozole verde"));
  if (hasChileColorado) components.push("Chile Colorado Bomb 2-Pack");
  if (hasPozoleVerde) components.push("Pozole Verde Bomb 2-Pack");
  if (name.includes("birria")) components.push("Birria Bomb 2-Pack");
  if (name.includes("tinga")) components.push("Tinga Bomb 2-Pack");
  if (name.includes("brine")) components.push("Brine Bomb");
  if (hasRegularPozole) components.push("Pozole Bomb 2-Pack");
  const deduped = Array.from(new Set(components));
  if (!deduped.length) return [];
  if (name.includes("bundle")) {
    if (deduped.length === 1) return [[deduped[0], 2]];
    return deduped.map((component) => [component, 1]);
  }
  return [[deduped[0], 1]];
}

function buildPrimarySkuLookup(normalizedRows) {
  const lookup = {};
  normalizedRows.forEach((row) => {
    const sellerSku = cleanUploadText(row.seller_sku_resolved);
    const productName = cleanUploadText(row.product_name);
    if (!sellerSku || !productName || productName.toLowerCase().includes("bundle")) return;
    const components = detectPlanningComponents(productName);
    if (components.length !== 1 || components[0][1] !== 1) return;
    const [componentName] = components[0];
    if (!lookup[componentName]) lookup[componentName] = sellerSku;
  });
  return lookup;
}

function normalizeUploadRows(rawRows, platform) {
  if (!rawRows.length) return [];
  const columns = Object.keys(rawRows[0] || {});
  const orderIdCol = pickUploadColumn(columns, ["Order ID"], [["order", "id"]]);
  const orderStatusCol = pickUploadColumn(columns, ["Order Status"], [["order", "status"]]);
  const orderSubstatusCol = pickUploadColumn(columns, ["Order Substatus"], [["order", "substatus"]]);
  const cancelTypeCol = pickUploadColumn(columns, ["Cancelation/Return Type", "Cancellation/Return Type"], [["cancel", "return", "type"]]);
  const productNameCol = pickUploadColumn(columns, ["Product Name"], [["product", "name"]]);
  const sellerSkuCol = pickUploadColumn(columns, ["Seller SKU"], [["seller", "sku"]]);
  const bundleSkuCol = pickUploadColumn(columns, ["Virtual Bundle Seller SKU", " Virtual Bundle Seller SKU"], [["virtual", "bundle", "seller", "sku"]]);
  const quantityCol = pickUploadColumn(columns, ["Quantity"], [["quantity"]]);
  const returnedQuantityCol = pickUploadColumn(columns, ["Sku Quantity of return", "SKU Quantity of return"], [["return", "quantity"]]);
  const grossSalesCol = pickUploadColumn(columns, ["SKU Subtotal Before Discount"], [["sku", "subtotal", "before", "discount"]]);
  const paidTimeCol = pickUploadColumn(columns, ["Paid Time"], [["paid", "time"]]);
  const createdTimeCol = pickUploadColumn(columns, ["Created Time"], [["created", "time"]]);
  const cancelledTimeCol = pickUploadColumn(columns, ["Cancelled Time", "Canceled Time"], [["cancelled", "time"], ["canceled", "time"]]);

  return rawRows.map((row) => {
    const orderStatus = cleanUploadText(row[orderStatusCol]);
    const orderSubstatus = cleanUploadText(row[orderSubstatusCol]);
    const cancelType = cleanUploadText(row[cancelTypeCol]);
    const productName = cleanUploadText(row[productNameCol]);
    const quantity = parseUploadNumber(row[quantityCol]);
    const returnedQuantity = parseUploadNumber(row[returnedQuantityCol]);
    const grossSales = parseUploadNumber(row[grossSalesCol]);
    const orderDate = parseUploadDate(row[paidTimeCol]) || parseUploadDate(row[createdTimeCol]);
    const statusText = `${orderStatus} ${orderSubstatus} ${cancelType}`.toLowerCase();
    const isCancelled = statusText.includes("cancel") || Boolean(parseUploadDate(row[cancelledTimeCol]));
    const netUnits = isCancelled ? 0 : Math.max(quantity - returnedQuantity, 0);
    return {
      platform: cleanUploadText(platform) || "TikTok",
      order_id: cleanUploadText(row[orderIdCol]),
      order_date: orderDate,
      product_name: productName,
      seller_sku_resolved: cleanUploadText(row[sellerSkuCol]) || cleanUploadText(row[bundleSkuCol]),
      quantity,
      returned_quantity: returnedQuantity,
      gross_sales: grossSales,
      net_units: netUnits,
    };
  }).filter((row) => row.order_date && row.product_name);
}

function aggregateLeanDemandRows(normalizedRows, platform) {
  const skuLookup = buildPrimarySkuLookup(normalizedRows);
  const grouped = new Map();
  normalizedRows.forEach((row) => {
    const components = detectPlanningComponents(row.product_name);
    const totalMultiplier = components.reduce((sum, [, multiplier]) => sum + multiplier, 0);
    components.forEach(([componentName, multiplier]) => {
      const key = `${row.order_date}__${componentName}`;
      const current = grouped.get(key) || {
        date: row.order_date,
        platform: cleanUploadText(platform) || "TikTok",
        product_name: componentName,
        seller_sku_resolved: skuLookup[componentName] || "",
        net_units: 0,
        gross_sales: 0,
      };
      current.net_units += Number(row.net_units || 0) * multiplier;
      current.gross_sales += totalMultiplier ? (Number(row.gross_sales || 0) * multiplier) / totalMultiplier : 0;
      grouped.set(key, current);
    });
  });
  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date) || a.product_name.localeCompare(b.product_name));
}

async function readUploadFileRows(file) {
  const lowerName = String(file.name || "").toLowerCase();
  if (lowerName.endsWith(".xlsx")) {
    if (!window.XLSX) {
      throw new Error("Excel support did not load. Refresh the page and try again.");
    }
    const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheetName = workbook.SheetNames.find((name) => workbook.Sheets[name]) || workbook.SheetNames[0];
    if (!sheetName) return [];
    return window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
  }
  return parseCsvText(await file.text());
}

async function buildLeanUploadPayload(files, platform) {
  const allNormalizedRows = [];
  for (const file of Array.from(files)) {
    const rawRows = await readUploadFileRows(file);
    allNormalizedRows.push(...normalizeUploadRows(rawRows, platform));
  }
  const rows = aggregateLeanDemandRows(allNormalizedRows, platform);
  const uploadedDates = Array.from(new Set(rows.map((row) => row.date))).sort();
  return {
    platform: cleanUploadText(platform) || "TikTok",
    rows,
    uploadedDates,
    sourceRowCount: allNormalizedRows.length,
  };
}

const HEADER_HELP = {
  "Daily velocity": "Average units sold per day from the selected baseline dates.",
  "Order units": "Actual units sold in the selected baseline date range.",
  "Baseline unit mix %": "This product's share of total baseline units sold across the core products.",
  "Gross sales": "Gross product sales in the selected baseline dates.",
  "On hand": "Units physically available right now from the latest inventory snapshot.",
  "In transit": "Units already sent inbound but not available to sell yet.",
  "Transit ETA": "Expected arrival date for the inbound units we are counting.",
  "Usable supply": "Supply we can count for planning right now: on hand plus inbound expected in time.",
  "Weeks good": "How many weeks the usable supply should last at the current daily velocity.",
  "Safety stock": "Extra units kept as protection before the next order should arrive.",
  "Projected stockout date": "Projected stockout date if demand keeps moving at the current rate.",
  "Order-by date": "Latest date to place the order so lead time and safety stock are covered.",
  "Order today": "Recommended units to order today after supply, lead time, and safety stock are applied.",
  "Units in baseline window": "Actual units sold during the selected baseline date range.",
  "Baseline unit share %": "This product's share of all baseline units sold.",
  "Baseline sales share %": "This product's share of all baseline gross sales.",
  "Gross sales in baseline window": "Gross sales for this product during the selected baseline dates.",
  "Planned units": "Units planned for the selected plan year after combining actual months and future forecast months.",
  "Year share %": "This product's share of the full selected plan year units.",
  "Year total units": "Total units for this product across the selected plan year.",
};

function renderHeaderCell(label, options = {}) {
  const help = options.help ?? HEADER_HELP[label];
  if (!help) {
    return `<th>${escapeHtml(label)}</th>`;
  }
  return `
    <th>
      <span class="th-help">
        <span>${escapeHtml(label)}</span>
        <button type="button" class="th-help-trigger" title="${escapeHtml(help)}" aria-label="More info about ${escapeHtml(label)}">?</button>
        <span class="th-help-bubble">${escapeHtml(help)}</span>
      </span>
    </th>
  `;
}

function setStatus(message, isError = false) {
  uploadStatus.textContent = message || "";
  uploadStatus.dataset.error = isError ? "true" : "false";
}

function setActivePage(page) {
  if (page === "kpis") {
    setStatus("TikTok KPIs are not enabled in the hosted planner yet.", true);
    return;
  }
  activePage = page;
  const content = PAGE_CONTENT[page] || PAGE_CONTENT.planning;
  railChip.textContent = content.chip;
  railTitle.textContent = content.title;
  railLead.textContent = content.lead;
  railButtons.forEach((button) => {
    const selected = button.dataset.pageTarget === page;
    button.classList.toggle("is-active", selected);
  });
  Object.entries(pages).forEach(([key, node]) => {
    node.classList.toggle("page-active", key === page);
  });
}

function setActiveHistoryTab(tab) {
  activeHistoryTab = tab;
  historyTabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.historyTab === tab);
  });
  historyPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.historyPanel === tab);
  });
  if (historySectionCopy) {
    historySectionCopy.textContent = tab === "monthly"
      ? "Review the selected plan year month by month, then switch to baseline mix when you need the fallback product split."
      : tab === "baseline"
        ? "Review the fallback product split from the selected baseline window, then switch back to the monthly plan when needed."
        : tab === "trends"
          ? "Review actual performance by year without making the planning page much longer."
          : "Use a proxy launch curve and committed units to sanity-check new product sends.";
  }
}

function defaultProductMix() {
  const share = 100 / CORE_PRODUCTS.length;
  return Object.fromEntries(CORE_PRODUCTS.map((product) => [product, share]));
}

function normalizeProductMix(rawMix = {}, fallbackMix = null) {
  const base = fallbackMix || defaultProductMix();
  const values = CORE_PRODUCTS.map((product) => {
    const raw = rawMix?.[product];
    const numeric = Number(raw);
    return [product, Number.isFinite(numeric) ? Math.max(numeric, 0) : 0];
  });
  const total = values.reduce((sum, [, value]) => sum + value, 0);
  if (total <= 0) {
    return { ...base };
  }
  return Object.fromEntries(values.map(([product, value]) => [product, (value / total) * 100]));
}

function normalizeForecastSettings(defaults = {}) {
  const settings = {};
  const legacy = defaults.forecastDefaults || {};
  Object.entries(legacy).forEach(([monthKey, upliftPct]) => {
    settings[monthKey] = {
      upliftPct: Number(upliftPct || 0),
      productMix: null,
    };
  });
  Object.entries(defaults.forecastSettings || {}).forEach(([monthKey, setting]) => {
    const rawMix = setting?.productMix && Object.keys(setting.productMix || {}).length ? normalizeProductMix(setting.productMix, defaultProductMix()) : null;
    settings[monthKey] = {
      upliftPct: Number(setting?.upliftPct ?? settings[monthKey]?.upliftPct ?? 0),
      productMix: rawMix,
    };
  });
  return settings;
}

function getMonthlyActualMix(monthKey) {
  return monthlyActualMix?.[monthKey] || null;
}

function getMonthlyActuals(monthKey) {
  return monthlyActuals?.[monthKey] || null;
}

function monthKeyFromDate(value) {
  return value ? String(value).slice(0, 7) : "";
}

function monthLabelFromKey(monthKey) {
  if (!monthKey || monthKey.length !== 7) return "Selected month";
  const [year, month] = monthKey.split("-");
  return `${MONTH_LABELS[Math.max(Number(month) - 1, 0)]} ${year}`;
}

function safeShiftDateToYear(value, year) {
  if (!value) return "";
  const [oldYear, month, day] = String(value).split("-").map(Number);
  if (!oldYear || !month || !day) return value;
  const lastDay = new Date(year, month, 0).getDate();
  const nextDay = Math.min(day, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

function buildPlanningYears(summary = {}) {
  const startYear = summary.date_start ? Number(String(summary.date_start).slice(0, 4)) : forecastYear - 1;
  const endYear = summary.date_end ? Number(String(summary.date_end).slice(0, 4)) : forecastYear;
  const years = [];
  for (let year = startYear; year <= endYear + 1; year += 1) {
    years.push(year);
  }
  return years.length ? years : [forecastYear - 1, forecastYear, forecastYear + 1];
}

function renderPlanningYearSwitcher(years) {
  if (!planningYearSwitcher) return;
  planningYearSwitcher.innerHTML = years.map((year) => `
    <button type="button" class="year-chip ${Number(year) === Number(forecastYear) ? "is-active" : ""}" data-jump-year="${year}">
      ${year}
    </button>
  `).join("");
  planningYearSwitcher.querySelectorAll("[data-jump-year]").forEach((button) => {
    button.addEventListener("click", async () => {
      const nextYear = Number(button.dataset.jumpYear || forecastYear);
      if (!Number.isFinite(nextYear)) return;
      forecastYear = nextYear;
      if (planningYearInput) planningYearInput.value = String(nextYear);
      ["baseline-start", "baseline-end", "horizon-start", "horizon-end"].forEach((id) => {
        const input = document.getElementById(id);
        if (input?.value) input.value = safeShiftDateToYear(input.value, nextYear);
      });
      renderForecastSummary();
      await runPlanningFromForm(false);
    });
  });
}

function applyPlannerVariant(summary = {}) {
  const inputControl = document.querySelector('[data-year-control="input"]');
  const switcherControl = document.querySelector('[data-year-control="switcher"]');
  const isYearJump = plannerVariant === "year-jump";
  if (plannerCompareLink) plannerCompareLink.hidden = isYearJump;
  if (plannerCurrentLink) plannerCurrentLink.hidden = !isYearJump;
  if (inputControl) inputControl.hidden = isYearJump;
  if (switcherControl) switcherControl.hidden = !isYearJump;
  if (isYearJump) {
    renderPlanningYearSwitcher(buildPlanningYears(summary));
  }
}

function getSelectedPlanningMonthKey() {
  return monthKeyFromDate(document.getElementById("horizon-start").value || "");
}

function monthHasActuals(monthKey) {
  return Boolean(getMonthlyActuals(monthKey));
}

function isEditableForecastMonth(monthKey) {
  return !monthHasActuals(monthKey);
}

function getForecastSetting(monthKey, { persist = false } = {}) {
  if (!monthKey) {
    return { upliftPct: Number(document.getElementById("uplift-pct").value || 35), productMix: { ...defaultProductMix() } };
  }
  const existing = forecastSettings[monthKey];
  if (!existing) {
    const monthActualMix = getMonthlyActualMix(monthKey);
    const draftSetting = {
      upliftPct: Number(document.getElementById("uplift-pct").value || 35),
      productMix: monthActualMix ? normalizeProductMix(monthActualMix, defaultProductMix()) : null,
    };
    return persist ? (forecastSettings[monthKey] = draftSetting) : draftSetting;
  }
  const normalized = {
    upliftPct: Number(existing?.upliftPct ?? 35),
    productMix: existing?.productMix ? normalizeProductMix(existing?.productMix, defaultProductMix()) : null,
  };
  if (persist) {
    forecastSettings[monthKey] = normalized;
  }
  return normalized;
}

function renderForecastMonthPicker() {
  forecastMonthPicker.innerHTML = MONTH_LABELS.map((label, index) => {
    const monthKey = `${forecastYear}-${String(index + 1).padStart(2, "0")}`;
    return `<option value="${monthKey}">${label} ${forecastYear}</option>`;
  }).join("");
}

function baselineMixLookup() {
  const rows = latestPlanPayload?.productMix?.rows || [];
  return Object.fromEntries(
    rows.map((row) => [String(row.product_name || ""), Number(row.mix_pct || 0) * 100]),
  );
}

function renderForecastProductMixInputs(setting, options = {}) {
  const actualMix = options.actualMix || {};
  const mix = normalizeProductMix(setting?.productMix || actualMix || {}, defaultProductMix());
  const hasSavedMix = Boolean(setting?.productMix && Object.keys(setting.productMix || {}).length);
  const readOnly = Boolean(options.readOnly);
  forecastProductMixInputs.innerHTML = CORE_PRODUCTS.map((product) => `
    <label class="forecast-product-field ${hasSavedMix ? "is-saved" : ""} ${readOnly ? "is-readonly" : ""}">
      <span class="forecast-product-label">
        <strong>${product}</strong>
        <small>${actualMix?.[product] !== undefined ? `${options.actualMixLabel || "Reference"} ${number(actualMix[product])}%` : "No reference mix loaded yet"}</small>
      </span>
      <input type="number" data-product-mix="${product}" value="${Number(mix[product] || 0).toFixed(1).replace(/\\.0$/, "")}" step="0.1" ${readOnly ? "disabled" : ""}>
    </label>
  `).join("");
  updateForecastMixTotal();
}

function updateForecastMixTotal() {
  const total = Array.from(forecastProductMixInputs.querySelectorAll("input[data-product-mix]")).reduce((sum, input) => sum + Number(input.value || 0), 0);
  forecastMixTotal.textContent = `${number(total)}%`;
  forecastMixTotal.dataset.valid = Math.abs(total - 100) <= 0.2 ? "true" : "false";
}

function renderForecastSummary() {
  const monthKey = getSelectedPlanningMonthKey();
  const actualStats = getMonthlyActuals(monthKey);
  const actualMix = getMonthlyActualMix(monthKey);
  const setting = isEditableForecastMonth(monthKey)
    ? getForecastSetting(monthKey, { persist: false })
    : {
        upliftPct: Number(actualStats?.changePctVsPreviousMonth ?? 0),
        productMix: actualMix || baselineMixLookup(),
      };
  document.getElementById("uplift-pct").value = String(setting.upliftPct ?? 35);
  forecastSummaryTitle.textContent = isEditableForecastMonth(monthKey) ? `${monthLabelFromKey(monthKey)} plan` : `${monthLabelFromKey(monthKey)} actuals`;
  forecastSummaryCopy.textContent = isEditableForecastMonth(monthKey)
    ? `Planned change vs prior month: ${setting.upliftPct >= 0 ? "+" : ""}${number(setting.upliftPct)}%.`
    : `Actual change vs previous month: ${actualStats?.changePctVsPreviousMonth === null || actualStats?.changePctVsPreviousMonth === undefined ? "n/a" : `${actualStats.changePctVsPreviousMonth >= 0 ? "+" : ""}${number(actualStats.changePctVsPreviousMonth)}%`}.`;
  if (!setting.productMix) {
    forecastSummaryList.innerHTML = `
      <span class="forecast-summary-pill">${isEditableForecastMonth(monthKey) ? `Plan ${setting.upliftPct >= 0 ? "+" : ""}${number(setting.upliftPct)}%` : "Actual month loaded"}</span>
        <span class="forecast-summary-pill forecast-summary-pill-muted">${isEditableForecastMonth(monthKey) ? "Using selected baseline mix" : "Using actual month mix"}</span>
    `;
    return;
  }
  const sortedMix = Object.entries(setting.productMix).sort((a, b) => b[1] - a[1]).slice(0, 3);
  forecastSummaryList.innerHTML = [
    `<span class="forecast-summary-pill">${isEditableForecastMonth(monthKey) ? `Plan ${setting.upliftPct >= 0 ? "+" : ""}${number(setting.upliftPct)}%` : "Actual month mix"}</span>`,
    ...sortedMix.map(([product, value]) => `<span class="forecast-summary-pill">${product.replace(" Bomb 2-Pack", "").replace(" Bomb", "")} ${number(value)}%</span>`),
  ].join("");
}

function loadForecastDialogMonth(monthKey) {
  activeForecastDialogMonth = monthKey;
  forecastYearInput.value = String(Number(monthKey.slice(0, 4)) || forecastYear);
  forecastMonthPicker.value = monthKey;
  const baselineMix = baselineMixLookup();
  const monthActualMix = getMonthlyActualMix(monthKey);
  const monthActualStats = getMonthlyActuals(monthKey);
  const editable = isEditableForecastMonth(monthKey);
  const setting = editable
    ? getForecastSetting(monthKey)
    : {
        upliftPct: Number(monthActualStats?.changePctVsPreviousMonth ?? 0),
        productMix: monthActualMix || baselineMix,
      };
  forecastMonthUplift.value = String(setting.upliftPct ?? 35);
  forecastMonthUplift.disabled = !editable;
  saveForecastSettingsButton.disabled = !editable;
  saveForecastSettingsButton.hidden = !editable;
  resetForecastSettingsButton.disabled = !editable;
  resetForecastSettingsButton.hidden = !editable;
    const hasSavedMix = Boolean(setting?.productMix && Object.keys(setting.productMix || {}).length && forecastSettings[monthKey]);
    const hasSavedMonth = Boolean(forecastSettings[monthKey]);
  if (!editable) {
    forecastStatusPill.textContent = "Actual month loaded";
    forecastStatusPill.dataset.state = "actual";
  } else {
    forecastStatusPill.textContent = hasSavedMix
      ? "Saved month plan"
      : hasSavedMonth
        ? "Saved month change"
        : "New month setup";
    forecastStatusPill.dataset.state = hasSavedMonth ? "saved" : "new";
  }
  if (!editable && monthActualMix) {
    const changeText = monthActualStats?.changePctVsPreviousMonth === null || monthActualStats?.changePctVsPreviousMonth === undefined
      ? "No previous month to compare."
      : `Actual change vs previous month: ${monthActualStats.changePctVsPreviousMonth >= 0 ? "+" : ""}${number(monthActualStats.changePctVsPreviousMonth)}%.`;
    forecastBaselineCopy.textContent = `The product split below comes from ${monthLabelFromKey(monthKey)} actuals. ${changeText}`;
  } else {
    const baselineStart = document.getElementById("baseline-start").value || "selected start";
    const baselineEnd = document.getElementById("baseline-end").value || "selected end";
    forecastBaselineCopy.textContent = `Reference mix below comes from the selected baseline window: ${baselineStart} to ${baselineEnd}.`;
  }
  renderForecastProductMixInputs(setting, {
    actualMix: editable ? baselineMix : (monthActualMix || baselineMix),
    actualMixLabel: editable ? "Baseline mix" : `Actual ${monthLabelFromKey(monthKey)} mix`,
    readOnly: !editable,
  });
}

function openForecastDialog() {
  const monthKey = getSelectedPlanningMonthKey() || `${forecastYear}-01`;
  renderForecastMonthPicker();
  loadForecastDialogMonth(monthKey);
  forecastDialog.showModal();
}

function closeForecastDialog() {
  forecastDialog.close();
}

function renderSummary(summary, hasInventory) {
  const inventoryLabel = hasInventory
    ? `Live sheet${summary.inventory_as_of ? ` (${summary.inventory_as_of})` : ""}`
    : "Template only";
  const sourceLabel = summary.data_source === "live" ? "Live Firestore" : "Hosted snapshot";
  const dataAsOfLabel = summary.data_as_of || summary.date_end || "—";
  const sourceDetail = summary.data_source_detail || "";
  summaryBlock.innerHTML = `
    <dl class="summary-list">
      <div><dt>Data source</dt><dd>${sourceLabel}</dd></div>
      <div><dt>Data as of</dt><dd>${dataAsOfLabel}</dd></div>
      <div><dt>Order rows</dt><dd>${integer(summary.orders_loaded)}</dd></div>
      <div><dt>Sample rows</dt><dd>${integer(summary.samples_loaded || 0)}</dd></div>
      <div><dt>Planning products</dt><dd>${integer(summary.products_detected)}</dd></div>
      <div><dt>History start</dt><dd>${summary.date_start || "—"}</dd></div>
      <div><dt>History end</dt><dd>${summary.date_end || "—"}</dd></div>
      <div><dt>Inventory</dt><dd>${inventoryLabel}</dd></div>
    </dl>
    ${sourceDetail ? `<p class="summary-note">${sourceDetail}</p>` : ""}
  `;
}

function applyDefaults(defaults) {
  forecastSettings = normalizeForecastSettings(defaults || {});
  monthlyActualMix = defaults.monthlyActualMix || {};
  monthlyActuals = defaults.monthlyActuals || {};
  forecastYear = defaults.forecastYear || forecastYear;
  if (planningYearInput) planningYearInput.value = String(forecastYear);
  document.getElementById("baseline-start").value = defaults.baselineStart || "";
  document.getElementById("baseline-end").value = defaults.baselineEnd || "";
  document.getElementById("horizon-start").value = defaults.horizonStart || "";
  document.getElementById("horizon-end").value = defaults.horizonEnd || "";
  document.getElementById("uplift-pct").value = defaults.upliftPct ?? 0;
  document.getElementById("lead-time-days").value = defaults.leadTimeDays ?? 8;
  document.getElementById("velocity-mode").value = defaults.velocityMode || "sales_only";
  safetyRuleNote.textContent = `Planning period = the future dates you want to cover. Safety stock: ${defaults.safetyRule || ""}`;
  renderForecastSummary();
}

function renderResults(payload) {
  latestPlanPayload = payload;
  const rows = payload.rows || [];
  const summary = payload.summary || {};
  const salesOnly = document.getElementById("velocity-mode").value === "sales_only";
  const columns = salesOnly
      ? [
        ["Product", "product_name"],
        ["Status", "status"],
        ["Daily velocity", "avg_daily_demand"],
        ["Order units", "sales_units_in_baseline"],
          ["Baseline unit mix %", "mix_pct"],
        ["Gross sales", "gross_sales_in_baseline"],
        ["On hand", "on_hand"],
        ["In transit", "in_transit"],
        ["Transit ETA", "transit_eta"],
        ["Usable supply", "current_supply_units"],
        ["Weeks good", "weeks_of_supply"],
        ["Safety stock", "safety_stock_units"],
        ["Projected stockout date", "projected_stockout_date"],
        ["Order-by date", "reorder_date"],
        ["Order today", "recommended_order_units"],
      ]
    : [
        ["Product", "product_name"],
        ["Status", "status"],
        ["Daily velocity", "avg_daily_demand"],
        ["Order units", "sales_units_in_baseline"],
          ["Baseline unit mix %", "mix_pct"],
        ["Samples", "sample_units_in_baseline"],
        ["Units used", "units_used_for_velocity"],
        ["Gross sales", "gross_sales_in_baseline"],
        ["On hand", "on_hand"],
        ["In transit", "in_transit"],
        ["Transit ETA", "transit_eta"],
        ["Usable supply", "current_supply_units"],
        ["Weeks good", "weeks_of_supply"],
        ["Safety stock", "safety_stock_units"],
        ["Projected stockout date", "projected_stockout_date"],
        ["Order-by date", "reorder_date"],
        ["Order today", "recommended_order_units"],
      ];
  resultsHead.innerHTML = `<tr>${columns.map(([label]) => renderHeaderCell(label)).join("")}</tr>`;
  resultSummary.innerHTML = `
    <span>Urgent ${summary.urgent || 0}</span>
    <span>Watch ${summary.watch || 0}</span>
    <span>Healthy ${summary.healthy || 0}</span>
    ${inventoryUploaded ? "" : "<span>No inventory uploaded yet</span>"}
  `;
  if (!rows.length) {
    resultsBody.innerHTML = `<tr><td colspan="${columns.length}" class="empty">No planning rows matched the current inputs.</td></tr>`;
    renderMonthlyPlan(payload.monthlyPlan || { months: [], rows: [] });
    renderProductMix(payload.productMix || { rows: [], totals: {} });
    renderHistoricalTrend(payload.historicalTrend || { years: [], monthlyTotals: [], productMonthly: [], yoyByMonth: [] }, payload.monthlyPlan?.year || forecastYear);
    renderLaunchPlanning(payload.launchPlanning || { rows: [] });
    return;
  }
  const totals = rows.reduce((acc, row) => {
    [
      "sales_units_in_baseline",
      "sample_units_in_baseline",
      "units_used_for_velocity",
      "gross_sales_in_baseline",
      "on_hand",
      "in_transit",
      "current_supply_units",
      "safety_stock_units",
      "recommended_order_units",
    ].forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(row[key] || 0);
    });
    return acc;
  }, {});
  const renderCell = (key, row) => {
    if (key === "status") return `<span class="status status-${String(row.status || "").toLowerCase().replace(/\s+/g, "-")}">${row.status || ""}</span>`;
    if (key === "gross_sales_in_baseline") return money(row[key]);
    if (key === "mix_pct") return percent(row[key]);
    if (key === "safety_stock_units") return `${number(row[key])} (${number(row.safety_stock_weeks)} wks)`;
    if (["product_name", "projected_stockout_date", "reorder_date", "transit_eta"].includes(key)) return row[key] || "";
    return number(row[key]);
  };
  const bodyRows = rows.map((row) => `<tr>${columns.map(([, key]) => `<td>${renderCell(key, row)}</td>`).join("")}</tr>`).join("");
  const totalCell = (key) => {
    if (key === "product_name") return "Totals";
    if (key === "mix_pct") return "100%";
    if (key === "gross_sales_in_baseline") return money(totals[key] || 0);
    if (["sales_units_in_baseline", "sample_units_in_baseline", "units_used_for_velocity", "on_hand", "in_transit", "current_supply_units", "recommended_order_units"].includes(key)) {
      return number(totals[key] || 0);
    }
    return "";
  };
  const totalsRow = `<tr class="totals-row">${columns.map(([, key]) => `<td>${totalCell(key)}</td>`).join("")}</tr>`;
  resultsBody.innerHTML = `${bodyRows}${totalsRow}`;
  renderMonthlyPlan(payload.monthlyPlan || { months: [], rows: [] });
  renderProductMix(payload.productMix || { rows: [], totals: {} });
  renderHistoricalTrend(payload.historicalTrend || { years: [], monthlyTotals: [], productMonthly: [], yoyByMonth: [] }, payload.monthlyPlan?.year || forecastYear);
  renderLaunchPlanning(payload.launchPlanning || { rows: [] });
}

function renderMonthlyPlan(payload) {
  const months = payload.months || [];
  const rows = payload.rows || [];
  const year = payload.year || forecastYear;
  const actualMonths = months.filter((month) => month.mode === "actual").map((month) => month.label);
  if (monthlyPlanCopy) {
    monthlyPlanCopy.textContent = actualMonths.length
      ? `Shows actual monthly units for ${actualMonths.join(", ")} in ${year}. Later months use your saved month plans.`
      : `Shows planned monthly units for ${year} using the selected baseline mix and any saved month-specific overrides.`;
  }
  const columns = [["Product", "product_name"], ...months.map((month) => [month.label, month.key]), [`${year} share %`, "year_mix_pct"], [`${year} total units`, "year_total_units"]];
  const modeRow = months.map((month) => `<th class="table-mode-note">${month.mode === "actual" ? "Actual" : "Forecast"}</th>`).join("");
  monthlyPlanHead.innerHTML = `
    <tr>${columns.map(([label]) => renderHeaderCell(label, {
      help: label === "Product" ? "Core products in the selected plan year." : label.length === 3 ? `${label} units for the selected plan year.` : undefined,
    })).join("")}</tr>
    <tr class="table-mode-row">
      <th></th>
      ${modeRow}
      <th></th>
      <th></th>
    </tr>
  `;
  if (!rows.length) {
    monthlyPlanBody.innerHTML = `<tr><td colspan="${columns.length}" class="empty">Run planning to see Jan to Dec units.</td></tr>`;
    return;
  }
  const totals = rows.reduce((acc, row) => {
    columns.forEach(([, key]) => {
      if (key !== "product_name" && key !== "year_mix_pct") acc[key] = (acc[key] || 0) + Number(row[key] || 0);
    });
    return acc;
  }, {});
  const bodyRows = rows.map((row) => `<tr>${columns.map(([, key]) => {
    if (key === "product_name") return `<td>${row[key] || ""}</td>`;
    if (key === "year_mix_pct") return `<td>${percent(row[key])}</td>`;
    return `<td>${number(row[key])}</td>`;
  }).join("")}</tr>`).join("");
  const totalsRow = `<tr class="totals-row">${columns.map(([, key]) => {
    if (key === "product_name") return "<td>Totals</td>";
    if (key === "year_mix_pct") return "<td>100%</td>";
    return `<td>${number(totals[key])}</td>`;
  }).join("")}</tr>`;
  monthlyPlanBody.innerHTML = `${bodyRows}${totalsRow}`;
}

function renderProductMix(payload) {
  const rows = payload.rows || [];
  const columns = [
    ["Product", "product_name"],
    ["Units in baseline window", "baseline_units"],
    ["Baseline unit share %", "mix_pct"],
    ["Baseline sales share %", "sales_mix_pct"],
    ["Gross sales in baseline window", "gross_sales_in_baseline"],
    ["Unit COGS", "unit_cogs"],
    ["Estimated COGS", "estimated_cogs"],
    ["Planned units", "forecast_units"],
  ];
  productMixHead.innerHTML = `<tr>${columns.map(([label]) => renderHeaderCell(label)).join("")}</tr>`;
  if (!rows.length) {
    productMixBody.innerHTML = `<tr><td colspan="${columns.length}" class="empty">Run planning to see product mix.</td></tr>`;
    return;
  }
  const totals = rows.reduce((acc, row) => {
    ["baseline_units", "gross_sales_in_baseline", "estimated_cogs", "forecast_units"].forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(row[key] || 0);
    });
    return acc;
  }, {});
  const bodyRows = rows.map((row) => `<tr>${columns.map(([, key]) => {
    if (key === "product_name") return `<td>${row[key] || row.name || "—"}</td>`;
    if (key === "mix_pct" || key === "sales_mix_pct") return `<td>${percent(row[key])}</td>`;
    if (key === "unit_cogs") return `<td>${moneyPrecise(row[key])}</td>`;
    if (key === "estimated_cogs") return `<td>${money(row[key])}</td>`;
    if (key === "gross_sales_in_baseline") return `<td>${money(row[key])}</td>`;
    return `<td>${number(row[key])}</td>`;
  }).join("")}</tr>`).join("");
  const totalsRow = `<tr class="totals-row">${columns.map(([, key]) => {
    if (key === "product_name") return "<td>Totals</td>";
    if (key === "mix_pct" || key === "sales_mix_pct") return "<td>100%</td>";
    if (key === "unit_cogs") return "<td>—</td>";
    if (key === "estimated_cogs") return `<td>${money(totals[key])}</td>`;
    if (key === "gross_sales_in_baseline") return `<td>${money(totals[key])}</td>`;
    return `<td>${number(totals[key])}</td>`;
  }).join("")}</tr>`;
  productMixBody.innerHTML = `${bodyRows}${totalsRow}`;
}

function renderHistoricalTrend(payload, focusYear) {
  const years = payload.years || [];
  const monthlyTotals = payload.monthlyTotals || [];
  const productMonthly = payload.productMonthly || [];
  const yoyByMonth = payload.yoyByMonth || [];
  if (historicalTrendCopy) {
    historicalTrendCopy.textContent = years.length
      ? `Shows actual units for ${years.join(", ")}. Product detail focuses on ${focusYear}.`
      : "Run planning to load actual history.";
  }

  const totalColumns = [["Year", "year"], ...MONTH_LABELS.map((label, index) => [`${label}`, `${Number(focusYear) - 2}-${String(index + 1).padStart(2, "0")}`]), ["Year total", "year_total_units"]];
  if (years.length) {
    const actualTotalColumns = [["Year", "year"], ...MONTH_LABELS.map((label, index) => [`${label}`, `m${index + 1}`]), ["Year total", "year_total_units"]];
    historicalTotalsHead.innerHTML = `<tr>${actualTotalColumns.map(([label]) => `<th>${label}</th>`).join("")}</tr>`;
    historicalTotalsBody.innerHTML = monthlyTotals.map((row) => {
      const year = Number(row.year);
      const cells = [`<td>${year}</td>`];
      MONTH_LABELS.forEach((_, index) => {
        cells.push(`<td>${number(row[`${year}-${String(index + 1).padStart(2, "0")}`])}</td>`);
      });
      cells.push(`<td>${number(row.year_total_units)}</td>`);
      return `<tr>${cells.join("")}</tr>`;
    }).join("");
  } else {
    historicalTotalsHead.innerHTML = "";
    historicalTotalsBody.innerHTML = `<tr><td colspan="14" class="empty">Run planning to load actual history.</td></tr>`;
  }

  const productColumns = [["Product", "product_name"], ...MONTH_LABELS.map((label, index) => [`${label}`, `${focusYear}-${String(index + 1).padStart(2, "0")}`]), [`${focusYear} total`, "year_total_units"]];
  historicalProductsHead.innerHTML = `<tr>${productColumns.map(([label]) => `<th>${label}</th>`).join("")}</tr>`;
  if (!productMonthly.length) {
    historicalProductsBody.innerHTML = `<tr><td colspan="${productColumns.length}" class="empty">No product history loaded yet.</td></tr>`;
  } else {
    historicalProductsBody.innerHTML = productMonthly.map((row) => `<tr>${productColumns.map(([, key]) => {
      if (key === "product_name") return `<td>${row[key] || ""}</td>`;
      return `<td>${number(row[key])}</td>`;
    }).join("")}</tr>`).join("");
  }

  const yoyColumns = [["Month", "label"], [`${focusYear - 1} units`, "previous_units"], [`${focusYear} units`, "current_units"], ["YoY change %", "yoy_pct"]];
  historicalYoyHead.innerHTML = `<tr>${yoyColumns.map(([label]) => `<th>${label}</th>`).join("")}</tr>`;
  if (!yoyByMonth.length) {
    historicalYoyBody.innerHTML = `<tr><td colspan="${yoyColumns.length}" class="empty">No YoY history loaded yet.</td></tr>`;
  } else {
    historicalYoyBody.innerHTML = yoyByMonth.map((row) => `<tr>${yoyColumns.map(([, key]) => {
      if (key === "label") return `<td>${row[key] || ""}</td>`;
      if (key === "yoy_pct") return `<td>${row[key] === null || row[key] === undefined ? "—" : percent(row[key])}</td>`;
      return `<td>${number(row[key])}</td>`;
    }).join("")}</tr>`).join("");
  }
}

function renderLaunchPlanning(payload) {
  const rows = payload?.rows || [];
  if (launchPlanningCopy) {
    launchPlanningCopy.textContent = rows.length
      ? "Use the proxy launch curve to compare what you already sent versus low, base, and high demand cases."
      : "Run planning to load launch references and send scenarios.";
  }

  const referenceColumns = [
    ["Product", "product_name"],
    ["Launch date", "launch_date"],
    ["Proxy product", "proxy_product_name"],
    ["Proxy first 7 days", "proxy_first_7_day_units"],
    ["Proxy first 14 days", "proxy_first_14_day_units"],
    ["Proxy first 30 days", "proxy_first_30_day_units"],
    ["Proxy 30-day daily velocity", "proxy_first_30_day_daily_velocity"],
  ];
  launchReferenceHead.innerHTML = `<tr>${referenceColumns.map(([label]) => `<th>${label}</th>`).join("")}</tr>`;
  if (!rows.length) {
    launchReferenceBody.innerHTML = `<tr><td colspan="${referenceColumns.length}" class="empty">Run planning to load launch references.</td></tr>`;
  } else {
    launchReferenceBody.innerHTML = rows.map((row) => `<tr>${referenceColumns.map(([, key]) => {
      if (["product_name", "launch_date", "proxy_product_name"].includes(key)) return `<td>${row[key] || "—"}</td>`;
      return `<td>${number(row[key])}</td>`;
    }).join("")}</tr>`).join("");
  }

  const scenarioColumns = [
    ["Product", "product_name"],
    ["Committed units", "launch_units_committed"],
    ["Target cover weeks", "launch_cover_weeks_target"],
    ["Low daily velocity", "low_daily_velocity"],
    ["Base daily velocity", "base_daily_velocity"],
    ["High daily velocity", "high_daily_velocity"],
    ["Low cover weeks", "low_weeks_of_cover"],
    ["Base cover weeks", "base_weeks_of_cover"],
    ["High cover weeks", "high_weeks_of_cover"],
    ["Base send units", "base_send_units"],
  ];
  launchScenariosHead.innerHTML = `<tr>${scenarioColumns.map(([label]) => `<th>${label}</th>`).join("")}</tr>`;
  if (!rows.length) {
    launchScenariosBody.innerHTML = `<tr><td colspan="${scenarioColumns.length}" class="empty">Run planning to load launch scenarios.</td></tr>`;
    return;
  }
  launchScenariosBody.innerHTML = rows.map((row) => `<tr>${scenarioColumns.map(([, key]) => {
    if (key === "product_name") return `<td>${row[key] || ""}</td>`;
    if (key === "launch_cover_weeks_target" || key.endsWith("weeks_of_cover")) return `<td>${row[key] === null || row[key] === undefined ? "—" : number(row[key])}</td>`;
    return `<td>${number(row[key])}</td>`;
  }).join("")}</tr>`).join("");
}

function formatMetric(value, format = "text") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  if (format === "money") return money(value);
  if (format === "percent") return percent(value);
  if (format === "integer") return integer(value);
  if (format === "number") return number(value);
  return value || "—";
}

function currentKpiSources() {
  const selected = Array.from(kpiFilterForm.querySelectorAll('.source-pill input[type="checkbox"]:checked')).map((input) => input.value);
  return selected.length ? selected : ["Sales"];
}

function renderInlineTable(columns, rows, emptyMessage, className = "") {
  const head = `<thead><tr>${columns.map((column) => `<th>${column.label}</th>`).join("")}</tr></thead>`;
  if (!rows.length) {
    return `
      <div class="table-wrap ${className}">
        <table>
          ${head}
          <tbody><tr><td colspan="${columns.length}" class="empty">${emptyMessage}</td></tr></tbody>
        </table>
      </div>
    `;
  }
  const body = rows.map((row) => `
    <tr>
      ${columns.map((column) => `<td>${column.render ? column.render(row[column.key], row) : formatMetric(row[column.key], column.format)}</td>`).join("")}
    </tr>
  `).join("");
  return `
    <div class="table-wrap ${className}">
      <table>
        ${head}
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function chartCanvas(id) {
  return `<div class="chart-shell"><canvas id="${id}" class="chart-canvas"></canvas></div>`;
}

function destroyKpiCharts() {
  activeKpiCharts.forEach((chart) => {
    try {
      chart.destroy();
    } catch (error) {
      // no-op
    }
  });
  activeKpiCharts = [];
}

function createKpiChart(id, config) {
  if (typeof Chart === "undefined") return null;
  const canvas = document.getElementById(id);
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  const chart = new Chart(canvas.getContext("2d"), config);
  activeKpiCharts.push(chart);
  return chart;
}

function baseChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 700,
      easing: "easeOutQuart",
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: "#607086",
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        backgroundColor: "rgba(20, 32, 58, 0.92)",
        titleColor: "#f7fbff",
        bodyColor: "#f7fbff",
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: "#607086", maxRotation: 0, autoSkip: true },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#607086" },
        grid: { color: "rgba(123, 140, 165, 0.14)" },
      },
    },
  };
}

function buildLineChart(rows, series, dateKey = "reporting_date") {
  if (!rows.length) return `<div class="empty-panel">No trend rows yet.</div>`;
  const width = 620;
  const height = 180;
  const padX = 18;
  const padY = 20;
  const allValues = rows.flatMap((row) => series.map((item) => Number(row[item.key] || 0)));
  const maxValue = Math.max(...allValues, 1);
  const stepX = rows.length === 1 ? 0 : (width - padX * 2) / (rows.length - 1);
  const yFor = (value) => height - padY - ((Number(value || 0) / maxValue) * (height - padY * 2));
  const pointsFor = (key) => rows.map((row, index) => `${padX + (stepX * index)},${yFor(row[key])}`).join(" ");
  const lineMarkup = series.map((item) => `<polyline fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${pointsFor(item.key)}"></polyline>`).join("");
  const labels = [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]]
    .filter(Boolean)
    .map((row, index) => `<span>${index === 1 && rows.length < 3 ? "" : (row[dateKey] || "")}</span>`)
    .join("");
  return `
    <div class="chart-panel">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" class="chart-axis"></line>
        ${lineMarkup}
      </svg>
      <div class="chart-labels">${labels}</div>
      <div class="chart-legend">
        ${series.map((item) => `<span><i style="background:${item.color}"></i>${item.label}</span>`).join("")}
      </div>
    </div>
  `;
}

function buildBarRows(rows, labelKey, valueKey, { valueFormat = "integer", shareKey = "share", emptyMessage = "No rows yet." } = {}) {
  if (!rows.length) return `<div class="empty-panel">${emptyMessage}</div>`;
  const maxValue = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return `
    <div class="bar-stack">
      ${rows.map((row) => {
        const value = Number(row[valueKey] || 0);
        const share = row[shareKey] != null ? percent(row[shareKey]) : "";
        return `
          <div class="bar-row">
            <div class="bar-row-head">
              <span>${row[labelKey] || "—"}</span>
              <span>${formatMetric(value, valueFormat)} ${share}</span>
            </div>
            <div class="bar-track"><span style="width:${Math.max((value / maxValue) * 100, 2)}%"></span></div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function buildDonutLegend(rows, labelKey, valueKey, totalLabel = "Total") {
  if (!rows.length) return `<div class="empty-panel">No location rows yet.</div>`;
  const colors = ["#35528d", "#4180e2", "#1d8c81", "#22b8a7", "#f3a31a", "#ff7d12", "#7856d8", "#7d8799"];
  const total = rows.reduce((sum, row) => sum + Number(row[valueKey] || 0), 0) || 1;
  let cursor = 0;
  const slices = rows.map((row, index) => {
    const start = (cursor / total) * 360;
    cursor += Number(row[valueKey] || 0);
    const end = (cursor / total) * 360;
    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
  }).join(", ");
  return `
    <div class="donut-layout">
      <div class="donut-chart" style="--donut:${slices}">
        <div class="donut-center">
          <span>${totalLabel}</span>
          <strong>${integer(total)}</strong>
        </div>
      </div>
      <div class="donut-legend">
        ${rows.map((row, index) => `<div><i style="background:${colors[index % colors.length]}"></i><span>${row[labelKey] || "—"}</span><strong>${integer(row[valueKey])}</strong></div>`).join("")}
      </div>
    </div>
  `;
}

function buildCohortHeatmap(rows) {
  if (!rows.length) return `<div class="empty-panel">No cohort rows yet.</div>`;
  const monthKeys = Object.keys(rows[0]).filter((key) => key.startsWith("m"));
  return `
    <div class="table-wrap">
      <table class="heatmap-table">
        <thead>
          <tr>
            <th>Cohort</th>
            ${monthKeys.map((key) => `<th>${key.toUpperCase()}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.cohort || "—"}</td>
              ${monthKeys.map((key) => {
                const value = Number(row[key] || 0);
                return `<td class="heat-cell" style="--heat:${Math.min(value, 1)}">${percent(value)}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderBadgeRows(payload) {
  const badges = payload.badges || {};
  const freshness = payload.freshness || [];
  const audit = payload.tabs?.audit?.dataQuality || {};
  const badgeItems = freshness.map((item) => [item.label, item.value]).filter(([, value]) => value);
  const contextItems = [
    ["Selected slice", badges.sliceLabel],
    ["Sources", badges.sourcesLabel],
    ["Date basis", badges.dateBasisLabel],
    ["Order bucket", badges.orderBucketLabel],
  ].filter(([, value]) => value);
  kpiBadgesRow.innerHTML = badgeItems.map(([label, value]) => `<span class="badge-pill"><strong>${label}:</strong> ${value}</span>`).join("");
  const qualityItems = [
    ...contextItems,
    ["Rows loaded", audit.rows_loaded],
    ["Orders loaded", audit.orders_loaded],
    ["Blank customer rows", audit.blank_customer_rows],
    ["Rows without city", audit.rows_without_city],
    ["Rows without ZIP", audit.rows_without_zip],
    ["Canceled rows", audit.canceled_rows],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");
  kpiQualityRow.innerHTML = qualityItems.map(([label, value]) => {
    const renderedValue = typeof value === "number" ? integer(value) : value;
    return `<span class="badge-pill badge-pill-muted"><strong>${label}:</strong> ${renderedValue}</span>`;
  }).join("");
}

function renderMetricCards(cards) {
  const items = [
    ["grossProductSales", "Gross product sales", cards.grossProductSales, "money", "Merchandise before discounts and refunds in the selected slice."],
    ["netProductSales", "Net product sales", cards.netProductSales, "money", "Gross product sales minus seller discount and refund amount."],
    ["aov", "AOV", cards.aov, "money", "Gross product sales divided by paid orders."],
    ["paidOrders", "Paid orders", cards.paidOrders, "integer", "Unique paid orders in the selected slice."],
    ["unitsSold", "Units sold", cards.unitsSold, "integer", "Sales units in the selected slice."],
    ["uniqueCustomers", "Unique customers", cards.uniqueCustomers, "integer", "Distinct customer proxies in the selected slice."],
    ["newCustomers", "New customers", cards.newCustomers, "integer", "Customers whose first observed valid order is in this slice."],
    ["repeatCustomers", "Repeat customers", cards.repeatCustomers, "integer", "Customers with a prior valid order who placed an order in this slice."],
    ["repeatCustomerRate", "Repeat customer rate", cards.repeatCustomerRate, "percent", "Repeat customers divided by unique customers in the selected slice."],
  ];
  kpiCardsGrid.innerHTML = items.map(([key, label, value, format, copy]) => `
    <article class="kpi-card ${activeKpiCard === key ? "is-active" : ""}" data-kpi-card="${key}" role="button" tabindex="0">
      <p class="eyebrow">${label}</p>
      <strong>${formatMetric(value, format)}</strong>
      <p>${copy}</p>
    </article>
  `).join("");
  Array.from(kpiCardsGrid.querySelectorAll("[data-kpi-card]")).forEach((card) => {
    const activate = () => {
      activeKpiCard = card.dataset.kpiCard || "grossProductSales";
      renderMetricCards(cards);
      renderCardDetail(latestKpiPayload);
    };
    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}

function renderCardDetail(payload) {
  const detail = payload?.cardDetail || {};
  const detailMap = payload?.cardDetails || {};
  const cards = payload?.cards || {};
  const activeSource = payload?.tabs?.orders?.snapshot || {};
  const configs = {
    grossProductSales: {
      title: "Orders Gross Sales",
      description: "Paid-time order-export view before discounts and refunds.",
      formula: "Gross Product Sales = SUM(SKU Subtotal Before Discount)",
      fieldsUsed: "SKU Subtotal Before Discount, Paid Time",
      rows: [
        { label: "Gross product sales", value: cards.grossProductSales },
        { label: "Net product sales", value: cards.netProductSales },
        { label: "AOV", value: cards.aov },
        { label: "Paid orders", value: cards.paidOrders },
      ],
    },
    netProductSales: {
      title: "Net Product Sales",
      description: "Net merchandise after seller discount and refund amount.",
      formula: "Net Product Sales = Gross Product Sales - Discounts - Refund Amount",
      fieldsUsed: "SKU Subtotal After Discount, Order Refund Amount",
      rows: [
        { label: "Net product sales", value: cards.netProductSales },
        { label: "Gross product sales", value: cards.grossProductSales },
      ],
    },
    aov: {
      title: "Average Order Value",
      description: "Gross product sales divided by paid orders in the selected slice.",
      formula: "AOV = Gross Product Sales / Paid Orders",
      fieldsUsed: "Gross Product Sales, Paid Orders",
      rows: [
        { label: "AOV", value: cards.aov },
        { label: "Paid orders", value: cards.paidOrders },
      ],
    },
    paidOrders: {
      title: "Paid Orders",
      description: "Unique paid orders in the selected slice.",
      formula: "COUNT DISTINCT(Order ID WHERE Paid Time IS NOT NULL)",
      fieldsUsed: "Order ID, Paid Time",
      rows: [{ label: "Paid orders", value: cards.paidOrders }],
    },
    unitsSold: {
      title: "Units Sold",
      description: "Sales units in the selected slice.",
      formula: "SUM(Units Sold)",
      fieldsUsed: "Quantity, Returned Quantity",
      rows: [
        { label: "Units sold", value: cards.unitsSold },
        { label: "Units per paid order", value: activeSource.unitsPerPaidOrder },
      ],
    },
    uniqueCustomers: {
      title: "Unique Customers",
      description: "Distinct customer proxies in the selected slice.",
      formula: "COUNT DISTINCT(Customer Proxy)",
      fieldsUsed: "Buyer Username, Buyer Nickname, Recipient",
      rows: [{ label: "Unique customers", value: cards.uniqueCustomers }],
    },
    newCustomers: {
      title: "New Customers",
      description: "Customers whose first observed valid order is in the selected slice.",
      formula: "COUNT(Customer Proxy WHERE First Valid Order Date IN Slice)",
      fieldsUsed: "Customer Proxy, First Order Date",
      rows: [{ label: "New customers", value: cards.newCustomers }],
    },
    repeatCustomers: {
      title: "Repeat Customers",
      description: "Customers with a prior valid order who placed an order in this slice.",
      formula: "COUNT(Customer Proxy WHERE First Valid Order Date < Slice Start)",
      fieldsUsed: "Customer Proxy, First Order Date",
      rows: [{ label: "Repeat customers", value: cards.repeatCustomers }],
    },
    repeatCustomerRate: {
      title: "Repeat Customer Rate",
      description: "Repeat customers divided by unique customers in the selected slice.",
      formula: "Repeat Customer Rate = Repeat Customers / Unique Customers",
      fieldsUsed: "Repeat Customers, Unique Customers",
      rows: [
        { label: "Repeat customer rate", value: cards.repeatCustomerRate },
        { label: "Repeat customers", value: cards.repeatCustomers },
        { label: "Unique customers", value: cards.uniqueCustomers },
      ],
    },
  };
  const selected = detailMap[activeKpiCard] || configs[activeKpiCard] || detail;
  const rows = selected?.rows || [];
  kpiCardDetailTitle.textContent = selected?.title || "Orders Gross Sales";
  kpiCardDetailCopy.textContent = selected?.description || "";
  kpiCardDetailFormula.textContent = selected?.formula || "";
  kpiCardDetailFields.textContent = selected?.fieldsUsed || "";
  kpiCardDetailHead.innerHTML = "<tr><th>Metric</th><th>Value</th></tr>";
  kpiCardDetailBody.innerHTML = rows.length
    ? rows.map((row) => {
      const value = row.label?.toLowerCase().includes("rate")
        ? percent(row.value)
        : (row.label?.toLowerCase().includes("orders") || row.label?.toLowerCase().includes("units") || row.label?.toLowerCase().includes("customers"))
          ? integer(row.value)
          : money(row.value);
      return `<tr><td>${row.label || ""}</td><td>${value}</td></tr>`;
    }).join("")
    : '<tr><td colspan="2" class="empty">No detail rows.</td></tr>';
  const hint = kpiDetailToggle?.querySelector(".disclosure-hint");
  if (hint) hint.textContent = kpiDetailToggle.open ? "Collapse" : "Expand";
}

function renderDisclosure(title, body, { open = false, eyebrow = "Details" } = {}) {
  return `
    <details class="workspace-disclosure" ${open ? "open" : ""}>
      <summary class="workspace-disclosure-summary">
        <div>
          <p class="eyebrow">${eyebrow}</p>
          <h3>${title}</h3>
        </div>
        <span class="workspace-disclosure-hint">${open ? "Collapse" : "Expand"}</span>
      </summary>
      <div class="workspace-disclosure-body">
        ${body}
      </div>
    </details>
  `;
}

function renderOrdersTab(tab) {
  const dailyRows = tab.dailyRows || [];
  const snapshot = tab.snapshot || {};
  const health = tab.health || {};
  return `
    <div class="workspace-grid">
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Orders</p>
        <h3>Orders revenue trend</h3>
        <p class="panel-copy">Gross and net product sales by paid time.</p>
        ${chartCanvas("orders-revenue-chart")}
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Orders</p>
        <h3>Orders snapshot</h3>
        <div class="workspace-list">
          <div><span>Net product sales</span><strong>${money(snapshot.netProductSales)}</strong></div>
          <div><span>AOV</span><strong>${money(snapshot.aov)}</strong></div>
          <div><span>Paid orders</span><strong>${integer(snapshot.paidOrders)}</strong></div>
          <div><span>Sales units</span><strong>${integer(snapshot.salesUnits)}</strong></div>
          <div><span>Units per paid order</span><strong>${number(snapshot.unitsPerPaidOrder)}</strong></div>
          <div><span>New customers</span><strong>${integer(snapshot.newCustomers)}</strong></div>
          <div><span>Repeat customers</span><strong>${integer(snapshot.repeatCustomers)}</strong></div>
          <div><span>Repeat customer rate</span><strong>${percent(snapshot.repeatCustomerRate)}</strong></div>
        </div>
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Mix</p>
        <h3>Status mix</h3>
        <p class="panel-copy">Order status composition for the selected slice.</p>
        ${chartCanvas("orders-status-chart")}
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Health</p>
        <h3>Order health</h3>
        <div class="workspace-list">
          <div><span>Valid orders</span><strong>${integer(health.valid_orders)}</strong></div>
          <div><span>Cancellation rate</span><strong>${percent(health.cancellation_rate)}</strong></div>
          <div><span>Refund rate</span><strong>${percent(health.refund_rate)}</strong></div>
          <div><span>Return rate</span><strong>${percent(health.return_rate)}</strong></div>
          <div><span>Delivery rate</span><strong>${percent(health.delivery_rate)}</strong></div>
        </div>
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Products</p>
        <h3>Top products</h3>
        ${chartCanvas("orders-products-chart")}
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Customers</p>
        <h3>Top customer cities</h3>
        ${chartCanvas("orders-cities-chart")}
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Retention</p>
        <h3>Cohort heatmap</h3>
        ${buildCohortHeatmap(tab.cohortRows || [])}
      </section>
      <section class="workspace-card workspace-card-wide">
        ${renderDisclosure("Orders daily output", renderInlineTable(
          [
            { label: "Date", key: "reporting_date" },
            { label: "Gross sales", key: "gross_product_sales", format: "money" },
            { label: "Net sales", key: "net_product_sales", format: "money" },
            { label: "Paid orders", key: "paid_orders", format: "integer" },
            { label: "Valid orders", key: "valid_orders", format: "integer" },
            { label: "Units", key: "units_sold", format: "integer" },
            { label: "Customers", key: "unique_customers", format: "integer" },
          ],
          dailyRows,
          "No daily rows yet.",
        ), { open: false })}
      </section>
    </div>
  `;
}

function renderFinanceTab(tab) {
  const summary = tab.summary || {};
  return `
    <div class="workspace-grid">
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Finance</p>
        <h3>Statement trend</h3>
        <p class="panel-copy">Gross sales and net sales by statement date.</p>
        ${chartCanvas("finance-trend-chart")}
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Finance</p>
        <h3>Finance snapshot</h3>
        <div class="workspace-list">
          <div><span>Gross sales</span><strong>${money(summary.gross_sales)}</strong></div>
          <div><span>Gross sales refund</span><strong>${money(summary.gross_sales_refund)}</strong></div>
          <div><span>Seller discount</span><strong>${money(summary.seller_discount)}</strong></div>
          <div><span>Seller discount refund</span><strong>${money(summary.seller_discount_refund)}</strong></div>
          <div><span>Net sales</span><strong>${money(summary.net_sales)}</strong></div>
          <div><span>Shipping</span><strong>${money(summary.shipping)}</strong></div>
          <div><span>Fees</span><strong>${money(summary.fees)}</strong></div>
          <div><span>Adjustments</span><strong>${money(summary.adjustments)}</strong></div>
          <div><span>Payout amount</span><strong>${money(summary.payout_amount)}</strong></div>
        </div>
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Finance</p>
        <h3>Expense structure</h3>
        ${chartCanvas("finance-expense-chart")}
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Reconciliation</p>
        <h3>Statement coverage</h3>
        <div class="workspace-list">
          <div><span>Matched orders</span><strong>${integer(tab.reconciliationSummary?.matched_orders)}</strong></div>
          <div><span>Unmatched statement rows</span><strong>${integer(tab.reconciliationSummary?.unmatched_statement_rows)}</strong></div>
          <div><span>Matched statement amount</span><strong>${money(tab.reconciliationSummary?.matched_statement_amount)}</strong></div>
          <div><span>Actual fee total</span><strong>${money(tab.reconciliationSummary?.actual_fee_total)}</strong></div>
        </div>
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Details</p>
        <h3>Expense detail</h3>
        ${renderInlineTable(
          [
            { label: "Category", key: "category" },
            { label: "Line item", key: "line_item" },
            { label: "Amount", key: "amount", format: "money" },
          ],
          tab.expenseDetailRows || [],
          "No finance detail rows yet.",
        )}
      </section>
    </div>
  `;
}

function renderReconciliationTab(tab) {
  return `
    <div class="workspace-grid">
      <section class="workspace-card">
        <p class="eyebrow">Reconciliation</p>
        <h3>Summary</h3>
        <div class="workspace-list">
          <div><span>Matched orders</span><strong>${integer(tab.summary?.matched_orders)}</strong></div>
          <div><span>Unmatched statement rows</span><strong>${integer(tab.summary?.unmatched_statement_rows)}</strong></div>
          <div><span>Matched statement amount</span><strong>${money(tab.summary?.matched_statement_amount)}</strong></div>
          <div><span>Actual fee total</span><strong>${money(tab.summary?.actual_fee_total)}</strong></div>
        </div>
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Matched</p>
        <h3>Matched statement rows</h3>
        ${renderInlineTable(
          [
            { label: "Order ID", key: "order_id" },
            { label: "Statement date", key: "statement_date" },
            { label: "Amount", key: "amount", format: "money" },
            { label: "Fee bucket", key: "fee_bucket" },
          ],
          tab.matchedRows || [],
          "No matched rows yet.",
        )}
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Unmatched</p>
        <h3>Statement rows</h3>
        ${renderInlineTable(
          [
            { label: "Statement date", key: "statement_date" },
            { label: "Order ID", key: "order_id" },
            { label: "Amount", key: "amount", format: "money" },
            { label: "Line item", key: "line_item" },
          ],
          tab.unmatchedStatementRows || [],
          "No unmatched statement rows.",
        )}
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Unmatched</p>
        <h3>Order rows</h3>
        ${renderInlineTable(
          [
            { label: "Order ID", key: "order_id" },
            { label: "Reporting date", key: "reporting_date" },
            { label: "Net sales", key: "net_product_sales", format: "money" },
          ],
          tab.unmatchedOrderRows || [],
          "No unmatched order rows.",
        )}
      </section>
    </div>
  `;
}

function renderProductsTab(tab) {
  const summary = tab.summary || {};
  const inventorySnapshot = tab.inventorySnapshot || {};
  const planningSignal = tab.planningSignal || {};
  const coreRows = tab.detailRows || [];
  const listingRows = (tab.listingRows && tab.listingRows.length ? tab.listingRows : coreRows) || [];
  return `
    <div class="workspace-grid">
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Core products</p>
        <h3>Core product mix</h3>
        ${chartCanvas("products-top-chart")}
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Summary</p>
        <h3>Core product summary</h3>
        <div class="workspace-list">
          <div><span>Core products</span><strong>${integer(summary.coreProducts || summary.trackedProducts)}</strong></div>
          <div><span>Listing rows</span><strong>${integer(summary.listingRows)}</strong></div>
          <div><span>Sales units</span><strong>${integer(summary.salesUnits)}</strong></div>
          <div><span>Gross sales</span><strong>${money(summary.grossSales)}</strong></div>
          <div><span>Estimated COGS</span><strong>${money(summary.estimatedCogs)}</strong></div>
          <div><span>Sample units</span><strong>${integer(summary.sampleUnits)}</strong></div>
          <div><span>Replacement units</span><strong>${integer(summary.replacementUnits)}</strong></div>
        </div>
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Inventory</p>
        <h3>Inventory snapshot</h3>
        <div class="workspace-list">
          <div><span>Snapshot date</span><strong>${inventorySnapshot.snapshotDate || "—"}</strong></div>
          <div><span>Rows with values</span><strong>${integer(inventorySnapshot.rowsWithValues)}</strong></div>
        </div>
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Planning</p>
        <h3>Planning signal</h3>
        <div class="workspace-list">
          <div><span>Forecast baseline</span><strong>${planningSignal.forecastBaseline || "—"}</strong></div>
          <div><span>Baseline window</span><strong>${planningSignal.baselineWindow || "—"}</strong></div>
          <div><span>Top reorder product</span><strong>${planningSignal.topReorderProduct || "—"}</strong></div>
          <div><span>Top reorder qty</span><strong>${integer(planningSignal.topReorderQty)}</strong></div>
        </div>
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Details</p>
        <h3>Core product rollup</h3>
        ${renderInlineTable(
          [
            { label: "Product", key: "product_name", render: (value, row) => row.product_name || row.name || "—" },
            { label: "Units sold", key: "units_sold", format: "integer" },
            { label: "Unit mix %", key: "unit_mix_pct", format: "percent" },
            { label: "Sales mix %", key: "sales_mix_pct", format: "percent" },
            { label: "Gross sales", key: "gross_sales", render: (value, row) => money(row.gross_sales ?? row.gross_product_sales ?? 0) },
            { label: "Unit COGS", key: "unit_cogs", format: "money" },
            { label: "Estimated COGS", key: "estimated_cogs", format: "money" },
          ],
          coreRows,
          "No product detail rows yet.",
        )}
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Secondary</p>
        <h3>Listing detail</h3>
        ${renderInlineTable(
          [
            { label: "Product", key: "product_name", render: (value, row) => row.product_name || row.name || "—" },
            { label: "SKU", key: "seller_sku_resolved" },
            { label: "Units sold", key: "units_sold", format: "integer" },
            { label: "Gross sales", key: "gross_product_sales", render: (value, row) => money(row.gross_product_sales ?? row.gross_sales ?? 0) },
            { label: "Net sales", key: "net_product_sales", format: "money" },
          ],
          listingRows,
          "No listing rows yet.",
        )}
      </section>
    </div>
  `;
}

function renderCustomersTab(tab) {
  const snapshot = tab.targetingSnapshot || {};
  return `
    <div class="workspace-grid">
      <section class="workspace-card">
        <p class="eyebrow">Cities</p>
        <h3>Top cities</h3>
        ${chartCanvas("customers-cities-chart")}
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Targeting</p>
        <h3>Targeting snapshot</h3>
        <div class="workspace-list">
          <div><span>Target city customers</span><strong>${integer(snapshot.targetCityCustomers)}</strong></div>
          <div><span>Target city orders</span><strong>${integer(snapshot.targetCityOrders)}</strong></div>
          <div><span>Radius customers</span><strong>${integer(snapshot.radiusCustomers)}</strong></div>
          <div><span>Radius orders</span><strong>${integer(snapshot.radiusOrders)}</strong></div>
          <div><span>Unique customers</span><strong>${integer(snapshot.uniqueCustomers)}</strong></div>
          <div><span>Repeat customers</span><strong>${integer(snapshot.repeatCustomers)}</strong></div>
        </div>
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">ZIPs</p>
        <h3>Top ZIPs</h3>
        ${chartCanvas("customers-zips-chart")}
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Cities</p>
        <h3>Top 10 cities</h3>
        ${renderInlineTable(
          [
            { label: "City", key: "city" },
            { label: "State", key: "state" },
            { label: "Customers", key: "unique_customers", format: "integer" },
            { label: "Orders", key: "orders", format: "integer" },
            { label: "Share", key: "share", format: "percent" },
          ],
          tab.cityRows || [],
          "No city rows yet.",
        )}
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Retention</p>
        <h3>Cohort heatmap</h3>
        ${buildCohortHeatmap(tab.cohortRows || [])}
      </section>
    </div>
  `;
}

function renderAuditTab(tab) {
  const quality = tab.dataQuality || {};
  return `
    <div class="workspace-grid">
      <section class="workspace-card">
        <p class="eyebrow">Audit</p>
        <h3>Data quality</h3>
        <div class="workspace-list">
          ${Object.entries(quality).map(([key, value]) => `<div><span>${key.replace(/_/g, " ")}</span><strong>${typeof value === "number" ? integer(value) : (value || "—")}</strong></div>`).join("")}
        </div>
      </section>
      <section class="workspace-card">
        <p class="eyebrow">Audit</p>
        <h3>Report highlights</h3>
        <div class="audit-list">
          ${(tab.reportHighlights || []).length ? (tab.reportHighlights || []).map((item) => `<div>${item}</div>`).join("") : '<div class="empty-panel">No report highlights yet.</div>'}
        </div>
      </section>
      <section class="workspace-card workspace-card-wide">
        <p class="eyebrow">Details</p>
        <h3>KPI rows</h3>
        ${renderInlineTable(
          [
            { label: "Metric", key: "metric" },
            { label: "Category", key: "category" },
            { label: "Value", key: "formatted_value" },
            { label: "Formula", key: "formula" },
            { label: "Notes", key: "notes" },
          ],
          tab.kpiRows || [],
          "No audit KPI rows yet.",
        )}
      </section>
    </div>
  `;
}

function initOrdersCharts(tab) {
  const dailyRows = (tab.dailyRows || []).slice().reverse();
  createKpiChart("orders-revenue-chart", {
    type: "line",
    data: {
      labels: dailyRows.map((row) => row.reporting_date || ""),
      datasets: [
        { label: "Gross sales", data: dailyRows.map((row) => Number(row.gross_product_sales || 0)), borderColor: "#35528d", backgroundColor: "rgba(53,82,141,0.14)", fill: true, tension: 0.35, pointRadius: 0 },
        { label: "Net sales", data: dailyRows.map((row) => Number(row.net_product_sales || 0)), borderColor: "#f0a429", backgroundColor: "rgba(240,164,41,0.12)", fill: false, tension: 0.35, pointRadius: 0 },
      ],
    },
    options: baseChartOptions(),
  });
  createKpiChart("orders-status-chart", {
    type: "bar",
    data: {
      labels: (tab.statusRows || []).map((row) => row.status || ""),
      datasets: [{ label: "Orders", data: (tab.statusRows || []).map((row) => Number(row.orders || 0)), backgroundColor: ["#35528d", "#f0a429", "#22b8a7"] }],
    },
    options: { ...baseChartOptions(), plugins: { ...baseChartOptions().plugins, legend: { display: false } } },
  });
  createKpiChart("orders-products-chart", {
    type: "bar",
    data: {
      labels: (tab.productRows || []).map((row) => row.product_name || ""),
      datasets: [{ label: "Units sold", data: (tab.productRows || []).map((row) => Number(row.units_sold || 0)), backgroundColor: "#4180e2" }],
    },
    options: { ...baseChartOptions(), indexAxis: "y", plugins: { ...baseChartOptions().plugins, legend: { display: false } } },
  });
  createKpiChart("orders-cities-chart", {
    type: "doughnut",
    data: {
      labels: (tab.cityRows || []).map((row) => row.city || ""),
      datasets: [{ data: (tab.cityRows || []).map((row) => Number(row.unique_customers || 0)), backgroundColor: ["#35528d", "#4180e2", "#1d8c81", "#22b8a7", "#f3a31a", "#ff7d12", "#7856d8", "#7d8799", "#4d6a95", "#c65a2d"] }],
    },
    options: { ...baseChartOptions(), scales: {}, cutout: "62%" },
  });
}

function initFinanceCharts(tab) {
  const dailyRows = (tab.dailyRows || []).slice().reverse();
  createKpiChart("finance-trend-chart", {
    type: "line",
    data: {
      labels: dailyRows.map((row) => row.reporting_date || ""),
      datasets: [
        { label: "Gross sales", data: dailyRows.map((row) => Number(row.gross_sales || 0)), borderColor: "#35528d", backgroundColor: "rgba(53,82,141,0.14)", fill: true, tension: 0.35, pointRadius: 0 },
        { label: "Net sales", data: dailyRows.map((row) => Number(row.net_sales || 0)), borderColor: "#f0a429", backgroundColor: "rgba(240,164,41,0.12)", fill: false, tension: 0.35, pointRadius: 0 },
      ],
    },
    options: baseChartOptions(),
  });
  const expenseRows = (tab.expenseRows || []).map((row) => ({ label: row.category || "", value: Math.abs(Number(row.amount || 0)) }));
  createKpiChart("finance-expense-chart", {
    type: "doughnut",
    data: {
      labels: expenseRows.map((row) => row.label),
      datasets: [{ data: expenseRows.map((row) => row.value), backgroundColor: ["#35528d", "#4180e2", "#1d8c81", "#22b8a7", "#f3a31a", "#ff7d12"] }],
    },
    options: { ...baseChartOptions(), scales: {}, cutout: "58%" },
  });
}

function initProductsCharts(tab) {
  createKpiChart("products-top-chart", {
    type: "bar",
    data: {
      labels: (tab.productRows || []).map((row) => row.product_name || ""),
      datasets: [
        { label: "Units sold", data: (tab.productRows || []).map((row) => Number(row.units_sold || 0)), backgroundColor: "#35528d" },
        { label: "Unit mix %", data: (tab.productRows || []).map((row) => Number((row.unit_mix_pct || 0) * 100)), backgroundColor: "#f0a429" },
      ],
    },
    options: { ...baseChartOptions(), indexAxis: "y" },
  });
}

function initCustomersCharts(tab) {
  createKpiChart("customers-cities-chart", {
    type: "doughnut",
    data: {
      labels: (tab.cityRows || []).map((row) => row.city || ""),
      datasets: [{ data: (tab.cityRows || []).map((row) => Number(row.unique_customers || 0)), backgroundColor: ["#35528d", "#4180e2", "#1d8c81", "#22b8a7", "#f3a31a", "#ff7d12", "#7856d8", "#7d8799", "#4d6a95", "#c65a2d"] }],
    },
    options: { ...baseChartOptions(), scales: {}, cutout: "62%" },
  });
  createKpiChart("customers-zips-chart", {
    type: "bar",
    data: {
      labels: (tab.zipRows || []).slice(0, 10).map((row) => row.zipcode || ""),
      datasets: [{ label: "Customers", data: (tab.zipRows || []).slice(0, 10).map((row) => Number(row.unique_customers || 0)), backgroundColor: "#4180e2" }],
    },
    options: { ...baseChartOptions(), plugins: { ...baseChartOptions().plugins, legend: { display: false } } },
  });
}

function initKpiCharts(activeTab, tabPayload) {
  destroyKpiCharts();
  if (typeof Chart === "undefined") return;
  if (activeTab === "orders") initOrdersCharts(tabPayload);
  if (activeTab === "finance") initFinanceCharts(tabPayload);
  if (activeTab === "products") initProductsCharts(tabPayload);
  if (activeTab === "customers") initCustomersCharts(tabPayload);
}

function renderKpiWorkspace(payload) {
  const activeTab = payload.filters?.activeTab || activeKpiTab;
  const tabPayload = payload.tabs?.[activeTab] || {};
  const titleMap = {
    orders: "Orders / paid time",
    finance: "Finance / statement date",
    reconciliation: "Reconciliation",
    products: "Listings, physical units, and COGS",
    customers: "Geography and retention",
    audit: "Data quality and audit",
  };
  kpiWorkspaceTitle.textContent = titleMap[activeTab] || "TikTok KPI workspace";
  if (activeTab === "finance") {
    kpiWorkspaceContent.innerHTML = renderFinanceTab(tabPayload);
  } else if (activeTab === "reconciliation") {
    kpiWorkspaceContent.innerHTML = renderReconciliationTab(tabPayload);
  } else if (activeTab === "products") {
    kpiWorkspaceContent.innerHTML = renderProductsTab(tabPayload);
  } else if (activeTab === "customers") {
    kpiWorkspaceContent.innerHTML = renderCustomersTab(tabPayload);
  } else if (activeTab === "audit") {
    kpiWorkspaceContent.innerHTML = renderAuditTab(tabPayload);
  } else {
    kpiWorkspaceContent.innerHTML = renderOrdersTab(tabPayload);
  }
  Array.from(kpiWorkspaceContent.querySelectorAll(".workspace-disclosure")).forEach((disclosure) => {
    disclosure.addEventListener("toggle", () => {
      const hint = disclosure.querySelector(".workspace-disclosure-hint");
      if (hint) hint.textContent = disclosure.open ? "Collapse" : "Expand";
    });
  });
  initKpiCharts(activeTab, tabPayload);
}

function renderKpis(payload) {
  latestKpiPayload = payload;
  activeKpiTab = payload.filters?.activeTab || activeKpiTab;
  kpiTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.kpiTab === activeKpiTab));
  renderBadgeRows(payload);
  renderMetricCards(payload.cards || {});
  renderCardDetail(payload);
  renderKpiWorkspace(payload);
}

async function runPlanningFromForm(showStatus = true) {
  const formData = new FormData(planForm);
  const payload = Object.fromEntries(formData.entries());
  const monthKey = getSelectedPlanningMonthKey();
  const activeSetting = getForecastSetting(monthKey, { persist: false });
  payload.planningYear = Number(planningYearInput?.value || forecastYear || new Date().getFullYear());
  payload.upliftPct = activeSetting.upliftPct;
  payload.monthlyForecastSettings = Object.fromEntries(
    Object.entries(forecastSettings).filter(([, setting]) => setting && typeof setting === "object"),
  );
  payload.monthlyForecastPcts = Object.fromEntries(
    Object.entries(payload.monthlyForecastSettings).map(([key, setting]) => [key, Number(setting?.upliftPct || 0)]),
  );
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const plan = await response.json();
  if (!response.ok || plan.error) {
    throw new Error(plan.error || "Planning failed");
  }
  renderResults(plan);
  if (showStatus) setStatus("Planning run complete.");
}

async function loadKpis() {
  const params = new URLSearchParams({
    startDate: kpiStartDateInput.value || "",
    endDate: kpiEndDateInput.value || "",
    tab: activeKpiTab,
    dateBasis: kpiDateBasisInput.value || "order",
    orderBucket: kpiOrderBucketInput.value || "paid_time",
    sources: currentKpiSources().join(","),
  });
  const response = await fetch(`/api/tiktok-kpis?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || "Could not load TikTok KPIs");
  }
  kpiOutputInput.value = payload.filters?.output || "analysis_output";
  kpiDateBasisInput.value = payload.filters?.dateBasis || "order";
  kpiOrderBucketInput.value = payload.filters?.orderBucket || "paid_time";
  kpiStartDateInput.value = payload.filters?.startDate || kpiStartDateInput.value;
  kpiEndDateInput.value = payload.filters?.endDate || kpiEndDateInput.value;
  const selectedSources = payload.filters?.selectedSources || ["Sales"];
  Array.from(kpiFilterForm.querySelectorAll('.source-pill input[type="checkbox"]')).forEach((input) => {
    input.checked = selectedSources.includes(input.value);
  });
  renderKpis(payload);
}

async function loadWorkspace() {
  const response = await fetch("/api/bootstrap");
  const payload = await response.json();
  const workspace = payload.workspace || payload;
  inventoryUploaded = Boolean(workspace.inventoryUploaded);
  renderSummary(workspace.summary || {}, inventoryUploaded);
  applyDefaults(workspace.defaults || {});
  applyPlannerVariant(workspace.summary || {});
  const summary = workspace.summary || {};
  if (summary.date_end) {
    const endDate = new Date(summary.date_end);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 29);
    kpiStartDateInput.value = startDate.toISOString().slice(0, 10);
    kpiEndDateInput.value = summary.date_end;
  } else {
    kpiStartDateInput.value = summary.date_start || "";
    kpiEndDateInput.value = summary.date_end || "";
  }
  kpiOutputInput.value = "analysis_output";
  kpiDateBasisInput.value = "order";
  kpiOrderBucketInput.value = "paid_time";
  Array.from(kpiFilterForm.querySelectorAll('.source-pill input[type="checkbox"]')).forEach((input) => {
    input.checked = input.value === "Sales";
  });
  if (payload.plan) {
    renderResults(payload.plan);
  } else {
    await runPlanningFromForm(false);
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  let parsed = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(raw || `Request failed (${response.status})`);
  }
  if (!response.ok || parsed.error) throw new Error(parsed.error || `Request failed (${response.status})`);
  return parsed;
}

async function postForm(url, form) {
  const response = await fetch(url, { method: "POST", body: form });
  const raw = await response.text();
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(raw || `Request failed (${response.status})`);
  }
  if (!response.ok || payload.error) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

loadSampleBtn.addEventListener("click", async () => {
  try {
    setStatus("Refreshing current data...");
    const response = await fetch("/api/bootstrap?refresh=1");
    const payload = await response.json();
    const workspace = payload.workspace || payload;
    inventoryUploaded = Boolean(workspace.inventoryUploaded);
    renderSummary(workspace.summary || {}, inventoryUploaded);
    applyDefaults(workspace.defaults || {});
    if (payload.plan) {
      renderResults(payload.plan);
    } else {
      await runPlanningFromForm(false);
    }
    setStatus("Current data refreshed.");
  } catch (error) {
    setStatus(error.message || "Could not refresh current data.", true);
  }
});

if (updateLiveInventoryBtn) {
  updateLiveInventoryBtn.addEventListener("click", async () => {
    try {
      updateLiveInventoryBtn.disabled = true;
      setStatus("Pulling the live inventory sheet and saving it to Firestore...");
      const response = await fetch("/api/inventory-sync", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || `Request failed (${response.status})`);
      }
      const workspace = payload.workspace || payload;
      inventoryUploaded = Boolean(workspace.inventoryUploaded);
      renderSummary(workspace.summary || {}, inventoryUploaded);
      applyDefaults(workspace.defaults || {});
      if (payload.plan) {
        renderResults(payload.plan);
      } else {
        await runPlanningFromForm(false);
      }
      const sync = payload.inventorySync || {};
      const asOf = sync.snapshotDate ? ` as of ${sync.snapshotDate}` : "";
      setStatus(`Live inventory updated${asOf}. ${integer(sync.rowsWritten || 0)} rows saved to Firestore.`);
    } catch (error) {
      setStatus(error.message || "Could not update live inventory from the sheet.", true);
    } finally {
      updateLiveInventoryBtn.disabled = false;
    }
  });
}

if (uploadFileInput instanceof HTMLInputElement) {
  uploadFileInput.addEventListener("change", () => setStatus(""));
}

if (uploadTypeInput instanceof HTMLSelectElement) {
  uploadTypeInput.addEventListener("change", () => setStatus(""));
}

dataUploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const formData = new FormData(dataUploadForm);
    const fileInput = dataUploadForm.querySelector('input[name="files"]');
    if (!(fileInput instanceof HTMLInputElement) || !fileInput.files || fileInput.files.length === 0) {
      setStatus("Choose at least one file before uploading.", true);
      return;
    }
    const uploadType = String(formData.get("uploadType") || "orders");
    const url = uploadType === "samples" ? "/api/upload/samples" : "/api/upload/orders";
    const label = uploadType === "samples" ? "sample files" : "order files";
    const platform = String(formData.get("platform") || "TikTok");
    setStatus(`Reading ${label}...`);
    const uploadPayload = await buildLeanUploadPayload(fileInput.files, platform);
    if (!uploadPayload.rows.length) {
      throw new Error(`Could not find any usable planning rows in the selected ${label}.`);
    }
    setStatus(`Uploading ${label}: ${uploadPayload.uploadedDates.length} dates, ${uploadPayload.rows.length} lean rows...`);
    const payload = await postJson(url, uploadPayload);
    await loadWorkspace();
    const rowsWritten = Number(payload?.upload?.rowsWritten || uploadPayload.rows.length);
    setStatus(`${label.charAt(0).toUpperCase() + label.slice(1)} uploaded: ${integer(rowsWritten)} lean rows across ${uploadPayload.uploadedDates.length} dates.`);
  } catch (error) {
    setStatus(error.message || "Could not upload files.", true);
  }
});

planForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus("Running planning...");
    await runPlanningFromForm(true);
  } catch (error) {
    setStatus(error.message || "Planning failed.", true);
  }
});

kpiFilterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus("Loading TikTok KPIs...");
    await loadKpis();
    setStatus("TikTok KPIs loaded.");
  } catch (error) {
    setStatus(error.message || "Could not load TikTok KPIs.", true);
  }
});

[
  kpiOutputInput,
  kpiDateBasisInput,
  kpiOrderBucketInput,
  kpiStartDateInput,
  kpiEndDateInput,
  ...Array.from(kpiFilterForm.querySelectorAll('.source-pill input[type="checkbox"]')),
].forEach((input) => {
  input.addEventListener("change", async () => {
    try {
      setStatus("Loading TikTok KPIs...");
      await loadKpis();
      setStatus("TikTok KPIs loaded.");
    } catch (error) {
      setStatus(error.message || "Could not load TikTok KPIs.", true);
    }
  });
});

kpiTabButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    activeKpiTab = button.dataset.kpiTab || "orders";
    try {
      setStatus("Loading TikTok KPIs...");
      await loadKpis();
      setStatus("TikTok KPIs loaded.");
    } catch (error) {
      setStatus(error.message || "Could not load TikTok KPIs.", true);
    }
  });
});

document.getElementById("horizon-start").addEventListener("change", () => {
  const monthKey = getSelectedPlanningMonthKey();
  if (monthKey) {
    forecastYear = Number(monthKey.slice(0, 4));
  }
  renderForecastSummary();
});

openForecastSettingsButton.addEventListener("click", () => {
  openForecastDialog();
});

closeForecastSettingsButton.addEventListener("click", () => {
  closeForecastDialog();
});

forecastMonthPicker.addEventListener("change", () => {
  loadForecastDialogMonth(forecastMonthPicker.value);
});

forecastYearInput.addEventListener("change", () => {
  const nextYear = Number(forecastYearInput.value || forecastYear);
  if (!Number.isFinite(nextYear) || nextYear < 2024) return;
  forecastYear = nextYear;
  renderForecastMonthPicker();
  const currentMonth = String(Number((activeForecastDialogMonth || `${forecastYear}-01`).split("-")[1]) || 1).padStart(2, "0");
  loadForecastDialogMonth(`${forecastYear}-${currentMonth}`);
});

planningYearInput?.addEventListener("change", async () => {
  const nextYear = Number(planningYearInput.value || forecastYear);
  if (!Number.isFinite(nextYear) || nextYear < 2024) return;
  forecastYear = nextYear;
  renderForecastSummary();
  await runPlanningFromForm(false);
});

forecastProductMixInputs.addEventListener("input", () => {
  updateForecastMixTotal();
});

resetForecastSettingsButton.addEventListener("click", () => {
  const baselineMix = baselineMixLookup();
  renderForecastProductMixInputs(
    { productMix: baselineMix },
    {
      actualMix: baselineMix,
      actualMixLabel: "Baseline mix",
      readOnly: false,
    },
  );
});

saveForecastSettingsButton.addEventListener("click", async () => {
  try {
    const total = Array.from(forecastProductMixInputs.querySelectorAll("input[data-product-mix]")).reduce((sum, input) => sum + Number(input.value || 0), 0);
    if (Math.abs(total - 100) > 0.2) {
      setStatus("Product mix should add up to 100%.", true);
      return;
    }
    const setting = {
      upliftPct: Number(forecastMonthUplift.value || 0),
      productMix: Object.fromEntries(
        Array.from(forecastProductMixInputs.querySelectorAll("input[data-product-mix]")).map((input) => [String(input.dataset.productMix || ""), Number(input.value || 0)]),
      ),
    };
    const response = await fetch("/api/forecast-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthKey: activeForecastDialogMonth, setting }),
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error || "Could not save month settings.");
    }
    forecastSettings = normalizeForecastSettings({ forecastSettings: payload.forecastSettings || {} });
    renderForecastSummary();
    closeForecastDialog();
    await runPlanningFromForm(false);
    setStatus("Month forecast saved.");
  } catch (error) {
    setStatus(error.message || "Could not save month settings.", true);
  }
});

railButtons.forEach((button) => {
  button.addEventListener("click", () => setActivePage(button.dataset.pageTarget || "planning"));
});

historyTabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveHistoryTab(button.dataset.historyTab || "monthly"));
});

railToggle?.addEventListener("click", () => {
  const collapsed = !document.body.classList.contains("rail-collapsed");
  document.body.classList.toggle("rail-collapsed", collapsed);
  railToggle.textContent = collapsed ? "Expand" : "Collapse";
  railToggle.setAttribute("aria-expanded", String(!collapsed));
  window.localStorage.setItem(FORECAST_STORAGE_KEY, collapsed ? "true" : "false");
});

kpiDetailToggle?.addEventListener("toggle", () => {
  const hint = kpiDetailToggle.querySelector(".disclosure-hint");
  if (hint) hint.textContent = kpiDetailToggle.open ? "Collapse" : "Expand";
});

setActivePage("planning");
setActiveHistoryTab("monthly");
if (hostedKpiButton) hostedKpiButton.style.display = "none";
if (window.localStorage.getItem(FORECAST_STORAGE_KEY) === "true") {
  document.body.classList.add("rail-collapsed");
  if (railToggle) {
    railToggle.textContent = "Expand";
    railToggle.setAttribute("aria-expanded", "false");
  }
}
loadWorkspace().catch((error) => setStatus(error.message || "Could not load workspace.", true));
