import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireSettingsAuth } from "@/app/api/_utils/require-settings-auth";
import { requestPlannerDataSourceMode, resolvePlannerDataSourceMode } from "@/lib/data-source-mode";
import { normalizeMappedProductName } from "@/lib/sku-mapping";
import { loadHostedSkuMappingOverrides, saveHostedSkuMappingOverrides } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

type RawSkuMappingRow = {
  skuId: string;
  productName: string;
  product1: string;
  product2: string;
  product3: string;
  product4: string;
};

type MergedSkuMappingRow = RawSkuMappingRow & {
  source: "base" | "local";
};

const BASE_MAPPING_FILE = path.join(process.cwd(), "data", "tiktok_sku_mapping.csv");
function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizedKey(value: unknown) {
  return cleanText(value).replace(/\s+/g, " ").toLowerCase();
}

function canonicalizeMappedProduct(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return "";
  const key = normalizedKey(raw);
  if (["ignore", "ignored", "non-planning", "non planning", "exclude", "excluded"].includes(key)) {
    return "Ignore";
  }
  try {
    return normalizeMappedProductName(raw);
  } catch {
    // Keep the raw value for visibility. The upload pipeline will still reject it if unknown.
    return raw;
  }
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

  const headers = rows[0].map((header) => cleanText(header));
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, cleanText(values[index])]))
  );
}

function rowKey(row: Pick<RawSkuMappingRow, "skuId" | "productName">) {
  return normalizedKey(row.skuId || row.productName);
}

function parseSkuMappingCsvRaw(text: string): RawSkuMappingRow[] {
  return parseCsv(text)
    .map((row) => ({
      skuId: cleanText(row["SKU ID"]),
      productName: cleanText(row["Product Name"]),
      product1: canonicalizeMappedProduct(row["Product 1"]),
      product2: canonicalizeMappedProduct(row["Product 2"]),
      product3: canonicalizeMappedProduct(row["Product 3"]),
      product4: canonicalizeMappedProduct(row["Product 4"]),
    }))
    .filter((row) => row.skuId && row.productName);
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

function stringifySkuMappingCsv(rows: RawSkuMappingRow[]) {
  const header = ["SKU ID", "Product Name", "Product 1", "Product 2", "Product 3", "Product 4"];
  const lines = [header.join(",")];
  rows.forEach((row) => {
    lines.push(
      [
        row.skuId,
        row.productName,
        row.product1,
        row.product2,
        row.product3,
        row.product4,
      ].map((cell) => csvEscape(cleanText(cell))).join(","),
    );
  });
  return `${lines.join("\n")}\n`;
}

export async function GET(request: NextRequest) {
  try {
    const baseCsv = await readFile(BASE_MAPPING_FILE, "utf8").catch(() => "");
    const preferredDataSource = requestPlannerDataSourceMode(request);
    const resolvedDataSource = resolvePlannerDataSourceMode(preferredDataSource);

    const baseRows = baseCsv ? parseSkuMappingCsvRaw(baseCsv) : [];
    const overrideRows = (await loadHostedSkuMappingOverrides(preferredDataSource)).map((row) => ({
      ...row,
      product1: canonicalizeMappedProduct(row.product1),
      product2: canonicalizeMappedProduct(row.product2),
      product3: canonicalizeMappedProduct(row.product3),
      product4: canonicalizeMappedProduct(row.product4),
    }));

    const merged = new Map<string, MergedSkuMappingRow>();
    baseRows.forEach((row) => merged.set(rowKey(row), { ...row, source: "base" }));
    overrideRows.forEach((row) => merged.set(rowKey(row), { ...row, source: "local" }));

    return NextResponse.json({
      ok: true,
      editable: true,
      rows: Array.from(merged.values()).sort((a, b) => a.source.localeCompare(b.source) || a.productName.localeCompare(b.productName)),
      baseRows,
      localRows: overrideRows,
      mode: resolvedDataSource,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load SKU mapping." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireSettingsAuth(request);
    if (unauthorized) return unauthorized;
    const preferredDataSource = requestPlannerDataSourceMode(request);

    const payload = await request.json();
    const rows = Array.isArray(payload?.rows) ? (payload.rows as RawSkuMappingRow[]) : [];

    const normalized = rows
      .map((row) => ({
        skuId: cleanText((row as RawSkuMappingRow)?.skuId),
        productName: cleanText((row as RawSkuMappingRow)?.productName),
        product1: cleanText((row as RawSkuMappingRow)?.product1),
        product2: cleanText((row as RawSkuMappingRow)?.product2),
        product3: cleanText((row as RawSkuMappingRow)?.product3),
        product4: cleanText((row as RawSkuMappingRow)?.product4),
      }))
      .filter((row) => row.skuId && row.productName && (row.product1 || row.product2 || row.product3 || row.product4));

    const unique = new Map<string, RawSkuMappingRow>();
    normalized.forEach((row) => unique.set(rowKey(row), row));

    const savedRows = Array.from(unique.values());
    await saveHostedSkuMappingOverrides(savedRows, preferredDataSource);

    return NextResponse.json({ ok: true, rowsWritten: savedRows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save SKU mapping." },
      { status: 400 },
    );
  }
}
