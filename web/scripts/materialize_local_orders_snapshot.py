import csv
import math
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]  # .../Demand planning
WEB_DATA_DIR = ROOT / "web" / "data"
ALL_ORDERS_DIR = ROOT / "Data" / "All orders"

MAPPING_CSV = WEB_DATA_DIR / "tiktok_sku_mapping.csv"
LOCAL_MAPPING_CSV = ROOT / "Data" / "Tiktok SKU mapping - Sheet1.csv"
OUT_CORE_DEMAND = WEB_DATA_DIR / "planning_demand_daily.csv"
OUT_SKU_SALES = WEB_DATA_DIR / "planning_sku_sales_daily.csv"


def clean(value: object) -> str:
    return str(value or "").replace("\ufeff", "").replace("\u200b", " ").replace("\t", " ").strip()


def norm_key(value: object) -> str:
    return " ".join(clean(value).lower().split())


def as_number(value: object) -> float:
    text = clean(value).replace(",", "").replace("$", "")
    if text.startswith("(") and text.endswith(")"):
        text = "-" + text[1:-1]
    try:
        numeric = float(text or 0)
        return numeric if math.isfinite(numeric) else 0.0
    except Exception:
        return 0.0


def parse_cents(value: object) -> int:
    # TikTok export fields like "SKU Subtotal Before Discount" are already currency-like.
    # Keep money math in integer cents to avoid float rounding drift.
    numeric = as_number(value)
    return int(round(numeric * 100))


def format_dollars_from_cents(cents: int) -> str:
    return f"{cents / 100:.2f}"


def parse_date(value: object) -> str | None:
    raw = clean(value)
    if not raw:
        return None
    for fmt in (
        "%m/%d/%Y %I:%M:%S %p",
        "%m/%d/%Y %I:%M %p",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(raw).strftime("%Y-%m-%d")
    except Exception:
        return None


PRODUCT_ALIASES = {
    "birria bombs 2p": "Birria Bomb 2-Pack",
    "birria bomb 2-pack": "Birria Bomb 2-Pack",
    "brine bombs": "Brine Bomb",
    "brine bomb": "Brine Bomb",
    "chile colorado bombs 2p": "Chile Colorado Bomb 2-Pack",
    "chile colorado bomb 2-pack": "Chile Colorado Bomb 2-Pack",
    "pozole bombs 2p": "Pozole Bomb 2-Pack",
    "pozole bomb 2-pack": "Pozole Bomb 2-Pack",
    "pozole verde bombs 2p": "Pozole Verde Bomb 2-Pack",
    "pozole verde bomb 2-pack": "Pozole Verde Bomb 2-Pack",
    "tinga bombs 2p": "Tinga Bomb 2-Pack",
    "tinga bomb 2-pack": "Tinga Bomb 2-Pack",
    "variety pack": "Variety Pack",
}

# Used only for allocating bundle gross sales into core products.
PRODUCT_UNIT_PRICES = {
    "Birria Bomb 2-Pack": 19.99,
    "Chile Colorado Bomb 2-Pack": 19.99,
    "Pozole Bomb 2-Pack": 19.99,
    "Pozole Verde Bomb 2-Pack": 19.99,
    "Tinga Bomb 2-Pack": 19.99,
    "Brine Bomb": 19.99,
    "Variety Pack": 49.99,
}

IGNORED_VALUES = {"ignore", "ignored", "non-planning", "non planning", "exclude", "excluded"}


@dataclass(frozen=True)
class Component:
    product_name: str
    units: int


@dataclass(frozen=True)
class Mapping:
    sku_id: str
    listing_name: str
    ignored: bool
    components: tuple[Component, ...]


def parse_mapping() -> dict[str, Mapping]:
    by_key: dict[str, Mapping] = {}
    mapping_paths: list[Path] = [MAPPING_CSV]
    if LOCAL_MAPPING_CSV.exists():
        mapping_paths.append(LOCAL_MAPPING_CSV)

    # Merge: packaged mapping first, then local file overrides (if present).
    for mapping_path in mapping_paths:
        with mapping_path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                sku_id = clean(row.get("SKU ID"))
                listing_name = clean(row.get("Product Name"))
                ignored = False
                component_counts: dict[str, int] = {}
                for col in ("Product 1", "Product 2", "Product 3", "Product 4"):
                    raw = clean(row.get(col))
                    if not raw:
                        continue
                    if norm_key(raw) in IGNORED_VALUES:
                        ignored = True
                        continue
                    canonical = PRODUCT_ALIASES.get(norm_key(raw))
                    if not canonical:
                        raise RuntimeError(f'Unknown mapped product "{raw}" for SKU "{sku_id}".')
                    component_counts[canonical] = component_counts.get(canonical, 0) + 1

                components = tuple(Component(product_name=name, units=units) for name, units in component_counts.items())
                mapping = Mapping(sku_id=sku_id, listing_name=listing_name, ignored=ignored, components=components)

                if sku_id:
                    by_key[norm_key(sku_id)] = mapping
                if listing_name:
                    by_key[norm_key(listing_name)] = mapping
    return by_key


def format_core_products(mapping: Mapping) -> str:
    parts: list[str] = []
    for component in mapping.components:
        if component.units > 1:
            parts.append(f"{component.product_name} x{component.units}")
        else:
            parts.append(component.product_name)
    return " + ".join(parts)


def materialize() -> None:
    if not ALL_ORDERS_DIR.exists():
        raise RuntimeError(f"Missing folder: {ALL_ORDERS_DIR}")

    mappings = parse_mapping()

    # Core product daily rows (lean)
    core_by_key: dict[tuple[str, str], dict[str, int | str]] = {}
    # Listing / SKU daily rows (lean)
    sku_by_key: dict[tuple[str, str, str], dict[str, int | str]] = {}

    csv_files = sorted(ALL_ORDERS_DIR.glob("*.csv"))
    if not csv_files:
        raise RuntimeError(f"No CSV files found in {ALL_ORDERS_DIR}")

    ignored_rows = 0
    unmapped_rows = 0
    raw_rows = 0

    for csv_file in csv_files:
        with csv_file.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                raw_rows += 1
                date = parse_date(row.get("Paid Time")) or parse_date(row.get("Created Time"))
                listing_name = clean(row.get("Product Name"))
                if not date or not listing_name:
                    continue

                sku_id = clean(row.get("SKU ID"))
                seller_sku = clean(row.get("Seller SKU")) or clean(row.get(" Virtual Bundle Seller SKU"))
                mapping = mappings.get(norm_key(sku_id)) or mappings.get(norm_key(seller_sku)) or mappings.get(norm_key(listing_name))
                if not mapping:
                    unmapped_rows += 1
                    continue
                if mapping.ignored:
                    ignored_rows += 1
                    continue

                quantity = as_number(row.get("Quantity"))
                returned_qty = as_number(row.get("Sku Quantity of return"))
                status_text = f"{clean(row.get('Order Status'))} {clean(row.get('Order Substatus'))} {clean(row.get('Cancelation/Return Type'))}".lower()
                cancelled = ("cancel" in status_text) or bool(parse_date(row.get("Cancelled Time")))
                net_units = 0 if cancelled else int(max(quantity - returned_qty, 0.0))

                # IMPORTANT: keep "gross sales" aligned with the TikTok dashboard definition:
                # Gross Product Sales = SUM(SKU Subtotal Before Discount), excluding cancelled rows.
                # We still keep *units* net of returns for planning.
                gross_sales_full_cents = parse_cents(row.get("SKU Subtotal Before Discount"))
                # Keep Gross Product Sales aligned with the TikTok dashboard (GMV-style):
                # include cancelled rows in gross, while units remain net of returns for planning.
                gross_sales_cents = gross_sales_full_cents

                # --- SKU/listing rows (true gross for listing; not expanded) ---
                sku_key = (date, mapping.sku_id or sku_id or seller_sku or listing_name, listing_name)
                sku_rec = sku_by_key.get(sku_key)
                if not sku_rec:
                    component_units = sum(component.units for component in mapping.components)
                    sku_type = "virtual_bundle" if component_units > 1 else "core"
                    sku_rec = {
                        "date": date,
                        "platform": "TikTok",
                        "sku_id": sku_key[1],
                        "product_name": listing_name,
                        "sku_type": sku_type,
                        "core_products": format_core_products(mapping),
                        "units_sold": 0,
                        "gross_sales_cents": 0,
                        "avg_gross_per_unit_cents": 0,
                    }
                    sku_by_key[sku_key] = sku_rec
                sku_rec["units_sold"] = int(sku_rec["units_sold"]) + net_units
                sku_rec["gross_sales_cents"] = int(sku_rec["gross_sales_cents"]) + gross_sales_cents
                units_sold = int(sku_rec["units_sold"])
                sku_rec["avg_gross_per_unit_cents"] = (
                    int((int(sku_rec["gross_sales_cents"]) + units_sold / 2) // units_sold) if units_sold > 0 else 0
                )

                # --- Core product rows (expanded + allocated gross) ---
                total_value_cents = 0
                for component in mapping.components:
                    unit_price_cents = int(round(float(PRODUCT_UNIT_PRICES.get(component.product_name, 1.0)) * 100))
                    total_value_cents += component.units * unit_price_cents
                if total_value_cents <= 0:
                    total_value_cents = int(sum(component.units for component in mapping.components) or 1)

                allocated_so_far = 0
                for index, component in enumerate(mapping.components):
                    unit_price_cents = int(round(float(PRODUCT_UNIT_PRICES.get(component.product_name, 1.0)) * 100))
                    component_value_cents = component.units * unit_price_cents
                    if index == len(mapping.components) - 1:
                        allocated_gross_cents = gross_sales_cents - allocated_so_far
                    else:
                        numerator = gross_sales_cents * component_value_cents
                        allocated_gross_cents = int((numerator + total_value_cents / 2) // total_value_cents) if total_value_cents else 0
                        allocated_so_far += allocated_gross_cents
                    core_key = (date, component.product_name)
                    core_rec = core_by_key.get(core_key)
                    if not core_rec:
                        core_rec = {
                            "platform": "TikTok",
                            "date": date,
                            "product_name": component.product_name,
                            "seller_sku_resolved": seller_sku or sku_id or mapping.sku_id or "",
                            "net_units": 0,
                            "gross_sales_cents": 0,
                        }
                        core_by_key[core_key] = core_rec
                    core_rec["net_units"] = int(core_rec["net_units"]) + (net_units * component.units)
                    core_rec["gross_sales_cents"] = int(core_rec["gross_sales_cents"]) + allocated_gross_cents
                    if not str(core_rec.get("seller_sku_resolved") or "").strip():
                        core_rec["seller_sku_resolved"] = seller_sku or sku_id or mapping.sku_id or ""

    # Write outputs.
    core_rows = sorted(core_by_key.values(), key=lambda r: (str(r["date"]), str(r["product_name"])))
    sku_rows = sorted(sku_by_key.values(), key=lambda r: (str(r["date"]), str(r["sku_type"]), str(r["product_name"]), str(r["sku_id"])))

    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

    with OUT_CORE_DEMAND.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["platform", "date", "product_name", "seller_sku_resolved", "net_units", "gross_sales"])
        writer.writeheader()
        for rec in core_rows:
            writer.writerow(
                {
                    "platform": rec["platform"],
                    "date": rec["date"],
                    "product_name": rec["product_name"],
                    "seller_sku_resolved": rec["seller_sku_resolved"],
                    "net_units": rec["net_units"],
                    "gross_sales": format_dollars_from_cents(int(rec["gross_sales_cents"])),
                }
            )

    with OUT_SKU_SALES.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "date",
                "platform",
                "sku_id",
                "product_name",
                "sku_type",
                "core_products",
                "units_sold",
                "gross_sales",
                "avg_gross_per_unit",
            ],
        )
        writer.writeheader()
        for rec in sku_rows:
            writer.writerow(
                {
                    "date": rec["date"],
                    "platform": rec["platform"],
                    "sku_id": rec["sku_id"],
                    "product_name": rec["product_name"],
                    "sku_type": rec["sku_type"],
                    "core_products": rec["core_products"],
                    "units_sold": rec["units_sold"],
                    "gross_sales": format_dollars_from_cents(int(rec["gross_sales_cents"])),
                    "avg_gross_per_unit": format_dollars_from_cents(int(rec["avg_gross_per_unit_cents"])),
                }
            )

    # Console summary.
    listing_gross_cents = sum(int(r["gross_sales_cents"]) for r in sku_rows)
    core_gross_cents = sum(int(r["gross_sales_cents"]) for r in core_rows)
    print(f"Wrote {len(core_rows)} core demand rows -> {OUT_CORE_DEMAND}")
    print(f"Wrote {len(sku_rows)} SKU sales rows -> {OUT_SKU_SALES}")
    print(f"Raw rows scanned: {raw_rows}")
    print(f"Ignored rows: {ignored_rows}")
    print(f"Unmapped rows skipped: {unmapped_rows}")
    print(
        "Listing gross: "
        f"{format_dollars_from_cents(listing_gross_cents)} | "
        "Allocated core gross: "
        f"{format_dollars_from_cents(core_gross_cents)} | "
        "Delta: "
        f"{format_dollars_from_cents(core_gross_cents - listing_gross_cents)}"
    )


if __name__ == "__main__":
    materialize()
