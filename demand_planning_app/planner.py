from __future__ import annotations

import math
from datetime import date
from typing import Any

import pandas as pd

from demand_planning_app.planning_products import build_primary_sku_lookup, detect_planning_components

DEFAULT_INBOUND_ARRIVAL_DAYS = 5
DEFAULT_REORDER_LEAD_DAYS = 8


INVENTORY_COLUMNS = [
    "product_name",
    "seller_sku_resolved",
    "on_hand",
    "in_transit",
    "transit_started_on",
    "transit_eta",
    "lead_time_days",
    "case_pack",
    "moq",
]


def normalize_inventory_frame(raw_df: pd.DataFrame) -> pd.DataFrame:
    if raw_df is None or raw_df.empty:
        return pd.DataFrame(columns=INVENTORY_COLUMNS)

    working = raw_df.copy()
    working.columns = [str(column).strip() for column in working.columns]
    if "product_name" not in working.columns:
        working["product_name"] = ""
    if "seller_sku_resolved" not in working.columns:
        working["seller_sku_resolved"] = ""
    for column, default in [
        ("on_hand", 0.0),
        ("in_transit", 0.0),
        ("lead_time_days", None),
        ("case_pack", None),
        ("moq", None),
    ]:
        if column not in working.columns:
            working[column] = default
        working[column] = pd.to_numeric(working[column], errors="coerce")
    for column in ["transit_started_on", "transit_eta"]:
        if column not in working.columns:
            working[column] = pd.NaT
        working[column] = pd.to_datetime(working[column], errors="coerce")
    working["product_name"] = working["product_name"].astype("string").fillna("").str.strip()
    working["seller_sku_resolved"] = working["seller_sku_resolved"].astype("string").fillna("").str.strip()
    working["on_hand"] = working["on_hand"].fillna(0.0)
    working["in_transit"] = working["in_transit"].fillna(0.0)
    return working.reindex(columns=INVENTORY_COLUMNS).reset_index(drop=True)


def _normalize_merge_keys(frame: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    if frame is None or frame.empty:
        return frame
    working = frame.copy()
    for column in columns:
        if column not in working.columns:
            working[column] = ""
        working[column] = working[column].astype("string").fillna("").str.replace(r"\.0$", "", regex=True).str.strip()
    return working


def aggregate_daily_demand(normalized_orders: pd.DataFrame) -> pd.DataFrame:
    if normalized_orders is None or normalized_orders.empty:
        return pd.DataFrame(columns=["platform", "date", "product_name", "seller_sku_resolved", "net_units", "gross_sales"])

    sku_lookup = build_primary_sku_lookup(normalized_orders)
    rows: list[dict[str, Any]] = []
    for row in normalized_orders.to_dict(orient="records"):
        components, _reason = detect_planning_components(str(row.get("product_name") or ""))
        total_multiplier = sum(multiplier for _component_name, multiplier in components) or 0
        for component_name, multiplier in components:
            rows.append(
                {
                    "platform": str(row.get("platform") or "").strip() or "Unknown",
                    "date": pd.Timestamp(row.get("order_date")).normalize(),
                    "product_name": component_name,
                    "net_units": float(row.get("net_units") or 0.0) * multiplier,
                    "gross_sales": (
                        (float(row.get("gross_sales") or 0.0) * multiplier / total_multiplier) if total_multiplier else 0.0
                    ),
                }
            )
    if not rows:
        return pd.DataFrame(columns=["platform", "date", "product_name", "seller_sku_resolved", "net_units", "gross_sales"])
    grouped = (
        pd.DataFrame(rows)
        .groupby(["platform", "date", "product_name"], as_index=False)
        .agg(net_units=("net_units", "sum"), gross_sales=("gross_sales", "sum"))
        .sort_values(["date", "platform", "product_name"])
        .reset_index(drop=True)
    )
    grouped["seller_sku_resolved"] = grouped["product_name"].map(sku_lookup).fillna("")
    grouped = grouped[["platform", "date", "product_name", "seller_sku_resolved", "net_units", "gross_sales"]]
    return grouped


def _round_reorder_quantity(base_quantity: float, moq: float | None, case_pack: float | None) -> float:
    quantity = max(base_quantity, 0.0)
    if pd.notna(moq) and float(moq) > 0:
        quantity = max(quantity, moq)
    if pd.notna(case_pack) and float(case_pack) > 0:
        case_pack_int = int(float(case_pack))
        if case_pack_int > 0:
            packs = -(-int(quantity) // case_pack_int)
            quantity = float(packs * case_pack_int)
    return float(quantity)


def safety_stock_weeks_for_date(target_date: date | pd.Timestamp | None) -> int:
    if target_date is None:
        return 3
    quarter = int(pd.Timestamp(target_date).quarter)
    return 3 if quarter in (1, 2) else 5


def plan_demand(
    daily_demand: pd.DataFrame,
    inventory: pd.DataFrame,
    *,
    baseline_start: date,
    baseline_end: date,
    horizon_start: date,
    horizon_end: date,
    sample_daily_demand: pd.DataFrame | None = None,
    include_samples: bool = False,
    default_uplift_pct: float,
    default_lead_time_days: int,
    default_safety_days: int,
) -> pd.DataFrame:
    if daily_demand is None:
        daily_demand = pd.DataFrame()
    if sample_daily_demand is None:
        sample_daily_demand = pd.DataFrame()
    if inventory is None:
        inventory = pd.DataFrame(columns=INVENTORY_COLUMNS)

    daily_demand = _normalize_merge_keys(daily_demand, ["platform", "product_name", "seller_sku_resolved"])
    sample_daily_demand = _normalize_merge_keys(sample_daily_demand, ["platform", "product_name", "seller_sku_resolved"])

    baseline_start_ts = pd.Timestamp(baseline_start)
    baseline_end_ts = pd.Timestamp(baseline_end)
    horizon_start_ts = pd.Timestamp(horizon_start)
    horizon_end_ts = pd.Timestamp(horizon_end)
    baseline_days = max((baseline_end_ts - baseline_start_ts).days + 1, 1)
    horizon_days = max((horizon_end_ts - horizon_start_ts).days + 1, 1)

    filtered_sales = (
        daily_demand.loc[daily_demand["date"].between(baseline_start_ts, baseline_end_ts)].copy() if not daily_demand.empty else daily_demand
    )
    if filtered_sales is not None and not filtered_sales.empty and "gross_sales" not in filtered_sales.columns:
        filtered_sales["gross_sales"] = 0.0
    filtered_samples = (
        sample_daily_demand.loc[sample_daily_demand["date"].between(baseline_start_ts, baseline_end_ts)].copy()
        if sample_daily_demand is not None and not sample_daily_demand.empty
        else pd.DataFrame()
    )
    sales_summary = (
        filtered_sales.groupby(["platform", "product_name", "seller_sku_resolved"], dropna=False, as_index=False)
        .agg(
            sales_units_in_baseline=("net_units", "sum"),
            gross_sales_in_baseline=("gross_sales", "sum"),
        )
        if filtered_sales is not None and not filtered_sales.empty
        else pd.DataFrame(columns=["platform", "product_name", "seller_sku_resolved", "sales_units_in_baseline", "gross_sales_in_baseline"])
    )
    sample_summary = (
        filtered_samples.groupby(["platform", "product_name", "seller_sku_resolved"], dropna=False, as_index=False)
        .agg(sample_units_in_baseline=("net_units", "sum"))
        if filtered_samples is not None and not filtered_samples.empty
        else pd.DataFrame(columns=["platform", "product_name", "seller_sku_resolved", "sample_units_in_baseline"])
    )

    inventory_working = _normalize_merge_keys(
        normalize_inventory_frame(inventory),
        ["product_name", "seller_sku_resolved"],
    )
    inventory_working["platform"] = "All"

    if sales_summary.empty and sample_summary.empty and inventory_working.empty:
        return pd.DataFrame()

    demand_summary = sales_summary.merge(
        sample_summary,
        on=["platform", "product_name", "seller_sku_resolved"],
        how="outer",
    )
    merged = demand_summary.merge(
        inventory_working,
        on=["product_name", "seller_sku_resolved"],
        how="outer",
    )
    merged["platform"] = merged["platform_x"].fillna(merged["platform_y"]).fillna("All")
    merged = merged.drop(columns=[column for column in ["platform_x", "platform_y"] if column in merged.columns])
    merged["sales_units_in_baseline"] = pd.to_numeric(merged.get("sales_units_in_baseline"), errors="coerce").fillna(0.0)
    merged["sample_units_in_baseline"] = pd.to_numeric(merged.get("sample_units_in_baseline"), errors="coerce").fillna(0.0)
    merged["gross_sales_in_baseline"] = pd.to_numeric(merged.get("gross_sales_in_baseline"), errors="coerce").fillna(0.0)
    merged["on_hand"] = pd.to_numeric(merged.get("on_hand"), errors="coerce").fillna(0.0)
    merged["in_transit"] = pd.to_numeric(merged.get("in_transit"), errors="coerce").fillna(0.0)
    merged["lead_time_days"] = pd.to_numeric(merged.get("lead_time_days"), errors="coerce").fillna(float(default_lead_time_days))
    merged["case_pack"] = pd.to_numeric(merged.get("case_pack"), errors="coerce")
    merged["moq"] = pd.to_numeric(merged.get("moq"), errors="coerce")
    merged["units_used_for_velocity"] = merged["sales_units_in_baseline"] + (
        merged["sample_units_in_baseline"] if include_samples else 0.0
    )
    merged["avg_daily_demand"] = merged["units_used_for_velocity"] / baseline_days
    merged["avg_daily_gross_sales"] = merged["gross_sales_in_baseline"] / baseline_days
    merged["uplift_multiplier"] = 1 + (float(default_uplift_pct) / 100.0)
    merged["forecast_daily_demand"] = merged["avg_daily_demand"] * merged["uplift_multiplier"]
    merged["forecast_units"] = merged["forecast_daily_demand"] * horizon_days
    merged["snapshot_date"] = baseline_end_ts
    merged["days_on_hand"] = merged.apply(
        lambda row: (row["on_hand"] / row["forecast_daily_demand"]) if row["forecast_daily_demand"] > 0 else None,
        axis=1,
    )
    merged["on_hand_stockout_date"] = merged["days_on_hand"].apply(
        lambda value: (pd.Timestamp(baseline_end_ts) + pd.to_timedelta(math.floor(value), unit="D")) if pd.notna(value) else pd.NaT
    )
    merged["projected_in_transit_arrival_date"] = merged.apply(
        lambda row: (
            pd.to_datetime(row.get("transit_eta"), errors="coerce")
            if row["in_transit"] > 0 and pd.notna(pd.to_datetime(row.get("transit_eta"), errors="coerce"))
            else (
                pd.Timestamp(baseline_end_ts) + pd.to_timedelta(DEFAULT_INBOUND_ARRIVAL_DAYS, unit="D")
                if row["in_transit"] > 0
                else pd.NaT
            )
        ),
        axis=1,
    )
    merged["counted_in_transit"] = merged.apply(
        lambda row: row["in_transit"]
        if row["in_transit"] > 0
        and (
            pd.isna(row["on_hand_stockout_date"])
            or (pd.notna(row["projected_in_transit_arrival_date"]) and row["projected_in_transit_arrival_date"] <= row["on_hand_stockout_date"])
        )
        else 0.0,
        axis=1,
    )
    merged["current_supply_units"] = merged["on_hand"] + merged["counted_in_transit"]
    merged["days_of_supply"] = merged.apply(
        lambda row: (row["current_supply_units"] / row["forecast_daily_demand"]) if row["forecast_daily_demand"] > 0 else None,
        axis=1,
    )
    merged["weeks_of_supply"] = merged["days_of_supply"].apply(lambda value: (value / 7.0) if pd.notna(value) else None)
    merged["projected_stockout_date"] = merged["days_of_supply"].apply(
        lambda value: (pd.Timestamp(baseline_end_ts) + pd.to_timedelta(math.floor(value), unit="D")) if pd.notna(value) else pd.NaT
    )
    merged["safety_stock_weeks"] = safety_stock_weeks_for_date(horizon_start_ts)
    merged["safety_stock_units"] = merged["forecast_daily_demand"] * merged["safety_stock_weeks"] * 7
    merged["lead_time_demand_units"] = merged["forecast_daily_demand"] * merged["lead_time_days"]
    merged["reorder_point_units"] = merged["lead_time_demand_units"] + merged["safety_stock_units"]
    merged["target_stock_units"] = merged["forecast_units"] + merged["safety_stock_units"]
    merged["recommended_order_units"] = merged.apply(
        lambda row: _round_reorder_quantity(
            row["target_stock_units"] - row["current_supply_units"],
            row.get("moq"),
            row.get("case_pack"),
        ),
        axis=1,
    )
    merged["reorder_date"] = merged.apply(
        lambda row: (
            row["projected_stockout_date"] - pd.to_timedelta(int((row["safety_stock_weeks"] * 7) + row["lead_time_days"]), unit="D")
            if pd.notna(row["projected_stockout_date"]) and row["forecast_daily_demand"] > 0
            else pd.NaT
        ),
        axis=1,
    )

    def _status(row: pd.Series) -> str:
        if row["forecast_daily_demand"] <= 0:
            return "No demand"
        if row["recommended_order_units"] <= 0:
            return "Covered"
        if pd.notna(row["reorder_date"]) and row["reorder_date"] <= row["snapshot_date"]:
            return "Urgent"
        if pd.notna(row["reorder_date"]) and row["reorder_date"] <= row["snapshot_date"] + pd.Timedelta(days=7):
            return "Watch"
        return "Healthy"

    merged["status"] = merged.apply(_status, axis=1)
    merged["baseline_start"] = baseline_start_ts
    merged["baseline_end"] = baseline_end_ts
    merged["horizon_start"] = horizon_start_ts
    merged["horizon_end"] = horizon_end_ts

    output_columns = [
        "platform",
        "product_name",
        "seller_sku_resolved",
        "baseline_start",
        "baseline_end",
        "horizon_start",
        "horizon_end",
        "sales_units_in_baseline",
        "sample_units_in_baseline",
        "units_used_for_velocity",
        "gross_sales_in_baseline",
        "avg_daily_gross_sales",
        "avg_daily_demand",
        "forecast_daily_demand",
        "forecast_units",
        "on_hand",
        "in_transit",
        "counted_in_transit",
        "current_supply_units",
        "lead_time_days",
        "lead_time_demand_units",
        "safety_stock_weeks",
        "safety_stock_units",
        "reorder_point_units",
        "target_stock_units",
        "recommended_order_units",
        "days_of_supply",
        "weeks_of_supply",
        "projected_stockout_date",
        "transit_started_on",
        "transit_eta",
        "reorder_date",
        "status",
    ]
    return merged.reindex(columns=output_columns).sort_values(
        ["recommended_order_units", "forecast_units", "product_name"],
        ascending=[False, False, True],
    ).reset_index(drop=True)
