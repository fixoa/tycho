import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, Info } from 'lucide-react'
import { fmt } from '../lib/format'

export function Card({ title, subtitle, action, children, className = '', padded = true }: {
  title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean
}) {
  return (
    <section className={`card flex flex-col ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-1">
          <div className="min-w-0">
            {title && <h3 className="label text-ink-2 leading-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] text-ink-3 mt-0.5 leading-snug normal-case">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`${padded ? 'px-4 pb-4' : ''} ${title ? (padded ? 'pt-2.5' : '') : padded ? 'pt-4' : ''} flex-1 min-w-0`}>{children}</div>
    </section>
  )
}

export function Delta({ value, format = (v: number) => fmt.num(Math.abs(v)), invert = false, suffix = '' }: {
  value: number; format?: (v: number) => string; invert?: boolean; suffix?: string
}) {
  const good = invert ? value < 0 : value > 0
  const neutral = Math.abs(value) < 1e-9
  const color = neutral ? 'text-ink-3' : good ? 'text-[var(--good-text)]' : 'text-status-critical'
  const Icon = neutral ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon size={14} strokeWidth={2.2} />
      {format(value)}{suffix}
    </span>
  )
}

export function StatTile({ label, value, delta, deltaLabel, hint, accent, children }: {
  label: string; value: ReactNode; delta?: ReactNode; deltaLabel?: string; hint?: string; accent?: string; children?: ReactNode
}) {
  return (
    <div className="card px-4 py-3 flex flex-col gap-0.5 min-w-0 relative overflow-hidden">
      {accent && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />}
      <div className="flex items-start gap-1 text-[11.5px] text-ink-3 leading-snug">
        <span>{label}</span>
        {hint && <span title={hint} className="text-ink-3/70"><Info size={11} /></span>}
      </div>
      <div className="text-[26px] font-light text-ink-1 leading-tight tabular">{value}</div>
      {(delta || deltaLabel) && (
        <div className="flex items-center gap-2 text-[11px] text-ink-3">
          {delta}
          {deltaLabel && <span>{deltaLabel}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warning' | 'serious' | 'critical' | 'info' }) {
  const map = {
    neutral: 'bg-surface-3 text-ink-2',
    good: 'bg-status-good/15 text-[var(--good-text)]',
    warning: 'bg-status-warning/15 text-status-warning',
    serious: 'bg-status-serious/15 text-status-serious',
    critical: 'bg-status-critical/15 text-status-critical',
    info: 'bg-series-1/15 text-series-1',
  }
  return <span className={`inline-flex items-center gap-1 rounded px-1.5 py-[3px] text-[10.5px] font-semibold leading-none ${map[tone]}`}>{children}</span>
}

export function Avatar({ name, hue, size = 32 }: { name: string; hue: number; size?: number }) {
  const initials = name.replace(/^Dr\.\s*/, '').split(' ').map((p) => p[0]).slice(0, 2).join('')
  return (
    <span
      className="inline-flex items-center justify-center font-semibold text-white shrink-0 rounded-full"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${hue} 32% 40%)` }}
    >
      {initials}
    </span>
  )
}

export function ScoreRing({ score, size = 96, stroke = 8, label, prev }: { score: number; size?: number; stroke?: number; label?: string; prev?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const tone = score >= 80 ? '#4fb3a8' : score >= 65 ? '#b9bb5f' : score >= 50 ? '#d9834a' : '#d64545'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold text-ink-1" style={{ fontSize: size * 0.28 }}>{score}</span>
        {label && <span className="text-[10px] text-ink-3 -mt-0.5">{label}</span>}
        {prev !== undefined && <Delta value={score - prev} />}
      </div>
    </div>
  )
}

export function Bar({ value, max = 1, tone = 'var(--series-1)', height = 6 }: { value: number; max?: number; tone?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full bg-surface-3 overflow-hidden" style={{ height }}>
      <div className="h-full" style={{ width: `${pct}%`, background: tone }} />
    </div>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-[15px] font-semibold text-ink-1">{children}</h2>
      {sub && <p className="text-xs text-ink-3">{sub}</p>}
    </div>
  )
}

export function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean; payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[]; label?: string | number; formatter?: (v: number, key?: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs" style={{ background: 'var(--bp-dg2)' }}>
      <div className="text-ink-3 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-ink-1">
          <span className="w-2 h-2 rounded" style={{ background: p.color }} />
          <span className="text-ink-2">{p.name}</span>
          <span className="ml-auto tabular font-medium">{typeof p.value === 'number' ? (formatter ? formatter(p.value, p.dataKey) : fmt.num(p.value)) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

export function Table<T>({ rows, cols, keyOf, onRowClick, dense }: {
  rows: T[]
  cols: { key: string; label: ReactNode; render: (r: T) => ReactNode; align?: 'left' | 'right'; width?: string }[]
  keyOf: (r: T) => string
  onRowClick?: (r: T) => void
  dense?: boolean
}) {
  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full text-[12.5px] min-w-[560px]">
        <thead>
          <tr className="border-b border-line-1">
            {cols.map((c) => (
              <th key={c.key} className={`label px-4 py-2 ${c.align === 'right' ? 'text-right' : 'text-left'}`} style={{ width: c.width }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={keyOf(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={`border-t border-line-1 ${onRowClick ? 'cursor-pointer hover:bg-surface-2' : ''}`}>
              {cols.map((c) => (
                <td key={c.key} className={`px-4 ${dense ? 'py-1.5' : 'py-2.5'} ${c.align === 'right' ? 'text-right tabular whitespace-nowrap' : ''}`}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
