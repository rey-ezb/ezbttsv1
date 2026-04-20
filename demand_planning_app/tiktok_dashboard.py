from __future__ import annotations

import importlib.util
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from demand_planning_app.planning_products import PRODUCT_CATALOG

ROOT_DIR = Path(__file__).resolve().parents[1]
LEGACY_WEB_DASHBOARD = ROOT_DIR.parent / "Tiktok agent" / "web_dashboard" / "server.py"
LEGACY_ANALYSIS_OUTPUT_DIR = ROOT_DIR.parent / "Tiktok agent" / "analysis_output"

DEFAULT_KPI_TAB = "orders"
KPI_TABS = ["orders", "finance", "reconciliation", "products", "customers", "audit"]


def _empty_frame(columns: list[str]) -> pd.DataFrame:
    return pd.DataFrame(columns=columns)


def _ensure_columns(frame: pd.DataFrame, defaults: dict[str, Any]) -> pd.DataFrame:
    working = frame.copy()
    for column, default in defaults.items():
        if column not in working.columns:
            working[column] = default
    return working


def _to_timestamp(value: Any, fallback: pd.Timestamp | None = None) -> pd.Timestamp | None:
    if value in (None, ""):
        return fallback
    stamp = pd.to_datetime(value, errors="coerce")
    if pd.isna(stamp):
        return fallback
    return stamp.normalize()


def _normalize_sources(values: list[str] | None) -> list[str]:
    normalized = [str(value).strip().title() for value in (values or []) if str(value).strip()]
    return normalized or ["Sales"]


def _safe_ratio(numerator: float, denominator: float) -> float:
    if not denominator:
        return 0.0
    return float(numerator) / float(denominator)


def _friendly_date(value: pd.Timestamp | None) -> str:
    if value is None or pd.isna(value):
        return ""
    return f"{value.month}/{value.day}/{value.year}"


def _money(value: Any) -> float:
    numeric = pd.to_numeric(pd.Series([value]), errors="coerce").fillna(0.0).iloc[0]
    return float(numeric)


def _build_cards(filtered_orders: pd.DataFrame, full_orders: pd.DataFrame) -> dict[str, Any]:
    if filtered_orders.empty:
        return {
            "grossProductSales": 0.0,
            "netProductSales": 0.0,
            "aov": 0.0,
            "paidOrders": 0,
            "unitsSold": 0.0,
            "uniqueCustomers": 0,
            "newCustomers": 0,
            "repeatCustomers": 0,
            "repeatCustomerRate": 0.0,
        }

    valid_orders = filtered_orders.loc[~filtered_orders["is_cancelled"].fillna(False)].copy()
    valid_customers = valid_orders.loc[valid_orders["customer_id"].astype("string").str.strip().ne("")].copy()
    first_orders = (
        full_orders.loc[full_orders["customer_id"].astype("string").str.strip().ne("")]
        .groupby("customer_id", as_index=False)
        .agg(first_order_date=("reporting_date", "min"))
    )
    merged_customers = valid_customers.merge(first_orders, on="customer_id", how="left")
    start_date = valid_orders["reporting_date"].min()
    new_customers = int(merged_customers.loc[merged_customers["first_order_date"].eq(start_date), "customer_id"].nunique()) if start_date is not None else 0
    repeat_customers = int(
        merged_customers.loc[merged_customers["first_order_date"].lt(start_date), "customer_id"].nunique()
    ) if start_date is not None else 0
    unique_customers = int(valid_customers["customer_id"].nunique()) if not valid_customers.empty else 0

    return {
        "grossProductSales": float(valid_orders["gross_product_sales"].sum()),
        "netProductSales": float(valid_orders["net_product_sales"].sum()),
        "aov": _safe_ratio(float(valid_orders["gross_product_sales"].sum()), float(valid_orders["is_paid"].sum())),
        "paidOrders": int(valid_orders["is_paid"].sum()),
        "unitsSold": float(valid_orders["units_sold"].sum()),
        "uniqueCustomers": unique_customers,
        "newCustomers": new_customers,
        "repeatCustomers": repeat_customers,
        "repeatCustomerRate": _safe_ratio(repeat_customers, unique_customers),
    }


def _build_status_rows(filtered_orders: pd.DataFrame) -> list[dict[str, Any]]:
    if filtered_orders.empty:
        return []
    valid_orders = filtered_orders.loc[~filtered_orders["is_cancelled"].fillna(False)]
    rows = [
        {"status": "Placed", "orders": int(valid_orders["order_id"].nunique())},
        {"status": "Canceled", "orders": int(filtered_orders["is_cancelled"].fillna(False).sum())},
        {"status": "Refunded", "orders": int(filtered_orders["is_refunded"].fillna(False).sum())},
    ]
    total = sum(row["orders"] for row in rows) or 1
    for row in rows:
        row["share"] = row["orders"] / total
    return rows


def _build_cards_from_daily(orders_daily: pd.DataFrame) -> dict[str, Any]:
    if orders_daily.empty:
        return {
            "grossProductSales": 0.0,
            "netProductSales": 0.0,
            "aov": 0.0,
            "paidOrders": 0,
            "unitsSold": 0.0,
            "uniqueCustomers": 0,
            "newCustomers": 0,
            "repeatCustomers": 0,
            "repeatCustomerRate": 0.0,
        }
    gross_product_sales = float(orders_daily["gross_product_sales"].sum())
    paid_orders = int(orders_daily["paid_orders"].sum())
    unique_customers = int(orders_daily["unique_customers"].sum())
    return {
        "grossProductSales": gross_product_sales,
        "netProductSales": float(orders_daily["net_product_sales"].sum()),
        "aov": _safe_ratio(gross_product_sales, paid_orders),
        "paidOrders": paid_orders,
        "unitsSold": float(orders_daily["units_sold"].sum()),
        "uniqueCustomers": unique_customers if unique_customers else None,
        "newCustomers": None,
        "repeatCustomers": None,
        "repeatCustomerRate": None,
    }


def _build_status_rows_from_daily(orders_daily: pd.DataFrame) -> list[dict[str, Any]]:
    if orders_daily.empty:
        return []
    rows = [
        {"status": "Placed", "orders": int(orders_daily["valid_orders"].sum())},
        {"status": "Canceled", "orders": int(orders_daily["canceled_orders"].sum())},
        {"status": "Refunded", "orders": int(orders_daily["refunded_orders"].sum())},
    ]
    total = sum(row["orders"] for row in rows) or 1
    for row in rows:
        row["share"] = row["orders"] / total
    return rows


def _build_order_health_from_daily(orders_daily: pd.DataFrame) -> dict[str, Any]:
    if orders_daily.empty:
        return {
            "valid_orders": 0,
            "cancellation_rate": 0.0,
            "refund_rate": 0.0,
            "return_rate": 0.0,
            "delivery_rate": 0.0,
        }
    total_orders = int(orders_daily["total_orders"].sum()) or int(
        orders_daily["valid_orders"].sum()
        + orders_daily["canceled_orders"].sum()
        + orders_daily["refunded_orders"].sum()
    )
    return {
        "valid_orders": int(orders_daily["valid_orders"].sum()),
        "cancellation_rate": _safe_ratio(int(orders_daily["canceled_orders"].sum()), total_orders),
        "refund_rate": _safe_ratio(int(orders_daily["refunded_orders"].sum()), total_orders),
        "return_rate": _safe_ratio(int(orders_daily["returned_orders"].sum()), total_orders),
        "delivery_rate": _safe_ratio(int(orders_daily["delivered_orders"].sum()), total_orders),
    }


def _build_top_cities(filtered_orders: pd.DataFrame, limit: int = 8) -> list[dict[str, Any]]:
    if filtered_orders.empty:
        return []
    working = filtered_orders.loc[
        filtered_orders["customer_id"].astype("string").str.strip().ne("") & filtered_orders["city"].astype("string").str.strip().ne("")
    ].copy()
    if working.empty:
        return []
    grouped = (
        working.groupby(["city", "state"], as_index=False)
        .agg(unique_customers=("customer_id", "nunique"), orders=("order_id", "nunique"))
        .sort_values(["unique_customers", "orders"], ascending=False)
    )
    total_customers = int(grouped["unique_customers"].sum()) or 1
    rows = grouped.head(limit).to_dict(orient="records")
    for row in rows:
        row["share"] = row["unique_customers"] / total_customers
    return rows


def _build_top_zips(filtered_orders: pd.DataFrame, limit: int = 10) -> list[dict[str, Any]]:
    if filtered_orders.empty:
        return []
    working = filtered_orders.loc[
        filtered_orders["customer_id"].astype("string").str.strip().ne("") & filtered_orders["zipcode"].astype("string").str.strip().ne("")
    ].copy()
    if working.empty:
        return []
    grouped = (
        working.groupby(["zipcode", "city", "state"], as_index=False)
        .agg(unique_customers=("customer_id", "nunique"), orders=("order_id", "nunique"))
        .sort_values(["unique_customers", "orders"], ascending=False)
        .head(limit)
    )
    return grouped.to_dict(orient="records")


def _build_cohort_rows(full_orders: pd.DataFrame, filtered_orders: pd.DataFrame, max_months: int = 6) -> list[dict[str, Any]]:
    not_cancelled = ~pd.Series(full_orders.get("is_cancelled", pd.Series(False, index=full_orders.index)), index=full_orders.index).fillna(False).astype(bool)
    has_customer = full_orders["customer_id"].astype("string").fillna("").str.strip().ne("").astype(bool)
    has_date = full_orders["reporting_date"].notna().astype(bool)
    valid_full = full_orders.loc[not_cancelled & has_customer & has_date].copy()
    if valid_full.empty:
        return []
    valid_full["cohort_month"] = valid_full["reporting_date"].dt.to_period("M").dt.to_timestamp()
    first_month = valid_full.groupby("customer_id")["cohort_month"].min().rename("first_month")
    active = (
        valid_full[["customer_id", "cohort_month"]]
        .assign(first_month=lambda frame: frame["customer_id"].map(first_month))
        .drop_duplicates()
    )
    active["month_offset"] = (
        (active["cohort_month"].dt.year - active["first_month"].dt.year) * 12
        + (active["cohort_month"].dt.month - active["first_month"].dt.month)
    )
    active = active.loc[active["month_offset"].between(0, max_months)]
    base = active.loc[active["month_offset"].eq(0)].groupby("first_month")["customer_id"].nunique().rename("base_size")
    cohort_counts = (
        active.groupby(["first_month", "month_offset"])["customer_id"].nunique().reset_index(name="customers")
    )
    rows: list[dict[str, Any]] = []
    visible_months = set(filtered_orders.loc[filtered_orders["reporting_date"].notna(), "reporting_date"].dt.to_period("M").dt.to_timestamp())
    for cohort_month, group in cohort_counts.groupby("first_month"):
        if visible_months and cohort_month not in visible_months:
            continue
        base_size = int(base.get(cohort_month, 0)) or 1
        row: dict[str, Any] = {"cohort": cohort_month.strftime("%Y-%m")}
        for offset in range(0, max_months + 1):
            customers = int(group.loc[group["month_offset"].eq(offset), "customers"].sum())
            row[f"m{offset}"] = customers / base_size if customers else 0.0
        rows.append(row)
    return sorted(rows, key=lambda item: item["cohort"], reverse=True)


def _build_products_view(filtered_products: pd.DataFrame) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    if filtered_products.empty:
        return [], {"trackedProducts": 0, "listingRows": 0, "salesUnits": 0.0, "sampleUnits": 0.0, "replacementUnits": 0.0}
    grouped = (
        filtered_products.groupby(["product_name", "seller_sku_resolved"], as_index=False)
        .agg(
            gross_product_sales=("gross_product_sales", "sum"),
            net_product_sales=("net_product_sales", "sum"),
            units_sold=("units_sold", "sum"),
            paid_orders=("paid_orders", "sum"),
            valid_orders=("valid_orders", "sum"),
        )
        .sort_values(["units_sold", "gross_product_sales"], ascending=False)
        .reset_index(drop=True)
    )
    rows = grouped.to_dict(orient="records")
    return rows, {
        "trackedProducts": int(grouped["product_name"].nunique()),
        "listingRows": int(len(grouped)),
        "salesUnits": float(grouped["units_sold"].sum()),
        "sampleUnits": 0.0,
        "replacementUnits": 0.0,
    }


def _build_core_product_mix(
    planning_daily: pd.DataFrame,
    *,
    selected_start: pd.Timestamp,
    selected_end: pd.Timestamp,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    if planning_daily is None or planning_daily.empty:
        return [], {"coreProducts": 0, "salesUnits": 0.0, "grossSales": 0.0, "estimatedCogs": 0.0}
    working = planning_daily.loc[planning_daily["date"].between(selected_start, selected_end)].copy()
    if working.empty:
        return [], {"coreProducts": 0, "salesUnits": 0.0, "grossSales": 0.0, "estimatedCogs": 0.0}
    grouped = (
        working.groupby("product_name", as_index=False)
        .agg(
            units_sold=("net_units", "sum"),
            gross_sales=("gross_sales", "sum"),
        )
        .sort_values("units_sold", ascending=False)
        .reset_index(drop=True)
    )
    total_units = float(grouped["units_sold"].sum()) or 0.0
    total_gross_sales = float(grouped["gross_sales"].sum()) or 0.0
    grouped["unit_mix_pct"] = grouped["units_sold"].apply(lambda value: _safe_ratio(float(value), total_units))
    grouped["sales_mix_pct"] = grouped["gross_sales"].apply(lambda value: _safe_ratio(float(value), total_gross_sales))
    grouped["list_price"] = grouped["product_name"].map(lambda name: PRODUCT_CATALOG.get(str(name), {}).get("list_price", 0.0))
    grouped["unit_cogs"] = grouped["product_name"].map(lambda name: PRODUCT_CATALOG.get(str(name), {}).get("cogs", 0.0))
    grouped["estimated_cogs"] = grouped["units_sold"] * grouped["unit_cogs"]
    return grouped.to_dict(orient="records"), {
        "coreProducts": int(grouped["product_name"].nunique()),
        "salesUnits": total_units,
        "grossSales": total_gross_sales,
        "estimatedCogs": float(grouped["estimated_cogs"].sum()),
    }


def _build_audit_payload(
    audit_rows: pd.DataFrame,
    analysis_output_dir: Path = LEGACY_ANALYSIS_OUTPUT_DIR,
) -> dict[str, Any]:
    data_quality = audit_rows.iloc[0].to_dict() if audit_rows is not None and not audit_rows.empty else {}
    kpi_rows: list[dict[str, Any]] = []
    report_sections: list[str] = []
    summary_path = analysis_output_dir / "kpi_full.csv"
    report_path = analysis_output_dir / "report.md"
    if summary_path.exists():
        summary_df = pd.read_csv(summary_path)
        kpi_rows = summary_df[["metric", "category", "formatted_value", "formula", "notes"]].head(20).to_dict(orient="records")
    if report_path.exists():
        report_sections = [
            line.strip("- ").strip()
            for line in report_path.read_text(encoding="utf-8").splitlines()
            if line.startswith("- **") or line.startswith("- Removed") or line.startswith("- Default")
        ][:10]
    return {
        "dataQuality": data_quality,
        "kpiRows": kpi_rows,
        "reportHighlights": report_sections,
    }


@lru_cache(maxsize=1)
def _legacy_module() -> Any | None:
    if not LEGACY_WEB_DASHBOARD.exists():
        return None
    spec = importlib.util.spec_from_file_location("legacy_dashboard_server", LEGACY_WEB_DASHBOARD)
    if spec is None or spec.loader is None:
        return None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _build_finance_payload(
    start_date: pd.Timestamp,
    end_date: pd.Timestamp,
    date_basis: str,
    selected_sources: list[str],
) -> dict[str, Any]:
    module = _legacy_module()
    if module is None:
        return {
            "summary": {},
            "dailyRows": [],
            "expenseRows": [],
            "expenseDetailRows": [],
            "reconciliationSummary": {},
            "reconciliationRows": [],
            "unmatchedStatementRows": [],
            "unmatchedOrderRows": [],
        }

    statement_rows = module.load_statement_rows(start_date, end_date)
    filtered_statement_rows = (
        statement_rows.loc[statement_rows["statement_date"].between(start_date, end_date)].copy()
        if statement_rows is not None and not statement_rows.empty
        else pd.DataFrame()
    )
    statement_summary = module.summarize_statement_period(filtered_statement_rows)
    statement_daily_rows = module.build_statement_daily_table(filtered_statement_rows)
    expense_rows, expense_detail_rows = module.build_statement_expense_structure(filtered_statement_rows)

    reconciliation_rows = pd.DataFrame()
    unmatched_statement_rows = pd.DataFrame()
    unmatched_order_rows = pd.DataFrame()
    reconciliation_summary: dict[str, Any] = {}
    try:
        store = module.DashboardStore.load()
        selected_source_operational_df = store.raw_operational.loc[store.raw_operational["source_type"].isin(selected_sources)].copy()
        order_level_df = module.build_order_level_view(selected_source_operational_df)
        reconciliation_rows, unmatched_statement_rows, unmatched_order_rows, reconciliation_summary = module.build_reconciliation_view(
            order_level_df,
            filtered_statement_rows,
            date_basis,
            start_date,
            end_date,
        )
    except Exception:
        reconciliation_summary = {}

    return {
        "summary": statement_summary,
        "dailyRows": statement_daily_rows.sort_values("reporting_date", ascending=False).head(60).to_dict(orient="records") if not statement_daily_rows.empty else [],
        "expenseRows": expense_rows.to_dict(orient="records") if expense_rows is not None and not expense_rows.empty else [],
        "expenseDetailRows": expense_detail_rows.to_dict(orient="records") if expense_detail_rows is not None and not expense_detail_rows.empty else [],
        "reconciliationSummary": reconciliation_summary,
        "reconciliationRows": reconciliation_rows.head(80).to_dict(orient="records") if reconciliation_rows is not None and not reconciliation_rows.empty else [],
        "unmatchedStatementRows": unmatched_statement_rows.head(80).to_dict(orient="records") if unmatched_statement_rows is not None and not unmatched_statement_rows.empty else [],
        "unmatchedOrderRows": unmatched_order_rows.head(80).to_dict(orient="records") if unmatched_order_rows is not None and not unmatched_order_rows.empty else [],
    }


def build_tiktok_dashboard_payload(
    tables: dict[str, pd.DataFrame],
    summary: dict[str, Any],
    *,
    start_date: str | None = None,
    end_date: str | None = None,
    active_tab: str = DEFAULT_KPI_TAB,
    date_basis: str = "order",
    order_bucket: str = "paid_time",
    selected_sources: list[str] | None = None,
    inventory_as_of: str | None = None,
    inventory_rows: int = 0,
    planning_signal: dict[str, Any] | None = None,
    planning_daily: pd.DataFrame | None = None,
) -> dict[str, Any]:
    normalized_active_tab = active_tab if active_tab in KPI_TABS else DEFAULT_KPI_TAB
    summary_frame = _ensure_columns(
        tables.get("kpi_orders_summary", pd.DataFrame()),
        {
            "platform": "TikTok",
            "date_start": pd.NaT,
            "date_end": pd.NaT,
            "total_orders": 0,
            "gross_product_sales": 0.0,
            "net_product_sales": 0.0,
            "paid_orders": 0,
            "valid_orders": 0,
            "delivered_orders": 0,
            "shipped_orders": 0,
            "canceled_orders": 0,
            "refunded_orders": 0,
            "returned_orders": 0,
            "refund_amount": 0.0,
            "returned_units": 0.0,
            "units_sold": 0.0,
            "units_per_paid_order": 0.0,
            "aov": 0.0,
            "unique_customers": 0,
            "repeat_customers": 0,
            "first_time_customers": 0,
            "returning_customers": 0,
            "repeat_customer_rate": 0.0,
            "first_time_customer_rate": 0.0,
            "customer_id_basis": "Buyer Username -> Buyer Nickname -> Recipient",
        },
    )
    order_level = _ensure_columns(
        tables.get("kpi_order_level", pd.DataFrame()),
        {
            "platform": "TikTok",
            "source_type": "Sales",
            "order_id": "",
            "reporting_date": pd.NaT,
            "customer_id": "",
            "customer_id_source": "",
            "city": "",
            "state": "",
            "zipcode": "",
            "is_paid": False,
            "is_cancelled": False,
            "is_refunded": False,
            "is_returned": False,
            "is_shipped": False,
            "is_delivered": False,
            "units_sold": 0.0,
            "returned_units": 0.0,
            "gross_product_sales": 0.0,
            "net_product_sales": 0.0,
            "order_refund_amount": 0.0,
        },
    )
    products_daily = _ensure_columns(
        tables.get("kpi_products_daily", pd.DataFrame()),
        {
            "platform": "TikTok",
            "reporting_date": pd.NaT,
            "product_name": "",
            "seller_sku_resolved": "",
            "gross_product_sales": 0.0,
            "net_product_sales": 0.0,
            "units_sold": 0.0,
            "paid_orders": 0.0,
            "valid_orders": 0.0,
        },
    )
    orders_daily_table = _ensure_columns(
        tables.get("kpi_orders_daily", pd.DataFrame()),
        {
            "platform": "TikTok",
            "reporting_date": pd.NaT,
            "total_orders": 0,
            "gross_product_sales": 0.0,
            "net_product_sales": 0.0,
            "paid_orders": 0,
            "valid_orders": 0,
            "delivered_orders": 0,
            "shipped_orders": 0,
            "canceled_orders": 0,
            "refunded_orders": 0,
            "returned_orders": 0,
            "units_sold": 0.0,
            "unique_customers": 0,
        },
    )
    audit_rows = _ensure_columns(
        tables.get("kpi_orders_audit", pd.DataFrame()),
        {
            "platform": "TikTok",
            "date_start": pd.NaT,
            "date_end": pd.NaT,
            "rows_loaded": 0,
            "orders_loaded": 0,
            "blank_customer_rows": 0,
            "rows_without_city": 0,
            "rows_without_zip": 0,
            "canceled_rows": 0,
            "customer_id_basis": "Buyer Username -> Buyer Nickname -> Recipient",
        },
    )
    all_start = _to_timestamp(summary.get("date_start"))
    all_end = _to_timestamp(summary.get("date_end"))
    fallback_end = all_end or pd.Timestamp.now().normalize()
    fallback_start = all_start or (fallback_end - pd.Timedelta(days=29))
    selected_start = _to_timestamp(start_date, fallback_start) or fallback_start
    selected_end = _to_timestamp(end_date, fallback_end) or fallback_end
    sources = _normalize_sources(selected_sources)

    if order_level.empty:
        filtered_orders = order_level.copy()
    else:
        if "source_type" not in order_level.columns:
            order_level["source_type"] = "Sales"
        filtered_orders = order_level.loc[
            order_level["reporting_date"].between(selected_start, selected_end)
            & order_level["source_type"].astype("string").isin(sources)
        ].copy()

    if products_daily.empty:
        filtered_products = pd.DataFrame()
    else:
        filtered_products = products_daily.loc[
            products_daily["reporting_date"].between(selected_start, selected_end)
        ].copy()
    filtered_orders_daily = orders_daily_table.loc[
        orders_daily_table["reporting_date"].between(selected_start, selected_end)
    ].copy() if not orders_daily_table.empty else pd.DataFrame()

    if not filtered_orders.empty:
        cards = _build_cards(filtered_orders, order_level)
        status_rows = _build_status_rows(filtered_orders)
    else:
        cards = _build_cards_from_daily(filtered_orders_daily)
        status_rows = _build_status_rows_from_daily(filtered_orders_daily)
    city_rows = _build_top_cities(filtered_orders, limit=10)
    zip_rows = _build_top_zips(filtered_orders, limit=10)
    cohort_rows = _build_cohort_rows(order_level, filtered_orders)
    product_rows, product_summary = _build_products_view(filtered_products)
    core_product_rows, core_product_summary = _build_core_product_mix(
        planning_daily if planning_daily is not None else pd.DataFrame(),
        selected_start=selected_start,
        selected_end=selected_end,
    )
    orders_daily_rows = []
    if not filtered_orders.empty:
        orders_daily_rows = (
            filtered_orders.groupby("reporting_date", as_index=False)
            .agg(
                gross_product_sales=("gross_product_sales", "sum"),
                net_product_sales=("net_product_sales", "sum"),
                paid_orders=("is_paid", "sum"),
                valid_orders=("order_id", "nunique"),
                units_sold=("units_sold", "sum"),
                unique_customers=("customer_id", "nunique"),
            )
            .sort_values("reporting_date", ascending=False)
            .head(60)
            .to_dict(orient="records")
        )
        order_health = {
            "valid_orders": int(filtered_orders.loc[~filtered_orders["is_cancelled"].fillna(False), "order_id"].nunique()),
            "cancellation_rate": _safe_ratio(int(filtered_orders["is_cancelled"].fillna(False).sum()), int(filtered_orders["order_id"].nunique())),
            "refund_rate": _safe_ratio(int(filtered_orders["is_refunded"].fillna(False).sum()), int(filtered_orders["order_id"].nunique())),
            "return_rate": _safe_ratio(int(filtered_orders["is_returned"].fillna(False).sum()), int(filtered_orders["order_id"].nunique())),
            "delivery_rate": _safe_ratio(int(filtered_orders["is_delivered"].fillna(False).sum()), int(filtered_orders["order_id"].nunique())),
        }
    else:
        if not filtered_orders_daily.empty:
            orders_daily_rows = filtered_orders_daily.sort_values("reporting_date", ascending=False).head(60).to_dict(orient="records")
        order_health = _build_order_health_from_daily(filtered_orders_daily)
    audit_payload = _build_audit_payload(audit_rows)
    finance_payload = {
        "summary": {},
        "dailyRows": [],
        "expenseRows": [],
        "expenseDetailRows": [],
        "reconciliationSummary": {},
        "reconciliationRows": [],
        "unmatchedStatementRows": [],
        "unmatchedOrderRows": [],
    }
    if normalized_active_tab in {"finance", "reconciliation"}:
        finance_payload = _build_finance_payload(selected_start, selected_end, date_basis, sources)
    orders_detail_rows = product_rows[:20]
    products_detail_rows = product_rows[:20]
    customers_snapshot = {
        "targetCityCustomers": city_rows[0]["unique_customers"] if city_rows else 0,
        "targetCityOrders": city_rows[0]["orders"] if city_rows else 0,
        "radiusCustomers": sum(row["unique_customers"] for row in city_rows[:5]) if city_rows else 0,
        "radiusOrders": sum(row["orders"] for row in city_rows[:5]) if city_rows else 0,
        "uniqueCustomers": cards["uniqueCustomers"],
        "repeatCustomers": cards["repeatCustomers"],
    }
    card_details = {
        "grossProductSales": {
            "title": "Orders Gross Sales",
            "description": "Gross product sales in the selected date slice before discounts and refunds.",
            "formula": "Gross Product Sales = SUM(SKU Subtotal Before Discount)",
            "fieldsUsed": "SKU Subtotal Before Discount, selected date basis",
            "rows": [
                {"label": "Gross product sales", "value": cards["grossProductSales"]},
                {"label": "Net product sales", "value": cards["netProductSales"]},
                {"label": "Paid orders", "value": cards["paidOrders"]},
            ],
        },
        "netProductSales": {
            "title": "Net Product Sales",
            "description": "Net product sales after refund amount in the selected date slice.",
            "formula": "Net Product Sales = Gross Product Sales - Refund Amount",
            "fieldsUsed": "SKU Subtotal Before Discount, Order Refund Amount",
            "rows": [
                {"label": "Net product sales", "value": cards["netProductSales"]},
                {"label": "Gross product sales", "value": cards["grossProductSales"]},
            ],
        },
        "aov": {
            "title": "Average Order Value",
            "description": "Gross product sales divided by paid orders in the selected slice.",
            "formula": "AOV = Gross Product Sales / Paid Orders",
            "fieldsUsed": "Gross Product Sales, Paid Orders",
            "rows": [
                {"label": "AOV", "value": cards["aov"]},
                {"label": "Paid orders", "value": cards["paidOrders"]},
            ],
        },
        "paidOrders": {
            "title": "Paid Orders",
            "description": "Orders counted in the selected date slice based on the chosen order bucket.",
            "formula": "Paid Orders = COUNT(orders with paid status in slice)",
            "fieldsUsed": "Order ID, paid status, selected date basis",
            "rows": [
                {"label": "Paid orders", "value": cards["paidOrders"]},
                {"label": "Valid orders", "value": order_health["valid_orders"]},
            ],
        },
        "unitsSold": {
            "title": "Units Sold",
            "description": "Units sold in the selected date slice.",
            "formula": "Units Sold = SUM(units_sold)",
            "fieldsUsed": "Units Sold",
            "rows": [
                {"label": "Units sold", "value": cards["unitsSold"]},
                {"label": "Paid orders", "value": cards["paidOrders"]},
            ],
        },
        "uniqueCustomers": {
            "title": "Unique Customers",
            "description": "Distinct customer proxies in the selected slice.",
            "formula": "Unique Customers = COUNT(DISTINCT customer proxy)",
            "fieldsUsed": "Customer proxy, selected date basis",
            "rows": [
                {"label": "Unique customers", "value": cards["uniqueCustomers"]},
                {"label": "Repeat customers", "value": cards["repeatCustomers"]},
            ],
        },
        "newCustomers": {
            "title": "New Customers",
            "description": "Customers whose first valid order lands in the selected slice.",
            "formula": "New Customers = COUNT(customer first order in slice)",
            "fieldsUsed": "Customer proxy, first order date",
            "rows": [
                {"label": "New customers", "value": cards["newCustomers"]},
                {"label": "Unique customers", "value": cards["uniqueCustomers"]},
            ],
        },
        "repeatCustomers": {
            "title": "Repeat Customers",
            "description": "Customers with a prior valid order who also ordered in the selected slice.",
            "formula": "Repeat Customers = COUNT(customers with prior order before slice)",
            "fieldsUsed": "Customer proxy, first order date",
            "rows": [
                {"label": "Repeat customers", "value": cards["repeatCustomers"]},
                {"label": "Unique customers", "value": cards["uniqueCustomers"]},
            ],
        },
        "repeatCustomerRate": {
            "title": "Repeat Customer Rate",
            "description": "Repeat customers divided by unique customers in the selected slice.",
            "formula": "Repeat Customer Rate = Repeat Customers / Unique Customers",
            "fieldsUsed": "Repeat customers, unique customers",
            "rows": [
                {"label": "Repeat customer rate", "value": cards["repeatCustomerRate"]},
                {"label": "Repeat customers", "value": cards["repeatCustomers"]},
                {"label": "Unique customers", "value": cards["uniqueCustomers"]},
            ],
        },
    }

    return {
        "filters": {
            "activeTab": normalized_active_tab,
            "dateBasis": "statement" if date_basis == "statement" else "order",
            "orderBucket": order_bucket if order_bucket in {"paid_time", "file_month"} else "paid_time",
            "startDate": selected_start.strftime("%Y-%m-%d"),
            "endDate": selected_end.strftime("%Y-%m-%d"),
            "output": "analysis_output",
            "availableSources": ["Sales", "Samples", "Replacements"],
            "selectedSources": sources,
            "tabs": KPI_TABS,
        },
        "badges": {
            "deployMode": "Local snapshot",
            "snapshotLabel": f"{_friendly_date(selected_end)}, lean rebuild",
            "outputLabel": "analysis_output",
            "sourcesLabel": ", ".join(sources),
            "dateBasisLabel": "Statement date" if date_basis == "statement" else "Order date",
            "orderBucketLabel": "Paid Time" if order_bucket == "paid_time" else "File Month",
        },
        "cards": cards,
        "cardDetail": {
            "title": "Orders Gross Sales",
            "description": "Paid-time order-export view before discounts and refunds.",
            "formula": "Gross Product Sales = SUM(SKU Subtotal Before Discount)",
            "fieldsUsed": "SKU Subtotal Before Discount, Paid Time",
            "rows": [
                {"label": "Gross product sales", "value": cards["grossProductSales"]},
                {"label": "Net product sales", "value": cards["netProductSales"]},
                {"label": "AOV", "value": cards["aov"]},
                {"label": "Paid orders", "value": cards["paidOrders"]},
            ],
        },
        "cardDetails": card_details,
        "tabs": {
            "orders": {
                "dailyRows": orders_daily_rows,
                "snapshot": {
                    "netProductSales": cards["netProductSales"],
                    "aov": cards["aov"],
                    "paidOrders": cards["paidOrders"],
                    "salesUnits": cards["unitsSold"],
                    "unitsPerPaidOrder": _safe_ratio(cards["unitsSold"], cards["paidOrders"]),
                    "newCustomers": cards["newCustomers"],
                    "repeatCustomers": cards["repeatCustomers"],
                    "repeatCustomerRate": cards["repeatCustomerRate"],
                },
                "statusRows": status_rows,
                "health": order_health,
                "productRows": (core_product_rows[:10] if core_product_rows else product_rows[:10]),
                "cityRows": city_rows,
                "cohortRows": cohort_rows,
                "detailRows": orders_detail_rows,
            },
            "finance": finance_payload,
            "reconciliation": {
                "summary": finance_payload.get("reconciliationSummary", {}),
                "matchedRows": finance_payload.get("reconciliationRows", []),
                "unmatchedStatementRows": finance_payload.get("unmatchedStatementRows", []),
                "unmatchedOrderRows": finance_payload.get("unmatchedOrderRows", []),
            },
            "products": {
                "summary": {
                    **product_summary,
                    **core_product_summary,
                },
                "productRows": core_product_rows[:12] or product_rows[:12],
                "listingRows": product_rows[:20] or core_product_rows[:20],
                "inventorySnapshot": {
                    "snapshotDate": inventory_as_of,
                    "rowsWithValues": inventory_rows,
                },
                "planningSignal": planning_signal or {},
                "detailRows": core_product_rows or products_detail_rows,
            },
            "customers": {
                "cityRows": city_rows,
                "zipRows": zip_rows,
                "targetingSnapshot": customers_snapshot,
                "cohortRows": cohort_rows,
            },
            "audit": audit_payload,
        },
    }
