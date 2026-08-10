#!/usr/bin/env python3
"""Bundle the site into ONE self-contained HTML file for review.

    python3 tests/build-preview.py

Everything is inlined — CSS, JS, the logo as a data URI — so the file works
from a phone, an email attachment or a hosted URL with no server behind it.

What this build is NOT: the two PHP endpoints obviously can't run, so the
booking and photo POSTs are answered by a local stub that re-prices the
booking with the same pricing engine. Nothing leaves the browser. The
reference is prefixed DEMO- so a confirmation screen can never be mistaken
for a real booking.

The markup and styles are taken verbatim from index.html / book.html — this
is a packaging step, not a second implementation.
"""

import base64
import io
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "preview" / "trash-preview.html"

read = lambda p: (ROOT / p).read_text()


def between(text, start, end):
    i = text.index(start)
    j = text.index(end, i)
    return text[i:j]


# ---- logo, downscaled and embedded ------------------------------------------
def logo_data_uri():
    from PIL import Image
    im = Image.open(ROOT / "assets/img/trash-logo.png").convert("RGBA")
    h = 112                                   # 4x the 28px display height
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


index_html = read("index.html")
book_html = read("book.html")

# Home view: <main> through the end of the footer
home = between(index_html, "<main>", '<script src="assets/js/config.js">')
# Funnel view: progress bar, funnel main, sticky cart, live region
book = between(book_html, '<nav class="progress"', '<script src="assets/js/config.js">')

# The homepage's own inline script (category tiles, JUNK url, contact details)
home_script = index_html.rsplit("<script>", 1)[1].rsplit("</script>", 1)[0]

css = read("assets/css/trash.css")
cfg = read("assets/js/config.js")
icons = read("assets/js/icons.js")
pricing = read("assets/js/pricing.js")
app = read("assets/js/app.js")
logo = logo_data_uri()

# The footer carries its own logo — point it at the embedded copy too
home = home.replace('src="assets/img/trash-logo.png"', f'src="{logo}"')

# Say plainly, in the page, what this build is
home = home.replace(
    '<p class="foot-tag" style="margin:0">Select it. Book it. We collect it. We recycle it.</p>',
    '<p class="foot-tag" style="margin:0 0 8px">Select it. Book it. We collect it. We recycle it.</p>'
    '<p style="margin:0;font-size:13px;color:#A9A9AD">Preview build — bookings are simulated in '
    'your browser. Nothing is sent anywhere and no payment is taken.</p>')

HTML = f"""<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Trash — booking preview</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#000000">
<style>
{css}

/* ---- preview shell only: swaps the homepage and the funnel in one file --- */
body[data-view="book"] .home-only {{ display: none !important; }}
body[data-view="home"] #cart-bar {{ display: none !important; }}
</style>
</head>
<body data-view="home">

<header class="site-header">
  <div class="wrap">
    <a class="logo" href="#home" data-view-link="home">
      <img src="{logo}" alt="Trash">
    </a>
    <a class="nav-link home-only" href="#how">How it works</a>
    <a class="nav-link home-only" href="#help">Need help?</a>
    <a class="header-cta home-only" href="#book" data-view-link="book">Start Booking</a>
  </div>
</header>

<div id="view-home">
{home}
</div>

<div id="view-book" hidden>
{book}
</div>

<script>
{cfg}
</script>
<script>
{icons}
</script>
<script>
{pricing}
</script>
<script>
/* ---------------------------------------------------------------- preview --
   1. Swaps between the homepage and the funnel, since both live in one file.
   2. Answers the two API calls locally. The booking is re-priced with the same
      engine the page uses, so the totals stay honest, but nothing is stored
      and nothing is sent. The reference is prefixed DEMO- on purpose.
   -------------------------------------------------------------------------- */
(function () {{
  var STEP = /^#\\/(postcode|items|access|date|details|review|done)/;

  function showView(v) {{
    document.body.dataset.view = v;
    document.getElementById('view-home').hidden = (v !== 'home');
    document.getElementById('view-book').hidden = (v !== 'book');
    window.scrollTo(0, 0);
  }}
  window.trashShowView = showView;

  document.addEventListener('click', function (e) {{
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');

    if (a.dataset.viewLink === 'home' || href.indexOf('index.html') === 0) {{
      e.preventDefault(); showView('home'); return;
    }}
    if (a.dataset.viewLink === 'book' || href.indexOf('book.html') === 0) {{
      e.preventDefault();
      /* Only "#/step" counts as a deep link. The CTA's own "#book" anchor is a
         view target, not a step, and must not end up as the route. */
      var i = href.indexOf('#/');
      if (i !== -1) location.hash = href.slice(i);
      else if (!STEP.test(location.hash)) location.hash = '#/postcode';
      showView('book');
    }}
  }});

  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  var json = function (body, status) {{
    return new Response(JSON.stringify(body),
      {{ status: status || 200, headers: {{ 'Content-Type': 'application/json' }} }});
  }};
  var wait = function (ms, value) {{
    return new Promise(function (r) {{ setTimeout(function () {{ r(value); }}, ms); }});
  }};

  window.fetch = function (url, opts) {{
    var u = String(url);
    var body = {{}};
    try {{ body = JSON.parse((opts && opts.body) || '{{}}'); }} catch (err) {{ body = {{}}; }}

    if (u.indexOf('booking.php') !== -1) {{
      var q = TrashPricing.calculateBooking({{
        items: body.items, stairs: body.stairs, urgent: body.urgent,
        dismantling: body.dismantling, conditions: body.conditions, postcode: body.postcode
      }});
      var d = new Date();
      var ref = 'DEMO-' + String(d.getFullYear()).slice(2) +
        String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') +
        '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      return wait(650, json({{
        reference: ref, total: q.total, manualReview: q.manualReview,
        manualReviewReasons: q.manualReviewReasons, paymentAllowed: q.paymentAllowed,
        paymentUrl: null, quote: q
      }}));
    }}

    if (u.indexOf('photos.php') !== -1) {{
      return wait(500, json({{
        reference: body.reference, saved: (body.photos || []).length
      }}));
    }}

    return realFetch ? realFetch(url, opts) : Promise.reject(new Error('offline'));
  }};
}})();
</script>
<script>
{home_script}
</script>
<script>
{app}
</script>
</body>
</html>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(HTML)
kb = len(HTML.encode()) / 1024
print(f"  built {OUT.relative_to(ROOT)}  ({kb:.0f} KB, self-contained)")
