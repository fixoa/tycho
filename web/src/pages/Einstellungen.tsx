import { useState } from 'react'
import { Card, Badge } from '../components/ui'
import { PRACTICE } from '../data/mock'

const MODULES = [
  { id: 'station', name: 'Tycho Station', desc: 'Dashboard, Efficacy Score, Praxis-Radar', on: true, locked: true },
  { id: 'forecast', name: 'Prognose & Szenarien', desc: 'Quartalshochrechnung, Kostenträger, Was-wäre-wenn', on: true, locked: true },
  { id: 'billing', name: 'Abrechnungs-Kreuzprüfung', desc: 'PVS × Diktara × Ordicall: nicht verrechnete Leistungen, Limits, Plausibilität', on: true },
  { id: 'ordicall', name: 'Ordicall Station', desc: 'Telefon-KI-Statistik (Paket Ordicall erforderlich)', on: true },
  { id: 'diktara', name: 'Diktara Station', desc: 'KI-Dokumentations-Statistik (Paket Diktara erforderlich)', on: true },
  { id: 'capacity', name: 'Termine & Kapazität', desc: 'Auslastungs-Heatmap, No-Show, Wartezeit, Recall', on: true },
  { id: 'icd', name: 'ICD-10-Codierqualität', desc: 'Codierquote je Ärzt:in (Pflicht seit 01.07.2026)', on: true },
  { id: 'wahlarzt', name: 'Wahlarzt-Modus', desc: 'Offene Honorarnoten, WAHonline-Übermittlung, 80 %-Erstattungslogik', on: false },
  { id: 'benchmark', name: 'Anonymer Peer-Benchmark', desc: 'Vergleich mit anderen Tycho-Ordinationen – erfordert ausgehende Verbindung, daher standardmäßig aus', on: false },
  { id: 'qm', name: 'QM- & Hygiene-Fristen', desc: 'Geräteprüfungen, Schulungen, Hygieneplan (manuelle Pflege)', on: false },
  { id: 'inventory', name: 'Impfstoff- & Lagerbestand', desc: 'Ablaufdaten, Verbrauch vs. Termine', on: false },
]

export default function Einstellungen() {
  const [mods, setMods] = useState(MODULES)
  const [k, setK] = useState(5)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Einstellungen</h1>
        <p className="text-xs text-ink-3">Konfiguration wird lokal verschlüsselt gespeichert · Änderungen protokolliert</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Module" subtitle="Stationen und Analysen aktivieren – nur was gebucht ist, wird angezeigt">
          <div className="space-y-2">
            {mods.map((m) => (
              <label key={m.id} className={`flex items-start gap-3 rounded-md px-3 py-2 ${m.locked ? 'opacity-80' : 'hover:bg-surface-2 cursor-pointer'}`}>
                <input type="checkbox" checked={m.on} disabled={m.locked} onChange={() => setMods((ms) => ms.map((x) => x.id === m.id ? { ...x, on: !x.on } : x))} className="mt-1 accent-[var(--accent)]" />
                <div className="flex-1">
                  <div className="text-sm text-ink-1 flex items-center gap-2">{m.name} {m.locked && <Badge>Kern</Badge>}</div>
                  <div className="text-[11px] text-ink-3">{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Datenquellen" subtitle="Alle Verbindungen read-only">
            <dl className="text-xs grid grid-cols-[140px_1fr] gap-y-2 text-ink-2">
              <dt className="text-ink-3">PVS</dt><dd>{PRACTICE.pvs} · Login tycho_ro · Snapshot 19:00</dd>
              <dt className="text-ink-3">Active Directory</dt><dd>DC01.{PRACTICE.domain} · LDAPS 636 · Basis OU=Ordination</dd>
              <dt className="text-ink-3">Leitungsgruppe</dt><dd>G_Tycho_Leitung (2 Mitglieder)</dd>
              <dt className="text-ink-3">Ordicall</dt><dd>Export-Ordner \\TS-ORD-01\ordicall-stats (signiert)</dd>
              <dt className="text-ink-3">Diktara</dt><dd>Metadaten-API localhost:7411</dd>
              <dt className="text-ink-3">Dienstplan/Lohn</dt><dd>CSV monatlich · \\TS-ORD-01\tycho-in</dd>
              <dt className="text-ink-3">Honorarordnung</dt><dd>ÖGK Wien Allgemeinmedizin 2026 · SVS · BVAEB</dd>
            </dl>
          </Card>
          <Card title="Analyse & Digest">
            <dl className="text-xs grid grid-cols-[140px_1fr] gap-y-2 text-ink-2">
              <dt className="text-ink-3">Analysefenster</dt><dd>Betriebszeit {PRACTICE.openingHours}, Auswertung 05:00 Folgetag</dd>
              <dt className="text-ink-3">Digest</dt><dd>Montag 06:00 · S/MIME · G_Tycho_Leitung</dd>
              <dt className="text-ink-3">Quartalsreport</dt><dd>1. Werktag nach Quartalsende</dd>
              <dt className="text-ink-3">Aufbewahrung</dt><dd>Personenwerte 24 Monate, Aggregate 10 Jahre</dd>
            </dl>
          </Card>
          <Card title="Datenschutz-Schwellen" subtitle="k-Anonymität für aggregierte Auswertungen">
            <div className="flex items-center gap-4 text-sm">
              <input type="range" min={3} max={10} value={k} onChange={(e) => setK(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
              <span className="tabular w-16">k ≥ {k}</span>
            </div>
            <p className="text-[11px] text-ink-3 mt-2">Teamkennzahlen werden nur angezeigt, wenn mindestens {k} Personen enthalten sind. Empfehlung aus Betriebsvereinbarungen: 5–7.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
