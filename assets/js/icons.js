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
  /* The price list calls a base "a solid box", so it must NOT be slatted —
     slats are what makes a bed FRAME a frame. A base is a solid slab with the
     ensemble split down the middle and castors at the corners: no pillows
     (that's the mattress), no slats (that's the frame). */
  function bedbase(len, wid) {
    const x = 60 - len / 2, y = 40 - wid / 2;
    let d = rr(x, y, len, wid, 6);
    d += rr(x + 8, 38.5, len - 16, 3, 1.5);                    // ensemble split
    const r = 3.5, inset = 9;
    [[x + inset, y + inset], [x + len - inset, y + inset],
     [x + inset, y + wid - inset], [x + len - inset, y + wid - inset]]
      .forEach(c => {                                           // castors
        d += `M${n(c[0] - r)},${n(c[1])}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
      });
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

  /* Outdoor lounge: the same seat count, but a slatted timber frame rather
     than upholstery, so an indoor and an outdoor couch never look the same. */
  function outdoor(seats, w) {
    const x = 60 - w / 2;
    let s = EO(rr(x + 5, 12, w - 10, 22, 5) +
      [0, 1, 2].map(i => rr(x + 10, 16 + i * 6.5, w - 20, 3.5, 1.5)).join(''));  // slatted back
    s += P(rr(x, 32, 10, 26, 4)) + P(rr(x + w - 10, 32, 10, 26, 4));             // arms
    const innerX = x + 13, innerW = w - 26, gap = 3;
    const cw = (innerW - gap * (seats - 1)) / seats;
    for (let i = 0; i < seats; i++) s += P(rr(innerX + i * (cw + gap), 38, cw, 16, 3));
    s += P(rr(x + 5, 60, 8, 10, 2)) + P(rr(x + w - 13, 60, 8, 10, 2));           // legs
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

  /* --------------------------------------------- bed frames & headboards --- */
  /* A bed BASE is a solid box; a bed FRAME has slats and posts. That is the
     whole difference in the price list, so it has to be the whole difference
     in the drawing. */
  function bedframe(len, wid) {
    const x = 60 - len / 2, y = 40 - wid / 2;
    let s = P(rr(x, y, 9, wid, 3));                       // headboard, at the left
    s += P(rr(x + len - 6, y + 4, 6, wid - 8, 3));        // footer
    const first = x + 13, span = len - 22, slats = 5, sw = 5;
    for (let i = 0; i < slats; i++) {
      s += P(rr(first + (span - sw) * (i / (slats - 1)), y + 5, sw, wid - 10, 2.5));
    }
    // corner leg posts
    [[x, y], [x + len - 8, y], [x, y + wid - 8], [x + len - 8, y + wid - 8]]
      .forEach(c => { s += P(rr(c[0], c[1], 8, 8, 2)); });
    return s;
  }

  /* Headboard, seen head-on: a board on two legs. */
  function headboard(w) {
    const x = 60 - w / 2;
    return P(rr(x, 14, w, 34, 7)) +
           P(rr(x + 6, 48, 8, 18, 3)) + P(rr(x + w - 14, 48, 8, 18, 3));
  }

  /* Bunk bed, side on. Two mattress slabs between posts, upper and lower
     drawn at their real relative widths so single/single, single/double and
     double/double read differently. */
  function bunk(topW, botW) {
    const postL = 16, postR = 104;
    let s = P(rr(postL, 8, 8, 64, 3)) + P(rr(postR, 8, 8, 64, 3));   // posts
    s += P(rr(postL, 22, topW, 11, 3));                              // upper bunk
    s += P(rr(postL, 54, botW, 11, 3));                              // lower bunk
    s += P(rr(postL + 6, 36, 4, 16, 2));                             // ladder rail
    s += P(rr(postL + 4, 40, 12, 3.5, 1.5)) + P(rr(postL + 4, 47, 12, 3.5, 1.5));
    return s;
  }

  /* ------------------------------------------------------------- pianos --- */
  /* Upright: a tall case with a keyboard band. Grand: plan view, curved body
     with the keyboard along the straight edge. */
  /* The keys are what make it a piano and not a bench, so they get cut into
     the keyboard band as holes rather than being implied by a plain bar. */
  const PIANO_UPRIGHT =
    EO(rr(26, 8, 68, 32, 4) + rr(34, 14, 52, 4, 2)) +           // case + music desk
    EO(rr(20, 42, 80, 16, 2) +
       [0, 1, 2, 3, 4, 5, 6].map(i => rr(26 + i * 10, 45, 5, 10, 1)).join('')) +  // keys
    P(rr(28, 60, 10, 12, 2)) + P(rr(82, 60, 10, 12, 2));        // legs

  const PIANO_GRAND =
    EO('M22,18 H72 A32,26 0 0 1 72,70 H22 Z' +
       'M30,26 H62 A20,16 0 0 1 62,58 H30 Z') +          // curved body with soundboard cut
    EO(rr(10, 18, 12, 52, 3) +
       [0, 1, 2, 3, 4].map(i => rr(12, 22 + i * 9.5, 8, 5, 1)).join(''));  // keyboard edge

  /* --------------------------------------------------- tyres and rims ---- */
  const ring = (cx, cy, ro, ri) =>
    EO(`M${cx - ro},${cy}a${ro},${ro} 0 1,0 ${ro * 2},0a${ro},${ro} 0 1,0 ${-ro * 2},0Z` +
       `M${cx - ri},${cy}a${ri},${ri} 0 1,0 ${ri * 2},0a${ri},${ri} 0 1,0 ${-ri * 2},0Z`);

  /* A rim is a wheel with bolt holes; a tyre is a thick black ring; rim & tyre
     is both, so the three are never the same drawing. */
  const RIM = (() => {
    const cx = 60, cy = 40, ro = 30;
    let d = `M${cx - ro},${cy}a${ro},${ro} 0 1,0 ${ro * 2},0a${ro},${ro} 0 1,0 ${-ro * 2},0Z`;
    d += `M${cx - 8},${cy}a8,8 0 1,0 16,0a8,8 0 1,0 -16,0Z`;              // hub hole
    for (let i = 0; i < 5; i++) {                                          // bolt holes
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const hx = cx + Math.cos(a) * 19, hy = cy + Math.sin(a) * 19;
      d += `M${n(hx - 4.5)},${n(hy)}a4.5,4.5 0 1,0 9,0a4.5,4.5 0 1,0 -9,0Z`;
    }
    return EO(d);
  })();

  const TYRE = ring(60, 40, 34, 19);
  const RIM_AND_TYRE = ring(60, 40, 34, 22) + (() => {
    const cx = 60, cy = 40;
    let d = `M${cx - 19},${cy}a19,19 0 1,0 38,0a19,19 0 1,0 -38,0Z`;
    d += `M${cx - 6},${cy}a6,6 0 1,0 12,0a6,6 0 1,0 -12,0Z`;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const hx = cx + Math.cos(a) * 12, hy = cy + Math.sin(a) * 12;
      d += `M${n(hx - 3.2)},${n(hy)}a3.2,3.2 0 1,0 6.4,0a3.2,3.2 0 1,0 -6.4,0Z`;
    }
    return EO(d);
  })();

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
    'mattress':     mattress(78, 59, 2),
    'mattress-s':   mattress(74, 38, 1),
    'mattress-ks':  mattress(78, 41, 1),
    'mattress-d':   mattress(72, 53, 2),
    'mattress-q':   mattress(78, 59, 2),
    'mattress-k':   mattress(78, 68, 2),
    'mattress-cot': mattress(48, 30, 1),

    /* Mattress toppers — a thin quilted pad, no pillows, so it never reads
       as the mattress it goes on top of. */
    'topper-s': EO(rr(23, 26, 74, 28, 6) +
      [0, 1, 2, 3].map(i => rr(31 + i * 17, 32, 10, 16, 3)).join('')),
    'topper-k': EO(rr(21, 20, 78, 40, 7) +
      [0, 1, 2, 3].map(i => rr(29 + i * 18, 27, 11, 11, 3)).join('') +
      [0, 1, 2, 3].map(i => rr(29 + i * 18, 42, 11, 11, 3)).join('')),

    /* Bed bases — a solid box, per the price list, so it must NOT be slatted */
    'bedbase':    bedbase(78, 59),
    'bedbase-s':  bedbase(74, 38),
    'bedbase-k':  bedbase(78, 68),

    /* Bed frames — slats, posts and a headboard */
    'bedframe-s': bedframe(74, 38),
    'bedframe-k': bedframe(78, 68),

    /* Headboards */
    'headboard-s': headboard(58),
    'headboard-k': headboard(86),

    /* Bunk beds — the two tiers are drawn at their real relative widths */
    'bunk-ss': bunk(58, 58),
    'bunk-sd': bunk(58, 88),
    'bunk-dd': bunk(88, 88),

    /* Couches — count the cushions. Past four seats the frame stops growing
       and only the cushion count changes, or an 8-seater would run off the
       canvas and every large size would look identical. */
    'sofa':   sofa(3, 92),
    'sofa-1': sofa(1, 48),
    'sofa-2': sofa(2, 72),
    'sofa-3': sofa(3, 92),
    'sofa-4': sofa(4, 110),
    'sofa-5': sofa(5, 114),
    'sofa-6': sofa(6, 114),
    'sofa-7': sofa(7, 116),
    'sofa-8': sofa(8, 116),

    /* Chaise section on its own — an L of seat with one arm */
    'chaise':
      P(rr(16, 20, 14, 46, 5)) +          // back/arm along the left
      P(rr(34, 20, 60, 20, 5)) +          // backrest run
      P(rr(34, 44, 60, 22, 4)),           // seat

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
    'recliner-3': recliner(3, 110),

    /* Outdoor lounges — the same seat count, on a slatted frame */
    'outdoor':   outdoor(3, 92),
    'outdoor-1': outdoor(1, 50),
    'outdoor-2': outdoor(2, 74),
    'outdoor-3': outdoor(3, 92),
    'outdoor-4': outdoor(4, 110),
    'outdoor-5': outdoor(5, 114),
    'outdoor-6': outdoor(6, 114),
    'outdoor-7': outdoor(7, 116),
    'outdoor-8': outdoor(8, 116),

    /* Pianos */
    'piano':       PIANO_UPRIGHT,
    'piano-grand': PIANO_GRAND,

    /* Tyres and rims */
    'tyre':     TYRE,
    'rim':      RIM,
    'rim-tyre': RIM_AND_TYRE,

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
