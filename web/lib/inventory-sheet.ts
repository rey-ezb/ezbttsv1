import * as XLSX from "xlsx";

type ParsedInventoryRow = {
  snapshotDate: string;
  product_name: string;
  seller_sku_resolved: string;
  on_hand: number;
  in_transit: number;
  transit_eta: string | null;
  lead_time_days: number | null;
  moq: number | null;
  case_pack: number | null;
};

const DEFAULT_INVENTORY_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1hAjW1gbDd-UJgTfS4Bb2QyOwGo9F53nQebjRBHJz9K8/edit?gid=536853877#gid=536853877";

const INVENTORY_PRODUCT_MAP: Record<string, string> = {
  birria: "Birria Bomb 2-Pack",
  pozole: "Pozole Bomb 2-Pack",
  tinga: "Tinga Bomb 2-Pack",
  brine: "Brine Bomb",
  "brine bomb": "Brine Bomb",
  "variety pack": "Variety Pack",
  "pozole verde": "Pozole Verde Bomb 2-Pack",
  "chile colorado": "Chile Colorado Bomb 2-Pack",
};

const SUPPORTED_METRICS = new Set(["on_hand", "in_transit"]);

type InventoryMetricRow = {
  date: string;
  productName: string;
  metric: "on_hand" | "in_transit";
  value: number;
};

export function getInventorySheetSource() {
  return process.env.INVENTORY_SHEET_URL || DEFAULT_INVENTORY_SHEET_URL;
}

export function inventoryExportUrl(source: string) {
  if (!source.includes("docs.google.com/spreadsheets/d/")) {
    return source;
  }
  const match = source.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error(`Unsupported Google Sheets URL: ${source}`);
  }
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=xlsx`;
}

export async function loadLatestInventorySnapshot(source: string, channel = "TikTok") {
  const response = await fetch(inventoryExportUrl(source), {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not download inventory sheet (${response.status}).`);
  }

  const workbook = XLSX.read(await response.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const rows = buildInventoryHistoryFromWorkbook(workbook, channel);
  if (!rows.length) {
    throw new Error("The inventory sheet did not contain any usable TikTok inventory rows.");
  }

  const latestSnapshotDate = rows.reduce((latest, row) => (row.date > latest ? row.date : latest), rows[0].date);
  const latestRows = rows
    .filter((row) => row.date === latestSnapshotDate)
    .map((row) => ({
      snapshotDate: row.date,
      product_name: row.productName,
      seller_sku_resolved: "",
      on_hand: row.on_hand,
      in_transit: row.in_transit,
      transit_eta: null,
      lead_time_days: null,
      moq: null,
      case_pack: null,
    }))
    .sort((a, b) => a.product_name.localeCompare(b.product_name));

  return {
    snapshotDate: latestSnapshotDate,
    rows: latestRows,
    source,
  };
}

function buildInventoryHistoryFromWorkbook(workbook: XLSX.WorkBook, channel: string) {
  const historicalSheet = workbook.Sheets["Inventory Historical Data"];
  const updatedSheet = workbook.Sheets["Updated Report"];
  const historicalRows = historicalSheet ? parseInventoryHistoricalSheet(historicalSheet, channel) : [];
  const updatedRows = updatedSheet ? parseUpdatedReportSheet(updatedSheet, channel) : [];
  const mergedRows = [...historicalRows];

  const latestHistorical = historicalRows.reduce((latest, row) => (row.date > latest ? row.date : latest), "");
  const latestUpdated = updatedRows.reduce((latest, row) => (row.date > latest ? row.date : latest), "");

  if (updatedRows.length && (!latestHistorical || latestUpdated > latestHistorical)) {
    mergedRows.push(...updatedRows);
  }

  const filteredRows = mergedRows.filter((row) => row.on_hand !== 0 || row.in_transit !== 0);
  return filteredRows.sort((a, b) => a.date.localeCompare(b.date) || a.productName.localeCompare(b.productName));
}

function parseInventoryHistoricalSheet(sheet: XLSX.WorkSheet, channel: string) {
  const rows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, { header: 1, raw: false, defval: "" });
  const channels = carryForwardRow(rows[0] || []);
  const products = carryForwardRow(rows[1] || []);
  const metrics = (rows[2] || []).map((value) => normalizeMetricName(value));
  const metricRows: InventoryMetricRow[] = [];

  for (let rowIndex = 3; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const date = parseSheetDate(row[0]);
    if (!date) continue;

    for (let columnIndex = 1; columnIndex < row.length; columnIndex += 1) {
      if (cleanLabel(channels[columnIndex]) !== channel) continue;
      const productName = canonicalInventoryProductName(products[columnIndex]);
      const metricName = metrics[columnIndex];
      if (!productName || !metricName || !SUPPORTED_METRICS.has(metricName)) continue;
      metricRows.push({
        date,
        productName,
        metric: metricName as "on_hand" | "in_transit",
        value: toNumber(row[columnIndex]),
      });
    }
  }

  return pivotInventoryMetricRows(metricRows);
}

function parseUpdatedReportSheet(sheet: XLSX.WorkSheet, channel: string) {
  const rows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, { header: 1, raw: false, defval: "" });
  const asOfDate = parseAsOfDate(rows[1]?.[0]);
  if (!asOfDate) return [];

  const products = carryForwardRow(rows[4] || []);
  const metrics = (rows[5] || []).map((value) => normalizeMetricName(value));
  let channelRowIndex = -1;

  for (let rowIndex = 6; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    if (cleanLabel(row[1]) === channel) {
      channelRowIndex = rowIndex;
      break;
    }
  }

  if (channelRowIndex === -1) return [];
  const channelRow = rows[channelRowIndex] || [];
  const metricRows: InventoryMetricRow[] = [];

  for (let columnIndex = 2; columnIndex < channelRow.length; columnIndex += 1) {
    const productName = canonicalInventoryProductName(products[columnIndex]);
    const metricName = metrics[columnIndex];
    if (!productName || !metricName || !SUPPORTED_METRICS.has(metricName)) continue;
    metricRows.push({
      date: asOfDate,
      productName,
      metric: metricName as "on_hand" | "in_transit",
      value: toNumber(channelRow[columnIndex]),
    });
  }

  return pivotInventoryMetricRows(metricRows);
}

function pivotInventoryMetricRows(rows: InventoryMetricRow[]) {
  const grouped = new Map<string, ParsedInventoryRow & { date: string }>();

  for (const row of rows) {
    const key = `${row.date}__${row.productName}`;
    const current =
      grouped.get(key) ||
      ({
        date: row.date,
        snapshotDate: row.date,
        product_name: row.productName,
        productName: row.productName,
        seller_sku_resolved: "",
        on_hand: 0,
        in_transit: 0,
        transit_eta: null,
        lead_time_days: null,
        moq: null,
        case_pack: null,
      } as ParsedInventoryRow & { date: string; productName: string });
    current[row.metric] = row.value;
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).map((row) => ({
    date: row.date,
    productName: row.product_name,
    on_hand: row.on_hand,
    in_transit: row.in_transit,
  }));
}

function carryForwardRow(values: Array<string | number | Date>) {
  const carried: string[] = [];
  let previous = "";
  for (const value of values) {
    const cleaned = cleanLabel(value);
    if (cleaned) {
      previous = cleaned;
    }
    carried.push(previous);
  }
  return carried;
}

function cleanLabel(value: string | number | Date | undefined) {
  return String(value ?? "").trim();
}

function normalizeMetricName(value: string | number | Date | undefined) {
  const label = cleanLabel(value).toLowerCase().replaceAll("-", " ").replaceAll("$", "").replace(/\s+/g, " ").trim();
  if (label === "on hand") return "on_hand";
  if (label === "in transit") return "in_transit";
  return label;
}

function canonicalInventoryProductName(value: string | number | Date | undefined) {
  const normalized = cleanLabel(value).toLowerCase();
  return INVENTORY_PRODUCT_MAP[normalized] || null;
}

function parseAsOfDate(value: string | number | Date | undefined) {
  const match = cleanLabel(value).match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (!match) return null;
  return toIsoDate(new Date(match[1]));
}

function parseSheetDate(value: string | number | Date | undefined) {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return toIsoDate(value);
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return toIsoDate(parsed);
}

function toIsoDate(value: Date) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())).toISOString().slice(0, 10);
}

function toNumber(value: string | number | Date | undefined) {
  if (value === undefined || value === null || value === "") return 0;
  const numeric = Number(String(value).replaceAll(",", "").trim());
  return Number.isFinite(numeric) ? numeric : 0;
}
