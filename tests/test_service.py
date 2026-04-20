import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

from demand_planning_app.service import (
    apply_month_forecast_to_plan,
    build_historical_trend,
    build_launch_planning,
    build_monthly_units_plan,
    get_saved_uplift_pct,
    load_saved_forecast_settings,
    load_sample_workspace,
    merge_daily_demand_replace_dates,
    parse_inventory_csv_bytes,
    parse_orders_csv_bytes,
    run_planning_workspace,
    save_forecast_setting_for_month,
    save_uplift_pct_for_month,
)


class ServiceTests(unittest.TestCase):
    def test_parse_orders_csv_bytes_normalizes_uploaded_order_file(self) -> None:
        payload = "\n".join(
            [
                "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,Paid Time,Created Time",
                "1,Delivered,Delivered,,SKU-1,Birria Bomb 2-Pack,2,0,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
            ]
        ).encode("utf-8")

        frame = parse_orders_csv_bytes(payload, platform="TikTok")

        self.assertEqual(len(frame), 1)
        self.assertEqual(frame.loc[0, "product_name"], "Birria Bomb 2-Pack")
        self.assertEqual(frame.loc[0, "net_units"], 2.0)

    def test_parse_inventory_csv_bytes_keeps_only_v1_inventory_fields(self) -> None:
        payload = "\n".join(
            [
                "product_name,seller_sku_resolved,on_hand,in_transit,lead_time_days,case_pack,moq,ignore_me",
                "Birria Bomb 2-Pack,SKU-1,12,8,10,6,12,drop",
            ]
        ).encode("utf-8")

        frame = parse_inventory_csv_bytes(payload)

        self.assertEqual(
            list(frame.columns),
            [
                "product_name",
                "seller_sku_resolved",
                "on_hand",
                "in_transit",
                "transit_started_on",
                "transit_eta",
                "lead_time_days",
                "case_pack",
                "moq",
            ],
        )
        self.assertEqual(frame.loc[0, "on_hand"], 12)
        self.assertEqual(frame.loc[0, "in_transit"], 8)

    def test_load_sample_workspace_builds_lean_preview_summary(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            all_orders = root / "All orders"
            samples = root / "Samples"
            all_orders.mkdir()
            samples.mkdir()
            (all_orders / "March 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,SKU Subtotal Before Discount,Paid Time,Created Time",
                        "1,Delivered,Delivered,,SKU-1,Birria Bomb 2-Pack,2,0,39.98,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                        "2,Delivered,Delivered,,SKU-2,Pozole Bomb 2-Pack,1,0,19.99,03/03/2026 10:00:00 AM,03/03/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )
            (samples / "Samples 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,SKU Subtotal Before Discount,Paid Time,Created Time",
                        "11,Completed,Completed,,SKU-1,Birria Bomb 2-Pack,1,0,0,03/02/2026 10:00:00 AM,03/02/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )

            workspace = load_sample_workspace(root, platform="TikTok")

            self.assertEqual(workspace["summary"]["orders_loaded"], 2)
            self.assertEqual(workspace["summary"]["samples_loaded"], 1)
            self.assertEqual(workspace["summary"]["products_detected"], 7)
            self.assertEqual(workspace["summary"]["date_start"], "2026-03-01")
            self.assertEqual(workspace["summary"]["date_end"], "2026-03-03")
            self.assertEqual(len(workspace["inventory_template"]), 7)
            chile = workspace["inventory_frame"].loc[workspace["inventory_frame"]["product_name"].eq("Chile Colorado Bomb 2-Pack")].iloc[0]
            self.assertEqual(float(chile["in_transit"]), 12096.0)
            self.assertEqual(str(pd.Timestamp(chile["transit_eta"]).date()), "2026-04-29")

    def test_run_planning_workspace_can_use_precomputed_daily_tables(self) -> None:
        daily = pd.DataFrame(
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
        inventory = parse_inventory_csv_bytes(
            "\n".join(
                [
                    "product_name,seller_sku_resolved,on_hand,in_transit",
                    "Birria Bomb 2-Pack,SKU-1,20,0",
                ]
            ).encode("utf-8")
        )

        with patch("demand_planning_app.service.aggregate_daily_demand", side_effect=AssertionError("should not aggregate")):
            payload = run_planning_workspace(
                orders=pd.DataFrame(),
                samples=pd.DataFrame(),
                inventory=inventory,
                baseline_start="2026-03-01",
                baseline_end="2026-03-01",
                horizon_start="2026-04-01",
                horizon_end="2026-04-30",
                velocity_mode="sales_only",
                default_uplift_pct=35,
                default_lead_time_days=8,
                default_safety_days=0,
                daily_demand=daily,
                sample_daily_demand=pd.DataFrame(),
            )

        self.assertEqual(payload["summary"]["rows"], 1)
        self.assertEqual(payload["rows"][0]["product_name"], "Birria Bomb 2-Pack")
        self.assertAlmostEqual(payload["rows"][0]["mix_pct"], 1.0)

    def test_load_sample_workspace_uses_latest_sheet_inventory_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            all_orders = root / "All orders"
            all_orders.mkdir()
            (all_orders / "March 2026.csv").write_text(
                "\n".join(
                    [
                        "Order ID,Order Status,Order Substatus,Cancelation/Return Type,Seller SKU,Product Name,Quantity,Sku Quantity of return,SKU Subtotal Before Discount,Paid Time,Created Time",
                        "1,Delivered,Delivered,,SKU-1,Birria Bomb 2-Pack,2,0,39.98,03/01/2026 10:00:00 AM,03/01/2026 09:00:00 AM",
                        "2,Delivered,Delivered,,SKU-2,Pozole Bomb 2-Pack,1,0,19.99,03/03/2026 10:00:00 AM,03/03/2026 09:00:00 AM",
                    ]
                ),
                encoding="utf-8",
            )
            history = pd.DataFrame(
                [
                    {"platform": "TikTok", "date": pd.Timestamp("2026-04-14"), "product_name": "Birria Bomb 2-Pack", "on_hand": 10.0, "in_transit": 2.0},
                    {"platform": "TikTok", "date": pd.Timestamp("2026-04-15"), "product_name": "Birria Bomb 2-Pack", "on_hand": 22.0, "in_transit": 0.0},
                    {"platform": "TikTok", "date": pd.Timestamp("2026-04-13"), "product_name": "Pozole Bomb 2-Pack", "on_hand": 4.0, "in_transit": 7.0},
                    {"platform": "TikTok", "date": pd.Timestamp("2026-04-14"), "product_name": "Pozole Bomb 2-Pack", "on_hand": 5.0, "in_transit": 7.0},
                    {"platform": "TikTok", "date": pd.Timestamp("2026-04-15"), "product_name": "Pozole Bomb 2-Pack", "on_hand": 5.0, "in_transit": 1.0},
                ]
            )

            with patch("demand_planning_app.service.load_inventory_history", return_value=history):
                workspace = load_sample_workspace(root, platform="TikTok", inventory_source="https://example.com/sheet")

            self.assertEqual(workspace["summary"]["inventory_as_of"], "2026-04-15")
            self.assertEqual(workspace["summary"]["inventory_rows"], 7)
            birria = workspace["inventory_frame"].loc[workspace["inventory_frame"]["product_name"].eq("Birria Bomb 2-Pack")].iloc[0]
            pozole = workspace["inventory_frame"].loc[workspace["inventory_frame"]["product_name"].eq("Pozole Bomb 2-Pack")].iloc[0]
            self.assertEqual(float(birria["on_hand"]), 22.0)
            self.assertEqual(float(pozole["in_transit"]), 1.0)
            self.assertEqual(str(pd.Timestamp(pozole["transit_started_on"]).date()), "2026-04-13")
            self.assertEqual(str(pd.Timestamp(pozole["transit_eta"]).date()), "2026-04-17")

    def test_merge_daily_demand_replace_dates_overwrites_overlapping_days(self) -> None:
        existing = pd.DataFrame(
            [
                {"platform": "TikTok", "date": pd.Timestamp("2026-04-14"), "product_name": "Birria Bomb 2-Pack", "seller_sku_resolved": "SKU-1", "net_units": 10.0, "gross_sales": 100.0},
                {"platform": "TikTok", "date": pd.Timestamp("2026-04-15"), "product_name": "Birria Bomb 2-Pack", "seller_sku_resolved": "SKU-1", "net_units": 11.0, "gross_sales": 110.0},
            ]
        )
        incoming = pd.DataFrame(
            [
                {"platform": "TikTok", "date": pd.Timestamp("2026-04-15"), "product_name": "Birria Bomb 2-Pack", "seller_sku_resolved": "SKU-1", "net_units": 22.0, "gross_sales": 220.0},
                {"platform": "TikTok", "date": pd.Timestamp("2026-04-16"), "product_name": "Birria Bomb 2-Pack", "seller_sku_resolved": "SKU-1", "net_units": 33.0, "gross_sales": 330.0},
            ]
        )

        merged = merge_daily_demand_replace_dates(existing, incoming)

        self.assertEqual(list(merged["date"].dt.strftime("%Y-%m-%d")), ["2026-04-14", "2026-04-15", "2026-04-16"])
        self.assertEqual(float(merged.loc[merged["date"].eq(pd.Timestamp("2026-04-15")), "net_units"].iloc[0]), 22.0)

    def test_saved_uplift_pct_persists_by_month(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "forecast-defaults.json"

            self.assertEqual(get_saved_uplift_pct(path, "2026-05-01", fallback=35.0), 35.0)

            save_uplift_pct_for_month(path, "2026-05-15", 22.5)
            save_uplift_pct_for_month(path, "2026-06-01", -10.0)

            self.assertEqual(get_saved_uplift_pct(path, "2026-05-01", fallback=35.0), 22.5)
            self.assertEqual(get_saved_uplift_pct(path, "2026-05-31", fallback=35.0), 22.5)
            self.assertEqual(get_saved_uplift_pct(path, "2026-06-20", fallback=35.0), -10.0)

    def test_save_forecast_setting_persists_product_mix(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "forecast-defaults.json"

            save_forecast_setting_for_month(
                path,
                "2026-11-01",
                uplift_pct=80.0,
                product_mix={
                    "Birria Bomb 2-Pack": 35,
                    "Brine Bomb": 30,
                    "Pozole Verde Bomb 2-Pack": 15,
                    "Pozole Bomb 2-Pack": 10,
                    "Tinga Bomb 2-Pack": 5,
                    "Variety Pack": 5,
                },
            )

            settings = load_saved_forecast_settings(path)

            self.assertIn("2026-11", settings)
            self.assertEqual(settings["2026-11"]["upliftPct"], 80.0)
            self.assertAlmostEqual(settings["2026-11"]["productMix"]["Birria Bomb 2-Pack"], 0.35, places=4)
            self.assertAlmostEqual(settings["2026-11"]["productMix"]["Brine Bomb"], 0.30, places=4)

    def test_build_monthly_units_plan_projects_jan_to_dec(self) -> None:
        plan_rows = pd.DataFrame(
            [
                {
                    "product_name": "Birria Bomb 2-Pack",
                    "avg_daily_demand": 10.0,
                }
            ]
        )
        monthly = {
            "2026-01": 20.0,
            "2026-02": 10.0,
            "2026-03": 0.0,
        }

        payload = build_monthly_units_plan(plan_rows, planning_year=2026, monthly_uplift_pcts=monthly)

        self.assertEqual(payload["months"][0]["key"], "2026-01")
        self.assertEqual(payload["months"][-1]["key"], "2026-12")
        self.assertEqual(len(payload["rows"]), 1)
        row = payload["rows"][0]
        self.assertEqual(row["product_name"], "Birria Bomb 2-Pack")
        self.assertAlmostEqual(row["2026-01"], 372.0, places=4)
        self.assertAlmostEqual(row["2026-02"], 308.0, places=4)
        self.assertAlmostEqual(row["2026-03"], 310.0, places=4)

    def test_build_monthly_units_plan_uses_saved_product_mix_for_month(self) -> None:
        plan_rows = pd.DataFrame(
            [
                {"product_name": "Birria Bomb 2-Pack", "avg_daily_demand": 10.0},
                {"product_name": "Brine Bomb", "avg_daily_demand": 1.0},
            ]
        )

        payload = build_monthly_units_plan(
            plan_rows,
            planning_year=2026,
            monthly_forecast_settings={
                "2026-11": {
                    "upliftPct": 80.0,
                    "productMix": {
                        "Birria Bomb 2-Pack": 35,
                        "Brine Bomb": 30,
                        "Pozole Verde Bomb 2-Pack": 15,
                        "Pozole Bomb 2-Pack": 10,
                        "Tinga Bomb 2-Pack": 5,
                        "Variety Pack": 5,
                    },
                }
            },
        )

        november = next(month for month in payload["months"] if month["key"] == "2026-11")
        rows = {row["product_name"]: row for row in payload["rows"]}

        self.assertEqual(november["uplift_pct"], 80.0)
        self.assertAlmostEqual(rows["Birria Bomb 2-Pack"]["2026-11"], 207.9, places=1)
        self.assertAlmostEqual(rows["Brine Bomb"]["2026-11"], 178.2, places=1)

    def test_build_monthly_units_plan_respects_launch_date_for_new_core_product(self) -> None:
        plan_rows = pd.DataFrame(
            [
                {"product_name": "Birria Bomb 2-Pack", "avg_daily_demand": 10.0},
                {"product_name": "Chile Colorado Bomb 2-Pack", "avg_daily_demand": 0.0},
            ]
        )

        payload = build_monthly_units_plan(
            plan_rows,
            planning_year=2026,
            monthly_forecast_settings={
                "2026-04": {
                    "upliftPct": 0.0,
                    "productMix": {
                        "Chile Colorado Bomb 2-Pack": 100,
                    },
                },
                "2026-05": {
                    "upliftPct": 0.0,
                    "productMix": {
                        "Chile Colorado Bomb 2-Pack": 100,
                    },
                },
            },
        )

        rows = {row["product_name"]: row for row in payload["rows"]}
        self.assertAlmostEqual(rows["Chile Colorado Bomb 2-Pack"]["2026-03"], 0.0, places=4)
        self.assertAlmostEqual(rows["Chile Colorado Bomb 2-Pack"]["2026-04"], 20.0, places=4)
        self.assertAlmostEqual(rows["Chile Colorado Bomb 2-Pack"]["2026-05"], 310.0, places=4)

    def test_build_monthly_units_plan_uses_actuals_for_months_that_already_exist(self) -> None:
        plan_rows = pd.DataFrame(
            [
                {"product_name": "Birria Bomb 2-Pack", "avg_daily_demand": 10.0},
                {"product_name": "Pozole Verde Bomb 2-Pack", "avg_daily_demand": 5.0},
            ]
        )
        actual_daily = pd.DataFrame(
            [
                {
                    "date": pd.Timestamp("2026-01-05"),
                    "product_name": "Birria Bomb 2-Pack",
                    "net_units": 100.0,
                },
                {
                    "date": pd.Timestamp("2026-02-03"),
                    "product_name": "Birria Bomb 2-Pack",
                    "net_units": 80.0,
                },
                {
                    "date": pd.Timestamp("2026-03-10"),
                    "product_name": "Birria Bomb 2-Pack",
                    "net_units": 70.0,
                },
                {
                    "date": pd.Timestamp("2026-03-11"),
                    "product_name": "Pozole Verde Bomb 2-Pack",
                    "net_units": 40.0,
                },
            ]
        )

        payload = build_monthly_units_plan(
            plan_rows,
            planning_year=2026,
            actual_daily_demand=actual_daily,
            monthly_uplift_pcts={"2026-05": 30.0},
        )

        months = {month["key"]: month for month in payload["months"]}
        rows = {row["product_name"]: row for row in payload["rows"]}

        self.assertEqual(months["2026-01"]["mode"], "actual")
        self.assertEqual(months["2026-02"]["mode"], "actual")
        self.assertEqual(months["2026-03"]["mode"], "actual")
        self.assertEqual(months["2026-05"]["mode"], "forecast")
        self.assertAlmostEqual(rows["Birria Bomb 2-Pack"]["2026-01"], 100.0, places=4)
        self.assertAlmostEqual(rows["Birria Bomb 2-Pack"]["2026-02"], 80.0, places=4)
        self.assertAlmostEqual(rows["Pozole Verde Bomb 2-Pack"]["2026-01"], 0.0, places=4)
        self.assertAlmostEqual(rows["Pozole Verde Bomb 2-Pack"]["2026-02"], 0.0, places=4)
        self.assertAlmostEqual(rows["Pozole Verde Bomb 2-Pack"]["2026-03"], 40.0, places=4)

    def test_build_historical_trend_returns_year_totals_product_rows_and_yoy(self) -> None:
        daily = pd.DataFrame(
            [
                {"date": pd.Timestamp("2024-01-05"), "product_name": "Birria Bomb 2-Pack", "net_units": 10.0},
                {"date": pd.Timestamp("2025-01-05"), "product_name": "Birria Bomb 2-Pack", "net_units": 20.0},
                {"date": pd.Timestamp("2026-01-05"), "product_name": "Birria Bomb 2-Pack", "net_units": 30.0},
                {"date": pd.Timestamp("2026-03-11"), "product_name": "Pozole Verde Bomb 2-Pack", "net_units": 40.0},
            ]
        )

        payload = build_historical_trend(daily, focus_year=2026)

        self.assertEqual(payload["years"], [2024, 2025, 2026])
        birria_row = next(row for row in payload["productMonthly"] if row["product_name"] == "Birria Bomb 2-Pack")
        verde_row = next(row for row in payload["productMonthly"] if row["product_name"] == "Pozole Verde Bomb 2-Pack")
        jan_yoy = next(row for row in payload["yoyByMonth"] if row["label"] == "Jan")
        self.assertAlmostEqual(birria_row["2026-01"], 30.0, places=4)
        self.assertAlmostEqual(verde_row["2026-01"], 0.0, places=4)
        self.assertAlmostEqual(jan_yoy["previous_units"], 20.0, places=4)
        self.assertAlmostEqual(jan_yoy["current_units"], 30.0, places=4)
        self.assertAlmostEqual(jan_yoy["yoy_pct"], 0.5, places=4)

    def test_build_launch_planning_uses_proxy_launch_curve_for_new_product(self) -> None:
        daily = pd.DataFrame(
            [
                {"date": pd.Timestamp("2026-03-10"), "product_name": "Pozole Verde Bomb 2-Pack", "net_units": 100.0},
                {"date": pd.Timestamp("2026-03-20"), "product_name": "Pozole Verde Bomb 2-Pack", "net_units": 200.0},
                {"date": pd.Timestamp("2026-04-05"), "product_name": "Pozole Verde Bomb 2-Pack", "net_units": 300.0},
                {"date": pd.Timestamp("2026-04-12"), "product_name": "Pozole Verde Bomb 2-Pack", "net_units": 100.0},
            ]
        )

        payload = build_launch_planning(daily, focus_year=2026)

        self.assertIn("rows", payload)
        chile_row = next(row for row in payload["rows"] if row["product_name"] == "Chile Colorado Bomb 2-Pack")
        self.assertEqual(chile_row["proxy_product_name"], "Pozole Verde Bomb 2-Pack")
        self.assertAlmostEqual(chile_row["proxy_first_30_day_units"], 600.0, places=4)
        self.assertAlmostEqual(chile_row["proxy_first_30_day_daily_velocity"], 600.0 / 30.0, places=4)
        self.assertEqual(chile_row["launch_units_committed"], 12096.0)
        self.assertGreater(chile_row["base_weeks_of_cover"], 0.0)

    def test_run_planning_workspace_includes_launch_planning_payload(self) -> None:
        daily = pd.DataFrame(
            [
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-10"),
                    "product_name": "Pozole Verde Bomb 2-Pack",
                    "seller_sku_resolved": "SKU-VERDE",
                    "net_units": 100.0,
                    "gross_sales": 1999.0,
                },
                {
                    "platform": "TikTok",
                    "date": pd.Timestamp("2026-03-20"),
                    "product_name": "Pozole Verde Bomb 2-Pack",
                    "seller_sku_resolved": "SKU-VERDE",
                    "net_units": 200.0,
                    "gross_sales": 3998.0,
                },
            ]
        )
        inventory = parse_inventory_csv_bytes(
            "\n".join(
                [
                    "product_name,seller_sku_resolved,on_hand,in_transit,transit_eta",
                    "Chile Colorado Bomb 2-Pack,,0,12096,2026-04-29",
                ]
            ).encode("utf-8")
        )

        payload = run_planning_workspace(
            orders=pd.DataFrame(),
            samples=pd.DataFrame(),
            inventory=inventory,
            daily_demand=daily,
            sample_daily_demand=pd.DataFrame(),
            baseline_start="2026-03-10",
            baseline_end="2026-04-15",
            horizon_start="2026-05-01",
            horizon_end="2026-05-31",
            velocity_mode="sales_only",
            default_uplift_pct=35,
            default_lead_time_days=8,
            default_safety_days=0,
        )

        self.assertIn("launchPlanning", payload)
        chile_row = next(row for row in payload["launchPlanning"]["rows"] if row["product_name"] == "Chile Colorado Bomb 2-Pack")
        self.assertEqual(chile_row["launch_units_committed"], 12096.0)

    def test_run_planning_workspace_can_project_different_planning_year(self) -> None:
        daily = pd.DataFrame(
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
        inventory = parse_inventory_csv_bytes(
            "\n".join(
                [
                    "product_name,seller_sku_resolved,on_hand,in_transit",
                    "Birria Bomb 2-Pack,SKU-1,100,0",
                ]
            ).encode("utf-8")
        )

        payload = run_planning_workspace(
            orders=pd.DataFrame(),
            samples=pd.DataFrame(),
            inventory=inventory,
            baseline_start="2026-03-01",
            baseline_end="2026-03-01",
            horizon_start="2026-05-01",
            horizon_end="2026-05-31",
            velocity_mode="sales_only",
            default_uplift_pct=35,
            default_lead_time_days=8,
            default_safety_days=0,
            daily_demand=daily,
            sample_daily_demand=pd.DataFrame(),
            planning_year=2027,
        )

        self.assertEqual(payload["monthlyPlan"]["year"], 2027)
        self.assertEqual(payload["monthlyPlan"]["months"][0]["key"], "2027-01")

    def test_run_planning_workspace_returns_monthly_units_for_jan_to_dec(self) -> None:
        daily = pd.DataFrame(
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
        inventory = parse_inventory_csv_bytes(
            "\n".join(
                [
                    "product_name,seller_sku_resolved,on_hand,in_transit",
                    "Birria Bomb 2-Pack,SKU-1,100,0",
                ]
            ).encode("utf-8")
        )

        payload = run_planning_workspace(
            orders=pd.DataFrame(),
            samples=pd.DataFrame(),
            inventory=inventory,
            baseline_start="2026-03-01",
            baseline_end="2026-03-01",
            horizon_start="2026-04-01",
            horizon_end="2026-04-30",
            velocity_mode="sales_only",
            default_uplift_pct=35,
            default_lead_time_days=8,
            default_safety_days=0,
            daily_demand=daily,
            sample_daily_demand=pd.DataFrame(),
            monthly_uplift_pcts={"2026-01": 10.0, "2026-12": -10.0},
        )

        self.assertEqual(payload["monthlyPlan"]["year"], 2026)
        self.assertEqual(payload["monthlyPlan"]["months"][0]["key"], "2026-01")
        self.assertEqual(payload["monthlyPlan"]["months"][-1]["key"], "2026-12")
        row = payload["monthlyPlan"]["rows"][0]
        self.assertAlmostEqual(row["2026-01"], 341.0, places=4)
        self.assertAlmostEqual(row["2026-12"], 279.0, places=4)
        self.assertAlmostEqual(row["year_mix_pct"], 1.0, places=4)
        self.assertEqual(len(payload["productMix"]["rows"]), 1)
        self.assertAlmostEqual(payload["productMix"]["rows"][0]["mix_pct"], 1.0, places=4)
        self.assertIn("historicalTrend", payload)

    def test_run_planning_workspace_keeps_launch_product_with_zero_prelaunch_actuals(self) -> None:
        daily = pd.DataFrame(
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
        inventory = parse_inventory_csv_bytes(
            "\n".join(
                [
                    "product_name,seller_sku_resolved,on_hand,in_transit,transit_eta",
                    "Birria Bomb 2-Pack,SKU-1,100,0,",
                    "Chile Colorado Bomb 2-Pack,,0,12096,2026-04-29",
                ]
            ).encode("utf-8")
        )

        payload = run_planning_workspace(
            orders=pd.DataFrame(),
            samples=pd.DataFrame(),
            inventory=inventory,
            daily_demand=daily,
            sample_daily_demand=pd.DataFrame(),
            baseline_start="2026-03-01",
            baseline_end="2026-03-01",
            horizon_start="2026-05-01",
            horizon_end="2026-05-31",
            velocity_mode="sales_only",
            default_uplift_pct=35,
            default_lead_time_days=8,
            default_safety_days=0,
            monthly_forecast_settings={
                "2026-05": {
                    "upliftPct": 35.0,
                    "productMix": {
                        "Birria Bomb 2-Pack": 80,
                        "Chile Colorado Bomb 2-Pack": 20,
                    },
                }
            },
        )

        monthly_rows = {row["product_name"]: row for row in payload["monthlyPlan"]["rows"]}
        plan_rows = {row["product_name"]: row for row in payload["rows"]}
        self.assertIn("Chile Colorado Bomb 2-Pack", monthly_rows)
        self.assertAlmostEqual(monthly_rows["Chile Colorado Bomb 2-Pack"]["2026-01"], 0.0, places=4)
        self.assertAlmostEqual(monthly_rows["Chile Colorado Bomb 2-Pack"]["2026-02"], 0.0, places=4)
        self.assertGreater(float(monthly_rows["Chile Colorado Bomb 2-Pack"]["2026-05"]), 0.0)
        self.assertEqual(float(plan_rows["Chile Colorado Bomb 2-Pack"]["current_supply_units"]), 12096.0)

    def test_run_planning_workspace_suppresses_prelaunch_horizon_for_new_product(self) -> None:
        daily = pd.DataFrame(
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
        inventory = parse_inventory_csv_bytes(
            "\n".join(
                [
                    "product_name,seller_sku_resolved,on_hand,in_transit,transit_eta",
                    "Chile Colorado Bomb 2-Pack,,0,12096,2026-04-29",
                ]
            ).encode("utf-8")
        )

        payload = run_planning_workspace(
            orders=pd.DataFrame(),
            samples=pd.DataFrame(),
            inventory=inventory,
            daily_demand=daily,
            sample_daily_demand=pd.DataFrame(),
            baseline_start="2026-03-01",
            baseline_end="2026-03-31",
            horizon_start="2026-04-01",
            horizon_end="2026-04-28",
            velocity_mode="sales_only",
            default_uplift_pct=35,
            default_lead_time_days=8,
            default_safety_days=0,
            monthly_forecast_settings={
                "2026-04": {
                    "upliftPct": 35.0,
                    "productMix": {
                        "Chile Colorado Bomb 2-Pack": 100,
                    },
                }
            },
        )

        chile_row = next(row for row in payload["rows"] if row["product_name"] == "Chile Colorado Bomb 2-Pack")
        self.assertEqual(float(chile_row["forecast_units"]), 0.0)
        self.assertEqual(chile_row["status"], "No demand")

    def test_apply_month_forecast_uses_active_days_for_partial_launch_daily_demand(self) -> None:
        plan_rows = pd.DataFrame(
            [
                {
                    "product_name": "Chile Colorado Bomb 2-Pack",
                    "avg_daily_demand": 0.0,
                    "avg_daily_gross_sales": 0.0,
                    "on_hand": 0.0,
                    "current_supply_units": 12096.0,
                    "lead_time_days": 8.0,
                    "safety_stock_weeks": 3.0,
                    "snapshot_date": pd.Timestamp("2026-04-01"),
                },
                {
                    "product_name": "Birria Bomb 2-Pack",
                    "avg_daily_demand": 10.0,
                    "avg_daily_gross_sales": 199.9,
                    "on_hand": 100.0,
                    "current_supply_units": 100.0,
                    "lead_time_days": 8.0,
                    "safety_stock_weeks": 3.0,
                    "snapshot_date": pd.Timestamp("2026-04-01"),
                },
            ]
        )

        adjusted = apply_month_forecast_to_plan(
            plan_rows,
            horizon_start="2026-04-01",
            horizon_end="2026-04-30",
            fallback_pct=0.0,
            monthly_forecast_settings={
                "2026-04": {
                    "upliftPct": 0.0,
                    "productMix": {
                        "Chile Colorado Bomb 2-Pack": 100,
                    },
                }
            },
        )

        chile_row = adjusted.loc[adjusted["product_name"].eq("Chile Colorado Bomb 2-Pack")].iloc[0]
        self.assertAlmostEqual(float(chile_row["forecast_units"]), 20.0, places=4)
        self.assertAlmostEqual(float(chile_row["forecast_daily_demand"]), 10.0, places=4)

    def test_apply_month_forecast_starts_launch_stockout_timing_at_launch_date(self) -> None:
        plan_rows = pd.DataFrame(
            [
                {
                    "product_name": "Chile Colorado Bomb 2-Pack",
                    "avg_daily_demand": 0.0,
                    "avg_daily_gross_sales": 0.0,
                    "on_hand": 0.0,
                    "current_supply_units": 20.0,
                    "lead_time_days": 8.0,
                    "safety_stock_weeks": 3.0,
                    "snapshot_date": pd.Timestamp("2026-03-31"),
                },
                {
                    "product_name": "Birria Bomb 2-Pack",
                    "avg_daily_demand": 10.0,
                    "avg_daily_gross_sales": 199.9,
                    "on_hand": 100.0,
                    "current_supply_units": 100.0,
                    "lead_time_days": 8.0,
                    "safety_stock_weeks": 3.0,
                    "snapshot_date": pd.Timestamp("2026-03-31"),
                },
            ]
        )

        adjusted = apply_month_forecast_to_plan(
            plan_rows,
            horizon_start="2026-04-01",
            horizon_end="2026-04-30",
            fallback_pct=0.0,
            monthly_forecast_settings={
                "2026-04": {
                    "upliftPct": 0.0,
                    "productMix": {
                        "Chile Colorado Bomb 2-Pack": 100,
                    },
                }
            },
        )

        chile_row = adjusted.loc[adjusted["product_name"].eq("Chile Colorado Bomb 2-Pack")].iloc[0]
        self.assertEqual(str(pd.Timestamp(chile_row["projected_stockout_date"]).date()), "2026-05-01")

    def test_apply_month_forecast_uses_horizon_start_after_launch_for_future_months(self) -> None:
        plan_rows = pd.DataFrame(
            [
                {
                    "product_name": "Chile Colorado Bomb 2-Pack",
                    "avg_daily_demand": 0.0,
                    "avg_daily_gross_sales": 0.0,
                    "on_hand": 0.0,
                    "current_supply_units": 20.0,
                    "lead_time_days": 8.0,
                    "safety_stock_weeks": 3.0,
                    "snapshot_date": pd.Timestamp("2026-03-31"),
                },
                {
                    "product_name": "Birria Bomb 2-Pack",
                    "avg_daily_demand": 10.0,
                    "avg_daily_gross_sales": 199.9,
                    "on_hand": 100.0,
                    "current_supply_units": 100.0,
                    "lead_time_days": 8.0,
                    "safety_stock_weeks": 3.0,
                    "snapshot_date": pd.Timestamp("2026-03-31"),
                },
            ]
        )

        adjusted = apply_month_forecast_to_plan(
            plan_rows,
            horizon_start="2026-05-01",
            horizon_end="2026-05-31",
            fallback_pct=0.0,
            monthly_forecast_settings={
                "2026-05": {
                    "upliftPct": 0.0,
                    "productMix": {
                        "Chile Colorado Bomb 2-Pack": 100,
                    },
                }
            },
        )

        chile_row = adjusted.loc[adjusted["product_name"].eq("Chile Colorado Bomb 2-Pack")].iloc[0]
        self.assertEqual(str(pd.Timestamp(chile_row["projected_stockout_date"]).date()), "2026-05-03")


if __name__ == "__main__":
    unittest.main()
