<?php
/* ============================================================================
   TRASH.COM.AU — SERVER PRICING ENGINE
   ----------------------------------------------------------------------------
   The authoritative version of the rules in assets/js/pricing.js.
   Any total the browser sends is treated as a claim to be checked, never used.
   ========================================================================== */

/**
 * @param array $booking  items[], stairs, urgent, dismantling, conditions[], postcode
 * @return array          the same shape the browser engine returns
 */
function trash_calculate_booking(array $booking, array $cfg): array {

    $items       = is_array($booking['items'] ?? null) ? $booking['items'] : [];
    $stairs      = !empty($booking['stairs']);
    $urgent      = !empty($booking['urgent']);
    $conditions  = is_array($booking['conditions'] ?? null) ? $booking['conditions'] : [];
    $tierId      = (string)($booking['dismantling'] ?? 'none');
    $postcode    = trim((string)($booking['postcode'] ?? ''));

    $tiers = $cfg['dismantlingTiers'];
    if (!isset($tiers[$tierId])) { $tierId = 'none'; }
    $tier = $tiers[$tierId];

    /* Items: full charge per unit, no multi-item discount. Prices are ALL-IN —
       there is no call-out fee. */
    $lines     = [];
    $itemCents = 0;
    $itemCount = 0;
    foreach ($cfg['items'] as $itemId => $meta) {
        $qty = isset($items[$itemId]) ? (int)$items[$itemId] : 0;
        if ($qty <= 0) { continue; }
        if ($qty > $cfg['maxQuantityPerItem']) { $qty = $cfg['maxQuantityPerItem']; }
        $lineCents  = (int)round($meta[1] * 100) * $qty;
        $itemCents += $lineCents;
        $itemCount += $qty;
        $lines[] = [
            'itemId'     => $itemId,
            'name'       => $meta[0],
            'quantity'   => $qty,
            'unitCharge' => $meta[1],
            'lineTotal'  => $lineCents / 100,
        ];
    }

    /* Flat add-ons, each charged ONCE per booking, never per item. */
    $stairsCents      = $stairs ? (int)round($cfg['fees']['stairs'] * 100) : 0;
    $urgentCents      = $urgent ? (int)round($cfg['fees']['urgent'] * 100) : 0;
    $dismantlingCents = $tier['manualReview'] ? 0 : (int)round(((float)$tier['fee']) * 100);

    /* Manual review — no invented prices for anything unapproved. */
    $reasons = [];
    if ($tier['manualReview']) {
        $reasons[] = 'Six or more items need dismantling';
    }
    if (!empty($conditions['difficultAccess'])) {
        $reasons[] = 'Difficult access without stairs';
    }
    if (!empty($conditions['heavyItem'])) {
        $reasons[] = 'An unusually heavy item is involved';
    }
    if ($postcode !== '' && !in_array($postcode, $cfg['approvedPostcodes'], true)) {
        $reasons[] = 'Collection address is outside the standard collection area';
    }
    $manualReview = count($reasons) > 0;

    $totalCents = $itemCents + $stairsCents + $urgentCents + $dismantlingCents;

    return [
        'stairs' => [
            'applied' => $stairs,
            'label'   => 'Stairs',
            'amount'  => $stairsCents / 100,
        ],
        'lines'     => $lines,
        'itemCount' => $itemCount,
        'itemTotal' => $itemCents / 100,
        'urgent'    => [
            'applied' => $urgent,
            'label'   => 'Urgent collection',
            'amount'  => $urgentCents / 100,
        ],
        'dismantling' => [
            'tierId'       => $tierId,
            'label'        => $tier['label'],
            'amount'       => $dismantlingCents / 100,
            'manualReview' => (bool)$tier['manualReview'],
        ],
        'total'               => $totalCents / 100,
        'manualReview'        => $manualReview,
        'manualReviewReasons' => $reasons,
        'paymentAllowed'      => !$manualReview && $itemCount > 0,
    ];
}

/** Shared JSON request reader. */
function trash_read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') { return []; }
    if (strlen($raw) > 64 * 1024) { return []; }   // nothing legitimate is this big
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function trash_json_response(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload);
    exit;
}
