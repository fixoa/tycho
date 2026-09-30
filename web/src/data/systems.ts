import { DEMO_TODAY, DATA_SOURCES } from './mock'

/*
 * Systemlandschaft mit Betriebsstatus. Jede Komponente meldet, wann Tycho zuletzt mit ihr
 * kommuniziert hat (lesend), in welchem Rhythmus das passiert und wie sie erreichbar ist.
 * Demo-Zeitpunkt: DEMO_TODAY (Mo 25.08.2026 06:00), nächtlicher Lauf 05:10–05:41.
 */
export type SystemStatus = 'operational' | 'degraded' | 'offline' | 'standby'
export type SystemKind = 'src' | 'core' | 'mod'
export interface SystemNode {
  id: string
  kind: SystemKind
  name: string
  role: string
  status: SystemStatus
  lastContact: Date | null
  nextContact?: string
  cadence: string
  channel: string
  latencyMs?: number
  records?: number
  note?: string
  dependsOn?: string[]
}
export interface Contact { ts: Date; ok: boolean }

const t = (iso: string) => new Date(iso)

export const SYSTEMS: SystemNode[] = [
  // Quellen (nur lesend)
  { id: 'pvs', kind: 'src', name: 'CGM MedXPert', role: 'PVS · Kartei, Leistungsblatt, Termine, Honorarnoten', status: 'operational', lastContact: t('2026-08-25T05:12:14'), nextContact: 'heute 19:00 (Snapshot) · Heartbeat alle 15 min', cadence: 'nächtlich 05:10 · Heartbeat 15 min', channel: 'SQL SELECT (tycho_ro) auf VSS-Kopie', latencyMs: 42, records: 1_284_311, note: 'Kein Zugriff auf die Produktivdatenbank während der Sprechstunde.' },
  { id: 'ecard', kind: 'src', name: 'e-card / ELGA', role: 'Konsultationen, e-Medikation, e-Befund (über PVS)', status: 'operational', lastContact: t('2026-08-25T05:12:14'), nextContact: 'mit PVS-Snapshot', cadence: 'mit PVS-Snapshot', channel: 'indirekt über PVS-Datenbank', records: 41_902, dependsOn: ['pvs'] },
  { id: 'ordicall', kind: 'src', name: 'Ordicall', role: 'Anrufe, Anliegen, Terminarten', status: 'operational', lastContact: t('2026-08-25T05:12:03'), nextContact: 'morgen 05:00', cadence: 'täglich 05:00', channel: 'signierter JSON-Export (ohne Audio)', latencyMs: 8, records: 9_810 },
  { id: 'diktara', kind: 'src', name: 'Diktara', role: 'Diktat-Metadaten, Leistungscodes, ICD-10', status: 'operational', lastContact: t('2026-08-25T05:55:31'), nextContact: 'Heartbeat alle 5 min', cadence: 'Heartbeat 5 min · Abgleich nächtlich', channel: 'Metadaten-API localhost:7411', latencyMs: 11, records: 6_233 },
  { id: 'ad', kind: 'src', name: 'Active Directory', role: 'Identität, Gruppen, Kerberos-Logon', status: 'operational', lastContact: t('2026-08-25T05:58:02'), nextContact: 'Heartbeat alle 5 min', cadence: 'Heartbeat 5 min · Abgleich nächtlich', channel: 'LDAPS DC01.ordination.local (Bind read-only)', latencyMs: 3, records: 11 },
  { id: 'planery', kind: 'src', name: 'Planery', role: 'HR · Dienstplan, Zeiten, Abwesenheiten, Salden', status: 'degraded', lastContact: t('2026-08-25T05:12:20'), nextContact: 'stündlich, nächster Versuch 06:12', cadence: 'stündlich', channel: 'HTTPS API (read-only Token im TPM)', latencyMs: 2_380, records: 11, note: 'Antwortzeit 2,4 s (Grenzwert 1 s). Drei Abfragen zwischen 02:12 und 04:12 fehlgeschlagen, danach wieder erfolgreich. Daten vollständig.' },
  { id: 'bank', kind: 'src', name: 'Bank (CAMT.053)', role: 'Zahlungseingänge für Honorarnoten', status: 'operational', lastContact: t('2026-08-24T19:07:02'), nextContact: 'heute 19:00', cadence: 'täglich 19:00', channel: 'Datei-Import \\\\TS-ORD-01\\tycho-in\\bank', records: 2_940 },
  { id: 'lohn', kind: 'src', name: 'Lohnverrechnung', role: 'Kosten je Person (CSV)', status: 'operational', lastContact: t('2026-08-01T07:12:00'), nextContact: '01.09. 07:00', cadence: 'monatlich', channel: 'CSV-Import (nur lesen)', records: 11 },
  { id: 'pbx', kind: 'src', name: 'Telefonanlage', role: 'CDR-Baseline vor Ordicall', status: 'standby', lastContact: t('2026-06-01T02:00:00'), cadence: 'beendet 31.05.2026', channel: 'CDR-Export', records: 14_120, note: 'Nur historische Referenz. Kein aktiver Abgleich mehr.' },
  // Tycho-Kern
  { id: 'collector', kind: 'core', name: 'Tycho Collector', role: 'Liest Quellen, baut den Tages-Snapshot', status: 'operational', lastContact: t('2026-08-25T05:41:02'), nextContact: 'heute 19:00', cadence: 'nächtlich 05:10 · Dauer 29 min', channel: 'Windows-Dienst (gMSA), keine ausgehenden Verbindungen', dependsOn: ['pvs', 'ecard', 'ordicall', 'diktara', 'ad', 'planery', 'bank', 'lohn'] },
  { id: 'store', kind: 'core', name: 'Verschlüsselter Store', role: 'Snapshots, Audit-Kette', status: 'operational', lastContact: t('2026-08-25T05:40:58'), nextContact: 'mit nächstem Lauf', cadence: 'je Lauf · Integritätsprüfung stündlich', channel: 'AES-256-GCM · Schlüssel im TPM', records: 361, dependsOn: ['collector'] },
  { id: 'agent', kind: 'core', name: 'Lokaler Agent', role: 'Assistent · llama.cpp, Tools nur lesend', status: 'operational', lastContact: t('2026-08-25T05:59:40'), nextContact: 'Heartbeat jede Minute', cadence: 'Heartbeat 1 min', channel: 'localhost:8080 · Modell Llama 3.1 8B (4,1 GB)', latencyMs: 640, dependsOn: ['store'] },
  { id: 'digest', kind: 'core', name: 'Digest-Versand', role: 'Montagsmail S/MIME', status: 'operational', lastContact: t('2026-08-25T06:00:00'), nextContact: 'Mo 31.08. 06:00', cadence: 'wöchentlich Mo 06:00', channel: 'SMTP intern (TLS), signiert', dependsOn: ['store'] },
  // Module (lesen nur aus dem Store)
  { id: 'station', kind: 'mod', name: 'Station & Start', role: 'Score, KPIs, Assistent', status: 'operational', lastContact: t('2026-08-25T05:41:02'), cadence: 'je Snapshot', channel: 'Store', dependsOn: ['store', 'agent'] },
  { id: 'fin', kind: 'mod', name: 'Finanzen & Tarife', role: 'Kreuzprüfung, Limits, Fristen', status: 'operational', lastContact: t('2026-08-25T05:41:02'), cadence: 'je Snapshot', channel: 'Store', dependsOn: ['store'] },
  { id: 'prod', kind: 'mod', name: 'Produktivität & Personal', role: 'Efficacy Score je Gruppe / Person', status: 'operational', lastContact: t('2026-08-25T05:41:02'), cadence: 'je Snapshot', channel: 'Store', dependsOn: ['store'] },
  { id: 'tail', kind: 'mod', name: 'Tailwind & HR', role: 'Inkasso-KI, Dienstplan, Frühwarnung', status: 'degraded', lastContact: t('2026-08-25T05:41:02'), cadence: 'je Snapshot · HR stündlich', channel: 'Store · Planery', note: 'HR-Kennzahlen aktuell, aber Planery antwortet langsam.', dependsOn: ['store', 'planery'] },
  { id: 'prog', kind: 'mod', name: 'Prognose & Digest', role: 'Quartalsende, Wochenbericht', status: 'operational', lastContact: t('2026-08-25T05:41:02'), cadence: 'je Snapshot', channel: 'Store', dependsOn: ['store', 'digest'] },
  { id: 'cap', kind: 'mod', name: 'Termine, Zuweiser, NPS', role: 'Kapazität, Bindung, Zufriedenheit', status: 'operational', lastContact: t('2026-08-25T05:41:02'), cadence: 'je Snapshot', channel: 'Store', dependsOn: ['store'] },
  { id: 'sec', kind: 'mod', name: 'Sicherheit & QM', role: 'Audit, Zustimmungen, Fristen', status: 'operational', lastContact: t('2026-08-25T05:41:02'), cadence: 'je Snapshot', channel: 'Store', dependsOn: ['store'] },
]

export const EDGES: [string, string][] = SYSTEMS.flatMap((s) => (s.dependsOn ?? []).map((d) => [d, s.id] as [string, string]))

export const STATUS_LABEL: Record<SystemStatus, string> = { operational: 'Operational', degraded: 'Beeinträchtigt', offline: 'Offline', standby: 'Inaktiv' }
export const STATUS_COLOR: Record<SystemStatus, string> = { operational: 'var(--good)', degraded: 'var(--warn)', offline: 'var(--bad)', standby: 'var(--ink-3)' }

/** Kontakte der letzten 24 h je System (deterministisch), für die Kommunikations-Zeitleiste */
export function contacts24h(id: string, now: Date = DEMO_TODAY): Contact[] {
  const start = now.getTime() - 24 * 3600_000
  const every = (min: number, ok: (d: Date) => boolean = () => true) => {
    const out: Contact[] = []
    for (let ts = Math.ceil(start / (min * 60_000)) * min * 60_000; ts <= now.getTime(); ts += min * 60_000) { const d = new Date(ts); out.push({ ts: d, ok: ok(d) }) }
    return out
  }
  const at = (...isos: string[]) => isos.map((i) => ({ ts: t(i), ok: true })).filter((c) => c.ts.getTime() >= start && c.ts.getTime() <= now.getTime())
  switch (id) {
    case 'pvs': return [...every(15), ...at('2026-08-24T19:04:11', '2026-08-25T05:12:14')]
    case 'ecard': return at('2026-08-24T19:04:11', '2026-08-25T05:12:14')
    case 'ordicall': return at('2026-08-24T05:12:03', '2026-08-25T05:12:03')
    case 'diktara': return every(5)
    case 'ad': return every(5)
    case 'planery': return every(60, (d) => !(d.getHours() >= 2 && d.getHours() <= 4))
    case 'bank': return at('2026-08-24T19:07:02')
    case 'collector': return at('2026-08-24T19:00:00', '2026-08-25T05:10:00', '2026-08-25T05:41:02')
    case 'store': return [...every(60), ...at('2026-08-25T05:40:58')]
    case 'agent': return every(1)
    case 'digest': return at('2026-08-25T06:00:00')
    default: return []
  }
}

/** Zusammenfassung für die Kopfzeile */
export function systemSummary(now: Date = DEMO_TODAY) {
  const active = SYSTEMS.filter((s) => s.status !== 'standby')
  const operational = active.filter((s) => s.status === 'operational').length
  const degraded = active.filter((s) => s.status === 'degraded').length
  const offline = active.filter((s) => s.status === 'offline').length
  const latest = SYSTEMS.filter((s) => s.lastContact).sort((a, b) => b.lastContact!.getTime() - a.lastContact!.getTime())[0]
  const nextRun = new Date(now); nextRun.setHours(19, 0, 0, 0)
  return { total: active.length, operational, degraded, offline, latest, nextRun, sources: DATA_SOURCES.length }
}

export function relTime(d: Date | null, now: Date = DEMO_TODAY): string {
  if (!d) return 'nie'
  const s = Math.max(0, Math.round((now.getTime() - d.getTime()) / 1000))
  if (s < 60) return 'gerade eben'
  const m = Math.round(s / 60); if (m < 60) return `vor ${m} min`
  const h = Math.round(m / 60); if (h < 36) return `vor ${h} h`
  const days = Math.round(h / 24); if (days < 60) return `vor ${days} Tagen`
  return `vor ${Math.round(days / 30)} Monaten`
}
