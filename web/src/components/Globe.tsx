import { useEffect, useRef } from 'react'

// Gepunkteter Globus mit Kontinenten, Gradnetz, Satelliten auf geneigten Bahnen,
// Scan-Strahlen und Zielmarker. Canvas 2D mit eigener 3D-Projektion – keine Abhängigkeiten.

type V3 = [number, number, number]
const DEG = Math.PI / 180

// Grobe Kontinentumrisse (Lon, Lat) – rein für die Optik.
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
const rotZ = ([x, y, z]: V3, a: number): V3 => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]

interface Sat { r: number; inc: number; node: number; speed: number; phase: number; hue: string }
const SATS: Sat[] = [
  { r: 1.32, inc: 52, node: 0, speed: 0.55, phase: 0, hue: '#48aff0' },
  { r: 1.45, inc: 98, node: 60, speed: 0.42, phase: 2.1, hue: '#3dcc91' },
  { r: 1.6, inc: 28, node: 130, speed: 0.33, phase: 4.0, hue: '#48aff0' },
  { r: 1.38, inc: 75, node: 200, speed: 0.5, phase: 1.2, hue: '#ffb366' },
  { r: 1.52, inc: 63, node: 280, speed: 0.38, phase: 3.3, hue: '#48aff0' },
  { r: 1.7, inc: 15, node: 330, speed: 0.27, phase: 5.1, hue: '#bfccd6' },
]
const TARGETS = [
  { lon: 16.37, lat: 48.2, label: 'ORDINATION · WIEN 21', primary: true },
  { lon: -74, lat: 40.7, label: 'NYC' }, { lon: 139.7, lat: 35.7, label: 'TYO' }, { lon: 28.2, lat: -25.7, label: 'PTA' }, { lon: -46.6, lat: -23.5, label: 'SAO' }, { lon: 77.2, lat: 28.6, label: 'DEL' },
]

export default function Globe({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0, w = 0, h = 0, dpr = 1
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(canvas)

    // Punktwolke (Fibonacci-Sphäre), Land vs. Wasser
    const N = 4200
    const pts: { v: V3; land: boolean }[] = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const rad = Math.sqrt(1 - y * y)
      const th = golden * i
      const x = Math.cos(th) * rad, z = Math.sin(th) * rad
      const lat = Math.asin(y) / DEG, lon = Math.atan2(-z, x) / DEG
      pts.push({ v: [x, y, z], land: isLand(lon, lat) })
    }

    const t0 = performance.now()
    const draw = (now: number) => {
      const t = reduced ? 0 : (now - t0) / 1000
      const cx = w >= 1024 ? w * 0.52 : w * 0.5, cy = h * 0.5
      const R = Math.min(w, h) * (w >= 1024 ? 0.36 : 0.3)
      const spin = t * 0.08
      const tilt = 23 * DEG
      const proj = (v: V3): [number, number, number] => {
        const p = rotX(rotY(v, spin), tilt)
        return [cx + p[0] * R, cy - p[1] * R, p[2]]
      }
      ctx.clearRect(0, 0, w, h)

      // Atmosphäre
      const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35)
      glow.addColorStop(0, 'rgba(72,175,240,0.16)'); glow.addColorStop(0.5, 'rgba(72,175,240,0.04)'); glow.addColorStop(1, 'rgba(72,175,240,0)')
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(16,22,26,0.85)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()

      // Gradnetz
      ctx.lineWidth = 0.6
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath(); let first = true
        for (let lon = -180; lon <= 180; lon += 4) {
          const [x, y, z] = proj(ll(lon, lat))
          if (z < -0.02) { first = true; continue }
          if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = 'rgba(138,155,168,0.18)'; ctx.stroke()
      }
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath(); let first = true
        for (let lat = -90; lat <= 90; lat += 4) {
          const [x, y, z] = proj(ll(lon, lat))
          if (z < -0.02) { first = true; continue }
          if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = 'rgba(138,155,168,0.14)'; ctx.stroke()
      }

      // Punkte
      for (const p of pts) {
        const [x, y, z] = proj(p.v)
        if (z < 0) continue
        const a = 0.25 + 0.75 * z
        if (p.land) { ctx.fillStyle = `rgba(140,205,255,${a})`; ctx.fillRect(x - 1, y - 1, 2, 2) }
        else { ctx.fillStyle = `rgba(92,112,128,${a * 0.45})`; ctx.fillRect(x - 0.5, y - 0.5, 1, 1) }
      }

      // Terminator-Schatten
      const shade = ctx.createLinearGradient(cx - R, cy, cx + R, cy)
      shade.addColorStop(0, 'rgba(16,22,26,0.55)'); shade.addColorStop(0.45, 'rgba(16,22,26,0)'); shade.addColorStop(1, 'rgba(16,22,26,0)')
      ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(72,175,240,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()

      // Zielmarker
      ctx.font = '10px "JetBrains Mono", ui-monospace, monospace'
      for (const tg of TARGETS) {
        const [x, y, z] = proj(ll(tg.lon, tg.lat, 1.005))
        if (z < 0.05) continue
        const pulse = (((t * 1.2 + tg.lon / 37) % 1) + 1) % 1
        const col = tg.primary ? '#ffb366' : '#48aff0'
        ctx.strokeStyle = col; ctx.lineWidth = 1
        ctx.globalAlpha = 1 - pulse; ctx.beginPath(); ctx.arc(x, y, 4 + pulse * 14, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill()
        if (tg.primary) {
          ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 4, y); ctx.moveTo(x + 4, y); ctx.lineTo(x + 10, y); ctx.moveTo(x, y - 10); ctx.lineTo(x, y - 4); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 10); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x + 26, y - 26); ctx.lineTo(x + 150, y - 26); ctx.stroke()
          ctx.fillStyle = col; ctx.fillText(tg.label, x + 30, y - 30)
          ctx.fillStyle = 'rgba(191,204,214,0.8)'; ctx.fillText(`${tg.lat.toFixed(2)}N ${tg.lon.toFixed(2)}E · LOCK`, x + 30, y - 18)
        } else {
          ctx.fillStyle = 'rgba(191,204,214,0.55)'; ctx.fillText(tg.label, x + 7, y + 3)
        }
      }

      // Satelliten: Bahn, Spur, Körper, Scan-Strahl
      for (const s of SATS) {
        const orbit = (ang: number): V3 => rotY(rotX(rotZ([Math.cos(ang) * s.r, Math.sin(ang) * s.r, 0], 0), s.inc * DEG), s.node * DEG)
        ctx.beginPath(); ctx.lineWidth = 0.7
        for (let a = 0; a <= 360; a += 3) {
          const [x, y, z] = proj(orbit(a * DEG))
          const behind = z < 0 && Math.hypot(x - cx, y - cy) < R
          if (behind) { ctx.stroke(); ctx.beginPath(); continue }
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = 'rgba(138,155,168,0.22)'; ctx.stroke()
        const ang = s.phase + t * s.speed
        // Spur
        for (let k = 40; k >= 1; k--) {
          const [x, y, z] = proj(orbit(ang - k * 0.035))
          if (z < 0 && Math.hypot(x - cx, y - cy) < R) continue
          ctx.fillStyle = s.hue; ctx.globalAlpha = (1 - k / 40) * 0.6; ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
        }
        ctx.globalAlpha = 1
        const [x, y, z] = proj(orbit(ang))
        const hidden = z < 0 && Math.hypot(x - cx, y - cy) < R
        if (hidden) continue
        // Scan-Strahl zum Fußpunkt
        const foot = orbit(ang); const n = Math.hypot(...foot)
        const [fx, fy, fz] = proj([foot[0] / n, foot[1] / n, foot[2] / n])
        if (fz > 0) {
          const g = ctx.createLinearGradient(x, y, fx, fy); g.addColorStop(0, s.hue + 'aa'); g.addColorStop(1, s.hue + '00')
          ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(fx, fy); ctx.stroke()
          const sweep = (t * 0.9 + s.phase) % 1
          ctx.strokeStyle = s.hue; ctx.globalAlpha = 0.5 * (1 - sweep); ctx.beginPath(); ctx.ellipse(fx, fy, 3 + sweep * 12, (3 + sweep * 12) * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1
        }
        ctx.fillStyle = s.hue; ctx.shadowColor = s.hue; ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
        ctx.strokeStyle = s.hue; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x - 3, y); ctx.moveTo(x + 3, y); ctx.lineTo(x + 7, y); ctx.stroke()
      }

      if (!reduced) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} className={className} aria-hidden />
}
