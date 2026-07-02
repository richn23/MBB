/* ═══════════════════════════════════════════════════
   MEANING BEYOND BRANDS — HOMEPAGE V2 — main.js

   Two reveal systems, used deliberately for different jobs:

   1. CINEMA PROGRESS — a scoped scroll-percentage (0–1) computed
      from the .cinema wrapper's OWN height only, not the whole
      document. This is the key architectural change from V1: V1's
      global scrollY/documentHeight percentage meant every timing
      window anywhere on the page silently shifted whenever content
      was added anywhere else on the page (this is why V1's code
      comments about "Framework enters viewport at p≈0.45" had gone
      stale after the canvas was extended — the math wasn't wrong,
      the coupling was). Scoping progress to .cinema's own height
      makes that entire class of bug structurally impossible.

   2. IntersectionObserver — for everything below the cinema
      (Chapter Two's beats, Perspectives, About, Contact, Footer).
      Native, cheap, no per-frame polling required.
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CONTACT = {
    waUrl:      'https://wa.me/971585903249',
    formAction: 'https://formspree.io/f/mbdezbwq',
  };

  /* ── Math helpers (same proven approach as V1) ── */
  function smoothstep(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function rise(p, s, e) { if (p <= s) return 0; if (p >= e) return 1; return smoothstep((p - s) / (e - s)); }
  function trapezoid(p, fi, pk, fo, end) {
    if (p <= fi)  return 0;
    if (p <= pk)  return smoothstep((p - fi) / (pk - fi));
    if (p <= fo)  return 1;
    if (p <= end) return 1 - smoothstep((p - fo) / (end - fo));
    return 0;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Cinema timing map — local p, 0 to 1 across .cinema's own runway.
     Note the deliberate asymmetry: Purpose→Quote is a hard, non-
     overlapping hand-off (fi matches the prior scene's end exactly)
     because two foreground statements shouldn't visually compete.
     Quote→Inspiration DOES overlap slightly (~2% of p) — a genuine
     dissolve — because Inspiration is written to continue the Quote's
     thought, not replace it. That overlap is the single biggest
     "does this feel like one experience" lever in this file. ── */
  var ENV = [
    { id: 'envDrift',    fi:-0.02, pk:0.02, fo:0.85, end:0.97, maxOp:1.00 },
    { id: 'envPearl',    fi: 0.08, pk:0.15, fo:0.34, end:0.40, maxOp:0.85 },
    { id: 'envWater',    fi: 0.34, pk:0.42, fo:0.80, end:0.95, maxOp:0.78 },
    { id: 'envCaustics', fi: 0.35, pk:0.43, fo:0.81, end:0.96, maxOp:1.00 },
  ];
  var SCENES = [
    { id: 'sceneHero',        fi:-0.02, pk:0.03,  fo:0.15,  end:0.19  },
    { id: 'scenePurpose',     fi: 0.17, pk:0.22,  fo:0.42,  end:0.46  },
    { id: 'sceneQuote',       fi: 0.46, pk:0.51,  fo:0.64,  end:0.685 },
    { id: 'sceneInspiration', fi: 0.665,pk:0.715, fo:0.93,  end:0.985 },
  ];
  var MOTIF_S = 0.38, MOTIF_E = 0.90; /* gathers once, never fades back — it hands off to the chapter's own beat-labels */
  var HEADER_RISE_S = 0.05, HEADER_RISE_E = 0.20;
  var HEADER_LIFT_S = 0.14, HEADER_LIFT_E = 0.26;
  var LERP = 0.08;

  /* ── Hero letter reveal (timed, not scroll-linked — same technique as V1) ── */
  var LINES = [
    { elId: 'heroLine1', delay: 700, stagger: 46, segments: [{ text: 'Meaning beyond brands.', gold: false }] },
    { elId: 'heroLine2', delay: 1650, stagger: 34, segments: [
      { text: 'Create ', gold: false }, { text: 'Meaningful', gold: true }, { text: ' Experiences', gold: false },
    ] },
  ];
  var lineLetters = LINES.map(function (line) {
    var el = document.getElementById(line.elId);
    var spans = [];
    if (el) {
      line.segments.forEach(function (seg) {
        seg.text.split('').forEach(function (ch) {
          if (ch === ' ') { el.appendChild(document.createTextNode(' ')); return; }
          var span = document.createElement('span');
          span.className = seg.gold ? 'hl hl-gold' : 'hl';
          span.textContent = ch;
          el.appendChild(span);
          spans.push(span);
        });
      });
    }
    return { spans: spans, delay: line.delay, stagger: line.stagger };
  });
  function autoReveal() {
    lineLetters.forEach(function (line) {
      line.spans.forEach(function (span, i) {
        setTimeout(function () { span.style.opacity = '1'; span.style.filter = 'blur(0)'; }, line.delay + i * line.stagger);
      });
    });
  }
  (function () {
    var logoMark = document.getElementById('logoMark');
    var revealed = false;
    function reveal() { if (revealed) return; revealed = true; if (logoMark) logoMark.classList.add('is-loaded'); autoReveal(); }
    var img = document.querySelector('.logo-emblem');
    if (!img) { reveal(); return; }
    var fallback = setTimeout(reveal, 1800);
    img.decode().then(function () { clearTimeout(fallback); reveal(); }).catch(function () { clearTimeout(fallback); reveal(); });
  })();

  /* ── Element refs ── */
  var cinemaEl  = document.getElementById('cinema');
  var motifEl   = document.getElementById('motif');
  var headerEl  = document.getElementById('siteHeader');
  var hairlineEl= document.getElementById('shHairline');

  var envEls = {}, curEnv = {};
  ENV.forEach(function (cfg) { envEls[cfg.id] = document.getElementById(cfg.id); curEnv[cfg.id] = 0; });
  var sceneEls = {}, curScene = {};
  SCENES.forEach(function (cfg) { sceneEls[cfg.id] = document.getElementById(cfg.id); curScene[cfg.id] = 0; });
  var curMotif = 0, curHeader = 0, curLift = 0;

  function getCinemaProgress() {
    if (!cinemaEl) return 1;
    var rect = cinemaEl.getBoundingClientRect();
    var runway = cinemaEl.offsetHeight - window.innerHeight;
    if (runway <= 0) return 1;
    return Math.max(0, Math.min(1, -rect.top / runway));
  }

  var lastScrollY = -1, lastScrollTime = 0, rafPaused = false;
  window.addEventListener('scroll', function () {
    lastScrollTime = Date.now();
    if (rafPaused) { rafPaused = false; tick(); }
  }, { passive: true });

  function tick() {
    var p = getCinemaProgress();

    ENV.forEach(function (cfg) {
      var target = trapezoid(p, cfg.fi, cfg.pk, cfg.fo, cfg.end) * cfg.maxOp;
      curEnv[cfg.id] = lerp(curEnv[cfg.id], target, LERP);
      if (envEls[cfg.id]) envEls[cfg.id].style.opacity = curEnv[cfg.id].toFixed(4);
    });

    SCENES.forEach(function (cfg) {
      var target = trapezoid(p, cfg.fi, cfg.pk, cfg.fo, cfg.end);
      curScene[cfg.id] = lerp(curScene[cfg.id], target, LERP);
      if (sceneEls[cfg.id]) sceneEls[cfg.id].style.opacity = curScene[cfg.id].toFixed(4);
    });

    var motifTarget = rise(p, MOTIF_S, MOTIF_E);
    curMotif = lerp(curMotif, motifTarget, LERP);
    if (motifEl) motifEl.style.opacity = curMotif.toFixed(4);

    var headerTarget = rise(p, HEADER_RISE_S, HEADER_RISE_E);
    curHeader = lerp(curHeader, headerTarget, LERP);
    if (headerEl) {
      headerEl.style.opacity = curHeader.toFixed(4);
      headerEl.style.pointerEvents = curHeader > 0.05 ? 'auto' : 'none';
    }
    var liftTarget = rise(p, HEADER_LIFT_S, HEADER_LIFT_E);
    curLift = lerp(curLift, liftTarget, LERP);
    if (headerEl) {
      headerEl.style.backgroundColor = 'rgba(247,243,238,' + (0.97 * curLift).toFixed(3) + ')';
      headerEl.style.backdropFilter = 'blur(' + (8 * curLift).toFixed(1) + 'px)';
      headerEl.style.webkitBackdropFilter = 'blur(' + (8 * curLift).toFixed(1) + 'px)';
    }
    if (hairlineEl) hairlineEl.style.opacity = curLift.toFixed(4);

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

  /* ── IntersectionObserver reveals — Chapter Two + everything after ── */
  (function () {
    var targets = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window) || !targets.length) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ── Contact wiring ── */
  (function () {
    var waLink = document.querySelector('.wa-link');
    if (waLink) waLink.href = CONTACT.waUrl;
  })();

  (function () {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var nameEl = document.getElementById('cfName');
    var emailEl = document.getElementById('cfEmail');
    var msgEl = document.getElementById('cfMessage');
    var submit = form.querySelector('.cf-submit');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validate() {
      var ok = true;
      [nameEl, emailEl, msgEl].forEach(function (el) { el.style.borderBottomColor = ''; });
      if (!nameEl.value.trim()) { nameEl.style.borderBottomColor = 'var(--gold)'; ok = false; }
      if (!EMAIL_RE.test(emailEl.value.trim())) { emailEl.style.borderBottomColor = 'var(--gold)'; ok = false; }
      if (!msgEl.value.trim()) { msgEl.style.borderBottomColor = 'var(--gold)'; ok = false; }
      return ok;
    }
    function setDisabled(on) { [nameEl, emailEl, msgEl, submit].forEach(function (el) { el.disabled = on; }); }

    function showSuccess() {
      form.style.transition = 'opacity .5s ease';
      form.style.opacity = '0';
      setTimeout(function () {
        form.style.display = 'none';
        var heading = form.parentNode.querySelector('.contact-heading');
        if (heading) { heading.style.transition = 'opacity .5s ease'; heading.style.opacity = '0'; }
        var wrap = document.createElement('div');
        wrap.className = 'cf-confirm';
        var msg = document.createElement('p');
        msg.className = 'cf-confirm-msg';
        msg.textContent = 'Thank you. Your message has been received.';
        var rule = document.createElement('div');
        rule.className = 'cf-confirm-rule';
        wrap.appendChild(msg); wrap.appendChild(rule);
        form.parentNode.appendChild(wrap);
        wrap.style.opacity = '0'; wrap.style.transition = 'opacity .6s ease';
        requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.style.opacity = '1'; }); });
      }, 500);
    }
    function showError() {
      if (form.querySelector('.cf-error')) return;
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
      submit.style.opacity = '.5'; submit.textContent = 'Sending…';
      var params = new URLSearchParams();
      params.append('name', nameEl.value.trim());
      params.append('email', emailEl.value.trim());
      params.append('message', msgEl.value.trim());
      fetch(CONTACT.formAction, { method: 'POST', headers: { 'Accept': 'application/json' }, body: params })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (r) {
          if (r.ok) { showSuccess(); }
          else { setDisabled(false); submit.style.opacity = '1'; submit.textContent = originalText; showError(); }
        })
        .catch(function () { setDisabled(false); submit.style.opacity = '1'; submit.textContent = originalText; showError(); });
    });
  })();

})();
