import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

import app as preview_app


class AppStateTests(unittest.TestCase):
    def test_load_saved_state_replaces_partial_kpi_cache_with_fallback_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            workspace_state = root / "workspace_state"
            workspace_state.mkdir()

            pd.DataFrame([{"date": pd.Timestamp("2026-03-02"), "row_count": 5}]).to_csv(workspace_state / "orders_count_overlay.csv", index=False)
            pd.DataFrame([{"platform": "TikTok", "date": pd.Timestamp("2026-03-02"), "product_name": "Birria Bomb 2-Pack", "seller_sku_resolved": "SKU-1", "net_units": 5.0, "gross_sales": 99.95}]).to_csv(workspace_state / "orders_daily_overlay.csv", index=False)

            partial_tables = {
                "kpi_orders_summary": pd.DataFrame([{"platform": "TikTok", "date_start": "2024-02-27", "date_end": "2026-03-31"}]),
                "kpi_order_level": pd.DataFrame(columns=["platform", "source_type", "order_id", "reporting_date"]),
                "kpi_orders_daily": pd.DataFrame([{"platform": "TikTok", "reporting_date": "2026-03-02"}]),
                "kpi_products_daily": pd.DataFrame([{"platform": "TikTok", "reporting_date": None, "product_name": "Birria"}]),
                "kpi_customer_rollup": pd.DataFrame(columns=["platform", "customer_id", "first_order_date", "last_order_date"]),
                "kpi_cities": pd.DataFrame(columns=["platform", "city", "state"]),
                "kpi_zips": pd.DataFrame(columns=["platform", "zipcode", "city", "state"]),
                "kpi_orders_audit": pd.DataFrame([{"platform": "TikTok", "date_start": "2024-02-27", "date_end": "2026-03-31"}]),
            }
            for key, frame in partial_tables.items():
                frame.to_csv(workspace_state / f"{key}.csv", index=False)

            old_workspace_state_dir = preview_app.WORKSPACE_STATE_DIR
            old_orders_overlay = preview_app.ORDERS_OVERLAY_PATH
            old_orders_count_overlay = preview_app.ORDERS_COUNT_OVERLAY_PATH
            old_kpi_table_paths = preview_app.KPI_TABLE_PATHS
            try:
                preview_app.WORKSPACE_STATE_DIR = workspace_state
                preview_app.ORDERS_OVERLAY_PATH = workspace_state / "orders_daily_overlay.csv"
                preview_app.ORDERS_COUNT_OVERLAY_PATH = workspace_state / "orders_count_overlay.csv"
                preview_app.KPI_TABLE_PATHS = {key: workspace_state / f"{key}.csv" for key in partial_tables}

                self.assertTrue(preview_app.load_saved_state())
                self.assertGreater(float(preview_app.STATE.kpi_tables["kpi_orders_summary"].iloc[0]["total_orders"]), 1000)
            finally:
                preview_app.WORKSPACE_STATE_DIR = old_workspace_state_dir
                preview_app.ORDERS_OVERLAY_PATH = old_orders_overlay
                preview_app.ORDERS_COUNT_OVERLAY_PATH = old_orders_count_overlay
                preview_app.KPI_TABLE_PATHS = old_kpi_table_paths

    def test_load_kpi_tables_parses_order_level_reporting_date(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            workspace_state = root / "workspace_state"
            workspace_state.mkdir()

            table_payloads = {
                "kpi_orders_summary": pd.DataFrame([{"platform": "TikTok", "date_start": "2026-03-01", "date_end": "2026-03-02"}]),
                "kpi_order_level": pd.DataFrame([{"platform": "TikTok", "order_id": "1", "reporting_date": "2026-03-02"}]),
                "kpi_orders_daily": pd.DataFrame([{"platform": "TikTok", "reporting_date": "2026-03-02"}]),
                "kpi_products_daily": pd.DataFrame([{"platform": "TikTok", "reporting_date": "2026-03-02"}]),
                "kpi_customer_rollup": pd.DataFrame([{"platform": "TikTok", "customer_id": "a", "first_order_date": "2026-03-01", "last_order_date": "2026-03-02"}]),
                "kpi_cities": pd.DataFrame([{"platform": "TikTok", "city": "Austin"}]),
                "kpi_zips": pd.DataFrame([{"platform": "TikTok", "zipcode": "78701"}]),
                "kpi_orders_audit": pd.DataFrame([{"platform": "TikTok", "date_start": "2026-03-01", "date_end": "2026-03-02"}]),
            }
            for key, frame in table_payloads.items():
                (workspace_state / f"{key}.csv").write_text(frame.to_csv(index=False), encoding="utf-8")

            old_paths = preview_app.KPI_TABLE_PATHS
            try:
                preview_app.KPI_TABLE_PATHS = {key: workspace_state / f"{key}.csv" for key in table_payloads}
                tables = preview_app._load_kpi_tables()
            finally:
                preview_app.KPI_TABLE_PATHS = old_paths

            self.assertIn("kpi_order_level", tables)
            self.assertTrue(pd.api.types.is_datetime64_any_dtype(tables["kpi_order_level"]["reporting_date"]))

    def test_load_sample_state_preserves_uploaded_order_counts_after_refresh(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            data_dir = root / "Data"
            all_orders = data_dir / "All orders"
            workspace_state = root / "workspace_state"
            all_orders.mkdir(parents=True)
            workspace_state.mkdir(parents=True)

            (all_orders / "March 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,SKU Subtotal Before Discount,Paid Time,Created Time",
                        "1,Delivered,Delivered,,SKU-1,Birria Bomb 2-Pack,1,0,19.99,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                        "2,Delivered,Delivered,,SKU-1,Birria Bomb 2-Pack,1,0,19.99,03/02/2026 10:00:00 AM,03/02/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )

            pd.DataFrame(
                [
                    {
                        "platform": "TikTok",
                        "date": pd.Timestamp("2026-03-02"),
                        "product_name": "Birria Bomb 2-Pack",
                        "seller_sku_resolved": "SKU-1",
                        "net_units": 5.0,
                        "gross_sales": 99.95,
                    },
                    {
                        "platform": "TikTok",
                        "date": pd.Timestamp("2026-03-03"),
                        "product_name": "Birria Bomb 2-Pack",
                        "seller_sku_resolved": "SKU-1",
                        "net_units": 7.0,
                        "gross_sales": 139.93,
                    },
                ]
            ).to_csv(workspace_state / "orders_daily_overlay.csv", index=False)
            pd.DataFrame(
                [
                    {"date": pd.Timestamp("2026-03-02"), "row_count": 5},
                    {"date": pd.Timestamp("2026-03-03"), "row_count": 7},
                ]
            ).to_csv(workspace_state / "orders_count_overlay.csv", index=False)

            old_data_dir = preview_app.DATA_DIR
            old_inventory_source = preview_app.INVENTORY_SOURCE_URL
            old_workspace_state_dir = preview_app.WORKSPACE_STATE_DIR
            old_orders_overlay = preview_app.ORDERS_OVERLAY_PATH
            old_samples_overlay = preview_app.SAMPLES_OVERLAY_PATH
            old_orders_count_overlay = preview_app.ORDERS_COUNT_OVERLAY_PATH
            old_samples_count_overlay = preview_app.SAMPLES_COUNT_OVERLAY_PATH
            old_state = preview_app.STATE
            try:
                preview_app.DATA_DIR = data_dir
                preview_app.INVENTORY_SOURCE_URL = None
                preview_app.WORKSPACE_STATE_DIR = workspace_state
                preview_app.ORDERS_OVERLAY_PATH = workspace_state / "orders_daily_overlay.csv"
                preview_app.SAMPLES_OVERLAY_PATH = workspace_state / "samples_daily_overlay.csv"
                preview_app.ORDERS_COUNT_OVERLAY_PATH = workspace_state / "orders_count_overlay.csv"
                preview_app.SAMPLES_COUNT_OVERLAY_PATH = workspace_state / "samples_count_overlay.csv"
                preview_app.STATE = preview_app.WorkspaceState(
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

                preview_app.load_sample_state()

                self.assertEqual(preview_app.STATE.summary["orders_loaded"], 13)
                self.assertEqual(preview_app.STATE.summary["date_end"], "2026-03-03")
            finally:
                preview_app.DATA_DIR = old_data_dir
                preview_app.INVENTORY_SOURCE_URL = old_inventory_source
                preview_app.WORKSPACE_STATE_DIR = old_workspace_state_dir
                preview_app.ORDERS_OVERLAY_PATH = old_orders_overlay
                preview_app.SAMPLES_OVERLAY_PATH = old_samples_overlay
                preview_app.ORDERS_COUNT_OVERLAY_PATH = old_orders_count_overlay
                preview_app.SAMPLES_COUNT_OVERLAY_PATH = old_samples_count_overlay
                preview_app.STATE = old_state

    def test_workspace_payload_includes_monthly_actual_mix(self) -> None:
        old_state = preview_app.STATE
        try:
            preview_app.STATE = preview_app.WorkspaceState(
                orders=pd.DataFrame(),
                samples=pd.DataFrame(),
                inventory=pd.DataFrame(),
                daily_demand=pd.DataFrame(
                    [
                        {
                            "platform": "TikTok",
                            "date": pd.Timestamp("2026-01-05"),
                            "product_name": "Birria Bomb 2-Pack",
                            "seller_sku_resolved": "SKU-1",
                            "net_units": 80.0,
                            "gross_sales": 1599.2,
                        },
                        {
                            "platform": "TikTok",
                            "date": pd.Timestamp("2026-01-06"),
                            "product_name": "Brine Bomb",
                            "seller_sku_resolved": "SKU-5",
                            "net_units": 20.0,
                            "gross_sales": 399.8,
                        },
                        {
                            "platform": "TikTok",
                            "date": pd.Timestamp("2026-02-01"),
                            "product_name": "Birria Bomb 2-Pack",
                            "seller_sku_resolved": "SKU-1",
                            "net_units": 150.0,
                            "gross_sales": 2998.5,
                        },
                        {
                            "platform": "TikTok",
                            "date": pd.Timestamp("2026-02-02"),
                            "product_name": "Brine Bomb",
                            "seller_sku_resolved": "SKU-5",
                            "net_units": 50.0,
                            "gross_sales": 999.5,
                        },
                    ]
                ),
                samples_daily_demand=pd.DataFrame(),
                order_row_counts=pd.DataFrame(),
                sample_row_counts=pd.DataFrame(),
                kpi_tables={},
                summary={
                    "orders_loaded": 100,
                    "samples_loaded": 0,
                    "products_detected": 6,
                    "date_start": "2026-01-05",
                    "date_end": "2026-01-06",
                    "inventory_as_of": None,
                    "inventory_rows": 0,
                },
                inventory_template=[],
            )

            payload = preview_app.workspace_payload()
        finally:
            preview_app.STATE = old_state

        self.assertIn("monthlyActualMix", payload["defaults"])
        self.assertAlmostEqual(payload["defaults"]["monthlyActualMix"]["2026-01"]["Birria Bomb 2-Pack"], 80.0)
        self.assertAlmostEqual(payload["defaults"]["monthlyActualMix"]["2026-01"]["Brine Bomb"], 20.0)
        self.assertIn("monthlyActuals", payload["defaults"])
        self.assertEqual(payload["defaults"]["monthlyActuals"]["2026-01"]["totalUnits"], 100.0)
        self.assertEqual(payload["defaults"]["monthlyActuals"]["2026-02"]["totalUnits"], 200.0)
        self.assertAlmostEqual(payload["defaults"]["monthlyActuals"]["2026-02"]["changePctVsPreviousMonth"], 100.0)


if __name__ == "__main__":
    unittest.main()
