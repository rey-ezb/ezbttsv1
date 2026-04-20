import { NextResponse } from "next/server";
import { getHostedWorkspace } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getHostedWorkspace());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load workspace." },
      { status: 500 },
    );
  }
}
