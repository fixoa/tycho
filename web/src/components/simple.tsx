import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { fmt } from '../lib/format'

/** KPI-Karte im Stil der Simple-Ansicht: Icon + Label, große Zahl, Delta-Pill, Unterzeile */
export function Kpi({ icon, label, value, delta, sub, invert = false, hint }: { icon?: ReactNode; label: string; value: ReactNode; delta?: number | null; sub?: ReactNode; invert?: boolean; hint?: string }) {
  const good = delta === undefined || delta === null ? null : invert ? delta <= 0 : delta >= 0
  return (
    <div className="card px-5 py-4 min-w-0">
      <div className="flex items-center gap-2 text-[13px] text-ink-2">{icon && <span className="text-ink-3">{icon}</span>}<span>{label}</span>{hint && <span title={hint} className="text-ink-3"><Info size={12} /></span>}</div>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap"><span className="text-[28px] font-semibold tracking-tight tabular leading-none">{value}</span>{delta !== undefined && delta !== null && <Pill good={good!}>{fmt.signed(Math.round(delta))} %</Pill>}</div>
      {sub && <div className="mt-2 text-[12.5px] text-ink-3">{sub}</div>}
    </div>
  )
}
export function Pill({ good, children }: { good: boolean; children: ReactNode }) { return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[12px] font-medium ${good ? 'pill-up' : 'pill-down'}`}>{children}</span> }

export function Panel({ icon, title, hint, action, children, className = '' }: { icon?: ReactNode; title: ReactNode; hint?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card px-5 py-4 ${className}`}>
      <header className="flex items-center gap-2 mb-3"><span className="text-ink-2">{icon}</span><h3 className="font-semibold text-[14px]">{title}</h3>{hint && <span title={hint} className="text-ink-3"><Info size={13} /></span>}<div className="ml-auto">{action}</div></header>
      {children}
    </section>
  )
}

/** Tabelle mit Balken-Hintergrund in der Hauptspalte (wie in der Vorlage) */
export function BarTable<T>({ rows, cols, keyOf }: { rows: T[]; cols: { key: string; label: string; render: (r: T) => ReactNode; align?: 'left' | 'right'; bar?: (r: T) => number }[]; keyOf: (r: T) => string }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(0, ...cols.filter((c) => c.bar).map((c) => c.bar!(r)))))
  return (
    <div className="overflow-x-auto"><table className="w-full text-[13.5px] min-w-[520px]">
      <thead><tr>{cols.map((c) => <th key={c.key} className={`label font-medium px-3 py-2 ${c.align === 'right' ? 'text-right' : 'text-left'} uppercase tracking-[0.05em] text-[11px]`}>{c.label}</th>)}</tr></thead>
      <tbody>{rows.map((r) => { const b = cols.find((c) => c.bar)?.bar?.(r) ?? 0; return (
        <tr key={keyOf(r)} className="group">
          {cols.map((c, i) => <td key={c.key} className={`px-3 py-2.5 relative ${c.align === 'right' ? 'text-right tabular' : ''}`}>{i === 0 && <span className="absolute inset-y-1 left-0 rounded-lg bg-surface-2 -z-0" style={{ width: `${(b / max) * 100}%` }} />}<span className="relative">{c.render(r)}</span></td>)}
        </tr>) })}</tbody>
    </table></div>
  )
}

export function Heat({ rows, hours, legend = ['Weniger', 'Mehr'] }: { rows: { day: string; cells: { hour: number; value: number }[] }[]; hours?: number[]; legend?: [string, string] }) {
  const max = Math.max(1, ...rows.flatMap((r) => r.cells.map((c) => c.value)))
  const steps = ['var(--seq-100)', 'var(--seq-200)', 'var(--seq-300)', 'var(--seq-400)', 'var(--seq-500)']
  const all = rows[0]?.cells.map((c) => c.hour) ?? []
  const hs = hours ?? all
  return (
    <div>
      <div className="flex items-center justify-end gap-1.5 text-[12px] text-ink-3 mb-2"><span>{legend[0]}</span>{steps.map((s) => <span key={s} className="w-3.5 h-3.5 rounded-[3px]" style={{ background: s }} />)}<span>{legend[1]}</span></div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `36px repeat(${all.length}, 1fr)` }}>
        {rows.map((r) => [<div key={r.day} className="text-[12.5px] text-ink-2 flex items-center">{r.day}</div>, ...r.cells.map((c) => { const i = c.value === 0 ? 0 : Math.min(4, Math.floor((c.value / max) * 4.999)); return <div key={r.day + c.hour} title={`${r.day} ${c.hour}:00 – ${c.value}`} className="h-8 rounded-[6px]" style={{ background: c.value === 0 ? 'var(--surface-2)' : steps[i] }} /> })])}
        <div />{all.map((h) => <div key={h} className="text-[11.5px] text-ink-3 text-center">{hs.includes(h) ? h : ''}</div>)}
      </div>
    </div>
  )
}
