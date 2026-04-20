import { getHostedDashboardSummary } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const summary = await getHostedDashboardSummary();

  return (
    <main className="page-shell">
      <div className="page-grid">
        <section className="hero">
          <p className="eyebrow">Firebase + Netlify</p>
          <h1>Hosted shell is now connected to your lean Firestore data.</h1>
          <p>
            This is the first hosted layer for the demand planning project. It does not replace the
            local Python planner yet. It proves the Netlify app can read the same lean Firebase data
            we already synced from your local workspace.
          </p>
        </section>

        <section className="card-grid">
          <article className="card">
            <h2>Planning demand rows</h2>
            <div className="metric">{summary.planningDemandDailyCount.toLocaleString()}</div>
            <div className="meta">Lean daily demand rows already in Firestore.</div>
          </article>
          <article className="card">
            <h2>Sample demand rows</h2>
            <div className="metric">{summary.planningSamplesDailyCount.toLocaleString()}</div>
            <div className="meta">Optional sample rows already available for planning logic.</div>
          </article>
          <article className="card">
            <h2>Inventory snapshots</h2>
            <div className="metric">{summary.inventorySnapshotsCount.toLocaleString()}</div>
            <div className="meta">Latest inventory snapshot date: {summary.latestInventorySnapshot ?? "N/A"}</div>
          </article>
          <article className="card">
            <h2>Launch plans</h2>
            <div className="metric">{summary.launchPlansCount.toLocaleString()}</div>
            <div className="meta">Includes Chile Colorado launch planning data.</div>
          </article>
        </section>

        <section className="split">
          <article className="card">
            <h2>What this proves</h2>
            <ul className="list">
              <li>The hosted app can read your lean Firestore collections.</li>
              <li>We do not need to move the raw export folders into Netlify.</li>
              <li>The current local planner can stay as the source of truth while we migrate safely.</li>
              <li>The next step is moving the current JSON API shape into Next.js route handlers.</li>
            </ul>
          </article>
          <article className="stack">
            <article className="card">
              <h2>Latest synced data</h2>
              <div className="meta">Latest demand date: {summary.latestDemandDate ?? "N/A"}</div>
              <div className="meta">Forecast settings docs: {summary.forecastSettingsCount.toLocaleString()}</div>
            </article>
            <article className="card">
              <h2>Netlify env vars</h2>
              <pre className="code">{`NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_JSON`}</pre>
            </article>
          </article>
        </section>
      </div>
    </main>
  );
}
