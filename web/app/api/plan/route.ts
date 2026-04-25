import { NextRequest, NextResponse } from "next/server";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";
import { runHostedPlanning } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const preferredDataSource = requestPlannerDataSourceMode(request);
    return NextResponse.json(await runHostedPlanning(payload || {}, { preferredDataSource }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Planning failed." },
      { status: 500 },
    );
  }
}
