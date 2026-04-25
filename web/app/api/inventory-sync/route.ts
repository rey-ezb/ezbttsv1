import { NextResponse } from "next/server";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";
import { getHostedWorkspace, runHostedPlanning, syncHostedInventorySnapshot } from "@/lib/hosted-planner";
import { requireSettingsAuth } from "@/app/api/_utils/require-settings-auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireSettingsAuth(request);
    if (unauthorized) return unauthorized;
    const preferredDataSource = requestPlannerDataSourceMode(request);
    const inventorySync = await syncHostedInventorySnapshot(preferredDataSource);
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

    return NextResponse.json({ ok: true, inventorySync, workspace, plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update live inventory from the sheet." },
      { status: 400 },
    );
  }
}
