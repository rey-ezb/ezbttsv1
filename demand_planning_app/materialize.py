from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from demand_planning_app.inventory_sheet import INVENTORY_HISTORY_COLUMNS, load_inventory_history
from demand_planning_app.planning_products import (
    PRODUCT_CATALOG,
    build_product_catalog_frame,
    detect_planning_components,
)
from demand_planning_app.repository import load_orders_from_folder

def retable_orders_to_planning_facts(normalized_orders: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    if normalized_orders is None or normalized_orders.empty:
        return (
            pd.DataFrame(columns=["platform", "date", "product_name", "units_sold", "returned_units", "net_units"]),
            pd.DataFrame(columns=["raw_product_name", "reason", "order_rows", "units_sold", "returned_units", "net_units"]),
        )

    planning_rows: list[dict[str, Any]] = []
    unmapped_rows: list[dict[str, Any]] = []
    for row in normalized_orders.to_dict(orient="records"):
        product_name = str(row.get("product_name") or "")
        components, reason = detect_planning_components(product_name)
        returned_units = float(row.get("returned_quantity") or 0.0)
        net_units = float(row.get("net_units") or 0.0)
        units_sold = net_units + returned_units
        if not components:
            unmapped_rows.append(
                {
                    "raw_product_name": product_name or "Unmapped Item",
                    "reason": reason,
                    "order_rows": 1,
                    "units_sold": units_sold,
                    "returned_units": returned_units,
                    "net_units": net_units,
                }
            )
            continue

        for component_name, multiplier in components:
            planning_rows.append(
                {
                    "platform": str(row.get("platform") or "").strip() or "Unknown",
                    "date": pd.Timestamp(row.get("order_date")).normalize(),
                    "product_name": component_name,
                    "units_sold": units_sold * multiplier,
                    "returned_units": returned_units * multiplier,
                    "net_units": net_units * multiplier,
                }
            )

    planning_frame = pd.DataFrame(planning_rows)
    if planning_frame.empty:
        planning_frame = pd.DataFrame(columns=["platform", "date", "product_name", "units_sold", "returned_units", "net_units"])
    unmapped_frame = pd.DataFrame(unmapped_rows)
    if not unmapped_frame.empty:
        unmapped_frame = (
            unmapped_frame.groupby(["raw_product_name", "reason"], as_index=False)
            .agg(
                order_rows=("order_rows", "sum"),
                units_sold=("units_sold", "sum"),
                returned_units=("returned_units", "sum"),
                net_units=("net_units", "sum"),
            )
            .sort_values(["net_units", "units_sold", "raw_product_name"], ascending=[False, False, True])
            .reset_index(drop=True)
        )
    else:
        unmapped_frame = pd.DataFrame(columns=["raw_product_name", "reason", "order_rows", "units_sold", "returned_units", "net_units"])
    return planning_frame, unmapped_frame


def build_daily_demand_table(retabled_orders: pd.DataFrame) -> pd.DataFrame:
    if retabled_orders is None or retabled_orders.empty:
        return pd.DataFrame(columns=["platform", "date", "product_name", "units_sold", "returned_units", "net_units"])

    return (
        retabled_orders.groupby(["platform", "date", "product_name"], as_index=False)
        .agg(
            units_sold=("units_sold", "sum"),
            returned_units=("returned_units", "sum"),
            net_units=("net_units", "sum"),
        )
        .sort_values(["date", "platform", "product_name"])
        .reset_index(drop=True)
    )

def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_materialized_planning_dataset(
    data_root: Path,
    output_dir: Path,
    *,
    platform: str,
    inventory_sheet_source: str | Path | None = None,
    inventory_history: pd.DataFrame | None = None,
) -> dict[str, Any]:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    normalized_orders = load_orders_from_folder(Path(data_root), platform=platform)
    retabled_orders, unmapped_titles = retable_orders_to_planning_facts(normalized_orders)
    demand_daily = build_daily_demand_table(retabled_orders)
    product_catalog = build_product_catalog_frame()
    if inventory_history is None and inventory_sheet_source is not None:
        inventory_history = load_inventory_history(inventory_sheet_source, channel=platform)
    if inventory_history is None:
        inventory_history = pd.DataFrame(columns=INVENTORY_HISTORY_COLUMNS)
    inventory_history = inventory_history.copy()

    demand_daily_path = output_dir / "planning_demand_daily.csv"
    inventory_daily_path = output_dir / "planning_inventory_daily.csv"
    product_catalog_path = output_dir / "planning_product_catalog.csv"
    unmapped_path = output_dir / "planning_unmapped_titles.csv"
    metadata_path = output_dir / "planning_metadata.json"

    demand_daily.to_csv(demand_daily_path, index=False)
    inventory_history.to_csv(inventory_daily_path, index=False)
    product_catalog.to_csv(product_catalog_path, index=False)
    unmapped_titles.to_csv(unmapped_path, index=False)

    summary = {
        "orders_loaded": int(len(normalized_orders)),
        "retabled_rows": int(len(retabled_orders)),
        "daily_rows": int(len(demand_daily)),
        "inventory_rows": int(len(inventory_history)),
        "inventory_dates": int(inventory_history["date"].nunique()) if not inventory_history.empty else 0,
        "products_in_demand": int(demand_daily["product_name"].nunique()) if not demand_daily.empty else 0,
        "catalog_rows": int(len(product_catalog)),
        "unmapped_titles": int(len(unmapped_titles)),
        "files": {
            "planning_demand_daily.csv": demand_daily_path.stat().st_size,
            "planning_inventory_daily.csv": inventory_daily_path.stat().st_size,
            "planning_product_catalog.csv": product_catalog_path.stat().st_size,
            "planning_unmapped_titles.csv": unmapped_path.stat().st_size,
        },
    }
    _write_json(metadata_path, summary)
    return {
        "summary": summary,
        "paths": {
            "demand_daily": str(demand_daily_path),
            "inventory_daily": str(inventory_daily_path),
            "product_catalog": str(product_catalog_path),
            "unmapped_titles": str(unmapped_path),
            "metadata": str(metadata_path),
        },
    }
