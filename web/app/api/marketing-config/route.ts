import { NextRequest, NextResponse } from "next/server";
import { requestPlannerDataSourceMode, resolvePlannerDataSourceMode } from "@/lib/data-source-mode";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { invalidateHostedPlannerCache, __unsafeGetBundledLaunchDefaults } from "@/lib/hosted-planner";
import { requireSettingsAuth } from "@/app/api/_utils/require-settings-auth";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type MarketingConfigPayload = {
  campaigns?: Array<{
    id?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
    liftPct?: number | null;
  }>;
  launchPlans?: Array<{
    id?: string;
    newProductName?: string;
    proxyProduct?: string;
    startDate?: string;
    endDate?: string;
    strengthPct?: number | null;
    committedUnits?: number | null;
  }>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_CAMPAIGNS_FILE = path.join(DATA_DIR, "planning_campaigns.json");
const LOCAL_LAUNCH_PLANS_FILE = path.join(DATA_DIR, "planning_launch_plans.json");

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeMarketingConfig(raw: unknown): Required<MarketingConfigPayload> {
  const source = raw && typeof raw === "object" ? (raw as MarketingConfigPayload) : {};
  const campaigns = Array.isArray(source.campaigns) ? source.campaigns : [];
  const launchPlans = Array.isArray(source.launchPlans) ? source.launchPlans : [];

  return {
    campaigns: campaigns
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        id: cleanText(row.id) || undefined,
        name: cleanText(row.name),
        startDate: cleanText(row.startDate).slice(0, 10),
        endDate: cleanText(row.endDate).slice(0, 10),
        liftPct: asNumber(row.liftPct),
      }))
      .filter((row) => row.name && row.startDate && row.endDate && row.endDate >= row.startDate),
    launchPlans: launchPlans
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        id: cleanText(row.id) || undefined,
        newProductName: cleanText(row.newProductName),
        proxyProduct: cleanText(row.proxyProduct),
        startDate: cleanText(row.startDate).slice(0, 10),
        endDate: cleanText(row.endDate).slice(0, 10),
        strengthPct: asNumber(row.strengthPct ?? 100),
        committedUnits: asNumber(row.committedUnits),
      }))
      .filter((row) => row.newProductName && row.proxyProduct && row.startDate && (!row.endDate || row.endDate >= row.startDate)),
  };
}

function toUiMarketingConfigFromEngine(params: {
  campaigns: Array<{ id?: string; name: string; startDate: string; endDate: string; liftPct: number }>;
  launchPlans: Array<{
    productName: string;
    proxyProductName?: string | null;
    launchDate?: string | null;
    endDate?: string | null;
    launchStrengthPct?: number;
    launchUnitsCommitted?: number;
  }>;
}): Required<MarketingConfigPayload> {
  return {
    campaigns: params.campaigns.map((campaign) => ({
      id: campaign.id || `${campaign.name}__${campaign.startDate}`,
      name: campaign.name,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      liftPct: campaign.liftPct,
    })),
    launchPlans: params.launchPlans
      .filter((plan) => plan.productName)
      .map((plan) => ({
        id: plan.productName,
        newProductName: plan.productName,
        proxyProduct: cleanText(plan.proxyProductName) || "",
        startDate: cleanText(plan.launchDate) || "",
        endDate: cleanText(plan.endDate) || "",
        strengthPct: asNumber(plan.launchStrengthPct || 100),
        committedUnits: asNumber(plan.launchUnitsCommitted),
      }))
      .filter((row) => row.newProductName && row.proxyProduct && row.startDate),
  };
}

async function readLocalJson(filePath: string) {
  const text = await readFile(filePath, "utf8").catch(() => "");
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalJson(filePath: string, payload: unknown) {
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function GET(request: NextRequest) {
  try {
    const preferredDataSource = requestPlannerDataSourceMode(request);
    if (resolvePlannerDataSourceMode(preferredDataSource) === "local") {
      const [campaignsRaw, launchPlansRaw] = await Promise.all([
        readLocalJson(LOCAL_CAMPAIGNS_FILE),
        readLocalJson(LOCAL_LAUNCH_PLANS_FILE),
      ]);
      // Merge bundled defaults + local overrides (lean storage keeps overrides only).
      const mergedLaunchPlans = Array.from(
        new Map<string, any>([
          ...__unsafeGetBundledLaunchDefaults().map((plan) => [plan.productName, plan] as const),
          ...(launchPlansRaw as any[]).map((plan) => [String((plan as any)?.productName || ""), plan] as const),
        ]).values(),
      ).filter((plan) => plan && plan.productName);

      // The local files are stored in engine format; convert to UI format.
      const marketingConfig = toUiMarketingConfigFromEngine({
        campaigns: campaignsRaw as any,
        launchPlans: mergedLaunchPlans as any,
      });
      return NextResponse.json({ ok: true, marketingConfig });
    }

    const [campaigns, launchPlans] = await Promise.all([
      getFirebaseAdminDb().collection("campaignEvents").get(),
      getFirebaseAdminDb().collection("launchPlans").get(),
    ]);
    const mergedLaunchPlans = Array.from(
      new Map<string, any>([
        ...__unsafeGetBundledLaunchDefaults().map((plan) => [plan.productName, plan] as const),
        ...launchPlans.docs.map((doc) => {
          const data = doc.data() as any;
          const key = String(data?.productName || doc.id || "");
          return [key, data] as const;
        }),
      ]).values(),
    ).filter((plan) => plan && plan.productName);
    const marketingConfig = toUiMarketingConfigFromEngine({
      campaigns: campaigns.docs.map((doc) => ({ ...(doc.data() as any), id: doc.id })),
      launchPlans: mergedLaunchPlans as any,
    });
    return NextResponse.json({ ok: true, marketingConfig });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load marketing config." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireSettingsAuth(request);
    if (unauthorized) return unauthorized;
    const preferredDataSource = requestPlannerDataSourceMode(request);
    const payload = await request.json();
    const marketingConfig = normalizeMarketingConfig(payload?.marketingConfig || payload || {});

    // Store campaigns in engine format (directly compatible).
    const campaignRows = marketingConfig.campaigns.map((row) => ({
      id: row.id || `${row.name}__${row.startDate}`,
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      liftPct: asNumber(row.liftPct),
    }));

    // Store launch plans in engine format, but keep it lean by only writing overrides vs bundled defaults.
    const defaults = __unsafeGetBundledLaunchDefaults();
    const defaultByProduct = new Map(defaults.map((plan) => [plan.productName, plan] as const));
    const launchOverrideRows = marketingConfig.launchPlans
      .map((row) => {
        const productName = cleanText(row.newProductName);
        return {
          productName,
          proxyProductName: cleanText(row.proxyProduct),
          launchDate: cleanText(row.startDate).slice(0, 10),
          endDate: cleanText(row.endDate).slice(0, 10) || null,
          launchStrengthPct: asNumber(row.strengthPct || 100),
          launchUnitsCommitted: asNumber(row.committedUnits || 0),
        };
      })
      .filter((row): row is {
        productName: string;
        proxyProductName: string;
        launchDate: string;
        endDate: string | null;
        launchStrengthPct: number;
        launchUnitsCommitted: number;
      } => Boolean(row.productName && row.proxyProductName && row.launchDate))
      .filter((row) => {
        const def = defaultByProduct.get(row.productName);
        if (!def) return true; // new product, must store
        return !(
          cleanText(def.proxyProductName || "") === cleanText(row.proxyProductName || "") &&
          cleanText(def.launchDate || "") === cleanText(row.launchDate || "") &&
          cleanText(def.endDate || "") === cleanText(row.endDate || "") &&
          asNumber(def.launchStrengthPct || 100) === asNumber(row.launchStrengthPct || 100) &&
          asNumber(def.launchUnitsCommitted || 0) === asNumber(row.launchUnitsCommitted || 0)
        );
      });

    if (resolvePlannerDataSourceMode(preferredDataSource) === "local") {
      await Promise.all([
        writeLocalJson(LOCAL_CAMPAIGNS_FILE, campaignRows),
        writeLocalJson(LOCAL_LAUNCH_PLANS_FILE, launchOverrideRows),
      ]);
      invalidateHostedPlannerCache();
      return NextResponse.json({ ok: true, marketingConfig: { campaigns: campaignRows, launchPlans: marketingConfig.launchPlans } });
    }

    const db = getFirebaseAdminDb();
    // Replace-by-id for campaigns (lean and deterministic).
    const existingCampaigns = await db.collection("campaignEvents").get();
    const nextCampaignIds = new Set(campaignRows.map((row) => row.id));
    const deleteCampaigns = existingCampaigns.docs.filter((doc) => !nextCampaignIds.has(doc.id));
    for (const chunk of [deleteCampaigns]) {
      for (let i = 0; i < chunk.length; i += 400) {
        const batch = db.batch();
        chunk.slice(i, i + 400).forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    }
    for (let i = 0; i < campaignRows.length; i += 400) {
      const batch = db.batch();
      campaignRows.slice(i, i + 400).forEach((row) => batch.set(db.collection("campaignEvents").doc(row.id), row, { merge: true }));
      await batch.commit();
    }

    // Replace launch overrides by productName doc id.
    const existingLaunch = await db.collection("launchPlans").get();
    const nextLaunchIds = new Set(launchOverrideRows.map((row) => row.productName));
    const deleteLaunch = existingLaunch.docs.filter((doc) => !nextLaunchIds.has(doc.id));
    for (let i = 0; i < deleteLaunch.length; i += 400) {
      const batch = db.batch();
      deleteLaunch.slice(i, i + 400).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    for (let i = 0; i < launchOverrideRows.length; i += 400) {
      const batch = db.batch();
      launchOverrideRows.slice(i, i + 400).forEach((row) => batch.set(db.collection("launchPlans").doc(row.productName), row, { merge: true }));
      await batch.commit();
    }

    invalidateHostedPlannerCache();
    return NextResponse.json({ ok: true, marketingConfig: { campaigns: campaignRows, launchPlans: marketingConfig.launchPlans } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save marketing config." },
      { status: 400 },
    );
  }
}
