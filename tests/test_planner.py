import unittest
from datetime import date

import pandas as pd

from demand_planning_app.planner import (
    aggregate_daily_demand,
    normalize_inventory_frame,
    plan_demand,
)


class PlannerTests(unittest.TestCase):
    def test_aggregate_daily_demand_maps_virtual_bundles_into_physical_products(self) -> None:
        orders = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "order_id": "1",
                    "order_date": pd.Timestamp("2026-03-01"),
                    "order_status": "Delivered",
                    "order_substatus": "Delivered",
                    "cancellation_return_type": "",
                    "product_name": "Birria and Pozole Bombs bundle by EZ Bombs - Seasoning Spice Bomb Flavor for Authentic Mexican Dishes - Traditional",
                    "seller_sku": "VB-1",
                    "seller_sku_resolved": "VB-1",
                    "quantity": 1.0,
                    "returned_quantity": 0.0,
                    "net_units": 1.0,
                    "is_cancelled": False,
                    "is_returned": False,
                },
                {
                    "platform": "TikTok",
                    "order_id": "2",
                    "order_date": pd.Timestamp("2026-03-01"),
                    "order_status": "Delivered",
                    "order_substatus": "Delivered",
                    "cancellation_return_type": "",
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku": "SKU-1",
                    "seller_sku_resolved": "SKU-1",
                    "quantity": 1.0,
                    "returned_quantity": 0.0,
                    "net_units": 1.0,
                    "is_cancelled": False,
                    "is_returned": False,
                },
            ]
        )

        daily = aggregate_daily_demand(orders)

        self.assertEqual(set(daily["product_name"]), {"Birria Bomb 2-Pack", "Pozole Bomb 2-Pack"})
        birria = daily.loc[daily["product_name"].eq("Birria Bomb 2-Pack")].iloc[0]
        pozole = daily.loc[daily["product_name"].eq("Pozole Bomb 2-Pack")].iloc[0]
        self.assertEqual(float(birria["net_units"]), 2.0)
        self.assertEqual(float(pozole["net_units"]), 1.0)
        self.assertEqual(birria["platform"], "TikTok")

    def test_aggregate_daily_demand_maps_chile_colorado_into_core_product_and_bundle(self) -> None:
        orders = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "order_id": "1",
                    "order_date": pd.Timestamp("2026-05-01"),
                    "order_status": "Delivered",
                    "order_substatus": "Delivered",
                    "cancellation_return_type": "",
                    "product_name": "Chile Colorado Bomb 2-Pack",
                    "seller_sku": "SKU-CC",
                    "seller_sku_resolved": "SKU-CC",
                    "quantity": 1.0,
                    "returned_quantity": 0.0,
                    "net_units": 1.0,
                    "gross_sales": 19.99,
                    "is_cancelled": False,
                    "is_returned": False,
                },
                {
                    "platform": "TikTok",
                    "order_id": "2",
                    "order_date": pd.Timestamp("2026-05-01"),
                    "order_status": "Delivered",
                    "order_substatus": "Delivered",
                    "cancellation_return_type": "",
                    "product_name": "Chile Colorado and Birria bundle",
                    "seller_sku": "VB-CC-1",
                    "seller_sku_resolved": "VB-CC-1",
                    "quantity": 1.0,
                    "returned_quantity": 0.0,
                    "net_units": 1.0,
                    "gross_sales": 39.98,
                    "is_cancelled": False,
                    "is_returned": False,
                },
            ]
        )

        daily = aggregate_daily_demand(orders)

        self.assertEqual(set(daily["product_name"]), {"Chile Colorado Bomb 2-Pack", "Birria Bomb 2-Pack"})
        chile = daily.loc[daily["product_name"].eq("Chile Colorado Bomb 2-Pack")].iloc[0]
        self.assertEqual(float(chile["net_units"]), 2.0)

    def test_plan_demand_uses_exact_transit_eta_when_deciding_counted_inbound(self) -> None:
        daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-04-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": "SKU-1",
                    "net_units": 1.0,
                    "gross_sales": 19.99,
                }
            ]
        )
        inventory = normalize_inventory_frame(
            pd.DataFrame(
                [
                    {
                        "product_name": "Birria Bomb 2-Pack",
                        "seller_sku_resolved": "SKU-1",
                        "on_hand": 5,
                        "in_transit": 10,
                        "transit_eta": "2026-04-20",
                    }
                ]
            )
        )

        results = plan_demand(
            daily,
            inventory,
            baseline_start=date(2026, 4, 1),
            baseline_end=date(2026, 4, 1),
            horizon_start=date(2026, 5, 1),
            horizon_end=date(2026, 5, 31),
            sample_daily_demand=pd.DataFrame(),
            include_samples=False,
            default_uplift_pct=0.0,
            default_lead_time_days=8,
            default_safety_days=14,
        )

        row = results.iloc[0]
        self.assertEqual(float(row["counted_in_transit"]), 0.0)
        self.assertEqual(float(row["current_supply_units"]), 5.0)

    def test_plan_demand_returns_reorder_recommendation_for_future_horizon(self) -> None:
        daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": "SKU-1",
                    "net_units": 10.0,
                    "gross_sales": 199.9,
                },
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-02"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": "SKU-1",
                    "net_units": 10.0,
                    "gross_sales": 199.9,
                },
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-03"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": "SKU-1",
                    "net_units": 10.0,
                    "gross_sales": 199.9,
                },
            ]
        )
        inventory = normalize_inventory_frame(
            pd.DataFrame(
                [
                    {
                        "product_name": "Birria Bomb 2-Pack",
                        "seller_sku_resolved": "SKU-1",
                        "on_hand": 20,
                        "in_transit": 10,
                    }
                ]
            )
        )

        results = plan_demand(
            daily,
            inventory,
            baseline_start=date(2026, 3, 1),
            baseline_end=date(2026, 3, 3),
            horizon_start=date(2026, 4, 1),
            horizon_end=date(2026, 4, 30),
            sample_daily_demand=pd.DataFrame(),
            include_samples=False,
            default_uplift_pct=0.0,
            default_lead_time_days=14,
            default_safety_days=14,
        )

        self.assertEqual(len(results), 1)
        row = results.iloc[0]
        self.assertEqual(row["avg_daily_demand"], 10.0)
        self.assertEqual(row["forecast_units"], 300.0)
        self.assertEqual(row["current_supply_units"], 20.0)
        self.assertEqual(row["recommended_order_units"], 490.0)
        self.assertEqual(row["status"], "Urgent")
        self.assertEqual(row["gross_sales_in_baseline"], 599.7)
        self.assertEqual(row["safety_stock_weeks"], 3)
        self.assertAlmostEqual(row["weeks_of_supply"], 20.0 / 10.0 / 7.0, places=4)

    def test_plan_demand_does_not_crash_when_days_of_supply_is_nan(self) -> None:
        daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": "",
                    "net_units": 0.0,
                }
            ]
        )
        inventory = normalize_inventory_frame(
            pd.DataFrame(
                [
                    {
                        "product_name": "Birria Bomb 2-Pack",
                        "seller_sku_resolved": "",
                        "on_hand": 0,
                        "in_transit": 0,
                    }
                ]
            )
        )

        results = plan_demand(
            daily,
            inventory,
            baseline_start=date(2026, 3, 1),
            baseline_end=date(2026, 3, 1),
            horizon_start=date(2026, 4, 1),
            horizon_end=date(2026, 4, 30),
            sample_daily_demand=pd.DataFrame(),
            include_samples=False,
            default_uplift_pct=0.0,
            default_lead_time_days=14,
            default_safety_days=14,
        )

        self.assertEqual(len(results), 1)
        self.assertEqual(results.iloc[0]["status"], "No demand")
        self.assertTrue(pd.isna(results.iloc[0]["projected_stockout_date"]))

    def test_plan_demand_does_not_crash_when_moq_and_case_pack_are_blank(self) -> None:
        daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Chile Colorado Bomb 2-Pack",
                    "seller_sku_resolved": "",
                    "net_units": 5.0,
                    "gross_sales": 99.95,
                }
            ]
        )
        inventory = normalize_inventory_frame(
            pd.DataFrame(
                [
                    {
                        "product_name": "Chile Colorado Bomb 2-Pack",
                        "seller_sku_resolved": "",
                        "on_hand": 0,
                        "in_transit": 12096,
                        "case_pack": "",
                        "moq": "",
                    }
                ]
            )
        )

        results = plan_demand(
            daily,
            inventory,
            baseline_start=date(2026, 3, 1),
            baseline_end=date(2026, 3, 1),
            horizon_start=date(2026, 5, 1),
            horizon_end=date(2026, 5, 31),
            sample_daily_demand=pd.DataFrame(),
            include_samples=False,
            default_uplift_pct=0.0,
            default_lead_time_days=8,
            default_safety_days=14,
        )

        self.assertEqual(len(results), 1)
        row = results.iloc[0]
        self.assertEqual(str(row["product_name"]), "Chile Colorado Bomb 2-Pack")
        self.assertGreaterEqual(float(row["recommended_order_units"]), 0.0)

    def test_plan_demand_can_include_samples_in_velocity(self) -> None:
        sales_daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": "SKU-1",
                    "net_units": 10.0,
                    "gross_sales": 199.9,
                }
            ]
        )
        sample_daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": "SKU-1",
                    "net_units": 3.0,
                    "gross_sales": 0.0,
                }
            ]
        )
        inventory = normalize_inventory_frame(
            pd.DataFrame(
                [
                    {
                        "product_name": "Birria Bomb 2-Pack",
                        "seller_sku_resolved": "SKU-1",
                        "on_hand": 100,
                        "in_transit": 0,
                    }
                ]
            )
        )

        results = plan_demand(
            sales_daily,
            inventory,
            baseline_start=date(2026, 3, 1),
            baseline_end=date(2026, 3, 1),
            horizon_start=date(2026, 7, 1),
            horizon_end=date(2026, 7, 31),
            sample_daily_demand=sample_daily,
            include_samples=True,
            default_uplift_pct=0.0,
            default_lead_time_days=14,
            default_safety_days=14,
        )

        row = results.iloc[0]
        self.assertEqual(row["sales_units_in_baseline"], 10.0)
        self.assertEqual(row["sample_units_in_baseline"], 3.0)
        self.assertEqual(row["units_used_for_velocity"], 13.0)
        self.assertEqual(row["safety_stock_weeks"], 5)

    def test_plan_demand_normalizes_mixed_sku_key_types_before_merging(self) -> None:
        sales_daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": "850058580951",
                    "net_units": 10.0,
                    "gross_sales": 199.9,
                }
            ]
        )
        sample_daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-01"),
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": 850058580951.0,
                    "net_units": 2.0,
                    "gross_sales": 0.0,
                }
            ]
        )
        inventory = pd.DataFrame(
            [
                {
                    "product_name": "Birria Bomb 2-Pack",
                    "seller_sku_resolved": 850058580951.0,
                    "on_hand": 20,
                    "in_transit": 0,
                }
            ]
        )

        results = plan_demand(
            sales_daily,
            inventory,
            baseline_start=date(2026, 3, 1),
            baseline_end=date(2026, 3, 1),
            horizon_start=date(2026, 4, 1),
            horizon_end=date(2026, 4, 30),
            sample_daily_demand=sample_daily,
            include_samples=True,
            default_uplift_pct=0.0,
            default_lead_time_days=8,
            default_safety_days=0,
        )

        self.assertEqual(len(results), 1)
        row = results.iloc[0]
        self.assertEqual(row["sales_units_in_baseline"], 10.0)
        self.assertEqual(row["sample_units_in_baseline"], 2.0)
        self.assertEqual(row["current_supply_units"], 20.0)


if __name__ == "__main__":
    unittest.main()
