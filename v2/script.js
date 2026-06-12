/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT — v2
   350vh canvas, estimated maxScroll ≈ 6200px (720px viewport + ~300vh real sections)

   Beat map (progress 0.0 → 1.0):
   0.00–0.05  Hero visible, auto-reveal already playing
   0.05–0.11  Hero stage fades out as user begins to scroll
   0.14–0.42  Pearl image
   0.16–0.38  Pearl stationery card (Our Purpose)
   0.24–0.48  Water image
   0.26–0.48  Caustics
   0.28–1.00  Finish layer — holds white through real-section scroll
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     CONTACT DETAILS — update BOTH values here only.
     The phone number and WhatsApp link are set
     automatically throughout the page from this object.
  ══════════════════════════════════════════════════ */
  var CONTACT = {
    display: '+971 58 881 2769',
    waUrl:   'https://wa.me/971588812769',
  };

  /* ── Math helpers ── */
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

  /* ── Background layers ──────────────────────────────────────────
     800vh canvas · maxScroll ≈ 9457px · 1 screen ≈ 0.076 p-units
     Rule: plateau ≥ 2.6× fade-in; zones never overlap; gaps ≥ 0.04.
  ── */
  var LAYERS = [
    // Warm drift glow — present from start, held well into water zone
    { id: 'lDrift',    fi:-0.01, pk:0.00, fo:0.63, end:0.74, maxOp:1.00, init:1.00 },
    // Pearl image: fade-in 0.05 · plateau 0.14 · fade-out 0.06  (ratio 2.8×)
    { id: 'lPearl',    fi: 0.18, pk:0.23, fo:0.37, end:0.43, maxOp:0.88, init:0 },
    // Water image: fade-in 0.05 · plateau 0.13 · fade-out 0.06  (ratio 2.6×)
    { id: 'lWater',    fi: 0.47, pk:0.52, fo:0.65, end:0.71, maxOp:0.82, init:0 },
    // Caustics: tracks water, offset by +0.01
    { id: 'lCaustics', fi: 0.48, pk:0.53, fo:0.66, end:0.72, maxOp:1.00, init:0 },
    // Finish: calm white paper — rises after water, holds forever
    { id: 'lFinish',   fi: 0.68, pk:0.78, fo:1.00, end:1.00, maxOp:1.00, init:0 },
  ];

  /* ── Content cards (fixed overlays during scroll canvas) ──
     Purpose card: fade-in 0.04 · plateau 0.12 · fade-out 0.04  (ratio 3×)
     Arrives just as pearl settles; leaves just before pearl fades.
  ── */
  var CARDS = [
    { id: 'cardPearl',   fi:0.20, pk:0.24, fo:0.36, end:0.40 },
    // Water interlude: appears once water settles, fades before finish layer rises
    { id: 'interlWater', fi:0.49, pk:0.54, fo:0.62, end:0.67 },
  ];

  /* ── Hero lines
     delay  = ms from page load before this line's letter stagger begins
     stagger = ms between each successive letter
  ── */
  /* Reveal sequence (prefers-reduced-motion skips entirely via CSS):
     0ms–720ms  logo mark fades in (CSS animation on .logo-mark)
     820ms+     line 1 letters stagger in
     ~1900ms+   line 2 letters stagger in
     ~2950ms    last letter of line 2 begins fading — full sequence ≈ 3s  */
  var LINES = [
    {
      elId: 'heroLine1', delay: 820, stagger: 52,
      segments: [{ text: 'Meaning beyond brands.', gold: false }],
    },
    {
      elId: 'heroLine2', delay: 1900, stagger: 38,
      segments: [
        { text: 'Create ',      gold: false },
        { text: 'Meaningful',   gold: true  },
        { text: ' Experiences', gold: false },
      ],
    },
  ];

  var STAGE_FADE_S  = 0.06;   // hero starts fading at 0.79 screens of scroll
  var STAGE_FADE_E  = 0.13;   // hero fully gone at 1.71 screens
  var HEADER_RISE_S = 0.06;
  var HEADER_RISE_E = 0.18;

  /* ── Build letter spans ──────────────────────────
     Spaces are always-visible text nodes; only non-space
     characters become .hl spans (start at opacity:0 via CSS,
     revealed by autoReveal() on a timer).              */
  var lineLetters = LINES.map(function (line) {
    var el = document.getElementById(line.elId);
    var spans = [];
    line.segments.forEach(function (seg) {
      seg.text.split('').forEach(function (char) {
        if (char === ' ') {
          el.appendChild(document.createTextNode(' '));
        } else {
          var span = document.createElement('span');
          span.className = seg.gold ? 'hl hl-gold' : 'hl';
          span.textContent = char;
          el.appendChild(span);
          spans.push(span);
        }
      });
    });
    return { spans: spans, delay: line.delay, stagger: line.stagger };
  });

  /* ── Auto-reveal hero letters on load ──
     Clears both opacity AND blur (blur-to-sharp = engraving emerging from paper).
     prefers-reduced-motion: CSS sets .hl { opacity:1; filter:none } instantly,
     so these timeouts fire but have no visual effect.                            */
  function autoReveal() {
    lineLetters.forEach(function (line) {
      line.spans.forEach(function (span, i) {
        setTimeout(function () {
          span.style.opacity = '1';
          span.style.filter  = 'blur(0)';
        }, line.delay + i * line.stagger);
      });
    });
  }
  autoReveal();

  /* ── Init layer and card elements ── */
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

  var stageEl    = document.getElementById('logoStage');
  var headerEl   = document.getElementById('siteHeader');
  var hairlineEl = document.getElementById('shHairline');
  var curStage   = 1;
  var curHeader  = 0;
  var curLift    = 0;
  var LERP       = 0.07;

  /* Header lift: rises from STAGE_FADE_E (hero fully gone) to 0.22,
     so the stationery "thickness" appears as the hero disappears. */
  var HEADER_LIFT_S = STAGE_FADE_E; /* 0.13 */
  var HEADER_LIFT_E = 0.22;

  /* ── Fade sections — real layout below scroll canvas
     body { overflow-x: hidden } breaks IntersectionObserver,
     so we check directly in the tick loop instead.       */
  var fadeSections = Array.prototype.slice.call(
    document.querySelectorAll('.fade-section')
  ).map(function (el) {
    return { el: el, done: false };
  });

  /* ── Tick ── */
  function tick() {
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p  = window.scrollY / maxScroll;
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

    /* Hero stage — fades out as user scrolls */
    var stageTarget = fall(p, STAGE_FADE_S, STAGE_FADE_E);
    curStage = lerp(curStage, stageTarget, LERP);
    if (stageEl) stageEl.style.opacity = curStage.toFixed(4);

    /* Header — fades in as hero fades out */
    var headerTarget = rise(p, HEADER_RISE_S, HEADER_RISE_E);
    curHeader = lerp(curHeader, headerTarget, LERP);
    if (headerEl) {
      headerEl.style.opacity = curHeader.toFixed(4);
      headerEl.style.pointerEvents = curHeader > 0.05 ? 'auto' : 'none';
    }

    /* Header lift — near-opaque paper + shadow + blur once hero is gone.
       Reads as a fixed stationery sheet above the scrolling page.        */
    var liftTarget = rise(p, HEADER_LIFT_S, HEADER_LIFT_E);
    curLift = lerp(curLift, liftTarget, LERP);
    if (headerEl) {
      var L = curLift;
      headerEl.style.backgroundColor =
        'rgba(247,243,238,' + (0.97 * L).toFixed(3) + ')';
      headerEl.style.backdropFilter =
        'blur(' + (8 * L).toFixed(1) + 'px)';
      headerEl.style.webkitBackdropFilter =
        'blur(' + (8 * L).toFixed(1) + 'px)';
      headerEl.style.boxShadow =
        '0 12px 30px -12px rgba(74,58,32,' + (0.18 * L).toFixed(3) + '),' +
        'inset 0 1px 0 rgba(255,255,255,' + (0.65 * L).toFixed(3) + ')';
    }
    if (hairlineEl) {
      hairlineEl.style.opacity = curLift.toFixed(4);
    }

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

  /* ── Contact wiring — driven entirely by the CONTACT constant above ── */
  (function () {
    var waLink    = document.querySelector('.wa-link');
    var waDisplay = document.querySelector('.wa-display');
    if (waLink)    waLink.href = CONTACT.waUrl;
    if (waDisplay) waDisplay.textContent = CONTACT.display;
  })();

  /* ── Contact form — no backend yet ── */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) { e.preventDefault(); });
  }

})();
