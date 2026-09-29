import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Card, ChartTooltip, Delta, StatTile, Table } from '../components/ui'
import { REFERRERS, type Referrer } from '../data/extras'
import { fmt } from '../lib/format'

export default function Zuweiser() {
  const total = REFERRERS.reduce((a, r) => a + r.q3, 0), prev = REFERRERS.reduce((a, r) => a + r.q2, 0)
  const lost = REFERRERS.filter((r) => r.q3 / 0.6 < r.q2 * 0.5)
  const byType = ['Facharzt', 'Spital', 'PVE', 'Physio', 'Sonstige'].map((t) => ({ type: t, q3: REFERRERS.filter((r) => r.type === t).reduce((a, r) => a + r.q3, 0) }))
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">Zuweiser-Analyse</h1><p className="text-xs text-ink-3">Überweisungen und Zuweisungen laut PVS (Überweisungsschein, Zuweiser-Feld) · Q3 bis dato vs. Q2 · ABC-Klassifikation nach Volumen</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Zugewiesene Patient:innen (QTD)" value={fmt.num(total)} accent="var(--series-1)" delta={<Delta value={((total / 0.6 - prev) / prev) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" %" />} deltaLabel="hochgerechnet vs. Q2" />
        <StatTile label="Aktive Zuweiser" value={fmt.num(REFERRERS.length)} accent="var(--series-3)" deltaLabel="3 A-Zuweiser = 58 % des Volumens · Q3-Werte sind Quartal bis dato" />
        <StatTile label="Abgesprungen" value={fmt.num(lost.length)} accent="#d03b3b" deltaLabel={lost.map((l) => l.name.split(',')[0]).join(', ')} />
        <StatTile label="Neu seit Q1" value="2" accent="var(--series-7)" deltaLabel="PVE Donaustadt, Betriebsarzt ÖBB" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-4">
        <Card title="Nach Zuweisertyp" subtitle="Q3 bis dato">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={byType} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="type" width={70} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="q3" name="Zuweisungen" fill="var(--series-1)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Zuweiser" subtitle="Sortiert nach Volumen · Klick auf Tycho-Hinweis für Handlungsempfehlung">
          <Table<Referrer> rows={REFERRERS} keyOf={(r) => r.name} dense cols={[
            { key: 'n', label: 'Zuweiser', render: (r) => <div><div className="text-ink-1">{r.name}</div><div className="text-[11px] text-ink-3">{r.type} · zuletzt {fmt.dateShort(new Date(r.lastReferral))}</div></div> },
            { key: 'abc', label: 'ABC', render: (r) => <Badge tone={r.abc === 'A' ? 'info' : 'neutral'}>{r.abc}</Badge> },
            { key: 'q3', label: 'Q3', align: 'right', render: (r) => r.q3 },
            { key: 'q2', label: 'Q2', align: 'right', render: (r) => r.q2 },
            { key: 'd', label: 'Trend', align: 'right', render: (r) => <Delta value={((r.q3 / 0.6 - r.q2) / r.q2) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" %" /> },
            { key: 'v', label: 'Umsatz', align: 'right', render: (r) => fmt.eur(r.value) },
          ]} />
          <p className="text-[11px] text-ink-3 mt-3">Tycho-Hinweis: Dr. Lang (Innere) hat seit 09.07. nicht mehr zugewiesen – vorher 16–18 je Quartal. Klinik Floridsdorf sinkt um rund 25 %. Beide sind Kandidaten für ein Zuweisergespräch; PVE Donaustadt wächst und sollte einen festen Rückmeldeweg (Befund in 24 h) bekommen.</p>
        </Card>
      </div>
    </div>
  )
}
