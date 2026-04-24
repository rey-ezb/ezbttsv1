import { getFirebaseAdminDb } from "./firebase-admin";

const AUTH_DOC_PATH = { collection: "planningSettings", doc: "auth" } as const;

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export async function loadSettingsPasswordHashFromStore(): Promise<string> {
  try {
    const db = getFirebaseAdminDb();
    const snap = await db.collection(AUTH_DOC_PATH.collection).doc(AUTH_DOC_PATH.doc).get();
    const data = snap.exists ? (snap.data() as Record<string, unknown>) : {};
    const hash = cleanText(data?.passwordHash);
    return hash || "";
  } catch {
    // Firestore not configured (or not reachable) in this environment.
    return "";
  }
}

export async function saveSettingsPasswordHashToStore(nextHash: string) {
  const hash = cleanText(nextHash);
  if (!hash) {
    throw new Error("Missing password hash.");
  }
  try {
    const db = getFirebaseAdminDb();
    await db
      .collection(AUTH_DOC_PATH.collection)
      .doc(AUTH_DOC_PATH.doc)
      .set({ passwordHash: hash, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Could not save settings password.");
  }
}

