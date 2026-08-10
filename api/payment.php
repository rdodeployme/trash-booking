<?php
/* ============================================================================
   PAYMENT INTEGRATION POINT
   ----------------------------------------------------------------------------
   No payment provider exists in this project yet. This is the ONE place to
   connect one. Nothing else in the codebase touches payment.

   Contract:
     trash_create_payment(array $booking, array $quote): ?string
       - returns a URL to send the customer to, or null if no provider is
         configured (the funnel then ends at "booking request received" and
         never claims money has been taken).

   Rules that must survive whatever provider is plugged in:
     1. Charge $quote['total'] — the figure this server calculated. Never a
        total that arrived from the browser.
     2. Never create a payment when $quote['paymentAllowed'] is false. That
        flag is how manual-review bookings are held back.
   ========================================================================== */

declare(strict_types=1);

function trash_create_payment(array $booking, array $quote): ?string {

    if (empty($quote['paymentAllowed'])) {
        return null;   // manual review — payment must stay disabled
    }

    // ------------------------------------------------------------------
    // ** REQUIRED BEFORE LAUNCH ** connect the real provider here, e.g.:
    //
    //   $amountInCents = (int) round($quote['total'] * 100);
    //   $session = StripeCheckoutSession::create([...]);
    //   return $session->url;
    //
    // Until then this returns null on purpose: the flow must not pretend a
    // payment happened.
    // ------------------------------------------------------------------

    return null;
}
