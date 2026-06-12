/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT — v2
   650vh canvas, maxScroll ≈ 550vh

   Beat map (progress 0.0 → 1.0):
   0.00–0.02  Logo alone on calm paper
   0.02–0.09  Line 1 engraves in
   0.07–0.16  Line 2 engraves in (overlaps line 1 end)
   0.17–0.24  Stage fades out (logo + both lines as one)
   0.24–0.28  Empty paper beat
   0.28–0.72  Pearl image
   0.40–0.64  Pearl stationery card
   0.54–0.88  Water image
   0.60–0.84  Framework placeholder
   0.74–0.84  Drift fades out  ← calm prep
   0.76–0.84  Caustics fade    ← calm prep
   0.84–1.00  Still finish — real sections scroll in below
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }
  function rise(p, s, e) {
    if (p <= s) return 0;
    if (p >= e) return 1;
    return smoothstep((p - s) / (e - s));
  }
  function fall(p, s, e) { return 1 - rise(p, s, e); }
  function trapezoid(p, fi, pk, fo, end) {
    if (p <= fi)  return 0;
    if (p <= pk)  return smoothstep((p - fi) / (pk  - fi));
    if (p <= fo)  return 1;
    if (p <= end) return 1 - smoothstep((p - fo) / (end - fo));
    return 0;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Background layers ── */
  var LAYERS = [
    { id: 'lDrift',    fi:-0.01, pk: 0.00, fo: 0.74, end: 0.84, maxOp: 1.00, init: 1.00 },
    { id: 'lPearl',    fi: 0.28, pk: 0.40, fo: 0.60, end: 0.72, maxOp: 0.88, init: 0 },
    { id: 'lWater',    fi: 0.54, pk: 0.64, fo: 0.80, end: 0.88, maxOp: 0.82, init: 0 },
    { id: 'lCaustics', fi: 0.56, pk: 0.66, fo: 0.76, end: 0.84, maxOp: 1.00, init: 0 },
    { id: 'lFinish',   fi: 0.84, pk: 0.92, fo: 1.00, end: 1.00, maxOp: 1.00, init: 0 },
  ];

  /* ── Content cards (fixed overlays during scroll canvas) ── */
  var CARDS = [
    { id: 'cardPearl', fi: 0.42, pk: 0.48, fo: 0.56, end: 0.64 },
  ];

  /* ── Hero letter lines ── */
  var LINES = [
    {
      elId: 'heroLine1', start: 0.02, end: 0.09,
      segments: [{ text: 'Meaning beyond brands.', gold: false }],
    },
    {
      elId: 'heroLine2', start: 0.07, end: 0.16,
      segments: [
        { text: 'Create ',      gold: false },
        { text: 'Meaningful',   gold: true  },
        { text: ' Experiences', gold: false },
      ],
    },
  ];

  var STAGE_FADE_S = 0.17;
  var STAGE_FADE_E = 0.24;

  /* Build letter spans for each line (segment-aware) */
  var lineLetters = LINES.map(function (line) {
    var el    = document.getElementById(line.elId);
    var spans = [];
    var total = line.segments.reduce(function (n, s) { return n + s.text.length; }, 0);
    var range = line.end - line.start;
    var win   = range / total * 3.2;
    var idx   = 0;

    line.segments.forEach(function (seg) {
      seg.text.split('').forEach(function (char) {
        if (char === ' ') {
          el.appendChild(document.createTextNode(' '));
        } else {
          var span = document.createElement('span');
          span.className = seg.gold ? 'hl hl-gold' : 'hl';
          span.textContent = char;
          span.style.opacity = '0';
          el.appendChild(span);
          spans.push({ span: span, idx: idx });
        }
        idx++;
      });
    });

    return { spans: spans, total: total, start: line.start, end: line.end, window: win };
  });

  /* ── Init elements ── */
  var layerEls = {}, cardEls = {}, curLayer = {}, curCard = {};

  LAYERS.forEach(function (cfg) {
    layerEls[cfg.id] = document.getElementById(cfg.id);
    curLayer[cfg.id] = cfg.init || 0;
    if (layerEls[cfg.id]) layerEls[cfg.id].style.opacity = curLayer[cfg.id];
  });

  CARDS.forEach(function (cfg) {
    cardEls[cfg.id] = document.getElementById(cfg.id);
    curCard[cfg.id] = 0;
  });

  var stageEl   = document.getElementById('logoStage');
  var headerEl  = document.getElementById('siteHeader');
  var curStage  = 1;
  var curHeader = 0;
  var LERP      = 0.07;

  var HEADER_RISE_S = 0.17;
  var HEADER_RISE_E = 0.30;

  /* ── Fade sections — real layout below the scroll canvas ──
     body { overflow-x: hidden } breaks IntersectionObserver's viewport root,
     so we check directly in the tick loop instead.                          */
  var fadeSections = Array.prototype.slice.call(
    document.querySelectorAll('.fade-section')
  ).map(function (el) {
    return { el: el, done: false };
  });

  /* ── Tick ── */
  function tick() {
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = window.scrollY / maxScroll;
    var vh = window.innerHeight;

    /* Background layers */
    LAYERS.forEach(function (cfg) {
      var target = trapezoid(p, cfg.fi, cfg.pk, cfg.fo, cfg.end) * cfg.maxOp;
      curLayer[cfg.id] = lerp(curLayer[cfg.id], target, LERP);
      if (layerEls[cfg.id]) layerEls[cfg.id].style.opacity = curLayer[cfg.id].toFixed(4);
    });

    /* Content cards */
    CARDS.forEach(function (cfg) {
      var target = trapezoid(p, cfg.fi, cfg.pk, cfg.fo, cfg.end);
      curCard[cfg.id] = lerp(curCard[cfg.id], target, LERP);
      if (cardEls[cfg.id]) cardEls[cfg.id].style.opacity = curCard[cfg.id].toFixed(4);
    });

    /* Logo stage */
    var stageTarget = fall(p, STAGE_FADE_S, STAGE_FADE_E);
    curStage = lerp(curStage, stageTarget, LERP);
    if (stageEl) stageEl.style.opacity = curStage.toFixed(4);

    /* Header */
    var headerTarget = rise(p, HEADER_RISE_S, HEADER_RISE_E);
    curHeader = lerp(curHeader, headerTarget, LERP);
    if (headerEl) {
      headerEl.style.opacity = curHeader.toFixed(4);
      headerEl.style.pointerEvents = curHeader > 0.05 ? 'auto' : 'none';
    }

    /* Letter reveal — direct scroll, no lerp */
    lineLetters.forEach(function (line) {
      line.spans.forEach(function (item) {
        var lStart = line.start + (item.idx / line.total) * (line.end - line.start);
        var lEnd   = lStart + line.window;
        item.span.style.opacity = rise(p, lStart, lEnd).toFixed(4);
      });
    });

    /* Fade sections — reveal when top edge enters bottom 85% of viewport */
    fadeSections.forEach(function (item) {
      if (item.done) return;
      var top = item.el.getBoundingClientRect().top;
      if (top < vh * 0.85) {
        item.el.classList.add('is-visible');
        item.done = true;
      }
    });

    requestAnimationFrame(tick);
  }

  tick();

  /* ── Contact form — no backend yet ── */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) { e.preventDefault(); });
  }

})();
