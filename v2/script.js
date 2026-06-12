/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT
   Opacity for each layer is calculated from scroll
   progress using smooth trapezoid curves.
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Smooth interpolation helpers ── */
  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  /* Trapezoid: 0 → 1 → 1 → 0 with smoothstep edges */
  function trapezoid(p, fadeIn, peak, fadeOut, end) {
    if (p <= fadeIn)  return 0;
    if (p <= peak)    return smoothstep((p - fadeIn)  / (peak   - fadeIn));
    if (p <= fadeOut) return 1;
    if (p <= end)     return 1 - smoothstep((p - fadeOut) / (end - fadeOut));
    return 0;
  }

  /* Rising only: 0 → 1 with smoothstep */
  function rise(p, start, end) {
    if (p <= start) return 0;
    if (p >= end)   return 1;
    return smoothstep((p - start) / (end - start));
  }

  /* Falling only: 1 → 0 with smoothstep */
  function fall(p, start, end) {
    return 1 - rise(p, start, end);
  }


  /* ── Layer config ──────────────────────────────────
     Each entry: element id, fade-in start/peak,
     fade-out start/end, peak opacity.

     Scroll progress 0.0 = top of page
                     1.0 = bottom of page (500vh − 100vh = 400vh scrolled)
  ─────────────────────────────────────────────── */
  const LAYERS = [
    {
      id:      'lPearl',
      fadeIn:  0.10,   /* shell starts rising */
      peak:    0.26,   /* fully present */
      fadeOut: 0.68,   /* starts leaving */
      end:     0.82,   /* fully gone */
      maxOp:   0.72,
    },
    {
      id:      'lWater',
      fadeIn:  0.46,
      peak:    0.62,
      fadeOut: 0.86,
      end:     0.96,
      maxOp:   0.58,
    },
    {
      id:      'lCaustics',
      fadeIn:  0.50,
      peak:    0.65,
      fadeOut: 0.86,
      end:     0.96,
      maxOp:   1.00,
    },
    {
      id:      'lFinish',
      fadeIn:  0.84,
      peak:    0.94,
      fadeOut: 1.00,
      end:     1.00,
      maxOp:   1.00,
    },
  ];

  /* Logo: full opacity at top, fades as pearl emerges */
  const LOGO_FADE_START = 0.04;
  const LOGO_FADE_END   = 0.16;


  /* ── Initialise ── */
  const els = {};
  LAYERS.forEach(cfg => {
    els[cfg.id] = document.getElementById(cfg.id);
  });
  const logoEl = document.getElementById('logoStage');

  /* Current displayed opacities (for lerp smoothing) */
  const current = {};
  LAYERS.forEach(cfg => { current[cfg.id] = 0; });
  let currentLogo = 1;

  const LERP = 0.08;  /* smoothing factor — lower = slower/smoother */

  function lerp(a, b, t) { return a + (b - a) * t; }


  /* ── Animation loop ── */
  let rafId;

  function tick() {
    const scrollY  = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress  = maxScroll > 0 ? scrollY / maxScroll : 0;

    /* Layer opacities */
    LAYERS.forEach(cfg => {
      const target = trapezoid(progress, cfg.fadeIn, cfg.peak, cfg.fadeOut, cfg.end) * cfg.maxOp;
      current[cfg.id] = lerp(current[cfg.id], target, LERP);
      if (els[cfg.id]) {
        els[cfg.id].style.opacity = current[cfg.id].toFixed(4);
      }
    });

    /* Logo opacity */
    const logoTarget = fall(progress, LOGO_FADE_START, LOGO_FADE_END);
    currentLogo = lerp(currentLogo, logoTarget, LERP);
    if (logoEl) {
      logoEl.style.opacity = currentLogo.toFixed(4);
    }

    rafId = requestAnimationFrame(tick);
  }

  tick();

})();
