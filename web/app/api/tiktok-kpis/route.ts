import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "TikTok KPIs are not included in this planner-only build." },
    { status: 404 },
  );
}
