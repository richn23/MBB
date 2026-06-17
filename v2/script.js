/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN ENVIRONMENT — v2
   1200vh canvas · real sections ≈ 8976px
   Actual maxScroll ≈ 16 300px at 668px viewport.
   1 screen ≈ 0.041 p-units at 668px viewport.

   Beat map (progress 0.0 → 1.0):
   0.00–0.06  Hero visible, auto-reveal playing
   0.06–0.13  Hero stage fades out
   0.18–0.43  Pearl image
   0.20–0.40  Purpose card       — window inside pearl
   0.43–0.74  Water image        — starts exactly as pearl ends
   0.44–0.75  Caustics           — tracks water +0.01
   0.40–0.51  Interlude quote    — rises as purpose card ends, opaque before Framework enters
   0.70–1.00  Finish (white)     — starts after interlude is gone

   Invariants (both scroll directions):
   · Every value is a pure function of p — no one-way flags.
   · Pearl and interlude windows have zero overlap.
   · Purpose card and interlude windows have zero overlap.
   · Interlude fi > water pk; interlude end < water fo.
   · Finish fi > interlude end + 0.03 (lerp-lag buffer).
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     CONTACT DETAILS — update BOTH values here only.
  ══════════════════════════════════════════════════ */
  var CONTACT = {
    waUrl:      'https://wa.me/971585903249',
    formAction: 'https://formspree.io/f/mbdezbwq',
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
     All opacities are pure functions of p (reversible).
     Water zone widened so its plateau fully contains the interlude.
     Finish delayed so it cannot overlap the interlude even with lerp lag.
  ── */
  var LAYERS = [
    // Drift: present from start, holds through full atmosphere, releases as finish rises
    { id: 'lDrift',    fi:-0.01, pk:0.00, fo:0.70, end:0.78, maxOp:1.00, init:1.00 },
    // Pearl: fade-in 0.05 · plateau 0.14 · fade-out 0.06
    { id: 'lPearl',    fi: 0.18, pk:0.23, fo:0.37, end:0.43, maxOp:0.88, init:0 },
    // Water: starts as pearl ends; plateau (0.48–0.68) houses the interlude
    { id: 'lWater',    fi: 0.43, pk:0.48, fo:0.68, end:0.74, maxOp:0.82, init:0 },
    // Caustics: tracks water at +0.01 offset
    { id: 'lCaustics', fi: 0.44, pk:0.49, fo:0.69, end:0.75, maxOp:1.00, init:0 },
    // Finish: rises after interlude is fully gone (fi > interlude end + buffer)
    { id: 'lFinish',   fi: 0.70, pk:0.80, fo:1.00, end:1.00, maxOp:1.00, init:0 },
  ];

  /* ── Content cards ──────────────────────────────────────────────
     Purpose card: inside pearl zone (intentional coexistence).
     Interlude:    STRICTLY inside water plateau — fi > water pk (0.48),
                   end < water fo (0.68). Zero overlap with pearl or purpose card.
  ── */
  var CARDS = [
    { id: 'cardPearl',   fi:0.20,  pk:0.24,  fo:0.36,  end:0.40  },
    // Interlude must be fully opaque BEFORE Framework beats enter the viewport.
    // Canvas ends / Framework enters viewport at p≈0.450; beat 1 triggers is-visible
    // at p≈0.462. With lerp=0.07 the opacity needs to reach its target well before
    // that point — pk=0.425 gives ~600px of lerp runway (≈1.2s at normal scroll speed).
    // fi=0.400 touches cardPearl end (0.400) cleanly; no gap needed since the purpose
    // card is already gone and the interlude inherits the same pearl-coloured space.
    // Fade-out at fo=0.490 reveals the Framework section cleanly after 1 screen of hold.
    // (The "water plateau" constraint from the prior session assumed a transparent bg;
    //  with solid --pearl background the water layer is irrelevant behind the interlude.)
    { id: 'interlWater', fi:0.400, pk:0.425, fo:0.490, end:0.512 },
  ];

  /* ── Hero lines ── */
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

  var STAGE_FADE_S  = 0.06;
  var STAGE_FADE_E  = 0.13;
  var HEADER_RISE_S = 0.06;
  var HEADER_RISE_E = 0.18;
  var HEADER_LIFT_S = STAGE_FADE_E; /* 0.13 */
  var HEADER_LIFT_E = 0.22;

  /* ── Build hero letter spans ── */
  var lineLetters = LINES.map(function (line) {
    var el = document.getElementById(line.elId);
    var spans = [];
    line.segments.forEach(function (seg) {
      seg.text.split('').forEach(function (char) {
        if (char === ' ') {
          el.appendChild(document.createTextNode(' '));
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
  /* autoReveal() is called by the emblem load guard below, not here */

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

  /* ── Fade sections — bidirectional, pure function of scroll position ──
     No "done" flag. is-visible is added OR removed on every tick based
     solely on getBoundingClientRect().top. Scrolling back up reverses
     every reveal, making every position look identical in both directions. */
  var fadeSections = Array.prototype.slice.call(
    document.querySelectorAll('.fade-section')
  );

  /* ── Framework beats — lerp-driven opacity, same LERP as background layers.
     Beats no longer use .fade-section; opacity is a continuous function of
     viewport position so they stay in sync with the background during scroll. */
  var beatEls    = Array.prototype.slice.call(document.querySelectorAll('.fw-beat'));
  var curBeatOp  = beatEls.map(function () { return 0; });

  /* ── Debug overlay (activate with ?debug=1 in URL) ── */
  var debugMode = /[?&]debug=1/.test(window.location.search);
  var dbgEl = null;
  if (debugMode) {
    dbgEl = document.createElement('div');
    dbgEl.id = 'dbgOverlay';
    dbgEl.style.cssText = [
      'position:fixed', 'bottom:16px', 'right:16px', 'z-index:9999',
      'background:rgba(20,14,8,.82)', 'color:#e8dece',
      'font:11px/1.7 monospace', 'padding:10px 14px',
      'border-radius:6px', 'pointer-events:none',
      'white-space:pre', 'border:1px solid rgba(184,144,74,.35)',
    ].join(';');
    document.body.appendChild(dbgEl);
  }

  /* PHASE 1: idle-check — state for pausing rAF when scroll is idle */
  var lastScrollY   = -1;
  var lastScrollTime = 0;
  var rafPaused     = false;

  window.addEventListener('scroll', function () {
    lastScrollTime = Date.now();
    if (rafPaused) { rafPaused = false; tick(); }
  }, { passive: true });

  /* ── Tick — all state is a pure function of scrollY / maxScroll ── */
  function tick() {
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p  = window.scrollY / maxScroll;
    var vh = window.innerHeight;

    /* PHASE 1+3: read all layout values FIRST, before any style writes.
       getBoundingClientRect() after style writes forces a synchronous layout
       flush on every frame — reading up-front avoids that. */
    var fadeTops = fadeSections.map(function (el) {
      return el.getBoundingClientRect().top;
    });
    var beatTops = beatEls.map(function (el) {
      return el.getBoundingClientRect().top;
    });

    /* ── All style WRITES below this line ── */

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

    /* Hero stage */
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

    /* Header lift */
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

    /* PHASE 3: fade-section writes use pre-read fadeTops — no layout flush */
    fadeSections.forEach(function (el, i) {
      if (fadeTops[i] < vh * 0.85) {
        el.classList.add('is-visible');
      } else {
        el.classList.remove('is-visible');
      }
    });

    /* Framework beats — lerp toward 1 when inside viewport, 0 when outside.
       Same LERP constant as all other layers; stays in sync during scroll. */
    beatEls.forEach(function (el, i) {
      var target     = beatTops[i] < vh * 0.85 ? 1 : 0;
      curBeatOp[i]   = lerp(curBeatOp[i], target, LERP);
      el.style.opacity = curBeatOp[i].toFixed(4);
    });

    /* Debug overlay */
    if (dbgEl) {
      var lines = [
        'p=' + p.toFixed(4) + '  y=' + Math.round(window.scrollY) + '/' + Math.round(maxScroll),
        '─────────────────────',
      ];
      LAYERS.forEach(function (cfg) {
        var tgt = (trapezoid(p, cfg.fi, cfg.pk, cfg.fo, cfg.end) * cfg.maxOp).toFixed(2);
        var cur = curLayer[cfg.id].toFixed(2);
        lines.push(cfg.id.padEnd(11) + ' cur=' + cur + ' tgt=' + tgt);
      });
      lines.push('─────────────────────');
      CARDS.forEach(function (cfg) {
        var tgt = trapezoid(p, cfg.fi, cfg.pk, cfg.fo, cfg.end).toFixed(2);
        var cur = curCard[cfg.id].toFixed(2);
        lines.push(cfg.id.padEnd(11) + ' cur=' + cur + ' tgt=' + tgt);
      });
      dbgEl.textContent = lines.join('\n');
    }

    /* PHASE 1: idle-check — pause rAF when scroll has been idle >700ms.
       The scroll listener restarts tick() if the user scrolls again.
       700ms gives LERP=0.07 ~42 frames to settle (~95% convergence),
       keeping any residual error below the perceptual threshold. */
    var now = Date.now();
    var scrollChanged = window.scrollY !== lastScrollY;
    lastScrollY = window.scrollY;
    if (scrollChanged || (now - lastScrollTime < 700)) {
      requestAnimationFrame(tick);
    } else {
      rafPaused = true;
    }
  }

  tick();

  /* ── Emblem load guard — gate entire hero reveal on image being ready ──
     The hero (logo + letter sequence) is invisible until the emblem image
     fires its load event. This prevents iOS from flashing a half-decoded
     rectangle: nothing is painted until the image is fully available.
     A 2s fallback ensures the page never stays blank if the image errors. */
  (function () {
    var logoMark = document.querySelector('.logo-mark');
    var shEmblem = document.querySelector('.sh-emblem');
    var revealed = false;

    function reveal() {
      if (revealed) return;
      revealed = true;
      if (logoMark) logoMark.classList.add('is-loaded');
      if (shEmblem) shEmblem.classList.add('is-loaded');
      autoReveal();
    }

    var img = document.querySelector('.logo-emblem');
    if (!img) { reveal(); return; }

    /* img.decode() waits until pixels are ready for painting — on iOS,
       'load' fires before the image is composited so a bare load listener
       can still reveal a half-painted frame. decode() closes that gap. */
    var fallback = setTimeout(reveal, 2000);
    img.decode()
      .then(function () { clearTimeout(fallback); reveal(); })
      .catch(function () { clearTimeout(fallback); reveal(); });
  })();

  /* ── Contact wiring ── */
  (function () {
    var waLink = document.querySelector('.wa-link');
    if (waLink) waLink.href = CONTACT.waUrl;
  })();

  /* ── Contact form ── */
  (function () {
    var form    = document.getElementById('contactForm');
    if (!form) return;

    var nameEl  = document.getElementById('cfName');
    var emailEl = document.getElementById('cfEmail');
    var msgEl   = document.getElementById('cfMessage');
    var submit  = form.querySelector('.cff-submit');

    /* Validation — soft gold underline on invalid fields */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validate() {
      var ok = true;
      [nameEl, emailEl, msgEl].forEach(function (el) {
        el.style.borderBottomColor = '';
      });
      if (!nameEl.value.trim()) {
        nameEl.style.borderBottomColor = 'var(--gold)';
        ok = false;
      }
      if (!EMAIL_RE.test(emailEl.value.trim())) {
        emailEl.style.borderBottomColor = 'var(--gold)';
        ok = false;
      }
      if (!msgEl.value.trim()) {
        msgEl.style.borderBottomColor = 'var(--gold)';
        ok = false;
      }
      return ok;
    }

    /* State helpers */
    function setDisabled(on) {
      [nameEl, emailEl, msgEl, submit].forEach(function (el) {
        el.disabled = on;
      });
    }

    function showSuccess() {
      /* Fade form out, replace with quiet confirmation */
      form.style.transition = 'opacity .5s ease';
      form.style.opacity = '0';
      setTimeout(function () {
        form.style.display = 'none';

        var wrap = document.createElement('div');
        wrap.className = 'cf-confirm';

        var heading = form.parentNode.querySelector('.contact-heading');
        if (heading) {
          heading.style.transition = 'opacity .5s ease';
          heading.style.opacity = '0';
        }

        var msg = document.createElement('p');
        msg.className = 'cf-confirm-msg';
        msg.textContent = 'Thank you. Your message has been received.';

        var rule = document.createElement('div');
        rule.className = 'cf-confirm-rule';

        wrap.appendChild(msg);
        wrap.appendChild(rule);

        /* Insert after the form's parent column */
        var col = form.parentNode;
        col.appendChild(wrap);

        /* Fade in */
        wrap.style.opacity = '0';
        wrap.style.transition = 'opacity .6s ease';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            wrap.style.opacity = '1';
          });
        });
      }, 520);
    }

    function showError() {
      var existing = form.querySelector('.cf-error');
      if (existing) return;
      var line = document.createElement('p');
      line.className = 'cf-error';
      line.textContent = 'Something went wrong. Please try again, or reach us on WhatsApp.';
      form.appendChild(line);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var existing = form.querySelector('.cf-error');
      if (existing) existing.parentNode.removeChild(existing);

      if (!validate()) return;

      setDisabled(true);
      var originalText = submit.textContent;
      submit.style.transition = 'opacity .3s ease';
      submit.style.opacity = '.5';
      submit.textContent = 'Sending…';

      var params = new URLSearchParams();
      params.append('name',    nameEl.value.trim());
      params.append('email',   emailEl.value.trim());
      params.append('message', msgEl.value.trim());

      fetch(CONTACT.formAction, {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    params,
      })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (r) {
          if (r.ok) {
            showSuccess();
          } else {
            setDisabled(false);
            submit.style.opacity = '1';
            submit.textContent = originalText;
            showError();
          }
        })
        .catch(function () {
          setDisabled(false);
          submit.style.opacity = '1';
          submit.textContent = originalText;
          showError();
        });
    });
  })();

})();
