export type TikTokSkuMapping = {
  skuId: string;
  productName: string;
  components: Array<{
    productName: string;
    units: number;
  }>;
  ignored?: boolean;
};

export type DemandUploadInputRow = {
  date?: string;
  order_date?: string;
  platform?: string;
  product_name?: string;
  sku_id?: string;
  sku_id_resolved?: string;
  seller_sku_resolved?: string;
  net_units?: number;
  gross_sales?: number;
  net_gross_sales?: number;
};

export type MappedDemandRow = {
  date: string;
  platform: string;
  product_name: string;
  seller_sku_resolved: string;
  net_units: number;
  gross_sales: number;
  net_gross_sales: number;
};

export type SkuSalesSummaryRow = {
  date: string;
  platform: string;
  sku_id: string;
  product_name: string;
  sku_type: "core" | "virtual_bundle";
  core_products: string;
  units_sold: number;
  gross_sales: number;
  avg_gross_per_unit: number;
  net_gross_sales: number;
  avg_net_gross_per_unit: number;
};

type ExpandOptions = {
  productUnitPrices?: Record<string, number>;
};

const DEFAULT_PRODUCT_UNIT_PRICES: Record<string, number> = {
  "Birria Bomb 2-Pack": 19.99,
  "Chile Colorado Bomb 2-Pack": 19.99,
  "Pozole Bomb 2-Pack": 19.99,
  "Pozole Verde Bomb 2-Pack": 19.99,
  "Tinga Bomb 2-Pack": 19.99,
  "Brine Bomb": 19.99,
  "Variety Pack": 49.99,
};

const PRODUCT_NAME_ALIASES: Record<string, string> = {
  "birria bombs 2p": "Birria Bomb 2-Pack",
  "birria bomb 2-pack": "Birria Bomb 2-Pack",
  "brine bombs": "Brine Bomb",
  "brine bomb": "Brine Bomb",
  "chile colorado bombs 2p": "Chile Colorado Bomb 2-Pack",
  "chile colorado bomb 2-pack": "Chile Colorado Bomb 2-Pack",
  "pozole bombs 2p": "Pozole Bomb 2-Pack",
  "pozole bomb 2-pack": "Pozole Bomb 2-Pack",
  "pozole verde bombs 2p": "Pozole Verde Bomb 2-Pack",
  "pozole verde bomb 2-pack": "Pozole Verde Bomb 2-Pack",
  "tinga bombs 2p": "Tinga Bomb 2-Pack",
  "tinga bomb 2-pack": "Tinga Bomb 2-Pack",
  "variety pack": "Variety Pack",
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizedKey(value: unknown) {
  return cleanText(value).replace(/\s+/g, " ").toLowerCase();
}

function isIgnoredMappingValue(value: unknown) {
  return ["ignore", "ignored", "non-planning", "non planning", "exclude", "excluded"].includes(normalizedKey(value));
}

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function inferredNetGrossSales(row: DemandUploadInputRow) {
  const netUnits = asNumber(row.net_units);
  if (netUnits <= 0) return 0;
  const explicit = asNumber(row.net_gross_sales);
  if (explicit > 0) return explicit;
  // Back-compat: treat explicit 0 as "unknown" when we still have positive net units.
  return asNumber(row.gross_sales);
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

export function normalizeMappedProductName(value: unknown) {
  const cleaned = cleanText(value);
  const canonical = PRODUCT_NAME_ALIASES[normalizedKey(cleaned)];
  if (!canonical) {
    throw new Error(`Unknown mapped core product "${cleaned}". Update the TikTok SKU mapping aliases before uploading.`);
  }
  return canonical;
}

export function parseTiktokSkuMappingCsv(text: string): TikTokSkuMapping[] {
  return parseCsv(text)
    .map((row) => {
      const skuId = cleanText(row["SKU ID"]);
      const productName = cleanText(row["Product Name"]);
      const componentCounts = new Map<string, number>();
      let ignored = false;

      ["Product 1", "Product 2", "Product 3", "Product 4"].forEach((column) => {
        const rawComponent = cleanText(row[column]);
        if (!rawComponent) return;
        if (isIgnoredMappingValue(rawComponent)) {
          ignored = true;
          return;
        }
        const componentName = normalizeMappedProductName(rawComponent);
        componentCounts.set(componentName, (componentCounts.get(componentName) || 0) + 1);
      });

      return {
        skuId,
        productName,
        ignored,
        components: Array.from(componentCounts.entries()).map(([componentName, units]) => ({
          productName: componentName,
          units,
        })),
      };
    })
    .filter((mapping) => mapping.skuId && mapping.productName && (mapping.ignored || mapping.components.length));
}

function buildMappingLookups(mappings: TikTokSkuMapping[]) {
  const bySkuId = new Map<string, TikTokSkuMapping>();
  const byProductName = new Map<string, TikTokSkuMapping>();

  mappings.forEach((mapping) => {
    bySkuId.set(normalizedKey(mapping.skuId), mapping);
    byProductName.set(normalizedKey(mapping.productName), mapping);
  });

  return { bySkuId, byProductName };
}

function findMapping(row: DemandUploadInputRow, mappings: TikTokSkuMapping[]) {
  const { bySkuId, byProductName } = buildMappingLookups(mappings);
  const skuCandidates = [row.sku_id, row.sku_id_resolved, row.seller_sku_resolved].map(normalizedKey).filter(Boolean);
  for (const candidate of skuCandidates) {
    const mapping = bySkuId.get(candidate);
    if (mapping) return mapping;
  }
  return byProductName.get(normalizedKey(row.product_name));
}

function isAlreadyCoreProduct(productName: string) {
  return Boolean(PRODUCT_NAME_ALIASES[normalizedKey(productName)]);
}

export function expandMappedDemandRows(rows: DemandUploadInputRow[], mappings: TikTokSkuMapping[], options: ExpandOptions = {}) {
  const grouped = new Map<string, MappedDemandRow>();
  const unitPrices = { ...DEFAULT_PRODUCT_UNIT_PRICES, ...(options.productUnitPrices || {}) };

  rows.forEach((row) => {
    const date = cleanText(row.date || row.order_date).slice(0, 10);
    const platform = cleanText(row.platform) || "TikTok";
    const listingName = cleanText(row.product_name);
    if (!date || !listingName) return;

    const mapping = findMapping(row, mappings);
    const skuForError = cleanText(row.sku_id || row.sku_id_resolved || row.seller_sku_resolved) || listingName;
    if (mapping?.ignored) return;
    const components = mapping?.components || (isAlreadyCoreProduct(listingName)
      ? [{ productName: normalizeMappedProductName(listingName), units: 1 }]
      : null);

    if (!components) {
      throw new Error(`Unmapped TikTok SKU ${skuForError}. Add it to the TikTok SKU mapping before uploading.`);
    }

    const netUnits = asNumber(row.net_units);
    const grossSales = asNumber(row.gross_sales);
    const netGrossSales = inferredNetGrossSales(row);
    const totalComponentValue = components.reduce(
      (sum, component) => sum + component.units * Math.max(0, asNumber(unitPrices[component.productName]) || 1),
      0,
    ) || components.reduce((sum, component) => sum + component.units, 0) || 1;

    components.forEach((component) => {
      const mappedNetUnits = netUnits * component.units;
      const componentValue = component.units * Math.max(0, asNumber(unitPrices[component.productName]) || 1);
      const mappedGrossSales = grossSales * (componentValue / totalComponentValue);
      const mappedNetGrossSales = netGrossSales * (componentValue / totalComponentValue);
      const sku = cleanText(row.sku_id || row.sku_id_resolved || row.seller_sku_resolved || mapping?.skuId);
      const key = `${platform}__${date}__${component.productName}__${sku}`;
      const current = grouped.get(key) || {
        date,
        platform,
        product_name: component.productName,
        seller_sku_resolved: sku,
        net_units: 0,
        gross_sales: 0,
        net_gross_sales: 0,
      };
      current.net_units += mappedNetUnits;
      current.gross_sales = roundCurrency(current.gross_sales + mappedGrossSales);
      current.net_gross_sales = roundCurrency(current.net_gross_sales + mappedNetGrossSales);
      grouped.set(key, current);
    });
  });

  return Array.from(grouped.values()).sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.product_name.localeCompare(b.product_name) ||
      a.seller_sku_resolved.localeCompare(b.seller_sku_resolved),
  );
}

function formatCoreProducts(mapping: TikTokSkuMapping | undefined, productName: string) {
  const components = mapping?.components || (isAlreadyCoreProduct(productName)
    ? [{ productName: normalizeMappedProductName(productName), units: 1 }]
    : []);
  return components.map((component) => `${component.productName}${component.units > 1 ? ` x${component.units}` : ""}`).join(" + ");
}

export function buildSkuSalesSummaryRows(rows: DemandUploadInputRow[], mappings: TikTokSkuMapping[]) {
  const grouped = new Map<string, SkuSalesSummaryRow>();

  rows.forEach((row) => {
    const date = cleanText(row.date || row.order_date).slice(0, 10);
    const platform = cleanText(row.platform) || "TikTok";
    const listingName = cleanText(row.product_name);
    if (!date || !listingName) return;

    const mapping = findMapping(row, mappings);
    if (mapping?.ignored) return;
    const skuId = cleanText(row.sku_id || row.sku_id_resolved || row.seller_sku_resolved || mapping?.skuId) || listingName;
    const componentUnits = mapping?.components.reduce((sum, component) => sum + component.units, 0) || 1;
    const skuType = componentUnits > 1 ? "virtual_bundle" : "core";
    const key = `${platform}__${date}__${skuId}__${listingName}`;
    const current = grouped.get(key) || {
      date,
      platform,
      sku_id: skuId,
      product_name: listingName,
      sku_type: skuType,
      core_products: formatCoreProducts(mapping, listingName),
      units_sold: 0,
      gross_sales: 0,
      avg_gross_per_unit: 0,
      net_gross_sales: 0,
      avg_net_gross_per_unit: 0,
    };

    current.units_sold += asNumber(row.net_units);
    current.gross_sales = roundCurrency(current.gross_sales + asNumber(row.gross_sales));
    current.avg_gross_per_unit = current.units_sold > 0 ? roundCurrency(current.gross_sales / current.units_sold) : 0;
    current.net_gross_sales = roundCurrency(current.net_gross_sales + inferredNetGrossSales(row));
    current.avg_net_gross_per_unit = current.units_sold > 0 ? roundCurrency(current.net_gross_sales / current.units_sold) : 0;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.sku_type.localeCompare(b.sku_type) ||
      a.product_name.localeCompare(b.product_name) ||
      a.sku_id.localeCompare(b.sku_id),
  );
}
