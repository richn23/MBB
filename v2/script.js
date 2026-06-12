/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT — v2
   650vh page, maxScroll ≈ 550vh

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
   0.84–1.00  Still finish + profile card
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

  /* ── Content cards ── */
  var CARDS = [
    { id: 'cardPearl',     fi: 0.42, pk: 0.48, fo: 0.56, end: 0.64 },
    { id: 'cardFramework', fi: 0.60, pk: 0.67, fo: 0.76, end: 0.84 },
    { id: 'cardFinish',    fi: 0.86, pk: 0.92, fo: 1.00, end: 1.00 },
  ];

  /* ── Hero letter lines ── */
  var LINES = [
    { text: 'Meaning beyond brands.',     elId: 'heroLine1', start: 0.02, end: 0.09 },
    { text: 'Create Meaningful Experiences', elId: 'heroLine2', start: 0.07, end: 0.16 },
  ];

  var STAGE_FADE_S = 0.17;
  var STAGE_FADE_E = 0.24;

  /* Build letter spans for each line */
  var lineLetters = LINES.map(function (line) {
    var el     = document.getElementById(line.elId);
    var spans  = [];
    var total  = line.text.length;
    var range  = line.end - line.start;
    var window = range / total * 3.2; /* each letter fades over ~3 char-widths — soft overlap */

    line.text.split('').forEach(function (char, i) {
      if (char === ' ') {
        el.appendChild(document.createTextNode(' '));
      } else {
        var span = document.createElement('span');
        span.className = 'hl';
        span.textContent = char;
        span.style.opacity = '0';
        el.appendChild(span);
        spans.push({ span: span, idx: i });
      }
    });

    return { spans: spans, total: total, start: line.start, end: line.end, window: window };
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

  var stageEl  = document.getElementById('logoStage');
  var curStage = 1;
  var LERP     = 0.07;

  /* ── Tick ── */
  function tick() {
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = window.scrollY / maxScroll;

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

    /* Logo stage — both lines fade as one unit */
    var stageTarget = fall(p, STAGE_FADE_S, STAGE_FADE_E);
    curStage = lerp(curStage, stageTarget, LERP);
    if (stageEl) stageEl.style.opacity = curStage.toFixed(4);

    /* Letter reveal — direct scroll (no lerp: user controls pace) */
    lineLetters.forEach(function (line) {
      line.spans.forEach(function (item) {
        var lStart = line.start + (item.idx / line.total) * (line.end - line.start);
        var lEnd   = lStart + line.window;
        item.span.style.opacity = rise(p, lStart, lEnd).toFixed(4);
      });
    });

    requestAnimationFrame(tick);
  }

  tick();
})();
