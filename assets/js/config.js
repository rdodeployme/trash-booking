/* ============================================================================
   TRASH.COM.AU — CENTRAL CONFIGURATION
   ----------------------------------------------------------------------------
   Every business value lives in this file. Nothing in the interface hard-codes
   a price, a fee, a postcode or a URL. Change it here and it changes everywhere.

   Values flagged  ** REQUIRED BEFORE LAUNCH **  are placeholders that must be
   replaced with real, approved business data. They are deliberately obvious.

   The server mirror of the pricing half of this file is api/config.php.
   tests/config-parity.py checks the two never drift apart.
   ========================================================================== */

const TRASH_CONFIG = {

  /* ---- Brand ------------------------------------------------------------ */
  brand: {
    name: 'Trash',
    // Genuine supplied asset. Not redesigned or recoloured.
    // NOTE: the only variant supplied is a reversed (white wordmark) lockup,
    // so it must sit on a dark background. See README "Logo".
    logoPath: 'assets/img/trash-logo.png',
    logoAlt: 'Trash',
    colours: {
      yellow:   '#FFF800',
      black:    '#000000',
      white:    '#FFFFFF',
      offWhite: '#FAFAFA'
    }
  },

  /* ---- Contact ---------------------------------------------------------- */
  // ** REQUIRED BEFORE LAUNCH ** confirm the real Trash contact details.
  contact: {
    phone: '',                       // e.g. '1300 000 000'
    phoneHref: '',                   // e.g. 'tel:1300000000'
    email: '',                       // e.g. 'bookings@trash.com.au'
    helpText: 'Contact details to be confirmed before launch.'
  },

  /* ---- Where mixed loads go -------------------------------------------- */
  junk: {
    url: 'https://junk.com.au',      // configurable JUNK redirect
    label: 'Go to JUNK'
  },

  /* ---- Fees (all AUD) --------------------------------------------------- */
  // Item prices are ALL-IN. There is no call-out fee: the price beside an item
  // is what that item costs to have collected. (Superseded the old
  // "$99 call-out + volume x $130/m3" model on 2026-08-10.)
  fees: {
    stairs: 100,                     // flat, once per booking — never per item
    urgent: 100                      // flat, once per booking
  },

  /* ---- Dismantling tiers ------------------------------------------------ */
  // `manualReview: true` means: no price, booking must be confirmed by the team.
  dismantlingTiers: [
    { id: 'none',  label: 'None',          summaryLabel: null,                   fee: 0  },
    { id: '1-2',   label: '1–2 items',     summaryLabel: 'Dismantling 1–2 items', fee: 20 },
    { id: '3-5',   label: '3–5 items',     summaryLabel: 'Dismantling 3–5 items', fee: 60 },
    { id: '6plus', label: '6 or more items', summaryLabel: 'Dismantling 6+ items',
      fee: null, manualReview: true }
  ],

  /* ---- Other conditions with no approved price -------------------------- */
  // Shown as optional declarations on the access step. Any one of them routes
  // the booking to manual review instead of inventing a number.
  manualReviewConditions: [
    { id: 'difficultAccess', label: 'Difficult access (no stairs)',
      hint: 'Long carry, narrow gate, lift, no truck parking' },
    { id: 'heavyItem',       label: 'Unusually heavy item',
      hint: 'Stone or concrete tops, safes, commercial units' }
  ],

  /* ---- Service area ----------------------------------------------------- */
  // ** REQUIRED BEFORE LAUNCH ** these are TEST postcodes only.
  // Replace with the real approved collection area. Out-of-area postcodes are
  // NOT rejected — they route to manual review, because no price is approved.
  serviceArea: {
    isTestData: true,
    approvedPostcodes: [
      // TEST VALUES — Melbourne inner north/west sample
      '3000', '3001', '3002', '3003', '3004', '3006', '3008',
      '3011', '3012', '3013', '3015', '3016', '3018', '3019',
      '3020', '3021', '3025', '3026', '3028', '3029', '3030',
      '3031', '3032', '3033', '3034', '3036', '3037', '3038',
      '3039', '3040', '3041', '3042', '3043', '3044', '3045',
      '3046', '3047', '3048', '3049', '3050', '3051', '3052',
      '3053', '3054', '3055', '3056', '3057', '3058', '3060',
      '3061', '3062', '3063', '3064', '3065', '3066', '3067',
      '3068', '3070', '3071', '3072', '3073', '3074', '3075',
      '3076', '3078', '3079', '3081', '3121', '3141', '3182'
    ]
  },

  /* ---- Availability ----------------------------------------------------- */
  // ** REQUIRED BEFORE LAUNCH ** real availability must come from the run sheet.
  // Until then the picker offers a conservative placeholder window and says so.
  // No same-day or next-day promise is made anywhere in the interface.
  availability: {
    isTestData: true,
    leadTimeDays: 3,                 // earliest offered date = today + 3
    daysToOffer: 14,                 // size of the picker window
    closedWeekdays: [0],             // 0 = Sunday
    blockedDates: [],                // 'YYYY-MM-DD' strings
    urgentLeadTimeDays: 1            // earliest offered date when urgent is selected
  },

  /* ---- Categories and items -------------------------------------------- */
  //
  // Prices are ALL-IN per item (source: "Trash price - update items.csv",
  // 2026-08-10). They are set by hand, not derived from volume — the old
  // $130/m3 rate no longer applies, so volumeM3 survives only as internal
  // reference on the items that had one. It is never rendered and never priced.
  //
  // `note`   — the short description from the pricing sheet, shown on the card.
  // `legacy` — NOT in the 2026-08-10 price list. Still on the old volume-based
  //            pricing and ** NEEDS REPRICING ** before launch. Kept bookable on
  //            Andy's instruction rather than dropping the service.
  //
  categories: [
    {
      id: 'mattresses', name: 'Mattresses', icon: 'mattress',
      items: [
        { id: 'mat-single-ks', name: 'Mattress — single/king single', icon: 'mattress-s',  charge: 99 },
        { id: 'mat-dqk',       name: 'Mattress — double/queen/king', icon: 'mattress-k',  charge: 139 },
        { id: 'mat-cot',       name: 'Mattress — cot or crib',           icon: 'mattress-cot', charge: 29 },
        { id: 'topper-single-ks', name: 'Topper — single/king single', icon: 'topper-s', charge: 19 },
        { id: 'topper-dqk',       name: 'Topper — double/queen/king', icon: 'topper-k', charge: 29,
          note: 'Standard size' }
      ]
    },
    {
      id: 'beds', name: 'Beds & Bases', icon: 'bedbase',
      items: [
        { id: 'base-single-ks', name: 'Bed base — single/king single', icon: 'bedbase-s', charge: 79,
          note: 'A solid box, not slatted' },
        { id: 'base-dqk',       name: 'Bed base — double/queen/king', icon: 'bedbase-k', charge: 99,
          note: 'A solid box, not slatted' },
        { id: 'frame-single-ks', name: 'Bed frame — single/king single', icon: 'bedframe-s', charge: 79,
          note: 'Slats, leg posts, header and footer' },
        { id: 'frame-dqk',       name: 'Bed frame — double/queen/king', icon: 'bedframe-k', charge: 99,
          note: 'Slats, leg posts, header and footer' },
        { id: 'headboard-single-ks', name: 'Headboard — single/king single', icon: 'headboard-s', charge: 39 },
        { id: 'headboard-dqk',       name: 'Headboard — double/queen/king', icon: 'headboard-k', charge: 49 },
        { id: 'bunk-ss', name: 'Bunk bed — single over single', icon: 'bunk-ss', charge: 129 },
        { id: 'bunk-sd', name: 'Bunk bed — single over double', icon: 'bunk-sd', charge: 169 },
        { id: 'bunk-dd', name: 'Bunk bed — double over double', icon: 'bunk-dd', charge: 229 }
      ]
    },
    {
      id: 'couches', name: 'Couches & Sofas', icon: 'sofa',
      items: [
        { id: 'sofa-1', name: 'Couch — 1 seat',  icon: 'sofa-1', charge: 69 },
        { id: 'sofa-2', name: 'Couch — 2 seater', icon: 'sofa-2', charge: 159 },
        { id: 'sofa-3', name: 'Couch — 3 seater', icon: 'sofa-3', charge: 169 },
        { id: 'sofa-4', name: 'Couch — 4 seater', icon: 'sofa-4', charge: 189 },
        { id: 'sofa-5', name: 'Couch — 5 seater', icon: 'sofa-5', charge: 199 },
        { id: 'sofa-6', name: 'Couch — 6 seater', icon: 'sofa-6', charge: 279 },
        { id: 'sofa-7', name: 'Couch — 7 seater', icon: 'sofa-7', charge: 299 },
        { id: 'sofa-8', name: 'Couch — 8 seater', icon: 'sofa-8', charge: 399 },
        { id: 'sofa-chaise', name: 'Chaise section', icon: 'chaise', charge: 59,
          note: 'Add as well as your couch' }
      ]
    },
    {
      id: 'recliners', name: 'Recliners', icon: 'recliner',
      items: [
        { id: 'rec-1', name: 'Recliner — 1 seat',  icon: 'recliner',   charge: 79 },
        { id: 'rec-2', name: 'Recliner — 2 seat',  icon: 'recliner-2', charge: 159 },
        { id: 'rec-3', name: 'Recliner — 3 seat',  icon: 'recliner-3', charge: 179 },
        { id: 'rec-electric', name: 'Electric recliner', icon: 'recliner-e', volumeM3: 0.70, charge: 91.00, legacy: true }
      ]
    },
    {
      id: 'sofa-beds', name: 'Sofa Beds & Futons', icon: 'sofabed',
      items: [
        { id: 'futon-2', name: 'Futon — 2 seater', icon: 'sofabed-2', charge: 169 },
        { id: 'futon-3', name: 'Futon — 3 seater', icon: 'sofabed-3', charge: 199 },
        { id: 'sofabed-1', name: 'Single sofa bed',       icon: 'sofabed-1', volumeM3: 0.75, charge: 97.50, legacy: true },
        { id: 'sofabed-2', name: 'Two-seater sofa bed',   icon: 'sofabed-2', volumeM3: 1.20, charge: 156.00, legacy: true },
        { id: 'sofabed-3', name: 'Three-seater sofa bed', icon: 'sofabed-3', volumeM3: 1.60, charge: 208.00, legacy: true }
      ]
    },
    {
      id: 'outdoor', name: 'Outdoor Lounges', icon: 'outdoor',
      items: [
        { id: 'out-1', name: 'Outdoor couch — armchair', icon: 'outdoor-1', charge: 69 },
        { id: 'out-2', name: 'Outdoor couch — 2 seater', icon: 'outdoor-2', charge: 149 },
        { id: 'out-3', name: 'Outdoor couch — 3 seater', icon: 'outdoor-3', charge: 169 },
        { id: 'out-4', name: 'Outdoor couch — 4 seater', icon: 'outdoor-4', charge: 189 },
        { id: 'out-5', name: 'Outdoor couch — 5 seater', icon: 'outdoor-5', charge: 199 },
        { id: 'out-6', name: 'Outdoor couch — 6 seater', icon: 'outdoor-6', charge: 279 },
        { id: 'out-7', name: 'Outdoor couch — 7 seater', icon: 'outdoor-7', charge: 299 },
        { id: 'out-8', name: 'Outdoor couch — 8 seater', icon: 'outdoor-8', charge: 399 }
      ]
    },
    {
      id: 'pianos', name: 'Pianos', icon: 'piano',
      items: [
        { id: 'piano-upright',    name: 'Upright piano',    icon: 'piano',       charge: 1299,
          note: 'Maximum size applies' },
        { id: 'piano-baby-grand', name: 'Baby grand piano', icon: 'piano-grand', charge: 1299,
          note: 'Maximum size applies' },
        { id: 'piano-grand',      name: 'Grand piano',      icon: 'piano-grand', charge: 1299,
          note: 'Maximum size applies' }
      ]
    },
    {
      id: 'tyres', name: 'Tyres & Rims', icon: 'tyre',
      items: [
        { id: 'rim-tyre-truck',   name: 'Rim & tyre — truck',   icon: 'rim-tyre', charge: 69 },
        { id: 'rim-tyre-tractor', name: 'Rim & tyre — tractor', icon: 'rim-tyre', charge: 499,
          note: 'Industrial/agricultural' },
        { id: 'tyre-truck',       name: 'Tyre only — truck',    icon: 'tyre',     charge: 59 },
        { id: 'rim-car',          name: 'Rim only — car',       icon: 'rim',      charge: 10 },
        { id: 'rim-truck',        name: 'Rim only — truck',     icon: 'rim',      charge: 19 },
        { id: 'rim-tractor',      name: 'Rim only — tractor',   icon: 'rim',      charge: 59 }
      ]
    },
    {
      id: 'dining-tables', name: 'Dining Tables', icon: 'table',
      items: [
        { id: 'table-4', name: 'Four-seat dining table',  icon: 'table-4', volumeM3: 0.30, charge: 39.00, legacy: true },
        { id: 'table-6', name: 'Six-seat dining table',   icon: 'table-6', volumeM3: 0.40, charge: 52.00, legacy: true },
        { id: 'table-8', name: 'Eight-seat dining table', icon: 'table-8', volumeM3: 0.60, charge: 78.00, legacy: true }
      ]
    },
    {
      id: 'dining-chairs', name: 'Dining Chairs', icon: 'chair',
      items: [
        { id: 'chair-1', name: 'Individual dining chair',   icon: 'chair',   volumeM3: 0.10, charge: 13.00, legacy: true },
        { id: 'chair-4', name: 'Set of four dining chairs', icon: 'chair-4', volumeM3: 0.40, charge: 52.00, legacy: true },
        { id: 'chair-6', name: 'Set of six dining chairs',  icon: 'chair-6', volumeM3: 0.60, charge: 78.00, legacy: true }
      ]
    },
    {
      id: 'fridges', name: 'Fridges & Freezers', icon: 'fridge',
      items: [
        { id: 'fridge-bar',    name: 'Bar fridge',                 icon: 'fridge-bar',    volumeM3: 0.20, charge: 26.00, legacy: true },
        { id: 'fridge-single', name: 'Standard single-door fridge', icon: 'fridge-single', volumeM3: 0.40, charge: 52.00, legacy: true },
        { id: 'fridge-double', name: 'Large two-door fridge',      icon: 'fridge-double', volumeM3: 0.65, charge: 84.50, legacy: true },
        { id: 'fridge-french', name: 'French-door fridge',         icon: 'fridge-french', volumeM3: 0.75, charge: 97.50, legacy: true },
        { id: 'freezer-up',    name: 'Upright freezer',            icon: 'freezer-up',    volumeM3: 0.40, charge: 52.00, legacy: true },
        { id: 'freezer-chest', name: 'Chest freezer',              icon: 'freezer-chest', volumeM3: 0.50, charge: 65.00, legacy: true }
      ]
    }
  ],
  /* ---- Payment ---------------------------------------------------------- */
  // No payment provider exists in this project yet. See api/payment.php for the
  // single integration point. Until `provider` is set, the flow ends at a
  // "booking request received" state and never claims a payment was taken.
  payment: {
    provider: null,                  // e.g. 'stripe'
    publishableKey: '',              // ** REQUIRED BEFORE LAUNCH **
    quoteEndpoint:   'api/quote.php',
    bookingEndpoint: 'api/booking.php'
  },

  /* ---- Photos (optional, never required) -------------------------------- */
  // Photos are an aid, not a step. Nothing in the funnel blocks on them and no
  // price depends on one. They are compressed in the browser before upload —
  // a raw phone photo is 3–5 MB and would fail on a weak mobile connection.
  photos: {
    enabled: true,
    maxCount: 6,
    maxDimension: 1400,     // longest edge, px
    quality: 0.7,           // JPEG quality after resize
    maxSourceBytes: 25 * 1024 * 1024,   // reject absurd source files early
    endpoint: 'api/photos.php',
    storageKey: 'trash.booking.photos.v1'   // deliberately NOT the booking key
  },

  /* ---- Interface options ------------------------------------------------ */
  ui: {
    /* Step 3 asks about stairs, urgency and dismantling. Putting a price
       beside each option invites the cheap answer rather than the true one,
       so the per-option fees are hidden there. The running total still
       updates live, and the review screen still itemises every charge —
       nothing is concealed, it just isn't a price list at the point of
       answering. Set true to show the fees on each option again. */
    showFeesOnAccessStep: false
  },

  /* ---- Storage ---------------------------------------------------------- */
  storage: { key: 'trash.booking.v1' }
};

/* Flat item lookup, built once. */
TRASH_CONFIG.itemsById = (() => {
  const map = {};
  TRASH_CONFIG.categories.forEach(cat => {
    cat.items.forEach(item => { map[item.id] = Object.assign({ categoryId: cat.id }, item); });
  });
  return map;
})();

/* In a classic script a top-level `const` is NOT a property of window, so the
   other files (which read it off the global) need it published explicitly. */
if (typeof module !== 'undefined' && module.exports) { module.exports = { TRASH_CONFIG }; }
else if (typeof self !== 'undefined') { self.TRASH_CONFIG = TRASH_CONFIG; }
