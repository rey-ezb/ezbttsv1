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

The current Python app is good for local iteration, but it is not the best direct Netlify target.

Recommended next migration:

1. Build a small Next.js frontend shell for Netlify
2. Move the demand-planning API routes into Next.js route handlers
3. Read and write lean data from Firebase
4. Keep the planning math in shared server-side modules

Netlify handles static output directly. If the hosted app uses server routes or SSR later, Netlify will map that server-side code through the framework adapter during build.

## Migration steps

1. Create a Firebase project
2. Enable Firestore
3. Add service credentials for local admin scripts
4. Define the lean collections above
5. Write a one-time importer that takes the local lean tables and writes them into Firebase
6. Create a Next.js app in the repo for hosted deployment
7. Add Firebase config and secrets to Netlify environment variables
8. Add a `netlify.toml` file with the right framework build settings
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
