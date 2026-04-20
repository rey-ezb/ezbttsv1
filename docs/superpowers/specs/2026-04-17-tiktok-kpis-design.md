# TikTok KPIs Lean Rebuild Design

**Date:** 2026-04-17

**Goal**

Add a separate `TikTok KPIs` surface to the current web app and rebuild only the KPI tables needed from order exports, using the same lean rebuild model already used for demand planning.

**Decision**

Build `TikTok KPIs` as an `orders-only` V1.

This keeps the first KPI release small, fast, and aligned with the current local-state rebuild model:

- upload new order files
- normalize only needed order fields
- rebuild lean KPI tables
- overwrite overlapping dates only
- serve KPI views from rebuilt summary tables

Finance, fee, payout, and reconciliation tables are deferred to V2.

## Why This Cut

The old `Tiktok agent` project shows that most of the KPI surface the user cares about already comes from orders:

- gross product sales
- net product sales
- AOV
- paid / valid / delivered / shipped orders
- units sold
- customer counts and repeat rates
- top products
- cities / states / ZIPs
- radius and target-city customer views
- daily, weekly, monthly trends
- audit and data-quality metrics

The finance export is only required for:

- payout amount
- fee totals
- expense structure
- profit / margin
- reconciliation against statement rows

That makes `orders-only` the right V1 boundary.

## V1 UI Shape

Keep one app shell and add a second page in the left rail:

- `Demand Planning`
- `TikTok KPIs`

Use one HTML shell and a lightweight client-side page switch.

Do not mix KPI payloads into the demand-planning endpoints. Add a separate KPI data path.

## V1 KPI Surface

### Top Cards

- Gross Product Sales
- Net Product Sales
- AOV
- Paid Orders
- Units Sold
- Unique Customers
- Repeat Customers
- Repeat Customer Rate

### Orders Views

- Daily sales
- Daily orders
- Daily units
- Valid orders
- Delivered orders
- Shipped orders
- Canceled orders
- Refunded orders
- Returned or reversed orders
- Cancellation rate
- Refund rate
- Return rate
- Delivery rate

### Product Views

- Top products by sales
- Top products by units
- Daily product performance

### Customer and Location Views

- Unique customers
- First-time customers
- Returning customers
- Repeat customers
- Top cities
- Top states
- Top ZIPs
- Customers within ZIP radius
- Orders within ZIP radius
- Customers in target city area

### Audit Views

- Rows loaded
- Date coverage
- Source mix
- Blank paid-time inferred rows
- Cross-month spill rows
- Mismatch rows
- Mismatch percent

## Minimal Source Fields Needed

From `All orders`, keep only fields needed for the KPI rebuild:

- `Order ID`
- `Paid Time`
- `Created Time`
- `Cancelled Time` if available
- `Shipped Time` if available
- `Delivered Time` if available
- `Order Status`
- `Order Substatus`
- `Cancelation/Return Type`
- `Product Name`
- `Seller SKU`
- `Virtual Bundle Seller SKU`
- `Seller SKU Resolved`
- `Quantity`
- `Sku Quantity of return`
- `SKU Subtotal Before Discount`
- `SKU Subtotal After Discount` if available
- `SKU Seller Discount`
- `SKU Platform Discount`
- `Order Refund Amount` if available
- customer identity fields used for customer proxy
- `Recipient`
- `City`
- `State`
- `Zipcode`
- source type
- reporting date
- file month / inferred paid month flags used by audit

Do not keep unrelated fields in V1.

## Lean Rebuild Tables

### `kpi_orders_summary`

**Grain:** one rebuilt summary row per selected platform

**Purpose:** top KPI cards

**Columns**

- `platform`
- `date_start`
- `date_end`
- `gross_product_sales`
- `net_product_sales`
- `paid_orders`
- `valid_orders`
- `delivered_orders`
- `shipped_orders`
- `canceled_orders`
- `refunded_orders`
- `returned_orders`
- `units_sold`
- `units_per_paid_order`
- `aov`
- `unique_customers`
- `repeat_customers`
- `first_time_customers`
- `returning_customers`
- `repeat_customer_rate`
- `first_time_customer_rate`

### `kpi_orders_daily`

**Grain:** one row per `reporting_date`

**Purpose:** daily trend charts and daily KPI table

**Columns**

- `platform`
- `reporting_date`
- `gross_product_sales`
- `net_product_sales`
- `paid_orders`
- `valid_orders`
- `delivered_orders`
- `shipped_orders`
- `canceled_orders`
- `refunded_orders`
- `returned_orders`
- `units_sold`
- `unique_customers`

### `kpi_products_daily`

**Grain:** one row per `reporting_date + product_name`

**Purpose:** top products and product trend views

**Columns**

- `platform`
- `reporting_date`
- `product_name`
- `seller_sku_resolved`
- `gross_product_sales`
- `net_product_sales`
- `units_sold`
- `paid_orders`

### `kpi_customer_rollup`

**Grain:** one row per `customer_id`

**Purpose:** repeat logic and customer summaries

**Columns**

- `platform`
- `customer_id`
- `first_order_date`
- `last_order_date`
- `paid_order_count`
- `valid_order_count`
- `gross_product_sales`
- `net_product_sales`
- `units_sold`
- `city`
- `state`
- `zipcode`

### `kpi_cities`

**Grain:** one row per `city + state`

**Purpose:** city ranking views

**Columns**

- `platform`
- `city`
- `state`
- `unique_customers`
- `orders`
- `gross_product_sales`
- `net_product_sales`
- `units_sold`

### `kpi_zips`

**Grain:** one row per `zipcode`

**Purpose:** ZIP ranking and radius views

**Columns**

- `platform`
- `zipcode`
- `city`
- `state`
- `unique_customers`
- `orders`
- `gross_product_sales`
- `net_product_sales`
- `units_sold`
- `latitude`
- `longitude`

### `kpi_orders_audit`

**Grain:** one row per rebuild

**Purpose:** data-quality and trust view

**Columns**

- `platform`
- `date_start`
- `date_end`
- `rows_loaded`
- `sales_rows`
- `sample_rows`
- `replacement_rows`
- `blank_paid_time_rows`
- `cross_month_spill_rows`
- `mismatch_rows`
- `mismatch_pct`

## Upload And Overwrite Behavior

For V1 KPI rebuilds:

- required upload: `All orders`
- optional later: `Samples`, `Replacements`
- not required in V1: `Finance Tab`

Behavior:

- normalize the uploaded file into lean rows
- aggregate into KPI tables
- replace overlapping dates only
- leave non-overlapping dates untouched
- persist rebuilt KPI tables locally in the same style as demand planning

## Estimated Size

For the old raw data footprint:

- `All orders` raw folder is about `724.73 MB`
- `Finance Tab` raw folder is about `396.31 MB`

For this V1 `orders-only` KPI rebuild:

- summary and trend tables should stay small enough for Firebase
- realistic expected footprint is roughly `1 MB` to `5 MB` for current history
- this assumes we store summary tables only, not full cleaned row-level order history

If we also store row-level canonical orders in the future database, the footprint will be much larger and will no longer match the lean-storage goal.

## Deferred To V2

Finance-backed tables and views:

- `kpi_statement_daily`
- `kpi_fee_daily`
- `kpi_expense_structure`
- `kpi_reconciliation`

Finance-backed metrics:

- payout amount
- fee totals
- expense structure
- profit
- margin
- statement reconciliation

## Recommended Build Order

1. Add KPI page shell and left-nav split
2. Build orders-only KPI rebuild tables
3. Add one KPI endpoint and render the KPI surface
4. Verify overlapping-date uploads update KPI tables and persist after refresh
5. Add finance-backed KPI tables only after orders-only KPI surface is stable
