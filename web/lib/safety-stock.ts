function toDate(value: string) {
  // Expect YYYY-MM-DD
  const [year, month, day] = String(value || "")
    .slice(0, 10)
    .split("-")
    .map((part) => Number(part));
  if (!year || !month || !day) return new Date(NaN);
  return new Date(Date.UTC(year, month - 1, day));
}

function asNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export type SafetyStockGlobalSettings = {
  safetyStockWeeksH1: number; // Jan-Jun
  safetyStockWeeksH2: number; // Jul-Dec
};

export function safetyStockWeeksForDate(date: string, global: SafetyStockGlobalSettings) {
  const month = toDate(date).getUTCMonth() + 1;
  if (!Number.isFinite(month) || month <= 0) return 0;
  const h1 = Math.max(0, asNumber(global.safetyStockWeeksH1));
  const h2 = Math.max(0, asNumber(global.safetyStockWeeksH2));
  return month <= 6 ? h1 : h2;
}

export function safetyStockWeeksForProduct(args: {
  date: string;
  global: SafetyStockGlobalSettings;
  productOverrideWeeks?: number | null;
}) {
  const override = Math.max(0, asNumber(args.productOverrideWeeks));
  if (override > 0) return override;
  return safetyStockWeeksForDate(args.date, args.global);
}

