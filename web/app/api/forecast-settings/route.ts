import { NextRequest, NextResponse } from "next/server";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";
import { saveHostedForecastSetting } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const preferredDataSource = requestPlannerDataSourceMode(request);
    const monthKey = String(body?.monthKey || "").trim();
    if (!monthKey || monthKey.length !== 7) {
      return NextResponse.json({ error: "Month key is required." }, { status: 400 });
    }
    const forecastSettings = await saveHostedForecastSetting(monthKey, body?.setting || {}, preferredDataSource);
    return NextResponse.json({
      ok: true,
      forecastSettings,
      activeSetting: forecastSettings[monthKey],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save month settings." },
      { status: 500 },
    );
  }
}
