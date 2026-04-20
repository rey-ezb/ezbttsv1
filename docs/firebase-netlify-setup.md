# Firebase + Netlify setup

This project currently runs as a local Python preview app. The recommended hosted shape is:

1. Netlify for the web app
2. Firebase for lean app data
3. Raw files kept out of the hosted runtime

## Recommended hosted architecture

### Keep in Firebase

Only store the lean data needed by the app:

- demand daily
- sample daily
- inventory snapshots
- monthly forecast settings
- KPI lean tables
- launch planning settings

### Keep out of Firebase

Do not upload the heavy raw folders:

- `Data/All orders`
- `Data/Samples`
- `Data/Replacements`
- raw finance exports

## Firebase collections to start with

### `planningDemandDaily`
- `date`
- `productName`
- `unitsSold`
- `grossSales`

### `planningSamplesDaily`
- `date`
- `productName`
- `unitsSent`

### `inventorySnapshots`
- `snapshotDate`
- `productName`
- `onHand`
- `inTransit`
- `transitEta`

### `forecastSettings`
- `yearMonth`
- `upliftPct`
- `productMix`

### `launchPlans`
- `productName`
- `launchDate`
- `launchUnitsCommitted`
- `proxyProductName`
- `launchStrengthPct`
- `launchSampleUnits`
- `launchBundleUpliftPct`
- `launchCoverWeeksTarget`

### `kpiTables`
- lean summary documents only

## Netlify path

The current Python app is still the best local source-of-truth for fast iteration.

The hosted path now has a first working layer:

1. a small Next.js wrapper in [`web/`](C:/Users/Rey/Desktop/codex/Demand%20planning/web)
2. Firebase as the lean database
3. Netlify as the hosted runtime

This wrapper already builds successfully and reads Firestore through the Firebase Admin SDK.

Netlify handles Next.js server routes and SSR through its runtime automatically during build.

## Migration steps

1. Create a Firebase project
2. Enable Firestore
3. Add service credentials for local admin scripts
4. Define the lean collections above
5. Write a one-time importer that takes the local lean tables and writes them into Firebase
6. Use the existing `web/` Next.js app in the repo for hosted deployment
7. Add Firebase config and secrets to Netlify environment variables
8. Keep the root `netlify.toml` so Netlify builds from `web/`
9. Move the current `/api/workspace`, `/api/plan`, `/api/forecast-settings`, and KPI endpoints into Next.js route handlers
10. Connect the GitHub repo to Netlify for continuous deploys
11. Use `netlify dev` locally when you want Netlify-style preview behavior

## Practical Netlify commands

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify dev
netlify deploy
netlify deploy --prod
```

If you prefer Git-based deploys, you can link the GitHub repo in Netlify and let pushes trigger previews and production deploys.

## Netlify environment variables

Add these in Netlify Site configuration > Environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

`FIREBASE_SERVICE_ACCOUNT_JSON` should be the full JSON key on one line, not a file path.

## Current status

Already done:

1. Firestore project created
2. Lean planning data synced into Firestore
3. Next.js wrapper created in `web/`
4. Production build passes locally with Firebase env vars

Next step:

1. connect the GitHub repo to Netlify
2. paste the environment variables above
3. deploy the `web/` app

## Why this is the right path

- cheap
- small hosted data footprint
- easy to update with new files
- no need to host giant raw exports
- clean path to expand beyond TikTok later

## Practical recommendation

Short term:

- keep using the current local Python app for development
- push code to GitHub
- keep Firebase as the future lean database target

Next step:

- create a small Next.js/Netlify wrapper and migrate the current JSON API shape into it
