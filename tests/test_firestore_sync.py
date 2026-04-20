import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

from demand_planning_app.firestore_sync import (
    FirestoreConfig,
    _daily_doc_id,
    _inventory_doc_id,
    _launch_plan_records,
    build_sync_payload,
    load_firestore_config,
)


class FirestoreSyncTests(unittest.TestCase):
    def test_load_firestore_config_reads_env_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            key_path = root / "service-account.json"
            key_path.write_text("{}", encoding="utf-8")
            env_path = root / ".env.local"
            env_path.write_text(
                "\n".join(
                    [
                        "FIREBASE_PROJECT_ID=ezbttsv1",
                        f"FIREBASE_SERVICE_ACCOUNT_PATH={key_path}",
                    ]
                ),
                encoding="utf-8",
            )

            config = load_firestore_config(env_path)

        self.assertEqual(config, FirestoreConfig(project_id="ezbttsv1", service_account_path=key_path))

    def test_doc_id_builders_are_stable(self) -> None:
        daily = _daily_doc_id({"date": "2026-04-20", "product_name": "Birria Bomb 2-Pack"})
        inventory = _inventory_doc_id({"product_name": "Chile Colorado Bomb 2-Pack"}, "2026-04-29")
        self.assertEqual(daily, "2026-04-20__birria-bomb-2-pack")
        self.assertEqual(inventory, "2026-04-29__chile-colorado-bomb-2-pack")

    def test_launch_plan_records_include_chile_colorado(self) -> None:
        rows = _launch_plan_records()
        chile = next(row for row in rows if row["productName"] == "Chile Colorado Bomb 2-Pack")
        self.assertEqual(chile["launchUnitsCommitted"], 12096.0)
        self.assertEqual(chile["launchDate"], "2026-04-29")

    @patch("app.load_saved_state", return_value=True)
    @patch("demand_planning_app.firestore_sync.load_saved_forecast_settings")
    def test_build_sync_payload_uses_existing_state_tables(self, mock_forecast_settings, _mock_load_saved_state) -> None:
        import app as preview_app

        mock_forecast_settings.return_value = {
            "2026-05": {"upliftPct": 30.0, "productMix": {"Birria Bomb 2-Pack": 0.6}}
        }
        old_state = preview_app.STATE
        try:
            preview_app.STATE = preview_app.WorkspaceState(
                orders=pd.DataFrame(),
                samples=pd.DataFrame(),
                inventory=pd.DataFrame(
                    [
                        {
                            "product_name": "Birria Bomb 2-Pack",
                            "on_hand": 100,
                            "in_transit": 50,
                            "transit_eta": pd.Timestamp("2026-04-29"),
                        }
                    ]
                ),
                daily_demand=pd.DataFrame(
                    [
                        {
                            "platform": "TikTok",
                            "date": pd.Timestamp("2026-04-20"),
                            "product_name": "Birria Bomb 2-Pack",
                            "seller_sku_resolved": "SKU-1",
                            "net_units": 20.0,
                            "gross_sales": 399.8,
                        }
                    ]
                ),
                samples_daily_demand=pd.DataFrame(),
                order_row_counts=pd.DataFrame(),
                sample_row_counts=pd.DataFrame(),
                kpi_tables={},
                summary={
                    "inventory_as_of": "2026-04-20",
                },
                inventory_template=[],
            )

            payload = build_sync_payload(include_kpis=False)
        finally:
            preview_app.STATE = old_state

        self.assertIn("planningDemandDaily", payload)
        self.assertEqual(payload["planningDemandDaily"][0][0], "2026-04-20__birria-bomb-2-pack")
        self.assertEqual(payload["inventorySnapshots"][0][0], "2026-04-20__birria-bomb-2-pack")
        self.assertEqual(payload["forecastSettings"][0][0], "2026-05")


if __name__ == "__main__":
    unittest.main()
