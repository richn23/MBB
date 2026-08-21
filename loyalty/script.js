var prefersReducedMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

(function () {
  var hero = document.querySelector('.hero');
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (prefersReducedMotion) {
    reveals.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  // Fade-in on first entering view. IntersectionObserver is safe here because
  // this is now a normal scrolling page (no snap), so sections cannot be
  // jumped over without the threshold ever firing.
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  reveals.forEach(function (el) { observer.observe(el); });

  // Hero content exits upward once the hero has scrolled past the viewport
  // centre, so it does not linger as a ghost behind the next section.
  var ticking = false;
  function update() {
    if (hero) {
      var centre = window.innerHeight * 0.5;
      hero.classList.toggle('hero-exit', hero.getBoundingClientRect().bottom < centre);
    }
    ticking = false;
  }
  function requestUpdate() {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  update();
})();
