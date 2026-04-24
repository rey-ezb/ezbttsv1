import { NextRequest, NextResponse } from "next/server";
import { deleteCampaign, listCampaigns, upsertCampaign } from "@/lib/campaign-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaigns = await listCampaigns();
    return NextResponse.json({ ok: true, campaigns });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load campaigns." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const campaign = await upsertCampaign(payload?.campaign || payload || {});
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save campaign." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id") || "";
    await deleteCampaign(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete campaign." },
      { status: 400 },
    );
  }
}

