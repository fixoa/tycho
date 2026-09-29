import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { Link } from 'react-router-dom'
import { Users, Coins, Timer, Activity, HeartPulse, CalendarOff, Plug, AlertTriangle, ArrowRight } from 'lucide-react'
import { Kpi, Panel, BarTable, Pill } from '../components/simple'
import { ChartTooltip, Legend, Badge, Bar as MiniBar, Avatar } from '../components/ui'
import { useData, pctDelta } from '../data/aggregate'
import { hrRows, hrGroups, hrMonthly, STAFFING, PLANERY, HR, HR_TARGETS } from '../data/tailwind'
import { STAFF, ROLE_LABEL, staffById } from '../data/staff'
import { usePersonMode } from '../state/config'
import { fmt } from '../lib/format'

export default function HRPage() {
  const d = useData()
  const personMode = usePersonMode()
  const rows = hrRows(d.cur), prevRows = hrRows(d.prev)
  const groups = hrGroups(rows)
  const sum = (k: 'cost' | 'istH' | 'sollH' | 'overtimeH' | 'revenue' | 'sickDays' | 'overtimeCost', rs = rows) => rs.reduce((a, r) => a + r[k], 0)
  const cost = sum('cost'), prevCost = sum('cost', prevRows)
  const revenue = d.s.revenue * 1.2 // inkl. Privat-/Pauschalanteil wie in der Prognose
  const staffCost = rows.filter((r) => r.role !== 'arzt').reduce((a, r) => a + r.cost, 0)
  const quote = revenue ? staffCost / revenue : 0
  const perHour = sum('istH') ? revenue / sum('istH') : 0
  const sick = rows.length ? sum('sickDays') / (rows.length * Math.max(1, d.s.days)) : 0
  const months = hrMonthly()
  const avgQuote = months.filter((m) => !m.partial).reduce((a, m) => a + m.quote, 0) / Math.max(1, months.filter((m) => !m.partial).length)
  // Besetzung vs. Aufkommen: Kontakte je eingeplanter Assistenz und Stunde
  const heat = d.heat.map((r) => ({ day: r.day, cells: r.cells.map((c, i) => { const staffed = STAFFING[r.day]?.[i] ?? 0; const perDay = c.value / Math.max(1, new Set(d.cur.map((x) => x.date)).size / 5); return { hour: c.hour, staffed, load: staffed ? perDay / staffed : 0 } }) }))
  const tone = (load: number, staffed: number) => staffed === 0 ? 'var(--surface-2)' : load > 6 ? 'var(--bad-bg)' : load > 4.5 ? 'var(--seq-400)' : load > 2.5 ? 'var(--seq-300)' : 'var(--seq-100)'
  const roles = [['arzt', 'var(--series-1)'], ['dgkp', 'var(--series-3)'], ['assistenz', 'var(--series-2)'], ['management', 'var(--series-5)']] as const
  const warnings = HR.filter((h) => h.warning)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div><h1 className="text-[17px] font-semibold">Tailwind HR</h1><p className="text-[12.5px] text-ink-3 mt-0.5">Dienstplan (Planery) × Zeiterfassung/AD-Logon × Lohnverrechnung × Ertrag · {d.range.label}{!personMode ? ' · Team-Modus: nur Gruppenwerte' : ''}</p></div>
        <Link to="/tailwind" className="bp-btn">Honorarnoten & Inkasso <ArrowRight size={13} /></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={<Coins size={15} />} label="Personalkosten" value={fmt.eur(cost)} delta={prevCost ? pctDelta(cost, prevCost) : null} sub="inkl. Überstundenzuschlag 25 %" invert />
        <Kpi icon={<Activity size={15} />} label="Personalkostenquote" value={fmt.pct1(quote)} sub={`ohne Ärzt:innen · inkl. ${fmt.pct1(revenue ? cost / revenue : 0)} · Richtwert 22–28 %`} hint="Personalkosten (DGKP, Assistenz, Management) ÷ Umsatz. Ärzt:innen sind als Gesellschafter:innen nicht Personal im engeren Sinn; der Wert inklusive steht daneben." />
        <Kpi icon={<Timer size={15} />} label="Ertrag je Personalstunde" value={fmt.eur2(perHour)} sub={`${fmt.num(Math.round(sum('istH')))} Ist-Stunden`} />
        <Kpi icon={<Users size={15} />} label="Überstunden" value={`${fmt.num(Math.round(sum('overtimeH')))} h`} sub={`${fmt.eur(sum('overtimeCost'))} Zuschläge · Saldo ${fmt.num(HR.reduce((a, h) => a + h.overtimeBalanceH, 0))} h`} invert />
        <Kpi icon={<HeartPulse size={15} />} label="Krankenstandsquote" value={fmt.pct1(sick)} sub={`${sum('sickDays')} Fehltage im Zeitraum`} invert />
        <Kpi icon={<AlertTriangle size={15} />} label="Frühwarnungen" value={warnings.length} sub="Überstunden, Urlaub, Besetzung" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <Panel icon={<Coins size={16} />} title="Personalkosten pro Monat nach Gruppe" hint="AG-Gesamtkosten aus Ist-Stunden × Stundensatz; aktueller Monat unvollständig">
          <div className="h-[280px]">
            <ResponsiveContainer>
              <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={18}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmt.eur(v)} width={78} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.eur(v)} />} cursor={{ fill: 'var(--surface-2)' }} />
                {roles.map(([r, c], i) => <Bar key={r} dataKey={r} name={ROLE_LABEL[r]} stackId="a" fill={c} radius={i === roles.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false}>{months.map((m) => <Cell key={m.month} fillOpacity={m.partial ? 0.45 : 1} />)}</Bar>)}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-1"><Legend items={roles.map(([r, c]) => ({ label: ROLE_LABEL[r], color: c }))} /></div>
        </Panel>
        <Panel icon={<Activity size={16} />} title="Personalkostenquote pro Monat" hint="Personalkosten ohne Ärzt:innen ÷ Umsatz (durchgezogen); inklusive Ärzt:innen gestrichelt. Richtwert für Allgemeinmedizin 22–28 %">
          <div className="h-[280px]">
            <ResponsiveContainer>
              <LineChart data={months} margin={{ top: 8, right: 60, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmt.pct(v)} axisLine={false} tickLine={false} domain={[0, 0.8]} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.pct1(v)} />} />
                <ReferenceLine y={avgQuote} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: `Ø ${fmt.pct1(avgQuote)}`, position: 'right', fill: 'var(--ink-2)', fontSize: 12 }} />
                <ReferenceLine y={0.28} stroke="var(--bad-text)" strokeDasharray="2 4" label={{ value: 'Richtwert 28 %', position: 'insideTopRight', fill: 'var(--bad-text)', fontSize: 11 }} />
                <Line type="monotone" dataKey="quoteAll" name="inkl. Ärzt:innen" stroke="var(--series-1)" strokeDasharray="3 3" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="quote" name="ohne Ärzt:innen" stroke="var(--series-1)" strokeWidth={2.2} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel icon={<Users size={16} />} title={personMode ? 'Effizienz & Kosten je Mitarbeiter:in' : 'Effizienz & Kosten je Gruppe'} hint="Soll aus Dienstplan (Planery), Ist aus Zeiterfassung/AD-Logon, Kosten aus Lohnverrechnung, Ertrag aus PVS und Ordicall. Effizienz = Output je Stunde ÷ Rollenziel (max. 125 %)">
        {personMode ? (
          <BarTable rows={[...rows].sort((a, b) => b.efficiency - a.efficiency)} keyOf={(r) => r.staffId} cols={[
            { key: 'n', label: 'Person', render: (r) => { const s = staffById(r.staffId)!; return <span className="inline-flex items-center gap-2 font-medium"><Avatar name={s.name} hue={s.avatarHue} size={22} />{s.name} <span className="text-ink-3 text-[12px] font-normal">{ROLE_LABEL[s.role]}</span></span> }, bar: (r) => r.efficiency },
            { key: 'e', label: 'Effizienz', align: 'right', render: (r) => <span className="inline-flex items-center gap-2 justify-end"><span className="w-16"><MiniBar value={r.efficiency} tone={r.efficiency >= 0.8 ? 'var(--good-text)' : r.efficiency >= 0.6 ? '#e0a100' : 'var(--bad-text)'} height={5} /></span><span className="font-semibold">{fmt.pct(r.efficiency)}</span></span> },
            { key: 'o', label: 'Output/h', align: 'right', render: (r) => <span className="text-ink-2">{r.role === 'assistenz' ? fmt.num1(r.outputPerHour) : fmt.eur(Math.round(r.outputPerHour))} <span className="text-ink-3">/ {r.role === 'assistenz' ? r.target : fmt.eur(r.target)}</span></span> },
            { key: 's', label: 'Soll / Ist', align: 'right', render: (r) => `${fmt.num(Math.round(r.sollH))} / ${fmt.num(Math.round(r.istH))} h` },
            { key: 'ot', label: 'Überstd.', align: 'right', render: (r) => <span className={r.overtimeH > 10 ? 'text-status-critical' : ''}>{fmt.num1(r.overtimeH)} h</span> },
            { key: 'c', label: 'Kosten', align: 'right', render: (r) => <span className="font-semibold">{fmt.eur(r.cost)}</span> },
            { key: 'r', label: 'Ertrag', align: 'right', render: (r) => r.revenue ? fmt.eur(r.revenue) : <span className="text-ink-3">{fmt.num(r.contacts + r.calls)} Kontakte/Anrufe</span> },
            { key: 'k', label: 'Krank', align: 'right', render: (r) => r.sickDays },
          ]} />
        ) : (
          <BarTable rows={groups} keyOf={(g) => g.role} cols={[
            { key: 'n', label: 'Gruppe', render: (g) => <span className="font-medium">{g.label} <span className="text-ink-3 text-[12px] font-normal">· {g.n} Personen</span></span>, bar: (g) => g.efficiency },
            { key: 'e', label: 'Effizienz', align: 'right', render: (g) => <span className="font-semibold">{fmt.pct(g.efficiency)}</span> },
            { key: 'o', label: 'Ø Output/h', align: 'right', render: (g) => <span className="text-ink-2">{g.role === 'assistenz' ? fmt.num1(g.outputPerHour) : fmt.eur(Math.round(g.outputPerHour))} <span className="text-ink-3">/ {g.role === 'assistenz' ? g.target : fmt.eur(g.target)} · {HR_TARGETS[g.role].label}</span></span> },
            { key: 's', label: 'Soll / Ist', align: 'right', render: (g) => `${fmt.num(Math.round(g.sollH))} / ${fmt.num(Math.round(g.istH))} h` },
            { key: 'ot', label: 'Überstd.', align: 'right', render: (g) => `${fmt.num1(g.overtimeH)} h` },
            { key: 'c', label: 'Kosten', align: 'right', render: (g) => <span className="font-semibold">{fmt.eur(g.cost)}</span> },
            { key: 'r', label: 'Ertrag', align: 'right', render: (g) => g.revenue ? fmt.eur(g.revenue) : <span className="text-ink-3">{fmt.num(g.contacts + g.calls)} Kontakte/Anrufe</span> },
            { key: 'k', label: 'Krank', align: 'right', render: (g) => g.sickDays },
          ]} />
        )}
        <p className="text-[12px] text-ink-3 mt-2">Effizienz ist eine Entscheidungshilfe, keine Bewertung (Art. 22 DSGVO, AI Act Art. 26). Personenwerte nur im Pro-Person-Modus mit Zustimmung.</p>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <Panel icon={<Timer size={16} />} title="Besetzung vs. Patientenaufkommen" hint="Kontakte je eingeplanter Assistenz und Stunde (Dienstplan aus Planery × Check-ins). Rot = unterbesetzt (> 6), hellblau = Reserve (< 2,5)">
          <div className="grid gap-1" style={{ gridTemplateColumns: '36px repeat(11, 1fr)' }}>
            {heat.map((r) => [<div key={r.day} className="text-[12.5px] text-ink-2 flex items-center">{r.day}</div>, ...r.cells.map((c) => <div key={r.day + c.hour} title={`${r.day} ${c.hour}:00 · ${c.staffed} eingeplant · ${fmt.num1(c.load)} Kontakte je Assistenz`} className="h-9 rounded-[6px] flex items-center justify-center text-[11px]" style={{ background: tone(c.load, c.staffed), color: c.load > 6 ? 'var(--bad-text)' : c.load > 4.5 ? '#fff' : 'var(--ink-2)' }}>{c.staffed || ''}</div>)])}
            <div />{heat[0]?.cells.map((c) => <div key={c.hour} className="text-[11.5px] text-ink-3 text-center">{c.hour}</div>)}
          </div>
          <p className="text-[12px] text-ink-3 mt-2">Zahl = eingeplante Assistenz laut Dienstplan. Empfehlung: Montag 9–11 Uhr eine dritte Kraft am Empfang, Freitag ab 13 Uhr eine weniger.</p>
        </Panel>
        <div className="space-y-4">
          <Panel icon={<AlertTriangle size={16} />} title="Frühwarnungen">
            <ul className="space-y-2 text-[13px]">{warnings.map((h) => { const s = staffById(h.staffId)!; return <li key={h.staffId} className="flex gap-2"><AlertTriangle size={14} className="text-status-serious shrink-0 mt-0.5" /><span><span className="font-medium">{personMode ? s.name : `${ROLE_LABEL[s.role]} (${s.department})`}:</span> {h.warning}</span></li> })}</ul>
          </Panel>
          <Panel icon={<CalendarOff size={16} />} title="Abwesenheiten (8 Wochen)">
            <ul className="space-y-1.5 text-[13px]">{HR.flatMap((h) => h.absences.map((a) => ({ ...a, s: staffById(h.staffId)! }))).sort((a, b) => a.from.localeCompare(b.from)).slice(0, 7).map((a, i) => <li key={i} className="flex items-center gap-3"><span className="tabular text-ink-3 w-28">{fmt.dateShort(new Date(a.from))} – {fmt.dateShort(new Date(a.to))}</span><span className="flex-1">{personMode ? a.s.name : ROLE_LABEL[a.s.role]}</span><Badge>{a.type}</Badge></li>)}</ul>
          </Panel>
          <Panel icon={<Plug size={16} />} title="Verbindung Planery">
            <dl className="text-[12.5px] grid grid-cols-[110px_1fr] gap-y-1.5 text-ink-2">
              <dt className="text-ink-3">Status</dt><dd><Pill good>verbunden</Pill> <span className="text-ink-3">letzter Abgleich {fmt.date(new Date(PLANERY.lastSync))} 19:06</span></dd>
              <dt className="text-ink-3">Endpunkt</dt><dd className="font-mono text-[12px]">{PLANERY.endpoint}</dd>
              <dt className="text-ink-3">Scopes</dt><dd className="font-mono text-[12px]">{PLANERY.scopes.join(' · ')}</dd>
              <dt className="text-ink-3">Token</dt><dd>{PLANERY.token}</dd>
              <dt className="text-ink-3">AD-Mapping</dt><dd>{PLANERY.mapped} von {STAFF.length} Personen zugeordnet</dd>
              <dt className="text-ink-3">Nicht gelesen</dt><dd>Gehälter, Verträge, Krankheitsgründe, Notizen</dd>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  )
}
