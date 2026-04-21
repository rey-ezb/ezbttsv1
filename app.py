from __future__ import annotations

import cgi
import json
from dataclasses import dataclass
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import pandas as pd
from pandas.errors import EmptyDataError

from demand_planning_app.inventory_sheet import load_inventory_history
from demand_planning_app.kpi_metrics import build_tiktok_kpi_payload, build_tiktok_kpi_tables
from demand_planning_app.planner import aggregate_daily_demand, normalize_inventory_frame
from demand_planning_app.planning_products import PRODUCT_CATALOG, get_launch_inventory_defaults
from demand_planning_app.repository import build_inventory_template
from demand_planning_app.service import (
    _build_inventory_frame_from_history,
    get_saved_forecast_setting,
    get_saved_uplift_pct,
    load_sample_workspace,
    load_saved_forecast_settings,
    load_saved_uplift_map,
    merge_frame_replace_dates,
    merge_daily_demand_replace_dates,
    parse_inventory_csv_bytes,
    parse_orders_csv_bytes,
    run_planning_workspace,
    save_forecast_setting_for_month,
    save_uplift_pct_for_month,
)
from demand_planning_app.tiktok_dashboard import build_tiktok_dashboard_payload

ROOT_DIR = Path(__file__).resolve().parent
STATIC_DIR = ROOT_DIR / "static"
DATA_DIR = ROOT_DIR / "Data"
LEGACY_ANALYSIS_OUTPUT_DIR = ROOT_DIR.parent / "Tiktok agent" / "analysis_output"
LEGACY_DASHBOARD_CACHE_PATH = ROOT_DIR.parent / "Tiktok agent" / "web_dashboard" / ".dashboard_cache.pkl"
INVENTORY_SOURCE_URL = "https://docs.google.com/spreadsheets/d/1hAjW1gbDd-UJgTfS4Bb2QyOwGo9F53nQebjRBHJz9K8/edit?gid=536853877#gid=536853877"
FORECAST_DEFAULTS_PATH = ROOT_DIR / "planner_forecast_defaults.json"
WORKSPACE_STATE_DIR = ROOT_DIR / "workspace_state"
ORDERS_ROWS_OVERLAY_PATH = WORKSPACE_STATE_DIR / "orders_rows_overlay.csv"
ORDERS_OVERLAY_PATH = WORKSPACE_STATE_DIR / "orders_daily_overlay.csv"
SAMPLES_OVERLAY_PATH = WORKSPACE_STATE_DIR / "samples_daily_overlay.csv"
ORDERS_COUNT_OVERLAY_PATH = WORKSPACE_STATE_DIR / "orders_count_overlay.csv"
SAMPLES_COUNT_OVERLAY_PATH = WORKSPACE_STATE_DIR / "samples_count_overlay.csv"
KPI_TABLE_PATHS = {
    "kpi_orders_summary": WORKSPACE_STATE_DIR / "kpi_orders_summary.csv",
    "kpi_order_level": WORKSPACE_STATE_DIR / "kpi_order_level.csv",
    "kpi_orders_daily": WORKSPACE_STATE_DIR / "kpi_orders_daily.csv",
    "kpi_products_daily": WORKSPACE_STATE_DIR / "kpi_products_daily.csv",
    "kpi_customer_rollup": WORKSPACE_STATE_DIR / "kpi_customer_rollup.csv",
    "kpi_cities": WORKSPACE_STATE_DIR / "kpi_cities.csv",
    "kpi_zips": WORKSPACE_STATE_DIR / "kpi_zips.csv",
    "kpi_orders_audit": WORKSPACE_STATE_DIR / "kpi_orders_audit.csv",
}


@dataclass
class WorkspaceState:
    orders: pd.DataFrame
    samples: pd.DataFrame
    inventory: pd.DataFrame
    daily_demand: pd.DataFrame
    samples_daily_demand: pd.DataFrame
    order_row_counts: pd.DataFrame
    sample_row_counts: pd.DataFrame
    kpi_tables: dict[str, pd.DataFrame]
    summary: dict[str, Any]
    inventory_template: list[dict[str, Any]]


STATE = WorkspaceState(
    orders=pd.DataFrame(),
    samples=pd.DataFrame(),
    inventory=pd.DataFrame(),
    daily_demand=pd.DataFrame(),
    samples_daily_demand=pd.DataFrame(),
    order_row_counts=pd.DataFrame(),
    sample_row_counts=pd.DataFrame(),
    kpi_tables={},
    summary={
        "orders_loaded": 0,
        "samples_loaded": 0,
        "products_detected": 0,
        "date_start": None,
        "date_end": None,
        "inventory_as_of": None,
        "inventory_rows": 0,
    },
    inventory_template=[],
)


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if hasattr(value, "item"):
        return value.item()
    return value


def _frame_records(frame: pd.DataFrame) -> list[dict[str, Any]]:
    if frame is None or frame.empty:
        return []
    return [{key: _json_safe(value) for key, value in row.items()} for row in frame.to_dict(orient="records")]


def _json_safe_deep(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _json_safe_deep(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe_deep(item) for item in value]
    return _json_safe(value)


def _load_daily_overlay(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    frame = pd.read_csv(path, parse_dates=["date"])
    if "date" in frame.columns:
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.normalize()
    for column in ["platform", "product_name", "seller_sku_resolved"]:
        if column in frame.columns:
            frame[column] = frame[column].astype("string").fillna("").str.replace(r"\.0$", "", regex=True).str.strip()
    return frame


def _save_daily_overlay(path: Path, frame: pd.DataFrame) -> None:
    WORKSPACE_STATE_DIR.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False)


def _load_orders_rows_overlay(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    frame = pd.read_csv(path, parse_dates=["order_date"])
    if "order_date" in frame.columns:
        frame["order_date"] = pd.to_datetime(frame["order_date"], errors="coerce").dt.normalize()
    for column in [
        "platform",
        "order_id",
        "order_status",
        "order_substatus",
        "cancellation_return_type",
        "product_name",
        "seller_sku",
        "seller_sku_resolved",
        "customer_id",
        "customer_id_source",
        "city",
        "state",
        "zipcode",
    ]:
        if column in frame.columns:
            frame[column] = frame[column].astype("string").fillna("").str.replace(r"\.0$", "", regex=True).str.strip()
    return frame


def _save_orders_rows_overlay(path: Path, frame: pd.DataFrame) -> None:
    WORKSPACE_STATE_DIR.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False)


def _load_count_overlay(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame(columns=["date", "row_count"])
    frame = pd.read_csv(path, parse_dates=["date"])
    if "date" in frame.columns:
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce").dt.normalize()
    if "row_count" in frame.columns:
        frame["row_count"] = pd.to_numeric(frame["row_count"], errors="coerce").fillna(0).astype(int)
    return frame.reindex(columns=["date", "row_count"]).dropna(subset=["date"]).reset_index(drop=True)


def _save_count_overlay(path: Path, frame: pd.DataFrame) -> None:
    WORKSPACE_STATE_DIR.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False)


def _save_kpi_tables(tables: dict[str, pd.DataFrame]) -> None:
    WORKSPACE_STATE_DIR.mkdir(parents=True, exist_ok=True)
    for key, path in KPI_TABLE_PATHS.items():
        frame = tables.get(key, pd.DataFrame())
        frame.to_csv(path, index=False)


def _load_kpi_tables() -> dict[str, pd.DataFrame]:
    date_columns = {
        "kpi_orders_summary": ["date_start", "date_end"],
        "kpi_order_level": ["reporting_date"],
        "kpi_orders_daily": ["reporting_date"],
        "kpi_products_daily": ["reporting_date"],
        "kpi_customer_rollup": ["first_order_date", "last_order_date"],
        "kpi_orders_audit": ["date_start", "date_end"],
    }
    tables: dict[str, pd.DataFrame] = {}
    for key, path in KPI_TABLE_PATHS.items():
        if not path.exists():
            return {}
        parse_dates = date_columns.get(key, [])
        try:
            tables[key] = pd.read_csv(path, parse_dates=parse_dates or None, keep_default_na=False)
        except EmptyDataError:
            return {}
    return tables


def _kpi_tables_support_dashboard(tables: dict[str, pd.DataFrame]) -> bool:
    if not tables:
        return False
    required = {"kpi_orders_summary", "kpi_orders_daily", "kpi_orders_audit"}
    if not required.issubset(tables):
        return False
    summary = tables.get("kpi_orders_summary", pd.DataFrame())
    if summary.empty:
        return False
    order_level = tables.get("kpi_order_level", pd.DataFrame())
    orders_daily = tables.get("kpi_orders_daily", pd.DataFrame())
    if orders_daily.empty:
        return False
    if "reporting_date" not in orders_daily.columns or not orders_daily["reporting_date"].notna().any():
        return False
    summary_total_orders = float(pd.to_numeric(summary.get("total_orders"), errors="coerce").fillna(0).sum()) if "total_orders" in summary.columns else 0.0
    daily_total_orders = float(pd.to_numeric(orders_daily.get("total_orders"), errors="coerce").fillna(0).sum()) if "total_orders" in orders_daily.columns else 0.0
    if summary_total_orders <= 0 and daily_total_orders <= 0:
        return False
    return True


def _friendly_short_date(value: pd.Timestamp | str | None) -> str | None:
    if value in (None, ""):
        return None
    stamp = pd.to_datetime(value, errors="coerce")
    if pd.isna(stamp):
        return None
    return f"{stamp.month}/{stamp.day}/{stamp.year}"


def _latest_frame_date(frame: pd.DataFrame, column: str) -> str | None:
    if frame is None or frame.empty or column not in frame.columns:
        return None
    stamp = pd.to_datetime(frame[column], errors="coerce").dropna()
    if stamp.empty:
        return None
    return _friendly_short_date(stamp.max())


def _latest_folder_update(folder_name: str) -> str | None:
    folder = DATA_DIR / folder_name
    if not folder.exists():
        return None
    files = [path for path in folder.rglob("*") if path.is_file()]
    if not files:
        return None
    latest = max(files, key=lambda path: path.stat().st_mtime)
    return _friendly_short_date(pd.Timestamp.fromtimestamp(latest.stat().st_mtime))


def _source_freshness_payload() -> list[dict[str, str]]:
    orders_date = _friendly_short_date(STATE.summary.get("date_end")) or _latest_frame_date(STATE.daily_demand, "date")
    samples_date = _latest_frame_date(STATE.samples_daily_demand, "date")
    replacements_date = _latest_folder_update("Replacements")
    finance_date = _latest_folder_update("Finance Tab")
    items = [
        ("Order files", f"Through {orders_date}" if orders_date else "Not loaded"),
        ("Sample files", f"Through {samples_date}" if samples_date else "Not loaded"),
        ("Replacement files", f"Updated {replacements_date}" if replacements_date else "No file yet"),
        ("Finance files", f"Updated {finance_date}" if finance_date else "No file yet"),
    ]
    return [{"label": label, "value": value} for label, value in items]


def _monthly_actual_mix_payload() -> dict[str, dict[str, float]]:
    if STATE.daily_demand is None or STATE.daily_demand.empty:
        return {}
    working = STATE.daily_demand.copy()
    required = {"date", "product_name", "net_units"}
    if not required.issubset(set(working.columns)):
        return {}
    working["date"] = pd.to_datetime(working["date"], errors="coerce")
    working = working.dropna(subset=["date"])
    if working.empty:
        return {}
    working["month_key"] = working["date"].dt.strftime("%Y-%m")
    grouped = (
        working.groupby(["month_key", "product_name"], as_index=False)
        .agg(units=("net_units", "sum"))
        .sort_values(["month_key", "units"], ascending=[True, False])
    )
    payload: dict[str, dict[str, float]] = {}
    for month_key, month_group in grouped.groupby("month_key"):
        total_units = float(pd.to_numeric(month_group["units"], errors="coerce").fillna(0).sum()) or 0.0
        month_mix: dict[str, float] = {}
        for row in month_group.to_dict(orient="records"):
            product_name = str(row.get("product_name") or "")
            units = float(row.get("units") or 0.0)
            if product_name:
                month_mix[product_name] = (units / total_units * 100.0) if total_units else 0.0
        payload[str(month_key)] = month_mix
    return payload


def _monthly_actuals_payload() -> dict[str, dict[str, float | None]]:
    if STATE.daily_demand is None or STATE.daily_demand.empty:
        return {}
    working = STATE.daily_demand.copy()
    required = {"date", "net_units"}
    if not required.issubset(set(working.columns)):
        return {}
    working["date"] = pd.to_datetime(working["date"], errors="coerce")
    working = working.dropna(subset=["date"])
    if working.empty:
        return {}
    working["month_key"] = working["date"].dt.strftime("%Y-%m")
    monthly = (
        working.groupby("month_key", as_index=False)
        .agg(
            total_units=("net_units", "sum"),
            gross_sales=("gross_sales", "sum"),
        )
        .sort_values("month_key")
        .reset_index(drop=True)
    )
    monthly["change_pct_vs_previous_month"] = (
        monthly["total_units"].pct_change().replace([float("inf"), float("-inf")], pd.NA) * 100.0
    )
    payload: dict[str, dict[str, float | None]] = {}
    for row in monthly.to_dict(orient="records"):
        payload[str(row.get("month_key") or "")] = {
            "totalUnits": _json_safe(row.get("total_units")),
            "grossSales": _json_safe(row.get("gross_sales")),
            "changePctVsPreviousMonth": _json_safe(row.get("change_pct_vs_previous_month")),
        }
    return payload


def _inventory_template_from_daily(frame: pd.DataFrame) -> pd.DataFrame:
    if frame is None:
        frame = pd.DataFrame()
    sku_lookup: dict[str, str] = {}
    if not frame.empty and {"product_name", "seller_sku_resolved"}.issubset(frame.columns):
        grouped = (
            frame.groupby("product_name", as_index=False)
            .agg(seller_sku_resolved=("seller_sku_resolved", "first"))
        )
        sku_lookup = {
            str(row.get("product_name") or ""): str(row.get("seller_sku_resolved") or "")
            for row in grouped.to_dict(orient="records")
        }
    rows = []
    for product_name in PRODUCT_CATALOG.keys():
        rows.append(
            {
                "product_name": product_name,
                "seller_sku_resolved": sku_lookup.get(product_name, ""),
                **get_launch_inventory_defaults(product_name),
                "lead_time_days": "",
                "case_pack": "",
                "moq": "",
            }
        )
    return pd.DataFrame(rows).sort_values("product_name").reset_index(drop=True)


def _legacy_normalized_orders() -> pd.DataFrame:
    if not LEGACY_DASHBOARD_CACHE_PATH.exists():
        return pd.DataFrame()
    cached = pd.read_pickle(LEGACY_DASHBOARD_CACHE_PATH)
    raw_operational = cached.get("raw_operational")
    if raw_operational is None or raw_operational.empty:
        return pd.DataFrame()
    working = raw_operational.copy()
    order_date = pd.to_datetime(working.get("paid_time_date"), errors="coerce")
    missing = order_date.isna()
    if missing.any():
        order_date.loc[missing] = pd.to_datetime(working.get("reporting_date"), errors="coerce").loc[missing]
    normalized = pd.DataFrame(
        {
            "platform": "TikTok",
            "order_id": working.get("Order ID", pd.Series("", index=working.index)).astype("string"),
            "order_date": order_date.dt.normalize(),
            "order_status": working.get("Order Status", pd.Series("", index=working.index)).astype("string"),
            "order_substatus": working.get("Order Substatus", pd.Series("", index=working.index)).astype("string"),
            "cancellation_return_type": working.get("Cancelation/Return Type", pd.Series("", index=working.index)).astype("string"),
            "product_name": working.get("Product Name", pd.Series("", index=working.index)).astype("string"),
            "seller_sku": working.get("Seller SKU", pd.Series("", index=working.index)).astype("string"),
            "seller_sku_resolved": working.get("seller_sku_resolved", pd.Series("", index=working.index)).astype("string"),
            "quantity": pd.to_numeric(working.get("Quantity"), errors="coerce").fillna(0.0),
            "returned_quantity": pd.to_numeric(working.get("Sku Quantity of return"), errors="coerce").fillna(0.0),
            "gross_sales": pd.to_numeric(working.get("SKU Subtotal Before Discount"), errors="coerce").fillna(0.0),
            "net_product_sales": pd.to_numeric(working.get("SKU Subtotal After Discount"), errors="coerce").fillna(0.0),
            "order_refund_amount": pd.to_numeric(working.get("Order Refund Amount"), errors="coerce").fillna(0.0),
            "is_paid": order_date.notna(),
            "is_cancelled": working.get("is_canceled", pd.Series(False, index=working.index)).fillna(False).astype(bool),
            "is_refunded": working.get("is_refunded", pd.Series(False, index=working.index)).fillna(False).astype(bool),
            "is_returned": working.get("is_returned", pd.Series(False, index=working.index)).fillna(False).astype(bool),
            "is_shipped": working.get("is_shipped", pd.Series(False, index=working.index)).fillna(False).astype(bool),
            "is_delivered": working.get("is_delivered", pd.Series(False, index=working.index)).fillna(False).astype(bool),
            "customer_id": working.get("customer_id", pd.Series("", index=working.index)).astype("string"),
            "customer_id_source": working.get("customer_id_source", pd.Series("", index=working.index)).astype("string"),
            "city": working.get("City", pd.Series("", index=working.index)).astype("string"),
            "state": working.get("State", pd.Series("", index=working.index)).astype("string"),
            "zipcode": working.get("Zipcode", pd.Series("", index=working.index)).astype("string"),
        }
    )
    normalized["net_units"] = (normalized["quantity"] - normalized["returned_quantity"]).clip(lower=0)
    normalized.loc[normalized["is_cancelled"], "net_units"] = 0.0
    normalized["net_product_sales"] = normalized["net_product_sales"].where(normalized["net_product_sales"].ne(0), normalized["gross_sales"])
    normalized["city"] = normalized["city"].fillna("").str.strip()
    normalized["state"] = normalized["state"].fillna("").str.strip().str.upper()
    normalized["zipcode"] = normalized["zipcode"].fillna("").str.replace(r"\D", "", regex=True).str[:5]
    return normalized.loc[normalized["order_date"].notna()].reset_index(drop=True)


def _refresh_kpi_tables_from_legacy_cache() -> dict[str, pd.DataFrame]:
    legacy_orders = _legacy_normalized_orders()
    if legacy_orders.empty:
        return {}
    tables = build_tiktok_kpi_tables(legacy_orders)
    _save_kpi_tables(tables)
    return tables


def _refresh_kpi_tables_from_analysis_output() -> dict[str, pd.DataFrame]:
    summary_path = LEGACY_ANALYSIS_OUTPUT_DIR / "kpi_full.csv"
    daily_path = LEGACY_ANALYSIS_OUTPUT_DIR / "daily_breakdown.csv"
    product_path = LEGACY_ANALYSIS_OUTPUT_DIR / "product_kpis.csv"
    if not summary_path.exists() or not daily_path.exists() or not product_path.exists():
        return {}

    summary_metrics = pd.read_csv(summary_path).set_index("metric")
    daily = pd.read_csv(daily_path, parse_dates=["reporting_date"])
    products = pd.read_csv(product_path)

    def metric_value(metric: str, fallback: float = 0.0) -> float:
        if metric not in summary_metrics.index:
            return fallback
        return float(summary_metrics.loc[metric, "value"])

    summary = pd.DataFrame(
        [
            {
                "platform": "TikTok",
                "date_start": daily["reporting_date"].min() if not daily.empty else None,
                "date_end": daily["reporting_date"].max() if not daily.empty else None,
                "total_orders": metric_value("total_orders"),
                "gross_product_sales": metric_value("gross_merchandise_sales"),
                "net_product_sales": metric_value("net_merchandise_sales_before_refunds"),
                "paid_orders": metric_value("paid_orders"),
                "valid_orders": metric_value("valid_orders"),
                "delivered_orders": metric_value("delivered_orders"),
                "shipped_orders": 0.0,
                "canceled_orders": metric_value("canceled_orders"),
                "refunded_orders": metric_value("refunded_orders"),
                "returned_orders": metric_value("returned_orders"),
                "refund_amount": metric_value("refund_amount"),
                "returned_units": metric_value("returned_units"),
                "units_sold": metric_value("units_sold"),
                "units_per_paid_order": metric_value("units_per_order"),
                "aov": metric_value("aov_gross"),
                "unique_customers": metric_value("unique_customers"),
                "repeat_customers": metric_value("repeat_customers"),
                "first_time_customers": max(metric_value("unique_customers") - metric_value("repeat_customers"), 0.0),
                "returning_customers": metric_value("repeat_customers"),
                "repeat_customer_rate": metric_value("repeat_customer_rate"),
                "first_time_customer_rate": max(1.0 - metric_value("repeat_customer_rate"), 0.0),
                "customer_id_basis": "Buyer Username -> Buyer Nickname -> Recipient",
            }
        ]
    )
    orders_daily = pd.DataFrame(
        {
            "platform": "TikTok",
            "reporting_date": daily["reporting_date"],
            "total_orders": daily["total_orders"],
            "gross_product_sales": daily["gross_sales"],
            "net_product_sales": daily["net_sales"],
            "paid_orders": daily["total_orders"],
            "valid_orders": daily["valid_orders"],
            "delivered_orders": daily["delivered_orders"],
            "shipped_orders": 0,
            "canceled_orders": daily["canceled_orders"],
            "refunded_orders": daily["refunded_orders"],
            "returned_orders": daily["returned_orders"],
            "units_sold": daily["units_sold"],
            "unique_customers": 0,
        }
    )
    products_daily = pd.DataFrame(
        {
            "platform": "TikTok",
            "reporting_date": pd.NaT,
            "product_name": products.get("product_name", pd.Series(dtype="object")),
            "seller_sku_resolved": products.get("seller_sku_resolved", pd.Series(dtype="object")).fillna(""),
            "gross_product_sales": products.get("gross_merchandise_sales", pd.Series(dtype="float64")).fillna(0.0),
            "net_product_sales": products.get("net_merchandise_sales", pd.Series(dtype="float64")).fillna(0.0),
            "units_sold": products.get("units_sold", pd.Series(dtype="float64")).fillna(0.0),
            "paid_orders": products.get("order_count", pd.Series(dtype="float64")).fillna(0.0),
            "valid_orders": products.get("order_count", pd.Series(dtype="float64")).fillna(0.0),
        }
    )
    audit = pd.DataFrame(
        [
            {
                "platform": "TikTok",
                "date_start": summary.iloc[0]["date_start"],
                "date_end": summary.iloc[0]["date_end"],
                "rows_loaded": int(metric_value("total_orders")),
                "orders_loaded": int(metric_value("total_orders")),
                "blank_customer_rows": 0,
                "rows_without_city": 0,
                "rows_without_zip": 0,
                "canceled_rows": int(metric_value("canceled_orders")),
                "customer_id_basis": "Buyer Username -> Buyer Nickname -> Recipient",
            }
        ]
    )
    tables = {
        "kpi_orders_summary": summary,
        "kpi_order_level": pd.DataFrame(columns=["platform", "source_type", "order_id", "reporting_date", "customer_id", "customer_id_source", "city", "state", "zipcode", "is_paid", "is_cancelled", "is_refunded", "is_returned", "is_shipped", "is_delivered", "units_sold", "returned_units", "gross_product_sales", "net_product_sales", "order_refund_amount"]),
        "kpi_orders_daily": orders_daily,
        "kpi_products_daily": products_daily,
        "kpi_customer_rollup": pd.DataFrame(columns=["platform", "customer_id", "customer_id_source", "first_order_date", "last_order_date", "paid_order_count", "valid_order_count", "gross_product_sales", "net_product_sales", "units_sold", "city", "state", "zipcode", "is_repeat_customer"]),
        "kpi_cities": pd.DataFrame(columns=["platform", "city", "state", "unique_customers", "orders", "gross_product_sales", "net_product_sales", "units_sold"]),
        "kpi_zips": pd.DataFrame(columns=["platform", "city", "state", "zipcode", "unique_customers", "orders", "gross_product_sales", "net_product_sales", "units_sold"]),
        "kpi_orders_audit": audit,
    }
    _save_kpi_tables(tables)
    return tables


def load_saved_state() -> bool:
    if not ORDERS_OVERLAY_PATH.exists() or not ORDERS_COUNT_OVERLAY_PATH.exists():
        return False

    daily_demand = _load_daily_overlay(ORDERS_OVERLAY_PATH)
    sample_daily_demand = _load_daily_overlay(SAMPLES_OVERLAY_PATH)
    order_row_counts = _load_count_overlay(ORDERS_COUNT_OVERLAY_PATH)
    sample_row_counts = _load_count_overlay(SAMPLES_COUNT_OVERLAY_PATH)
    kpi_tables = _load_kpi_tables()
    if not kpi_tables or not _kpi_tables_support_dashboard(kpi_tables):
        refreshed = _refresh_kpi_tables_from_analysis_output()
        if refreshed and _kpi_tables_support_dashboard(refreshed):
            kpi_tables = refreshed
        else:
            return False
    summary_frame = kpi_tables.get("kpi_orders_summary", pd.DataFrame())
    if not summary_frame.empty:
        summary_total_orders = float(summary_frame.iloc[0].get("total_orders") or 0)
        if summary_total_orders < 1000 and int(order_row_counts["row_count"].sum()) > 100000:
            refreshed = _refresh_kpi_tables_from_analysis_output()
            if refreshed and _kpi_tables_support_dashboard(refreshed):
                kpi_tables = refreshed
            else:
                return False
    inventory_template_frame = _inventory_template_from_daily(daily_demand)
    try:
        inventory_history = load_inventory_history(INVENTORY_SOURCE_URL, channel="TikTok") if INVENTORY_SOURCE_URL else pd.DataFrame()
    except Exception:
        inventory_history = pd.DataFrame()
    inventory_frame, inventory_as_of = _build_inventory_frame_from_history(inventory_template_frame, inventory_history)

    STATE.orders = pd.DataFrame()
    STATE.samples = pd.DataFrame()
    STATE.daily_demand = daily_demand
    STATE.samples_daily_demand = sample_daily_demand
    STATE.order_row_counts = order_row_counts
    STATE.sample_row_counts = sample_row_counts
    STATE.kpi_tables = kpi_tables
    STATE.inventory = normalize_inventory_frame(inventory_frame)
    STATE.inventory_template = _frame_records(inventory_template_frame)
    STATE.summary = {
        "orders_loaded": int(order_row_counts["row_count"].sum()) if not order_row_counts.empty else 0,
        "samples_loaded": int(sample_row_counts["row_count"].sum()) if not sample_row_counts.empty else 0,
        "products_detected": int(len(inventory_template_frame)),
        "date_start": _json_safe(daily_demand["date"].min()) if not daily_demand.empty else None,
        "date_end": _json_safe(daily_demand["date"].max()) if not daily_demand.empty else None,
        "inventory_as_of": inventory_as_of,
        "inventory_rows": int(len(inventory_frame)),
    }
    return True


def _count_rows_by_date(frame: pd.DataFrame, date_column: str) -> pd.DataFrame:
    if frame is None or frame.empty or date_column not in frame.columns:
        return pd.DataFrame(columns=["date", "row_count"])
    working = frame.loc[frame[date_column].notna(), [date_column]].copy()
    if working.empty:
        return pd.DataFrame(columns=["date", "row_count"])
    working["date"] = pd.to_datetime(working[date_column], errors="coerce").dt.normalize()
    counts = (
        working.dropna(subset=["date"])
        .groupby("date", as_index=False)
        .size()
        .rename(columns={"size": "row_count"})
    )
    counts["row_count"] = counts["row_count"].astype(int)
    return counts[["date", "row_count"]]


def _default_horizon(date_end: str | None) -> tuple[str | None, str | None]:
    if not date_end:
        return None, None
    end_ts = pd.Timestamp(date_end)
    next_month = (end_ts + pd.offsets.MonthBegin(1)).normalize()
    horizon_start = next_month.replace(day=1)
    horizon_end = (horizon_start + pd.offsets.MonthEnd(1)).normalize()
    return horizon_start.strftime("%Y-%m-%d"), horizon_end.strftime("%Y-%m-%d")


def load_sample_state() -> None:
    workspace = load_sample_workspace(DATA_DIR, platform="TikTok", inventory_source=INVENTORY_SOURCE_URL)
    orders_overlay = _load_orders_rows_overlay(ORDERS_ROWS_OVERLAY_PATH)
    if orders_overlay.empty:
        effective_orders = workspace["orders"]
        rebuilt_daily = merge_daily_demand_replace_dates(workspace["daily_demand"], _load_daily_overlay(ORDERS_OVERLAY_PATH))
        rebuilt_counts = merge_daily_demand_replace_dates(
            _count_rows_by_date(workspace["orders"], "order_date"),
            _load_count_overlay(ORDERS_COUNT_OVERLAY_PATH),
        )
    else:
        effective_orders = merge_frame_replace_dates(
            workspace["orders"],
            orders_overlay,
            date_column="order_date",
            sort_columns=["order_date", "order_id", "product_name"],
        )
        rebuilt_daily = aggregate_daily_demand(effective_orders)
        rebuilt_counts = _count_rows_by_date(effective_orders, "order_date")
    effective_inventory_template = build_inventory_template(effective_orders)
    kpi_tables = build_tiktok_kpi_tables(effective_orders)
    _save_kpi_tables(kpi_tables)

    STATE.orders = pd.DataFrame()
    STATE.samples = pd.DataFrame()
    STATE.daily_demand = rebuilt_daily
    STATE.samples_daily_demand = merge_daily_demand_replace_dates(workspace["samples_daily_demand"], _load_daily_overlay(SAMPLES_OVERLAY_PATH))
    _save_daily_overlay(ORDERS_OVERLAY_PATH, STATE.daily_demand)
    STATE.order_row_counts = rebuilt_counts
    STATE.sample_row_counts = merge_daily_demand_replace_dates(
        _count_rows_by_date(workspace["samples"], "order_date"),
        _load_count_overlay(SAMPLES_COUNT_OVERLAY_PATH),
    )
    _save_count_overlay(ORDERS_COUNT_OVERLAY_PATH, STATE.order_row_counts)
    STATE.kpi_tables = kpi_tables
    STATE.summary = workspace["summary"]
    STATE.summary["orders_loaded"] = int(STATE.order_row_counts["row_count"].sum()) if not STATE.order_row_counts.empty else 0
    STATE.summary["samples_loaded"] = int(STATE.sample_row_counts["row_count"].sum()) if not STATE.sample_row_counts.empty else 0
    if not STATE.daily_demand.empty:
        STATE.summary["date_start"] = _json_safe(STATE.daily_demand["date"].min())
        STATE.summary["date_end"] = _json_safe(STATE.daily_demand["date"].max())
    STATE.summary["products_detected"] = int(len(effective_inventory_template))
    STATE.inventory_template = [
        {key: _json_safe(value) for key, value in row.items()}
        for row in effective_inventory_template.to_dict(orient="records")
    ]
    STATE.inventory = normalize_inventory_frame(workspace["inventory_frame"])


def _refresh_planner_state_from_orders(normalized_orders: pd.DataFrame) -> None:
    ensure_state()
    incoming_daily = aggregate_daily_demand(normalized_orders)
    incoming_counts = _count_rows_by_date(normalized_orders, "order_date")
    STATE.daily_demand = merge_daily_demand_replace_dates(STATE.daily_demand, incoming_daily)
    STATE.order_row_counts = merge_daily_demand_replace_dates(STATE.order_row_counts, incoming_counts)
    _save_daily_overlay(ORDERS_OVERLAY_PATH, STATE.daily_demand)
    _save_count_overlay(ORDERS_COUNT_OVERLAY_PATH, STATE.order_row_counts)
    inventory_template_frame = _inventory_template_from_daily(STATE.daily_demand)
    STATE.inventory_template = _frame_records(inventory_template_frame)
    STATE.summary["orders_loaded"] = int(STATE.order_row_counts["row_count"].sum()) if not STATE.order_row_counts.empty else 0
    STATE.summary["products_detected"] = int(len(inventory_template_frame))
    if not STATE.daily_demand.empty:
        STATE.summary["date_start"] = _json_safe(STATE.daily_demand["date"].min())
        STATE.summary["date_end"] = _json_safe(STATE.daily_demand["date"].max())


def _refresh_planner_state_from_samples(normalized_samples: pd.DataFrame) -> None:
    ensure_state()
    incoming_daily = aggregate_daily_demand(normalized_samples)
    incoming_counts = _count_rows_by_date(normalized_samples, "order_date")
    STATE.samples_daily_demand = merge_daily_demand_replace_dates(STATE.samples_daily_demand, incoming_daily)
    STATE.sample_row_counts = merge_daily_demand_replace_dates(STATE.sample_row_counts, incoming_counts)
    _save_daily_overlay(SAMPLES_OVERLAY_PATH, STATE.samples_daily_demand)
    _save_count_overlay(SAMPLES_COUNT_OVERLAY_PATH, STATE.sample_row_counts)
    STATE.summary["samples_loaded"] = int(STATE.sample_row_counts["row_count"].sum()) if not STATE.sample_row_counts.empty else 0


def ensure_state() -> None:
    if STATE.summary.get("orders_loaded", 0):
        return
    if load_saved_state():
        return
    if DATA_DIR.exists():
        load_sample_state()


def workspace_payload() -> dict[str, Any]:
    ensure_state()
    horizon_start, horizon_end = _default_horizon(STATE.summary.get("date_end"))
    forecast_defaults = load_saved_uplift_map(FORECAST_DEFAULTS_PATH)
    forecast_settings = load_saved_forecast_settings(FORECAST_DEFAULTS_PATH)
    date_start = STATE.summary.get("date_start")
    date_end = STATE.summary.get("date_end")
    baseline_start = None
    if date_end is not None:
        baseline_start = (pd.Timestamp(date_end) - pd.Timedelta(days=29)).strftime("%Y-%m-%d")
    return {
        "summary": {key: _json_safe(value) for key, value in STATE.summary.items()},
        "inventoryTemplate": STATE.inventory_template,
        "inventoryUploaded": bool(STATE.inventory is not None and not STATE.inventory.empty and STATE.inventory[["on_hand", "in_transit"]].sum().sum() > 0),
        "defaults": {
            "baselineStart": baseline_start or date_start,
            "baselineEnd": date_end,
            "horizonStart": horizon_start,
            "horizonEnd": horizon_end,
            "upliftPct": get_saved_uplift_pct(FORECAST_DEFAULTS_PATH, horizon_start, fallback=35.0) if horizon_start else 35.0,
            "leadTimeDays": 8,
            "velocityMode": "sales_only",
            "safetyRule": "3 weeks in Q1 and Q2. 5 weeks in Q3 and Q4.",
            "forecastDefaults": forecast_defaults,
            "forecastSettings": _json_safe_deep(forecast_settings),
            "monthlyActualMix": _json_safe_deep(_monthly_actual_mix_payload()),
            "monthlyActuals": _json_safe_deep(_monthly_actuals_payload()),
            "forecastYear": int(pd.Timestamp(horizon_start).year) if horizon_start else int(pd.Timestamp.now().year),
        },
    }


def tiktok_kpi_payload() -> dict[str, Any]:
    ensure_state()
    return _json_safe_deep(build_tiktok_kpi_payload(STATE.kpi_tables))


def _default_planning_signal() -> dict[str, Any]:
    ensure_state()
    if STATE.daily_demand is None or STATE.daily_demand.empty:
        return {}
    baseline_end = STATE.summary.get("date_end")
    if not baseline_end:
        return {}
    baseline_end_ts = pd.Timestamp(baseline_end)
    baseline_start_ts = (baseline_end_ts - pd.Timedelta(days=29)).normalize()
    horizon_start, horizon_end = _default_horizon(baseline_end)
    if not horizon_start or not horizon_end:
        return {}
    payload = run_planning_workspace(
        STATE.daily_demand,
        STATE.inventory,
        STATE.samples_daily_demand,
        baseline_start=baseline_start_ts,
        baseline_end=baseline_end_ts,
        horizon_start=pd.Timestamp(horizon_start),
        horizon_end=pd.Timestamp(horizon_end),
        uplift_pct=35.0,
        lead_time_days=8,
        velocity_mode="sales_only",
    )
    rows = payload.get("rows") or []
    if not rows:
        return {}
    top_row = max(rows, key=lambda row: float(row.get("recommended_order_units") or 0))
    return {
        "forecastBaseline": "Last 30 days",
        "baselineWindow": f"{baseline_start_ts.strftime('%Y-%m-%d')} to {baseline_end_ts.strftime('%Y-%m-%d')}",
        "topReorderProduct": top_row.get("product_name"),
        "topReorderQty": _json_safe(top_row.get("recommended_order_units")),
    }


def filtered_tiktok_kpi_payload(query: dict[str, list[str]]) -> dict[str, Any]:
    ensure_state()
    fresh_kpi_tables = _load_kpi_tables()
    if fresh_kpi_tables:
        STATE.kpi_tables = fresh_kpi_tables
    get_value = lambda key, default="": str((query.get(key) or [default])[0] or default)
    sources = [value for value in get_value("sources", "Sales").split(",") if value.strip()]
    payload = build_tiktok_dashboard_payload(
        STATE.kpi_tables,
        STATE.summary,
        start_date=get_value("startDate", STATE.summary.get("date_start") or ""),
        end_date=get_value("endDate", STATE.summary.get("date_end") or ""),
        active_tab=get_value("tab", "orders"),
        date_basis=get_value("dateBasis", "order"),
        order_bucket=get_value("orderBucket", "paid_time"),
        selected_sources=sources,
        inventory_as_of=STATE.summary.get("inventory_as_of"),
        inventory_rows=int(STATE.summary.get("inventory_rows") or 0),
        planning_signal={},
        planning_daily=STATE.daily_demand,
    )
    payload["freshness"] = _source_freshness_payload()
    payload["badges"]["sliceLabel"] = f"{payload['filters']['startDate']} to {payload['filters']['endDate']}"
    return _json_safe_deep(payload)


def inventory_template_csv() -> str:
    ensure_state()
    frame = normalize_inventory_frame(pd.DataFrame(STATE.inventory_template))
    return frame.to_csv(index=False)


class DemandPlanningHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/workspace":
            self.respond_json(workspace_payload())
            return
        if parsed.path == "/api/tiktok-kpis":
            self.respond_json(filtered_tiktok_kpi_payload(parse_qs(parsed.query)))
            return
        if parsed.path == "/api/inventory-template.csv":
            self.respond_csv(inventory_template_csv(), "inventory-template.csv")
            return
        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/load-sample":
                load_sample_state()
                self.respond_json({"ok": True, "workspace": workspace_payload()})
                return
            if parsed.path == "/api/upload/orders":
                self.handle_orders_upload()
                return
            if parsed.path == "/api/upload/samples":
                self.handle_samples_upload()
                return
            if parsed.path == "/api/upload/inventory":
                self.handle_inventory_upload()
                return
            if parsed.path == "/api/plan":
                self.handle_plan()
                return
            if parsed.path == "/api/forecast-settings":
                self.handle_forecast_settings()
                return
            self.send_error(404, "Not Found")
        except Exception as exc:
            self.respond_json({"error": f"Request failed: {exc}"}, status=500)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def respond_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def respond_csv(self, text: str, filename: str) -> None:
        body = text.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(content_length) if content_length else b"{}"
        return json.loads(raw.decode("utf-8") or "{}")

    def parse_multipart(self) -> cgi.FieldStorage:
        return cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": self.headers.get("Content-Type", ""),
            },
        )

    def handle_orders_upload(self) -> None:
        form = self.parse_multipart()
        platform = str(form.getfirst("platform", "TikTok") or "TikTok").strip() or "TikTok"
        file_fields = form["files"] if "files" in form else []
        if not isinstance(file_fields, list):
            file_fields = [file_fields]
        frames: list[pd.DataFrame] = []
        for field in file_fields:
            if not getattr(field, "filename", ""):
                continue
            payload = field.file.read()
            frame = parse_orders_csv_bytes(payload, platform=platform)
            if not frame.empty:
                frames.append(frame)
        if not frames:
            self.respond_json({"error": "Upload at least one valid All orders CSV or Excel file."}, status=400)
            return
        normalized_orders = pd.concat(frames, ignore_index=True)
        overlay_orders = merge_frame_replace_dates(
            _load_orders_rows_overlay(ORDERS_ROWS_OVERLAY_PATH),
            normalized_orders,
            date_column="order_date",
            sort_columns=["order_date", "order_id", "product_name"],
        )
        _save_orders_rows_overlay(ORDERS_ROWS_OVERLAY_PATH, overlay_orders)
        _refresh_planner_state_from_orders(normalized_orders)
        self.respond_json({"ok": True, "workspace": workspace_payload()})

    def handle_inventory_upload(self) -> None:
        form = self.parse_multipart()
        file_field = form["file"] if "file" in form else None
        if file_field is None or not getattr(file_field, "filename", ""):
            self.respond_json({"error": "Upload an inventory CSV."}, status=400)
            return
        payload = file_field.file.read()
        inventory = parse_inventory_csv_bytes(payload)
        if inventory.empty:
            self.respond_json({"error": "Inventory CSV did not contain any usable rows."}, status=400)
            return
        STATE.inventory = inventory
        self.respond_json({"ok": True, "inventoryRows": _frame_records(STATE.inventory)})

    def handle_samples_upload(self) -> None:
        form = self.parse_multipart()
        platform = str(form.getfirst("platform", "TikTok") or "TikTok").strip() or "TikTok"
        file_fields = form["files"] if "files" in form else []
        if not isinstance(file_fields, list):
            file_fields = [file_fields]
        frames: list[pd.DataFrame] = []
        for field in file_fields:
            if not getattr(field, "filename", ""):
                continue
            payload = field.file.read()
            frame = parse_orders_csv_bytes(payload, platform=platform)
            if not frame.empty:
                frames.append(frame)
        if not frames:
            self.respond_json({"error": "Upload at least one valid samples CSV or Excel file."}, status=400)
            return
        normalized_samples = pd.concat(frames, ignore_index=True)
        _refresh_planner_state_from_samples(normalized_samples)
        self.respond_json({"ok": True, "workspace": workspace_payload()})

    def handle_plan(self) -> None:
        ensure_state()
        params = self.read_json_body()
        if STATE.daily_demand is None or STATE.daily_demand.empty:
            self.respond_json({"error": "Load sample data or upload All orders first."}, status=400)
            return
        horizon_start = str(params.get("horizonStart") or "")
        uplift_pct = float(params.get("upliftPct") or 0)
        monthly_uplift_pcts = {
            str(key): float(value)
            for key, value in (params.get("monthlyForecastPcts") or {}).items()
            if str(key).strip()
        }
        monthly_forecast_settings = {
            str(key): value
            for key, value in (params.get("monthlyForecastSettings") or {}).items()
            if str(key).strip() and isinstance(value, dict)
        }
        saved_forecast_settings = load_saved_forecast_settings(FORECAST_DEFAULTS_PATH)
        runtime_forecast_settings = dict(saved_forecast_settings)
        for key, value in monthly_forecast_settings.items():
            runtime_forecast_settings[str(key)] = {
                "upliftPct": float(value.get("upliftPct", monthly_uplift_pcts.get(key, uplift_pct))),
                "productMix": value.get("productMix") or {},
            }
        payload = run_planning_workspace(
            orders=STATE.orders,
            samples=STATE.samples,
            inventory=STATE.inventory,
            daily_demand=STATE.daily_demand,
            sample_daily_demand=STATE.samples_daily_demand,
            baseline_start=str(params.get("baselineStart") or ""),
            baseline_end=str(params.get("baselineEnd") or ""),
            horizon_start=horizon_start,
            horizon_end=str(params.get("horizonEnd") or ""),
            velocity_mode=str(params.get("velocityMode") or "sales_only"),
            default_uplift_pct=uplift_pct,
            default_lead_time_days=int(params.get("leadTimeDays") or 8),
            default_safety_days=int(params.get("safetyDays") or 0),
            monthly_uplift_pcts=monthly_uplift_pcts,
            monthly_forecast_settings=runtime_forecast_settings,
            planning_year=int(params.get("planningYear") or pd.Timestamp(horizon_start).year),
        )
        self.respond_json({"ok": True, **payload})

    def handle_forecast_settings(self) -> None:
        ensure_state()
        params = self.read_json_body()
        month_key = str(params.get("monthKey") or "").strip()
        setting = params.get("setting") or {}
        if not setting:
            setting = {
                "upliftPct": params.get("upliftPct", 0.0),
                "productMix": params.get("productMix") or {},
            }
        if not month_key or len(month_key) != 7:
            self.respond_json({"error": "Month key is required."}, status=400)
            return
        save_forecast_setting_for_month(
            FORECAST_DEFAULTS_PATH,
            f"{month_key}-01",
            uplift_pct=float(setting.get("upliftPct", 0.0)),
            product_mix=setting.get("productMix") or {},
        )
        self.respond_json(
            {
                "ok": True,
                "forecastSettings": _json_safe_deep(load_saved_forecast_settings(FORECAST_DEFAULTS_PATH)),
                "activeSetting": _json_safe_deep(get_saved_forecast_setting(FORECAST_DEFAULTS_PATH, f"{month_key}-01")),
            }
        )


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 8090), DemandPlanningHandler)
    print("Demand planning preview running at http://127.0.0.1:8090")
    server.serve_forever()


if __name__ == "__main__":
    main()
