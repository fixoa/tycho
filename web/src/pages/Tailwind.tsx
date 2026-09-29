import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Wind, AlertTriangle, Sparkles, Lock, CalendarOff, Clock } from 'lucide-react'
import { Badge, Card, ChartTooltip, Delta, StatTile, Table, Bar as MiniBar, Avatar } from '../components/ui'
import { invoices, tailwindSummary, HR, type Invoice } from '../data/tailwind'
import { STAFF, ROLE_LABEL, staffById } from '../data/staff'
import { usePersonMode } from '../state/config'
import { fmt } from '../lib/format'

const STATUS_LABEL: Record<Invoice['status'], { label: string; tone: 'neutral' | 'good' | 'warning' | 'serious' | 'critical' | 'info' }> = {
  bezahlt: { label: 'bezahlt', tone: 'good' }, offen: { label: 'offen', tone: 'neutral' }, ueberfaellig: { label: 'überfällig', tone: 'warning' },
  mahnung1: { label: 'Mahnung 1', tone: 'warning' }, mahnung2: { label: 'Mahnung 2', tone: 'serious' }, 'inkasso-empfohlen': { label: 'Inkasso empfohlen', tone: 'critical' },
  ratenzahlung: { label: 'Ratenzahlung', tone: 'info' }, storniert: { label: 'storniert', tone: 'neutral' }, abgeschrieben: { label: 'abgeschrieben', tone: 'neutral' },
}

export default function Tailwind() {
  const s = tailwindSummary()
  const personMode = usePersonMode()
  const [tab, setTab] = useState<'inkasso' | 'hr'>('inkasso')
  const [filter, setFilter] = useState<'aktion' | 'alle'>('aktion')
  const list = invoices().filter((i) => filter === 'alle' || (i.aiAction !== 'Keine Aktion')).slice(0, 40)
  const hrWarnings = HR.filter((h) => h.warning)
  const groups = (['arzt', 'dgkp', 'assistenz', 'management'] as const).map((r) => {
    const hs = HR.filter((h) => staffById(h.staffId)?.role === r)
    const n = hs.length
    return { role: r, n, overtime: hs.reduce((a, h) => a + h.overtimeBalanceH, 0), vacationRest: hs.reduce((a, h) => a + h.vacationDays - h.vacationTaken, 0), sick: hs.reduce((a, h) => a + h.sickDays, 0), istSoll: hs.reduce((a, h) => a + h.istH, 0) / Math.max(1, hs.reduce((a, h) => a + h.sollH, 0)) }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Wind size={20} className="text-accent" /> Tailwind Station</h1>
          <p className="label mt-1 normal-case tracking-[0.04em] text-[10.5px]">Controlling & Inkasso für Wahlarzt-/Privathonorare, geführt durch Analyse und KI · HR-Frühwarnung aus Planery · alles read-only</p>
        </div>
        <div className="flex gap-1 text-xs">
          {([['inkasso', 'Honorarnoten & Inkasso'], ['hr', 'HR & Überstunden (Planery)']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded border ${tab === k ? 'bg-accent/15 border-accent/40 text-ink-1' : 'border-line-1 text-ink-2 hover:bg-surface-2'}`}>{l}</button>
          ))}
        </div>
      </div>

      {tab === 'inkasso' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatTile label="Offene Honorarnoten" value={fmt.eur(s.openSum)} accent="var(--series-1)" deltaLabel={`${s.openCount} Honorarnoten`} />
            <StatTile label="Davon überfällig" value={fmt.eur(s.overdueSum)} accent="#d03b3b" deltaLabel={`${s.overdueCount} Honorarnoten · ${fmt.pct(s.overdueSum / Math.max(1, s.openSum))} der offenen`} />
            <StatTile label="Erwarteter Zahlungseingang" value={fmt.eur(s.expectedRecovery)} accent="var(--series-3)" deltaLabel="KI-Zahlungswahrscheinlichkeit × Restbetrag" />
            <StatTile label="Ø Zahlungsdauer (DSO)" value={`${fmt.num1(s.dso)} Tage`} accent="var(--series-7)" delta={<Delta value={s.dso - s.dsoPrev} format={(v) => fmt.num1(Math.abs(v))} suffix=" Tage" invert />} deltaLabel="vs. Vorquartal" />
            <StatTile label="WAHonline fehlt" value={fmt.num(s.wahonlineMissing)} accent="#ec835a" deltaLabel="Honorarnoten ohne Übermittlung – Patient:in wartet auf Erstattung" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card title="Fälligkeitsstruktur (Aging)" subtitle="Überfälliger Restbetrag nach Tagen">
              <div className="h-44">
                <ResponsiveContainer>
                  <BarChart data={s.aging} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap={10}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="bucket" axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmt.k(v)} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip formatter={(v) => fmt.eur(v)} />} cursor={{ fill: 'var(--surface-2)' }} />
                    <Bar dataKey="sum" name="Überfällig" fill="var(--series-2)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Nach Leistungsart" subtitle="Zahlungsquote und offener Rest">
              <div className="space-y-2">
                {s.byKind.map((k) => (
                  <div key={k.kind}>
                    <div className="flex justify-between text-xs mb-0.5"><span className="text-ink-1">{k.kind}</span><span className="tabular text-ink-3">{fmt.pct(k.quote)} bezahlt · {fmt.eur(k.open)} offen</span></div>
                    <MiniBar value={k.quote} tone={k.quote >= 0.85 ? '#0ca30c' : k.quote >= 0.7 ? '#fab219' : '#ec835a'} height={5} />
                  </div>
                ))}
              </div>
            </Card>
            <Card title="KI-Maßnahmenplan" subtitle="Was Tailwind heute vorschlägt – jede Aktion wird von einem Menschen freigegeben">
              <div className="space-y-2">
                {Object.entries(s.actions).sort((a, b) => b[1].sum - a[1].sum).map(([a, v]) => (
                  <div key={a} className="flex items-center gap-3 text-sm">
                    <Sparkles size={14} className="text-accent shrink-0" />
                    <span className="flex-1 text-ink-1">{a}</span>
                    <span className="text-xs text-ink-3">{v.n}×</span>
                    <span className="tabular text-ink-1 w-20 text-right">{fmt.eur(v.sum)}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-ink-3 mt-3">Tailwind schreibt nichts ins PVS und versendet nichts selbst. Es erzeugt Erinnerungs- und Mahntexte zum Kopieren sowie eine Inkasso-Übergabeliste (CSV) für den Menschen, der entscheidet.</p>
            </Card>
          </div>

          <Card title="Honorarnoten" subtitle="Pseudonymisiert · Restbetrag, Status, KI-Empfehlung mit Begründung"
            action={<div className="flex gap-1 text-xs">{([['aktion', 'Mit Handlungsbedarf'], ['alle', 'Alle']] as const).map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1.5 rounded border ${filter === k ? 'bg-accent/15 border-accent/40 text-ink-1' : 'border-line-1 text-ink-2'}`}>{l}</button>)}</div>}>
            <Table<Invoice> rows={list} keyOf={(i) => i.id} dense cols={[
              { key: 'id', label: 'Nr.', render: (i) => <span className="font-mono text-xs text-ink-2 whitespace-nowrap">{i.id}</span> },
              { key: 'p', label: 'Patient', render: (i) => <span className="font-mono text-xs text-ink-3">{i.patientPseudo}</span> },
              { key: 'kind', label: 'Leistung', render: (i) => <div><div className="text-ink-1 text-xs">{i.kind}</div><div className="text-[11px] text-ink-3">{i.provider}</div></div> },
              { key: 'issued', label: 'Ausgestellt', render: (i) => <span className="text-xs tabular">{fmt.dateShort(new Date(i.issued))}</span> },
              { key: 'amount', label: 'Rest', align: 'right', render: (i) => <span className={i.amount - i.paid > 0 ? 'text-ink-1' : 'text-ink-3'}>{fmt.eur2(i.amount - i.paid)}</span> },
              { key: 'overdue', label: 'Überfällig', align: 'right', render: (i) => i.daysOverdue > 0 && i.status !== 'bezahlt' ? <span className={i.daysOverdue > 60 ? 'text-status-critical' : 'text-status-warning'}>{i.daysOverdue} T</span> : <span className="text-ink-3">–</span> },
              { key: 'status', label: 'Status', render: (i) => <Badge tone={STATUS_LABEL[i.status].tone}>{STATUS_LABEL[i.status].label}</Badge> },
              { key: 'wah', label: 'WAHonline', render: (i) => i.wahonline === 'nicht nötig' ? <span className="text-ink-3 text-xs">–</span> : i.wahonline === 'übermittelt' ? <span className="text-xs text-[var(--good-text)]">✓</span> : <Badge tone="serious">{i.wahonline}</Badge> },
              { key: 'p2', label: 'Zahlungs-W.', align: 'right', render: (i) => <span className="text-xs">{fmt.pct(i.payProbability)}</span> },
              { key: 'ai', label: 'KI-Empfehlung', render: (i) => <div className="max-w-xs"><div className="text-xs text-ink-1 flex items-center gap-1">{i.aiAction !== 'Keine Aktion' && <Sparkles size={11} className="text-accent" />}{i.aiAction}</div><div className="text-[11px] text-ink-3 leading-snug">{i.aiReason}</div></div> },
            ]} />
          </Card>
        </>
      )}

      {tab === 'hr' && (
        <>
          <div className="card px-4 py-3 flex items-center gap-3 text-xs text-ink-2">
            <Lock size={14} className="text-status-warning shrink-0" />
            <span><span className="text-ink-1 font-medium">Hochsicherheitskritisch.</span> Planery-Daten werden mit eigenem Schlüssel verschlüsselt, nur für die HR-Rolle (AD-Gruppe G_Tailwind_HR) angezeigt und separat protokolliert. Tycho liest ausschließlich Zeiten, Salden und Abwesenheitsarten – keine Gehälter, keine Krankheitsgründe.</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Überstundensaldo gesamt" value={`${fmt.num(HR.reduce((a, h) => a + h.overtimeBalanceH, 0))} h`} accent="#ec835a" delta={<Delta value={HR.reduce((a, h) => a + h.overtimeTrend, 0)} suffix=" h" invert />} deltaLabel="Veränderung im Monat" />
            <StatTile label="Urlaubsrest bis Jahresende" value={`${fmt.num(HR.reduce((a, h) => a + h.vacationDays - h.vacationTaken, 0))} Tage`} accent="var(--series-1)" deltaLabel={`${fmt.num(HR.reduce((a, h) => a + h.vacationPlanned, 0))} Tage bereits geplant`} />
            <StatTile label="Krankenstandstage (8 Wo.)" value={fmt.num(HR.reduce((a, h) => a + h.sickDays, 0))} accent="var(--series-7)" deltaLabel="Team gesamt" />
            <StatTile label="Frühwarnungen" value={fmt.num(hrWarnings.length)} accent="#d03b3b" deltaLabel="Überstunden, Urlaub, Besetzung" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-4">
            <Card title="Frühwarnungen" subtitle="Regeln: Saldo > 60 h, Urlaubsrest > 15 Tage im Q4, 3 Monate steigender Trend, > 5 Krankenstandstage / 8 Wochen, Besetzungslücke">
              <div className="space-y-3">
                {hrWarnings.map((h) => {
                  const st = staffById(h.staffId)!
                  return (
                    <div key={h.staffId} className="flex gap-3">
                      <AlertTriangle size={15} className="text-status-serious shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="text-ink-1">{personMode ? st.name : `${ROLE_LABEL[st.role]} (${st.department})`}</div>
                        <div className="text-xs text-ink-2">{h.warning}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {!personMode && <p className="text-[11px] text-ink-3 mt-3">Team-Modus: Warnungen werden ohne Namen angezeigt. Die namentliche Zuordnung sieht nur die HR-Rolle in Planery selbst.</p>}
            </Card>

            <Card title="Abwesenheiten der nächsten 8 Wochen" subtitle="Urlaub, Fortbildung, Zeitausgleich aus Planery">
              <div className="space-y-1.5">
                {HR.flatMap((h) => h.absences.map((a) => ({ ...a, staff: staffById(h.staffId)! }))).sort((a, b) => a.from.localeCompare(b.from)).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CalendarOff size={14} className="text-ink-3 shrink-0" />
                    <span className="tabular text-xs text-ink-3 w-28">{fmt.dateShort(new Date(a.from))} – {fmt.dateShort(new Date(a.to))}</span>
                    <span className="flex-1 text-ink-1">{personMode ? a.staff.name : ROLE_LABEL[a.staff.role]}</span>
                    <Badge>{a.type}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title={personMode ? 'Zeiten & Salden je Person' : 'Zeiten & Salden je Gruppe'} subtitle="Aktueller Monat · Soll/Ist aus Planery">
            {personMode ? (
              <Table rows={HR} keyOf={(h) => h.staffId} dense cols={[
                { key: 'n', label: 'Person', render: (h) => { const st = staffById(h.staffId)!; return <div className="flex items-center gap-2"><Avatar name={st.name} hue={st.avatarHue} size={24} /><span className="text-ink-1 whitespace-nowrap">{st.name}</span></div> } },
                { key: 'r', label: 'Rolle', render: (h) => <span className="text-xs text-ink-2">{ROLE_LABEL[staffById(h.staffId)!.role]}</span> },
                { key: 'soll', label: 'Soll', align: 'right', render: (h) => `${h.sollH} h` },
                { key: 'ist', label: 'Ist', align: 'right', render: (h) => `${h.istH} h` },
                { key: 'ot', label: 'Ü-Saldo', align: 'right', render: (h) => <span className={h.overtimeBalanceH > 60 ? 'text-status-critical' : h.overtimeBalanceH > 30 ? 'text-status-warning' : ''}>{h.overtimeBalanceH} h</span> },
                { key: 'tr', label: 'Trend', align: 'right', render: (h) => <Delta value={h.overtimeTrend} suffix=" h" invert /> },
                { key: 'u', label: 'Urlaub Rest', align: 'right', render: (h) => `${h.vacationDays - h.vacationTaken} / ${h.vacationDays}` },
                { key: 's', label: 'Krank', align: 'right', render: (h) => h.sickDays },
              ]} />
            ) : (
              <Table rows={groups} keyOf={(g) => g.role} dense cols={[
                { key: 'g', label: 'Gruppe', render: (g) => <span className="text-ink-1">{ROLE_LABEL[g.role]} <span className="text-ink-3 text-xs">({g.n} Personen)</span></span> },
                { key: 'is', label: 'Ist / Soll', align: 'right', render: (g) => fmt.pct(g.istSoll) },
                { key: 'ot', label: 'Ü-Saldo', align: 'right', render: (g) => `${g.overtime} h` },
                { key: 'u', label: 'Urlaubsrest', align: 'right', render: (g) => `${g.vacationRest} Tage` },
                { key: 's', label: 'Krank (8 Wo.)', align: 'right', render: (g) => g.sick },
              ]} />
            )}
            <p className="text-[11px] text-ink-3 mt-3 flex items-center gap-1"><Clock size={11} /> Anwesenheit laut AD-Logon und Planery-Zeiten werden gegeneinander geprüft; Abweichungen &gt; 30 min/Tag erscheinen als Hinweis.</p>
          </Card>
        </>
      )}
      <span className="hidden">{STAFF.length}</span>
    </div>
  )
}
