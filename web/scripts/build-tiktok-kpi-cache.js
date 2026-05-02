/* eslint-disable no-console */
const fs = require("node:fs/promises");
const path = require("node:path");

const MONTHS = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const PRODUCT_NAME_ALIASES = {
  "birria bombs 2p": "Birria Bomb 2-Pack",
  "birria bomb 2p": "Birria Bomb 2-Pack",
  "birria bomb 2-pack": "Birria Bomb 2-Pack",
  "brine bombs": "Brine Bomb",
  "brine bomb": "Brine Bomb",
  "chile colorado bombs 2p": "Chile Colorado Bomb 2-Pack",
  "chile colorado bomb 2p": "Chile Colorado Bomb 2-Pack",
  "chile colorado bomb 2-pack": "Chile Colorado Bomb 2-Pack",
  "pozole bombs 2p": "Pozole Bomb 2-Pack",
  "pozole bomb 2p": "Pozole Bomb 2-Pack",
  "pozole bomb 2-pack": "Pozole Bomb 2-Pack",
  "pozole verde bombs 2p": "Pozole Verde Bomb 2-Pack",
  "pozole verde bomb 2p": "Pozole Verde Bomb 2-Pack",
  "pozole verde bomb 2-pack": "Pozole Verde Bomb 2-Pack",
  "tinga bombs 2p": "Tinga Bomb 2-Pack",
  "tinga bomb 2p": "Tinga Bomb 2-Pack",
  "tinga bomb 2-pack": "Tinga Bomb 2-Pack",
  "variety pack": "Variety Pack",
};

const DEFAULT_PRODUCT_UNIT_PRICES = {
  "Birria Bomb 2-Pack": 19.99,
  "Chile Colorado Bomb 2-Pack": 19.99,
  "Pozole Bomb 2-Pack": 19.99,
  "Pozole Verde Bomb 2-Pack": 19.99,
  "Tinga Bomb 2-Pack": 19.99,
  "Brine Bomb": 19.99,
  "Variety Pack": 49.99,
};

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\uFEFF/g, "").replace(/\u200B/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeZip(value) {
  const digits = clean(value).replace(/\D+/g, "");
  return digits.slice(0, 5);
}

function parseNumber(value) {
  const cleaned = clean(value)
    .replaceAll(",", "")
    .replaceAll("$", "")
    .replace(/^\((.*)\)$/, "-$1");
  if (!cleaned) return 0;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function encodeVarintDeltas(values) {
  if (!Array.isArray(values) || !values.length) return "";
  const bytes = [];
  let previous = 0;
  values.forEach((raw, index) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const current = value < 0 ? 0 : Math.floor(value);
    const delta = index === 0 ? current : Math.max(0, current - previous);
    previous = current;
    let num = delta;
    while (num >= 0x80) {
      bytes.push((num & 0x7f) | 0x80);
      num >>>= 7;
    }
    bytes.push(num & 0x7f);
  });
  return Buffer.from(bytes).toString("base64url");
}

function encodeUint16(values) {
  if (!Array.isArray(values) || !values.length) return "";
  const arr = new Uint16Array(values.length);
  values.forEach((value, index) => {
    const numeric = Number(value);
    arr[index] = Number.isFinite(numeric) && numeric >= 0 ? Math.min(65535, Math.floor(numeric)) : 65535;
  });
  return Buffer.from(arr.buffer).toString("base64url");
}

function parseDate(value) {
  const raw = clean(value);
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString().slice(0, 10);
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      if (row.some((cell) => clean(cell))) rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  row.push(current);
  if (row.some((cell) => clean(cell))) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => clean(header));
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])));
}

function pickColumn(columns, exactCandidates, keywordGroups) {
  const normalizedMap = new Map(columns.map((column) => [column, normalizeKey(column)]));
  const exact = new Set(exactCandidates.map((candidate) => normalizeKey(candidate)));
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

function inferFileMonth(fileName) {
  const base = clean(path.basename(fileName, path.extname(fileName))).toLowerCase();
  const monthNameMatch = base.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b.*?\b(20\d{2})\b/);
  if (monthNameMatch) {
    const month = MONTHS[monthNameMatch[1]];
    const year = Number(monthNameMatch[2]);
    if (month && year) return `${year}-${String(month).padStart(2, "0")}-01`;
  }
  const yearMonthMatch = base.match(/\b(20\d{2})[-_ ](0[1-9]|1[0-2])\b/);
  if (yearMonthMatch) {
    return `${yearMonthMatch[1]}-${yearMonthMatch[2]}-01`;
  }
  return null;
}

function canonicalCoreName(value) {
  const canonical = PRODUCT_NAME_ALIASES[normalizeKey(value)];
  return canonical || "";
}

function isIgnoredMappingValue(value) {
  return ["ignore", "ignored", "non-planning", "non planning", "exclude", "excluded"].includes(normalizeKey(value));
}

function parseSkuMappings(csvText) {
  const rows = parseCsv(csvText);
  const bySkuId = new Map();
  const byProductName = new Map();
  for (const row of rows) {
    const skuId = clean(row["SKU ID"]);
    const productName = clean(row["Product Name"]);
    if (!skuId || !productName) continue;
    const counts = new Map();
    let ignored = false;
    ["Product 1", "Product 2", "Product 3", "Product 4"].forEach((column) => {
      const raw = clean(row[column]);
      if (!raw) return;
      if (isIgnoredMappingValue(raw)) {
        ignored = true;
        return;
      }
      const canonical = canonicalCoreName(raw);
      if (!canonical) return;
      counts.set(canonical, (counts.get(canonical) || 0) + 1);
    });
    const mapping = {
      skuId,
      productName,
      ignored,
      components: Array.from(counts.entries()).map(([componentName, units]) => ({ productName: componentName, units })),
    };
    bySkuId.set(normalizeKey(skuId), mapping);
    byProductName.set(normalizeKey(productName), mapping);
  }
  return { bySkuId, byProductName };
}

function findMapping(line, mappings) {
  const candidates = [line.sku_id, line.seller_sku_resolved, line.product_name].map((value) => normalizeKey(value)).filter(Boolean);
  for (const candidate of candidates) {
    if (mappings.bySkuId.has(candidate)) return mappings.bySkuId.get(candidate);
  }
  for (const candidate of candidates) {
    if (mappings.byProductName.has(candidate)) return mappings.byProductName.get(candidate);
  }
  const canonical = canonicalCoreName(line.product_name);
  if (canonical) {
    return {
      skuId: line.sku_id || line.seller_sku_resolved || line.product_name,
      productName: line.product_name,
      ignored: false,
      components: [{ productName: canonical, units: 1 }],
    };
  }
  return null;
}

function makeBucketState() {
  return {
    orderFacts: new Map(),
    dailyCustomerSets: new Map(),
    monthlyCustomerSets: new Map(),
    customerFirstSeen: new Map(),
    products: new Map(),
    cities: new Map(),
    zips: new Map(),
  };
}

function customerProxyKey(row, columns) {
  const username = clean(row[columns.buyerUsername]);
  const nickname = clean(row[columns.buyerNickname]);
  const recipient = clean(row[columns.recipient]);
  const proxy = username || nickname || recipient;
  return normalizeKey(proxy);
}

function normalizeStatusLabel(status) {
  const key = normalizeKey(status);
  if (!key) return "Unknown";
  if (key.includes("cancel")) return "Cancelled";
  if (key.includes("deliver")) return "Delivered";
  if (key.includes("return")) return "Returned";
  if (key.includes("ship")) return "To ship";
  return clean(status) || "Unknown";
}

function increaseMapCount(map, key, delta) {
  map.set(key, (map.get(key) || 0) + delta);
}

function cohortRowsFromMonthlySets(monthlySets) {
  const months = Array.from(monthlySets.keys()).sort();
  if (!months.length) return [];
  const rows = [];
  for (let index = 0; index < months.length; index += 1) {
    const cohortMonth = months[index];
    const cohortSet = monthlySets.get(cohortMonth) || new Set();
    if (!cohortSet.size) continue;
    const row = { cohort: cohortMonth };
    const maxOffset = months.length - index - 1;
    for (let offset = 0; offset <= maxOffset; offset += 1) {
      const comparisonMonth = months[index + offset];
      if (!comparisonMonth) break;
      const comparisonSet = monthlySets.get(comparisonMonth) || new Set();
      let retained = 0;
      for (const id of cohortSet) {
        if (comparisonSet.has(id)) retained += 1;
      }
      row[`m${offset}`] = cohortSet.size > 0 ? retained / cohortSet.size : 0;
    }
    rows.push(row);
  }
  return rows;
}

function topRowsPerMonth(rows, monthKey, valueKey, limit) {
  const grouped = new Map();
  rows.forEach((row) => {
    const month = String(row[monthKey] || "");
    const list = grouped.get(month) || [];
    list.push(row);
    grouped.set(month, list);
  });
  const output = [];
  Array.from(grouped.keys()).sort().forEach((month) => {
    const list = grouped.get(month) || [];
    list.sort((a, b) => Number(b[valueKey] || 0) - Number(a[valueKey] || 0));
    output.push(...list.slice(0, limit));
  });
  return output;
}

async function main() {
  const dataRoot = process.argv[2] || path.resolve(process.cwd(), "..", "Data", "All orders");
  const outFile = process.argv[3] || path.resolve(process.cwd(), "data", "tiktok_kpi_cache.json");
  const skuMappingFile = path.resolve(process.cwd(), "data", "tiktok_sku_mapping.csv");
  const plannerSettingsFile = path.resolve(process.cwd(), "data", "planner_shared_settings.json");

  const [mappingCsv, plannerSettingsText] = await Promise.all([
    fs.readFile(skuMappingFile, "utf8"),
    fs.readFile(plannerSettingsFile, "utf8").catch(() => "{}"),
  ]);
  const mappings = parseSkuMappings(mappingCsv);
  const plannerSettings = JSON.parse(plannerSettingsText || "{}");
  const cogsByProduct = Object.fromEntries(
    Object.entries(plannerSettings?.products || {}).map(([name, row]) => [name, Number(row?.cogs || 0)]),
  );

  const entries = await fs.readdir(dataRoot, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv"))
    .map((entry) => path.join(dataRoot, entry.name))
    .sort((a, b) => a.localeCompare(b));
  if (!files.length) throw new Error(`No CSV files found in ${dataRoot}`);

  const buckets = {
    paid_time: makeBucketState(),
    created_time: makeBucketState(),
    file_month: makeBucketState(),
  };
  const customerIdByKey = new Map();
  const customerKeyById = [];

  let totalRawRows = 0;
  let totalUsableRows = 0;
  let fileMonthFallbackFromData = null;

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const rows = parseCsv(text);
    totalRawRows += rows.length;
    if (!rows.length) continue;
    const columns = Object.keys(rows[0] || {});
    const columnMap = {
      orderId: pickColumn(columns, ["Order ID"], [["order", "id"]]),
      orderStatus: pickColumn(columns, ["Order Status"], [["order", "status"]]),
      orderSubstatus: pickColumn(columns, ["Order Substatus"], [["order", "substatus"]]),
      cancelType: pickColumn(columns, ["Cancelation/Return Type", "Cancellation/Return Type"], [["cancel", "return", "type"]]),
      quantity: pickColumn(columns, ["Quantity"], [["quantity"]]),
      returnedQuantity: pickColumn(columns, ["Sku Quantity of return", "SKU Quantity of return"], [["return", "quantity"]]),
      grossSales: pickColumn(columns, ["SKU Subtotal Before Discount"], [["sku", "subtotal", "before", "discount"]]),
      sellerDiscount: pickColumn(columns, ["SKU Seller Discount"], [["seller", "discount"]]),
      orderRefundAmount: pickColumn(columns, ["Order Refund Amount"], [["refund", "amount"]]),
      paidTime: pickColumn(columns, ["Paid Time"], [["paid", "time"]]),
      createdTime: pickColumn(columns, ["Created Time"], [["created", "time"]]),
      deliveredTime: pickColumn(columns, ["Delivered Time"], [["delivered", "time"]]),
      cancelledTime: pickColumn(columns, ["Cancelled Time", "Canceled Time"], [["cancel", "time"]]),
      productName: pickColumn(columns, ["Product Name"], [["product", "name"]]),
      skuId: pickColumn(columns, ["SKU ID", "Sku ID"], [["sku", "id"]]),
      sellerSku: pickColumn(columns, ["Seller SKU"], [["seller", "sku"]]),
      bundleSku: pickColumn(columns, ["Virtual Bundle Seller SKU", " Virtual Bundle Seller SKU"], [["virtual", "bundle", "seller", "sku"]]),
      buyerUsername: pickColumn(columns, ["Buyer Username"], [["buyer", "username"]]),
      buyerNickname: pickColumn(columns, ["Buyer Nickname"], [["buyer", "nickname"]]),
      recipient: pickColumn(columns, ["Recipient"], [["recipient"]]),
      city: pickColumn(columns, ["City"], [["city"]]),
      state: pickColumn(columns, ["State"], [["state"]]),
      zipcode: pickColumn(columns, ["Zipcode", "Zip Code"], [["zip"]]),
    };

    const fileMonthDate = inferFileMonth(file);
    let usableInFile = 0;
    for (const row of rows) {
      const orderId = clean(row[columnMap.orderId]);
      const productName = clean(row[columnMap.productName]);
      if (!orderId || !productName) continue;

      const paidDate = parseDate(row[columnMap.paidTime]);
      const createdDate = parseDate(row[columnMap.createdTime]);
      if (!paidDate && !createdDate) continue;
      if (!fileMonthFallbackFromData) fileMonthFallbackFromData = paidDate || createdDate || null;
      const fileMonth = fileMonthDate || (fileMonthFallbackFromData ? `${fileMonthFallbackFromData.slice(0, 7)}-01` : null);
      if (!fileMonth) continue;

      const quantity = Math.max(0, parseNumber(row[columnMap.quantity]));
      const returnedQuantity = Math.max(0, parseNumber(row[columnMap.returnedQuantity]));
      const grossSales = Math.max(0, parseNumber(row[columnMap.grossSales]));
      const sellerDiscount = Math.max(0, parseNumber(row[columnMap.sellerDiscount]));
      const orderRefundAmount = Math.max(0, parseNumber(row[columnMap.orderRefundAmount]));
      const orderStatus = clean(row[columnMap.orderStatus]);
      const orderSubstatus = clean(row[columnMap.orderSubstatus]);
      const cancelType = clean(row[columnMap.cancelType]);
      const statusText = `${orderStatus} ${orderSubstatus} ${cancelType}`.toLowerCase();
      const isCancelled = statusText.includes("cancel") || Boolean(parseDate(row[columnMap.cancelledTime]));
      const delivered = Boolean(parseDate(row[columnMap.deliveredTime])) || statusText.includes("delivered");
      const refunded = orderRefundAmount > 0 || statusText.includes("refund") || statusText.includes("return");
      const netUnits = isCancelled ? 0 : Math.max(quantity - returnedQuantity, 0);
      const grossLessSellerDiscount = Math.max(grossSales - sellerDiscount, 0);
      const netGrossSales = isCancelled || netUnits <= 0
        ? 0
        : quantity > 0
          ? roundCurrency(grossLessSellerDiscount * (netUnits / quantity))
          : grossLessSellerDiscount;

      const rawCustomerKey = customerProxyKey(row, columnMap);
      let customerId = null;
      if (rawCustomerKey) {
        if (!customerIdByKey.has(rawCustomerKey)) {
          const nextId = customerKeyById.length;
          customerIdByKey.set(rawCustomerKey, nextId);
          customerKeyById.push(rawCustomerKey);
        }
        customerId = customerIdByKey.get(rawCustomerKey);
      }

      const line = {
        order_id: orderId,
        product_name: productName,
        sku_id: clean(row[columnMap.skuId]),
        seller_sku_resolved: clean(row[columnMap.sellerSku]) || clean(row[columnMap.bundleSku]),
        quantity,
        returned_quantity: returnedQuantity,
        gross_sales: grossSales,
        net_gross_sales: netGrossSales,
        net_units: netUnits,
        refunded,
        is_cancelled: isCancelled,
        delivered,
        status_label: normalizeStatusLabel(orderStatus),
        customer_id: customerId,
        state: clean(row[columnMap.state]),
        city: clean(row[columnMap.city]),
        zipcode: normalizeZip(row[columnMap.zipcode]),
      };

      const bucketDates = {
        paid_time: paidDate,
        created_time: createdDate || paidDate,
        file_month: fileMonth,
      };
      for (const [bucketName, reportingDate] of Object.entries(bucketDates)) {
        if (!reportingDate) continue;
        const bucket = buckets[bucketName];
        const orderKey = `${reportingDate}__${orderId}`;
        const existing = bucket.orderFacts.get(orderKey) || {
          reporting_date: reportingDate,
          order_id: orderId,
          customer_id: customerId,
          gross_product_sales: 0,
          net_product_sales: 0,
          units_sold: 0,
          returned_units: 0,
          valid_order: true,
          refunded: false,
          delivered: false,
          status_counts: new Map(),
          city: line.city,
          state: line.state,
          zipcode: line.zipcode,
        };
        existing.gross_product_sales = roundCurrency(existing.gross_product_sales + line.gross_sales);
        existing.net_product_sales = roundCurrency(existing.net_product_sales + line.net_gross_sales);
        existing.units_sold += line.net_units;
        existing.returned_units += line.returned_quantity;
        existing.valid_order = existing.valid_order && !line.is_cancelled;
        existing.refunded = existing.refunded || line.refunded;
        existing.delivered = existing.delivered || line.delivered;
        existing.city = existing.city || line.city;
        existing.state = existing.state || line.state;
        existing.zipcode = existing.zipcode || line.zipcode;
        if (line.customer_id !== null && line.customer_id !== undefined && existing.customer_id === null) {
          existing.customer_id = line.customer_id;
        }
        increaseMapCount(existing.status_counts, line.status_label, 1);
        bucket.orderFacts.set(orderKey, existing);

        if (line.customer_id !== null && line.customer_id !== undefined) {
          const dailySet = bucket.dailyCustomerSets.get(reportingDate) || new Set();
          dailySet.add(line.customer_id);
          bucket.dailyCustomerSets.set(reportingDate, dailySet);

          const monthKey = reportingDate.slice(0, 7);
          const monthSet = bucket.monthlyCustomerSets.get(monthKey) || new Set();
          monthSet.add(line.customer_id);
          bucket.monthlyCustomerSets.set(monthKey, monthSet);

          const firstSeen = bucket.customerFirstSeen.get(line.customer_id);
          if (!firstSeen || reportingDate < firstSeen) {
            bucket.customerFirstSeen.set(line.customer_id, reportingDate);
          }
        }

        const mapping = findMapping(line, mappings);
        if (!mapping || mapping.ignored) continue;
        const components = mapping.components?.length
          ? mapping.components
          : (canonicalCoreName(line.product_name) ? [{ productName: canonicalCoreName(line.product_name), units: 1 }] : []);
        if (!components.length) continue;
        const reportingMonth = reportingDate.slice(0, 7);
        const totalValue = components.reduce((sum, component) => {
          const unitPrice = DEFAULT_PRODUCT_UNIT_PRICES[component.productName] || 1;
          return sum + (component.units * unitPrice);
        }, 0) || 1;
        for (const component of components) {
          const key = `${reportingMonth}__${component.productName}`;
          const product = bucket.products.get(key) || {
            reporting_month: reportingMonth,
            product_name: component.productName,
            units_sold: 0,
            gross_product_sales: 0,
            net_product_sales: 0,
            unit_cogs: Number(cogsByProduct[component.productName] || 0),
          };
          const unitPrice = DEFAULT_PRODUCT_UNIT_PRICES[component.productName] || 1;
          const share = (component.units * unitPrice) / totalValue;
          product.units_sold += line.net_units * component.units;
          product.gross_product_sales = roundCurrency(product.gross_product_sales + (line.gross_sales * share));
          product.net_product_sales = roundCurrency(product.net_product_sales + (line.net_gross_sales * share));
          bucket.products.set(key, product);
        }

        const cityKey = `${reportingMonth}__${normalizeKey(line.city)}__${normalizeKey(line.state)}`;
        const cityRow = bucket.cities.get(cityKey) || {
          reporting_month: reportingMonth,
          city: line.city || "",
          state: line.state || "",
          orders: 0,
          customer_ids: new Set(),
        };
        cityRow.orders += 1;
        if (line.customer_id !== null && line.customer_id !== undefined) cityRow.customer_ids.add(line.customer_id);
        bucket.cities.set(cityKey, cityRow);

        const zipKey = `${reportingMonth}__${line.zipcode || ""}`;
        const zipRow = bucket.zips.get(zipKey) || {
          reporting_month: reportingMonth,
          zipcode: line.zipcode || "",
          orders: 0,
          customer_ids: new Set(),
        };
        zipRow.orders += 1;
        if (line.customer_id !== null && line.customer_id !== undefined) zipRow.customer_ids.add(line.customer_id);
        bucket.zips.set(zipKey, zipRow);
      }
      usableInFile += 1;
    }
    totalUsableRows += usableInFile;
    console.log(`Parsed ${path.basename(file)} -> ${usableInFile} usable rows`);
  }

  const outputBuckets = {};
  for (const [bucketName, state] of Object.entries(buckets)) {
    const dailyRowsMap = new Map();
    for (const fact of state.orderFacts.values()) {
      const daily = dailyRowsMap.get(fact.reporting_date) || {
        reporting_date: fact.reporting_date,
        gross_product_sales: 0,
        net_product_sales: 0,
        paid_orders: 0,
        valid_orders: 0,
        units_sold: 0,
        refunded_orders: 0,
        returned_units: 0,
        delivered_orders: 0,
        canceled_orders: 0,
        blank_customer_orders: 0,
        status_counts: {},
      };
      daily.gross_product_sales = roundCurrency(daily.gross_product_sales + fact.gross_product_sales);
      daily.net_product_sales = roundCurrency(daily.net_product_sales + fact.net_product_sales);
      daily.paid_orders += 1;
      daily.valid_orders += fact.valid_order ? 1 : 0;
      daily.units_sold += fact.units_sold;
      daily.refunded_orders += fact.refunded ? 1 : 0;
      daily.returned_units += fact.returned_units;
      daily.delivered_orders += fact.delivered ? 1 : 0;
      daily.canceled_orders += fact.valid_order ? 0 : 1;
      daily.blank_customer_orders += fact.customer_id === null || fact.customer_id === undefined ? 1 : 0;
      for (const [label, count] of fact.status_counts.entries()) {
        daily.status_counts[label] = (daily.status_counts[label] || 0) + count;
      }
      dailyRowsMap.set(fact.reporting_date, daily);
    }

    for (const [date, ids] of state.dailyCustomerSets.entries()) {
      const daily = dailyRowsMap.get(date) || {
        reporting_date: date,
        gross_product_sales: 0,
        net_product_sales: 0,
        paid_orders: 0,
        valid_orders: 0,
        units_sold: 0,
        refunded_orders: 0,
        returned_units: 0,
        delivered_orders: 0,
        canceled_orders: 0,
        blank_customer_orders: 0,
        status_counts: {},
      };
      let dayNew = 0;
      let dayRepeat = 0;
      ids.forEach((id) => {
        const firstSeen = state.customerFirstSeen.get(id);
        if (!firstSeen) return;
        if (firstSeen === date) dayNew += 1;
        else if (firstSeen < date) dayRepeat += 1;
      });
      daily.unique_customers = ids.size;
      daily.new_customers = dayNew;
      daily.repeat_customers = dayRepeat;
      dailyRowsMap.set(date, daily);
    }

    const cityRowsRaw = Array.from(state.cities.values()).map((row) => ({
      reporting_month: row.reporting_month,
      city: row.city,
      state: row.state,
      orders: row.orders,
      unique_customers: row.customer_ids.size,
    })).sort((a, b) => a.reporting_month.localeCompare(b.reporting_month) || a.city.localeCompare(b.city));

    const zipRowsRaw = Array.from(state.zips.values()).map((row) => ({
      reporting_month: row.reporting_month,
      zipcode: row.zipcode,
      orders: row.orders,
      unique_customers: row.customer_ids.size,
    })).sort((a, b) => a.reporting_month.localeCompare(b.reporting_month) || String(a.zipcode).localeCompare(String(b.zipcode)));

    const cityRows = topRowsPerMonth(cityRowsRaw, "reporting_month", "unique_customers", 250);
    const zipRows = topRowsPerMonth(zipRowsRaw, "reporting_month", "unique_customers", 500);
    const productRows = topRowsPerMonth(
      Array.from(state.products.values()).sort((a, b) => a.reporting_month.localeCompare(b.reporting_month) || a.product_name.localeCompare(b.product_name)),
      "reporting_month",
      "units_sold",
      80,
    );

    const indexDates = Array.from(dailyRowsMap.keys()).sort();
    const dateOrdinalMap = new Map(indexDates.map((date, index) => [date, index]));
    const dayCustomerIds = {};
    indexDates.forEach((date) => {
      const ids = Array.from((state.dailyCustomerSets.get(date) || new Set()).values()).sort((a, b) => a - b);
      dayCustomerIds[date] = encodeVarintDeltas(ids);
    });
    const customerCount = customerKeyById.length;
    const firstSeenOrdinal = new Array(customerCount).fill(65535);
    state.customerFirstSeen.forEach((date, customerId) => {
      const ordinal = dateOrdinalMap.get(date);
      if (ordinal === undefined) return;
      if (customerId < 0 || customerId >= customerCount) return;
      firstSeenOrdinal[customerId] = ordinal;
    });

    outputBuckets[bucketName] = {
      coverage: {
        start_date: Array.from(dailyRowsMap.keys()).sort()[0] || null,
        end_date: Array.from(dailyRowsMap.keys()).sort().at(-1) || null,
      },
      daily: Array.from(dailyRowsMap.values()).sort((a, b) => a.reporting_date.localeCompare(b.reporting_date)),
      products: productRows,
      cities: cityRows,
      zips: zipRows,
      cohort_rows: cohortRowsFromMonthlySets(state.monthlyCustomerSets),
      customer_index: {
        dates: indexDates,
        day_customer_ids: dayCustomerIds,
        first_seen_ordinal: encodeUint16(firstSeenOrdinal),
        customer_count: customerCount,
      },
    };
  }

  const output = {
    generated_at: new Date().toISOString(),
    source: {
      files: files.length,
      raw_rows: totalRawRows,
      usable_rows: totalUsableRows,
      unique_customers: customerKeyById.length,
    },
    buckets: outputBuckets,
  };

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(output), "utf8");

  console.log("Done.");
  console.log(JSON.stringify({
    output: outFile,
    files: files.length,
    rawRows: totalRawRows,
    usableRows: totalUsableRows,
    uniqueCustomers: customerKeyById.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
