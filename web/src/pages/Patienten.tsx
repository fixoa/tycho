import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock, TrendUp as TrendingUp, Stethoscope } from '@phosphor-icons/react'
import { useData, pctDelta } from '../data/aggregate'
import { Panel, Heat, BarTable, Pill } from '../components/simple'
import { ChartTooltip, Legend } from '../components/ui'
import { fmt } from '../lib/format'

export default function Patienten() {
  const d = useData()
  const merged = d.daily.map((row, i) => ({ ...row, label: `${new Date(row.date).getDate()}. ${new Date(row.date).toLocaleDateString('de-AT', { month: 'short' })}`, prev: d.dailyPrev[i]?.contacts }))
  const avg = d.s.contactsPerDay
  const top = d.services.filter((s) => s.tarif > 0).slice(0, 8)
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-line-1">
          {[
            { label: 'Patient:innen pro Tag', value: fmt.num(Math.round(d.s.contactsPerDay)), delta: d.p ? pctDelta(d.s.contactsPerDay, d.p.contactsPerDay) : null, active: true },
            { label: 'Umsatz pro Besuch', value: fmt.eur2(d.s.revenuePerContact), delta: d.p ? pctDelta(d.s.revenuePerContact, d.p.revenuePerContact) : null },
            { label: 'Ø Wartezeit', value: `${fmt.num1(d.s.wait)} min`, delta: d.p ? pctDelta(d.s.wait, d.p.wait) : null, invert: true },
            { label: 'Umsatz', value: fmt.eur(d.s.revenue), delta: d.p ? pctDelta(d.s.revenue, d.p.revenue) : null },
          ].map((k) => (
            <div key={k.label} className={`px-5 py-4 ${k.active ? 'border-b-2 border-accent' : ''}`}>
              <div className="text-[13px] text-ink-2">{k.label}</div>
              <div className="mt-1.5 flex items-baseline gap-2"><span className="text-[28px] font-semibold tracking-tight tabular leading-none">{k.value}</span>{k.delta !== null && <Pill good={k.invert ? k.delta <= 0 : k.delta >= 0}>{fmt.signed(Math.round(k.delta))} %</Pill>}</div>
            </div>
          ))}
        </div>
        <div className="px-5 pt-5 pb-3 h-[320px]">
          <ResponsiveContainer>
            <LineChart data={merged} margin={{ top: 8, right: 60, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={avg} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: `Ø ${fmt.num1(avg)}`, position: 'right', fill: 'var(--ink-2)', fontSize: 12 }} />
              {d.compareRange && <Line type="linear" dataKey="prev" name={d.compareRange.label} stroke="var(--series-1)" strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
              <Line type="linear" dataKey="contacts" name={d.range.label} stroke="var(--series-1)" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="px-5 pb-4 flex justify-center"><Legend items={[{ label: `${fmt.dateShort(d.range.from)} – ${fmt.dateShort(d.range.to)}`, color: 'var(--series-1)' }, ...(d.compareRange ? [{ label: `${fmt.dateShort(d.compareRange.from)} – ${fmt.dateShort(d.compareRange.to)} (gestrichelt)`, color: 'color-mix(in srgb, var(--series-1) 45%, transparent)' }] : [])]} /></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel icon={<Clock size={16} />} title="Stoßzeiten" hint="Patientenkontakte je Wochentag und Stunde im gewählten Zeitraum (Check-in laut Patientenaufrufsystem)">
          <Heat rows={d.heat} />
        </Panel>
        <Panel icon={<TrendingUp size={16} />} title="Umsatz im Vergleich" hint="Umsatz im Zeitraum gegen den Vergleichszeitraum; Balken = Tage">
          <div className="flex items-baseline gap-3"><span className="text-[34px] font-semibold tracking-tight tabular">{fmt.eur(d.s.revenue)}</span>{d.p && <Pill good={d.s.revenue >= d.p.revenue}>{fmt.signed(Math.round(pctDelta(d.s.revenue, d.p.revenue)))} %</Pill>}</div>
          {d.p && <div className="text-[13px] text-ink-2 mt-1">{fmt.pct(d.s.revenue / d.p.revenue)} von {fmt.eur(d.p.revenue)} im {d.compareRange?.label}</div>}
          <div className="mt-5 flex items-end gap-[3px] h-28">{d.daily.map((row) => { const m = Math.max(...d.daily.map((x) => x.revenue)); return <div key={row.date} title={`${fmt.dateShort(new Date(row.date))}: ${fmt.eur(row.revenue)}`} className="flex-1 rounded-full bg-series-1" style={{ height: `${Math.max(8, (row.revenue / m) * 100)}%` }} /> })}</div>
          <div className="text-[12px] text-ink-3 mt-1 text-right">{fmt.dateShort(d.range.from)} – {fmt.dateShort(d.range.to)}</div>
        </Panel>
      </div>

      <Panel icon={<Stethoscope size={16} />} title="Top Leistungen" hint="Positionen laut Honorarordnung, skaliert auf den Zeitraum">
        <BarTable rows={top} keyOf={(s) => s.code} cols={[
          { key: 'n', label: 'Leistung', render: (s) => <span><span className="font-mono text-[12px] text-ink-3 mr-2">{s.code}</span>{s.name}</span>, bar: (s) => s.value },
          { key: 'u', label: 'Umsatz', align: 'right', render: (s) => <span className="font-semibold">{fmt.eur(s.value)}</span> },
          { key: 'a', label: 'Anzahl', align: 'right', render: (s) => <span className="text-ink-2">{fmt.num(s.count)}</span> },
        ]} />
      </Panel>
    </div>
  )
}
