import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { usesLocalPlannerData } from "./data-source-mode";
import { getFirebaseAdminDb } from "./firebase-admin";

export type CampaignEvent = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  liftPct: number; // +40 means 40%
  createdAt?: string;
  updatedAt?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_CAMPAIGNS_FILE = path.join(DATA_DIR, "planning_campaigns.json");

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function todayIso() {
  return new Date().toISOString();
}

function normalizeCampaign(raw: Partial<CampaignEvent>): CampaignEvent {
  const id = cleanText(raw.id) || randomUUID();
  const name = cleanText(raw.name);
  const startDate = cleanText(raw.startDate).slice(0, 10);
  const endDate = cleanText(raw.endDate).slice(0, 10);
  const liftPct = asNumber(raw.liftPct);
  if (!name) throw new Error("Campaign name is required.");
  if (!startDate) throw new Error("Campaign startDate is required.");
  if (!endDate) throw new Error("Campaign endDate is required.");
  if (endDate < startDate) throw new Error("Campaign endDate must be on or after startDate.");
  return {
    id,
    name,
    startDate,
    endDate,
    liftPct,
    createdAt: cleanText(raw.createdAt) || undefined,
    updatedAt: cleanText(raw.updatedAt) || undefined,
  };
}

async function readLocalCampaigns(): Promise<CampaignEvent[]> {
  const text = await readFile(LOCAL_CAMPAIGNS_FILE, "utf8").catch(() => "");
  if (!text) return [];
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => normalizeCampaign(item as Partial<CampaignEvent>));
}

async function writeLocalCampaigns(campaigns: CampaignEvent[]) {
  await writeFile(LOCAL_CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), "utf8");
}

export async function listCampaigns(): Promise<CampaignEvent[]> {
  if (usesLocalPlannerData()) {
    return (await readLocalCampaigns()).sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
  }

  const snapshot = await getFirebaseAdminDb().collection("campaignEvents").get();
  const campaigns = snapshot.docs.map((doc) => normalizeCampaign({ ...(doc.data() as Partial<CampaignEvent>), id: doc.id }));
  return campaigns.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
}

export async function upsertCampaign(raw: Partial<CampaignEvent>) {
  const campaign = normalizeCampaign(raw);
  const now = todayIso();
  campaign.updatedAt = now;
  campaign.createdAt = campaign.createdAt || now;

  if (usesLocalPlannerData()) {
    const existing = await readLocalCampaigns();
    const merged = new Map(existing.map((item) => [item.id, item]));
    merged.set(campaign.id, campaign);
    await writeLocalCampaigns(Array.from(merged.values()));
    return campaign;
  }

  await getFirebaseAdminDb().collection("campaignEvents").doc(campaign.id).set(campaign, { merge: true });
  return campaign;
}

export async function deleteCampaign(id: string) {
  const campaignId = cleanText(id);
  if (!campaignId) throw new Error("Campaign id is required.");

  if (usesLocalPlannerData()) {
    const existing = await readLocalCampaigns();
    await writeLocalCampaigns(existing.filter((item) => item.id !== campaignId));
    return { ok: true };
  }

  await getFirebaseAdminDb().collection("campaignEvents").doc(campaignId).delete();
  return { ok: true };
}

