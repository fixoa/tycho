import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Star } from 'lucide-react'
import { Card, ChartTooltip, Delta, StatTile, Bar as MiniBar } from '../components/ui'
import { NPS } from '../data/extras'
import { fmt } from '../lib/format'

export default function Zufriedenheit() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-[17px] font-semibold tracking-tight">Patientenzufriedenheit (NPS)</h1><p className="label mt-1 normal-case tracking-[0.04em] text-[10.5px]">Import Google-Rezensionen (öffentlich) und Ordicall-SMS-Umfrage nach dem Termin · KI-Themenanalyse · keine Namen</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Net Promoter Score" value={NPS.score} accent="var(--series-1)" delta={<Delta value={NPS.score - NPS.prev} />} deltaLabel="vs. Vorquartal · Branchenschnitt Praxen ≈ 40" />
        <StatTile label="Antworten (Quartal)" value={fmt.num(NPS.responses)} accent="var(--series-3)" deltaLabel={NPS.sources.map((s) => `${s.name.split(' ')[0]} ${s.n}`).join(' · ')} />
        <StatTile label="Promotoren" value={fmt.pct(NPS.promoters)} accent="#0ca30c" deltaLabel={`Passive ${fmt.pct(NPS.passives)} · Kritiker ${fmt.pct(NPS.detractors)}`} />
        <StatTile label="Ø Sterne" value="4,5" accent="#fab219" deltaLabel="Google 4,6 · Umfrage 4,4" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-4">
        <Card title="NPS-Verlauf" subtitle="Monatlich · Ordicall-Go-Live im Juni">
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={NPS.monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="m" axisLine={false} tickLine={false} />
                <YAxis domain={[30, 70]} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="nps" name="NPS" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Themen aus Freitext" subtitle="Anteil positiver Nennungen · Veränderung seit Ordicall">
          <div className="space-y-2.5">
            {NPS.themes.map((t) => (
              <div key={t.theme}>
                <div className="flex justify-between text-xs mb-0.5"><span className="text-ink-1">{t.theme} <span className="text-ink-3">· {t.n}</span></span><span className="tabular text-ink-3">{fmt.pct(t.sentiment)} <Delta value={t.delta * 100} format={(v) => fmt.num(Math.abs(v))} suffix=" Pp." /></span></div>
                <MiniBar value={t.sentiment} tone={t.sentiment >= 0.75 ? '#0ca30c' : t.sentiment >= 0.5 ? '#fab219' : '#ec835a'} height={5} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-3 mt-3">Korrelation: Wartezeit &gt; 20 min senkt die Termin-Bewertung im Schnitt um 0,9 Sterne. Montag 08–10 Uhr ist der kritische Slot.</p>
        </Card>
      </div>
      <Card title="Stimmen" subtitle="Anonymisierte Beispiele">
        <div className="grid md:grid-cols-3 gap-4">
          {NPS.quotes.map((q, i) => (
            <div key={i} className="rounded bg-surface-2 p-3 text-sm">
              <div className="flex gap-0.5 mb-1">{Array.from({ length: 5 }, (_, j) => <Star key={j} size={12} className={j < q.rating ? 'text-status-warning fill-status-warning' : 'text-ink-3'} />)}</div>
              <p className="text-ink-2">„{q.text}“</p>
              <div className="text-[11px] text-ink-3 mt-1">{q.source}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
