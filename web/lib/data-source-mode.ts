export type PlannerDataSourceMode = "local" | "live";

export function getPlannerDataSourceMode() {
  const explicitMode = String(process.env.PLANNER_DATA_SOURCE || "").trim().toLowerCase();
  if (explicitMode === "live" || explicitMode === "firestore") return "live";
  if (explicitMode === "local" || explicitMode === "snapshot") return "local";
  return process.env.NODE_ENV === "production" ? "live" : "local";
}

export function usesLocalPlannerData() {
  return getPlannerDataSourceMode() === "local";
}
