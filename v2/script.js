/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

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

  function fall(p, start, end) { return 1 - rise(p, start, end); }

  const LAYERS = [
    { id: 'lPearl',    fadeIn: 0.12, peak: 0.28, fadeOut: 0.68, end: 0.82, maxOp: 0.88 },
    { id: 'lWater',    fadeIn: 0.46, peak: 0.62, fadeOut: 0.86, end: 0.96, maxOp: 0.58 },
    { id: 'lCaustics', fadeIn: 0.50, peak: 0.65, fadeOut: 0.86, end: 0.96, maxOp: 1.00 },
    { id: 'lFinish',   fadeIn: 0.84, peak: 0.94, fadeOut: 1.00, end: 1.00, maxOp: 1.00 },
  ];

  const els = {};
  LAYERS.forEach(cfg => { els[cfg.id] = document.getElementById(cfg.id); });
  const logoEl = document.getElementById('logoMark');

  const cur = {};
  LAYERS.forEach(cfg => { cur[cfg.id] = 0; });
  let curLogo = 1;

  const LERP = 0.07;
  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = window.scrollY / maxScroll;

    LAYERS.forEach(cfg => {
      const target = trapezoid(p, cfg.fadeIn, cfg.peak, cfg.fadeOut, cfg.end) * cfg.maxOp;
      cur[cfg.id] = lerp(cur[cfg.id], target, LERP);
      if (els[cfg.id]) els[cfg.id].style.opacity = cur[cfg.id].toFixed(4);
    });

    const logoTarget = fall(p, 0.02, 0.08);
    curLogo = lerp(curLogo, logoTarget, LERP);
    if (logoEl) logoEl.style.opacity = curLogo.toFixed(4);

    requestAnimationFrame(tick);
  }

  tick();
})();
