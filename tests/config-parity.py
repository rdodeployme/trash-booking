#!/usr/bin/env python3
"""Fails if the browser config and the server config have drifted apart.

The server is the authority on price, so the two files must agree on every
item charge, every fee, every dismantling tier and the approved postcodes.

    python3 tests/config-parity.py
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ---- Browser side: let node read it, so we test the real parsed values ------
js = subprocess.run(
    ["node", "-e", """
const {TRASH_CONFIG:C} = require('./assets/js/config.js');
const items = {};
C.categories.forEach(cat => cat.items.forEach(i => { items[i.id] = [i.name, i.charge]; }));
console.log(JSON.stringify({
  fees: C.fees,
  tiers: Object.fromEntries(C.dismantlingTiers.map(t => [t.id, t.fee === null ? null : t.fee])),
  manualTiers: C.dismantlingTiers.filter(t => t.manualReview).map(t => t.id),
  postcodes: C.serviceArea.approvedPostcodes,
  items
}));
"""],
    cwd=ROOT, capture_output=True, text=True,
)
if js.returncode != 0:
    print("Could not read assets/js/config.js\n" + js.stderr)
    sys.exit(1)
web = json.loads(js.stdout)

# ---- Server side: parse api/config.php --------------------------------------
php = (ROOT / "api" / "config.php").read_text()

def php_fee(key):
    m = re.search(r"'%s'\s*=>\s*([0-9.]+)" % key, php)
    return float(m.group(1)) if m else None

srv_fees = {k: php_fee(k) for k in ("stairs", "urgent")}

srv_tiers = {}
srv_manual = []
for tid, fee, manual in re.findall(
    r"'([\w-]+)'\s*=>\s*\['label'\s*=>\s*'[^']*',\s*'fee'\s*=>\s*([0-9.]+|null),\s*'manualReview'\s*=>\s*(true|false)\]",
    php,
):
    srv_tiers[tid] = None if fee == "null" else float(fee)
    if manual == "true":
        srv_manual.append(tid)

pc_block = re.search(r"'approvedPostcodes'\s*=>\s*\[(.*?)\]", php, re.S).group(1)
srv_postcodes = re.findall(r"'(\d{4})'", pc_block)

items_block = re.search(r"'items'\s*=>\s*\[(.*?)\n  \],", php, re.S).group(1)
srv_items = {
    m[0]: [m[1], float(m[2])]
    for m in re.findall(r"'([\w-]+)'\s*=>\s*\['([^']*)',\s*([0-9.]+)\]", items_block)
}

# ---- Compare ----------------------------------------------------------------
failures = []

for k, v in web["fees"].items():
    if float(v) != srv_fees.get(k):
        failures.append(f"fee {k}: config.js {v} vs config.php {srv_fees.get(k)}")

if web["tiers"] != srv_tiers:
    failures.append(f"dismantling tiers differ: {web['tiers']} vs {srv_tiers}")
if sorted(web["manualTiers"]) != sorted(srv_manual):
    failures.append(f"manual-review tiers differ: {web['manualTiers']} vs {srv_manual}")

if sorted(web["postcodes"]) != sorted(srv_postcodes):
    only_web = sorted(set(web["postcodes"]) - set(srv_postcodes))
    only_srv = sorted(set(srv_postcodes) - set(web["postcodes"]))
    failures.append(f"postcodes differ — only in config.js: {only_web}, only in config.php: {only_srv}")

for item_id, (name, charge) in web["items"].items():
    if item_id not in srv_items:
        failures.append(f"item {item_id} missing from config.php")
    elif abs(srv_items[item_id][1] - float(charge)) > 0.001:
        failures.append(f"item {item_id} charge: {charge} vs {srv_items[item_id][1]}")
    elif srv_items[item_id][0] != name:
        failures.append(f"item {item_id} name: '{name}' vs '{srv_items[item_id][0]}'")

for item_id in srv_items:
    if item_id not in web["items"]:
        failures.append(f"item {item_id} is in config.php but not config.js")

if failures:
    print("CONFIG PARITY FAILED\n")
    for f in failures:
        print("  " + f)
    sys.exit(1)

print(f"  PASS  browser and server configs agree "
      f"({len(srv_items)} items, {len(srv_postcodes)} postcodes, "
      f"{len(srv_tiers)} dismantling tiers, {len(srv_fees)} fees)")
