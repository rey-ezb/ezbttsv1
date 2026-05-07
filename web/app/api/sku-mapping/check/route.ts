import { NextRequest, NextResponse } from "next/server";
import { requestPlannerDataSourceMode } from "@/lib/data-source-mode";
import { inspectHostedDemandUploadSkuMappings } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    const result = await inspectHostedDemandUploadSkuMappings(rows, requestPlannerDataSourceMode(request));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not inspect SKU mappings." },
      { status: 400 },
    );
  }
}
