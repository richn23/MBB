(function () {

  /* ── Scroll reveal ─────────────────────────────────────── */
  var items = [].slice.call(document.querySelectorAll('.reveal'));

  items.forEach(function (el, i) {
    el.style.transitionDelay = (Math.min(i % 4, 3) * 90) + 'ms';
  });

  function reveal () {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    items = items.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        el.classList.add('in');
        return false;
      }
      return true;
    });
  }

  reveal();
  window.addEventListener('scroll', reveal, { passive: true });
  window.addEventListener('resize', reveal);
  window.addEventListener('load',   reveal);
  setTimeout(reveal, 200);


  /* ── Mobile menu ───────────────────────────────────────── */
  var toggle = document.querySelector('.nb-toggle');
  var header = document.querySelector('header.nav-bar');
  var drawer = document.querySelector('.nb-drawer');

  if (toggle && header && drawer) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      drawer.setAttribute('aria-hidden', !open);
      // Prevent body scroll when menu is open
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on any drawer link tap
    [].slice.call(drawer.querySelectorAll('a')).forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }


  /* ── Compass rotation ────────────────────────────────── */
  var compassStar   = document.querySelector('.compass-star-layer');
  var dirOverride   = null; // null = follow scroll; number = locked to direction
  var compassTick   = false;

  // Direction → rotation angle (degrees): which point faces UP
  var dirAngles = { north: 0, east: -90, south: 180, west: 90 };

  function scrollDeg () {
    var max = document.body.scrollHeight - window.innerHeight;
    return max > 0 ? (window.pageYOffset / max) * 180 : 0;
  }

  function setStarRotation (deg, animate) {
    if (!compassStar) return;
    compassStar.style.transition = animate
      ? 'transform 0.85s cubic-bezier(.4,0,.2,1)'
      : 'none';
    compassStar.style.transform  = 'rotate(' + deg.toFixed(2) + 'deg)';
  }

  // Small marks (nav, separators) — continuous slow spin, independent
  var smallMarks = [].slice.call(document.querySelectorAll('use[href="#mark"]'));
  smallMarks.forEach(function (u) {
    var svg = u.closest('svg');
    if (svg) {
      svg.style.cssText += ';transform-box:fill-box;transform-origin:center;will-change:transform';
    }
  });

  function updateSmallMarks () {
    var deg = window.pageYOffset * 0.018;
    smallMarks.forEach(function (u) {
      var svg = u.closest('svg');
      if (svg) svg.style.transform = 'rotate(' + deg.toFixed(2) + 'deg)';
    });
  }

  function updateCompassRotation () {
    if (dirOverride === null) setStarRotation(scrollDeg(), false);
    updateSmallMarks();
    compassTick = false;
  }

  window.addEventListener('scroll', function () {
    // Any scroll cancels direction lock
    if (dirOverride !== null) {
      dirOverride = null;
      csPts.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      if (csPanel) csPanel.hidden = true;
    }
    if (!compassTick) {
      requestAnimationFrame(updateCompassRotation);
      compassTick = true;
    }
  }, { passive: true });

  updateCompassRotation();


  /* ── Interactive compass ──────────────────────────────── */
  var csPts    = document.querySelectorAll('.cs-pt');
  var csPanel  = document.querySelector('.cs-desc-panel');
  var csText   = document.querySelector('.cs-desc-text');
  var csHint   = document.querySelector('.compass-hint');

  if (csPts.length && csPanel) {
    csPts.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var alreadyOpen = this.getAttribute('aria-expanded') === 'true';
        csPts.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });

        // Rotate star to selected direction
        var dir = null;
        if (!alreadyOpen) {
          if (this.classList.contains('cs-north')) dir = 'north';
          else if (this.classList.contains('cs-east'))  dir = 'east';
          else if (this.classList.contains('cs-south')) dir = 'south';
          else if (this.classList.contains('cs-west'))  dir = 'west';
        }
        if (dir) {
          dirOverride = dirAngles[dir];
          setStarRotation(dirOverride, true);
        } else {
          dirOverride = null;
          setStarRotation(scrollDeg(), true);
        }

        if (alreadyOpen) {
          csPanel.hidden = true;
          csText.textContent = '';
        } else {
          this.setAttribute('aria-expanded', 'true');
          csText.textContent = this.dataset.description;
          csPanel.hidden = false;
          csPanel.style.animation = 'none';
          csPanel.offsetHeight;
          csPanel.style.animation = '';
        }
        if (csHint) csHint.classList.add('faded');
      });
    });
  }


  /* ── Invitation: form reveal toggle ───────────────────── */
  var formToggle = document.querySelector('.inv-form-toggle');
  var invForm    = document.getElementById('contact-form');

  if (formToggle && invForm) {
    formToggle.addEventListener('click', function () {
      var opening = invForm.hidden;
      invForm.hidden = !opening;
      formToggle.setAttribute('aria-expanded', opening);
      formToggle.textContent = opening ? 'Close ×' : 'Or send a message →';
    });
  }


  /* ── Contact form submit ───────────────────────────────── */
  if (invForm) {
    invForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn  = invForm.querySelector('.inv-submit');
      var orig = btn.textContent;
      btn.textContent = 'Sent ✓';
      btn.disabled    = true;
      setTimeout(function () {
        btn.textContent = orig;
        btn.disabled    = false;
        invForm.reset();
      }, 3500);
    });
  }

}());
