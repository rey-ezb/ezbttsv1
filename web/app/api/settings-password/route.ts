import { NextRequest, NextResponse } from "next/server";
import {
  SETTINGS_AUTH_COOKIE,
  defaultSettingsAuthExpiryMs,
  sha256Base64Url,
  signSettingsAuthToken,
  isSettingsAuthEnabled,
  verifyPasswordAgainstHash,
} from "@/lib/settings-auth";
import { saveSettingsPasswordHashToStore } from "@/lib/settings-auth-store";
import { loadSettingsPasswordHashFromStore } from "@/lib/settings-auth-store";

export const dynamic = "force-dynamic";

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

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function POST(request: NextRequest) {
  try {
    const enabled = await authEnabled();
    if (!enabled) {
      return NextResponse.json({ error: "Settings password is not enabled." }, { status: 400 });
    }

    const payload = await request.json().catch(() => ({}));
    const currentPassword = cleanText(payload?.currentPassword);
    const newPassword = cleanText(payload?.newPassword);

    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }

    const expectedHash = await expectedPasswordHash();
    const ok = verifyPasswordAgainstHash(currentPassword, expectedHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 401 });
    }

    const nextHash = sha256Base64Url(newPassword);
    await saveSettingsPasswordHashToStore(nextHash);

    // Keep the user unlocked after the change, and invalidate old cookies
    // by signing the token with the new password fingerprint.
    const expiresAtMs = defaultSettingsAuthExpiryMs();
    const token = signSettingsAuthToken(expiresAtMs, nextHash);
    const response = NextResponse.json({ ok: true, enabled: true, authed: true, expiresAtMs });
    response.cookies.set(SETTINGS_AUTH_COOKIE, token, {
      ...cookieOptions(),
      maxAge: Math.floor((expiresAtMs - Date.now()) / 1000),
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not change settings password." },
      { status: 500 },
    );
  }
}
