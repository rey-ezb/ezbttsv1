import { readFile } from "node:fs/promises";
import path from "node:path";

type DailyRow = {
  reporting_date: string;
  gross_product_sales: number;
  net_product_sales: number;
  paid_orders: number;
  valid_orders: number;
  units_sold: number;
  refunded_orders: number;
  returned_units: number;
  delivered_orders: number;
  canceled_orders: number;
  blank_customer_orders?: number;
  status_counts: Record<string, number>;
  unique_customers?: number;
  new_customers?: number;
  repeat_customers?: number;
};

type ProductRow = {
  reporting_month: string;
  product_name: string;
  units_sold: number;
  gross_product_sales: number;
  net_product_sales: number;
  unit_cogs: number;
};

type CityZipRow = {
  reporting_month: string;
  city?: string;
  state?: string;
  zipcode?: string;
  orders: number;
  unique_customers: number;
};

type BucketCache = {
  coverage: {
    start_date: string | null;
    end_date: string | null;
  };
  daily: DailyRow[];
  products: ProductRow[];
  cities: CityZipRow[];
  zips: CityZipRow[];
  cohort_rows?: Array<Record<string, string | number>>;
  customer_index?: {
    dates: string[];
    day_customer_ids: Record<string, string>;
    first_seen_ordinal: string;
    customer_count: number;
  };
};

type CacheFile = {
  generated_at: string;
  source: {
    files: number;
    raw_rows: number;
    usable_rows: number;
    unique_customers: number;
  };
  buckets: Record<string, BucketCache>;
};

type QueryArgs = {
  startDate?: string | null;
  endDate?: string | null;
  activeTab?: string | null;
  dateBasis?: string | null;
  orderBucket?: string | null;
  sources?: string[];
};

const KPI_CACHE_PATH = path.join(process.cwd(), "data", "tiktok_kpi_cache.json");
let cachePromise: Promise<CacheFile> | null = null;

function safeNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function decodeVarintDeltas(base64Value: string) {
  if (!base64Value) return [];
  const buffer = Buffer.from(String(base64Value), "base64url");
  const values: number[] = [];
  let index = 0;
  let previous = 0;
  while (index < buffer.length) {
    let shift = 0;
    let value = 0;
    while (index < buffer.length) {
      const byte = buffer[index];
      index += 1;
      value |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    previous += value;
    values.push(previous);
  }
  return values;
}

function decodeUint16(base64Value: string) {
  if (!base64Value) return new Uint16Array(0);
  const buffer = Buffer.from(String(base64Value), "base64url");
  const length = Math.floor(buffer.length / 2);
  return new Uint16Array(buffer.buffer, buffer.byteOffset, length);
}

function asDate(value: string | null | undefined) {
  if (!value) return null;
  const normalized = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function sum<T>(rows: T[], selector: (row: T) => number) {
  return rows.reduce((acc, row) => acc + safeNumber(selector(row)), 0);
}

function monthOverlapsRange(month: string, startDate: string | null, endDate: string | null) {
  const key = String(month || "").slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(key)) return false;
  const monthStart = `${key}-01`;
  const monthEnd = `${key}-31`;
  if (!startDate || !endDate) return true;
  return monthEnd >= startDate && monthStart <= endDate;
}

function addMonths(month: string, offset: number) {
  const [yearRaw, monthRaw] = String(month || "").split("-");
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) return null;
  const base = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthsBetweenInclusive(startMonth: string | null, endMonth: string | null) {
  if (!startMonth || !endMonth) return null;
  const [syRaw, smRaw] = startMonth.split("-");
  const [eyRaw, emRaw] = endMonth.split("-");
  const sy = Number(syRaw);
  const sm = Number(smRaw);
  const ey = Number(eyRaw);
  const em = Number(emRaw);
  if (![sy, sm, ey, em].every((value) => Number.isFinite(value))) return null;
  const diff = ((ey - sy) * 12) + (em - sm);
  if (diff < 0) return null;
  return diff;
}

function filterCohortRowsByRange(
  rows: Array<Record<string, string | number>>,
  startDate: string | null,
  endDate: string | null,
) {
  if (!rows.length) return [];
  const startMonth = startDate ? startDate.slice(0, 7) : null;
  const endMonth = endDate ? endDate.slice(0, 7) : null;
  const selectedWindowMaxOffset = monthsBetweenInclusive(startMonth, endMonth);
  return rows
    .filter((row) => {
      const cohort = String(row.cohort || "");
      if (!cohort) return false;
      if (startMonth && cohort < startMonth) return false;
      if (endMonth && cohort > endMonth) return false;
      return true;
    })
    .map((row) => {
      const next: Record<string, string | number | null> = { ...row };
      const maxExistingOffset = Object.keys(row)
        .filter((key) => key.startsWith("m"))
        .map((key) => Number(key.slice(1)))
        .filter((value) => Number.isFinite(value))
        .reduce((acc, value) => Math.max(acc, value), 0);
      const maxOffset = selectedWindowMaxOffset === null
        ? maxExistingOffset
        : Math.max(maxExistingOffset, selectedWindowMaxOffset);
      for (let offset = 0; offset <= maxOffset; offset += 1) {
        const key = `m${offset}`;
        if (!(key in next)) next[key] = null;
        if (!endMonth) continue;
        const month = addMonths(String(row.cohort || ""), offset);
        if (!month) continue;
        if (month > endMonth) next[key] = null;
      }
      return next;
    });
}

function sortByValueDesc<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.slice().sort((a, b) => safeNumber(b[key]) - safeNumber(a[key]));
}

function parseSources(sources: string[]) {
  const cleaned = (sources || []).map((value) => String(value || "").trim()).filter(Boolean);
  return cleaned.length ? cleaned : ["Sales"];
}

function clampRange(startDate: string | null, endDate: string | null, fallbackStart: string | null, fallbackEnd: string | null) {
  const start = asDate(startDate) || fallbackStart;
  const end = asDate(endDate) || fallbackEnd;
  if (!start || !end) return { startDate: null, endDate: null };
  if (start <= end) return { startDate: start, endDate: end };
  return { startDate: end, endDate: start };
}

function inRange(date: string, startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return false;
  return date >= startDate && date <= endDate;
}

async function loadKpiCache() {
  if (!cachePromise) {
    cachePromise = readFile(KPI_CACHE_PATH, "utf8")
      .then((text) => JSON.parse(text) as CacheFile)
      .catch((error) => {
        throw new Error(
          `TikTok KPI cache was not found at ${KPI_CACHE_PATH}. Run web/scripts/build-tiktok-kpi-cache.js first. (${error instanceof Error ? error.message : "unknown error"})`,
        );
      });
  }
  return cachePromise;
}

type DecodedCustomerIndex = {
  dates: string[];
  firstSeenOrdinal: Uint16Array;
  decodedDayIds: Map<string, number[]>;
};

function getDecodedCustomerIndex(bucket: BucketCache): DecodedCustomerIndex | null {
  const index = bucket.customer_index;
  if (!index?.dates?.length) return null;
  const existing = (bucket as unknown as { __decoded_customer_index?: DecodedCustomerIndex }).__decoded_customer_index;
  if (existing) return existing;
  const decoded: DecodedCustomerIndex = {
    dates: index.dates,
    firstSeenOrdinal: decodeUint16(index.first_seen_ordinal),
    decodedDayIds: new Map(),
  };
  (bucket as unknown as { __decoded_customer_index?: DecodedCustomerIndex }).__decoded_customer_index = decoded;
  return decoded;
}

export async function buildTiktokKpiPayload(args: QueryArgs) {
  const cache = await loadKpiCache();
  const activeTab = String(args.activeTab || "orders").trim() || "orders";
  const selectedSources = parseSources(args.sources || []);
  const orderBucketRaw = String(args.orderBucket || "paid_time").trim().toLowerCase();
  const orderBucket = orderBucketRaw === "created_time" ? "created_time" : orderBucketRaw === "file_month" ? "file_month" : "paid_time";
  const bucket = cache.buckets[orderBucket] || cache.buckets.paid_time;

  const range = clampRange(
    args.startDate || null,
    args.endDate || null,
    bucket.coverage.start_date,
    bucket.coverage.end_date,
  );

  const filteredDaily = (bucket.daily || []).filter((row) => inRange(row.reporting_date, range.startDate, range.endDate));
  const filteredProducts = (bucket.products || []).filter((row) => monthOverlapsRange(row.reporting_month, range.startDate, range.endDate));
  const filteredCities = (bucket.cities || []).filter((row) => monthOverlapsRange(row.reporting_month, range.startDate, range.endDate));
  const filteredZips = (bucket.zips || []).filter((row) => monthOverlapsRange(row.reporting_month, range.startDate, range.endDate));

  // Exact distinct-customer logic across the full selected range (no per-day double counting).
  const decodedIndex = getDecodedCustomerIndex(bucket);
  const uniqueCustomerIds = new Set<number>();
  let uniqueCustomers = 0;
  let newCustomers = 0;
  let repeatCustomers = 0;
  if (decodedIndex && range.startDate && range.endDate) {
    const startOrdinal = decodedIndex.dates.findIndex((date) => date >= range.startDate!);
    const endOrdinal = (() => {
      for (let index = decodedIndex.dates.length - 1; index >= 0; index -= 1) {
        if (decodedIndex.dates[index] <= range.endDate!) return index;
      }
      return -1;
    })();
    if (startOrdinal >= 0 && endOrdinal >= startOrdinal) {
      for (let ordinal = startOrdinal; ordinal <= endOrdinal; ordinal += 1) {
        const date = decodedIndex.dates[ordinal];
        let ids = decodedIndex.decodedDayIds.get(date);
        if (!ids) {
          ids = decodeVarintDeltas(bucket.customer_index?.day_customer_ids?.[date] || "");
          decodedIndex.decodedDayIds.set(date, ids);
        }
        ids.forEach((id) => uniqueCustomerIds.add(id));
      }
      uniqueCustomers = uniqueCustomerIds.size;
      uniqueCustomerIds.forEach((id) => {
        const firstSeen = decodedIndex.firstSeenOrdinal[id] ?? 65535;
        if (firstSeen >= startOrdinal && firstSeen <= endOrdinal) newCustomers += 1;
        else if (firstSeen < startOrdinal) repeatCustomers += 1;
      });
    }
  }

  const grossProductSales = sum(filteredDaily, (row) => row.gross_product_sales);
  const netProductSales = sum(filteredDaily, (row) => row.net_product_sales);
  const paidOrders = sum(filteredDaily, (row) => row.paid_orders);
  const validOrders = sum(filteredDaily, (row) => row.valid_orders);
  const unitsSold = sum(filteredDaily, (row) => row.units_sold);
  const refundedOrders = sum(filteredDaily, (row) => row.refunded_orders);
  const returnedUnits = sum(filteredDaily, (row) => row.returned_units);
  const deliveredOrders = sum(filteredDaily, (row) => row.delivered_orders);
  const canceledOrders = sum(filteredDaily, (row) => row.canceled_orders);
  if (!decodedIndex || !range.startDate || !range.endDate) {
    uniqueCustomers = sum(filteredDaily, (row) => row.unique_customers || 0);
    newCustomers = sum(filteredDaily, (row) => row.new_customers || 0);
    repeatCustomers = sum(filteredDaily, (row) => row.repeat_customers || 0);
  }
  const repeatCustomerRate = uniqueCustomers > 0 ? repeatCustomers / uniqueCustomers : 0;
  const aov = paidOrders > 0 ? grossProductSales / paidOrders : 0;
  const unitsPerPaidOrder = paidOrders > 0 ? unitsSold / paidOrders : 0;

  const statusCounts = new Map<string, number>();
  filteredDaily.forEach((row) => {
    Object.entries(row.status_counts || {}).forEach(([status, value]) => {
      statusCounts.set(status, (statusCounts.get(status) || 0) + safeNumber(value));
    });
  });
  const statusRows = sortByValueDesc(
    Array.from(statusCounts.entries()).map(([status, orders]) => ({ status, orders })),
    "orders",
  ).slice(0, 8);

  const productSummary = new Map<string, {
    product_name: string;
    units_sold: number;
    gross_sales: number;
    net_product_sales: number;
    unit_cogs: number;
    estimated_cogs: number;
  }>();
  filteredProducts.forEach((row) => {
    const key = String(row.product_name || "");
    const existing = productSummary.get(key) || {
      product_name: key,
      units_sold: 0,
      gross_sales: 0,
      net_product_sales: 0,
      unit_cogs: safeNumber(row.unit_cogs),
      estimated_cogs: 0,
    };
    existing.units_sold += safeNumber(row.units_sold);
    existing.gross_sales += safeNumber(row.gross_product_sales);
    existing.net_product_sales += safeNumber(row.net_product_sales);
    existing.estimated_cogs = existing.units_sold * existing.unit_cogs;
    productSummary.set(key, existing);
  });
  const productRows = sortByValueDesc(Array.from(productSummary.values()), "units_sold").map((row) => ({
    ...row,
    unit_mix_pct: unitsSold > 0 ? row.units_sold / unitsSold : 0,
    sales_mix_pct: grossProductSales > 0 ? row.gross_sales / grossProductSales : 0,
  }));

  const citySummary = new Map<string, { city: string; state: string; orders: number; unique_customers: number }>();
  filteredCities.forEach((row) => {
    const city = String(row.city || "").trim() || "Unknown";
    const state = String(row.state || "").trim();
    const key = `${city}__${state}`;
    const existing = citySummary.get(key) || { city, state, orders: 0, unique_customers: 0 };
    existing.orders += safeNumber(row.orders);
    existing.unique_customers += safeNumber(row.unique_customers);
    citySummary.set(key, existing);
  });
  const cityRowsBase = sortByValueDesc(Array.from(citySummary.values()), "unique_customers").slice(0, 12);
  const cityTotalCustomers = cityRowsBase.reduce((acc, row) => acc + row.unique_customers, 0);
  const cityRows = cityRowsBase.map((row) => ({
    ...row,
    share: cityTotalCustomers > 0 ? row.unique_customers / cityTotalCustomers : 0,
  }));

  const zipSummary = new Map<string, { zipcode: string; orders: number; unique_customers: number }>();
  filteredZips.forEach((row) => {
    const zipcode = String(row.zipcode || "").trim() || "Unknown";
    const existing = zipSummary.get(zipcode) || { zipcode, orders: 0, unique_customers: 0 };
    existing.orders += safeNumber(row.orders);
    existing.unique_customers += safeNumber(row.unique_customers);
    zipSummary.set(zipcode, existing);
  });
  const zipRows = sortByValueDesc(Array.from(zipSummary.values()), "unique_customers").slice(0, 20);

  const dailyRows = filteredDaily.map((row) => {
    return {
      reporting_date: row.reporting_date,
      gross_product_sales: row.gross_product_sales,
      net_product_sales: row.net_product_sales,
      paid_orders: row.paid_orders,
      valid_orders: row.valid_orders,
      units_sold: row.units_sold,
      unique_customers: safeNumber(row.unique_customers || 0),
      new_customers: safeNumber(row.new_customers || 0),
      repeat_customers: safeNumber(row.repeat_customers || 0),
    };
  });

  const cohortRows = filterCohortRowsByRange(
    (bucket.cohort_rows || []) as Array<Record<string, string | number>>,
    range.startDate,
    range.endDate,
  );
  const highlightedCity = cityRows[0];

  const tabs = {
    orders: {
      dailyRows,
      statusRows,
      productRows: productRows.slice(0, 10),
      cityRows: cityRows.slice(0, 10),
      cohortRows,
      snapshot: {
        netProductSales,
        aov,
        paidOrders,
        salesUnits: unitsSold,
        unitsPerPaidOrder,
        newCustomers,
        repeatCustomers,
        repeatCustomerRate,
      },
      health: {
        valid_orders: validOrders,
        cancellation_rate: paidOrders > 0 ? canceledOrders / paidOrders : 0,
        refund_rate: paidOrders > 0 ? refundedOrders / paidOrders : 0,
        return_rate: unitsSold > 0 ? returnedUnits / unitsSold : 0,
        delivery_rate: paidOrders > 0 ? deliveredOrders / paidOrders : 0,
      },
    },
    finance: {
      dailyRows: dailyRows.map((row) => ({
        reporting_date: row.reporting_date,
        gross_sales: row.gross_product_sales,
        net_sales: row.net_product_sales,
      })),
      summary: {
        gross_sales: grossProductSales,
        gross_sales_refund: 0,
        seller_discount: 0,
        seller_discount_refund: 0,
        net_sales: netProductSales,
        shipping: 0,
        fees: 0,
        adjustments: 0,
        payout_amount: netProductSales,
      },
      expenseRows: [],
      expenseDetailRows: [],
      reconciliationSummary: {
        matched_orders: paidOrders,
        unmatched_statement_rows: 0,
        matched_statement_amount: netProductSales,
        actual_fee_total: 0,
      },
    },
    reconciliation: {
      summary: {
        matched_orders: paidOrders,
        unmatched_statement_rows: 0,
        matched_statement_amount: netProductSales,
        actual_fee_total: 0,
      },
      matchedRows: [],
      unmatchedStatementRows: [],
      unmatchedOrderRows: [],
    },
    products: {
      productRows: productRows.slice(0, 12),
      detailRows: productRows,
      listingRows: productRows,
      summary: {
        coreProducts: productRows.length,
        listingRows: productRows.length,
        salesUnits: unitsSold,
        grossSales: grossProductSales,
        estimatedCogs: sum(productRows, (row) => row.estimated_cogs),
        sampleUnits: 0,
        replacementUnits: 0,
      },
      inventorySnapshot: {
        snapshotDate: null,
        rowsWithValues: productRows.length,
      },
      planningSignal: {
        forecastBaseline: "Trailing actuals",
        baselineWindow: range.startDate && range.endDate ? `${range.startDate} to ${range.endDate}` : "n/a",
        topReorderProduct: productRows[0]?.product_name || null,
        topReorderQty: productRows[0]?.units_sold || 0,
      },
    },
    customers: {
      cityRows: cityRows.slice(0, 10),
      zipRows,
      cohortRows,
      targetingSnapshot: {
        targetCityCustomers: highlightedCity?.unique_customers || 0,
        targetCityOrders: highlightedCity?.orders || 0,
        radiusCustomers: highlightedCity?.unique_customers || 0,
        radiusOrders: highlightedCity?.orders || 0,
        uniqueCustomers,
        repeatCustomers,
      },
    },
    audit: {
      dataQuality: {
        rows_loaded: cache.source.usable_rows,
        orders_loaded: paidOrders,
        blank_customer_rows: sum(filteredDaily, (row) => row.blank_customer_orders || 0),
        rows_without_city: filteredCities.filter((row) => !String(row.city || "").trim()).length,
        rows_without_zip: filteredZips.filter((row) => !String(row.zipcode || "").trim()).length,
        canceled_rows: canceledOrders,
      },
      reportHighlights: [
        `Coverage: ${bucket.coverage.start_date || "n/a"} to ${bucket.coverage.end_date || "n/a"}.`,
        `Order bucket: ${orderBucket}.`,
        "Unique/new/repeat customers use exact distinct counts via a compressed customer index.",
        "Finance tab is order-export based (statement-ledger fields are not loaded in this lean cache).",
      ],
      kpiRows: [
        {
          metric: "Gross product sales",
          category: "Orders",
          formatted_value: `$${grossProductSales.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
          formula: "SUM(SKU Subtotal Before Discount)",
          notes: "Order export based",
        },
        {
          metric: "Net product sales",
          category: "Orders",
          formatted_value: `$${netProductSales.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
          formula: "Gross less seller discount, return-adjusted",
          notes: "Order export based",
        },
        {
          metric: "Unique customers",
          category: "Customers",
          formatted_value: uniqueCustomers.toLocaleString("en-US"),
          formula: "COUNT DISTINCT(customer proxy in selected slice)",
          notes: "Proxy = username/nickname/recipient",
        },
      ],
    },
  };

  return {
    filters: {
      activeTab,
      output: "analysis_output",
      dateBasis: args.dateBasis || "order",
      orderBucket,
      startDate: range.startDate,
      endDate: range.endDate,
      selectedSources,
    },
    badges: {
      sliceLabel: range.startDate && range.endDate ? `${range.startDate} to ${range.endDate}` : "No date slice",
      sourcesLabel: selectedSources.join(", "),
      dateBasisLabel: args.dateBasis || "order",
      orderBucketLabel: orderBucket,
    },
    freshness: [
      { label: "Data built", value: cache.generated_at },
      { label: "Coverage", value: bucket.coverage.start_date && bucket.coverage.end_date ? `${bucket.coverage.start_date} to ${bucket.coverage.end_date}` : "n/a" },
    ],
    cards: {
      grossProductSales,
      netProductSales,
      aov,
      paidOrders,
      unitsSold,
      uniqueCustomers,
      newCustomers,
      repeatCustomers,
      repeatCustomerRate,
    },
    tabs,
  };
}
