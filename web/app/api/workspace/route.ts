import { NextRequest, NextResponse } from "next/server";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";
import { getHostedWorkspace } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    const preferredDataSource = requestPlannerDataSourceMode(request);
    return NextResponse.json(await getHostedWorkspace({ forceRefresh, preferredDataSource }));
  } catch (error) {
    console.error("[api/workspace] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load workspace." },
      { status: 500 },
    );
  }
}
