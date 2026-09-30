import { useEffect, useRef } from 'react'

// Gotham-Hero: nah gesehene Erdkugel, dunkle Landmassen mit feinen Grenzen, dichter
// Punktgürtel (oliv/rot/türkis/weiß), statische Tracking-Marker, sehr langsame Drehung.
// Dazu: zwei feine Orbits mit langsam wandernden Satelliten, ein ruhiger Radar-Sweep,
// minimale Parallaxe zur Maus. Alles lokal im Canvas – keine externen Assets.

type V3 = [number, number, number]
const DEG = Math.PI / 180

const LAND: [number, number][][] = [
  [[-168, 66], [-140, 70], [-95, 75], [-60, 60], [-55, 47], [-75, 35], [-80, 25], [-97, 20], [-105, 22], [-120, 33], [-125, 48], [-150, 60]],
  [[-80, 10], [-60, 8], [-50, 0], [-35, -8], [-40, -22], [-52, -33], [-68, -52], [-75, -45], [-72, -20], [-80, -5]],
  [[-10, 36], [-10, 45], [0, 50], [5, 58], [20, 70], [40, 70], [45, 55], [40, 45], [30, 42], [20, 38], [10, 38], [0, 37]],
  [[-17, 15], [-5, 35], [10, 37], [32, 31], [43, 12], [51, 12], [40, -5], [35, -25], [20, -35], [12, -20], [8, 5], [-10, 5], [-17, 8]],
  [[40, 45], [45, 55], [60, 70], [100, 75], [140, 72], [180, 68], [160, 60], [140, 50], [120, 35], [110, 20], [100, 10], [105, 2], [95, 15], [80, 10], [75, 20], [60, 25], [50, 30], [45, 40]],
  [[114, -22], [130, -12], [142, -11], [153, -25], [150, -38], [135, -35], [115, -34]],
  [[-55, 60], [-20, 70], [-20, 82], [-60, 82], [-70, 75]],
  [[-180, -70], [180, -70], [180, -90], [-180, -90]],
]
const BORDERS: [number, number][][] = [
  [[-10, 43], [3, 43]], [[8, 47], [17, 47]], [[9, 47], [13, 46], [14, 44]], [[14, 55], [24, 55], [24, 50], [22, 48]], [[30, 52], [40, 52]], [[26, 42], [40, 42]],
  [[33, 31], [35, 33], [42, 37]], [[36, 30], [50, 30]], [[44, 28], [56, 25]], [[60, 25], [62, 35], [70, 37]], [[73, 36], [78, 35], [88, 27]], [[35, 22], [25, 22]], [[25, 22], [25, 32]],
  [[-100, 49], [-125, 49]], [[-117, 32], [-97, 26]], [[70, 37], [90, 48], [120, 50]], [[100, 22], [108, 22]], [[45, 40], [47, 46], [40, 45]],
]

function inPoly(lon: number, lat: number, poly: [number, number][]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const isLand = (lon: number, lat: number) => LAND.some((p) => inPoly(lon, lat, p))
function ll(lon: number, lat: number, r = 1): V3 {
  const la = lat * DEG, lo = lon * DEG
  return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)]
}
const rotY = ([x, y, z]: V3, a: number): V3 => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]
const rotX = ([x, y, z]: V3, a: number): V3 => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]

interface Dot { v: V3; r: number; c: string; s: number; w: number }
const PALETTE = {
  dark: {
    body: '#0c1014', land: '#1f262d', coast: 'rgba(96,110,124,0.7)', border: 'rgba(96,110,124,0.5)', rimA: 'rgba(120,150,180,0)', rimB: 'rgba(120,150,180,0.14)', rimC: 'rgba(120,150,180,0.5)',
    edge: 'rgba(160,190,215,0.35)', marker: 'rgba(200,210,220,0.55)', markerFill: 'rgba(200,210,220,0.8)', text: 'rgba(230,232,234,0.7)', orbit: 'rgba(160,190,215,0.22)', sat: '#e6e8ea', sweep: 'rgba(79,179,168,',
    belt: ['#b9bb5f', '#b9bb5f', '#b9bb5f', '#b9bb5f', '#c9cb6e', '#d64545', '#d64545', '#4fb3a8', '#e6e8ea', '#e6e8ea'], surface: ['#d64545', '#b9bb5f', '#4fb3a8'], vignette: 'rgba(0,0,0,0.55)',
  },
  light: {
    body: '#f1f2f4', land: '#d7dae0', coast: 'rgba(120,128,140,0.55)', border: 'rgba(120,128,140,0.35)', rimA: 'rgba(47,111,228,0)', rimB: 'rgba(47,111,228,0.06)', rimC: 'rgba(47,111,228,0.28)',
    edge: 'rgba(47,111,228,0.25)', marker: 'rgba(47,111,228,0.5)', markerFill: 'rgba(47,111,228,0.8)', text: 'rgba(23,24,26,0.6)', orbit: 'rgba(47,111,228,0.18)', sat: '#2f6fe4', sweep: 'rgba(47,111,228,',
    belt: ['#9aa3b2', '#9aa3b2', '#b9c0cc', '#2f6fe4', '#2f6fe4', '#e64a5f', '#1fb37a', '#8f8f95', '#c9cfd8', '#c9cfd8'], surface: ['#e64a5f', '#2f6fe4', '#1fb37a'], vignette: 'rgba(246,246,247,0.7)',
  },
}

function seeded(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

export default function Globe({ className = '', palette = 'dark', parallax = true }: { className?: string; palette?: 'dark' | 'light'; parallax?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const P = PALETTE[palette]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0, w = 0, h = 0
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(canvas)
    const rnd = seeded(7)

    // Landpunkte (dicht)
    const N = 14000
    const land: V3[] = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i
      const x = Math.cos(th) * rad, z = Math.sin(th) * rad
      if (isLand(Math.atan2(-z, x) / DEG, Math.asin(y) / DEG)) land.push([x, y, z])
    }
    // Punktgürtel im Orbit + Oberflächen-Cluster
    const belt: Dot[] = []
    for (let i = 0; i < 2600; i++) {
      const lat = (rnd() - 0.5) * 70 + (rnd() < 0.5 ? 20 : -5), lon = rnd() * 360 - 180
      belt.push({ v: ll(lon, lat), r: 1.03 + rnd() * 0.14, c: P.belt[Math.floor(rnd() * P.belt.length)], s: 0.8 + rnd() * 1.6, w: 0.004 + rnd() * 0.01 })
    }
    const surface: Dot[] = []
    for (let i = 0; i < 700; i++) {
      const near = rnd() < 0.5
      const lat = near ? 30 + rnd() * 30 : rnd() * 140 - 60, lon = near ? rnd() * 60 : rnd() * 360 - 180
      const c = rnd() < 0.25 ? P.surface[0] : rnd() < 0.7 ? P.surface[1] : P.surface[2]
      surface.push({ v: ll(lon, lat), r: 1.002, c, s: 0.9 + rnd() * 1.4, w: 0 })
    }
    const markers = [
      { lon: 16.37, lat: 48.2, kind: 'ring' as const, label: 'WIEN 21' }, { lon: 24, lat: 46, kind: 'box' as const }, { lon: 35, lat: 39, kind: 'box' as const }, { lon: 45, lat: 34, kind: 'ring' as const },
      { lon: 55, lat: 25, kind: 'box' as const }, { lon: 8, lat: 52, kind: 'box' as const }, { lon: -3, lat: 40, kind: 'box' as const }, { lon: 30, lat: 27, kind: 'ring' as const }, { lon: 69, lat: 41, kind: 'box' as const },
    ]
    // Orbits: Neigung, Radius, Phase, Winkelgeschwindigkeit (rad/s – bewusst sehr langsam)
    const orbits = [
      { incl: 62 * DEG, node: 0.4, r: 1.11, sats: [0, 2.1, 4.2], w: 0.045 },
      { incl: 28 * DEG, node: 2.2, r: 1.19, sats: [1.0, 3.9], w: -0.03 },
    ]

    // Parallaxe: Ziel/aktuell, weich nachgeführt
    let tx = 0, ty = 0, px = 0, py = 0
    const onMove = (e: MouseEvent) => { tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2 }
    if (parallax && !reduced) window.addEventListener('mousemove', onMove)

    const t0 = performance.now()
    const draw = (now: number) => {
      const t = reduced ? 0 : (now - t0) / 1000
      px += (tx - px) * 0.02; py += (ty - py) * 0.02
      const wide = w >= 1024
      const cx = w * 0.5 + px * -6, cy = (wide ? h * 1.22 : h * 1.3) + py * -4
      const R = wide ? Math.max(w * 0.6, h * 1.12) : Math.max(w * 0.95, h * 0.95)
      const spin = -0.55 + t * 0.006 + px * 0.012 // Europa/Nahost im Blick, sehr langsam
      const tilt = -38 * DEG + py * 0.01 // Blick von schräg oben
      const proj = (v: V3, r = 1): [number, number, number] => {
        const p = rotX(rotY(v, spin), tilt)
        return [cx + p[0] * R * r, cy - p[1] * R * r, p[2]]
      }
      ctx.clearRect(0, 0, w, h)
      // Erdkörper + Randlicht (atmet minimal)
      const breathe = 1 + 0.06 * Math.sin(t * 0.35)
      ctx.fillStyle = P.body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
      const rim = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * (1 + 0.012 * breathe))
      rim.addColorStop(0, P.rimA); rim.addColorStop(0.85, P.rimB); rim.addColorStop(1, P.rimC)
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R * (1 + 0.012 * breathe), 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = P.edge; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()

      // Land (Punkte), Küsten und Grenzen (feine Linien)
      ctx.fillStyle = P.land
      for (const v of land) { const [x, y, z] = proj(v); if (z < 0.02 || y < -10 || y > h + 10) continue; ctx.fillRect(x - 1.3, y - 1.3, 2.6, 2.6) }
      ctx.strokeStyle = P.coast; ctx.lineWidth = 0.9
      const poly = (pl: [number, number][], close: boolean) => {
        ctx.beginPath(); let first = true
        for (let i = 0; i < pl.length + (close ? 1 : 0); i++) {
          const [lon, lat] = pl[i % pl.length]; const [x, y, z] = proj(ll(lon, lat))
          if (z < 0.02) { first = true; continue }
          if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      for (const p of LAND.slice(0, 7)) poly(p, true)
      ctx.strokeStyle = P.border
      for (const b of BORDERS) poly(b, false)

      // Radar-Sweep über der Kugel: schmaler, sehr transparenter Sektor, eine Umdrehung in ~40 s
      if (!reduced) {
        const a = (t * (Math.PI * 2)) / 40
        const g = ctx.createConicGradient(a, cx, cy)
        g.addColorStop(0, P.sweep + '0.10)'); g.addColorStop(0.06, P.sweep + '0)'); g.addColorStop(1, P.sweep + '0)')
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); ctx.restore()
      }

      // Oberflächen-Cluster
      for (const d of surface) { const [x, y, z] = proj(d.v, d.r); if (z < 0.03) continue; ctx.fillStyle = d.c; ctx.globalAlpha = 0.55 + 0.45 * z; ctx.beginPath(); ctx.arc(x, y, d.s, 0, Math.PI * 2); ctx.fill() }
      ctx.globalAlpha = 1
      // Tracking-Marker (Ring am Standort pulsiert kaum merklich)
      ctx.lineWidth = 1
      for (const m of markers) {
        const [x, y, z] = proj(ll(m.lon, m.lat), 1.003); if (z < 0.05) continue
        ctx.strokeStyle = P.marker
        if (m.kind === 'box') { ctx.strokeRect(x - 7, y - 7, 14, 14); ctx.fillStyle = P.markerFill; ctx.fillRect(x - 1.5, y - 1.5, 3, 3) }
        else {
          const k = m.label ? 1 + 0.05 * Math.sin(t * 1.2) : 1
          ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.ellipse(x, y, 34 * k, 22 * k, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.strokeRect(x - 6, y - 6, 12, 12)
        }
        if (m.label) { ctx.fillStyle = P.text; ctx.font = '500 10px Inter, system-ui, sans-serif'; ctx.fillText(m.label, x + 12, y - 10) }
      }
      // Orbits + Satelliten (vor der Kugel voll, dahinter ausgeblendet)
      ctx.setLineDash([2, 6]); ctx.lineWidth = 0.8
      for (const o of orbits) {
        const pt = (ph: number): [number, number, number] => proj(rotY(rotX([Math.cos(ph), 0, Math.sin(ph)], o.incl), o.node), o.r)
        ctx.strokeStyle = P.orbit; ctx.beginPath(); let first = true
        for (let i = 0; i <= 180; i++) {
          const [x, y, z] = pt((i / 180) * Math.PI * 2)
          const behind = z < 0 && Math.hypot(x - cx, y - cy) < R
          if (behind) { first = true; continue }
          if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
        }
        ctx.stroke()
        for (const s of o.sats) {
          const [x, y, z] = pt(s + t * o.w)
          if (z < 0 && Math.hypot(x - cx, y - cy) < R) continue
          ctx.fillStyle = P.sat; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = P.orbit; ctx.setLineDash([]); ctx.strokeRect(x - 5, y - 5, 10, 10); ctx.setLineDash([2, 6])
        }
      }
      ctx.setLineDash([])
      // Punktgürtel (Orbit), sehr langsam
      for (const d of belt) {
        const v = rotY(d.v, t * d.w)
        const [x, y, z] = proj(v, d.r)
        const dist = Math.hypot(x - cx, y - cy)
        const behind = z < 0 && dist < R
        if (behind || y < -10 || y > h + 10) continue
        const edge = dist >= R ? 1 : Math.max(0, 1 - (R - dist) / (R * 0.22))
        if (edge <= 0.02) continue
        ctx.fillStyle = d.c; ctx.globalAlpha = 0.25 + 0.75 * edge
        ctx.beginPath(); ctx.arc(x, y, d.s, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
      // Vignette
      const vg = ctx.createRadialGradient(cx, h * 0.5, h * 0.2, cx, h * 0.5, Math.max(w, h))
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, P.vignette)
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h)
      if (!reduced) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('mousemove', onMove) }
  }, [palette, parallax])
  return <canvas ref={ref} className={className} aria-hidden />
}
