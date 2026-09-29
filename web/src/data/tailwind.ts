import { createRng } from '../lib/rng'
import { addDays } from '../lib/format'
import { DATA_AS_OF } from './mock'

// ---------------------------------------------------------------------------
// Tailwind – Honorarnoten-Controlling & Inkasso (Wahlarzt-/Privatleistungen)
// Datenquelle: PVS-Honorarnotenmodul (read-only) + Bankumsatz-Import (CSV/CAMT,
// read-only) + WAHonline-Übermittlungsstatus. Patient:innen pseudonymisiert.
// ---------------------------------------------------------------------------
export type InvoiceStatus = 'bezahlt' | 'offen' | 'ueberfaellig' | 'mahnung1' | 'mahnung2' | 'inkasso-empfohlen' | 'ratenzahlung' | 'storniert' | 'abgeschrieben'
export type ServiceKind = 'Physiotherapie' | 'TCM / Akupunktur' | 'Impfung' | 'Wahlarzt-Ordination' | 'Ernährungsberatung' | 'Gutachten / Bestätigung' | 'Labor privat'
export type AiAction = 'Zahlungserinnerung (freundlich)' | 'Mahnung Stufe 1' | 'Mahnung Stufe 2 + Frist' | 'Ratenzahlung anbieten' | 'Inkasso übergeben' | 'Abschreiben (Kleinbetrag)' | 'Keine Aktion' | 'Stornoprüfung'

export interface Invoice {
  id: string
  patientPseudo: string
  issued: string
  due: string
  kind: ServiceKind
  provider: string
  amount: number
  paid: number
  status: InvoiceStatus
  daysOverdue: number
  reminders: number
  wahonline: 'übermittelt' | 'nicht nötig' | 'fehlt' | 'abgelehnt'
  payProbability: number
  aiAction: AiAction
  aiReason: string
}

const KINDS: { kind: ServiceKind; provider: string; amount: [number, number]; share: number; payRate: number }[] = [
  { kind: 'Physiotherapie', provider: 'Physio Mag. Reiter', amount: [68, 420], share: 0.28, payRate: 0.78 },
  { kind: 'TCM / Akupunktur', provider: 'Dr. Anna Berger', amount: [95, 380], share: 0.17, payRate: 0.82 },
  { kind: 'Impfung', provider: 'Ordination', amount: [24, 190], share: 0.22, payRate: 0.71 },
  { kind: 'Wahlarzt-Ordination', provider: 'Dr. Tomas Novak', amount: [80, 260], share: 0.16, payRate: 0.86 },
  { kind: 'Ernährungsberatung', provider: 'Dipl. DA Huber', amount: [60, 240], share: 0.07, payRate: 0.8 },
  { kind: 'Gutachten / Bestätigung', provider: 'Ordination', amount: [30, 150], share: 0.06, payRate: 0.9 },
  { kind: 'Labor privat', provider: 'Ordination', amount: [18, 120], share: 0.04, payRate: 0.75 },
]

function pickKind(r: number) {
  let acc = 0
  for (const k of KINDS) { acc += k.share; if (r <= acc) return k }
  return KINDS[KINDS.length - 1]
}

function decide(inv: Omit<Invoice, 'aiAction' | 'aiReason' | 'payProbability'>): Pick<Invoice, 'aiAction' | 'aiReason' | 'payProbability'> {
  const open = inv.amount - inv.paid
  if (inv.status === 'bezahlt') return { aiAction: 'Keine Aktion', aiReason: 'Vollständig bezahlt.', payProbability: 1 }
  if (inv.status === 'storniert' || inv.status === 'abgeschrieben') return { aiAction: 'Keine Aktion', aiReason: 'Abgeschlossen.', payProbability: 0 }
  if (inv.status === 'ratenzahlung') return { aiAction: 'Keine Aktion', aiReason: 'Ratenvereinbarung läuft, nächste Rate fällig.', payProbability: 0.85 }
  const base = inv.daysOverdue <= 0 ? 0.9 : inv.daysOverdue <= 30 ? 0.72 : inv.daysOverdue <= 60 ? 0.55 : inv.daysOverdue <= 90 ? 0.38 : 0.18
  const p = Math.max(0.05, base - inv.reminders * 0.08 + (inv.wahonline === 'übermittelt' ? 0.08 : 0))
  if (inv.status === 'offen') return { aiAction: 'Keine Aktion', aiReason: 'Noch nicht fällig.', payProbability: p }
  if (open < 25) return { aiAction: 'Abschreiben (Kleinbetrag)', aiReason: `Offener Rest ${open.toFixed(2)} € liegt unter den Mahnkosten.`, payProbability: p }
  if (inv.wahonline === 'fehlt' && inv.kind === 'Wahlarzt-Ordination') return { aiAction: 'Stornoprüfung', aiReason: 'Honorarnote wurde nicht via WAHonline übermittelt – Patient:in wartet vermutlich auf Kostenerstattung. Erst übermitteln, dann erinnern.', payProbability: p }
  if (inv.daysOverdue > 90 && inv.reminders >= 2) return { aiAction: 'Inkasso übergeben', aiReason: `${inv.daysOverdue} Tage überfällig, ${inv.reminders} Mahnungen ohne Reaktion.`, payProbability: p }
  if (inv.daysOverdue > 45 && open > 250) return { aiAction: 'Ratenzahlung anbieten', aiReason: 'Höherer Betrag, lange überfällig – Ratenangebot erhöht laut Historie die Zahlungsquote um 31 %.', payProbability: p + 0.15 }
  if (inv.reminders === 0) return { aiAction: 'Zahlungserinnerung (freundlich)', aiReason: 'Erste Überfälligkeit, bisher keine Erinnerung. Textvorschlag liegt bereit.', payProbability: p }
  if (inv.reminders === 1) return { aiAction: 'Mahnung Stufe 1', aiReason: 'Erinnerung ohne Reaktion seit 14 Tagen.', payProbability: p }
  return { aiAction: 'Mahnung Stufe 2 + Frist', aiReason: 'Letzte Mahnung vor Inkasso, 14-Tage-Frist.', payProbability: p }
}

let cache: Invoice[] | null = null
export function invoices(): Invoice[] {
  if (cache) return cache
  const rng = createRng(2211)
  const out: Invoice[] = []
  for (let i = 0; i < 420; i++) {
    const k = pickKind(rng.next())
    const issued = addDays(DATA_AS_OF, -Math.floor(rng.range(0, 240)))
    const due = addDays(issued, 14)
    const amount = Math.round(rng.range(k.amount[0], k.amount[1]))
    const ageSinceDue = Math.floor((DATA_AS_OF.getTime() - due.getTime()) / 86400000)
    const r = rng.next()
    let status: InvoiceStatus
    let paid = 0
    if (r < k.payRate * (ageSinceDue > 0 ? 1 : 0.4)) { status = 'bezahlt'; paid = amount }
    else if (ageSinceDue <= 0) status = 'offen'
    else if (r > 0.97) status = 'storniert'
    else if (ageSinceDue > 120 && r > 0.93) status = 'abgeschrieben'
    else if (ageSinceDue > 40 && r > 0.9) { status = 'ratenzahlung'; paid = Math.round(amount * rng.range(0.2, 0.6)) }
    else status = ageSinceDue > 90 ? 'inkasso-empfohlen' : ageSinceDue > 45 ? 'mahnung2' : ageSinceDue > 20 ? 'mahnung1' : 'ueberfaellig'
    const reminders = status === 'bezahlt' || status === 'offen' ? (rng.next() < 0.2 ? 1 : 0) : status === 'ueberfaellig' ? 0 : status === 'mahnung1' ? 1 : status === 'mahnung2' ? 2 : status === 'inkasso-empfohlen' ? 2 + rng.int(0, 1) : 1
    const wahonline: Invoice['wahonline'] = k.kind === 'Wahlarzt-Ordination' || k.kind === 'TCM / Akupunktur' ? (rng.next() < 0.86 ? 'übermittelt' : rng.next() < 0.7 ? 'fehlt' : 'abgelehnt') : 'nicht nötig'
    const base = {
      id: `HN-2026-${(1800 + i).toString().padStart(4, '0')}`,
      patientPseudo: `P-${rng.int(1000, 9999)}`,
      issued: issued.toISOString().slice(0, 10), due: due.toISOString().slice(0, 10),
      kind: k.kind, provider: k.provider, amount, paid, status,
      daysOverdue: status === 'bezahlt' || status === 'offen' ? Math.max(0, ageSinceDue) : ageSinceDue, reminders, wahonline,
    }
    out.push({ ...base, ...decide(base) })
  }
  cache = out.sort((a, b) => b.daysOverdue - a.daysOverdue)
  return cache
}

export function tailwindSummary() {
  const inv = invoices()
  const open = inv.filter((i) => !['bezahlt', 'storniert', 'abgeschrieben'].includes(i.status))
  const openSum = open.reduce((a, i) => a + i.amount - i.paid, 0)
  const overdue = open.filter((i) => i.daysOverdue > 0)
  const overdueSum = overdue.reduce((a, i) => a + i.amount - i.paid, 0)
  const paid = inv.filter((i) => i.status === 'bezahlt')
  const paidDays = paid.map(() => 0)
  const total = inv.filter((i) => i.status !== 'storniert').reduce((a, i) => a + i.amount, 0)
  const aging = [
    { bucket: '0–30', sum: overdue.filter((i) => i.daysOverdue <= 30).reduce((a, i) => a + i.amount - i.paid, 0) },
    { bucket: '31–60', sum: overdue.filter((i) => i.daysOverdue > 30 && i.daysOverdue <= 60).reduce((a, i) => a + i.amount - i.paid, 0) },
    { bucket: '61–90', sum: overdue.filter((i) => i.daysOverdue > 60 && i.daysOverdue <= 90).reduce((a, i) => a + i.amount - i.paid, 0) },
    { bucket: '> 90', sum: overdue.filter((i) => i.daysOverdue > 90).reduce((a, i) => a + i.amount - i.paid, 0) },
  ]
  const byKind = KINDS.map((k) => {
    const list = inv.filter((i) => i.kind === k.kind && i.status !== 'storniert')
    const sum = list.reduce((a, i) => a + i.amount, 0)
    const openK = list.filter((i) => !['bezahlt', 'abgeschrieben'].includes(i.status)).reduce((a, i) => a + i.amount - i.paid, 0)
    return { kind: k.kind, count: list.length, sum, open: openK, quote: sum ? (sum - openK) / sum : 0 }
  })
  const actions = open.reduce<Record<string, { n: number; sum: number }>>((acc, i) => {
    if (i.aiAction === 'Keine Aktion') return acc
    acc[i.aiAction] = acc[i.aiAction] ?? { n: 0, sum: 0 }
    acc[i.aiAction].n++; acc[i.aiAction].sum += i.amount - i.paid
    return acc
  }, {})
  const expectedRecovery = open.reduce((a, i) => a + (i.amount - i.paid) * i.payProbability, 0)
  void paidDays
  return { openCount: open.length, openSum, overdueCount: overdue.length, overdueSum, total, aging, byKind, actions, expectedRecovery, dso: 31.4, dsoPrev: 38.2, wahonlineMissing: inv.filter((i) => i.wahonline === 'fehlt' && i.status !== 'bezahlt').length }
}

// ---------------------------------------------------------------------------
// HR aus Planery (read-only API, hochsicherheitskritisch): Soll/Ist-Stunden,
// Überstundensaldo, Urlaub, Krankenstand, geplante Abwesenheiten.
// ---------------------------------------------------------------------------
export interface HrRecord {
  staffId: string
  sollH: number
  istH: number
  overtimeBalanceH: number
  overtimeTrend: number
  vacationDays: number
  vacationTaken: number
  vacationPlanned: number
  sickDays: number
  absences: { from: string; to: string; type: 'Urlaub' | 'Fortbildung' | 'Zeitausgleich' }[]
  warning?: string
}

export const HR: HrRecord[] = [
  { staffId: 'a.berger', sollH: 160, istH: 187, overtimeBalanceH: 96, overtimeTrend: 11, vacationDays: 30, vacationTaken: 9, vacationPlanned: 5, sickDays: 0, absences: [{ from: '2026-09-14', to: '2026-09-18', type: 'Urlaub' }], warning: 'Überstundensaldo > 80 h und Urlaubsrest 16 Tage bis Jahresende.' },
  { staffId: 'm.hofer', sollH: 160, istH: 171, overtimeBalanceH: 42, overtimeTrend: 4, vacationDays: 30, vacationTaken: 18, vacationPlanned: 5, sickDays: 2, absences: [{ from: '2026-10-05', to: '2026-10-09', type: 'Urlaub' }] },
  { staffId: 's.lindner', sollH: 96, istH: 99, overtimeBalanceH: 8, overtimeTrend: 1, vacationDays: 18, vacationTaken: 11, vacationPlanned: 3, sickDays: 1, absences: [{ from: '2026-09-03', to: '2026-09-04', type: 'Fortbildung' }] },
  { staffId: 't.novak', sollH: 128, istH: 141, overtimeBalanceH: 37, overtimeTrend: 9, vacationDays: 20, vacationTaken: 4, vacationPlanned: 0, sickDays: 0, absences: [], warning: 'Kein Urlaub geplant, Überstunden steigen 3 Monate in Folge.' },
  { staffId: 'm.steiner', sollH: 160, istH: 168, overtimeBalanceH: 24, overtimeTrend: -3, vacationDays: 25, vacationTaken: 15, vacationPlanned: 5, sickDays: 3, absences: [{ from: '2026-09-21', to: '2026-09-25', type: 'Urlaub' }] },
  { staffId: 'j.pichler', sollH: 120, istH: 118, overtimeBalanceH: -6, overtimeTrend: -2, vacationDays: 19, vacationTaken: 12, vacationPlanned: 2, sickDays: 6, absences: [], warning: '6 Krankenstandstage in 8 Wochen.' },
  { staffId: 'p.maier', sollH: 160, istH: 178, overtimeBalanceH: 71, overtimeTrend: 8, vacationDays: 25, vacationTaken: 8, vacationPlanned: 10, sickDays: 0, absences: [{ from: '2026-09-28', to: '2026-10-09', type: 'Urlaub' }], warning: 'Überstundensaldo 71 h; 2-Wochen-Urlaub ab 28.09. – Besetzungslücke Empfang prüfen.' },
  { staffId: 'l.gruber', sollH: 160, istH: 163, overtimeBalanceH: 19, overtimeTrend: 2, vacationDays: 25, vacationTaken: 16, vacationPlanned: 4, sickDays: 1, absences: [{ from: '2026-10-19', to: '2026-10-23', type: 'Urlaub' }] },
  { staffId: 's.yilmaz', sollH: 80, istH: 84, overtimeBalanceH: 12, overtimeTrend: 3, vacationDays: 13, vacationTaken: 6, vacationPlanned: 0, sickDays: 0, absences: [] },
  { staffId: 'c.wolf', sollH: 160, istH: 158, overtimeBalanceH: 4, overtimeTrend: -1, vacationDays: 25, vacationTaken: 17, vacationPlanned: 5, sickDays: 4, absences: [{ from: '2026-09-07', to: '2026-09-11', type: 'Zeitausgleich' }] },
  { staffId: 'k.bauer', sollH: 160, istH: 166, overtimeBalanceH: 28, overtimeTrend: 2, vacationDays: 25, vacationTaken: 14, vacationPlanned: 5, sickDays: 0, absences: [] },
]

export const hrById = (id: string) => HR.find((h) => h.staffId === id)
