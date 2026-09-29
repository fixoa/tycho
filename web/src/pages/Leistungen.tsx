import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react'
import { Badge, Card, ChartTooltip, Delta, StatTile, Table, Bar as MiniBar } from '../components/ui'
import { BILLING_FINDINGS, QUARTER, PREV_QUARTER, demo } from '../data/mock'
import { staffById } from '../data/staff'
import { fmt } from '../lib/format'
import type { BillingFinding, ServicePosition } from '../data/types'

const CATEGORY_COLOR: Record<ServicePosition['category'], string> = {
  Grundleistung: 'var(--series-1)', Kennzeichnung: 'var(--series-8)', Einzelleistung: 'var(--series-2)', Telemedizin: 'var(--series-3)', Vorsorge: 'var(--series-4)', Labor: 'var(--series-5)', Sonstiges: 'var(--series-7)',
}

export default function Leistungen() {
  const { services } = demo()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<ServicePosition['category'] | 'alle'>('alle')
  const total = services.reduce((a, s) => a + s.value, 0)
  const byCat = Object.keys(CATEGORY_COLOR).map((c) => ({ category: c, value: services.filter((s) => s.category === c).reduce((a, s) => a + s.value, 0) }))
  const telemed = services.filter((s) => s.category === 'Telemedizin').reduce((a, s) => a + s.value, 0)
  const rows = services.filter((s) => (cat === 'alle' || s.category === cat) && (q === '' || `${s.code} ${s.name}`.toLowerCase().includes(q.toLowerCase())))
  const positiveFindings = BILLING_FINDINGS.filter((f) => f.valueEur > 0).reduce((a, f) => a + f.valueEur, 0)
  const elapsed = 55 / QUARTER.days // Anteil des Quartals, das vergangen ist

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-ink-1">Leistungen & Abrechnung</h1>
        <p className="text-[11.5px] text-ink-3 mt-0.5">{QUARTER.label} bis {fmt.date(new Date('2026-08-24'))} · Leistungsblatt aus dem PVS · Tarife laut hinterlegter Honorarordnung (Demo-Werte)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Verrechnet (QTD)" value={fmt.eur(total)} accent="var(--series-1)" deltaLabel={`${fmt.num(services.reduce((a, s) => a + s.count, 0))} Positionen`} />
        <StatTile label="Nicht erfasst, aber erbracht" value={fmt.eur(positiveFindings)} accent="#d03b3b" deltaLabel="aus Kreuzprüfung – nachtragbar" />
        <StatTile label="Telemedizin-Anteil" value={fmt.pct1(telemed / total)} accent="var(--series-3)" delta={<Delta value={1.8} format={(v) => fmt.num1(v)} suffix=" Pp." />} deltaLabel={`vs. ${PREV_QUARTER.label}`} />
        <StatTile label="Limitierte Positionen" value="1 kritisch" accent="#ec835a" deltaLabel="EL21 bei 91 % nach 60 % des Quartals" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-4">
        <Card title="Umsatz nach Leistungsgruppe" subtitle="Quartal bis dato">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={byCat} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => fmt.k(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.eur(v)} />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="value" name="Umsatz" fill="var(--series-1)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Findings der Kreuzprüfung" subtitle="PVS-Leistungsblatt × Diktara-Leistungserkennung × Ordicall-Terminarten × e-card-Konsultationen">
          <div className="space-y-3">
            {BILLING_FINDINGS.map((f: BillingFinding) => (
              <details key={f.id} className="group rounded border border-line-1 px-3 py-2">
                <summary className="flex items-center gap-3 cursor-pointer list-none">
                  <AlertTriangle size={15} className={`shrink-0 ${f.severity === 'critical' ? 'text-status-critical' : f.severity === 'serious' ? 'text-status-serious' : f.severity === 'warning' ? 'text-status-warning' : 'text-series-1'}`} />
                  <span className="text-sm text-ink-1 flex-1">{f.title}</span>
                  <Badge tone="neutral">{f.source}</Badge>
                  <span className={`tabular text-sm w-24 text-right ${f.valueEur < 0 ? 'text-status-critical' : 'text-ink-1'}`}>{fmt.eur2(f.valueEur)}</span>
                </summary>
                <div className="mt-2 pl-7 text-xs text-ink-2 leading-relaxed">
                  {f.detail}
                  <div className="mt-1 text-ink-3">{f.id} · {fmt.date(new Date(f.date))}{f.staffId ? ` · ${staffById(f.staffId)?.name}` : ' · Ordination gesamt'} · Typ: {f.type}</div>
                </div>
              </details>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Positionen" subtitle="Anzahl, Tarif, Umsatz und Hochrechnung gegen das Vorquartal"
        action={
          <div className="flex items-center gap-2">
            <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="bg-surface-2 border border-line-2 rounded text-xs px-2 py-1.5 text-ink-1">
              <option value="alle">Alle Gruppen</option>
              {Object.keys(CATEGORY_COLOR).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-1 bg-surface-2 border border-line-2 rounded px-2 py-1.5 text-xs">
              <Search size={12} className="text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code oder Name" className="bg-transparent outline-none w-32 text-ink-1" />
            </label>
          </div>
        }>
        <Table<ServicePosition>
          rows={rows}
          keyOf={(s) => s.code}
          dense
          cols={[
            { key: 'code', label: 'Code', render: (s) => <span className="font-mono text-xs text-ink-2">{s.code}</span> },
            { key: 'name', label: 'Leistung', render: (s) => <span className="text-ink-1">{s.name}</span> },
            { key: 'cat', label: 'Gruppe', render: (s) => <span className="inline-flex items-center gap-1.5 text-xs text-ink-2"><span className="w-2 h-2 rounded" style={{ background: CATEGORY_COLOR[s.category] }} />{s.category}</span> },
            { key: 'tarif', label: 'Tarif', align: 'right', render: (s) => fmt.eur2(s.tarif) },
            { key: 'count', label: 'Anzahl', align: 'right', render: (s) => fmt.num(s.count) },
            { key: 'trend', label: 'vs. Vorquartal*', align: 'right', render: (s) => <Delta value={((s.count / elapsed - s.countPrevQ) / s.countPrevQ) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" %" /> },
            { key: 'value', label: 'Umsatz', align: 'right', render: (s) => <span className="text-ink-1">{fmt.eur(s.value)}</span> },
            { key: 'limit', label: 'Limit', render: (s) => s.limit ? (
              <div className="flex items-center gap-2 w-36">
                <MiniBar value={s.limitUsage ?? 0} max={1} tone={(s.limitUsage ?? 0) > 0.85 ? '#d64545' : (s.limitUsage ?? 0) > 0.7 ? '#b9bb5f' : '#4fb3a8'} height={5} />
                <span className="text-xs tabular">{s.count}/{s.limit}</span>
              </div>
            ) : <span className="text-ink-3 text-xs inline-flex items-center gap-1"><CheckCircle2 size={11} /> frei</span> },
          ]}
        />
        <p className="text-[11px] text-ink-3 mt-3">* Hochrechnung auf das volle Quartal gegen die Anzahl im {PREV_QUARTER.label}. Positionen und Tarife sind Demo-Werte, angelehnt an eine ÖGK-Honorarordnung Allgemeinmedizin; in Produktion wird die Honorarordnung des jeweiligen Bundeslandes/Trägers (ÖGK, SVS, BVAEB) hinterlegt.</p>
      </Card>
    </div>
  )
}
