from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from demand_planning_app.planning_products import PRODUCT_CATALOG
from demand_planning_app.service import load_saved_forecast_settings


ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_LOCAL_PATH = ROOT_DIR / ".env.local"
FORECAST_DEFAULTS_PATH = ROOT_DIR / "planner_forecast_defaults.json"


@dataclass
class FirestoreConfig:
    project_id: str
    service_account_path: Path


def _read_dotenv(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def load_firestore_config(env_path: Path = ENV_LOCAL_PATH) -> FirestoreConfig:
    env_values = _read_dotenv(env_path)
    project_id = os.environ.get("FIREBASE_PROJECT_ID") or env_values.get("FIREBASE_PROJECT_ID") or ""
    service_account = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH") or env_values.get("FIREBASE_SERVICE_ACCOUNT_PATH") or ""
    if not project_id:
        raise ValueError("Missing FIREBASE_PROJECT_ID. Add it to .env.local or your environment.")
    if not service_account:
        raise ValueError("Missing FIREBASE_SERVICE_ACCOUNT_PATH. Add it to .env.local or your environment.")
    service_account_path = Path(service_account).expanduser()
    if not service_account_path.exists():
        raise FileNotFoundError(f"Firebase service account JSON not found: {service_account_path}")
    return FirestoreConfig(project_id=project_id, service_account_path=service_account_path)


def get_firestore_client(config: FirestoreConfig):
    import firebase_admin
    from firebase_admin import credentials, firestore

    app_name = f"demand-planning-{config.project_id}"
    try:
        app = firebase_admin.get_app(app_name)
    except ValueError:
        credential = credentials.Certificate(str(config.service_account_path))
        app = firebase_admin.initialize_app(credential, {"projectId": config.project_id}, name=app_name)
    return firestore.client(app=app)


def _slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", str(value or "").strip().lower())
    return cleaned.strip("-") or "unknown"


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, Path):
        return str(value)
    if hasattr(value, "item"):
        return value.item()
    return value


def _frame_records(frame: pd.DataFrame) -> list[dict[str, Any]]:
    if frame is None or frame.empty:
        return []
    return [{key: _json_safe(value) for key, value in row.items()} for row in frame.to_dict(orient="records")]


def _daily_doc_id(record: dict[str, Any]) -> str:
    return f"{record.get('date', 'unknown')}__{_slug(record.get('product_name', 'unknown'))}"


def _inventory_doc_id(record: dict[str, Any], snapshot_date: str | None) -> str:
    return f"{snapshot_date or 'unknown'}__{_slug(record.get('product_name', 'unknown'))}"


def _forecast_record(month_key: str, setting: dict[str, Any]) -> dict[str, Any]:
    return {
        "yearMonth": month_key,
        "upliftPct": float(setting.get("upliftPct", 0.0) or 0.0),
        "productMix": setting.get("productMix") or {},
    }


def _launch_plan_records() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for product_name, metadata in PRODUCT_CATALOG.items():
        if not metadata.get("launch_date"):
            continue
        rows.append(
            {
                "productName": product_name,
                "launchDate": metadata.get("launch_date"),
                "launchUnitsCommitted": float(metadata.get("launch_inbound_units", 0.0) or 0.0),
                "proxyProductName": metadata.get("launch_proxy_product"),
                "launchStrengthPct": float(metadata.get("launch_strength_pct", 0.0) or 0.0),
                "launchSampleUnits": float(metadata.get("launch_sample_units", 0.0) or 0.0),
                "launchBundleUpliftPct": float(metadata.get("launch_bundle_uplift_pct", 0.0) or 0.0),
                "launchCoverWeeksTarget": float(metadata.get("launch_cover_weeks_target", 0.0) or 0.0),
                "listPrice": float(metadata.get("list_price", 0.0) or 0.0),
                "cogs": float(metadata.get("cogs", 0.0) or 0.0),
            }
        )
    return rows


def build_sync_payload(include_kpis: bool = False) -> dict[str, list[tuple[str, dict[str, Any]]]]:
    import app as preview_app

    if not preview_app.load_saved_state():
        preview_app.load_sample_state()

    forecast_settings = load_saved_forecast_settings(FORECAST_DEFAULTS_PATH)
    inventory_snapshot_date = str(preview_app.STATE.summary.get("inventory_as_of") or "")

    payload: dict[str, list[tuple[str, dict[str, Any]]]] = {
        "planningDemandDaily": [
            (_daily_doc_id(record), record)
            for record in _frame_records(preview_app.STATE.daily_demand)
        ],
        "planningSamplesDaily": [
            (_daily_doc_id(record), record)
            for record in _frame_records(preview_app.STATE.samples_daily_demand)
        ],
        "inventorySnapshots": [
            (
                _inventory_doc_id(record, inventory_snapshot_date),
                {**record, "snapshotDate": inventory_snapshot_date},
            )
            for record in _frame_records(preview_app.STATE.inventory)
        ],
        "forecastSettings": [
            (month_key, _forecast_record(month_key, setting))
            for month_key, setting in (forecast_settings or {}).items()
        ],
        "launchPlans": [
            (_slug(record["productName"]), record)
            for record in _launch_plan_records()
        ],
    }

    if include_kpis:
        kpi_collection_map = {
            "kpiOrdersSummary": ("kpi_orders_summary", lambda record: f"{record.get('date_start', 'unknown')}__{record.get('date_end', 'unknown')}"),
            "kpiOrdersDaily": ("kpi_orders_daily", lambda record: f"{record.get('reporting_date', 'unknown')}"),
            "kpiProductsDaily": ("kpi_products_daily", lambda record: f"{record.get('reporting_date', 'unknown')}__{_slug(record.get('product_name', 'unknown'))}"),
            "kpiCustomerRollup": ("kpi_customer_rollup", lambda record: _slug(record.get("customer_id", "unknown"))),
            "kpiCities": ("kpi_cities", lambda record: f"{_slug(record.get('city', 'unknown'))}__{_slug(record.get('state', 'unknown'))}"),
            "kpiZips": ("kpi_zips", lambda record: f"{_slug(record.get('zipcode', 'unknown'))}"),
        }
        for collection_name, (table_key, id_builder) in kpi_collection_map.items():
            table = preview_app.STATE.kpi_tables.get(table_key, pd.DataFrame())
            payload[collection_name] = [(id_builder(record), record) for record in _frame_records(table)]

    return payload


def sync_payload_to_firestore(client, payload: dict[str, list[tuple[str, dict[str, Any]]]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for collection_name, records in payload.items():
        count = 0
        batch = client.batch()
        batch_size = 0
        for doc_id, document in records:
            reference = client.collection(collection_name).document(doc_id)
            batch.set(reference, document, merge=True)
            batch_size += 1
            count += 1
            if batch_size >= 400:
                batch.commit()
                batch = client.batch()
                batch_size = 0
        if batch_size:
            batch.commit()
        counts[collection_name] = count
    return counts


def dump_payload_summary(payload: dict[str, list[tuple[str, dict[str, Any]]]]) -> str:
    summary = {collection_name: len(records) for collection_name, records in payload.items()}
    return json.dumps(summary, indent=2)
