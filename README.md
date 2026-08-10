# Trash.com.au — bulky item booking funnel

Fixed-price online booking for specific bulky items. Select it. Book it. We collect it. We recycle it.

No photos needed, no measuring, no cubic metres, no quote forms, no callbacks.

## Running it

Static front end plus two PHP endpoints — the same shape as the rest of the estate
(cPanel + PHP). No build step, no Node dependency in production.

Local preview (this machine has no PHP, so a Node stand-in serves the same two
endpoints using the same pricing engine):

```bash
node tests/dev-server.js 8795
```

Tests:

```bash
node tests/pricing.test.js \
  && python3 tests/config-parity.py \
  && python3 tests/price-list-parity.py
```

`config-parity.py` proves the browser and the server agree with each other.
`price-list-parity.py` proves they both agree with `pricing/2026-08-10-price-list.csv`
— the price list as supplied, kept in the repo so every price has provenance
and a typo fails a test instead of reaching a customer.

## Layout

| Path | Role |
|---|---|
| `index.html` | Homepage. Deliberately short: hero, four steps, category tiles, JUNK hand-off, help. |
| `book.html` | The funnel shell: header, progress bar, step container, sticky mobile cart. |
| `assets/js/config.js` | **All business data.** Prices, fees, tiers, postcodes, availability, JUNK URL, contact, payment config. |
| `assets/js/pricing.js` | **The pricing engine.** The only thing in the browser that does money arithmetic. |
| `assets/js/icons.js` | Inline SVG item silhouettes — one per item, no image requests. |
| `assets/js/app.js` | The funnel: routing, state, rendering, validation, submission. |
| `assets/css/trash.css` | Styles. Mobile first. |
| `api/config.php` | Server mirror of the pricing data. |
| `api/pricing.php` | Server pricing engine — the authority. |
| `api/quote.php` | `POST` re-prices a booking. |
| `api/booking.php` | `POST` validates, re-prices, stores, returns a reference. |
| `api/photos.php` | `POST` attaches optional photos to an existing booking. |
| `api/payment.php` | The single payment integration point. Currently returns `null` on purpose. |
| `pricing/` | The price lists as supplied. The source of every number in `config.js`. |
| `tests/` | Pricing tests, the two parity checks, local dev server, preview sync script. |

## Design system

Tokens live at the top of `assets/css/trash.css`. Two rules carry the look:

1. **One content measure, centred.** Every step sits in a 600px column centred
   in the page — on mobile, tablet and desktop. Nothing is left flush against a
   gutter. On desktop that column pairs with a 336px summary rail and the pair
   is centred, so the funnel never stretches into a dashboard.
2. **Weight signals state.** A resting card gets a 1px hairline and a soft
   shadow. The card you have *chosen* gets the 2px black ring. When everything
   carries a heavy border, nothing reads as selected.

Item rows use a fixed three-column grid — thumbnail, name, action — so every
card in a list shares the same left and right alignment edges. Below 360px the
action drops to its own full-width row rather than being squeezed.

The total always appears in a black band with the figure in Trash yellow: on
the review, the confirmation, the desktop rail and the mobile drawer, one
component (`summaryCard`) renders all four, so the figures can't disagree.

The earlier build is kept unchanged at
`../trash-booking-LOCKED-2026-08-10-v1/` (files read-only).

### Icons

`assets/js/icons.js`. Solid black silhouettes, no outlines — a 1px stroke is
mush at the 44&times;32 the item card actually renders. Detail is punched out as
holes (`fill-rule="evenodd"`) so it shows the tile behind it, which matters
because the tile turns yellow when an item is selected.

**The rule: every variant must differ by something countable or structural,
never by width alone.** Five mattresses that differ by a few pixels are five
identical icons at thumbnail size.

| Category | What separates the variants |
|---|---|
| Mattresses | Plan view at true AU dimensions; one pillow for singles, two for doubles and up |
| Bed bases vs frames | A base is a **solid** slab with castors; a frame is **slatted** with posts and a headboard. The price list says a base is "a solid box" — that distinction has to be the drawing, or the two are the same icon |
| Bunk beds | The two tiers at their real relative widths: single/single, single/double, double/double |
| Outdoor lounges | The same seat count on a **slatted** frame, so indoor and outdoor never match |
| Couches, sofa beds | Countable seat cushions, up to about four. Past that the cushions are too thin to count at 44px and the name carries it — the same honest limit as double vs queen |
| Recliners | Cushion count, plus a bolt for electric |
| Dining tables | Plan view — count the chairs around it (4 / 6 / 8) |
| Dining chairs | The chair drawn once, four times, six times in a row |
| Fridges, freezers | Door configuration; freezers carry a snowflake badge so an upright freezer isn't just a fridge again |

Where two items genuinely look alike — a double and a queen mattress — the
icons stay honest and let the name disambiguate rather than inventing a
difference that isn't there.

Open `tests/icons-sheet.html` to see every icon at real size. Judge new icons
at real size first; anything that only works enlarged has failed.

### Alignment rules that must not regress

The page uses **exactly two widths**. Introducing a third is what makes a
layout read as sloppy — edges 10px apart look like a mistake, not a decision.

- **984px rail** — header, progress bar, grids, footer, and the funnel's
  main + rail pair.
- **600px measure** (`--measure`) — every block of text: hero copy, section
  headings, notes, the funnel's content column.

`--page` is set to **1024px** on purpose: `600 + 48 gap + 336 rail + 40 gutters`.
That equality is what puts the header, the progress bar and the funnel content
on one left edge instead of three edges 18px apart. Change one of those four
numbers and you must change `--page` with it.

The desktop summary rail is only present on some steps, so its grid track has
to disappear with it (`.layout:has(.col-side:not([hidden]))`). Without that,
the steps with no rail render their content 192px left of centre against an
empty column.

### Mobile rules that must not regress

- **Changing a quantity patches one card, it never re-renders the step.**
  A full render scrolls to the top and moves focus, which on a phone means
  every tap on the last item in a list throws you back to the heading. See
  `setQty()` in `app.js` — if you add state to the items step, patch it there
  rather than calling `render()`.
- **Every focusable field is ≥16px**, including the visually hidden radios and
  checkboxes inside `.choice`. Under 16px, iOS zooms the page on focus.
- **`input.postcode-input`, not `.postcode-input`** — `input[type="text"]`
  outranks a bare class and silently reverts the field to body size.
- **The sticky cart bar is hidden on every step with a text field**
  (details, review, postcode), so it can never fight the keyboard.
- Controls use `touch-action: manipulation` to drop the double-tap-zoom wait,
  which is most noticeable on the quantity stepper.
- `.wrap` pads with `env(safe-area-inset-*)` for the landscape notch, and a
  `max-height: 520px` block shrinks the chrome so a phone held sideways still
  has room to book in.

## Pricing rules

**Prices are ALL-IN.** There is no call-out fee — the price beside an item is
what that item costs to have collected. One function decides every price, in
two places kept in step by `tests/config-parity.py`:

```
itemTotal    = sum(quantity × itemCharge) # no multi-item discount
stairsFee    = stairs ? 100 : 0           # flat, ONCE per booking
urgentFee    = urgent ? 100 : 0
dismantling  = none 0 | 1–2 $20 | 3–5 $60 | 6+ manual review
bookingTotal = itemTotal + stairsFee + urgentFee + dismantlingFee
```

This replaced the original `$99 call-out + volume × $130/m³` model on
2026-08-10. Prices now come from the supplied price list and are set by hand,
so `volumeM3` survives only as internal reference on the items that had one —
it is never rendered and never priced against.

### Legacy items — 16 of them

Dining tables, dining chairs, fridges & freezers, the three sofa beds and the
electric recliner were **not in the 2026-08-10 price list**. They are still on
the old volume-based pricing, marked `legacy: true` in `config.js`, and
** NEED REPRICING BEFORE LAUNCH **. They were kept bookable rather than
dropped, so the catalogue currently runs two pricing models at once.
`tests/pricing.test.js` pins the count at 16 so it can't be quietly forgotten.

### Gaps in the supplied price list

Not invented, and not added:

- **No car rim & tyre** — the most common case. Rim-only exists for car, truck
  and tractor; rim & tyre only for truck and tractor.
- **No car or tractor tyre-only price.** `Tyre only — truck` is also described
  in the source as "for a tractor, truck or bob cat", contradicting its name.
- All three pianos are $1299, despite an upright being far smaller than a grand.

### Manual review

No price is invented for anything unapproved. These route the booking to
"We just need to confirm this collection before you pay", with online payment
disabled and the customer's details still captured for follow-up:

- six or more items needing dismantling
- difficult access without stairs
- unusually heavy items
- a postcode outside the approved collection area

## Photos (optional)

The review step offers photos. They are an aid, never a step: nothing in the
funnel blocks on one, no price depends on one, and the customer is told plainly
they don't need to send any.

- **Compressed in the browser first.** A 1 MB phone photo becomes ~170 KB at
  1400px on the longest edge. Raw phone photos are 3–5 MB and fail on mobile
  data — measured, not assumed.
- **Stored under their own localStorage key** (`trash.booking.photos.v1`), not
  the booking key. A photo that won't fit can never take the booking down with
  it; if the quota is refused, photos stay in memory for the visit and the
  interface says so instead of pretending they'll survive a refresh.
- **Uploaded after the booking exists**, to `api/photos.php` keyed by the
  reference. If that upload fails the booking still stands and the confirmation
  says the photos didn't attach — an optional extra must never cost someone
  their booking.
- **Verified server-side by content, not by label.** `getimagesizefromstring()`
  has to decode the bytes as a real JPEG/PNG/WebP; the reference is matched
  against `/^TR-\d{6}-[A-Z0-9]{5}$/` and the booking file must already exist.
  Files land outside the webroot.

Turn the whole feature off with `photos.enabled: false` in `config.js`.

**Copy note:** the brief's approved trust line was "Fixed pricing. No photos.
No measuring." Since photos are now offered, that line reads as a contradiction,
so it is now **"No photos needed"** — same promise, still true. Revert it in
`index.html` and the postcode step of `app.js` if you want the original wording.

## Payment

There is no payment provider connected. `api/payment.php` is the one place to
add one. Until it returns a URL, the funnel ends at "booking request received"
and states plainly that nothing has been charged. Two rules must survive
whatever provider gets plugged in:

1. Charge the total the **server** calculated, never one that arrived from the browser.
2. Never create a payment when `paymentAllowed` is false.

`api/booking.php` already recalculates every booking and records whether the
browser's figure agreed (`totalsAgree`).

## Before this can go live

- **Approved postcodes** — `serviceArea.approvedPostcodes` in `config.js` and
  `approvedPostcodes` in `api/config.php` are clearly-labelled test values.
- **Availability** — the date picker runs on a placeholder rule (first offered
  day is 3 days out, closed Sundays). Connect real run-sheet availability. No
  same-day or next-day promise is made anywhere.
- **Contact details** — `contact.phone` / `contact.email` are empty; the help
  panel says so rather than inventing a number.
- **Payment provider** — see above.
- **Storage paths** — `bookingStorePath` and `photoStorePath` in
  `api/config.php` must point at real directories outside the webroot. An
  uploaded file under the webroot is a served file.
- **Logo** — see below.

## Logo

`assets/img/trash-logo.png` is the genuine supplied asset
(`trash_logo_2000px_transparent.png`), trimmed of its transparent margin only.
The untouched original is kept alongside it as `trash-logo-original.png`.
Nothing about the mark has been redesigned or recoloured.

Two things worth raising with whoever owns the brand:

1. It is a **reversed lockup** — the wordmark is white — so it only works on a
   dark background. That is why the site header and hero are black. A
   black-on-light variant would be needed for any light-background placement.
2. The bin glyph is **green (#94C25A)**, which sits close to JUNK's green and
   works against the brief's requirement that Trash reads as distinct from
   JUNK. Everything else on the site is Trash yellow, black and off-white. A
   yellow/black variant of the mark would resolve it.

## Local preview note

The in-app browser preview is sandboxed and cannot read `~/Desktop`. Edit here,
then run `sh tests/sync-preview.sh` to copy the site into the scratchpad the
preview serves from, and reload.
