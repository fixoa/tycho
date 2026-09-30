import { Stethoscope, Timer, Headphones, Tray as Inbox, PhoneCall, ChatText as MessageSquare } from '@phosphor-icons/react'
import { useData, pctDelta } from '../data/aggregate'
import { Kpi, Panel, BarTable } from '../components/simple'
import { usePersonMode } from '../state/config'
import { ROLE_LABEL } from '../data/staff'
import { fmt } from '../lib/format'

export default function Produktivitaet() {
  const d = useData()
  const personMode = usePersonMode()
  const docs = d.staff.filter((r) => r.staff.role === 'arzt').sort((a, b) => b.revenue - a.revenue)
  const assist = d.staff.filter((r) => r.staff.role === 'assistenz').sort((a, b) => b.calls - a.calls)
  const perDoc = docs.reduce((a, r) => a + r.perDay, 0) / Math.max(1, docs.length)
  const minPer = docs.reduce((a, r) => a + r.minPerContact, 0) / Math.max(1, docs.length)
  const calls = d.calls.reduce((a, c) => a + c.total, 0)
  const aiSec = d.calls.reduce((a, c) => a + c.aiResolved, 0) * 92
  const name = (r: typeof docs[number]) => personMode ? r.staff.name : `${ROLE_LABEL[r.staff.role]} ${docs.indexOf(r) + 1 || assist.indexOf(r) + 1}`
  const concerns = [
    { who: 'Empfang gesamt', done: 1251, perDay: 60, time: '2 h 38 min' }, { who: 'Terminvereinbarung', done: 612, perDay: 29, time: '0 h 12 min' }, { who: 'Rezeptbestellung', done: 331, perDay: 16, time: '1 h 05 min' }, { who: 'Befundauskunft', done: 178, perDay: 8, time: '5 h 40 min' }, { who: 'Überweisung', done: 130, perDay: 6, time: '3 h 10 min' },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Stethoscope size={15} />} label="Umsatz je Ärzt:in" value={fmt.eur(Math.round(perDoc))} sub={`pro Tag, bei Ø ${fmt.num(Math.round(docs.reduce((a, r) => a + r.contactsPerDay, 0) / Math.max(1, docs.length)))} Patient:innen`} />
        <Kpi icon={<Timer size={15} />} label="Ø Zeit pro Patient:in" value={`${Math.floor(minPer)}:${Math.round((minPer % 1) * 60).toString().padStart(2, '0')} Min.`} delta={d.p ? pctDelta(minPer, d.staffPrev.filter((r) => r.staff.role === 'arzt').reduce((a, r) => a + r.minPerContact, 0) / Math.max(1, d.staffPrev.filter((r) => r.staff.role === 'arzt').length)) : null} sub="zum Zeitraum davor" invert />
        <Kpi icon={<Headphones size={15} />} label="Telefonzeit (KI)" value={`${fmt.num(Math.round(aiSec / 3600))} Std.`} sub={`${fmt.num(calls)} Anrufe, Ø 1:32 Min.`} />
        <Kpi icon={<Inbox size={15} />} label="Anliegen erledigt" value={fmt.num(concerns[0].done)} sub={`Ø ${concerns[0].time} bis erledigt`} />
      </div>
      <Panel icon={<Stethoscope size={16} />} title="Ärzt:innen" hint={personMode ? 'Umsatz und Kontakte je Ärzt:in im Zeitraum' : 'Team-Modus: Namen ausgeblendet, Werte je Ärzt:in anonymisiert'}>
        <BarTable rows={docs} keyOf={(r) => r.staff.id} cols={[
          { key: 'n', label: 'Ärzt:in', render: (r) => <span className="font-medium">{name(r)}</span>, bar: (r) => r.revenue },
          { key: 'u', label: 'Umsatz', align: 'right', render: (r) => <span className="font-semibold">{fmt.eur(r.revenue)}</span> },
          { key: 'd', label: 'Pro Tag', align: 'right', render: (r) => <span className="text-ink-2">{fmt.eur(Math.round(r.perDay))}</span> },
          { key: 'p', label: 'Patient:innen', align: 'right', render: (r) => fmt.num(r.contacts) },
          { key: 'z', label: 'Ø Zeit', align: 'right', render: (r) => `${Math.floor(r.minPerContact)}:${Math.round((r.minPerContact % 1) * 60).toString().padStart(2, '0')} Min.` },
        ]} />
      </Panel>
      <Panel icon={<PhoneCall size={16} />} title="Telefon" hint="Manuell bearbeitete Anrufe je Assistenz nach Ordicall-Vorfilterung">
        <BarTable rows={assist} keyOf={(r) => r.staff.id} cols={[
          { key: 'n', label: 'Assistent:in', render: (r) => <span className="font-medium">{name(r)}</span>, bar: (r) => r.calls },
          { key: 'a', label: 'Anrufe', align: 'right', render: (r) => <span className="font-semibold">{fmt.num(r.calls)}</span> },
          { key: 'd', label: 'Pro Tag', align: 'right', render: (r) => <span className="text-ink-2">{fmt.num(Math.round(r.callsPerDay))}</span> },
          { key: 'g', label: 'Gesprächszeit', align: 'right', render: (r) => `${fmt.num(Math.round((r.calls * 2.9) / 60))} Std.` },
          { key: 'ø', label: 'Ø pro Anruf', align: 'right', render: () => '2:54 Min.' },
        ]} />
      </Panel>
      <Panel icon={<MessageSquare size={16} />} title="Anliegen" hint="Erledigte Anliegen und Durchlaufzeit nach Kategorie (Ordicall + Empfang)">
        <BarTable rows={concerns} keyOf={(r) => r.who} cols={[
          { key: 'n', label: 'Kategorie', render: (r) => <span className="font-medium">{r.who}</span>, bar: (r) => r.done },
          { key: 'e', label: 'Erledigt', align: 'right', render: (r) => <span className="font-semibold">{fmt.num(r.done)}</span> },
          { key: 'd', label: 'Pro Tag', align: 'right', render: (r) => <span className="text-ink-2">{r.perDay}</span> },
          { key: 't', label: 'Ø Durchlaufzeit', align: 'right', render: (r) => r.time },
        ]} />
      </Panel>
    </div>
  )
}
