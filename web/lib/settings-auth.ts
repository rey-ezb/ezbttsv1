import crypto from "node:crypto";

export const SETTINGS_AUTH_COOKIE = "planner_settings_auth";

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function base64Url(input: Buffer) {
  return input
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(input: string) {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

export function isSettingsAuthEnabled() {
  return Boolean(cleanText(process.env.PLANNER_SETTINGS_PASSWORD_HASH) || cleanText(process.env.PLANNER_SETTINGS_PASSWORD));
}

function settingsAuthSecret() {
  const fromEnv = cleanText(process.env.PLANNER_SETTINGS_AUTH_SECRET);
  return fromEnv || "dev-insecure-secret-change-me";
}

export function sha256Base64Url(value: string) {
  return base64Url(crypto.createHash("sha256").update(value, "utf8").digest());
}

function passwordFingerprint(hash: string) {
  return cleanText(hash).slice(0, 16);
}

function expectedPasswordHash() {
  const configuredHash = cleanText(process.env.PLANNER_SETTINGS_PASSWORD_HASH);
  if (configuredHash) return configuredHash;
  const password = cleanText(process.env.PLANNER_SETTINGS_PASSWORD);
  if (!password) return "";
  return sha256Base64Url(password);
}

export function verifyPasswordAgainstHash(password: string, expectedHash: string) {
  const expected = cleanText(expectedHash);
  const actual = sha256Base64Url(cleanText(password));
  if (!expected || !actual) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
  } catch {
    return false;
  }
}

export function verifySettingsPassword(password: string) {
  if (!isSettingsAuthEnabled()) return true;
  const expected = expectedPasswordHash();
  return verifyPasswordAgainstHash(password, expected);
}

export function signSettingsAuthToken(expiresAtMs: number, expectedHash: string = "") {
  const exp = Math.max(0, Math.floor(Number(expiresAtMs) || 0));
  const expPart = String(exp);
  const fingerprint = passwordFingerprint(expectedHash);
  const payload = fingerprint ? `${expPart}.${fingerprint}` : expPart;
  const sig = crypto.createHmac("sha256", settingsAuthSecret()).update(payload, "utf8").digest();
  return fingerprint ? `${expPart}.${fingerprint}.${base64Url(sig)}` : `${expPart}.${base64Url(sig)}`;
}

export function verifySettingsAuthToken(token: string, expectedHash: string = "") {
  if (!token) return { ok: false as const, reason: "missing" as const };
  const parts = String(token).split(".");
  const expPart = parts[0] || "";
  const fpPart = parts.length === 3 ? parts[1] : "";
  const sigPart = parts.length === 3 ? parts[2] : parts[1] || "";
  const exp = Number(expPart || 0);
  if (!Number.isFinite(exp) || exp <= 0) return { ok: false as const, reason: "invalid" as const };
  if (Date.now() > exp) return { ok: false as const, reason: "expired" as const };

  try {
    const expectedFp = passwordFingerprint(expectedHash);
    if (fpPart) {
      if (!expectedFp || fpPart !== expectedFp) return { ok: false as const, reason: "invalid" as const };
    }
    const payload = fpPart ? `${expPart}.${fpPart}` : String(expPart);
    const expectedSig = crypto.createHmac("sha256", settingsAuthSecret()).update(payload, "utf8").digest();
    const actualSig = fromBase64Url(String(sigPart || ""));
    if (expectedSig.length !== actualSig.length) return { ok: false as const, reason: "invalid" as const };
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return { ok: false as const, reason: "invalid" as const };
  } catch {
    return { ok: false as const, reason: "invalid" as const };
  }

  return { ok: true as const, expiresAtMs: exp };
}

export function defaultSettingsAuthExpiryMs() {
  return Date.now() + DEFAULT_TTL_MS;
}
