import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts'
import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { Badge, Card, ChartTooltip, Delta, Legend, ScoreRing, StatTile, Bar as MiniBar } from '../components/ui'
import { fmt } from '../lib/format'
import { BILLING_FINDINGS, DATA_AS_OF, PREV_QUARTER, QUARTER, demo, GO_LIVE } from '../data/mock'
import { practiceScore, roleAverage, staffScores } from '../data/score'
import { compareWindows, practiceWeekly, quarterToDate } from '../data/aggregate'
import { ROLE_LABEL } from '../data/staff'
import { usePersonMode } from '../state/config'
import { tailwindSummary, HR } from '../data/tailwind'

const severityTone = { critical: 'critical', serious: 'serious', warning: 'warning', info: 'info' } as const

export default function Station() {
  const { forecast } = demo()
  const personMode = usePersonMode()
  const tw = tailwindSummary()
  const ps = practiceScore()
  const qtd = quarterToDate()
  const { cur, prev } = compareWindows()
  const weeks = practiceWeekly()
  const scores = staffScores().filter((s) => s.staff.role !== 'management').sort((a, b) => b.score - a.score)
  const openFindingsValue = BILLING_FINDINGS.filter((f) => f.valueEur > 0).reduce((a, f) => a + f.valueEur, 0)
  const projDelta = (forecast.projected - PREV_QUARTER.revenue) / PREV_QUARTER.revenue
  const daysLeft = Math.round((QUARTER.end.getTime() - DATA_AS_OF.getTime()) / 86400000)
  const roles = (['arzt', 'dgkp', 'assistenz'] as const).map((r) => ({ role: r, ...roleAverage(r) }))

  const radar = [
    { label: 'Telemedizin-Anteil', value: fmt.pct1(cur.telemedShare), delta: <Delta value={(cur.telemedShare - prev.telemedShare) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" Pp." />, target: 'Ziel 15 %', pct: cur.telemedShare / 0.15 },
    { label: 'No-Show-Rate', value: fmt.pct1(cur.noShowRate), delta: <Delta value={(cur.noShowRate - prev.noShowRate) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" Pp." invert />, target: 'Ziel ≤ 4 %', pct: 0.04 / Math.max(cur.noShowRate, 0.001) },
    { label: 'Ø Wartezeit', value: `${fmt.num1(cur.wait)} min`, delta: <Delta value={cur.wait - prev.wait} format={(v) => fmt.num1(Math.abs(v))} suffix=" min" invert />, target: 'Ziel ≤ 12 min', pct: 12 / Math.max(cur.wait, 1) },
    { label: 'Doku-Zeit gespart', value: fmt.minutes(cur.savedMin), delta: <Delta value={cur.savedMin - prev.savedMin} format={(v) => fmt.minutes(Math.abs(v))} />, target: 'Diktara, 4 Wochen', pct: 1 },
    { label: 'Manuelle Anrufe', value: fmt.num(cur.calls), delta: <Delta value={cur.calls - prev.calls} invert />, target: 'nach Ordicall', pct: 1 },
    { label: 'ICD-10-Codierquote', value: '93,4 %', delta: <Delta value={2.1} format={(v) => fmt.num1(v)} suffix=" Pp." />, target: 'Pflicht seit 01.07.2026', pct: 0.934 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Tycho Station</h1>
          <p className="text-xs text-ink-3">Nächtliche Analyse vom {fmt.date(DATA_AS_OF)} · {QUARTER.label} · noch {daysLeft} Tage bis Quartalsende</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge tone="good"><CheckCircle2 size={12} /> Alle 9 Datenquellen aktuell</Badge>
          <Badge tone="neutral">Tycho seit {fmt.dateShort(GO_LIVE.tycho)}</Badge>
        </div>
      </div>

      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card title="Efficacy Score" subtitle="Ordination gesamt · kostengewichtet · 4 Wochen">
          <div className="flex items-center gap-5">
            <ScoreRing score={ps.score} prev={ps.prev} size={128} stroke={10} />
            <div className="space-y-2 flex-1">
              {roles.map((r) => (
                <div key={r.role}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink-2">{ROLE_LABEL[r.role]}</span>
                    <span className="tabular text-ink-1 font-medium">{r.score} <Delta value={r.score - r.prev} /></span>
                  </div>
                  <MiniBar value={r.score} max={100} tone={r.score >= 80 ? '#0ca30c' : r.score >= 65 ? '#fab219' : '#ec835a'} />
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-3 mt-4 leading-relaxed">
            Der Score gewichtet Durchsatz, Ertrag/Kosten, Dokumentation, Telemedizin, Terminausfall und Abrechnungsqualität je Rolle. Jede Komponente ist in <Link to="/team" className="text-accent">Personal & Effizienz</Link> aufgeschlüsselt.
          </p>
        </Card>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile label="Prognose Quartalsumsatz" value={fmt.eur(forecast.projected)} accent="var(--series-1)"
            delta={<Delta value={projDelta * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" %" />} deltaLabel={`vs. ${PREV_QUARTER.label}`}
            hint="Hochrechnung aus verrechneten Leistungen + Privat-/Wahlarztanteil, 90 %-Band siehe Prognose." />
          <StatTile label="Bisher verrechnet (QTD)" value={fmt.eur(forecast.actualToDate)} accent="var(--series-3)"
            deltaLabel={`${fmt.num(forecast.scheineToDate)} Scheine · Fallwert ${fmt.eur2(forecast.actualToDate / forecast.scheineToDate)}`} />
          <StatTile label="Offene Abrechnungslücken" value={fmt.eur(openFindingsValue)} accent="#d03b3b"
            deltaLabel={`${BILLING_FINDINGS.length} Findings · vor Quartalsabrechnung`} hint="Leistungen, die laut Kartei/Diktara erbracht, im Leistungsblatt aber nicht erfasst sind." />
          <StatTile label="Offene Privathonorare (Tailwind)" value={fmt.eur(tw.openSum)} accent="var(--series-7)"
            deltaLabel={`${fmt.eur(tw.overdueSum)} überfällig · ${fmt.num(qtd.contacts)} Kontakte QTD`} hint="Wahlarzt-, Physio-, TCM- und Impfhonorare aus dem PVS-Honorarnotenmodul, abgeglichen mit Bankumsätzen." />
        </div>
      </div>

      {/* Radar + Forecast chart */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4">
        <Card title="Praxis-Radar" subtitle="Die sechs Stellschrauben mit Zielwert – letzte 4 Wochen vs. 4 Wochen davor">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {radar.map((r) => (
              <div key={r.label}>
                <div className="text-[11px] text-ink-3">{r.label}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold">{r.value}</span>
                  {r.delta}
                </div>
                <MiniBar value={Math.min(1, r.pct)} max={1} tone={r.pct >= 1 ? '#0ca30c' : r.pct >= 0.7 ? '#fab219' : '#ec835a'} height={4} />
                <div className="text-[10px] text-ink-3 mt-0.5">{r.target}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Umsatzverlauf & Prognose bis Quartalsende" subtitle="Kumuliert, verrechnete Leistungen inkl. Privatanteil · Band = 90 %-Konfidenz"
          action={<Link to="/prognose" className="text-xs text-accent inline-flex items-center gap-1">Details <ArrowRight size={12} /></Link>}>
          <div className="h-60">
            <ResponsiveContainer>
              <AreaChart data={forecast.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => fmt.dateShort(new Date(d))} minTickGap={40} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmt.k(v)} width={64} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.eur(v)} />} labelFormatter={(d) => fmt.date(new Date(String(d)))} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="var(--series-1)" fillOpacity={0.12} name="Obergrenze" isAnimationActive={false} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="var(--surface-1)" fillOpacity={1} name="Untergrenze" isAnimationActive={false} />
                <Line type="monotone" dataKey="forecast" stroke="var(--series-1)" strokeWidth={2} strokeDasharray="4 3" dot={false} name="Prognose" isAnimationActive={false} />
                <Line type="monotone" dataKey="actual" stroke="var(--series-1)" strokeWidth={2.5} dot={false} name="Ist" isAnimationActive={false} />
                <ReferenceLine y={PREV_QUARTER.revenue} stroke="var(--ink-3)" strokeDasharray="2 4" label={{ value: `${PREV_QUARTER.label}: ${fmt.k(PREV_QUARTER.revenue)}`, fill: 'var(--ink-3)', fontSize: 10, position: 'insideTopLeft' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <Legend items={[{ label: 'Ist', color: 'var(--series-1)' }, { label: 'Prognose (90 %-Band)', color: 'color-mix(in srgb, var(--series-1) 40%, transparent)' }]} />
            <span className="text-xs text-ink-3 tabular">{fmt.eur(forecast.lower)} – {fmt.eur(forecast.upper)}</span>
          </div>
        </Card>
      </div>

      {/* Team + Findings */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
        <Card title={personMode ? 'Team-Effizienz' : 'Team-Effizienz (Gruppen)'} subtitle={personMode ? 'Score je Person · letzte 4 Wochen · klick für Aufschlüsselung' : 'Team-Modus: nur Gruppenwerte · letzte 4 Wochen'}
          action={<Link to="/team" className="text-xs text-accent inline-flex items-center gap-1">Alle <ArrowRight size={12} /></Link>}>
          {!personMode && (
            <div className="space-y-3">
              {roles.map((r) => (
                <div key={r.role} className="flex items-center gap-3">
                  <span className="text-sm text-ink-1 w-44">{ROLE_LABEL[r.role]}</span>
                  <div className="flex-1"><MiniBar value={r.score} max={100} tone="var(--series-1)" height={5} /></div>
                  <span className="tabular text-sm font-medium w-8 text-right">{r.score}</span>
                  <span className="w-12 text-right"><Delta value={r.score - r.prev} /></span>
                </div>
              ))}
              <div className="pt-2 border-t border-line-1 text-xs text-ink-2 space-y-1">
                <div className="flex justify-between"><span>Überstundensaldo Team (Planery)</span><span className="tabular">{fmt.num(HR.reduce((a, h) => a + h.overtimeBalanceH, 0))} h</span></div>
                <div className="flex justify-between"><span>HR-Frühwarnungen</span><span className="tabular">{HR.filter((h) => h.warning).length}</span></div>
              </div>
            </div>
          )}
          <div className={personMode ? 'space-y-2' : 'hidden'}>
            {scores.map((s) => (
              <Link key={s.staff.id} to={`/team/${s.staff.id}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.score >= 80 ? '#0ca30c' : s.score >= 65 ? '#fab219' : s.score >= 50 ? '#ec835a' : '#d03b3b' }} />
                <span className="text-sm text-ink-1 w-40 truncate">{s.staff.name}</span>
                <span className="text-[11px] text-ink-3 w-32 truncate hidden md:inline">{ROLE_LABEL[s.staff.role]}{s.staff.fte < 1 ? ` · ${Math.round(s.staff.fte * 100)} %` : ''}</span>
                <div className="flex-1"><MiniBar value={s.score} max={100} tone="var(--series-1)" height={5} /></div>
                <span className="tabular text-sm font-medium w-8 text-right">{s.score}</span>
                <span className="w-12 text-right"><Delta value={s.score - s.prevScore} /></span>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Handlungsbedarf" subtitle="Abrechnungs-Findings aus der Kreuzprüfung PVS × Diktara × Ordicall"
          action={<Link to="/leistungen" className="text-xs text-accent inline-flex items-center gap-1">Alle <ArrowRight size={12} /></Link>}>
          <div className="space-y-3">
            {BILLING_FINDINGS.slice(0, 5).map((f) => (
              <div key={f.id} className="flex gap-3">
                <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${f.severity === 'critical' ? 'text-status-critical' : f.severity === 'serious' ? 'text-status-serious' : f.severity === 'warning' ? 'text-status-warning' : 'text-series-1'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink-1 leading-snug">{f.title}</div>
                  <div className="text-[11px] text-ink-3 flex items-center gap-2 mt-0.5">
                    <Badge tone={severityTone[f.severity]}>{f.source}</Badge>
                    <span className="tabular">{fmt.eur2(f.valueEur)}</span>
                    <span>· {fmt.dateShort(new Date(f.date))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Patientenkontakte je Woche" subtitle="Ärzt:innen · seit April">
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={weeks} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" interval={3} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="contacts" name="Kontakte" fill="var(--series-1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Manuell bearbeitete Anrufe" subtitle={`Empfang · Ordicall-Go-Live ${fmt.dateShort(GO_LIVE.ordicall)}`}>
          <div className="h-40">
            <ResponsiveContainer>
              <LineChart data={weeks} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" interval={3} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine x="KW 23" stroke="var(--ink-3)" strokeDasharray="2 4" label={{ value: 'Ordicall', fill: 'var(--ink-3)', fontSize: 10, position: 'insideTopRight' }} />
                <Line type="monotone" dataKey="calls" name="Anrufe" stroke="var(--series-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Dokumentationszeit gespart" subtitle={`Diktara · Go-Live ${fmt.dateShort(GO_LIVE.diktara)} · Minuten je Woche`}>
          <div className="h-40">
            <ResponsiveContainer>
              <AreaChart data={weeks} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" interval={3} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => fmt.k(v)} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.minutes(v)} />} />
                <Area type="monotone" dataKey="savedMin" name="Gespart" stroke="var(--series-3)" fill="var(--series-3)" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />
          <div className="text-sm text-ink-2 leading-relaxed">
            <span className="text-ink-1 font-medium">Tycho-Einschätzung für heute:</span> Die Ordination liegt {fmt.pct1(projDelta)} über dem Vorquartal, getragen von höherem Telemedizin-Anteil und weniger Terminausfällen seit Ordicall.
            Größter Hebel vor der Quartalsabrechnung sind {fmt.eur(openFindingsValue)} nicht erfasste Leistungen, davon {fmt.eur(BILLING_FINDINGS[0].valueEur)} fehlende Grundleistungen.
            Das Limit für Therapeutische Aussprache (EL21) wird voraussichtlich am 04.09. erreicht – Umschichtung auf Beratung chronische Erkrankung (EL22) prüfen.
          </div>
        </div>
      </Card>
    </div>
  )
}
