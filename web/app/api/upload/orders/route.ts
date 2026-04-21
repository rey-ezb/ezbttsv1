import { NextRequest, NextResponse } from "next/server";
import { saveHostedDemandUpload } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const upload = await saveHostedDemandUpload(
      "planningDemandDaily",
      Array.isArray(payload?.rows) ? payload.rows : [],
      {
        platform: typeof payload?.platform === "string" ? payload.platform : "TikTok",
        rawRowCount: Number(payload?.rawRowCount || 0),
        usableRowCount: Number(payload?.sourceRowCount || 0),
      },
    );
    return NextResponse.json({ ok: true, upload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload order rows." },
      { status: 400 },
    );
  }
}
