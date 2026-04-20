from __future__ import annotations

import argparse

from demand_planning_app.firestore_sync import (
    build_sync_payload,
    dump_payload_summary,
    get_firestore_client,
    load_firestore_config,
    sync_payload_to_firestore,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync lean demand-planning tables into Firestore.")
    parser.add_argument("--include-kpis", action="store_true", help="Also sync lean KPI collections.")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be synced without writing to Firestore.")
    args = parser.parse_args()

    config = load_firestore_config()
    payload = build_sync_payload(include_kpis=args.include_kpis)

    print(f"Firestore project: {config.project_id}")
    print(dump_payload_summary(payload))

    if args.dry_run:
        print("Dry run only. No Firestore writes were made.")
        return

    client = get_firestore_client(config)
    counts = sync_payload_to_firestore(client, payload)
    print("Sync complete:")
    for collection_name, count in counts.items():
        print(f"- {collection_name}: {count}")


if __name__ == "__main__":
    main()
