import { NextRequest, NextResponse } from "next/server";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";
import { saveHostedPlannerSettings } from "@/lib/hosted-planner";
import { requireSettingsAuth } from "@/app/api/_utils/require-settings-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireSettingsAuth(request);
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const preferredDataSource = requestPlannerDataSourceMode(request);
    const plannerSettings = await saveHostedPlannerSettings(body?.settings || {}, preferredDataSource);
    return NextResponse.json({
      ok: true,
      plannerSettings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save planner settings." },
      { status: 500 },
    );
  }
}
