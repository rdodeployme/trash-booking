/* ============================================================================
   TRASH.COM.AU — PRICING ENGINE (single source of truth)
   ----------------------------------------------------------------------------
   Nothing else in the codebase may calculate a price. The interface renders
   what calculateBooking() returns; the server re-runs the same rules in
   api/quote.php before any payment is accepted.

   Rules:
     calloutFee   = stairs ? 199 : 99          (REPLACES, never adds)
     itemTotal    = sum(quantity x itemCharge) (no multi-item discount)
     urgentFee    = urgent ? 100 : 0
     dismantling  = 0 / 20 / 60 / manual review
     bookingTotal = calloutFee + itemTotal + urgentFee + dismantlingFee

   Manual review (payment disabled) is triggered by:
     - dismantling 6+ items
     - difficult access without stairs
     - unusually heavy items
     - a postcode outside the approved collection area
   ========================================================================== */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./config.js').TRASH_CONFIG);
  } else {
    root.TrashPricing = factory(root.TRASH_CONFIG);
  }
})(typeof self !== 'undefined' ? self : this, function (CONFIG) {

  /* Money is handled in whole cents internally so 0.1 + 0.2 never bites. */
  function toCents(dollars) { return Math.round(Number(dollars) * 100); }
  function toDollars(cents) { return cents / 100; }

  function formatMoney(dollars) {
    const n = Number(dollars) || 0;
    const whole = Math.round(n * 100) % 100 === 0;
    return '$' + n.toLocaleString('en-AU', {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function getDismantlingTier(tierId) {
    return CONFIG.dismantlingTiers.find(t => t.id === tierId) || CONFIG.dismantlingTiers[0];
  }

  function isPostcodeApproved(postcode) {
    return CONFIG.serviceArea.approvedPostcodes.indexOf(String(postcode || '').trim()) !== -1;
  }

  /**
   * The one function that prices a booking.
   *
   * @param {Object} booking
   * @param {Object} booking.items          { itemId: quantity }
   * @param {Boolean} booking.stairs
   * @param {Boolean} booking.urgent
   * @param {String}  booking.dismantling   tier id
   * @param {Object}  booking.conditions    { difficultAccess: bool, heavyItem: bool }
   * @param {String}  booking.postcode
   * @returns {Object} a fully itemised breakdown
   */
  function calculateBooking(booking) {
    booking = booking || {};
    const items       = booking.items || {};
    const stairs      = booking.stairs === true;
    const urgent      = booking.urgent === true;
    const conditions  = booking.conditions || {};
    const tier        = getDismantlingTier(booking.dismantling);

    /* --- Call-out: stairs REPLACES standard, it is never added on top ----- */
    const calloutCents = toCents(stairs ? CONFIG.fees.calloutStairs : CONFIG.fees.calloutStandard);
    const calloutLabel = stairs ? 'Stairs call-out fee' : 'Call-out fee';

    /* --- Items: full price for every unit, no discount ------------------- */
    const lines = [];
    let itemCents = 0;
    let itemCount = 0;

    CONFIG.categories.forEach(cat => {
      cat.items.forEach(item => {
        const qty = parseInt(items[item.id], 10) || 0;
        if (qty <= 0) return;
        const lineCents = toCents(item.charge) * qty;
        itemCents += lineCents;
        itemCount += qty;
        lines.push({
          itemId:     item.id,
          name:       item.name,
          icon:       item.icon,
          categoryId: cat.id,
          quantity:   qty,
          unitCharge: item.charge,
          lineTotal:  toDollars(lineCents)
        });
      });
    });

    /* --- Add-ons --------------------------------------------------------- */
    const urgentCents = urgent ? toCents(CONFIG.fees.urgent) : 0;
    const dismantlingCents = tier.manualReview ? 0 : toCents(tier.fee || 0);

    /* --- Manual review ---------------------------------------------------- */
    const reviewReasons = [];
    if (tier.manualReview) reviewReasons.push('Six or more items need dismantling');
    if (conditions.difficultAccess) reviewReasons.push('Difficult access without stairs');
    if (conditions.heavyItem) reviewReasons.push('An unusually heavy item is involved');
    if (booking.postcode && !isPostcodeApproved(booking.postcode)) {
      reviewReasons.push('Collection address is outside the standard collection area');
    }
    const manualReview = reviewReasons.length > 0;

    const totalCents = calloutCents + itemCents + urgentCents + dismantlingCents;

    return {
      callout: {
        label:  calloutLabel,
        amount: toDollars(calloutCents),
        stairs: stairs
      },
      lines: lines,
      itemCount: itemCount,
      itemTotal: toDollars(itemCents),
      urgent: {
        applied: urgent,
        label:   'Urgent collection',
        amount:  toDollars(urgentCents)
      },
      dismantling: {
        tierId:       tier.id,
        label:        tier.summaryLabel,
        amount:       toDollars(dismantlingCents),
        manualReview: tier.manualReview === true
      },
      total: toDollars(totalCents),
      /* When manual review is on, this figure is an estimate of the confirmed
         portion only — the interface must present it as "to be confirmed" and
         payment must stay disabled. */
      manualReview: manualReview,
      manualReviewReasons: reviewReasons,
      paymentAllowed: !manualReview && itemCount > 0
    };
  }

  return {
    calculateBooking: calculateBooking,
    formatMoney: formatMoney,
    getDismantlingTier: getDismantlingTier,
    isPostcodeApproved: isPostcodeApproved
  };
});
