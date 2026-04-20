import unittest
from unittest.mock import patch

import pandas as pd

from demand_planning_app.tiktok_dashboard import build_tiktok_dashboard_payload


class TiktokDashboardPayloadTests(unittest.TestCase):
    def test_handles_nullable_boolean_order_level_columns(self) -> None:
        order_level = pd.DataFrame(
            {
                "platform": ["TikTok"],
                "source_type": ["Sales"],
                "order_id": ["A"],
                "reporting_date": [pd.Timestamp("2026-03-02")],
                "customer_id": ["cust-1"],
                "customer_id_source": ["Buyer Username"],
                "city": ["Austin"],
                "state": ["TX"],
                "zipcode": ["78701"],
                "is_paid": pd.array([True], dtype="boolean[pyarrow]"),
                "is_cancelled": pd.array([False], dtype="boolean[pyarrow]"),
                "is_refunded": pd.array([False], dtype="boolean[pyarrow]"),
                "is_returned": pd.array([False], dtype="boolean[pyarrow]"),
                "is_shipped": pd.array([True], dtype="boolean[pyarrow]"),
                "is_delivered": pd.array([True], dtype="boolean[pyarrow]"),
                "units_sold": [2.0],
                "returned_units": [0.0],
                "gross_product_sales": [39.98],
                "net_product_sales": [35.98],
                "order_refund_amount": [0.0],
            }
        )
        tables = {
            "kpi_order_level": order_level,
            "kpi_products_daily": pd.DataFrame(),
            "kpi_orders_audit": pd.DataFrame(),
        }

        with patch("demand_planning_app.tiktok_dashboard._build_finance_payload", return_value={"summary": {}}):
            payload = build_tiktok_dashboard_payload(
                tables,
                {"date_start": "2026-03-02", "date_end": "2026-03-02"},
                start_date="2026-03-02",
                end_date="2026-03-02",
                active_tab="orders",
            )

        self.assertEqual(payload["cards"]["paidOrders"], 1)

    def test_filters_order_level_rows_by_date_and_source(self) -> None:
        tables = {
            "kpi_order_level": pd.DataFrame(
                [
                    {
                        "platform": "TikTok",
                        "source_type": "Sales",
                        "order_id": "A",
                        "reporting_date": pd.Timestamp("2026-03-01"),
                        "customer_id": "cust-1",
                        "customer_id_source": "Buyer Username",
                        "city": "Austin",
                        "state": "TX",
                        "zipcode": "78701",
                        "is_paid": True,
                        "is_cancelled": False,
                        "is_refunded": False,
                        "is_returned": False,
                        "is_shipped": True,
                        "is_delivered": True,
                        "units_sold": 2.0,
                        "returned_units": 0.0,
                        "gross_product_sales": 39.98,
                        "net_product_sales": 35.98,
                        "order_refund_amount": 0.0,
                    },
                    {
                        "platform": "TikTok",
                        "source_type": "Sales",
                        "order_id": "B",
                        "reporting_date": pd.Timestamp("2026-03-02"),
                        "customer_id": "cust-2",
                        "customer_id_source": "Buyer Username",
                        "city": "Dallas",
                        "state": "TX",
                        "zipcode": "75201",
                        "is_paid": True,
                        "is_cancelled": False,
                        "is_refunded": False,
                        "is_returned": False,
                        "is_shipped": True,
                        "is_delivered": False,
                        "units_sold": 1.0,
                        "returned_units": 0.0,
                        "gross_product_sales": 19.99,
                        "net_product_sales": 17.99,
                        "order_refund_amount": 0.0,
                    },
                    {
                        "platform": "TikTok",
                        "source_type": "Samples",
                        "order_id": "C",
                        "reporting_date": pd.Timestamp("2026-03-02"),
                        "customer_id": "cust-3",
                        "customer_id_source": "Buyer Username",
                        "city": "Dallas",
                        "state": "TX",
                        "zipcode": "75201",
                        "is_paid": True,
                        "is_cancelled": False,
                        "is_refunded": False,
                        "is_returned": False,
                        "is_shipped": False,
                        "is_delivered": False,
                        "units_sold": 5.0,
                        "returned_units": 0.0,
                        "gross_product_sales": 0.0,
                        "net_product_sales": 0.0,
                        "order_refund_amount": 0.0,
                    },
                ]
            ),
            "kpi_products_daily": pd.DataFrame(
                [
                    {
                        "platform": "TikTok",
                        "reporting_date": pd.Timestamp("2026-03-02"),
                        "product_name": "Birria Bomb 2-Pack",
                        "seller_sku_resolved": "SKU-1",
                        "gross_product_sales": 19.99,
                        "net_product_sales": 17.99,
                        "units_sold": 1.0,
                        "paid_orders": 1,
                        "valid_orders": 1,
                    }
                ]
            ),
            "kpi_orders_audit": pd.DataFrame(
                [
                    {
                        "platform": "TikTok",
                        "date_start": pd.Timestamp("2026-03-01"),
                        "date_end": pd.Timestamp("2026-03-02"),
                        "rows_loaded": 3,
                        "orders_loaded": 3,
                        "blank_customer_rows": 0,
                        "rows_without_city": 0,
                        "rows_without_zip": 0,
                        "canceled_rows": 0,
                        "customer_id_basis": "Buyer Username -> Buyer Nickname -> Recipient",
                    }
                ]
            ),
        }
        summary = {"date_start": "2026-03-01", "date_end": "2026-03-02"}

        with patch("demand_planning_app.tiktok_dashboard._build_finance_payload", return_value={"summary": {}}) as finance_mock:
            payload = build_tiktok_dashboard_payload(
                tables,
                summary,
                start_date="2026-03-02",
                end_date="2026-03-02",
                selected_sources=["Sales"],
                active_tab="orders",
            )

        finance_mock.assert_not_called()
        self.assertEqual(payload["filters"]["startDate"], "2026-03-02")
        self.assertEqual(payload["filters"]["selectedSources"], ["Sales"])
        self.assertEqual(payload["cards"]["paidOrders"], 1)
        self.assertAlmostEqual(payload["cards"]["grossProductSales"], 19.99, places=2)
        self.assertEqual(len(payload["tabs"]["orders"]["dailyRows"]), 1)
        self.assertEqual(payload["tabs"]["orders"]["cityRows"][0]["city"], "Dallas")
        self.assertEqual(payload["badges"]["snapshotLabel"], "3/2/2026, lean rebuild")

    def test_uses_filtered_daily_tables_when_order_level_is_missing(self) -> None:
        tables = {
            "kpi_orders_summary": pd.DataFrame(
                [
                    {
                        "platform": "TikTok",
                        "date_start": pd.Timestamp("2024-02-27"),
                        "date_end": pd.Timestamp("2026-03-31"),
                        "gross_product_sales": 999999.0,
                        "net_product_sales": 888888.0,
                        "paid_orders": 50000,
                        "units_sold": 777777.0,
                        "unique_customers": 123456,
                    }
                ]
            ),
            "kpi_order_level": pd.DataFrame(columns=["platform", "source_type", "order_id", "reporting_date"]),
            "kpi_orders_daily": pd.DataFrame(
                [
                    {
                        "platform": "TikTok",
                        "reporting_date": pd.Timestamp("2026-03-01"),
                        "total_orders": 10,
                        "gross_product_sales": 100.0,
                        "net_product_sales": 90.0,
                        "paid_orders": 8,
                        "valid_orders": 7,
                        "delivered_orders": 6,
                        "shipped_orders": 7,
                        "canceled_orders": 2,
                        "refunded_orders": 1,
                        "returned_orders": 1,
                        "units_sold": 12.0,
                        "unique_customers": 5,
                    },
                    {
                        "platform": "TikTok",
                        "reporting_date": pd.Timestamp("2026-03-02"),
                        "total_orders": 20,
                        "gross_product_sales": 200.0,
                        "net_product_sales": 180.0,
                        "paid_orders": 16,
                        "valid_orders": 15,
                        "delivered_orders": 14,
                        "shipped_orders": 15,
                        "canceled_orders": 3,
                        "refunded_orders": 1,
                        "returned_orders": 1,
                        "units_sold": 24.0,
                        "unique_customers": 9,
                    },
                ]
            ),
            "kpi_products_daily": pd.DataFrame(),
            "kpi_orders_audit": pd.DataFrame(),
        }

        payload = build_tiktok_dashboard_payload(
            tables,
            {"date_start": "2024-02-27", "date_end": "2026-03-31"},
            start_date="2026-03-01",
            end_date="2026-03-31",
            active_tab="orders",
        )

        self.assertAlmostEqual(payload["cards"]["grossProductSales"], 300.0)
        self.assertAlmostEqual(payload["cards"]["netProductSales"], 270.0)
        self.assertEqual(payload["cards"]["paidOrders"], 24)
        self.assertEqual(payload["tabs"]["orders"]["health"]["valid_orders"], 22)
        self.assertEqual(len(payload["tabs"]["orders"]["dailyRows"]), 2)

    def test_builds_core_product_mix_from_planning_daily(self) -> None:
        planning_daily = pd.DataFrame(
            [
                {"platform": "TikTok", "date": pd.Timestamp("2026-03-01"), "product_name": "Birria Bomb 2-Pack", "seller_sku_resolved": "SKU-1", "net_units": 80.0, "gross_sales": 1599.2},
                {"platform": "TikTok", "date": pd.Timestamp("2026-03-01"), "product_name": "Brine Bomb", "seller_sku_resolved": "SKU-5", "net_units": 20.0, "gross_sales": 399.8},
            ]
        )

        payload = build_tiktok_dashboard_payload(
            {"kpi_orders_audit": pd.DataFrame()},
            {"date_start": "2026-03-01", "date_end": "2026-03-31"},
            start_date="2026-03-01",
            end_date="2026-03-31",
            active_tab="products",
            planning_daily=planning_daily,
        )

        rows = payload["tabs"]["products"]["productRows"]
        self.assertEqual(rows[0]["product_name"], "Birria Bomb 2-Pack")
        self.assertAlmostEqual(rows[0]["unit_mix_pct"], 0.8)
        self.assertAlmostEqual(rows[1]["unit_mix_pct"], 0.2)


if __name__ == "__main__":
    unittest.main()
