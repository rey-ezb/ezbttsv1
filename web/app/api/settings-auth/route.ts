import { NextRequest, NextResponse } from "next/server";
import {
  SETTINGS_AUTH_COOKIE,
  defaultSettingsAuthExpiryMs,
  isSettingsAuthEnabled,
  sha256Base64Url,
  signSettingsAuthToken,
  verifySettingsAuthToken,
  verifyPasswordAgainstHash,
} from "@/lib/settings-auth";
import { loadSettingsPasswordHashFromStore } from "@/lib/settings-auth-store";

export const dynamic = "force-dynamic";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

async function expectedPasswordHash() {
  const envHash = cleanText(process.env.PLANNER_SETTINGS_PASSWORD_HASH);
  if (envHash) return envHash;
  const envPassword = cleanText(process.env.PLANNER_SETTINGS_PASSWORD);
  if (envPassword) return sha256Base64Url(envPassword);
  return await loadSettingsPasswordHashFromStore();
}

async function authEnabled() {
  if (isSettingsAuthEnabled()) return true;
  const stored = await loadSettingsPasswordHashFromStore();
  return Boolean(cleanText(stored));
}

export async function GET(request: NextRequest) {
  const enabled = await authEnabled();
  if (!enabled) {
    return NextResponse.json({ ok: true, enabled: false, authed: true });
  }
  const expectedHash = await expectedPasswordHash();
  const token = request.cookies.get(SETTINGS_AUTH_COOKIE)?.value || "";
  const verified = verifySettingsAuthToken(token, expectedHash);
  return NextResponse.json({
    ok: true,
    enabled: true,
    authed: verified.ok,
    expiresAtMs: verified.ok ? verified.expiresAtMs : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const enabled = await authEnabled();
    if (!enabled) {
      return NextResponse.json({ ok: true, enabled: false, authed: true });
    }
    const expectedHash = await expectedPasswordHash();
    const payload = await request.json().catch(() => ({}));
    const password = String(payload?.password || "");
    if (!verifyPasswordAgainstHash(password, expectedHash)) {
      return NextResponse.json({ error: "Incorrect settings password." }, { status: 401 });
    }
    const expiresAtMs = defaultSettingsAuthExpiryMs();
    const token = signSettingsAuthToken(expiresAtMs, expectedHash);
    const response = NextResponse.json({ ok: true, enabled: true, authed: true, expiresAtMs });
    response.cookies.set(SETTINGS_AUTH_COOKIE, token, {
      ...cookieOptions(),
      maxAge: Math.floor((expiresAtMs - Date.now()) / 1000),
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not unlock settings." },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SETTINGS_AUTH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
