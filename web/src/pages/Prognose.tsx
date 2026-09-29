import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, ChartTooltip, Delta, Legend, StatTile, Table } from '../components/ui'
import { DATA_AS_OF, PREV_QUARTER, QUARTER, demo } from '../data/mock'
import { fmt } from '../lib/format'

const KASSEN = [
  { name: 'ÖGK', share: 0.71, prev: 0.72 },
  { name: 'SVS', share: 0.11, prev: 0.11 },
  { name: 'BVAEB', share: 0.09, prev: 0.09 },
  { name: 'Privat / Wahlarzt', share: 0.09, prev: 0.08 },
]

export default function Prognose() {
  const { forecast } = demo()
  const daysLeft = Math.round((QUARTER.end.getTime() - DATA_AS_OF.getTime()) / 86400000)
  const projDelta = forecast.projected - PREV_QUARTER.revenue
  const cumAt = (prefix: string) => { const pts = forecast.points.filter((p) => p.date.startsWith(prefix)); return pts.length ? pts[pts.length - 1].forecast : 0 }
  const july = cumAt('2026-07'), augustF = cumAt('2026-08') - july
  const months = [
    { m: 'Juli', actual: july, forecast: july },
    { m: 'August', actual: forecast.actualToDate - july, forecast: augustF },
    { m: 'September', actual: 0, forecast: forecast.projected - july - augustF },
  ]
  const scenarios = [
    { name: 'Basis (Tycho)', desc: 'Tagesdurchschnitt der letzten 6 Wochen, Saisonfaktor September', value: forecast.projected },
    { name: 'Findings nachgetragen', desc: 'Basis + offene Abrechnungslücken (2.756 €) vor Einreichung erfasst', value: forecast.projected + 2756 },
    { name: 'EL21-Limit erreicht', desc: 'Ab 04.09. Degression auf Therapeutische Aussprache – Umschichtung auf EL22 nicht erfolgt', value: forecast.projected - 3120 },
    { name: 'Dr. Lindner +1 Tag/Woche', desc: 'Kapazitätsszenario: 0,6 → 0,8 FTE ab 07.09.', value: forecast.projected + 6480 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight">Prognose {QUARTER.label}</h1>
        <p className="label mt-1 normal-case tracking-[0.04em] text-[10.5px]">Sicherste Berechnung bis zum Quartalsende, täglich neu · Stand {fmt.date(DATA_AS_OF)} · noch {daysLeft} Kalendertage</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Erwartetes Quartalsergebnis" value={fmt.eur(forecast.projected)} accent="var(--series-1)" delta={<Delta value={projDelta} format={(v) => fmt.eur(Math.abs(v))} />} deltaLabel={`vs. ${PREV_QUARTER.label}`} />
        <StatTile label="90 %-Konfidenzband" value={`± ${fmt.eur((forecast.upper - forecast.lower) / 2)}`} deltaLabel={`${fmt.eur(forecast.lower)} bis ${fmt.eur(forecast.upper)}`} />
        <StatTile label="Scheine (Fälle)" value={fmt.num(forecast.scheineProjected)} accent="var(--series-3)" delta={<Delta value={forecast.scheineProjected - PREV_QUARTER.scheine} />} deltaLabel={`bisher ${fmt.num(forecast.scheineToDate)} · ${PREV_QUARTER.label}: ${fmt.num(PREV_QUARTER.scheine)}`} />
        <StatTile label="Fallwert" value={fmt.eur2(forecast.projected / forecast.scheineProjected)} accent="var(--series-7)" delta={<Delta value={forecast.projected / forecast.scheineProjected - PREV_QUARTER.revenue / PREV_QUARTER.scheine} format={(v) => fmt.eur2(Math.abs(v))} />} deltaLabel="je Fall im Quartal" />
      </div>

      <Card title="Kumulierter Umsatz mit Prognosepfad" subtitle="Ist bis Datenstand, danach Erwartung mit 90 %-Band · Unsicherheit wächst mit √t">
        <div className="h-72">
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
              <ReferenceLine y={PREV_QUARTER.revenue} stroke="var(--ink-3)" strokeDasharray="2 4" label={{ value: `${PREV_QUARTER.label} gesamt`, fill: 'var(--ink-3)', fontSize: 10, position: 'insideTopLeft' }} />
              <ReferenceLine x={DATA_AS_OF.toISOString().slice(0, 10)} stroke="var(--ink-3)" label={{ value: 'Datenstand', fill: 'var(--ink-3)', fontSize: 10, position: 'insideTopLeft' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2"><Legend items={[{ label: 'Ist', color: 'var(--series-1)' }, { label: 'Prognose', color: 'color-mix(in srgb, var(--series-1) 40%, transparent)' }]} /></div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Monatsverlauf" subtitle="Ist und Erwartung je Monat">
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={months} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap={12}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="m" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmt.k(v)} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.eur(v)} />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="forecast" name="Erwartung" fill="var(--series-1)" fillOpacity={0.35} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="actual" name="Ist" fill="var(--series-1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2"><Legend items={[{ label: 'Ist', color: 'var(--series-1)' }, { label: 'Erwartung', color: 'color-mix(in srgb, var(--series-1) 40%, transparent)' }]} /></div>
        </Card>

        <Card title="Nach Kostenträger" subtitle="Anteil am erwarteten Quartalsergebnis">
          <Table rows={KASSEN} keyOf={(k) => k.name} dense cols={[
            { key: 'name', label: 'Träger', render: (k) => <span className="text-ink-1">{k.name}</span> },
            { key: 'val', label: 'Erwartung', align: 'right', render: (k) => fmt.eur(forecast.projected * k.share) },
            { key: 'share', label: 'Anteil', align: 'right', render: (k) => fmt.pct(k.share) },
            { key: 'd', label: 'Δ Anteil', align: 'right', render: (k) => <Delta value={(k.share - k.prev) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" Pp." /> },
          ]} />
          <p className="text-[11px] text-ink-3 mt-3">ÖGK quartalsweise (Einreichung bis 10. Oktober), BVAEB monatlich. Fristen werden im Digest erinnert.</p>
        </Card>

        <Card title="Szenarien" subtitle="Was-wäre-wenn auf Basis der aktuellen Daten">
          <div className="space-y-3">
            {scenarios.map((s) => (
              <div key={s.name} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-1">{s.name}</div>
                  <div className="text-[11px] text-ink-3">{s.desc}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="tabular text-sm">{fmt.eur(s.value)}</div>
                  <Delta value={s.value - forecast.projected} format={(v) => fmt.eur(Math.abs(v))} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Methodik" subtitle="Warum die Zahl belastbar ist">
        <ul className="text-xs text-ink-2 space-y-1.5 list-disc pl-4 leading-relaxed">
          <li>Grundlage sind ausschließlich Leistungen, die im PVS-Leistungsblatt erfasst sind, bewertet mit der hinterlegten Honorarordnung. Kein Schätzwert aus Terminen.</li>
          <li>Fälle werden wie bei der ÖGK gezählt: erste e-card-Konsultation je Patient:in und Quartal löst die Grundleistung aus; Limitierungen und Degressionsstufen sind je Position hinterlegt.</li>
          <li>Der Prognosepfad nutzt den Tagesdurchschnitt der letzten 30 Arbeitstage, wochentags- und saisonbereinigt (Sommerloch Juli/August, Anstieg September). Das Band ist ein 90 %-Intervall, das mit der Wurzel der Resttage wächst.</li>
          <li>Jede Nacht wird die Prognose neu berechnet; am Folgetag steht die aktuellste Version in Tycho Station. Der Montags-Digest enthält die Version vom Sonntag.</li>
        </ul>
      </Card>
    </div>
  )
}
