import { NextRequest, NextResponse } from "next/server";
import { finalizeHostedDemandUploadAudit, saveHostedDemandUpload } from "@/lib/hosted-planner";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    if (payload?.finalize) {
      const result = await finalizeHostedDemandUploadAudit({
        uploadType: "samples",
        platform: typeof payload?.platform === "string" ? payload.platform : "TikTok",
        rawRowCount: Number(payload?.rawRowCount || 0),
        usableRowCount: Number(payload?.sourceRowCount || 0),
        rowsWritten: Number(payload?.rowsWritten || 0),
        skuRowsWritten: Number(payload?.skuRowsWritten || 0),
        uploadedDates: Array.isArray(payload?.uploadedDates) ? payload.uploadedDates : [],
      });
      return NextResponse.json({ ok: true, finalize: result });
    }
    const upload = await saveHostedDemandUpload(
      "planningSamplesDaily",
      Array.isArray(payload?.rows) ? payload.rows : [],
      {
        platform: typeof payload?.platform === "string" ? payload.platform : "TikTok",
        rawRowCount: Number(payload?.rawRowCount || 0),
        usableRowCount: Number(payload?.sourceRowCount || 0),
        writeAudit: payload?.writeAudit === false ? false : true,
      },
    );
    return NextResponse.json({ ok: true, upload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload sample rows." },
      { status: 400 },
    );
  }
}
