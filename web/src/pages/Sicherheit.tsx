import { CheckCircle2, ShieldCheck, Lock, Eye, Database, KeyRound, FileCheck2, AlertTriangle, XCircle } from 'lucide-react'
import { Badge, Card, Table } from '../components/ui'
import { AUDIT_LOG, DATA_SOURCES, PRACTICE } from '../data/mock'
import { STAFF } from '../data/staff'
import { fmt } from '../lib/format'
import type { AuditEvent, DataSource } from '../data/types'

const GUARANTEES = [
  { icon: Eye, title: 'Nur lesen – technisch erzwungen', text: 'PVS-Login tycho_ro hat db_datareader + db_denydatawriter, Verbindung mit ApplicationIntent=ReadOnly. Gelesen wird ein Datenbank-Snapshot, nie die Produktivdatenbank während der Sprechstunde. Ein täglicher Selbsttest versucht ein INSERT und muss scheitern.' },
  { icon: Lock, title: 'Verschlüsselt in Ruhe und Bewegung', text: 'Lokaler Store AES-256-GCM, Datenschlüssel per DPAPI-NG an die Maschine gebunden, Master-Key im TPM 2.0 (nicht exportierbar). Web-UI nur über HTTPS mit internem Zertifikat auf 127.0.0.1 / RDP-Sitzung.' },
  { icon: Database, title: 'Keine Patientendaten in Tycho', text: 'Importiert werden Aggregate und Leistungscodes. Patient:innen werden mit lokalem HMAC-Salt pseudonymisiert und nur zur Fallzählung verwendet. Keine Namen, Diagnosen, Freitexte, Audio oder Transkripte.' },
  { icon: KeyRound, title: 'Identität aus dem Active Directory', text: 'Dienst läuft als gMSA (automatische Passwort-Rotation), Anmeldung per Kerberos-SSO, Berechtigung über AD-Gruppe G_Tycho_Leitung. Kein eigenes Benutzerverzeichnis, keine Passwörter in Tycho.' },
  { icon: ShieldCheck, title: 'Unsichtbar für Dritte, sichtbar für die Leitung', text: 'Keine ausgehende Verbindung außer optionalem lokalen SMTP-Relay für den Digest. Kein Telemetrie-Upload, keine Cloud. Prüfsummen-verkettetes Audit-Log (SHA-256) dokumentiert jeden Lesezugriff.' },
  { icon: FileCheck2, title: 'Rechtskonform von Anfang an', text: 'Mitgelieferte DSFA-Vorlage (DSFA-V Z 1, Z 4), Verarbeitungsverzeichnis, Muster-Zustimmung nach § 10 AVRAG / § 96 Abs 1 Z 3 ArbVG, Transparenzbericht je Mitarbeiter:in, Human-in-the-loop-Regel (Art. 22 DSGVO, AI Act Art. 26).' },
]

export default function Sicherheit() {
  const consents = STAFF.map((s) => ({ ...s }))
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight">Sicherheit & Compliance</h1>
        <p className="label mt-1 normal-case tracking-[0.04em] text-[10.5px]">Tycho ist eine Kontrollinstanz wie ein Benutzer mit Leserechten – nicht mehr. Dieser Bereich beweist es.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Schreibvorgänge seit Installation', '0', 'good'],
          ['Letzter Schreib-Selbsttest', 'abgewiesen ✓', 'good'],
          ['Verschlüsselung', 'AES-256-GCM · TPM', 'good'],
          ['Ausgehende Verbindungen', '0 (SMTP-Relay lokal)', 'good'],
        ].map(([l, v]) => (
          <div key={l} className="card px-5 py-4">
            <div className="text-[11px] text-ink-3">{l}</div>
            <div className="text-lg font-semibold text-ink-1 flex items-center gap-2"><CheckCircle2 size={16} className="text-status-good" />{v}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {GUARANTEES.map((g) => (
          <Card key={g.title}>
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded bg-accent/15 flex items-center justify-center shrink-0"><g.icon size={16} className="text-accent" /></span>
              <div>
                <div className="text-sm font-medium text-ink-1">{g.title}</div>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">{g.text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Datenquellen" subtitle={`Alle Verbindungen sind read-only · Host ${PRACTICE.server}`}>
        <Table<DataSource> rows={DATA_SOURCES} keyOf={(d) => d.id} dense cols={[
          { key: 'name', label: 'Quelle', render: (d) => <div><div className="text-ink-1">{d.name}</div>{d.note && <div className="text-[11px] text-ink-3">{d.note}</div>}</div> },
          { key: 'method', label: 'Zugriffsweg', render: (d) => <span className="text-xs text-ink-2">{d.method}</span> },
          { key: 'access', label: 'Recht', render: () => <Badge tone="good"><Eye size={11} /> read-only</Badge> },
          { key: 'sync', label: 'Letzter Lauf', render: (d) => <span className="text-xs tabular">{fmt.date(new Date(d.lastSync))} {fmt.time(new Date(d.lastSync))}</span> },
          { key: 'records', label: 'Datensätze', align: 'right', render: (d) => fmt.num(d.records) },
          { key: 'status', label: 'Status', render: (d) => d.status === 'ok' ? <Badge tone="good">OK</Badge> : d.status === 'warn' ? <Badge tone="warning"><AlertTriangle size={11} /> Hinweis</Badge> : <Badge tone="critical">Aus</Badge> },
        ]} />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
        <Card title="Zustimmungen zur Auswertung" subtitle="Ohne Betriebsrat: individuelle, widerrufbare Zustimmung (§ 10 AVRAG). Widerruf deaktiviert den persönlichen Score sofort.">
          <div className="space-y-1.5">
            {consents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-ink-1">{s.name}</span>
                <span className="text-[11px] text-ink-3">{s.department}</span>
                {s.consent === 'erteilt' ? <Badge tone="good">erteilt · 14.07.2026</Badge> : s.consent === 'nur-aggregiert' ? <Badge tone="neutral">nur aggregiert (k ≥ 5)</Badge> : <Badge tone="warning">ausstehend</Badge>}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded bg-surface-2 px-3 py-2"><div className="text-ink-3">DSFA (Art. 35 DSGVO)</div><div className="text-ink-1 flex items-center gap-1"><CheckCircle2 size={12} className="text-status-good" /> abgeschlossen 10.07.2026</div></div>
            <div className="rounded bg-surface-2 px-3 py-2"><div className="text-ink-3">AI Act (Anhang III, Beschäftigung)</div><div className="text-ink-1 flex items-center gap-1"><CheckCircle2 size={12} className="text-status-good" /> Human-Review-Pflicht aktiv</div></div>
            <div className="rounded bg-surface-2 px-3 py-2"><div className="text-ink-3">Verarbeitungsverzeichnis</div><div className="text-ink-1 flex items-center gap-1"><CheckCircle2 size={12} className="text-status-good" /> Eintrag „Tycho Analyse“</div></div>
            <div className="rounded bg-surface-2 px-3 py-2"><div className="text-ink-3">Transparenzbericht</div><div className="text-ink-1 flex items-center gap-1"><CheckCircle2 size={12} className="text-status-good" /> monatlich an jede:n Mitarbeiter:in</div></div>
          </div>
        </Card>

        <Card title="Audit-Log" subtitle="Append-only, SHA-256-verkettet · Auszug der letzten Ereignisse">
          <Table<AuditEvent> rows={AUDIT_LOG} keyOf={(e) => e.ts + e.action} dense cols={[
            { key: 'ts', label: 'Zeit', render: (e) => <span className="text-xs tabular text-ink-3">{fmt.dateShort(new Date(e.ts))} {fmt.time(new Date(e.ts))}</span> },
            { key: 'actor', label: 'Akteur', render: (e) => <span className="font-mono text-xs">{e.actor}</span> },
            { key: 'action', label: 'Aktion', render: (e) => <div><div className="text-xs text-ink-1">{e.action}</div><div className="text-[11px] text-ink-3">{e.target}</div></div> },
            { key: 'result', label: '', render: (e) => e.result === 'ok' ? <CheckCircle2 size={14} className="text-status-good" /> : <XCircle size={14} className="text-status-critical" /> },
          ]} />
        </Card>
      </div>
    </div>
  )
}
