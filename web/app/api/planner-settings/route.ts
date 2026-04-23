import { NextRequest, NextResponse } from "next/server";
import { saveHostedPlannerSettings } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plannerSettings = await saveHostedPlannerSettings(body?.settings || {});
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
