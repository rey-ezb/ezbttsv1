import { getFirebaseAdminDb } from "./firebase-admin";

export type HostedDashboardSummary = {
  planningDemandDailyCount: number;
  planningSamplesDailyCount: number;
  inventorySnapshotsCount: number;
  forecastSettingsCount: number;
  launchPlansCount: number;
  latestDemandDate: string | null;
  latestInventorySnapshot: string | null;
};

async function collectionCount(name: string) {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(name).count().get();
  return snapshot.data().count ?? 0;
}

export async function getHostedDashboardSummary(): Promise<HostedDashboardSummary> {
  const db = getFirebaseAdminDb();
  const [planningDemandDailyCount, planningSamplesDailyCount, inventorySnapshotsCount, forecastSettingsCount, launchPlansCount] =
    await Promise.all([
      collectionCount("planningDemandDaily"),
      collectionCount("planningSamplesDaily"),
      collectionCount("inventorySnapshots"),
      collectionCount("forecastSettings"),
      collectionCount("launchPlans"),
    ]);

  const [latestDemandSnapshot, latestInventorySnapshot] = await Promise.all([
    db.collection("planningDemandDaily").orderBy("date", "desc").limit(1).get(),
    db.collection("inventorySnapshots").orderBy("snapshotDate", "desc").limit(1).get(),
  ]);

  return {
    planningDemandDailyCount,
    planningSamplesDailyCount,
    inventorySnapshotsCount,
    forecastSettingsCount,
    launchPlansCount,
    latestDemandDate: latestDemandSnapshot.empty ? null : (latestDemandSnapshot.docs[0].data().date as string),
    latestInventorySnapshot: latestInventorySnapshot.empty ? null : (latestInventorySnapshot.docs[0].data().snapshotDate as string),
  };
}
