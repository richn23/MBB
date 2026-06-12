/* ═══════════════════════════════════════════════════
   PERSPECTIVES — data-driven section + modal
   All content comes from /v2/perspectives.json.
   To add a real article: edit the JSON only.
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  fetch('/v2/perspectives.json')
    .then(function (r) { return r.json(); })
    .then(function (articles) {
      buildSpheres(articles);
      wireModal(articles);
    })
    .catch(function (err) {
      console.warn('[perspectives] failed to load data', err);
    });

  /* ── Build sphere elements ────────────────────────── */
  function buildSpheres(articles) {
    var stage = document.getElementById('pearlArrangement');
    if (!stage) return;

    articles.forEach(function (article, idx) {
      var item = document.createElement('div');
      item.className = 'pi'; /* sphere item */
      item.setAttribute('data-idx', String(idx));
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', article.title + ', ' + article.date);

      /* Pearl photograph — rendered as-is, no filter, no tint, no blend mode.
         The image's natural warm tone IS the correct colour.                  */
      var img = document.createElement('img');
      img.src = '/assets/pearl.png';
      img.className = 'pi-img';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      item.appendChild(img);

      /* Hover sweep layer — light shimmer ABOVE the image, clipped to circle */
      var sweep = document.createElement('div');
      sweep.className = 'pi-sweep';
      item.appendChild(sweep);

      /* Text label — centred on sphere */
      var label = document.createElement('div');
      label.className = 'pi-label';

      var titleEl = document.createElement('span');
      titleEl.className = 'pi-title';
      titleEl.textContent = article.title;

      var dateEl = document.createElement('span');
      dateEl.className = 'pi-date';
      dateEl.textContent = article.date;

      label.appendChild(titleEl);
      label.appendChild(dateEl);
      item.appendChild(label);

      stage.appendChild(item);
    });
  }

  /* ── Modal wiring ─────────────────────────────────── */
  var activeOpener = null;

  function wireModal(articles) {
    var stage   = document.getElementById('pearlArrangement');
    var backdrop = document.getElementById('perspBackdrop');
    var closeBtn = document.getElementById('perspClose');

    if (!stage) return;

    /* Click / keyboard on spheres */
    stage.addEventListener('click', function (e) {
      var item = e.target.closest('.pi');
      if (item) openModal(articles[parseInt(item.dataset.idx, 10)], item);
    });

    stage.addEventListener('keydown', function (e) {
      var item = e.target.closest('.pi');
      if (item && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        openModal(articles[parseInt(item.dataset.idx, 10)], item);
      }
    });

    /* Backdrop click */
    if (backdrop) backdrop.addEventListener('click', closeModal);

    /* Close button */
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    /* Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(article, opener) {
    if (!article) return;

    var modal    = document.getElementById('perspModal');
    var backdrop = document.getElementById('perspBackdrop');
    if (!modal || !backdrop) return;

    /* Populate */
    modal.querySelector('.pm-byline').textContent =
      'Published on LinkedIn · ' + article.date;

    var titleEl = modal.querySelector('.pm-title');
    titleEl.textContent = article.title;

    var linesEl = modal.querySelector('.pm-lines');
    linesEl.innerHTML = '';
    (article.lines || []).forEach(function (line) {
      var p = document.createElement('p');
      p.className = 'pm-line';
      p.textContent = line;
      linesEl.appendChild(p);
    });

    var link = modal.querySelector('.pm-continue');
    if (link) link.href = article.url || '#';

    /* Show */
    activeOpener = opener || null;
    backdrop.classList.add('is-open');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    /* Focus close button after transition starts */
    setTimeout(function () {
      var btn = document.getElementById('perspClose');
      if (btn) btn.focus();
    }, 60);
  }

  function closeModal() {
    var modal    = document.getElementById('perspModal');
    var backdrop = document.getElementById('perspBackdrop');
    if (!modal || !backdrop) return;

    modal.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';

    /* Return focus to the sphere that opened the modal */
    if (activeOpener) {
      activeOpener.focus();
      activeOpener = null;
    }
  }

})();
