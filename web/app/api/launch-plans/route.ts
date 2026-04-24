import { NextRequest, NextResponse } from "next/server";
import { deleteLaunchPlan, listLaunchPlans, upsertLaunchPlan } from "@/lib/launch-plan-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await listLaunchPlans();
    return NextResponse.json({ ok: true, plans });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load launch plans." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const plan = await upsertLaunchPlan(payload?.plan || payload || {});
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save launch plan." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const productName = request.nextUrl.searchParams.get("productName") || "";
    await deleteLaunchPlan(productName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete launch plan." },
      { status: 400 },
    );
  }
}

