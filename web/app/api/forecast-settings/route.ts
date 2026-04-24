import { NextRequest, NextResponse } from "next/server";
import { saveHostedForecastSetting } from "@/lib/hosted-planner";
import { requireSettingsAuth } from "@/app/api/_utils/require-settings-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireSettingsAuth(request);
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const monthKey = String(body?.monthKey || "").trim();
    if (!monthKey || monthKey.length !== 7) {
      return NextResponse.json({ error: "Month key is required." }, { status: 400 });
    }
    const forecastSettings = await saveHostedForecastSetting(monthKey, body?.setting || {});
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
