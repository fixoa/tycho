const eur = new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const eur2 = new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
const num = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const pct = new Intl.NumberFormat('de-AT', { style: 'percent', maximumFractionDigits: 0 })
const pct1 = new Intl.NumberFormat('de-AT', { style: 'percent', maximumFractionDigits: 1 })

export const fmt = {
  eur: (v: number) => eur.format(v),
  eur2: (v: number) => eur2.format(v),
  num: (v: number) => num.format(v),
  num1: (v: number) => num1.format(v),
  pct: (v: number) => pct.format(v),
  pct1: (v: number) => pct1.format(v),
  k: (v: number) => (Math.abs(v) >= 1000 ? `${num1.format(v / 1000)} k` : num.format(v)),
  date: (d: Date) => d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  dateShort: (d: Date) => d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' }),
  weekday: (d: Date) => d.toLocaleDateString('de-AT', { weekday: 'short' }),
  time: (d: Date) => d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }),
  minutes: (m: number) => {
    const h = Math.floor(m / 60)
    const mm = Math.round(m % 60)
    return h > 0 ? `${h} h ${mm.toString().padStart(2, '0')} min` : `${mm} min`
  },
  signed: (v: number, f: (n: number) => string = (n) => num.format(n)) => (v > 0 ? `+${f(v)}` : f(v)),
}

export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
