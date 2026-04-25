import type { NextRequest } from "next/server";

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

export function normalizePlannerDataSourceMode(value: unknown): PlannerDataSourceMode | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "local" || normalized === "snapshot") return "local";
  if (normalized === "live" || normalized === "firestore") return "live";
  return null;
}

export function resolvePlannerDataSourceMode(preferred?: PlannerDataSourceMode | null) {
  return preferred || getPlannerDataSourceMode();
}

export function requestPlannerDataSourceMode(request: NextRequest) {
  return (
    normalizePlannerDataSourceMode(request.nextUrl.searchParams.get("dataSource")) ||
    normalizePlannerDataSourceMode(request.headers.get("x-planner-data-source"))
  );
}
