import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, ChartTooltip, Delta, StatTile, Legend } from '../components/ui'
import { createRng } from '../lib/rng'
import { fmt } from '../lib/format'
import { compareWindows } from '../data/aggregate'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr']
const HOURS = Array.from({ length: 11 }, (_, i) => 7 + i)

function heat() {
  const rng = createRng(31)
  const shape = [0.55, 0.98, 1, 0.92, 0.8, 0.45, 0.4, 0.75, 0.85, 0.7, 0.35]
  const dayF = [1.05, 1, 0.97, 0.98, 0.82]
  return DAYS.map((d, di) => HOURS.map((h, hi) => ({ d, h, util: Math.min(1, shape[hi] * dayF[di] * rng.range(0.85, 1.08)) })))
}

const NOSHOW_BY_TYPE = [
  { type: 'Kontrolle', rate: 0.071, n: 1420 },
  { type: 'Akut', rate: 0.028, n: 1980 },
  { type: 'Vorsorge (VU)', rate: 0.094, n: 210 },
  { type: 'Video', rate: 0.032, n: 340 },
  { type: 'Impfung', rate: 0.058, n: 160 },
  { type: 'Blutabnahme', rate: 0.049, n: 980 },
]

export default function Termine() {
  const grid = heat()
  const { cur, prev } = compareWindows()
  const lostSlots = Math.round(cur.noShowRate * cur.contacts)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Termine & Kapazität</h1>
        <p className="text-xs text-ink-3">Terminkalender-Modul des PVS (read-only) · Slot-Auslastung, Terminausfälle, Wartezeiten · letzte 4 Wochen</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Slot-Auslastung" value="84,2 %" accent="var(--series-1)" delta={<Delta value={2.6} format={(v) => fmt.num1(v)} suffix=" Pp." />} deltaLabel="belegte ÷ verfügbare Slots" />
        <StatTile label="No-Show-Rate" value={fmt.pct1(cur.noShowRate)} accent="#ec835a" delta={<Delta value={(cur.noShowRate - prev.noShowRate) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" Pp." invert />} deltaLabel={`≈ ${lostSlots} verlorene Slots · ${fmt.eur(lostSlots * 24)}`} />
        <StatTile label="Ø Wartezeit" value={`${fmt.num1(cur.wait)} min`} accent="var(--series-3)" delta={<Delta value={cur.wait - prev.wait} format={(v) => fmt.num1(Math.abs(v))} suffix=" min" invert />} deltaLabel="Check-in → Aufruf (Patientenaufrufsystem)" />
        <StatTile label="Nächster freier Termin" value="3,4 Tage" accent="var(--series-7)" deltaLabel="Ø über alle Ärzt:innen · Akut: 0 Tage" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <Card title="Auslastungs-Heatmap" subtitle="Wochentag × Stunde · Anteil belegter Slots · dunkler = voller">
          <div className="overflow-x-auto">
            <div className="grid gap-1 min-w-[560px]" style={{ gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)` }}>
              <div />
              {HOURS.map((h) => <div key={h} className="text-[10px] text-ink-3 text-center">{h}:00</div>)}
              {grid.map((row, di) => (
                <>
                  <div key={`l${di}`} className="text-xs text-ink-2 flex items-center">{DAYS[di]}</div>
                  {row.map((c) => {
                    const step = c.util > 0.9 ? 'var(--seq-700)' : c.util > 0.8 ? 'var(--seq-600)' : c.util > 0.7 ? 'var(--seq-500)' : c.util > 0.55 ? 'var(--seq-400)' : c.util > 0.4 ? 'var(--seq-300)' : 'var(--seq-200)'
                    return <div key={`${c.d}${c.h}`} title={`${c.d} ${c.h}:00 – ${fmt.pct(c.util)}`} className="h-8 rounded-[4px] flex items-center justify-center text-[10px] text-white/90" style={{ background: step }}>{Math.round(c.util * 100)}</div>
                  })}
                </>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-3 mt-3">Freie Kapazität liegt Mo–Do zwischen 12:00 und 14:00 sowie Freitag ab 15:00 – geeignet für Telemedizin-Slots oder Vorsorge-Recall.</p>
        </Card>

        <Card title="Terminausfall nach Terminart" subtitle="No-Show-Rate · letzte 4 Wochen">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={NOSHOW_BY_TYPE} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => fmt.pct(v)} axisLine={false} tickLine={false} domain={[0, 0.12]} />
                <YAxis type="category" dataKey="type" width={100} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.pct1(v)} />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="rate" name="No-Show" fill="var(--series-2)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-ink-3 mt-2">Vorsorgetermine fallen am häufigsten aus – Ordicall-Erinnerungsanruf 24 h vorher wird empfohlen (Modul „Recall“).</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Recall & Vorsorge" subtitle="Fällige Leistungen laut PVS-Kartei">
          <ul className="text-sm space-y-2">
            {[['Vorsorgeuntersuchung fällig', 412], ['Impfauffrischung (FSME/Tetanus)', 187], ['Chroniker-Kontrolle > 90 Tage', 96], ['Mutter-Kind-Pass Termin', 14]].map(([l, n]) => (
              <li key={l as string} className="flex justify-between"><span className="text-ink-2">{l}</span><span className="tabular text-ink-1">{fmt.num(n as number)}</span></li>
            ))}
          </ul>
          <p className="text-[11px] text-ink-3 mt-3">Potenzial ≈ {fmt.eur(412 * 71.8 + 187 * 7.6)} bei Recall-Antwortquote 100 %.</p>
        </Card>
        <Card title="Patientenbindung" subtitle="Aktive Patient:innen und Abwanderung">
          <ul className="text-sm space-y-2">
            <li className="flex justify-between"><span className="text-ink-2">Aktiv (Kontakt ≤ 12 Monate)</span><span className="tabular text-ink-1">6.842</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Neu im Quartal</span><span className="tabular text-ink-1">291</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Ohne Kontakt &gt; 18 Monate</span><span className="tabular text-ink-1">1.104</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Netto-Wachstum 12 Monate</span><span className="tabular text-[var(--good-text)]">+3,8 %</span></li>
          </ul>
        </Card>
        <Card title="Arztbrief-Durchlaufzeit" subtitle="Konsultation → versendeter Befund/Brief">
          <ul className="text-sm space-y-2">
            <li className="flex justify-between"><span className="text-ink-2">Median</span><span className="tabular text-ink-1">1,2 Tage</span></li>
            <li className="flex justify-between"><span className="text-ink-2">P90</span><span className="tabular text-ink-1">4,6 Tage</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Offen &gt; 7 Tage</span><span className="tabular text-status-warning">23</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Mit Diktara vs. ohne</span><span className="tabular text-ink-1">0,8 vs. 2,9 Tage</span></li>
          </ul>
        </Card>
      </div>
      <Legend items={[{ label: 'Alle Werte read-only aus PVS-Terminkalender, Patientenaufrufsystem und Diktara-Metadaten', color: 'var(--series-1)' }]} />
    </div>
  )
}
