import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { usesLocalPlannerData } from "./data-source-mode";
import { getFirebaseAdminDb } from "./firebase-admin";
import { getInventorySheetSource, loadLatestInventorySnapshot } from "./inventory-sheet";
import {
  campaignAverageLiftFactor,
  launchActiveDaysInHorizon,
  launchDailyDemandFromProxyAvg,
} from "./marketing-math";
import { computeBaselineDemandByProduct, type PlannerVelocityMode } from "./planner-math";
import { safetyStockWeeksForProduct } from "./safety-stock";
import {
  buildSkuSalesSummaryRows,
  expandMappedDemandRows,
  parseTiktokSkuMappingCsv,
  type DemandUploadInputRow,
  type SkuSalesSummaryRow,
  type TikTokSkuMapping,
} from "./sku-mapping";

type CampaignEventDoc = {
  id?: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  liftPct: number; // +40 means 40%
  createdAt?: string;
  updatedAt?: string;
};

type DemandDoc = {
  date: string;
  platform?: string;
  product_name: string;
  seller_sku_resolved?: string;
  net_units?: number;
  gross_sales?: number;
  net_gross_sales?: number;
};

type InventoryDoc = {
  snapshotDate: string;
  product_name: string;
  seller_sku_resolved?: string;
  on_hand?: number;
  in_transit?: number;
  transit_eta?: string | null;
  lead_time_days?: number | null;
  moq?: number | null;
  case_pack?: number | null;
};

type ForecastSettingDoc = {
  yearMonth: string;
  upliftPct?: number;
  productMix?: Record<string, number>;
};

type LaunchPlanDoc = {
  productName: string;
  proxyProductName?: string | null;
  launchDate?: string | null;
  endDate?: string | null; // optional LTO end date
  launchUnitsCommitted?: number;
  launchStrengthPct?: number;
  launchCoverWeeksTarget?: number;
  launchSampleUnits?: number;
  launchBundleUpliftPct?: number;
  cogs?: number;
  listPrice?: number;
};

type PlannerProductSettings = {
  cogs: number;
  moq: number;
  casePack: number;
  shelfLife: number;
  safetyStockWeeksOverride?: number; // 0 => use global half-year rule
};

type PlannerSharedSettings = {
  global: {
    defaultExpiryMonths: number;
    defaultLeadTimeDays: number;
    safetyStockWeeksH1: number; // Jan-Jun
    safetyStockWeeksH2: number; // Jul-Dec
  };
  products: Record<string, PlannerProductSettings>;
};

type UploadAuditDoc = {
  uploadType: "orders" | "samples";
  platform?: string;
  rawRowCount?: number;
  usableRowCount?: number;
  rowsWritten?: number;
  uploadedDates?: string[];
  firstDate?: string | null;
  lastDate?: string | null;
  uploadedAt?: string;
};

type MonthSummary = {
  totalUnits: number;
  grossSales: number;
  changePctVsPreviousMonth: number | null;
};

type SnapshotState = {
  campaigns: CampaignEventDoc[];
  demand: DemandDoc[];
  samples: DemandDoc[];
  skuSales: SkuSalesSummaryRow[];
  inventory: InventoryDoc[];
  forecastSettings: ForecastSettingDoc[];
  plannerSettings: PlannerSharedSettings;
  launchPlans: LaunchPlanDoc[];
  uploadAudits: {
    orders: UploadAuditDoc | null;
    samples: UploadAuditDoc | null;
  };
};

type LoadedState = {
  state: SnapshotState;
  source: "live" | "local" | "snapshot";
  detail: string;
  loadedAt: string;
};

type UploadedDemandRow = DemandUploadInputRow;
export type EditableSkuMappingRow = {
  skuId: string;
  productName: string;
  product1: string;
  product2: string;
  product3: string;
  product4: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FORECAST_DEFAULTS_FILE = path.join(DATA_DIR, "planner_forecast_defaults.json");
const PLANNER_SETTINGS_FILE = path.join(DATA_DIR, "planner_shared_settings.json");
const TIKTOK_SKU_MAPPING_FILE = path.join(DATA_DIR, "tiktok_sku_mapping.csv");
const LOCAL_SKU_MAPPING_OVERRIDE_FILE = path.join(process.cwd(), "..", "Data", "Tiktok SKU mapping - Sheet1.csv");
const LOCAL_SKU_SALES_FILE = path.join(DATA_DIR, "planning_sku_sales_daily.csv");
const LOCAL_UPLOAD_AUDIT_ORDERS_FILE = path.join(DATA_DIR, "planning_upload_audit_orders.json");
const LOCAL_UPLOAD_AUDIT_SAMPLES_FILE = path.join(DATA_DIR, "planning_upload_audit_samples.json");
const LOCAL_CAMPAIGNS_FILE = path.join(DATA_DIR, "planning_campaigns.json");
const LOCAL_LAUNCH_PLANS_FILE = path.join(DATA_DIR, "planning_launch_plans.json");
const LIVE_CACHE_MS = 5 * 60 * 1000;
const PRODUCT_METADATA: Record<
  string,
  {
    cogs: number;
    listPrice: number;
    launchDate?: string;
    launchInboundUnits?: number;
    launchTransitEta?: string;
    launchProxyProduct?: string;
    launchStrengthPct?: number;
    launchSampleUnits?: number;
    launchBundleUpliftPct?: number;
    launchCoverWeeksTarget?: number;
  }
> = {
  "Birria Bomb 2-Pack": { cogs: 3.1, listPrice: 19.99 },
  "Chile Colorado Bomb 2-Pack": {
    cogs: 3.95,
    listPrice: 19.99,
    launchDate: "2026-04-29",
    launchInboundUnits: 12096,
    launchTransitEta: "2026-04-29",
    launchProxyProduct: "Pozole Verde Bomb 2-Pack",
    launchStrengthPct: 100,
    launchSampleUnits: 0,
    launchBundleUpliftPct: 0,
    launchCoverWeeksTarget: 5,
  },
  "Pozole Bomb 2-Pack": { cogs: 3.05, listPrice: 19.99 },
  "Pozole Verde Bomb 2-Pack": { cogs: 3.75, listPrice: 19.99, launchDate: "2026-03-10" },
  "Tinga Bomb 2-Pack": { cogs: 3.15, listPrice: 19.99 },
  "Brine Bomb": { cogs: 4.2, listPrice: 19.99 },
  "Variety Pack": { cogs: 13.35, listPrice: 49.99 },
};

const CORE_PRODUCT_NAMES = Object.keys(PRODUCT_METADATA);

const DEFAULT_PLANNER_PRODUCT_SETTINGS: Record<string, PlannerProductSettings> = {
  "Birria Bomb 2-Pack": { cogs: 3.1, moq: 0, casePack: 24, shelfLife: 24 },
  "Chile Colorado Bomb 2-Pack": { cogs: 3.95, moq: 0, casePack: 24, shelfLife: 24 },
  "Pozole Bomb 2-Pack": { cogs: 3.05, moq: 0, casePack: 24, shelfLife: 24 },
  "Pozole Verde Bomb 2-Pack": { cogs: 3.75, moq: 0, casePack: 24, shelfLife: 24 },
  "Tinga Bomb 2-Pack": { cogs: 3.15, moq: 0, casePack: 24, shelfLife: 24 },
  "Brine Bomb": { cogs: 4.2, moq: 0, casePack: 24, shelfLife: 24 },
  "Variety Pack": { cogs: 13.35, moq: 0, casePack: 4, shelfLife: 24 },
};

let liveStateCache: { expiresAt: number; value: LoadedState } | null = null;
let snapshotStateCache: SnapshotState | null = null;

export function invalidateHostedPlannerCache() {
  liveStateCache = null;
  snapshotStateCache = null;
}

// Used by local-only config endpoints to keep overrides lean.
// Not intended for general app use (hence the name).
export function __unsafeGetBundledLaunchDefaults() {
  return buildLaunchPlans();
}

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function monthKey(value: string | Date) {
  const date = value instanceof Date ? value : toDate(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function addDays(value: string | Date, days: number) {
  const date = value instanceof Date ? new Date(value) : toDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function startOfNextMonth(value: string) {
  const date = toDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function endOfMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));
}

function daysInclusive(start: string, end: string) {
  const diff = toDate(end).getTime() - toDate(start).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

function overlapDaysInclusive(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const start = aStart >= bStart ? aStart : bStart;
  const end = aEnd <= bEnd ? aEnd : bEnd;
  return end >= start ? daysInclusive(start, end) : 0;
}

function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function normalizeEditableSkuMappingRows(raw: unknown): EditableSkuMappingRow[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Map<string, EditableSkuMappingRow>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<EditableSkuMappingRow>;
    const normalized = {
      skuId: cleanText(row.skuId),
      productName: cleanText(row.productName),
      product1: cleanText(row.product1),
      product2: cleanText(row.product2),
      product3: cleanText(row.product3),
      product4: cleanText(row.product4),
    };
    if (!(normalized.skuId && normalized.productName && (normalized.product1 || normalized.product2 || normalized.product3 || normalized.product4))) {
      continue;
    }
    const key = cleanText(normalized.skuId || normalized.productName).toLowerCase();
    unique.set(key, normalized);
  }
  return Array.from(unique.values());
}

function parseEditableSkuMappingCsv(text: string): EditableSkuMappingRow[] {
  return normalizeEditableSkuMappingRows(
    parseCsv(text).map((row) => ({
      skuId: String(row["SKU ID"] || ""),
      productName: String(row["Product Name"] || ""),
      product1: String(row["Product 1"] || ""),
      product2: String(row["Product 2"] || ""),
      product3: String(row["Product 3"] || ""),
      product4: String(row["Product 4"] || ""),
    })),
  );
}

function csvEscape(value: string) {
  const raw = String(value ?? "");
  if (raw.includes('"')) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw}"`;
  }
  return raw;
}

function stringifyEditableSkuMappingCsv(rows: EditableSkuMappingRow[]) {
  const header = ["SKU ID", "Product Name", "Product 1", "Product 2", "Product 3", "Product 4"];
  const lines = [header.join(",")];
  rows.forEach((row) => {
    lines.push(
      [row.skuId, row.productName, row.product1, row.product2, row.product3, row.product4]
        .map((cell) => csvEscape(cleanText(cell)))
        .join(","),
    );
  });
  return `${lines.join("\n")}\n`;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "Unknown error");
}

function isQuotaError(error: unknown) {
  const message = toErrorMessage(error).toLowerCase();
  return message.includes("resource_exhausted") || message.includes("quota exceeded");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv<T extends Record<string, unknown>>(headers: string[], rows: T[]) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n") + "\n";
}

function normalizeMixShare(value: unknown) {
  const numeric = asNumber(value);
  if (numeric <= 0) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

function normalizeMixMap(mix: Record<string, unknown> | null | undefined) {
  const entries = Object.entries(mix || {});
  const usesPercentPoints = entries.some(([, value]) => asNumber(value) > 1);
  return Object.fromEntries(
    entries.map(([product, value]) => {
      const numeric = asNumber(value);
      if (numeric <= 0) return [product, 0];
      return [product, usesPercentPoints ? numeric / 100 : normalizeMixShare(numeric)];
    }),
  );
}

function buildDefaultPlannerSettings(): PlannerSharedSettings {
  return {
    global: {
      defaultExpiryMonths: 24,
      defaultLeadTimeDays: 8,
      safetyStockWeeksH1: 3,
      safetyStockWeeksH2: 5,
    },
    products: Object.fromEntries(
      Object.entries(DEFAULT_PLANNER_PRODUCT_SETTINGS).map(([productName, setting]) => [
        productName,
        { ...setting, safetyStockWeeksOverride: 0 },
      ]),
    ),
  };
}

function normalizePlannerSharedSettings(rawSettings: unknown): PlannerSharedSettings {
  const defaults = buildDefaultPlannerSettings();
  const source = (rawSettings && typeof rawSettings === "object" ? rawSettings : {}) as Partial<PlannerSharedSettings>;
  const global: Partial<PlannerSharedSettings["global"]> = source.global && typeof source.global === "object" ? source.global : {};
  const products: Partial<Record<string, Partial<PlannerProductSettings>>> =
    source.products && typeof source.products === "object" ? source.products : {};

  return {
    global: {
      defaultExpiryMonths: Math.max(1, asNumber(global.defaultExpiryMonths) || defaults.global.defaultExpiryMonths),
      defaultLeadTimeDays: Math.max(1, asNumber(global.defaultLeadTimeDays) || defaults.global.defaultLeadTimeDays),
      safetyStockWeeksH1: Math.max(0, asNumber(global.safetyStockWeeksH1) || defaults.global.safetyStockWeeksH1),
      safetyStockWeeksH2: Math.max(0, asNumber(global.safetyStockWeeksH2) || defaults.global.safetyStockWeeksH2),
    },
    products: Object.fromEntries(
      CORE_PRODUCT_NAMES.map((productName) => {
        const defaultsForProduct = defaults.products[productName] || {
          cogs: asNumber(PRODUCT_METADATA[productName]?.cogs),
          moq: 0,
          casePack: 1,
          shelfLife: defaults.global.defaultExpiryMonths,
          safetyStockWeeksOverride: 0,
        };
        const productSettings = (products[productName] && typeof products[productName] === "object"
          ? products[productName]
          : {}) as Partial<PlannerProductSettings>;
        return [
          productName,
          {
            cogs: asNumber(productSettings.cogs) || defaultsForProduct.cogs,
            moq: Math.max(0, asNumber(productSettings.moq)),
            casePack: Math.max(0, asNumber(productSettings.casePack) || defaultsForProduct.casePack),
            shelfLife: Math.max(1, asNumber(productSettings.shelfLife) || defaultsForProduct.shelfLife),
            safetyStockWeeksOverride: Math.max(
              0,
              asNumber(productSettings.safetyStockWeeksOverride) || defaultsForProduct.safetyStockWeeksOverride || 0,
            ),
          },
        ];
      }),
    ),
  };
}

function normalizeUploadedDemandRows(rows: UploadedDemandRow[]) {
  const grouped = new Map<string, DemandDoc>();
  for (const row of rows) {
    const date = String(row.date || "").slice(0, 10);
    const productName = String(row.product_name || "").trim();
    if (!date || !productName) continue;
    const platform = String(row.platform || "TikTok").trim() || "TikTok";
    const key = `${platform}__${date}__${productName}`;
    const current = grouped.get(key) || {
      date,
      platform,
      product_name: productName,
      seller_sku_resolved: String(row.seller_sku_resolved || "").trim(),
      net_units: 0,
      gross_sales: 0,
      net_gross_sales: 0,
    };
    current.net_units = asNumber(current.net_units) + asNumber(row.net_units);
    current.gross_sales = asNumber(current.gross_sales) + asNumber(row.gross_sales);
    current.net_gross_sales = asNumber(current.net_gross_sales) + asNumber(row.net_gross_sales);
    if (!current.seller_sku_resolved) {
      current.seller_sku_resolved = String(row.seller_sku_resolved || "").trim();
    }
    grouped.set(key, current);
  }
  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date) || a.product_name.localeCompare(b.product_name));
}

function demandDocId(row: DemandDoc) {
  return Buffer.from(`${row.platform || "TikTok"}__${row.date}__${row.product_name}`, "utf8").toString("base64url");
}

function buildLaunchPlans() {
  return Object.entries(PRODUCT_METADATA)
    .filter(([, metadata]) => metadata.launchDate)
    .map(([productName, metadata]) => ({
      productName,
      proxyProductName: metadata.launchProxyProduct || productName,
      launchDate: metadata.launchDate || null,
      endDate: null,
      launchUnitsCommitted: metadata.launchInboundUnits || 0,
      launchStrengthPct: metadata.launchStrengthPct || 100,
      launchCoverWeeksTarget: metadata.launchCoverWeeksTarget || 0,
      launchSampleUnits: metadata.launchSampleUnits || 0,
      launchBundleUpliftPct: metadata.launchBundleUpliftPct || 0,
      cogs: metadata.cogs,
      listPrice: metadata.listPrice,
    }));
}

function normalizeCampaignEvents(raw: unknown): CampaignEventDoc[] {
  if (!Array.isArray(raw)) return [];
  const result: CampaignEventDoc[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Partial<CampaignEventDoc>;
    const name = cleanText(entry.name);
    const startDate = cleanText(entry.startDate).slice(0, 10);
    const endDate = cleanText(entry.endDate).slice(0, 10);
    const liftPct = asNumber(entry.liftPct);
    if (!name || !startDate || !endDate) continue;
    if (endDate < startDate) continue;
    result.push({
      id: cleanText(entry.id) || undefined,
      name,
      startDate,
      endDate,
      liftPct,
      createdAt: cleanText(entry.createdAt) || undefined,
      updatedAt: cleanText(entry.updatedAt) || undefined,
    });
  }
  return result.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
}

function normalizeLaunchPlanOverrides(raw: unknown): LaunchPlanDoc[] {
  if (!Array.isArray(raw)) return [];
  const result: LaunchPlanDoc[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Partial<LaunchPlanDoc>;
    const productName = cleanText(entry.productName);
    if (!productName) continue;
    const proxyProductName = cleanText(entry.proxyProductName) || null;
    const launchDate = cleanText(entry.launchDate).slice(0, 10) || null;
    const endDate = cleanText(entry.endDate).slice(0, 10) || null;
    if (endDate && launchDate && endDate < launchDate) continue;
    result.push({
      productName,
      proxyProductName,
      launchDate,
      endDate,
      launchUnitsCommitted: Math.max(0, asNumber(entry.launchUnitsCommitted)),
      launchStrengthPct: Math.max(0, asNumber(entry.launchStrengthPct || 100)),
      launchCoverWeeksTarget: Math.max(0, asNumber(entry.launchCoverWeeksTarget)),
      launchSampleUnits: Math.max(0, asNumber(entry.launchSampleUnits)),
      launchBundleUpliftPct: Math.max(0, asNumber(entry.launchBundleUpliftPct)),
      cogs: asNumber(entry.cogs) || undefined,
      listPrice: asNumber(entry.listPrice) || undefined,
    });
  }
  return result.sort((a, b) => a.productName.localeCompare(b.productName));
}

function hydrateLaunchPlans(plans: LaunchPlanDoc[]) {
  return plans.map((plan) => {
    const productName = cleanText(plan.productName);
    const metadata = PRODUCT_METADATA[productName];
    return {
      ...plan,
      productName,
      proxyProductName: cleanText(plan.proxyProductName) || metadata?.launchProxyProduct || productName,
      launchDate: cleanText(plan.launchDate).slice(0, 10) || null,
      endDate: cleanText(plan.endDate).slice(0, 10) || null,
      launchUnitsCommitted: asNumber(plan.launchUnitsCommitted),
      launchStrengthPct: asNumber(plan.launchStrengthPct) || 100,
      cogs: plan.cogs ?? metadata?.cogs,
      listPrice: plan.listPrice ?? metadata?.listPrice,
    } satisfies LaunchPlanDoc;
  });
}

function campaignLiftByDate(campaigns: CampaignEventDoc[], rangeStart: string, rangeEnd: string) {
  const map = new Map<string, number>();
  for (const campaign of campaigns) {
    const liftPct = asNumber(campaign.liftPct);
    if (!liftPct) continue;
    const start = campaign.startDate > rangeStart ? campaign.startDate : rangeStart;
    const end = campaign.endDate < rangeEnd ? campaign.endDate : rangeEnd;
    if (end < start) continue;
    for (let cursor = start; cursor <= end; cursor = formatDate(addDays(cursor, 1))) {
      map.set(cursor, (map.get(cursor) || 0) + (liftPct / 100));
    }
  }
  return map;
}

function campaignAverageFactor(campaigns: CampaignEventDoc[], rangeStart: string, rangeEnd: string) {
  const days = daysInclusive(rangeStart, rangeEnd);
  if (days <= 0) return 1;
  const liftSum = Array.from(campaignLiftByDate(campaigns, rangeStart, rangeEnd).values()).reduce((sum, value) => sum + value, 0);
  return 1 + (liftSum / days);
}

async function loadBundledState() {
  if (snapshotStateCache) {
    return snapshotStateCache;
  }

  const [demandCsv, samplesCsv, inventoryCsv, skuSalesCsv, forecastDefaultsText, plannerSettingsText, ordersAuditText, samplesAuditText, campaignsText, launchPlansText] = await Promise.all([
    readFile(path.join(DATA_DIR, "planning_demand_daily.csv"), "utf8"),
    readFile(path.join(DATA_DIR, "planning_samples_daily.csv"), "utf8"),
    readFile(path.join(DATA_DIR, "planning_inventory_daily.csv"), "utf8"),
    readFile(LOCAL_SKU_SALES_FILE, "utf8").catch(() => ""),
    readFile(FORECAST_DEFAULTS_FILE, "utf8"),
    readFile(PLANNER_SETTINGS_FILE, "utf8").catch(() => JSON.stringify(buildDefaultPlannerSettings())),
    readFile(LOCAL_UPLOAD_AUDIT_ORDERS_FILE, "utf8").catch(() => ""),
    readFile(LOCAL_UPLOAD_AUDIT_SAMPLES_FILE, "utf8").catch(() => ""),
    readFile(LOCAL_CAMPAIGNS_FILE, "utf8").catch(() => ""),
    readFile(LOCAL_LAUNCH_PLANS_FILE, "utf8").catch(() => ""),
  ]);

  const demand = parseCsv(demandCsv).map((row) => ({
    date: String(row.date || ""),
    platform: String(row.platform || "TikTok"),
    product_name: String(row.product_name || ""),
    seller_sku_resolved: String(row.seller_sku_resolved || ""),
    net_units: asNumber(row.net_units),
    gross_sales: asNumber(row.gross_sales),
    net_gross_sales: asNumber(row.net_gross_sales),
  }));

  const samples = parseCsv(samplesCsv).map((row) => ({
    date: String(row.date || ""),
    platform: String(row.platform || "TikTok"),
    product_name: String(row.product_name || ""),
    seller_sku_resolved: String(row.seller_sku_resolved || ""),
    net_units: asNumber(row.net_units),
    gross_sales: asNumber(row.gross_sales),
    net_gross_sales: asNumber(row.net_gross_sales),
  }));

  const skuSales: SkuSalesSummaryRow[] = parseCsv(skuSalesCsv).map((row) => ({
    date: String(row.date || ""),
    platform: String(row.platform || "TikTok"),
    sku_id: String(row.sku_id || ""),
    product_name: String(row.product_name || ""),
    sku_type: row.sku_type === "virtual_bundle" ? "virtual_bundle" : "core",
    core_products: String(row.core_products || ""),
    units_sold: asNumber(row.units_sold),
    gross_sales: asNumber(row.gross_sales),
    avg_gross_per_unit: asNumber(row.avg_gross_per_unit),
    net_gross_sales: asNumber(row.net_gross_sales),
    avg_net_gross_per_unit: asNumber(row.avg_net_gross_per_unit),
  }));

  const inventoryRows: InventoryDoc[] = parseCsv(inventoryCsv).map((row) => ({
    snapshotDate: String(row.date || ""),
    product_name: String(row.product_name || ""),
    seller_sku_resolved: "",
    on_hand: asNumber(row.on_hand),
    in_transit: asNumber(row.in_transit),
    transit_eta: null,
    lead_time_days: null,
    moq: null,
    case_pack: null,
  }));

  const latestSnapshotDate = inventoryRows.at(-1)?.snapshotDate || formatDate(new Date());
  const inventory = [...inventoryRows];
  for (const [productName, metadata] of Object.entries(PRODUCT_METADATA)) {
    if (inventory.some((row) => row.product_name === productName && row.snapshotDate === latestSnapshotDate)) {
      continue;
    }
    if (!metadata.launchInboundUnits) {
      continue;
    }
    inventory.push({
      snapshotDate: latestSnapshotDate,
      product_name: productName,
      seller_sku_resolved: "",
      on_hand: 0,
      in_transit: metadata.launchInboundUnits,
      transit_eta: metadata.launchTransitEta || null,
      lead_time_days: null,
      moq: null,
      case_pack: null,
    });
  }

  const forecastDefaults = JSON.parse(forecastDefaultsText) as {
    months?: Record<string, { upliftPct?: number; productMix?: Record<string, number> }>;
  };
  const forecastSettings = Object.entries(forecastDefaults.months || {}).map(([yearMonth, setting]) => ({
    yearMonth,
    upliftPct: asNumber(setting?.upliftPct),
    productMix: setting?.productMix || {},
  }));
  const plannerSettings = normalizePlannerSharedSettings(JSON.parse(plannerSettingsText));
  const ordersAudit = ordersAuditText ? (JSON.parse(ordersAuditText) as UploadAuditDoc) : null;
  const samplesAudit = samplesAuditText ? (JSON.parse(samplesAuditText) as UploadAuditDoc) : null;
  let campaignsParsed: unknown = [];
  if (campaignsText) {
    try {
      campaignsParsed = JSON.parse(campaignsText) as unknown;
    } catch {
      campaignsParsed = [];
    }
  }
  let launchPlansParsed: unknown = [];
  if (launchPlansText) {
    try {
      launchPlansParsed = JSON.parse(launchPlansText) as unknown;
    } catch {
      launchPlansParsed = [];
    }
  }
  const campaigns = normalizeCampaignEvents(campaignsParsed);
  const launchOverrides = normalizeLaunchPlanOverrides(launchPlansParsed);
  const launchPlans = hydrateLaunchPlans(
    Array.from(
      new Map<string, LaunchPlanDoc>([
        ...buildLaunchPlans().map((plan) => [plan.productName, plan] as const),
        ...launchOverrides.map((plan) => [plan.productName, plan] as const),
      ]).values(),
    ),
  );

  snapshotStateCache = {
    campaigns,
    demand: demand.sort((a, b) => a.date.localeCompare(b.date)),
    samples: samples.sort((a, b) => a.date.localeCompare(b.date)),
    skuSales: skuSales.sort((a, b) => a.date.localeCompare(b.date) || a.sku_type.localeCompare(b.sku_type) || a.product_name.localeCompare(b.product_name)),
    inventory: inventory.sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate) || a.product_name.localeCompare(b.product_name)),
    forecastSettings,
    plannerSettings,
    launchPlans,
    uploadAudits: {
      orders: ordersAudit,
      samples: samplesAudit,
    },
  };

  return snapshotStateCache;
}

async function readCollection<T>(name: string) {
  const snapshot = await getFirebaseAdminDb().collection(name).get();
  return snapshot.docs.map((doc) => doc.data() as T);
}

export async function loadHostedSkuMappingOverrides() {
  if (usesLocalPlannerData()) {
    const localText = await readFile(LOCAL_SKU_MAPPING_OVERRIDE_FILE, "utf8").catch(() => "");
    return parseEditableSkuMappingCsv(localText);
  }
  const doc = await readDoc<{ rows?: EditableSkuMappingRow[] }>("planningSettings", "sku_mapping");
  return normalizeEditableSkuMappingRows(doc?.rows || []);
}

export async function saveHostedSkuMappingOverrides(rows: unknown) {
  const payload = normalizeEditableSkuMappingRows(rows);

  if (usesLocalPlannerData()) {
    await writeFile(LOCAL_SKU_MAPPING_OVERRIDE_FILE, stringifyEditableSkuMappingCsv(payload), "utf8");
    snapshotStateCache = null;
    return payload;
  }

  await getFirebaseAdminDb().collection("planningSettings").doc("sku_mapping").set(
    {
      rows: payload,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
  liveStateCache = null;
  return payload;
}

async function loadTikTokSkuMappings() {
  const loaded: Array<{ source: string; mappings: TikTokSkuMapping[] }> = [];
  const errors: string[] = [];

  try {
    const csv = await readFile(TIKTOK_SKU_MAPPING_FILE, "utf8");
    const mappings = parseTiktokSkuMappingCsv(csv);
    if (mappings.length) {
      loaded.push({ source: TIKTOK_SKU_MAPPING_FILE, mappings });
    } else {
      errors.push(`${TIKTOK_SKU_MAPPING_FILE}: no usable rows`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "Unknown error");
    errors.push(`${TIKTOK_SKU_MAPPING_FILE}: ${message}`);
  }

  try {
    const overrideRows = await loadHostedSkuMappingOverrides();
    if (overrideRows.length) {
      const mappings = parseTiktokSkuMappingCsv(stringifyEditableSkuMappingCsv(overrideRows));
      if (mappings.length) {
        loaded.push({ source: usesLocalPlannerData() ? LOCAL_SKU_MAPPING_OVERRIDE_FILE : "planningSettings/sku_mapping", mappings });
      } else {
        errors.push("sku mapping overrides: no usable rows");
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "Unknown error");
    errors.push(`sku mapping overrides: ${message}`);
  }

  if (!loaded.length) {
    throw new Error(`Could not load TikTok SKU mapping. Errors: ${errors.join(" | ")}`);
  }

  const keyFor = (mapping: TikTokSkuMapping) =>
    String(mapping.skuId || mapping.productName || "")
      .trim()
      .toLowerCase();

  // Merge: bundled mapping first, then local overrides when present.
  const merged = new Map<string, TikTokSkuMapping>();
  for (const entry of loaded) {
    for (const mapping of entry.mappings) {
      merged.set(keyFor(mapping), mapping);
    }
  }

  return Array.from(merged.values());
}

async function readDoc<T>(collectionName: string, docId: string) {
  const snapshot = await getFirebaseAdminDb().collection(collectionName).doc(docId).get();
  return snapshot.exists ? (snapshot.data() as T) : null;
}

async function deleteDocsByDates(collectionName: string, fieldName: string, dates: string[]) {
  const db = getFirebaseAdminDb();
  for (const dateChunk of chunkArray(uniqueSorted(dates), 10)) {
    if (!dateChunk.length) continue;
    const snapshot = await db.collection(collectionName).where(fieldName, "in", dateChunk).get();
    for (const docChunk of chunkArray(snapshot.docs, 400)) {
      const batch = db.batch();
      docChunk.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }
}

async function writeDemandDocs(collectionName: string, rows: DemandDoc[]) {
  const db = getFirebaseAdminDb();
  for (const rowChunk of chunkArray(rows, 400)) {
    const batch = db.batch();
    rowChunk.forEach((row) => {
      const ref = db.collection(collectionName).doc(demandDocId(row));
      batch.set(ref, row, { merge: true });
    });
    await batch.commit();
  }
}

async function saveLocalDemandDocs(collectionName: "planningDemandDaily" | "planningSamplesDaily", rows: DemandDoc[], uploadedDates: string[]) {
  const fileName = collectionName === "planningSamplesDaily" ? "planning_samples_daily.csv" : "planning_demand_daily.csv";
  const filePath = path.join(DATA_DIR, fileName);
  const existingText = await readFile(filePath, "utf8").catch(() => "");
  const existingRows: DemandDoc[] = parseCsv(existingText).map((row) => ({
    date: String(row.date || ""),
    platform: String(row.platform || "TikTok"),
    product_name: String(row.product_name || ""),
    seller_sku_resolved: String(row.seller_sku_resolved || ""),
    net_units: asNumber(row.net_units),
    gross_sales: asNumber(row.gross_sales),
    net_gross_sales: asNumber(row.net_gross_sales),
  }));
  const uploadDateSet = new Set(uploadedDates);
  const mergedRows = [
    ...existingRows.filter((row) => !uploadDateSet.has(row.date)),
    ...rows,
  ].sort((a, b) => a.date.localeCompare(b.date) || a.product_name.localeCompare(b.product_name));
  await writeFile(
    filePath,
    toCsv(["platform", "date", "product_name", "seller_sku_resolved", "net_units", "gross_sales", "net_gross_sales"], mergedRows as unknown as Record<string, unknown>[]),
    "utf8",
  );
}

function skuSalesDocId(row: SkuSalesSummaryRow) {
  return Buffer.from(`${row.platform || "TikTok"}__${row.date}__${row.sku_id}__${row.product_name}`, "utf8").toString("base64url");
}

async function saveLocalSkuSalesDocs(rows: SkuSalesSummaryRow[], uploadedDates: string[]) {
  const existingText = await readFile(LOCAL_SKU_SALES_FILE, "utf8").catch(() => "");
  const existingRows: SkuSalesSummaryRow[] = parseCsv(existingText).map((row) => ({
    date: String(row.date || ""),
    platform: String(row.platform || "TikTok"),
    sku_id: String(row.sku_id || ""),
    product_name: String(row.product_name || ""),
    sku_type: row.sku_type === "virtual_bundle" ? "virtual_bundle" : "core",
    core_products: String(row.core_products || ""),
    units_sold: asNumber(row.units_sold),
    gross_sales: asNumber(row.gross_sales),
    avg_gross_per_unit: asNumber(row.avg_gross_per_unit),
    net_gross_sales: asNumber(row.net_gross_sales),
    avg_net_gross_per_unit: asNumber(row.avg_net_gross_per_unit),
  }));
  const uploadDateSet = new Set(uploadedDates);
  const mergedRows = [
    ...existingRows.filter((row) => !uploadDateSet.has(row.date)),
    ...rows,
  ].sort((a, b) => a.date.localeCompare(b.date) || a.sku_type.localeCompare(b.sku_type) || a.product_name.localeCompare(b.product_name));
  await writeFile(
    LOCAL_SKU_SALES_FILE,
    toCsv(["date", "platform", "sku_id", "product_name", "sku_type", "core_products", "units_sold", "gross_sales", "avg_gross_per_unit", "net_gross_sales", "avg_net_gross_per_unit"], mergedRows as unknown as Record<string, unknown>[]),
    "utf8",
  );
}

async function writeSkuSalesDocs(rows: SkuSalesSummaryRow[]) {
  const db = getFirebaseAdminDb();
  for (const rowChunk of chunkArray(rows, 400)) {
    const batch = db.batch();
    rowChunk.forEach((row) => {
      const ref = db.collection("planningSkuSalesDaily").doc(skuSalesDocId(row));
      batch.set(ref, row, { merge: true });
    });
    await batch.commit();
  }
}

async function writeInventoryDocs(rows: InventoryDoc[]) {
  const db = getFirebaseAdminDb();
  for (const rowChunk of chunkArray(rows, 400)) {
    const batch = db.batch();
    rowChunk.forEach((row) => {
      const slug = String(row.product_name || "unknown")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "unknown";
      const ref = db.collection("inventorySnapshots").doc(`${row.snapshotDate}__${slug}`);
      batch.set(ref, row, { merge: true });
    });
    await batch.commit();
  }
}

async function loadLiveState(forceRefresh = false): Promise<LoadedState> {
  const now = Date.now();
  if (!forceRefresh && liveStateCache && liveStateCache.expiresAt > now) {
    return liveStateCache.value;
  }

  const [demand, samples, skuSales, inventory, forecastSettings, plannerSettingsDoc, launchPlansRaw, campaignsRaw, ordersUploadAudit, samplesUploadAudit] = await Promise.all([
    readCollection<DemandDoc>("planningDemandDaily"),
    readCollection<DemandDoc>("planningSamplesDaily"),
    readCollection<SkuSalesSummaryRow>("planningSkuSalesDaily"),
    readCollection<InventoryDoc>("inventorySnapshots"),
    readCollection<ForecastSettingDoc>("forecastSettings"),
    readDoc<PlannerSharedSettings>("planningSettings", "shared"),
    readCollection<LaunchPlanDoc>("launchPlans"),
    readCollection<CampaignEventDoc>("campaignEvents"),
    readDoc<UploadAuditDoc>("planningUploadAudit", "orders"),
    readDoc<UploadAuditDoc>("planningUploadAudit", "samples"),
  ]);

  const launchPlans = hydrateLaunchPlans(
    Array.from(
      new Map<string, LaunchPlanDoc>([
        ...buildLaunchPlans().map((plan) => [plan.productName, plan] as const),
        ...normalizeLaunchPlanOverrides(launchPlansRaw).map((plan) => [plan.productName, plan] as const),
      ]).values(),
    ),
  );
  const campaigns = normalizeCampaignEvents(campaignsRaw);

  const value: LoadedState = {
    state: {
      campaigns,
      demand: demand.sort((a, b) => a.date.localeCompare(b.date)),
      samples: samples.sort((a, b) => a.date.localeCompare(b.date)),
      skuSales: skuSales.sort((a, b) => a.date.localeCompare(b.date) || a.sku_type.localeCompare(b.sku_type) || a.product_name.localeCompare(b.product_name)),
      inventory: inventory.sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate) || a.product_name.localeCompare(b.product_name)),
      forecastSettings,
      plannerSettings: normalizePlannerSharedSettings(plannerSettingsDoc),
      launchPlans,
      uploadAudits: {
        orders: ordersUploadAudit,
        samples: samplesUploadAudit,
      },
    },
    source: "live",
    detail: "Live Firestore",
    loadedAt: new Date().toISOString(),
  };

  liveStateCache = {
    value,
    expiresAt: now + LIVE_CACHE_MS,
  };

  return value;
}

async function loadState(options: { forceRefresh?: boolean } = {}): Promise<LoadedState> {
  if (usesLocalPlannerData()) {
    if (options.forceRefresh) {
      snapshotStateCache = null;
    }
    const snapshotState = await loadBundledState();
    return {
      state: snapshotState,
      source: "local",
      detail: "Local lean snapshot",
      loadedAt: new Date().toISOString(),
    };
  }

  try {
    return await loadLiveState(Boolean(options.forceRefresh));
  } catch (error) {
    const snapshotState = await loadBundledState();
    return {
      state: snapshotState,
      source: "snapshot",
      detail: isQuotaError(error) ? "Snapshot fallback after Firestore quota limit" : `Snapshot fallback after live read failed: ${toErrorMessage(error)}`,
      loadedAt: new Date().toISOString(),
    };
  }
}

function buildForecastMaps(forecastSettings: ForecastSettingDoc[]) {
  const defaults: Record<string, number> = {};
  const settings: Record<string, { upliftPct: number; productMix: Record<string, number> }> = {};

  for (const entry of forecastSettings) {
    defaults[entry.yearMonth] = asNumber(entry.upliftPct);
    settings[entry.yearMonth] = {
      upliftPct: asNumber(entry.upliftPct),
      productMix: entry.productMix || {},
    };
  }

  return { defaults, settings };
}

function buildMonthlyActuals(demand: DemandDoc[]) {
  const monthTotals = new Map<string, MonthSummary>();
  const monthMix = new Map<string, Record<string, number>>();
  const productMonthly = new Map<string, Map<string, number>>();

  for (const row of demand) {
    const key = monthKey(row.date);
    const current = monthTotals.get(key) || { totalUnits: 0, grossSales: 0, changePctVsPreviousMonth: null };
    current.totalUnits += asNumber(row.net_units);
    current.grossSales += asNumber(row.gross_sales);
    monthTotals.set(key, current);

    const mix = monthMix.get(key) || {};
    mix[row.product_name] = (mix[row.product_name] || 0) + asNumber(row.net_units);
    monthMix.set(key, mix);

    const product = productMonthly.get(row.product_name) || new Map<string, number>();
    product.set(key, (product.get(key) || 0) + asNumber(row.net_units));
    productMonthly.set(row.product_name, product);
  }

  const orderedKeys = Array.from(monthTotals.keys()).sort();
  let previousUnits: number | null = null;
  const monthlyActuals: Record<string, MonthSummary> = {};
  const monthlyActualMix: Record<string, Record<string, number>> = {};

  for (const key of orderedKeys) {
    const totals = monthTotals.get(key)!;
    monthlyActuals[key] = {
      ...totals,
      changePctVsPreviousMonth: previousUnits && previousUnits > 0 ? ((totals.totalUnits - previousUnits) / previousUnits) * 100 : null,
    };
    previousUnits = totals.totalUnits;

    const mix = monthMix.get(key) || {};
    const totalUnits = Object.values(mix).reduce((sum, value) => sum + value, 0);
    monthlyActualMix[key] = Object.fromEntries(
      Object.entries(mix).map(([product, units]) => [product, totalUnits > 0 ? (units / totalUnits) * 100 : 0]),
    );
  }

  return { monthlyActuals, monthlyActualMix, productMonthly };
}

function latestInventoryByProduct(inventory: InventoryDoc[]) {
  const latestByProduct = new Map<string, InventoryDoc>();
  for (const row of inventory) {
    const current = latestByProduct.get(row.product_name);
    if (!current || row.snapshotDate > current.snapshotDate) {
      latestByProduct.set(row.product_name, row);
    }
  }
  return latestByProduct;
}

function getUnitCogs(productName: string, launchPlans: LaunchPlanDoc[]) {
  return asNumber(PRODUCT_METADATA[productName]?.cogs ?? launchPlans.find((plan) => plan.productName === productName)?.cogs);
}

function buildWorkspace(stateInfo: LoadedState) {
  const state = stateInfo.state;
  const latestDemandDate = state.demand.at(-1)?.date || formatDate(new Date());
  const baselineEnd = latestDemandDate;
  const baselineStart = formatDate(addDays(latestDemandDate, -29));
  const horizonStartDate = startOfNextMonth(latestDemandDate);
  const horizonEndDate = endOfMonth(horizonStartDate);
  const { defaults, settings } = buildForecastMaps(state.forecastSettings);
  const { monthlyActuals, monthlyActualMix } = buildMonthlyActuals(state.demand);
  const latestInventoryDate = state.inventory.at(-1)?.snapshotDate || null;

  return {
    inventoryUploaded: true,
    inventoryTemplate: [],
    summary: {
      orders_loaded: state.demand.length,
      samples_loaded: state.samples.length,
      products_detected: uniqueSorted(state.demand.map((row) => row.product_name)).length,
      date_start: state.demand[0]?.date || null,
      date_end: latestDemandDate,
      data_as_of: latestDemandDate,
      data_source: stateInfo.source,
      data_source_detail: stateInfo.detail,
      data_loaded_at: stateInfo.loadedAt,
      inventory_as_of: latestInventoryDate,
      inventory_rows: latestInventoryByProduct(state.inventory).size,
      latest_order_upload: state.uploadAudits.orders,
      latest_sample_upload: state.uploadAudits.samples,
    },
    defaults: {
      baselineStart,
      baselineEnd,
      horizonStart: formatDate(horizonStartDate),
      horizonEnd: formatDate(horizonEndDate),
      velocityMode: "sales_only",
      excludeSpikes: true,
      upliftPct: defaults[monthKey(horizonStartDate)] ?? 30,
      leadTimeDays: state.plannerSettings.global.defaultLeadTimeDays,
      safetyRule: `${Math.max(0, asNumber(state.plannerSettings.global.safetyStockWeeksH1))} weeks in Jan-Jun. ${Math.max(
        0,
        asNumber(state.plannerSettings.global.safetyStockWeeksH2),
      )} weeks in Jul-Dec.`,
      forecastYear: horizonStartDate.getUTCFullYear(),
      forecastDefaults: defaults,
      forecastSettings: settings,
      sharedSettings: state.plannerSettings,
      monthlyActualMix,
      monthlyActuals,
    },
  };
}

export async function getHostedWorkspace(options: { forceRefresh?: boolean } = {}) {
  return buildWorkspace(await loadState(options));
}

function buildHistoricalTrend(productMonthly: Map<string, Map<string, number>>, focusYear: number) {
  const years = uniqueSorted(
    Array.from(productMonthly.values()).flatMap((months) => Array.from(months.keys()).map((key) => key.slice(0, 4))),
  ).map(Number);

  const monthlyTotals = years.map((year) => {
    const row: Record<string, number> & { year: number; year_total_units: number } = { year, year_total_units: 0 };
    for (let month = 1; month <= 12; month += 1) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const total = Array.from(productMonthly.values()).reduce((sum, months) => sum + (months.get(key) || 0), 0);
      row[key] = total;
      row.year_total_units += total;
    }
    return row;
  });

  const productRows = Array.from(productMonthly.entries()).map(([productName, months]) => {
    const row: Record<string, number | string> = { product_name: productName, year_total_units: 0 };
    for (let month = 1; month <= 12; month += 1) {
      const key = `${focusYear}-${String(month).padStart(2, "0")}`;
      const units = months.get(key) || 0;
      row[key] = units;
      row.year_total_units = asNumber(row.year_total_units) + units;
    }
    return row;
  });

  const yoyByMonth = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const currentKey = `${focusYear}-${String(month).padStart(2, "0")}`;
    const previousKey = `${focusYear - 1}-${String(month).padStart(2, "0")}`;
    const currentUnits = Array.from(productMonthly.values()).reduce((sum, months) => sum + (months.get(currentKey) || 0), 0);
    const previousUnits = Array.from(productMonthly.values()).reduce((sum, months) => sum + (months.get(previousKey) || 0), 0);
    return {
      label: new Date(Date.UTC(focusYear, index, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      previous_units: previousUnits,
      current_units: currentUnits,
      yoy_pct: previousUnits > 0 ? (currentUnits - previousUnits) / previousUnits : null,
    };
  });

  return {
    years,
    monthlyTotals,
    productMonthly: productRows,
    yoyByMonth,
  };
}

function buildLaunchPlanning(
  launchPlans: LaunchPlanDoc[],
  baselineDemand: Map<string, { salesUnits: number; avgDailyDemand: number }>,
) {
  return {
    rows: launchPlans.map((plan) => {
      const proxyName = plan.proxyProductName || plan.productName;
      const proxy = baselineDemand.get(proxyName) || { salesUnits: 0, avgDailyDemand: 0 };
      const strength = asNumber(plan.launchStrengthPct) > 0 ? asNumber(plan.launchStrengthPct) / 100 : 1;
      const baseDaily = proxy.avgDailyDemand * strength;
      const lowDaily = baseDaily * 0.8;
      const highDaily = baseDaily * 1.2;
      const committed = asNumber(plan.launchUnitsCommitted);
      return {
        product_name: plan.productName,
        launch_date: plan.launchDate || "",
        proxy_product_name: proxyName,
        proxy_first_7_day_units: proxy.avgDailyDemand * 7,
        proxy_first_14_day_units: proxy.avgDailyDemand * 14,
        proxy_first_30_day_units: proxy.avgDailyDemand * 30,
        proxy_first_30_day_daily_velocity: proxy.avgDailyDemand,
        launch_units_committed: committed,
        launch_cover_weeks_target: asNumber(plan.launchCoverWeeksTarget),
        low_daily_velocity: lowDaily,
        base_daily_velocity: baseDaily,
        high_daily_velocity: highDaily,
        low_weeks_of_cover: lowDaily > 0 ? committed / (lowDaily * 7) : null,
        base_weeks_of_cover: baseDaily > 0 ? committed / (baseDaily * 7) : null,
        high_weeks_of_cover: highDaily > 0 ? committed / (highDaily * 7) : null,
        base_send_units: Math.max(0, asNumber(plan.launchCoverWeeksTarget) * 7 * baseDaily - committed),
      };
    }),
  };
}

function buildSkuSalesSummary(skuSalesRows: SkuSalesSummaryRow[], start: string, end: string) {
  const grouped = new Map<string, SkuSalesSummaryRow>();

  skuSalesRows
    .filter((row) => inRange(row.date, start, end))
    .forEach((row) => {
      const key = `${row.sku_type}__${row.sku_id}__${row.product_name}`;
      const current = grouped.get(key) || {
        date: `${start} to ${end}`,
        platform: row.platform || "TikTok",
        sku_id: row.sku_id,
        product_name: row.product_name,
        sku_type: row.sku_type,
        core_products: row.core_products,
        units_sold: 0,
        gross_sales: 0,
        avg_gross_per_unit: 0,
        net_gross_sales: 0,
        avg_net_gross_per_unit: 0,
      };
      current.units_sold += asNumber(row.units_sold);
      current.gross_sales += asNumber(row.gross_sales);
      current.avg_gross_per_unit = current.units_sold > 0 ? current.gross_sales / current.units_sold : 0;
      const explicitNet = asNumber(row.net_gross_sales);
      if (explicitNet > 0) {
        current.net_gross_sales += explicitNet;
      } else if (asNumber(row.units_sold) > 0) {
        // Back-compat: older lean snapshots stored net_gross_sales as 0 even for positive units.
        current.net_gross_sales += asNumber(row.gross_sales);
      }
      current.avg_net_gross_per_unit = current.units_sold > 0 ? current.net_gross_sales / current.units_sold : 0;
      grouped.set(key, current);
    });

  return {
    rows: Array.from(grouped.values()).sort(
      (a, b) =>
        a.sku_type.localeCompare(b.sku_type) ||
        b.gross_sales - a.gross_sales ||
        a.product_name.localeCompare(b.product_name),
    ),
    sourceRows: skuSalesRows.length,
  };
}

export async function runHostedPlanning(params: {
  baselineStart?: string;
  baselineEnd?: string;
  horizonStart?: string;
  horizonEnd?: string;
  velocityMode?: string;
  excludeSpikes?: boolean;
  leadTimeDays?: number;
  monthlyForecastSettings?: Record<string, { upliftPct?: number; productMix?: Record<string, number> }>;
  upliftPct?: number;
  planningYear?: number;
  customSettings?: PlannerSharedSettings;
}, options: { forceRefresh?: boolean } = {}) {
  const stateInfo = await loadState(options);
  const state = stateInfo.state;
  const workspace = buildWorkspace(stateInfo);
  const baselineStart = params.baselineStart || workspace.defaults.baselineStart;
  const baselineEnd = params.baselineEnd || workspace.defaults.baselineEnd;
  const horizonStart = params.horizonStart || workspace.defaults.horizonStart;
  const horizonEnd = params.horizonEnd || workspace.defaults.horizonEnd;
  const planningYear = params.planningYear || workspace.defaults.forecastYear;
  const velocityMode = params.velocityMode || "sales_only";
  const excludeSpikes = params.excludeSpikes ?? workspace.defaults.excludeSpikes ?? true;
  const sharedSettings = normalizePlannerSharedSettings(params.customSettings || state.plannerSettings);
  const globalSettings = sharedSettings.global;
  const getProductSetting = (
    productName: string,
    key: keyof PlannerProductSettings,
    fallback: number,
  ) => sharedSettings.products[productName]?.[key] ?? fallback;
  const leadTimeDays = asNumber(params.leadTimeDays ?? globalSettings.defaultLeadTimeDays ?? workspace.defaults.leadTimeDays);
  const monthSettings = params.monthlyForecastSettings || workspace.defaults.forecastSettings;
  const forecastMonthKey = monthKey(horizonStart);
  const forecastSetting = monthSettings[forecastMonthKey] || { upliftPct: params.upliftPct ?? workspace.defaults.upliftPct, productMix: {} };
  const upliftFactor = 1 + (asNumber(forecastSetting.upliftPct) / 100);
  const forecastProductMix = forecastSetting.productMix || {};

  const campaigns = normalizeCampaignEvents(state.campaigns || []);
  const baselineDemandRows = state.demand.filter((row) => inRange(row.date, baselineStart, baselineEnd));
  const baselineSampleRows = state.samples.filter((row) => inRange(row.date, baselineStart, baselineEnd));
  const baselineDays = Math.max(1, daysInclusive(baselineStart, baselineEnd));
  const latestInventory = latestInventoryByProduct(state.inventory);
  const productNames = uniqueSorted([
    ...state.demand.map((row) => row.product_name),
    ...state.samples.map((row) => row.product_name),
    ...Array.from(latestInventory.keys()),
    ...state.launchPlans.map((row) => row.productName),
  ]);

  function calculateTransitStats(inventoryHistory: InventoryDoc[], productName: string) {
    const rows = inventoryHistory
      .filter((row) => row.product_name === productName)
      .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));
    let transitStartDate: string | null = null;
    let currentTransitAmount = 0;
    const completedLeadTimes: number[] = [];

    for (const row of rows) {
      const inTransit = asNumber(row.in_transit);
      if (inTransit > 0 && currentTransitAmount === 0) {
        transitStartDate = row.snapshotDate;
        currentTransitAmount = inTransit;
      } else if (inTransit === 0 && currentTransitAmount > 0) {
        if (transitStartDate && row.snapshotDate > transitStartDate) {
          const diffMs = toDate(row.snapshotDate).getTime() - toDate(transitStartDate).getTime();
          completedLeadTimes.push(Math.round(diffMs / 86400000));
        }
        currentTransitAmount = 0;
        transitStartDate = null;
      } else if (inTransit > 0 && currentTransitAmount > 0) {
        currentTransitAmount = inTransit;
      }
    }

    return {
      transitStartedOn: currentTransitAmount > 0 ? transitStartDate : null,
      historicalLeadTimeDays: completedLeadTimes.length
        ? Math.ceil(completedLeadTimes.reduce((sum, value) => sum + value, 0) / completedLeadTimes.length)
        : null,
    };
  }

  const normalizedVelocityMode: PlannerVelocityMode = velocityMode === "sales_plus_samples" ? "sales_plus_samples" : "sales_only";
  const demandByProduct = computeBaselineDemandByProduct({
    productNames,
    baselineDemandRows,
    baselineSampleRows,
    baselineDays,
    velocityMode: normalizedVelocityMode,
    excludeSpikes,
  });

  const totalSalesUnits = Array.from(demandByProduct.values()).reduce((sum, row) => sum + row.salesUnits, 0);
  const totalSales = Array.from(demandByProduct.values()).reduce((sum, row) => sum + row.grossSales, 0);
  const baselineMix = Object.fromEntries(
    Array.from(demandByProduct.entries()).map(([productName, demand]) => [
      productName,
      totalSalesUnits > 0 ? demand.salesUnits / totalSalesUnits : 0,
    ]),
  );
  const futureMix = Object.keys(forecastProductMix).length
    ? normalizeMixMap(forecastProductMix)
    : baselineMix;
  const totalAvgDailyDemand = Array.from(demandByProduct.values()).reduce((sum, row) => sum + row.avgDailyDemand, 0);
  const campaignHorizonFactor = campaignAverageLiftFactor(campaigns, horizonStart, horizonEnd);
  const totalForecastDailyDemand = totalAvgDailyDemand * upliftFactor * campaignHorizonFactor;
  const launchPlanByProduct = new Map(state.launchPlans.map((plan) => [plan.productName, plan] as const));

  const horizonDays = daysInclusive(horizonStart, horizonEnd);
  const rows = productNames.map((productName) => {
    const safetyWeeks = safetyStockWeeksForProduct({
      date: horizonStart,
      global: {
        safetyStockWeeksH1: sharedSettings.global.safetyStockWeeksH1,
        safetyStockWeeksH2: sharedSettings.global.safetyStockWeeksH2,
      },
      productOverrideWeeks: sharedSettings.products?.[productName]?.safetyStockWeeksOverride,
    });
    const demand = demandByProduct.get(productName) || {
      salesUnits: 0,
      sampleUnits: 0,
      grossSales: 0,
      netGrossSales: 0,
      avgDailyDemand: 0,
      smoothedUnits: 0,
      daysUsed: baselineDays,
    };
    const inventory = latestInventory.get(productName);
    const transitStats = calculateTransitStats(state.inventory, productName);
    const activeLeadTimeDays = transitStats.historicalLeadTimeDays || leadTimeDays;
    const plan = launchPlanByProduct.get(productName);
    const baseForecastDailyDemand = totalForecastDailyDemand * (futureMix[productName] || 0);
    let forecastDailyDemand = baseForecastDailyDemand;
    let horizonDemandDays = horizonDays;
    const isNewLaunch = Boolean(plan?.launchDate) && demand.salesUnits === 0 && demand.sampleUnits === 0;

    // Launch plans: future demand is derived from a proxy product, scaled by strength, and only applies during the active window.
    if (isNewLaunch && plan?.launchDate) {
      const proxyName = cleanText(plan.proxyProductName) || productName;
      const proxyMixShare = futureMix[proxyName] || 0;
      const proxyForecastDailyDemand = proxyMixShare > 0
        ? (totalForecastDailyDemand * proxyMixShare)
        : (asNumber(demandByProduct.get(proxyName)?.avgDailyDemand) * upliftFactor * campaignHorizonFactor);
      const activeDays = launchActiveDaysInHorizon(plan, horizonStart, horizonEnd);
      horizonDemandDays = activeDays;
      forecastDailyDemand = activeDays > 0
        ? launchDailyDemandFromProxyAvg(proxyForecastDailyDemand, asNumber(plan.launchStrengthPct) || 100)
        : 0;
    }

    let snapshotDate = inventory?.snapshotDate || horizonStart;
    if (isNewLaunch && plan?.launchDate && plan.launchDate > snapshotDate) {
      snapshotDate = plan.launchDate;
    }

    let onHand = asNumber(inventory?.on_hand);
    let inTransit = asNumber(inventory?.in_transit);
    let transitEta = inventory?.transit_eta || null;
    if (isNewLaunch && plan?.launchDate) {
      const committed = asNumber(plan.launchUnitsCommitted);
      if (committed > 0 && onHand === 0 && inTransit === 0) {
        onHand = committed;
        inTransit = 0;
        transitEta = null;
      }
    }
    const currentSupply = onHand + inTransit;
    const safetyStockUnits = forecastDailyDemand * safetyWeeks * 7;
    const leadTimeDemandUnits = forecastDailyDemand * activeLeadTimeDays;
    const reorderPointUnits = leadTimeDemandUnits + safetyStockUnits;
    const targetStockUnits = (forecastDailyDemand * horizonDemandDays) + safetyStockUnits;
    let rawRecommendedUnits = Math.max(0, targetStockUnits - currentSupply);
    let recommendedOrderUnits = rawRecommendedUnits;
    const moq = asNumber(getProductSetting(productName, "moq", asNumber(inventory?.moq)));
    const casePack = asNumber(getProductSetting(productName, "casePack", asNumber(inventory?.case_pack)));

    if (recommendedOrderUnits > 0) {
      if (moq > 0 && recommendedOrderUnits < moq) recommendedOrderUnits = moq;
      if (casePack > 0) recommendedOrderUnits = Math.ceil(recommendedOrderUnits / casePack) * casePack;
    }

    const daysOfOnHand = forecastDailyDemand > 0 ? onHand / forecastDailyDemand : Infinity;
    const daysOfSupply = forecastDailyDemand > 0 ? currentSupply / forecastDailyDemand : Infinity;
    const onHandStockoutDate = daysOfOnHand !== Infinity ? formatDate(addDays(snapshotDate, Math.floor(daysOfOnHand))) : null;
    const projectedStockout = daysOfSupply !== Infinity ? formatDate(addDays(snapshotDate, Math.floor(daysOfSupply))) : null;
    let transitGapDays = 0;
    if (inTransit > 0 && transitEta && onHandStockoutDate) {
      const etaDays = daysInclusive(snapshotDate, transitEta);
      if (etaDays > daysOfOnHand) transitGapDays = Math.floor(etaDays - daysOfOnHand);
    }
    const reorderDate = projectedStockout ? formatDate(addDays(projectedStockout, -activeLeadTimeDays)) : null;
    const shelfLifeMonths = asNumber(getProductSetting(productName, "shelfLife", globalSettings.defaultExpiryMonths || 24));
    const maxShelfLifeDays = shelfLifeMonths * 30;
    const projectedSupplyDays = forecastDailyDemand > 0 ? (currentSupply + recommendedOrderUnits) / forecastDailyDemand : Infinity;

    let status = "Healthy";
    if (forecastDailyDemand <= 0) {
      status = "No demand";
    } else if (projectedSupplyDays > maxShelfLifeDays) {
      status = "Spoilage Risk";
    } else if (transitGapDays > 0) {
      status = "Transit Gap";
    } else if (onHand <= leadTimeDemandUnits * 0.5) {
      status = "Critical (OH)";
    } else if (currentSupply <= leadTimeDemandUnits) {
      status = "Urgent";
    } else if (currentSupply <= reorderPointUnits) {
      status = "Watch";
    }

    const sellerSku = inventory?.seller_sku_resolved || state.demand.find((row) => row.product_name === productName)?.seller_sku_resolved || "";
    return {
      product_name: productName,
      status,
      transit_gap_days: transitGapDays,
      on_hand_stockout_date: onHandStockoutDate,
      avg_daily_demand: demand.avgDailyDemand,
      avg_daily_gross_sales: demand.grossSales / baselineDays,
      avg_daily_net_gross_sales: demand.netGrossSales / baselineDays,
      baseline_start: baselineStart,
      baseline_end: baselineEnd,
      sales_units_in_baseline: demand.salesUnits,
      sample_units_in_baseline: demand.sampleUnits,
      units_used_for_velocity: velocityMode === "sales_plus_samples" ? demand.salesUnits + demand.sampleUnits : demand.salesUnits,
      smoothed_units_in_baseline: demand.smoothedUnits,
      days_used_for_velocity: demand.daysUsed,
      mix_pct: totalSalesUnits > 0 ? demand.salesUnits / totalSalesUnits : 0,
      sales_mix_pct: totalSales > 0 ? demand.grossSales / totalSales : 0,
      gross_sales_in_baseline: demand.grossSales,
      net_gross_sales_in_baseline: demand.netGrossSales,
      on_hand: onHand,
      in_transit: inTransit,
      transit_started_on: transitStats.transitStartedOn,
      historical_lead_time_days: transitStats.historicalLeadTimeDays,
      used_lead_time_days: activeLeadTimeDays,
      transit_eta: transitEta,
      current_supply_units: currentSupply,
      weeks_of_supply: forecastDailyDemand > 0 ? currentSupply / (forecastDailyDemand * 7) : null,
      safety_stock_units: safetyStockUnits,
      safety_stock_weeks: safetyWeeks,
      projected_stockout_date: projectedStockout,
      reorder_date: reorderDate,
      recommended_order_units: recommendedOrderUnits,
      raw_recommended_units: rawRecommendedUnits,
      forecast_daily_demand: forecastDailyDemand,
      forecast_units: forecastDailyDemand * horizonDemandDays,
      lead_time_days: leadTimeDays,
      lead_time_demand_units: leadTimeDemandUnits,
      reorder_point_units: reorderPointUnits,
      target_stock_units: targetStockUnits,
      counted_in_transit: inTransit,
      snapshot_date: snapshotDate,
      seller_sku_resolved: sellerSku,
      platform: "TikTok",
      unit_cogs: getProductSetting(productName, "cogs", getUnitCogs(productName, state.launchPlans)),
      estimated_cogs: demand.salesUnits * getProductSetting(productName, "cogs", getUnitCogs(productName, state.launchPlans)),
      capital_required: recommendedOrderUnits * getProductSetting(productName, "cogs", getUnitCogs(productName, state.launchPlans)),
      days_of_supply: daysOfSupply !== Infinity ? daysOfSupply : null,
      days_on_hand: daysOfOnHand !== Infinity ? daysOfOnHand : null,
      horizon_start: horizonStart,
      horizon_end: horizonEnd,
    };
  }).sort((a, b) => {
    const rank: Record<string, number> = {
      "Critical (OH)": 0,
      Urgent: 1,
      "Transit Gap": 2,
      Watch: 3,
      Healthy: 4,
      "Spoilage Risk": 5,
      "No demand": 6,
    };
    return ((rank[a.status] ?? 99) - (rank[b.status] ?? 99)) || (b.recommended_order_units - a.recommended_order_units);
  });

  const { monthlyActuals, monthlyActualMix, productMonthly } = buildMonthlyActuals(state.demand);
  const latestActualMonthKey = Object.keys(monthlyActuals).sort().at(-1) || `${planningYear}-01`;
  const latestDemandDate = state.demand.at(-1)?.date || baselineEnd;
  const latestDemandMonthEnd = endOfMonth(toDate(latestDemandDate));
  const latestActualMonthIsPartial = latestDemandDate < formatDate(latestDemandMonthEnd);
  const monthRows = productNames.map((productName) => {
    const row: Record<string, number | string> = { product_name: productName, year_total_units: 0, year_mix_pct: 0 };
    for (let month = 1; month <= 12; month += 1) {
      const key = `${planningYear}-${String(month).padStart(2, "0")}`;
      if (key <= latestActualMonthKey) {
        row[key] = productMonthly.get(productName)?.get(key) || 0;
      } else {
        const firstOfMonth = new Date(Date.UTC(planningYear, month - 1, 1));
        const days = endOfMonth(firstOfMonth).getUTCDate();
        const monthStart = formatDate(firstOfMonth);
        const monthEnd = formatDate(endOfMonth(firstOfMonth));
        const monthUpliftFactor = 1 + ((monthSettings[key]?.upliftPct ?? asNumber(workspace.defaults.forecastDefaults[key])) / 100);
        const monthCampaignFactor = campaignAverageLiftFactor(campaigns, monthStart, monthEnd);
        const totalMonthUnits = (totalSalesUnits / baselineDays) * days * monthUpliftFactor * monthCampaignFactor;
        const normalizedMonthMix = normalizeMixMap(monthSettings[key]?.productMix || {});
        const plan = launchPlanByProduct.get(productName);
        if (plan?.launchDate) {
          const activeDays = overlapDaysInclusive(monthStart, monthEnd, plan.launchDate, plan.endDate || "9999-12-31");
          if (activeDays <= 0) {
            row[key] = 0;
          } else {
            const proxyName = cleanText(plan.proxyProductName) || productName;
            const proxyMixShare = Object.keys(normalizedMonthMix).length
              ? (normalizedMonthMix[proxyName] || 0)
              : (futureMix[proxyName] || 0);
            const proxyMonthUnits = totalMonthUnits * proxyMixShare;
            const strength = asNumber(plan.launchStrengthPct) > 0 ? asNumber(plan.launchStrengthPct) / 100 : 1;
            row[key] = proxyMonthUnits * strength * (activeDays / days);
          }
        } else {
          const mixShare = Object.keys(normalizedMonthMix).length
            ? (normalizedMonthMix[productName] || 0)
            : (futureMix[productName] || 0);
          row[key] = totalMonthUnits * mixShare;
        }
      }
      row.year_total_units = asNumber(row.year_total_units) + asNumber(row[key]);
    }
    return row;
  });

  const yearTotalUnits = monthRows.reduce((sum, row) => sum + asNumber(row.year_total_units), 0);
  for (const row of monthRows) {
    row.year_mix_pct = yearTotalUnits > 0 ? asNumber(row.year_total_units) / yearTotalUnits : 0;
  }

  const monthlyPlan = {
    year: planningYear,
    latestActualMonthKey,
    latestDemandDate,
    latestActualMonthIsPartial,
    months: Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(planningYear, index, 1));
      const key = `${planningYear}-${String(index + 1).padStart(2, "0")}`;
      const isLatestActualMonth = key === latestActualMonthKey;
      return {
        key,
        label: date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        mode: key < latestActualMonthKey ? "actual" : isLatestActualMonth ? (latestActualMonthIsPartial ? "actual_mtd" : "actual") : "forecast",
      };
    }),
    rows: monthRows,
  };

  const productMix = {
    rows: rows.map((row) => ({
      product_name: row.product_name,
      baseline_units: row.sales_units_in_baseline,
      mix_pct: row.mix_pct,
      sales_mix_pct: row.sales_mix_pct,
      gross_sales_in_baseline: row.gross_sales_in_baseline,
      net_gross_sales_in_baseline: row.net_gross_sales_in_baseline,
      unit_cogs: row.unit_cogs,
      estimated_cogs: row.estimated_cogs,
      forecast_units: monthRows.find((monthRow) => monthRow.product_name === row.product_name)?.year_total_units || 0,
    })),
  };
  const skuSalesSummary = buildSkuSalesSummary(state.skuSales, baselineStart, baselineEnd);

  return {
    ok: true,
    rows,
    summary: {
      rows: rows.length,
      critical_on_hand: rows.filter((row) => row.status === "Critical (OH)").length,
      urgent: rows.filter((row) => row.status === "Urgent").length,
      transit_gap: rows.filter((row) => row.status === "Transit Gap").length,
      watch: rows.filter((row) => row.status === "Watch").length,
      healthy: rows.filter((row) => row.status === "Healthy").length,
      spoilage_risk: rows.filter((row) => row.status === "Spoilage Risk").length,
      no_demand: rows.filter((row) => row.status === "No demand").length,
      covered: rows.filter((row) => row.status === "Healthy").length,
      exceptions: rows.filter((row) => ["Critical (OH)", "Urgent", "Transit Gap", "Watch", "Spoilage Risk"].includes(row.status)).length,
    },
    monthlyPlan,
    productMix,
    skuSalesSummary,
    historicalTrend: buildHistoricalTrend(productMonthly, planningYear),
    launchPlanning: buildLaunchPlanning(
      state.launchPlans,
      new Map(Array.from(demandByProduct.entries()).map(([productName, demand]) => [productName, { salesUnits: demand.salesUnits, avgDailyDemand: demand.avgDailyDemand }])),
    ),
  };
}

export async function saveHostedForecastSetting(monthKeyValue: string, setting: { upliftPct?: number; productMix?: Record<string, number> }) {
  const payload = {
    yearMonth: monthKeyValue,
    upliftPct: asNumber(setting.upliftPct),
    productMix: setting.productMix || {},
  };

  await getFirebaseAdminDb().collection("forecastSettings").doc(monthKeyValue).set(payload, { merge: true });

  liveStateCache = null;
  let settings = (await loadState({ forceRefresh: true })).state.forecastSettings;

  try {
    const fileText = await readFile(FORECAST_DEFAULTS_FILE, "utf8");
    const filePayload = JSON.parse(fileText) as {
      months?: Record<string, { upliftPct?: number; productMix?: Record<string, number> }>;
    };
    filePayload.months = filePayload.months || {};
    filePayload.months[monthKeyValue] = {
      upliftPct: payload.upliftPct,
      productMix: payload.productMix,
    };
    await writeFile(FORECAST_DEFAULTS_FILE, JSON.stringify(filePayload, null, 2), "utf8");
    snapshotStateCache = null;
  } catch {
    // Ignore local snapshot write failures in hosted/serverless environments.
  }

  return Object.fromEntries(
    settings.map((entry) => [
      entry.yearMonth,
      {
        upliftPct: asNumber(entry.upliftPct),
        productMix: entry.productMix || {},
      },
    ]),
  );
}

export async function saveHostedPlannerSettings(settings: unknown) {
  const payload = normalizePlannerSharedSettings(settings);

  await getFirebaseAdminDb().collection("planningSettings").doc("shared").set(payload, { merge: true });
  liveStateCache = null;

  try {
    await writeFile(PLANNER_SETTINGS_FILE, JSON.stringify(payload, null, 2), "utf8");
    snapshotStateCache = null;
  } catch {
    // Ignore local snapshot write failures in hosted/serverless environments.
  }

  return payload;
}

export async function saveHostedDemandUpload(
  collectionName: "planningDemandDaily" | "planningSamplesDaily",
  rows: UploadedDemandRow[],
  meta: {
    platform?: string;
    rawRowCount?: number;
    usableRowCount?: number;
    writeAudit?: boolean;
  } = {},
) {
  const skuMappings = await loadTikTokSkuMappings();
  const mappedRows = expandMappedDemandRows(rows, skuMappings);
  const normalizedRows = normalizeUploadedDemandRows(mappedRows);
  if (!normalizedRows.length) {
    throw new Error("No usable planning rows were found in the uploaded file.");
  }

  const uploadedDates = uniqueSorted(normalizedRows.map((row) => row.date));
  let skuRowsWritten = 0;
  const skuSalesRows = collectionName === "planningDemandDaily" ? buildSkuSalesSummaryRows(rows, skuMappings) : [];

  if (usesLocalPlannerData()) {
    await saveLocalDemandDocs(collectionName, normalizedRows, uploadedDates);
    if (skuSalesRows.length) {
      await saveLocalSkuSalesDocs(skuSalesRows, uniqueSorted(skuSalesRows.map((row) => row.date)));
      skuRowsWritten = skuSalesRows.length;
    }

    if (meta.writeAudit !== false) {
      // Keep a tiny local "last upload" audit so the UI can show date coverage without touching Firestore.
      try {
        const uploadType = collectionName === "planningSamplesDaily" ? "samples" : "orders";
        const uploadAudit: UploadAuditDoc = {
          uploadType,
          platform: meta.platform || normalizedRows[0]?.platform || "TikTok",
          rawRowCount: asNumber(meta.rawRowCount),
          usableRowCount: asNumber(meta.usableRowCount || rows.length),
          rowsWritten: normalizedRows.length,
          uploadedDates,
          firstDate: uploadedDates[0] || null,
          lastDate: uploadedDates.at(-1) || null,
          uploadedAt: new Date().toISOString(),
        };
        const auditPath = uploadType === "orders" ? LOCAL_UPLOAD_AUDIT_ORDERS_FILE : LOCAL_UPLOAD_AUDIT_SAMPLES_FILE;
        await writeFile(auditPath, JSON.stringify(uploadAudit, null, 2), "utf8");
      } catch {
        // Ignore audit write failures in environments where the filesystem is read-only.
      }
    }

    snapshotStateCache = null;
    return {
      uploadedDates,
      rowsWritten: normalizedRows.length,
      skuRowsWritten,
      dataSource: "local",
    };
  }

  await deleteDocsByDates(collectionName, "date", uploadedDates);
  await writeDemandDocs(collectionName, normalizedRows);

  if (collectionName === "planningDemandDaily") {
    const skuSalesDates = uniqueSorted(skuSalesRows.map((row) => row.date));
    await deleteDocsByDates("planningSkuSalesDaily", "date", skuSalesDates);
    await writeSkuSalesDocs(skuSalesRows);
    skuRowsWritten = skuSalesRows.length;
  }

  const uploadType = collectionName === "planningSamplesDaily" ? "samples" : "orders";
  const uploadAudit: UploadAuditDoc = {
    uploadType,
    platform: meta.platform || normalizedRows[0]?.platform || "TikTok",
    rawRowCount: asNumber(meta.rawRowCount),
    usableRowCount: asNumber(meta.usableRowCount || rows.length),
    rowsWritten: normalizedRows.length,
    uploadedDates,
    firstDate: uploadedDates[0] || null,
    lastDate: uploadedDates.at(-1) || null,
    uploadedAt: new Date().toISOString(),
  };
  if (meta.writeAudit !== false) {
    await getFirebaseAdminDb().collection("planningUploadAudit").doc(uploadType).set(uploadAudit, { merge: true });
  }

  liveStateCache = null;
  return {
    uploadedDates,
    rowsWritten: normalizedRows.length,
    skuRowsWritten,
  };
}

export async function finalizeHostedDemandUploadAudit(args: {
  uploadType: "orders" | "samples";
  platform?: string;
  rawRowCount?: number;
  usableRowCount?: number;
  rowsWritten?: number;
  skuRowsWritten?: number;
  uploadedDates: string[];
}) {
  const uploadedDates = uniqueSorted(args.uploadedDates || []);
  const uploadAudit: UploadAuditDoc = {
    uploadType: args.uploadType,
    platform: cleanText(args.platform) || "TikTok",
    rawRowCount: asNumber(args.rawRowCount),
    usableRowCount: asNumber(args.usableRowCount),
    rowsWritten: asNumber(args.rowsWritten),
    uploadedDates,
    firstDate: uploadedDates[0] || null,
    lastDate: uploadedDates.at(-1) || null,
    uploadedAt: new Date().toISOString(),
  };

  if (usesLocalPlannerData()) {
    try {
      const auditPath = args.uploadType === "orders" ? LOCAL_UPLOAD_AUDIT_ORDERS_FILE : LOCAL_UPLOAD_AUDIT_SAMPLES_FILE;
      await writeFile(auditPath, JSON.stringify(uploadAudit, null, 2), "utf8");
    } catch {
      // ignore
    }
    snapshotStateCache = null;
    return { ok: true, dataSource: "local", uploadAudit };
  }

  await getFirebaseAdminDb().collection("planningUploadAudit").doc(args.uploadType).set(uploadAudit, { merge: true });
  liveStateCache = null;
  return { ok: true, dataSource: "live", uploadAudit };
}

export async function syncHostedInventorySnapshot() {
  const sheetSource = getInventorySheetSource();
  const snapshot = await loadLatestInventorySnapshot(sheetSource, "TikTok");
  await deleteDocsByDates("inventorySnapshots", "snapshotDate", [snapshot.snapshotDate]);
  await writeInventoryDocs(snapshot.rows);

  liveStateCache = null;

  return {
    snapshotDate: snapshot.snapshotDate,
    rowsWritten: snapshot.rows.length,
    source: snapshot.source,
  };
}
