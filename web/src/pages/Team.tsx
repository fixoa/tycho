import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Lock, Users } from 'lucide-react'
import { usePersonMode } from '../state/config'
import { useFilters } from '../state/filters'
import { Avatar, Badge, Card, Delta, ScoreRing, Bar as MiniBar, Table } from '../components/ui'
import { staffScores, componentPct, roleAverage, type StaffScore } from '../data/score'
import { ROLE_LABEL } from '../data/staff'
import { fmt } from '../lib/format'
import type { Role } from '../data/types'

const ROLES: Role[] = ['arzt', 'dgkp', 'assistenz', 'management']

export default function Team() {
  const nav = useNavigate()
  const personMode = usePersonMode()
  const fl = useFilters()
  const [role, setRole] = useState<Role | 'alle'>('alle')
  const scores = staffScores(fl.range, fl.compareRange).filter((s) => role === 'alle' || s.staff.role === role)
  const totalCost = scores.reduce((a, s) => a + s.kpis.cost, 0)
  const totalRevenue = scores.reduce((a, s) => a + s.kpis.revenue, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[15px] font-semibold text-ink-1">Personal & Effizienz</h1>
          <p className="text-[11.5px] text-ink-3 mt-0.5">Personalstamm aus Active Directory · Anwesenheit aus AD-Logon · Leistung aus PVS, Ordicall, Diktara · Zeitraum: {fl.range.label}</p>
        </div>
        <div className="flex gap-1 text-xs">
          {(['alle', ...ROLES] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-2.5 py-1.5 rounded border ${role === r ? 'bg-accent/15 border-accent/40 text-ink-1' : 'border-line-1 text-ink-2 hover:bg-surface-2'}`}>
              {r === 'alle' ? 'Alle' : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['arzt', 'dgkp', 'assistenz'] as const).map((r) => {
          const a = roleAverage(r, fl.range, fl.compareRange)
          return (
            <div key={r} className="card px-5 py-4 flex items-center gap-4">
              <ScoreRing score={a.score} size={64} stroke={6} />
              <div>
                <div className="text-xs text-ink-3">{ROLE_LABEL[r]}</div>
                <div className="text-sm font-medium">Ø Score</div>
                <Delta value={a.score - a.prev} />
              </div>
            </div>
          )
        })}
        <div className="card px-5 py-4">
          <div className="text-xs text-ink-3">Ertrag / Personalkosten (Auswahl)</div>
          <div className="text-2xl font-semibold">{fmt.num1(totalRevenue / Math.max(1, totalCost))}×</div>
          <div className="text-[11px] text-ink-3">{fmt.eur(totalRevenue)} verrechnet · {fmt.eur(totalCost)} Kosten</div>
        </div>
      </div>

      {!personMode && (
        <Card title="Team-basierte Analyse" subtitle="Konfiguriert vom Haupt-Admin · Einzelwerte, Rankings und persönliche Scores sind deaktiviert">
          <div className="flex gap-3 items-start text-sm text-ink-2">
            <Users size={18} className="text-accent shrink-0 mt-0.5" />
            <div>
              Tycho zeigt in diesem Modus nur Gruppenkennzahlen (Ärztegruppe, Pflege-/Laborgruppe, Assistenzgruppe, Verwaltung) mit k-Anonymität. Jede Person sieht die eigenen Rohwerte unter <span className="text-ink-1">Mein Score</span>.
              Der Modus kann in den Einstellungen vom Haupt-Admin auf „Pro Person“ umgestellt werden – das erfordert NDA, Einzelzustimmungen und DSFA.
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4 text-xs">
            {(['arzt', 'dgkp', 'assistenz'] as const).map((r) => {
              const g = staffScores().filter((x) => x.staff.role === r)
              const rev = g.reduce((a, x) => a + x.kpis.revenue, 0), cost = g.reduce((a, x) => a + x.kpis.cost, 0)
              return (
                <div key={r} className="rounded bg-surface-2 p-3 space-y-1">
                  <div className="text-ink-1 font-medium">{ROLE_LABEL[r]} <span className="text-ink-3">· {g.length} Personen · {fmt.num1(g.reduce((a, x) => a + x.staff.fte, 0))} FTE</span></div>
                  <div className="flex justify-between"><span className="text-ink-3">Ø Pat./h</span><span className="tabular">{fmt.num1(g.reduce((a, x) => a + x.kpis.contactsPerHour, 0) / g.length)}</span></div>
                  {rev > 0 && <div className="flex justify-between"><span className="text-ink-3">Verrechnet / Kosten</span><span className="tabular">{fmt.eur(rev)} / {fmt.eur(cost)}</span></div>}
                  <div className="flex justify-between"><span className="text-ink-3">Ø Dokumentation</span><span className="tabular">{fmt.pct1(g.reduce((a, x) => a + x.kpis.docCompleteness, 0) / g.length)}</span></div>
                  {g.length < 5 && <div className="text-status-warning">Gruppe &lt; k = 5 – im Digest mit Nachbargruppe zusammengefasst, hier nur für die Leitung sichtbar</div>}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {personMode && <Card title="Mitarbeiter:innen" subtitle="Rangliste nach Score · Klick auf eine Zeile öffnet die vollständige Aufschlüsselung · Pro-Person-Modus (NDA)" padded>
        <Table<StaffScore>
          rows={scores}
          keyOf={(s) => s.staff.id}
          onRowClick={(s) => nav(`/team/${s.staff.id}`)}
          cols={[
            { key: 'name', label: 'Person', render: (s) => (
              <div className="flex items-center gap-3">
                <Avatar name={s.staff.name} hue={s.staff.avatarHue} size={30} />
                <div>
                  <div className="text-ink-1 font-medium leading-tight whitespace-nowrap">{s.staff.name}</div>
                  <div className="text-[11px] text-ink-3">{s.staff.title} · {s.staff.account}</div>
                </div>
              </div>
            ) },
            { key: 'role', label: 'Rolle', render: (s) => <span className="text-ink-2">{ROLE_LABEL[s.staff.role]}</span> },
            { key: 'fte', label: 'FTE', align: 'right', render: (s) => fmt.pct(s.staff.fte) },
            { key: 'score', label: 'Score', align: 'right', width: '160px', render: (s) => s.staff.consent === 'nur-aggregiert' ? (
              <span className="inline-flex items-center gap-1 text-ink-3 text-xs"><Lock size={12} /> nur aggregiert</span>
            ) : (
              <div className="flex items-center gap-2 justify-end">
                <div className="w-20"><MiniBar value={s.score} max={100} tone={s.score >= 80 ? '#4fb3a8' : s.score >= 65 ? '#b9bb5f' : '#d9834a'} /></div>
                <span className="font-medium w-7">{s.score}</span>
                <Delta value={s.score - s.prevScore} />
              </div>
            ) },
            { key: 'pph', label: 'Pat./h', align: 'right', render: (s) => s.staff.consent === 'nur-aggregiert' ? '–' : fmt.num1(s.kpis.contactsPerHour) },
            { key: 'rev', label: 'Verrechnet', align: 'right', render: (s) => s.kpis.revenue ? fmt.eur(s.kpis.revenue) : '–' },
            { key: 'cost', label: 'Kosten', align: 'right', render: (s) => fmt.eur(s.kpis.cost) },
            { key: 'db', label: 'Deckungsbeitrag', align: 'right', render: (s) => s.kpis.revenue ? <span className={s.kpis.contribution >= 0 ? 'text-[var(--good-text)]' : 'text-status-critical'}>{fmt.eur(s.kpis.contribution)}</span> : <span className="text-ink-3">indirekt</span> },
            { key: 'consent', label: 'Auswertung', render: (s) => s.staff.consent === 'erteilt' ? <Badge tone="good">Zustimmung erteilt</Badge> : s.staff.consent === 'nur-aggregiert' ? <Badge tone="neutral">nur aggregiert</Badge> : <Badge tone="warning">ausstehend</Badge> },
          ]}
        />
      </Card>}

      <Card title="So wird der Score gebildet" subtitle="Keine Blackbox – jede Komponente hat einen Istwert, einen Zielwert und ein Gewicht">
        <div className="grid md:grid-cols-3 gap-4 text-xs text-ink-2">
          {(['arzt', 'dgkp', 'assistenz'] as const).map((r) => {
            const sample = staffScores().find((s) => s.staff.role === r)!
            return (
              <div key={r}>
                <div className="text-ink-1 font-medium mb-2">{ROLE_LABEL[r]}</div>
                <ul className="space-y-1">
                  {sample.components.map((c) => (
                    <li key={c.key} className="flex justify-between gap-2">
                      <span title={c.hint} className="inline-flex items-center gap-1">{c.label} <Info size={10} className="text-ink-3" /></span>
                      <span className="tabular text-ink-3">{Math.round(c.weight * 100)} %</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-ink-3 mt-4 leading-relaxed">
          Erreichungsgrad = min(Ist ÷ Ziel, 125 %) ÷ 125 %. Der Score ist das gewichtete Mittel der Komponenten. Zielwerte sind je Ordination konfigurierbar (Einstellungen).
          Der Score ist eine Entscheidungshilfe für Menschen, nie eine automatische Entscheidung (Art. 22 DSGVO, AI Act Art. 26). Beispielwerte oben: {componentPct(staffScores()[0].components[0])} % Durchsatz-Erreichung bei {staffScores()[0].staff.name}.
        </p>
      </Card>
    </div>
  )
}
