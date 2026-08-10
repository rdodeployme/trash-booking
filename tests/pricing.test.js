/* Pricing tests — run with:  node tests/pricing.test.js
   Covers every scenario in the build brief plus the rules that must never break. */

const P = require('../assets/js/pricing.js');
const { TRASH_CONFIG } = require('../assets/js/config.js');

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name +
    (ok ? '' : `\n          expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`));
  ok ? pass++ : fail++;
}

const base = { items: {}, stairs: false, urgent: false, dismantling: 'none', conditions: {}, postcode: '3011' };
const q = o => P.calculateBooking(Object.assign({}, base, o));

console.log('\nBRIEF SCENARIOS');
check('Test 1  1x queen mattress, nothing else = $164',
  q({ items: { 'mat-queen': 1 } }).total, 164);

check('Test 2  2x queen mattress, no stairs = $229',
  q({ items: { 'mat-queen': 2 } }).total, 229);

check('Test 3  1x queen mattress + stairs = $264',
  q({ items: { 'mat-queen': 1 }, stairs: true }).total, 264);

check('Test 4  3-seater + urgent + dismantle 1-2 = $414',
  q({ items: { 'sofa-3': 1 }, urgent: true, dismantling: '1-2' }).total, 414);

check('Test 5  3-seater + stairs + urgent + dismantle 3-5 = $554',
  q({ items: { 'sofa-3': 1 }, stairs: true, urgent: true, dismantling: '3-5' }).total, 554);

const t6 = q({ items: { 'sofa-3': 1 }, dismantling: '6plus' });
check('Test 6  dismantle 6+ disables payment', t6.paymentAllowed, false);
check('Test 6  dismantle 6+ flags manual review', t6.manualReview, true);
check('Test 6  dismantle 6+ invents no dismantling price', t6.dismantling.amount, 0);

console.log('\nRULES THAT MUST NEVER BREAK');
check('Call-out charged once, not per item',
  q({ items: { 'mat-queen': 3, 'sofa-2': 2 } }).callout.amount, 99);

check('Stairs REPLACES the call-out (never $298)',
  q({ items: { 'mat-queen': 1 }, stairs: true }).callout.amount, 199);

check('Stairs call-out + items only = 199 + 195',
  q({ items: { 'sofa-3': 1 }, stairs: true }).total, 394);

check('Urgent adds exactly $100',
  q({ items: { 'mat-queen': 1 }, urgent: true }).total - q({ items: { 'mat-queen': 1 } }).total, 100);

check('Dismantling 1-2 adds exactly $20',
  q({ items: { 'mat-queen': 1 }, dismantling: '1-2' }).total - 164, 20);

check('Dismantling 3-5 adds exactly $60',
  q({ items: { 'mat-queen': 1 }, dismantling: '3-5' }).total - 164, 60);

check('No multi-item discount: 2 queens cost exactly 2 x $65',
  q({ items: { 'mat-queen': 2 } }).itemTotal, 130);

check('Empty booking cannot be paid for',
  q({}).paymentAllowed, false);

check('Difficult access routes to manual review',
  q({ items: { 'mat-queen': 1 }, conditions: { difficultAccess: true } }).paymentAllowed, false);

check('Heavy item routes to manual review',
  q({ items: { 'mat-queen': 1 }, conditions: { heavyItem: true } }).paymentAllowed, false);

check('Out-of-area postcode routes to manual review',
  q({ items: { 'mat-queen': 1 }, postcode: '9999' }).paymentAllowed, false);

console.log('\nEVERY ITEM PRICES CORRECTLY (callout + charge)');
let itemsChecked = 0, itemsBad = 0;
TRASH_CONFIG.categories.forEach(cat => cat.items.forEach(item => {
  itemsChecked++;
  const r = q({ items: { [item.id]: 1 } });
  const expected = Math.round((99 + item.charge) * 100) / 100;
  if (r.total !== expected) {
    itemsBad++;
    console.log(`  FAIL  ${item.name}: expected ${expected}, got ${r.total}`);
  }
  // quantity of 3 must be exactly 3x the charge, no rounding drift
  const r3 = q({ items: { [item.id]: 3 } });
  const expected3 = Math.round((99 + item.charge * 3) * 100) / 100;
  if (r3.total !== expected3) {
    itemsBad++;
    console.log(`  FAIL  ${item.name} x3: expected ${expected3}, got ${r3.total}`);
  }
}));
check(`All ${itemsChecked} items across ${TRASH_CONFIG.categories.length} categories price correctly at qty 1 and 3`,
  itemsBad, 0);

console.log('\nCATALOGUE SHAPE');
check('Exactly 8 categories', TRASH_CONFIG.categories.length, 8);
// 5 mattresses + 5 bases + 5 sofas + 3 sofa beds + 3 recliners
// + 3 tables + 3 chair lines + 6 fridges/freezers
check('Exactly 33 items', itemsChecked, 33);

const iconNames = new Set(require('../assets/js/icons.js').names);
const missingIcons = [];
TRASH_CONFIG.categories.forEach(cat => {
  if (!iconNames.has(cat.icon)) missingIcons.push(`category ${cat.id} -> ${cat.icon}`);
  cat.items.forEach(i => { if (!iconNames.has(i.icon)) missingIcons.push(`item ${i.id} -> ${i.icon}`); });
});
check('Every category and item has a real icon (no silent fallbacks)', missingIcons, []);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
