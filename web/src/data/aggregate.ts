import { useMemo } from 'react'
import { demo, DATA_AS_OF, PAYER_SHARE, BILLING_FINDINGS } from './mock'
import { STAFF } from './staff'
import { isoWeek, addDays } from '../lib/format'
import { useFilters, inRange, type Range, type Payer } from '../state/filters'
import { invoices } from './tailwind'
import type { DayRecord, CallDay, DictationDay, Role } from './types'

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0)
const roleOf = (id: string) => STAFF.find((s) => s.id === id)?.role
const teamOf = (id: string) => STAFF.find((s) => s.id === id)?.department

export interface Filter { range: Range; role?: Role | null; team?: string | null; payer?: Payer | null }

/** Umsatzanteil eines Datensatzes für einen Kostenträger */
export const payerFactor = (staffId: string, payer: Payer | null | undefined) => {
  if (!payer) return 1
  const sh = PAYER_SHARE[staffId]
  return sh ? sh[payer] : 0
}

export function filterRecords(f: Filter): DayRecord[] {
  return demo().records.filter((r) => inRange(r.date, f.range) && (!f.role || roleOf(r.staffId) === f.role) && (!f.team || teamOf(r.staffId) === f.team))
}
export const filterCalls = (r: Range): CallDay[] => demo().calls.days.filter((d) => inRange(d.date, r))
export const filterDictation = (r: Range): DictationDay[] => demo().dictation.filter((d) => inRange(d.date, r))

export interface Summary {
  days: number; contacts: number; revenue: number; revenuePerContact: number; contactsPerDay: number; telemedShare: number
  savedMin: number; appointments: number; noShows: number; noShowRate: number; calls: number; wait: number; docCompleteness: number
  revenueByPayer: Record<Payer, number>; ecard: number; privat: number; findingsValue: number
}
export function summarize(recs: DayRecord[], payer?: Payer | null): Summary {
  const days = new Set(recs.map((r) => r.date)).size
  const doctors = recs.filter((r) => roleOf(r.staffId) === 'arzt')
  const contacts = sum(doctors.map((r) => r.patientContacts))
  const revenue = sum(recs.map((r) => r.servicesValue * payerFactor(r.staffId, payer)))
  const byPayer: Record<Payer, number> = { ÖGK: 0, SVS: 0, BVAEB: 0, Privat: 0 }
  for (const r of recs) { const sh = PAYER_SHARE[r.staffId]; if (!sh) continue; (Object.keys(byPayer) as Payer[]).forEach((k) => { byPayer[k] += r.servicesValue * sh[k] }) }
  const assist = recs.filter((r) => roleOf(r.staffId) === 'assistenz' && r.waitTimeAvgMin > 0)
  const appointments = sum(doctors.map((r) => r.appointments)), noShows = sum(doctors.map((r) => r.noShows))
  return {
    days, contacts, revenue, revenuePerContact: contacts ? revenue / contacts : 0, contactsPerDay: days ? contacts / days : 0,
    telemedShare: contacts ? sum(doctors.map((r) => r.telemedConsults)) / contacts : 0,
    savedMin: sum(recs.map((r) => r.dictationSavedMin)), appointments, noShows, noShowRate: appointments ? noShows / appointments : 0,
    calls: sum(recs.map((r) => r.callsHandled)), wait: avg(assist.map((r) => r.waitTimeAvgMin)),
    docCompleteness: avg(recs.filter((r) => r.presenceMin > 0).map((r) => r.docCompleteness)),
    revenueByPayer: byPayer, ecard: byPayer.ÖGK + byPayer.SVS + byPayer.BVAEB, privat: byPayer.Privat,
    findingsValue: BILLING_FINDINGS.filter((f) => f.valueEur > 0).reduce((a, f) => a + f.valueEur, 0),
  }
}

/** Tageswerte für Linien-/Balkendiagramme */
export function daily(recs: DayRecord[], payer?: Payer | null) {
  const map = new Map<string, { date: string; contacts: number; revenue: number; calls: number; saved: number }>()
  for (const r of recs) {
    const row = map.get(r.date) ?? { date: r.date, contacts: 0, revenue: 0, calls: 0, saved: 0 }
    if (roleOf(r.staffId) === 'arzt') row.contacts += r.patientContacts
    row.revenue += r.servicesValue * payerFactor(r.staffId, payer); row.calls += r.callsHandled; row.saved += r.dictationSavedMin
    map.set(r.date, row)
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** Monatswerte über die gesamte Historie (für Balken „Umsatz pro Monat“) */
export function monthly(role?: Role | null, team?: string | null) {
  const map = new Map<string, { month: string; label: string; revenue: number; ÖGK: number; SVS: number; BVAEB: number; Privat: number; contacts: number; findings: number; partial: boolean }>()
  for (const r of demo().records) {
    if ((role && roleOf(r.staffId) !== role) || (team && teamOf(r.staffId) !== team)) continue
    const key = r.date.slice(0, 7)
    const d = new Date(r.date)
    const row = map.get(key) ?? { month: key, label: d.toLocaleDateString('de-AT', { month: 'short', year: d.getMonth() === 0 ? 'numeric' : undefined }), revenue: 0, ÖGK: 0, SVS: 0, BVAEB: 0, Privat: 0, contacts: 0, findings: 0, partial: key === DATA_AS_OF.toISOString().slice(0, 7) }
    const sh = PAYER_SHARE[r.staffId]
    row.revenue += r.servicesValue
    if (sh) { row.ÖGK += r.servicesValue * sh.ÖGK; row.SVS += r.servicesValue * sh.SVS; row.BVAEB += r.servicesValue * sh.BVAEB; row.Privat += r.servicesValue * sh.Privat }
    if (roleOf(r.staffId) === 'arzt') row.contacts += r.patientContacts
    map.set(key, row)
  }
  const rows = [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
  // Liegengelassene Leistungen je Monat (Demo: ~1,1 % des Umsatzes, davon 70 % nachgetragen)
  rows.forEach((r, i) => { r.findings = Math.round(r.revenue * (0.009 + ((i * 7) % 5) * 0.001)) })
  return rows
}

/** Stoßzeiten: Wochentag × Stunde aus Kontakten (Demo-Verteilung) */
export function heatmap(recs: DayRecord[]) {
  const shape = [0.35, 0.95, 1, 0.85, 0.7, 0.45, 0.4, 0.65, 0.75, 0.6, 0.3]
  const byDow = [0, 0, 0, 0, 0, 0, 0]
  for (const r of recs) if (roleOf(r.staffId) === 'arzt') byDow[new Date(r.date).getDay()] += r.patientContacts
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  return days.map((d, i) => ({ day: d, cells: shape.map((s, h) => ({ hour: 8 + h, value: Math.round((byDow[i + 1] / 20) * s * (i === 5 ? 0.15 : 1)) })) }))
}

export function staffRows(recs: DayRecord[], payer?: Payer | null) {
  return STAFF.map((s) => {
    const rs = recs.filter((r) => r.staffId === s.id && r.presenceMin > 0)
    const days = rs.length
    const contacts = sum(rs.map((r) => r.patientContacts)), revenue = sum(rs.map((r) => r.servicesValue * payerFactor(s.id, payer)))
    const presence = sum(rs.map((r) => r.presenceMin))
    return { staff: s, days, contacts, revenue, perDay: days ? revenue / days : 0, contactsPerDay: days ? contacts / days : 0, minPerContact: contacts ? presence / contacts : 0, calls: sum(rs.map((r) => r.callsHandled)), callsPerDay: days ? sum(rs.map((r) => r.callsHandled)) / days : 0, telemed: sum(rs.map((r) => r.telemedConsults)), saved: sum(rs.map((r) => r.dictationSavedMin)), wait: avg(rs.filter((r) => r.waitTimeAvgMin > 0).map((r) => r.waitTimeAvgMin)), doc: avg(rs.map((r) => r.docCompleteness)) }
  }).filter((r) => r.days > 0)
}

/** Leistungen im Zeitraum: Katalogzahlen des Quartals anteilig auf den Zeitraum skaliert */
export function servicesInRange(range: Range, payer?: Payer | null) {
  const qDays = 55 // Arbeitstage-Basis des Katalogs (QTD)
  const recs = filterRecords({ range })
  const workdays = new Set(recs.map((r) => r.date)).size
  const factor = Math.max(0.05, workdays / qDays)
  return demo().services.filter((s) => !payer || s.payers.includes(payer)).map((s) => ({ ...s, count: Math.round(s.count * factor), value: Math.round(s.value * factor) })).sort((a, b) => b.value - a.value)
}

export const openInvoices = () => invoices().filter((i) => !['bezahlt', 'storniert', 'abgeschrieben'].includes(i.status))

/** Der zentrale Hook: alles gefiltert nach globalem Zustand + Vergleichswerte */
export function useData() {
  const f = useFilters()
  return useMemo(() => {
    const cur = filterRecords({ range: f.range, role: f.role, team: f.team })
    const prev = f.compareRange ? filterRecords({ range: f.compareRange, role: f.role, team: f.team }) : []
    const s = summarize(cur, f.payer), p = prev.length ? summarize(prev, f.payer) : null
    const calls = filterCalls(f.range), callsPrev = f.compareRange ? filterCalls(f.compareRange) : []
    const dict = filterDictation(f.range)
    return { cur, prev, s, p, calls, callsPrev, dict, daily: daily(cur, f.payer), dailyPrev: daily(prev, f.payer), heat: heatmap(cur), staff: staffRows(cur, f.payer), staffPrev: staffRows(prev, f.payer), services: servicesInRange(f.range, f.payer), monthly: monthly(f.role, f.team), range: f.range, compareRange: f.compareRange, payer: f.payer }
  }, [f.range, f.compareRange, f.role, f.team, f.payer])
}

export const pctDelta = (a: number, b: number | null | undefined) => (b ? ((a - b) / b) * 100 : 0)
export { isoWeek, addDays }

// ---- Kompatibilität für ältere Seiten (Wochenaggregate, feste Fenster) ----
export interface WeekPoint { week: number; label: string; start: string; [k: string]: number | string }
export function weekly(records: DayRecord[], pick: (rs: DayRecord[]) => Record<string, number>): WeekPoint[] {
  const groups = new Map<string, DayRecord[]>()
  for (const r of records) {
    const d = new Date(r.date)
    const key = `${d.getFullYear()}-${isoWeek(d).toString().padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, rs]) => ({ week: Number(key.slice(5)), label: `KW ${Number(key.slice(5))}`, start: rs.map((r) => r.date).sort()[0], ...pick(rs) }))
}
export const practiceWeekly = () =>
  weekly(demo().records.filter((r) => new Date(r.date) >= new Date('2026-04-01')), (rs) => ({
    contacts: sum(rs.map((r) => r.patientContacts)), telemed: sum(rs.map((r) => r.telemedConsults)), revenue: sum(rs.map((r) => r.servicesValue)),
    calls: sum(rs.map((r) => r.callsHandled)), savedMin: sum(rs.map((r) => r.dictationSavedMin)), noShows: sum(rs.map((r) => r.noShows)), appointments: sum(rs.map((r) => r.appointments)),
    wait: (() => { const w = rs.filter((r) => r.waitTimeAvgMin > 0 && roleOf(r.staffId) === 'assistenz'); return w.length ? sum(w.map((r) => r.waitTimeAvgMin)) / w.length : 0 })(),
  }))
export function lastNDays(n: number) {
  const dates = [...new Set(demo().records.map((r) => r.date))].sort()
  const keep = new Set(dates.slice(-n))
  return demo().records.filter((r) => keep.has(r.date))
}
export function compareWindows(days = 20) {
  const dates = [...new Set(demo().records.map((r) => r.date))].sort()
  const cur = new Set(dates.slice(-days)), prev = new Set(dates.slice(-2 * days, -days))
  const agg = (set: Set<string>) => {
    const rs = demo().records.filter((r) => set.has(r.date)); const s = summarize(rs)
    return { contacts: s.contacts, revenue: s.revenue, telemedShare: s.telemedShare, savedMin: s.savedMin, noShowRate: s.noShowRate, wait: s.wait, calls: s.calls }
  }
  return { cur: agg(cur), prev: agg(prev) }
}
export function quarterToDate() {
  const s = summarize(demo().records.filter((r) => new Date(r.date) >= new Date('2026-07-01')))
  return { contacts: s.contacts, telemed: Math.round(s.contacts * s.telemedShare), revenue: s.revenue, savedMin: s.savedMin, appointments: s.appointments, noShows: s.noShows, calls: s.calls, wait: s.wait }
}
