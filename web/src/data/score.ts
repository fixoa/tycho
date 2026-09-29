import { STAFF } from './staff'
import { BILLING_FINDINGS, DATA_AS_OF, demo } from './mock'
import { addDays } from '../lib/format'
import type { Range } from '../state/filters'
import type { DayRecord, StaffMember } from './types'

// ---------------------------------------------------------------------------
// Efficacy Score – transparent, erklärbar, rollenspezifisch.
// Jede Komponente: Istwert, Zielwert (Benchmark), Gewicht. Normierung:
// erreicht = min(ist/ziel, 1.25) / 1.25 → 0..100. Der Score ist das
// gewichtete Mittel. Kein Blackbox-ML – jede Zahl ist im UI nachvollziehbar.
// ---------------------------------------------------------------------------
export interface ScoreComponent {
  key: string
  label: string
  value: number
  target: number
  weight: number
  unit: string
  /** true: kleiner ist besser (z. B. Wartezeit) */
  invert?: boolean
  hint: string
}
export interface StaffScore {
  staff: StaffMember
  score: number
  prevScore: number
  components: ScoreComponent[]
  kpis: {
    contactsPerHour: number
    contacts: number
    revenue: number
    cost: number
    contribution: number
    telemedShare: number
    docCompleteness: number
    diktaraShare: number
    savedMin: number
    calls: number
    wait: number
    noShowRate: number
    presenceH: number
    findings: number
  }
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0)
const normalize = (c: ScoreComponent) => {
  const ratio = c.invert ? (c.value <= 0 ? 1.25 : c.target / c.value) : c.target <= 0 ? 0 : c.value / c.target
  return Math.min(ratio, 1.25) / 1.25
}
export const componentPct = (c: ScoreComponent) => Math.round(normalize(c) * 100)

function kpisFor(staff: StaffMember, recs: DayRecord[]) {
  const working = recs.filter((r) => r.presenceMin > 0)
  const presenceH = sum(working.map((r) => r.presenceMin)) / 60
  const contacts = sum(working.map((r) => r.patientContacts))
  const revenue = sum(working.map((r) => r.servicesValue))
  const days = working.length
  const cost = (staff.costPerMonth / 21) * days
  const telemed = sum(working.map((r) => r.telemedConsults))
  const dictMin = sum(working.map((r) => r.dictationMin))
  const savedMin = sum(working.map((r) => r.dictationSavedMin))
  const appointments = sum(working.map((r) => r.appointments))
  const noShows = sum(working.map((r) => r.noShows))
  return {
    contactsPerHour: presenceH ? contacts / presenceH : 0,
    contacts,
    revenue,
    cost,
    contribution: revenue - cost,
    telemedShare: contacts ? telemed / contacts : 0,
    docCompleteness: avg(working.map((r) => r.docCompleteness)),
    diktaraShare: contacts ? Math.min(1, dictMin / 2.7 / contacts) : 0,
    savedMin,
    calls: sum(working.map((r) => r.callsHandled)),
    wait: avg(working.filter((r) => r.waitTimeAvgMin > 0).map((r) => r.waitTimeAvgMin)),
    noShowRate: appointments ? noShows / appointments : 0,
    presenceH,
    findings: BILLING_FINDINGS.filter((f) => f.staffId === staff.id).length,
  }
}

function componentsFor(staff: StaffMember, k: ReturnType<typeof kpisFor>): ScoreComponent[] {
  switch (staff.role) {
    case 'arzt':
      return [
        { key: 'throughput', label: 'Durchsatz', value: k.contactsPerHour, target: 5.6, weight: 0.22, unit: 'Pat./h', hint: 'Patientenkontakte je Präsenzstunde (AD-Logon bis Logoff).' },
        { key: 'contribution', label: 'Ertrag / Kosten', value: k.cost ? k.revenue / k.cost : 0, target: 2.2, weight: 0.24, unit: '×', hint: 'Verrechnete Leistungen im Verhältnis zu den Arbeitgeberkosten des Zeitraums.' },
        { key: 'doc', label: 'Dokumentation', value: k.docCompleteness, target: 0.97, weight: 0.16, unit: '', hint: 'Vollständigkeit von Kartei, ICD-10-Codierung und Leistungsblatt.' },
        { key: 'diktara', label: 'Diktara-Nutzung', value: k.diktaraShare, target: 0.8, weight: 0.1, unit: '', hint: 'Anteil der Konsultationen mit KI-Zusammenfassung.' },
        { key: 'telemed', label: 'Telemedizin', value: k.telemedShare, target: 0.15, weight: 0.12, unit: '', hint: 'Anteil telemedizinischer Konsultationen (Kennzeichnung 8xT, TM-V/TM-T) an allen Kontakten.' },
        { key: 'noshow', label: 'Terminausfall', value: k.noShowRate, target: 0.04, weight: 0.08, unit: '', invert: true, hint: 'No-Show-Rate der eigenen Termine (kleiner ist besser).' },
        { key: 'billing', label: 'Abrechnungsqualität', value: Math.max(0, 1 - k.findings * 0.25), target: 1, weight: 0.08, unit: '', hint: 'Offene Abrechnungs-Findings (Lücken, Limits, Plausibilität).' },
      ]
    case 'dgkp':
      return [
        { key: 'throughput', label: 'Durchsatz', value: k.contactsPerHour, target: 3.4, weight: 0.3, unit: 'Pat./h', hint: 'Pflegekontakte (Blutabnahme, Infusion, Wundversorgung) je Präsenzstunde.' },
        { key: 'delegation', label: 'Delegationsgrad', value: k.cost ? k.revenue / k.cost : 0, target: 1.1, weight: 0.3, unit: '×', hint: 'Delegierbare, verrechnete Leistungen im Verhältnis zu den Kosten.' },
        { key: 'doc', label: 'Dokumentation', value: k.docCompleteness, target: 0.95, weight: 0.25, unit: '', hint: 'Pflegedokumentation und Anordnungsnachweis.' },
        { key: 'wait', label: 'Wartezeit', value: k.wait, target: 10, weight: 0.15, unit: 'min', invert: true, hint: 'Ø Wartezeit bis zur Pflegeleistung (kleiner ist besser).' },
      ]
    case 'assistenz':
      return [
        { key: 'throughput', label: 'Patientenfluss', value: k.contactsPerHour, target: 7.5, weight: 0.3, unit: 'Pat./h', hint: 'Check-ins / Aufrufe je Präsenzstunde (Patientenaufrufsystem).' },
        { key: 'wait', label: 'Wartezeit', value: k.wait, target: 12, weight: 0.25, unit: 'min', invert: true, hint: 'Ø Wartezeit Check-in → Aufruf (kleiner ist besser).' },
        { key: 'calls', label: 'Telefon-Restlast', value: k.calls / Math.max(1, k.presenceH), target: 3.5, weight: 0.2, unit: '/h', invert: true, hint: 'Manuell bearbeitete Anrufe je Stunde – nach Ordicall sollten es wenige sein.' },
        { key: 'doc', label: 'Datenqualität', value: k.docCompleteness, target: 0.97, weight: 0.25, unit: '', hint: 'Vollständigkeit Stammdaten, e-card, Terminarten.' },
      ]
    default:
      return [
        { key: 'doc', label: 'Prozessqualität', value: k.docCompleteness, target: 0.98, weight: 0.5, unit: '', hint: 'Abrechnungsfristen, Dienstplan, Datenpflege.' },
        { key: 'calls', label: 'Eskalationen', value: k.calls / Math.max(1, k.presenceH), target: 1, weight: 0.5, unit: '/h', invert: true, hint: 'An das Management eskalierte Anrufe.' },
      ]
  }
}

function scoreOf(components: ScoreComponent[]) {
  const w = sum(components.map((c) => c.weight))
  return Math.round((sum(components.map((c) => normalize(c) * c.weight)) / w) * 100)
}

export function periodRecords(days = 28, endExclusive = DATA_AS_OF): { cur: DayRecord[]; prev: DayRecord[] } {
  const { records } = demo()
  const end = new Date(endExclusive.toISOString().slice(0, 10))
  const start = addDays(end, -days + 1)
  const prevStart = addDays(start, -days)
  const cur = records.filter((r) => new Date(r.date) >= start && new Date(r.date) <= end)
  const prev = records.filter((r) => new Date(r.date) >= prevStart && new Date(r.date) < start)
  return { cur, prev }
}

const cache = new Map<string, StaffScore[]>()
export function staffScores(range?: Range, compareRange?: Range | null): StaffScore[] {
  const key = range ? `${range.from.toISOString()}|${range.to.toISOString()}|${compareRange?.from.toISOString() ?? ''}` : 'default'
  const hit = cache.get(key)
  if (hit) return hit
  let cur: DayRecord[], prev: DayRecord[]
  if (range) {
    const { records } = demo()
    const inR = (r: DayRecord, R: Range) => new Date(r.date) >= new Date(R.from.toISOString().slice(0, 10)) && new Date(r.date) <= new Date(R.to.toISOString().slice(0, 10))
    cur = records.filter((r) => inR(r, range))
    const days = Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
    const cmp = compareRange ?? { from: addDays(range.from, -days), to: addDays(range.from, -1), label: '' }
    prev = records.filter((r) => inR(r, cmp))
  } else ({ cur, prev } = periodRecords(28))
  const out = STAFF.map((s) => {
    const k = kpisFor(s, cur.filter((r) => r.staffId === s.id))
    const kPrev = kpisFor(s, prev.filter((r) => r.staffId === s.id))
    const components = componentsFor(s, k)
    const hasPrev = prev.some((r) => r.staffId === s.id && r.presenceMin > 0)
    const score = scoreOf(components)
    return { staff: s, score, prevScore: hasPrev ? scoreOf(componentsFor(s, kPrev)) : score, components, kpis: k }
  })
  cache.set(key, out)
  return out
}

export function practiceScore(range?: Range, compareRange?: Range | null) {
  const scores = staffScores(range, compareRange).filter((s) => s.staff.role !== 'management')
  const weights = scores.map((s) => s.staff.costPerMonth)
  const w = sum(weights)
  const score = Math.round(sum(scores.map((s, i) => s.score * weights[i])) / w)
  const prev = Math.round(sum(scores.map((s, i) => s.prevScore * weights[i])) / w)
  return { score, prev }
}

export function roleAverage(role: StaffMember['role'], range?: Range, compareRange?: Range | null) {
  const s = staffScores(range, compareRange).filter((x) => x.staff.role === role)
  return { score: Math.round(avg(s.map((x) => x.score))), prev: Math.round(avg(s.map((x) => x.prevScore))) }
}
