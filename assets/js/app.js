/* ============================================================================
   TRASH.COM.AU — BOOKING FUNNEL
   ----------------------------------------------------------------------------
   Postcode -> items -> access -> date -> details -> review -> confirmation.

   - Every price shown comes from TrashPricing.calculateBooking(). Nothing here
     does arithmetic on money.
   - State lives in localStorage, so a refresh never wipes an in-progress
     booking, and the browser Back button never loses selections.
   - Routing is real hash routing, so Back/Forward behave the way the phone's
     own back gesture expects.
   ========================================================================== */

(function () {
  'use strict';

  const C  = TRASH_CONFIG;
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  const money = TrashPricing.formatMoney;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ------------------------------------------------------------- state ---- */

  const EMPTY = {
    postcode: '',
    postcodeConfirmed: false,
    items: {},
    stairs: null,
    urgent: null,
    dismantling: null,
    conditions: { difficultAccess: false, heavyItem: false },
    date: '',
    details: { name: '', mobile: '', email: '', address: '', instructions: '', notes: '' },
    reference: '',
    photoCount: 0,
    photoUploadFailed: false
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(C.storage.key);
      if (!raw) return JSON.parse(JSON.stringify(EMPTY));
      const saved = JSON.parse(raw);
      const s = JSON.parse(JSON.stringify(EMPTY));
      Object.keys(EMPTY).forEach(k => {
        if (saved[k] === undefined || saved[k] === null) return;
        if (k === 'details' || k === 'conditions') Object.assign(s[k], saved[k]);
        else s[k] = saved[k];
      });
      // Drop any item id that no longer exists in the catalogue.
      Object.keys(s.items).forEach(id => { if (!C.itemsById[id]) delete s.items[id]; });
      return s;
    } catch (e) {
      return JSON.parse(JSON.stringify(EMPTY));
    }
  }

  function save() {
    try { localStorage.setItem(C.storage.key, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  /* ------------------------------------------------------------- photos --- */
  /* Optional attachments. Held under their own storage key so that a photo
     that will not fit can never take the booking down with it. */

  let photos = loadPhotos();      // [{ id, name, dataUrl }]
  let photosPersist = true;       // flips false if storage refuses them

  function loadPhotos() {
    try {
      const raw = localStorage.getItem(C.photos.storageKey);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.slice(0, C.photos.maxCount) : [];
    } catch (e) { return []; }
  }

  function savePhotos() {
    try {
      localStorage.setItem(C.photos.storageKey, JSON.stringify(photos));
      photosPersist = true;
    } catch (e) {
      // Out of quota. Keep them in memory for this visit rather than dropping
      // them, and stop pretending they will survive a refresh.
      try { localStorage.removeItem(C.photos.storageKey); } catch (e2) { /* ignore */ }
      photosPersist = false;
    }
  }

  function clearPhotos() {
    photos = [];
    try { localStorage.removeItem(C.photos.storageKey); } catch (e) { /* ignore */ }
  }

  /* Resize and re-encode in the browser. A 4 MB phone photo becomes ~100 KB,
     which is the difference between an upload that works on mobile data and
     one that times out. */
  function compressPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) {
        reject(new Error(file.name + ' is not an image.')); return;
      }
      if (file.size > C.photos.maxSourceBytes) {
        reject(new Error(file.name + ' is too large.')); return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = C.photos.maxDimension;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL('image/jpeg', C.photos.quality));
        } catch (e) { reject(new Error(file.name + ' could not be prepared.')); }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(file.name + " couldn't be read. Try a JPG or PNG."));
      };
      img.src = url;
    });
  }

  function quote() {
    return TrashPricing.calculateBooking({
      items: state.items,
      stairs: state.stairs === true,
      urgent: state.urgent === true,
      dismantling: state.dismantling || 'none',
      conditions: state.conditions,
      postcode: state.postcodeConfirmed ? state.postcode : ''
    });
  }

  const itemCount = () => Object.keys(state.items).reduce((n, id) => n + (state.items[id] || 0), 0);

  /* -------------------------------------------------------------- dates --- */

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function availableDates() {
    const a = C.availability;
    const lead = state.urgent === true ? a.urgentLeadTimeDays : a.leadTimeDays;
    const out = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = lead; i < lead + a.daysToOffer; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = iso(d);
      const closed = a.closedWeekdays.indexOf(d.getDay()) !== -1;
      const blocked = a.blockedDates.indexOf(key) !== -1;
      out.push({
        iso: key,
        dow: d.toLocaleDateString('en-AU', { weekday: 'short' }),
        dnum: d.getDate(),
        dmon: d.toLocaleDateString('en-AU', { month: 'short' }),
        month: d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
        disabled: closed || blocked
      });
    }
    return out;
  }

  /* Dates grouped into month blocks so a run that crosses a month reads clearly */
  function datesByMonth() {
    const groups = [];
    availableDates().forEach(d => {
      const last = groups[groups.length - 1];
      if (last && last.month === d.month) last.dates.push(d);
      else groups.push({ month: d.month, dates: [d] });
    });
    return groups;
  }

  function dateStillOffered(key) {
    return !!key && availableDates().some(d => d.iso === key && !d.disabled);
  }

  function prettyDate(key) {
    if (!key) return '';
    const p = key.split('-');
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /* Any stored date must still be on offer — urgent changes the lead time. */
  if (state.date && !dateStillOffered(state.date)) { state.date = ''; save(); }

  /* ------------------------------------------------------------ routing --- */

  const STEPS = ['postcode', 'items', 'access', 'date', 'details', 'review', 'done'];

  function parseRoute() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    return { name: parts[0] || 'postcode', param: parts[1] || '' };
  }

  function go(path, replace) {
    const target = '#/' + path.replace(/^\//, '');
    if (location.hash === target) { render(); return; }
    if (replace) location.replace(target); else location.hash = target;
  }

  /* A step is only reachable once the ones it depends on are answered. */
  function firstIncomplete() {
    if (!state.postcodeConfirmed) return 'postcode';
    if (itemCount() === 0) return 'items';
    if (state.stairs === null || state.urgent === null || state.dismantling === null) return 'access';
    if (!state.date) return 'date';
    if (!detailsValid()) return 'details';
    return 'review';
  }

  function guard(route) {
    if (route.name === 'done') {
      return state.reference ? route : { name: firstIncomplete(), param: '' };
    }
    const order = STEPS.indexOf(route.name) === -1 ? 0 : STEPS.indexOf(route.name);
    const allowed = STEPS.indexOf(firstIncomplete());
    if (order > allowed) return { name: STEPS[allowed], param: '' };
    return route;
  }

  /* ------------------------------------------------------------ renderer -- */

  const content = $('#step-content');

  function render() {
    let route = parseRoute();
    const safe = guard(route);
    if (safe.name !== route.name) { go(safe.name, true); return; }
    route = safe;

    const idx = Math.max(0, STEPS.indexOf(route.name));
    $('#progress-meta').textContent = 'Step ' + (idx + 1) + ' of ' + STEPS.length;
    $('#progress-steps').innerHTML = STEPS.map((_, i) =>
      `<span class="${i < idx ? 'is-done' : (i === idx ? 'is-current' : '')}"></span>`).join('');
    $('#back-btn').hidden = (route.name === 'postcode' || route.name === 'done');

    const view = VIEWS[route.name] || VIEWS.postcode;
    content.innerHTML = view(route.param);
    wire(route);
    renderSummaryColumn(route.name);
    renderCartBar(route.name, route.param);

    const h = $('h1, h2', content);
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------- the views --- */

  const VIEWS = {};

  /* 1 — Postcode -------------------------------------------------------- */
  VIEWS.postcode = function () {
    return `
      <div class="center">
        <p class="eyebrow">Step 1</p>
        <h1>Where are we collecting from?</h1>
        <p class="step-note">Enter the postcode of the collection address.</p>
      </div>

      <form id="postcode-form" novalidate>
        <div class="field postcode-field">
          <label class="visually-hidden" for="postcode">Collection postcode</label>
          <input class="postcode-input" id="postcode" name="postcode" type="text"
                 inputmode="numeric" autocomplete="postal-code" maxlength="4"
                 pattern="[0-9]{4}" value="${esc(state.postcode)}" placeholder="0000"
                 aria-describedby="postcode-error">
          <p class="error-text center" id="postcode-error" hidden></p>
        </div>
        <button type="submit" class="btn btn-primary btn-lg btn-block">Check My Postcode</button>
      </form>

      <div id="postcode-result"></div>

      <div class="note note-yellow">
        <h3>Have a mixed load or complete clean-out?</h3>
        <p style="margin-bottom:0">Bags and boxes, general rubbish, renovation or garden waste, or a full
        property clean-out — that job is better suited to JUNK.</p>
        <a class="btn junk-link" href="#" target="_blank" rel="noopener">${esc(C.junk.label)}</a>
      </div>

      ${C.serviceArea.note ? `<p class="flag">SETUP FLAG — ${esc(C.serviceArea.note)}</p>` : ''}
    `;
  };

  /* 2 — Items ----------------------------------------------------------- */
  VIEWS.items = function (catId) {
    const cat = C.categories.find(c => c.id === catId);
    return cat ? itemsView(cat) : categoriesView();
  };

  function categoriesView() {
    const total = itemCount();
    return `
      <div class="center">
        <p class="eyebrow">Step 2</p>
        <h1>${total ? 'Anything else?' : 'What needs collecting?'}</h1>
        <p class="step-note">${total
          ? `${total} item${total === 1 ? '' : 's'} in your booking. Add from any category — categories you've already used are marked.`
          : 'Pick a category. Your price updates as you add items.'}</p>
      </div>
      <div class="tiles">
        ${C.categories.map(cat => {
          const n = cat.items.reduce((t, i) => t + (state.items[i.id] || 0), 0);
          const from = Math.min.apply(null, cat.items.map(i => i.charge));
          return `<span class="tile-wrap">
            <button type="button" class="tile${n ? ' has-items' : ''}" data-goto="items/${cat.id}">
              <span class="tile-thumb">${TrashIcons.svg(cat.icon)}</span>
              <span class="tile-name">${esc(cat.name)}</span>
              <span class="tile-from">${n ? `${n} added` : `From ${money(from)}`}</span>
            </button>
            ${n ? `<span class="badge" aria-label="${n} selected">${n}</span>` : ''}
          </span>`;
        }).join('')}
      </div>
      ${total === 0 ? '' : `<div class="items-foot">
        <button type="button" class="btn btn-primary btn-lg btn-block" data-goto="access">Continue</button></div>`}
    `;
  }

  function itemsView(cat) {
    return `
      <button type="button" class="crumb" data-goto="items">
        <span aria-hidden="true">&larr;</span> All categories
      </button>
      <p class="eyebrow">Step 2 &middot; Items</p>
      <h1>${esc(cat.name)}</h1>
      <p class="step-note">Add what you need collected. The price beside each item is what it costs to have it taken.</p>
      ${cat.note ? `<p class="cat-note">${esc(cat.note)}</p>` : ''}

      <div class="items">
        ${cat.items.map(item => {
          const qty = state.items[item.id] || 0;
          return `<div class="item-card ${qty ? 'is-selected' : ''}" data-item="${item.id}">
            <span class="item-thumb">${TrashIcons.svg(item.icon)}</span>
            <div class="item-main">
              <div class="item-name" id="name-${item.id}">${esc(item.name)}</div>
              <div class="item-price">${money(item.charge)}</div>
              ${item.note ? `<div class="item-note">${esc(item.note)}</div>` : ''}
            </div>
            <div class="item-actions">${itemActions(item, qty)}</div>
          </div>`;
        }).join('')}
      </div>

      <div class="items-foot" id="items-actions">${itemsFooter()}</div>
    `;
  }

  /* The add/stepper control. One source of markup, used by the first render
     and by every in-place update. */
  function itemActions(item, qty) {
    if (qty === 0) {
      return `<button type="button" class="btn btn-primary add-btn" data-add="${item.id}">Add<span class="visually-hidden"> ${esc(item.name)}</span></button>`;
    }
    return `<div class="qty" role="group" aria-labelledby="name-${item.id}">
       <button type="button" data-dec="${item.id}" aria-label="Remove one ${esc(item.name)}">&minus;</button>
       <span class="qty-value" data-qty="${item.id}">${qty}</span>
       <button type="button" data-inc="${item.id}" aria-label="Add one ${esc(item.name)}" ${qty >= 20 ? 'disabled' : ''}>+</button>
     </div>`;
  }

  /* Once something is in the booking, the end of an item list is exactly where
     someone thinks "what else do I need gone?" — so answer it there, in the
     open, instead of leaving a quiet ghost button to be found. */
  function itemsFooter() {
    const n = itemCount();
    if (n === 0) {
      return `<button type="button" class="btn btn-ghost btn-block" data-goto="items">&larr; All categories</button>`;
    }
    return `<div class="add-more">
        <p class="add-more-line">${n} item${n === 1 ? '' : 's'} in your booking.
          Anything from another category?</p>
        <button type="button" class="btn btn-block" data-goto="items">Browse all categories</button>
      </div>
      <button type="button" class="btn btn-primary btn-lg btn-block" data-goto="access">Continue</button>`;
  }

  /* 3 — Access questions ------------------------------------------------ */
  VIEWS.access = function () {
    /* Prices are deliberately off this step — see ui.showFeesOnAccessStep.
       The running total and the review screen still show every charge. */
    const showFees = C.ui.showFeesOnAccessStep !== false;
    const noFees   = showFees ? '' : ' choices--no-fees';

    /* "Confirm with us" is a status, not a price, so it stays either way. */
    const dismantleCell = t => {
      if (t.manualReview) return '<span class="choice-fee is-tbc">Confirm with us</span>';
      if (!showFees) return '<span></span>';
      return `<span class="choice-fee${t.fee ? '' : ' is-zero'}">${t.fee ? '+' + money(t.fee) : 'No charge'}</span>`;
    };

    return `
      <p class="eyebrow">Step 3 &middot; Access</p>
      <h1>Three quick questions</h1>
      <p class="step-note">These affect your price, so we ask up front.</p>

      <div class="question">
        <h3 id="q-stairs">Are there any stairs involved?</h3>
        <div class="choices${noFees}" role="group" aria-labelledby="q-stairs">
          <label class="choice">
            <input type="radio" name="stairs" value="no" ${state.stairs === false ? 'checked' : ''}>
            <span class="mark"></span>
            <span>No stairs</span>
            ${showFees ? `<span class="choice-fee is-zero">No charge</span>` : ''}
          </label>
          <label class="choice">
            <input type="radio" name="stairs" value="yes" ${state.stairs === true ? 'checked' : ''}>
            <span class="mark"></span>
            <span>Yes, stairs are involved</span>
            ${showFees ? `<span class="choice-fee">+${money(C.fees.stairs)}</span>` : ''}
          </label>
        </div>
        <p class="question-foot">If there are stairs, one flat stairs charge applies to the whole
          booking — never per item.</p>
      </div>

      <div class="question">
        <h3 id="q-urgent">Do you need an urgent collection?</h3>
        <div class="choices${noFees}" role="group" aria-labelledby="q-urgent">
          <label class="choice">
            <input type="radio" name="urgent" value="no" ${state.urgent === false ? 'checked' : ''}>
            <span class="mark"></span>
            <span>Standard collection</span>
            ${showFees ? `<span class="choice-fee is-zero">No charge</span>` : ''}
          </label>
          <label class="choice">
            <input type="radio" name="urgent" value="yes" ${state.urgent === true ? 'checked' : ''}>
            <span class="mark"></span>
            <span>Urgent collection</span>
            ${showFees ? `<span class="choice-fee">+${money(C.fees.urgent)}</span>` : ''}
          </label>
        </div>
      </div>

      <div class="question">
        <h3 id="q-dis">How many items need dismantling?</h3>
        <div class="choices" role="group" aria-labelledby="q-dis">
          ${C.dismantlingTiers.map(t => `<label class="choice">
            <input type="radio" name="dismantling" value="${t.id}" ${state.dismantling === t.id ? 'checked' : ''}>
            <span class="mark"></span>
            <span>${esc(t.label)}</span>
            ${dismantleCell(t)}
          </label>`).join('')}
        </div>
      </div>

      <div class="question">
        <h3 id="q-cond">Anything else we should know?</h3>
        <p class="step-note">Only tick these if they apply. We'll confirm the price with you before you pay.</p>
        <div class="choices choices--no-fees" role="group" aria-labelledby="q-cond">
          ${C.manualReviewConditions.map(cond => `<label class="choice">
            <input type="checkbox" name="cond" value="${cond.id}" ${state.conditions[cond.id] ? 'checked' : ''}>
            <span class="mark"></span>
            <span>${esc(cond.label)}<span class="choice-hint">${esc(cond.hint)}</span></span>
          </label>`).join('')}
        </div>
      </div>

      <div id="access-review"></div>

      <div class="actions-row">
        <button type="button" class="btn btn-primary btn-lg" id="access-continue">Continue</button>
      </div>
    `;
  };

  /* 4 — Date ------------------------------------------------------------ */
  VIEWS.date = function () {
    return `
      <p class="eyebrow">Step 4 &middot; Date</p>
      <h1>Pick a collection date</h1>
      <p class="step-note">Choose the day that suits you. Greyed-out days aren't available.</p>

      ${datesByMonth().map(group => `
        <div class="date-group">
          <p class="eyebrow">${esc(group.month)}</p>
          <div class="date-grid" role="group" aria-label="Available dates in ${esc(group.month)}">
            ${group.dates.map(d => `<button type="button" class="date-card" data-date="${d.iso}"
                aria-pressed="${state.date === d.iso}" ${d.disabled ? 'disabled' : ''}>
              <span class="dow">${d.dow}</span>
              <span class="dnum">${d.dnum}</span>
              <span class="visually-hidden">${d.dmon}</span>
            </button>`).join('')}
          </div>
        </div>`).join('')}

      ${C.availability.isTestData ? `<p class="flag">SETUP FLAG — these dates come from a placeholder
        availability rule (first offered day is ${C.availability.leadTimeDays} days out, closed Sundays).
        Connect the real run-sheet availability before launch. No same-day or next-day promise is made.</p>` : ''}

      <div class="actions-row">
        <button type="button" class="btn btn-primary btn-lg" id="date-continue" ${state.date ? '' : 'disabled'}>Continue</button>
      </div>
    `;
  };

  /* 5 — Details --------------------------------------------------------- */
  VIEWS.details = function () {
    const d = state.details;
    const f = (id, label, type, extra, hint) => `
      <div class="field">
        <label for="${id}">${label}</label>
        ${hint ? `<p class="hint" id="${id}-hint">${hint}</p>` : ''}
        <input id="${id}" name="${id}" type="${type}" value="${esc(d[id])}" ${extra || ''}
               ${hint ? `aria-describedby="${id}-hint ${id}-error"` : `aria-describedby="${id}-error"`}>
        <p class="error-text" id="${id}-error" hidden></p>
      </div>`;

    return `
      <p class="eyebrow">Step 5 &middot; Details</p>
      <h1>Your details</h1>
      <p class="step-note">Only what we need to turn up and collect.</p>

      <form id="details-form" novalidate>
        ${f('name', 'Full name', 'text', 'autocomplete="name"')}
        ${f('mobile', 'Mobile number', 'tel', 'autocomplete="tel" inputmode="tel"')}
        ${f('email', 'Email address', 'email', 'autocomplete="email" inputmode="email"')}
        ${f('address', 'Collection address', 'text', 'autocomplete="street-address"',
             'Street address in postcode ' + esc(state.postcode))}

        <div class="field">
          <label for="instructions">Collection instructions <span class="muted" style="font-weight:600">(optional)</span></label>
          <p class="hint" id="instructions-hint">Where the items are, gate codes, parking, buzzer number.</p>
          <textarea id="instructions" name="instructions" aria-describedby="instructions-hint">${esc(d.instructions)}</textarea>
        </div>

        <div class="field">
          <label for="notes">Anything else <span class="muted" style="font-weight:600">(optional)</span></label>
          <textarea id="notes" name="notes">${esc(d.notes)}</textarea>
        </div>

        <div class="actions-row" style="margin-top:0">
          <button type="submit" class="btn btn-primary btn-lg">Continue</button>
        </div>
      </form>
    `;
  };

  /* 6 — Review ---------------------------------------------------------- */
  VIEWS.review = function () {
    const q = quote();
    const d = state.details;
    const row = (label, value) =>
      `<div class="rv-row"><dt>${label}</dt><dd>${value}</dd></div>`;
    /* Item rows read the other way round: the name is the wide column. */
    const itemRow = (name, qty, amt) =>
      `<div class="rv-row is-item"><dt class="visually-hidden">Item</dt>
        <dd>${name}</dd><dd class="rv-qty">&times; ${qty}</dd><dd class="rv-amt">${amt}</dd></div>`;

    return `
      <p class="eyebrow">Step 6 &middot; Review</p>
      <h1>Check your booking</h1>
      <p class="step-note">Everything below is what we'll turn up to. Change anything you need to.</p>

      <div class="review-block">
        <div class="rb-head"><h3>Items</h3>
          <button type="button" class="btn-edit" data-goto="items">Edit</button></div>
        <dl class="rv">${q.lines.map(l => itemRow(esc(l.name), l.quantity, money(l.lineTotal))).join('')}</dl>
      </div>

      <div class="review-block">
        <div class="rb-head"><h3>Access</h3>
          <button type="button" class="btn-edit" data-goto="access">Edit</button></div>
        <dl class="rv">
          ${row('Stairs', state.stairs ? 'Yes, stairs are involved' : 'No stairs')}
          ${row('Collection', state.urgent ? 'Urgent' : 'Standard')}
          ${row('Dismantling', esc(TrashPricing.getDismantlingTier(state.dismantling).label))}
          ${C.manualReviewConditions.filter(c => state.conditions[c.id]).map(c => row('Note', esc(c.label))).join('')}
        </dl>
      </div>

      <div class="review-block">
        <div class="rb-head"><h3>Collection date</h3>
          <button type="button" class="btn-edit" data-goto="date">Edit</button></div>
        <dl class="rv">${row('Preferred', esc(prettyDate(state.date)))}</dl>
      </div>

      <div class="review-block">
        <div class="rb-head"><h3>Your details</h3>
          <button type="button" class="btn-edit" data-goto="details">Edit</button></div>
        <dl class="rv">
          ${row('Name', esc(d.name))}
          ${row('Mobile', esc(d.mobile))}
          ${row('Email', esc(d.email))}
          ${row('Address', esc(d.address) + ', ' + esc(state.postcode))}
          ${d.instructions ? row('Instructions', esc(d.instructions)) : ''}
          ${d.notes ? row('Notes', esc(d.notes)) : ''}
        </dl>
      </div>

      ${C.photos.enabled ? photosBlock() : ''}

      <div style="margin-top:24px">${summaryCard(q, { title: 'Your price' })}</div>

      ${q.manualReview ? manualReviewNote(q) : ''}

      <div id="submit-error"></div>

      <div class="actions-row">
        <button type="button" class="btn btn-primary btn-lg" id="submit-btn">
          ${q.manualReview ? 'Send for confirmation'
            : (C.payment.provider ? 'Continue to payment' : 'Confirm booking request')}
        </button>
      </div>
      ${!q.manualReview && !C.payment.provider ? `<p class="flag">SETUP FLAG — no payment provider is
        connected yet, so this button submits the booking for the team to take payment.
        Connect a provider at <code>api/payment.php</code> to take payment online.</p>` : ''}
    `;
  };

  /* Optional photo attachments — an aid, never a requirement. */
  function photosBlock() {
    return `
      <div class="review-block" id="photos-block">
        <div class="rb-head">
          <h3>Photos <span class="opt-tag">Optional</span></h3>
          ${photos.length ? `<span class="photo-count">${photos.length} of ${C.photos.maxCount}</span>` : ''}
        </div>
        <p class="photo-note">You don't need to send any. A quick photo helps our crew turn up with the
          right truck and gear, and helps us confirm your price faster if anything about the pick-up
          is unusual.</p>

        ${photos.length ? `<div class="photo-grid">
          ${photos.map(p => `<div class="photo-thumb">
            <img src="${p.dataUrl}" alt="Photo: ${esc(p.name)}">
            <button type="button" class="photo-remove" data-remove-photo="${p.id}"
              aria-label="Remove photo ${esc(p.name)}"><span aria-hidden="true">&times;</span></button>
          </div>`).join('')}
        </div>` : ''}

        <input type="file" id="photo-input" accept="image/*" multiple style="display:none">
        <button type="button" class="btn btn-ghost btn-block" id="photo-add"
          ${photos.length >= C.photos.maxCount ? 'disabled' : ''}>
          ${photos.length ? 'Add more photos' : 'Add photos'}
        </button>
        <p class="photo-status" id="photo-status" role="status" aria-live="polite">${
          photos.length >= C.photos.maxCount
            ? `That's the maximum of ${C.photos.maxCount} photos.`
            : (photos.length && !photosPersist
                ? "Photos are held for this visit only — they'll clear if you refresh."
                : '')
        }</p>
      </div>`;
  }

  function manualReviewNote(q) {
    return `<div class="note note-yellow">
      <h3>We just need to confirm this collection before you pay.</h3>
      <p>${q.manualReviewReasons.map(esc).join('. ')}.</p>
      <p style="margin-bottom:0">Send your booking through and our team will confirm the price with you.
      Nothing is charged until you approve it.</p>
    </div>`;
  }

  /* 7 — Done ------------------------------------------------------------ */
  VIEWS.done = function () {
    const q = quote();
    return `
      <div class="center">
        <p class="eyebrow">All done</p>
        <h1>${q.manualReview ? 'Sent for confirmation' : 'Booking request received'}</h1>
        <p class="step-note">Reference <strong>${esc(state.reference)}</strong></p>
      </div>

      <div class="note note-solid">
        <h3>What happens next</h3>
        ${q.manualReview
          ? `<p class="muted" style="margin-bottom:0">Our team will confirm the price for this collection and come
             back to you. Nothing has been charged.</p>`
          : `<p class="muted" style="margin-bottom:0">We've got your booking request for
             <strong style="color:#fff">${esc(prettyDate(state.date))}</strong>. ${C.payment.provider
               ? 'Payment will be taken at the next step.'
               : 'No payment has been taken — our team will contact you to confirm and take payment.'}</p>`}
      </div>

      ${state.photoCount ? `<p class="photo-note center" style="margin-top:16px">
        ${state.photoCount} photo${state.photoCount === 1 ? '' : 's'} attached to your booking.</p>` : ''}
      ${state.photoUploadFailed ? `<div class="note">
        <h3>Your photos didn't attach</h3>
        <p style="margin-bottom:0">Your booking is confirmed either way — photos were only an extra.
        Our team will be in touch if they need to see anything.</p></div>` : ''}

      ${summaryCard(q, { title: 'Your booking' })}

      <div class="actions-row">
        <button type="button" class="btn btn-ghost" id="start-new">Start another booking</button>
      </div>
    `;
  };

  /* -------------------------------------------------------- price panels -- */

  /** The one price panel used by the review, the confirmation, the desktop
      rail and the mobile drawer. One layout, so the figures always match. */
  function summaryCard(q, opts) {
    opts = opts || {};
    let rows = '';

    q.lines.forEach(l => {
      rows += `<div class="sum-row"><span class="lbl">${esc(l.name)}${l.quantity > 1 ? ' &times; ' + l.quantity : ''}</span>
               <span class="amt">${money(l.lineTotal)}</span></div>`;
    });

    if (q.stairs.applied) {
      rows += `<div class="sum-row"><span class="lbl">${esc(q.stairs.label)}</span>
               <span class="amt">${money(q.stairs.amount)}</span></div>`;
    }
    if (q.urgent.applied) {
      rows += `<div class="sum-row"><span class="lbl">${esc(q.urgent.label)}</span>
               <span class="amt">${money(q.urgent.amount)}</span></div>`;
    }
    if (q.dismantling.label && !q.dismantling.manualReview) {
      rows += `<div class="sum-row"><span class="lbl">${esc(q.dismantling.label)}</span>
               <span class="amt">${money(q.dismantling.amount)}</span></div>`;
    }
    if (q.dismantling.manualReview) {
      rows += `<div class="sum-row"><span class="lbl">${esc(q.dismantling.label)}</span>
               <span class="amt is-tbc">To be confirmed</span></div>`;
    }

    return `<div class="summary">
      ${opts.title ? `<div class="summary-head">${esc(opts.title)}</div>` : ''}
      <div class="summary-rows">${rows}</div>
      <div class="sum-total">
        <span class="t-label">${q.manualReview ? 'Total so far' : 'Total'}</span>
        <span class="t-amt">${money(q.total)}</span>
      </div>
      ${q.manualReview ? `<div class="sum-note">This booking needs to be confirmed by our team before payment.</div>` : ''}
      ${opts.cta ? `<div class="summary-cta">
        <button type="button" class="btn btn-primary btn-block" data-goto="${opts.cta}">Continue</button>
        ${opts.showAddMore ? `<button type="button" class="btn btn-ghost btn-block"
          data-goto="items" style="margin-top:8px">Add more items</button>` : ''}</div>` : ''}
    </div>`;
  }

  function renderSummaryColumn(stepName) {
    const side = $('#side-summary');
    const show = ['items', 'access', 'date', 'details'].indexOf(stepName) !== -1 && itemCount() > 0;
    side.hidden = !show;
    if (!show) { side.innerHTML = ''; return; }
    side.innerHTML = summaryCard(quote(), {
      title: 'Your booking', cta: nextFrom(stepName),
      showAddMore: !(stepName === 'items' && !parseRoute().param)
    });
    $$('[data-goto]', side).forEach(el => el.addEventListener('click', () => go(el.dataset.goto)));
  }

  function nextFrom(stepName) {
    const i = STEPS.indexOf(stepName);
    return STEPS[Math.min(i + 1, STEPS.length - 1)];
  }

  let lastTotal = null;

  function renderCartBar(stepName, param) {
    const bar = $('#cart-bar');
    const show = ['items', 'access', 'date'].indexOf(stepName) !== -1 && itemCount() > 0;
    bar.hidden = !show;
    if (!show) { lastTotal = null; return; }

    const q = quote();
    const n = q.itemCount;
    $('#cart-count').textContent = n + (n === 1 ? ' item' : ' items');
    $('#cart-total').innerHTML = money(q.total) +
      (q.manualReview ? ' <span class="qual">so far</span>' : '');
    $('#cart-continue').dataset.goto = nextFrom(stepName);
    /* Pointless on the category grid — you're already there. */
    $('#cart-more').hidden = (stepName === 'items' && !param);

    /* Functional cue: the figure the customer is watching just changed. */
    if (lastTotal !== null && lastTotal !== q.total) {
      const el = $('#cart-total');
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
    }
    lastTotal = q.total;

    const drawer = $('#cart-drawer');
    if (!drawer.hidden) drawer.innerHTML = summaryCard(q, {});
  }

  function announcePrice() {
    const q = quote();
    const n = q.itemCount;
    $('#price-status').textContent =
      n + (n === 1 ? ' item' : ' items') + ' selected. Booking total ' + money(q.total) +
      (q.manualReview ? '. This booking needs confirmation by our team before payment.' : '.');
  }

  /* --------------------------------------------------------- validation --- */

  const VALID = {
    name:    v => v.trim().length >= 2 || 'Please enter your full name.',
    mobile:  v => (v.replace(/[^0-9]/g, '').length >= 8) || 'Please enter a valid mobile number.',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
    address: v => v.trim().length >= 6 || 'Please enter the collection address.'
  };

  function detailsValid() {
    return Object.keys(VALID).every(k => VALID[k](state.details[k] || '') === true);
  }

  /* -------------------------------------------------------------- wiring -- */

  function wire(route) {
    $$('[data-goto]', content).forEach(el => {
      el.addEventListener('click', () => go(el.dataset.goto));
    });
    $$('.junk-link', content).forEach(a => { a.href = C.junk.url; });

    if (route.name === 'postcode') wirePostcode();
    if (route.name === 'items')    wireItems();
    if (route.name === 'access')   wireAccess();
    if (route.name === 'date')     wireDate();
    if (route.name === 'details')  wireDetails();
    if (route.name === 'review')   wireReview();
    if (route.name === 'done')     wireDone();
  }

  function wirePostcode() {
    const form = $('#postcode-form');
    const input = $('#postcode');
    const err = $('#postcode-error');
    const result = $('#postcode-result');

    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const pc = input.value.trim();
      if (!/^[0-9]{4}$/.test(pc)) {
        err.textContent = 'Please enter a 4-digit Australian postcode.';
        err.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      err.hidden = true;
      input.removeAttribute('aria-invalid');

      state.postcode = pc;
      state.postcodeConfirmed = true;
      save();

      if (TrashPricing.isPostcodeApproved(pc)) {
        result.innerHTML = `<div class="note note-yellow" role="status">
          <h3>Good news — we collect from ${esc(pc)}.</h3>
          <p>Fixed pricing. No photos needed. No measuring.</p>
          <button type="button" class="btn btn-lg btn-block" data-goto="items">Choose your items</button>
        </div>`;
      } else {
        result.innerHTML = `<div class="note" role="status">
          <h3>${esc(pc)} is outside our standard collection area.</h3>
          <p>We can still look at it — we just need to confirm this collection before you pay.
             Choose your items and send the booking through, and our team will come back to you.</p>
          <button type="button" class="btn btn-lg btn-block" data-goto="items">Choose your items</button>
        </div>`;
      }
      $$('[data-goto]', result).forEach(el => el.addEventListener('click', () => go(el.dataset.goto)));
      const h = result.querySelector('h3');
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
      h.scrollIntoView({ block: 'nearest' });
    });
  }

  function wireItems() {
    $$('.item-card', content).forEach(wireItemCard);
  }

  /* Changing a quantity patches just that card. A full re-render would scroll
     the page back to the top and drop focus — which on a phone means every tap
     on the last item in a list throws you back to the heading. */
  function setQty(id, qty) {
    qty = Math.max(0, Math.min(20, qty));
    const was = state.items[id] || 0;
    if (qty === was) return;
    if (qty === 0) delete state.items[id]; else state.items[id] = qty;
    save();

    const card = $(`.item-card[data-item="${id}"]`, content);
    if (!card) { render(); return; }          // not on the items step — fall back

    card.classList.toggle('is-selected', qty > 0);
    card.querySelector('.item-actions').innerHTML = itemActions(C.itemsById[id], qty);
    wireItemCard(card);

    /* The footer carries the running item count, so it re-renders on every
       change, not only when the list crosses empty. */
    const footer = $('#items-actions', content);
    if (footer) {
      footer.innerHTML = itemsFooter();
      $$('[data-goto]', footer).forEach(el => el.addEventListener('click', () => go(el.dataset.goto)));
    }

    renderCartBar('items', parseRoute().param);
    renderSummaryColumn('items');
    announcePrice();

    /* Keep the thumb on the control it just used. */
    const focusOn = qty === 0 ? `[data-add="${id}"]`
                  : was === 0 ? `[data-inc="${id}"]`
                  : (qty > was ? `[data-inc="${id}"]` : `[data-dec="${id}"]`);
    const next = $(focusOn, card) || $(`[data-inc="${id}"]`, card);
    if (next && !next.disabled) next.focus({ preventScroll: true });
  }

  function wireItemCard(card) {
    $$('[data-add]', card).forEach(b => b.addEventListener('click', () => setQty(b.dataset.add, 1)));
    $$('[data-inc]', card).forEach(b => b.addEventListener('click', () =>
      setQty(b.dataset.inc, (state.items[b.dataset.inc] || 0) + 1)));
    $$('[data-dec]', card).forEach(b => b.addEventListener('click', () =>
      setQty(b.dataset.dec, (state.items[b.dataset.dec] || 0) - 1)));
  }

  function wireAccess() {
    const refresh = () => {
      save();
      renderSummaryColumn('access');
      renderCartBar('access');
      announcePrice();
      const q = quote();
      $('#access-review').innerHTML = q.manualReview ? manualReviewNote(q) : '';
      // Urgent changes the earliest date we can offer, so a stale choice must go.
      if (state.date && !dateStillOffered(state.date)) { state.date = ''; save(); }
    };

    $$('input[name="stairs"]', content).forEach(r => r.addEventListener('change', () => {
      state.stairs = r.value === 'yes'; refresh();
    }));
    $$('input[name="urgent"]', content).forEach(r => r.addEventListener('change', () => {
      state.urgent = r.value === 'yes'; refresh();
    }));
    $$('input[name="dismantling"]', content).forEach(r => r.addEventListener('change', () => {
      state.dismantling = r.value; refresh();
    }));
    $$('input[name="cond"]', content).forEach(cb => cb.addEventListener('change', () => {
      state.conditions[cb.value] = cb.checked; refresh();
    }));

    $('#access-continue').addEventListener('click', () => {
      const missing = [];
      if (state.stairs === null) missing.push('stairs');
      if (state.urgent === null) missing.push('urgent');
      if (state.dismantling === null) missing.push('dismantling');
      if (missing.length) {
        const first = $(`input[name="${missing[0]}"]`, content);
        $('#price-status').textContent = 'Please answer all three questions before continuing.';
        first.closest('.question').scrollIntoView({ block: 'center' });
        first.focus();
        return;
      }
      go('date');
    });
  }

  function wireDate() {
    $$('[data-date]', content).forEach(b => b.addEventListener('click', () => {
      state.date = b.dataset.date;
      save();
      $$('[data-date]', content).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('#date-continue').disabled = false;
      $('#price-status').textContent = 'Collection date ' + prettyDate(state.date) + ' selected.';
    }));
    $('#date-continue').addEventListener('click', () => { if (state.date) go('details'); });
  }

  function wireDetails() {
    const form = $('#details-form');

    const showError = (id, msg) => {
      const input = $('#' + id, form);
      const err = $('#' + id + '-error', form);
      if (msg === true) { err.hidden = true; input.removeAttribute('aria-invalid'); return true; }
      err.textContent = msg; err.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      return false;
    };

    ['name', 'mobile', 'email', 'address', 'instructions', 'notes'].forEach(id => {
      const input = $('#' + id, form);
      input.addEventListener('input', () => {
        state.details[id] = input.value;
        save();
        if (VALID[id] && input.getAttribute('aria-invalid')) showError(id, VALID[id](input.value));
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let firstBad = null;
      Object.keys(VALID).forEach(id => {
        const ok = showError(id, VALID[id]($('#' + id, form).value));
        if (!ok && !firstBad) firstBad = id;
      });
      if (firstBad) { $('#' + firstBad, form).focus(); return; }
      save();
      go('review');
    });
  }

  function wireReview() {
    const btn = $('#submit-btn');
    btn.addEventListener('click', () => submitBooking(btn));
    if (C.photos.enabled) wirePhotos();
  }

  function wirePhotos() {
    const input  = $('#photo-input');
    const addBtn = $('#photo-add');
    const status = $('#photo-status');

    /* Re-render just this block so adding a photo doesn't rebuild the page
       and throw away the customer's scroll position on a long review screen. */
    const refresh = msg => {
      const block = $('#photos-block');
      block.outerHTML = photosBlock();
      wirePhotos();
      if (msg) $('#photo-status').textContent = msg;
    };

    addBtn.addEventListener('click', () => input.click());

    $$('[data-remove-photo]', content).forEach(b => b.addEventListener('click', () => {
      const gone = photos.find(p => p.id === b.dataset.removePhoto);
      photos = photos.filter(p => p.id !== b.dataset.removePhoto);
      savePhotos();
      refresh(gone ? 'Photo removed.' : '');
      $('#photo-add').focus();
    }));

    input.addEventListener('change', () => {
      const files = Array.prototype.slice.call(input.files || []);
      input.value = '';                       // so the same file can be re-picked
      if (!files.length) return;

      const room = C.photos.maxCount - photos.length;
      const taking = files.slice(0, Math.max(0, room));
      const skipped = files.length - taking.length;

      status.textContent = 'Preparing ' + taking.length + (taking.length === 1 ? ' photo…' : ' photos…');
      addBtn.disabled = true;

      Promise.all(taking.map(f =>
        compressPhoto(f)
          .then(dataUrl => ({ ok: true, photo: {
            id: 'p' + Date.now() + Math.random().toString(36).slice(2, 7),
            name: f.name || 'photo.jpg',
            dataUrl: dataUrl
          }}))
          .catch(err => ({ ok: false, message: err.message }))
      )).then(results => {
        const added = results.filter(r => r.ok).map(r => r.photo);
        const failed = results.filter(r => !r.ok);
        photos = photos.concat(added);
        savePhotos();

        let msg = added.length
          ? added.length + (added.length === 1 ? ' photo added.' : ' photos added.')
          : '';
        if (skipped) msg += ` ${skipped} not added — maximum is ${C.photos.maxCount}.`;
        if (failed.length) msg += ' ' + failed.map(f => f.message).join(' ');
        if (added.length && !photosPersist) {
          msg += " They're held for this visit only — they'll clear if you refresh.";
        }
        refresh(msg.trim());
      });
    });
  }

  function wireDone() {
    $('#start-new').addEventListener('click', () => {
      state = JSON.parse(JSON.stringify(EMPTY));
      clearPhotos();
      save();
      go('postcode');
    });
  }

  /* ---------------------------------------------------------- submission -- */

  function payload() {
    return {
      postcode: state.postcode,
      items: state.items,
      stairs: state.stairs === true,
      urgent: state.urgent === true,
      dismantling: state.dismantling || 'none',
      conditions: state.conditions,
      date: state.date,
      details: state.details,
      /* Sent for comparison only. The server recalculates and rejects a
         mismatch — the browser total is never trusted. */
      clientTotal: quote().total
    };
  }

  /** Never rejects. The booking is already made by this point. */
  function uploadPhotos(reference, btn) {
    state.photoCount = 0;
    state.photoUploadFailed = false;
    if (!C.photos.enabled || !photos.length || !reference) { save(); return Promise.resolve(); }

    if (btn) btn.textContent = 'Sending photos…';

    return fetch(C.photos.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: reference,
        photos: photos.map(p => ({ name: p.name, dataUrl: p.dataUrl }))
      })
    })
      .then(r => r.json().then(body => ({ ok: r.ok, body })))
      .then(res => {
        if (!res.ok || !res.body || res.body.error) throw new Error('upload failed');
        state.photoCount = res.body.saved || photos.length;
        clearPhotos();
      })
      .catch(() => { state.photoUploadFailed = true; })
      .then(() => { save(); });
  }

  function submitBooking(btn) {
    const errBox = $('#submit-error');
    errBox.innerHTML = '';
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = 'Sending…';

    fetch(C.payment.bookingEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload())
    })
      .then(r => r.json().then(body => ({ ok: r.ok, body })))
      .then(res => {
        if (!res.ok || !res.body || res.body.error) {
          throw new Error((res.body && res.body.error) || 'Booking could not be saved.');
        }
        /* The server is the authority on price. If it disagrees, show its
           figure rather than quietly carrying on with the browser's. */
        if (res.body.total != null && res.body.total !== quote().total) {
          errBox.innerHTML = `<div class="note"><h3>Price updated</h3>
            <p style="margin-bottom:0">Our system priced this booking at
            <strong>${money(res.body.total)}</strong>. Please review before continuing.</p></div>`;
          btn.disabled = false; btn.textContent = original;
          return;
        }
        state.reference = res.body.reference || '';
        save();

        /* Photos go up separately, after the booking exists. They are optional,
           so a failure here must never cost the customer their booking. */
        return uploadPhotos(state.reference, btn).then(() => {
          if (res.body.paymentAllowed && C.payment.provider && res.body.paymentUrl) {
            window.location.href = res.body.paymentUrl;   // real provider handoff
            return;
          }
          go('done');
        });
      })
      .catch(err => {
        btn.disabled = false;
        btn.textContent = original;
        errBox.innerHTML = `<div class="note" role="alert">
          <h3>We couldn't send your booking</h3>
          <p>${esc(err.message)}</p>
          <p style="margin-bottom:0">Nothing has been charged and your booking details are saved on this
          device. Please try again${C.contact.phone ? ', or call us on ' + esc(C.contact.phone) : ''}.</p>
        </div>`;
        const h = errBox.querySelector('h3');
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      });
  }

  /* --------------------------------------------------------------- boot --- */

  $('#back-btn').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else go(STEPS[Math.max(0, STEPS.indexOf(parseRoute().name) - 1)]);
  });

  $('#cart-toggle').addEventListener('click', () => {
    const drawer = $('#cart-drawer');
    const open = drawer.hidden;
    drawer.hidden = !open;
    drawer.innerHTML = open ? summaryCard(quote(), {}) : '';
    $('#cart-toggle').setAttribute('aria-expanded', String(open));
  });

  $('#cart-continue').addEventListener('click', function () { go(this.dataset.goto || 'access'); });
  $('#cart-more').addEventListener('click', () => go('items'));

  window.addEventListener('hashchange', render);

  if (!location.hash) go('postcode', true);
  render();
})();
