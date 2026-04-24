import csv
import glob
import os
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple


# One-time local backfill / materialize:
# - Reads TikTok "All orders" CSV exports under ../Data/All orders
# - Computes planner-style net gross per line:
#     cancelled/refunded => net_units=0, net_gross=0
#     else net_units = max(qty - returned_qty, 0)
#          net_gross = (gross - seller_discount) * (net_units / qty)
# - Builds daily SKU sales rows (core + virtual bundles)
# - Expands to daily core-product demand (units + gross + net gross) using the same
#   unit-price weighting logic as `expandMappedDemandRows` in `web/lib/sku-mapping.ts`.
# - Updates existing lean files WITHOUT storing raw order lines.
#
# This keeps the "database" lean while making historical net gross accurate and consistent.


ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW_ORDERS_DIR = os.path.join(ROOT_DIR, "Data", "All orders")
WEB_DATA_DIR = os.path.join(ROOT_DIR, "web", "data")

SKU_MAPPING_FILE = os.path.join(WEB_DATA_DIR, "tiktok_sku_mapping.csv")
LEAN_DEMAND_FILE = os.path.join(WEB_DATA_DIR, "planning_demand_daily.csv")
LEAN_SKU_SALES_FILE = os.path.join(WEB_DATA_DIR, "planning_sku_sales_daily.csv")

PLATFORM_DEFAULT = "TikTok"


CORE_PRODUCTS = [
    "Birria Bomb 2-Pack",
    "Chile Colorado Bomb 2-Pack",
    "Pozole Bomb 2-Pack",
    "Pozole Verde Bomb 2-Pack",
    "Tinga Bomb 2-Pack",
    "Brine Bomb",
    "Variety Pack",
]

UNIT_PRICES = {
    "Birria Bomb 2-Pack": 19.99,
    "Chile Colorado Bomb 2-Pack": 19.99,
    "Pozole Bomb 2-Pack": 19.99,
    "Pozole Verde Bomb 2-Pack": 19.99,
    "Tinga Bomb 2-Pack": 19.99,
    "Brine Bomb": 19.99,
    "Variety Pack": 49.99,
}

# Mapping CSV uses short canonical names like "Birria Bombs 2P".
PRODUCT_ALIASES = {
    "birria bombs 2p": "Birria Bomb 2-Pack",
    "birria bomb 2-pack": "Birria Bomb 2-Pack",
    "chile colorado bombs 2p": "Chile Colorado Bomb 2-Pack",
    "chile colorado bomb 2-pack": "Chile Colorado Bomb 2-Pack",
    "pozole bombs 2p": "Pozole Bomb 2-Pack",
    "pozole bomb 2-pack": "Pozole Bomb 2-Pack",
    "pozole verde bombs 2p": "Pozole Verde Bomb 2-Pack",
    "pozole verde bomb 2-pack": "Pozole Verde Bomb 2-Pack",
    "tinga bombs 2p": "Tinga Bomb 2-Pack",
    "tinga bomb 2-pack": "Tinga Bomb 2-Pack",
    "brine bombs": "Brine Bomb",
    "brine bomb": "Brine Bomb",
    "variety pack": "Variety Pack",
}


def clean_text(value: object) -> str:
    if value is None:
        return ""
    # TikTok exports sometimes embed tabs/newlines inside cells.
    return str(value).replace("\ufeff", "").replace("\u200b", " ").replace("\t", " ").strip()


def normalized_key(value: object) -> str:
    return " ".join(clean_text(value).split()).lower()


def is_ignored(value: object) -> bool:
    return normalized_key(value) in {"ignore", "ignored", "non-planning", "non planning", "exclude", "excluded"}


def parse_money(value: object) -> float:
    raw = clean_text(value).replace(",", "").replace("$", "")
    if not raw:
        return 0.0
    if raw.startswith("(") and raw.endswith(")"):
        raw = "-" + raw[1:-1]
    try:
        return float(raw)
    except Exception:
        return 0.0


def parse_number(value: object) -> float:
    # Shares parse_money behavior for safety.
    return parse_money(value)


def parse_us_date_yyyy_mm_dd(value: object) -> Optional[str]:
    raw = clean_text(value)
    if not raw:
        return None
    # Expected like 03/31/2026 11:59:59 PM
    parts = raw.split()
    date_part = parts[0] if parts else ""
    try:
        month, day, year = date_part.split("/")
        mm = int(month)
        dd = int(day)
        yyyy = int(year)
        return f"{yyyy:04d}-{mm:02d}-{dd:02d}"
    except Exception:
        return None


@dataclass
class MappingEntry:
    ignored: bool
    components: Dict[str, int]  # core product -> units


def normalize_mapped_product_name(value: object) -> Optional[str]:
    key = normalized_key(value)
    if not key:
        return None
    if key in PRODUCT_ALIASES:
        return PRODUCT_ALIASES[key]
    # Allow already-canonical core products.
    for core in CORE_PRODUCTS:
        if normalized_key(core) == key:
            return core
    return None


def load_sku_mapping() -> Tuple[Dict[str, MappingEntry], Dict[str, MappingEntry]]:
    by_sku_id: Dict[str, MappingEntry] = {}
    by_listing_name: Dict[str, MappingEntry] = {}

    with open(SKU_MAPPING_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sku_id = clean_text(row.get("SKU ID"))
            listing = clean_text(row.get("Product Name"))
            p1 = row.get("Product 1")
            p2 = row.get("Product 2")
            p3 = row.get("Product 3")
            p4 = row.get("Product 4")

            if is_ignored(p1) or is_ignored(listing) or is_ignored(sku_id):
                entry = MappingEntry(ignored=True, components={})
            else:
                raw_products = [p1, p2, p3, p4]
                components: Dict[str, int] = defaultdict(int)
                for raw in raw_products:
                    if not clean_text(raw):
                        continue
                    if is_ignored(raw):
                        # If any product column says ignore, treat the whole SKU as ignored.
                        components = {}
                        entry = MappingEntry(ignored=True, components={})
                        break
                    canonical = normalize_mapped_product_name(raw)
                    if canonical:
                        components[canonical] += 1
                else:
                    entry = MappingEntry(ignored=False, components=dict(components))

            if sku_id:
                by_sku_id[normalized_key(sku_id)] = entry
            if listing:
                by_listing_name[normalized_key(listing)] = entry

    return by_sku_id, by_listing_name


def mapping_for_row(
    sku_id: str,
    listing_name: str,
    by_sku_id: Dict[str, MappingEntry],
    by_listing_name: Dict[str, MappingEntry],
) -> Optional[MappingEntry]:
    for candidate in (sku_id,):
        key = normalized_key(candidate)
        if key and key in by_sku_id:
            return by_sku_id[key]
    key = normalized_key(listing_name)
    if key and key in by_listing_name:
        return by_listing_name[key]
    # Allow listing name that is already a core product alias.
    canonical = normalize_mapped_product_name(listing_name)
    if canonical:
        return MappingEntry(ignored=False, components={canonical: 1})
    return None


def component_value(core_product: str, units: int) -> float:
    price = UNIT_PRICES.get(core_product)
    return float(units) * float(price if price and price > 0 else 1.0)


def format_core_products(components: Dict[str, int]) -> str:
    parts: List[str] = []
    for product in sorted(components.keys()):
        units = int(components[product])
        if units > 1:
            parts.append(f"{product} x{units}")
        else:
            parts.append(product)
    return " + ".join(parts)


def iter_raw_order_files() -> Iterable[str]:
    if not os.path.isdir(RAW_ORDERS_DIR):
        return []
    # Prefer smaller "All order-*.csv" daily exports if present; otherwise use month files.
    patterns = [
        os.path.join(RAW_ORDERS_DIR, "All order-*.csv"),
        os.path.join(RAW_ORDERS_DIR, "*.csv"),
    ]
    seen = set()
    for pattern in patterns:
        for path in sorted(glob.glob(pattern)):
            if path in seen:
                continue
            seen.add(path)
            yield path


def backfill() -> None:
    by_sku_id, by_listing_name = load_sku_mapping()

    # Core daily aggregates (for planning_demand_daily.csv)
    core_daily: Dict[Tuple[str, str], Dict[str, float]] = defaultdict(lambda: {"net_units": 0.0, "gross_sales": 0.0, "net_gross_sales": 0.0})

    # SKU-level daily aggregates (for planning_sku_sales_daily.csv)
    sku_daily: Dict[Tuple[str, str, str], Dict[str, object]] = {}  # (date, sku_id, listing_name) -> row dict

    unmapped_examples: List[str] = []
    unmapped_count = 0
    processed_files = 0

    for file_path in iter_raw_order_files():
        processed_files += 1
        with open(file_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                listing = clean_text(row.get("Product Name"))
                if not listing:
                    continue
                sku_id = clean_text(row.get("SKU ID"))
                gross = parse_money(row.get("SKU Subtotal Before Discount"))
                seller_discount = parse_money(row.get("SKU Seller Discount"))
                qty = parse_number(row.get("Quantity"))
                ret_qty = parse_number(row.get("Sku Quantity of return"))

                paid_date = parse_us_date_yyyy_mm_dd(row.get("Paid Time"))
                created_date = parse_us_date_yyyy_mm_dd(row.get("Created Time"))
                date = paid_date or created_date
                if not date:
                    continue

                status_text = " ".join(
                    [
                        clean_text(row.get("Order Status")),
                        clean_text(row.get("Order Substatus")),
                        clean_text(row.get("Cancelation/Return Type")),
                    ]
                ).lower()
                cancelled_time = clean_text(row.get("Cancelled Time"))
                # TikTok exports sometimes flag refunds without the word "cancel" in the status text.
                is_cancelled = ("cancel" in status_text) or ("refund" in status_text) or bool(cancelled_time)

                if is_cancelled or qty <= 0:
                    net_units = 0.0
                    net_gross = 0.0
                else:
                    net_units = max(qty - ret_qty, 0.0)
                    net_gross_base = max(gross - seller_discount, 0.0)
                    net_gross = net_gross_base * (net_units / qty) if qty > 0 else 0.0

                mapping = mapping_for_row(sku_id, listing, by_sku_id, by_listing_name)
                if not mapping:
                    unmapped_count += 1
                    if len(unmapped_examples) < 15:
                        unmapped_examples.append(f"{sku_id or '(no sku)'} | {listing}")
                    continue
                if mapping.ignored:
                    continue

                # Update SKU daily (listing-level)
                sku_key = (date, sku_id or listing, listing)
                current = sku_daily.get(sku_key)
                if not current:
                    component_units = sum(int(v) for v in mapping.components.values()) or 1
                    sku_type = "virtual_bundle" if component_units > 1 else "core"
                    current = {
                        "date": date,
                        "platform": PLATFORM_DEFAULT,
                        "sku_id": sku_id or listing,
                        "product_name": listing,
                        "sku_type": sku_type,
                        "core_products": format_core_products(mapping.components),
                        "units_sold": 0.0,
                        "gross_sales": 0.0,
                        "avg_gross_per_unit": 0.0,
                        "net_gross_sales": 0.0,
                        "avg_net_gross_per_unit": 0.0,
                    }
                    sku_daily[sku_key] = current
                current["units_sold"] = float(current["units_sold"]) + float(net_units)
                current["gross_sales"] = float(current["gross_sales"]) + float(gross)
                current["net_gross_sales"] = float(current["net_gross_sales"]) + float(net_gross)

                units_sold = float(current["units_sold"])
                current["avg_gross_per_unit"] = (float(current["gross_sales"]) / units_sold) if units_sold > 0 else 0.0
                current["avg_net_gross_per_unit"] = (float(current["net_gross_sales"]) / units_sold) if units_sold > 0 else 0.0

                # Update core daily (expanded + value-weighted)
                total_value = 0.0
                for core_product, units in mapping.components.items():
                    total_value += component_value(core_product, int(units))
                if total_value <= 0:
                    total_value = float(sum(int(v) for v in mapping.components.values()) or 1)

                for core_product, units in mapping.components.items():
                    share = component_value(core_product, int(units)) / total_value if total_value > 0 else 0.0
                    core_daily[(date, core_product)]["net_units"] += net_units * float(int(units))
                    core_daily[(date, core_product)]["gross_sales"] += gross * share
                    core_daily[(date, core_product)]["net_gross_sales"] += net_gross * share

        # Lightweight progress heartbeat (kept minimal).
        if processed_files % 3 == 0:
            pass

    # Round aggregates (currency to cents; units left as float but should be integer-ish).
    for key in list(core_daily.keys()):
        core_daily[key]["gross_sales"] = round(float(core_daily[key]["gross_sales"]) + 1e-9, 2)
        core_daily[key]["net_gross_sales"] = round(float(core_daily[key]["net_gross_sales"]) + 1e-9, 2)
        core_daily[key]["net_units"] = float(core_daily[key]["net_units"])

    def fmt_float(value: object) -> str:
        try:
            num = float(value or 0.0)
        except Exception:
            num = 0.0
        num = round(num + 1e-9, 2)
        if num == 0:
            return "0"
        text = f"{num:.2f}"
        return text.rstrip("0").rstrip(".")

    # 1) Update planning_demand_daily.csv (gross + net gross + net units) consistently for dates we can materialize.
    existing_demand_text_rows: List[Dict[str, str]] = []
    with open(LEAN_DEMAND_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        for row in reader:
            existing_demand_text_rows.append(row)

    # Build a lookup for seller_sku_resolved per core product (prefer existing rows, else mapping base SKU).
    core_sku_by_product: Dict[str, str] = {}
    for row in existing_demand_text_rows:
        prod = clean_text(row.get("product_name"))
        sku = clean_text(row.get("seller_sku_resolved"))
        if prod and sku and prod not in core_sku_by_product:
            core_sku_by_product[prod] = sku

    # Fallback: infer core SKU IDs from mapping entries that map 1:1 to a core product.
    for sku_key, entry in by_sku_id.items():
        if entry.ignored:
            continue
        if len(entry.components) == 1:
            (only_product, units) = next(iter(entry.components.items()))
            if int(units) == 1 and only_product and only_product not in core_sku_by_product:
                core_sku_by_product[only_product] = sku_key

    replacements: Dict[Tuple[str, str], Dict[str, float]] = dict(core_daily)
    covered_dates = {date for (date, _prod) in replacements.keys()}

    merged_rows: List[Dict[str, str]] = []
    seen_keys: set[Tuple[str, str]] = set()

    for row in existing_demand_text_rows:
        date = clean_text(row.get("date"))
        product = clean_text(row.get("product_name"))
        if not date or not product:
            merged_rows.append(row)
            continue

        key = (date, product)
        if key in replacements:
            value = replacements[key]
            row["platform"] = clean_text(row.get("platform")) or PLATFORM_DEFAULT
            row["seller_sku_resolved"] = core_sku_by_product.get(product, clean_text(row.get("seller_sku_resolved")))
            row["net_units"] = fmt_float(value["net_units"])
            row["gross_sales"] = fmt_float(value["gross_sales"])
            row["net_gross_sales"] = fmt_float(value["net_gross_sales"])
            seen_keys.add(key)
            merged_rows.append(row)
            continue

        # For dates we could not materialize from raw exports, keep existing gross/net_units,
        # but clamp obviously-bad net gross (ex: older file had net > gross due to previous partial backfill).
        gross_existing = parse_money(row.get("gross_sales"))
        net_units_existing = parse_number(row.get("net_units"))
        net_gross_existing = parse_money(row.get("net_gross_sales"))
        if net_units_existing <= 0:
            row["net_gross_sales"] = "0"
        elif net_gross_existing <= 0:
            row["net_gross_sales"] = fmt_float(gross_existing)
        elif net_gross_existing > gross_existing + 0.01:
            row["net_gross_sales"] = fmt_float(gross_existing)
        merged_rows.append(row)

    # Add any missing rows for covered dates/products (should be rare, but keep state complete).
    for (date, product), value in sorted(replacements.items(), key=lambda kv: (kv[0][0], kv[0][1])):
        if (date, product) in seen_keys:
            continue
        merged_rows.append(
            {
                "platform": PLATFORM_DEFAULT,
                "date": date,
                "product_name": product,
                "seller_sku_resolved": core_sku_by_product.get(product, ""),
                "net_units": fmt_float(value["net_units"]),
                "gross_sales": fmt_float(value["gross_sales"]),
                "net_gross_sales": fmt_float(value["net_gross_sales"]),
            }
        )

    merged_rows = sorted(
        merged_rows,
        key=lambda r: (
            clean_text(r.get("date")),
            clean_text(r.get("product_name")),
        ),
    )

    if not fieldnames:
        fieldnames = ["platform", "date", "product_name", "seller_sku_resolved", "net_units", "gross_sales", "net_gross_sales"]

    with open(LEAN_DEMAND_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(merged_rows)

    # 2) Regenerate planning_sku_sales_daily.csv for the dates present in raw exports (still lean daily aggregates).
    sku_fieldnames = [
        "date",
        "platform",
        "sku_id",
        "product_name",
        "sku_type",
        "core_products",
        "units_sold",
        "gross_sales",
        "avg_gross_per_unit",
        "net_gross_sales",
        "avg_net_gross_per_unit",
    ]

    # Preserve any SKU sales rows we already have for dates not covered by the raw export set.
    existing_sku_rows: List[Dict[str, str]] = []
    try:
        with open(LEAN_SKU_SALES_FILE, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_sku_rows.append(row)
    except Exception:
        existing_sku_rows = []

    sku_rows = sorted(
        sku_daily.values(),
        key=lambda r: (
            str(r.get("date", "")),
            str(r.get("sku_type", "")),
            str(r.get("product_name", "")),
            str(r.get("sku_id", "")),
        ),
    )

    sku_dates_covered = {clean_text(row.get("date")) for row in sku_rows if clean_text(row.get("date"))}
    # Keep existing rows outside the covered dates.
    preserved_existing = [
        row for row in existing_sku_rows if clean_text(row.get("date")) and clean_text(row.get("date")) not in sku_dates_covered
    ]

    with open(LEAN_SKU_SALES_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=sku_fieldnames)
        writer.writeheader()
        for row in sorted(
            preserved_existing,
            key=lambda r: (
                clean_text(r.get("date")),
                clean_text(r.get("sku_type")),
                clean_text(r.get("product_name")),
                clean_text(r.get("sku_id")),
            ),
        ):
            # Write preserved rows as-is (but ensure only expected columns are written).
            writer.writerow({k: row.get(k, "") for k in sku_fieldnames})
        for row in sku_rows:
            out = dict(row)
            out["units_sold"] = fmt_float(out.get("units_sold"))
            out["gross_sales"] = fmt_float(out.get("gross_sales"))
            out["avg_gross_per_unit"] = fmt_float(out.get("avg_gross_per_unit"))
            out["net_gross_sales"] = fmt_float(out.get("net_gross_sales"))
            out["avg_net_gross_per_unit"] = fmt_float(out.get("avg_net_gross_per_unit"))
            writer.writerow({k: out.get(k, "") for k in sku_fieldnames})

    # Print unmapped warnings for operator visibility.
    if unmapped_count:
        print(f"WARNING: Unmapped rows skipped: {unmapped_count}")
        for example in unmapped_examples:
            print(f"  - {example}")


if __name__ == "__main__":
    backfill()
