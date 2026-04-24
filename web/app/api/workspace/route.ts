import { NextRequest, NextResponse } from "next/server";
import { getHostedWorkspace } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    return NextResponse.json(await getHostedWorkspace({ forceRefresh }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load workspace." },
      { status: 500 },
    );
  }
}
