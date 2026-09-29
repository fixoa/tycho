import { Link, useParams } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Info, Lock } from 'lucide-react'
import { Avatar, Badge, Card, ChartTooltip, ScoreRing, Bar as MiniBar, StatTile } from '../components/ui'
import { staffScores, componentPct } from '../data/score'
import { ROLE_LABEL } from '../data/staff'
import { BILLING_FINDINGS, demo } from '../data/mock'
import { weekly } from '../data/aggregate'
import { fmt } from '../lib/format'
import { usePersonMode } from '../state/config'

export default function Person() {
  const { id } = useParams()
  const personMode = usePersonMode()
  const s = staffScores().find((x) => x.staff.id === id)
  if (!s) return <div className="text-sm text-ink-2">Person nicht gefunden. <Link to="/team" className="text-accent">Zurück</Link></div>
  const { staff, kpis, components } = s
  const recs = demo().records.filter((r) => r.staffId === staff.id)
  const weeks = weekly(recs, (rs) => ({
    contacts: rs.reduce((a, r) => a + r.patientContacts, 0),
    telemed: rs.reduce((a, r) => a + r.telemedConsults, 0),
    revenue: rs.reduce((a, r) => a + r.servicesValue, 0),
    calls: rs.reduce((a, r) => a + r.callsHandled, 0),
    saved: rs.reduce((a, r) => a + r.dictationSavedMin, 0),
    presence: rs.reduce((a, r) => a + r.presenceMin, 0) / 60,
    wait: (() => { const w = rs.filter((r) => r.waitTimeAvgMin > 0); return w.length ? w.reduce((a, r) => a + r.waitTimeAvgMin, 0) / w.length : 0 })(),
  }))
  const findings = BILLING_FINDINGS.filter((f) => f.staffId === staff.id)
  const restricted = staff.consent !== 'erteilt' || !personMode

  return (
    <div className="space-y-6">
      <Link to="/team" className="text-xs text-ink-3 inline-flex items-center gap-1 hover:text-ink-1"><ArrowLeft size={12} /> Personal & Effizienz</Link>
      <div className="flex items-center gap-4 flex-wrap">
        <Avatar name={staff.name} hue={staff.avatarHue} size={56} />
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-ink-1">{staff.name}</h1>
          <p className="text-[11.5px] text-ink-3 mt-0.5">{staff.title} · {ROLE_LABEL[staff.role]} · FTE {fmt.pct(staff.fte)} · seit {fmt.date(new Date(staff.since))} · AD: {staff.upn}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">{staff.adGroups.map((g) => <Badge key={g}>{g}</Badge>)}</div>
        </div>
        {!restricted && <ScoreRing score={s.score} prev={s.prevScore} size={104} stroke={9} label="Score" />}
      </div>

      {restricted ? (
        <Card>
          <div className="flex gap-3 items-start text-sm text-ink-2">
            <Lock size={18} className="text-status-warning shrink-0 mt-0.5" />
            <div>
              <div className="text-ink-1 font-medium">Individuelle Auswertung deaktiviert</div>
              {!personMode ? <>Die Ordination ist im Team-Modus konfiguriert. Persönliche Scores werden nicht berechnet. {staff.name} sieht die eigenen Rohwerte unter „Mein Score“.</> : <>Für {staff.name} liegt nur die Zustimmung zur aggregierten Auswertung vor (§ 10 AVRAG / § 96 Abs 1 Z 3 ArbVG). Die Werte fließen in Team-Kennzahlen ein (k ≥ 5), ein persönlicher Score wird nicht berechnet oder gespeichert.</>}
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Präsenz (4 Wo.)" value={`${fmt.num(kpis.presenceH)} h`} deltaLabel="AD-Logon → Logoff" />
            <StatTile label="Kontakte" value={fmt.num(kpis.contacts)} deltaLabel={`${fmt.num1(kpis.contactsPerHour)} je Stunde`} />
            {kpis.revenue > 0 && <StatTile label="Verrechnet" value={fmt.eur(kpis.revenue)} deltaLabel={`${fmt.num1(kpis.revenue / Math.max(1, kpis.cost))}× der Kosten`} />}
            <StatTile label="Kosten" value={fmt.eur(kpis.cost)} deltaLabel="AG-Gesamtkosten, anteilig" />
            {staff.role === 'arzt' && <StatTile label="Telemedizin" value={fmt.pct1(kpis.telemedShare)} deltaLabel="Anteil an Kontakten" />}
            {staff.role === 'arzt' && <StatTile label="Diktara-Nutzung" value={fmt.pct(kpis.diktaraShare)} deltaLabel={`${fmt.minutes(kpis.savedMin)} gespart`} />}
            {staff.role === 'assistenz' && <StatTile label="Anrufe manuell" value={fmt.num(kpis.calls)} deltaLabel="Rest nach Ordicall" />}
            {(staff.role === 'assistenz' || staff.role === 'dgkp') && <StatTile label="Ø Wartezeit" value={`${fmt.num1(kpis.wait)} min`} deltaLabel="Check-in → Aufruf" />}
            {staff.role === 'arzt' && <StatTile label="No-Show" value={fmt.pct1(kpis.noShowRate)} deltaLabel="eigene Termine" />}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.3fr] gap-4">
            <Card title="Score-Aufschlüsselung" subtitle="Istwert · Ziel · Erreichung · Gewicht">
              <div className="space-y-3">
                {components.map((c) => {
                  const pct = componentPct(c)
                  const show = (v: number) => c.unit === '' ? fmt.pct1(v) : c.unit === '×' ? `${fmt.num1(v)}×` : `${fmt.num1(v)} ${c.unit}`
                  return (
                    <div key={c.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-1 inline-flex items-center gap-1" title={c.hint}>{c.label} <Info size={10} className="text-ink-3" /></span>
                        <span className="text-ink-3 tabular">{show(c.value)} <span className="text-ink-3/60">/ {c.invert ? '≤ ' : ''}{show(c.target)}</span> · <span className="text-ink-1">{pct} %</span> · {Math.round(c.weight * 100)} % Gewicht</span>
                      </div>
                      <MiniBar value={pct} max={100} tone={pct >= 90 ? '#3dcc91' : pct >= 70 ? '#ffb366' : '#ff9980'} height={5} />
                      <div className="text-[10px] text-ink-3 mt-0.5">{c.hint}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="space-y-4">
              <Card title={staff.role === 'assistenz' ? 'Anrufe & Wartezeit je Woche' : 'Kontakte je Woche'} subtitle="seit April 2026">
                <div className="h-44">
                  <ResponsiveContainer>
                    <BarChart data={weeks} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap={2}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" interval={3} axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                      <Bar dataKey={staff.role === 'assistenz' ? 'calls' : 'contacts'} name={staff.role === 'assistenz' ? 'Anrufe manuell' : 'Kontakte'} fill="var(--series-1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      {staff.role === 'arzt' && <Bar dataKey="telemed" name="davon Telemedizin" fill="var(--series-3)" radius={[4, 4, 0, 0]} isAnimationActive={false} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              {kpis.revenue > 0 && (
                <Card title="Verrechnete Leistungen je Woche" subtitle="Leistungsblatt PVS">
                  <div className="h-40">
                    <ResponsiveContainer>
                      <AreaChart data={weeks} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" interval={3} axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => fmt.k(v)} />
                        <Tooltip content={<ChartTooltip formatter={(v) => fmt.eur(v)} />} />
                        <Area type="monotone" dataKey="revenue" name="Verrechnet" stroke="var(--series-1)" fill="var(--series-1)" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {findings.length > 0 && (
            <Card title="Zugeordnete Abrechnungs-Findings">
              <div className="space-y-2">
                {findings.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 text-sm">
                    <Badge tone={f.severity === 'info' ? 'info' : f.severity}>{f.id}</Badge>
                    <span className="flex-1 text-ink-1">{f.title}</span>
                    <span className="tabular text-ink-2">{fmt.eur2(f.valueEur)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <p className="text-[11px] text-ink-3 flex items-center gap-1"><Info size={11} /> Diese Ansicht wurde protokolliert (Transparenzbericht). {staff.name} kann den eigenen Score jederzeit einsehen. Delta-Werte vergleichen mit den 4 Wochen davor.</p>
        </>
      )}
    </div>
  )
}
