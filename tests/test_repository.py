import tempfile
import unittest
from pathlib import Path

from demand_planning_app.repository import build_inventory_template, load_orders_from_folder, load_samples_from_folder


class RepositoryTests(unittest.TestCase):
    def test_load_orders_from_folder_reads_all_order_csvs_only(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            all_orders = root / "All orders"
            finance = root / "Finance Tab"
            all_orders.mkdir()
            finance.mkdir()
            (all_orders / "March 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,Paid Time,Created Time",
                        "1,Delivered,Delivered,,SKU-1,Birria Bomb 2-Pack,2,0,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )
            (finance / "March 2026.csv").write_text("ignore,me\n1,2\n", encoding="utf-8")

            orders = load_orders_from_folder(root, platform="TikTok")

            self.assertEqual(len(orders), 1)
            self.assertEqual(orders.loc[0, "seller_sku_resolved"], "SKU-1")
            self.assertEqual(orders.loc[0, "platform"], "TikTok")

    def test_build_inventory_template_returns_unique_products(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            all_orders = root / "All orders"
            all_orders.mkdir()
            (all_orders / "March 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,Paid Time,Created Time",
                        "1,Delivered,Delivered,,SKU-1,Birria Bomb 2-Pack,2,0,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                        "2,Delivered,Delivered,,SKU-1,Birria Bomb 2-Pack,1,0,03/02/2026 10:00:00 AM,03/02/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )

            orders = load_orders_from_folder(root, platform="TikTok")
            template = build_inventory_template(orders)

            self.assertEqual(len(template), 7)
            birria = template.loc[template["product_name"].eq("Birria Bomb 2-Pack")].iloc[0]
            chile = template.loc[template["product_name"].eq("Chile Colorado Bomb 2-Pack")].iloc[0]
            self.assertEqual(birria["seller_sku_resolved"], "SKU-1")
            self.assertEqual(template.loc[0, "on_hand"], 0)
            self.assertEqual(float(chile["in_transit"]), 12096.0)
            self.assertEqual(str(chile["transit_eta"].date()), "2026-04-29")

    def test_build_inventory_template_collapses_known_name_variants_into_core_products(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            all_orders = root / "All orders"
            all_orders.mkdir()
            (all_orders / "March 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,Paid Time,Created Time",
                        "1,Delivered,Delivered,,850058580951,Birria Bombs 2 Pack by EZ Bombs - Seasoning Spice Bomb Flavor for Authentic Mexican Dishes - Traditional,2,0,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                        "2,Delivered,Delivered,,850058580951,EZ BOMBS Birria Bombs 2 Bomb Pack - Seasoning Spice Bomb Flavor for Authentic Mexican Dishes - Traditional,1,0,03/02/2026 10:00:00 AM,03/02/2026 09:00:00 AM",
                        "3,Delivered,Delivered,,VB-1,Birria and Pozole Bombs bundle by EZ Bombs - Seasoning Spice Bomb Flavor for Authentic Mexican Dishes - Traditional,1,0,03/03/2026 10:00:00 AM,03/03/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )

            orders = load_orders_from_folder(root, platform="TikTok")
            template = build_inventory_template(orders)

            self.assertEqual(len(template), 7)
            self.assertIn("Birria Bomb 2-Pack", set(template["product_name"]))
            self.assertIn("Pozole Bomb 2-Pack", set(template["product_name"]))

    def test_load_samples_from_folder_reads_samples_csvs_only(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            samples = root / "Samples"
            all_orders = root / "All orders"
            samples.mkdir()
            all_orders.mkdir()
            (samples / "Samples 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,SKU Subtotal Before Discount,Paid Time,Created Time",
                        "1,Completed,Completed,,SKU-1,Birria Bomb 2-Pack,1,0,0,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )
            (all_orders / "March 2026.csv").write_text("ignore,me\n1,2\n", encoding="utf-8")

            samples_frame = load_samples_from_folder(root, platform="TikTok")

            self.assertEqual(len(samples_frame), 1)
            self.assertEqual(samples_frame.loc[0, "product_name"], "Birria Bomb 2-Pack")


if __name__ == "__main__":
    unittest.main()
