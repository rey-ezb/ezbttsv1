import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "Hosted uploads are not enabled yet for this deployment." },
    { status: 501 },
  );
}
