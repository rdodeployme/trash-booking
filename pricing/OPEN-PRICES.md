# Open prices — what's still missing, and what I could work out

**Nothing in this file is live.** `config.js` is unchanged. These are proposals
and questions for Andy; once a number is confirmed it takes one edit to apply,
and `tests/price-list-parity.py` will then enforce it.

Source: `pricing/2026-08-10-price-list.csv` (45 items).

---

## First, the finding that rules out the easy route

The new price list is **not** a transform of the old volume-based one, so the
16 legacy items cannot be converted mechanically. Comparing items that appear
in both:

| Item | Old | New | Ratio |
|---|---|---|---|
| Standard recliner | $78 | $79 | ×1.01 |
| 4-seater couch | $260 | $189 | ×0.73 |
| Queen bed base | $78 | $99 | ×1.27 |
| Single bed base | $45.50 | $79 | ×1.74 |
| Queen mattress | $65 | $139 | ×2.14 |
| Single mattress | $39 | $99 | ×2.54 |

The ratio runs from **×0.73 to ×2.54** — big items got cheaper, small items got
much dearer. There is no factor to apply. Anything not in the new list needs a
real price rather than a conversion.

---

## Resolved — derived from the list's own numbers

### Tyre only — tractor = **$449**

The truck prices decompose exactly:

```
rim only $19  +  tyre only $59  −  $9  =  rim & tyre $69      ✓ exact
```

Applying the same relationship to the tractor:

```
rim only $59  +  T  −  $9  =  rim & tyre $499     →   T = $449
```

Two independent checks agree: the arithmetic is exact on the truck, and $449
ends in 9 — as do **44 of the 45** prices in the list.

---

## Proposal — reasoned, but needs your yes

### Electric recliner = **$89**

Two routes land in the same place:

- **The list's own idiom.** A recliner sits $10 above the equivalent couch at
  1 seat ($79 vs $69) and at 3 seats ($179 vs $169). $10 is how this list
  steps. Recliner 1 seat $79 + $10 = **$89**.
- **The old list's own premium.** It charged electric 17% above standard
  ($78 → $91). Applying that to $79 gives $92, and the nearest 9-ending
  price is **$89**.

An electric recliner is a one-seat recliner with a motor and transformer —
heavier, and sometimes needs unplugging and cable management on site.

### Sofa beds — a structural decision, not just a price

The catalogue currently lists futons **and** sofa beds side by side as near
duplicates, because the new list added futons without repricing sofa beds:

| | Price |
|---|---|
| Futon — 2 seater | $169 (new list) |
| Two-seater sofa bed | $156 (old, legacy) |
| Futon — 3 seater | $199 (new list) |
| Three-seater sofa bed | $208 (old, legacy) |
| Single sofa bed | $97.50 (old, legacy) — no futon equivalent |

Two clean ways out:

1. **Drop sofa beds, keep futons.** Simplest. Customers with a sofa bed pick
   the futon of the same seat count. Leaves single sofa beds with nowhere to go.
2. **Keep both and price sofa beds above futons.** Defensible — a sofa bed has
   a steel fold-out mechanism and is genuinely heavier than a futon.

Either way a **single** sofa bed still needs a number: the list has no 1-seat
futon to anchor it to.

---

## Cannot be worked out — these need a number from you

### Car tyres and rims

**Car rim only at $10 is confirmed correct** (Andy, 2026-08-10) — deliberate,
not a typo, even though it is the only price in the list that doesn't end in 9.

That confirmation tells us something useful: the truck's combined discount does
**not** carry across to cars. If it did,

```
rim & tyre (car) = rim only $10 + T − $9  =  T + $1
```

and for that to land on a 9-ending like the other 44 prices, `T` would have to
end in 8 — nothing in the list does. So the car entries were priced on a
different basis to the truck and tractor ones, and nothing in the list fixes `T`.

**Still needed:** *what do you charge to take a car tyre off someone's hands,
with no rim?* That single figure also sets car rim & tyre.

### Fridges & freezers — 6 items

There is no appliance anywhere in the price list, so there's nothing to anchor
to. More importantly, a fridge carries a cost no furniture item does:
**refrigerant degassing and regulated disposal**. I have no figure for that and
won't guess one — it's the whole basis of the price.

*What does it cost you to dispose of one standard fridge, degassing included?*
Everything else scales from that.

Currently on old pricing: bar $26, single-door $52, two-door $84.50,
french-door $97.50, upright freezer $52, chest freezer $65.

### Dining tables and chairs — 6 items

No analogue in the list either. The one signal available: the cheapest items in
the new list are a mattress topper at $19 and a car rim at $10, and the old
single dining chair was $13 — so a chair almost certainly lands at $19–29 under
the new scheme. That's a bracket, not a price.

Currently on old pricing: tables $39 / $52 / $78, chairs $13 / $52 / $78.

---

## Summary

| | Count |
|---|---|
| Derived from the list, ready to apply | 1 |
| Proposed, needs your yes | 2 (+1 structural decision) |
| Needs a number from you | 15 (one query closed: car rim $10 confirmed) |

The three questions that unlock nearly all of it:

1. What does it cost to dispose of **one standard fridge**, degassing included?
2. What do you charge for a **car tyre with no rim**?  _(car rim $10 — confirmed)_
3. What's a **single dining chair** worth under the new pricing?
