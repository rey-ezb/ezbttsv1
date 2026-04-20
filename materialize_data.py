from __future__ import annotations

from pathlib import Path

from demand_planning_app.materialize import write_materialized_planning_dataset


INVENTORY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1hAjW1gbDd-UJgTfS4Bb2QyOwGo9F53nQebjRBHJz9K8/edit?usp=sharing"


def main() -> None:
    root = Path(__file__).resolve().parent
    result = write_materialized_planning_dataset(
        data_root=root / "Data",
        output_dir=root / "materialized",
        platform="TikTok",
        inventory_sheet_source=INVENTORY_SHEET_URL,
    )
    print(result["summary"])
    print(result["paths"])


if __name__ == "__main__":
    main()
