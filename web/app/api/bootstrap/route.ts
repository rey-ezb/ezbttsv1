import { NextRequest, NextResponse } from "next/server";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";
import { getHostedWorkspace, runHostedPlanning } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    const preferredDataSource = requestPlannerDataSourceMode(request);
    const workspace = await getHostedWorkspace({ forceRefresh, preferredDataSource });
    const plan = await runHostedPlanning(
      {
        baselineStart: workspace.defaults.baselineStart,
        baselineEnd: workspace.defaults.baselineEnd,
        horizonStart: workspace.defaults.horizonStart,
        horizonEnd: workspace.defaults.horizonEnd,
        velocityMode: workspace.defaults.velocityMode,
        excludeSpikes: workspace.defaults.excludeSpikes,
        leadTimeDays: workspace.defaults.leadTimeDays,
        upliftPct: workspace.defaults.upliftPct,
        planningYear: workspace.defaults.forecastYear,
        monthlyForecastSettings: workspace.defaults.forecastSettings,
        customSettings: workspace.defaults.sharedSettings,
        orderDateBasis: workspace.defaults.orderDateBasis,
      },
      { forceRefresh: false, preferredDataSource },
    );

    return NextResponse.json({ ok: true, workspace, plan });
  } catch (error) {
    console.error("[api/bootstrap] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load planner bootstrap." },
      { status: 500 },
    );
  }
}
