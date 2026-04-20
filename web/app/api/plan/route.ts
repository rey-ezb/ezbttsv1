import { NextRequest, NextResponse } from "next/server";
import { runHostedPlanning } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return NextResponse.json(await runHostedPlanning(payload || {}));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Planning failed." },
      { status: 500 },
    );
  }
}
