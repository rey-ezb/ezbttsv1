export type PlannerVelocityMode = "sales_only" | "sales_plus_samples";

export type DemandLikeRow = {
  date: string;
  platform?: string;
  product_name: string;
  seller_sku_resolved?: string;
  net_units?: number;
  gross_sales?: number;
  net_gross_sales?: number;
};

type DemandStats = {
  salesUnits: number;
  sampleUnits: number;
  grossSales: number;
  netGrossSales: number;
  avgDailyDemand: number;
  smoothedUnits: number;
  daysUsed: number;
};

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function computeBaselineDemandByProduct(args: {
  productNames: string[];
  baselineDemandRows: DemandLikeRow[];
  baselineSampleRows: DemandLikeRow[];
  baselineDays: number;
  velocityMode: PlannerVelocityMode;
  excludeSpikes: boolean;
}) {
  const demandByProduct = new Map<string, DemandStats>();
  const baselineDays = Math.max(1, Math.floor(asNumber(args.baselineDays)));
  const velocityMode = args.velocityMode === "sales_plus_samples" ? "sales_plus_samples" : "sales_only";
  const excludeSpikes = Boolean(args.excludeSpikes);

  for (const productName of args.productNames) {
    const salesRows = args.baselineDemandRows.filter((row) => row.product_name === productName);
    const sampleRows = args.baselineSampleRows.filter((row) => row.product_name === productName);
    const salesUnits = salesRows.reduce((sum, row) => sum + asNumber(row.net_units), 0);
    const sampleUnits = sampleRows.reduce((sum, row) => sum + asNumber(row.net_units), 0);
    const grossSales = salesRows.reduce((sum, row) => sum + asNumber(row.gross_sales), 0);
    const netGrossSales = salesRows.reduce((sum, row) => {
      const explicitNet = asNumber(row.net_gross_sales);
      const netUnits = asNumber(row.net_units);
      if (netUnits <= 0) return sum;
      if (explicitNet > 0) return sum + explicitNet;
      // Back-compat: older lean snapshots stored net_gross_sales as 0 even for positive net units.
      // Treat that as "missing" and fall back to gross_sales.
      return sum + asNumber(row.gross_sales);
    }, 0);

    const dailySales = new Map<string, number>();
    salesRows.forEach((row) => {
      if (asNumber(row.net_units) > 0) {
        dailySales.set(row.date, (dailySales.get(row.date) || 0) + asNumber(row.net_units));
      }
    });

    const activeDaysList = Array.from(dailySales.values()).sort((a, b) => b - a);
    let smoothedSalesUnits = salesUnits;
    let daysToUse = baselineDays;

    if (excludeSpikes && activeDaysList.length > 14) {
      smoothedSalesUnits = salesUnits - activeDaysList[0] - activeDaysList[1];
      daysToUse = baselineDays - 2;
    }

    if (activeDaysList.length > 0 && activeDaysList.length < daysToUse * 0.8) {
      daysToUse = activeDaysList.length;
    }

    const unitsUsed = velocityMode === "sales_plus_samples" ? smoothedSalesUnits + sampleUnits : smoothedSalesUnits;
    demandByProduct.set(productName, {
      salesUnits,
      sampleUnits,
      grossSales,
      netGrossSales,
      avgDailyDemand: daysToUse > 0 ? unitsUsed / daysToUse : 0,
      smoothedUnits: smoothedSalesUnits,
      daysUsed: daysToUse,
    });
  }

  return demandByProduct;
}
