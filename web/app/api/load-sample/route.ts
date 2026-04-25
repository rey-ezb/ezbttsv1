import { NextRequest, NextResponse } from "next/server";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";
import { getHostedWorkspace, runHostedPlanning } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const preferredDataSource = requestPlannerDataSourceMode(request);
    const workspace = await getHostedWorkspace({ forceRefresh: true, preferredDataSource });
    const plan = await runHostedPlanning(
      {
        baselineStart: workspace.defaults.baselineStart,
        baselineEnd: workspace.defaults.baselineEnd,
        horizonStart: workspace.defaults.horizonStart,
        horizonEnd: workspace.defaults.horizonEnd,
        velocityMode: workspace.defaults.velocityMode,
        leadTimeDays: workspace.defaults.leadTimeDays,
        upliftPct: workspace.defaults.upliftPct,
        planningYear: workspace.defaults.forecastYear,
        monthlyForecastSettings: workspace.defaults.forecastSettings,
      },
      { forceRefresh: false, preferredDataSource },
    );
    return NextResponse.json({ ok: true, workspace, plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not refresh current data." },
      { status: 500 },
    );
  }
}
