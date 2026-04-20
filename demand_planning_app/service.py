from __future__ import annotations

import io
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd

from demand_planning_app.inventory_sheet import load_inventory_history
from demand_planning_app.normalize import normalize_orders_frame
from demand_planning_app.planning_products import (
    PRODUCT_CATALOG,
    get_active_fraction_for_period,
    get_launch_date,
    get_launch_inventory_defaults,
)
from demand_planning_app.planner import (
    DEFAULT_INBOUND_ARRIVAL_DAYS,
    _round_reorder_quantity,
    aggregate_daily_demand,
    normalize_inventory_frame,
    plan_demand,
)
from demand_planning_app.repository import build_inventory_template, load_orders_from_folder, load_samples_from_folder

DEFAULT_UPLIFT_PCT = 35.0
CORE_PRODUCTS = list(PRODUCT_CATALOG.keys())


def _json_scalar(value: Any) -> Any:
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


def parse_inventory_csv_bytes(payload: bytes) -> pd.DataFrame:
    raw = pd.read_csv(io.BytesIO(payload), dtype=str, keep_default_na=False)
    return normalize_inventory_frame(raw)


def parse_orders_csv_bytes(payload: bytes, *, platform: str) -> pd.DataFrame:
    raw = pd.read_csv(io.BytesIO(payload), dtype=str, keep_default_na=False)
    return normalize_orders_frame(raw, platform=platform)


def merge_frame_replace_dates(
    existing: pd.DataFrame,
    incoming: pd.DataFrame,
    *,
    date_column: str,
    sort_columns: list[str] | None = None,
) -> pd.DataFrame:
    if existing is None or existing.empty:
        return incoming.copy() if incoming is not None else pd.DataFrame()
    if incoming is None or incoming.empty:
        return existing.copy()
    overlap_dates = pd.to_datetime(incoming[date_column], errors="coerce").dt.normalize().dropna().unique()
    kept = existing.loc[~pd.to_datetime(existing[date_column], errors="coerce").dt.normalize().isin(overlap_dates)].copy()
    merged = pd.concat([kept, incoming], ignore_index=True)
    ordered_sort_columns = sort_columns or [date_column]
    valid_sort_columns = [column for column in ordered_sort_columns if column in merged.columns]
    if valid_sort_columns:
        merged = merged.sort_values(valid_sort_columns).reset_index(drop=True)
    return merged


def merge_daily_demand_replace_dates(existing: pd.DataFrame, incoming: pd.DataFrame) -> pd.DataFrame:
    return merge_frame_replace_dates(
        existing,
        incoming,
        date_column="date",
        sort_columns=["date", "platform", "product_name"],
    )


def _month_key(value: str | pd.Timestamp) -> str:
    return pd.Timestamp(value).strftime("%Y-%m")


def _normalize_product_mix(product_mix: dict[str, Any] | None, fallback: dict[str, float] | None = None) -> dict[str, float]:
    working: dict[str, float] = {}
    source = product_mix or {}
    if not source:
        return dict(fallback) if fallback else {}
    for product_name in CORE_PRODUCTS:
        raw = source.get(product_name, 0.0)
        try:
            working[product_name] = max(float(raw), 0.0)
        except Exception:
            working[product_name] = 0.0
    total = sum(working.values())
    if total > 0:
        return {product_name: value / total for product_name, value in working.items()}
    return dict(fallback) if fallback else {}


def _coerce_month_setting(
    raw_setting: Any,
    *,
    fallback_uplift: float = DEFAULT_UPLIFT_PCT,
    fallback_mix: dict[str, float] | None = None,
) -> dict[str, Any]:
    if isinstance(raw_setting, dict):
        uplift_pct = raw_setting.get("upliftPct", raw_setting.get("uplift_pct", fallback_uplift))
        product_mix = raw_setting.get("productMix", raw_setting.get("product_mix", {}))
    else:
        uplift_pct = raw_setting
        product_mix = {}
    try:
        uplift_value = float(uplift_pct)
    except Exception:
        uplift_value = float(fallback_uplift)
    return {
        "upliftPct": uplift_value,
        "productMix": _normalize_product_mix(product_mix, fallback=fallback_mix),
    }


def load_saved_forecast_settings(
    path: str | Path,
    *,
    fallback_mix: dict[str, float] | None = None,
) -> dict[str, dict[str, Any]]:
    file_path = Path(path)
    if not file_path.exists():
        return {}
    payload = json.loads(file_path.read_text(encoding="utf-8") or "{}")
    months = payload.get("months", {})
    if not isinstance(months, dict):
        return {}
    return {
        str(key): _coerce_month_setting(value, fallback_mix=fallback_mix)
        for key, value in months.items()
    }


def get_saved_forecast_setting(
    path: str | Path,
    horizon_start: str | pd.Timestamp,
    *,
    fallback: float = DEFAULT_UPLIFT_PCT,
    fallback_mix: dict[str, float] | None = None,
) -> dict[str, Any]:
    settings = load_saved_forecast_settings(path, fallback_mix=fallback_mix)
    return settings.get(
        _month_key(horizon_start),
        {
            "upliftPct": float(fallback),
            "productMix": _normalize_product_mix({}, fallback=fallback_mix),
        },
    )


def get_saved_uplift_pct(path: str | Path, horizon_start: str | pd.Timestamp, *, fallback: float = DEFAULT_UPLIFT_PCT) -> float:
    return float(get_saved_forecast_setting(path, horizon_start, fallback=fallback).get("upliftPct", fallback))


def load_saved_uplift_map(path: str | Path) -> dict[str, float]:
    settings = load_saved_forecast_settings(path)
    return {str(key): float(value.get("upliftPct", DEFAULT_UPLIFT_PCT)) for key, value in settings.items()}


def save_uplift_pct_for_month(path: str | Path, horizon_start: str | pd.Timestamp, uplift_pct: float) -> dict[str, Any]:
    existing = get_saved_forecast_setting(path, horizon_start, fallback=uplift_pct)
    return save_forecast_setting_for_month(
        path,
        horizon_start,
        uplift_pct=uplift_pct,
        product_mix=existing.get("productMix", {}),
    )


def save_forecast_setting_for_month(
    path: str | Path,
    horizon_start: str | pd.Timestamp,
    *,
    uplift_pct: float,
    product_mix: dict[str, Any] | None = None,
) -> dict[str, Any]:
    file_path = Path(path)
    payload: dict[str, Any] = {"months": {}}
    if file_path.exists():
        payload = json.loads(file_path.read_text(encoding="utf-8") or "{}")
        if "months" not in payload or not isinstance(payload["months"], dict):
            payload["months"] = {}
    payload["months"][_month_key(horizon_start)] = {
        "upliftPct": float(uplift_pct),
        "productMix": _normalize_product_mix(product_mix),
    }
    file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def _baseline_mix_from_plan(plan_rows: pd.DataFrame) -> dict[str, float]:
    if plan_rows is None or plan_rows.empty:
        equal_share = 1.0 / len(CORE_PRODUCTS)
        return {product_name: equal_share for product_name in CORE_PRODUCTS}
    working = plan_rows.copy()
    working["avg_daily_demand"] = pd.to_numeric(working.get("avg_daily_demand"), errors="coerce").fillna(0.0)
    total = float(working["avg_daily_demand"].sum()) or 0.0
    mix = {
        str(row.get("product_name") or ""): (float(row.get("avg_daily_demand") or 0.0) / total if total else 0.0)
        for row in working.to_dict(orient="records")
    }
    return _normalize_product_mix(mix)


def _resolve_month_settings(
    month_key: str,
    *,
    baseline_mix: dict[str, float],
    monthly_uplift_pcts: dict[str, float] | None = None,
    monthly_forecast_settings: dict[str, dict[str, Any]] | None = None,
    fallback_pct: float = DEFAULT_UPLIFT_PCT,
) -> dict[str, Any]:
    monthly_uplift_pcts = monthly_uplift_pcts or {}
    monthly_forecast_settings = monthly_forecast_settings or {}
    raw = monthly_forecast_settings.get(month_key, {})
    uplift_pct = raw.get("upliftPct", monthly_uplift_pcts.get(month_key, fallback_pct))
    return {
        "upliftPct": float(uplift_pct),
        "productMix": _normalize_product_mix(raw.get("productMix", {}), fallback=baseline_mix),
    }


def build_monthly_units_plan(
    plan_rows: pd.DataFrame,
    *,
    planning_year: int,
    actual_daily_demand: pd.DataFrame | None = None,
    monthly_uplift_pcts: dict[str, float] | None = None,
    monthly_forecast_settings: dict[str, dict[str, Any]] | None = None,
    fallback_pct: float = DEFAULT_UPLIFT_PCT,
) -> dict[str, Any]:
    monthly_uplift_pcts = monthly_uplift_pcts or {}
    baseline_mix = _baseline_mix_from_plan(plan_rows)
    baseline_total_daily = float(pd.to_numeric(plan_rows.get("avg_daily_demand"), errors="coerce").fillna(0).sum()) if plan_rows is not None and not plan_rows.empty else 0.0
    actuals_by_month: dict[str, dict[str, Any]] = {}
    if actual_daily_demand is not None and not actual_daily_demand.empty:
        actual_working = actual_daily_demand.copy()
        if {"date", "product_name", "net_units"}.issubset(set(actual_working.columns)):
            actual_working["date"] = pd.to_datetime(actual_working["date"], errors="coerce")
            actual_working = actual_working.dropna(subset=["date"])
            actual_working = actual_working.loc[actual_working["date"].dt.year.eq(int(planning_year))].copy()
            if not actual_working.empty:
                actual_working["month_key"] = actual_working["date"].dt.strftime("%Y-%m")
                actual_working["net_units"] = pd.to_numeric(actual_working["net_units"], errors="coerce").fillna(0.0)
                monthly_actual_rows = (
                    actual_working.groupby(["month_key", "product_name"], as_index=False)
                    .agg(actual_units=("net_units", "sum"))
                )
                monthly_actual_totals = (
                    monthly_actual_rows.groupby("month_key", as_index=False)
                    .agg(total_units=("actual_units", "sum"))
                )
                total_lookup = {
                    str(row["month_key"]): float(row["total_units"] or 0.0)
                    for row in monthly_actual_totals.to_dict(orient="records")
                }
                for month_key, frame in monthly_actual_rows.groupby("month_key"):
                    actuals_by_month[str(month_key)] = {
                        "total_units": total_lookup.get(str(month_key), 0.0),
                        "product_units": {
                            str(row["product_name"] or ""): float(row["actual_units"] or 0.0)
                            for row in frame.to_dict(orient="records")
                        },
                    }
    months: list[dict[str, Any]] = []
    for month_number in range(1, 13):
        month_start = pd.Timestamp(year=planning_year, month=month_number, day=1)
        month_key = month_start.strftime("%Y-%m")
        month_settings = _resolve_month_settings(
            month_key,
            baseline_mix=baseline_mix,
            monthly_uplift_pcts=monthly_uplift_pcts,
            monthly_forecast_settings=monthly_forecast_settings,
            fallback_pct=fallback_pct,
        )
        months.append(
            {
                "key": month_key,
                "label": month_start.strftime("%b"),
                "days": int(month_start.days_in_month),
                "uplift_pct": float(month_settings["upliftPct"]),
                "product_mix": month_settings["productMix"],
                "mode": "actual" if month_key in actuals_by_month else "forecast",
                "actual_total_units": float(actuals_by_month.get(month_key, {}).get("total_units", 0.0)),
            }
        )
    rows: list[dict[str, Any]] = []
    product_names: list[str] = []
    seen_products: set[str] = set()
    for row in (plan_rows.to_dict(orient="records") if plan_rows is not None and not plan_rows.empty else []):
        product_name = str(row.get("product_name") or "")
        if product_name and product_name not in seen_products:
            seen_products.add(product_name)
            product_names.append(product_name)
    for month_actual in actuals_by_month.values():
        for product_name in month_actual.get("product_units", {}).keys():
            if product_name and product_name not in seen_products:
                seen_products.add(product_name)
                product_names.append(product_name)
    if product_names:
        plan_lookup = {
            str(row.get("product_name") or ""): row
            for row in (plan_rows.to_dict(orient="records") if plan_rows is not None and not plan_rows.empty else [])
        }
        for product_name in product_names:
            row = plan_lookup.get(product_name, {})
            out: dict[str, Any] = {
                "product_name": product_name,
                "avg_daily_demand": float(row.get("avg_daily_demand") or 0.0),
            }
            total_units = 0.0
            for month in months:
                if month["mode"] == "actual":
                    units = float(actuals_by_month.get(month["key"], {}).get("product_units", {}).get(product_name, 0.0))
                else:
                    monthly_total_units = baseline_total_daily * (1 + (float(month["uplift_pct"]) / 100.0)) * int(month["days"])
                    share = float(month["product_mix"].get(out["product_name"], baseline_mix.get(out["product_name"], 0.0)))
                    month_start = pd.Timestamp(f"{month['key']}-01")
                    month_end = month_start + pd.offsets.MonthEnd(0)
                    active_fraction = get_active_fraction_for_period(product_name, month_start, month_end)
                    units = monthly_total_units * share * active_fraction
                out[month["key"]] = units
                total_units += units
            out["year_total_units"] = total_units
            rows.append(out)
    total_year_units = sum(float(row.get("year_total_units") or 0.0) for row in rows)
    for row in rows:
        row["year_mix_pct"] = (float(row.get("year_total_units") or 0.0) / total_year_units) if total_year_units else 0.0
    return {"year": planning_year, "months": months, "rows": rows}


def build_product_mix(plan_rows: pd.DataFrame) -> dict[str, Any]:
    if plan_rows is None or plan_rows.empty:
        return {"rows": [], "totals": {"units": 0.0, "grossSales": 0.0}}
    working = plan_rows.copy()
    total_units = float(pd.to_numeric(working.get("sales_units_in_baseline"), errors="coerce").fillna(0).sum())
    total_gross_sales = float(pd.to_numeric(working.get("gross_sales_in_baseline"), errors="coerce").fillna(0).sum())
    rows: list[dict[str, Any]] = []
    for row in working.to_dict(orient="records"):
        units = float(row.get("sales_units_in_baseline") or 0.0)
        gross_sales = float(row.get("gross_sales_in_baseline") or 0.0)
        rows.append(
            {
                "product_name": str(row.get("product_name") or ""),
                "baseline_units": units,
                "gross_sales_in_baseline": gross_sales,
                "unit_cogs": float(PRODUCT_CATALOG.get(str(row.get("product_name") or ""), {}).get("cogs", 0.0)),
                "mix_pct": (units / total_units) if total_units else 0.0,
                "sales_mix_pct": (gross_sales / total_gross_sales) if total_gross_sales else 0.0,
                "forecast_units": float(row.get("forecast_units") or 0.0),
                "recommended_order_units": float(row.get("recommended_order_units") or 0.0),
            }
        )
    for row in rows:
        row["estimated_cogs"] = row["baseline_units"] * row["unit_cogs"]
    rows.sort(key=lambda item: item["baseline_units"], reverse=True)
    return {
        "rows": rows,
        "totals": {"units": total_units, "grossSales": total_gross_sales},
    }


def build_historical_trend(
    actual_daily_demand: pd.DataFrame | None,
    *,
    focus_year: int,
) -> dict[str, Any]:
    if actual_daily_demand is None or actual_daily_demand.empty:
        return {"years": [], "monthlyTotals": [], "productMonthly": [], "yoyByMonth": []}
    working = actual_daily_demand.copy()
    required = {"date", "product_name", "net_units"}
    if not required.issubset(set(working.columns)):
        return {"years": [], "monthlyTotals": [], "productMonthly": [], "yoyByMonth": []}
    working["date"] = pd.to_datetime(working["date"], errors="coerce")
    working["net_units"] = pd.to_numeric(working["net_units"], errors="coerce").fillna(0.0)
    working = working.dropna(subset=["date"])
    if working.empty:
        return {"years": [], "monthlyTotals": [], "productMonthly": [], "yoyByMonth": []}

    years = [year for year in range(int(focus_year) - 2, int(focus_year) + 1)]
    working = working.loc[working["date"].dt.year.isin(years)].copy()
    if working.empty:
        return {"years": years, "monthlyTotals": [], "productMonthly": [], "yoyByMonth": []}
    working["year"] = working["date"].dt.year
    working["month"] = working["date"].dt.month

    totals = (
        working.groupby(["year", "month"], as_index=False)
        .agg(units=("net_units", "sum"))
    )
    monthly_totals: list[dict[str, Any]] = []
    for year in years:
        row: dict[str, Any] = {"year": year}
        total_units = 0.0
        for month_number in range(1, 13):
            units = float(
                totals.loc[totals["year"].eq(year) & totals["month"].eq(month_number), "units"].sum()
            )
            row[f"{year}-{month_number:02d}"] = units
            total_units += units
        row["year_total_units"] = total_units
        monthly_totals.append(row)

    focus_rows = (
        working.loc[working["year"].eq(int(focus_year))]
        .groupby(["product_name", "month"], as_index=False)
        .agg(units=("net_units", "sum"))
    )
    product_order = list(PRODUCT_CATALOG.keys())
    focus_lookup = {
        (str(row["product_name"]), int(row["month"])): float(row["units"] or 0.0)
        for row in focus_rows.to_dict(orient="records")
    }
    product_monthly: list[dict[str, Any]] = []
    for product_name in product_order:
        row: dict[str, Any] = {"product_name": product_name}
        total_units = 0.0
        for month_number in range(1, 13):
            units = float(focus_lookup.get((product_name, month_number), 0.0))
            row[f"{focus_year}-{month_number:02d}"] = units
            total_units += units
        row["year_total_units"] = total_units
        product_monthly.append(row)

    yoy_by_month: list[dict[str, Any]] = []
    previous_year = int(focus_year) - 1
    total_lookup = {
        (int(row["year"]), int(row["month"])): float(row["units"] or 0.0)
        for row in totals.to_dict(orient="records")
    }
    for month_number in range(1, 13):
        current_units = float(total_lookup.get((int(focus_year), month_number), 0.0))
        previous_units = float(total_lookup.get((previous_year, month_number), 0.0))
        yoy_pct = ((current_units - previous_units) / previous_units) if previous_units else None
        yoy_by_month.append(
            {
                "month": month_number,
                "label": pd.Timestamp(year=2000, month=month_number, day=1).strftime("%b"),
                "current_units": current_units,
                "previous_units": previous_units,
                "yoy_pct": yoy_pct,
            }
        )

    return {
        "years": years,
        "monthlyTotals": monthly_totals,
        "productMonthly": product_monthly,
        "yoyByMonth": yoy_by_month,
    }


def build_launch_planning(
    actual_daily_demand: pd.DataFrame | None,
    *,
    focus_year: int,
) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    actual_working = pd.DataFrame()
    if actual_daily_demand is not None and not actual_daily_demand.empty and {"date", "product_name", "net_units"}.issubset(set(actual_daily_demand.columns)):
        actual_working = actual_daily_demand.copy()
        actual_working["date"] = pd.to_datetime(actual_working["date"], errors="coerce").dt.normalize()
        actual_working["net_units"] = pd.to_numeric(actual_working["net_units"], errors="coerce").fillna(0.0)
        actual_working = actual_working.dropna(subset=["date"])

    for product_name, metadata in PRODUCT_CATALOG.items():
        launch_date = get_launch_date(product_name)
        launch_units_committed = float(metadata.get("launch_inbound_units", 0.0) or 0.0)
        proxy_product_name = str(metadata.get("launch_proxy_product") or "")
        if pd.isna(launch_date) and not launch_units_committed and not proxy_product_name:
            continue

        proxy_first_7_day_units = 0.0
        proxy_first_14_day_units = 0.0
        proxy_first_30_day_units = 0.0
        proxy_first_30_day_daily_velocity = 0.0
        if proxy_product_name and not actual_working.empty:
            proxy_launch_date = get_launch_date(proxy_product_name)
            if pd.notna(proxy_launch_date):
                proxy_rows = actual_working.loc[
                    actual_working["product_name"].eq(proxy_product_name)
                    & actual_working["date"].ge(proxy_launch_date)
                    & actual_working["date"].lt(proxy_launch_date + pd.Timedelta(days=30))
                ].copy()
                if not proxy_rows.empty:
                    proxy_first_30_day_units = float(proxy_rows["net_units"].sum())
                    proxy_first_7_day_units = float(
                        proxy_rows.loc[proxy_rows["date"].lt(proxy_launch_date + pd.Timedelta(days=7)), "net_units"].sum()
                    )
                    proxy_first_14_day_units = float(
                        proxy_rows.loc[proxy_rows["date"].lt(proxy_launch_date + pd.Timedelta(days=14)), "net_units"].sum()
                    )
                    proxy_first_30_day_daily_velocity = proxy_first_30_day_units / 30.0

        launch_strength_pct = float(metadata.get("launch_strength_pct", 100.0) or 100.0)
        launch_bundle_uplift_pct = float(metadata.get("launch_bundle_uplift_pct", 0.0) or 0.0)
        launch_sample_units = float(metadata.get("launch_sample_units", 0.0) or 0.0)
        launch_cover_weeks_target = float(metadata.get("launch_cover_weeks_target", 5.0) or 5.0)
        base_daily_velocity = proxy_first_30_day_daily_velocity * (launch_strength_pct / 100.0) * (1 + (launch_bundle_uplift_pct / 100.0))
        low_daily_velocity = base_daily_velocity * 0.8
        high_daily_velocity = base_daily_velocity * 1.2
        target_days = launch_cover_weeks_target * 7.0
        base_send_units = (base_daily_velocity * target_days) + launch_sample_units
        low_send_units = (low_daily_velocity * target_days) + launch_sample_units
        high_send_units = (high_daily_velocity * target_days) + launch_sample_units

        def weeks_of_cover(daily_velocity: float) -> float | None:
            if daily_velocity <= 0:
                return None
            return launch_units_committed / daily_velocity / 7.0

        rows.append(
            {
                "product_name": product_name,
                "launch_date": _json_scalar(launch_date),
                "list_price": float(metadata.get("list_price", 0.0) or 0.0),
                "unit_cogs": float(metadata.get("cogs", 0.0) or 0.0),
                "launch_units_committed": launch_units_committed,
                "proxy_product_name": proxy_product_name or None,
                "proxy_first_7_day_units": proxy_first_7_day_units,
                "proxy_first_14_day_units": proxy_first_14_day_units,
                "proxy_first_30_day_units": proxy_first_30_day_units,
                "proxy_first_30_day_daily_velocity": proxy_first_30_day_daily_velocity,
                "launch_strength_pct": launch_strength_pct,
                "launch_sample_units": launch_sample_units,
                "launch_bundle_uplift_pct": launch_bundle_uplift_pct,
                "launch_cover_weeks_target": launch_cover_weeks_target,
                "low_daily_velocity": low_daily_velocity,
                "base_daily_velocity": base_daily_velocity,
                "high_daily_velocity": high_daily_velocity,
                "low_send_units": low_send_units,
                "base_send_units": base_send_units,
                "high_send_units": high_send_units,
                "low_weeks_of_cover": weeks_of_cover(low_daily_velocity),
                "base_weeks_of_cover": weeks_of_cover(base_daily_velocity),
                "high_weeks_of_cover": weeks_of_cover(high_daily_velocity),
            }
        )

    rows.sort(key=lambda row: ((row.get("launch_date") or "9999-12-31"), row["product_name"]))
    return {
        "year": int(focus_year),
        "rows": rows,
    }


def apply_month_forecast_to_plan(
    plan_rows: pd.DataFrame,
    *,
    horizon_start: str,
    horizon_end: str,
    fallback_pct: float,
    monthly_uplift_pcts: dict[str, float] | None = None,
    monthly_forecast_settings: dict[str, dict[str, Any]] | None = None,
) -> pd.DataFrame:
    if plan_rows is None or plan_rows.empty:
        return pd.DataFrame() if plan_rows is None else plan_rows
    adjusted = plan_rows.copy()
    horizon_start_ts = pd.Timestamp(horizon_start)
    horizon_end_ts = pd.Timestamp(horizon_end)
    horizon_days = max((horizon_end_ts - horizon_start_ts).days + 1, 1)
    baseline_mix = _baseline_mix_from_plan(adjusted)
    month_settings = _resolve_month_settings(
        horizon_start_ts.strftime("%Y-%m"),
        baseline_mix=baseline_mix,
        monthly_uplift_pcts=monthly_uplift_pcts,
        monthly_forecast_settings=monthly_forecast_settings,
        fallback_pct=fallback_pct,
    )
    total_daily_demand = float(pd.to_numeric(adjusted.get("avg_daily_demand"), errors="coerce").fillna(0.0).sum()) or 0.0
    total_forecast_units = total_daily_demand * (1 + (float(month_settings["upliftPct"]) / 100.0)) * horizon_days
    adjusted["forecast_share"] = adjusted["product_name"].map(lambda name: month_settings["productMix"].get(str(name), baseline_mix.get(str(name), 0.0)))
    adjusted["launch_active_fraction"] = adjusted["product_name"].map(
        lambda name: get_active_fraction_for_period(str(name), horizon_start_ts, horizon_end_ts)
    )
    adjusted["launch_active_days"] = adjusted["launch_active_fraction"] * horizon_days
    adjusted["forecast_units"] = adjusted["forecast_share"] * total_forecast_units * adjusted["launch_active_fraction"]
    adjusted["forecast_daily_demand"] = adjusted.apply(
        lambda row: (float(row["forecast_units"] or 0.0) / float(row["launch_active_days"] or 0.0))
        if float(row["launch_active_days"] or 0.0) > 0
        else 0.0,
        axis=1,
    )
    adjusted["avg_daily_gross_sales"] = pd.to_numeric(adjusted.get("avg_daily_gross_sales"), errors="coerce").fillna(0.0)
    total_daily_gross_sales = float(adjusted["avg_daily_gross_sales"].sum()) or 0.0
    adjusted["forecast_daily_gross_sales"] = adjusted["forecast_share"] * total_daily_gross_sales * (1 + (float(month_settings["upliftPct"]) / 100.0))
    adjusted["demand_start_date"] = adjusted["product_name"].map(
        lambda name: get_launch_date(str(name))
    )
    adjusted["days_on_hand"] = adjusted.apply(
        lambda row: (float(row.get("current_supply_units") or 0.0) / float(row["forecast_daily_demand"]))
        if float(row["forecast_daily_demand"] or 0.0) > 0
        else None,
        axis=1,
    )
    adjusted["weeks_of_supply"] = adjusted["days_on_hand"].apply(lambda value: (value / 7.0) if pd.notna(value) else None)
    snapshot_source = adjusted["snapshot_date"] if "snapshot_date" in adjusted.columns else pd.Series(dtype="datetime64[ns]")
    snapshot_dates = pd.to_datetime(snapshot_source, errors="coerce")
    valid_snapshot_dates = snapshot_dates.dropna()
    baseline_end_ts = valid_snapshot_dates.iloc[0] if not valid_snapshot_dates.empty else horizon_start_ts
    if "snapshot_date" not in adjusted.columns:
        adjusted["snapshot_date"] = baseline_end_ts
    else:
        adjusted["snapshot_date"] = pd.to_datetime(adjusted["snapshot_date"], errors="coerce").fillna(baseline_end_ts)
    adjusted["projected_stockout_date"] = adjusted.apply(
        lambda row: (
            max(pd.Timestamp(baseline_end_ts), pd.Timestamp(horizon_start_ts), pd.Timestamp(row["demand_start_date"]).normalize())
            + pd.to_timedelta(math.floor(float(row["days_on_hand"] or 0.0)), unit="D")
            if pd.notna(row["days_on_hand"]) and pd.notna(row["demand_start_date"])
            else (pd.Timestamp(baseline_end_ts) + pd.to_timedelta(math.floor(float(row["days_on_hand"] or 0.0)), unit="D"))
            if pd.notna(row["days_on_hand"])
            else pd.NaT
        ),
        axis=1,
    )
    adjusted["safety_stock_units"] = adjusted["forecast_daily_demand"] * pd.to_numeric(adjusted.get("safety_stock_weeks"), errors="coerce").fillna(0.0) * 7
    adjusted["lead_time_demand_units"] = adjusted["forecast_daily_demand"] * pd.to_numeric(adjusted.get("lead_time_days"), errors="coerce").fillna(0.0)
    adjusted["reorder_point_units"] = adjusted["lead_time_demand_units"] + adjusted["safety_stock_units"]
    adjusted["target_stock_units"] = adjusted["forecast_units"] + adjusted["safety_stock_units"]
    adjusted["recommended_order_units"] = adjusted.apply(
        lambda row: _round_reorder_quantity(
            float(row["target_stock_units"] or 0.0) - float(row.get("current_supply_units") or 0.0),
            row.get("moq"),
            row.get("case_pack"),
        ),
        axis=1,
    )
    adjusted["reorder_date"] = adjusted.apply(
        lambda row: (
            row["projected_stockout_date"] - pd.to_timedelta(int((float(row["safety_stock_weeks"] or 0.0) * 7) + float(row["lead_time_days"] or 0.0)), unit="D")
            if pd.notna(row["projected_stockout_date"]) and float(row["forecast_daily_demand"] or 0.0) > 0
            else pd.NaT
        ),
        axis=1,
    )

    def _status(row: pd.Series) -> str:
        if float(row["forecast_daily_demand"] or 0.0) <= 0:
            return "No demand"
        if float(row["recommended_order_units"] or 0.0) <= 0:
            return "Covered"
        if pd.notna(row["reorder_date"]) and row["reorder_date"] <= row["snapshot_date"]:
            return "Urgent"
        if pd.notna(row["reorder_date"]) and row["reorder_date"] <= row["snapshot_date"] + pd.Timedelta(days=7):
            return "Watch"
        return "Healthy"

    adjusted["status"] = adjusted.apply(_status, axis=1)
    return adjusted.drop(
        columns=["forecast_share", "forecast_daily_gross_sales", "launch_active_fraction", "launch_active_days", "demand_start_date"],
        errors="ignore",
    )


def _build_transit_metadata(inventory_history: pd.DataFrame) -> pd.DataFrame:
    if inventory_history is None or inventory_history.empty:
        return pd.DataFrame(columns=["product_name", "transit_started_on", "transit_eta"])
    working = inventory_history.copy()
    working["date"] = pd.to_datetime(working["date"], errors="coerce").dt.normalize()
    rows: list[dict[str, Any]] = []
    for product_name, group in working.groupby("product_name"):
        group = group.sort_values("date").reset_index(drop=True)
        latest = group.iloc[-1]
        if float(latest.get("in_transit") or 0.0) <= 0:
            rows.append({"product_name": product_name, "transit_started_on": pd.NaT, "transit_eta": pd.NaT})
            continue
        positive = group["in_transit"].fillna(0).gt(0)
        streak_start = latest["date"]
        for index in range(len(group) - 1, -1, -1):
            if not bool(positive.iloc[index]):
                break
            streak_start = group.iloc[index]["date"]
        transit_eta = pd.Timestamp(streak_start) + pd.Timedelta(days=DEFAULT_INBOUND_ARRIVAL_DAYS - 1)
        rows.append({"product_name": product_name, "transit_started_on": streak_start, "transit_eta": transit_eta})
    return pd.DataFrame(rows)


def _build_inventory_frame_from_history(
    inventory_template: pd.DataFrame,
    inventory_history: pd.DataFrame,
) -> tuple[pd.DataFrame, str | None]:
    if inventory_history is None or inventory_history.empty:
        return normalize_inventory_frame(inventory_template), None
    latest_date = pd.Timestamp(inventory_history["date"].max()).normalize()
    latest = inventory_history.loc[inventory_history["date"].eq(latest_date), ["product_name", "on_hand", "in_transit"]].copy()
    latest = latest.groupby("product_name", as_index=False).agg(on_hand=("on_hand", "sum"), in_transit=("in_transit", "sum"))
    transit_meta = _build_transit_metadata(inventory_history)
    merged = inventory_template.merge(latest, on="product_name", how="left", suffixes=("", "_latest"))
    merged = merged.merge(transit_meta, on="product_name", how="left", suffixes=("", "_history"))
    merged["on_hand"] = pd.to_numeric(merged.get("on_hand_latest"), errors="coerce").fillna(pd.to_numeric(merged.get("on_hand"), errors="coerce")).fillna(0.0)
    merged["in_transit"] = pd.to_numeric(merged.get("in_transit_latest"), errors="coerce").fillna(pd.to_numeric(merged.get("in_transit"), errors="coerce")).fillna(0.0)
    merged["transit_started_on"] = pd.to_datetime(merged.get("transit_started_on_history"), errors="coerce").fillna(pd.to_datetime(merged.get("transit_started_on"), errors="coerce"))
    merged["transit_eta"] = pd.to_datetime(merged.get("transit_eta_history"), errors="coerce").fillna(pd.to_datetime(merged.get("transit_eta"), errors="coerce"))
    merged = merged.drop(columns=[column for column in ["on_hand_latest", "in_transit_latest", "transit_started_on_history", "transit_eta_history"] if column in merged.columns])
    return normalize_inventory_frame(merged), latest_date.strftime("%Y-%m-%d")


def load_sample_workspace(data_root: Path, *, platform: str, inventory_source: str | Path | None = None) -> dict[str, Any]:
    orders = load_orders_from_folder(Path(data_root), platform=platform)
    samples = load_samples_from_folder(Path(data_root), platform=platform)
    daily = aggregate_daily_demand(orders)
    samples_daily = aggregate_daily_demand(samples)
    inventory_template = build_inventory_template(orders)
    inventory_history = load_inventory_history(inventory_source, channel=platform) if inventory_source else pd.DataFrame()
    inventory_frame, inventory_as_of = _build_inventory_frame_from_history(inventory_template, inventory_history)
    date_start = None
    date_end = None
    if not orders.empty:
        date_start = orders["order_date"].min()
        date_end = orders["order_date"].max()
    return {
        "orders": orders,
        "samples": samples,
        "daily_demand": daily,
        "samples_daily_demand": samples_daily,
        "inventory_frame": inventory_frame,
        "inventory_template_frame": inventory_template,
        "inventory_template": [
            {key: _json_scalar(value) for key, value in row.items()}
            for row in inventory_template.to_dict(orient="records")
        ],
        "summary": {
            "orders_loaded": int(len(orders)),
            "samples_loaded": int(len(samples)),
            "products_detected": int(len(inventory_template)),
            "date_start": _json_scalar(date_start),
            "date_end": _json_scalar(date_end),
            "inventory_as_of": inventory_as_of,
            "inventory_rows": int(len(inventory_frame)),
        },
    }


def run_planning_workspace(
    *,
    orders: pd.DataFrame,
    samples: pd.DataFrame | None,
    inventory: pd.DataFrame,
    daily_demand: pd.DataFrame | None = None,
    sample_daily_demand: pd.DataFrame | None = None,
    baseline_start: str,
    baseline_end: str,
    horizon_start: str,
    horizon_end: str,
    velocity_mode: str,
    default_uplift_pct: float,
    default_lead_time_days: int,
    default_safety_days: int,
    monthly_uplift_pcts: dict[str, float] | None = None,
    monthly_forecast_settings: dict[str, dict[str, Any]] | None = None,
    planning_year: int | None = None,
) -> dict[str, Any]:
    daily = daily_demand if daily_demand is not None else aggregate_daily_demand(orders)
    sample_daily = (
        sample_daily_demand
        if sample_daily_demand is not None
        else (aggregate_daily_demand(samples) if samples is not None and not samples.empty else pd.DataFrame())
    )
    plan = plan_demand(
        daily,
        inventory,
        baseline_start=pd.Timestamp(baseline_start).date(),
        baseline_end=pd.Timestamp(baseline_end).date(),
        horizon_start=pd.Timestamp(horizon_start).date(),
        horizon_end=pd.Timestamp(horizon_end).date(),
        sample_daily_demand=sample_daily,
        include_samples=str(velocity_mode or "sales_only") == "sales_plus_samples",
        default_uplift_pct=float(default_uplift_pct),
        default_lead_time_days=int(default_lead_time_days),
        default_safety_days=int(default_safety_days),
    )
    plan = apply_month_forecast_to_plan(
        plan,
        horizon_start=horizon_start,
        horizon_end=horizon_end,
        fallback_pct=float(default_uplift_pct),
        monthly_uplift_pcts=monthly_uplift_pcts,
        monthly_forecast_settings=monthly_forecast_settings,
    )
    planning_year = int(planning_year or pd.Timestamp(horizon_start).year)
    monthly_plan = build_monthly_units_plan(
        plan,
        planning_year=planning_year,
        actual_daily_demand=daily,
        monthly_uplift_pcts=monthly_uplift_pcts,
        monthly_forecast_settings=monthly_forecast_settings,
        fallback_pct=float(default_uplift_pct),
    )
    product_mix = build_product_mix(plan)
    historical_trend = build_historical_trend(daily, focus_year=planning_year)
    launch_planning = build_launch_planning(daily, focus_year=planning_year)
    product_mix_lookup = {
        str(row.get("product_name") or ""): row
        for row in product_mix.get("rows", [])
    }
    return {
        "rows": [
            {
                **{key: _json_scalar(value) for key, value in row.items()},
                "mix_pct": _json_scalar(product_mix_lookup.get(str(row.get("product_name") or ""), {}).get("mix_pct", 0.0)),
                "sales_mix_pct": _json_scalar(product_mix_lookup.get(str(row.get("product_name") or ""), {}).get("sales_mix_pct", 0.0)),
                "unit_cogs": _json_scalar(product_mix_lookup.get(str(row.get("product_name") or ""), {}).get("unit_cogs", 0.0)),
                "estimated_cogs": _json_scalar(product_mix_lookup.get(str(row.get("product_name") or ""), {}).get("estimated_cogs", 0.0)),
            }
            for row in plan.to_dict(orient="records")
        ],
        "monthlyPlan": monthly_plan,
        "productMix": product_mix,
        "historicalTrend": historical_trend,
        "launchPlanning": launch_planning,
        "summary": {
            "rows": int(len(plan)),
            "urgent": int((plan["status"] == "Urgent").sum()) if not plan.empty else 0,
            "watch": int((plan["status"] == "Watch").sum()) if not plan.empty else 0,
            "healthy": int((plan["status"] == "Healthy").sum()) if not plan.empty else 0,
            "covered": int((plan["status"] == "Covered").sum()) if not plan.empty else 0,
            "no_demand": int((plan["status"] == "No demand").sum()) if not plan.empty else 0,
        },
    }
