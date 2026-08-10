/* Pricing tests — run with:  node tests/pricing.test.js

   ALL-IN PRICING (from the 2026-08-10 price list). There is no call-out fee:
   the price beside an item is what that item costs to have collected. Stairs
   and urgent are flat surcharges, charged once per booking. */

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

console.log('\nCORE SCENARIOS');
check('1  one double/queen/king mattress = $139',
  q({ items: { 'mat-dqk': 1 } }).total, 139);

check('2  two of them = $278 (no multi-item discount)',
  q({ items: { 'mat-dqk': 2 } }).total, 278);

check('3  one mattress + stairs = $239',
  q({ items: { 'mat-dqk': 1 }, stairs: true }).total, 239);

check('4  3-seater couch + urgent + dismantle 1-2 = $289',
  q({ items: { 'sofa-3': 1 }, urgent: true, dismantling: '1-2' }).total, 289);

check('5  3-seater couch + stairs + urgent + dismantle 3-5 = $429',
  q({ items: { 'sofa-3': 1 }, stairs: true, urgent: true, dismantling: '3-5' }).total, 429);

const t6 = q({ items: { 'sofa-3': 1 }, dismantling: '6plus' });
check('6  dismantle 6+ disables payment', t6.paymentAllowed, false);
check('6  dismantle 6+ flags manual review', t6.manualReview, true);
check('6  dismantle 6+ invents no dismantling price', t6.dismantling.amount, 0);

console.log('\nRULES THAT MUST NEVER BREAK');
check('No call-out is added to a single item',
  q({ items: { 'mat-dqk': 1 } }).total, TRASH_CONFIG.itemsById['mat-dqk'].charge);

check('No per-booking fee appears on a multi-item booking either',
  q({ items: { 'mat-dqk': 1, 'sofa-3': 1 } }).total, 139 + 169);

check('Stairs adds exactly $100',
  q({ items: { 'sofa-3': 1 }, stairs: true }).total - q({ items: { 'sofa-3': 1 } }).total, 100);

check('Stairs is charged ONCE, not per item',
  q({ items: { 'mat-dqk': 3, 'sofa-3': 2 }, stairs: true }).total,
  (139 * 3) + (169 * 2) + 100);

check('Urgent adds exactly $100',
  q({ items: { 'mat-dqk': 1 }, urgent: true }).total - 139, 100);

check('Stairs and urgent stack to exactly $200, never more',
  q({ items: { 'mat-dqk': 1 }, stairs: true, urgent: true }).total - 139, 200);

check('Dismantling 1-2 adds exactly $20',
  q({ items: { 'mat-dqk': 1 }, dismantling: '1-2' }).total - 139, 20);

check('Dismantling 3-5 adds exactly $60',
  q({ items: { 'mat-dqk': 1 }, dismantling: '3-5' }).total - 139, 60);

check('Empty booking is $0 and cannot be paid for',
  [q({}).total, q({}).paymentAllowed], [0, false]);

check('Difficult access routes to manual review',
  q({ items: { 'mat-dqk': 1 }, conditions: { difficultAccess: true } }).paymentAllowed, false);

check('Heavy item routes to manual review',
  q({ items: { 'mat-dqk': 1 }, conditions: { heavyItem: true } }).paymentAllowed, false);

console.log('\nSERVICE AREA — 150km straight line from Geelong');
/* Real postcodes on both sides of the boundary. A made-up postcode is a weak
   test: the source dataset contains a "9999 NORTH POLE" placeholder geocoded
   to Melbourne CBD, which silently entered the approved list until this
   assertion caught it. */
[['3220', 'Geelong', true],
 ['3218', 'Geelong West', true],
 ['3000', 'Melbourne CBD', true],
 ['3350', 'Ballarat', true],
 ['3280', 'Warrnambool', false],
 ['3550', 'Bendigo', false],
 ['3825', 'Moe', false],
 ['2000', 'Sydney', false],
 ['9999', 'NORTH POLE placeholder', false]].forEach(([pc, label, expected]) => {
  check(`${pc} ${label} ${expected ? 'is in area' : 'is out of area'}`,
    P.isPostcodeApproved(pc), expected);
});

check('An out-of-area postcode still books, but routes to manual review',
  q({ items: { 'mat-dqk': 1 }, postcode: '3280' }).paymentAllowed, false);

check('An in-area postcode gets an instant price',
  q({ items: { 'mat-dqk': 1 }, postcode: '3220' }).paymentAllowed, true);

check('Every approved postcode is a plausible 4-digit Victorian one',
  TRASH_CONFIG.serviceArea.approvedPostcodes.filter(p => !/^3[0-9]{3}$/.test(p)), []);

check('No duplicate postcodes',
  TRASH_CONFIG.serviceArea.approvedPostcodes.length,
  new Set(TRASH_CONFIG.serviceArea.approvedPostcodes).size);

console.log('\nEVERY ITEM PRICES AT EXACTLY ITS OWN CHARGE');
let checked = 0, bad = 0;
TRASH_CONFIG.categories.forEach(cat => cat.items.forEach(item => {
  checked++;
  const one = q({ items: { [item.id]: 1 } });
  if (one.total !== item.charge) {
    bad++; console.log(`  FAIL  ${item.name}: qty 1 gave ${one.total}, charge is ${item.charge}`);
  }
  const three = q({ items: { [item.id]: 3 } });
  const expected3 = Math.round(item.charge * 3 * 100) / 100;
  if (three.total !== expected3) {
    bad++; console.log(`  FAIL  ${item.name}: qty 3 gave ${three.total}, expected ${expected3}`);
  }
}));
check(`All ${checked} items price correctly at qty 1 and qty 3`, bad, 0);

console.log('\nCATALOGUE SHAPE');
check('11 categories', TRASH_CONFIG.categories.length, 11);
check('61 items', checked, 61);

const iconNames = new Set(require('../assets/js/icons.js').names);
const missingIcons = [];
TRASH_CONFIG.categories.forEach(cat => {
  if (!iconNames.has(cat.icon)) missingIcons.push(`category ${cat.id} -> ${cat.icon}`);
  cat.items.forEach(i => { if (!iconNames.has(i.icon)) missingIcons.push(`item ${i.id} -> ${i.icon}`); });
});
check('Every category and item has a real icon (no silent fallbacks)', missingIcons, []);

const dupIds = [];
const seen = new Set();
TRASH_CONFIG.categories.forEach(c => c.items.forEach(i => {
  if (seen.has(i.id)) dupIds.push(i.id); else seen.add(i.id);
}));
check('No duplicate item ids', dupIds, []);

/* The legacy items are still on the old volume-based pricing and are the one
   thing in the catalogue that is knowingly not repriced. Pin the count so
   nobody loses track of how many are outstanding. */
const legacy = [];
TRASH_CONFIG.categories.forEach(c => c.items.forEach(i => { if (i.legacy) legacy.push(i.id); }));
check('16 items still flagged as needing repricing', legacy.length, 16);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
