from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

ROOT_DIR = Path(__file__).resolve().parent.parent
WEB_DATA_DIR = ROOT_DIR / "web" / "data"
sys.path.insert(0, str(ROOT_DIR))

from demand_planning_app.firestore_sync import get_firestore_client, load_firestore_config  # noqa: E402


PLANNER_COLLECTIONS_MINIMAL = [
    "planningDemandDaily",
    "planningSamplesDaily",
    "planningSkuSalesDaily",
    "planningUploadAudit",
]

PLANNER_COLLECTIONS_FULL = [
    *PLANNER_COLLECTIONS_MINIMAL,
    "inventorySnapshots",
    "forecastSettings",
    "planningSettings",
    "launchPlans",
    "campaignEvents",
]


def _base64url(text: str) -> str:
    encoded = base64.urlsafe_b64encode(text.encode("utf-8")).decode("ascii")
    return encoded.rstrip("=")


def _slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", str(value or "").strip().lower())
    return cleaned.strip("-") or "unknown"


def _as_float(value: Any) -> float:
    raw = str(value or "").strip().replace(",", "").replace("$", "")
    if not raw:
        return 0.0
    if raw.startswith("(") and raw.endswith(")"):
        raw = "-" + raw[1:-1]
    try:
        return float(raw)
    except Exception:
        return 0.0


def _read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        return [dict(row) for row in reader]


def _write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=True) + "\n")
            count += 1
    return count


def _iter_collection_docs(client, collection_name: str, *, page_size: int = 1000):
    # Stream by document name for stable paging.
    last_doc = None
    while True:
        query = client.collection(collection_name).order_by("__name__").limit(page_size)
        if last_doc is not None:
            query = query.start_after(last_doc)
        docs = list(query.stream())
        if not docs:
            return
        for doc in docs:
            yield doc
        last_doc = docs[-1]


def backup_collections(client, collections: list[str], backup_dir: Path) -> dict[str, int]:
    counts: dict[str, int] = {}
    for collection_name in collections:
        out_path = backup_dir / f"{collection_name}.jsonl"
        docs = (
            {"id": doc.id, "data": doc.to_dict() or {}}
            for doc in _iter_collection_docs(client, collection_name, page_size=800)
        )
        counts[collection_name] = _write_jsonl(out_path, docs)
    return counts


def delete_collection(client, collection_name: str, *, batch_size: int = 400) -> int:
    deleted = 0
    while True:
        docs = list(client.collection(collection_name).order_by("__name__").limit(batch_size).stream())
        if not docs:
            break
        batch = client.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        deleted += len(docs)
    return deleted


@dataclass
class SeedPayload:
    demand_docs: list[tuple[str, dict[str, Any]]]
    sample_docs: list[tuple[str, dict[str, Any]]]
    sku_sales_docs: list[tuple[str, dict[str, Any]]]
    upload_audit_docs: list[tuple[str, dict[str, Any]]]
    inventory_docs: list[tuple[str, dict[str, Any]]]
    forecast_setting_docs: list[tuple[str, dict[str, Any]]]
    planner_settings_doc: dict[str, Any] | None
    campaign_event_docs: list[tuple[str, dict[str, Any]]]
    launch_plan_docs: list[tuple[str, dict[str, Any]]]


def build_seed_payload_from_web_data() -> SeedPayload:
    demand_rows = _read_csv_rows(WEB_DATA_DIR / "planning_demand_daily.csv")
    sample_rows = _read_csv_rows(WEB_DATA_DIR / "planning_samples_daily.csv")
    sku_sales_rows = _read_csv_rows(WEB_DATA_DIR / "planning_sku_sales_daily.csv")
    inventory_rows = _read_csv_rows(WEB_DATA_DIR / "planning_inventory_daily.csv")

    demand_docs: list[tuple[str, dict[str, Any]]] = []
    for row in demand_rows:
        platform = (row.get("platform") or "TikTok").strip() or "TikTok"
        date = (row.get("date") or "").strip()
        product_name = (row.get("product_name") or "").strip()
        if not date or not product_name:
            continue
        doc_id = _base64url(f"{platform}__{date}__{product_name}")
        demand_docs.append(
            (
                doc_id,
                {
                    "platform": platform,
                    "date": date,
                    "product_name": product_name,
                    "seller_sku_resolved": (row.get("seller_sku_resolved") or "").strip(),
                    "net_units": _as_float(row.get("net_units")),
                    "gross_sales": _as_float(row.get("gross_sales")),
                    "net_gross_sales": _as_float(row.get("net_gross_sales")),
                },
            )
        )

    sample_docs: list[tuple[str, dict[str, Any]]] = []
    for row in sample_rows:
        platform = (row.get("platform") or "TikTok").strip() or "TikTok"
        date = (row.get("date") or "").strip()
        product_name = (row.get("product_name") or "").strip()
        if not date or not product_name:
            continue
        doc_id = _base64url(f"{platform}__{date}__{product_name}")
        sample_docs.append(
            (
                doc_id,
                {
                    "platform": platform,
                    "date": date,
                    "product_name": product_name,
                    "seller_sku_resolved": (row.get("seller_sku_resolved") or "").strip(),
                    "net_units": _as_float(row.get("net_units")),
                    "gross_sales": _as_float(row.get("gross_sales")),
                    "net_gross_sales": _as_float(row.get("net_gross_sales")),
                },
            )
        )

    sku_sales_docs: list[tuple[str, dict[str, Any]]] = []
    for row in sku_sales_rows:
        platform = (row.get("platform") or "TikTok").strip() or "TikTok"
        date = (row.get("date") or "").strip()
        sku_id = (row.get("sku_id") or "").strip()
        product_name = (row.get("product_name") or "").strip()
        if not date or not sku_id or not product_name:
            continue
        doc_id = _base64url(f"{platform}__{date}__{sku_id}__{product_name}")
        sku_type = (row.get("sku_type") or "").strip()
        sku_sales_docs.append(
            (
                doc_id,
                {
                    "platform": platform,
                    "date": date,
                    "sku_id": sku_id,
                    "product_name": product_name,
                    "sku_type": "virtual_bundle" if sku_type == "virtual_bundle" else "core",
                    "core_products": (row.get("core_products") or "").strip(),
                    "units_sold": _as_float(row.get("units_sold")),
                    "gross_sales": _as_float(row.get("gross_sales")),
                    "avg_gross_per_unit": _as_float(row.get("avg_gross_per_unit")),
                    "net_gross_sales": _as_float(row.get("net_gross_sales")),
                    "avg_net_gross_per_unit": _as_float(row.get("avg_net_gross_per_unit")),
                },
            )
        )

    upload_audit_docs: list[tuple[str, dict[str, Any]]] = []
    for audit_type, filename in (
        ("orders", "planning_upload_audit_orders.json"),
        ("samples", "planning_upload_audit_samples.json"),
    ):
        audit_path = WEB_DATA_DIR / filename
        if not audit_path.exists():
            continue
        try:
            parsed = json.loads(audit_path.read_text(encoding="utf-8") or "{}")
        except Exception:
            continue
        if isinstance(parsed, dict) and parsed:
            upload_audit_docs.append((audit_type, parsed))

    inventory_docs: list[tuple[str, dict[str, Any]]] = []
    for row in inventory_rows:
        snapshot_date = (row.get("date") or row.get("snapshotDate") or "").strip()
        product_name = (row.get("product_name") or "").strip()
        if not snapshot_date or not product_name:
            continue
        doc_id = f"{snapshot_date}__{_slug(product_name)}"
        inventory_docs.append(
            (
                doc_id,
                {
                    "snapshotDate": snapshot_date,
                    "product_name": product_name,
                    "seller_sku_resolved": "",
                    "on_hand": _as_float(row.get("on_hand")),
                    "in_transit": _as_float(row.get("in_transit")),
                    "transit_eta": None,
                    "lead_time_days": None,
                    "moq": None,
                    "case_pack": None,
                },
            )
        )

    forecast_setting_docs: list[tuple[str, dict[str, Any]]] = []
    forecast_path = WEB_DATA_DIR / "planner_forecast_defaults.json"
    if forecast_path.exists():
        parsed = json.loads(forecast_path.read_text(encoding="utf-8") or "{}")
        months = parsed.get("months") if isinstance(parsed, dict) else {}
        if isinstance(months, dict):
            for year_month, setting in months.items():
                if not isinstance(setting, dict):
                    continue
                forecast_setting_docs.append(
                    (
                        str(year_month),
                        {
                            "yearMonth": str(year_month),
                            "upliftPct": float(setting.get("upliftPct", 0.0) or 0.0),
                            "productMix": setting.get("productMix") or {},
                        },
                    )
                )

    planner_settings_doc = None
    planner_path = WEB_DATA_DIR / "planner_shared_settings.json"
    if planner_path.exists():
        planner_settings_doc = json.loads(planner_path.read_text(encoding="utf-8") or "{}")

    campaign_event_docs: list[tuple[str, dict[str, Any]]] = []
    campaigns_path = WEB_DATA_DIR / "planning_campaigns.json"
    if campaigns_path.exists():
        parsed = json.loads(campaigns_path.read_text(encoding="utf-8") or "[]")
        if isinstance(parsed, list):
            for entry in parsed:
                if not isinstance(entry, dict):
                    continue
                doc_id = str(entry.get("id") or _slug(entry.get("name") or "campaign"))
                payload = {
                    "id": str(entry.get("id") or ""),
                    "name": str(entry.get("name") or ""),
                    "startDate": str(entry.get("startDate") or "")[:10],
                    "endDate": str(entry.get("endDate") or "")[:10],
                    "liftPct": float(entry.get("liftPct", 0.0) or 0.0),
                    "createdAt": entry.get("createdAt"),
                    "updatedAt": entry.get("updatedAt"),
                }
                campaign_event_docs.append((doc_id, payload))

    launch_plan_docs: list[tuple[str, dict[str, Any]]] = []
    launch_path = WEB_DATA_DIR / "planning_launch_plans.json"
    if launch_path.exists():
        parsed = json.loads(launch_path.read_text(encoding="utf-8") or "[]")
        if isinstance(parsed, list):
            for entry in parsed:
                if not isinstance(entry, dict):
                    continue
                product_name = str(entry.get("productName") or entry.get("product_name") or "").strip()
                if not product_name:
                    continue
                doc_id = _slug(product_name)
                payload = {
                    "productName": product_name,
                    "proxyProductName": entry.get("proxyProductName") or entry.get("proxy_product_name"),
                    "launchDate": (str(entry.get("launchDate") or entry.get("launch_date") or "")[:10]) or None,
                    "endDate": (str(entry.get("endDate") or entry.get("end_date") or "")[:10]) or None,
                    "launchUnitsCommitted": float(entry.get("launchUnitsCommitted", entry.get("launch_units_committed", 0.0)) or 0.0),
                    "launchStrengthPct": float(entry.get("launchStrengthPct", entry.get("launch_strength_pct", 100.0)) or 100.0),
                    "launchCoverWeeksTarget": float(entry.get("launchCoverWeeksTarget", entry.get("launch_cover_weeks_target", 0.0)) or 0.0),
                    "launchSampleUnits": float(entry.get("launchSampleUnits", entry.get("launch_sample_units", 0.0)) or 0.0),
                    "launchBundleUpliftPct": float(entry.get("launchBundleUpliftPct", entry.get("launch_bundle_uplift_pct", 0.0)) or 0.0),
                    "cogs": entry.get("cogs"),
                    "listPrice": entry.get("listPrice") or entry.get("list_price"),
                }
                launch_plan_docs.append((doc_id, payload))

    return SeedPayload(
        demand_docs=demand_docs,
        sample_docs=sample_docs,
        sku_sales_docs=sku_sales_docs,
        upload_audit_docs=upload_audit_docs,
        inventory_docs=inventory_docs,
        forecast_setting_docs=forecast_setting_docs,
        planner_settings_doc=planner_settings_doc,
        campaign_event_docs=campaign_event_docs,
        launch_plan_docs=launch_plan_docs,
    )


def seed_firestore(client, payload: SeedPayload, *, include_settings: bool, include_inventory: bool) -> dict[str, int]:
    counts: dict[str, int] = {}

    def write_batch(collection: str, docs: list[tuple[str, dict[str, Any]]]) -> int:
        written = 0
        batch = client.batch()
        size = 0
        for doc_id, doc in docs:
            batch.set(client.collection(collection).document(doc_id), doc, merge=True)
            written += 1
            size += 1
            if size >= 400:
                batch.commit()
                batch = client.batch()
                size = 0
        if size:
            batch.commit()
        return written

    counts["planningDemandDaily"] = write_batch("planningDemandDaily", payload.demand_docs)
    counts["planningSamplesDaily"] = write_batch("planningSamplesDaily", payload.sample_docs)
    counts["planningSkuSalesDaily"] = write_batch("planningSkuSalesDaily", payload.sku_sales_docs)
    if payload.upload_audit_docs:
        counts["planningUploadAudit"] = write_batch("planningUploadAudit", payload.upload_audit_docs)

    if include_inventory:
        counts["inventorySnapshots"] = write_batch("inventorySnapshots", payload.inventory_docs)

    if include_settings:
        counts["forecastSettings"] = write_batch("forecastSettings", payload.forecast_setting_docs)
        counts["campaignEvents"] = write_batch("campaignEvents", payload.campaign_event_docs)
        counts["launchPlans"] = write_batch("launchPlans", payload.launch_plan_docs)
        if payload.planner_settings_doc is not None:
            client.collection("planningSettings").document("shared").set(payload.planner_settings_doc, merge=True)
            counts["planningSettings/shared"] = 1

    return counts


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clean (backup + wipe + reseed) the Firestore planner collections using the current web/data lean snapshot.",
    )
    parser.add_argument("--scope", choices=["minimal", "full"], default="minimal", help="Which collections to wipe.")
    parser.add_argument("--dry-run", action="store_true", help="Only show what would happen. No writes.")
    parser.add_argument("--execute", action="store_true", help="Actually perform backup/wipe/seed. Requires --confirm-project.")
    parser.add_argument(
        "--confirm-project",
        default="",
        help="Safety gate: must match FIREBASE_PROJECT_ID before any write/delete happens.",
    )
    parser.add_argument(
        "--include-settings",
        action="store_true",
        help="When reseeding, also write forecastSettings/campaignEvents/launchPlans/planningSettings.",
    )
    parser.add_argument(
        "--include-inventory",
        action="store_true",
        help="When reseeding, also write inventorySnapshots from web/data/planning_inventory_daily.csv.",
    )
    parser.add_argument(
        "--skip-backup",
        action="store_true",
        help="Skip backup step (not recommended).",
    )
    parser.add_argument(
        "--backup-dir",
        default="",
        help="Optional backup output directory. Default is firestore_backups/<timestamp>.",
    )

    args = parser.parse_args()

    config = load_firestore_config()
    project_id = config.project_id
    client = get_firestore_client(config)

    collections = PLANNER_COLLECTIONS_FULL if args.scope == "full" else PLANNER_COLLECTIONS_MINIMAL
    now_key = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    backup_dir = Path(args.backup_dir) if args.backup_dir else (ROOT_DIR / "firestore_backups" / now_key)

    print(f"Firestore project: {project_id}")
    print(f"Scope: {args.scope} ({len(collections)} collections)")
    print(f"Dry run: {bool(args.dry_run or not args.execute)}")
    print(f"Reseed settings: {bool(args.include_settings)}")
    print(f"Reseed inventory: {bool(args.include_inventory)}")
    print("")

    if not args.skip_backup:
        print(f"Backup -> {backup_dir}")
        if args.execute and not args.dry_run:
            counts = backup_collections(client, collections, backup_dir)
        else:
            # For dry runs, only count docs.
            counts = {name: sum(1 for _ in _iter_collection_docs(client, name, page_size=800)) for name in collections}
        for name in collections:
            print(f"- {name}: {counts.get(name, 0)} docs")
        print("")

    if not args.execute or args.dry_run:
        print("Dry run complete. No Firestore writes/deletes were made.")
        return

    if args.confirm_project != project_id:
        raise SystemExit(
            f"Refusing to execute: --confirm-project must match FIREBASE_PROJECT_ID ({project_id})."
        )

    print("Wiping collections...")
    deleted_counts: dict[str, int] = {}
    for name in collections:
        # planningUploadAudit is small and can be wiped by deleting docs.
        deleted_counts[name] = delete_collection(client, name, batch_size=350)
        print(f"- deleted {deleted_counts[name]} from {name}")
    print("")

    print("Seeding from web/data...")
    seed_payload = build_seed_payload_from_web_data()
    seeded = seed_firestore(
        client,
        seed_payload,
        include_settings=bool(args.include_settings),
        include_inventory=bool(args.include_inventory),
    )
    for name, count in seeded.items():
        print(f"- seeded {name}: {count}")

    print("")
    print("Done.")


if __name__ == "__main__":
    main()
