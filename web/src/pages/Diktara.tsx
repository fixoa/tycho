import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, ChartTooltip, Delta, Legend, StatTile, Table, Bar as MiniBar, Avatar } from '../components/ui'
import { GO_LIVE, demo } from '../data/mock'
import { STAFF } from '../data/staff'
import { weekly } from '../data/aggregate'
import { fmt } from '../lib/format'

export default function Diktara() {
  const { dictation, records } = demo()
  const dates = [...new Set(dictation.map((d) => d.date))].sort()
  const cur = new Set(dates.slice(-20)), prev = new Set(dates.slice(-40, -20))
  const inCur = dictation.filter((d) => cur.has(d.date)), inPrev = dictation.filter((d) => prev.has(d.date))
  const s = (arr: typeof inCur, k: 'recordings' | 'recordedMin' | 'savedMin' | 'servicesDetected') => arr.reduce((a, d) => a + d[k], 0)
  const acceptance = inCur.reduce((a, d) => a + d.acceptanceRate * d.recordings, 0) / Math.max(1, s(inCur, 'recordings'))
  const doctors = STAFF.filter((x) => x.role === 'arzt')
  const perDoc = doctors.map((doc) => {
    const d = inCur.filter((x) => x.staffId === doc.id)
    const contacts = records.filter((r) => cur.has(r.date) && r.staffId === doc.id).reduce((a, r) => a + r.patientContacts, 0)
    const rec = s(d, 'recordings')
    return { doc, recordings: rec, share: contacts ? Math.min(1, rec / contacts) : 0, saved: s(d, 'savedMin'), acc: d.length ? d.reduce((a, x) => a + x.acceptanceRate, 0) / d.length : 0, edits: d.length ? d.reduce((a, x) => a + x.editsPerSummary, 0) / d.length : 0, services: s(d, 'servicesDetected') }
  })
  const weeks = weekly(records.filter((r) => new Date(r.date) >= GO_LIVE.diktara), (rs) => Object.fromEntries(doctors.map((d) => [d.id, rs.filter((r) => r.staffId === d.id).reduce((a, r) => a + r.dictationSavedMin, 0)])))
  const colors = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)']
  const hourlyValue = 95 // € Arztstunde (Demo)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-ink-1">Diktara Station</h1>
        <p className="text-[11.5px] text-ink-3 mt-0.5">KI-Dokumentation · Go-Live {fmt.date(GO_LIVE.diktara)} · Tycho liest nur Metadaten (Dauer, Akzeptanz, erkannte Leistungen), nie Transkripte oder Audio · letzte 20 Arbeitstage</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label="Aufnahmen" value={fmt.num(s(inCur, 'recordings'))} accent="var(--series-1)" delta={<Delta value={((s(inCur, 'recordings') - s(inPrev, 'recordings')) / s(inPrev, 'recordings')) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" %" />} deltaLabel="vs. 20 Tage davor" />
        <StatTile label="Dokuzeit gespart" value={fmt.minutes(s(inCur, 'savedMin'))} accent="var(--series-3)" deltaLabel={`≈ ${fmt.eur((s(inCur, 'savedMin') / 60) * hourlyValue)} Arztzeit`} />
        <StatTile label="Akzeptanz ohne Änderung" value={fmt.pct(acceptance)} accent="var(--series-7)" deltaLabel="Zusammenfassung 1:1 übernommen" />
        <StatTile label="Erkannte Leistungen" value={fmt.num(s(inCur, 'servicesDetected'))} accent="var(--series-4)" deltaLabel="Basis der Abrechnungs-Kreuzprüfung" />
        <StatTile label="Nutzung Ärzt:innen" value={fmt.pct(perDoc.reduce((a, d) => a + d.share, 0) / perDoc.length)} accent="var(--series-2)" deltaLabel="Ø Anteil Konsultationen mit Diktara" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <Card title="Nutzung je Ärzt:in" subtitle="Adoption, Zeitersparnis und Qualität der Zusammenfassungen">
          <Table rows={perDoc} keyOf={(r) => r.doc.id} cols={[
            { key: 'doc', label: 'Ärzt:in', render: (r) => <div className="flex items-center gap-2"><Avatar name={r.doc.name} hue={r.doc.avatarHue} size={26} /><span className="text-ink-1 whitespace-nowrap">{r.doc.name}</span></div> },
            { key: 'share', label: 'Nutzung', render: (r) => <div className="flex items-center gap-2 w-36"><MiniBar value={r.share} tone={r.share >= 0.7 ? 'var(--good)' : r.share >= 0.4 ? 'var(--warn)' : 'var(--bad)'} height={5} /><span className="tabular text-xs">{fmt.pct(r.share)}</span></div> },
            { key: 'rec', label: 'Aufnahmen', align: 'right', render: (r) => fmt.num(r.recordings) },
            { key: 'saved', label: 'Gespart', align: 'right', render: (r) => fmt.minutes(r.saved) },
            { key: 'acc', label: 'Akzeptanz', align: 'right', render: (r) => fmt.pct(r.acc) },
            { key: 'edits', label: 'Ø Korrekturen', align: 'right', render: (r) => fmt.num1(r.edits) },
          ]} />
          <p className="text-[11px] text-ink-3 mt-3">Dr. Hofer nutzt Diktara bei rund einem Drittel der Konsultationen – dort entstehen auch die meisten „dokumentiert, nicht verrechnet“-Findings (EKG). Schulungstermin empfohlen.</p>
        </Card>
        <Card title="Gesparte Dokuzeit je Woche" subtitle="Minuten · nach Ärzt:in">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={weeks} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap={3}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" interval={2} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => fmt.k(v)} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.minutes(v)} />} cursor={{ fill: 'var(--surface-2)' }} />
                {doctors.map((d, i) => <Bar key={d.id} dataKey={d.id} name={d.name} stackId="a" fill={colors[i]} radius={i === doctors.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2"><Legend items={doctors.map((d, i) => ({ label: d.name, color: colors[i] }))} /></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Datenschutz-Grenze" subtitle="Was Tycho von Diktara sieht">
          <ul className="text-xs text-ink-2 space-y-1.5 list-disc pl-4">
            <li>Aufnahmedauer, Zeitstempel, Ärzt:in (AD-Konto)</li>
            <li>Akzeptanz- und Korrekturquote der Zusammenfassung</li>
            <li>Erkannte Leistungscodes (z. B. „EL10 EKG“) als Code – ohne Freitext</li>
            <li className="text-ink-3">Nie: Audio, Transkript, Diagnosen, Patientenname</li>
          </ul>
        </Card>
        <Card title="Dokumentationsvollständigkeit" subtitle="Konsultationen mit vollständiger Kartei + ICD-10">
          <div className="text-2xl font-semibold">93,4 %</div>
          <div className="text-[11px] text-ink-3 mb-2">mit Diktara 97,8 % · ohne 86,1 %</div>
          <MiniBar value={0.934} tone="var(--series-1)" />
          <p className="text-[11px] text-ink-3 mt-2">ICD-10-Codierung ist seit 01.07.2026 verpflichtend – Diktara schlägt den Code vor, die Ärzt:in bestätigt.</p>
        </Card>
        <Card title="Wirtschaftlicher Effekt (Quartal bis dato)">
          <ul className="text-sm space-y-2">
            <li className="flex justify-between"><span className="text-ink-2">Gesparte Arztzeit</span><span className="tabular">{fmt.minutes(records.filter((r) => new Date(r.date) >= new Date('2026-07-01')).reduce((a, r) => a + r.dictationSavedMin, 0))}</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Bewertet mit {fmt.eur(hourlyValue)}/h</span><span className="tabular">{fmt.eur((records.filter((r) => new Date(r.date) >= new Date('2026-07-01')).reduce((a, r) => a + r.dictationSavedMin, 0) / 60) * hourlyValue)}</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Zusätzlich erkannte Leistungen</span><span className="tabular">{fmt.eur(779.4)}</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Arztbrief-Durchlauf</span><span className="tabular">2,9 → 0,8 Tage</span></li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
