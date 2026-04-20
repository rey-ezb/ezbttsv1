import unittest

import pandas as pd

from demand_planning_app.normalize import normalize_orders_frame


class NormalizeOrdersFrameTests(unittest.TestCase):
    def test_keeps_only_planning_fields_and_handles_bundle_column_drift(self) -> None:
        raw = pd.DataFrame(
            [
                {
                    "Order ID": "1001",
                    "Order Status": "Shipped",
                    "Order Substatus": "Delivered",
                    "Cancelation/Return Type": "",
                    "Seller SKU": "",
                    "Product Name": "Variety Pack",
                    " Virtual Bundle Seller SKU": "BUNDLE-4PK",
                    "Quantity": "2",
                    "Sku Quantity of return": "1",
                    "SKU Subtotal After Discount": "17.50",
                    "Paid Time": "03/31/2026 11:52:23 PM",
                    "Created Time": "03/31/2026 11:52:20 PM",
                    "Buyer Username": "",
                    "Buyer Nickname": "nick-a",
                    "Recipient": "Jane Doe",
                    "City": "Austin",
                    "State": "tx",
                    "Zipcode": "78701-1200",
                    "Order Amount": "15.62",
                }
            ]
        )

        normalized = normalize_orders_frame(raw, platform="TikTok")

        self.assertEqual(
            list(normalized.columns),
            [
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
            ],
        )
        self.assertEqual(normalized.loc[0, "seller_sku_resolved"], "BUNDLE-4PK")
        self.assertEqual(normalized.loc[0, "quantity"], 2.0)
        self.assertEqual(normalized.loc[0, "returned_quantity"], 1.0)
        self.assertEqual(normalized.loc[0, "gross_sales"], 0.0)
        self.assertEqual(normalized.loc[0, "net_product_sales"], 17.5)
        self.assertEqual(normalized.loc[0, "net_units"], 1.0)
        self.assertEqual(normalized.loc[0, "platform"], "TikTok")
        self.assertEqual(normalized.loc[0, "customer_id"], "nick-a")
        self.assertEqual(normalized.loc[0, "customer_id_source"], "Buyer Nickname")
        self.assertEqual(normalized.loc[0, "city"], "Austin")
        self.assertEqual(normalized.loc[0, "state"], "TX")
        self.assertEqual(normalized.loc[0, "zipcode"], "78701")
        self.assertTrue(normalized.loc[0, "is_paid"])
        self.assertTrue(normalized.loc[0, "is_delivered"])

    def test_uses_created_time_when_paid_time_missing_and_marks_cancelled_rows(self) -> None:
        raw = pd.DataFrame(
            [
                {
                    "Order ID": "1002",
                    "Order Status": "Cancelled",
                    "Order Substatus": "Cancelled",
                    "Cancelation/Return Type": "Cancellation",
                    "Seller SKU": "SKU-2",
                    "Product Name": "Pozole Bomb 2-Pack",
                    "Quantity": "3",
                    "Sku Quantity of return": "0",
                    "Paid Time": "",
                    "Created Time": "02/15/2025 08:15:00 PM",
                }
            ]
        )

        normalized = normalize_orders_frame(raw, platform="TikTok")

        self.assertEqual(str(normalized.loc[0, "order_date"].date()), "2025-02-15")
        self.assertTrue(normalized.loc[0, "is_cancelled"])
        self.assertEqual(normalized.loc[0, "net_units"], 0.0)

    def test_uses_sku_subtotal_before_discount_as_gross_sales(self) -> None:
        raw = pd.DataFrame(
            [
                {
                    "Order ID": "1003",
                    "Order Status": "Completed",
                    "Order Substatus": "Completed",
                    "Cancelation/Return Type": "",
                    "Seller SKU": "SKU-3",
                    "Product Name": "Birria Bomb 2-Pack",
                    "Quantity": "2",
                    "Sku Quantity of return": "0",
                    "SKU Subtotal Before Discount": "39.98",
                    "Paid Time": "03/01/2026 10:00:00 AM",
                    "Created Time": "03/01/2026 09:00:00 AM",
                }
            ]
        )

        normalized = normalize_orders_frame(raw, platform="TikTok")

        self.assertEqual(normalized.loc[0, "gross_sales"], 39.98)

    def test_marks_refunded_and_shipped_rows_from_export_fields(self) -> None:
        raw = pd.DataFrame(
            [
                {
                    "Order ID": "1004",
                    "Order Status": "In Transit",
                    "Order Substatus": "Awaiting collection",
                    "Cancelation/Return Type": "Refund approved",
                    "Seller SKU": "SKU-4",
                    "Product Name": "Tinga Bomb 2-Pack",
                    "Quantity": "1",
                    "Sku Quantity of return": "0",
                    "Order Refund Amount": "4.00",
                    "Paid Time": "03/05/2026 10:00:00 AM",
                    "Created Time": "03/05/2026 09:00:00 AM",
                }
            ]
        )

        normalized = normalize_orders_frame(raw, platform="TikTok")

        self.assertTrue(normalized.loc[0, "is_refunded"])
        self.assertTrue(normalized.loc[0, "is_shipped"])


if __name__ == "__main__":
    unittest.main()
