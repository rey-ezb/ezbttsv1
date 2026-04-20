from __future__ import annotations

import math
import re
from typing import Any

import pandas as pd


ORDER_OUTPUT_COLUMNS = [
    "platform",
    "order_id",
    "order_date",
    "order_status",
    "order_substatus",
    "cancellation_return_type",
    "product_name",
    "seller_sku",
    "seller_sku_resolved",
    "quantity",
    "returned_quantity",
    "gross_sales",
    "net_product_sales",
    "order_refund_amount",
    "net_units",
    "is_paid",
    "is_cancelled",
    "is_refunded",
    "is_returned",
    "is_shipped",
    "is_delivered",
    "customer_id",
    "customer_id_source",
    "city",
    "state",
    "zipcode",
]


def canonical_product_name(product_name: str) -> str:
    name = _clean_text(product_name).lower()
    if not name:
        return "Unmapped Item"
    if "variety pack" in name and "pozole verde" in name:
        return "4-Flavor Variety Pack"
    if "variety pack" in name:
        return "Variety Pack"
    if "pozole verde" in name:
        if "bundle" in name:
            if "birria" in name:
                return "Pozole Verde + Birria Bundle"
            if "tinga" in name:
                return "Pozole Verde + Tinga Bundle"
            if "pozole verde and pozole" in name or "pozole verde + pozole" in name:
                return "Pozole Verde + Pozole Bundle"
            return "Pozole Verde Bundle"
        return "Pozole Verde Bomb 2-Pack"
    if "brine" in name:
        return "Brine Bomb"
    has_birria = "birria" in name
    has_pozole = "pozole" in name
    has_tinga = "tinga" in name
    if "bundle" in name:
        parts = []
        if has_birria:
            parts.append("Birria")
        if has_pozole:
            parts.append("Pozole")
        if has_tinga:
            parts.append("Tinga")
        if len(parts) == 1:
            return f"{parts[0]} Bundle"
        if parts:
            return " + ".join(parts) + " Bundle"
    if has_birria:
        return "Birria Bomb 2-Pack"
    if has_pozole:
        return "Pozole Bomb 2-Pack"
    if has_tinga:
        return "Tinga Bomb 2-Pack"
    return _clean_text(product_name) or "Unmapped Item"


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except TypeError:
        pass
    if isinstance(value, float) and math.isnan(value):
        return ""
    return re.sub(r"\s+", " ", str(value).replace("\ufeff", "").replace("\u200b", " ")).strip()


def _normalized_column_name(value: str) -> str:
    return " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in str(value)).split())


def _pick_column(columns: list[str], exact_candidates: list[str], keyword_groups: list[tuple[str, ...]]) -> str | None:
    normalized_map = {column: _normalized_column_name(column) for column in columns}
    exact = {_normalized_column_name(candidate) for candidate in exact_candidates}
    for column, normalized in normalized_map.items():
        if normalized in exact:
            return column
    for keywords in keyword_groups:
        for column, normalized in normalized_map.items():
            if all(keyword in normalized for keyword in keywords):
                return column
    return None


def _series(df: pd.DataFrame, column: str | None) -> pd.Series:
    if not column or column not in df.columns:
        return pd.Series("", index=df.index, dtype="string")
    return df[column].map(_clean_text).astype("string")


def _numeric_series(df: pd.DataFrame, column: str | None) -> pd.Series:
    if not column or column not in df.columns:
        return pd.Series(0.0, index=df.index, dtype="float64")
    cleaned = (
        df[column]
        .astype("string")
        .fillna("")
        .str.replace(",", "", regex=False)
        .str.replace("$", "", regex=False)
        .str.replace(r"^\((.*)\)$", r"-\1", regex=True)
        .str.strip()
        .replace({"": pd.NA, "nan": pd.NA, "None": pd.NA})
    )
    return pd.to_numeric(cleaned, errors="coerce").fillna(0.0)


def _datetime_series(df: pd.DataFrame, column: str | None) -> pd.Series:
    if not column or column not in df.columns:
        return pd.Series(pd.NaT, index=df.index, dtype="datetime64[ns]")
    values = _series(df, column)
    parsed = pd.to_datetime(values, format="%m/%d/%Y %I:%M:%S %p", errors="coerce")
    missing = parsed.isna() & values.astype("string").str.strip().ne("")
    if missing.any():
        parsed.loc[missing] = pd.to_datetime(values.loc[missing], errors="coerce")
    return parsed


def _normalize_zip(value: Any) -> str:
    digits = "".join(ch for ch in _clean_text(value) if ch.isdigit())
    return digits[:5] if len(digits) >= 5 else ""


def normalize_orders_frame(raw_df: pd.DataFrame, *, platform: str) -> pd.DataFrame:
    if raw_df is None or raw_df.empty:
        return pd.DataFrame(columns=ORDER_OUTPUT_COLUMNS)

    df = raw_df.copy()
    df.columns = [str(column).strip() for column in df.columns]
    available = list(df.columns)

    order_id_col = _pick_column(available, ["Order ID"], [("order", "id")])
    order_status_col = _pick_column(available, ["Order Status"], [("order", "status")])
    order_substatus_col = _pick_column(available, ["Order Substatus"], [("order", "substatus")])
    cancel_type_col = _pick_column(
        available,
        ["Cancelation/Return Type", "Cancellation/Return Type"],
        [("cancel", "return", "type")],
    )
    product_name_col = _pick_column(available, ["Product Name"], [("product", "name")])
    seller_sku_col = _pick_column(available, ["Seller SKU"], [("seller", "sku")])
    bundle_sku_col = _pick_column(
        available,
        ["Virtual Bundle Seller SKU", '" Virtual Bundle Seller SKU"'],
        [("virtual", "bundle", "seller", "sku")],
    )
    quantity_col = _pick_column(available, ["Quantity"], [("quantity",)])
    returned_quantity_col = _pick_column(
        available,
        ["Sku Quantity of return", "SKU Quantity of return"],
        [("return", "quantity")],
    )
    gross_sales_col = _pick_column(
        available,
        ["SKU Subtotal Before Discount"],
        [("sku", "subtotal", "before", "discount")],
    )
    net_product_sales_col = _pick_column(
        available,
        ["SKU Subtotal After Discount"],
        [("sku", "subtotal", "after", "discount")],
    )
    order_refund_amount_col = _pick_column(
        available,
        ["Order Refund Amount"],
        [("order", "refund", "amount")],
    )
    paid_time_col = _pick_column(available, ["Paid Time"], [("paid", "time")])
    created_time_col = _pick_column(available, ["Created Time"], [("created", "time")])
    shipped_time_col = _pick_column(available, ["Shipped Time"], [("shipped", "time")])
    delivered_time_col = _pick_column(available, ["Delivered Time"], [("delivered", "time")])
    cancelled_time_col = _pick_column(
        available,
        ["Cancelled Time", "Canceled Time"],
        [("cancelled", "time"), ("canceled", "time")],
    )
    buyer_username_col = _pick_column(available, ["Buyer Username"], [("buyer", "username")])
    buyer_nickname_col = _pick_column(available, ["Buyer Nickname"], [("buyer", "nickname")])
    recipient_col = _pick_column(available, ["Recipient"], [("recipient",)])
    city_col = _pick_column(available, ["City"], [("city",)])
    state_col = _pick_column(available, ["State"], [("state",)])
    zipcode_col = _pick_column(available, ["Zipcode", "Zip Code"], [("zip",), ("zipcode",)])

    normalized = pd.DataFrame(index=df.index)
    normalized["platform"] = str(platform or "").strip() or "Unknown"
    normalized["order_id"] = _series(df, order_id_col)
    normalized["order_status"] = _series(df, order_status_col)
    normalized["order_substatus"] = _series(df, order_substatus_col)
    normalized["cancellation_return_type"] = _series(df, cancel_type_col)
    normalized["product_name"] = _series(df, product_name_col)
    normalized["seller_sku"] = _series(df, seller_sku_col)
    bundle_series = _series(df, bundle_sku_col)
    normalized["seller_sku_resolved"] = normalized["seller_sku"].where(normalized["seller_sku"].ne(""), bundle_series)
    normalized["quantity"] = _numeric_series(df, quantity_col)
    normalized["returned_quantity"] = _numeric_series(df, returned_quantity_col)
    normalized["gross_sales"] = _numeric_series(df, gross_sales_col)
    normalized["net_product_sales"] = _numeric_series(df, net_product_sales_col)
    normalized["order_refund_amount"] = _numeric_series(df, order_refund_amount_col)
    paid_time = _datetime_series(df, paid_time_col)
    created_time = _datetime_series(df, created_time_col)
    shipped_time = _datetime_series(df, shipped_time_col)
    delivered_time = _datetime_series(df, delivered_time_col)
    cancelled_time = _datetime_series(df, cancelled_time_col)
    normalized["order_date"] = paid_time.dt.normalize().fillna(created_time.dt.normalize())

    status_text = (
        normalized["order_status"].astype("string").fillna("")
        + " "
        + normalized["order_substatus"].astype("string").fillna("")
        + " "
        + normalized["cancellation_return_type"].astype("string").fillna("")
    ).str.lower()
    normalized["is_paid"] = paid_time.notna()
    normalized["is_cancelled"] = status_text.str.contains("cancel", na=False) | cancelled_time.notna()
    normalized["is_refunded"] = normalized["order_refund_amount"].gt(0) | status_text.str.contains("refund", na=False)
    normalized["is_returned"] = normalized["returned_quantity"].gt(0) | status_text.str.contains("return", na=False)
    normalized["is_shipped"] = shipped_time.notna() | status_text.str.contains("shipped|in transit|awaiting collection", na=False)
    normalized["is_delivered"] = delivered_time.notna() | status_text.str.contains("delivered|completed", na=False)
    normalized["net_units"] = (normalized["quantity"] - normalized["returned_quantity"]).clip(lower=0)
    normalized.loc[normalized["is_cancelled"], "net_units"] = 0.0
    normalized["net_product_sales"] = normalized["net_product_sales"].where(
        normalized["net_product_sales"].ne(0),
        normalized["gross_sales"],
    )

    customer_values = [
        ("Buyer Username", _series(df, buyer_username_col)),
        ("Buyer Nickname", _series(df, buyer_nickname_col)),
        ("Recipient", _series(df, recipient_col)),
    ]
    customer_id = pd.Series("", index=df.index, dtype="string")
    customer_id_source = pd.Series("", index=df.index, dtype="string")
    for label, values in customer_values:
        use_mask = customer_id.str.len().eq(0) & values.str.len().gt(0)
        customer_id = customer_id.mask(use_mask, values)
        customer_id_source = customer_id_source.mask(use_mask, label)
    normalized["customer_id"] = customer_id
    normalized["customer_id_source"] = customer_id_source
    normalized["city"] = _series(df, city_col)
    normalized["state"] = _series(df, state_col).str.upper()
    normalized["zipcode"] = _series(df, zipcode_col).map(_normalize_zip).astype("string")

    return normalized.loc[normalized["order_date"].notna()].reindex(columns=ORDER_OUTPUT_COLUMNS).reset_index(drop=True)
