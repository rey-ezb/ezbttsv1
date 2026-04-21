import { NextResponse } from "next/server";
import { getHostedWorkspace, runHostedPlanning, syncHostedInventorySnapshot } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const inventorySync = await syncHostedInventorySnapshot();
    const workspace = await getHostedWorkspace({ forceRefresh: true });
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
      { forceRefresh: false },
    );

    return NextResponse.json({ ok: true, inventorySync, workspace, plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update live inventory from the sheet." },
      { status: 400 },
    );
  }
}
