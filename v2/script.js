/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT
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

  /* ── Scroll timing ─────────────────────────────────
     Beat 1  0.00 – 0.02   Logo alone on calm paper
     Beat 2  0.02 – 0.10   Letters engrave in (scroll-tied)
             0.10 – 0.12   All letters present, brief hold
     Beat 3  0.12 – 0.20   Logo + text fade out together
     Beat 4  0.20 – 0.24   Empty paper beat (intentional gap)
             0.24 +         Pearl fades in
  ─────────────────────────────────────────────── */
  const LETTER_START  = 0.02;
  const LETTER_END    = 0.10;
  const STAGE_FADE_S  = 0.12;
  const STAGE_FADE_E  = 0.20;

  const LAYERS = [
    { id: 'lPearl',    fi: 0.24, pk: 0.38, fo: 0.68, end: 0.82, maxOp: 0.88 },
    { id: 'lWater',    fi: 0.52, pk: 0.66, fo: 0.86, end: 0.96, maxOp: 0.82 },
    { id: 'lCaustics', fi: 0.55, pk: 0.68, fo: 0.86, end: 0.96, maxOp: 1.00 },
    { id: 'lFinish',   fi: 0.84, pk: 0.94, fo: 1.00, end: 1.00, maxOp: 1.00 },
  ];

  /* ── Build letter spans ── */
  const HERO_TEXT = 'Meaning beyond brands.';
  const heroLine  = document.getElementById('heroLine');
  const stageEl   = document.getElementById('logoStage');

  /* Each entry: { span, totalIndex } — spaces are text nodes, not spans */
  const letters = [];

  HERO_TEXT.split('').forEach(function (char, i) {
    if (char === ' ') {
      heroLine.appendChild(document.createTextNode(' '));
    } else {
      var span = document.createElement('span');
      span.className = 'hl';
      span.textContent = char;
      span.style.opacity = '0';
      heroLine.appendChild(span);
      letters.push({ span: span, idx: i });
    }
  });

  var totalChars  = HERO_TEXT.length;           /* include spaces in stagger count */
  var revealRange = LETTER_END - LETTER_START;  /* 0.08 */
  /* Each letter fades in over ~3 letter-widths of progress — soft overlap */
  var letterWindow = revealRange / totalChars * 3.2;

  /* ── Init layer elements ── */
  var layerEls = {};
  LAYERS.forEach(function (cfg) {
    layerEls[cfg.id] = document.getElementById(cfg.id);
  });

  var curLayer = {};
  LAYERS.forEach(function (cfg) { curLayer[cfg.id] = 0; });
  var curStage = 1;

  var LERP = 0.07;

  /* ── Tick ── */
  function tick() {
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = window.scrollY / maxScroll;

    /* Background layers — lerp-smoothed */
    LAYERS.forEach(function (cfg) {
      var target = trapezoid(p, cfg.fi, cfg.pk, cfg.fo, cfg.end) * cfg.maxOp;
      curLayer[cfg.id] = lerp(curLayer[cfg.id], target, LERP);
      if (layerEls[cfg.id]) layerEls[cfg.id].style.opacity = curLayer[cfg.id].toFixed(4);
    });

    /* Logo stage fade-out — lerp-smoothed */
    var stageTarget = fall(p, STAGE_FADE_S, STAGE_FADE_E);
    curStage = lerp(curStage, stageTarget, LERP);
    if (stageEl) stageEl.style.opacity = curStage.toFixed(4);

    /* Letter reveal — direct scroll mapping (no lerp: user controls pace) */
    letters.forEach(function (item) {
      var lStart = LETTER_START + (item.idx / totalChars) * revealRange;
      var lEnd   = lStart + letterWindow;
      item.span.style.opacity = rise(p, lStart, lEnd).toFixed(4);
    });

    requestAnimationFrame(tick);
  }

  tick();
})();
