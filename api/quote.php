<?php
/* ============================================================================
   POST /api/quote.php
   Re-prices a booking server-side. The browser may call this at any time; the
   answer here always wins over anything calculated in the page.
   ========================================================================== */

declare(strict_types=1);

require __DIR__ . '/pricing.php';
$cfg = require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    trash_json_response(['error' => 'POST required'], 405);
}

$booking = trash_read_json_body();
$quote   = trash_calculate_booking($booking, $cfg);

trash_json_response($quote);
