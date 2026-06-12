/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  /* Trapezoid: 0 → 1 → 1 → 0 with smoothstep edges */
  function trapezoid(p, fadeIn, peak, fadeOut, end) {
    if (p <= fadeIn)  return 0;
    if (p <= peak)    return smoothstep((p - fadeIn)  / (peak    - fadeIn));
    if (p <= fadeOut) return 1;
    if (p <= end)     return 1 - smoothstep((p - fadeOut) / (end - fadeOut));
    return 0;
  }

  function rise(p, start, end) {
    if (p <= start) return 0;
    if (p >= end)   return 1;
    return smoothstep((p - start) / (end - start));
  }

  function fall(p, start, end) {
    return 1 - rise(p, start, end);
  }

  /* ── Layer config ──────────────────────────────────
     progress 0.0 = top of page, 1.0 = bottom
  ─────────────────────────────────────────────── */
  const LAYERS = [
    /* Shell / pearl: emerges strongly, top-left dissolve */
    { id: 'lPearl',    fadeIn: 0.10, peak: 0.25, fadeOut: 0.68, end: 0.82, maxOp: 0.88 },
    /* Water surface */
    { id: 'lWater',    fadeIn: 0.46, peak: 0.62, fadeOut: 0.86, end: 0.96, maxOp: 0.58 },
    /* Caustic shimmer */
    { id: 'lCaustics', fadeIn: 0.50, peak: 0.65, fadeOut: 0.86, end: 0.96, maxOp: 1.00 },
    /* Calm finish */
    { id: 'lFinish',   fadeIn: 0.84, peak: 0.94, fadeOut: 1.00, end: 1.00, maxOp: 1.00 },
  ];

  /* Logo mark: visible from start, fades as pearl arrives */
  const LOGO_HOLD_UNTIL = 0.28;
  const LOGO_GONE_AT    = 0.48;

  /* Hero text: rises as scroll begins, falls with logo */
  const TEXT_RISE_START = 0.04;
  const TEXT_RISE_END   = 0.14;
  const TEXT_FALL_START = 0.28;
  const TEXT_FALL_END   = 0.46;

  /* ── Init ── */
  const els = {};
  LAYERS.forEach(cfg => { els[cfg.id] = document.getElementById(cfg.id); });
  const logoEl = document.getElementById('logoMark');
  const textEl = document.getElementById('heroText');

  /* Smoothed current values */
  const cur = {};
  LAYERS.forEach(cfg => { cur[cfg.id] = 0; });
  let curLogo = 1;
  let curText = 0;

  const LERP = 0.07;
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Animation loop ── */
  function tick() {
    const scrollY   = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p         = scrollY / maxScroll;

    /* Background layers */
    LAYERS.forEach(cfg => {
      const target = trapezoid(p, cfg.fadeIn, cfg.peak, cfg.fadeOut, cfg.end) * cfg.maxOp;
      cur[cfg.id] = lerp(cur[cfg.id], target, LERP);
      if (els[cfg.id]) els[cfg.id].style.opacity = cur[cfg.id].toFixed(4);
    });

    /* Logo mark */
    const logoTarget = fall(p, LOGO_HOLD_UNTIL, LOGO_GONE_AT);
    curLogo = lerp(curLogo, logoTarget, LERP);
    if (logoEl) logoEl.style.opacity = curLogo.toFixed(4);

    /* Hero text */
    const textTarget = trapezoid(p, TEXT_RISE_START, TEXT_RISE_END, TEXT_FALL_START, TEXT_FALL_END);
    curText = lerp(curText, textTarget, LERP);
    if (textEl) textEl.style.opacity = curText.toFixed(4);

    requestAnimationFrame(tick);
  }

  tick();
})();
