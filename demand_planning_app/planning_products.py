from __future__ import annotations

from typing import Any

import pandas as pd


PRODUCT_CATALOG = {
    "Birria Bomb 2-Pack": {"list_price": 19.99, "cogs": 3.10},
    "Chile Colorado Bomb 2-Pack": {
        "list_price": 19.99,
        "cogs": 3.95,
        "launch_date": "2026-04-29",
        "launch_inbound_units": 12096.0,
        "launch_transit_eta": "2026-04-29",
        "launch_proxy_product": "Pozole Verde Bomb 2-Pack",
        "launch_strength_pct": 100.0,
        "launch_sample_units": 0.0,
        "launch_bundle_uplift_pct": 0.0,
        "launch_cover_weeks_target": 5.0,
    },
    "Pozole Bomb 2-Pack": {"list_price": 19.99, "cogs": 3.05},
    "Tinga Bomb 2-Pack": {"list_price": 19.99, "cogs": 3.15},
    "Pozole Verde Bomb 2-Pack": {
        "list_price": 19.99,
        "cogs": 3.75,
        "launch_date": "2026-03-10",
    },
    "Brine Bomb": {"list_price": 19.99, "cogs": 4.20},
    "Variety Pack": {"list_price": 49.99, "cogs": 13.35},
}


def get_product_metadata(product_name: str) -> dict[str, Any]:
    return dict(PRODUCT_CATALOG.get(str(product_name or ""), {}))


def get_launch_inventory_defaults(product_name: str) -> dict[str, Any]:
    metadata = get_product_metadata(product_name)
    inbound_units = float(metadata.get("launch_inbound_units", 0.0) or 0.0)
    transit_eta = pd.to_datetime(metadata.get("launch_transit_eta"), errors="coerce")
    return {
        "on_hand": 0.0,
        "in_transit": inbound_units,
        "transit_started_on": pd.NaT,
        "transit_eta": transit_eta if pd.notna(transit_eta) else pd.NaT,
    }


def get_launch_date(product_name: str) -> pd.Timestamp | pd.NaT:
    metadata = get_product_metadata(product_name)
    launch_date = pd.to_datetime(metadata.get("launch_date"), errors="coerce")
    return launch_date.normalize() if pd.notna(launch_date) else pd.NaT


def get_active_fraction_for_period(
    product_name: str,
    period_start: str | pd.Timestamp,
    period_end: str | pd.Timestamp,
) -> float:
    launch_date = get_launch_date(product_name)
    start = pd.Timestamp(period_start).normalize()
    end = pd.Timestamp(period_end).normalize()
    if end < start:
        return 0.0
    if pd.isna(launch_date) or launch_date <= start:
        return 1.0
    if launch_date > end:
        return 0.0
    total_days = int((end - start).days) + 1
    active_days = int((end - launch_date).days) + 1
    if total_days <= 0:
        return 0.0
    return max(min(active_days / total_days, 1.0), 0.0)


def detect_planning_components(product_name: str) -> tuple[list[tuple[str, int]], str]:
    name = str(product_name or "").lower()
    if not name:
        return [], "No product name"
    if "variety pack" in name:
        return [("Variety Pack", 1)], "Mapped to Variety Pack"

    components: list[str] = []
    has_chile_colorado = "chile colorado" in name
    has_pozole_verde = "pozole verde" in name
    if has_chile_colorado:
        components.append("Chile Colorado Bomb 2-Pack")
    has_regular_pozole = (
        "pozole verde and pozole" in name
        or "pozole verde + pozole" in name
        or ("pozole" in name and "pozole verde" not in name)
    )
    if has_pozole_verde:
        components.append("Pozole Verde Bomb 2-Pack")
    if "birria" in name:
        components.append("Birria Bomb 2-Pack")
    if "tinga" in name:
        components.append("Tinga Bomb 2-Pack")
    if "brine" in name:
        components.append("Brine Bomb")
    if has_regular_pozole:
        components.append("Pozole Bomb 2-Pack")

    deduped: list[str] = []
    seen: set[str] = set()
    for component in components:
        if component not in seen:
            deduped.append(component)
            seen.add(component)
    if not deduped:
        return [], "No canonical planning product match"
    if "bundle" in name:
        if len(deduped) == 1:
            return [(deduped[0], 2)], "Single-flavor bundle mapped to 2 units"
        return [(component, 1) for component in deduped], "Mixed bundle exploded into component units"
    return [(deduped[0], 1)], "Standard listing mapped to single planning product"


def build_primary_sku_lookup(normalized_orders: pd.DataFrame) -> dict[str, str]:
    if normalized_orders is None or normalized_orders.empty:
        return {}

    lookup: dict[str, str] = {}
    for row in normalized_orders.to_dict(orient="records"):
        seller_sku = str(row.get("seller_sku_resolved") or "").strip()
        if not seller_sku:
            continue
        product_name = str(row.get("product_name") or "")
        components, _reason = detect_planning_components(product_name)
        lowered = product_name.lower()
        if "bundle" in lowered:
            continue
        if len(components) != 1:
            continue
        component_name, multiplier = components[0]
        if multiplier != 1:
            continue
        lookup.setdefault(component_name, seller_sku)
    return lookup


def build_product_catalog_frame() -> pd.DataFrame:
    rows = [
        {"product_name": product_name, "list_price": values["list_price"], "cogs": values["cogs"]}
        for product_name, values in PRODUCT_CATALOG.items()
    ]
    return pd.DataFrame(rows).sort_values("product_name").reset_index(drop=True)
