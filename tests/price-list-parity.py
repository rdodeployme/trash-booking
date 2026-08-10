#!/usr/bin/env python3
"""Reconciles the catalogue against the supplied price list.

    python3 tests/price-list-parity.py

`config-parity.py` proves the browser and the server agree with each other.
This proves they both agree with the CSV Andy actually sent — the thing they
are supposed to be a copy of. Without it, a typo in a price is only caught by
someone noticing the wrong number on the site.

Every row in the price list must map to exactly one item at exactly the same
price. Anything in the catalogue that is NOT in the price list must be marked
`legacy: true`, which is how the items that were never repriced are kept
visible instead of quietly becoming permanent.
"""

import csv
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "pricing" / "2026-08-10-price-list.csv"

# Price-list row -> item id. The names differ deliberately: the price list is
# written for the office, the item names are written for a customer.
MAPPING = {
    'Automotive Rim & Tyre: Truck': 'rim-tyre-truck',
    'Automotive Rim & Tyre: Tractor': 'rim-tyre-tractor',
    'Tyre (no rim): Truck': 'tyre-truck',
    'Automotive Rim ONLY: Car': 'rim-car',
    'Automotive Rim ONLY: Truck': 'rim-truck',
    'Automotive Rim ONLY: Tractor': 'rim-tractor',
    'Bed Base: Single/King Single': 'base-single-ks',
    'Bed Base: Double/Queen/King': 'base-dqk',
    'Bed Frame: Single, King Single': 'frame-single-ks',
    'Bed Frame: Double, Queen, King': 'frame-dqk',
    'Headboard: Single/King Single': 'headboard-single-ks',
    'Headboard: Double/Queen/King': 'headboard-dqk',
    'Bunkbed: Single/Single': 'bunk-ss',
    'Bunkbed: Single/Double': 'bunk-sd',
    'Bunkbed: Double/Double': 'bunk-dd',
    'Mattress: Single/King Single': 'mat-single-ks',
    'Mattress: Double/ Queen/ King': 'mat-dqk',
    'Mattress: Crib/Cot': 'mat-cot',
    'Mattress Topper: Single/King Single': 'topper-single-ks',
    'Mattress Topper: Double/Queen/King': 'topper-dqk',
    'Couch - 1 seat': 'sofa-1',
    'Couch - 2 seater': 'sofa-2',
    'Couch - 3 seater': 'sofa-3',
    'Couch - 4 seater': 'sofa-4',
    'Couch - 5 seater': 'sofa-5',
    'Couch - 6 seater': 'sofa-6',
    'Couch - 7 seater': 'sofa-7',
    'Couch - 8 seater': 'sofa-8',
    'Couch Chaise - Chaise section only': 'sofa-chaise',
    'Futon: 2 Seater': 'futon-2',
    'Futon: 3 Seater': 'futon-3',
    'Outdoor Couch: Armchair': 'out-1',
    'Outdoor Couch: 2 seater': 'out-2',
    'Outdoor Couch: 3 seater': 'out-3',
    'Outdoor Couch: 4 seater': 'out-4',
    'Outdoor Couch: 5 seater': 'out-5',
    'Outdoor Couch: 6 seater': 'out-6',
    'Outdoor Couch: 7 seater': 'out-7',
    'Outdoor Couch: 8 seater': 'out-8',
    'Piano - Upright': 'piano-upright',
    'Piano - Baby Grand': 'piano-baby-grand',
    'Piano - Grand': 'piano-grand',
    'Recliner: 1 Seat': 'rec-1',
    'Recliner: 2 Seat': 'rec-2',
    'Recliner: 3 Seat': 'rec-3',
}

if not CSV_PATH.exists():
    print(f"Price list missing: {CSV_PATH.relative_to(ROOT)}")
    sys.exit(1)

# utf-8-sig: the exported CSV carries a BOM, which otherwise corrupts the
# first header key and silently yields zero rows.
rows = [r for r in csv.DictReader(CSV_PATH.open(encoding="utf-8-sig"))
        if (r.get("Item Name") or "").strip()]

web = json.loads(subprocess.run(
    ["node", "-e", """
const {TRASH_CONFIG:C}=require('./assets/js/config.js');
const o={};C.categories.forEach(c=>c.items.forEach(i=>o[i.id]={name:i.name,charge:i.charge,legacy:!!i.legacy}));
console.log(JSON.stringify(o));"""],
    cwd=ROOT, capture_output=True, text=True).stdout)

php = (ROOT / "api" / "config.php").read_text()
srv = {m[0]: float(m[2]) for m in
       re.findall(r"'([\w-]+)'\s*=>\s*\['([^']*)',\s*([0-9.]+)\]", php)}

failures = []
matched = set()

for r in rows:
    name = r["Item Name"].strip()
    price = float(r["Item Price"].strip())
    item_id = MAPPING.get(name)

    if item_id is None:
        failures.append(f"price list row has no item: {name} (${price:g})")
        continue
    matched.add(item_id)

    if item_id not in web:
        failures.append(f"{name} -> '{item_id}' is not in config.js")
        continue
    if abs(web[item_id]["charge"] - price) > 0.001:
        failures.append(f"{name}: price list ${price:g}, config.js ${web[item_id]['charge']:g}")
    if item_id not in srv:
        failures.append(f"{name} -> '{item_id}' is not in api/config.php")
    elif abs(srv[item_id] - price) > 0.001:
        failures.append(f"{name}: price list ${price:g}, api/config.php ${srv[item_id]:g}")
    if web[item_id].get("legacy"):
        failures.append(f"{item_id} is in the price list but still marked legacy")

# Anything not in the price list must be openly flagged, not silently kept.
unflagged = [i for i in web if i not in matched and not web[i]["legacy"]]
for i in unflagged:
    failures.append(f"{i} ('{web[i]['name']}') is not in the price list and is NOT marked legacy")

legacy = sorted(i for i in web if web[i]["legacy"])

if failures:
    print("PRICE LIST PARITY FAILED\n")
    for f in failures:
        print("  " + f)
    sys.exit(1)

print(f"  PASS  all {len(rows)} price-list rows match config.js and api/config.php")
print(f"        {len(legacy)} items are not in the price list and are flagged legacy:")
print("        " + ", ".join(legacy))
