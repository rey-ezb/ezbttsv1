from __future__ import annotations

from typing import Any

import pandas as pd


def _empty_frame(columns: list[str]) -> pd.DataFrame:
    return pd.DataFrame(columns=columns)


def _first_non_blank(series: pd.Series) -> str:
    values = series.astype("string").fillna("").str.strip()
    non_blank = values.loc[values.ne("")]
    return str(non_blank.iloc[0]) if not non_blank.empty else ""


def _valid_order_lines(normalized_orders: pd.DataFrame) -> pd.DataFrame:
    if normalized_orders is None or normalized_orders.empty:
        return pd.DataFrame(columns=normalized_orders.columns if normalized_orders is not None else [])
    return normalized_orders.loc[~normalized_orders["is_cancelled"].fillna(False)].copy()


def build_order_level_metrics(normalized_orders: pd.DataFrame) -> pd.DataFrame:
    columns = [
        "platform",
        "source_type",
        "order_id",
        "reporting_date",
        "customer_id",
        "customer_id_source",
        "city",
        "state",
        "zipcode",
        "is_paid",
        "is_cancelled",
        "is_refunded",
        "is_returned",
        "is_shipped",
        "is_delivered",
        "units_sold",
        "returned_units",
        "gross_product_sales",
        "net_product_sales",
        "order_refund_amount",
    ]
    if normalized_orders is None or normalized_orders.empty:
        return _empty_frame(columns)

    working = normalized_orders.copy()
    working["reporting_date"] = pd.to_datetime(working["order_date"], errors="coerce").dt.normalize()
    grouped = (
        working.sort_values(["reporting_date", "order_id"])
        .groupby("order_id", as_index=False)
        .agg(
            platform=("platform", "first"),
            source_type=("platform", lambda _: "Sales"),
            reporting_date=("reporting_date", "min"),
            customer_id=("customer_id", _first_non_blank),
            customer_id_source=("customer_id_source", _first_non_blank),
            city=("city", _first_non_blank),
            state=("state", _first_non_blank),
            zipcode=("zipcode", _first_non_blank),
            is_paid=("is_paid", "max"),
            is_cancelled=("is_cancelled", "max"),
            is_refunded=("is_refunded", "max"),
            is_returned=("is_returned", "max"),
            is_shipped=("is_shipped", "max"),
            is_delivered=("is_delivered", "max"),
            units_sold=("quantity", "sum"),
            returned_units=("returned_quantity", "sum"),
            gross_product_sales=("gross_sales", "sum"),
            net_product_sales=("net_product_sales", "sum"),
            order_refund_amount=("order_refund_amount", "max"),
        )
        .reset_index(drop=True)
    )
    return grouped.reindex(columns=columns)


def build_tiktok_kpi_tables(normalized_orders: pd.DataFrame) -> dict[str, pd.DataFrame]:
    order_level_columns = [
        "platform",
        "source_type",
        "order_id",
        "reporting_date",
        "customer_id",
        "customer_id_source",
        "city",
        "state",
        "zipcode",
        "is_paid",
        "is_cancelled",
        "is_refunded",
        "is_returned",
        "is_shipped",
        "is_delivered",
        "units_sold",
        "returned_units",
        "gross_product_sales",
        "net_product_sales",
        "order_refund_amount",
    ]
    orders_summary_columns = [
        "platform",
        "date_start",
        "date_end",
        "total_orders",
        "gross_product_sales",
        "net_product_sales",
        "paid_orders",
        "valid_orders",
        "delivered_orders",
        "shipped_orders",
        "canceled_orders",
        "refunded_orders",
        "returned_orders",
        "refund_amount",
        "returned_units",
        "units_sold",
        "units_per_paid_order",
        "aov",
        "unique_customers",
        "repeat_customers",
        "first_time_customers",
        "returning_customers",
        "repeat_customer_rate",
        "first_time_customer_rate",
        "customer_id_basis",
    ]
    orders_daily_columns = [
        "platform",
        "reporting_date",
        "total_orders",
        "gross_product_sales",
        "net_product_sales",
        "paid_orders",
        "valid_orders",
        "delivered_orders",
        "shipped_orders",
        "canceled_orders",
        "refunded_orders",
        "returned_orders",
        "units_sold",
        "unique_customers",
    ]
    products_daily_columns = [
        "platform",
        "reporting_date",
        "product_name",
        "seller_sku_resolved",
        "gross_product_sales",
        "net_product_sales",
        "units_sold",
        "paid_orders",
        "valid_orders",
    ]
    customer_rollup_columns = [
        "platform",
        "customer_id",
        "customer_id_source",
        "first_order_date",
        "last_order_date",
        "paid_order_count",
        "valid_order_count",
        "gross_product_sales",
        "net_product_sales",
        "units_sold",
        "city",
        "state",
        "zipcode",
        "is_repeat_customer",
    ]
    location_columns = [
        "platform",
        "city",
        "state",
        "zipcode",
        "unique_customers",
        "orders",
        "gross_product_sales",
        "net_product_sales",
        "units_sold",
    ]
    audit_columns = [
        "platform",
        "date_start",
        "date_end",
        "rows_loaded",
        "orders_loaded",
        "blank_customer_rows",
        "rows_without_city",
        "rows_without_zip",
        "canceled_rows",
        "customer_id_basis",
    ]
    empty = {
        "kpi_orders_summary": _empty_frame(orders_summary_columns),
        "kpi_order_level": _empty_frame(order_level_columns),
        "kpi_orders_daily": _empty_frame(orders_daily_columns),
        "kpi_products_daily": _empty_frame(products_daily_columns),
        "kpi_customer_rollup": _empty_frame(customer_rollup_columns),
        "kpi_cities": _empty_frame(["platform", "city", "state", "unique_customers", "orders", "gross_product_sales", "net_product_sales", "units_sold"]),
        "kpi_zips": _empty_frame(location_columns),
        "kpi_orders_audit": _empty_frame(audit_columns),
    }
    if normalized_orders is None or normalized_orders.empty:
        return empty

    order_level = build_order_level_metrics(normalized_orders)
    valid_order_level = order_level.loc[~order_level["is_cancelled"].fillna(False)].copy()
    valid_lines = _valid_order_lines(normalized_orders)

    if valid_order_level.empty:
        customer_rollup = _empty_frame(customer_rollup_columns)
    else:
        customer_rollup = (
            valid_order_level.loc[valid_order_level["customer_id"].astype("string").str.strip().ne("")]
            .sort_values("reporting_date")
            .groupby("customer_id", as_index=False)
            .agg(
                platform=("platform", "first"),
                customer_id_source=("customer_id_source", _first_non_blank),
                first_order_date=("reporting_date", "min"),
                last_order_date=("reporting_date", "max"),
                paid_order_count=("is_paid", "sum"),
                valid_order_count=("order_id", "count"),
                gross_product_sales=("gross_product_sales", "sum"),
                net_product_sales=("net_product_sales", "sum"),
                units_sold=("units_sold", "sum"),
                city=("city", _first_non_blank),
                state=("state", _first_non_blank),
                zipcode=("zipcode", _first_non_blank),
            )
            .reset_index(drop=True)
        )
        if not customer_rollup.empty:
            customer_rollup["is_repeat_customer"] = customer_rollup["valid_order_count"].gt(1)
            customer_rollup = customer_rollup.reindex(columns=customer_rollup_columns)

    unique_customers = int(customer_rollup["customer_id"].nunique()) if not customer_rollup.empty else 0
    repeat_customers = int(customer_rollup["is_repeat_customer"].sum()) if not customer_rollup.empty else 0
    first_time_customers = unique_customers - repeat_customers

    summary = pd.DataFrame(
        [
            {
                "platform": str(order_level["platform"].iloc[0] or "TikTok"),
                "date_start": order_level["reporting_date"].min(),
                "date_end": order_level["reporting_date"].max(),
                "total_orders": int(order_level["order_id"].nunique()),
                "gross_product_sales": float(valid_order_level["gross_product_sales"].sum()) if not valid_order_level.empty else 0.0,
                "net_product_sales": float(valid_order_level["net_product_sales"].sum()) if not valid_order_level.empty else 0.0,
                "paid_orders": int(valid_order_level["is_paid"].fillna(False).sum()) if not valid_order_level.empty else 0,
                "valid_orders": int(valid_order_level["order_id"].nunique()) if not valid_order_level.empty else 0,
                "delivered_orders": int(valid_order_level["is_delivered"].fillna(False).sum()) if not valid_order_level.empty else 0,
                "shipped_orders": int(valid_order_level["is_shipped"].fillna(False).sum()) if not valid_order_level.empty else 0,
                "canceled_orders": int(order_level["is_cancelled"].fillna(False).sum()),
                "refunded_orders": int(order_level["is_refunded"].fillna(False).sum()),
                "returned_orders": int(order_level["is_returned"].fillna(False).sum()),
                "refund_amount": float(order_level["order_refund_amount"].sum()),
                "returned_units": float(order_level["returned_units"].sum()),
                "units_sold": float(valid_order_level["units_sold"].sum()) if not valid_order_level.empty else 0.0,
                "units_per_paid_order": (
                    float(valid_order_level["units_sold"].sum()) / float(valid_order_level["is_paid"].sum())
                    if not valid_order_level.empty and float(valid_order_level["is_paid"].sum()) > 0
                    else 0.0
                ),
                "aov": (
                    float(valid_order_level["gross_product_sales"].sum()) / float(valid_order_level["is_paid"].sum())
                    if not valid_order_level.empty and float(valid_order_level["is_paid"].sum()) > 0
                    else 0.0
                ),
                "unique_customers": unique_customers,
                "repeat_customers": repeat_customers,
                "first_time_customers": first_time_customers,
                "returning_customers": repeat_customers,
                "repeat_customer_rate": (repeat_customers / unique_customers) if unique_customers else 0.0,
                "first_time_customer_rate": (first_time_customers / unique_customers) if unique_customers else 0.0,
                "customer_id_basis": "Buyer Username -> Buyer Nickname -> Recipient",
            }
        ]
    ).reindex(columns=orders_summary_columns)

    daily_rows: list[dict[str, Any]] = []
    for reporting_date, group in order_level.groupby("reporting_date"):
        valid_group = group.loc[~group["is_cancelled"].fillna(False)]
        valid_customer_ids = valid_group["customer_id"].astype("string").str.strip()
        daily_rows.append(
            {
                "platform": str(group["platform"].iloc[0] or "TikTok"),
                "reporting_date": reporting_date,
                "total_orders": int(group["order_id"].nunique()),
                "gross_product_sales": float(valid_group["gross_product_sales"].sum()),
                "net_product_sales": float(valid_group["net_product_sales"].sum()),
                "paid_orders": int(valid_group["is_paid"].fillna(False).sum()),
                "valid_orders": int(valid_group["order_id"].nunique()),
                "delivered_orders": int(valid_group["is_delivered"].fillna(False).sum()),
                "shipped_orders": int(valid_group["is_shipped"].fillna(False).sum()),
                "canceled_orders": int(group["is_cancelled"].fillna(False).sum()),
                "refunded_orders": int(group["is_refunded"].fillna(False).sum()),
                "returned_orders": int(group["is_returned"].fillna(False).sum()),
                "units_sold": float(valid_group["units_sold"].sum()),
                "unique_customers": int(valid_customer_ids.loc[valid_customer_ids.ne("")].nunique()),
            }
        )
    orders_daily = pd.DataFrame(daily_rows).reindex(columns=orders_daily_columns).sort_values("reporting_date").reset_index(drop=True)

    if valid_lines.empty:
        products_daily = _empty_frame(products_daily_columns)
    else:
        products_daily = (
            valid_lines.assign(reporting_date=pd.to_datetime(valid_lines["order_date"], errors="coerce").dt.normalize())
            .groupby(["platform", "reporting_date", "product_name", "seller_sku_resolved"], as_index=False)
            .agg(
                gross_product_sales=("gross_sales", "sum"),
                net_product_sales=("net_product_sales", "sum"),
                units_sold=("quantity", "sum"),
                paid_orders=("is_paid", "sum"),
                valid_orders=("order_id", "nunique"),
            )
            .sort_values(["reporting_date", "gross_product_sales"], ascending=[True, False])
            .reset_index(drop=True)
            .reindex(columns=products_daily_columns)
        )

    valid_customers = valid_order_level.loc[valid_order_level["customer_id"].astype("string").str.strip().ne("")].copy()
    if valid_customers.empty:
        cities = _empty_frame(["platform", "city", "state", "unique_customers", "orders", "gross_product_sales", "net_product_sales", "units_sold"])
        zips = _empty_frame(location_columns)
    else:
        cities = (
            valid_customers.loc[valid_customers["city"].astype("string").str.strip().ne("")]
            .groupby(["platform", "city", "state"], as_index=False)
            .agg(
                unique_customers=("customer_id", "nunique"),
                orders=("order_id", "nunique"),
                gross_product_sales=("gross_product_sales", "sum"),
                net_product_sales=("net_product_sales", "sum"),
                units_sold=("units_sold", "sum"),
            )
            .sort_values(["gross_product_sales", "orders"], ascending=False)
            .reset_index(drop=True)
        )
        zips = (
            valid_customers.loc[valid_customers["zipcode"].astype("string").str.strip().ne("")]
            .groupby(["platform", "zipcode", "city", "state"], as_index=False)
            .agg(
                unique_customers=("customer_id", "nunique"),
                orders=("order_id", "nunique"),
                gross_product_sales=("gross_product_sales", "sum"),
                net_product_sales=("net_product_sales", "sum"),
                units_sold=("units_sold", "sum"),
            )
            .sort_values(["gross_product_sales", "orders"], ascending=False)
            .reset_index(drop=True)
        )
        zips = zips[["platform", "city", "state", "zipcode", "unique_customers", "orders", "gross_product_sales", "net_product_sales", "units_sold"]]

    audit = pd.DataFrame(
        [
            {
                "platform": str(order_level["platform"].iloc[0] or "TikTok"),
                "date_start": order_level["reporting_date"].min(),
                "date_end": order_level["reporting_date"].max(),
                "rows_loaded": int(len(normalized_orders)),
                "orders_loaded": int(order_level["order_id"].nunique()),
                "blank_customer_rows": int(normalized_orders["customer_id"].astype("string").str.strip().eq("").sum()),
                "rows_without_city": int(normalized_orders["city"].astype("string").str.strip().eq("").sum()),
                "rows_without_zip": int(normalized_orders["zipcode"].astype("string").str.strip().eq("").sum()),
                "canceled_rows": int(normalized_orders["is_cancelled"].fillna(False).sum()),
                "customer_id_basis": "Buyer Username -> Buyer Nickname -> Recipient",
            }
        ]
    ).reindex(columns=audit_columns)

    return {
        "kpi_orders_summary": summary,
        "kpi_order_level": order_level.reindex(columns=order_level_columns),
        "kpi_orders_daily": orders_daily,
        "kpi_products_daily": products_daily,
        "kpi_customer_rollup": customer_rollup,
        "kpi_cities": cities,
        "kpi_zips": zips,
        "kpi_orders_audit": audit,
    }


def build_tiktok_kpi_payload(tables: dict[str, pd.DataFrame]) -> dict[str, Any]:
    summary = tables.get("kpi_orders_summary", pd.DataFrame())
    daily = tables.get("kpi_orders_daily", pd.DataFrame())
    products_daily = tables.get("kpi_products_daily", pd.DataFrame())
    cities = tables.get("kpi_cities", pd.DataFrame())
    zips = tables.get("kpi_zips", pd.DataFrame())
    audit = tables.get("kpi_orders_audit", pd.DataFrame())
    customer_rollup = tables.get("kpi_customer_rollup", pd.DataFrame())

    summary_row = summary.iloc[0].to_dict() if not summary.empty else {}
    order_health = {
        "canceled_orders": summary_row.get("canceled_orders", 0),
        "refunded_orders": summary_row.get("refunded_orders", 0),
        "returned_orders": summary_row.get("returned_orders", 0),
        "delivered_orders": summary_row.get("delivered_orders", 0),
        "shipped_orders": summary_row.get("shipped_orders", 0),
        "valid_orders": summary_row.get("valid_orders", 0),
        "paid_orders": summary_row.get("paid_orders", 0),
    }
    product_totals = (
        products_daily.groupby(["product_name", "seller_sku_resolved"], as_index=False)
        .agg(
            gross_product_sales=("gross_product_sales", "sum"),
            net_product_sales=("net_product_sales", "sum"),
            units_sold=("units_sold", "sum"),
            paid_orders=("paid_orders", "sum"),
            valid_orders=("valid_orders", "sum"),
        )
        .sort_values(["gross_product_sales", "units_sold"], ascending=False)
        .reset_index(drop=True)
    ) if not products_daily.empty else pd.DataFrame()
    return {
        "summary": summary_row,
        "orderHealth": order_health,
        "dailyRows": daily.sort_values("reporting_date", ascending=False).head(60).to_dict(orient="records") if not daily.empty else [],
        "productRows": product_totals.head(20).to_dict(orient="records") if not product_totals.empty else [],
        "cityRows": cities.head(20).to_dict(orient="records") if not cities.empty else [],
        "zipRows": zips.head(20).to_dict(orient="records") if not zips.empty else [],
        "auditRows": audit.to_dict(orient="records") if not audit.empty else [],
        "customerRows": customer_rollup.sort_values("valid_order_count", ascending=False).head(20).to_dict(orient="records") if not customer_rollup.empty else [],
    }
