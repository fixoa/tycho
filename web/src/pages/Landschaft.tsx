import { useState } from 'react'
import { MapTrifold as Map, Scales as Scale, Database, ArrowRight } from '@phosphor-icons/react'
import { Panel } from '../components/simple'
import { Badge } from '../components/ui'
import { DEADLINES } from './Tarife'
import { fmt } from '../lib/format'

// Systemlandschaft: Quellen → Collector → Store → Module, plus Regulatorik-Ebene
const NODES = [
  { id: 'pvs', x: 60, y: 60, w: 150, label: 'PVS · CGM MedXPert', sub: 'Kartei, Leistungsblatt, Termine, Honorarnoten', kind: 'src' },
  { id: 'ecard', x: 60, y: 130, w: 150, label: 'e-card / ELGA', sub: 'Konsultationen, e-Medikation, e-Befund', kind: 'src' },
  { id: 'ordicall', x: 60, y: 200, w: 150, label: 'Ordicall', sub: 'Anrufe, Anliegen, Terminarten', kind: 'src' },
  { id: 'diktara', x: 60, y: 270, w: 150, label: 'Diktara', sub: 'Metadaten, Leistungscodes, ICD-10', kind: 'src' },
  { id: 'ad', x: 60, y: 340, w: 150, label: 'Active Directory', sub: 'Identität, Gruppen, Logon', kind: 'src' },
  { id: 'planery', x: 60, y: 410, w: 150, label: 'Planery (HR)', sub: 'Zeiten, Abwesenheiten, Salden', kind: 'src' },
  { id: 'bank', x: 60, y: 480, w: 150, label: 'Bank (CAMT.053)', sub: 'Zahlungseingänge', kind: 'src' },
  { id: 'collector', x: 300, y: 200, w: 170, label: 'Tycho Collector', sub: 'read-only · nächtlich · Snapshot', kind: 'core' },
  { id: 'store', x: 300, y: 320, w: 170, label: 'Verschlüsselter Store', sub: 'AES-256-GCM · TPM · Audit-Kette', kind: 'core' },
  { id: 'agent', x: 300, y: 440, w: 170, label: 'Lokaler Agent (LLM)', sub: 'llama.cpp · Tools nur lesend', kind: 'core' },
  { id: 'station', x: 560, y: 60, w: 160, label: 'Station / Start', sub: 'Score, KPIs, Assistent', kind: 'mod' },
  { id: 'fin', x: 560, y: 130, w: 160, label: 'Finanzen & Tarife', sub: 'Kreuzprüfung, Limits, Fristen', kind: 'mod' },
  { id: 'prod', x: 560, y: 200, w: 160, label: 'Produktivität & Personal', sub: 'Efficacy Score je Gruppe/Person', kind: 'mod' },
  { id: 'tail', x: 560, y: 270, w: 160, label: 'Tailwind', sub: 'Inkasso-KI, HR-Frühwarnung', kind: 'mod' },
  { id: 'prog', x: 560, y: 340, w: 160, label: 'Prognose & Digest', sub: 'Quartalsende, Montagsmail', kind: 'mod' },
  { id: 'cap', x: 560, y: 410, w: 160, label: 'Termine, Zuweiser, NPS', sub: 'Kapazität, Bindung, Zufriedenheit', kind: 'mod' },
  { id: 'sec', x: 560, y: 480, w: 160, label: 'Sicherheit & QM', sub: 'Audit, Zustimmungen, Fristen', kind: 'mod' },
]
const EDGES: [string, string][] = [['pvs', 'collector'], ['ecard', 'collector'], ['ordicall', 'collector'], ['diktara', 'collector'], ['ad', 'collector'], ['planery', 'collector'], ['bank', 'collector'], ['collector', 'store'], ['store', 'agent'], ['store', 'station'], ['store', 'fin'], ['store', 'prod'], ['store', 'tail'], ['store', 'prog'], ['store', 'cap'], ['store', 'sec'], ['agent', 'station']]

const REGS = [
  { area: 'Abrechnung Kasse', items: ['ASVG §§ 338 ff. Gesamtvertrag ÖGK/ÖÄK, Landes-Honorarordnung (Wien) mit Positionsnummern, Limitierungen, Degression', 'SVS-Gesamtvertrag (neu ab 01.01.2026), BVAEB-Honorarordnung (monatliche Abrechnung)', 'Fallzählung je Quartal über e-card; Kennzeichnungspositionen 8a–8i / 8aT–8iT / PERS', 'Einreichung ÖGK/SVS bis 10. des Folgemonats nach Quartal; Ärztekammer-Vorabrechnung optional'] },
  { area: 'Telemedizin', items: ['Gesamtvertragliche Vereinbarung seit 2021/2022: gleiche Honorierung, Kennzeichnung mit T', 'GTelG 2012: ausdrückliche Einwilligung, Identifikation, Dokumentation', 'ÖGK-Videosystem visit-e als Referenz'] },
  { area: 'e-card / ELGA / Dokumentation', items: ['ELGA-Pflicht für Vertragsärzt:innen inkl. e-Medikation und e-Befund (seit 01/2026)', 'ICD-10-Diagnosecodierung ambulant verpflichtend seit 01.07.2026 (auch Wahlärzt:innen)', 'e-Impfpass für Impfungen', 'Wahlärzt:innen: e-card/ELGA seit 2026, WAHonline ab 300 Patient:innen/Jahr'] },
  { area: 'Datenschutz & Arbeitsrecht', items: ['DSGVO Art. 9 Gesundheitsdaten, Art. 35 DSFA (DSFA-V Z 1: Leistungsbewertung), Art. 22 keine automatisierte Entscheidung', '§ 54 ÄrzteG Verschwiegenheit; Tycho-Hersteller als Auftragsverarbeiter (Art. 28)', 'ArbVG § 96 Abs 1 Z 3 / § 96a; ohne Betriebsrat § 10 AVRAG: Einzelzustimmung – Pro-Person-Modus nur mit NDA und Zustimmungen', 'EU AI Act Anhang III (Beschäftigung): Hochrisiko → menschliche Aufsicht, Information, Logs'] },
  { area: 'Qualität & Betrieb', items: ['Medizinproduktegesetz / MPBV: sicherheitstechnische Kontrollen (EKG, AED, Spirometer)', 'Hygieneplan, Arbeitsplatzevaluierung (ASchG), Datenschutzschulungen', 'Aufbewahrung: Kartei 10 Jahre (ÄrzteG § 51), Personenwerte in Tycho 24 Monate'] },
]

export default function Landschaft() {
  const [sel, setSel] = useState<string | null>(null)
  const node = (id: string) => NODES.find((n) => n.id === id)!
  const color = (k: string) => k === 'src' ? 'var(--series-1)' : k === 'core' ? 'var(--accent)' : 'var(--series-3)'
  return (
    <div className="space-y-4">
      <Panel icon={<Map size={16} />} title="Systemlandschaft" hint="Alle Datenflüsse sind lesend und laufen auf dem Ordinationsserver; klick auf einen Knoten für Details" action={<div className="flex gap-3 text-[12px] text-ink-2">{[['Quelle', 'src'], ['Tycho-Kern', 'core'], ['Modul', 'mod']].map(([l, k]) => <span key={k} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: color(k) }} />{l}</span>)}</div>}>
        <div className="overflow-x-auto"><svg viewBox="0 0 780 560" className="w-full min-w-[720px]" role="img" aria-label="Systemlandschaft">
          <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--line-2)" /></marker></defs>
          {EDGES.map(([a, b]) => { const A = node(a), B = node(b); const x1 = A.x + A.w, y1 = A.y + 22, x2 = B.x, y2 = B.y + 22; const hl = sel === a || sel === b; return <path key={a + b} d={`M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`} fill="none" stroke={hl ? 'var(--accent)' : 'var(--line-2)'} markerEnd="url(#arr)" /> })}
          {NODES.map((n) => (
            <g key={n.id} onClick={() => setSel(sel === n.id ? null : n.id)} className="cursor-pointer">
              <rect x={n.x} y={n.y} width={n.w} height={44} rx={8} fill="var(--surface-2)" stroke={sel === n.id ? 'var(--accent)' : 'var(--line-2)'} />
              <rect x={n.x} y={n.y} width={4} height={44} rx={2} fill={color(n.kind)} />
              <text x={n.x + 12} y={n.y + 18} fontSize="12" fontWeight="600" fill="var(--ink-1)">{n.label}</text>
              <text x={n.x + 12} y={n.y + 33} fontSize="10" fill="var(--ink-3)">{n.sub}</text>
            </g>
          ))}
          <text x={60} y={40} fontSize="11" fill="var(--ink-3)" fontWeight="600">QUELLEN (READ-ONLY)</text>
          <text x={300} y={180} fontSize="11" fill="var(--ink-3)" fontWeight="600">TS-ORD-01 · LOKAL</text>
          <text x={560} y={40} fontSize="11" fill="var(--ink-3)" fontWeight="600">MODULE</text>
        </svg></div>
        {sel && <div className="mt-2 text-[13px] text-ink-2 flex items-center gap-2"><ArrowRight size={14} className="text-ink-3" /><span className="font-medium text-ink-1">{node(sel).label}:</span> {node(sel).sub}. {node(sel).kind === 'src' ? 'Zugriff ausschließlich lesend, protokolliert im Audit-Log.' : node(sel).kind === 'core' ? 'Läuft als Windows-Dienst (gMSA) ohne ausgehende Verbindungen.' : 'Liest nur aus dem verschlüsselten Store; keine Rückkopplung in Quellsysteme.'}</div>}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel icon={<Scale size={16} />} title="Regulatorik, an der sich Tycho orientiert" hint="Österreichischer Rechtsrahmen für Abrechnung, Telemedizin, Dokumentation, Datenschutz und Betrieb">
          <div className="space-y-4">{REGS.map((r) => <div key={r.area}><div className="font-medium text-[13.5px] mb-1.5">{r.area}</div><ul className="space-y-1 text-[13px] text-ink-2">{r.items.map((i) => <li key={i} className="flex gap-2"><span className="text-ink-3">–</span>{i}</li>)}</ul></div>)}</div>
        </Panel>
        <div className="space-y-4">
          <Panel icon={<Database size={16} />} title="Datenmodell (Kern-Entitäten)" hint="Was Tycho speichert – und was nicht">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
              {[['Fall (pseudonym)', 'Quartal, Kostenträger, Erstkontakt, Kennzeichnung 8x'], ['Kontakt', 'Datum, Art (persönlich/Video/Telefon), Ärzt:in, ICD-10 ja/nein'], ['Leistung', 'Positionsnummer, Anzahl, Tarif, Regelprüfung'], ['Termin', 'Slot, Terminart, No-Show, Wartezeit'], ['Anruf', 'Ergebnis, Anliegen, Dauer, Übergabe'], ['Diktat', 'Dauer, Akzeptanz, erkannte Positionen'], ['Honorarnote', 'Betrag, Status, WAHonline, Zahlungseingang'], ['Person', 'AD-Konto, Rolle, FTE, Kosten, Zustimmung'], ['HR-Periode', 'Soll/Ist, Überstunden, Urlaub, Abwesenheiten'], ['Finding', 'Typ, Wert, Quelle, Status']].map(([k, v]) => <div key={k}><div className="font-medium">{k}</div><div className="text-[12px] text-ink-3">{v}</div></div>)}
            </div>
            <div className="mt-3 text-[12px] text-ink-3">Nicht gespeichert: Patientennamen, SVNR, Diagnosen im Klartext, Freitexte, Audio, Transkripte.</div>
          </Panel>
          <Panel icon={<Scale size={16} />} title="Nächste Fristen">
            <ul className="divide-y divide-line-1">{DEADLINES.slice(0, 5).map((x) => <li key={x.when + x.what} className="py-2 flex items-center gap-3 text-[13px]"><span className="tabular text-ink-3 w-24 shrink-0">{fmt.date(new Date(x.when))}</span><span className="flex-1">{x.what}</span><Badge>{x.kind}</Badge></li>)}</ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
