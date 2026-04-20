from __future__ import annotations

from pathlib import Path

import pandas as pd

from demand_planning_app.normalize import normalize_orders_frame
from demand_planning_app.planning_products import PRODUCT_CATALOG, build_primary_sku_lookup, get_launch_inventory_defaults


ORDER_READ_COLUMNS = [
    "Order ID",
    "Order Status",
    "Order Substatus",
    "Cancelation/Return Type",
    "Cancellation/Return Type",
    "Cancelled Time",
    "Canceled Time",
    "Shipped Time",
    "Delivered Time",
    "Seller SKU",
    "Product Name",
    "Virtual Bundle Seller SKU",
    " Virtual Bundle Seller SKU",
    "Buyer Username",
    "Buyer Nickname",
    "Recipient",
    "City",
    "State",
    "Zipcode",
    "Zip Code",
    "Quantity",
    "Sku Quantity of return",
    "SKU Quantity of return",
    "SKU Subtotal Before Discount",
    "SKU Subtotal After Discount",
    "Order Refund Amount",
    "Paid Time",
    "Created Time",
]


def _load_order_like_folder(root_dir: Path, folder_name: str, *, platform: str) -> pd.DataFrame:
    source_dir = Path(root_dir) / folder_name
    if not source_dir.exists():
        return pd.DataFrame(columns=[])

    frames: list[pd.DataFrame] = []
    for path in sorted(source_dir.glob("*.csv")):
        header = pd.read_csv(path, nrows=0)
        present_columns = [column for column in header.columns if str(column).strip() in ORDER_READ_COLUMNS]
        if not present_columns:
            continue
        frame = pd.read_csv(
            path,
            dtype=str,
            keep_default_na=False,
            usecols=present_columns,
        )
        normalized = normalize_orders_frame(frame, platform=platform)
        if not normalized.empty:
            frames.append(normalized)
    if not frames:
        return pd.DataFrame(columns=[])
    return pd.concat(frames, ignore_index=True)


def load_orders_from_folder(root_dir: Path, *, platform: str) -> pd.DataFrame:
    return _load_order_like_folder(root_dir, "All orders", platform=platform)


def load_samples_from_folder(root_dir: Path, *, platform: str) -> pd.DataFrame:
    return _load_order_like_folder(root_dir, "Samples", platform=platform)


def build_inventory_template(normalized_orders: pd.DataFrame) -> pd.DataFrame:
    sku_lookup = build_primary_sku_lookup(normalized_orders)
    rows = [
        {
            "product_name": product_name,
            "seller_sku_resolved": sku_lookup.get(product_name, ""),
            **get_launch_inventory_defaults(product_name),
            "lead_time_days": "",
            "case_pack": "",
            "moq": "",
        }
        for product_name in PRODUCT_CATALOG.keys()
    ]
    return pd.DataFrame(rows).sort_values("product_name").reset_index(drop=True)
