/* ============================================================================
   LOCAL DEV SERVER — verification only, not for deployment.
   ----------------------------------------------------------------------------
   Production runs on PHP (api/*.php) like the rest of the estate. There is no
   PHP runtime on this machine, so this Node server stands in for it during
   local testing: it serves the static site and implements the same two
   endpoints using the same pricing engine the browser uses.

     node tests/dev-server.js [port]
   ========================================================================== */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 8795;

const P = require('../assets/js/pricing.js');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.json': 'application/json'
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > (limit || 65536)) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve(null); } });
  });
}

const STORE  = path.join(ROOT, '..', 'trash-bookings');
const PHOTOS = path.join(ROOT, '..', 'trash-photos');

function priceIt(b) {
  return P.calculateBooking({
    items: b.items, stairs: b.stairs, urgent: b.urgent,
    dismantling: b.dismantling, conditions: b.conditions, postcode: b.postcode
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const route = url.pathname;

  /* ---- Photos (mirrors api/photos.php) --------------------------------- */
  if (route === '/api/photos.php') {
    if (req.method !== 'POST') return send(res, 405, JSON.stringify({ error: 'POST required' }));
    const b = await readBody(req, 24 * 1024 * 1024);
    if (!b) return send(res, 400, JSON.stringify({ error: 'Photos could not be read.' }));

    const ref = String(b.reference || '');
    if (!/^TR-\d{6}-[A-Z0-9]{5}$/.test(ref)) {
      return send(res, 422, JSON.stringify({ error: 'Unknown booking reference.' }));
    }
    const bookingFile = path.join(STORE, ref + '.json');
    if (!fs.existsSync(bookingFile)) {
      return send(res, 404, JSON.stringify({ error: 'Unknown booking reference.' }));
    }

    const list = Array.isArray(b.photos) ? b.photos.slice(0, 6) : [];
    fs.mkdirSync(PHOTOS, { recursive: true });
    const saved = [];
    list.forEach((p, i) => {
      const m = /^data:image\/(jpeg|png|webp);base64,/.exec(String(p.dataUrl || ''));
      if (!m) return;
      const bin = Buffer.from(String(p.dataUrl).slice(m[0].length), 'base64');
      if (!bin.length || bin.length > 3 * 1024 * 1024) return;
      const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      const file = `${ref}-${i + 1}.${ext}`;
      fs.writeFileSync(path.join(PHOTOS, file), bin);
      saved.push({ file, bytes: bin.length });
    });
    if (!saved.length) {
      return send(res, 422, JSON.stringify({ error: 'None of those photos could be saved.' }));
    }

    const rec = JSON.parse(fs.readFileSync(bookingFile, 'utf8'));
    rec.photos = (rec.photos || []).concat(saved);
    rec.photoCount = rec.photos.length;
    fs.writeFileSync(bookingFile, JSON.stringify(rec, null, 2));

    console.log(`  photos  ${ref}  saved ${saved.length}  ` +
      `(${saved.map(s => Math.round(s.bytes / 1024) + 'KB').join(', ')})`);
    return send(res, 200, JSON.stringify({ reference: ref, saved: saved.length }));
  }

  /* ---- API (mirrors api/quote.php and api/booking.php) ------------------ */
  if (route === '/api/quote.php' || route === '/api/booking.php') {
    if (req.method !== 'POST') return send(res, 405, JSON.stringify({ error: 'POST required' }));
    const b = await readBody(req);
    if (!b) return send(res, 400, JSON.stringify({ error: 'Booking details were missing or unreadable.' }));

    const quote = priceIt(b);

    if (route === '/api/quote.php') return send(res, 200, JSON.stringify(quote));

    const d = b.details || {};
    const errors = [];
    if (!d.name || d.name.trim().length < 2) errors.push('full name');
    if (!d.mobile || d.mobile.replace(/[^0-9]/g, '').length < 8) errors.push('mobile number');
    if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.push('email address');
    if (!d.address || d.address.trim().length < 6) errors.push('collection address');
    if (!/^[0-9]{4}$/.test(String(b.postcode || ''))) errors.push('postcode');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.date || ''))) errors.push('collection date');
    if (errors.length) {
      return send(res, 422, JSON.stringify({ error: 'Please check your ' + errors.join(', ') + '.' }));
    }
    if (quote.itemCount < 1) return send(res, 422, JSON.stringify({ error: 'No items were selected.' }));

    const reference = 'TR-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' +
      Math.random().toString(36).slice(2, 7).toUpperCase();

    const dir = STORE;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, reference + '.json'),
      JSON.stringify({ reference, receivedAt: new Date().toISOString(), booking: b, quote }, null, 2));

    console.log(`  booking ${reference}  server total $${quote.total}  ` +
      `client claimed $${b.clientTotal}  agree=${Math.abs((b.clientTotal || 0) - quote.total) < 0.005}  ` +
      `manualReview=${quote.manualReview}`);

    return send(res, 200, JSON.stringify({
      reference, total: quote.total,
      manualReview: quote.manualReview,
      manualReviewReasons: quote.manualReviewReasons,
      paymentAllowed: quote.paymentAllowed,
      paymentUrl: null,      // no provider connected — matches api/payment.php
      quote
    }));
  }

  /* ---- Static ---------------------------------------------------------- */
  let rel = decodeURIComponent(route === '/' ? '/index.html' : route);
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, data, TYPES[path.extname(file)] || 'application/octet-stream');
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Trash dev server: http://127.0.0.1:${PORT}/`);
});
