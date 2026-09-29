import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, MapPin, Check } from 'lucide-react'
import { useFilters, PRESETS, COMPARE } from '../state/filters'
import { fmt } from '../lib/format'

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [onClose])
  return ref
}

/** Zeitraum-Wahl mit Presets, freiem Datum und Vergleich – funktioniert überall gleich */
export function PeriodPicker({ compact = false }: { compact?: boolean }) {
  const f = useFilters()
  const [open, setOpen] = useState(false)
  const ref = useOutside(() => setOpen(false))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="bp-btn whitespace-nowrap" aria-haspopup="menu" aria-expanded={open}>
        <Calendar size={14} className="text-ink-3" /> {compact ? `${fmt.dateShort(f.range.from)} – ${fmt.dateShort(f.range.to)}` : f.range.label} <ChevronDown size={13} className="text-ink-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-[300px] card p-2 z-50 text-[13px]">
          <div className="label px-2 py-1">Zeitraum</div>
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => { f.setPreset(p.key); setOpen(false) }} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-2 ${f.range.label === p.make().label ? 'font-semibold' : ''}`}>{p.label}{f.range.label === p.make().label && <Check size={14} />}</button>
          ))}
          <div className="border-t border-line-1 mt-1 pt-2 px-2">
            <div className="label mb-1">Benutzerdefiniert</div>
            <div className="flex items-center gap-1.5">
              <input type="date" className="bp-input flex-1 py-1" value={iso(f.range.from)} max={iso(f.range.to)} onChange={(e) => e.target.value && f.setCustom(new Date(e.target.value), f.range.to)} />
              <span className="text-ink-3">–</span>
              <input type="date" className="bp-input flex-1 py-1" value={iso(f.range.to)} min={iso(f.range.from)} max="2026-08-24" onChange={(e) => e.target.value && f.setCustom(f.range.from, new Date(e.target.value))} />
            </div>
            <div className="text-[11px] text-ink-3 mt-1">Daten bis 24.08.2026 (Demo-Datenstand).</div>
          </div>
          <div className="border-t border-line-1 mt-2 pt-2 px-2">
            <div className="label mb-1">Vergleich</div>
            <select value={f.compare} onChange={(e) => f.setCompare(e.target.value)} className="bp-input w-full py-1">{COMPARE.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
          </div>
        </div>
      )}
    </div>
  )
}

export function LocationPicker() {
  const f = useFilters()
  const [open, setOpen] = useState(false)
  const ref = useOutside(() => setOpen(false))
  const opts = [{ key: 'alle', label: 'Alle Standorte' }, { key: 'donaufeld', label: 'Primärversorgung Zentrum (Wien)' }]
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="bp-btn whitespace-nowrap min-w-[190px] justify-between"><span className="inline-flex items-center gap-2"><MapPin size={14} className="text-ink-3" /><span className="bg-surface-2 rounded-md px-1.5 py-0.5 text-[12.5px]">{opts.find((o) => o.key === f.location)?.label}</span></span><ChevronDown size={13} className="text-ink-3" /></button>
      {open && <div className="absolute right-0 mt-1 w-[260px] card p-2 z-50 text-[13px]">{opts.map((o) => <button key={o.key} onClick={() => { f.setLocation(o.key); setOpen(false) }} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-2">{o.label}{f.location === o.key && <Check size={14} />}</button>)}</div>}
    </div>
  )
}

/** Einfache Auswahl (Rolle, Kostenträger, Team) */
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T | null; options: { key: T; label: string }[]; onChange: (v: T | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useOutside(() => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-[12.5px] text-ink-2 hover:text-ink-1 whitespace-nowrap">{label}: <span className="text-ink-1 font-semibold">{value ? options.find((o) => o.key === value)?.label : 'Alle'}</span> <ChevronDown size={12} /></button>
      {open && <div className="absolute left-0 mt-1 w-[220px] card p-1.5 z-50 text-[13px]">
        <button onClick={() => { onChange(null); setOpen(false) }} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-2">Alle{!value && <Check size={14} />}</button>
        {options.map((o) => <button key={o.key} onClick={() => { onChange(o.key); setOpen(false) }} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-2">{o.label}{value === o.key && <Check size={14} />}</button>)}
      </div>}
    </div>
  )
}

export const ROLE_OPTS = [{ key: 'arzt', label: 'Ärzt:innen' }, { key: 'dgkp', label: 'DGKP' }, { key: 'assistenz', label: 'Ordinationsassistenz' }, { key: 'management', label: 'Management' }] as const
export const PAYER_OPTS = [{ key: 'ÖGK', label: 'ÖGK' }, { key: 'SVS', label: 'SVS' }, { key: 'BVAEB', label: 'BVAEB' }, { key: 'Privat', label: 'Privat / Wahlarzt' }] as const
export const TEAM_OPTS = [{ key: 'Ärzte', label: 'Ärzte' }, { key: 'Pflege', label: 'Pflege' }, { key: 'Empfang', label: 'Empfang' }, { key: 'Verwaltung', label: 'Verwaltung' }] as const
