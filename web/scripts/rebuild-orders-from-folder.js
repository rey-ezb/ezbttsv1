/* eslint-disable no-console */
const fs = require("node:fs/promises");
const path = require("node:path");

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\uFEFF/g, "").replace(/\u200B/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeColumn(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pickColumn(columns, exactCandidates, keywordGroups) {
  const normalizedMap = new Map(columns.map((column) => [column, normalizeColumn(column)]));
  const exact = new Set(exactCandidates.map((candidate) => normalizeColumn(candidate)));
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

function parseNumber(value) {
  const cleaned = clean(value)
    .replaceAll(",", "")
    .replaceAll("$", "")
    .replace(/^\((.*)\)$/, "-$1");
  if (!cleaned) return 0;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
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

function normalizeUploadRows(rawRows, platform) {
  if (!rawRows.length) return [];
  const columns = Object.keys(rawRows[0] || {});
  const orderStatusCol = pickColumn(columns, ["Order Status"], [["order", "status"]]);
  const orderSubstatusCol = pickColumn(columns, ["Order Substatus"], [["order", "substatus"]]);
  const cancelTypeCol = pickColumn(columns, ["Cancelation/Return Type", "Cancellation/Return Type"], [["cancel", "return", "type"]]);
  const skuIdCol = pickColumn(columns, ["SKU ID", "Sku ID"], [["sku", "id"]]);
  const productNameCol = pickColumn(columns, ["Product Name"], [["product", "name"]]);
  const sellerSkuCol = pickColumn(columns, ["Seller SKU"], [["seller", "sku"]]);
  const bundleSkuCol = pickColumn(columns, ["Virtual Bundle Seller SKU", " Virtual Bundle Seller SKU"], [["virtual", "bundle", "seller", "sku"]]);
  const quantityCol = pickColumn(columns, ["Quantity"], [["quantity"]]);
  const returnedQuantityCol = pickColumn(columns, ["Sku Quantity of return", "SKU Quantity of return"], [["return", "quantity"]]);
  const grossSalesCol = pickColumn(columns, ["SKU Subtotal Before Discount"], [["sku", "subtotal", "before", "discount"]]);
  const sellerDiscountCol = pickColumn(columns, ["SKU Seller Discount"], [["sku", "seller", "discount"], ["seller", "discount"]]);
  const paidTimeCol = pickColumn(columns, ["Paid Time"], [["paid", "time"]]);
  const createdTimeCol = pickColumn(columns, ["Created Time"], [["created", "time"]]);
  const cancelledTimeCol = pickColumn(columns, ["Cancelled Time", "Canceled Time"], [["cancelled", "time"], ["canceled", "time"]]);

  return rawRows.map((row) => {
    const orderStatus = clean(row[orderStatusCol]);
    const orderSubstatus = clean(row[orderSubstatusCol]);
    const cancelType = clean(row[cancelTypeCol]);
    const productName = clean(row[productNameCol]);
    const quantity = parseNumber(row[quantityCol]);
    const returnedQuantity = parseNumber(row[returnedQuantityCol]);
    const grossSales = parseNumber(row[grossSalesCol]);
    const sellerDiscount = parseNumber(sellerDiscountCol ? row[sellerDiscountCol] : 0);
    const paidDate = parseDate(row[paidTimeCol]);
    const createdDate = parseDate(row[createdTimeCol]);
    const orderDate = paidDate || createdDate;
    const statusText = `${orderStatus} ${orderSubstatus} ${cancelType}`.toLowerCase();
    const isCancelled = statusText.includes("cancel") || Boolean(parseDate(row[cancelledTimeCol]));
    const netUnits = isCancelled ? 0 : Math.max(quantity - returnedQuantity, 0);
    const grossLessSellerDiscount = Math.max(grossSales - sellerDiscount, 0);
    const netGrossSalesEst =
      isCancelled || netUnits <= 0
        ? 0
        : quantity > 0
          ? Math.round((grossLessSellerDiscount * (netUnits / quantity)) * 100) / 100
          : grossLessSellerDiscount;
    return {
      platform: clean(platform) || "TikTok",
      order_date: orderDate,
      paid_date: paidDate,
      created_date: createdDate,
      sku_id: clean(row[skuIdCol]),
      product_name: productName,
      seller_sku_resolved: clean(row[sellerSkuCol]) || clean(row[bundleSkuCol]),
      net_units: netUnits,
      gross_sales: grossSales,
      net_gross_sales: netGrossSalesEst,
    };
  }).filter((row) => (row.order_date || row.paid_date || row.created_date) && row.product_name);
}

function buildLeanRows(rows, platform) {
  const grouped = new Map();
  for (const row of rows) {
    const paidDate = clean(row.paid_date || row.order_date).slice(0, 10);
    const createdDate = clean(row.created_date || row.order_date || row.paid_date).slice(0, 10);
    const orderDate = paidDate || createdDate;
    if (!orderDate) continue;
    const skuId = clean(row.sku_id);
    const listingName = clean(row.product_name);
    const sellerSku = clean(row.seller_sku_resolved);
    const key = `${paidDate}__${createdDate}__${skuId}__${sellerSku}__${listingName}`;
    const current = grouped.get(key) || {
      platform: clean(platform) || "TikTok",
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
    current.gross_sales = Math.round((Number(current.gross_sales || 0) + Number(row.gross_sales || 0)) * 100) / 100;
    current.net_gross_sales = Math.round((Number(current.net_gross_sales || 0) + Number(row.net_gross_sales || 0)) * 100) / 100;
    grouped.set(key, current);
  }
  return Array.from(grouped.values());
}

function chunkRowsByPaidDate(rows, maxRows = 1500) {
  const byDate = new Map();
  for (const row of rows) {
    const date = clean(row.paid_date || row.order_date).slice(0, 10);
    if (!date) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(row);
  }
  const dates = Array.from(byDate.keys()).sort();
  const chunks = [];
  let currentDates = [];
  let currentRows = [];
  let currentCount = 0;
  for (const date of dates) {
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
  }
  if (currentCount) chunks.push({ uploadedDates: currentDates, rows: currentRows });
  return chunks;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return data;
}

async function main() {
  const dataRoot = process.argv[2] || path.resolve(process.cwd(), "..", "Data", "All orders");
  const apiBase = process.argv[3] || "http://127.0.0.1:3000";
  const platform = process.argv[4] || "TikTok";
  const entries = await fs.readdir(dataRoot, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv"))
    .map((entry) => path.join(dataRoot, entry.name))
    .sort((a, b) => a.localeCompare(b));
  if (!files.length) throw new Error(`No CSV files found in ${dataRoot}`);

  console.log(`Found ${files.length} order CSV files. Parsing...`);
  let rawRowCount = 0;
  let sourceRowCount = 0;
  const normalizedRows = [];
  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const rawRows = parseCsv(text);
    rawRowCount += rawRows.length;
    const rows = normalizeUploadRows(rawRows, platform);
    sourceRowCount += rows.length;
    normalizedRows.push(...rows);
    console.log(`Parsed ${path.basename(file)} -> ${rows.length} usable rows`);
  }

  const leanRows = buildLeanRows(normalizedRows, platform);
  const uploadedDates = Array.from(
    new Set(leanRows.map((row) => clean(row.paid_date || row.order_date).slice(0, 10)).filter(Boolean)),
  ).sort();
  const chunks = chunkRowsByPaidDate(leanRows, 1500);
  console.log(`Prepared ${leanRows.length} lean rows across ${uploadedDates.length} paid dates (${chunks.length} chunks).`);

  let totalRowsWritten = 0;
  let totalSkuRowsWritten = 0;
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const range = chunk.uploadedDates.length
      ? `${chunk.uploadedDates[0]} -> ${chunk.uploadedDates[chunk.uploadedDates.length - 1]}`
      : "n/a";
    console.log(`Uploading chunk ${index + 1}/${chunks.length} (${range})...`);
    const result = await postJson(`${apiBase}/api/upload/orders`, {
      platform,
      rows: chunk.rows,
      uploadedDates: chunk.uploadedDates,
      rawRowCount: index === 0 ? rawRowCount : 0,
      sourceRowCount: index === 0 ? sourceRowCount : 0,
      writeAudit: false,
    });
    totalRowsWritten += Number(result?.upload?.rowsWritten || 0);
    totalSkuRowsWritten += Number(result?.upload?.skuRowsWritten || 0);
  }

  console.log("Finalizing upload audit...");
  await postJson(`${apiBase}/api/upload/orders`, {
    finalize: true,
    platform,
    rawRowCount,
    sourceRowCount,
    uploadedDates,
    rowsWritten: totalRowsWritten,
    skuRowsWritten: totalSkuRowsWritten,
  });

  console.log("Done.");
  console.log(JSON.stringify({
    files: files.length,
    rawRowCount,
    sourceRowCount,
    leanRows: leanRows.length,
    uploadedDates: uploadedDates.length,
    rowsWritten: totalRowsWritten,
    skuRowsWritten: totalSkuRowsWritten,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
