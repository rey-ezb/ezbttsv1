import { NextRequest, NextResponse } from "next/server";
import { SETTINGS_AUTH_COOKIE, isSettingsAuthEnabled, sha256Base64Url, verifySettingsAuthToken } from "@/lib/settings-auth";
import { loadSettingsPasswordHashFromStore } from "@/lib/settings-auth-store";

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

async function settingsAuthEnabled() {
  if (isSettingsAuthEnabled()) return true;
  const stored = await loadSettingsPasswordHashFromStore();
  return Boolean(cleanText(stored));
}

export async function requireSettingsAuth(request: NextRequest) {
  if (!(await settingsAuthEnabled())) return null;
  const expectedHash = await expectedPasswordHash();
  const token = request.cookies.get(SETTINGS_AUTH_COOKIE)?.value || "";
  const verified = verifySettingsAuthToken(token, expectedHash);
  if (verified.ok) return null;
  return NextResponse.json({ error: "Settings are locked. Unlock them first." }, { status: 401 });
}
