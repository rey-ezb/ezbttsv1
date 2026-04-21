# Demand Planning Webapp Build Guide

## Goal

Build a demand planning webapp that is fast to iterate on, cheap to run, and limited to the data and features that materially improve replenishment decisions.

Default rule: do not build broad ERP functionality. Build a focused planning system.

## Core Product Scope

The first usable version should answer only these questions:

1. What should we reorder?
2. How many units should we reorder?
3. When will each SKU stock out?
4. Which SKUs are overstocked, healthy, at risk, or already late?
5. What purchase order recommendation should be generated today?

If a feature does not improve one of those answers, it should not be in V1.

## V1 Modules

Keep V1 to five modules:

1. `SKU Master`
2. `Demand History`
3. `Inventory Snapshot`
4. `Planning Engine`
5. `Planner Dashboard`

Nice-to-have modules like supplier portals, warehouse tooling, promo orchestration, advanced permissions, forecasting labs, and finance dashboards should stay out of the first build.

## Only Use Data Needed For V1

The data model should stay lean. Do not ingest large datasets without a direct planning use.

### Required tables

1. `skus`
   - `sku`
   - `name`
   - `category`
   - `status`
   - `supplier_id`
   - `unit_cost`
   - `moq`
   - `case_pack`
   - `lead_time_days`
   - `review_cycle_days`
   - `service_level`
   - `is_active`

2. `inventory_snapshots`
   - `snapshot_date`
   - `sku`
   - `on_hand_units`
   - `reserved_units`
   - `inbound_units`
   - `available_units`

3. `demand_daily`
   - `date`
   - `sku`
   - `units_sold`
   - `units_returned`
   - `net_units`

4. `purchase_orders`
   - `po_id`
   - `sku`
   - `ordered_units`
   - `received_units`
   - `open_units`
   - `order_date`
   - `expected_receipt_date`
   - `status`

5. `planning_runs`
   - `run_at`
   - `sku`
   - `avg_daily_demand`
   - `forecast_window_days`
   - `projected_stockout_date`
   - `reorder_point_units`
   - `recommended_order_units`
   - `reason_code`

### Data explicitly out of scope for V1

Do not ingest unless a later feature needs them:

- clickstream events
- customer profiles
- raw warehouse scans
- full accounting ledgers
- marketing attribution data
- minute-level order events
- supplier message history
- product content metadata

## Recommended Planning Logic

Start simple and correct before adding advanced forecasting.

### V1 planning method

For each SKU:

1. Calculate recent demand using trailing windows such as 7, 28, and 90 days.
2. Use a blended daily demand rate with guardrails for low-volume items.
3. Compute demand during lead time.
4. Add safety stock.
5. Set reorder point.
6. Recommend order quantity rounded to MOQ or case pack.

Base formulas:

- `available_to_promise = on_hand_units - reserved_units + inbound_units`
- `lead_time_demand = avg_daily_demand * lead_time_days`
- `safety_stock = z_score(service_level) * demand_std_dev * sqrt(lead_time_days)`
- `reorder_point = lead_time_demand + safety_stock`
- `recommended_order_qty = max(0, target_stock_level - available_to_promise)`

If historical depth is weak, prefer transparent heuristics over a fake ML forecast.

## Forecasting Strategy

Use a maturity ladder:

1. V1: rules-based forecasting with trailing averages and seasonality flags only where proven.
2. V2: segmented models by SKU behavior class.
3. V3: probabilistic forecasting only if forecast accuracy and planner trust justify it.

Do not start with black-box forecasting. Planners need explainable outputs.

## Segmentation Recommendation

Every SKU should be classified before planning:

1. demand pattern: stable, seasonal, intermittent, new, declining
2. business priority: A, B, C
3. supply risk: short, medium, long lead time

This classification should drive the forecast rule, safety stock rule, and alert threshold.

## Planner Dashboard

The main dashboard should show:

1. SKUs at risk of stockout in the next 7, 14, and 30 days
2. Recommended purchase orders by supplier
3. Overstocked SKUs
4. Forecast versus actual trend
5. Exceptions list with reasons

Each recommendation should show the explanation, not just the number:

- current stock
- inbound stock
- recent demand
- lead time
- safety stock
- reorder point
- final recommendation

## Clean Build Rules

These rules will reduce back-and-forth and token waste.

1. Keep business logic in pure server-side functions, not UI components.
2. Separate input tables, planning logic, and presentation models.
3. Define the data contract first before building screens.
4. Build one planning engine path first; do not maintain parallel logic in SQL, API, and frontend.
5. Every metric on the UI must map to one backend definition.
6. Use typed DTOs for API responses.
7. Add reason codes for every recommendation and exception.
8. Keep one source of truth for lead time, MOQ, and service level.
9. Prefer batch recalculation jobs over recomputing everything on every page load.
10. Store snapshots of planning runs so users can compare changes over time.

## Approval Rules

To avoid accidental remote or live changes:

1. Local code edits, local previews, and local tests can be done without extra approval.
2. Any `git commit`, `git push`, branch publish, GitHub update, Vercel project change, deployment, domain change, or other live production change requires explicit user approval first.
3. Do not assume earlier approval still applies to later pushes or deployments unless the user clearly says that ongoing remote updates are allowed.
4. If there is any doubt, stop after the local fix and ask before changing anything remote.

## Suggested Tech Stack

Choose boring, efficient tools:

1. Frontend: `Next.js`
2. Backend: `Next.js Route Handlers` or a small `FastAPI` service if compute grows
3. Database: `Postgres`
4. ORM/query layer: `Prisma` or direct SQL for heavy planning queries
5. Background jobs: `Trigger.dev`, `Inngest`, or simple scheduled jobs
6. Auth: basic role-based auth only if needed in V1
7. Charts: lightweight charting only for forecast versus actual and inventory projection

If the team is small, a single Next.js app with Postgres is the most efficient starting point.

## Suggested API Surface

Keep the API narrow:

1. `POST /api/import/skus`
2. `POST /api/import/demand`
3. `POST /api/import/inventory`
4. `POST /api/import/purchase-orders`
5. `POST /api/planning/run`
6. `GET /api/planning/recommendations`
7. `GET /api/planning/exceptions`
8. `GET /api/skus/:sku`

Avoid generic CRUD over every table until there is a real need.

## Subagent Guidance

If subagents are used during the build, keep them narrow.

### Recommended subagent roles

1. `Data Contract Agent`
   - Owns schema definitions, column validation, import rules, and sample files.

2. `Planning Logic Agent`
   - Owns demand calculations, stockout projection, reorder point logic, and tests.

3. `UI Agent`
   - Owns dashboard views and explanation panels only.

4. `Verification Agent`
   - Owns fixtures, scenario tests, regression checks, and acceptance criteria.

### Rules for subagents

1. Each subagent should own a separate file area.
2. No subagent should invent data columns.
3. No subagent should broaden scope without approval.
4. No subagent should build features outside the five V1 modules.
5. Outputs should be concise and structured for easy merge.

## Data Quality Rules

The app will fail if inputs are dirty, so validate imports aggressively.

Required checks:

1. duplicate SKU detection
2. missing date detection
3. negative inventory flags
4. impossible lead times
5. invalid MOQ or case pack values
6. future-dated demand rows
7. purchase orders with received units above ordered units

Imports should fail loudly with row-level errors.

## Success Metrics

Track product success with a small set of metrics:

1. stockout rate
2. forecast bias
3. forecast MAPE or WAPE
4. inventory days on hand
5. fill rate
6. planner time saved

Do not add vanity metrics in V1.

## Build Sequence

This is the most efficient order of execution:

1. Define schema and import templates
2. Load sample fixture data
3. Build planning engine with deterministic tests
4. Expose recommendations API
5. Build exceptions dashboard
6. Build SKU detail view with explanation panel
7. Add scheduled planning runs
8. Add versioned run history

Do not start with visual polish before the planning engine is trustworthy.

## Testing Requirements

Testing should focus on business correctness, not just rendering.

### Must-have tests

1. stockout date calculation
2. reorder point calculation
3. MOQ and case-pack rounding
4. low-demand SKU behavior
5. intermittent demand SKU behavior
6. inbound inventory impact
7. bad import rejection
8. API contract tests for recommendations output

### Example planning scenarios

At minimum, include fixtures for:

1. stable fast mover
2. seasonal SKU
3. intermittent SKU
4. new SKU with little history
5. long lead-time SKU
6. overstocked SKU

## Token Efficiency Rules For This Project

To avoid waste during future build sessions:

1. Always start from the current schema and acceptance criteria.
2. Request edits by module, not by entire app.
3. Reuse existing types, fixtures, and reason codes.
4. Avoid asking for full-file rewrites when patch edits are enough.
5. Keep prompts tied to one deliverable at a time.
6. Do not analyze unrelated files.
7. Do not load extra data sources unless a requirement explicitly depends on them.

## Long-Running Process Watchdog

To avoid stuck sessions and invisible hangs:

1. If a command, local preview, test run, or workflow appears to be taking too long, check it proactively instead of waiting indefinitely.
2. Default watchdog check points:
   - around 30 seconds for normal local commands
   - around 60 seconds for heavier rebuilds or test suites
   - immediately after any interrupted turn before continuing work
3. Each watchdog check should inspect:
   - whether the process is still running
   - whether output is still advancing
   - whether the expected port or server is actually live
4. If a process looks stuck, terminate or restart it and report the reason clearly.
5. Before claiming something is still running, verify with an actual process or port check.
6. Do not leave the user waiting on a silent long-running process.

## What Will Make This Webapp Successful

The project will succeed if it stays disciplined about three things:

1. trusted inputs
2. explainable planning logic
3. narrow scope

If those three hold, the UI, workflows, and forecasting sophistication can be layered on later without rework.

## Recommended Next Step

Build the project around a sample dataset first. Before writing any large amount of UI code, lock down:

1. import file format
2. exact planning formulas
3. exception reason codes
4. dashboard acceptance criteria

That is the shortest path to a working demand planning webapp.
