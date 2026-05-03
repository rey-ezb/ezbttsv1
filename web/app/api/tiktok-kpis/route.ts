import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildTiktokKpiPayload } from "@/lib/tiktok-kpis";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams;
    const preferredDataSource = requestPlannerDataSourceMode(request);
    const sources = String(search.get("sources") || "Sales")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const payload = await buildTiktokKpiPayload({
      startDate: search.get("startDate"),
      endDate: search.get("endDate"),
      activeTab: search.get("tab"),
      dateBasis: search.get("dateBasis"),
      orderBucket: search.get("orderBucket"),
      sources,
      preferredDataSource,
    });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build TikTok KPI payload." },
      { status: 400 },
    );
  }
}
