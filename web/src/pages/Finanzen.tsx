import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { Coins, CreditCard, Landmark, AlertTriangle, BarChart3 } from 'lucide-react'
import { useData, pctDelta } from '../data/aggregate'
import { Kpi, Panel } from '../components/simple'
import { ChartTooltip, Legend } from '../components/ui'
import { BILLING_FINDINGS } from '../data/mock'
import { fmt } from '../lib/format'

export default function Finanzen() {
  const d = useData()
  const [by, setBy] = useState<'payer' | 'role'>('payer')
  const months = d.monthly
  const avg = months.filter((m) => !m.partial).reduce((a, m) => a + m.revenue, 0) / Math.max(1, months.filter((m) => !m.partial).length)
  const avgF = months.filter((m) => !m.partial).reduce((a, m) => a + m.findings, 0) / Math.max(1, months.filter((m) => !m.partial).length)
  const openFindings = BILLING_FINDINGS.filter((f) => f.valueEur > 0).reduce((a, f) => a + f.valueEur, 0)
  const payers = [['ÖGK', 'var(--series-1)'], ['SVS', 'var(--series-2)'], ['BVAEB', 'var(--series-3)'], ['Privat', 'var(--series-8)']] as const
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Coins size={15} />} label="Umsatz" value={fmt.eur(d.s.revenue)} delta={d.p ? pctDelta(d.s.revenue, d.p.revenue) : null} sub="zum Zeitraum davor" />
        <Kpi icon={<CreditCard size={15} />} label="Kassen (e-card)" value={fmt.eur(d.s.ecard)} sub={`${fmt.pct(d.s.ecard / d.s.revenue)} vom Umsatz · ÖGK, SVS, BVAEB`} />
        <Kpi icon={<Landmark size={15} />} label="Privat / Wahlarzt" value={fmt.eur(d.s.privat)} sub={`${fmt.pct(d.s.privat / d.s.revenue)} vom Umsatz · Honorarnoten`} />
        <Kpi icon={<AlertTriangle size={15} />} label="Liegengelassen" value={fmt.eur(openFindings)} sub={`${BILLING_FINDINGS.length} Findings offen · vor Quartalseinreichung`} hint="Leistungen, die laut Kartei/Diktara erbracht, aber nicht im Leistungsblatt sind" />
      </div>

      <Panel icon={<BarChart3 size={16} />} title="Umsatz pro Monat" hint="Verrechnete Leistungen je Monat, letzte 12 Monate; aktueller Monat unvollständig"
        action={<div className="flex bg-surface-2 rounded-lg p-0.5 text-[12.5px]">{(['payer', 'role'] as const).map((k) => <button key={k} onClick={() => setBy(k)} className={`px-2.5 py-1 rounded-md ${by === k ? 'bg-surface-1 font-medium shadow-sm' : 'text-ink-2'}`}>{k === 'payer' ? 'Kostenträger' : 'Gesamt'}</button>)}</div>}>
        <div className="h-[340px]">
          <ResponsiveContainer>
            <BarChart data={months} margin={{ top: 8, right: 70, left: 0, bottom: 0 }} barCategoryGap={18}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmt.eur(v)} width={80} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={(v) => fmt.eur(v)} />} cursor={{ fill: 'var(--surface-2)' }} />
              <ReferenceLine y={avg} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: `Ø ${fmt.eur(avg)}`, position: 'right', fill: 'var(--ink-2)', fontSize: 12 }} />
              {by === 'payer' ? payers.map(([k, c], i) => <Bar key={k} dataKey={k} name={k} stackId="a" fill={c} radius={i === payers.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false}>{months.map((m) => <Cell key={m.month} fillOpacity={m.partial ? 0.45 : 1} />)}</Bar>)
                : <Bar dataKey="revenue" name="Umsatz" fill="var(--series-1)" radius={[4, 4, 0, 0]} isAnimationActive={false}>{months.map((m) => <Cell key={m.month} fillOpacity={m.partial ? 0.45 : 1} />)}</Bar>}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center mt-1"><Legend items={by === 'payer' ? payers.map(([k, c]) => ({ label: k === 'Privat' ? 'Privat / Wahlarzt' : k, color: c })) : [{ label: 'Umsatz', color: 'var(--series-1)' }]} /></div>
      </Panel>

      <Panel icon={<AlertTriangle size={16} />} title="Liegengelassen pro Monat" hint="Erbrachte, aber nicht verrechnete Leistungen; grau = später nachgetragen, rot = noch offen">
        <div className="h-[280px]">
          <ResponsiveContainer>
            <BarChart data={months.map((m) => ({ ...m, done: Math.round(m.findings * (m.partial ? 0.3 : 0.78)), open: Math.round(m.findings * (m.partial ? 0.7 : 0.22)) }))} margin={{ top: 8, right: 70, left: 0, bottom: 0 }} barCategoryGap={18}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmt.eur(v)} width={80} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={(v) => fmt.eur(v)} />} cursor={{ fill: 'var(--surface-2)' }} />
              <ReferenceLine y={avgF} stroke="var(--ink-3)" strokeDasharray="4 4" label={{ value: `Ø ${fmt.eur(avgF)}`, position: 'right', fill: 'var(--ink-2)', fontSize: 12 }} />
              <Bar dataKey="done" name="Nachgetragen" stackId="a" fill="var(--series-5)" isAnimationActive={false} />
              <Bar dataKey="open" name="Offen" stackId="a" fill="var(--series-4)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center mt-1"><Legend items={[{ label: 'Nachgetragen', color: 'var(--series-5)' }, { label: 'Offen', color: 'var(--series-4)' }]} /></div>
      </Panel>
    </div>
  )
}
