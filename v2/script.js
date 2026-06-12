/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT — v2
   650vh page, maxScroll ≈ 550vh

   Beat map (progress 0.0 → 1.0):
   0.00–0.02  Logo alone on calm paper
   0.02–0.08  Letters engrave in
   0.08–0.10  Letters hold
   0.10–0.18  Stage (logo+text) fades out
   0.18–0.22  Empty paper beat
   0.22–0.70  Pearl image (peaks 0.36)
   0.38–0.62  Pearl stationery card
   0.50–0.88  Water image (peaks 0.62)
   0.58–0.82  Framework placeholder
   0.74–0.84  Drift fades out   ← calm zone prep
   0.76–0.84  Caustics fade out ← calm zone prep
   0.82–1.00  Finish (still, plain paper)
   0.84–1.00  Profile + contact card
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Easing ── */
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
    if (p <= pk)  return smoothstep((p - fi)  / (pk  - fi));
    if (p <= fo)  return 1;
    if (p <= end) return 1 - smoothstep((p - fo) / (end - fo));
    return 0;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Background layers ── */
  var LAYERS = [
    /* Drift: visible from load, fades before calm finish */
    { id: 'lDrift',    fi:-0.01, pk: 0.00, fo: 0.74, end: 0.84, maxOp: 1.00, init: 1.00 },
    { id: 'lPearl',    fi: 0.22, pk: 0.36, fo: 0.58, end: 0.70, maxOp: 0.88, init: 0 },
    { id: 'lWater',    fi: 0.50, pk: 0.62, fo: 0.78, end: 0.88, maxOp: 0.82, init: 0 },
    { id: 'lCaustics', fi: 0.52, pk: 0.64, fo: 0.76, end: 0.84, maxOp: 1.00, init: 0 },
    { id: 'lFinish',   fi: 0.82, pk: 0.90, fo: 1.00, end: 1.00, maxOp: 1.00, init: 0 },
  ];

  /* ── Content cards ── */
  var CARDS = [
    { id: 'cardPearl',     fi: 0.38, pk: 0.44, fo: 0.54, end: 0.62 },
    { id: 'cardFramework', fi: 0.58, pk: 0.65, fo: 0.74, end: 0.82 },
    { id: 'cardFinish',    fi: 0.84, pk: 0.90, fo: 1.00, end: 1.00 },
  ];

  /* ── Hero letter reveal ── */
  var LETTER_START = 0.02;
  var LETTER_END   = 0.08;
  var STAGE_FADE_S = 0.10;
  var STAGE_FADE_E = 0.18;

  var HERO_TEXT = 'Meaning beyond brands.';
  var heroLine  = document.getElementById('heroLine');
  var stageEl   = document.getElementById('logoStage');
  var letters   = [];

  HERO_TEXT.split('').forEach(function (char, i) {
    if (char === ' ') {
      heroLine.appendChild(document.createTextNode(' '));
    } else {
      var span = document.createElement('span');
      span.className = 'hl';
      span.textContent = char;
      span.style.opacity = '0';
      heroLine.appendChild(span);
      letters.push({ span: span, idx: i });
    }
  });

  var totalChars   = HERO_TEXT.length;
  var revealRange  = LETTER_END - LETTER_START;
  var letterWindow = revealRange / totalChars * 3.2;

  /* ── Init ── */
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

  var curStage = 1;
  var LERP = 0.07;

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

    /* Logo stage fade-out */
    var stageTarget = fall(p, STAGE_FADE_S, STAGE_FADE_E);
    curStage = lerp(curStage, stageTarget, LERP);
    if (stageEl) stageEl.style.opacity = curStage.toFixed(4);

    /* Letter reveal — direct scroll mapping */
    letters.forEach(function (item) {
      var lStart = LETTER_START + (item.idx / totalChars) * revealRange;
      var lEnd   = lStart + letterWindow;
      item.span.style.opacity = rise(p, lStart, lEnd).toFixed(4);
    });

    requestAnimationFrame(tick);
  }

  tick();
})();
