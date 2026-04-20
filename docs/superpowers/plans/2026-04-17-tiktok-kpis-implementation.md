# TikTok KPIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate `TikTok KPIs` page to the current app and power it with lean rebuilt orders-only KPI tables.

**Architecture:** Keep one app shell, add client-side page switching between demand planning and TikTok KPIs, add one KPI rebuild module that derives compact summary tables from normalized order data, and expose one KPI API endpoint. Persist KPI rebuild tables locally in `workspace_state` using the same overwrite-overlapping-dates model as demand planning.

**Tech Stack:** Python, pandas, plain JS, static HTML/CSS

---

### Task 1: Add KPI rebuild module

**Files:**
- Create: `C:\Users\Rey\Desktop\codex\Demand planning\demand_planning_app\kpi_metrics.py`
- Test: `C:\Users\Rey\Desktop\codex\Demand planning\tests\test_kpi_metrics.py`

- [ ] Write failing tests for summary, daily, product, customer, city, ZIP, and audit outputs from normalized orders.
- [ ] Implement the lean KPI builders from orders-only inputs.
- [ ] Run KPI tests and verify they pass.

### Task 2: Persist KPI tables in workspace state

**Files:**
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\app.py`
- Test: `C:\Users\Rey\Desktop\codex\Demand planning\tests\test_app_state.py`

- [ ] Add KPI overlay file paths and load/save helpers.
- [ ] Rebuild KPI tables on upload and on refresh/startup.
- [ ] Expose one `GET /api/tiktok-kpis` endpoint.
- [ ] Run state tests and verify KPI persistence survives refresh/startup.

### Task 3: Add KPI page to the UI shell

**Files:**
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\static\index.html`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\static\app.js`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\static\styles.css`
- Test: `C:\Users\Rey\Desktop\codex\Demand planning\tests\test_frontend_glass_layout.py`

- [ ] Add left-nav page switching for `Demand Planning` and `TikTok KPIs`.
- [ ] Add a restrained KPI page layout with strong top-line cards, trends, product, and location tables.
- [ ] Fetch KPI data only when that page is active.
- [ ] Run frontend tests and verify the layout markers still pass.

### Task 4: Verify end to end

**Files:**
- Modify: changed files above only if needed

- [ ] Run the relevant unit tests.
- [ ] Restart the preview server.
- [ ] Verify `/api/workspace` and `/api/tiktok-kpis`.
- [ ] Verify the local preview renders both pages and KPI data.
