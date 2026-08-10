/* ============================================================================
   TRASH.COM.AU — ITEM ICONS
   ----------------------------------------------------------------------------
   Solid black silhouettes on a 120x80 canvas, rendered as small as 44x32.

   Two decisions drive the whole set:

   1. SOLID FILLS, NOT OUTLINES. A 1px stroke at thumbnail size is mush.
      Everything here is filled mass separated by gaps, with detail cut out as
      holes (fill-rule="evenodd"), so a hole shows whatever the tile behind it
      is — which matters because the tile turns yellow when an item is chosen.

   2. EVERY VARIANT DIFFERS BY SOMETHING COUNTABLE OR STRUCTURAL, never by
      width alone. Width alone was the old mistake: five mattresses that
      differed by a few pixels are five identical icons at 44px.
        - mattresses / bed bases  -> plan view, true relative footprint,
                                     one pillow for singles, two for doubles+
        - sofas / sofa beds       -> countable seat cushions
        - dining tables           -> plan view with 4, 6 or 8 chairs to count
        - dining chairs           -> the same chair drawn 1, 4 or 6 times
        - fridges / freezers      -> door configuration, and freezers carry a
                                     snowflake badge so an upright freezer is
                                     not just a fridge again

      Where two items genuinely look alike in the real world — a double and a
      queen mattress — the icons stay honest about it and let the name
      disambiguate, rather than inventing a difference that isn't there.
   ========================================================================== */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else { root.TrashIcons = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {

  const n = v => Math.round(v * 10) / 10;

  /* Rounded rectangle as path data, so it can be unioned or punched as a hole */
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    const x2 = x + w, y2 = y + h;
    return `M${n(x + r)},${n(y)}H${n(x2 - r)}A${n(r)},${n(r)} 0 0 1 ${n(x2)},${n(y + r)}` +
           `V${n(y2 - r)}A${n(r)},${n(r)} 0 0 1 ${n(x2 - r)},${n(y2)}` +
           `H${n(x + r)}A${n(r)},${n(r)} 0 0 1 ${n(x)},${n(y2 - r)}` +
           `V${n(y + r)}A${n(r)},${n(r)} 0 0 1 ${n(x + r)},${n(y)}Z`;
  }

  /* A rectangle rotated about its centre — used for the snowflake spokes */
  function bar(cx, cy, len, thick, deg) {
    const a = deg * Math.PI / 180;
    const hx = Math.cos(a) * len / 2, hy = Math.sin(a) * len / 2;
    const px = -Math.sin(a) * thick / 2, py = Math.cos(a) * thick / 2;
    return `M${n(cx - hx + px)},${n(cy - hy + py)}L${n(cx + hx + px)},${n(cy + hy + py)}` +
           `L${n(cx + hx - px)},${n(cy + hy - py)}L${n(cx - hx - px)},${n(cy - hy - py)}Z`;
  }

  const P  = d => `<path d="${d}"/>`;                                  // solid mass
  const EO = d => `<path fill-rule="evenodd" d="${d}"/>`;              // mass with holes
  const G  = (x, y, s, body) => `<g transform="translate(${n(x)},${n(y)}) scale(${n(s)})">${body}</g>`;

  /* ---------------------------------------------------------- mattresses --- */
  /* Plan view laid out along the long axis, head at the left — the canvas is
     landscape, so a portrait plan view would waste most of the frame and leave
     the small sizes as specks. Footprint follows real AU dimensions, so the
     list reads as a true progression; pillow count splits singles from
     doubles and up. */
  function mattress(len, wid, pillows) {
    const x = 60 - len / 2, y = 40 - wid / 2;
    let d = rr(x, y, len, wid, 7);

    /* Piped seam around the edge. Without it a plain rectangle with a notch
       at one end reads as a battery icon, not a mattress. */
    const inset = 4.5, thick = 2.6;
    d += rr(x + inset, y + inset, len - inset * 2, wid - inset * 2, 5);
    d += rr(x + inset + thick, y + inset + thick,
            len - (inset + thick) * 2, wid - (inset + thick) * 2, 4);

    const pw = 10, px = x + inset + thick + 3.5;
    if (pillows === 1) {
      const ph = wid * 0.54;
      d += rr(px, 40 - ph / 2, pw, ph, 4);
    } else {
      const ph = wid * 0.38, gap = wid * 0.09;
      d += rr(px, 40 - gap / 2 - ph, pw, ph, 4) + rr(px, 40 + gap / 2, pw, ph, 4);
    }
    return EO(d);
  }

  /* ---------------------------------------------------------- bed bases ---- */
  /* The matching footprint, slatted and pillow-less, so a base is never
     mistaken for the mattress that goes on it. */
  function bedbase(len, wid) {
    const x = 60 - len / 2, y = 40 - wid / 2;
    let d = rr(x, y, len, wid, 6);
    const inset = 7, slats = 5, sw = 5;
    const span = len - inset * 2;
    for (let i = 0; i < slats; i++) {
      d += rr(x + inset + (span - sw) * (i / (slats - 1)), y + 7, sw, wid - 14, 2.5);
    }
    return EO(d);
  }

  /* --------------------------------------------------------------- sofas --- */
  /* Front elevation. The seat cushions are the thing you count. */
  function sofa(seats, w) {
    const x = 60 - w / 2;
    let s = P(rr(x + 5, 14, w - 10, 22, 6));                       // back
    s += P(rr(x, 33, 11, 25, 5)) + P(rr(x + w - 11, 33, 11, 25, 5)); // arms
    const innerX = x + 14, innerW = w - 28, gap = 3;
    const cw = (innerW - gap * (seats - 1)) / seats;
    for (let i = 0; i < seats; i++) s += P(rr(innerX + i * (cw + gap), 37, cw, 17, 4));
    s += P(rr(x + 6, 60, 7, 8, 2)) + P(rr(x + w - 13, 60, 7, 8, 2)); // feet
    return s;
  }

  /* Sofa bed: the same sofa with the bed pulled out in front of it. */
  function sofabed(seats, w) {
    const x = 60 - w / 2;
    let s = P(rr(x + 5, 8, w - 10, 19, 5));
    s += P(rr(x, 25, 10, 22, 4)) + P(rr(x + w - 10, 25, 10, 22, 4));
    const innerX = x + 13, innerW = w - 26, gap = 3;
    const cw = (innerW - gap * (seats - 1)) / seats;
    for (let i = 0; i < seats; i++) s += P(rr(innerX + i * (cw + gap), 28, cw, 15, 3));
    s += EO(rr(x - 5, 50, w + 10, 20, 5) + rr(60 - 13, 55, 26, 9, 4));  // bed + pillow
    return s;
  }

  /* ----------------------------------------------------------- recliners --- */
  /* Front elevation like the sofas, plus the extended footrest that makes a
     recliner a recliner. */
  function recliner(seats, w, extra) {
    const x = 60 - w / 2;
    let s = P(rr(x + 5, 8, w - 10, 24, 6));                          // tall back
    s += P(rr(x, 30, 11, 24, 5)) + P(rr(x + w - 11, 30, 11, 24, 5)); // arms
    const innerX = x + 14, innerW = w - 28, gap = 3;
    const cw = (innerW - gap * (seats - 1)) / seats;
    for (let i = 0; i < seats; i++) s += P(rr(innerX + i * (cw + gap), 34, cw, 16, 3));
    s += P(rr(x + 3, 57, w - 6, 13, 4));                             // footrest out
    return s + (extra || '');
  }

  /* ------------------------------------------------------- dining tables --- */
  /* Plan view. The chairs around the table are countable: 4, 6 or 8. */
  function table(seats) {
    const cfg = {
      4: { tw: 46, cols: [44, 64], ends: false },
      6: { tw: 62, cols: [36, 54, 72], ends: false },
      8: { tw: 62, cols: [36, 54, 72], ends: true }
    }[seats];
    const tx = 60 - cfg.tw / 2;
    let s = P(rr(tx, 26, cfg.tw, 28, 7));
    cfg.cols.forEach(cx => {
      s += P(rr(cx, 11, 14, 10, 3));
      s += P(rr(cx, 59, 14, 10, 3));
    });
    if (cfg.ends) {
      s += P(rr(tx - 15, 33, 10, 14, 3));
      s += P(rr(tx + cfg.tw + 5, 33, 10, 14, 3));
    }
    return s;
  }

  /* ------------------------------------------------------- dining chairs --- */
  /* Front elevation. A single chair fills the frame; the sets are a countable
     ROW, not a grid — the frame is landscape, so a 2x2 or 3x2 grid shrinks
     each chair to a few pixels and the whole thing turns to mush. */
  function chairs(count) {
    if (count === 1) {
      const w = 46, x = 60 - w / 2;
      return P(rr(x, 8, w, 31, 6)) +                    // backrest
             P(rr(x - 6, 43, w + 12, 11, 4)) +          // seat
             P(rr(x - 2, 56, 10, 16, 3)) +              // legs
             P(rr(x + w - 8, 56, 10, 16, 3));
    }
    const w = count === 4 ? 22 : 15;
    const gap = count === 4 ? 7 : 5;
    const x0 = 60 - (count * w + (count - 1) * gap) / 2;
    let s = '';
    for (let i = 0; i < count; i++) {
      const x = x0 + i * (w + gap);
      s += P(rr(x, 15, w, 27, 4));                      // backrest
      s += P(rr(x - 2.5, 46, w + 5, 9, 3));             // seat
      if (w >= 20) {                                    // legs only when they'd read
        s += P(rr(x - 0.5, 58, 5, 13, 2)) + P(rr(x + w - 4.5, 58, 5, 13, 2));
      } else {
        s += P(rr(x + w / 2 - 2.5, 58, 5, 13, 2));      // one centred leg
      }
    }
    return s;
  }

  /* ------------------------------------------------ fridges and freezers --- */
  /* A freezer badge: a hole punched in the door with a snowflake sitting in it,
     so an upright freezer never reads as just another single-door fridge.
     Sized generously — at 44px a small snowflake is just a dot. */
  const freezerBadge = (cx, cy) => ({
    hole: rr(cx - 14, cy - 14, 28, 28, 7),
    mark: P([0, 60, 120].map(a => bar(cx, cy, 21, 3.4, a)).join(''))
  });

  const ICONS = {

    /* Mattresses — length x width to scale (AU sizes), pillows tell singles
       from doubles. 92x188, 107x203, 138x188, 153x203, 183x203 cm. */
    'mattress':    mattress(78, 59, 2),
    'mattress-s':  mattress(72, 35, 1),
    'mattress-ks': mattress(78, 41, 1),
    'mattress-d':  mattress(72, 53, 2),
    'mattress-q':  mattress(78, 59, 2),
    'mattress-k':  mattress(78, 70, 2),

    /* Bed bases — same footprints, slatted */
    'bedbase':    bedbase(78, 59),
    'bedbase-s':  bedbase(72, 35),
    'bedbase-ks': bedbase(78, 41),
    'bedbase-d':  bedbase(72, 53),
    'bedbase-q':  bedbase(78, 59),
    'bedbase-k':  bedbase(78, 70),

    /* Sofas — count the cushions */
    'sofa':     sofa(3, 92),
    'armchair': sofa(1, 48),
    'sofa-2':   sofa(2, 72),
    'sofa-3':   sofa(3, 92),
    'sofa-4':   sofa(4, 110),

    /* Corner lounge — plan view, because the L footprint IS the product */
    'modular':
      P(rr(14, 10, 32, 30, 6)) +
      P(rr(14, 43, 32, 26, 6)) +
      P(rr(49, 43, 27, 26, 6)) +
      P(rr(79, 43, 27, 26, 6)),

    /* Sofa beds */
    'sofabed':   sofabed(2, 74),
    'sofabed-1': sofabed(1, 52),
    'sofabed-2': sofabed(2, 74),
    'sofabed-3': sofabed(3, 92),

    /* Recliners */
    'recliner':   recliner(1, 54),
    'recliner-e': recliner(1, 54,
      P('M25,20L10,42H19L14,60L30,36H21Z')),        // power bolt
    'recliner-2': recliner(2, 88),

    /* Dining tables — count the chairs */
    'table':   table(6),
    'table-4': table(4),
    'table-6': table(6),
    'table-8': table(8),

    /* Dining chairs — count the chairs */
    'chair':   chairs(1),
    'chair-4': chairs(4),
    'chair-6': chairs(6),

    /* Fridges and freezers — door configuration does the work */
    'fridge':        EO(rr(42, 8, 36, 64, 7) + rr(42, 30, 36, 3.5, 1.5) + rr(69, 14, 4, 12, 2) + rr(69, 38, 4, 16, 2)),
    'fridge-bar':    EO(rr(44, 32, 32, 36, 7) + rr(68, 40, 4, 14, 2)),
    'fridge-single': EO(rr(43, 8, 34, 64, 7) + rr(68, 24, 4, 20, 2)),
    'fridge-double': EO(rr(42, 8, 36, 64, 7) + rr(42, 28, 36, 3.5, 1.5) + rr(69, 13, 4, 11, 2) + rr(69, 37, 4, 18, 2)),
    'fridge-french': EO(rr(42, 8, 36, 64, 7) + rr(58.5, 8, 3, 36, 1.5) + rr(42, 44, 36, 3.5, 1.5) +
                        rr(52, 22, 4, 12, 2) + rr(64, 22, 4, 12, 2) + rr(50, 56, 20, 4, 2)),
    'freezer-up':    EO(rr(43, 6, 34, 68, 7) + freezerBadge(60, 28).hole + rr(68, 52, 4, 16, 2)) +
                     freezerBadge(60, 28).mark,
    'freezer-chest': EO(rr(16, 22, 88, 46, 7) + rr(16, 33, 88, 3.5, 1.5) + freezerBadge(60, 51).hole) +
                     freezerBadge(60, 51).mark
  };

  /**
   * Render an icon as an inline SVG string.
   * Decorative by default (aria-hidden) — the item name beside it is the label.
   */
  function svg(name, className) {
    const body = ICONS[name] || ICONS['mattress'];
    return `<svg class="${className || 'icon'}" viewBox="0 0 120 80" aria-hidden="true" ` +
           `focusable="false"><g fill="currentColor">${body}</g></svg>`;
  }

  return { svg: svg, names: Object.keys(ICONS) };
});
