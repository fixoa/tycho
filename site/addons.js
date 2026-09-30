/* Tycho website: Ergänzungen (Hero-Beschriftung, Diagramme, Roadmap, Terminbuchung). Keine Abhängigkeiten. */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hero: Beschriftung und Punkte wechseln mit dem Clip */
  const seq = document.querySelector('.video--seq'), clip = document.querySelector('.hero__clip');
  if (seq && clip) {
    const vids = [...seq.querySelectorAll('video')], label = clip.querySelector('b'), dots = [...clip.querySelectorAll('.dots i')];
    const apply = () => {
      const n = vids.findIndex(v => v.classList.contains('is-live')); if (n < 0) return;
      dots.forEach((d, k) => d.classList.toggle('is-on', k === n));
      const text = vids[n].dataset.caption || ''; if (label.textContent === text) return;
      label.classList.add('is-swap'); setTimeout(() => { label.textContent = text; label.classList.remove('is-swap'); }, reduced ? 0 : 400);
    };
    new MutationObserver(apply).observe(seq, { attributes: true, subtree: true, attributeFilter: ['class'] });
    apply();
  }

  /* Funktionsweise: Schritte und Diagramm laufen synchron */
  const steps = [...document.querySelectorAll('[data-flowstep]')], flows = [...document.querySelectorAll('.diag [data-step]')];
  if (steps.length) {
    let cur = 0, timer = 0;
    const set = (i) => { cur = i; steps.forEach((s, k) => s.classList.toggle('is-on', k === i)); flows.forEach(f => f.classList.toggle('on', f.dataset.step.split(' ').includes(String(i)))); };
    const next = () => set((cur + 1) % steps.length);
    steps.forEach((s, i) => s.addEventListener('click', () => { set(i); clearInterval(timer); if (!reduced) timer = setInterval(next, 4500); }));
    set(0); if (!reduced) timer = setInterval(next, 4500);
  }

  /* Roadmap: Linie füllt sich, Meilensteine leuchten nacheinander */
  document.querySelectorAll('.roadmap').forEach((rm) => {
    rm.querySelectorAll('.step').forEach((s, i) => s.style.setProperty('--i', i));
    new IntersectionObserver((es, o) => { if (es[es.length - 1].isIntersecting) { rm.classList.add('in'); o.disconnect(); } }, { threshold: 0.3 }).observe(rm);
  });

  /* Terminbuchung: Kalender, Uhrzeiten, Formular (Netlify Forms, Rückfall auf Mail) */
  const cal = document.getElementById('cal');
  if (!cal) return;
  const form = document.getElementById('bookingForm'), days = cal.querySelector('.cal__days'), month = cal.querySelector('.cal__month'), slotsEl = document.getElementById('slots');
  const kindField = document.getElementById('kind'), slotField = document.getElementById('slot'), sum = document.getElementById('pickSum'), err = document.getElementById('bookError');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const max = new Date(today); max.setDate(max.getDate() + 42);
  let view = new Date(today.getFullYear(), today.getMonth(), 1), day = null, time = null;
  const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const taken = (d, t) => hash(d.toDateString() + t) % 5 === 0; /* Beispielbelegung, deterministisch */
  const fmt = (d) => d.toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const renderDays = () => {
    month.textContent = view.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
    days.innerHTML = '';
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(d => { const s = document.createElement('span'); s.className = 'd'; s.textContent = d; days.appendChild(s); });
    const offset = (view.getDay() + 6) % 7; for (let i = 0; i < offset; i++) days.appendChild(document.createElement('span'));
    const n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= n; i++) {
      const d = new Date(view.getFullYear(), view.getMonth(), i), b = document.createElement('button'); b.type = 'button'; b.textContent = i;
      b.disabled = d.getDay() === 0 || d.getDay() === 6 || d < today || d > max;
      if (d.getTime() === today.getTime()) b.classList.add('is-today');
      if (day && d.getTime() === day.getTime()) b.classList.add('is-on');
      b.addEventListener('click', () => { day = d; time = null; renderDays(); renderSlots(); });
      days.appendChild(b);
    }
    cal.querySelector('[data-cal="prev"]').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    cal.querySelector('[data-cal="next"]').disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > max;
  };
  const renderSlots = () => {
    slotsEl.innerHTML = '';
    if (!day) { const s = document.createElement('div'); s.className = 'none'; s.textContent = 'Zuerst einen Tag wählen.'; slotsEl.appendChild(s); return; }
    TIMES.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.disabled = taken(day, t); if (t === time) b.classList.add('is-on'); b.addEventListener('click', () => { time = t; renderSlots(); slotField.value = `${fmt(day)}, ${t} Uhr (30 Minuten, Video)`; sum.innerHTML = '<b>Termin</b>' + slotField.value; }); slotsEl.appendChild(b); });
  };
  cal.querySelector('[data-cal="prev"]').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderDays(); });
  cal.querySelector('[data-cal="next"]').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderDays(); });
  renderDays(); renderSlots();
  document.querySelectorAll('.kind button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.kind button').forEach(x => x.classList.toggle('is-on', x === b));
    kindField.value = b.dataset.kind; document.getElementById('calWrap').hidden = b.dataset.kind !== 'termin';
    sum.innerHTML = b.dataset.kind === 'termin' ? (slotField.value ? '<b>Termin</b>' + slotField.value : 'Noch kein Termin gewählt.') : '<b>Rückruf</b>Wir rufen Sie innerhalb eines Werktags an.';
  }));
  const done = document.createElement('div'); done.className = 'form__done'; form.appendChild(done);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); err.hidden = true;
    const d = new FormData(form), name = String(d.get('name') || '').trim(), email = String(d.get('email') || '').trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Bitte Name und eine gültige E-Mail-Adresse angeben.'; err.hidden = false; return; }
    if (kindField.value === 'termin' && !(day && time)) { err.textContent = 'Bitte links einen Tag und eine Uhrzeit wählen.'; err.hidden = false; return; }
    let sent = false;
    try { const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(d).toString() }); sent = r.ok; } catch (e) { sent = false; }
    if (!sent) { /* ohne Netlify: Mail-Programm mit fertiger Anfrage */
      const body = [`Art: ${kindField.value === 'termin' ? 'Demo-Termin' : 'Rückruf'}`, `Termin: ${slotField.value || 'k. A.'}`, `Name: ${name}`, `Ordination: ${d.get('ordination') || 'k. A.'}`, `E-Mail: ${email}`, `Telefon: ${d.get('telefon') || 'k. A.'}`, `Praxisprogramm: ${d.get('pvs') || 'k. A.'}`, '', String(d.get('nachricht') || '')].join('\n');
      window.location.href = `mailto:hallo@tycho.at?subject=${encodeURIComponent('Demo: ' + name)}&body=${encodeURIComponent(body)}`;
    }
    let ics = '';
    if (kindField.value === 'termin') {
      const [hh, mi] = time.split(':').map(Number), s = new Date(day); s.setHours(hh, mi, 0, 0); const e = new Date(s.getTime() + 30 * 60000);
      const z = (x) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      ics = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tycho//Demo//DE', 'BEGIN:VEVENT', `UID:${Date.now()}@tycho.at`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(s)}`, `DTEND:${z(e)}`, 'SUMMARY:Tycho Demo (Video)', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'));
    }
    done.innerHTML = `<h3>Danke, ${name.split(' ')[0]}.</h3><p>${kindField.value === 'termin' ? 'Wir sehen uns am ' + slotField.value + '. Die Einladung kommt an ' + email + '.' : 'Wir rufen Sie innerhalb eines Werktags an.'}</p>` + (ics ? `<a class="btn btn--line" href="${ics}" download="tycho-demo.ics">In den Kalender eintragen</a>` : '');
    form.classList.add('form--sent');
  });
})();
