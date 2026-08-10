<?php
/* ============================================================================
   POST /api/booking.php
   Accepts a submitted booking, re-prices it server-side, stores it, and hands
   back a reference. The browser's own total is compared but never trusted.
   ========================================================================== */

declare(strict_types=1);

require __DIR__ . '/pricing.php';
require __DIR__ . '/payment.php';
$cfg = require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    trash_json_response(['error' => 'POST required'], 405);
}

$booking = trash_read_json_body();
if (!$booking) {
    trash_json_response(['error' => 'Booking details were missing or unreadable.'], 400);
}

/* ---- Validate the parts a customer must supply --------------------------- */

$details = is_array($booking['details'] ?? null) ? $booking['details'] : [];
$clean = static fn($v, $max = 500) => mb_substr(trim((string)$v), 0, $max);

$name    = $clean($details['name'] ?? '', 120);
$mobile  = $clean($details['mobile'] ?? '', 40);
$email   = $clean($details['email'] ?? '', 160);
$address = $clean($details['address'] ?? '', 300);
$postcode = $clean($booking['postcode'] ?? '', 4);
$date    = $clean($booking['date'] ?? '', 10);

$errors = [];
if (mb_strlen($name) < 2)                                    { $errors[] = 'full name'; }
if (strlen(preg_replace('/[^0-9]/', '', $mobile)) < 8)       { $errors[] = 'mobile number'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))              { $errors[] = 'email address'; }
if (mb_strlen($address) < 6)                                 { $errors[] = 'collection address'; }
if (!preg_match('/^[0-9]{4}$/', $postcode))                  { $errors[] = 'postcode'; }
if (!preg_match('/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/', $date))    { $errors[] = 'collection date'; }

if ($errors) {
    trash_json_response(['error' => 'Please check your ' . implode(', ', $errors) . '.'], 422);
}

/* ---- Price it here. This figure is the only one that counts. ------------- */

$quote = trash_calculate_booking($booking, $cfg);

if ($quote['itemCount'] < 1) {
    trash_json_response(['error' => 'No items were selected.'], 422);
}

/* The browser's total is only ever a claim to compare against. */
$clientTotal   = isset($booking['clientTotal']) ? (float)$booking['clientTotal'] : null;
$totalsAgree   = $clientTotal !== null && abs($clientTotal - $quote['total']) < 0.005;

/* ---- Store it ------------------------------------------------------------ */

$reference = 'TR-' . date('ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

$record = [
    'reference'      => $reference,
    'receivedAt'     => date('c'),
    'status'         => $quote['manualReview'] ? 'awaiting_confirmation' : 'awaiting_payment',
    'postcode'       => $postcode,
    'date'           => $date,
    'items'          => $quote['lines'],
    'stairs'         => $quote['stairs']['applied'],
    'urgent'         => $quote['urgent']['applied'],
    'dismantling'    => $quote['dismantling'],
    'conditions'     => is_array($booking['conditions'] ?? null) ? $booking['conditions'] : [],
    'quote'          => $quote,
    'clientTotal'    => $clientTotal,
    'totalsAgree'    => $totalsAgree,
    'customer'       => [
        'name'         => $name,
        'mobile'       => $mobile,
        'email'        => $email,
        'address'      => $address,
        'instructions' => $clean($details['instructions'] ?? '', 1000),
        'notes'        => $clean($details['notes'] ?? '', 1000),
    ],
    'userAgent'      => $clean($_SERVER['HTTP_USER_AGENT'] ?? '', 300),
];

$dir = $cfg['bookingStorePath'];
if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
$written = @file_put_contents(
    rtrim($dir, '/') . '/' . $reference . '.json',
    json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
    LOCK_EX
);

if ($written === false) {
    error_log('trash: could not write booking ' . $reference . ' to ' . $dir);
    trash_json_response(['error' => 'We could not save your booking. Please try again.'], 500);
}

/* ---- Payment handoff (null until a provider is connected) ---------------- */

$paymentUrl = trash_create_payment($booking, $quote);

trash_json_response([
    'reference'           => $reference,
    'total'               => $quote['total'],
    'manualReview'        => $quote['manualReview'],
    'manualReviewReasons' => $quote['manualReviewReasons'],
    'paymentAllowed'      => $quote['paymentAllowed'],
    'paymentUrl'          => $paymentUrl,
    'quote'               => $quote,
]);
