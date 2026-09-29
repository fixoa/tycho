import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Phone, PhoneMissed, PhoneForwarded, CalendarCheck, Moon } from 'lucide-react'
import { Card, ChartTooltip, Delta, Legend, StatTile, Table, Bar as MiniBar } from '../components/ui'
import { GO_LIVE, demo } from '../data/mock'
import { fmt } from '../lib/format'
import type { CallIntent } from '../data/types'

export default function Ordicall() {
  const { calls } = demo()
  const last20 = calls.days.slice(-20)
  const prev20 = calls.days.slice(-40, -20)
  const sum = (arr: typeof last20, k: keyof (typeof last20)[number]) => arr.reduce((a, d) => a + (d[k] as number), 0)
  const total = sum(last20, 'total'), ai = sum(last20, 'aiResolved'), missed = sum(last20, 'missed'), bookings = sum(last20, 'bookings'), after = sum(last20, 'afterHours')
  const pTotal = sum(prev20, 'total'), pAi = sum(prev20, 'aiResolved'), pMissed = sum(prev20, 'missed')
  const weekly = calls.days.reduce<{ label: string; total: number; ai: number; transferred: number; missed: number }[]>((acc, d) => {
    const dt = new Date(d.date)
    const wk = `KW ${Math.ceil(((dt.getTime() - new Date('2026-01-01').getTime()) / 86400000 + new Date('2026-01-01').getDay()) / 7)}`
    let row = acc.find((r) => r.label === wk)
    if (!row) { row = { label: wk, total: 0, ai: 0, transferred: 0, missed: 0 }; acc.push(row) }
    row.total += d.total; row.ai += d.aiResolved; row.transferred += d.transferred; row.missed += d.missed
    return acc
  }, [])
  const savedMin = Math.round(ai * 2.4)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-ink-1">Ordicall Station</h1>
        <p className="text-[11.5px] text-ink-3 mt-0.5">Telefon-KI · Go-Live {fmt.date(GO_LIVE.ordicall)} · Statistik aus signiertem Ordicall-Export (keine Audioaufnahmen in Tycho) · letzte 20 Arbeitstage</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label="Anrufe" value={fmt.num(total)} accent="var(--series-1)" delta={<Delta value={((total - pTotal) / pTotal) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" %" />} deltaLabel="vs. 20 Tage davor" />
        <StatTile label="Von KI abschließend erledigt" value={fmt.pct(ai / total)} accent="var(--series-3)" delta={<Delta value={(ai / total - pAi / pTotal) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" Pp." />} deltaLabel={`${fmt.num(ai)} Anrufe`} />
        <StatTile label="Verpasst" value={fmt.pct1(missed / total)} accent="#0ca30c" delta={<Delta value={(missed / total - pMissed / pTotal) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" Pp." invert />} deltaLabel="vor Ordicall: 17,2 % (Telefonanlage)" />
        <StatTile label="Termine gebucht" value={fmt.num(bookings)} accent="var(--series-7)" deltaLabel={`${fmt.pct(bookings / total)} Konversion Anruf → Termin`} />
        <StatTile label="Empfang entlastet" value={fmt.minutes(savedMin)} accent="var(--series-4)" deltaLabel="≈ 2,4 min je KI-Anruf" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        <Card title="Anrufe je Woche nach Ergebnis" subtitle="KI erledigt · an Empfang übergeben · verpasst">
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={weekly} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap={3}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} interval={1} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="ai" name="KI erledigt" stackId="a" fill="var(--series-1)" isAnimationActive={false} />
                <Bar dataKey="transferred" name="Übergeben" stackId="a" fill="var(--series-2)" isAnimationActive={false} />
                <Bar dataKey="missed" name="Verpasst" stackId="a" fill="var(--series-8)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2"><Legend items={[{ label: 'KI erledigt', color: 'var(--series-1)' }, { label: 'Übergeben', color: 'var(--series-2)' }, { label: 'Verpasst', color: 'var(--series-8)' }]} /></div>
        </Card>

        <Card title="Anrufe nach Uhrzeit" subtitle="Summe seit Go-Live · Peak 08–10 Uhr">
          <div className="h-60">
            <ResponsiveContainer>
              <AreaChart data={calls.hourly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} labelFormatter={(h) => `${h}:00 – ${Number(h) + 1}:00`} />
                <Area type="monotone" dataKey="calls" name="Anrufe" stroke="var(--series-1)" fill="var(--series-1)" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="aiResolved" name="KI erledigt" stroke="var(--series-3)" fill="var(--series-3)" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2"><Legend items={[{ label: 'Anrufe', color: 'var(--series-1)' }, { label: 'KI erledigt', color: 'var(--series-3)' }]} /></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <Card title="Anliegen" subtitle="Was Patient:innen wollen und wie viel davon die KI ohne Empfang erledigt">
          <Table<CallIntent> rows={calls.intents} keyOf={(i) => i.intent} dense cols={[
            { key: 'intent', label: 'Anliegen', render: (i) => <span className="text-ink-1">{i.intent}</span> },
            { key: 'count', label: 'Anrufe', align: 'right', render: (i) => fmt.num(i.count) },
            { key: 'ai', label: 'KI-Quote', render: (i) => <div className="flex items-center gap-2 w-40"><MiniBar value={i.aiResolvedShare} tone={i.aiResolvedShare >= 0.8 ? '#4fb3a8' : i.aiResolvedShare >= 0.6 ? '#b9bb5f' : '#d9834a'} height={5} /><span className="tabular text-xs">{fmt.pct(i.aiResolvedShare)}</span></div> },
            { key: 'dur', label: 'Ø Dauer', align: 'right', render: (i) => `${i.avgDurationSec} s` },
          ]} />
          <p className="text-[11px] text-ink-3 mt-3">Befundauskunft bleibt Empfangs-Thema (37 % KI-Quote) – hier greift die Verschwiegenheitspflicht; die KI verweist auf Rückruf oder Portal.</p>
        </Card>
        <div className="space-y-4">
          <Card title="Außerhalb der Öffnungszeiten">
            <div className="flex items-center gap-3"><Moon size={18} className="text-series-7" /><div><div className="text-2xl font-semibold">{fmt.num(after)}</div><div className="text-[11px] text-ink-3">Anrufe abends/Wochenende, davon 61 % Terminwunsch – vorher Anrufbeantworter</div></div></div>
          </Card>
          <Card title="Wirkung auf den Empfang">
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2"><Phone size={14} className="text-ink-3" /><span className="text-ink-2 flex-1">Manuelle Anrufe je Assistenz/Tag</span><span className="tabular">58 → 21</span></li>
              <li className="flex items-center gap-2"><PhoneMissed size={14} className="text-ink-3" /><span className="text-ink-2 flex-1">Verpasste Anrufe</span><span className="tabular">17,2 % → {fmt.pct1(missed / total)}</span></li>
              <li className="flex items-center gap-2"><PhoneForwarded size={14} className="text-ink-3" /><span className="text-ink-2 flex-1">Ø Wartezeit in der Leitung</span><span className="tabular">2:40 → 0:06 min</span></li>
              <li className="flex items-center gap-2"><CalendarCheck size={14} className="text-ink-3" /><span className="text-ink-2 flex-1">No-Show-Rate (Erinnerungsanrufe)</span><span className="tabular">6,8 % → 4,5 %</span></li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
