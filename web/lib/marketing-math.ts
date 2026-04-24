export type CampaignLike = {
  id?: string;
  name?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  liftPct: number; // +40 means 40%
};

export type LaunchPlanLike = {
  productName: string;
  proxyProductName?: string | null;
  launchDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // optional LTO end date
  launchUnitsCommitted?: number;
  launchStrengthPct?: number; // 100 means 100%
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = toDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

export function daysInclusive(start: string, end: string) {
  if (!start || !end) return 0;
  const diff = toDate(end).getTime() - toDate(start).getTime();
  return Math.max(0, Math.floor(diff / 86400000) + 1);
}

export function normalizeCampaignLike(raw: Partial<CampaignLike>): CampaignLike | null {
  const startDate = cleanText(raw.startDate).slice(0, 10);
  const endDate = cleanText(raw.endDate).slice(0, 10);
  if (!startDate || !endDate) return null;
  if (endDate < startDate) return null;
  return {
    id: cleanText(raw.id) || undefined,
    name: cleanText(raw.name) || undefined,
    startDate,
    endDate,
    liftPct: asNumber(raw.liftPct),
  };
}

export function normalizeLaunchPlanLike(raw: Partial<LaunchPlanLike>): LaunchPlanLike | null {
  const productName = cleanText(raw.productName);
  if (!productName) return null;
  const proxyProductName = cleanText(raw.proxyProductName) || null;
  const launchDate = cleanText(raw.launchDate).slice(0, 10) || null;
  const endDate = cleanText(raw.endDate).slice(0, 10) || null;
  if (endDate && launchDate && endDate < launchDate) return null;
  return {
    productName,
    proxyProductName,
    launchDate,
    endDate,
    launchUnitsCommitted: Math.max(0, asNumber(raw.launchUnitsCommitted)),
    launchStrengthPct: Math.max(0, asNumber(raw.launchStrengthPct ?? 100)),
  };
}

export function buildDateSetForCampaigns(
  campaigns: CampaignLike[],
  rangeStart: string,
  rangeEnd: string,
) {
  const dates = new Set<string>();
  campaigns.forEach((campaign) => {
    const start = campaign.startDate > rangeStart ? campaign.startDate : rangeStart;
    const end = campaign.endDate < rangeEnd ? campaign.endDate : rangeEnd;
    if (!start || !end || end < start) return;
    const totalDays = daysInclusive(start, end);
    for (let offset = 0; offset < totalDays; offset += 1) {
      dates.add(addDays(start, offset));
    }
  });
  return dates;
}

export function campaignAverageLiftFactor(
  campaigns: CampaignLike[],
  rangeStart: string,
  rangeEnd: string,
) {
  const totalDays = daysInclusive(rangeStart, rangeEnd);
  if (totalDays <= 0) return 1;
  let factorSum = 0;
  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = addDays(rangeStart, offset);
    const dailyLift = campaigns.reduce((sum, campaign) => {
      if (!campaign?.startDate || !campaign?.endDate) return sum;
      if (date < campaign.startDate || date > campaign.endDate) return sum;
      return sum + asNumber(campaign.liftPct) / 100;
    }, 0);
    factorSum += 1 + dailyLift;
  }
  return factorSum / totalDays;
}

export function launchDailyDemandFromProxyAvg(proxyAvgDailyDemand: number, strengthPct: number) {
  const strength = asNumber(strengthPct);
  const factor = strength > 0 ? strength / 100 : 1;
  return Math.max(0, asNumber(proxyAvgDailyDemand) * factor);
}

export function launchActiveDaysInHorizon(
  plan: LaunchPlanLike,
  horizonStart: string,
  horizonEnd: string,
) {
  const start = cleanText(plan.launchDate) ? cleanText(plan.launchDate!).slice(0, 10) : horizonStart;
  const end = cleanText(plan.endDate) ? cleanText(plan.endDate!).slice(0, 10) : horizonEnd;
  const activeStart = start > horizonStart ? start : horizonStart;
  const activeEnd = end < horizonEnd ? end : horizonEnd;
  return daysInclusive(activeStart, activeEnd);
}

