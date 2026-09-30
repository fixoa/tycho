import { useState } from 'react'
import { Warning as AlertTriangle, BookOpen, MagnifyingGlass as Search, CalendarDots as CalendarClock, CheckCircle as CheckCircle2, ShieldWarning as ShieldAlert } from '@phosphor-icons/react'
import { Panel, Kpi, Pill } from '../components/simple'
import { Badge, Bar as MiniBar } from '../components/ui'
import { useData } from '../data/aggregate'
import { BILLING_FINDINGS, demo, PRACTICE } from '../data/mock'
import { staffById } from '../data/staff'
import { useFilters } from '../state/filters'
import { PAYER_OPTS, Choice } from '../components/Period'
import { fmt } from '../lib/format'
import type { ServicePosition } from '../data/types'

const CATS: ServicePosition['category'][] = ['Grundleistung', 'Kennzeichnung', 'Einzelleistung', 'Telemedizin', 'Vorsorge', 'Labor', 'Sonstiges']

export const DEADLINES = [
  { when: '2026-09-10', what: 'BVAEB Monatsabrechnung August', who: 'Ordinationsmanagement', kind: 'Abrechnung' },
  { when: '2026-09-30', what: 'Quartalsende Q3 – Limit Pos. 39 prüfen, Kennzeichnungen 8a/8b vollständig', who: 'Ärztliche Leitung', kind: 'Abrechnung' },
  { when: '2026-10-07', what: 'ÖGK Vorabrechnung über Ärztekammer (optional)', who: 'Ordinationsmanagement', kind: 'Abrechnung' },
  { when: '2026-10-10', what: 'ÖGK/SVS Quartalsabrechnung Q3 einreichen (Datenträger/Online)', who: 'Ordinationsmanagement', kind: 'Abrechnung' },
  { when: '2026-10-10', what: 'BVAEB Monatsabrechnung September', who: 'Ordinationsmanagement', kind: 'Abrechnung' },
  { when: '2026-10-15', what: 'WAHonline: Honorarnoten Q3 an Kostenträger übermittelt?', who: 'Empfang', kind: 'Wahlarzt' },
  { when: '2026-12-31', what: 'ICD-10-Codierquote > 95 % (Pflicht seit 01.07.2026)', who: 'Ärzt:innen', kind: 'Dokumentation' },
  { when: '2027-01-01', what: 'Neue Honorarordnung / Tarifvalorisierung einspielen', who: 'Tycho (Katalog-Import)', kind: 'Katalog' },
]

export default function Tarife() {
  const d = useData()
  const f = useFilters()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<ServicePosition['category'] | 'alle'>('alle')
  const [tab, setTab] = useState<'katalog' | 'findings' | 'fristen'>('katalog')
  const rows = d.services.filter((s) => (cat === 'alle' || s.category === cat) && (!q || `${s.code} ${s.name} ${s.rule}`.toLowerCase().includes(q.toLowerCase())))
  const total = d.services.reduce((a, s) => a + s.value, 0)
  const open = BILLING_FINDINGS.filter((x) => x.valueEur > 0).reduce((a, x) => a + x.valueEur, 0)
  const limit = demo().services.find((s) => s.limit)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<BookOpen size={15} />} label="Verrechnet im Zeitraum" value={fmt.eur(total)} sub={`${fmt.num(d.services.reduce((a, s) => a + s.count, 0))} Positionen · ${d.range.label}`} />
        <Kpi icon={<AlertTriangle size={15} />} label="Erbracht, nicht verrechnet" value={fmt.eur(open)} sub={`${BILLING_FINDINGS.length} Findings · nachtragbar bis Einreichung`} />
        <Kpi icon={<ShieldAlert size={15} />} label="Limitierte Position" value={`${Math.round((limit?.limitUsage ?? 0) * 100)} %`} sub={`Pos. ${limit?.code} · ${limit?.count}/${limit?.limit} · Degression ab Limit`} />
        <Kpi icon={<CalendarClock size={15} />} label="Nächste Frist" value="10. Okt." sub="ÖGK/SVS Quartalsabrechnung Q3" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex bg-surface-2 rounded-lg p-0.5 text-[13px]">{([['katalog', 'Honorarkatalog'], ['findings', 'Findings der Kreuzprüfung'], ['fristen', 'Fristen & Regeln']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-md ${tab === k ? 'bg-surface-1 font-medium shadow-sm' : 'text-ink-2'}`}>{l}</button>)}</div>
        {tab === 'katalog' && <>
          <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="bp-input py-1.5"><option value="alle">Alle Gruppen</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <Choice label="Kostenträger" value={f.payer} options={[...PAYER_OPTS]} onChange={f.setPayer} />
          <label className="bp-input flex items-center gap-2 py-1.5 ml-auto"><Search size={13} className="text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Position, Name, Regel" className="bg-transparent outline-none w-44 text-[13px]" /></label>
        </>}
      </div>

      {tab === 'katalog' && (
        <Panel icon={<BookOpen size={16} />} title={`Honorarkatalog · ${PRACTICE.name} · Allgemeinmedizin`} hint="Struktur nach ÖGK-Honorarordnung (Kennzeichnungspositionen 8a–8i/8aT–8iT, PERS, Erstkontakt 10, 18EZ, 20, 34, 34a, 39, VU, MKP). Tarife sind Demo-Werte; der Landeskatalog wird importiert.">
          <div className="overflow-x-auto"><table className="w-full text-[13px] min-w-[900px]">
            <thead><tr>{['Pos.', 'Leistung', 'Gruppe', 'Tarif', 'Anzahl', 'Umsatz', 'Regel / Limitierung', 'Träger', 'Rhythmus', 'Erbringung'].map((h, i) => <th key={h} className={`label uppercase tracking-[0.05em] text-[11px] px-3 py-2 ${i >= 3 && i <= 5 ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((s) => (
              <tr key={s.code} className="border-t border-line-1 align-top">
                <td className="px-3 py-2.5 font-mono text-[12px] whitespace-nowrap">{s.code}</td>
                <td className="px-3 py-2.5 font-medium">{s.name}</td>
                <td className="px-3 py-2.5"><Badge>{s.category}</Badge></td>
                <td className="px-3 py-2.5 text-right tabular">{s.tarif ? fmt.eur2(s.tarif) : <span className="text-ink-3">–</span>}</td>
                <td className="px-3 py-2.5 text-right tabular">{fmt.num(s.count)}</td>
                <td className="px-3 py-2.5 text-right tabular font-semibold">{s.value ? fmt.eur(s.value) : <span className="text-ink-3">–</span>}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-2 max-w-[320px]">{s.rule || '–'}{s.limit && <div className="flex items-center gap-2 mt-1"><div className="w-24"><MiniBar value={s.limitUsage ?? 0} tone={(s.limitUsage ?? 0) > 0.85 ? 'var(--bad-text)' : 'var(--accent)'} height={5} /></div><span className="tabular text-[11px]">{s.count}/{s.limit}</span></div>}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-2 whitespace-nowrap">{s.payers.join(', ')}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-2">{s.cycle}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-2">{s.by}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </Panel>
      )}

      {tab === 'findings' && (
        <Panel icon={<AlertTriangle size={16} />} title="Findings der Kreuzprüfung" hint="Abgleich PVS-Leistungsblatt × Diktara-Leistungserkennung × Ordicall-Terminart × e-card-Konsultationen">
          <div className="space-y-2">
            {BILLING_FINDINGS.map((x) => (
              <details key={x.id} className="rounded-xl border border-line-1 px-4 py-3">
                <summary className="flex items-center gap-3 cursor-pointer list-none">
                  <span className={`w-2 h-2 rounded-full ${x.severity === 'critical' ? 'bg-status-critical' : x.severity === 'serious' ? 'bg-status-serious' : x.severity === 'warning' ? 'bg-status-warning' : 'bg-series-1'}`} />
                  <span className="flex-1 text-[13.5px]">{x.title}</span>
                  <Badge>{x.source}</Badge>
                  <Pill good={x.valueEur >= 0}>{fmt.eur2(x.valueEur)}</Pill>
                </summary>
                <div className="mt-2 pl-5 text-[13px] text-ink-2 leading-relaxed">{x.detail}<div className="text-[12px] text-ink-3 mt-1">{x.id} · {fmt.date(new Date(x.date))}{x.staffId ? ` · ${staffById(x.staffId)?.name}` : ''}</div></div>
              </details>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'fristen' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Panel icon={<CalendarClock size={16} />} title="Fristenkalender" hint="Abrechnungs- und Meldefristen für Kassen-, Wahlarzt- und Dokumentationspflichten">
            <ul className="divide-y divide-line-1">{DEADLINES.map((x) => <li key={x.when + x.what} className="py-2.5 flex items-start gap-3 text-[13px]"><span className="tabular text-ink-3 w-24 shrink-0">{fmt.date(new Date(x.when))}</span><span className="flex-1">{x.what}<div className="text-[12px] text-ink-3">{x.who}</div></span><Badge>{x.kind}</Badge></li>)}</ul>
          </Panel>
          <Panel icon={<CheckCircle2 size={16} />} title="Abrechnungsregeln, die Tycho prüft" hint="Regelwerk aus Gesamtvertrag und Honorarordnung, konfigurierbar je Bundesland und Träger">
            <ul className="space-y-2 text-[13px] text-ink-2">
              {[
                'Fallzählung: erste e-card-Konsultation im Quartal löst Grundleistung (GL) und Erstkontakt (Pos. 10) aus; ohne beide gilt der Fall als nicht abgerechnet.',
                'Kennzeichnung 8a–8i ist Pflicht je Kontakt; 8a/8b ohne Tarif, aber ohne sie sind 8c–8i nicht honorierbar. Telemedizin mit T-Suffix, beides am selben Tag mit PERS.',
                'Limitierte Positionen (z. B. Pos. 39) werden je Vertragsarzt und Quartal hochgerechnet; ab 85 % Warnung, Prognose des Erreichungsdatums.',
                'Ausschlüsse: Injektion nicht neben Infusion am selben Tag, Wundversorgung nicht neben Kleine Chirurgie, 18EZ nicht neben 10.',
                'Delegierte Leistungen (DGKP) benötigen eine dokumentierte ärztliche Anordnung in der Kartei.',
                'VU 1× je Jahr und Person; MKP nach Untersuchungsschema mit Fristen.',
                'ICD-10-Codierung seit 01.07.2026 verpflichtend; Kontakte ohne Code werden gezählt und je Gruppe/Ärzt:in gemeldet.',
                'Wahlarzt: Honorarnote, WAHonline-Übermittlung, Kostenerstattung 80 % des Kassentarifs; ab 300 Patient:innen/Jahr elektronische Übermittlung verpflichtend.',
                'Kostenträger-Rhythmus: ÖGK/SVS quartalsweise (bis 10. des Folgemonats), BVAEB monatlich.',
              ].map((r) => <li key={r} className="flex gap-2"><CheckCircle2 size={14} className="text-status-good shrink-0 mt-0.5" />{r}</li>)}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  )
}
