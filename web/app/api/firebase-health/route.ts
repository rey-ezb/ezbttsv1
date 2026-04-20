import { NextResponse } from "next/server";
import { getHostedDashboardSummary } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getHostedDashboardSummary();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown Firebase error",
      },
      { status: 500 },
    );
  }
}
