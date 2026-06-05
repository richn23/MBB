(function () {

  /* --- Scroll reveal ---------------------------------------- */
  var items = [].slice.call(document.querySelectorAll('.reveal'));

  items.forEach(function (el, i) {
    el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
  });

  function reveal() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    items = items.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 1.0 && r.bottom > 0) {
        el.classList.add('in');
        return false;
      }
      return true;
    });
  }

  reveal();
  window.addEventListener('scroll', reveal, { passive: true });
  window.addEventListener('resize', reveal);
  window.addEventListener('load', reveal);
  setTimeout(reveal, 200);


  /* --- Mobile menu toggle ----------------------------------- */
  var toggle  = document.querySelector('.nav-toggle');
  var header  = document.querySelector('header');
  var mobileLinks = document.querySelectorAll('.nav-mobile a');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
      document.querySelector('.nav-mobile').setAttribute('aria-hidden', !open);
    });

    // Close menu when any mobile link is tapped
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.querySelector('.nav-mobile').setAttribute('aria-hidden', 'true');
      });
    });
  }


  /* --- Mobile compass: tap to expand ----------------------- */
  var ctPts   = document.querySelectorAll('.ct-pt');
  var ctPanel = document.querySelector('.ct-expand');
  var ctText  = document.querySelector('.ct-expand-text');

  if (ctPts.length && ctPanel) {
    ctPts.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var alreadyOpen = this.getAttribute('aria-expanded') === 'true';
        ctPts.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
        if (alreadyOpen) {
          ctPanel.hidden = true;
          ctText.textContent = '';
        } else {
          this.setAttribute('aria-expanded', 'true');
          ctText.textContent = this.dataset.text;
          ctPanel.hidden = false;
        }
      });
    });
  }


  /* --- Contact form (basic client-side handler) ------------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.form-submit');
      var original = btn.textContent;
      btn.textContent = 'Message sent →';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
        form.reset();
      }, 3500);
    });
  }

}());
