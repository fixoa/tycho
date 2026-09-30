/* Tycho Landingpage · Interaktion. Keine externen Abhängigkeiten. */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  /* Navigation */
  const nav = document.querySelector('.nav')
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24)
  addEventListener('scroll', onScroll, { passive: true }); onScroll()
  const burger = document.querySelector('.burger'), mm = document.querySelector('.mobile-menu')
  if (burger && mm) { burger.addEventListener('click', () => { mm.hidden = !mm.hidden }); mm.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { mm.hidden = true })) }

  /* Videos: lokale Datei zuerst, sonst Higgsfield-Render; beim Abspielen einblenden, sonst bleibt der Canvas-/Diagramm-Fallback */
  document.querySelectorAll('video[data-hero], video[data-panel]').forEach((v) => {
    v.addEventListener('canplay', () => v.classList.add('on'))
    v.addEventListener('error', () => v.classList.remove('on'), true)
  })

  /* Reveal beim Scrollen */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' })
  document.querySelectorAll('.rv').forEach((el) => io.observe(el))

  /* Hero-Kugel (Fallback und Untergrund) */
  const canvas = document.getElementById('globe')
  if (canvas) {
    const ctx = canvas.getContext('2d')
    let w = 0, h = 0, raf = 0
    const resize = () => { const dpr = Math.min(2, devicePixelRatio || 1); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize(); addEventListener('resize', resize)
    let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
    const dots = Array.from({ length: 900 }, () => ({ a: rnd() * Math.PI * 2, r: 1.02 + rnd() * 0.16, s: 0.6 + rnd() * 1.4, w: 0.002 + rnd() * 0.006, c: rnd() < 0.08 ? '#F43F5E' : rnd() < 0.5 ? '#2DD4BF' : rnd() < 0.7 ? '#38BDF8' : '#ffffff' }))
    const t0 = performance.now()
    const draw = (now) => {
      const t = reduced ? 0 : (now - t0) / 1000
      const cx = w * 0.5, cy = h * 1.25, R = Math.max(w * 0.62, h * 1.1)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#243342'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
      const rim = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.01); rim.addColorStop(0, 'rgba(45,212,191,0)'); rim.addColorStop(0.9, 'rgba(45,212,191,0.10)'); rim.addColorStop(1, 'rgba(45,212,191,0.45)')
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R * 1.01, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(160,190,215,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()
      // Breitenlinien
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.55 + i * 40, R * (0.55 + i * 0.05), 14 + i * 5, 0, 0, Math.PI * 2); ctx.stroke() }
      // Sweep
      if (!reduced) { const a = (t * Math.PI * 2) / 40; const g = ctx.createConicGradient(a, cx, cy); g.addColorStop(0, 'rgba(45,212,191,0.10)'); g.addColorStop(0.06, 'rgba(45,212,191,0)'); g.addColorStop(1, 'rgba(45,212,191,0)'); ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); ctx.restore() }
      // Gürtel
      for (const d of dots) { const a = d.a + t * d.w; const x = cx + Math.cos(a) * R * d.r, y = cy + Math.sin(a) * R * d.r * 0.36 - R * 0.02; if (y > cy) continue; ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(a)); ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(x, y, d.s, 0, Math.PI * 2); ctx.fill() }
      ctx.globalAlpha = 1
      if (!reduced) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
  }

  /* Uhr in der Telemetrie */
  const clock = document.getElementById('clock')
  if (clock) { const tick = () => { clock.textContent = new Date().toLocaleString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) }; tick(); setInterval(tick, 1000) }

  /* Funktionsweise: Schritte und Diagramm synchron */
  const steps = [...document.querySelectorAll('.step')]
  const flows = [...document.querySelectorAll('.diagram [data-step]')]
  let cur = 0, timer = 0
  const setStep = (i) => { cur = i; steps.forEach((s, k) => s.classList.toggle('on', k === i)); flows.forEach((f) => f.classList.toggle('on', f.dataset.step.split(' ').includes(String(i)))) }
  if (steps.length) {
    setStep(0)
    steps.forEach((s, i) => s.addEventListener('click', () => { setStep(i); clearInterval(timer); timer = setInterval(next, 4200) }))
    const next = () => setStep((cur + 1) % steps.length)
    if (!reduced) timer = setInterval(next, 4200)
  }

  /* Abgekapselt: Pakete prallen an der Wand ab */
  const pk = document.getElementById('packets')
  if (pk && !reduced) {
    const paths = pk.querySelectorAll('circle')
    let k = 0
    setInterval(() => { paths.forEach((c, i) => c.classList.toggle('go', i === k % paths.length)); k++ }, 1400)
  }

  /* Score-Ring + Balken */
  const ring = document.querySelector('.ring .fgc'), val = document.querySelector('.ring .val'), bars = [...document.querySelectorAll('.bars .t i')]
  if (ring) {
    const target = 76
    const io2 = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; io2.disconnect()
      ring.style.strokeDashoffset = String(502 - (502 * target) / 100)
      bars.forEach((b) => { b.style.width = b.dataset.w + '%' })
      if (reduced) { val.textContent = String(target); return }
      const s = performance.now(); const step = (n) => { const p = Math.min(1, (n - s) / 1500); val.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step) }; requestAnimationFrame(step)
    }, { threshold: 0.4 })
    io2.observe(ring.closest('section'))
  }

  /* Beweiskette: Häkchen nacheinander */
  const chain = document.querySelector('.chain')
  if (chain) {
    const io3 = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; io3.disconnect(); [...chain.children].forEach((c, i) => setTimeout(() => c.classList.add('on'), reduced ? 0 : 250 + i * 320)) }, { threshold: 0.3 })
    io3.observe(chain)
  }

  /* Roadmap: Linie füllt sich, Meilensteine leuchten */
  const rm = document.querySelector('.roadmap')
  if (rm) {
    const io4 = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; io4.disconnect(); rm.querySelector('.track i').style.width = '100%'; [...rm.querySelectorAll('li')].forEach((li, i) => setTimeout(() => li.classList.add('on'), reduced ? 0 : 200 + i * 380)) }, { threshold: 0.3 })
    io4.observe(rm)
  }

  /* Booking: Kalender, Slots, Formular (Netlify Forms) */
  const cal = document.getElementById('cal')
  if (cal) {
    const monthLabel = cal.querySelector('.m'), days = cal.querySelector('.days'), slotsEl = document.getElementById('slots'), pick = document.getElementById('pick'), slotField = document.getElementById('slot')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let view = new Date(today.getFullYear(), today.getMonth(), 1), selDay = null, selTime = null
    const fmtD = (d) => d.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    const hash = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h }
    const taken = (d, t) => hash(d.toDateString() + t) % 5 === 0 // deterministische Demo-Belegung
    const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
    const max = new Date(today); max.setDate(max.getDate() + 42)
    const render = () => {
      monthLabel.textContent = view.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' })
      days.innerHTML = ''
      for (const d of ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']) { const s = document.createElement('span'); s.className = 'd'; s.textContent = d; days.appendChild(s) }
      const first = new Date(view), offset = (first.getDay() + 6) % 7
      for (let i = 0; i < offset; i++) days.appendChild(document.createElement('span'))
      const n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= n; i++) {
        const d = new Date(view.getFullYear(), view.getMonth(), i)
        const b = document.createElement('button'); b.type = 'button'; b.textContent = String(i)
        const wk = d.getDay() === 0 || d.getDay() === 6
        b.disabled = wk || d < today || d > max
        if (d.getTime() === today.getTime()) b.classList.add('today')
        if (selDay && d.getTime() === selDay.getTime()) b.classList.add('on')
        b.addEventListener('click', () => { selDay = d; selTime = null; render(); renderSlots() })
        days.appendChild(b)
      }
      cal.querySelector('.prev').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1)
      cal.querySelector('.next').disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > max
    }
    const renderSlots = () => {
      slotsEl.innerHTML = ''
      if (!selDay) { const s = document.createElement('div'); s.className = 'none'; s.textContent = 'Bitte zuerst einen Tag wählen.'; slotsEl.appendChild(s); return }
      TIMES.forEach((t) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.disabled = taken(selDay, t); if (selTime === t) b.classList.add('on'); b.addEventListener('click', () => { selTime = t; renderSlots(); updatePick() }); slotsEl.appendChild(b) })
    }
    const updatePick = () => { if (selDay && selTime) { const s = `${fmtD(selDay)} · ${selTime} Uhr (30 min, Video)`; pick.innerHTML = `<b>Termin</b> ${s}`; slotField.value = s } }
    cal.querySelector('.prev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render() })
    cal.querySelector('.next').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render() })
    render(); renderSlots()

    // Art der Anfrage
    const kinds = document.querySelectorAll('.kind button'), kindField = document.getElementById('kind')
    kinds.forEach((b) => b.addEventListener('click', () => { kinds.forEach((x) => x.classList.toggle('on', x === b)); kindField.value = b.dataset.kind; document.getElementById('calwrap').hidden = b.dataset.kind !== 'termin' }))

    // Absenden (Netlify Forms per AJAX), Bestätigung im Formular, ICS-Datei
    const form = document.getElementById('booking-form'), done = document.getElementById('done'), err = document.getElementById('err')
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); err.textContent = ''
      if (kindField.value === 'termin' && !(selDay && selTime)) { err.textContent = 'Bitte einen Tag und eine Uhrzeit wählen.'; return }
      const data = new FormData(form)
      try {
        const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() })
        if (!r.ok && r.status !== 404) throw new Error(String(r.status))
      } catch (ex) { /* lokal ohne Netlify: Bestätigung trotzdem zeigen */ }
      form.querySelector('.fields').hidden = true; done.hidden = false
      done.querySelector('.sum').textContent = kindField.value === 'termin' ? `${data.get('name')}, wir sehen uns am ${slotField.value}. Die Einladung kommt an ${data.get('email')}.` : `${data.get('name')}, wir melden uns innerhalb eines Werktags an ${data.get('email')}.`
      const ics = document.getElementById('ics')
      if (kindField.value === 'termin' && selDay && selTime) {
        const [hh, mi] = selTime.split(':').map(Number); const s = new Date(selDay); s.setHours(hh, mi, 0, 0); const en = new Date(s.getTime() + 30 * 60000)
        const z = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
        const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tycho//Demo//DE', 'BEGIN:VEVENT', `UID:${Date.now()}@tycho.demo`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(s)}`, `DTEND:${z(en)}`, 'SUMMARY:Tycho Demo (Video)', 'DESCRIPTION:Produktdemo Tycho – Kontrollinstanz für Ordinationen', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
        ics.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body); ics.hidden = false
      } else ics.hidden = true
      done.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    })
  }
})()
