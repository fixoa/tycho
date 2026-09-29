import { Card, Delta, StatTile, Table, Bar as MiniBar, Avatar } from '../components/ui'
import { PRESCRIBING, PRESCRIBING_OUTLIERS } from '../data/extras'
import { staffById, ROLE_LABEL } from '../data/staff'
import { usePersonMode } from '../state/config'
import { fmt } from '../lib/format'

export default function Verordnungen() {
  const personMode = usePersonMode()
  const avg = PRESCRIBING.reduce((a, p) => a + p.costPerPatient, 0) / PRESCRIBING.length
  const gen = PRESCRIBING.reduce((a, p) => a + p.genericRate, 0) / PRESCRIBING.length
  const saving = PRESCRIBING_OUTLIERS.reduce((a, o) => a + o.saving, 0)
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">Verordnungs-Monitor</h1><p className="text-xs text-ink-3">Verordnungskosten aus e-Medikation/PVS (read-only) gegen ÖKO-Tool-Richtwerte · Quartal bis dato · keine Patientendaten, nur ATC-Gruppen</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Verordnungskosten je Patient:in" value={fmt.eur2(avg)} accent="var(--series-1)" delta={<Delta value={avg - 41.2} format={(v) => fmt.eur2(Math.abs(v))} invert />} deltaLabel="vs. Fachgruppen-Richtwert 41,20 €" />
        <StatTile label="Generika-Quote" value={fmt.pct(gen)} accent="var(--series-3)" delta={<Delta value={(gen - 0.79) * 100} format={(v) => fmt.num1(Math.abs(v))} suffix=" Pp." />} deltaLabel="Richtwert 79 %" />
        <StatTile label="Ausreißer" value={fmt.num(PRESCRIBING_OUTLIERS.reduce((a, o) => a + o.n, 0))} accent="#ec835a" deltaLabel="Verordnungen mit ÖKO-Tool-Alternative" />
        <StatTile label="Einsparpotenzial / Quartal" value={fmt.eur(saving)} accent="var(--series-7)" deltaLabel="ohne Therapieänderung (Generikum, Packungsgröße)" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title={personMode ? 'Je Ärzt:in' : 'Ärztegruppe'} subtitle="Kosten je Patient:in und Generika-Quote gegen Richtwert">
          {personMode ? (
            <Table rows={PRESCRIBING} keyOf={(p) => p.staffId} dense cols={[
              { key: 'n', label: 'Ärzt:in', render: (p) => { const s = staffById(p.staffId)!; return <div className="flex items-center gap-2"><Avatar name={s.name} hue={s.avatarHue} size={24} /><span className="text-ink-1 whitespace-nowrap">{s.name}</span></div> } },
              { key: 'c', label: '€ / Patient:in', align: 'right', render: (p) => <span className={p.costPerPatient > p.peer * 1.15 ? 'text-status-warning' : ''}>{fmt.eur2(p.costPerPatient)}</span> },
              { key: 'g', label: 'Generika', render: (p) => <div className="flex items-center gap-2 w-32"><MiniBar value={p.genericRate} tone={p.genericRate >= 0.79 ? '#0ca30c' : '#fab219'} height={5} /><span className="text-xs tabular">{fmt.pct(p.genericRate)}</span></div> },
              { key: 'o', label: 'Ausreißer', align: 'right', render: (p) => p.outliers },
              { key: 'a', label: 'Top-ATC', render: (p) => <span className="text-xs text-ink-2">{p.topAtc}</span> },
            ]} />
          ) : (
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-ink-2">{ROLE_LABEL.arzt} (4 Personen)</span><span className="tabular">{fmt.eur2(avg)} / Patient:in</span></div>
              <div className="flex justify-between"><span className="text-ink-2">Spannweite in der Gruppe</span><span className="tabular">{fmt.eur2(Math.min(...PRESCRIBING.map((p) => p.costPerPatient)))} – {fmt.eur2(Math.max(...PRESCRIBING.map((p) => p.costPerPatient)))}</span></div>
              <div className="flex justify-between"><span className="text-ink-2">Generika-Quote Gruppe</span><span className="tabular">{fmt.pct(gen)}</span></div>
              <p className="text-[11px] text-ink-3 pt-2">Team-Modus: Einzelwerte je Ärzt:in sind ausgeblendet. Jede Ärzt:in sieht die eigenen Werte unter „Mein Score“.</p>
            </div>
          )}
        </Card>
        <Card title="Ausreißer mit Alternative" subtitle="ÖKO-Tool / Erstattungskodex · medizinische Entscheidung bleibt bei der Ärzt:in">
          <div className="space-y-2">
            {PRESCRIBING_OUTLIERS.map((o, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-ink-3 w-24 shrink-0">{personMode ? staffById(o.staffId)?.name.replace('Dr. ', '') : 'Ärztegruppe'}</span>
                <span className="flex-1 text-ink-1">{o.drug} <span className="text-ink-3 text-xs">· {o.n}×</span></span>
                <span className="tabular text-xs text-ink-2">{o.saving ? fmt.eur(o.saving) : 'Qualität'}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
