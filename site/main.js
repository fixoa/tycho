/* Tycho website interactions */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobileMenu');

  const tone = () => { const s = window.scrollY > 40; nav.classList.toggle('is-scrolled', s); document.body.classList.toggle('is-scrolled', s); };
  tone(); window.addEventListener('scroll', tone, { passive: true });

  const closeMenu = () => { burger.setAttribute('aria-expanded', 'false'); menu.hidden = true; document.body.style.overflow = ''; tone(); };
  burger.addEventListener('click', () => {
    if (burger.getAttribute('aria-expanded') === 'true') return closeMenu();
    burger.setAttribute('aria-expanded', 'true'); menu.hidden = false; document.body.style.overflow = 'hidden'; 
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));


  // reveals
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  document.querySelectorAll('.trust li, .idea__facts div, .flow div, .cols .col, .shots .shot, .topics .topic, .badges .badge').forEach(el => el.style.setProperty('--i', [...el.parentElement.children].indexOf(el)));

  // counters
  const cio = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now();
    const tick = (now) => { const p = Math.min(1, (now - t0) / 1400), v = Math.round(target * (1 - Math.pow(1 - p, 3))); el.textContent = v + suffix; if (p < 1) requestAnimationFrame(tick); };
    reduced ? (el.textContent = target + suffix) : requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  // active nav link
  const links = [...document.querySelectorAll('.nav__links a')];
  const here = (location.pathname.split('/').pop() || 'index.html');
  links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href').split('#')[0] === here));
  const sio = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => sio.observe(s));

  /* scroll-lit statement */
  document.querySelectorAll('.promise__text').forEach((el) => {
    const keyPart = el.dataset.key || '';
    const full = el.textContent.trim();
    const keyStart = keyPart ? full.indexOf(keyPart) : -1;
    const words = full.split(' ');
    let pos = 0;
    el.innerHTML = words.map((w) => {
      const isKey = keyStart >= 0 && pos >= keyStart;
      pos += w.length + 1;
      return `<span class="pw${isKey ? ' is-key' : ''}">${w}</span>`;
    }).join(' ');
    const pws = [...el.querySelectorAll('.pw')];
    if (reduced) { pws.forEach(w => w.classList.add('is-on')); return; }
    let ticking = false;
    const paint = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.95 - r.top) / (vh * 0.60 + r.height * 0.60);
      const n = Math.round(Math.min(1, Math.max(0, p)) * pws.length);
      pws.forEach((w, i) => w.classList.toggle('is-on', i < n));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();
  });

  /* hero sequence: short opener, then medical-system clips */
  const seq = document.querySelector('.video--seq');
  if (seq) {
    const vids = [...seq.querySelectorAll('video')];
    let i = 0, timer = 0;
    const load = (n) => { const v = vids[n]; if (v && !v.src && v.dataset.src) v.src = v.dataset.src; };
    const show = (n) => {
      vids.forEach((v, k) => {
        const on = k === n;
        v.classList.toggle('is-live', on);
        if (on) { try { v.currentTime = 0; } catch (e) {} v.play().catch(() => {}); }
      });
      setTimeout(() => vids.forEach((v, k) => { if (k !== n) v.pause(); }), 1400);
      load((n + 1) % vids.length);
    };
    const next = () => { i = (i + 1) % vids.length; show(i); timer = setTimeout(next, +vids[i].dataset.dur || 5200); };
    load(1);
    if (!reduced) {
      timer = setTimeout(next, +vids[0].dataset.dur || 4200);
      document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else { clearTimeout(timer); timer = setTimeout(next, 1200); } });
    }
  }

  /* videos: play only when visible, fade in when ready */
  document.querySelectorAll('video[data-video]').forEach(v => {
    v.addEventListener('loadeddata', () => v.classList.add('is-ready'), { once: true });
    if (v.readyState >= 2) v.classList.add('is-ready');
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); return; }
    new IntersectionObserver((es) => { es.forEach(e => { if (e.isIntersecting) { v.play().catch(() => {}); } else { v.pause(); } }); }, { threshold: 0.05 }).observe(v);
  });

  /* story: sticky visual follows the step in view */
  const steps = [...document.querySelectorAll('.story__step')];
  const scenes = [...document.querySelectorAll('.scene')];
  const activate = (k) => { steps.forEach(s => s.classList.toggle('is-active', s.dataset.step === k)); scenes.forEach(s => s.classList.toggle('is-active', s.dataset.scene === k)); };
  activate('aufruf');
  steps.forEach(s => new IntersectionObserver((es) => { if (es[es.length - 1].isIntersecting) activate(s.dataset.step); }, { rootMargin: '-45% 0px -45% 0px' }).observe(s));

  // Aufruf screen ticks
  const num = document.getElementById('screenNum');
  if (num) { const names = ['Anna K.', 'Mehmet Y.', 'Sophie L.', 'Lukas B.', 'Maria H.']; let n = 0; num.style.transition = 'opacity .3s';
    if (!reduced) setInterval(() => { n = (n + 1) % names.length; num.style.opacity = 0; setTimeout(() => { num.textContent = names[n]; num.style.opacity = 1; }, 300); }, 4200); }

  // Takt chart (static demo curve, drawn once)
  /* Takt chart: smooth curve, grid, animated draw */
  const drawChart = (svg) => {
    const W = 640, H = 280, L = 42, R = 18, T = 20, B = 32, N = 21, MAX = 12;
    const vals = Array.from({ length: N }, (_, i) => {
      const t = 8 + i * 0.5;
      return Math.max(0.7, Math.exp(-Math.pow((t - 10.7) / 1.6, 2)) * 9 + Math.exp(-Math.pow((t - 15.2) / 1.8, 2)) * 6.2 + 1);
    });
    const X = i => L + i * (W - L - R) / (N - 1);
    const Y = a => H - B - (a / MAX) * (H - T - B);
    const pts = vals.map((a, i) => [X(i), Y(a)]);
    const f = n => n.toFixed(1);
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    const grid = [0, 3, 6, 9, 12].map(g =>
      `<line x1="${L}" x2="${W - R}" y1="${f(Y(g))}" y2="${f(Y(g))}" stroke="rgba(255,255,255,.07)"/>` +
      `<text x="${L - 12}" y="${f(Y(g) + 4)}" text-anchor="end" class="cax">${g}</text>`).join('');
    const xlab = [0, 4, 8, 12, 16, 20].map(i =>
      `<text x="${f(X(i))}" y="${H - 9}" text-anchor="middle" class="cax">${String(8 + i / 2).padStart(2, '0')}</text>`).join('');
    const dots = pts.map((p, i) => i % 2 === 0
      ? `<circle class="cdot" cx="${f(p[0])}" cy="${f(p[1])}" r="2.6" style="animation-delay:${(0.55 + i * 0.045).toFixed(2)}s"/>` : '').join('');
    let peak = 0; vals.forEach((a, i) => { if (a > vals[peak]) peak = i; });
    const mark = `<g class="cmark"><line x1="${f(X(peak))}" x2="${f(X(peak))}" y1="${T}" y2="${H - B}" stroke="rgba(255,255,255,.22)" stroke-dasharray="2 4"/>` +
      `<circle cx="${f(X(peak))}" cy="${f(Y(vals[peak]))}" r="4.5" fill="#fff"/>` +
      `<circle cx="${f(X(peak))}" cy="${f(Y(vals[peak]))}" r="5" fill="none" stroke="#2DD4BF"><animate attributeName="r" values="5;15" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".85;0" dur="2.4s" repeatCount="indefinite"/></circle>` +
      `<text x="${f(X(peak) + 12)}" y="${f(Y(vals[peak]) - 12)}" class="ctip">Spitze 11 bis 12 Uhr</text></g>`;
    svg.innerHTML = `<defs><linearGradient id="cg_${svg.id}" x1="0" x2="0" y1="0" y2="1">` +
      `<stop offset="0" stop-color="#2DD4BF" stop-opacity=".30"/><stop offset="1" stop-color="#2DD4BF" stop-opacity="0"/></linearGradient></defs>` +
      grid + xlab +
      `<path class="carea" d="${d} L${f(X(N - 1))},${H - B} L${f(X(0))},${H - B} Z" fill="url(#cg_${svg.id})"/>` +
      `<path class="cline" d="${d}" fill="none" stroke="#2DD4BF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
      dots + mark;
    const line = svg.querySelector('.cline');
    if (!reduced && line.getTotalLength) {
      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        line.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.22,1,.36,1)';
        line.style.strokeDashoffset = 0;
      }));
    }
  };
  [document.getElementById('taktChart'), document.getElementById('taktChartStory')].filter(Boolean).forEach((svg) => {
    new IntersectionObserver((es, o) => { if (es[es.length - 1].isIntersecting) { drawChart(svg); o.disconnect(); } }, { threshold: 0.2 }).observe(svg);
  });

  /* side-scrolling news rail */
  const rail = document.getElementById('newsRail');
  if (rail) {
    const step = () => (rail.querySelector('.ncard')?.offsetWidth || 300) + 16;
    const btns = [...document.querySelectorAll('[data-news]')];
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      btns.forEach(b => { b.disabled = b.dataset.news === 'prev' ? rail.scrollLeft <= 2 : rail.scrollLeft >= max; });
    };
    btns.forEach(b => b.addEventListener('click', () => { rail.scrollBy({ left: b.dataset.news === 'next' ? step() * 2 : -step() * 2, behavior: 'smooth' }); }));
    rail.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  /* contact form */
  const form = document.getElementById('contactForm');
  if (!form) return;
  const picks = [...form.querySelectorAll('input[name="produkt"]')];
  const all = picks.find(p => p.dataset.key === 'alles'), singles = picks.filter(p => p !== all);
  const pickError = document.getElementById('pickError'), fieldError = document.getElementById('fieldError');
  all.addEventListener('change', () => { singles.forEach(p => { p.checked = all.checked; }); pickError.hidden = true; });
  singles.forEach(p => p.addEventListener('change', () => { all.checked = singles.every(s => s.checked); pickError.hidden = true; }));
  document.querySelectorAll('[data-pick]').forEach(a => a.addEventListener('click', () => {
    const t = picks.find(p => p.dataset.key === a.dataset.pick); if (!t) return;
    if (a.dataset.pick === 'alles') { all.checked = true; singles.forEach(p => { p.checked = true; }); } else { t.checked = true; all.checked = singles.every(s => s.checked); }
  }));
  const pre = new URLSearchParams(location.search).get('pick');
  if (pre) { const t = picks.find(p => p.dataset.key === pre); if (t) { t.checked = true; all.checked = singles.every(s => s.checked); } }
  const done = document.createElement('div'); done.className = 'form__done';
  done.innerHTML = '<h3>Danke, wir melden uns.</h3><p>Ihr Mail-Programm öffnet sich mit der fertigen Anfrage. Antwort innerhalb von 24 Stunden.</p>';
  form.appendChild(done);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const chosen = singles.filter(p => p.checked).map(p => p.value);
    const d = new FormData(form), email = String(d.get('email') || '').trim(), name = String(d.get('name') || '').trim();
    const okPick = chosen.length > 0, okFields = name.length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    pickError.hidden = okPick; fieldError.hidden = okFields;
    if (!okPick || !okFields) return;
    const interest = all.checked ? 'Alles (' + chosen.join(', ') + ')' : chosen.join(', ');
    const body = [`Interesse: ${interest}`, `Name: ${name}`, `Ordination: ${d.get('ordination') || 'k. A.'}`, `E-Mail: ${email}`, `Telefon: ${d.get('tel') || 'k. A.'}`, '', String(d.get('nachricht') || '')].join('\n');
    window.location.href = `mailto:hallo@tycho.at?subject=${encodeURIComponent('Erstgespräch: ' + interest)}&body=${encodeURIComponent(body)}`;
    form.classList.add('form--sent');
  });
})();

/* ---------------------------------------------------------------------------
   Live-Vorschau der Tycho Station auf der Startseite.
   Beispieldaten einer fiktiven Gruppenpraxis, deterministisch, kein Server.
--------------------------------------------------------------------------- */
(function () {
  const chips = document.getElementById('opsChips');
  const kpiHost = document.getElementById('opsKpis');
  const chart = document.getElementById('opsChart');
  if (!chips || !kpiHost || !chart) return;

  const nf = (v, d) => Number(v).toLocaleString('de-AT', {
    minimumFractionDigits: d || 0, maximumFractionDigits: d === undefined ? 0 : d
  });

  const series = (n, base, spread, seed) => {
    let s = seed;
    const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    return Array.from({ length: n }, (_, i) => {
      const week = [1, 1.06, .98, 1.02, .84, 0, 0][(i + 1) % 7];
      if (week === 0) return null;
      return Math.round(base * week * (0.9 + rnd() * 0.2) + (i / n) * spread);
    });
  };

  const DATA = {
    woche: {
      range: '23.09. bis 27.09.',
      kpis: [
        ['Efficacy Score', '78', '+2', 'up'],
        ['Kontakte', '540', '+31', 'up'],
        ['Umsatz', '20,6 k€', '+4,1 %', 'up'],
        ['Ausfallquote', '4,1 %', '−0,3', 'up'],
        ['Ø Wartezeit', '10,9 min', '−0,8', 'up'],
        ['Anrufe', '570', '+22', 'up']
      ],
      note: 'Die Woche liegt über dem Schnitt. Die kürzere Wartezeit kommt aus der besseren Besetzung am Dienstag und Mittwoch.',
      find: [['3 Konsultationen ohne Grundleistung', '503,50 €'],
             ['2 Vorsorgeuntersuchungen offen', '170,00 €'],
             ['Limit 8a ausgeschöpft', '71 %']],
      points: series(5, 108, 6, 7331), labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr']
    },
    monat: {
      range: '01.09. bis 30.09.',
      kpis: [
        ['Efficacy Score', '76', '+1', 'up'],
        ['Kontakte', '2 227', '−287', 'down'],
        ['Umsatz', '85,2 k€', '+2,8 %', 'up'],
        ['Ausfallquote', '4,4 %', '0,0', ''],
        ['Ø Wartezeit', '11,7 min', '−0,5', 'up'],
        ['Anrufe', '2 346', '−305', 'down']
      ],
      note: 'Der Monat liegt 2,8 Prozent über dem Vergleichszeitraum. Getragen wird das von der Telemedizin, die Ausfallquote ist stabil.',
      find: [['41 Konsultationen ohne Grundleistung', '6 881,50 €'],
             ['12 Vorsorgeuntersuchungen offen', '1 020,00 €'],
             ['Limit 8a ausgeschöpft', '92 %']],
      points: series(30, 96, 10, 4211), labels: null
    },
    quartal: {
      range: '01.07. bis 30.09.',
      kpis: [
        ['Efficacy Score', '75', '−1', 'down'],
        ['Kontakte', '5 623', '+412', 'up'],
        ['Umsatz', '213,4 k€', '+6,2 %', 'up'],
        ['Ausfallquote', '4,8 %', '+0,4', 'down'],
        ['Ø Wartezeit', '12,3 min', '+0,6', 'down'],
        ['Anrufe', '5 902', '+688', 'up']
      ],
      note: 'Das Quartal wächst, aber Wartezeit und Ausfälle steigen mit. Die Prognose bis Quartalsende liegt bei 423 824 Euro, Band 376 bis 472 Tausend.',
      find: [['96 Konsultationen ohne Grundleistung', '16 104,00 €'],
             ['31 Vorsorgeuntersuchungen offen', '2 635,00 €'],
             ['Limit 8a ausgeschöpft', '96 %']],
      points: series(92, 92, 14, 9091), labels: null
    }
  };

  const NS = 'http://www.w3.org/2000/svg';

  function draw(set) {
    while (chart.firstChild) chart.removeChild(chart.firstChild);
    const W = 640, H = 260, L = 40, R = 12, T = 14, B = 26;
    const pts = set.points.map((v, i) => ({ v, i })).filter(p => p.v !== null);
    if (!pts.length) return;
    const peak = Math.max.apply(null, pts.map(p => p.v));
    const step = Math.pow(10, Math.floor(Math.log10(peak)));
    const top = Math.ceil(peak / step) * step || 1;
    const n = set.points.length;
    const X = i => L + (i / Math.max(1, n - 1)) * (W - L - R);
    const Y = v => H - B - (v / top) * (H - T - B);

    const add = (tag, attrs, text) => {
      const el = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
      if (text !== undefined) el.textContent = text;
      chart.appendChild(el);
      return el;
    };

    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = '<linearGradient id="opsFade" x1="0" x2="0" y1="0" y2="1">' +
      '<stop offset="0" stop-color="#2DD4BF" stop-opacity=".3"/>' +
      '<stop offset="1" stop-color="#2DD4BF" stop-opacity="0"/></linearGradient>';
    chart.appendChild(defs);

    for (let s = 0; s <= 4; s++) {
      const v = top * s / 4;
      add('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'ogrid' });
      add('text', { x: L - 7, y: Y(v) + 3.5, class: 'oax', 'text-anchor': 'end' }, nf(Math.round(v)));
    }

    let d = '';
    pts.forEach((p, k) => {
      const x = X(p.i), y = Y(p.v);
      if (!k) { d = 'M ' + x + ' ' + y; return; }
      const prev = pts[k - 1], prev2 = pts[Math.max(0, k - 2)];
      const next = pts[Math.min(pts.length - 1, k + 1)];
      const p0 = [X(prev2.i), Y(prev2.v)], p1 = [X(prev.i), Y(prev.v)];
      const p2 = [x, y], p3 = [X(next.i), Y(next.v)];
      d += ' C ' + (p1[0] + (p2[0] - p0[0]) / 6) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6) + ', ' +
        (p2[0] - (p3[0] - p1[0]) / 6) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6) + ', ' + p2[0] + ' ' + p2[1];
    });
    const last = pts[pts.length - 1], first = pts[0];
    add('path', { d: d + ' L ' + X(last.i) + ' ' + (H - B) + ' L ' + X(first.i) + ' ' + (H - B) + ' Z', class: 'oarea' });
    const line = add('path', { d: d, class: 'oline' });

    const every = Math.max(1, Math.ceil(n / 10));
    for (let i = 0; i < n; i += every) {
      const label = set.labels ? set.labels[i] : String(i + 1).padStart(2, '0');
      if (label) add('text', { x: X(i), y: H - 7, class: 'oax', 'text-anchor': 'middle' }, label);
    }
    const hi = pts.reduce((a, b) => (b.v > a.v ? b : a), pts[0]);
    add('circle', { cx: X(hi.i), cy: Y(hi.v), r: 3.5, class: 'odot' });

    try {
      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.22,1,.36,1)';
      requestAnimationFrame(() => requestAnimationFrame(() => { line.style.strokeDashoffset = '0'; }));
    } catch (e) { /* ohne Layout keine Länge */ }
  }

  function render(key) {
    const set = DATA[key];
    kpiHost.innerHTML = '';
    set.kpis.forEach(([label, value, delta, mood]) => {
      const box = document.createElement('div');
      box.className = 'ops__kpi';
      box.innerHTML = '<span>' + label + '</span><b>' + value + '</b><i class="' + mood + '">' + delta + '</i>';
      kpiHost.appendChild(box);
    });
    document.getElementById('opsRange').textContent = set.range;
    document.getElementById('opsNote').textContent = set.note;
    const find = document.getElementById('opsFind');
    find.innerHTML = '';
    set.find.forEach(([text, value]) => {
      const li = document.createElement('li');
      li.innerHTML = '<span>' + text + '</span><b>' + value + '</b>';
      find.appendChild(li);
    });
    draw(set);
  }

  chips.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-range]');
    if (!button) return;
    chips.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b === button));
    render(button.getAttribute('data-range'));
  });

  let started = false;
  new IntersectionObserver((entries, obs) => {
    if (entries[entries.length - 1].isIntersecting && !started) {
      started = true;
      render('monat');
      obs.disconnect();
    }
  }, { threshold: 0.15 }).observe(chart);
  render('monat');
})();
