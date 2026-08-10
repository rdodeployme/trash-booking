<?php
/* ============================================================================
   TRASH.COM.AU — SERVER PRICING CONFIG
   ----------------------------------------------------------------------------
   Server-side mirror of the pricing half of assets/js/config.js.
   The browser is never trusted with a total; this file is the authority.

   tests/config-parity.py compares the two files and fails if they drift.
   Any price change must be made in BOTH files.
   ========================================================================== */

return [

  'fees' => [
    'calloutStandard' => 99,
    'calloutStairs'   => 199,   // replaces the standard call-out, never added to it
    'urgent'          => 100,
  ],

  'dismantlingTiers' => [
    'none'  => ['label' => 'None',             'fee' => 0,    'manualReview' => false],
    '1-2'   => ['label' => '1–2 items',        'fee' => 20,   'manualReview' => false],
    '3-5'   => ['label' => '3–5 items',        'fee' => 60,   'manualReview' => false],
    '6plus' => ['label' => '6 or more items',  'fee' => null, 'manualReview' => true],
  ],

  // Any of these routes the booking to manual review. No price is invented.
  'manualReviewConditions' => ['difficultAccess', 'heavyItem'],

  // ** REQUIRED BEFORE LAUNCH ** test values only — must match config.js
  'approvedPostcodes' => [
    '3000','3001','3002','3003','3004','3006','3008',
    '3011','3012','3013','3015','3016','3018','3019',
    '3020','3021','3025','3026','3028','3029','3030',
    '3031','3032','3033','3034','3036','3037','3038',
    '3039','3040','3041','3042','3043','3044','3045',
    '3046','3047','3048','3049','3050','3051','3052',
    '3053','3054','3055','3056','3057','3058','3060',
    '3061','3062','3063','3064','3065','3066','3067',
    '3068','3070','3071','3072','3073','3074','3075',
    '3076','3078','3079','3081','3121','3141','3182',
  ],

  // itemId => [name, charge]. volumeM3 is internal and not needed to price.
  'items' => [
    'mat-single'      => ['Single mattress',            39.00],
    'mat-king-single' => ['King single mattress',       45.50],
    'mat-double'      => ['Double mattress',            58.50],
    'mat-queen'       => ['Queen mattress',             65.00],
    'mat-king'        => ['King mattress',              78.00],

    'base-single'      => ['Single bed base',           45.50],
    'base-king-single' => ['King single bed base',      52.00],
    'base-double'      => ['Double bed base',           65.00],
    'base-queen'       => ['Queen bed base',            78.00],
    'base-king'        => ['King bed base',             91.00],

    'sofa-armchair' => ['Armchair or single-seater',    65.00],
    'sofa-2'        => ['Two-seater sofa',             130.00],
    'sofa-3'        => ['Three-seater sofa',           195.00],
    'sofa-4'        => ['Four-seater sofa',            260.00],
    'sofa-modular'  => ['Modular or corner lounge',    325.00],

    'sofabed-1' => ['Single sofa bed',                  97.50],
    'sofabed-2' => ['Two-seater sofa bed',             156.00],
    'sofabed-3' => ['Three-seater sofa bed',           208.00],

    'rec-standard' => ['Standard recliner',             78.00],
    'rec-electric' => ['Electric recliner',             91.00],
    'rec-2'        => ['Two-seater recliner',          156.00],

    'table-4' => ['Four-seat dining table',             39.00],
    'table-6' => ['Six-seat dining table',              52.00],
    'table-8' => ['Eight-seat dining table',            78.00],

    'chair-1' => ['Individual dining chair',            13.00],
    'chair-4' => ['Set of four dining chairs',          52.00],
    'chair-6' => ['Set of six dining chairs',           78.00],

    'fridge-bar'    => ['Bar fridge',                   26.00],
    'fridge-single' => ['Standard single-door fridge',  52.00],
    'fridge-double' => ['Large two-door fridge',        84.50],
    'fridge-french' => ['French-door fridge',           97.50],
    'freezer-up'    => ['Upright freezer',              52.00],
    'freezer-chest' => ['Chest freezer',                65.00],
  ],

  'maxQuantityPerItem' => 20,

  /* Optional photo attachments. Nothing about pricing depends on these. */
  'maxPhotos'             => 6,
  'maxPhotoBytes'         => 3 * 1024 * 1024,    // per photo, after browser resize
  'maxPhotoPayloadBytes'  => 24 * 1024 * 1024,   // whole request


  /* Where submitted bookings and photos are written. Keep BOTH outside the
     webroot — an uploaded file under the webroot is a served file.
     ** REQUIRED BEFORE LAUNCH ** point these at real paths on the server. */
  'bookingStorePath' => __DIR__ . '/../../trash-bookings',
  'photoStorePath'   => __DIR__ . '/../../trash-photos',
];
