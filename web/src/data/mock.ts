import { createRng } from '../lib/rng'
import { addDays } from '../lib/format'
import { STAFF } from './staff'
import type {
  AuditEvent, BillingFinding, CallDay, CallIntent, DataSource, DayRecord, DictationDay, ForecastPoint, ServicePosition,
} from './types'

// ---------------------------------------------------------------------------
// Demo-Zeitraum. Tycho analysiert während der Betriebszeit und liefert am
// Folgetag die Auswertung → Datenstand ist immer "gestern, Ende Betriebszeit".
// ---------------------------------------------------------------------------
export const DEMO_TODAY = new Date('2026-08-25T06:00:00')
export const DATA_AS_OF = new Date('2026-08-24T19:00:00')
export const QUARTER = { label: 'Q3 2026', start: new Date('2026-07-01'), end: new Date('2026-09-30'), days: 92 }
export const PREV_QUARTER = { label: 'Q2 2026', start: new Date('2026-04-01'), end: new Date('2026-06-30'), revenue: 412_300, scheine: 6214 }
export const HISTORY_START = new Date('2025-09-01')
export const GO_LIVE = { diktara: new Date('2026-05-04'), ordicall: new Date('2026-06-01'), tycho: new Date('2026-07-13') }

export const PRACTICE = {
  name: 'Gesundheitszentrum Donaufeld',
  type: 'Gruppenpraxis Allgemeinmedizin · 4 Kassenverträge (ÖGK, SVS, BVAEB)',
  location: 'Wien 21',
  openingHours: 'Mo–Fr 07:30–18:00',
  domain: 'ordination.local',
  server: 'TS-ORD-01 (Windows Server 2022, Terminalserver)',
  pvs: 'CGM MedXPert',
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const isWorkday = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function workdays(from: Date, to: Date): Date[] {
  const out: Date[] = []
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) if (isWorkday(d)) out.push(new Date(d))
  return out
}

// Profile je Person: Basiswerte pro Arbeitstag, aus denen deterministisch Tageswerte erzeugt werden.
interface Profile {
  contacts: number; telemedShare: number; valuePerContact: number; diktaraUse: number; docCompleteness: number;
  callsBefore: number; callsAfter: number; presenceH: number; wait: number
}
const PROFILES: Record<string, Profile> = {
  'a.berger': { contacts: 46, telemedShare: 0.13, valuePerContact: 36.5, diktaraUse: 0.86, docCompleteness: 0.96, callsBefore: 0, callsAfter: 0, presenceH: 9.2, wait: 14 },
  'm.hofer': { contacts: 53, telemedShare: 0.05, valuePerContact: 32.2, diktaraUse: 0.31, docCompleteness: 0.87, callsBefore: 0, callsAfter: 0, presenceH: 8.6, wait: 22 },
  's.lindner': { contacts: 25, telemedShare: 0.24, valuePerContact: 37.6, diktaraUse: 0.92, docCompleteness: 0.97, callsBefore: 0, callsAfter: 0, presenceH: 5.4, wait: 11 },
  't.novak': { contacts: 34, telemedShare: 0.09, valuePerContact: 33.4, diktaraUse: 0.58, docCompleteness: 0.9, callsBefore: 0, callsAfter: 0, presenceH: 7.1, wait: 17 },
  'm.steiner': { contacts: 29, telemedShare: 0, valuePerContact: 12.6, diktaraUse: 0, docCompleteness: 0.94, callsBefore: 0, callsAfter: 0, presenceH: 8.4, wait: 8 },
  'j.pichler': { contacts: 21, telemedShare: 0, valuePerContact: 11.9, diktaraUse: 0, docCompleteness: 0.9, callsBefore: 0, callsAfter: 0, presenceH: 6.3, wait: 9 },
  'p.maier': { contacts: 64, telemedShare: 0, valuePerContact: 0, diktaraUse: 0, docCompleteness: 0.98, callsBefore: 58, callsAfter: 21, presenceH: 8.5, wait: 12 },
  'l.gruber': { contacts: 58, telemedShare: 0, valuePerContact: 0, diktaraUse: 0, docCompleteness: 0.95, callsBefore: 52, callsAfter: 19, presenceH: 8.3, wait: 13 },
  's.yilmaz': { contacts: 30, telemedShare: 0, valuePerContact: 0, diktaraUse: 0, docCompleteness: 0.93, callsBefore: 27, callsAfter: 11, presenceH: 4.2, wait: 15 },
  'c.wolf': { contacts: 55, telemedShare: 0, valuePerContact: 0, diktaraUse: 0, docCompleteness: 0.91, callsBefore: 49, callsAfter: 24, presenceH: 8.4, wait: 16 },
  'k.bauer': { contacts: 6, telemedShare: 0, valuePerContact: 0, diktaraUse: 0, docCompleteness: 0.99, callsBefore: 8, callsAfter: 5, presenceH: 8.6, wait: 0 },
}

function buildDayRecords(): DayRecord[] {
  const rng = createRng(20260825)
  const days = workdays(HISTORY_START, DATA_AS_OF)
  const out: DayRecord[] = []
  for (const d of days) {
    const afterDiktara = d >= GO_LIVE.diktara
    const afterOrdicall = d >= GO_LIVE.ordicall
    // Saisonalität: Sommerloch Juli/August, Montags mehr, Freitags weniger
    const season = d.getMonth() === 6 || d.getMonth() === 7 ? 0.9 : d.getMonth() === 11 || d.getMonth() === 0 || d.getMonth() === 1 ? 1.08 : 1
    const weekdayF = [0, 1.12, 1.04, 1.0, 0.98, 0.86][d.getDay()]
    for (const s of STAFF) {
      const p = PROFILES[s.id]
      const vacation = rng.next() < 0.035 // Urlaub / Krankenstand
      if (vacation) {
        out.push({ date: iso(d), staffId: s.id, presenceMin: 0, patientContacts: 0, ecardConsults: 0, telemedConsults: 0, servicesCount: 0, servicesValue: 0, dictationMin: 0, dictationSavedMin: 0, callsHandled: 0, waitTimeAvgMin: 0, noShows: 0, appointments: 0, docCompleteness: 0 })
        continue
      }
      const contacts = Math.round(clamp(rng.normal(p.contacts * season * weekdayF, p.contacts * 0.12), 0, 200))
      const telemed = Math.round(contacts * clamp(rng.normal(p.telemedShare, 0.03), 0, 1) * (afterOrdicall ? 1.15 : 1))
      const ecard = s.role === 'arzt' ? Math.round(contacts * rng.range(0.82, 0.95)) : 0
      const servicesCount = s.role === 'arzt' || s.role === 'dgkp' ? Math.round(contacts * rng.range(1.4, 1.9)) : 0
      const servicesValue = Math.round(contacts * p.valuePerContact * rng.range(0.9, 1.1))
      const diktaraUse = afterDiktara ? p.diktaraUse * clamp((d.getTime() - GO_LIVE.diktara.getTime()) / (30 * 86400000), 0.4, 1) : 0
      const dictationMin = Math.round(contacts * diktaraUse * rng.range(2.1, 3.4))
      const dictationSavedMin = Math.round(dictationMin * rng.range(1.6, 2.1))
      const docBase = p.docCompleteness + (afterDiktara ? diktaraUse * 0.04 : -0.03) + (d < new Date('2026-07-01') ? -0.02 : 0)
      const calls = s.role === 'assistenz' || s.role === 'management'
        ? Math.round(clamp(rng.normal(afterOrdicall ? p.callsAfter : p.callsBefore, 6), 0, 120) * weekdayF)
        : 0
      const wait = p.wait > 0 ? clamp(rng.normal(p.wait * (afterOrdicall ? 0.88 : 1) * weekdayF, 3), 3, 60) : 0
      const appointments = s.role === 'arzt' ? Math.round(contacts * rng.range(0.92, 1.0)) : 0
      const noShowRate = afterOrdicall ? 0.045 : 0.068
      const noShows = s.role === 'arzt' ? Math.round(appointments * clamp(rng.normal(noShowRate, 0.015), 0, 0.2)) : 0
      out.push({
        date: iso(d), staffId: s.id,
        presenceMin: Math.round(clamp(rng.normal(p.presenceH * 60, 25), 120, 720)),
        patientContacts: contacts, ecardConsults: ecard, telemedConsults: telemed,
        servicesCount, servicesValue, dictationMin, dictationSavedMin, callsHandled: calls,
        waitTimeAvgMin: Math.round(wait), noShows, appointments,
        docCompleteness: clamp(rng.normal(docBase, 0.02), 0.6, 1),
      })
    }
  }
  return out
}

function buildServices(): ServicePosition[] {
  // Demo-Katalog, angelehnt an die Struktur der ÖGK-Honorarordnung Allgemeinmedizin:
  // Kennzeichnungspositionen 8a–8i (persönlich) / 8aT–8iT (telemedizinisch), PERS, Erstkontakt (10),
  // Erstordination nach Spitalsüberweisung (18EZ), Erste Ordination im Monat (20), Koordinierungszuschlag (34),
  // EKG (34a), VU, MKP. Tarife sind Demo-Werte; der echte Honorarkatalog des Bundeslandes wird importiert.
  const ALL: ServicePosition['payers'] = ['ÖGK', 'SVS', 'BVAEB']
  const base: Omit<ServicePosition, 'value' | 'limitUsage'>[] = [
    { code: 'GL', name: 'Grundleistungsvergütung (Fallpauschale)', category: 'Grundleistung', tarif: 21.5, count: 3880, countPrevQ: 6214, rule: '1× je Fall und Quartal, ausgelöst durch erste e-card-Konsultation; Fallzahl-Staffel (Degression ab 1.500 Fällen/Quartal)', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '10', name: 'Erstkontakt im Quartal (ohne Spitalsüberweisung)', category: 'Grundleistung', tarif: 12.6, count: 3851, countPrevQ: 6170, rule: '1× je Fall und Quartal, nicht neben 18EZ', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '18EZ', name: 'Erstordination nach Spitalsüberweisung', category: 'Grundleistung', tarif: 14.2, count: 212, countPrevQ: 338, rule: '1× je Fall und Quartal, nur mit Überweisungsschein der Krankenanstalt', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '20', name: 'Erste Ordination im Monat', category: 'Grundleistung', tarif: 9.4, count: 5120, countPrevQ: 8190, rule: '1× je Fall und Monat, nicht neben B1', payers: ['ÖGK', 'BVAEB'], cycle: 'Monat', by: 'Arzt' },
    { code: '8a–8i', name: 'Kennzeichnung Ordination 1.–9. Kontakt (persönlich)', category: 'Kennzeichnung', tarif: 0, count: 8940, countPrevQ: 14300, rule: '8a/8b ohne Tarif, aber Pflicht – sonst sind 8c–8i nicht honorierbar', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '8aT–8iT', name: 'Kennzeichnung Ordination telemedizinisch (Telefon/Video)', category: 'Telemedizin', tarif: 0, count: 1270, countPrevQ: 1650, rule: 'Gleiche Honorierung wie persönlich; Reihung 8a…8i zählt persönlich und telemedizinisch gemeinsam', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: 'PERS', name: 'Kennzeichnung persönlich + telemedizinisch am selben Tag', category: 'Kennzeichnung', tarif: 0, count: 84, countPrevQ: 121, rule: 'Fiktive Position, Pflicht wenn beides am selben Tag erfolgt', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: 'TM-V', name: 'Videokonsultation (Ordination via Video)', category: 'Telemedizin', tarif: 18.2, count: 509, countPrevQ: 627, rule: 'Nur mit ausdrücklicher Patienteneinwilligung (GTelG 2012), Kennzeichnung 8xT', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: 'TM-T', name: 'Telefonische ärztliche Beratung', category: 'Telemedizin', tarif: 9.1, count: 762, countPrevQ: 1026, rule: 'Kennzeichnung 8xT; nicht neben TM-V am selben Tag', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '34', name: 'Zuschlag Koordinierungstätigkeit (chronisch Kranke)', category: 'Einzelleistung', tarif: 16.4, count: 819, countPrevQ: 1190, rule: '1× je Fall und Quartal, nur bei dokumentierter chronischer Erkrankung mit ICD-10', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '39', name: 'Therapeutische Aussprache (≥ 20 min)', category: 'Einzelleistung', tarif: 21.7, count: 364, countPrevQ: 398, limit: 400, rule: 'Limitiert: max. 400 je Quartal und Vertragsarzt, danach Degression 50 %', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '34a', name: 'EKG in Ruhe (12 Ableitungen) mit Befund', category: 'Einzelleistung', tarif: 24.9, count: 370, countPrevQ: 621, rule: 'Max. 2× je Fall und Quartal', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '44', name: 'Spirometrie', category: 'Einzelleistung', tarif: 19.4, count: 141, countPrevQ: 226, rule: '1× je Fall und Quartal', payers: ALL, cycle: 'Quartal', by: 'Arzt/DGKP' },
    { code: '12', name: 'Injektion i.m. / s.c.', category: 'Einzelleistung', tarif: 4.2, count: 978, countPrevQ: 1494, rule: 'Nicht neben Infusion am selben Tag', payers: ALL, cycle: 'Quartal', by: 'Arzt/DGKP' },
    { code: '13', name: 'Infusion', category: 'Einzelleistung', tarif: 14.8, count: 326, countPrevQ: 515, rule: 'Ärztliche Anordnung dokumentieren (Delegation an DGKP)', payers: ALL, cycle: 'Quartal', by: 'Arzt/DGKP' },
    { code: '17', name: 'Wundversorgung / Verbandwechsel', category: 'Einzelleistung', tarif: 11.3, count: 282, countPrevQ: 418, rule: 'Max. 1× je Tag', payers: ALL, cycle: 'Quartal', by: 'Arzt/DGKP' },
    { code: '30', name: 'Blutabnahme (venös)', category: 'Labor', tarif: 3.9, count: 1901, countPrevQ: 2864, rule: '1× je Tag', payers: ALL, cycle: 'Quartal', by: 'Arzt/DGKP' },
    { code: '31', name: 'Harnstreifentest', category: 'Labor', tarif: 2.8, count: 643, countPrevQ: 1013, rule: '', payers: ALL, cycle: 'Quartal', by: 'Arzt/Assistenz' },
    { code: '32', name: 'Blutzucker (POCT)', category: 'Labor', tarif: 3.1, count: 570, countPrevQ: 872, rule: '', payers: ALL, cycle: 'Quartal', by: 'Arzt/Assistenz' },
    { code: '60', name: 'Impfung (Verabreichung)', category: 'Einzelleistung', tarif: 7.6, count: 227, countPrevQ: 621, rule: 'Impfstoff über e-Impfpass dokumentieren; Privatimpfungen über Honorarnote', payers: ALL, cycle: 'Quartal', by: 'Arzt/DGKP' },
    { code: 'VU', name: 'Vorsorgeuntersuchung (bundesweites Programm)', category: 'Vorsorge', tarif: 71.8, count: 269, countPrevQ: 406, rule: '1× je Jahr und Person (ab 18), eigenes VU-Formular, alle Träger', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: 'MKP', name: 'Mutter-Kind-Pass-Untersuchung', category: 'Vorsorge', tarif: 44.3, count: 75, countPrevQ: 114, rule: 'Nach MKP-Schema, Fristen je Untersuchung', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '21', name: 'Hausbesuch (Visite)', category: 'Einzelleistung', tarif: 39.5, count: 101, countPrevQ: 166, rule: 'Wegzeit-Zuschlag nach Zone; dringende Visite 22', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: '50', name: 'Kleine Chirurgie (Exzision, Naht)', category: 'Einzelleistung', tarif: 33.2, count: 62, countPrevQ: 93, rule: 'Nicht neben 17 am selben Tag', payers: ALL, cycle: 'Quartal', by: 'Arzt' },
    { code: 'PRIV', name: 'Privatleistungen (Honorarnote, WAHonline)', category: 'Sonstiges', tarif: 0, count: 420, countPrevQ: 610, rule: 'Wahlarzt/Privat: Honorarnote, Kostenerstattung 80 % des Kassentarifs via WAHonline', payers: ['Privat'], cycle: 'Honorarnote', by: 'Arzt' },
  ]
  return base.map((b) => ({ ...b, value: Math.round(b.count * b.tarif * 100) / 100, limitUsage: b.limit ? b.count / b.limit : undefined }))
}

export const BILLING_FINDINGS: BillingFinding[] = [
  { id: 'F-1042', severity: 'critical', type: 'nicht-verrechnet', title: '41 e-card-Konsultationen ohne Grundleistung GL / Erstkontakt 10', detail: 'e-card-Steckung im PVS vorhanden, im Leistungsblatt fehlen GL und Pos. 10. Betrifft KW 30–33. Vor Quartalsabrechnung nachtragen.', valueEur: 881.5, source: 'PVS', date: '2026-08-24' },
  { id: 'F-1039', severity: 'critical', type: 'nicht-verrechnet', title: 'EKG dokumentiert, Pos. 34a nicht verrechnet (14 Fälle)', detail: 'Diktara-Zusammenfassung enthält „EKG durchgeführt, Sinusrhythmus“, PVS-Leistungsblatt ohne 34a.', staffId: 'm.hofer', valueEur: 348.6, source: 'Kreuzprüfung', date: '2026-08-23' },
  { id: 'F-1037', severity: 'serious', type: 'limit', title: 'Therapeutische Aussprache Pos. 39: Limit zu 91 % ausgeschöpft', detail: '364 von 400 limitierten Positionen bei 37 verbleibenden Quartalstagen. Prognose: Limit am 04.09. erreicht – danach Degression.', staffId: 'a.berger', valueEur: 781.2, source: 'PVS', date: '2026-08-24' },
  { id: 'F-1035', severity: 'serious', type: 'nicht-verrechnet', title: 'Vorsorgeuntersuchung dokumentiert, VU fehlt (6 Fälle)', detail: 'Diktara erkennt vollständiges VU-Protokoll, im PVS nur GL/10 verrechnet.', staffId: 's.lindner', valueEur: 430.8, source: 'Kreuzprüfung', date: '2026-08-21' },
  { id: 'F-1031', severity: 'warning', type: 'plausibilitaet', title: '27 Videokonsultationen als TM-T statt TM-V verrechnet (Kennzeichnung 8xT fehlt)', detail: 'Ordicall-Terminart „Video“ und PVS-Position stimmen nicht überein. Differenz 9,10 € je Fall.', staffId: 't.novak', valueEur: 245.7, source: 'Kreuzprüfung', date: '2026-08-20' },
  { id: 'F-1028', severity: 'warning', type: 'doppelt', title: 'Pos. 12 doppelt am selben Tag (3 Fälle)', detail: 'Rückforderungsrisiko bei Kassenprüfung. Bitte prüfen, ob zwei Injektionen medizinisch begründet sind.', valueEur: -12.6, source: 'PVS', date: '2026-08-19' },
  { id: 'F-1026', severity: 'warning', type: 'dokumentation', title: 'Infusion ohne dokumentierte ärztliche Anordnung (4 Fälle)', detail: 'DGKP-Leistung Pos. 13 verrechnet, Anordnung in der Kartei nicht auffindbar.', staffId: 'm.steiner', valueEur: 59.2, source: 'PVS', date: '2026-08-18' },
  { id: 'F-1021', severity: 'info', type: 'plausibilitaet', title: 'Folgekontakt ohne Erstkontakt Pos. 10 (5 Scheine)', detail: 'Pos. 10 fehlt bei 5 Patient:innen mit Folgekontakt im Quartal; Kennzeichnung 8b ohne 8a.', valueEur: 63, source: 'PVS', date: '2026-08-14' },
]

function buildCalls(): { days: CallDay[]; intents: CallIntent[]; hourly: { hour: number; calls: number; aiResolved: number }[] } {
  const rng = createRng(777)
  const days: CallDay[] = []
  for (const d of workdays(GO_LIVE.ordicall, DATA_AS_OF)) {
    const t = clamp((d.getTime() - GO_LIVE.ordicall.getTime()) / (60 * 86400000), 0, 1)
    const weekdayF = [0, 1.25, 1.05, 0.98, 0.95, 0.8][d.getDay()]
    const total = Math.round(clamp(rng.normal(142 * weekdayF, 14), 60, 260))
    const aiShare = 0.62 + 0.14 * t + rng.normal(0, 0.03)
    const aiResolved = Math.round(total * clamp(aiShare, 0.4, 0.9))
    const missed = Math.round(total * clamp(rng.normal(0.028, 0.01), 0, 0.1))
    const transferred = total - aiResolved - missed
    days.push({
      date: iso(d), total, aiResolved, transferred, missed,
      afterHours: Math.round(clamp(rng.normal(19, 5), 0, 60)),
      avgWaitSec: Math.round(clamp(rng.normal(6, 2), 1, 20)),
      bookings: Math.round(total * clamp(rng.normal(0.34, 0.03), 0.2, 0.5)),
    })
  }
  const intents: CallIntent[] = [
    { intent: 'Terminvereinbarung', count: 3412, aiResolvedShare: 0.91, avgDurationSec: 84 },
    { intent: 'Rezeptbestellung', count: 1876, aiResolvedShare: 0.88, avgDurationSec: 61 },
    { intent: 'Befundauskunft', count: 1002, aiResolvedShare: 0.37, avgDurationSec: 132 },
    { intent: 'Überweisung / Zuweisung', count: 688, aiResolvedShare: 0.72, avgDurationSec: 95 },
    { intent: 'Krankmeldung', count: 571, aiResolvedShare: 0.83, avgDurationSec: 58 },
    { intent: 'Öffnungszeiten / Info', count: 462, aiResolvedShare: 0.98, avgDurationSec: 32 },
    { intent: 'Sonstiges', count: 799, aiResolvedShare: 0.41, avgDurationSec: 148 },
  ]
  const hourly = Array.from({ length: 12 }, (_, i) => {
    const hour = 7 + i
    const shape = [0.35, 1.0, 0.95, 0.8, 0.62, 0.45, 0.4, 0.55, 0.6, 0.5, 0.3, 0.15][i]
    const calls = Math.round(shape * 1120)
    return { hour, calls, aiResolved: Math.round(calls * (0.66 + rng.range(-0.05, 0.08))) }
  })
  return { days, intents, hourly }
}

function buildDictation(records: DayRecord[]): DictationDay[] {
  const rng = createRng(4242)
  const out: DictationDay[] = []
  for (const r of records) {
    if (r.dictationMin <= 0) continue
    const recordings = Math.round(r.dictationMin / rng.range(2.2, 3.2))
    out.push({
      date: r.date, staffId: r.staffId, recordings, recordedMin: r.dictationMin, savedMin: r.dictationSavedMin,
      acceptanceRate: clamp(rng.normal(0.91, 0.04), 0.7, 1),
      editsPerSummary: clamp(rng.normal(1.4, 0.5), 0, 5),
      servicesDetected: Math.round(recordings * rng.range(1.1, 1.6)),
    })
  }
  return out
}

function buildForecast(records: DayRecord[]): { points: ForecastPoint[]; projected: number; lower: number; upper: number; actualToDate: number; scheineToDate: number; scheineProjected: number } {
  const rng = createRng(99)
  const byDate = new Map<string, number>()
  for (const r of records) {
    if (new Date(r.date) < QUARTER.start) continue
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.servicesValue)
  }
  // Privat-/Wahlarztanteil und nicht-personenbezogene Erlöse (z. B. Labor, Pauschalen) ≈ +20 %
  const uplift = 1.2
  const points: ForecastPoint[] = []
  let cum = 0
  const qDays = workdays(QUARTER.start, QUARTER.end)
  const doneDays = qDays.filter((d) => d <= DATA_AS_OF)
  for (const d of doneDays) {
    cum += (byDate.get(iso(d)) ?? 0) * uplift
    points.push({ date: iso(d), actual: Math.round(cum), forecast: Math.round(cum), lower: Math.round(cum), upper: Math.round(cum) })
  }
  const dailyAvg = cum / doneDays.length
  const remaining = qDays.filter((d) => d > DATA_AS_OF)
  let f = cum
  remaining.forEach((d, i) => {
    // September: Ende des Sommerlochs → leicht höhere Tagesumsätze; Unsicherheit wächst mit √t
    const seasonal = d.getMonth() === 8 ? 1.07 : 1
    f += dailyAvg * seasonal * (1 + rng.normal(0, 0.005))
    const sd = dailyAvg * 0.9 * Math.sqrt(i + 1)
    points.push({ date: iso(d), forecast: Math.round(f), lower: Math.round(f - 1.64 * sd), upper: Math.round(f + 1.64 * sd) })
  })
  const last = points[points.length - 1]
  const scheineToDate = records.filter((r) => new Date(r.date) >= QUARTER.start && r.staffId === 'a.berger').length > 0
    ? 3880
    : 0
  return { points, projected: last.forecast, lower: last.lower, upper: last.upper, actualToDate: Math.round(cum), scheineToDate, scheineProjected: Math.round(scheineToDate * (qDays.length / doneDays.length) * 0.98) }
}

// Kostenträger-Mix je Ärzt:in (Anteil am Umsatz) – aus den Scheinen im PVS
export const PAYER_SHARE: Record<string, { ÖGK: number; SVS: number; BVAEB: number; Privat: number }> = {
  'a.berger': { ÖGK: 0.66, SVS: 0.1, BVAEB: 0.08, Privat: 0.16 },
  'm.hofer': { ÖGK: 0.76, SVS: 0.11, BVAEB: 0.09, Privat: 0.04 },
  's.lindner': { ÖGK: 0.7, SVS: 0.12, BVAEB: 0.1, Privat: 0.08 },
  't.novak': { ÖGK: 0.62, SVS: 0.12, BVAEB: 0.09, Privat: 0.17 },
  'm.steiner': { ÖGK: 0.74, SVS: 0.11, BVAEB: 0.1, Privat: 0.05 },
  'j.pichler': { ÖGK: 0.74, SVS: 0.11, BVAEB: 0.1, Privat: 0.05 },
}

export const DATA_SOURCES: DataSource[] = [
  { id: 'pvs', name: 'CGM MedXPert (PVS)', kind: 'PVS', access: 'read-only', method: 'Leselogin „tycho_ro“ (nur SELECT) auf nächtlicher VSS-Kopie der MedXPert-Datenbank; DB-Basis im Onboarding verifiziert', lastSync: '2026-08-24T19:04:11', status: 'ok', records: 1_284_311, note: 'Kein direkter Zugriff auf die Produktivdatenbank während der Sprechstunde.' },
  { id: 'planery', name: 'Planery (HR / Dienstplan)', kind: 'Planery', access: 'read-only', method: 'Read-only API-Token (Scope: Zeiten, Abwesenheiten, Salden) – Token im TPM, Zugriff nur für Tailwind-HR-Rolle', lastSync: '2026-08-24T19:06:30', status: 'ok', records: 11, note: 'Hochsicherheitskritisch: Personaldaten, eigener Verschlüsselungsschlüssel, separates Audit-Log.' },
  { id: 'bank', name: 'Bankumsätze (CAMT.053-Import)', kind: 'Bank', access: 'read-only', method: 'Täglicher CAMT-Export der Hausbank, Ordner \\\\TS-ORD-01\\tycho-in\\bank – Zahlungsabgleich Honorarnoten', lastSync: '2026-08-24T19:07:02', status: 'ok', records: 2_940 },
  { id: 'ordicall', name: 'Ordicall', kind: 'Ordicall', access: 'read-only', method: 'Lokaler Export (JSON, signiert) – Anrufstatistik ohne Audio', lastSync: '2026-08-24T19:05:40', status: 'ok', records: 9_810 },
  { id: 'diktara', name: 'Diktara', kind: 'Diktara', access: 'read-only', method: 'Metadaten-API (localhost) – Dauer, Leistungserkennung, Akzeptanz; keine Transkripte', lastSync: '2026-08-24T19:05:52', status: 'ok', records: 6_233 },
  { id: 'ad', name: 'Active Directory (ordination.local)', kind: 'AD', access: 'read-only', method: 'LDAPS-Bind mit Leserechten, Gruppen G_Aerzte / G_Pflege / G_Empfang', lastSync: '2026-08-24T19:06:03', status: 'ok', records: 11 },
  { id: 'calendar', name: 'Terminkalender (PVS-Modul)', kind: 'Terminkalender', access: 'read-only', method: 'Teil des PVS-Snapshots – Slots, No-Shows, Terminarten', lastSync: '2026-08-24T19:04:11', status: 'ok', records: 41_902 },
  { id: 'pbx', name: 'Telefonanlage (Vorher-Baseline)', kind: 'Telefonanlage', access: 'read-only', method: 'CDR-Export der Anlage (bis 31.05.2026)', lastSync: '2026-06-01T02:00:00', status: 'warn', records: 14_120, note: 'Seit Ordicall-Go-Live nur noch als historische Referenz.' },
  { id: 'lohn', name: 'Lohnverrechnung (Kosten je Person)', kind: 'Dienstplan', access: 'read-only', method: 'CSV-Import monatlich (Ordner \\\\TS-ORD-01\\tycho-in, nur lesen)', lastSync: '2026-08-01T07:12:00', status: 'ok', records: 11 },
]

export const AUDIT_LOG: AuditEvent[] = [
  { ts: '2026-08-25T05:41:02', actor: 'svc_tycho', action: 'Analyse-Lauf abgeschlossen', target: 'Snapshot 2026-08-24', result: 'ok' },
  { ts: '2026-08-25T05:40:58', actor: 'svc_tycho', action: 'Verschlüsselter Store geschrieben (AES-256-GCM)', target: 'D:\\Tycho\\store\\2026-08-24.tyc', result: 'ok' },
  { ts: '2026-08-25T05:12:14', actor: 'svc_tycho', action: 'Leseabfrage PVS (SELECT)', target: 'Leistungen, Termine, e-card, Honorarnoten', result: 'ok' },
  { ts: '2026-08-25T05:12:20', actor: 'svc_tycho', action: 'Planery-API gelesen (Scope: Zeiten, Abwesenheiten)', target: 'api.planery.at (read-only Token)', result: 'ok' },
  { ts: '2026-08-25T05:12:09', actor: 'svc_tycho', action: 'Leseabfrage Diktara-Metadaten', target: 'localhost:7411', result: 'ok' },
  { ts: '2026-08-25T05:12:03', actor: 'svc_tycho', action: 'Leseabfrage Ordicall-Export', target: 'ordicall-stats-2026-08-24.json', result: 'ok' },
  { ts: '2026-08-25T05:11:50', actor: 'svc_tycho', action: 'LDAPS-Abgleich Personalstamm', target: 'DC01.ordination.local', result: 'ok' },
  { ts: '2026-08-24T18:31:44', actor: 'a.berger', action: 'Anmeldung (Windows SSO / Kerberos)', target: 'Tycho Station', result: 'ok' },
  { ts: '2026-08-24T18:33:10', actor: 'a.berger', action: 'Personen-Detail geöffnet', target: 'm.hofer', result: 'ok' },
  { ts: '2026-08-24T12:02:31', actor: 'l.gruber', action: 'Anmeldung', target: 'Tycho Station', result: 'denied' },
  { ts: '2026-08-24T05:41:07', actor: 'svc_tycho', action: 'Schreibversuch (Selbsttest) auf PVS-DB', target: 'tycho_ro → INSERT', result: 'denied' },
  { ts: '2026-08-18T06:00:00', actor: 'svc_tycho', action: 'Tycho Digest versendet (S/MIME)', target: 'leitung@ordination.local', result: 'ok' },
]

// ---------------------------------------------------------------------------
let cache: ReturnType<typeof build> | null = null
function build() {
  const records = buildDayRecords()
  const services = buildServices()
  const calls = buildCalls()
  const dictation = buildDictation(records)
  const forecast = buildForecast(records)
  return { records, services, calls, dictation, forecast }
}
export function demo() {
  if (!cache) cache = build()
  return cache
}
