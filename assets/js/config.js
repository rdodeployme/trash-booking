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
  fees: {
    calloutStandard: 99,             // once per booking
    calloutStairs:   199,            // REPLACES the standard call-out, never added to it
    urgent:          100             // flat add-on
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
  // volumeM3 is INTERNAL ONLY. It is never rendered to the customer.
  categories: [
    {
      id: 'mattresses', name: 'Mattresses', icon: 'mattress',
      items: [
        { id: 'mat-single',     name: 'Single mattress',      icon: 'mattress-s',  volumeM3: 0.30, charge: 39.00 },
        { id: 'mat-king-single',name: 'King single mattress', icon: 'mattress-ks', volumeM3: 0.35, charge: 45.50 },
        { id: 'mat-double',     name: 'Double mattress',      icon: 'mattress-d',  volumeM3: 0.45, charge: 58.50 },
        { id: 'mat-queen',      name: 'Queen mattress',       icon: 'mattress-q',  volumeM3: 0.50, charge: 65.00 },
        { id: 'mat-king',       name: 'King mattress',        icon: 'mattress-k',  volumeM3: 0.60, charge: 78.00 }
      ]
    },
    {
      id: 'bed-bases', name: 'Bed Bases', icon: 'bedbase',
      items: [
        { id: 'base-single',      name: 'Single bed base',      icon: 'bedbase-s',  volumeM3: 0.35, charge: 45.50 },
        { id: 'base-king-single', name: 'King single bed base', icon: 'bedbase-ks', volumeM3: 0.40, charge: 52.00 },
        { id: 'base-double',      name: 'Double bed base',      icon: 'bedbase-d',  volumeM3: 0.50, charge: 65.00 },
        { id: 'base-queen',       name: 'Queen bed base',       icon: 'bedbase-q',  volumeM3: 0.60, charge: 78.00 },
        { id: 'base-king',        name: 'King bed base',        icon: 'bedbase-k',  volumeM3: 0.70, charge: 91.00 }
      ]
    },
    {
      id: 'sofas', name: 'Sofas & Lounges', icon: 'sofa',
      items: [
        { id: 'sofa-armchair', name: 'Armchair or single-seater', icon: 'armchair', volumeM3: 0.50, charge: 65.00 },
        { id: 'sofa-2',        name: 'Two-seater sofa',           icon: 'sofa-2',   volumeM3: 1.00, charge: 130.00 },
        { id: 'sofa-3',        name: 'Three-seater sofa',         icon: 'sofa-3',   volumeM3: 1.50, charge: 195.00 },
        { id: 'sofa-4',        name: 'Four-seater sofa',          icon: 'sofa-4',   volumeM3: 2.00, charge: 260.00 },
        { id: 'sofa-modular',  name: 'Modular or corner lounge',  icon: 'modular',  volumeM3: 2.50, charge: 325.00 }
      ]
    },
    {
      id: 'sofa-beds', name: 'Sofa Beds', icon: 'sofabed',
      items: [
        { id: 'sofabed-1', name: 'Single sofa bed',       icon: 'sofabed-1', volumeM3: 0.75, charge: 97.50 },
        { id: 'sofabed-2', name: 'Two-seater sofa bed',   icon: 'sofabed-2', volumeM3: 1.20, charge: 156.00 },
        { id: 'sofabed-3', name: 'Three-seater sofa bed', icon: 'sofabed-3', volumeM3: 1.60, charge: 208.00 }
      ]
    },
    {
      id: 'recliners', name: 'Recliners', icon: 'recliner',
      items: [
        { id: 'rec-standard', name: 'Standard recliner',  icon: 'recliner',    volumeM3: 0.60, charge: 78.00 },
        { id: 'rec-electric', name: 'Electric recliner',  icon: 'recliner-e',  volumeM3: 0.70, charge: 91.00 },
        { id: 'rec-2',        name: 'Two-seater recliner', icon: 'recliner-2', volumeM3: 1.20, charge: 156.00 }
      ]
    },
    {
      id: 'dining-tables', name: 'Dining Tables', icon: 'table',
      items: [
        { id: 'table-4', name: 'Four-seat dining table',  icon: 'table-4', volumeM3: 0.30, charge: 39.00 },
        { id: 'table-6', name: 'Six-seat dining table',   icon: 'table-6', volumeM3: 0.40, charge: 52.00 },
        { id: 'table-8', name: 'Eight-seat dining table', icon: 'table-8', volumeM3: 0.60, charge: 78.00 }
      ]
    },
    {
      id: 'dining-chairs', name: 'Dining Chairs', icon: 'chair',
      items: [
        { id: 'chair-1', name: 'Individual dining chair',   icon: 'chair',   volumeM3: 0.10, charge: 13.00 },
        { id: 'chair-4', name: 'Set of four dining chairs', icon: 'chair-4', volumeM3: 0.40, charge: 52.00 },
        { id: 'chair-6', name: 'Set of six dining chairs',  icon: 'chair-6', volumeM3: 0.60, charge: 78.00 }
      ]
    },
    {
      id: 'fridges', name: 'Fridges & Freezers', icon: 'fridge',
      items: [
        { id: 'fridge-bar',    name: 'Bar fridge',                 icon: 'fridge-bar',    volumeM3: 0.20, charge: 26.00 },
        { id: 'fridge-single', name: 'Standard single-door fridge', icon: 'fridge-single', volumeM3: 0.40, charge: 52.00 },
        { id: 'fridge-double', name: 'Large two-door fridge',      icon: 'fridge-double', volumeM3: 0.65, charge: 84.50 },
        { id: 'fridge-french', name: 'French-door fridge',         icon: 'fridge-french', volumeM3: 0.75, charge: 97.50 },
        { id: 'freezer-up',    name: 'Upright freezer',            icon: 'freezer-up',    volumeM3: 0.40, charge: 52.00 },
        { id: 'freezer-chest', name: 'Chest freezer',              icon: 'freezer-chest', volumeM3: 0.50, charge: 65.00 }
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
