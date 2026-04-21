import { NextRequest, NextResponse } from "next/server";
import { saveHostedDemandUpload } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const upload = await saveHostedDemandUpload("planningDemandDaily", Array.isArray(payload?.rows) ? payload.rows : []);
    return NextResponse.json({ ok: true, upload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload order rows." },
      { status: 400 },
    );
  }
}
