#!/usr/bin/env python3
"""Generates the approved postcode list from a centre point and a radius.

    python3 tools/build-service-area.py

Rewrites `serviceArea` in assets/js/config.js and `approvedPostcodes` in
api/config.php, so the two can't drift. Nothing here is hand-maintained —
change a setting below, re-run, and both configs follow.

DISTANCE IS STRAIGHT LINE, NOT ROAD. That matters around Port Phillip Bay:
Portsea is 35 km from Geelong as the crow flies and roughly 190 km by road,
or a Queenscliff-Sorrento ferry. Set EXCLUDE_SA4 to drop a whole region.

An excluded postcode is not refused — it falls through to the manual-review
path, so the customer can still book and the team confirms the price.

Source: matthewproctor/australianpostcodes (Australia Post data, lat/long per
locality). A trimmed copy of everything within 260 km of Geelong is committed
at service-area/au-postcodes-near-geelong.csv so this is reproducible offline
and every postcode in the list can be audited back to a coordinate.
"""

import csv
import math
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "service-area" / "au-postcodes-near-geelong.csv"

# ---- settings ---------------------------------------------------------------
CENTRE_LABEL = "Geelong VIC 3220"
CENTRE_LAT, CENTRE_LNG = -38.157038, 144.34652   # postcode 3220 in the source data
RADIUS_KM = 150

# Whole SA4 regions to drop even if they fall inside the radius.
# Put 'Mornington Peninsula' here to exclude everything across the bay.
EXCLUDE_SA4: list[str] = []

# Individual postcodes to drop regardless.
#   9999 NORTH POLE is a placeholder row in the source dataset, geocoded to
#   Melbourne CBD. It sits 68 km from Geelong and would otherwise be approved.
EXCLUDE_POSTCODES: set[str] = {"9999"}
# -----------------------------------------------------------------------------


def haversine(lat1, lng1, lat2, lng2):
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def load():
    """One postcode can cover several localities, so a postcode is placed at the
    mean of its localities. Using the nearest locality instead would pull in
    large rural postcodes on the strength of one corner touching the radius."""
    by_pc = {}
    for row in csv.DictReader(SOURCE.open(encoding="utf-8-sig")):
        by_pc.setdefault(row["postcode"], []).append(row)

    out = {}
    for pc, rows in by_pc.items():
        lat = sum(float(r["lat"]) for r in rows) / len(rows)
        lng = sum(float(r["long"]) for r in rows) / len(rows)
        out[pc] = {
            "km": haversine(CENTRE_LAT, CENTRE_LNG, lat, lng),
            "sa4": rows[0].get("sa4name", "") or "(unnamed)",
            "state": rows[0]["state"],
            "locality": rows[0]["locality"],
        }
    return out


def splice(path, start_marker, end_marker, replacement):
    lines = path.read_text().split("\n")
    try:
        i = next(n for n, l in enumerate(lines) if l == start_marker)
        j = next(n for n in range(i + 1, len(lines)) if lines[n] == end_marker)
    except StopIteration:
        raise SystemExit(f"Could not find the block to replace in {path.name}")
    path.write_text("\n".join(lines[:i] + replacement + lines[j + 1:]))


data = load()
inside = {p: v for p, v in data.items()
          if v["km"] <= RADIUS_KM
          and v["sa4"] not in EXCLUDE_SA4
          and p not in EXCLUDE_POSTCODES}
dropped = {p: v for p, v in data.items()
           if v["km"] <= RADIUS_KM and p not in inside}
postcodes = sorted(inside)

# ---- guards ----------------------------------------------------------------
# Geelong is ~250 km from the NSW border and Tasmania is across Bass Strait, so
# a non-Victorian postcode in the result means the radius has reached somewhere
# only a straight line can go. King Island (7256) is the one that bites first.
foreign = {p: v for p, v in inside.items() if v["state"] != "VIC"}
if foreign:
    print("  REFUSING TO WRITE — non-Victorian postcodes in the result:")
    for p, v in sorted(foreign.items()):
        print(f"    {p}  {v['locality']} {v['state']}  {v['km']:.0f} km — reachable only across water")
    raise SystemExit(1)

# ---- assets/js/config.js ----------------------------------------------------
rows_js = []
for n in range(0, len(postcodes), 10):
    rows_js.append("      " + " ".join(f"'{p}'," for p in postcodes[n:n + 10]))

js = [
    "  serviceArea: {",
    "    // GENERATED — do not hand-edit. Rebuild with:",
    "    //   python3 tools/build-service-area.py",
    f"    // {len(postcodes)} postcodes within {RADIUS_KM} km of {CENTRE_LABEL},",
    "    // measured STRAIGHT LINE, not by road. A postcode outside this list is",
    "    // never refused — it routes to manual review so the team can confirm.",
    f"    centre: {{ label: '{CENTRE_LABEL}', lat: {CENTRE_LAT}, lng: {CENTRE_LNG} }},",
    f"    radiusKm: {RADIUS_KM},",
    "    measuredAs: 'straight line',",
    f"    generated: '{date.today().isoformat()}',",
    "    source: 'service-area/au-postcodes-near-geelong.csv',",
    "    // Shown on the postcode step. Set to null once there is nothing to warn about.",
    "    note: 'Service area is a 150 km straight-line radius from Geelong. Postcodes "
    "across Port Phillip Bay are far closer by air than by road — confirm before launch.',",
    "    approvedPostcodes: [",
    *rows_js,
    "    ]",
    "  },",
]
splice(ROOT / "assets/js/config.js", "  serviceArea: {", "  },", js)

# ---- api/config.php --------------------------------------------------------
rows_php = []
for n in range(0, len(postcodes), 10):
    rows_php.append("    " + "".join(f"'{p}'," for p in postcodes[n:n + 10]))

php = [
    "  // GENERATED by tools/build-service-area.py — do not hand-edit.",
    f"  // {len(postcodes)} postcodes within {RADIUS_KM} km of {CENTRE_LABEL} (straight line).",
    "  'approvedPostcodes' => [",
    *rows_php,
    "  ],",
]
splice(ROOT / "api/config.php", "  'approvedPostcodes' => [", "  ],", php)

# ---- report ----------------------------------------------------------------
print(f"  {len(postcodes)} postcodes within {RADIUS_KM} km of {CENTRE_LABEL} (straight line)")
print(f"  states: {', '.join(sorted({v['state'] for v in inside.values()}))}")
if dropped:
    print(f"  excluded despite being inside the radius: {len(dropped)}")

regions = {}
for v in inside.values():
    regions[v["sa4"]] = regions.get(v["sa4"], 0) + 1
print("\n  regions reached:")
for name, n in sorted(regions.items(), key=lambda x: -x[1]):
    print(f"    {n:>3}  {name}")

print("\n  spot checks:")
for pc, label in [("3220", "Geelong"), ("3000", "Melbourne CBD"), ("3350", "Ballarat"),
                  ("3944", "Portsea"), ("3280", "Warrnambool"), ("3550", "Bendigo")]:
    v = data.get(pc)
    if v:
        state = "IN " if pc in inside else "out"
        print(f"    {pc}  {label:<14} {v['km']:6.1f} km  {state}")
print("\n  Now run: python3 tests/config-parity.py")
