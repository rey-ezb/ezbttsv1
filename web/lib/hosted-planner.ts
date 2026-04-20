import { getFirebaseAdminDb } from "./firebase-admin";

type DemandDoc = {
  date: string;
  platform?: string;
  product_name: string;
  seller_sku_resolved?: string;
  net_units?: number;
  gross_sales?: number;
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
  launchUnitsCommitted?: number;
  launchStrengthPct?: number;
  launchCoverWeeksTarget?: number;
  launchSampleUnits?: number;
  launchBundleUpliftPct?: number;
  cogs?: number;
  listPrice?: number;
};

type MonthSummary = {
  totalUnits: number;
  grossSales: number;
  changePctVsPreviousMonth: number | null;
};

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
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

function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function quarterSafetyWeeks(date: string) {
  const month = toDate(date).getUTCMonth() + 1;
  return month <= 6 ? 3 : 5;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

async function readCollection<T>(name: string) {
  const snapshot = await getFirebaseAdminDb().collection(name).get();
  return snapshot.docs.map((doc) => doc.data() as T);
}

function normalizeMixShare(value: unknown) {
  const numeric = asNumber(value);
  if (numeric <= 0) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

async function loadState() {
  const [demand, samples, inventory, forecastSettings, launchPlans] = await Promise.all([
    readCollection<DemandDoc>("planningDemandDaily"),
    readCollection<DemandDoc>("planningSamplesDaily"),
    readCollection<InventoryDoc>("inventorySnapshots"),
    readCollection<ForecastSettingDoc>("forecastSettings"),
    readCollection<LaunchPlanDoc>("launchPlans"),
  ]);

  return {
    demand: demand.sort((a, b) => a.date.localeCompare(b.date)),
    samples: samples.sort((a, b) => a.date.localeCompare(b.date)),
    inventory: inventory.sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate)),
    forecastSettings,
    launchPlans,
  };
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
  return asNumber(launchPlans.find((plan) => plan.productName === productName)?.cogs);
}

export async function getHostedWorkspace() {
  const state = await loadState();
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
      inventory_as_of: latestInventoryDate,
      inventory_rows: latestInventoryByProduct(state.inventory).size,
    },
    defaults: {
      baselineStart,
      baselineEnd,
      horizonStart: formatDate(horizonStartDate),
      horizonEnd: formatDate(horizonEndDate),
      velocityMode: "sales_only",
      upliftPct: defaults[monthKey(horizonStartDate)] ?? 30,
      leadTimeDays: 8,
      safetyRule: "3 weeks in Q1 and Q2. 5 weeks in Q3 and Q4.",
      forecastYear: horizonStartDate.getUTCFullYear(),
      forecastDefaults: defaults,
      forecastSettings: settings,
      monthlyActualMix,
      monthlyActuals,
    },
  };
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

export async function runHostedPlanning(params: {
  baselineStart?: string;
  baselineEnd?: string;
  horizonStart?: string;
  horizonEnd?: string;
  velocityMode?: string;
  leadTimeDays?: number;
  monthlyForecastSettings?: Record<string, { upliftPct?: number; productMix?: Record<string, number> }>;
  upliftPct?: number;
  planningYear?: number;
}) {
  const state = await loadState();
  const workspace = await getHostedWorkspace();
  const baselineStart = params.baselineStart || workspace.defaults.baselineStart;
  const baselineEnd = params.baselineEnd || workspace.defaults.baselineEnd;
  const horizonStart = params.horizonStart || workspace.defaults.horizonStart;
  const horizonEnd = params.horizonEnd || workspace.defaults.horizonEnd;
  const planningYear = params.planningYear || workspace.defaults.forecastYear;
  const velocityMode = params.velocityMode || "sales_only";
  const leadTimeDays = asNumber(params.leadTimeDays ?? workspace.defaults.leadTimeDays);
  const monthSettings = params.monthlyForecastSettings || workspace.defaults.forecastSettings;
  const forecastMonthKey = monthKey(horizonStart);
  const forecastSetting = monthSettings[forecastMonthKey] || { upliftPct: params.upliftPct ?? workspace.defaults.upliftPct, productMix: {} };
  const upliftFactor = 1 + (asNumber(forecastSetting.upliftPct) / 100);
  const forecastProductMix = forecastSetting.productMix || {};

  const baselineDemandRows = state.demand.filter((row) => inRange(row.date, baselineStart, baselineEnd));
  const baselineSampleRows = state.samples.filter((row) => inRange(row.date, baselineStart, baselineEnd));
  const baselineDays = daysInclusive(baselineStart, baselineEnd);
  const latestInventory = latestInventoryByProduct(state.inventory);
  const productNames = uniqueSorted([
    ...state.demand.map((row) => row.product_name),
    ...state.samples.map((row) => row.product_name),
    ...Array.from(latestInventory.keys()),
    ...state.launchPlans.map((row) => row.productName),
  ]);

  const demandByProduct = new Map<string, { salesUnits: number; sampleUnits: number; grossSales: number; avgDailyDemand: number }>();
  for (const productName of productNames) {
    const salesRows = baselineDemandRows.filter((row) => row.product_name === productName);
    const sampleRows = baselineSampleRows.filter((row) => row.product_name === productName);
    const salesUnits = salesRows.reduce((sum, row) => sum + asNumber(row.net_units), 0);
    const sampleUnits = sampleRows.reduce((sum, row) => sum + asNumber(row.net_units), 0);
    const unitsUsed = velocityMode === "sales_plus_samples" ? salesUnits + sampleUnits : salesUnits;
    demandByProduct.set(productName, {
      salesUnits,
      sampleUnits,
      grossSales: salesRows.reduce((sum, row) => sum + asNumber(row.gross_sales), 0),
      avgDailyDemand: unitsUsed / baselineDays,
    });
  }

  const totalSalesUnits = Array.from(demandByProduct.values()).reduce((sum, row) => sum + row.salesUnits, 0);
  const totalSales = Array.from(demandByProduct.values()).reduce((sum, row) => sum + row.grossSales, 0);
  const baselineMix = Object.fromEntries(
    Array.from(demandByProduct.entries()).map(([productName, demand]) => [
      productName,
      totalSalesUnits > 0 ? demand.salesUnits / totalSalesUnits : 0,
    ]),
  );

  const safetyWeeks = quarterSafetyWeeks(horizonStart);
  const horizonDays = daysInclusive(horizonStart, horizonEnd);
  const rows = productNames.map((productName) => {
    const demand = demandByProduct.get(productName) || { salesUnits: 0, sampleUnits: 0, grossSales: 0, avgDailyDemand: 0 };
    const inventory = latestInventory.get(productName);
    const forecastDailyDemand = demand.avgDailyDemand * upliftFactor;
    const onHand = asNumber(inventory?.on_hand);
    const inTransit = asNumber(inventory?.in_transit);
    const currentSupply = onHand + inTransit;
    const safetyStockUnits = forecastDailyDemand * safetyWeeks * 7;
    const leadTimeDemandUnits = forecastDailyDemand * leadTimeDays;
    const reorderPointUnits = leadTimeDemandUnits + safetyStockUnits;
    const targetStockUnits = (forecastDailyDemand * horizonDays) + safetyStockUnits;
    const recommendedOrderUnits = Math.max(0, targetStockUnits - currentSupply);
    const projectedStockout = forecastDailyDemand > 0 ? formatDate(addDays(inventory?.snapshotDate || horizonStart, Math.floor(currentSupply / forecastDailyDemand))) : null;
    const reorderDate = projectedStockout ? formatDate(addDays(projectedStockout, -leadTimeDays)) : null;

    let status = "Healthy";
    if (forecastDailyDemand <= 0) {
      status = "No demand";
    } else if (currentSupply <= leadTimeDemandUnits) {
      status = "Urgent";
    } else if (currentSupply <= reorderPointUnits) {
      status = "Watch";
    }

    const sellerSku = inventory?.seller_sku_resolved || state.demand.find((row) => row.product_name === productName)?.seller_sku_resolved || "";
    return {
      product_name: productName,
      status,
      avg_daily_demand: demand.avgDailyDemand,
      avg_daily_gross_sales: demand.grossSales / baselineDays,
      baseline_start: baselineStart,
      baseline_end: baselineEnd,
      sales_units_in_baseline: demand.salesUnits,
      sample_units_in_baseline: demand.sampleUnits,
      units_used_for_velocity: velocityMode === "sales_plus_samples" ? demand.salesUnits + demand.sampleUnits : demand.salesUnits,
      mix_pct: totalSalesUnits > 0 ? demand.salesUnits / totalSalesUnits : 0,
      sales_mix_pct: totalSales > 0 ? demand.grossSales / totalSales : 0,
      gross_sales_in_baseline: demand.grossSales,
      on_hand: onHand,
      in_transit: inTransit,
      transit_eta: inventory?.transit_eta || null,
      current_supply_units: currentSupply,
      weeks_of_supply: forecastDailyDemand > 0 ? currentSupply / (forecastDailyDemand * 7) : null,
      safety_stock_units: safetyStockUnits,
      safety_stock_weeks: safetyWeeks,
      projected_stockout_date: projectedStockout,
      reorder_date: reorderDate,
      recommended_order_units: recommendedOrderUnits,
      forecast_daily_demand: forecastDailyDemand,
      forecast_units: forecastDailyDemand * horizonDays,
      lead_time_days: leadTimeDays,
      lead_time_demand_units: leadTimeDemandUnits,
      reorder_point_units: reorderPointUnits,
      target_stock_units: targetStockUnits,
      counted_in_transit: inTransit,
      snapshot_date: inventory?.snapshotDate || horizonStart,
      seller_sku_resolved: sellerSku,
      platform: "TikTok",
      unit_cogs: getUnitCogs(productName, state.launchPlans),
      estimated_cogs: demand.salesUnits * getUnitCogs(productName, state.launchPlans),
      transit_started_on: null,
      days_of_supply: forecastDailyDemand > 0 ? currentSupply / forecastDailyDemand : null,
      days_on_hand: null,
      horizon_start: horizonStart,
      horizon_end: horizonEnd,
    };
  }).sort((a, b) => {
    const rank = { Urgent: 0, Watch: 1, Healthy: 2, "No demand": 3 };
    return (rank[a.status as keyof typeof rank] - rank[b.status as keyof typeof rank]) || (b.recommended_order_units - a.recommended_order_units);
  });

  const { monthlyActuals, monthlyActualMix, productMonthly } = buildMonthlyActuals(state.demand);
  const latestActualMonthKey = Object.keys(monthlyActuals).sort().at(-1) || `${planningYear}-01`;
  const futureMix = Object.keys(forecastProductMix).length
    ? Object.fromEntries(Object.entries(forecastProductMix).map(([product, share]) => [product, normalizeMixShare(share)]))
    : baselineMix;

  const monthRows = productNames.map((productName) => {
    const row: Record<string, number | string> = { product_name: productName, year_total_units: 0, year_mix_pct: 0 };
    for (let month = 1; month <= 12; month += 1) {
      const key = `${planningYear}-${String(month).padStart(2, "0")}`;
      if (key <= latestActualMonthKey) {
        row[key] = productMonthly.get(productName)?.get(key) || 0;
      } else {
        const firstOfMonth = new Date(Date.UTC(planningYear, month - 1, 1));
        const days = endOfMonth(firstOfMonth).getUTCDate();
        const totalMonthUnits = (totalSalesUnits / baselineDays) * days * (1 + ((monthSettings[key]?.upliftPct ?? asNumber(workspace.defaults.forecastDefaults[key])) / 100));
        const mixShare = Object.keys(monthSettings[key]?.productMix || {}).length
          ? normalizeMixShare(monthSettings[key]?.productMix?.[productName])
          : (futureMix[productName] || 0);
        row[key] = totalMonthUnits * mixShare;
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
    months: Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(planningYear, index, 1));
      const key = `${planningYear}-${String(index + 1).padStart(2, "0")}`;
      return {
        key,
        label: date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        mode: key <= latestActualMonthKey ? "actual" : "forecast",
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
      unit_cogs: row.unit_cogs,
      estimated_cogs: row.estimated_cogs,
      forecast_units: monthRows.find((monthRow) => monthRow.product_name === row.product_name)?.year_total_units || 0,
    })),
  };

  return {
    ok: true,
    rows,
    summary: {
      rows: rows.length,
      urgent: rows.filter((row) => row.status === "Urgent").length,
      watch: rows.filter((row) => row.status === "Watch").length,
      healthy: rows.filter((row) => row.status === "Healthy").length,
      no_demand: rows.filter((row) => row.status === "No demand").length,
      covered: rows.filter((row) => row.status === "Healthy").length,
    },
    monthlyPlan,
    productMix,
    historicalTrend: buildHistoricalTrend(productMonthly, planningYear),
    launchPlanning: buildLaunchPlanning(
      state.launchPlans,
      new Map(Array.from(demandByProduct.entries()).map(([productName, demand]) => [productName, { salesUnits: demand.salesUnits, avgDailyDemand: demand.avgDailyDemand }])),
    ),
  };
}

export async function saveHostedForecastSetting(monthKeyValue: string, setting: { upliftPct?: number; productMix?: Record<string, number> }) {
  const db = getFirebaseAdminDb();
  const payload = {
    yearMonth: monthKeyValue,
    upliftPct: asNumber(setting.upliftPct),
    productMix: setting.productMix || {},
  };
  await db.collection("forecastSettings").doc(monthKeyValue).set(payload, { merge: true });
  const settings = await readCollection<ForecastSettingDoc>("forecastSettings");
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
