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
      if (r.top < vh * 0.9 && r.bottom > 0) {
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
