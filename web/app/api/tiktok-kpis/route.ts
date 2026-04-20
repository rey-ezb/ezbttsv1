import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "The hosted planner is running without the TikTok KPI module for now." },
    { status: 501 },
  );
}
