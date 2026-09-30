import { CheckCircle as CheckCircle2, Warning as AlertTriangle, XCircle } from '@phosphor-icons/react'
import { Badge, Card, StatTile, Table } from '../components/ui'
import { QM, type QmItem } from '../data/extras'
import { staffById } from '../data/staff'
import { fmt } from '../lib/format'

export default function QMPage() {
  const over = QM.filter((q) => q.status === 'ueberfaellig'), soon = QM.filter((q) => q.status === 'bald')
  return (
    <div className="space-y-6">
      <div><h1 className="text-[15px] font-semibold text-ink-1">QM & Fristen</h1><p className="text-[11.5px] text-ink-3 mt-0.5">Geräteprüfungen (MPG/STK), Schulungen, Hygieneplan, Dokumente · Quelle: QM-Liste (CSV/Excel, read-only) und Gerätestamm im PVS</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Überfällig" value={fmt.num(over.length)} accent="#d03b3b" deltaLabel={over.map((o) => o.item.split(' ')[0]).join(', ')} />
        <StatTile label="Fällig in 30 Tagen" value={fmt.num(soon.length)} accent="#fab219" deltaLabel="im Digest erinnert" />
        <StatTile label="In Ordnung" value={fmt.num(QM.filter((q) => q.status === 'ok').length)} accent="#0ca30c" deltaLabel="nächste Fälligkeit > 30 Tage" />
        <StatTile label="QM-Erfüllungsgrad" value={fmt.pct((QM.length - over.length) / QM.length)} accent="var(--series-1)" deltaLabel="fristgerecht erledigt" />
      </div>
      <Card title="Fristenliste" subtitle="Sortiert nach Fälligkeit">
        <Table<QmItem> rows={[...QM].sort((a, b) => a.due.localeCompare(b.due))} keyOf={(q) => q.item} dense cols={[
          { key: 's', label: '', width: '32px', render: (q) => q.status === 'ok' ? <CheckCircle2 size={15} className="text-status-good" /> : q.status === 'bald' ? <AlertTriangle size={15} className="text-status-warning" /> : <XCircle size={15} className="text-status-critical" /> },
          { key: 'i', label: 'Aufgabe', render: (q) => <span className="text-ink-1">{q.item}</span> },
          { key: 'c', label: 'Kategorie', render: (q) => <Badge>{q.category}</Badge> },
          { key: 'd', label: 'Fällig', render: (q) => <span className="tabular text-xs">{fmt.date(new Date(q.due))}</span> },
          { key: 'r', label: 'Verantwortlich', render: (q) => <span className="text-xs text-ink-2">{staffById(q.responsible)?.name}</span> },
        ]} />
      </Card>
    </div>
  )
}
