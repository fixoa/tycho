import { demo, DATA_AS_OF, QUARTER } from './mock'
import { STAFF } from './staff'
import { isoWeek } from '../lib/format'
import type { DayRecord } from './types'

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

export interface WeekPoint { week: number; label: string; start: string; [k: string]: number | string }

/** Aggregiert Tagesdaten zu Kalenderwochen. */
export function weekly(records: DayRecord[], pick: (rs: DayRecord[]) => Record<string, number>): WeekPoint[] {
  const groups = new Map<string, DayRecord[]>()
  for (const r of records) {
    const d = new Date(r.date)
    const key = `${d.getFullYear()}-${isoWeek(d).toString().padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, rs]) => {
    const week = Number(key.slice(5))
    const start = rs.map((r) => r.date).sort()[0]
    return { week, label: `KW ${week}`, start, ...pick(rs) }
  })
}

export const practiceWeekly = () =>
  weekly(demo().records, (rs) => ({
    contacts: sum(rs.map((r) => r.patientContacts)),
    telemed: sum(rs.map((r) => r.telemedConsults)),
    revenue: sum(rs.map((r) => r.servicesValue)),
    calls: sum(rs.map((r) => r.callsHandled)),
    savedMin: sum(rs.map((r) => r.dictationSavedMin)),
    noShows: sum(rs.map((r) => r.noShows)),
    appointments: sum(rs.map((r) => r.appointments)),
    wait: (() => { const w = rs.filter((r) => r.waitTimeAvgMin > 0 && STAFF.find((s) => s.id === r.staffId)?.role === 'assistenz'); return w.length ? sum(w.map((r) => r.waitTimeAvgMin)) / w.length : 0 })(),
  }))

export function quarterToDate() {
  const recs = demo().records.filter((r) => new Date(r.date) >= QUARTER.start && new Date(r.date) <= DATA_AS_OF)
  const byRole = (role: string) => recs.filter((r) => STAFF.find((s) => s.id === r.staffId)?.role === role)
  const doctors = byRole('arzt')
  return {
    contacts: sum(doctors.map((r) => r.patientContacts)),
    telemed: sum(doctors.map((r) => r.telemedConsults)),
    revenue: sum(recs.map((r) => r.servicesValue)),
    savedMin: sum(recs.map((r) => r.dictationSavedMin)),
    appointments: sum(doctors.map((r) => r.appointments)),
    noShows: sum(doctors.map((r) => r.noShows)),
    calls: sum(recs.map((r) => r.callsHandled)),
    wait: (() => { const w = byRole('assistenz').filter((r) => r.waitTimeAvgMin > 0); return w.length ? sum(w.map((r) => r.waitTimeAvgMin)) / w.length : 0 })(),
  }
}

export function lastNDays(n: number) {
  const dates = [...new Set(demo().records.map((r) => r.date))].sort()
  const keep = new Set(dates.slice(-n))
  return demo().records.filter((r) => keep.has(r.date))
}

/** Vergleich zweier 4-Wochen-Fenster auf Praxisebene */
export function compareWindows(days = 20) {
  const dates = [...new Set(demo().records.map((r) => r.date))].sort()
  const cur = new Set(dates.slice(-days))
  const prev = new Set(dates.slice(-2 * days, -days))
  const agg = (set: Set<string>) => {
    const rs = demo().records.filter((r) => set.has(r.date))
    const doctors = rs.filter((r) => STAFF.find((s) => s.id === r.staffId)?.role === 'arzt')
    const assist = rs.filter((r) => STAFF.find((s) => s.id === r.staffId)?.role === 'assistenz' && r.waitTimeAvgMin > 0)
    const contacts = sum(doctors.map((r) => r.patientContacts))
    return {
      contacts,
      revenue: sum(rs.map((r) => r.servicesValue)),
      telemedShare: contacts ? sum(doctors.map((r) => r.telemedConsults)) / contacts : 0,
      savedMin: sum(rs.map((r) => r.dictationSavedMin)),
      noShowRate: (() => { const a = sum(doctors.map((r) => r.appointments)); return a ? sum(doctors.map((r) => r.noShows)) / a : 0 })(),
      wait: assist.length ? sum(assist.map((r) => r.waitTimeAvgMin)) / assist.length : 0,
      calls: sum(rs.map((r) => r.callsHandled)),
    }
  }
  return { cur: agg(cur), prev: agg(prev) }
}
