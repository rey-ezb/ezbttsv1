import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { usesLocalPlannerData } from "./data-source-mode";
import { getFirebaseAdminDb } from "./firebase-admin";

export type LaunchPlan = {
  productName: string;
  proxyProductName?: string | null;
  launchDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // optional LTO end date
  launchUnitsCommitted?: number;
  launchStrengthPct?: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_LAUNCH_PLANS_FILE = path.join(DATA_DIR, "planning_launch_plans.json");

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizePlan(raw: Partial<LaunchPlan>): LaunchPlan {
  const productName = cleanText(raw.productName);
  if (!productName) throw new Error("Launch plan productName is required.");
  const proxyProductName = cleanText(raw.proxyProductName) || null;
  const launchDate = cleanText(raw.launchDate).slice(0, 10) || null;
  const endDate = cleanText(raw.endDate).slice(0, 10) || null;
  if (endDate && launchDate && endDate < launchDate) {
    throw new Error("Launch plan endDate must be on or after launchDate.");
  }
  return {
    productName,
    proxyProductName,
    launchDate,
    endDate,
    launchUnitsCommitted: Math.max(0, asNumber(raw.launchUnitsCommitted)),
    launchStrengthPct: Math.max(0, asNumber(raw.launchStrengthPct || 100)),
  };
}

async function readLocalPlans(): Promise<LaunchPlan[]> {
  const text = await readFile(LOCAL_LAUNCH_PLANS_FILE, "utf8").catch(() => "");
  if (!text) return [];
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => normalizePlan(item as Partial<LaunchPlan>));
}

async function writeLocalPlans(plans: LaunchPlan[]) {
  await writeFile(LOCAL_LAUNCH_PLANS_FILE, JSON.stringify(plans, null, 2), "utf8");
}

export async function listLaunchPlans(): Promise<LaunchPlan[]> {
  if (usesLocalPlannerData()) {
    return (await readLocalPlans()).sort((a, b) => a.productName.localeCompare(b.productName));
  }
  const snapshot = await getFirebaseAdminDb().collection("launchPlans").get();
  const plans = snapshot.docs.map((doc) => normalizePlan(doc.data() as Partial<LaunchPlan>));
  return plans.sort((a, b) => a.productName.localeCompare(b.productName));
}

export async function upsertLaunchPlan(raw: Partial<LaunchPlan>) {
  const plan = normalizePlan(raw);
  if (usesLocalPlannerData()) {
    const existing = await readLocalPlans();
    const merged = new Map(existing.map((item) => [item.productName, item]));
    merged.set(plan.productName, plan);
    await writeLocalPlans(Array.from(merged.values()));
    return plan;
  }
  await getFirebaseAdminDb().collection("launchPlans").doc(plan.productName).set(plan, { merge: true });
  return plan;
}

export async function deleteLaunchPlan(productName: string) {
  const key = cleanText(productName);
  if (!key) throw new Error("Launch plan productName is required.");
  if (usesLocalPlannerData()) {
    const existing = await readLocalPlans();
    await writeLocalPlans(existing.filter((item) => item.productName !== key));
    return { ok: true };
  }
  await getFirebaseAdminDb().collection("launchPlans").doc(key).delete();
  return { ok: true };
}

