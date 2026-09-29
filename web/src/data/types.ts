export type Role = 'arzt' | 'dgkp' | 'assistenz' | 'management'

export interface StaffMember {
  id: string
  /** AD sAMAccountName */
  account: string
  upn: string
  name: string
  title: string
  role: Role
  department: string
  /** Vollzeitäquivalent 0..1 */
  fte: number
  /** Arbeitgeber-Gesamtkosten pro Monat (Brutto + Lohnnebenkosten) */
  costPerMonth: number
  /** Ordicall / Diktara / AD Gruppen (aus AD memberOf) */
  adGroups: string[]
  /** Betriebsvereinbarung / individuelle Zustimmung zur Auswertung (ArbVG §96) */
  consent: 'erteilt' | 'ausstehend' | 'nur-aggregiert'
  avatarHue: number
  since: string
}

export interface DayRecord {
  date: string // ISO
  staffId: string
  /** Anwesenheit laut AD-Logon / Windows-Ereignisprotokoll (Minuten) */
  presenceMin: number
  patientContacts: number
  ecardConsults: number
  telemedConsults: number
  servicesCount: number
  servicesValue: number
  dictationMin: number
  dictationSavedMin: number
  callsHandled: number
  waitTimeAvgMin: number
  noShows: number
  appointments: number
  docCompleteness: number // 0..1
}

export interface ServicePosition {
  code: string
  name: string
  category: 'Grundleistung' | 'Einzelleistung' | 'Telemedizin' | 'Vorsorge' | 'Labor' | 'Sonstiges'
  tarif: number
  count: number
  value: number
  countPrevQ: number
  limit?: number // Limitierung pro Quartal (Anzahl)
  limitUsage?: number // 0..1
}

export interface BillingFinding {
  id: string
  severity: 'critical' | 'serious' | 'warning' | 'info'
  type: 'nicht-verrechnet' | 'limit' | 'plausibilitaet' | 'doppelt' | 'dokumentation'
  title: string
  detail: string
  staffId?: string
  valueEur: number
  source: 'PVS' | 'Diktara' | 'Ordicall' | 'Kreuzprüfung'
  date: string
}

export interface CallDay {
  date: string
  total: number
  aiResolved: number
  transferred: number
  missed: number
  afterHours: number
  avgWaitSec: number
  bookings: number
}

export interface CallIntent {
  intent: string
  count: number
  aiResolvedShare: number
  avgDurationSec: number
}

export interface DictationDay {
  date: string
  staffId: string
  recordings: number
  recordedMin: number
  savedMin: number
  acceptanceRate: number
  editsPerSummary: number
  servicesDetected: number
}

export interface ForecastPoint {
  date: string
  actual?: number
  forecast: number
  lower: number
  upper: number
}

export interface AuditEvent {
  ts: string
  actor: string
  action: string
  target: string
  result: 'ok' | 'denied'
}

export interface DataSource {
  id: string
  name: string
  kind: 'PVS' | 'Ordicall' | 'Diktara' | 'AD' | 'Terminkalender' | 'Telefonanlage' | 'Dienstplan'
  access: 'read-only'
  method: string
  lastSync: string
  status: 'ok' | 'warn' | 'off'
  records: number
  note?: string
}
