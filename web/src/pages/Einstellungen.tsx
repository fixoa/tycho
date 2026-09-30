import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldWarning as ShieldAlert, Users, UserFocus as UserSearch } from '@phosphor-icons/react'
import { Card, Badge } from '../components/ui'
import { PRACTICE } from '../data/mock'
import { useConfig, DEFAULT_MODULES } from '../state/config'
import { useAuth, isAdmin } from '../state/auth'
import { Sun, Moon, SquaresFour as LayoutGrid, Crosshair as Radar, Monitor } from '@phosphor-icons/react'
import { fmt } from '../lib/format'

const MODULES = [
  { id: 'station', name: 'Tycho Station', desc: 'Dashboard, Efficacy Score, Praxis-Radar', locked: true },
  { id: 'forecast', name: 'Prognose & Szenarien', desc: 'Quartalshochrechnung, Kostenträger, Was-wäre-wenn', locked: true },
  { id: 'billing', name: 'Abrechnungs-Kreuzprüfung', desc: 'PVS × Diktara × Ordicall: nicht verrechnete Leistungen, Limits, Plausibilität' },
  { id: 'ordicall', name: 'Ordicall Station', desc: 'Telefon-KI-Statistik (Paket Ordicall erforderlich)' },
  { id: 'diktara', name: 'Diktara Station', desc: 'KI-Dokumentations-Statistik (Paket Diktara erforderlich)' },
  { id: 'tailwind', name: 'Tailwind Station', desc: 'Honorarnoten-Controlling & Inkasso mit KI, HR-Frühwarnung aus Planery (hochsicherheitskritisch)' },
  { id: 'capacity', name: 'Termine & Kapazität', desc: 'Auslastungs-Heatmap, No-Show, Wartezeit, Recall' },
  { id: 'icd', name: 'ICD-10-Codierqualität', desc: 'Codierquote je Gruppe/Ärzt:in (Pflicht seit 01.07.2026)' },
  { id: 'zuweiser', name: 'Zuweiser-Analyse', desc: 'ABC-Analyse, Trend, abgesprungene Zuweiser' },
  { id: 'verordnung', name: 'Verordnungs-Monitor', desc: 'Verordnungskosten, Generika-Quote, ÖKO-Tool-Ausreißer' },
  { id: 'qm', name: 'QM & Fristen', desc: 'Geräteprüfungen, Schulungen, Hygieneplan, Dokumente' },
  { id: 'nps', name: 'Zufriedenheit (NPS)', desc: 'Google-Rezensionen und Ordicall-SMS-Umfrage, Themenanalyse' },
  { id: 'selfservice', name: 'Self-Service „Mein Score“', desc: 'Jede:r Mitarbeiter:in sieht die eigenen Werte' },
  { id: 'wahlarzt', name: 'Wahlarzt-Modus', desc: 'WAHonline-Status, 80 %-Erstattungslogik, 300-Patienten-Schwelle (Teil von Tailwind)' },
]

export default function Einstellungen() {
  const { config, save, reset, ui, setUi } = useConfig()
  const { session, themeMode, setTheme } = useAuth()
  const admin = session ? isAdmin(session.user) : false
  const mods = config?.modules ?? DEFAULT_MODULES
  const [k, setK] = useState(config?.kAnonymity ?? 5)
  const toggle = (id: string) => config && save({ ...config, modules: { ...mods, [id]: !mods[id] } })
  const setKAnon = (v: number) => { setK(v); if (config) save({ ...config, kAnonymity: v }) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-ink-1">Einstellungen</h1>
        <p className="text-[11.5px] text-ink-3 mt-0.5">Konfiguration wird lokal verschlüsselt gespeichert · jede Änderung protokolliert</p>
      </div>

      <Card title="Oberfläche" subtitle="Simple: ruhige Übersicht mit Assistent · Advanced: dichte Station im Gotham-Stil · beide in Hell und Dunkel">
        <div className="grid md:grid-cols-2 gap-3">
          {([['simple', 'Simple', 'Große Karten, Assistent rechts, wenige klare Kennzahlen. Für den täglichen Blick.', LayoutGrid], ['advanced', 'Advanced', 'Modulleiste, Facetten, KPI-Leiste, Donuts und Zeitachse. Für Analyse und Kontrolle.', Radar]] as const).map(([k, t, d, I]) => (
            <button key={k} onClick={() => setUi(k)} className={`text-left rounded-xl border p-4 ${ui === k ? 'border-accent bg-surface-2' : 'border-line-1 hover:bg-surface-2'}`}>
              <div className="flex items-center gap-2 font-medium text-[14px]"><I size={16} className="text-accent" /> {t} {ui === k && <Badge tone="info">aktiv</Badge>}</div>
              <div className="text-[12.5px] text-ink-2 mt-1">{d}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[13px] flex-wrap"><span className="text-ink-2 mr-1">Design:</span>
          {([['system', 'System', Monitor], ['light', 'Hell', Sun], ['dark', 'Dunkel', Moon]] as const).map(([k, t, I]) => <button key={k} onClick={() => setTheme(k)} className={`bp-btn ${themeMode === k ? 'active' : ''}`}><I size={14} /> {t}</button>)}
          <span className="text-[12px] text-ink-3">„System“ folgt der Windows-Einstellung (hell/dunkel) automatisch.</span></div>
      </Card>

      <Card title="Analysemodus" subtitle="Festgelegt bei der Erstkonfiguration durch den Haupt-Admin">
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`flex-1 min-w-[260px] rounded border p-4 ${config?.analysisMode === 'person' ? 'border-status-critical/50 bg-status-critical/5' : 'border-accent/40 bg-accent/5'}`}>
            <div className="flex items-center gap-2 font-medium text-sm">
              {config?.analysisMode === 'person' ? <UserSearch size={16} className="text-status-critical" /> : <Users size={16} className="text-accent" />}
              {config?.analysisMode === 'person' ? 'Pro Person (NDA)' : 'Team-basiert'}
            </div>
            <div className="text-xs text-ink-2 mt-1">
              {config?.analysisMode === 'person'
                ? 'Persönliche Scores, Rankings, Kosten und HR-Werte je Person sind sichtbar. NDA akzeptiert.'
                : 'Nur Gruppenkennzahlen (Ärzte-, Pflege-/Labor-, Assistenzgruppe, Verwaltung). Keine Einzelwerte, keine Rankings.'}
            </div>
            <div className="text-[11px] text-ink-3 mt-2">Konfiguriert von {config?.configuredBy} am {config ? fmt.date(new Date(config.configuredAt)) : '–'} · im Audit-Log</div>
          </div>
          <div className="text-xs space-y-2">
            {admin ? (
              <Link to="/setup" className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-line-2 hover:bg-surface-2 text-ink-1"><ShieldAlert size={14} /> Modus ändern (erneute Bestätigung)</Link>
            ) : <Badge>Nur Haupt-Admin (G_Tycho_Admin)</Badge>}
            {admin && <button onClick={reset} className="block text-ink-3 hover:text-ink-1">Erstkonfiguration zurücksetzen (Demo)</button>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Module" subtitle="Stationen und Analysen aktivieren – nur was gebucht ist, wird angezeigt · Peer-Benchmark zwischen Ordinationen gibt es bewusst nicht">
          <div className="space-y-2">
            {MODULES.map((m) => (
              <label key={m.id} className={`flex items-start gap-3 rounded px-3 py-2 ${m.locked ? 'opacity-80' : 'hover:bg-surface-2 cursor-pointer'}`}>
                <input type="checkbox" checked={m.locked ? true : (mods[m.id] ?? true)} disabled={m.locked || !admin} onChange={() => toggle(m.id)} className="mt-1 accent-[var(--accent)]" />
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
              <dt className="text-ink-3">PVS</dt><dd>{PRACTICE.pvs} · Leselogin tycho_ro · VSS-Kopie 19:00</dd>
              <dt className="text-ink-3">Active Directory</dt><dd>DC01.{PRACTICE.domain} · LDAPS 636 · Basis OU=Ordination</dd>
              <dt className="text-ink-3">Leitungsgruppen</dt><dd>G_Tycho_Leitung (2) · G_Tycho_Admin (1) · G_Tailwind_HR (1)</dd>
              <dt className="text-ink-3">Ordicall</dt><dd>Export-Ordner \\TS-ORD-01\ordicall-stats (signiert)</dd>
              <dt className="text-ink-3">Diktara</dt><dd>Metadaten-API localhost:7411</dd>
              <dt className="text-ink-3">Planery</dt><dd>Read-only API-Token (Scope Zeiten/Abwesenheiten/Salden), Token im TPM</dd>
              <dt className="text-ink-3">Bank</dt><dd>CAMT.053 täglich · \\TS-ORD-01\tycho-in\bank</dd>
              <dt className="text-ink-3">Lohnverrechnung</dt><dd>CSV monatlich · \\TS-ORD-01\tycho-in</dd>
              <dt className="text-ink-3">Honorarordnung</dt><dd>ÖGK Wien Allgemeinmedizin 2026 · SVS · BVAEB</dd>
            </dl>
          </Card>
          <Card title="Analyse & Digest">
            <dl className="text-xs grid grid-cols-[140px_1fr] gap-y-2 text-ink-2">
              <dt className="text-ink-3">Analysefenster</dt><dd>Betriebszeit {PRACTICE.openingHours}, Auswertung 05:00 Folgetag</dd>
              <dt className="text-ink-3">Digest</dt><dd>Montag 06:00 · S/MIME · G_Tycho_Leitung</dd>
              <dt className="text-ink-3">Quartalsreport</dt><dd>1. Werktag nach Quartalsende</dd>
              <dt className="text-ink-3">Aufbewahrung</dt><dd>Personenwerte 24 Monate, Aggregate 10 Jahre, Planery-Daten 12 Monate</dd>
            </dl>
          </Card>
          <Card title="Datenschutz-Schwellen" subtitle="k-Anonymität für Gruppenkennzahlen">
            <div className="flex items-center gap-4 text-sm">
              <input type="range" min={3} max={10} value={k} disabled={!admin} onChange={(e) => setKAnon(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
              <span className="tabular w-16">k ≥ {k}</span>
            </div>
            <p className="text-[11px] text-ink-3 mt-2">Gruppenkennzahlen werden nur angezeigt, wenn mindestens {k} Personen enthalten sind; kleinere Gruppen werden zusammengefasst. Empfehlung aus Betriebsvereinbarungen: 5–7.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
