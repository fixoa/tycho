import { useLayoutEffect, useRef, useState } from 'react'
import { Scales, Database, ArrowRight, Pulse, Warning, XCircle, CheckCircle, Clock, Broadcast, Lock, Plugs, Cpu, SquaresFour } from '@phosphor-icons/react'
import { Panel } from '../components/simple'
import { Badge } from '../components/ui'
import { DEADLINES } from './Tarife'
import { fmt } from '../lib/format'
import { DEMO_TODAY } from '../data/mock'
import { SYSTEMS, EDGES, STATUS_COLOR, STATUS_LABEL, contacts24h, systemSummary, relTime, type SystemNode, type SystemStatus } from '../data/systems'

const KIND = { src: { label: 'Quellen', hint: 'nur lesend', icon: Plugs }, core: { label: 'Tycho-Kern', hint: 'TS-ORD-01 · lokal', icon: Cpu }, mod: { label: 'Module', hint: 'lesen aus dem Store', icon: SquaresFour } } as const

function StatusDot({ status, size = 8 }: { status: SystemStatus; size?: number }) {
  return <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
    {status === 'operational' && <span className="absolute inset-0 rounded-full pulse-dot" style={{ background: STATUS_COLOR[status], opacity: 0.45, transform: 'scale(1.9)' }} />}
    <span className="relative rounded-full w-full h-full" style={{ background: STATUS_COLOR[status] }} />
  </span>
}
const STATUS_ICON = { operational: CheckCircle, degraded: Warning, offline: XCircle, standby: Clock }

function SystemCard({ s, selected, dim, onClick, refCb }: { s: SystemNode; selected: boolean; dim: boolean; onClick: () => void; refCb: (el: HTMLButtonElement | null) => void }) {
  return (
    <button ref={refCb} onClick={onClick} className={`card text-left w-full px-3 py-2.5 transition-all ${selected ? 'border-accent ring-2 ring-accent/20' : ''} ${dim ? 'opacity-40' : ''} ${s.status === 'standby' ? 'border-dashed' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        <StatusDot status={s.status} />
        <span className="font-medium text-[13px] truncate">{s.name}</span>
        {s.latencyMs !== undefined && <span className={`ml-auto mono text-[10.5px] tabular ${s.latencyMs > 1000 ? 'text-status-warning' : 'text-ink-3'}`}>{s.latencyMs >= 1000 ? `${(s.latencyMs / 1000).toLocaleString('de-AT', { maximumFractionDigits: 1 })} s` : `${s.latencyMs} ms`}</span>}
      </div>
      <div className="text-[11.5px] text-ink-3 truncate mt-0.5">{s.role}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]"><Clock size={11} className="text-ink-3 shrink-0" /><span className="text-ink-2">{relTime(s.lastContact)}</span>{s.lastContact && <span className="text-ink-3 tabular">· {fmt.dateShort(s.lastContact)} {fmt.time(s.lastContact)}</span>}</div>
    </button>
  )
}

function Timeline({ now }: { now: Date }) {
  const rows = SYSTEMS.filter((s) => s.kind !== 'mod' && s.status !== 'standby')
  const W = 1000
  const x = (d: Date) => ((d.getTime() - (now.getTime() - 24 * 3600_000)) / (24 * 3600_000)) * W
  const hours = Array.from({ length: 9 }, (_, i) => new Date(now.getTime() - (24 - i * 3) * 3600_000))
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid" style={{ gridTemplateColumns: '150px 1fr' }}>
          <div />
          <svg viewBox={`0 0 ${W} 14`} className="w-full h-[14px] block" preserveAspectRatio="none">
            {hours.map((h, i) => <text key={i} x={Math.min(x(h), W - 24)} y={11} fontSize={10} fill="var(--ink-3)" fontFamily="JetBrains Mono, monospace" textAnchor={i === 0 ? 'start' : 'middle'}>{fmt.time(h)}</text>)}
          </svg>
          {rows.map((s) => {
            const cs = contacts24h(s.id, now)
            const fails = cs.filter((c) => !c.ok).length
            return [
              <div key={s.id + 'l'} className="flex items-center gap-2 h-7 text-[12px] pr-3 border-t border-line-1"><StatusDot status={s.status} size={6} /><span className="truncate">{s.name}</span><span className="ml-auto text-[10.5px] text-ink-3 tabular">{cs.length}{fails > 0 && <span className="text-status-critical"> · {fails} ✕</span>}</span></div>,
              <svg key={s.id + 's'} viewBox={`0 0 ${W} 28`} className="w-full h-7 block border-t border-line-1" preserveAspectRatio="none">
                {hours.map((h, i) => <line key={i} x1={x(h)} x2={x(h)} y1={0} y2={28} stroke="var(--line-1)" strokeWidth={1} />)}
                {cs.map((c, i) => <rect key={i} x={x(c.ts) - 1} y={c.ok ? 8 : 5} width={cs.length > 200 ? 1.2 : 2.2} height={c.ok ? 12 : 18} fill={c.ok ? 'var(--accent)' : 'var(--bad)'} opacity={c.ok ? (cs.length > 200 ? 0.55 : 0.9) : 1} />)}
                {s.lastContact && <line x1={x(s.lastContact)} x2={x(s.lastContact)} y1={0} y2={28} stroke="var(--accent)" strokeWidth={1.5} />}
              </svg>,
            ]
          })}
        </div>
      </div>
    </div>
  )
}

const REGS = [
  { area: 'Abrechnung Kasse', items: ['ASVG §§ 338 ff. Gesamtvertrag ÖGK/ÖÄK, Landes-Honorarordnung (Wien) mit Positionsnummern, Limitierungen, Degression', 'SVS-Gesamtvertrag (neu ab 01.01.2026), BVAEB-Honorarordnung (monatliche Abrechnung)', 'Fallzählung je Quartal über e-card; Kennzeichnungspositionen 8a–8i / 8aT–8iT / PERS', 'Einreichung ÖGK/SVS bis 10. des Folgemonats nach Quartal'] },
  { area: 'Telemedizin', items: ['Gesamtvertragliche Vereinbarung seit 2021/2022: gleiche Honorierung, Kennzeichnung mit T', 'GTelG 2012: ausdrückliche Einwilligung, Identifikation, Dokumentation', 'ÖGK-Videosystem visit-e als Referenz'] },
  { area: 'e-card / ELGA / Dokumentation', items: ['ELGA-Pflicht für Vertragsärzt:innen inkl. e-Medikation und e-Befund (seit 01/2026)', 'ICD-10-Diagnosecodierung ambulant verpflichtend seit 01.07.2026 (auch Wahlärzt:innen)', 'e-Impfpass für Impfungen', 'Wahlärzt:innen: e-card/ELGA seit 2026, WAHonline ab 300 Patient:innen/Jahr'] },
  { area: 'Datenschutz & Arbeitsrecht', items: ['DSGVO Art. 9 Gesundheitsdaten, Art. 35 DSFA (DSFA-V Z 1: Leistungsbewertung), Art. 22 keine automatisierte Entscheidung', '§ 54 ÄrzteG Verschwiegenheit; Tycho-Hersteller als Auftragsverarbeiter (Art. 28)', 'ArbVG § 96 Abs 1 Z 3 / § 96a; ohne Betriebsrat § 10 AVRAG: Einzelzustimmung – Pro-Person-Modus nur mit NDA und Zustimmungen', 'EU AI Act Anhang III (Beschäftigung): Hochrisiko → menschliche Aufsicht, Information, Logs'] },
  { area: 'Qualität & Betrieb', items: ['Medizinproduktegesetz / MPBV: sicherheitstechnische Kontrollen (EKG, AED, Spirometer)', 'Hygieneplan, Arbeitsplatzevaluierung (ASchG), Datenschutzschulungen', 'Aufbewahrung: Kartei 10 Jahre (ÄrzteG § 51), Personenwerte in Tycho 24 Monate'] },
]

export default function Landschaft() {
  const now = DEMO_TODAY
  const [sel, setSel] = useState<string | null>(null)
  const [reg, setReg] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<string, HTMLButtonElement>())
  const [paths, setPaths] = useState<{ a: string; b: string; d: string }[]>([])
  const sum = systemSummary(now)
  const selected = SYSTEMS.find((s) => s.id === sel)
  const related = new Set<string>(sel ? [sel, ...EDGES.filter(([a, b]) => a === sel || b === sel).flatMap(([a, b]) => [a, b])] : [])

  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return
    const calc = () => {
      if (window.innerWidth < 1024) { setPaths([]); return }
      const box = el.getBoundingClientRect()
      const ps: { a: string; b: string; d: string }[] = []
      for (const [a, b] of EDGES) {
        const A = nodes.current.get(a)?.getBoundingClientRect(), B = nodes.current.get(b)?.getBoundingClientRect()
        if (!A || !B) continue
        const x1 = A.right - box.left, y1 = A.top + A.height / 2 - box.top, x2 = B.left - box.left, y2 = B.top + B.height / 2 - box.top
        const mx = (x1 + x2) / 2
        ps.push({ a, b, d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}` })
      }
      setPaths(ps)
    }
    calc()
    const ro = new ResizeObserver(calc); ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const kinds = ['src', 'core', 'mod'] as const
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight">Systemlandschaft</h1>
          <p className="text-[12.5px] text-ink-3 mt-0.5">Stand {fmt.date(now)} {fmt.time(now)} · alle Verbindungen lesend · Server TS-ORD-01</p>
        </div>
        <div className="flex gap-3 text-[12px] text-ink-2 flex-wrap">
          {(Object.keys(STATUS_LABEL) as SystemStatus[]).map((k) => <span key={k} className="inline-flex items-center gap-1.5"><StatusDot status={k} size={7} />{STATUS_LABEL[k]}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card px-4 py-3"><div className="label flex items-center gap-1.5"><Pulse size={13} /> Operational</div><div className="mt-1 text-[24px] font-semibold tabular leading-none">{sum.operational}<span className="text-[13px] text-ink-3 font-normal"> / {sum.total}</span></div><div className="text-[11.5px] text-ink-3 mt-1">aktive Systeme und Module</div></div>
        <div className="card px-4 py-3"><div className="label flex items-center gap-1.5"><Warning size={13} /> Beeinträchtigt</div><div className="mt-1 text-[24px] font-semibold tabular leading-none" style={{ color: sum.degraded ? 'var(--warn-text)' : undefined }}>{sum.degraded}</div><div className="text-[11.5px] text-ink-3 mt-1">{sum.offline} offline</div></div>
        <div className="card px-4 py-3"><div className="label flex items-center gap-1.5"><Broadcast size={13} /> Letzter Kontakt</div><div className="mt-1 text-[24px] font-semibold tabular leading-none">{relTime(sum.latest.lastContact, now)}</div><div className="text-[11.5px] text-ink-3 mt-1">{sum.latest.name} · {sum.latest.lastContact && fmt.time(sum.latest.lastContact)}</div></div>
        <div className="card px-4 py-3"><div className="label flex items-center gap-1.5"><Clock size={13} /> Nächster Abgleich</div><div className="mt-1 text-[24px] font-semibold tabular leading-none">{fmt.time(sum.nextRun)}</div><div className="text-[11.5px] text-ink-3 mt-1">heute · PVS-Snapshot, Bank</div></div>
        <div className="card px-4 py-3"><div className="label flex items-center gap-1.5"><Lock size={13} /> Schreibschutz</div><div className="mt-1 text-[24px] font-semibold leading-none" style={{ color: 'var(--good-text)' }}>geprüft</div><div className="text-[11.5px] text-ink-3 mt-1">Selbsttest 05:41 · INSERT abgelehnt</div></div>
      </div>

      <Panel icon={<Plugs size={16} />} title="Systemkarte" hint="Klick auf ein System zeigt Verbindung, Kanal und Kontaktrhythmus" action={sel && <button onClick={() => setSel(null)} className="text-[12px] text-accent">Auswahl aufheben</button>}>
        <div ref={wrap} className="relative">
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" aria-hidden>
            {paths.map((p) => { const hl = sel === p.a || sel === p.b; return <path key={p.a + p.b} d={p.d} fill="none" stroke={hl ? 'var(--accent)' : 'var(--line-2)'} strokeWidth={hl ? 1.6 : 1} opacity={sel && !hl ? 0.35 : 1} /> })}
          </svg>
          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-x-16 gap-y-6">
            {kinds.map((k) => {
              const I = KIND[k].icon
              const list = SYSTEMS.filter((s) => s.kind === k)
              return (
                <div key={k}>
                  <div className="flex items-center gap-2 mb-2"><I size={14} className="text-ink-3" /><span className="label">{KIND[k].label}</span><span className="text-[11px] text-ink-3">· {KIND[k].hint}</span><span className="ml-auto text-[11px] text-ink-3 tabular">{list.filter((s) => s.status === 'operational').length}/{list.filter((s) => s.status !== 'standby').length}</span></div>
                  <div className={`grid gap-2 ${k === 'core' ? 'content-center h-full pb-8' : ''}`}>
                    {list.map((s) => <SystemCard key={s.id} s={s} selected={sel === s.id} dim={!!sel && !related.has(s.id)} onClick={() => setSel(sel === s.id ? null : s.id)} refCb={(el) => { if (el) nodes.current.set(s.id, el); else nodes.current.delete(s.id) }} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {selected && (() => { const I = STATUS_ICON[selected.status]; return (
          <div className="mt-4 card px-4 py-3 border-accent/40 grid md:grid-cols-[1.2fr_1fr_1fr] gap-x-6 gap-y-2 text-[12.5px]">
            <div className="md:col-span-3 flex items-center gap-2"><I size={16} style={{ color: STATUS_COLOR[selected.status] }} /><span className="font-semibold text-[14px]">{selected.name}</span><Badge tone={selected.status === 'operational' ? 'good' : selected.status === 'degraded' ? 'warning' : selected.status === 'offline' ? 'critical' : 'neutral'}>{STATUS_LABEL[selected.status]}</Badge><span className="text-ink-3">{selected.role}</span></div>
            <div><div className="label">Kanal</div><div className="mono text-[12px] mt-0.5 break-all">{selected.channel}</div></div>
            <div><div className="label">Letzter Kontakt</div><div className="mt-0.5">{selected.lastContact ? `${fmt.date(selected.lastContact)} ${fmt.time(selected.lastContact)} · ${relTime(selected.lastContact, now)}` : 'nie'}</div></div>
            <div><div className="label">Rhythmus · nächster Kontakt</div><div className="mt-0.5">{selected.cadence}{selected.nextContact && <span className="text-ink-3"> · {selected.nextContact}</span>}</div></div>
            {selected.records !== undefined && <div><div className="label">Datensätze</div><div className="mt-0.5 tabular">{fmt.num(selected.records)}</div></div>}
            {selected.latencyMs !== undefined && <div><div className="label">Antwortzeit</div><div className="mt-0.5 tabular">{selected.latencyMs >= 1000 ? `${(selected.latencyMs / 1000).toLocaleString('de-AT', { maximumFractionDigits: 1 })} s` : `${selected.latencyMs} ms`}</div></div>}
            {selected.dependsOn && <div><div className="label">Liest von</div><div className="mt-0.5">{selected.dependsOn.map((d) => SYSTEMS.find((s) => s.id === d)?.name).join(', ')}</div></div>}
            {selected.note && <div className="md:col-span-3 flex items-start gap-2 text-ink-2"><ArrowRight size={13} className="mt-0.5 text-ink-3 shrink-0" />{selected.note}</div>}
          </div>
        ) })()}
      </Panel>

      <Panel icon={<Broadcast size={16} />} title="Kommunikation der letzten 24 Stunden" hint="Jeder Strich ist ein lesender Kontakt; rot = fehlgeschlagener Versuch; die durchgehende Linie markiert den letzten erfolgreichen Kontakt" action={<div className="flex gap-3 text-[11.5px] text-ink-3"><span className="inline-flex items-center gap-1.5"><span className="w-[3px] h-3 bg-accent" />Kontakt</span><span className="inline-flex items-center gap-1.5"><span className="w-[3px] h-3" style={{ background: 'var(--bad)' }} />Fehler</span></div>}>
        <Timeline now={now} />
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel icon={<Scales size={16} />} title="Regulatorik" hint="Österreichischer Rechtsrahmen, an dem sich Tycho orientiert">
          <div className="flex gap-1.5 flex-wrap mb-3">{REGS.map((r, i) => <button key={r.area} onClick={() => setReg(i)} className={`bp-btn py-1 text-[12px] ${reg === i ? 'active' : ''}`}>{r.area}</button>)}</div>
          <ul className="space-y-2 text-[13px] text-ink-2">{REGS[reg].items.map((i) => <li key={i} className="flex gap-2"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent shrink-0" />{i}</li>)}</ul>
        </Panel>
        <div className="space-y-4">
          <Panel icon={<Database size={16} />} title="Datenmodell" hint="Was Tycho speichert – und was nicht">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
              {[['Fall (pseudonym)', 'Quartal, Kostenträger, Erstkontakt, Kennzeichnung 8x'], ['Kontakt', 'Datum, Art, Ärzt:in, ICD-10 ja/nein'], ['Leistung', 'Position, Anzahl, Tarif, Regelprüfung'], ['Termin', 'Slot, Terminart, No-Show, Wartezeit'], ['Anruf', 'Ergebnis, Anliegen, Dauer, Übergabe'], ['Diktat', 'Dauer, Akzeptanz, erkannte Positionen'], ['Honorarnote', 'Betrag, Status, WAHonline, Zahlungseingang'], ['Person', 'AD-Konto, Rolle, FTE, Kosten, Zustimmung'], ['HR-Periode', 'Soll/Ist, Überstunden, Urlaub, Abwesenheiten'], ['Finding', 'Typ, Wert, Quelle, Status']].map(([k, v]) => <div key={k}><div className="font-medium">{k}</div><div className="text-[12px] text-ink-3">{v}</div></div>)}
            </div>
            <div className="mt-3 text-[12px] text-ink-3">Nicht gespeichert: Patientennamen, SVNR, Diagnosen im Klartext, Freitexte, Audio, Transkripte.</div>
          </Panel>
          <Panel icon={<Clock size={16} />} title="Nächste Fristen">
            <ul className="divide-y divide-line-1">{DEADLINES.slice(0, 5).map((x) => <li key={x.when + x.what} className="py-2 flex items-center gap-3 text-[13px]"><span className="tabular text-ink-3 w-24 shrink-0">{fmt.date(new Date(x.when))}</span><span className="flex-1">{x.what}</span><Badge>{x.kind}</Badge></li>)}</ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
