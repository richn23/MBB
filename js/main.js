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
      document.body.style.overflow = open ? 'hidden' : '';
    });

    [].slice.call(drawer.querySelectorAll('a')).forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }


  /* ── Interactive compass ──────────────────────────────── */
  var csPts   = document.querySelectorAll('.cs-pt');
  var csPanel = document.querySelector('.cs-desc-panel');
  var csText  = document.querySelector('.cs-desc-text');
  var csHint  = document.querySelector('.compass-hint');

  if (csPts.length && csPanel) {
    csPts.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var alreadyOpen = this.getAttribute('aria-expanded') === 'true';
        csPts.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });

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
