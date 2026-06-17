(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     FRAMEWORK COPY — edit all strings here only.
     Structure: six beats, in order. Pillar bodies are
     the only lines not verbatim from the brief.
  ═══════════════════════════════════════════════════ */
  var COPY = {

    beat1: {
      label: 'The Inspiration',
      body:  'The Mercedes‑Benz Formula 1 experience in Abu Dhabi felt exclusive, yet welcoming. It wasn’t about cars. It was about belonging, aspiration, culture, access, and identity.'
    },

    beat2: {
      label: 'The Question',
      body:  'What are brands doing beyond the products and services they offer?'
    },

    beat3: {
      label: 'The Insight',
      body:  'The strongest brands create value beyond what they sell by building experiences, communities, and connections that keep people engaged over time.'
    },

    beat4: {
      label:    'The Foundation',
      sublabel: 'Business Longevity',
      lead:     'Longevity isn’t created through transactions alone. It’s created through connection.',
      lines: [
        'Engage new audiences early',
        'Build meaningful relationships',
        'Create evolving communities',
        'Achieve lasting relevance and growth',
      ]
    },

    beat5: {
      intro: 'We help brands grow through four pillars.',
      pillars: [
        {
          num:  '01',
          name: 'Clarify',
          body: 'Define what your brand truly stands for — its values, its voice, and the specific people it exists to serve.'
        },
        {
          num:  '02',
          name: 'Connect',
          body: 'Build the relationships and communities that turn one-time customers into a loyal, long-term audience.'
        },
        {
          num:  '03',
          name: 'Inspire',
          body: 'Create experiences and stories that resonate deeply, and elevate how your brand is felt as well as seen.'
        },
        {
          num:  '04',
          name: 'Elevate',
          body: 'Position your brand for lasting relevance — growing in meaning, not just in market share.'
        }
      ]
    },

    beat6: {
      line1:       'Because the brands that last are rarely the loudest.',
      line2prefix: 'They’re the brands that create ',
      line2gold:   'meaning beyond what they sell.'
    }

  };

  /* ── DOM builder ──────────────────────────────────── */

  buildFramework();

  function buildFramework() {
    var section = document.getElementById('sectionFramework');
    if (!section) return;
    section.appendChild(makeBeat1());
    section.appendChild(makeBeat2());
    section.appendChild(makeBeat3());
    section.appendChild(makeBeat4());
    section.appendChild(makeBeat5());
    section.appendChild(makeBeat6());
  }

  /* Helpers */

  function beat(modifier) {
    var el = document.createElement('div');
    /* fade-section removed — opacity now lerp-driven in script.js tick() */
    el.className = 'fw-beat fw-beat--' + modifier;
    return el;
  }

  function label(text, sublabelText) {
    var el = document.createElement('p');
    el.className = 'fw-label';
    el.textContent = text;
    if (sublabelText) {
      var sub = document.createElement('span');
      sub.className = 'fw-sublabel';
      sub.textContent = ' · ' + sublabelText;
      el.appendChild(sub);
    }
    return el;
  }

  /* Beat builders */

  function makeBeat1() {
    var b = beat('inspiration');
    b.appendChild(label(COPY.beat1.label));
    var p = document.createElement('p');
    p.className = 'fw-body';
    p.textContent = COPY.beat1.body;
    b.appendChild(p);
    return b;
  }

  function makeBeat2() {
    var b = beat('question');
    b.appendChild(label(COPY.beat2.label));
    var q = document.createElement('p');
    q.className = 'fw-pullquote';
    q.textContent = COPY.beat2.body;
    b.appendChild(q);
    return b;
  }

  function makeBeat3() {
    var b = beat('insight');
    b.appendChild(label(COPY.beat3.label));
    var p = document.createElement('p');
    p.className = 'fw-statement';
    p.textContent = COPY.beat3.body;
    b.appendChild(p);
    return b;
  }

  function makeBeat4() {
    var b = beat('foundation');
    b.appendChild(label(COPY.beat4.label, COPY.beat4.sublabel));

    var lead = document.createElement('p');
    lead.className = 'fw-lead';
    lead.textContent = COPY.beat4.lead;
    b.appendChild(lead);

    var menu = document.createElement('div');
    menu.className = 'fw-menu';
    COPY.beat4.lines.forEach(function (line, i) {
      if (i > 0) {
        var rule = document.createElement('div');
        rule.className = 'fw-menu-rule';
        rule.setAttribute('aria-hidden', 'true');
        menu.appendChild(rule);
      }
      var item = document.createElement('p');
      item.className = 'fw-menu-item';
      item.textContent = line;
      menu.appendChild(item);
    });
    b.appendChild(menu);
    return b;
  }

  function makeBeat5() {
    var b = beat('pillars');
    var intro = document.createElement('p');
    intro.className = 'fw-pillars-intro';
    intro.textContent = COPY.beat5.intro;
    b.appendChild(intro);

    var grid = document.createElement('div');
    grid.className = 'fw-pillars-grid';

    COPY.beat5.pillars.forEach(function (pillar) {
      var cell = document.createElement('div');
      cell.className = 'fw-pillar';

      var num = document.createElement('span');
      num.className = 'fw-pillar-num';
      num.textContent = pillar.num;
      num.setAttribute('aria-hidden', 'true');

      var name = document.createElement('h3');
      name.className = 'fw-pillar-name';
      name.textContent = pillar.name;

      var body = document.createElement('p');
      body.className = 'fw-pillar-body';
      body.textContent = pillar.body;

      cell.appendChild(num);
      cell.appendChild(name);
      cell.appendChild(body);
      grid.appendChild(cell);
    });

    b.appendChild(grid);
    return b;
  }

  function makeBeat6() {
    var b = beat('close');

    var l1 = document.createElement('p');
    l1.className = 'fw-close-line1';
    l1.textContent = COPY.beat6.line1;
    b.appendChild(l1);

    var l2 = document.createElement('p');
    l2.className = 'fw-close-line2';
    l2.appendChild(document.createTextNode(COPY.beat6.line2prefix));
    var gold = document.createElement('span');
    gold.className = 'fw-close-gold';
    gold.textContent = COPY.beat6.line2gold;
    l2.appendChild(gold);
    b.appendChild(l2);

    return b;
  }

})();
