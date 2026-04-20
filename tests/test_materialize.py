import tempfile
import unittest
from pathlib import Path

import pandas as pd

from demand_planning_app.materialize import (
    PRODUCT_CATALOG,
    build_daily_demand_table,
    build_product_catalog_frame,
    retable_orders_to_planning_facts,
    write_materialized_planning_dataset,
)


class MaterializeTests(unittest.TestCase):
    def test_retable_orders_explodes_bundles_into_canonical_products(self) -> None:
        orders = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "order_id": "1",
                    "order_date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria and Pozole Bombs bundle by EZ Bombs - Seasoning Spice Bomb Flavor for Authentic Mexican Dishes - Traditional",
                    "quantity": 2.0,
                    "returned_quantity": 1.0,
                    "net_units": 1.0,
                },
                {
                    "platform": "TikTok",
                    "order_id": "2",
                    "order_date": pd.Timestamp("2026-03-01"),
                    "product_name": "BirriaBomb, PozoleBomb, TingaBomb Variety Pack - Seasoning Spice Flavor for Authentic Mexican Dishes",
                    "quantity": 1.0,
                    "returned_quantity": 0.0,
                    "net_units": 1.0,
                },
            ]
        )

        retabled, unmapped = retable_orders_to_planning_facts(orders)

        self.assertTrue(unmapped.empty)
        self.assertEqual(
            set(retabled["product_name"].unique()),
            {"Birria Bomb 2-Pack", "Pozole Bomb 2-Pack", "Variety Pack"},
        )
        birria_rows = retabled.loc[retabled["product_name"].eq("Birria Bomb 2-Pack")]
        self.assertEqual(float(birria_rows["units_sold"].sum()), 2.0)
        self.assertEqual(float(birria_rows["returned_units"].sum()), 1.0)

    def test_build_daily_demand_table_only_keeps_needed_columns(self) -> None:
        retabled = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "units_sold": 2.0,
                    "returned_units": 0.0,
                    "net_units": 2.0,
                },
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "units_sold": 1.0,
                    "returned_units": 0.0,
                    "net_units": 1.0,
                },
            ]
        )

        daily = build_daily_demand_table(retabled)

        self.assertEqual(
            list(daily.columns),
            ["platform", "date", "product_name", "units_sold", "returned_units", "net_units"],
        )
        self.assertEqual(len(daily), 1)
        self.assertEqual(float(daily.loc[0, "net_units"]), 3.0)

    def test_build_product_catalog_frame_attaches_list_price_and_cogs(self) -> None:
        catalog = build_product_catalog_frame()

        self.assertEqual(set(catalog["product_name"]), set(PRODUCT_CATALOG.keys()))
        birria = catalog.loc[catalog["product_name"].eq("Birria Bomb 2-Pack")].iloc[0]
        self.assertEqual(float(birria["list_price"]), 19.99)
        self.assertEqual(float(birria["cogs"]), 3.10)

    def test_write_materialized_planning_dataset_outputs_small_transfer_files(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            data_root = root / "Data"
            all_orders = data_root / "All orders"
            all_orders.mkdir(parents=True)
            (all_orders / "March 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,Paid Time,Created Time",
                        "1,Delivered,Delivered,,850058580951,EZ BOMBS Birria Bombs 2 Bomb Pack - Seasoning Spice Bomb Flavor for Authentic Mexican Dishes - Traditional,2,0,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                        "2,Delivered,Delivered,,850063346276,Pozole Bombs 2 Pack by EZ Bombs - Seasoning Spice Bomb Flavor for Authentic Mexican Dishes - Traditional,1,0,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )
            output_dir = root / "materialized"

            result = write_materialized_planning_dataset(data_root=data_root, output_dir=output_dir, platform="TikTok")

            self.assertTrue((output_dir / "planning_demand_daily.csv").exists())
            self.assertTrue((output_dir / "planning_product_catalog.csv").exists())
            self.assertEqual(result["summary"]["products_in_demand"], 2)
            self.assertEqual(result["summary"]["daily_rows"], 2)


if __name__ == "__main__":
    unittest.main()
