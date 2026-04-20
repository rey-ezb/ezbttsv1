# Demand Planning Old Logic Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the new demand-planning tool keep the clean separate surface, but use the old business rules for real products, virtual bundles, seasonal safety stock, gross sales, and optional samples velocity.

**Architecture:** Keep the new local app and lean upload flow. Replace the simplified planning math with the old business rules in focused backend helpers, and expose only plain-English controls in the UI.

**Tech Stack:** Python, pandas, stdlib HTTP server, vanilla HTML/CSS/JS, unittest

---

### Task 1: Add tests for the business rules

**Files:**
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\tests\test_normalize_orders.py`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\tests\test_repository.py`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\tests\test_planner.py`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\tests\test_service.py`

- [ ] Write failing tests for gross sales normalization, samples loading, and seasonal safety stock.
- [ ] Run the targeted tests and confirm they fail for the expected reasons.

### Task 2: Align backend data loading and planning math

**Files:**
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\demand_planning_app\normalize.py`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\demand_planning_app\repository.py`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\demand_planning_app\planner.py`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\demand_planning_app\service.py`

- [ ] Add gross sales to normalized order rows using the same order-export basis as the old app.
- [ ] Load samples from `Data\Samples` with the same raw reader as orders.
- [ ] Update planning math to use 3 weeks safety in Q1/Q2 and 5 weeks in Q3/Q4.
- [ ] Add the `sales only` vs `sales + samples` demand mode and carry gross sales through the planning output.

### Task 3: Update the dashboard language and controls

**Files:**
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\app.py`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\static\index.html`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\static\app.js`
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\static\styles.css`

- [ ] Add a simple `How to count demand` control with `Sales only` and `Sales + samples`.
- [ ] Show gross sales in simple wording.
- [ ] Replace technical copy with plain-English labels that match the business flow.

### Task 4: Verify end to end

**Files:**
- Modify: `C:\Users\Rey\Desktop\codex\Demand planning\materialize_data.py` if needed for consistency

- [ ] Run the full test suite.
- [ ] Verify the local preview loads sample data, shows 6 real products, and returns planning rows using the new controls.
