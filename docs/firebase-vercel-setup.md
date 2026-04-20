# Firebase + Vercel setup

This project currently runs as a local Python preview app. The recommended hosted shape is:

1. Vercel for the web app
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

## Vercel path

The current Python app is good for local iteration, but it is not the best direct Vercel target.

Recommended next migration:

1. Build a small Next.js frontend shell on Vercel
2. Move the demand-planning API routes into Next.js route handlers
3. Read and write lean data from Firebase
4. Keep the planning math in shared server-side modules

## Migration steps

1. Create a Firebase project
2. Enable Firestore
3. Add service credentials for local admin scripts
4. Define the lean collections above
5. Write a one-time importer that takes the local lean tables and writes them into Firebase
6. Create a Next.js app in the repo for hosted deployment
7. Add Vercel project variables for Firebase config
8. Move the current `/api/workspace`, `/api/plan`, `/api/forecast-settings`, and KPI endpoints into Next.js route handlers
9. Deploy to Vercel
10. Keep raw file rebuilds local or in a controlled admin import flow

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

- create a small Next.js/Vercel wrapper and migrate the current JSON API shape into it
