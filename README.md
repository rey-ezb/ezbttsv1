# EZB TikTok Demand Planning

Lean demand planning and TikTok KPI workspace for EZ Bombs.

## Local preview

```powershell
python app.py
```

Then open:

- [http://127.0.0.1:8090](http://127.0.0.1:8090)

## Main areas

- Demand Planning
- TikTok KPIs
- Historical Trends
- Launch Planning

## Notes

- The local build uses lean rebuilt tables instead of querying raw files on every page load.
- Large local data folders and workspace state are ignored in git.
- See [docs/firebase-netlify-setup.md](docs/firebase-netlify-setup.md) for the recommended deploy path.

## Firestore sync

After adding `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_PATH` to `.env.local`:

```powershell
python sync_firestore.py --dry-run
python sync_firestore.py
```

If you also want the lean KPI collections:

```powershell
python sync_firestore.py --include-kpis
```
