const summaryBlock = document.getElementById("summary-block");
  const uploadStatus = document.getElementById("upload-status");
  const resultSummary = document.getElementById("result-summary");
  const resultsHead = document.getElementById("results-head");
  const resultsBody = document.getElementById("results-body");
  const resultsCalloutCopy = document.getElementById("results-callout-copy");
  const resultsReadingGuide = document.getElementById("results-reading-guide");
const monthlyPlanHead = document.getElementById("monthly-plan-head");
const monthlyPlanBody = document.getElementById("monthly-plan-body");
const productMixHead = document.getElementById("product-mix-head");
const productMixBody = document.getElementById("product-mix-body");
const skuSalesHead = document.getElementById("sku-sales-head");
const skuSalesBody = document.getElementById("sku-sales-body");
const loadSampleBtn = document.getElementById("load-sample-btn");
const updateLiveInventoryBtn = document.getElementById("update-live-inventory-btn");
const uploadBtn = document.getElementById("upload-btn");
const dataUploadForm = document.getElementById("data-upload-form");
const planForm = document.getElementById("plan-form");
const runPlanningBtn = document.getElementById("run-planning-btn");
const campaignForm = document.getElementById("campaign-form");
const campaignBody = document.getElementById("campaign-body");
const launchPlanForm = document.getElementById("launch-plan-form");
const launchPlanBody = document.getElementById("launch-plan-body");
const launchProxyProductSelect = document.getElementById("launch-proxy-product");
const addLaunchButton = document.getElementById("add-launch-btn");
const cancelLaunchEditButton = document.getElementById("cancel-launch-edit");
const launchEditIdInput = document.getElementById("launch-edit-id");
const safetyRuleNote = document.getElementById("safety-rule-note");
const settingsPasswordForm = document.getElementById("settings-password-form");
const settingsCurrentPassword = document.getElementById("settings-current-password");
const settingsNewPassword = document.getElementById("settings-new-password");
const settingsConfirmPassword = document.getElementById("settings-confirm-password");
const settingsPasswordStatus = document.getElementById("settings-password-status");
const changePasswordButton = document.getElementById("btn-change-password");
const uploadFileInput = dataUploadForm.querySelector('input[name="files"]');
const uploadTypeInput = dataUploadForm.querySelector('select[name="uploadType"]');
const railButtons = Array.from(document.querySelectorAll("[data-page-target]"));
const pages = {
  planning: document.getElementById("page-planning"),
  campaigns: document.getElementById("page-campaigns"),
  "launch-planning": document.getElementById("page-launch-planning"),
  kpis: document.getElementById("page-kpis"),
  settings: document.getElementById("page-settings"),
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
const forecastLiftGuidance = document.getElementById("forecast-lift-guidance");
const forecastProductMixInputs = document.getElementById("forecast-product-mix-inputs");
const forecastMixTotal = document.getElementById("forecast-mix-total");
const forecastStatusPill = document.getElementById("forecast-status-pill");
const forecastBaselineCopy = document.getElementById("forecast-baseline-copy");
const forecastCopyMixRow = document.getElementById("forecast-copy-mix-row");
const forecastCopyMixMonth = document.getElementById("forecast-copy-mix-month");
const forecastCopyMixApplyButton = document.getElementById("forecast-copy-mix-apply");
const forecastCopyMixHint = document.getElementById("forecast-copy-mix-hint");
const forecastUpliftSuggestion = document.getElementById("forecast-uplift-suggestion");
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
const historicalForecastSignals = document.getElementById("historical-forecast-signals");
const historicalDemandTrendChart = document.getElementById("historical-demand-trend-chart");
const historicalDemandTrendProduct = document.getElementById("historical-demand-trend-product");
const historicalDemandTrendCompareToggle = document.getElementById("historical-demand-trend-compare");
const historicalDemandTrendComparePanel = document.getElementById("historical-demand-trend-compare-panel");
const historicalDemandTrendProductB = document.getElementById("historical-demand-trend-product-b");
const historicalDemandTrendProductC = document.getElementById("historical-demand-trend-product-c");
const historicalSeasonalityHead = document.getElementById("historical-seasonality-head");
const historicalSeasonalityBody = document.getElementById("historical-seasonality-body");
const historicalAnchorHead = document.getElementById("historical-anchor-head");
const historicalAnchorBody = document.getElementById("historical-anchor-body");
const historicalYoyHead = document.getElementById("historical-yoy-head");
const historicalYoyBody = document.getElementById("historical-yoy-body");
const launchReferenceHead = document.getElementById("launch-reference-head");
const launchReferenceBody = document.getElementById("launch-reference-body");
const launchScenariosHead = document.getElementById("launch-scenarios-head");
const launchScenariosBody = document.getElementById("launch-scenarios-body");
const launchPlanningSummary = document.getElementById("launch-planning-summary");
const globalSettingsForm = document.getElementById("global-settings-form");
const productSettingsBody = document.getElementById("product-settings-body");
const saveSettingsButton = document.getElementById("btn-save-settings");
const skuMappingBody = document.getElementById("sku-mapping-body");
const addSkuMappingButton = document.getElementById("btn-add-sku-mapping");
const saveSkuMappingButton = document.getElementById("btn-save-sku-mapping");
const plannerDataSourceSelect = document.getElementById("planner-data-source-select");
const plannerDataSourceCopy = document.getElementById("planner-data-source-copy");
const applyDataSourceButton = document.getElementById("btn-apply-data-source");
const resultsTabButtons = Array.from(document.querySelectorAll("[data-results-tab]"));

let inventoryUploaded = false;
let forecastSettings = {};
let monthlyActualMix = {};
let monthlyActuals = {};
let sharedPlannerSettings = null;
let marketingConfig = { campaigns: [], launchPlans: [] };
let marketingConfigSource = "local";
let skuMappingSnapshot = { baseRows: [], localRows: [], rows: [], editable: false, mode: "local" };
let forecastYear = new Date().getFullYear();
let activePage = "planning";
let activeKpiTab = "orders";
let latestKpiPayload = null;
let latestPlanPayload = null;
let activeKpiCard = "grossProductSales";
let activeKpiCharts = [];
let activeHistoricalTrendChart = null;
let activeForecastDialogMonth = "";
let activeHistoryTab = "monthly";
let kpisRequested = false;
let activeHelpTrigger = null;
let activeLaunchEditId = "";
let plannerDataSourceMode = "local";
let activeResultsTab = "reorder";
let activeHistoricalTrendProduct = "__all__";
let activeHistoricalTrendCompareEnabled = false;
let activeHistoricalTrendProductB = "";
let activeHistoricalTrendProductC = "";
const plannerVariant = new URLSearchParams(window.location.search).get("plannerVariant") || "current";
const appLoadingOverlay = document.getElementById("app-loading-overlay");
const appLoadingMessage = document.getElementById("app-loading-message");
const floatingHelpTooltip = document.createElement("div");
floatingHelpTooltip.className = "app-tooltip";
floatingHelpTooltip.hidden = true;
document.body.appendChild(floatingHelpTooltip);

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CORE_PRODUCTS = [
  "Birria Bomb 2-Pack",
  "Brine Bomb",
  "Chile Colorado Bomb 2-Pack",
  "Pozole Bomb 2-Pack",
  "Pozole Verde Bomb 2-Pack",
  "Tinga Bomb 2-Pack",
  "Variety Pack",
];
const FORECAST_STORAGE_KEY = "demand-planning-rail-collapsed";
const RESULTS_TAB_STORAGE_KEY = "demand-planning-results-tab";

function updateRailToggleLabel(collapsed) {
  if (!railToggle) return;
  railToggle.textContent = collapsed ? ">" : "Collapse";
  railToggle.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
}
const MARKETING_STORAGE_KEY = "demand-planning-marketing-config-v1";
const PLANNER_DATA_SOURCE_STORAGE_KEY = "demand-planning-preview-data-source";
const PAGE_CONTENT = {
  planning: {
    chip: "Demand Planning",
    title: "Demand planning, decision-ready.",
    lead: "This planner turns your real product demand, inventory, inbound, and forecast plan into a clear reorder recommendation.",
  },
  campaigns: {
    chip: "Marketing",
    title: "Promotion & Campaign Calendar",
    lead: "Log past and future events so we can reference promo windows, estimate lift, and boost future plans without wiping long campaigns out of the baseline.",
  },
  "launch-planning": {
    chip: "Marketing",
    title: "Inbound & Launch Strategy",
    lead: "Model a brand-new SKU using a proxy product curve, launch strength, and your committed inbound units.",
  },
  kpis: {
    chip: "TikTok KPIs",
    title: "Lean TikTok KPI surface.",
    lead: "This dashboard rebuilds just the order metrics you actually use: sales, AOV, customer counts, and location data.",
  },
  settings: {
    chip: "Global Settings",
    title: "Configuration and Math Overrides.",
    lead: "Shared planner settings for COGS, MOQ, case packs, shelf life, and default lead time.",
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

function clampNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatSupplyLeftLabel(row) {
  const days = clampNumber(row?.days_of_supply, null);
  const weeks = clampNumber(row?.weeks_of_supply, null);
  if (days === null && weeks === null) return "-";
  const daysRounded = days === null ? null : Math.max(0, Math.round(days));
  const weeksRounded = weeks === null ? null : Math.max(0, Number(weeks));

  // Prefer days for near-term decisions; prefer weeks for longer horizons.
  const preferDays = daysRounded !== null && daysRounded < 28;
  const primary = preferDays
    ? `${integer(daysRounded)} days`
    : weeksRounded === null
      ? `${integer(daysRounded)} days`
      : `${number(weeksRounded)} wks`;
  const secondary = preferDays
    ? (weeksRounded === null ? "" : `(${number(weeksRounded)} wks)`)
    : (daysRounded === null ? "" : `(~${integer(daysRounded)} days)`);

  return { primary, secondary };
}

function formatCountdownLabel(daysValue) {
  const days = clampNumber(daysValue, null);
  if (days === null) return "";
  const rounded = Math.round(days);
  if (!Number.isFinite(rounded)) return "";
  if (rounded <= 0) return "today";
  return `${integer(rounded)}d`;
}

function money(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

function moneyPrecise(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function humanDate(value) {
  const iso = String(value || "").slice(0, 10);
  if (!iso) return "";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return iso;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
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

function displayProductName(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const replaced = raw.replaceAll("2-Pack", "2P");
  const canonicalMap = {
    "Birria Bomb 2-Pack": "Birria Bombs 2P",
    "Chile Colorado Bomb 2-Pack": "Chile Colorado Bombs 2P",
    "Pozole Bomb 2-Pack": "Pozole Bombs 2P",
    "Pozole Verde Bomb 2-Pack": "Pozole Verde Bombs 2P",
    "Tinga Bomb 2-Pack": "Tinga Bombs 2P",
    "Brine Bomb": "Brine Bombs",
  };
  return canonicalMap[raw] || canonicalMap[replaced] || replaced;
}

function roundCurrency(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 100) / 100;
}

function productSortValue(value) {
  return displayProductName(value).toLowerCase();
}

function sortRowsByProductName(rows, key = "product_name") {
  return [...(Array.isArray(rows) ? rows : [])].sort((left, right) => {
    const leftLabel = productSortValue(left?.[key] || left?.name || "");
    const rightLabel = productSortValue(right?.[key] || right?.name || "");
    return leftLabel.localeCompare(rightLabel) || String(left?.sku_id || "").localeCompare(String(right?.sku_id || ""));
  });
}

function makeClientId(prefix) {
  try {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
  } catch {
    // fall through
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function setSettingsPasswordStatus(message, isError = false) {
  if (!settingsPasswordStatus) return;
  settingsPasswordStatus.textContent = String(message || "");
  settingsPasswordStatus.dataset.error = isError ? "true" : "false";
}

function parsePercentValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function inclusiveDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays >= 0 ? diffDays + 1 : 0;
}

function formatDateWindow(startDate, endDate) {
  if (!startDate) return "-";
  if (!endDate) return `${startDate} to Forever`;
  return `${startDate} to ${endDate}`;
}

function normalizeMarketingConfig(source) {
  const next = source && typeof source === "object" ? source : {};
  const campaigns = Array.isArray(next.campaigns) ? next.campaigns : [];
  const launchPlans = Array.isArray(next.launchPlans) ? next.launchPlans : Array.isArray(next.launches) ? next.launches : [];
  return {
    campaigns: campaigns
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        id: String(row.id || makeClientId("campaign")),
        name: String(row.name || "").trim(),
        startDate: String(row.startDate || ""),
        endDate: String(row.endDate || ""),
        liftPct: row.liftPct === null || row.liftPct === undefined ? null : Number(row.liftPct),
      }))
      .filter((row) => row.name && row.startDate && row.endDate),
    launchPlans: launchPlans
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        id: String(row.id || makeClientId("launch")),
        newProductName: String(row.newProductName || row.new_product_name || "").trim(),
        proxyProduct: String(row.proxyProduct || row.proxy_product || "").trim(),
        startDate: String(row.startDate || ""),
        endDate: String(row.endDate || ""),
        strengthPct: Number(row.strengthPct ?? row.strength_pct ?? 100),
        committedUnits: Number(row.committedUnits ?? row.committed_units ?? 0),
      }))
      .filter((row) => row.newProductName && row.proxyProduct && row.startDate),
  };
}

function readLocalMarketingConfig() {
  try {
    const raw = window.localStorage.getItem(MARKETING_STORAGE_KEY);
    if (!raw) return normalizeMarketingConfig({});
    return normalizeMarketingConfig(JSON.parse(raw));
  } catch {
    return normalizeMarketingConfig({});
  }
}

function writeLocalMarketingConfig(config) {
  try {
    window.localStorage.setItem(MARKETING_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore local storage failures (private mode, etc.)
  }
}

async function loadMarketingConfig() {
  marketingConfig = readLocalMarketingConfig();
  marketingConfigSource = "local";
  try {
    const response = await fetch("/api/marketing-config");
    if (response.ok) {
      const payload = await readJsonResponse(response);
      marketingConfig = normalizeMarketingConfig(payload.marketingConfig || payload);
      marketingConfigSource = "api";
      writeLocalMarketingConfig(marketingConfig);
    }
  } catch {
    // keep local fallback
  }
  renderMarketingConfig();
}

async function persistMarketingConfig(nextConfig, successMessage) {
  const unlocked = await ensureSettingsUnlocked();
  if (!unlocked) {
    setStatus("Settings are locked.", true);
    return;
  }
  beginScreenBusy("Saving...");
  try {
    marketingConfig = normalizeMarketingConfig(nextConfig);
    writeLocalMarketingConfig(marketingConfig);
    marketingConfigSource = "local";
    try {
      const response = await fetch("/api/marketing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingConfig }),
      });
      if (response.ok) {
        const payload = await readJsonResponse(response);
        marketingConfig = normalizeMarketingConfig(payload.marketingConfig || payload);
        marketingConfigSource = "api";
        writeLocalMarketingConfig(marketingConfig);
      }
    } catch {
      // keep local
    }
    renderMarketingConfig();
    if (successMessage) {
      const suffix = marketingConfigSource === "api" ? "" : " Saved locally (API stub not active yet).";
      setStatus(`${successMessage}${suffix}`);
    }
  } finally {
    endScreenBusy();
  }
}

function pctLabel(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const numeric = Number(value);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${integer(numeric)}%`;
}

function normalizeSkuMappingRow(raw) {
  const row = raw && typeof raw === "object" ? raw : {};
  const skuTypeRaw = String(row.skuType || row.sku_type || "").trim().toLowerCase();
  const source = String(row.source || "").trim().toLowerCase();
  return {
    skuId: String(row.skuId || row["SKU ID"] || "").trim(),
    productName: String(row.productName || row["Product Name"] || "").trim(),
    product1: String(row.product1 || row["Product 1"] || "").trim(),
    product2: String(row.product2 || row["Product 2"] || "").trim(),
    product3: String(row.product3 || row["Product 3"] || "").trim(),
    product4: String(row.product4 || row["Product 4"] || "").trim(),
    source: source === "local" || source === "override" ? "override" : "base",
    skuType: skuTypeRaw === "bundle" || skuTypeRaw === "virtual_bundle" ? "bundle" : skuTypeRaw === "base" || skuTypeRaw === "core" ? "base" : "",
  };
}

function normalizedKey(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function deriveSkuTypeFromProducts(row) {
  const normalized = normalizeSkuMappingRow(row);
  const ignored = normalizedKey(normalized.product1) === "ignore";
  if (ignored) return "ignore";
  const filled = [normalized.product1, normalized.product2, normalized.product3, normalized.product4].filter((value) => String(value || "").trim());
  if (filled.length <= 1) return "base";
  return "bundle";
}

function normalizeSkuTypeForSelect(value, fallbackRow) {
  const cleaned = String(value || "").trim().toLowerCase();
  if (cleaned === "ignore") return "ignore";
  if (cleaned === "bundle" || cleaned === "virtual_bundle") return "bundle";
  if (cleaned === "base" || cleaned === "core") return "base";
  return deriveSkuTypeFromProducts(fallbackRow);
}

function skuMappingKey(row) {
  const key = String(row?.skuId || row?.productName || "").trim().toLowerCase();
  return key.replace(/\s+/g, " ");
}

function skuMappingEquivalent(a, b) {
  const left = normalizeSkuMappingRow(a);
  const right = normalizeSkuMappingRow(b);
  return (
    left.skuId === right.skuId &&
    left.productName === right.productName &&
    left.product1 === right.product1 &&
    left.product2 === right.product2 &&
    left.product3 === right.product3 &&
    left.product4 === right.product4
  );
}

function renderSkuMappingTable(rows) {
  if (!skuMappingBody) return;
  if (!Array.isArray(rows) || rows.length === 0) {
    skuMappingBody.innerHTML = '<tr><td colspan="9" class="empty">No SKU mappings loaded.</td></tr>';
    return;
  }
  skuMappingBody.innerHTML = rows.map((row) => {
    const normalized = normalizeSkuMappingRow(row);
    const sourceLabel = normalized.source === "override" ? "OVERRIDE" : "BASE";
    const sourceClass = normalized.source === "override" ? "status-covered" : "status-no-demand";
    const skuType = normalizeSkuTypeForSelect(normalized.skuType, normalized);
    return `
      <tr data-sku-mapping-row="true" data-sku-mapping-source="${normalized.source}" data-sku-mapping-key="${escapeHtml(skuMappingKey(normalized))}">
        <td><span class="status ${sourceClass}">${sourceLabel}</span></td>
        <td class="text-left"><input type="text" inputmode="numeric" data-sku-map="skuId" value="${escapeHtml(normalized.skuId)}"></td>
        <td class="text-left"><input type="text" data-sku-map="productName" value="${escapeHtml(normalized.productName)}"></td>
        <td>
          <select data-sku-map="skuType" aria-label="SKU type">
            <option value="base" ${skuType === "base" ? "selected" : ""}>Base</option>
            <option value="bundle" ${skuType === "bundle" ? "selected" : ""}>Bundle</option>
            <option value="ignore" ${skuType === "ignore" ? "selected" : ""}>Ignore</option>
          </select>
        </td>
        <td><input type="text" list="sku-mapping-core-products" data-sku-map="product1" value="${escapeHtml(displayProductName(normalized.product1))}"></td>
        <td><input type="text" list="sku-mapping-core-products" data-sku-map="product2" value="${escapeHtml(displayProductName(normalized.product2))}"></td>
        <td><input type="text" list="sku-mapping-core-products" data-sku-map="product3" value="${escapeHtml(displayProductName(normalized.product3))}"></td>
        <td><input type="text" list="sku-mapping-core-products" data-sku-map="product4" value="${escapeHtml(displayProductName(normalized.product4))}"></td>
        <td><button type="button" data-sku-mapping-delete>Delete</button></td>
      </tr>
    `;
  }).join("");
}

function readSkuMappingTableRows() {
  if (!skuMappingBody) return [];
  return Array.from(skuMappingBody.querySelectorAll('tr[data-sku-mapping-row="true"]')).map((tr) => {
    const inputs = Array.from(tr.querySelectorAll("input[data-sku-map]"));
    const selects = Array.from(tr.querySelectorAll("select[data-sku-map]"));
    const values = Object.fromEntries(inputs.map((input) => [String(input.dataset.skuMap || ""), String(input.value || "").trim()]));
    selects.forEach((select) => {
      values[String(select.dataset.skuMap || "")] = String(select.value || "").trim();
    });
    return normalizeSkuMappingRow({
      source: tr.dataset.skuMappingSource || "base",
      skuId: values.skuId,
      productName: values.productName,
      skuType: values.skuType,
      product1: values.product1,
      product2: values.product2,
      product3: values.product3,
      product4: values.product4,
    });
  });
}

function normalizeSkuMappingRowForSave(row) {
  const normalized = normalizeSkuMappingRow(row);
  const skuType = normalizeSkuTypeForSelect(normalized.skuType, normalized);
  if (skuType === "ignore") {
    return {
      ...normalized,
      skuType,
      product1: "Ignore",
      product2: "",
      product3: "",
      product4: "",
    };
  }
  if (skuType === "base") {
    return {
      ...normalized,
      skuType,
      product2: "",
      product3: "",
      product4: "",
    };
  }
  return { ...normalized, skuType };
}

async function loadSkuMapping() {
  if (!skuMappingBody) return;
  try {
    const payload = await fetchJson("/api/sku-mapping");
    skuMappingSnapshot = {
      baseRows: Array.isArray(payload.baseRows) ? payload.baseRows.map(normalizeSkuMappingRow) : [],
      localRows: Array.isArray(payload.localRows) ? payload.localRows.map((row) => ({ ...normalizeSkuMappingRow(row), source: "override" })) : [],
      rows: Array.isArray(payload.rows) ? payload.rows.map(normalizeSkuMappingRow) : [],
      editable: Boolean(payload.editable),
      mode: payload.mode === "live" ? "live" : "local",
    };
    renderSkuMappingTable(skuMappingSnapshot.rows);
    if (saveSkuMappingButton instanceof HTMLButtonElement) saveSkuMappingButton.disabled = !skuMappingSnapshot.editable;
    if (addSkuMappingButton instanceof HTMLButtonElement) addSkuMappingButton.disabled = !skuMappingSnapshot.editable;
  } catch (error) {
    skuMappingBody.innerHTML = `<tr><td colspan="8" class="empty">${escapeHtml(error.message || "Could not load SKU mapping.")}</td></tr>`;
    if (saveSkuMappingButton instanceof HTMLButtonElement) saveSkuMappingButton.disabled = true;
    if (addSkuMappingButton instanceof HTMLButtonElement) addSkuMappingButton.disabled = true;
  }
}

async function saveSkuMappingOverrides() {
  const unlocked = await ensureSettingsUnlocked();
  if (!unlocked) {
    setStatus("Settings are locked.", true);
    return;
  }
  const baseByKey = new Map(skuMappingSnapshot.baseRows.map((row) => [skuMappingKey(row), normalizeSkuMappingRow(row)]));
  const overrideRows = readSkuMappingTableRows()
    .map((row) => normalizeSkuMappingRowForSave(row))
    .filter((row) => row.skuId && row.productName && (row.product1 || row.product2 || row.product3 || row.product4))
    .filter((row) => {
      const base = baseByKey.get(skuMappingKey(row));
      return !base || !skuMappingEquivalent(row, base);
    })
    .map((row) => ({
      skuId: row.skuId,
      productName: row.productName,
      product1: row.product1,
      product2: row.product2,
      product3: row.product3,
      product4: row.product4,
    }));

  setButtonBusy(saveSkuMappingButton, true, "Saving...");
  try {
    const payload = await postJson("/api/sku-mapping", { rows: overrideRows });
    setStatus(`SKU mapping saved (${integer(payload.rowsWritten || overrideRows.length)} overrides).`);
    await loadSkuMapping();
  } catch (error) {
    setStatus(error.message || "Could not save SKU mapping.", true);
  } finally {
    setButtonBusy(saveSkuMappingButton, false);
  }
}

function renderMarketingConfig() {
  renderCampaignsTable(marketingConfig.campaigns || []);
  renderLaunchPlansTable(marketingConfig.launchPlans || []);
  renderLaunchProxyOptions();
}

function renderLaunchProxyOptions() {
  if (!(launchProxyProductSelect instanceof HTMLSelectElement)) return;
  const selected = launchProxyProductSelect.value;
  const options = [
    `<option value="">Select a product...</option>`,
    ...CORE_PRODUCTS.map((product) => `<option value="${escapeHtml(product)}">${escapeHtml(displayProductName(product))}</option>`),
  ];
  launchProxyProductSelect.innerHTML = options.join("");
  if (selected) {
    launchProxyProductSelect.value = selected;
  }
}

function renderCampaignsTable(campaigns) {
  if (!campaignBody) return;
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    campaignBody.innerHTML = `<tr><td colspan="7" class="empty">No campaigns defined yet.</td></tr>`;
    return;
  }
  const rows = campaigns
    .slice()
    .sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")))
    .map((campaign) => {
      const days = inclusiveDayCount(campaign.startDate, campaign.endDate);
      return `
        <tr>
          <td class="text-left">${escapeHtml(campaign.name)}</td>
          <td>${escapeHtml(campaign.startDate)}</td>
          <td>${escapeHtml(campaign.endDate)}</td>
          <td>${integer(days)}</td>
          <td>${pctLabel(campaign.liftPct)}</td>
          <td class="muted">—</td>
          <td><button type="button" class="table-action" data-campaign-delete="${escapeHtml(campaign.id)}">Delete</button></td>
        </tr>
      `;
    })
    .join("");
  campaignBody.innerHTML = rows;
}

function renderLaunchPlansTable(plans) {
  if (!launchPlanBody) return;
  if (!Array.isArray(plans) || plans.length === 0) {
    launchPlanBody.innerHTML = `<tr><td colspan="6" class="empty">No launch plans defined yet.</td></tr>`;
    return;
  }
  const rows = sortRowsByProductName(plans, "newProductName")
    .map((plan) => `
      <tr>
        <td class="text-left">${escapeHtml(displayProductName(plan.newProductName))}</td>
        <td>${escapeHtml(displayProductName(plan.proxyProduct))}</td>
        <td>${pctLabel(plan.strengthPct)}</td>
        <td>${escapeHtml(formatDateWindow(plan.startDate, plan.endDate))}</td>
        <td>${integer(plan.committedUnits)}</td>
        <td>
          <button type="button" class="table-action" data-launch-edit="${escapeHtml(plan.id)}">Edit</button>
          <button type="button" class="table-action" data-launch-delete="${escapeHtml(plan.id)}">Delete</button>
        </td>
      </tr>
    `)
    .join("");
  launchPlanBody.innerHTML = rows;
}

function setLaunchEditMode(plan) {
  activeLaunchEditId = String(plan?.id || "");
  if (launchEditIdInput) launchEditIdInput.value = activeLaunchEditId;
  if (addLaunchButton) addLaunchButton.textContent = "Save changes";
  if (cancelLaunchEditButton) cancelLaunchEditButton.hidden = false;
}

function clearLaunchEditMode() {
  activeLaunchEditId = "";
  if (launchEditIdInput) launchEditIdInput.value = "";
  if (addLaunchButton) addLaunchButton.textContent = "Add Plan";
  if (cancelLaunchEditButton) cancelLaunchEditButton.hidden = true;
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
  const skuIdCol = pickUploadColumn(columns, ["SKU ID", "Sku ID"], [["sku", "id"]]);
  const productNameCol = pickUploadColumn(columns, ["Product Name"], [["product", "name"]]);
  const sellerSkuCol = pickUploadColumn(columns, ["Seller SKU"], [["seller", "sku"]]);
  const bundleSkuCol = pickUploadColumn(columns, ["Virtual Bundle Seller SKU", " Virtual Bundle Seller SKU"], [["virtual", "bundle", "seller", "sku"]]);
  const quantityCol = pickUploadColumn(columns, ["Quantity"], [["quantity"]]);
  const returnedQuantityCol = pickUploadColumn(columns, ["Sku Quantity of return", "SKU Quantity of return"], [["return", "quantity"]]);
  const grossSalesCol = pickUploadColumn(columns, ["SKU Subtotal Before Discount"], [["sku", "subtotal", "before", "discount"]]);
  const sellerDiscountCol = pickUploadColumn(columns, ["SKU Seller Discount"], [["sku", "seller", "discount"], ["seller", "discount"]]);
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
    const sellerDiscount = parseUploadNumber(sellerDiscountCol ? row[sellerDiscountCol] : 0);
    const paidDate = parseUploadDate(row[paidTimeCol]);
    const createdDate = parseUploadDate(row[createdTimeCol]);
    const orderDate = paidDate || createdDate;
    const statusText = `${orderStatus} ${orderSubstatus} ${cancelType}`.toLowerCase();
    const isCancelled = statusText.includes("cancel") || Boolean(parseUploadDate(row[cancelledTimeCol]));
    const netUnits = isCancelled ? 0 : Math.max(quantity - returnedQuantity, 0);
    // IMPORTANT: "gross_sales" is used as *Gross Product Sales* (TikTok dashboard GMV-style),
    // i.e. SUM(SKU Subtotal Before Discount). This includes cancelled rows (GMV), while demand units
    // still use net units (quantity - returns) so planning stays conservative.
    const grossProductSales = grossSales;
    // Net gross (planner-style): finance-like estimate that matches TikTok's "Net product sales" shape:
    //   gross before discount - seller-funded discount, then scaled down for returned units.
    // We intentionally ignore platform discount because it doesn't reduce what the seller earns.
    // If Quantity is missing (some exports), fall back to gross - seller discount for consistency.
    const grossLessSellerDiscount = Math.max(grossSales - sellerDiscount, 0);
    const netGrossSalesEst =
      isCancelled || netUnits <= 0
        ? 0
        : quantity > 0
          ? roundCurrency(grossLessSellerDiscount * (netUnits / quantity))
          : grossLessSellerDiscount;
    return {
      platform: cleanUploadText(platform) || "TikTok",
      order_id: cleanUploadText(row[orderIdCol]),
      order_date: orderDate,
      paid_date: paidDate,
      created_date: createdDate,
      sku_id: cleanUploadText(row[skuIdCol]),
      product_name: productName,
      seller_sku_resolved: cleanUploadText(row[sellerSkuCol]) || cleanUploadText(row[bundleSkuCol]),
      quantity,
      returned_quantity: returnedQuantity,
      gross_sales: grossProductSales,
      net_gross_sales: netGrossSalesEst,
      net_units: netUnits,
    };
  }).filter((row) => (row.order_date || row.paid_date || row.created_date) && row.product_name);
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
        net_gross_sales: 0,
      };
      current.net_units += Number(row.net_units || 0) * multiplier;
      current.gross_sales += totalMultiplier ? (Number(row.gross_sales || 0) * multiplier) / totalMultiplier : 0;
      current.net_gross_sales += totalMultiplier ? (Number(row.net_gross_sales || 0) * multiplier) / totalMultiplier : 0;
      grouped.set(key, current);
    });
  });
  return Array.from(grouped.values())
    .filter((row) => row.net_units !== 0 || row.gross_sales !== 0 || row.net_gross_sales !== 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.product_name.localeCompare(b.product_name));
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
  let rawRowCount = 0;
  for (const file of Array.from(files)) {
    const rawRows = await readUploadFileRows(file);
    rawRowCount += rawRows.length;
    allNormalizedRows.push(...normalizeUploadRows(rawRows, platform));
  }

  // Keep the upload payload lean: we do not need order-level rows on the server.
  // Group by day + SKU so the JSON stays small even for large historical exports.
  const grouped = new Map();
  allNormalizedRows.forEach((row) => {
    const paidDate = cleanUploadText(row.paid_date || row.order_date).slice(0, 10);
    const createdDate = cleanUploadText(row.created_date || row.order_date || row.paid_date).slice(0, 10);
    const orderDate = paidDate || createdDate;
    if (!orderDate) return;
    const skuId = cleanUploadText(row.sku_id);
    const listingName = cleanUploadText(row.product_name);
    const sellerSku = cleanUploadText(row.seller_sku_resolved);
    const key = `${paidDate}__${createdDate}__${skuId}__${sellerSku}__${listingName}`;
    const current = grouped.get(key) || {
      platform: cleanUploadText(platform) || "TikTok",
      order_date: orderDate,
      paid_date: paidDate,
      created_date: createdDate,
      sku_id: skuId,
      product_name: listingName,
      seller_sku_resolved: sellerSku,
      net_units: 0,
      gross_sales: 0,
      net_gross_sales: 0,
    };
    current.net_units += Number(row.net_units || 0);
    current.gross_sales = roundCurrency(Number(current.gross_sales || 0) + Number(row.gross_sales || 0));
    current.net_gross_sales = roundCurrency(Number(current.net_gross_sales || 0) + Number(row.net_gross_sales || 0));
    grouped.set(key, current);
  });

  const rows = Array.from(grouped.values()).filter((row) => (row.order_date || row.paid_date || row.created_date) && row.product_name);
  const uploadedDates = Array.from(new Set(rows.map((row) => cleanUploadText(row.paid_date || row.order_date).slice(0, 10)).filter(Boolean))).sort();
  return {
    platform: cleanUploadText(platform) || "TikTok",
    rows,
    uploadedDates,
    rawRowCount,
    sourceRowCount: allNormalizedRows.length,
  };
}

function chunkRowsByDate(rows, maxRows = 1500) {
  const byDate = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const date = cleanUploadText(row.paid_date || row.order_date || row.date).slice(0, 10);
    if (!date) return;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(row);
  });
  const dates = Array.from(byDate.keys()).sort();
  const chunks = [];
  let currentDates = [];
  let currentRows = [];
  let currentCount = 0;
  dates.forEach((date) => {
    const dayRows = byDate.get(date) || [];
    if (currentCount > 0 && currentCount + dayRows.length > maxRows) {
      chunks.push({ uploadedDates: currentDates, rows: currentRows });
      currentDates = [];
      currentRows = [];
      currentCount = 0;
    }
    currentDates.push(date);
    currentRows.push(...dayRows);
    currentCount += dayRows.length;
  });
  if (currentCount) chunks.push({ uploadedDates: currentDates, rows: currentRows });
  return chunks;
}

const HEADER_HELP = {
  "Status": "Planner status summary. Spoilage Risk is currently estimated as: projected_supply_days = (on_hand + in_transit + recommended_order_units) / forecast_daily_demand. The row is marked Spoilage Risk when projected_supply_days is greater than shelf_life_months * 30. This is not batch-aware, so it does not distinguish older warehouse stock from newer fresh inventory.",
  "Baseline velocity": "Average units/day from the selected baseline window. Computed as units_used_for_velocity / days_used_for_velocity. Viral smoothing and intermittent sales can change days used.",
  "Plan velocity": "Units/day assumed for the selected planning month after plan uplift, mix, and campaign lifts. This is the scenario run-rate used for cover, stockout dates, and reorder math.",
  "Order units": "Actual units sold in the selected baseline date range.",
  "Smoothed units": "Units used after viral outlier smoothing. When smoothing is on, the planner can remove the highest-selling days from the baseline window before calculating demand velocity (tune the thresholds in Settings).",
  "Baseline unit mix %": "This product's share of total baseline units sold across the core products.",
  "Sample units": "Sample units sent in the selected baseline date range. This is shown separately in Drivers when demand mode is Sales + samples.",
  "Units used": "Units used in the baseline velocity calculation (sales only, or sales + samples depending on the demand mode).",
  "Days used": "Days used in the baseline velocity calculation. This can be less than the full baseline window when sales are intermittent or smoothing removes spike days.",
  "Gross sales": "Gross product sales in the selected baseline dates (SUM of SKU Subtotal Before Discount). This includes cancelled orders (GMV-style); demand units remain net of returns.",
  "Net gross (est.)": "Planner-style net product sales estimate (TikTok finance shape). Cancelled orders are set to $0. We subtract seller-funded discount from SKU Subtotal Before Discount, then prorate for returned units. Platform discount is not subtracted.",
  "On hand": "Units physically available right now from the latest inventory snapshot.",
  "In transit": "Units already sent inbound but not available to sell yet.",
  "Transit start": "First snapshot date where the current inbound shipment appears as in transit.",
  "Transit ETA": "Expected arrival date for the inbound units we are counting.",
  "Lead time used": "Lead time used in the math for this row. The planner uses historical transit lead time when it can infer one, otherwise it falls back to the shared default lead time.",
  "Transit gap": "Estimated number of days where on-hand inventory runs out before the current inbound ETA arrives.",
  "Current supply": "Current supply used by the planner: on hand + in transit. This is not time-phased by ETA; Transit gap is the signal that inbound arrives too late.",
  "On-hand cover (recent)": "How long on-hand inventory lasts at the baseline (history) velocity. This is the easiest sanity-check for what you have right now.",
  "Total cover (plan)": "How long current supply (on hand + in transit) lasts if demand happens at the planned rate. This is the main planning scenario used for stockout and reorder math.",
  "Safety stock": "Extra units kept as protection before the next order should arrive.",
  "Projected stockout date": "Projected date you run out if demand follows the planned rate. Shows total-supply stockout, plus on-hand-only stockout (OH) when it differs.",
  "Order-by date": "Latest date to place the next order so lead time and safety stock are covered if the selected month plan happens as expected.",
  "Order now": "Recommended units to order now if the selected month plan happens as expected, after supply, lead time, and safety stock are applied.",
  "Planned order trigger": "This is the trigger line for the planned scenario, not the order quantity. Compare current supply against this number. If current supply is below this trigger, it is time to order under the lifted plan. 'Order now' is the quantity to buy.",
  "Capital needed": "Estimated cash needed for the recommended order: recommended_order_units * unit_cogs.",
  "Recommended order": "Action view: shows the suggested order quantity and timing under the selected planning scenario.",
  "Drivers": "Explanation view: shows coverage, stockout timing, and the main drivers behind the recommended unit count.",
  "History-only drivers": "Baseline-only explanation view: ignores planning lifts and shows what the numbers look like using recent history only.",
  "History-only cover": "How long current supply lasts if demand keeps running at the baseline history velocity only.",
  "History-only stockout": "Projected stockout date if demand keeps running at the baseline history velocity only.",
  "History-only order-by": "Latest date to place the next order if you are only using baseline history velocity.",
  "History-only order trigger": "This is the trigger line, not the order quantity. Compare current supply against this number. If current supply is below this trigger, it is time to order. 'History-only order now' is the quantity to buy.",
  "History-only order now": "Suggested order quantity using baseline history only, with MOQ and case-pack rounding still applied.",
  "History-only capital": "Estimated cash needed for the history-only order quantity.",
  "Units in baseline window": "Actual units sold during the selected baseline date range.",
  "Baseline unit share %": "This product's share of all baseline units sold.",
  "Baseline sales share %": "This product's share of all baseline gross sales.",
  "Gross sales in baseline window": "Gross sales for this product during the selected baseline dates.",
  "Planned units": "Units planned for the selected plan year after combining actual months and future forecast months.",
  "Year share %": "This product's share of the full selected plan year units.",
  "Year total units": "Total units for this product across the selected plan year.",
};

const HEADER_SUBLABEL = {
  "Baseline velocity": "units/day",
  "Plan velocity": "units/day",
};

function renderHeaderCell(label, options = {}) {
  const help = options.help ?? HEADER_HELP[label];
  const subLabel = options.subLabel ?? HEADER_SUBLABEL[label];
  if (!help) {
    return `<th>${escapeHtml(label)}</th>`;
  }
  return `
    <th>
      <span class="th-help">
        <span class="th-label-stack">
          <span>${escapeHtml(label)}</span>
          ${subLabel ? `<span class="th-sub-label">${escapeHtml(subLabel)}</span>` : ""}
        </span>
        <button type="button" class="th-help-trigger" data-help="${escapeHtml(help)}" aria-label="More info about ${escapeHtml(label)}">?</button>
      </span>
    </th>
  `;
}

function positionFloatingHelpTooltip(trigger) {
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const tooltipWidth = floatingHelpTooltip.offsetWidth || 320;
  const tooltipHeight = floatingHelpTooltip.offsetHeight || 0;
  const horizontalPadding = 12;
  const verticalGap = 14;
  let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
  left = Math.max(horizontalPadding, Math.min(left, window.innerWidth - tooltipWidth - horizontalPadding));
  let top = rect.top - tooltipHeight - verticalGap;
  if (top < 12) {
    top = rect.bottom + verticalGap;
  }
  floatingHelpTooltip.style.left = `${Math.round(left)}px`;
  floatingHelpTooltip.style.top = `${Math.round(top)}px`;
}

function showFloatingHelpTooltip(trigger) {
  const help = trigger?.dataset?.help;
  if (!help) return;
  activeHelpTrigger = trigger;
  floatingHelpTooltip.textContent = help;
  floatingHelpTooltip.hidden = false;
  floatingHelpTooltip.dataset.visible = "true";
  positionFloatingHelpTooltip(trigger);
}

function hideFloatingHelpTooltip() {
  activeHelpTrigger = null;
  floatingHelpTooltip.hidden = true;
  floatingHelpTooltip.dataset.visible = "false";
}

async function syncHostedKpiAvailability() {
  if (!hostedKpiButton || !pages.kpis) return;
  const unavailable = false;
  hostedKpiButton.hidden = false;
  hostedKpiButton.dataset.disabled = unavailable ? "true" : "false";
  hostedKpiButton.setAttribute("aria-disabled", unavailable ? "true" : "false");
  pages.kpis.hidden = false;
}

function setStatus(message, isError = false) {
  uploadStatus.textContent = message || "";
  uploadStatus.dataset.error = isError ? "true" : "false";
}

function setButtonBusy(button, busy, label) {
  if (!(button instanceof HTMLElement)) return;
  const node = button;
  if (busy) {
    if (!node.dataset.originalLabel) {
      node.dataset.originalLabel = node.textContent || "";
    }
    node.classList.add("is-busy");
    node.setAttribute("aria-busy", "true");
    if (node instanceof HTMLButtonElement) {
      node.disabled = true;
    }
    const nextLabel = label || node.dataset.originalLabel || node.textContent || "Working...";
    node.innerHTML = `<span class="button-spinner"><span class="spinner-dot" aria-hidden="true"></span><span>${escapeHtml(nextLabel)}</span></span>`;
  } else {
    node.classList.remove("is-busy");
    node.setAttribute("aria-busy", "false");
    if (node instanceof HTMLButtonElement) {
      node.disabled = false;
    }
    const restore = node.dataset.originalLabel;
    if (restore !== undefined) {
      node.textContent = restore;
      delete node.dataset.originalLabel;
    }
  }
}

let screenBusyDepth = 0;

function beginScreenBusy(message) {
  screenBusyDepth += 1;
  if (appLoadingMessage) {
    appLoadingMessage.textContent = String(message || "Working...");
  }
  if (appLoadingOverlay) {
    appLoadingOverlay.hidden = false;
  }
  document.body.classList.add("is-screen-busy");
  document.body.setAttribute("aria-busy", "true");
}

function endScreenBusy() {
  screenBusyDepth = Math.max(0, screenBusyDepth - 1);
  if (screenBusyDepth > 0) return;
  if (appLoadingOverlay) {
    appLoadingOverlay.hidden = true;
  }
  document.body.classList.remove("is-screen-busy");
  document.body.setAttribute("aria-busy", "false");
}

function setActivePage(page) {
  if (page === "kpis" && hostedKpiButton?.hidden) {
    page = "planning";
  }
  if (page === "kpis") {
    if (!kpisRequested) {
      kpisRequested = true;
      setStatus("Loading TikTok KPIs...");
      loadKpis()
        .then(() => setStatus("TikTok KPIs loaded."))
        .catch((error) => setStatus(error.message || "Could not load TikTok KPIs.", true));
    }
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
    if (!node) return;
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
        : tab === "sku-sales"
          ? "Review listing-level SKU sales and virtual bundle gross without storing raw order files."
        : tab === "trends"
          ? "Review actual performance by year without making the planning page much longer."
          : "Use a proxy launch curve and committed units to sanity-check new product sends.";
  }
}

document.addEventListener("mouseover", (event) => {
  const trigger = event.target.closest(".th-help-trigger");
  if (!trigger) return;
  showFloatingHelpTooltip(trigger);
});

document.addEventListener("mouseout", (event) => {
  const trigger = event.target.closest(".th-help-trigger");
  if (!trigger) return;
  const relatedTarget = event.relatedTarget;
  if (relatedTarget instanceof Node && trigger.contains(relatedTarget)) return;
  hideFloatingHelpTooltip();
});

document.addEventListener("focusin", (event) => {
  const trigger = event.target.closest(".th-help-trigger");
  if (!trigger) return;
  showFloatingHelpTooltip(trigger);
});

document.addEventListener("focusout", (event) => {
  const trigger = event.target.closest(".th-help-trigger");
  if (!trigger) return;
  hideFloatingHelpTooltip();
});

window.addEventListener("scroll", () => {
  if (activeHelpTrigger) positionFloatingHelpTooltip(activeHelpTrigger);
}, true);

window.addEventListener("resize", () => {
  if (activeHelpTrigger) positionFloatingHelpTooltip(activeHelpTrigger);
});

function defaultProductMix() {
  const share = 100 / CORE_PRODUCTS.length;
  return Object.fromEntries(CORE_PRODUCTS.map((product) => [product, share]));
}

function defaultProductLiftOverrides() {
  return Object.fromEntries(CORE_PRODUCTS.map((product) => [product, 0]));
}

function defaultPlannerSettings() {
  return {
    global: {
      defaultExpiryMonths: 24,
      defaultLeadTimeDays: 8,
      safetyStockWeeksH1: 3,
      safetyStockWeeksH2: 5,
      orderDateBasis: "created_time",
      viralSmoothingEnabled: true,
      viralSmoothingExcludeTopDays: 2,
      viralSmoothingMinSellingDays: 14,
    },
    products: {
      "Birria Bomb 2-Pack": { cogs: 3.1, moq: 0, casePack: 24, shelfLife: 24, safetyStockWeeksOverride: 0 },
      "Chile Colorado Bomb 2-Pack": { cogs: 3.95, moq: 0, casePack: 24, shelfLife: 24, safetyStockWeeksOverride: 0 },
      "Pozole Bomb 2-Pack": { cogs: 3.05, moq: 0, casePack: 24, shelfLife: 24, safetyStockWeeksOverride: 0 },
      "Pozole Verde Bomb 2-Pack": { cogs: 3.75, moq: 0, casePack: 24, shelfLife: 24, safetyStockWeeksOverride: 0 },
      "Tinga Bomb 2-Pack": { cogs: 3.15, moq: 0, casePack: 24, shelfLife: 24, safetyStockWeeksOverride: 0 },
      "Brine Bomb": { cogs: 4.2, moq: 0, casePack: 24, shelfLife: 24, safetyStockWeeksOverride: 0 },
      "Variety Pack": { cogs: 13.35, moq: 0, casePack: 4, shelfLife: 24, safetyStockWeeksOverride: 0 },
    },
  };
}

function normalizePlannerSettings(settings) {
  const defaults = defaultPlannerSettings();
  const source = settings && typeof settings === "object" ? settings : {};
  const global = source.global && typeof source.global === "object" ? source.global : {};
  const products = source.products && typeof source.products === "object" ? source.products : {};
  return {
    global: {
      defaultExpiryMonths: Math.max(1, Number(global.defaultExpiryMonths) || defaults.global.defaultExpiryMonths),
      defaultLeadTimeDays: Math.max(1, Number(global.defaultLeadTimeDays) || defaults.global.defaultLeadTimeDays),
      safetyStockWeeksH1: Math.max(0, Number(global.safetyStockWeeksH1) || defaults.global.safetyStockWeeksH1),
      safetyStockWeeksH2: Math.max(0, Number(global.safetyStockWeeksH2) || defaults.global.safetyStockWeeksH2),
      orderDateBasis: String(global.orderDateBasis || defaults.global.orderDateBasis).toLowerCase() === "created_time" ? "created_time" : "paid_time",
      viralSmoothingEnabled: global.viralSmoothingEnabled === undefined ? defaults.global.viralSmoothingEnabled : Boolean(global.viralSmoothingEnabled),
      viralSmoothingExcludeTopDays: Math.max(0, Math.min(10, Math.floor(Number(global.viralSmoothingExcludeTopDays) || defaults.global.viralSmoothingExcludeTopDays))),
      viralSmoothingMinSellingDays: Math.max(0, Math.min(120, Math.floor(Number(global.viralSmoothingMinSellingDays) || defaults.global.viralSmoothingMinSellingDays))),
    },
    products: Object.fromEntries(CORE_PRODUCTS.map((product) => {
      const sourceProduct = products[product] && typeof products[product] === "object" ? products[product] : {};
      const defaultProduct = defaults.products[product] || { cogs: 0, moq: 0, casePack: 1, shelfLife: defaults.global.defaultExpiryMonths, safetyStockWeeksOverride: 0 };
      return [
        product,
        {
          cogs: Number(sourceProduct.cogs) || defaultProduct.cogs,
          moq: Math.max(0, Number(sourceProduct.moq) || 0),
          casePack: Math.max(1, Number(sourceProduct.casePack) || defaultProduct.casePack),
          shelfLife: Math.max(1, Number(sourceProduct.shelfLife) || defaultProduct.shelfLife),
          safetyStockWeeksOverride: Math.max(0, Number(sourceProduct.safetyStockWeeksOverride) || defaultProduct.safetyStockWeeksOverride || 0),
        },
      ];
    })),
  };
}

function renderPlannerSettings(settings) {
  if (!globalSettingsForm || !productSettingsBody) return;
  const normalized = normalizePlannerSettings(settings);
  globalSettingsForm.elements["defaultExpiryMonths"].value = String(normalized.global.defaultExpiryMonths);
  globalSettingsForm.elements["defaultLeadTimeDays"].value = String(normalized.global.defaultLeadTimeDays);
  globalSettingsForm.elements["safetyStockWeeksH1"].value = String(normalized.global.safetyStockWeeksH1);
  globalSettingsForm.elements["safetyStockWeeksH2"].value = String(normalized.global.safetyStockWeeksH2);
  if (globalSettingsForm.elements["viralSmoothingEnabled"]) globalSettingsForm.elements["viralSmoothingEnabled"].checked = Boolean(normalized.global.viralSmoothingEnabled);
  if (globalSettingsForm.elements["viralSmoothingExcludeTopDays"]) globalSettingsForm.elements["viralSmoothingExcludeTopDays"].value = String(normalized.global.viralSmoothingExcludeTopDays);
  if (globalSettingsForm.elements["viralSmoothingMinSellingDays"]) globalSettingsForm.elements["viralSmoothingMinSellingDays"].value = String(normalized.global.viralSmoothingMinSellingDays);
  productSettingsBody.innerHTML = CORE_PRODUCTS.map((product) => {
    const productSettings = normalized.products[product];
    return `
      <tr>
        <td class="text-left">${escapeHtml(displayProductName(product))}</td>
        <td><input type="number" step="0.01" data-setting-product="${product}" data-setting-key="cogs" value="${productSettings.cogs}"></td>
        <td><input type="number" step="1" data-setting-product="${product}" data-setting-key="moq" value="${productSettings.moq}"></td>
        <td><input type="number" step="1" data-setting-product="${product}" data-setting-key="casePack" value="${productSettings.casePack}"></td>
        <td><input type="number" step="1" data-setting-product="${product}" data-setting-key="shelfLife" value="${productSettings.shelfLife}"></td>
        <td><input type="number" step="0.5" min="0" max="26" data-setting-product="${product}" data-setting-key="safetyStockWeeksOverride" value="${productSettings.safetyStockWeeksOverride || 0}"></td>
      </tr>
    `;
  }).join("");
}

function readPlannerSettingsForm() {
  const defaults = defaultPlannerSettings();
  const settings = {
    global: {
      defaultExpiryMonths: Math.max(1, Number(globalSettingsForm?.elements?.defaultExpiryMonths?.value) || defaults.global.defaultExpiryMonths),
      defaultLeadTimeDays: Math.max(1, Number(globalSettingsForm?.elements?.defaultLeadTimeDays?.value) || defaults.global.defaultLeadTimeDays),
      safetyStockWeeksH1: Math.max(0, Number(globalSettingsForm?.elements?.safetyStockWeeksH1?.value) || defaults.global.safetyStockWeeksH1),
      safetyStockWeeksH2: Math.max(0, Number(globalSettingsForm?.elements?.safetyStockWeeksH2?.value) || defaults.global.safetyStockWeeksH2),
      viralSmoothingEnabled: globalSettingsForm?.elements?.viralSmoothingEnabled?.checked ?? defaults.global.viralSmoothingEnabled,
      viralSmoothingExcludeTopDays: Math.max(0, Math.min(10, Math.floor(Number(globalSettingsForm?.elements?.viralSmoothingExcludeTopDays?.value) || defaults.global.viralSmoothingExcludeTopDays))),
      viralSmoothingMinSellingDays: Math.max(0, Math.min(120, Math.floor(Number(globalSettingsForm?.elements?.viralSmoothingMinSellingDays?.value) || defaults.global.viralSmoothingMinSellingDays))),
    },
    products: {},
  };
  Array.from(productSettingsBody?.querySelectorAll("input[data-setting-product]") || []).forEach((input) => {
    const product = String(input.dataset.settingProduct || "");
    const key = String(input.dataset.settingKey || "");
    if (!product || !key) return;
    if (!settings.products[product]) settings.products[product] = { ...defaults.products[product] };
    settings.products[product][key] = Number(input.value || 0);
  });
  return normalizePlannerSettings(settings);
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
      productLiftOverrides: defaultProductLiftOverrides(),
    };
  });
  Object.entries(defaults.forecastSettings || {}).forEach(([monthKey, setting]) => {
    const rawMix = setting?.productMix && Object.keys(setting.productMix || {}).length ? normalizeProductMix(setting.productMix, defaultProductMix()) : null;
    settings[monthKey] = {
      upliftPct: Number(setting?.upliftPct ?? settings[monthKey]?.upliftPct ?? 0),
      productMix: rawMix,
      productLiftOverrides: normalizeProductLiftOverrides(setting?.productLiftOverrides || settings[monthKey]?.productLiftOverrides || {}),
    };
  });
  return settings;
}

function normalizeProductLiftOverrides(rawOverrides = {}) {
  return Object.fromEntries(
    CORE_PRODUCTS.map((product) => {
      const numeric = Number(rawOverrides?.[product]);
      return [product, Number.isFinite(numeric) ? numeric : 0];
    }),
  );
}

function getMonthlyActualMix(monthKey) {
  return monthlyActualMix?.[monthKey] || null;
}

function listActualMixMonthKeys() {
  return Object.keys(monthlyActualMix || {}).sort().reverse();
}

function suggestCopyMixMonthKey(targetMonthKey) {
  if (!targetMonthKey || targetMonthKey.length < 7) return null;
  const year = Number(targetMonthKey.slice(0, 4));
  const month = targetMonthKey.slice(5, 7);
  if (!Number.isFinite(year)) return null;
  const sameMonthLastYear = `${year - 1}-${month}`;
  if (getMonthlyActualMix(sameMonthLastYear)) return sameMonthLastYear;
  return null;
}

function suggestSeasonalityUplift(targetMonthKey) {
  if (!targetMonthKey || targetMonthKey.length < 7) return null;
  const baselineEndInput = document.getElementById("baseline-end");
  const baselineEndIso = baselineEndInput ? toIsoDate(baselineEndInput.value) : "";
  if (!baselineEndIso) return null;

  const targetYear = Number(targetMonthKey.slice(0, 4));
  const targetMonth = targetMonthKey.slice(5, 7);
  const baselineMonth = baselineEndIso.slice(5, 7);
  if (!Number.isFinite(targetYear)) return null;

  const referenceYear = targetYear - 1;
  if (!Number.isFinite(referenceYear) || referenceYear < 2020) return null;
  const baselineRefKey = `${referenceYear}-${baselineMonth}`;
  const targetRefKey = `${referenceYear}-${targetMonth}`;

  const baselineRefUnits = Number(getMonthlyActuals(baselineRefKey)?.totalUnits ?? 0);
  const targetRefUnits = Number(getMonthlyActuals(targetRefKey)?.totalUnits ?? 0);
  if (!(Number.isFinite(baselineRefUnits) && baselineRefUnits > 0 && Number.isFinite(targetRefUnits) && targetRefUnits > 0)) {
    return null;
  }

  return {
    referenceYear,
    baselineRefKey,
    targetRefKey,
    baselineRefUnits,
    targetRefUnits,
    upliftPct: roundCurrency(((targetRefUnits / baselineRefUnits) - 1) * 100),
  };
}

function renderForecastUpliftSuggestion(targetMonthKey) {
  if (!(forecastUpliftSuggestion instanceof HTMLElement)) return;
  const suggestion = suggestSeasonalityUplift(targetMonthKey);
  if (!suggestion) {
    forecastUpliftSuggestion.textContent = "";
    forecastUpliftSuggestion.hidden = true;
    return;
  }
  const sign = suggestion.upliftPct >= 0 ? "+" : "";
  forecastUpliftSuggestion.hidden = false;
  forecastUpliftSuggestion.textContent =
    `Seasonality hint (from ${suggestion.referenceYear}): `
    + `${monthLabelFromKey(suggestion.targetRefKey)} ${integer(suggestion.targetRefUnits)} units vs `
    + `${monthLabelFromKey(suggestion.baselineRefKey)} ${integer(suggestion.baselineRefUnits)} -> `
    + `suggested ${sign}${number(suggestion.upliftPct)}%.`;
}

function roundMixToTenthAndFixTotal(mix) {
  const rounded = {};
  CORE_PRODUCTS.forEach((product) => {
    const numeric = Number(mix?.[product] ?? 0);
    rounded[product] = Number.isFinite(numeric) ? Math.max(0, Math.round(numeric * 10) / 10) : 0;
  });
  const total = CORE_PRODUCTS.reduce((sum, product) => sum + Number(rounded[product] || 0), 0);
  if (total <= 0) return defaultProductMix();
  const diff = Math.round((100 - total) * 10) / 10;
  if (Math.abs(diff) < 0.05) return rounded;
  const anchor = CORE_PRODUCTS[0];
  rounded[anchor] = Math.max(0, Math.round((Number(rounded[anchor] || 0) + diff) * 10) / 10);
  return rounded;
}

function computeMixFromReference(referenceMix) {
  const next = {};
  CORE_PRODUCTS.forEach((product) => {
    const raw = Number(referenceMix?.[product]);
    if (Number.isFinite(raw)) {
      next[product] = Math.max(0, raw);
    } else {
      next[product] = 0;
    }
  });
  const sum = CORE_PRODUCTS.reduce((total, product) => total + Number(next[product] || 0), 0);
  if (sum <= 0) return null;
  const scaled = Object.fromEntries(CORE_PRODUCTS.map((product) => [product, (Number(next[product] || 0) / sum) * 100]));
  return roundMixToTenthAndFixTotal(scaled);
}

function renderForecastCopyMixPicker(monthKey, { editable = true } = {}) {
  if (!(forecastCopyMixMonth instanceof HTMLSelectElement)) return;
  const keys = listActualMixMonthKeys();
  const suggested = suggestCopyMixMonthKey(monthKey);
  const previous = forecastCopyMixMonth.value;
  const valueToKeep = previous && keys.includes(previous) ? previous : (suggested || "");

  forecastCopyMixMonth.innerHTML = [
    `<option value="">Choose a month...</option>`,
    ...keys.map((key) => `<option value="${escapeHtml(key)}">${escapeHtml(monthLabelFromKey(key))} actuals</option>`),
  ].join("");
  forecastCopyMixMonth.value = valueToKeep;

  if (forecastCopyMixRow instanceof HTMLElement) forecastCopyMixRow.hidden = !editable;
  if (forecastCopyMixHint instanceof HTMLElement) forecastCopyMixHint.hidden = !editable;
  if (forecastCopyMixApplyButton instanceof HTMLButtonElement) forecastCopyMixApplyButton.disabled = !editable;
  forecastCopyMixMonth.disabled = !editable;
}

function applyCopiedMixFromMonth(referenceMonthKey) {
  if (!referenceMonthKey) return false;
  const referenceMix = getMonthlyActualMix(referenceMonthKey);
  if (!referenceMix) return false;
  const blended = computeMixFromReference(referenceMix);
  if (!blended) return false;

  forecastProductMixInputs.querySelectorAll("input[data-product-mix]").forEach((input) => {
    const product = String(input.dataset.productMix || "");
    if (!product) return;
    const value = Number(blended[product] ?? 0);
    input.value = String(Number.isFinite(value) ? value.toFixed(1).replace(/\.0$/, "") : "0");
  });

  updateForecastMixTotal();
  syncForecastInputsFromProductLifts({ baselineUnits: baselineUnitsLookup(), readOnly: false });
  return true;
}

function getMonthlyActuals(monthKey) {
  return monthlyActuals?.[monthKey] || null;
}

function parseDateParts(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  // YYYY-MM-DD
  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { year, month, day };
  }
  // MM/DD/YYYY or M/D/YY
  match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { year, month, day };
  }
  return null;
}

function toIsoDate(value) {
  const parts = parseDateParts(value);
  if (!parts) return "";
  const lastDay = new Date(parts.year, parts.month, 0).getDate();
  const safeDay = Math.min(parts.day, lastDay);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function toUsDate(value) {
  const parts = parseDateParts(value);
  if (!parts) return String(value || "");
  return `${String(parts.month).padStart(2, "0")}/${String(parts.day).padStart(2, "0")}/${parts.year}`;
}

function monthKeyFromDate(value) {
  const iso = toIsoDate(value);
  return iso ? iso.slice(0, 7) : "";
}

function monthLabelFromKey(monthKey) {
  if (!monthKey || monthKey.length !== 7) return "Selected month";
  const [year, month] = monthKey.split("-");
  return `${MONTH_LABELS[Math.max(Number(month) - 1, 0)]} ${year}`;
}

function safeShiftDateToYear(value, year) {
  const iso = toIsoDate(value);
  if (!iso) return value ? String(value) : "";
  const [, month, day] = iso.split("-").map(Number);
  if (!month || !day) return value ? String(value) : "";
  const lastDay = new Date(year, month, 0).getDate();
  const nextDay = Math.min(day, lastDay);
  return toUsDate(`${year}-${String(month).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`);
}

let datePopoverEl = null;
let datePopoverInput = null;
let datePopoverYear = null;
let datePopoverMonth = null; // 1-12

function ensureDatePopover() {
  if (datePopoverEl) return datePopoverEl;
  const el = document.createElement("div");
  el.className = "date-popover";
  el.hidden = true;
  el.innerHTML = `
    <div class="date-popover-header">
      <button type="button" class="date-nav" data-date-nav="prev" aria-label="Previous month">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 19a1 1 0 0 1-.7-.3l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 1 1 1.4 1.4L10.9 12l5.3 5.3A1 1 0 0 1 15.5 19Z"/></svg>
      </button>
      <div class="date-popover-controls" aria-label="Calendar month and year">
        <select class="date-popover-month" data-date-month aria-label="Month"></select>
        <input class="date-popover-year" data-date-year type="number" inputmode="numeric" step="1" min="2020" max="2036" aria-label="Year">
      </div>
      <button type="button" class="date-nav" data-date-nav="next" aria-label="Next month">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.5 19a1 1 0 0 1-.7-1.7l5.3-5.3-5.3-5.3a1 1 0 1 1 1.4-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-.7.3Z"/></svg>
      </button>
    </div>
    <div class="date-weekdays" aria-hidden="true">
      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
    </div>
    <div class="date-grid" data-date-grid></div>
    <div class="date-popover-footer">
      <button type="button" class="date-footer-btn" data-date-action="clear">Clear</button>
      <button type="button" class="date-footer-btn" data-date-action="today">Today</button>
    </div>
  `;
  document.body.appendChild(el);

  el.addEventListener("mousedown", (event) => {
    const target = event.target;
    // Prevent focus loss races when clicking inside the popover, but allow interacting
    // with the month/year controls.
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return;
    event.preventDefault();
  });

  const monthSelect = el.querySelector("[data-date-month]");
  if (monthSelect instanceof HTMLSelectElement) {
    monthSelect.innerHTML = MONTH_LABELS.map((label, idx) => `<option value="${idx + 1}">${escapeHtml(label)}</option>`).join("");
    monthSelect.addEventListener("change", () => {
      const nextMonth = Number(monthSelect.value || 0);
      if (!datePopoverYear || !Number.isFinite(nextMonth) || nextMonth < 1 || nextMonth > 12) return;
      datePopoverMonth = nextMonth;
      renderDatePopover();
    });
  }
  const yearInput = el.querySelector("[data-date-year]");
  if (yearInput instanceof HTMLInputElement) {
    yearInput.addEventListener("change", () => {
      const nextYear = Number(yearInput.value || 0);
      if (!Number.isFinite(nextYear) || nextYear < 1900 || nextYear > 2200) return;
      datePopoverYear = Math.round(nextYear);
      renderDatePopover();
    });
  }

  el.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const dayButton = target.closest("button[data-date-value]");
    if (dayButton instanceof HTMLButtonElement) {
      const iso = String(dayButton.dataset.dateValue || "");
      if (datePopoverInput) {
        datePopoverInput.value = iso ? toUsDate(iso) : "";
        datePopoverInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      closeDatePopover();
      return;
    }
    const nav = target.closest("button[data-date-nav]");
    if (nav instanceof HTMLButtonElement) {
      const dir = String(nav.dataset.dateNav || "");
      shiftDatePopoverMonth(dir === "prev" ? -1 : 1);
      return;
    }
    const action = target.closest("button[data-date-action]");
    if (action instanceof HTMLButtonElement) {
      const kind = String(action.dataset.dateAction || "");
      if (kind === "clear" && datePopoverInput) {
        datePopoverInput.value = "";
        datePopoverInput.dispatchEvent(new Event("change", { bubbles: true }));
        closeDatePopover();
      }
      if (kind === "today" && datePopoverInput) {
        const now = new Date();
        const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        datePopoverInput.value = toUsDate(iso);
        datePopoverInput.dispatchEvent(new Event("change", { bubbles: true }));
        closeDatePopover();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDatePopover();
  });

  document.addEventListener("mousedown", (event) => {
    if (!datePopoverEl || datePopoverEl.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (datePopoverEl.contains(target)) return;
    if (datePopoverInput && datePopoverInput.closest(".date-field-wrap")?.contains(target)) return;
    closeDatePopover();
  });

  window.addEventListener("resize", () => {
    if (datePopoverEl && !datePopoverEl.hidden && datePopoverInput) {
      positionDatePopover(datePopoverInput);
    }
  });

  window.addEventListener("scroll", () => {
    // Keep it simple: close on scroll so it doesn't drift.
    if (datePopoverEl && !datePopoverEl.hidden) closeDatePopover();
  }, true);

  datePopoverEl = el;
  return el;
}

function shiftDatePopoverMonth(delta) {
  if (!datePopoverYear || !datePopoverMonth) return;
  const cursor = new Date(datePopoverYear, datePopoverMonth - 1, 1);
  cursor.setMonth(cursor.getMonth() + delta);
  datePopoverYear = cursor.getFullYear();
  datePopoverMonth = cursor.getMonth() + 1;
  renderDatePopover();
}

function renderDatePopover() {
  if (!datePopoverEl || !datePopoverYear || !datePopoverMonth) return;
  const monthSelect = datePopoverEl.querySelector("[data-date-month]");
  if (monthSelect instanceof HTMLSelectElement) {
    monthSelect.value = String(datePopoverMonth);
  }
  const yearInput = datePopoverEl.querySelector("[data-date-year]");
  if (yearInput instanceof HTMLInputElement) {
    yearInput.value = String(datePopoverYear);
  }

  const grid = datePopoverEl.querySelector("[data-date-grid]");
  if (!grid) return;
  const first = new Date(datePopoverYear, datePopoverMonth - 1, 1);
  const startWeekday = first.getDay(); // 0=Su
  const daysInMonth = new Date(datePopoverYear, datePopoverMonth, 0).getDate();
  const daysInPrev = new Date(datePopoverYear, datePopoverMonth - 1, 0).getDate();
  const selectedIso = datePopoverInput ? toIsoDate(datePopoverInput.value) : "";
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells = [];
  for (let idx = 0; idx < 42; idx += 1) {
    const offset = idx - startWeekday;
    let y = datePopoverYear;
    let m = datePopoverMonth;
    let d = offset + 1;
    let outside = false;
    if (d < 1) {
      outside = true;
      const prev = new Date(datePopoverYear, datePopoverMonth - 2, 1);
      y = prev.getFullYear();
      m = prev.getMonth() + 1;
      d = daysInPrev + d;
    } else if (d > daysInMonth) {
      outside = true;
      const next = new Date(datePopoverYear, datePopoverMonth, 1);
      y = next.getFullYear();
      m = next.getMonth() + 1;
      d = d - daysInMonth;
    }
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const classes = [
      "date-day",
      outside ? "is-outside" : "",
      iso === selectedIso ? "is-selected" : "",
      iso === todayIso ? "is-today" : "",
    ].filter(Boolean).join(" ");
    cells.push(`<button type="button" class="${classes}" data-date-value="${iso}">${d}</button>`);
  }
  grid.innerHTML = cells.join("");
}

function positionDatePopover(input) {
  const el = ensureDatePopover();
  const rect = input.getBoundingClientRect();
  const gap = 8;
  const width = 292;
  const height = 340;
  let left = rect.left;
  let top = rect.bottom + gap;
  if (left + width > window.innerWidth - 10) left = window.innerWidth - width - 10;
  if (left < 10) left = 10;
  if (top + height > window.innerHeight - 10) top = rect.top - height - gap;
  if (top < 10) top = 10;
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
}

function openDatePopover(input) {
  const el = ensureDatePopover();
  datePopoverInput = input;
  const iso = toIsoDate(input.value) || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();
  const parts = parseDateParts(iso);
  datePopoverYear = parts?.year || new Date().getFullYear();
  datePopoverMonth = parts?.month || (new Date().getMonth() + 1);
  renderDatePopover();
  positionDatePopover(input);
  el.hidden = false;
}

function closeDatePopover() {
  if (!datePopoverEl) return;
  datePopoverEl.hidden = true;
  datePopoverInput = null;
  datePopoverYear = null;
  datePopoverMonth = null;
}

function setupDatePickers() {
  const inputs = Array.from(document.querySelectorAll('input[data-date-picker]'));
  inputs.forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const wrap = input.closest(".date-field-wrap");
    const trigger = wrap ? wrap.querySelector("button[data-date-trigger]") : null;
    const open = () => openDatePopover(input);
    input.addEventListener("focus", open);
    trigger?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      open();
      input.focus();
    });
    input.addEventListener("blur", () => {
      const iso = toIsoDate(input.value);
      if (iso) input.value = toUsDate(iso);
    });
  });
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
  const actuals = getMonthlyActuals(monthKey);
  if (!actuals) return false;
  const totalUnits = Number(actuals.totalUnits ?? 0);
  return Number.isFinite(totalUnits) && totalUnits > 0;
}

function isEditableForecastMonth(monthKey) {
  return !monthHasActuals(monthKey);
}

function getForecastSetting(monthKey, { persist = false } = {}) {
  if (!monthKey) {
    return {
      upliftPct: Number(document.getElementById("uplift-pct").value || 35),
      productMix: { ...defaultProductMix() },
      productLiftOverrides: defaultProductLiftOverrides(),
    };
  }
  const existing = forecastSettings[monthKey];
  if (!existing) {
    const monthActualMix = getMonthlyActualMix(monthKey);
    const suggested = suggestSeasonalityUplift(monthKey);
    const draftSetting = {
      upliftPct: suggested ? Number(suggested.upliftPct) : Number(document.getElementById("uplift-pct").value || 35),
      productMix: monthActualMix ? normalizeProductMix(monthActualMix, defaultProductMix()) : null,
      productLiftOverrides: defaultProductLiftOverrides(),
    };
    return persist ? (forecastSettings[monthKey] = draftSetting) : draftSetting;
  }
  const normalized = {
    upliftPct: Number(existing?.upliftPct ?? 35),
    productMix: existing?.productMix ? normalizeProductMix(existing?.productMix, defaultProductMix()) : null,
    productLiftOverrides: normalizeProductLiftOverrides(existing?.productLiftOverrides || {}),
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

function baselineUnitsLookup() {
  const rows = latestPlanPayload?.productMix?.rows || [];
  return Object.fromEntries(
    rows.map((row) => [String(row.product_name || ""), Number(row.baseline_units || 0)]),
  );
}

function hasProductLiftOverrides(setting) {
  return CORE_PRODUCTS.some((product) => Math.abs(Number(setting?.productLiftOverrides?.[product] || 0)) > 0.0001);
}

function calculateForecastFromProductLifts(overrides = {}, baselineUnits = {}) {
  const normalizedOverrides = normalizeProductLiftOverrides(overrides);
  const rows = CORE_PRODUCTS.map((product) => {
    const baseUnits = Number(baselineUnits?.[product] || 0);
    const liftPct = Number(normalizedOverrides[product] || 0);
    const plannedUnits = Math.max(0, baseUnits * (1 + (liftPct / 100)));
    return { product, baseUnits, liftPct, plannedUnits };
  });
  const totalBaselineUnits = rows.reduce((sum, row) => sum + row.baseUnits, 0);
  const totalPlannedUnits = rows.reduce((sum, row) => sum + row.plannedUnits, 0);
  return {
    rows: rows.map((row) => ({
      ...row,
      plannedSharePct: totalPlannedUnits > 0 ? (row.plannedUnits / totalPlannedUnits) * 100 : 0,
    })),
    totalBaselineUnits,
    totalPlannedUnits,
    upliftPct: totalBaselineUnits > 0 ? ((totalPlannedUnits / totalBaselineUnits) - 1) * 100 : 0,
    productMix: totalPlannedUnits > 0
      ? Object.fromEntries(rows.map((row) => [row.product, (row.plannedUnits / totalPlannedUnits) * 100]))
      : null,
  };
}

function readForecastProductLiftOverrides() {
  if (!forecastProductMixInputs) return defaultProductLiftOverrides();
  return normalizeProductLiftOverrides(
    Object.fromEntries(
      Array.from(forecastProductMixInputs.querySelectorAll("input[data-product-lift]")).map((input) => [String(input.dataset.productLift || ""), Number(input.value || 0)]),
    ),
  );
}

function updateForecastLiftPreview(computed) {
  if (!forecastProductMixInputs || !computed?.rows?.length) return;
  computed.rows.forEach((row) => {
    const field = forecastProductMixInputs.querySelector(`.forecast-product-field[data-forecast-product="${CSS.escape(row.product)}"]`);
    const footnote = field?.querySelector(".forecast-product-footnote");
    if (!(footnote instanceof HTMLElement)) return;
    footnote.textContent = `Planned units ${number(row.plannedUnits || 0)} | Planned share ${number(row.plannedSharePct || 0)}%`;
  });
}

function syncForecastInputsFromProductLifts({ baselineUnits = {}, readOnly = false } = {}) {
  const overrides = readForecastProductLiftOverrides();
  const computed = calculateForecastFromProductLifts(overrides, baselineUnits);
  const hasOverrides = CORE_PRODUCTS.some((product) => Math.abs(Number(overrides[product] || 0)) > 0.0001);
  if (forecastUpliftSuggestion instanceof HTMLElement) {
    const hasSuggestionText = Boolean(forecastUpliftSuggestion.textContent && forecastUpliftSuggestion.textContent.trim());
    forecastUpliftSuggestion.hidden = readOnly || hasOverrides || !hasSuggestionText;
  }
  forecastMonthUplift.disabled = readOnly || hasOverrides;
  forecastProductMixInputs.querySelectorAll("input[data-product-mix]").forEach((input) => {
    input.disabled = readOnly;
  });
  if (hasOverrides) {
    forecastMonthUplift.value = String(roundCurrency(computed.upliftPct));
    if (forecastLiftGuidance) {
      forecastLiftGuidance.textContent = "Lift % is set for this month. Target uplift is auto-calculated from product lifts.";
    }
  } else {
    if (forecastLiftGuidance) {
      forecastLiftGuidance.textContent = "Either set Target uplift, or set Lift % per product (then Target uplift auto-calculates).";
    }
  }
  updateForecastLiftPreview(computed);
  return { overrides, computed, hasOverrides };
}

function renderForecastProductMixInputs(setting, options = {}) {
  const actualMix = options.actualMix || {};
  const mix = normalizeProductMix(setting?.productMix || actualMix || {}, defaultProductMix());
  const liftOverrides = normalizeProductLiftOverrides(setting?.productLiftOverrides || {});
  const baselineUnits = options.baselineUnits || {};
  const computed = calculateForecastFromProductLifts(liftOverrides, baselineUnits);
  const hasSavedMix = Boolean(setting?.productMix && Object.keys(setting.productMix || {}).length);
  const readOnly = Boolean(options.readOnly);
  forecastProductMixInputs.innerHTML = CORE_PRODUCTS.map((product) => `
    <label class="forecast-product-field ${hasSavedMix ? "is-saved" : ""} ${readOnly ? "is-readonly" : ""}" data-forecast-product="${escapeHtml(product)}">
      <span class="forecast-product-label">
        <strong class="forecast-product-name">${escapeHtml(displayProductName(product))}</strong>
        <small class="forecast-product-meta">${actualMix?.[product] !== undefined ? `${options.actualMixLabel || "Baseline"} ${number(actualMix[product])}%` : "Baseline n/a"}${baselineUnits?.[product] !== undefined ? ` · Units ${number(baselineUnits[product])}` : ""}</small>
      </span>
      <span class="forecast-inline-inputs">
        <span class="forecast-inline-pill">
          <span class="forecast-inline-pill-label">Mix %</span>
          <input class="forecast-inline-pill-input" type="number" data-product-mix="${product}" value="${Number(mix[product] || 0).toFixed(1).replace(/\\.0$/, "")}" step="0.1" ${readOnly ? "disabled" : ""}>
        </span>
        <span class="forecast-inline-pill">
          <span class="forecast-inline-pill-label">Lift %</span>
          <input class="forecast-inline-pill-input" type="number" data-product-lift="${product}" value="${Number(liftOverrides[product] || 0).toFixed(1).replace(/\\.0$/, "")}" step="0.1" ${readOnly ? "disabled" : ""}>
        </span>
      </span>
      <small class="forecast-product-footnote">Planned units ${number(computed.rows.find((row) => row.product === product)?.plannedUnits || 0)} | Planned share ${number(computed.rows.find((row) => row.product === product)?.plannedSharePct || 0)}%</small>
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
  const editable = isEditableForecastMonth(monthKey);
  const setting = editable
    ? getForecastSetting(monthKey, { persist: false })
    : {
        upliftPct: Number(actualStats?.changePctVsPreviousMonth ?? 0),
        productMix: actualMix || baselineMixLookup(),
      };
  document.getElementById("uplift-pct").value = String(setting.upliftPct ?? 35);
  forecastSummaryTitle.textContent = editable ? `${monthLabelFromKey(monthKey)} plan` : `${monthLabelFromKey(monthKey)} actuals`;
  forecastSummaryCopy.textContent = editable
    ? hasProductLiftOverrides(setting)
      ? `Planned change vs prior month: ${setting.upliftPct >= 0 ? "+" : ""}${number(setting.upliftPct)}%, calculated from product lifts.`
      : `Planned change vs prior month: ${setting.upliftPct >= 0 ? "+" : ""}${number(setting.upliftPct)}%.`
    : `Actual change vs previous month: ${actualStats?.changePctVsPreviousMonth === null || actualStats?.changePctVsPreviousMonth === undefined ? "n/a" : `${actualStats.changePctVsPreviousMonth >= 0 ? "+" : ""}${number(actualStats.changePctVsPreviousMonth)}%`}.`;

  const changeTitle = editable ? "Planned change" : "Actual change";
  const changePctRaw = editable ? setting.upliftPct : actualStats?.changePctVsPreviousMonth;
  const changeValue = changePctRaw === null || changePctRaw === undefined
    ? "n/a"
    : `${Number(changePctRaw) >= 0 ? "+" : ""}${number(changePctRaw)}%`;
  const primaryPill = `
    <span class="forecast-summary-pill forecast-summary-pill-primary">
      <span class="forecast-summary-pill-title">${escapeHtml(changeTitle)}</span>
      <span class="forecast-summary-pill-value">${escapeHtml(changeValue)}</span>
    </span>
  `.trim();

  if (!setting.productMix) {
    forecastSummaryList.innerHTML = `
      ${primaryPill}
      <span class="forecast-summary-pill forecast-summary-pill-muted">${editable ? "Using selected baseline mix" : "Using actual month mix"}</span>
    `;
    return;
  }
  const sortedMix = Object.entries(setting.productMix)
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => b[1] - a[1]);
  forecastSummaryList.innerHTML = [
    primaryPill,
    ...(editable && hasProductLiftOverrides(setting) ? ['<span class="forecast-summary-pill forecast-summary-pill-muted">Calculated from product lifts</span>'] : []),
    ...sortedMix.map(([product, value]) => `<span class="forecast-summary-pill">${escapeHtml(displayProductName(product).replace(" Bomb 2P", "").replace(" Bomb", ""))} ${number(value)}%</span>`),
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
  const baselineUnits = baselineUnitsLookup();
  renderForecastCopyMixPicker(monthKey, { editable });
  renderForecastUpliftSuggestion(editable ? monthKey : "");
  const setting = editable
    ? getForecastSetting(monthKey)
    : {
        upliftPct: Number(monthActualStats?.changePctVsPreviousMonth ?? 0),
        productMix: monthActualMix || baselineMix,
        productLiftOverrides: defaultProductLiftOverrides(),
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
    const actualLabel = monthLabelFromKey(monthKey);
    forecastBaselineCopy.innerHTML = `The product split below comes from <span class="forecast-baseline-dates">${escapeHtml(actualLabel)}</span> actuals. ${escapeHtml(changeText)}`;
  } else {
    const baselineStart = document.getElementById("baseline-start").value || "selected start";
    const baselineEnd = document.getElementById("baseline-end").value || "selected end";
    forecastBaselineCopy.innerHTML = `Reference mix below comes from the selected baseline window: <span class="forecast-baseline-dates">${escapeHtml(baselineStart)} to ${escapeHtml(baselineEnd)}</span>.`;
  }
  renderForecastProductMixInputs(setting, {
    actualMix: editable ? baselineMix : (monthActualMix || baselineMix),
    actualMixLabel: editable ? "Baseline" : `Actual ${monthLabelFromKey(monthKey)}`,
    baselineUnits,
    readOnly: !editable,
  });
  if (editable) {
    syncForecastInputsFromProductLifts({ baselineUnits, readOnly: false });
  } else if (forecastLiftGuidance) {
    forecastLiftGuidance.textContent = "This month already has actuals, so the planner is showing the real mix and lift instead of editable inputs.";
  }
}

  function setActiveResultsTab(tab) {
    activeResultsTab = tab === "status" || tab === "history-only" ? tab : "reorder";
    try {
      window.localStorage.setItem(RESULTS_TAB_STORAGE_KEY, activeResultsTab);
    } catch {
      // ignore
    }
  resultsTabButtons.forEach((button) => {
    const selected = button.dataset.resultsTab === activeResultsTab;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", selected ? "true" : "false");
  });
    updateResultsCalloutCopy();
    if (latestPlanPayload) {
      renderResults(latestPlanPayload);
    }
  }

  function updateResultsCalloutCopy() {
    if (!(resultsCalloutCopy instanceof HTMLElement)) return;
    if (resultsReadingGuide instanceof HTMLElement) {
      resultsReadingGuide.hidden = activeResultsTab !== "reorder";
    }
    if (activeResultsTab === "history-only") {
      resultsCalloutCopy.textContent = "Use this to sanity-check the base case. It ignores planning lifts and shows what the reorder picture looks like if demand keeps running only on recent history, with the same inbound, lead time, safety stock, MOQ, and case-pack rules.";
      return;
    }
    if (activeResultsTab === "status") {
      resultsCalloutCopy.textContent = "Use this to explain the selected month plan recommendation. It shows coverage, stockout timing, and the main drivers behind the recommended order count under the planned scenario.";
      return;
    }
    resultsCalloutCopy.textContent = "Use this as the buying recommendation for the selected month plan. If demand happens at this planned rate, these are the units to order now to stay covered through the next few weeks, with inbound, lead time, and safety stock included.";
  }

  function daysInclusiveBetween(startIso, endIso) {
    const start = String(startIso || "").slice(0, 10);
    const end = String(endIso || "").slice(0, 10);
    if (!start || !end) return 0;
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
    return Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
  }

  function daysBetweenIsoDates(startIso, endIso) {
    const start = String(startIso || "").slice(0, 10);
    const end = String(endIso || "").slice(0, 10);
    if (!start || !end) return null;
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
    return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  }

  function addDaysToIsoDate(value, days) {
    const iso = String(value || "").slice(0, 10);
    if (!iso) return "";
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + Math.round(Number(days || 0)));
    return date.toISOString().slice(0, 10);
  }

  function roundHistoryOnlyOrderUnits(rawUnits, row) {
    let roundedUnits = Math.max(0, Number(rawUnits || 0));
    if (roundedUnits <= 0) return 0;
    const moq = Math.max(0, Number(row?.moq || 0));
    const casePack = Math.max(0, Number(row?.case_pack || 0));
    if (moq > 0 && roundedUnits < moq) roundedUnits = moq;
    if (casePack > 0) roundedUnits = Math.ceil(roundedUnits / casePack) * casePack;
    return roundedUnits;
  }

  function buildHistoryOnlyDriverRow(row) {
    const baselineVelocity = Math.max(0, Number(row?.avg_daily_demand || 0));
    const currentSupply = Math.max(0, Number(row?.current_supply_units || 0));
    const leadTimeDays = Math.max(0, Number(row?.used_lead_time_days || row?.lead_time_days || 0));
    const safetyWeeks = Math.max(0, Number(row?.safety_stock_weeks || 0));
    const horizonDays = Math.max(1, daysInclusiveBetween(row?.horizon_start, row?.horizon_end));
    const historyOnlySafetyStockUnits = baselineVelocity * safetyWeeks * 7;
    const historyOnlyLeadTimeDemandUnits = baselineVelocity * leadTimeDays;
    const historyOnlyReorderPointUnits = historyOnlyLeadTimeDemandUnits + historyOnlySafetyStockUnits;
    const historyOnlyTargetStockUnits = (baselineVelocity * horizonDays) + historyOnlySafetyStockUnits;
    const historyOnlyRawOrderUnits = Math.max(0, historyOnlyTargetStockUnits - currentSupply);
    const historyOnlyOrderUnits = roundHistoryOnlyOrderUnits(historyOnlyRawOrderUnits, row);
    const historyOnlyCapital = historyOnlyOrderUnits * Math.max(0, Number(row?.unit_cogs || 0));
    const historyOnlyDaysOfSupply = baselineVelocity > 0 ? currentSupply / baselineVelocity : null;
    const historyOnlyWeeksOfSupply = baselineVelocity > 0 ? currentSupply / (baselineVelocity * 7) : null;
    const historyOnlyStockoutDate = historyOnlyDaysOfSupply === null ? null : addDaysToIsoDate(row?.snapshot_date, Math.floor(historyOnlyDaysOfSupply));
    const historyOnlyOrderByDate = historyOnlyStockoutDate ? addDaysToIsoDate(historyOnlyStockoutDate, -leadTimeDays) : null;
    return {
      ...row,
      history_only_days_of_supply: historyOnlyDaysOfSupply,
      history_only_weeks_of_supply: historyOnlyWeeksOfSupply,
      history_only_stockout_date: historyOnlyStockoutDate,
      history_only_order_by_date: historyOnlyOrderByDate,
      history_only_safety_stock_units: historyOnlySafetyStockUnits,
      history_only_reorder_point_units: historyOnlyReorderPointUnits,
      history_only_order_units: historyOnlyOrderUnits,
      history_only_capital_required: historyOnlyCapital,
    };
  }

  function buildTriggerVisibility(row, mode = "planned") {
    const currentSupply = Math.max(0, Number(row?.current_supply_units ?? ((Number(row?.on_hand || 0)) + Number(row?.in_transit || 0))));
    const trigger = Math.max(0, Number(mode === "history-only" ? row?.history_only_reorder_point_units : row?.reorder_point_units || 0));
    if (!(trigger > 0)) {
      return {
        tone: "none",
        rowClass: "",
        badgeHtml: "",
      };
    }

    const varianceUnits = currentSupply - trigger;
    const variancePct = trigger > 0 ? (varianceUnits / trigger) : null;
    const referenceDate = String(row?.snapshot_date || "").slice(0, 10);
    const orderByDate = String(mode === "history-only" ? row?.history_only_order_by_date : row?.reorder_date || "").slice(0, 10);
    const daysUntilOrder = daysBetweenIsoDates(referenceDate, orderByDate);
    const isBelow = varianceUnits < 0;
    const isClose = daysUntilOrder !== null
      ? daysUntilOrder > 0 && daysUntilOrder <= 7
      : (!isBelow && variancePct !== null && variancePct <= 0.15);

    let tone = "ok";
    let label = "";
    if (daysUntilOrder !== null) {
      if (daysUntilOrder < 0) {
        tone = "below";
        label = `${integer(Math.abs(daysUntilOrder))}d overdue`;
      } else if (daysUntilOrder === 0) {
        tone = "below";
        label = "Order now";
      } else if (daysUntilOrder <= 7) {
        tone = "close";
        label = `Due in ${integer(daysUntilOrder)}d`;
      } else {
        tone = "ok";
        label = `Order in ${integer(daysUntilOrder)}d`;
      }
    } else if (isBelow) {
      tone = "below";
      label = "Order now";
    } else if (isClose) {
      tone = "close";
      label = "Due soon";
    } else {
      tone = "ok";
      label = "Covered";
    }

    return {
      tone,
      rowClass: tone === "below" ? "results-row-risk-below" : tone === "close" ? "results-row-risk-close" : "",
      badgeHtml: `
        <span class="trigger-badge trigger-badge-${tone}">
          <span class="trigger-badge-text">${escapeHtml(label)}</span>
        </span>
      `.trim(),
    };
  }

function destroyHistoricalTrendChart() {
  if (activeHistoricalTrendChart) {
    activeHistoricalTrendChart.destroy();
    activeHistoricalTrendChart = null;
  }
}

function monthLabelFromKey(key) {
  const match = String(key || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return String(key || "");
  const [, year, month] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

function average(values) {
  const numeric = (Array.isArray(values) ? values : []).map((value) => Number(value || 0));
  if (!numeric.length) return 0;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function stdDev(values) {
  const numeric = (Array.isArray(values) ? values : []).map((value) => Number(value || 0));
  if (!numeric.length) return 0;
  const avg = average(numeric);
  const variance = numeric.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / numeric.length;
  return Math.sqrt(variance);
}

function productTrendOptionsFromPayload(payload) {
  const productRows = Array.isArray(payload?.productHistory) ? payload.productHistory : Array.isArray(payload?.productMonthly) ? payload.productMonthly : [];
  const products = productRows.map((row) => String(row.product_name || "")).filter(Boolean);
  const unique = Array.from(new Set([...(CORE_PRODUCTS || []), ...products].filter(Boolean)));
  return unique.sort((a, b) => productSortValue(a).localeCompare(productSortValue(b)));
}

function renderHistoricalTrendProductPicker(payload) {
  if (!(historicalDemandTrendProduct instanceof HTMLSelectElement)) return;
  const options = productTrendOptionsFromPayload(payload);
  const selected = String(activeHistoricalTrendProduct || "__all__");
  const rendered = [
    `<option value="__all__">All core products</option>`,
    ...options.map((product) => `<option value="${escapeHtml(product)}">${escapeHtml(displayProductName(product))}</option>`),
  ].join("");
  historicalDemandTrendProduct.innerHTML = rendered;
  historicalDemandTrendProduct.value = options.includes(selected) ? selected : "__all__";
  activeHistoricalTrendProduct = historicalDemandTrendProduct.value;

  // Compare pickers (optional)
  if (historicalDemandTrendProductB instanceof HTMLSelectElement) {
    const renderedCompare = [
      `<option value="">None</option>`,
      ...options.map((product) => `<option value="${escapeHtml(product)}">${escapeHtml(displayProductName(product))}</option>`),
    ].join("");
    historicalDemandTrendProductB.innerHTML = renderedCompare;
    historicalDemandTrendProductB.value = options.includes(activeHistoricalTrendProductB) ? activeHistoricalTrendProductB : "";
    activeHistoricalTrendProductB = historicalDemandTrendProductB.value;
  }
  if (historicalDemandTrendProductC instanceof HTMLSelectElement) {
    const renderedCompare = [
      `<option value="">None</option>`,
      ...options.map((product) => `<option value="${escapeHtml(product)}">${escapeHtml(displayProductName(product))}</option>`),
    ].join("");
    historicalDemandTrendProductC.innerHTML = renderedCompare;
    historicalDemandTrendProductC.value = options.includes(activeHistoricalTrendProductC) ? activeHistoricalTrendProductC : "";
    activeHistoricalTrendProductC = historicalDemandTrendProductC.value;
  }

  // Keep compare toggle state consistent
  if (historicalDemandTrendCompareToggle instanceof HTMLInputElement) {
    historicalDemandTrendCompareToggle.checked = Boolean(activeHistoricalTrendCompareEnabled);
  }
  updateHistoricalTrendCompareVisibility();
}

function buildProductTrendRows(payload, productName) {
  const monthKeys = Array.isArray(payload?.monthKeys) ? payload.monthKeys : buildHistoricalTrendRows(payload).map((row) => row.key);
  const historyRows = Array.isArray(payload?.productHistory) && payload.productHistory.length
    ? payload.productHistory
    : (Array.isArray(payload?.productMonthly) ? payload.productMonthly : []);
  const match = historyRows.find((row) => String(row?.product_name || "") === String(productName || ""));
  if (!match) return [];
  return monthKeys.map((key, index) => {
    const totalUnits = Number(match?.[key] || 0);
    const trailingKeys = monthKeys.slice(Math.max(0, index - 2), index + 1);
    const rolling = average(trailingKeys.map((monthKeyValue) => Number(match?.[monthKeyValue] || 0)));
    const previousYearKey = `${Number(String(key).slice(0, 4)) - 1}-${String(key).slice(5, 7)}`;
    const previousYearUnits = Number(match?.[previousYearKey] || 0);
    return {
      key,
      label: monthLabelFromKey(key),
      total_units: totalUnits,
      rolling_3mo_units: rolling,
      previous_year_units: previousYearUnits > 0 ? previousYearUnits : null,
      yoy_pct: previousYearUnits > 0 ? ((totalUnits - previousYearUnits) / previousYearUnits) : null,
    };
  });
}

function updateHistoricalTrendCompareVisibility() {
  const enabled = historicalDemandTrendCompareToggle instanceof HTMLInputElement
    ? Boolean(historicalDemandTrendCompareToggle.checked)
    : Boolean(activeHistoricalTrendCompareEnabled);
  activeHistoricalTrendCompareEnabled = enabled;
  if (historicalDemandTrendComparePanel) historicalDemandTrendComparePanel.hidden = !enabled;
  if (!enabled) {
    activeHistoricalTrendProductB = "";
    activeHistoricalTrendProductC = "";
    if (historicalDemandTrendProductB instanceof HTMLSelectElement) historicalDemandTrendProductB.value = "";
    if (historicalDemandTrendProductC instanceof HTMLSelectElement) historicalDemandTrendProductC.value = "";
  }
}

function selectedHistoricalTrendProducts() {
  const picks = [];
  const primary = String(activeHistoricalTrendProduct || "__all__");
  if (primary) picks.push(primary);
  if (activeHistoricalTrendCompareEnabled) {
    if (activeHistoricalTrendProductB) picks.push(String(activeHistoricalTrendProductB));
    if (activeHistoricalTrendProductC) picks.push(String(activeHistoricalTrendProductC));
  }
  return Array.from(new Set(picks.filter(Boolean)));
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

function renderUploadAuditCard(label, audit) {
  if (!audit?.rowsWritten) {
    return `<div><dt>${label}</dt><dd>Not tracked yet</dd><small>Upload again to store raw and lean counts.</small></div>`;
  }
  const rawRows = Number(audit.rawRowCount || audit.usableRowCount || 0);
  const usableRows = Number(audit.usableRowCount || 0);
  const leanRows = Number(audit.rowsWritten || 0);
  const dateCount = Array.isArray(audit.uploadedDates) ? audit.uploadedDates.length : 0;
  const dateRange = audit.firstDate && audit.lastDate
    ? `${audit.firstDate} to ${audit.lastDate}`
    : dateCount
      ? `${integer(dateCount)} dates`
      : "Date range not tracked";
  return `
    <div>
      <dt>${label}</dt>
      <dd>${integer(rawRows)} raw</dd>
      <small>${integer(usableRows)} usable -> ${integer(leanRows)} lean | ${dateRange}</small>
    </div>
  `;
}

function renderSummary(summary, hasInventory) {
  const inventoryLabel = hasInventory
    ? `Live sheet${summary.inventory_as_of ? ` (${summary.inventory_as_of})` : ""}`
    : "Template only";
  const sourceLabel =
    summary.data_source === "live"
      ? "Live Firestore"
      : summary.data_source === "local"
        ? "Local lean snapshot"
        : "Hosted snapshot";
  const dataAsOfLabel = summary.data_as_of || summary.date_end || "-";
  const sourceDetail = summary.data_source_detail || "";
  summaryBlock.innerHTML = `
    <dl class="summary-list">
      <div><dt>Data source</dt><dd>${sourceLabel}</dd></div>
      <div><dt>Data as of</dt><dd>${dataAsOfLabel}</dd></div>
      <div><dt>Lean order rows</dt><dd>${integer(summary.orders_loaded)}</dd></div>
      <div><dt>Lean sample rows</dt><dd>${integer(summary.samples_loaded || 0)}</dd></div>
      <div><dt>Planning products</dt><dd>${integer(summary.products_detected)}</dd></div>
      <div><dt>History start</dt><dd>${summary.date_start || "—"}</dd></div>
      <div><dt>History end</dt><dd>${summary.date_end || "—"}</dd></div>
      <div><dt>Inventory</dt><dd>${inventoryLabel}</dd></div>
      ${renderUploadAuditCard("Latest order upload", summary.latest_order_upload)}
      ${renderUploadAuditCard("Latest sample upload", summary.latest_sample_upload)}
    </dl>
    ${sourceDetail ? `<p class="summary-note">${sourceDetail}</p>` : ""}
  `;
}

function applyDefaults(defaults) {
  forecastSettings = normalizeForecastSettings(defaults || {});
  monthlyActualMix = defaults.monthlyActualMix || {};
  monthlyActuals = defaults.monthlyActuals || {};
  sharedPlannerSettings = normalizePlannerSettings(defaults.sharedSettings || sharedPlannerSettings || defaultPlannerSettings());
  forecastYear = defaults.forecastYear || forecastYear;
  if (planningYearInput) planningYearInput.value = String(forecastYear);
  document.getElementById("baseline-start").value = defaults.baselineStart ? toUsDate(defaults.baselineStart) : "";
  document.getElementById("baseline-end").value = defaults.baselineEnd ? toUsDate(defaults.baselineEnd) : "";
  document.getElementById("horizon-start").value = defaults.horizonStart ? toUsDate(defaults.horizonStart) : "";
  document.getElementById("horizon-end").value = defaults.horizonEnd ? toUsDate(defaults.horizonEnd) : "";
  document.getElementById("uplift-pct").value = defaults.upliftPct ?? 0;
  document.getElementById("lead-time-days").value = defaults.leadTimeDays ?? 8;
  const excludeSpikesInput = document.getElementById("exclude-spikes");
  if (excludeSpikesInput) excludeSpikesInput.checked = sharedPlannerSettings?.global?.viralSmoothingEnabled ?? defaults.excludeSpikes ?? true;
  document.getElementById("velocity-mode").value = defaults.velocityMode || "sales_only";
  document.getElementById("order-date-basis").value = defaults.orderDateBasis || "paid_time";
  safetyRuleNote.textContent = `Planning period = the future dates you want to cover. Safety stock: ${defaults.safetyRule || ""}`;
  renderPlannerSettings(sharedPlannerSettings);
  renderForecastSummary();
}

  function renderResults(payload) {
    latestPlanPayload = payload;
    const rows = sortRowsByProductName(payload.rows || []);
    const summary = payload.summary || {};
    const salesOnly = document.getElementById("velocity-mode").value === "sales_only";
    const historyOnlyRows = rows.map((row) => buildHistoryOnlyDriverRow(row));
    const displayRows = activeResultsTab === "history-only" ? historyOnlyRows : rows;
    updateResultsCalloutCopy();
    const columns = (() => {
      if (activeResultsTab === "history-only") {
        return salesOnly
          ? [
            ["Product", "product_name"],
            ["Baseline velocity", "avg_daily_demand"],
            ["On hand", "on_hand"],
            ["In transit", "in_transit"],
            ["History-only cover", "history_only_weeks_of_supply"],
            ["History-only stockout", "history_only_stockout_date"],
            ["History-only order-by", "history_only_order_by_date"],
            ["History-only order trigger", "history_only_reorder_point_units"],
            ["History-only order now", "history_only_order_units"],
            ["History-only capital", "history_only_capital_required"],
          ]
          : [
            ["Product", "product_name"],
            ["Baseline velocity", "avg_daily_demand"],
            ["Sample units", "sample_units_in_baseline"],
            ["Units used", "units_used_for_velocity"],
            ["Days used", "days_used_for_velocity"],
            ["On hand", "on_hand"],
            ["In transit", "in_transit"],
            ["History-only cover", "history_only_weeks_of_supply"],
            ["History-only stockout", "history_only_stockout_date"],
            ["History-only order-by", "history_only_order_by_date"],
            ["History-only order now", "history_only_order_units"],
            ["History-only capital", "history_only_capital_required"],
          ];
      }
      if (activeResultsTab === "status") {
        return salesOnly
          ? [
            ["Product", "product_name"],
            ["Status", "status"],
            ["Baseline velocity", "avg_daily_demand"],
            ["Plan velocity", "forecast_daily_demand"],
            ["On hand", "on_hand"],
            ["In transit", "in_transit"],
            ["Transit ETA", "transit_eta"],
            ["Transit gap", "transit_gap_days"],
            ["On-hand cover (recent)", "weeks_on_hand_recent"],
            ["Total cover (plan)", "weeks_of_supply"],
            ["Planned order trigger", "reorder_point_units"],
            ["Projected stockout date", "projected_stockout_date"],
            ["Order-by date", "reorder_date"],
          ]
          : [
            ["Product", "product_name"],
            ["Status", "status"],
            ["Baseline velocity", "avg_daily_demand"],
            ["Plan velocity", "forecast_daily_demand"],
            ["Sample units", "sample_units_in_baseline"],
            ["Units used", "units_used_for_velocity"],
            ["Days used", "days_used_for_velocity"],
            ["On hand", "on_hand"],
            ["In transit", "in_transit"],
            ["Transit ETA", "transit_eta"],
            ["Transit gap", "transit_gap_days"],
            ["On-hand cover (recent)", "weeks_on_hand_recent"],
            ["Total cover (plan)", "weeks_of_supply"],
            ["Planned order trigger", "reorder_point_units"],
            ["Projected stockout date", "projected_stockout_date"],
            ["Order-by date", "reorder_date"],
          ];
      }

      return salesOnly
        ? [
          ["Product", "product_name"],
          ["Status", "status"],
          ["On hand", "on_hand"],
          ["In transit", "in_transit"],
          ["Planned order trigger", "reorder_point_units"],
          ["Order now", "recommended_order_units"],
          ["Capital needed", "capital_required"],
          ["Order-by date", "reorder_date"],
          ["Projected stockout date", "projected_stockout_date"],
          ["Transit ETA", "transit_eta"],
          ["Total cover (plan)", "weeks_of_supply"],
        ]
        : [
          ["Product", "product_name"],
          ["Status", "status"],
          ["On hand", "on_hand"],
          ["In transit", "in_transit"],
          ["Planned order trigger", "reorder_point_units"],
          ["Order now", "recommended_order_units"],
          ["Capital needed", "capital_required"],
          ["Order-by date", "reorder_date"],
          ["Projected stockout date", "projected_stockout_date"],
          ["Transit ETA", "transit_eta"],
          ["Total cover (plan)", "weeks_of_supply"],
          ["Units used", "units_used_for_velocity"],
          ["Days used", "days_used_for_velocity"],
        ];
    })();
    resultsHead.innerHTML = `<tr>${columns.map(([label]) => renderHeaderCell(label)).join("")}</tr>`;
    if (activeResultsTab === "history-only") {
      const historyOrderUnitsTotal = historyOnlyRows.reduce((sum, row) => sum + Number(row.history_only_order_units || 0), 0);
      const historyCapitalTotal = historyOnlyRows.reduce((sum, row) => sum + Number(row.history_only_capital_required || 0), 0);
      resultSummary.innerHTML = [
        '<span class="summary-pill summary-pill-muted">History-only baseline</span>',
        `<span class="summary-pill summary-pill-watch">Total order ${integer(historyOrderUnitsTotal)}</span>`,
        `<span class="summary-pill summary-pill-healthy">Capital ${money(historyCapitalTotal)}</span>`,
        inventoryUploaded ? "" : `<span class="summary-pill summary-pill-muted">No inventory uploaded yet</span>`,
      ].filter(Boolean).join("");
    } else {
      resultSummary.innerHTML = [
        `<span class="summary-pill summary-pill-critical">Critical ${summary.critical_on_hand || 0}</span>`,
        `<span class="summary-pill summary-pill-urgent">Urgent ${summary.urgent || 0}</span>`,
        `<span class="summary-pill summary-pill-transit">Transit gap ${summary.transit_gap || 0}</span>`,
        `<span class="summary-pill summary-pill-watch">Watch ${summary.watch || 0}</span>`,
        `<span class="summary-pill summary-pill-healthy">Healthy ${summary.healthy || 0}</span>`,
        `<span class="summary-pill summary-pill-spoilage">Spoilage ${summary.spoilage_risk || 0}</span>`,
        inventoryUploaded ? "" : `<span class="summary-pill summary-pill-muted">No inventory uploaded yet</span>`,
      ].filter(Boolean).join("");
    }
    if (!displayRows.length) {
      resultsBody.innerHTML = `<tr><td colspan="${columns.length}" class="empty">No planning rows matched the current inputs.</td></tr>`;
      renderMonthlyPlan(payload.monthlyPlan || { months: [], rows: [] });
      renderProductMix(payload.productMix || { rows: [], totals: {} });
      renderSkuSalesSummary(payload.skuSalesSummary || { rows: [], sourceRows: 0 });
      renderHistoricalTrend(payload.historicalTrend || { years: [], monthlyTotals: [], productMonthly: [], yoyByMonth: [] }, payload.monthlyPlan?.year || forecastYear);
      renderLaunchPlanning(payload.launchPlanning || { rows: [] });
      return;
    }
    const totals = displayRows.reduce((acc, row) => {
    [
      "sales_units_in_baseline",
      "sample_units_in_baseline",
      "units_used_for_velocity",
      "gross_sales_in_baseline",
      "net_gross_sales_in_baseline",
      "on_hand",
      "in_transit",
      "current_supply_units",
      "safety_stock_units",
      "recommended_order_units",
      "capital_required",
      "history_only_reorder_point_units",
      "history_only_order_units",
      "history_only_capital_required",
    ].forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(row[key] || 0);
    });
    return acc;
  }, {});
    const renderCell = (key, row) => {
    if (key === "status") return `<span class="status status-${String(row.status || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}">${row.status || ""}</span>`;
    if (key === "gross_sales_in_baseline" || key === "net_gross_sales_in_baseline" || key === "capital_required" || key === "history_only_capital_required") return money(row[key]);
    if (key === "mix_pct") return percent(row[key]);
    if (key === "recommended_order_units") {
      return `
        <span class="order-now-emphasis">
          <span class="order-now-value">${escapeHtml(integer(row[key]))}</span>
        </span>
      `.trim();
    }
    if (key === "history_only_reorder_point_units" || key === "history_only_order_units") return integer(row[key]);
    if (key === "weeks_on_hand_recent") {
      const label = formatSupplyLeftLabel({ days_of_supply: row.days_on_hand_recent, weeks_of_supply: row.weeks_on_hand_recent });
      if (typeof label === "string") return escapeHtml(label);
      return `
        <span class="cell-split">
          <span class="cell-split-main">${escapeHtml(label.primary)}</span>
          <span class="cell-split-meta">${escapeHtml(label.secondary)}</span>
        </span>
      `.trim();
    }
    if (key === "weeks_of_supply") {
      const label = formatSupplyLeftLabel(row);
      if (typeof label === "string") return escapeHtml(label);
      return `
        <span class="cell-split">
          <span class="cell-split-main">${escapeHtml(label.primary)}</span>
          <span class="cell-split-meta">${escapeHtml(label.secondary)}</span>
        </span>
      `.trim();
    }
    if (key === "history_only_weeks_of_supply") {
      const label = formatSupplyLeftLabel({ days_of_supply: row.history_only_days_of_supply, weeks_of_supply: row.history_only_weeks_of_supply });
      if (typeof label === "string") return escapeHtml(label);
      return `
        <span class="cell-split">
          <span class="cell-split-main">${escapeHtml(label.primary)}</span>
          <span class="cell-split-meta">${escapeHtml(label.secondary)}</span>
        </span>
      `.trim();
    }
    if (key === "forecast_daily_demand") {
      const planVelocity = clampNumber(row.forecast_daily_demand, null);
      if (planVelocity === null) return number(row[key]);
      const baselineVelocity = clampNumber(row.avg_daily_demand, null);
      let deltaLabel = "";
      if (baselineVelocity !== null && baselineVelocity > 0) {
        const delta = (planVelocity - baselineVelocity) / baselineVelocity;
        const pctText = `${delta >= 0 ? "+" : ""}${percent(delta)}`;
        deltaLabel = `<span class="cell-split-meta-strong">${escapeHtml(pctText)}</span> vs<wbr> baseline`;
      } else if (baselineVelocity === 0) {
        deltaLabel = "n/a vs<wbr> baseline";
      }
      if (!deltaLabel) return escapeHtml(number(planVelocity));
      return `
        <span class="cell-split cell-split-inline cell-split-inline-middle">
          <span class="cell-split-main">${escapeHtml(number(planVelocity))}</span>
          <span class="cell-split-meta">${deltaLabel}</span>
        </span>
      `.trim();
    }
    if (key === "history_only_stockout_date" || key === "history_only_order_by_date") {
      const dateValue = key === "history_only_stockout_date" ? row.history_only_stockout_date : row.history_only_order_by_date;
      const date = humanDate(dateValue || "");
      if (!date) return "-";
      if (key === "history_only_order_by_date") {
        const daysOfSupply = clampNumber(row.history_only_days_of_supply, null);
        const leadTimeDays = clampNumber(row.used_lead_time_days, null);
        const daysUntil = daysOfSupply !== null && leadTimeDays !== null ? (daysOfSupply - leadTimeDays) : null;
        const countdown = daysUntil === null ? "" : (daysUntil < 0 ? "overdue" : formatCountdownLabel(daysUntil));
        return `
          <span class="cell-split">
            <span class="cell-split-main">${escapeHtml(date)}</span>
            <span class="cell-split-meta">${escapeHtml(countdown ? `(${countdown})` : "")}</span>
          </span>
        `.trim();
      }
      const countdown = formatCountdownLabel(row.history_only_days_of_supply);
      return `
        <span class="cell-split cell-split-inline">
          <span class="cell-split-main">${escapeHtml(date)}</span>
          ${countdown ? `<span class="cell-split-meta">in ${escapeHtml(countdown)}</span>` : ""}
        </span>
      `.trim();
    }
    if (key === "projected_stockout_date") {
      const date = humanDate(row[key] || "");
      const countdown = formatCountdownLabel(row.days_of_supply);
      const onHandDate = humanDate(row.on_hand_stockout_date || "");
      const showOnHand = Boolean(onHandDate && onHandDate !== date);
      const countdownLabel = countdown ? (countdown === "today" ? "today" : `in ${countdown}`) : "";
      const meta = [
        countdownLabel,
        showOnHand ? `On-hand only: ${onHandDate}` : "",
      ].filter(Boolean).join(" | ");
      if (!date) return "-";
      const title = showOnHand
        ? "Projected stockout includes in-transit supply. 'On-hand only' ignores in-transit."
        : "Projected stockout uses plan velocity and includes in-transit supply.";
      const safeMeta = String(meta || "").replace("On-hand only:", "On-hand only:<wbr>");
      return `
        <span class="cell-split cell-split-inline" title="${escapeHtml(title)}">
          <span class="cell-split-main">${escapeHtml(date)}</span>
          ${meta ? `<span class="cell-split-meta">${safeMeta}</span>` : ""}
        </span>
      `.trim();
    }
    if (key === "reorder_date") {
      const date = humanDate(row[key] || "");
      const daysOfSupply = clampNumber(row.days_of_supply, null);
      const leadTimeDays = clampNumber(row.used_lead_time_days, null);
      const daysUntil = daysOfSupply !== null && leadTimeDays !== null ? (daysOfSupply - leadTimeDays) : null;
      const countdown = daysUntil === null ? "" : (daysUntil < 0 ? "overdue" : formatCountdownLabel(daysUntil));
      if (!date) return "-";
      return `
        <span class="cell-split">
          <span class="cell-split-main">${escapeHtml(date)}</span>
          <span class="cell-split-meta">${escapeHtml(countdown ? `(${countdown})` : "")}</span>
        </span>
      `.trim();
    }
    if (key === "safety_stock_units") {
      return `
        <span class="cell-split">
          <span class="cell-split-main">${escapeHtml(number(row[key]))}</span>
          <span class="cell-split-meta">(${escapeHtml(number(row.safety_stock_weeks))} wks)</span>
        </span>
      `.trim();
    }
    if (key === "product_name") {
      const productLabel = escapeHtml(displayProductName(row[key] || ""));
      if (activeResultsTab === "status" || activeResultsTab === "history-only") {
        const triggerVisibility = buildTriggerVisibility(row, activeResultsTab === "history-only" ? "history-only" : "planned");
        if (triggerVisibility.badgeHtml) {
          return `
            <span class="cell-split-stacked product-cell-emphasis">
              <span class="cell-split-main">${productLabel}</span>
              <span class="cell-split-meta">${triggerVisibility.badgeHtml}</span>
            </span>
          `.trim();
        }
      }
      return productLabel;
    }
    if (["transit_eta", "transit_started_on"].includes(key)) return humanDate(row[key] || "");
    return number(row[key]);
  };
    const bodyRows = displayRows.map((row) => {
      const triggerVisibility = activeResultsTab === "status"
        ? buildTriggerVisibility(row, "planned")
        : activeResultsTab === "history-only"
          ? buildTriggerVisibility(row, "history-only")
          : { rowClass: "" };
      const rowClass = triggerVisibility.rowClass ? ` class="${triggerVisibility.rowClass}"` : "";
      return `<tr${rowClass}>${columns.map(([, key]) => {
        const cellClass = key === "recommended_order_units" ? ' class="order-now-cell"' : "";
        return `<td${cellClass}>${renderCell(key, row)}</td>`;
      }).join("")}</tr>`;
    }).join("");
    const totalCell = (key) => {
    if (key === "product_name") return "Totals";
    if (key === "mix_pct") return "100%";
    if (key === "gross_sales_in_baseline" || key === "net_gross_sales_in_baseline" || key === "capital_required" || key === "history_only_capital_required") return money(totals[key] || 0);
    if (["sales_units_in_baseline", "smoothed_units_in_baseline", "sample_units_in_baseline", "units_used_for_velocity", "days_used_for_velocity", "on_hand", "in_transit", "current_supply_units", "recommended_order_units", "history_only_reorder_point_units", "history_only_order_units"].includes(key)) {
      return number(totals[key] || 0);
    }
    if (key === "transit_gap_days") return "";
    return "";
  };
    const totalsRow = `<tr class="totals-row">${columns.map(([, key]) => `<td>${totalCell(key)}</td>`).join("")}</tr>`;
    resultsBody.innerHTML = `${bodyRows}${totalsRow}`;
    renderMonthlyPlan(payload.monthlyPlan || { months: [], rows: [] });
    renderProductMix(payload.productMix || { rows: [], totals: {} });
    renderSkuSalesSummary(payload.skuSalesSummary || { rows: [], sourceRows: 0 });
    renderHistoricalTrend(payload.historicalTrend || { years: [], monthlyTotals: [], productMonthly: [], yoyByMonth: [] }, payload.monthlyPlan?.year || forecastYear);
    renderLaunchPlanning(payload.launchPlanning || { rows: [] });
  }

function buildMonthModeGroups(months) {
  return months.reduce((groups, month) => {
    const mode = month.mode === "actual_mtd" ? "actual_mtd" : month.mode === "actual" ? "actual" : "forecast";
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.mode === mode) {
      lastGroup.count += 1;
      lastGroup.labels.push(month.label);
      return groups;
    }
    groups.push({
      mode,
      count: 1,
      labels: [month.label],
    });
    return groups;
  }, []);
}

function renderMonthlyPlanHeaderCell(month, options = {}) {
  const help = `${month.label} units for the selected plan year.`;
  const currentMonthKey = options.currentMonthKey || null;
  const isCurrent = Boolean(currentMonthKey && month.key === currentMonthKey);
  const baseClass = `month-header-cell month-header-cell-${month.mode || "actual"}${isCurrent ? " is-current" : ""}`;
  if (month.mode !== "forecast") {
    return `
      <th class="${baseClass}" data-month-key="${escapeHtml(month.key)}" data-month-mode="${escapeHtml(month.mode || "actual")}">
        <span class="th-help">
          <span class="month-header-label-row">
            <span>${escapeHtml(month.label)}</span>
            <button type="button" class="th-help-trigger" data-help="${escapeHtml(help)}" aria-label="More info about ${escapeHtml(month.label)}">?</button>
          </span>
        </span>
      </th>
    `;
  }
  const setting = getForecastSetting(month.key, { persist: false });
  const upliftPct = Number(setting?.upliftPct || 0);
  const baselineIndex = 100 + upliftPct;
  return `
    <th class="${baseClass}" data-month-key="${escapeHtml(month.key)}" data-month-mode="forecast">
      <span class="th-help">
        <span class="month-header-stack">
          <span class="month-header-label-row">
            <span>${escapeHtml(month.label)}</span>
            <button type="button" class="th-help-trigger" data-help="${escapeHtml(help)}" aria-label="More info about ${escapeHtml(month.label)}">?</button>
          </span>
          <span class="month-header-baseline">${number(baselineIndex)}% of baseline</span>
          <span class="month-header-lift">${upliftPct >= 0 ? "+" : ""}${number(upliftPct)}% lift</span>
        </span>
      </span>
    </th>
  `;
}

function renderMonthlyPlan(payload) {
  const months = payload.months || [];
  const rows = sortRowsByProductName(payload.rows || []);
  const year = payload.year || forecastYear;
  const actualMonths = months.filter((month) => month.mode === "actual").map((month) => month.label);
  const actualMtdMonth = months.find((month) => month.mode === "actual_mtd");
  const currentMonthKey = (actualMtdMonth?.key || months.find((month) => month.mode === "forecast")?.key || months[0]?.key || null);
  if (monthlyPlanCopy) {
    monthlyPlanCopy.textContent = actualMtdMonth
      ? `Shows closed actual months for ${actualMonths.join(", ")}${actualMonths.length ? ", " : ""}plus ${actualMtdMonth.label} month-to-date through ${payload.latestDemandDate}. Each product cell shows units first, then share of month demand. Gross sales sit in their own totals row, with a full-year gross total at the end. Forecast months already include your saved uplift.`
      : actualMonths.length
        ? `Shows actual monthly demand for ${actualMonths.join(", ")} in ${year}. Each product cell shows units first, then share of month demand. Gross sales sit in their own totals row, with a full-year gross total at the end. Later months use your saved month plans.`
        : `Shows planned monthly demand for ${year} using the selected baseline mix and any saved month-specific overrides. Each product cell shows units first, then share of month demand. Gross sales sit in their own totals row, with a full-year gross total at the end.`;
  }
  const columns = [["Product", "product_name"], ...months.map((month) => [month.label, month.key]), [`${year} share %`, "year_mix_pct"], [`${year} total units`, "year_total_units"], [`${year} gross`, "year_total_gross"]];
  const modeGroups = buildMonthModeGroups(months);
  const modeRow = modeGroups.map((group) => `
    <th class="table-mode-group table-mode-group-${group.mode}" colspan="${group.count}">
      <span class="table-mode-pill">${group.mode === "actual" ? "Actual" : group.mode === "actual_mtd" ? "Actual MTD" : "Forecast"}</span>
    </th>
  `).join("");
  const headerRow = columns.map(([label, key]) => {
    if (key === "product_name") {
      return renderHeaderCell(label, { help: "Core products in the selected plan year." });
    }
    const month = months.find((entry) => entry.key === key);
    if (month) {
      return renderMonthlyPlanHeaderCell(month, { currentMonthKey });
    }
    return renderHeaderCell(label);
  }).join("");
  monthlyPlanHead.innerHTML = `
    <tr>${headerRow}</tr>
    <tr class="table-mode-row">
      <th class="table-mode-anchor"></th>
      ${modeRow}
      <th class="table-mode-spacer" colspan="3"></th>
    </tr>
  `;
  if (!rows.length) {
    monthlyPlanBody.innerHTML = `<tr><td colspan="${columns.length}" class="empty">Run planning to see Jan to Dec units.</td></tr>`;
    return;
  }
  const monthKeys = months.map((month) => month.key);
  const monthMeta = Object.fromEntries(months.map((month) => [month.key, month]));
  const totals = rows.reduce((acc, row) => {
    columns.forEach(([, key]) => {
      if (key !== "product_name" && key !== "year_mix_pct") acc[key] = (acc[key] || 0) + Number(row[key] || 0);
    });
    return acc;
  }, {});
  const monthTotals = Object.fromEntries(monthKeys.map((key) => [key, Number(totals[key] || 0)]));
  const monthGrossTotals = Object.fromEntries(monthKeys.map((key) => [
    key,
    rows.reduce((sum, row) => sum + Number(row?.monthly_gross?.[key] || 0), 0),
  ]));
  const rowYearGrossTotals = new Map(rows.map((row) => [
    row.product_name || "",
    monthKeys.reduce((sum, key) => sum + Number(row?.monthly_gross?.[key] || 0), 0),
  ]));
  const yearGrossTotal = Array.from(rowYearGrossTotals.values()).reduce((sum, value) => sum + Number(value || 0), 0);
  const bodyRows = rows.map((row) => `<tr>${columns.map(([, key]) => {
    if (key === "product_name") return `<td>${escapeHtml(displayProductName(row[key] || ""))}</td>`;
    if (key === "year_mix_pct") return `<td>${percent(row[key])}</td>`;
    if (monthKeys.includes(key)) {
      const value = Number(row[key] || 0);
      const share = monthTotals[key] > 0 ? value / monthTotals[key] : 0;
      const meta = monthMeta[key] || {};
      const isCurrent = Boolean(currentMonthKey && key === currentMonthKey);
      const dominantClass = share >= 0.5 ? " is-dominant" : "";
      return `
        <td class="month-cell${isCurrent ? " is-current" : ""}" data-month-key="${escapeHtml(key)}" data-month-mode="${escapeHtml(meta.mode || "")}" title="Units ${integer(value)} - Share ${percent(share)}">
          <div class="month-value-cell${dominantClass}" style="--share:${Math.max(0, Math.min(1, share)).toFixed(4)}">
            <span class="month-value-number">${integer(value)}</span>
            <span class="month-value-share">${percent(share)}</span>
          </div>
        </td>
      `;
    }
    if (key === "year_total_units") return `<td>${integer(row[key])}</td>`;
    if (key === "year_total_gross") return `<td>${moneyPrecise(rowYearGrossTotals.get(row.product_name || "") || 0)}</td>`;
    return `<td>${number(row[key])}</td>`;
  }).join("")}</tr>`).join("");
  const totalsRow = `<tr class="totals-row">${columns.map(([, key]) => {
    if (key === "product_name") return "<td>Totals</td>";
    if (key === "year_mix_pct") return "<td>100%</td>";
    if (monthKeys.includes(key)) {
      const meta = monthMeta[key] || {};
      const isCurrent = Boolean(currentMonthKey && key === currentMonthKey);
      return `
        <td class="month-cell${isCurrent ? " is-current" : ""}" data-month-key="${escapeHtml(key)}" data-month-mode="${escapeHtml(meta.mode || "")}" title="Units ${integer(totals[key])} - Gross ${moneyPrecise(monthGrossTotals[key] || 0)} - Share 100%">
          <div class="month-value-cell is-total" style="--share:1">
            <span class="month-value-number">${integer(totals[key])}</span>
            <span class="month-value-share">100%</span>
          </div>
        </td>
      `;
    }
    if (key === "year_total_units") return `<td>${integer(totals[key])}</td>`;
    if (key === "year_total_gross") return `<td>${moneyPrecise(yearGrossTotal)}</td>`;
    return `<td>${number(totals[key])}</td>`;
  }).join("")}</tr>`;
  const grossRow = `<tr class="totals-row gross-row">${columns.map(([, key]) => {
    if (key === "product_name") return "<td>Gross sales</td>";
    if (key === "year_mix_pct") return "<td>—</td>";
    if (monthKeys.includes(key)) {
      const meta = monthMeta[key] || {};
      const isCurrent = Boolean(currentMonthKey && key === currentMonthKey);
      return `
        <td class="month-cell${isCurrent ? " is-current" : ""}" data-month-key="${escapeHtml(key)}" data-month-mode="${escapeHtml(meta.mode || "")}" title="Gross sales ${moneyPrecise(monthGrossTotals[key] || 0)}">
          <span class="month-value-gross-only">${moneyPrecise(monthGrossTotals[key] || 0)}</span>
        </td>
      `;
    }
    if (key === "year_total_units") return "<td>—</td>";
    if (key === "year_total_gross") return `<td>${moneyPrecise(yearGrossTotal)}</td>`;
    return "<td>—</td>";
  }).join("")}</tr>`;
  monthlyPlanBody.innerHTML = `${bodyRows}${totalsRow}${grossRow}`;
}

function renderProductMix(payload) {
  const rows = sortRowsByProductName(payload.rows || []);
  const columns = [
    ["Product", "product_name"],
    ["Units in baseline window", "baseline_units"],
    ["Baseline unit share %", "mix_pct"],
    ["Baseline sales share %", "sales_mix_pct"],
    ["Gross sales in baseline window", "gross_sales_in_baseline"],
    ["Net gross (est.) in baseline window", "net_gross_sales_in_baseline"],
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
    ["baseline_units", "gross_sales_in_baseline", "net_gross_sales_in_baseline", "estimated_cogs", "forecast_units"].forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(row[key] || 0);
    });
    return acc;
  }, {});
  const bodyRows = rows.map((row) => `<tr>${columns.map(([, key]) => {
    if (key === "product_name") return `<td>${escapeHtml(displayProductName(row[key] || row.name || "—"))}</td>`;
    if (key === "mix_pct" || key === "sales_mix_pct") return `<td>${percent(row[key])}</td>`;
    if (key === "unit_cogs") return `<td>${moneyPrecise(row[key])}</td>`;
    if (key === "estimated_cogs") return `<td>${money(row[key])}</td>`;
    if (key === "gross_sales_in_baseline" || key === "net_gross_sales_in_baseline") return `<td>${money(row[key])}</td>`;
    return `<td>${number(row[key])}</td>`;
  }).join("")}</tr>`).join("");
  const totalsRow = `<tr class="totals-row">${columns.map(([, key]) => {
    if (key === "product_name") return "<td>Totals</td>";
    if (key === "mix_pct" || key === "sales_mix_pct") return "<td>100%</td>";
    if (key === "unit_cogs") return "<td>—</td>";
    if (key === "estimated_cogs") return `<td>${money(totals[key])}</td>`;
    if (key === "gross_sales_in_baseline" || key === "net_gross_sales_in_baseline") return `<td>${money(totals[key])}</td>`;
    return `<td>${number(totals[key])}</td>`;
  }).join("")}</tr>`;
  productMixBody.innerHTML = `${bodyRows}${totalsRow}`;
}

function renderSkuSalesSummary(payload) {
  const rows = sortRowsByProductName(payload.rows || []);
  const columns = [
    ["Type", "sku_type"],
    ["SKU", "sku_id"],
    ["Listing", "product_name"],
    ["Mapped core products", "core_products"],
    ["Units sold", "units_sold"],
    ["Gross sales", "gross_sales"],
    ["Net gross (est.)", "net_gross_sales"],
    ["Avg gross / unit", "avg_gross_per_unit"],
    ["Avg net gross / unit", "avg_net_gross_per_unit"],
  ];
  if (!skuSalesHead || !skuSalesBody) return;
  skuSalesHead.innerHTML = `<tr>${columns.map(([label]) => renderHeaderCell(label)).join("")}</tr>`;
  if (!rows.length) {
    const hasSourceRows = Number(payload.sourceRows || 0) > 0;
    skuSalesBody.innerHTML = `<tr><td colspan="${columns.length}" class="empty">${hasSourceRows ? "No SKU rows matched the selected baseline window." : "SKU sales summary will appear after orders are re-uploaded with the SKU mapping."}</td></tr>`;
    return;
  }
  const totals = rows.reduce((acc, row) => {
    acc.units_sold += Number(row.units_sold || 0);
    acc.gross_sales += Number(row.gross_sales || 0);
    acc.net_gross_sales += Number(row.net_gross_sales || 0);
    return acc;
  }, { units_sold: 0, gross_sales: 0, net_gross_sales: 0 });
  const bodyRows = rows.map((row) => `<tr>${columns.map(([, key]) => {
    if (key === "sku_type") return `<td class="is-text">${row[key] === "virtual_bundle" ? "Virtual bundle" : "Core"}</td>`;
    if (key === "gross_sales" || key === "net_gross_sales" || key === "avg_gross_per_unit" || key === "avg_net_gross_per_unit") return `<td>${money(row[key])}</td>`;
    if (key === "units_sold") return `<td>${number(row[key])}</td>`;
    if (key === "product_name" || key === "core_products") return `<td class="is-text">${escapeHtml(displayProductName(row[key] || ""))}</td>`;
    return `<td class="is-text">${escapeHtml(row[key] || "")}</td>`;
  }).join("")}</tr>`).join("");
  const totalsRow = `<tr class="totals-row"><td>Totals</td><td></td><td></td><td></td><td>${number(totals.units_sold)}</td><td>${money(totals.gross_sales)}</td><td>${money(totals.net_gross_sales)}</td><td>${money(totals.units_sold > 0 ? totals.gross_sales / totals.units_sold : 0)}</td><td>${money(totals.units_sold > 0 ? totals.net_gross_sales / totals.units_sold : 0)}</td></tr>`;
  skuSalesBody.innerHTML = `${bodyRows}${totalsRow}`;
}

function buildHistoricalTrendRows(payload) {
  if (Array.isArray(payload?.trendRows) && payload.trendRows.length) {
    return payload.trendRows.map((row) => ({
      key: String(row.key || ""),
      label: String(row.label || monthLabelFromKey(row.key || "")),
      total_units: Number(row.total_units || 0),
      rolling_3mo_units: Number(row.rolling_3mo_units || 0),
      previous_year_units: row.previous_year_units === null || row.previous_year_units === undefined ? null : Number(row.previous_year_units || 0),
      yoy_pct: row.yoy_pct === null || row.yoy_pct === undefined ? null : Number(row.yoy_pct),
    }));
  }
  const monthlyTotals = Array.isArray(payload?.monthlyTotals) ? payload.monthlyTotals : [];
  const monthKeys = Array.from(new Set(monthlyTotals.flatMap((row) => Object.keys(row).filter((key) => /^\d{4}-\d{2}$/.test(key))))).sort();
  return monthKeys.map((key, index) => {
    const totalUnits = monthlyTotals.reduce((sum, row) => sum + Number(row?.[key] || 0), 0);
    const trailing = monthKeys.slice(Math.max(0, index - 2), index + 1).map((monthKey) => monthlyTotals.reduce((sum, row) => sum + Number(row?.[monthKey] || 0), 0));
    const previousYearKey = `${Number(key.slice(0, 4)) - 1}-${key.slice(5, 7)}`;
    const previousYearUnits = monthlyTotals.reduce((sum, row) => sum + Number(row?.[previousYearKey] || 0), 0);
    return {
      key,
      label: monthLabelFromKey(key),
      total_units: totalUnits,
      rolling_3mo_units: average(trailing),
      previous_year_units: previousYearUnits > 0 ? previousYearUnits : null,
      yoy_pct: previousYearUnits > 0 ? ((totalUnits - previousYearUnits) / previousYearUnits) : null,
    };
  });
}

function buildHistoricalSeasonalityRows(payload) {
  if (Array.isArray(payload?.seasonality) && payload.seasonality.length) {
    return payload.seasonality.map((row) => ({
      month_number: Number(row.month_number || 0),
      month_label: String(row.month_label || ""),
      average_units: Number(row.average_units || 0),
      seasonality_index: Number(row.seasonality_index || 0),
      years_count: Number(row.years_count || 0),
    }));
  }
  const trendRows = buildHistoricalTrendRows(payload);
  const byMonth = new Map();
  trendRows.forEach((row) => {
    const monthNumber = Number(String(row.key || "").slice(5, 7));
    const bucket = byMonth.get(monthNumber) || [];
    bucket.push(Number(row.total_units || 0));
    byMonth.set(monthNumber, bucket);
  });
  const overallAverage = average(trendRows.map((row) => row.total_units));
  return MONTH_LABELS.map((label, index) => {
    const values = byMonth.get(index + 1) || [];
    const averageUnits = average(values);
    return {
      month_number: index + 1,
      month_label: label,
      average_units: averageUnits,
      seasonality_index: overallAverage > 0 ? averageUnits / overallAverage : 0,
      years_count: values.length,
    };
  });
}

function buildHistoricalForecastAnchors(payload) {
  const trendRows = buildHistoricalTrendRows(payload);
  const monthKeys = Array.isArray(payload?.monthKeys) && payload.monthKeys.length
    ? payload.monthKeys
    : trendRows.map((row) => row.key);
  const selectedMonthKey = getSelectedPlanningMonthKey() || trendRows.at(-1)?.key || "";
  const selectedMonthNumber = Number(String(selectedMonthKey || "").slice(5, 7) || 0);
  const seasonalityLookup = new Map(buildHistoricalSeasonalityRows(payload).map((row) => [Number(row.month_number || 0), row]));
  const historyRows = Array.isArray(payload?.productHistory) && payload.productHistory.length
    ? payload.productHistory
    : (Array.isArray(payload?.productMonthly) ? payload.productMonthly : []);
  const historyKeys = monthKeys.filter((key) => !selectedMonthKey || key < selectedMonthKey);
  const comparisonMonthKey = selectedMonthNumber
    ? `${Number(String(selectedMonthKey || "0").slice(0, 4) || 0) - 1}-${String(selectedMonthNumber).padStart(2, "0")}`
    : "";

  return sortRowsByProductName(historyRows).map((row) => {
    const series = historyKeys.map((key) => Number(row?.[key] || 0));
    const recent3Values = series.slice(-3);
    const recent6Values = series.slice(-6);
    const recent3 = average(recent3Values);
    const recent6 = average(recent6Values);
    const sameMonthLastYear = comparisonMonthKey ? Number(row?.[comparisonMonthKey] || 0) : 0;
    const volatility = recent6 > 0 ? stdDev(recent6Values) / recent6 : 0;
    const stability = volatility <= 0.25 ? "Stable" : volatility <= 0.6 ? "Variable" : "Spiky";
    const seasonality = seasonalityLookup.get(selectedMonthNumber);
    const seasonalityIndex = Number(seasonality?.seasonality_index || 0);
    const appliedSeasonality = seasonalityIndex > 0 ? seasonalityIndex : 1;

    let basisKey = "recent6";
    let basisLabel = "Recent 6-month average";
    let reasonShort = "History is thin or uneven, so a broader average is safer.";
    if (stability === "Stable" && recent3 > 0) {
      basisKey = "recent3";
      basisLabel = "Recent 3-month average";
      reasonShort = "Recent demand is steady, so the newest run rate is the clearest baseline.";
    } else if (sameMonthLastYear > 0 && seasonalityIndex >= 1.08) {
      basisKey = "blend";
      basisLabel = "Blend (seasonal recent + last year)";
      reasonShort = "This month usually runs hot, so we blend recent demand with same-month last year.";
    } else if (sameMonthLastYear > 0 && stability === "Spiky") {
      basisKey = "same_month_ly";
      basisLabel = "Same month last year";
      reasonShort = "Recent demand is noisy, so season-matched history is a safer baseline.";
    }

    // Suggested forecast for the selected month.
    // Rule of thumb:
    // - If we use a recent average, seasonality adjusts it up/down.
    // - If we use same month LY, it's already season-matched.
    // - Blend splits the difference between season-adjusted recent and same month LY.
    let suggestedUnits = 0;
    let suggestedMethod = "";
    let suggestedDetail = "";
    if (basisKey === "recent3") {
      suggestedUnits = recent3 * appliedSeasonality;
      suggestedMethod = seasonalityIndex > 0 ? "Recent 3-mo avg x seasonality" : "Recent 3-mo avg";
      suggestedDetail = seasonalityIndex > 0
        ? `${integer(recent3)} x ${number(appliedSeasonality)}x`
        : `${integer(recent3)} (no seasonality yet)`;
    } else if (basisKey === "recent6") {
      suggestedUnits = recent6 * appliedSeasonality;
      suggestedMethod = seasonalityIndex > 0 ? "Recent 6-mo avg x seasonality" : "Recent 6-mo avg";
      suggestedDetail = seasonalityIndex > 0
        ? `${integer(recent6)} x ${number(appliedSeasonality)}x`
        : `${integer(recent6)} (no seasonality yet)`;
    } else if (basisKey === "same_month_ly") {
      suggestedUnits = sameMonthLastYear;
      suggestedMethod = "Same month last year";
      suggestedDetail = `${integer(sameMonthLastYear)} (season-matched)`;
    } else if (basisKey === "blend") {
      const seasonalRecent = recent6 * appliedSeasonality;
      suggestedUnits = (seasonalRecent + sameMonthLastYear) / 2;
      suggestedMethod = "Blend (seasonal recent + last year)";
      suggestedDetail = `${integer(seasonalRecent)} and ${integer(sameMonthLastYear)} averaged`;
    }

    const reasonDetailParts = [];
    reasonDetailParts.push(`Stability: ${stability} (noise score ${integer(volatility * 100)}%).`);
    if (seasonalityIndex > 0) {
      reasonDetailParts.push(`Seasonality: ${number(seasonalityIndex)}x for the selected month.`);
    } else {
      reasonDetailParts.push("Seasonality: not enough history yet, so we did not adjust.");
    }
    if (sameMonthLastYear > 0) {
      reasonDetailParts.push(`Same month last year: ${integer(sameMonthLastYear)} units.`);
    } else {
      reasonDetailParts.push("Same month last year: not available.");
    }
    reasonDetailParts.push(`Suggested units: ${integer(suggestedUnits)} (${suggestedDetail}).`);
    const reasonDetail = reasonDetailParts.join(" ");

    return {
      product_name: row?.product_name || "",
      recent_3mo_avg: recent3,
      recent_6mo_avg: recent6,
      same_month_last_year_units: sameMonthLastYear,
      seasonality_index: seasonalityIndex,
      stability,
      basis_key: basisKey,
      basis_label: basisLabel,
      reason_short: reasonShort,
      reason_detail: reasonDetail,
      suggested_units: suggestedUnits,
      suggested_units_method: suggestedMethod,
      suggested_units_detail: suggestedDetail,
    };
  });
}

function renderHistoricalForecastSignals(payload) {
  if (!historicalForecastSignals) return;
  const trendRows = buildHistoricalTrendRows(payload);
  const seasonalityRows = buildHistoricalSeasonalityRows(payload);
  if (!trendRows.length) {
    historicalForecastSignals.innerHTML = '<div class="empty">Run planning to load forecasting signals.</div>';
    return;
  }

  const latest = trendRows.at(-1);
  const previous3 = average(trendRows.slice(-4, -1).map((row) => row.total_units));
  const selectedMonthNumber = Number(String(getSelectedPlanningMonthKey() || latest?.key || "").slice(5, 7) || 0);
  const selectedSeasonality = seasonalityRows.find((row) => Number(row.month_number || 0) === selectedMonthNumber) || null;
  const anchors = buildHistoricalForecastAnchors(payload);
  const basisCounts = anchors.reduce((acc, row) => {
    const key = String(row.basis_key || "");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topBasisKey = Object.entries(basisCounts).sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))[0]?.[0] || "";
  const stableCount = anchors.filter((row) => row.basis_key === "recent3").length;
  const blendedCount = anchors.filter((row) => row.basis_key === "blend").length;
  const recent6Count = anchors.filter((row) => row.basis_key === "recent6").length;
  const sameMonthCount = anchors.filter((row) => row.basis_key === "same_month_ly").length;
  const latestDirection = previous3 > 0 ? (latest.total_units - previous3) / previous3 : null;
  const cueLabel = topBasisKey
    ? topBasisKey === "recent3" ? "Recent trend"
      : topBasisKey === "recent6" ? "Broader average"
        : topBasisKey === "same_month_ly" ? "Season matched"
          : "Blend + seasonality"
    : "-";

  const cards = [
    {
      label: "Recent 3-mo avg",
      value: integer(average(trendRows.slice(-3).map((row) => row.total_units))),
      note: "Total units across the latest 3 actual months.",
    },
    {
      label: `${selectedSeasonality?.month_label || "Selected"} seasonality`,
      value: selectedSeasonality ? `${number(selectedSeasonality.seasonality_index)}x` : "-",
      note: selectedSeasonality ? "How strong this month tends to be versus an average month." : "Seasonality shows after enough history is loaded.",
      help: "Seasonality compares this month to an average month.\n\nExample: 0.7x means this month tends to run ~30% lower than average.\n1.2x means this month tends to run ~20% higher than average.\n\nThis is based on your historical monthly totals (not a forecast).",
    },
    {
      label: "Latest month vs prior",
      value: latestDirection === null ? "-" : pctLabel(latestDirection * 100),
      note: "Quick direction check before trusting the newest run rate.",
    },
    {
      label: "Suggested units cue",
      value: cueLabel,
      note: `Most common basis: ${topBasisKey || "-"}. Stable: ${stableCount}. Blend: ${blendedCount}. Recent 6-mo: ${recent6Count}. Same month LY: ${sameMonthCount}.`,
      help: "Suggested units cue is a quick summary of what the Suggested units table recommends.\n\nThe basis is the main starting number we trust for a product:\n- Recent 3-mo avg: when demand is steady.\n- Recent 6-mo avg: when demand is noisy or thin.\n- Same month last year: when seasonality matters and recent data is spiky.\n- Blend: when seasonality is strong but recent trend still matters.",
    },
  ];

  historicalForecastSignals.innerHTML = cards.map((card) => `
    <article class="history-signal-card">
      <div class="history-signal-label-row">
        <p class="history-signal-label">${escapeHtml(card.label)}</p>
        ${card.help ? `<button type="button" class="th-help-trigger" data-help="${escapeHtml(card.help)}" aria-label="More info about ${escapeHtml(card.label)}">?</button>` : ""}
      </div>
      <strong class="history-signal-value">${escapeHtml(String(card.value))}</strong>
      <p class="history-signal-note">${escapeHtml(card.note)}</p>
    </article>
  `).join("");
}

function renderHistoricalDemandTrendChart(payload) {
  destroyHistoricalTrendChart();
  if (typeof Chart === "undefined" || !(historicalDemandTrendChart instanceof HTMLCanvasElement)) return;
  const products = selectedHistoricalTrendProducts();
  if (!products.length) return;
  const multi = products.length > 1;
  const palette = ["#35528d", "#f0a429", "#2a9d8f", "#d64550", "#6b7280"];
  const datasets = [];
  let labels = null;

  products.forEach((product, index) => {
    const rows = product === "__all__" ? buildHistoricalTrendRows(payload) : buildProductTrendRows(payload, product);
    const trendRows = rows.slice(-24);
    if (!trendRows.length) return;
    if (!labels) labels = trendRows.map((row) => row.label);
    const color = palette[index % palette.length];
    const name = product === "__all__" ? "All core products" : displayProductName(product);

    const showFill = !multi;
    datasets.push({
      label: `Actual units (${name})`,
      data: trendRows.map((row) => Number(row.total_units || 0)),
      borderColor: color,
      backgroundColor: showFill ? hexToRgba(color, 0.12) : "transparent",
      fill: showFill,
      tension: 0.28,
      pointRadius: multi ? 0 : 2,
    });
    datasets.push({
      label: `3-mo average (${name})`,
      data: trendRows.map((row) => Number(row.rolling_3mo_units || 0)),
      borderColor: color,
      backgroundColor: "transparent",
      fill: false,
      tension: 0.32,
      pointRadius: 0,
      borderDash: [6, 4],
    });
  });

  if (!labels || !datasets.length) return;
  activeHistoricalTrendChart = new Chart(historicalDemandTrendChart.getContext("2d"), {
    type: "line",
    data: { labels, datasets },
    options: {
      ...baseChartOptions(),
      plugins: {
        ...baseChartOptions().plugins,
        legend: {
          ...baseChartOptions().plugins.legend,
          position: "bottom",
        },
      },
    },
  });
}

function renderHistoricalSeasonality(payload) {
  const rows = buildHistoricalSeasonalityRows(payload);
  const columns = [
    ["Month", "month_label", "Calendar month."],
    ["Avg units", "average_units", "Average total units for that month across the years you have loaded."],
    ["Seasonality index", "seasonality_index", "Avg units for this month divided by the average month. 1.0x = average. 0.7x = ~30% below average. 1.2x = ~20% above average."],
    ["Years used", "years_count", "How many years had data for this month (more years = more reliable index)."],
  ];
  historicalSeasonalityHead.innerHTML = `<tr>${columns.map(([label, , help]) => renderHeaderCell(label, { help })).join("")}</tr>`;
  if (!rows.length) {
    historicalSeasonalityBody.innerHTML = `<tr><td colspan="${columns.length}" class="empty">Run planning to load seasonality.</td></tr>`;
    return;
  }
  historicalSeasonalityBody.innerHTML = rows.map((row) => `<tr>${columns.map(([, key]) => {
    if (key === "month_label") return `<td>${escapeHtml(String(row[key] || ""))}</td>`;
    if (key === "seasonality_index") return `<td>${number(row[key])}x</td>`;
    return `<td>${number(row[key])}</td>`;
  }).join("")}</tr>`).join("");
}

function renderHistoricalForecastAnchors(payload) {
  const rows = buildHistoricalForecastAnchors(payload);
  const columns = [
    ["Product", "product_name", "Core product name."],
    ["Suggested units", "suggested_units", "Starting forecast for the selected month."],
    ["Basis used", "basis_label", "Which history number we trusted most for this product (recent average vs same month last year, etc)."],
    ["Recent 3-mo avg", "recent_3mo_avg", "Average monthly units across your last 3 closed actual months (before the selected month)."],
    ["Recent 6-mo avg", "recent_6mo_avg", "Average monthly units across your last 6 closed actual months (before the selected month)."],
    ["Same month LY", "same_month_last_year_units", "Units for the same calendar month last year (helps when demand is seasonal)."],
    ["Seasonality", "seasonality_index", "How strong the selected month tends to be vs an average month. 1.2x means higher-than-average month."],
    ["Stability", "stability", "How consistent the last 6 months are: Stable / Variable / Spiky."],
    ["Why this suggestion", "reason_short", "Plain-English reason plus a full breakdown (hover) showing what we used and how Suggested units was computed."],
  ];
  historicalAnchorHead.innerHTML = `<tr>${columns.map(([label, , help]) => renderHeaderCell(label, { help })).join("")}</tr>`;
  if (!rows.length) {
    historicalAnchorBody.innerHTML = `<tr><td colspan="${columns.length}" class="empty">Run planning to load forecast anchors.</td></tr>`;
    return;
  }
  historicalAnchorBody.innerHTML = rows.map((row) => `<tr>${columns.map(([, key]) => {
    if (key === "product_name") return `<td>${escapeHtml(displayProductName(row[key] || ""))}</td>`;
    if (key === "suggested_units") {
      const method = String(row.suggested_units_method || "");
      const detail = String(row.suggested_units_detail || "");
      const title = [method, detail].filter(Boolean).join(" - ");
      return `
        <td title="${escapeHtml(title)}">
          <div class="cell-stack">
            <strong>${integer(row[key])}</strong>
            <span class="muted">${escapeHtml(method || "Suggested units")}</span>
          </div>
        </td>
      `;
    }
    if (key === "basis_label") {
      return `<td>${escapeHtml(String(row[key] || ""))}</td>`;
    }
    if (key === "seasonality_index") return `<td>${number(row[key])}x</td>`;
    if (key === "stability") return `<td>${escapeHtml(String(row[key] || ""))}</td>`;
    if (key === "reason_short") {
      const detail = String(row.reason_detail || "");
      const hint = detail ? "Hover for full breakdown" : "";
      return `
        <td title="${escapeHtml(detail)}">
          <div class="cell-stack">
            <span>${escapeHtml(String(row[key] || ""))}</span>
            <span class="muted">${escapeHtml(hint)}</span>
          </div>
        </td>
      `;
    }
    return `<td>${number(row[key])}</td>`;
  }).join("")}</tr>`).join("");
}

function renderHistoricalTrend(payload, focusYear) {
  const years = payload.years || [];
  const monthlyTotals = payload.monthlyTotals || [];
  const productMonthly = sortRowsByProductName(payload.productMonthly || []);
  const yoyByMonth = payload.yoyByMonth || [];
  if (historicalTrendCopy) {
    historicalTrendCopy.textContent = years.length
      ? `Shows actual units for ${years.join(", ")}. Product detail focuses on ${focusYear}.`
      : "Run planning to load actual history.";
  }

  renderHistoricalForecastSignals(payload);
  renderHistoricalTrendProductPicker(payload);
  renderHistoricalDemandTrendChart(payload);
  renderHistoricalSeasonality(payload);
  renderHistoricalForecastAnchors(payload);

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
      if (key === "product_name") return `<td>${escapeHtml(displayProductName(row[key] || ""))}</td>`;
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
      if (key === "yoy_pct") return `<td>${row[key] === null || row[key] === undefined ? "-" : percent(row[key])}</td>`;
      return `<td>${number(row[key])}</td>`;
    }).join("")}</tr>`).join("");
  }
}

function renderLaunchPlanning(payload) {
  const rows = sortRowsByProductName(payload?.rows || []);
  if (launchPlanningCopy) {
    launchPlanningCopy.textContent = rows.length
      ? "Use the proxy launch curve to compare what you already sent versus low, base, and high demand cases."
      : "Run planning to load launch references and send scenarios.";
  }
  if (launchPlanningSummary) {
    if (!rows.length) {
      launchPlanningSummary.innerHTML = '<div class="empty">Run planning to load launch summary.</div>';
    } else {
      const todayIso = new Date().toISOString().slice(0, 10);
      const withDates = rows
        .filter((row) => String(row.launch_date || "").slice(0, 10))
        .map((row) => ({ ...row, launch_date: String(row.launch_date || "").slice(0, 10) }))
        .sort((a, b) => String(a.launch_date).localeCompare(String(b.launch_date)));
      const upcoming = withDates.find((row) => row.launch_date >= todayIso) || withDates[withDates.length - 1];
      const productName = String(upcoming.product_name || "");
      const launchDate = String(upcoming.launch_date || "");
      const committed = Number(upcoming.launch_units_committed || 0);
      const baseDaily = Number(upcoming.base_daily_velocity || 0);
      const baseWeeks = Number(upcoming.base_weeks_of_cover || 0);
      const proxyName = String(upcoming.proxy_product_name || "");
      const explanation = [
        "How this works:",
        "1) Reference table shows what your proxy product did in its first 7/14/30 days.",
        "2) Scenario table converts your committed units into weeks of cover using low/base/high daily velocities.",
      ].join("\n");
      launchPlanningSummary.innerHTML = `
        <div class="launch-summary-grid">
          <article class="launch-summary-card">
            <p class="launch-summary-label">Nearest launch</p>
            <strong class="launch-summary-value">${escapeHtml(displayProductName(productName) || "—")}</strong>
            <p class="launch-summary-note">${launchDate ? `Launch date: ${escapeHtml(launchDate)}` : "Launch date: —"}</p>
          </article>
          <article class="launch-summary-card">
            <p class="launch-summary-label">Committed units</p>
            <strong class="launch-summary-value">${integer(committed)}</strong>
            <p class="launch-summary-note">Units you plan to have available for the launch.</p>
          </article>
          <article class="launch-summary-card">
            <p class="launch-summary-label">Base weeks of cover</p>
            <strong class="launch-summary-value">${baseDaily > 0 ? number(baseWeeks) : "—"}</strong>
            <p class="launch-summary-note">${baseDaily > 0 ? `At ~${number(baseDaily)}/day.` : "Needs baseline demand to estimate velocity."}</p>
          </article>
          <article class="launch-summary-card">
            <p class="launch-summary-label">Proxy product</p>
            <strong class="launch-summary-value">${escapeHtml(displayProductName(proxyName) || "—")}</strong>
            <p class="launch-summary-note">We use this product's early curve as a reference.</p>
          </article>
        </div>
        <div class="launch-summary-helper">
          <span class="launch-summary-helper-title">How to read this</span>
          <button type="button" class="th-help-trigger" data-help="${escapeHtml(explanation)}" aria-label="How to read launch planning">?</button>
        </div>
      `;
    }
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
      if (key === "product_name") return `<td>${escapeHtml(displayProductName(row[key] || ""))}</td>`;
      if (key === "proxy_product_name") return `<td>${escapeHtml(displayProductName(row[key] || ""))}</td>`;
      if (key === "launch_date") return `<td>${escapeHtml(row[key] || "—")}</td>`;
      return `<td>${number(row[key])}</td>`;
    }).join("")}</tr>`).join("");
  }

  const scenarioColumns = [
    ["Product", "product_name"],
    ["Committed units", "launch_units_committed"],
    ["Target cover (w/d)", "launch_cover_weeks_target"],
    ["Low daily velocity", "low_daily_velocity"],
    ["Base daily velocity", "base_daily_velocity"],
    ["High daily velocity", "high_daily_velocity"],
    ["Low cover (w/d)", "low_weeks_of_cover"],
    ["Base cover (w/d)", "base_weeks_of_cover"],
    ["High cover (w/d)", "high_weeks_of_cover"],
    ["Base send units", "base_send_units"],
  ];
  launchScenariosHead.innerHTML = `<tr>${scenarioColumns.map(([label]) => `<th>${label}</th>`).join("")}</tr>`;
  if (!rows.length) {
    launchScenariosBody.innerHTML = `<tr><td colspan="${scenarioColumns.length}" class="empty">Run planning to load launch scenarios.</td></tr>`;
    return;
  }
  launchScenariosBody.innerHTML = rows.map((row) => `<tr>${scenarioColumns.map(([, key]) => {
    if (key === "product_name") return `<td>${escapeHtml(displayProductName(row[key] || ""))}</td>`;
    if (key === "launch_cover_weeks_target" || key.endsWith("weeks_of_cover")) {
      const weeks = row[key];
      if (weeks === null || weeks === undefined) return `<td>—</td>`;
      const days = Math.round(Number(weeks) * 7);
      return `<td>${number(weeks)}w (${integer(days)}d)</td>`;
    }
    return `<td>${number(row[key])}</td>`;
  }).join("")}</tr>`).join("");
}

function formatMetric(value, format = "text") {
  if (value === null || value === undefined) return "—";
  if (format === "money") return money(value);
  if (format === "percent") return percent(value);
  if (format === "integer") return integer(value);
  if (format === "number") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? number(numeric) : "—";
  }
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

function hexToRgba(hex, alpha) {
  const raw = String(hex || "").replace("#", "").trim();
  if (raw.length !== 6) return `rgba(53,82,141,${alpha})`;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${Number.isFinite(r) ? r : 53},${Number.isFinite(g) ? g : 82},${Number.isFinite(b) ? b : 141},${alpha})`;
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
                const raw = row[key];
                if (raw === null || raw === undefined || raw === "") {
                  return '<td class="heat-cell" style="--heat:0">—</td>';
                }
                const value = Number(raw);
                if (!Number.isFinite(value)) {
                  return '<td class="heat-cell" style="--heat:0">—</td>';
                }
                return `<td class="heat-cell" style="--heat:${Math.min(Math.max(value, 0), 1)}">${percent(value)}</td>`;
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
  beginScreenBusy("Running planning...");
  setButtonBusy(runPlanningBtn, true, "Running...");
  try {
    const formData = new FormData(planForm);
    const payload = Object.fromEntries(formData.entries());
    ["baselineStart", "baselineEnd", "horizonStart", "horizonEnd"].forEach((key) => {
      if (payload[key]) payload[key] = toIsoDate(payload[key]) || payload[key];
    });
    const excludeSpikesInput = document.getElementById("exclude-spikes");
    const monthKey = getSelectedPlanningMonthKey();
    const activeSetting = getForecastSetting(monthKey, { persist: false });
    payload.planningYear = Number(planningYearInput?.value || forecastYear || new Date().getFullYear());
    payload.upliftPct = activeSetting.upliftPct;
    payload.excludeSpikes = excludeSpikesInput?.checked ?? true;
    payload.monthlyForecastSettings = Object.fromEntries(
      Object.entries(forecastSettings).filter(([, setting]) => setting && typeof setting === "object"),
    );
    payload.monthlyForecastPcts = Object.fromEntries(
      Object.entries(payload.monthlyForecastSettings).map(([key, setting]) => [key, Number(setting?.upliftPct || 0)]),
    );
    const orderDateBasisInput = document.getElementById("order-date-basis");
    payload.orderDateBasis = orderDateBasisInput?.value || "paid_time";
    payload.customSettings = sharedPlannerSettings || defaultPlannerSettings();
    payload.marketingConfig = marketingConfigSource === "api" ? marketingConfig : readLocalMarketingConfig();
    const plan = await fetchJson("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    renderResults(plan);
    if (showStatus) setStatus("Planning run complete.");
  } finally {
    setButtonBusy(runPlanningBtn, false);
    endScreenBusy();
  }
}

async function loadKpis() {
  const params = new URLSearchParams({
    startDate: toIsoDate(kpiStartDateInput.value || ""),
    endDate: toIsoDate(kpiEndDateInput.value || ""),
    tab: activeKpiTab,
    dateBasis: kpiDateBasisInput.value || "order",
    orderBucket: kpiOrderBucketInput.value || "paid_time",
    sources: currentKpiSources().join(","),
  });
  const payload = await fetchJson(`/api/tiktok-kpis?${params.toString()}`);
  kpiOutputInput.value = payload.filters?.output || "analysis_output";
  kpiDateBasisInput.value = payload.filters?.dateBasis || "order";
  kpiOrderBucketInput.value = payload.filters?.orderBucket || "paid_time";
  kpiStartDateInput.value = payload.filters?.startDate ? toUsDate(payload.filters.startDate) : kpiStartDateInput.value;
  kpiEndDateInput.value = payload.filters?.endDate ? toUsDate(payload.filters.endDate) : kpiEndDateInput.value;
  const selectedSources = payload.filters?.selectedSources || ["Sales"];
  Array.from(kpiFilterForm.querySelectorAll('.source-pill input[type="checkbox"]')).forEach((input) => {
    input.checked = selectedSources.includes(input.value);
  });
  renderKpis(payload);
}

function previewNonJsonResponse(raw, meta = {}) {
  const trimmed = String(raw || "").trim();
  const excerpt = trimmed.replace(/\s+/g, " ").slice(0, 220);
  const status = Number(meta.status || 0);
  const url = String(meta.url || "");
  const contentType = String(meta.contentType || "").toLowerCase();

  if (!excerpt) return "Empty response body.";

  // Next dev server / bundler got corrupted (common after interrupted builds).
  if (
    trimmed.includes("Cannot find module './chunks/vendor-chunks/next.js'") ||
    trimmed.includes("Cannot find module \".next/") ||
    trimmed.includes("ChunkLoadError") ||
    trimmed.includes("Failed to fetch dynamically imported module")
  ) {
    return "The server restarted into a bad state (missing a Next.js file). Restart the server, then refresh the page.";
  }

  const looksLikeHtml = excerpt.toLowerCase().startsWith("<!doctype") || excerpt.toLowerCase().startsWith("<html");
  if (looksLikeHtml) {
    if (status === 404) {
      return "API route not found (404). This usually means you opened the planner from a different server/port than the Next backend, or the site is hosted as static files without API routes.";
    }
    if (status === 405) {
      return "API route exists but the HTTP method is not allowed (405). This can happen if a POST endpoint is being called with GET, or the route handler did not export the expected method.";
    }
    if (status === 413) {
      return "Upload payload too large (413). Try again; if it keeps happening, reduce the upload chunk size.";
    }
    if (status >= 500 && status <= 599) {
      return "The server returned an HTML error page. This usually means the server restarted or an API route hit an error. Try again in a few seconds.";
    }
    // 200/302 HTML typically indicates a rewrite/redirect to an app shell or login page.
    return "The server returned a web page instead of data. This can happen after a server restart, or if the request was redirected to a page route.";
  }

  if (contentType && !contentType.includes("application/json")) {
    return `Server returned non-JSON response (${contentType}). ${excerpt}`;
  }

  // Helpful when running the static planner from a different server origin.
  if (url && url.includes("/api/") && (trimmed.includes("<") || trimmed.toLowerCase().includes("not found"))) {
    return `API call did not return JSON. Make sure the planner and the API are being served from the same host/port. ${excerpt}`;
  }

  return `Server returned non-JSON response: ${excerpt}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableFetchError(error) {
  const message = String(error && error.message ? error.message : error || "");
  return (
    message.includes("HTTP 502") ||
    message.includes("HTTP 503") ||
    message.includes("HTTP 504") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("Load failed") ||
    message.includes("Server returned HTML instead of JSON") ||
    message.includes("returned a web page instead of data") ||
    message.includes("returned an HTML error page")
  );
}

async function readJsonResponse(response, url) {
  const contentType = String(response.headers.get("content-type") || "");
  const raw = await response.text();
  const trimmed = String(raw || "").trim();
  const likelyJson =
    contentType.toLowerCase().includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  if (!likelyJson) {
    throw new Error(`${previewNonJsonResponse(raw, { status: response.status, url, contentType })} (HTTP ${response.status})`);
  }

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`${previewNonJsonResponse(raw, { status: response.status, url, contentType })} (HTTP ${response.status})`);
  }
}

async function fetchJson(url, options) {
  const requestUrl = new URL(url, window.location.origin);
  if (requestUrl.origin === window.location.origin && requestUrl.pathname.startsWith("/api/")) {
    requestUrl.searchParams.set("dataSource", plannerDataSourceMode || "local");
  }

  const method = String((options && options.method) || "GET").toUpperCase();
  const maxAttempts = method === "GET" ? 3 : 1;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(requestUrl.toString(), options);
      const payload = await readJsonResponse(response, requestUrl.toString());
      if (!response.ok || payload.error) {
        throw new Error(payload.error || `Request failed (${response.status})`);
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts - 1 || !isRetryableFetchError(error)) {
        throw error;
      }
      // Small backoff to allow dev server to finish compiling or recover from transient gateway errors.
      await sleep(250 * (attempt + 1));
    }
  }

  throw lastError || new Error("Request failed.");
}

function getStoredPlannerDataSource() {
  const host = String(window.location.hostname || "").toLowerCase();
  const isLoopbackIpv4 = (value) => {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return false;
    const parts = value.split(".").map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part) || part < 0 || part > 255)) return false;
    return parts[0] === 127;
  };
  const isLocalHost = host === "localhost" || host === "::1" || isLoopbackIpv4(host);
  if (!isLocalHost) {
    // Hosted URL: default to Firestore even if an old localStorage value exists.
    // (Local-files mode is primarily a dev workflow.)
    return "live";
  }
  try {
    const stored = window.localStorage.getItem(PLANNER_DATA_SOURCE_STORAGE_KEY);
    if (stored === "live" || stored === "local") return stored;
  } catch {
    // ignore storage failures
  }
  return "local";
}

function updatePlannerDataSourceCopy(workspace = null) {
  if (!plannerDataSourceCopy) return;
  const requestedLabel = plannerDataSourceMode === "live" ? "Firestore" : "local files";
  const summary = workspace?.summary || {};
  const actualSource = summary.data_source || "";
  const actualDetail = summary.data_source_detail || "";
  const actualLabel = actualSource === "live"
    ? "Firestore"
    : actualSource === "snapshot"
      ? "local snapshot fallback"
      : "local files";
  const liveSyncNote = plannerDataSourceMode === "live"
    ? "Live inventory sync is available."
    : "Live inventory sync is disabled in local-files mode.";
  const host = String(window.location.hostname || "").toLowerCase();
  const isLoopbackIpv4 = (value) => {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return false;
    const parts = value.split(".").map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part) || part < 0 || part > 255)) return false;
    return parts[0] === 127;
  };
  const isLocalSite = host === "localhost" || host === "::1" || isLoopbackIpv4(host);
  const hostedLocalNote = plannerDataSourceMode === "local" && !isLocalSite
    ? "Note: Local-files mode may not persist changes on the hosted site. Use Firestore to keep settings across browsers."
    : "";
  plannerDataSourceCopy.textContent = actualSource
    ? `Preview is set to ${requestedLabel}. Current load came from ${actualLabel}${actualDetail ? ` (${actualDetail})` : ""}. ${liveSyncNote} ${hostedLocalNote}`.trim()
    : `Preview is set to ${requestedLabel}. ${liveSyncNote} ${hostedLocalNote}`.trim();
  if (updateLiveInventoryBtn instanceof HTMLButtonElement) {
    updateLiveInventoryBtn.disabled = plannerDataSourceMode !== "live";
    updateLiveInventoryBtn.title = plannerDataSourceMode === "live" ? "" : "Switch preview data source to Firestore to use live inventory sync.";
  }
}

function setStoredPlannerDataSource(mode) {
  plannerDataSourceMode = mode === "live" ? "live" : "local";
  try {
    window.localStorage.setItem(PLANNER_DATA_SOURCE_STORAGE_KEY, plannerDataSourceMode);
  } catch {
    // ignore storage failures
  }
  if (plannerDataSourceSelect instanceof HTMLSelectElement) {
    plannerDataSourceSelect.value = plannerDataSourceMode;
  }
  updatePlannerDataSourceCopy();
}

const settingsAuthDialog = document.getElementById("settings-auth-dialog");
const settingsAuthForm = document.getElementById("settings-auth-form");
const settingsAuthPassword = document.getElementById("settings-auth-password");
const settingsAuthStatus = document.getElementById("settings-auth-status");
const settingsAuthCancel = document.getElementById("settings-auth-cancel");
const settingsAuthSubmit = document.getElementById("settings-auth-submit");
let settingsUnlockResolver = null;
let settingsUnlockPromise = null;

async function getSettingsAuthStatus() {
  try {
    return await fetchJson("/api/settings-auth");
  } catch {
    return { enabled: false, authed: true };
  }
}

function setSettingsAuthStatus(message, isError = false) {
  if (!settingsAuthStatus) return;
  settingsAuthStatus.textContent = message || "";
  settingsAuthStatus.dataset.error = isError ? "true" : "false";
}

function openSettingsAuthDialog() {
  if (!(settingsAuthDialog instanceof HTMLDialogElement)) return false;
  setSettingsAuthStatus("");
  settingsAuthDialog.showModal();
  if (settingsAuthPassword instanceof HTMLInputElement) {
    settingsAuthPassword.value = "";
    settingsAuthPassword.focus();
  }
  return true;
}

function closeSettingsAuthDialog() {
  if (settingsAuthDialog instanceof HTMLDialogElement) {
    settingsAuthDialog.close();
  }
}

function resolveSettingsUnlock(ok) {
  if (typeof settingsUnlockResolver === "function") {
    settingsUnlockResolver(Boolean(ok));
  }
  settingsUnlockResolver = null;
  settingsUnlockPromise = null;
}

async function ensureSettingsUnlocked() {
  const status = await getSettingsAuthStatus();
  if (!status?.enabled || status.authed) return true;
  if (!openSettingsAuthDialog()) return true;
  if (!settingsUnlockPromise) {
    settingsUnlockPromise = new Promise((resolve) => {
      settingsUnlockResolver = resolve;
    });
  }
  return await settingsUnlockPromise;
}

settingsAuthCancel?.addEventListener("click", () => {
  closeSettingsAuthDialog();
  resolveSettingsUnlock(false);
});

settingsAuthDialog?.addEventListener("close", () => {
  // Handles Esc key / backdrop close.
  if (settingsUnlockPromise) {
    resolveSettingsUnlock(false);
  }
});

settingsAuthForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  beginScreenBusy("Unlocking settings...");
  try {
    setButtonBusy(settingsAuthSubmit, true, "Unlocking...");
    setSettingsAuthStatus("");
    const password = settingsAuthPassword instanceof HTMLInputElement ? settingsAuthPassword.value : "";
    await fetchJson("/api/settings-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    closeSettingsAuthDialog();
    resolveSettingsUnlock(true);
  } catch (error) {
    setSettingsAuthStatus(error.message || "Could not unlock settings.", true);
  } finally {
    setButtonBusy(settingsAuthSubmit, false);
    endScreenBusy();
  }
});

settingsPasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const unlocked = await ensureSettingsUnlocked();
    if (!unlocked) {
      setSettingsPasswordStatus("Settings are locked.", true);
      return;
    }
    beginScreenBusy("Updating settings password...");
    setSettingsPasswordStatus("");
    setButtonBusy(changePasswordButton, true, "Updating...");

    const current = settingsCurrentPassword instanceof HTMLInputElement ? settingsCurrentPassword.value : "";
    const next = settingsNewPassword instanceof HTMLInputElement ? settingsNewPassword.value : "";
    const confirm = settingsConfirmPassword instanceof HTMLInputElement ? settingsConfirmPassword.value : "";

    if (!current) {
      setSettingsPasswordStatus("Enter your current password.", true);
      return;
    }
    if (!next || next.length < 6) {
      setSettingsPasswordStatus("New password must be at least 6 characters.", true);
      return;
    }
    if (next !== confirm) {
      setSettingsPasswordStatus("New password and confirmation do not match.", true);
      return;
    }

    await fetchJson("/api/settings-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });

    if (settingsCurrentPassword instanceof HTMLInputElement) settingsCurrentPassword.value = "";
    if (settingsNewPassword instanceof HTMLInputElement) settingsNewPassword.value = "";
    if (settingsConfirmPassword instanceof HTMLInputElement) settingsConfirmPassword.value = "";
    setSettingsPasswordStatus("Password updated.");
    setStatus("Settings password updated.");
  } catch (error) {
    setSettingsPasswordStatus(error.message || "Could not update password.", true);
  } finally {
    setButtonBusy(changePasswordButton, false);
    endScreenBusy();
  }
});

async function loadWorkspace() {
  const payload = await fetchJson("/api/bootstrap");
  const workspace = payload.workspace || payload;
  inventoryUploaded = Boolean(workspace.inventoryUploaded);
  renderSummary(workspace.summary || {}, inventoryUploaded);
  applyDefaults(workspace.defaults || {});
  applyPlannerVariant(workspace.summary || {});
  updatePlannerDataSourceCopy(workspace);
  await loadMarketingConfig();
  await loadSkuMapping();
  // Clear stale "server returned HTML" errors once the backend is healthy again.
  if (uploadStatus?.dataset?.error === "true") {
    const message = String(uploadStatus.textContent || "");
    if (message.includes("Server returned HTML instead of JSON") || message.includes("Server returned non-JSON") || message.includes("Dev server got into a bad state")) {
      setStatus("");
    }
  }
  const summary = workspace.summary || {};
  if (summary.date_end) {
    const endDate = new Date(`${summary.date_end}T00:00:00Z`);
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

applyDataSourceButton?.addEventListener("click", async () => {
  const nextMode = plannerDataSourceSelect instanceof HTMLSelectElement ? plannerDataSourceSelect.value : "local";
  setStoredPlannerDataSource(nextMode);
  setStatus(`Switched preview to ${plannerDataSourceMode === "live" ? "Firestore" : "local files"}. Refreshing...`);
  try {
    beginScreenBusy("Refreshing data source...");
    await loadWorkspace();
    setStatus(`Preview now using ${plannerDataSourceMode === "live" ? "Firestore" : "local files"}.`);
  } catch (error) {
    setStatus(error.message || "Could not switch preview data source.", true);
  } finally {
    endScreenBusy();
  }
});

async function postJson(url, payload) {
  return await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function postForm(url, form) {
  return await fetchJson(url, { method: "POST", body: form });
}

loadSampleBtn.addEventListener("click", async () => {
  try {
    beginScreenBusy("Refreshing current data...");
    setButtonBusy(loadSampleBtn, true, "Refreshing...");
    setStatus("Refreshing current data...");
    const payload = await fetchJson("/api/bootstrap?refresh=1");
    const workspace = payload.workspace || payload;
    inventoryUploaded = Boolean(workspace.inventoryUploaded);
    renderSummary(workspace.summary || {}, inventoryUploaded);
    applyDefaults(workspace.defaults || {});
    updatePlannerDataSourceCopy(workspace);
    if (payload.plan) {
      renderResults(payload.plan);
    } else {
      await runPlanningFromForm(false);
    }
    setStatus("Current data refreshed.");
  } catch (error) {
    setStatus(error.message || "Could not refresh current data.", true);
  } finally {
    setButtonBusy(loadSampleBtn, false);
    endScreenBusy();
  }
});

if (updateLiveInventoryBtn) {
  updateLiveInventoryBtn.addEventListener("click", async () => {
    try {
      if (plannerDataSourceMode !== "live") {
        setStatus("Switch preview data source to Firestore before running live inventory sync.", true);
        return;
      }
      const unlocked = await ensureSettingsUnlocked();
      if (!unlocked) {
        setStatus("Settings are locked.", true);
        return;
      }
      beginScreenBusy("Updating live inventory...");
      setButtonBusy(updateLiveInventoryBtn, true, "Updating...");
      setStatus("Pulling the live inventory sheet and saving it to Firestore...");
      const payload = await fetchJson("/api/inventory-sync", { method: "POST" });
      const workspace = payload.workspace || payload;
      inventoryUploaded = Boolean(workspace.inventoryUploaded);
      renderSummary(workspace.summary || {}, inventoryUploaded);
      applyDefaults(workspace.defaults || {});
      updatePlannerDataSourceCopy(workspace);
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
      setButtonBusy(updateLiveInventoryBtn, false);
      endScreenBusy();
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
  beginScreenBusy("Uploading files...");
  setButtonBusy(uploadBtn, true, "Uploading...");
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

    // Chunk uploads by date to avoid sending huge JSON payloads (monthly TikTok exports can be 50MB+).
    const chunks = chunkRowsByDate(uploadPayload.rows, 1500);
    let totalRowsWritten = 0;
    let totalSkuRowsWritten = 0;

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const range = chunk.uploadedDates.length ? ` (${chunk.uploadedDates[0]} to ${chunk.uploadedDates[chunk.uploadedDates.length - 1]})` : "";
      setStatus(`Uploading ${label} chunk ${index + 1}/${chunks.length}${range}...`);
      const chunkPayload = {
        platform: uploadPayload.platform,
        rows: chunk.rows,
        uploadedDates: chunk.uploadedDates,
        rawRowCount: index === 0 ? uploadPayload.rawRowCount : 0,
        sourceRowCount: index === 0 ? uploadPayload.sourceRowCount : 0,
        writeAudit: false,
      };
      const response = await postJson(url, chunkPayload);
      totalRowsWritten += Number(response?.upload?.rowsWritten || 0);
      totalSkuRowsWritten += Number(response?.upload?.skuRowsWritten || 0);
    }

    // Finalize a single audit record so the sidebar "Data as of" stays correct.
    await postJson(url, {
      finalize: true,
      platform: uploadPayload.platform,
      rawRowCount: uploadPayload.rawRowCount,
      sourceRowCount: uploadPayload.sourceRowCount,
      uploadedDates: uploadPayload.uploadedDates,
      rowsWritten: totalRowsWritten,
      skuRowsWritten: totalSkuRowsWritten,
    });

    await loadWorkspace();
    const rowsWritten = totalRowsWritten || uploadPayload.rows.length;
    const skuRowsWritten = totalSkuRowsWritten || 0;
    const uploadedDates = Array.isArray(uploadPayload.uploadedDates) ? uploadPayload.uploadedDates.filter(Boolean).slice().sort() : [];
    const uploadedRange = uploadedDates.length ? ` (${uploadedDates[0]} to ${uploadedDates[uploadedDates.length - 1]})` : "";
    setStatus(
      `${label.charAt(0).toUpperCase() + label.slice(1)} uploaded: ${integer(uploadPayload.rawRowCount)} raw rows, ${integer(uploadPayload.sourceRowCount)} usable listing rows, ${integer(rowsWritten)} lean core-product rows${skuRowsWritten ? `, ${integer(skuRowsWritten)} lean SKU sales rows` : ""} across ${uploadedDates.length} dates${uploadedRange}.`,
    );
  } catch (error) {
    setStatus(error.message || "Could not upload files.", true);
  } finally {
    setButtonBusy(uploadBtn, false);
    endScreenBusy();
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

if (campaignForm) {
  campaignForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(campaignForm);
      const name = String(formData.get("name") || "").trim();
      const startDateRaw = String(formData.get("startDate") || "").trim();
      const endDateRaw = String(formData.get("endDate") || "").trim();
      const startDate = toIsoDate(startDateRaw);
      const endDate = toIsoDate(endDateRaw);
      const liftPct = parsePercentValue(formData.get("liftPct"));
      const days = inclusiveDayCount(startDate, endDate);
      if (!name) throw new Error("Enter an event name.");
      if (!startDate || !endDate) throw new Error("Choose a start and end date.");
      if (days <= 0) throw new Error("End date must be the same as or after start date.");
      const next = normalizeMarketingConfig(marketingConfig);
      next.campaigns = [
        ...next.campaigns.filter((row) => row && row.id),
        { id: makeClientId("campaign"), name, startDate, endDate, liftPct },
      ];
      setStatus("Saving campaign...");
      await persistMarketingConfig(next, "Campaign saved.");
      campaignForm.reset();
    } catch (error) {
      setStatus(error.message || "Could not save campaign.", true);
    }
  });
}

campaignBody?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-campaign-delete]");
  if (!(button instanceof HTMLButtonElement)) return;
  const id = String(button.dataset.campaignDelete || "");
  if (!id) return;
  try {
    const next = normalizeMarketingConfig(marketingConfig);
    next.campaigns = next.campaigns.filter((row) => row.id !== id);
    setStatus("Deleting campaign...");
    await persistMarketingConfig(next, "Campaign deleted.");
  } catch (error) {
    setStatus(error.message || "Could not delete campaign.", true);
  }
});

if (launchPlanForm) {
  launchPlanForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(launchPlanForm);
      const editId = String(formData.get("editId") || "").trim();
      const newProductName = String(formData.get("newProductName") || "").trim();
      const proxyProduct = String(formData.get("proxyProduct") || "").trim();
      const startDateRaw = String(formData.get("startDate") || "").trim();
      const endDateRaw = String(formData.get("endDate") || "").trim();
      const startDate = toIsoDate(startDateRaw);
      const endDate = toIsoDate(endDateRaw);
      const strengthPct = parsePercentValue(formData.get("strengthPct")) ?? 100;
      const committedUnitsRaw = String(formData.get("committedUnits") || "").trim();
      const committedUnits = committedUnitsRaw ? Number(committedUnitsRaw) : Number.NaN;
      if (!newProductName) throw new Error("Enter a brand new product name.");
      if (!proxyProduct) throw new Error("Select a proxy product.");
      if (!startDate) throw new Error("Choose a launch start date.");
      if (endDate) {
        const days = inclusiveDayCount(startDate, endDate);
        if (days <= 0) throw new Error("Launch end date must be the same as or after start date.");
      }
      if (!Number.isFinite(committedUnits) || committedUnits < 0) throw new Error("Enter committed inbound units.");

      const id = editId || makeClientId("launch");
      const next = normalizeMarketingConfig(marketingConfig);
      next.launchPlans = [
        ...next.launchPlans.filter((row) => row && row.id && row.id !== id),
        {
          id,
          newProductName,
          proxyProduct,
          startDate,
          endDate,
          strengthPct,
          committedUnits: Math.round(committedUnits),
        },
      ];
      setStatus(editId ? "Updating launch plan..." : "Saving launch plan...");
      await persistMarketingConfig(next, editId ? "Launch plan updated." : "Launch plan saved.");
      launchPlanForm.reset();
      clearLaunchEditMode();
      renderLaunchProxyOptions();
    } catch (error) {
      setStatus(error.message || "Could not save launch plan.", true);
    }
  });
}

launchPlanBody?.addEventListener("click", async (event) => {
  const editButton = event.target.closest("button[data-launch-edit]");
  if (editButton instanceof HTMLButtonElement) {
    const id = String(editButton.dataset.launchEdit || "");
    if (!id) return;
    const plan = (marketingConfig?.launchPlans || []).find((row) => row && row.id === id);
    if (!plan) {
      setStatus("Could not find that launch plan.", true);
      return;
    }
    if (launchPlanForm) {
      launchPlanForm.querySelector('input[name="newProductName"]').value = plan.newProductName || "";
      launchProxyProductSelect.value = plan.proxyProduct || "";
      launchPlanForm.querySelector('input[name="startDate"]').value = plan.startDate ? toUsDate(plan.startDate) : "";
      launchPlanForm.querySelector('input[name="endDate"]').value = plan.endDate ? toUsDate(plan.endDate) : "";
      launchPlanForm.querySelector('input[name="strengthPct"]').value = String(plan.strengthPct ?? 100);
      launchPlanForm.querySelector('input[name="committedUnits"]').value = String(plan.committedUnits ?? 0);
    }
    setLaunchEditMode(plan);
    setStatus("Editing launch plan.");
    return;
  }

  const deleteButton = event.target.closest("button[data-launch-delete]");
  if (!(deleteButton instanceof HTMLButtonElement)) return;
  const id = String(deleteButton.dataset.launchDelete || "");
  if (!id) return;
  try {
    const next = normalizeMarketingConfig(marketingConfig);
    next.launchPlans = next.launchPlans.filter((row) => row.id !== id);
    if (activeLaunchEditId && activeLaunchEditId === id) {
      clearLaunchEditMode();
      launchPlanForm?.reset();
      renderLaunchProxyOptions();
    }
    setStatus("Deleting launch plan...");
    await persistMarketingConfig(next, "Launch plan deleted.");
  } catch (error) {
    setStatus(error.message || "Could not delete launch plan.", true);
  }
});

cancelLaunchEditButton?.addEventListener("click", () => {
  if (!launchPlanForm) return;
  launchPlanForm.reset();
  clearLaunchEditMode();
  renderLaunchProxyOptions();
  setStatus("Edit cancelled.");
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

forecastDialog?.addEventListener("focusin", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.type !== "number") return;
  queueMicrotask(() => {
    try {
      target.select();
    } catch (_error) {
      // Some browsers can be picky about selection APIs on certain input types.
    }
  });
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

resultsTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveResultsTab(button.dataset.resultsTab || "reorder");
  });
});

forecastProductMixInputs.addEventListener("input", () => {
  updateForecastMixTotal();
  syncForecastInputsFromProductLifts({ baselineUnits: baselineUnitsLookup(), readOnly: false });
});

resetForecastSettingsButton.addEventListener("click", () => {
  const baselineMix = baselineMixLookup();
  forecastMonthUplift.disabled = false;
  renderForecastProductMixInputs(
    { productMix: baselineMix, productLiftOverrides: defaultProductLiftOverrides() },
    {
      actualMix: baselineMix,
      actualMixLabel: "Baseline",
      baselineUnits: baselineUnitsLookup(),
      readOnly: false,
    },
  );
  if (forecastLiftGuidance) {
    forecastLiftGuidance.textContent = "Either set Target uplift, or set Lift % per product (then Target uplift auto-calculates).";
  }
});

forecastCopyMixApplyButton?.addEventListener("click", () => {
  if (!isEditableForecastMonth(activeForecastDialogMonth)) return;
  const selected = forecastCopyMixMonth instanceof HTMLSelectElement ? String(forecastCopyMixMonth.value || "") : "";
  if (!selected) {
    setStatus("Pick an actual month to copy its mix first.", true);
    return;
  }
  const ok = applyCopiedMixFromMonth(selected);
  if (!ok) {
    setStatus("Could not copy that month mix. Try a different month.", true);
    return;
  }
  setStatus(`Copied mix from ${monthLabelFromKey(selected)} actuals.`);
});

saveForecastSettingsButton.addEventListener("click", async () => {
  beginScreenBusy("Saving month plan...");
  try {
    const total = Array.from(forecastProductMixInputs.querySelectorAll("input[data-product-mix]")).reduce((sum, input) => sum + Number(input.value || 0), 0);
    if (Math.abs(total - 100) > 0.2) {
      setStatus("Product mix should add up to 100%.", true);
      return;
    }
    const productLiftOverrides = readForecastProductLiftOverrides();
    const computedFromLifts = calculateForecastFromProductLifts(productLiftOverrides, baselineUnitsLookup());
    const hasOverrides = CORE_PRODUCTS.some((product) => Math.abs(Number(productLiftOverrides[product] || 0)) > 0.0001);
    const productMix = Object.fromEntries(
      Array.from(forecastProductMixInputs.querySelectorAll("input[data-product-mix]")).map((input) => [String(input.dataset.productMix || ""), Number(input.value || 0)]),
    );
    const setting = {
      upliftPct: hasOverrides ? roundCurrency(computedFromLifts.upliftPct) : Number(forecastMonthUplift.value || 0),
      productMix,
      productLiftOverrides,
    };
    const payload = await fetchJson("/api/forecast-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthKey: activeForecastDialogMonth, setting }),
    });
    forecastSettings = normalizeForecastSettings({ forecastSettings: payload.forecastSettings || {} });
    renderForecastSummary();
    closeForecastDialog();
    await runPlanningFromForm(false);
    setStatus("Month forecast saved.");
  } catch (error) {
    setStatus(error.message || "Could not save month settings.", true);
  } finally {
    endScreenBusy();
  }
});

saveSettingsButton?.addEventListener("click", async (event) => {
  event.preventDefault();
  beginScreenBusy("Saving settings...");
  try {
    const unlocked = await ensureSettingsUnlocked();
    if (!unlocked) {
      setStatus("Settings are locked.", true);
      return;
    }
    const nextSettings = readPlannerSettingsForm();
    const payload = await fetchJson("/api/planner-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: nextSettings }),
    });
    sharedPlannerSettings = normalizePlannerSettings(payload.plannerSettings || nextSettings);
    renderPlannerSettings(sharedPlannerSettings);
    const excludeSpikesInput = document.getElementById("exclude-spikes");
    if (excludeSpikesInput) excludeSpikesInput.checked = sharedPlannerSettings?.global?.viralSmoothingEnabled ?? true;
    document.getElementById("lead-time-days").value = String(sharedPlannerSettings.global.defaultLeadTimeDays || 8);
    await runPlanningFromForm(false);
    setStatus("Shared planner settings saved.");
  } catch (error) {
    setStatus(error.message || "Could not save planner settings.", true);
  } finally {
    endScreenBusy();
  }
});

// Persist the "Viral outlier smoothing" toggle as the shared default when possible,
// so it sticks across browsers (including incognito).
const excludeSpikesToggle = document.getElementById("exclude-spikes");
excludeSpikesToggle?.addEventListener("change", async () => {
  if (!(excludeSpikesToggle instanceof HTMLInputElement)) return;
  const enabled = Boolean(excludeSpikesToggle.checked);
  const current = sharedPlannerSettings || defaultPlannerSettings();
  sharedPlannerSettings = normalizePlannerSettings({
    ...current,
    global: {
      ...(current.global || {}),
      viralSmoothingEnabled: enabled,
    },
  });
  renderPlannerSettings(sharedPlannerSettings);

  try {
    const auth = await getSettingsAuthStatus();
    if (auth?.enabled && !auth?.authed) {
      setStatus("Viral outlier smoothing updated for this run. To save it as the default, unlock Settings and save.", false);
      return;
    }
    const payload = await fetchJson("/api/planner-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: sharedPlannerSettings }),
    });
    sharedPlannerSettings = normalizePlannerSettings(payload.plannerSettings || sharedPlannerSettings);
    renderPlannerSettings(sharedPlannerSettings);
    setStatus(`Saved default: Viral outlier smoothing is now ${sharedPlannerSettings.global.viralSmoothingEnabled ? "on" : "off"}.`);
  } catch (error) {
    setStatus(error.message || "Could not save that setting.", true);
  }
});

addSkuMappingButton?.addEventListener("click", () => {
  const current = readSkuMappingTableRows();
  const blank = normalizeSkuMappingRow({ source: "override", skuId: "", productName: "", product1: "", product2: "", product3: "", product4: "" });
  renderSkuMappingTable([blank, ...current]);
});

saveSkuMappingButton?.addEventListener("click", async () => {
  beginScreenBusy("Saving SKU mapping...");
  try {
    await saveSkuMappingOverrides();
  } finally {
    endScreenBusy();
  }
});

skuMappingBody?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-sku-mapping-delete]");
  if (!button) return;
  const row = button.closest('tr[data-sku-mapping-row="true"]');
  if (!row) return;
  row.remove();
});

skuMappingBody?.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const row = target.closest('tr[data-sku-mapping-row="true"]');
  if (!row) return;

  const skuTypeSelect = row.querySelector('select[data-sku-map="skuType"]');
  const product1 = row.querySelector('input[data-sku-map="product1"]');
  const product2 = row.querySelector('input[data-sku-map="product2"]');
  const product3 = row.querySelector('input[data-sku-map="product3"]');
  const product4 = row.querySelector('input[data-sku-map="product4"]');

  const currentRow = normalizeSkuMappingRowForSave({
    skuType: skuTypeSelect ? skuTypeSelect.value : "",
    product1: product1 ? product1.value : "",
    product2: product2 ? product2.value : "",
    product3: product3 ? product3.value : "",
    product4: product4 ? product4.value : "",
  });

  if (target.matches('select[data-sku-map="skuType"]')) {
    if (product1) product1.value = currentRow.product1 || "";
    if (product2) product2.value = currentRow.product2 || "";
    if (product3) product3.value = currentRow.product3 || "";
    if (product4) product4.value = currentRow.product4 || "";
    return;
  }

  if (
    target.matches('input[data-sku-map="product1"]') ||
    target.matches('input[data-sku-map="product2"]') ||
    target.matches('input[data-sku-map="product3"]') ||
    target.matches('input[data-sku-map="product4"]')
  ) {
    if (skuTypeSelect instanceof HTMLSelectElement) {
      skuTypeSelect.value = normalizeSkuTypeForSelect("", currentRow);
    }
  }
});

railButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const target = button.dataset.pageTarget || "planning";
    if (target === "kpis" && hostedKpiButton?.dataset?.disabled === "true") {
      setStatus("TikTok KPIs: Coming soon.");
      return;
    }
    if (target === "settings") {
      const unlocked = await ensureSettingsUnlocked();
      if (!unlocked) return;
    }
    setActivePage(target);
  });
});

historyTabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveHistoryTab(button.dataset.historyTab || "monthly"));
});

historicalDemandTrendProduct?.addEventListener("change", () => {
  if (!(historicalDemandTrendProduct instanceof HTMLSelectElement)) return;
  activeHistoricalTrendProduct = historicalDemandTrendProduct.value || "__all__";
  if (latestPlanPayload?.historicalTrend) {
    renderHistoricalDemandTrendChart(latestPlanPayload.historicalTrend);
  }
});

historicalDemandTrendCompareToggle?.addEventListener("change", () => {
  if (!(historicalDemandTrendCompareToggle instanceof HTMLInputElement)) return;
  activeHistoricalTrendCompareEnabled = Boolean(historicalDemandTrendCompareToggle.checked);
  updateHistoricalTrendCompareVisibility();
  if (latestPlanPayload?.historicalTrend) {
    renderHistoricalDemandTrendChart(latestPlanPayload.historicalTrend);
  }
});

historicalDemandTrendProductB?.addEventListener("change", () => {
  if (!(historicalDemandTrendProductB instanceof HTMLSelectElement)) return;
  activeHistoricalTrendProductB = historicalDemandTrendProductB.value || "";
  if (latestPlanPayload?.historicalTrend) {
    renderHistoricalDemandTrendChart(latestPlanPayload.historicalTrend);
  }
});

historicalDemandTrendProductC?.addEventListener("change", () => {
  if (!(historicalDemandTrendProductC instanceof HTMLSelectElement)) return;
  activeHistoricalTrendProductC = historicalDemandTrendProductC.value || "";
  if (latestPlanPayload?.historicalTrend) {
    renderHistoricalDemandTrendChart(latestPlanPayload.historicalTrend);
  }
});

railToggle?.addEventListener("click", () => {
  const collapsed = !document.body.classList.contains("rail-collapsed");
  document.body.classList.toggle("rail-collapsed", collapsed);
  updateRailToggleLabel(collapsed);
  railToggle.setAttribute("aria-expanded", String(!collapsed));
  window.localStorage.setItem(FORECAST_STORAGE_KEY, collapsed ? "true" : "false");
});

kpiDetailToggle?.addEventListener("toggle", () => {
  const hint = kpiDetailToggle.querySelector(".disclosure-hint");
  if (hint) hint.textContent = kpiDetailToggle.open ? "Collapse" : "Expand";
});

setupDatePickers();
setActivePage("planning");
setActiveHistoryTab("monthly");
document.getElementById("open-launch-module")?.addEventListener("click", () => {
  setActivePage("launch-planning");
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    window.scrollTo(0, 0);
  }
});
try {
  const stored = window.localStorage.getItem(RESULTS_TAB_STORAGE_KEY);
  setActiveResultsTab(stored === "status" || stored === "history-only" ? stored : "reorder");
} catch {
  setActiveResultsTab("reorder");
}
if (window.localStorage.getItem(FORECAST_STORAGE_KEY) === "true") {
  document.body.classList.add("rail-collapsed");
  if (railToggle) {
    updateRailToggleLabel(true);
    railToggle.setAttribute("aria-expanded", "false");
  }
} else {
  updateRailToggleLabel(false);
}
syncHostedKpiAvailability();
setStoredPlannerDataSource(getStoredPlannerDataSource());
beginScreenBusy("Loading planner...");
loadWorkspace()
  .catch((error) => setStatus(error.message || "Could not load workspace.", true))
  .finally(() => endScreenBusy());
