import { NextResponse } from "next/server";
import { getHostedWorkspace } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return NextResponse.json({ ok: true, workspace: await getHostedWorkspace() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not refresh current data." },
      { status: 500 },
    );
  }
}
