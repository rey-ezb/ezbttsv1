import unittest

import pandas as pd

from demand_planning_app.kpi_metrics import build_tiktok_kpi_payload, build_tiktok_kpi_tables
from demand_planning_app.normalize import normalize_orders_frame


class TiktokKpiMetricTests(unittest.TestCase):
    def test_builds_summary_product_and_location_tables_from_lean_orders(self) -> None:
        raw = pd.DataFrame(
            [
                {
                    "Order ID": "1",
                    "Order Status": "Delivered",
                    "Order Substatus": "Completed",
                    "Cancelation/Return Type": "",
                    "Seller SKU": "SKU-1",
                    "Product Name": "Birria Bomb 2-Pack",
                    "Quantity": "2",
                    "Sku Quantity of return": "0",
                    "SKU Subtotal Before Discount": "39.98",
                    "SKU Subtotal After Discount": "35.98",
                    "Paid Time": "03/01/2026 10:00:00 AM",
                    "Created Time": "03/01/2026 09:00:00 AM",
                    "Buyer Username": "buyer-a",
                    "City": "Austin",
                    "State": "TX",
                    "Zipcode": "78701",
                },
                {
                    "Order ID": "2",
                    "Order Status": "Shipped",
                    "Order Substatus": "In transit",
                    "Cancelation/Return Type": "",
                    "Seller SKU": "SKU-2",
                    "Product Name": "Pozole Bomb 2-Pack",
                    "Quantity": "1",
                    "Sku Quantity of return": "0",
                    "SKU Subtotal Before Discount": "19.99",
                    "SKU Subtotal After Discount": "17.99",
                    "Paid Time": "03/02/2026 10:00:00 AM",
                    "Created Time": "03/02/2026 09:00:00 AM",
                    "Buyer Nickname": "nick-b",
                    "City": "Dallas",
                    "State": "TX",
                    "Zipcode": "75201",
                },
                {
                    "Order ID": "3",
                    "Order Status": "Cancelled",
                    "Order Substatus": "Cancelled",
                    "Cancelation/Return Type": "Cancellation",
                    "Seller SKU": "SKU-3",
                    "Product Name": "Tinga Bomb 2-Pack",
                    "Quantity": "1",
                    "Sku Quantity of return": "0",
                    "SKU Subtotal Before Discount": "19.99",
                    "SKU Subtotal After Discount": "19.99",
                    "Created Time": "03/03/2026 09:00:00 AM",
                    "Recipient": "Taylor",
                    "City": "Houston",
                    "State": "TX",
                    "Zipcode": "77001",
                },
                {
                    "Order ID": "4",
                    "Order Status": "Delivered",
                    "Order Substatus": "Completed",
                    "Cancelation/Return Type": "Refund approved",
                    "Seller SKU": "SKU-1",
                    "Product Name": "Birria Bomb 2-Pack",
                    "Quantity": "1",
                    "Sku Quantity of return": "1",
                    "SKU Subtotal Before Discount": "19.99",
                    "SKU Subtotal After Discount": "17.99",
                    "Order Refund Amount": "10.00",
                    "Paid Time": "03/04/2026 10:00:00 AM",
                    "Created Time": "03/04/2026 09:00:00 AM",
                    "Buyer Username": "buyer-a",
                    "City": "Austin",
                    "State": "TX",
                    "Zipcode": "78701",
                },
            ]
        )

        normalized = normalize_orders_frame(raw, platform="TikTok")
        tables = build_tiktok_kpi_tables(normalized)

        summary = tables["kpi_orders_summary"].iloc[0]
        self.assertEqual(int(summary["total_orders"]), 4)
        self.assertEqual(int(summary["valid_orders"]), 3)
        self.assertEqual(int(summary["canceled_orders"]), 1)
        self.assertEqual(int(summary["refunded_orders"]), 1)
        self.assertEqual(int(summary["returned_orders"]), 1)
        self.assertAlmostEqual(float(summary["gross_product_sales"]), 79.96, places=2)
        self.assertAlmostEqual(float(summary["net_product_sales"]), 71.96, places=2)
        self.assertEqual(int(summary["unique_customers"]), 2)
        self.assertEqual(int(summary["repeat_customers"]), 1)

        product_rows = tables["kpi_products_daily"]
        self.assertIn("Birria Bomb 2-Pack", set(product_rows["product_name"]))
        self.assertNotIn("Tinga Bomb 2-Pack", set(product_rows["product_name"]))

        city_rows = tables["kpi_cities"]
        austin = city_rows.loc[city_rows["city"].eq("Austin")].iloc[0]
        self.assertEqual(int(austin["orders"]), 2)
        self.assertEqual(int(austin["unique_customers"]), 1)

        zip_rows = tables["kpi_zips"]
        self.assertIn("78701", set(zip_rows["zipcode"]))

    def test_payload_exposes_dashboard_ready_sections(self) -> None:
        normalized = normalize_orders_frame(
            pd.DataFrame(
                [
                    {
                        "Order ID": "1",
                        "Order Status": "Delivered",
                        "Order Substatus": "Completed",
                        "Seller SKU": "SKU-1",
                        "Product Name": "Birria Bomb 2-Pack",
                        "Quantity": "2",
                        "Sku Quantity of return": "0",
                        "SKU Subtotal Before Discount": "39.98",
                        "SKU Subtotal After Discount": "35.98",
                        "Paid Time": "03/01/2026 10:00:00 AM",
                        "Created Time": "03/01/2026 09:00:00 AM",
                        "Buyer Username": "buyer-a",
                        "City": "Austin",
                        "State": "TX",
                        "Zipcode": "78701",
                    }
                ]
            ),
            platform="TikTok",
        )

        payload = build_tiktok_kpi_payload(build_tiktok_kpi_tables(normalized))

        self.assertEqual(payload["summary"]["customer_id_basis"], "Buyer Username -> Buyer Nickname -> Recipient")
        self.assertEqual(len(payload["dailyRows"]), 1)
        self.assertEqual(len(payload["productRows"]), 1)
        self.assertEqual(len(payload["auditRows"]), 1)


if __name__ == "__main__":
    unittest.main()
