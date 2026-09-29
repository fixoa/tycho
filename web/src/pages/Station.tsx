import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowRight, ArrowUp, ArrowDown, ChevronDown, Sparkles } from 'lucide-react'
import { Badge, Card, ChartTooltip, Delta, Bar as MiniBar } from '../components/ui'
import { fmt } from '../lib/format'
import { BILLING_FINDINGS, PREV_QUARTER, demo } from '../data/mock'
import { practiceScore, roleAverage, staffScores } from '../data/score'
import { lastNDays, useData, pctDelta } from '../data/aggregate'
import { ROLE_LABEL, STAFF } from '../data/staff'
import { usePersonMode } from '../state/config'
import { tailwindSummary, HR } from '../data/tailwind'

const severityTone = { critical: 'critical', serious: 'serious', warning: 'warning', info: 'info' } as const
const C = ['var(--series-3)', 'var(--series-2)', 'var(--series-4)', 'var(--series-1)', 'var(--series-5)', 'var(--series-6)']

/** Gotham-KPI: Label, große leichte Zahl, farbiger Pfeil mit Delta */
function Kpi({ label, value, delta, invert = false, format = (v: number) => fmt.num(Math.abs(v)) }: { label: string; value: string; delta: number; invert?: boolean; format?: (v: number) => string }) {
  const good = invert ? delta < 0 : delta > 0
  const color = delta === 0 ? 'text-ink-3' : good ? 'text-status-good' : 'text-status-critical'
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-ink-3 truncate">{label}</div>
      <div className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-[26px] font-light text-ink-1 leading-none tabular">{value}</span>
        <span className={`inline-flex items-center text-[11px] ${color}`}>{delta > 0 ? <ArrowUp size={11} /> : delta < 0 ? <ArrowDown size={11} /> : null}{format(delta)}</span>
      </div>
    </div>
  )
}

function Donut({ title, data, total }: { title: string; data: { name: string; value: number; delta?: number }[]; total?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const sum = data.reduce((a, d) => a + d.value, 0)
  return (
    <div className="min-w-0">
      <div className="label mb-1">{title}</div>
      <div className="flex items-center gap-3 min-w-0">
      <div className="w-[150px] h-[150px] shrink-0 relative">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={44} outerRadius={70} paddingAngle={1} stroke="var(--surface-1)" strokeWidth={2} isAnimationActive={false}
              onMouseEnter={(_, i) => setHover(i)} onMouseLeave={() => setHover(null)}>
              {data.map((_, i) => <Cell key={i} fill={C[i % C.length]} opacity={hover === null || hover === i ? 1 : 0.45} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {hover !== null ? (
            <div className="text-center"><div className="text-[10px] text-ink-3 max-w-[70px] truncate">{data[hover].name}</div><div className="text-[18px] font-light leading-none tabular">{fmt.num(data[hover].value)}</div>{data[hover].delta !== undefined && <div className={`text-[10px] ${data[hover].delta! >= 0 ? 'text-status-good' : 'text-status-critical'}`}>{fmt.signed(data[hover].delta!)}</div>}</div>
          ) : total ? <div className="text-center"><div className="text-[18px] font-light leading-none tabular">{total}</div></div> : null}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <ul className="space-y-1.5">
          {data.map((d, i) => (
            <li key={d.name} className={`flex items-start gap-2 text-[12px] leading-tight ${hover === i ? 'text-ink-1' : 'text-ink-2'}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <span className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ background: C[i % C.length] }} />
              <span className="min-w-0">{d.name} <span className="text-ink-3 tabular">{fmt.pct(d.value / sum)}</span></span>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  )
}

export default function Station() {
  const { forecast, calls } = demo()
  const personMode = usePersonMode()
  const tw = tailwindSummary()
  const dd = useData()
  const ps = practiceScore(dd.range, dd.compareRange)
  const cur = dd.s, prev = dd.p ?? dd.s
  const scores = staffScores(dd.range, dd.compareRange).filter((s) => s.staff.role !== 'management').sort((a, b) => b.score - a.score)
  const openFindingsValue = BILLING_FINDINGS.filter((f) => f.valueEur > 0).reduce((a, f) => a + f.valueEur, 0)
  const projDelta = (forecast.projected - PREV_QUARTER.revenue) / PREV_QUARTER.revenue
  const roles = (['arzt', 'dgkp', 'assistenz'] as const).map((r) => ({ role: r, ...roleAverage(r, dd.range, dd.compareRange) }))
  const c20 = dd.calls.length ? dd.calls : calls.days.slice(-20), p20 = dd.callsPrev.length ? dd.callsPrev : calls.days.slice(-40, -20)
  const sumC = (arr: typeof c20, k: 'total' | 'aiResolved' | 'missed' | 'bookings') => arr.reduce((a, d) => a + d[k], 0)

  // KPI-Leiste: 12 Kennzahlen, 4 Wochen vs. 4 Wochen davor
  const kpis = [
    { label: 'Efficacy Score', value: `${ps.score}`, delta: ps.score - ps.prev },
    { label: 'Kontakte', value: fmt.num(cur.contacts), delta: cur.contacts - prev.contacts },
    { label: 'Umsatz (k€)', value: fmt.num1(cur.revenue / 1000), delta: Math.round(pctDelta(cur.revenue, prev.revenue)), format: (v: number) => `${fmt.num(Math.abs(v))} %` },
    { label: 'Telemedizin %', value: fmt.num1(cur.telemedShare * 100), delta: Math.round((cur.telemedShare - prev.telemedShare) * 1000) / 10, format: (v: number) => fmt.num1(Math.abs(v)) },
    { label: 'No-Show %', value: fmt.num1(cur.noShowRate * 100), delta: Math.round((cur.noShowRate - prev.noShowRate) * 1000) / 10, invert: true, format: (v: number) => fmt.num1(Math.abs(v)) },
    { label: 'Ø Wartezeit (min)', value: fmt.num1(cur.wait), delta: Math.round((cur.wait - prev.wait) * 10) / 10, invert: true, format: (v: number) => fmt.num1(Math.abs(v)) },
    { label: 'Anrufe', value: fmt.num(sumC(c20, 'total')), delta: sumC(c20, 'total') - sumC(p20, 'total') },
    { label: 'KI erledigt %', value: fmt.num(sumC(c20, 'aiResolved') / sumC(c20, 'total') * 100), delta: Math.round((sumC(c20, 'aiResolved') / sumC(c20, 'total') - sumC(p20, 'aiResolved') / sumC(p20, 'total')) * 1000) / 10, format: (v: number) => fmt.num1(Math.abs(v)) },
    { label: 'Doku gespart (h)', value: fmt.num(cur.savedMin / 60), delta: Math.round((cur.savedMin - prev.savedMin) / 60), format: (v: number) => fmt.num(Math.abs(v)) },
    { label: 'Findings', value: `${BILLING_FINDINGS.length}`, delta: 3, invert: true },
    { label: 'Offene Honorare (k€)', value: fmt.num1(tw.openSum / 1000), delta: -1.2, invert: true, format: (v: number) => fmt.num1(Math.abs(v)) },
    { label: 'HR-Warnungen', value: `${HR.filter((h) => h.warning).length}`, delta: 1, invert: true },
  ]

  // Donuts
  const byRole = (['arzt', 'dgkp', 'assistenz'] as const).map((r) => ({ name: ROLE_LABEL[r], value: staffScores(dd.range, dd.compareRange).filter((s) => s.staff.role === r).reduce((a, s) => a + s.kpis.contacts, 0), delta: r === 'arzt' ? 42 : r === 'dgkp' ? -3 : 12 }))
  const byCat = ['Grundleistung', 'Einzelleistung', 'Labor', 'Telemedizin', 'Vorsorge', 'Sonstiges'].map((c) => ({ name: c, value: dd.services.filter((s) => s.category === c).reduce((a, s) => a + s.value, 0) })).filter((x) => x.value > 0)
  const byOutcome = [{ name: 'KI erledigt', value: sumC(c20, 'aiResolved'), delta: 61 }, { name: 'Übergeben', value: sumC(c20, 'total') - sumC(c20, 'aiResolved') - sumC(c20, 'missed'), delta: -34 }, { name: 'Verpasst', value: sumC(c20, 'missed'), delta: -8 }]
  const byPayer = [{ name: 'ÖGK', value: 0.71 }, { name: 'SVS', value: 0.11 }, { name: 'BVAEB', value: 0.09 }, { name: 'Privat / Wahlarzt', value: 0.09 }].map((k) => ({ ...k, value: Math.round(k.value * forecast.projected) }))

  // Timeline: letzte 10 Arbeitstage, gestapelt nach Rolle
  const days = [...new Set(lastNDays(10).map((r) => r.date))].sort()
  const timeline = days.map((d) => {
    const rs = lastNDays(10).filter((r) => r.date === d)
    const by = (role: string) => rs.filter((r) => STAFF.find((s) => s.id === r.staffId)?.role === role).reduce((a, r) => a + r.patientContacts, 0)
    return { date: d, label: `${new Date(d).getDate()}. ${new Date(d).toLocaleDateString('de-AT', { month: 'short' })}`, arzt: by('arzt'), dgkp: by('dgkp'), assistenz: Math.round(by('assistenz') * 0.35) }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-[15px] font-semibold text-ink-1">Ordinations-Übersicht</h1>
        <div className="flex items-center gap-2 text-[12px] text-ink-2">
          <span>Zeige</span><span className="bp-btn">{dd.range.label} <ChevronDown size={12} /></span>
          <span>Vergleich</span><span className="bp-btn">{dd.compareRange?.label ?? 'kein'} <ChevronDown size={12} /></span>
        </div>
      </div>

      {/* KPI-Leiste */}
      <div className="card px-5 py-4">
        <div className="grid gap-x-3 gap-y-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))' }}>
          {kpis.map((k) => <Kpi key={k.label} {...k} />)}
        </div>
      </div>

      {/* Donut-Reihe */}
      <div className="card px-5 py-5">
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <Donut title="Kontakte nach Rolle" data={byRole} total={fmt.num(byRole.reduce((a, d) => a + d.value, 0))} />
          <Donut title="Umsatz nach Leistungsgruppe" data={byCat} total={fmt.k(byCat.reduce((a, d) => a + d.value, 0))} />
          <Donut title="Anrufe nach Ergebnis" data={byOutcome} total={fmt.num(byOutcome.reduce((a, d) => a + d.value, 0))} />
          <Donut title="Prognose nach Kostenträger" data={byPayer} total={fmt.k(forecast.projected)} />
        </div>
      </div>

      {/* Timeline */}
      <div className="card px-5 py-4">
        <div className="label mb-3">Zeitachse · Patientenkontakte je Tag</div>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_180px] gap-4">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={timeline} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="linear" dataKey="assistenz" stackId="a" name="Assistenz (Check-in)" stroke="var(--series-1)" fill="var(--series-1)" fillOpacity={0.35} strokeWidth={1.5} isAnimationActive={false} />
                <Area type="linear" dataKey="dgkp" stackId="a" name="DGKP" stroke="var(--series-4)" fill="var(--series-4)" fillOpacity={0.35} strokeWidth={1.5} isAnimationActive={false} />
                <Area type="linear" dataKey="arzt" stackId="a" name="Ärzt:innen" stroke="var(--series-3)" fill="var(--series-3)" fillOpacity={0.35} strokeWidth={1.5} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-3 pt-4 text-[12px] text-ink-2">
            {[['Ärzt:innen', 'var(--series-3)'], ['DGKP', 'var(--series-4)'], ['Assistenz (Check-in)', 'var(--series-1)']].map(([l, c]) => (
              <li key={l} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: c }} />{l}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Zweite Reihe: Prognose · Team · Handlungsbedarf */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Prognose Quartal" subtitle={`${fmt.eur(forecast.lower)} – ${fmt.eur(forecast.upper)} · 90 %-Band`} action={<Link to="/prognose" className="text-[12px] text-accent inline-flex items-center gap-1">Details <ArrowRight size={12} /></Link>}>
          <div className="flex items-baseline gap-2"><span className="text-[30px] font-light tabular">{fmt.eur(forecast.projected)}</span><Delta value={projDelta * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" %" /></div>
          <div className="text-[11.5px] text-ink-3 mb-3">vs. {PREV_QUARTER.label} · {fmt.num(forecast.scheineToDate)} Scheine bisher · Fallwert {fmt.eur2(forecast.actualToDate / forecast.scheineToDate)}</div>
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.role}>
                <div className="flex justify-between text-[11.5px] mb-1"><span className="text-ink-2">{ROLE_LABEL[r.role]} · Score</span><span className="tabular text-ink-1">{r.score} <Delta value={r.score - r.prev} /></span></div>
                <MiniBar value={r.score} max={100} tone={r.score >= 80 ? '#4fb3a8' : r.score >= 65 ? '#b9bb5f' : '#d9834a'} height={4} />
              </div>
            ))}
          </div>
        </Card>

        <Card title={personMode ? 'Team-Effizienz' : 'Team-Effizienz (Gruppen)'} subtitle={personMode ? 'Score je Person · 4 Wochen' : 'Team-Modus: nur Gruppenwerte'} action={<Link to="/team" className="text-[12px] text-accent inline-flex items-center gap-1">Alle <ArrowRight size={12} /></Link>}>
          {personMode ? (
            <div className="space-y-1.5">
              {scores.slice(0, 8).map((s) => (
                <Link key={s.staff.id} to={`/team/${s.staff.id}`} className="flex items-center gap-2 text-[12px] hover:bg-white/5 rounded px-1 -mx-1 py-0.5">
                  <span className="text-ink-1 w-36 truncate">{s.staff.name}</span>
                  <div className="flex-1"><MiniBar value={s.score} max={100} tone="var(--series-1)" height={4} /></div>
                  <span className="tabular w-7 text-right">{s.score}</span><span className="w-10 text-right"><Delta value={s.score - s.prevScore} /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-[12px]">
              {roles.map((r) => <div key={r.role} className="flex items-center gap-2"><span className="w-36 text-ink-1">{ROLE_LABEL[r.role]}</span><div className="flex-1"><MiniBar value={r.score} max={100} tone="var(--series-1)" height={4} /></div><span className="tabular w-7 text-right">{r.score}</span><span className="w-10 text-right"><Delta value={r.score - r.prev} /></span></div>)}
              <div className="pt-2 mt-2 border-t border-line-1 text-ink-3 space-y-1"><div className="flex justify-between"><span>Überstundensaldo Team</span><span className="tabular">{fmt.num(HR.reduce((a, h) => a + h.overtimeBalanceH, 0))} h</span></div><div className="flex justify-between"><span>HR-Frühwarnungen</span><span className="tabular">{HR.filter((h) => h.warning).length}</span></div></div>
            </div>
          )}
        </Card>

        <Card title="Handlungsbedarf" subtitle={`${fmt.eur(openFindingsValue)} nicht erfasst · Kreuzprüfung PVS × Diktara × Ordicall`} action={<Link to="/leistungen" className="text-[12px] text-accent inline-flex items-center gap-1">Alle <ArrowRight size={12} /></Link>}>
          <div className="space-y-2.5">
            {BILLING_FINDINGS.slice(0, 5).map((f) => (
              <div key={f.id} className="flex gap-2">
                <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${f.severity === 'critical' ? 'text-status-critical' : f.severity === 'serious' ? 'text-status-serious' : f.severity === 'warning' ? 'text-status-warning' : 'text-series-1'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-ink-1 leading-snug">{f.title}</div>
                  <div className="text-[11px] text-ink-3 flex items-center gap-2 mt-0.5"><Badge tone={severityTone[f.severity]}>{f.source}</Badge><span className="tabular">{fmt.eur2(f.valueEur)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="card px-5 py-4">
        <div className="flex items-start gap-3 text-[12.5px] text-ink-2 leading-relaxed">
          <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
          <div><span className="text-ink-1 font-semibold">Tycho-Einschätzung:</span> Die Ordination liegt {fmt.pct1(projDelta)} über dem Vorquartal, getragen von höherem Telemedizin-Anteil und weniger Terminausfällen seit Ordicall. Größter Hebel vor der Quartalsabrechnung sind {fmt.eur(openFindingsValue)} nicht erfasste Leistungen. Das Limit für Therapeutische Aussprache (EL21) wird voraussichtlich am 04.09. erreicht. Tailwind: {fmt.eur(tw.overdueSum)} überfällige Privathonorare mit Maßnahmenliste.</div>
        </div>
      </div>
    </div>
  )
}
