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

  // Item prices are ALL-IN. There is no call-out fee. Flat add-ons only,
  // each charged once per booking, never per item.
  'fees' => [
    'stairs' => 100,
    'urgent' => 100,
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

  // itemId => [name, charge]. All-in prices; no call-out is added.
  'items' => [
    // Mattresses
    'mat-single-ks'         => ['Mattress — single/king single', 99.00],
    'mat-dqk'               => ['Mattress — double/queen/king', 139.00],
    'mat-cot'               => ['Mattress — cot or crib', 29.00],
    'topper-single-ks'      => ['Topper — single/king single', 19.00],
    'topper-dqk'            => ['Topper — double/queen/king', 29.00],

    // Beds & Bases
    'base-single-ks'        => ['Bed base — single/king single', 79.00],
    'base-dqk'              => ['Bed base — double/queen/king', 99.00],
    'frame-single-ks'       => ['Bed frame — single/king single', 79.00],
    'frame-dqk'             => ['Bed frame — double/queen/king', 99.00],
    'headboard-single-ks'   => ['Headboard — single/king single', 39.00],
    'headboard-dqk'         => ['Headboard — double/queen/king', 49.00],
    'bunk-ss'               => ['Bunk bed — single over single', 129.00],
    'bunk-sd'               => ['Bunk bed — single over double', 169.00],
    'bunk-dd'               => ['Bunk bed — double over double', 229.00],

    // Couches & Sofas
    'sofa-1'                => ['Couch — 1 seat', 69.00],
    'sofa-2'                => ['Couch — 2 seater', 159.00],
    'sofa-3'                => ['Couch — 3 seater', 169.00],
    'sofa-4'                => ['Couch — 4 seater', 189.00],
    'sofa-5'                => ['Couch — 5 seater', 199.00],
    'sofa-6'                => ['Couch — 6 seater', 279.00],
    'sofa-7'                => ['Couch — 7 seater', 299.00],
    'sofa-8'                => ['Couch — 8 seater', 399.00],
    'sofa-chaise'           => ['Chaise section', 59.00],

    // Recliners
    'rec-1'                 => ['Recliner — 1 seat', 79.00],
    'rec-2'                 => ['Recliner — 2 seat', 159.00],
    'rec-3'                 => ['Recliner — 3 seat', 179.00],
    'rec-electric'          => ['Electric recliner', 91.00],   // legacy — needs repricing

    // Sofa Beds & Futons
    'futon-2'               => ['Futon — 2 seater', 169.00],
    'futon-3'               => ['Futon — 3 seater', 199.00],
    'sofabed-1'             => ['Single sofa bed', 97.50],   // legacy — needs repricing
    'sofabed-2'             => ['Two-seater sofa bed', 156.00],   // legacy — needs repricing
    'sofabed-3'             => ['Three-seater sofa bed', 208.00],   // legacy — needs repricing

    // Outdoor Lounges
    'out-1'                 => ['Outdoor couch — armchair', 69.00],
    'out-2'                 => ['Outdoor couch — 2 seater', 149.00],
    'out-3'                 => ['Outdoor couch — 3 seater', 169.00],
    'out-4'                 => ['Outdoor couch — 4 seater', 189.00],
    'out-5'                 => ['Outdoor couch — 5 seater', 199.00],
    'out-6'                 => ['Outdoor couch — 6 seater', 279.00],
    'out-7'                 => ['Outdoor couch — 7 seater', 299.00],
    'out-8'                 => ['Outdoor couch — 8 seater', 399.00],

    // Pianos
    'piano-upright'         => ['Upright piano', 1299.00],
    'piano-baby-grand'      => ['Baby grand piano', 1299.00],
    'piano-grand'           => ['Grand piano', 1299.00],

    // Tyres & Rims
    'rim-tyre-truck'        => ['Rim & tyre — truck', 69.00],
    'rim-tyre-tractor'      => ['Rim & tyre — tractor', 499.00],
    'tyre-truck'            => ['Tyre only — truck', 59.00],
    'rim-car'               => ['Rim only — car', 10.00],
    'rim-truck'             => ['Rim only — truck', 19.00],
    'rim-tractor'           => ['Rim only — tractor', 59.00],

    // Dining Tables
    'table-4'               => ['Four-seat dining table', 39.00],   // legacy — needs repricing
    'table-6'               => ['Six-seat dining table', 52.00],   // legacy — needs repricing
    'table-8'               => ['Eight-seat dining table', 78.00],   // legacy — needs repricing

    // Dining Chairs
    'chair-1'               => ['Individual dining chair', 13.00],   // legacy — needs repricing
    'chair-4'               => ['Set of four dining chairs', 52.00],   // legacy — needs repricing
    'chair-6'               => ['Set of six dining chairs', 78.00],   // legacy — needs repricing

    // Fridges & Freezers
    'fridge-bar'            => ['Bar fridge', 26.00],   // legacy — needs repricing
    'fridge-single'         => ['Standard single-door fridge', 52.00],   // legacy — needs repricing
    'fridge-double'         => ['Large two-door fridge', 84.50],   // legacy — needs repricing
    'fridge-french'         => ['French-door fridge', 97.50],   // legacy — needs repricing
    'freezer-up'            => ['Upright freezer', 52.00],   // legacy — needs repricing
    'freezer-chest'         => ['Chest freezer', 65.00],   // legacy — needs repricing
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
