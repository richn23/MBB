/* ═══════════════════════════════════════════════════
   PERSPECTIVES — V2
   Pearls carry no text at all (that was the actual problem in V1 —
   9px type on a 76px sphere). One shared caption beneath the
   cluster shows title + date for whichever pearl currently has
   hover or focus. Same organic, hand-placed pearl positions as V1
   — only the labelling mechanism changed.
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  fetch('/v2-home/perspectives.json')
    .then(function (r) { return r.json(); })
    .then(function (articles) {
      buildPearls(articles);
      wireModal(articles);
    })
    .catch(function (err) { console.warn('[perspectives] failed to load data', err); });

  function buildPearls(articles) {
    var stage = document.getElementById('pearlStage');
    var caption = document.getElementById('pearlCaption');
    if (!stage) return;

    var pearlEls = [];

    articles.forEach(function (article, idx) {
      var item = document.createElement('div');
      item.className = 'pi';
      item.setAttribute('data-idx', String(idx));
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', article.title + ', ' + article.date);

      var img = document.createElement('img');
      img.src = '/assets/pearl.png';
      img.className = 'pi-img';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      item.appendChild(img);

      stage.appendChild(item);
      pearlEls.push(item);
    });

    function setActive(idx) {
      pearlEls.forEach(function (el, i) { el.classList.toggle('is-active', i === idx); });
      if (!caption) return;
      var a = articles[idx];
      caption.innerHTML = '';
      var title = document.createElement('span');
      title.className = 'pc-title';
      title.textContent = a.title;
      var date = document.createElement('span');
      date.className = 'pc-date';
      date.textContent = a.date;
      caption.appendChild(title);
      caption.appendChild(date);
    }

    /* Works for mouse hover AND touch (a tap focuses a
       tabindex="0" element before the click fires), so no
       separate mobile-only interaction is needed. */
    pearlEls.forEach(function (el, idx) {
      el.addEventListener('pointerenter', function () { setActive(idx); });
      el.addEventListener('focus', function () { setActive(idx); });
    });
  }

  var activeOpener = null;

  function wireModal(articles) {
    var stage = document.getElementById('pearlStage');
    var backdrop = document.getElementById('perspBackdrop');
    var closeBtn = document.getElementById('perspClose');
    if (!stage) return;

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
    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  function openModal(article, opener) {
    if (!article) return;
    var modal = document.getElementById('perspModal');
    var backdrop = document.getElementById('perspBackdrop');
    if (!modal || !backdrop) return;

    modal.querySelector('.pm-byline').textContent = 'Published on LinkedIn · ' + article.date;
    modal.querySelector('.pm-title').textContent = article.title;
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

    activeOpener = opener || null;
    backdrop.classList.add('is-open');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var btn = document.getElementById('perspClose');
      if (btn) btn.focus();
    }, 60);
  }

  function closeModal() {
    var modal = document.getElementById('perspModal');
    var backdrop = document.getElementById('perspBackdrop');
    if (!modal || !backdrop) return;
    modal.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    if (activeOpener) { activeOpener.focus(); activeOpener = null; }
  }

})();
