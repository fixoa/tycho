import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { DATA_AS_OF, QUARTER, PREV_QUARTER } from '../data/mock'
import { addDays } from '../lib/format'
import type { Role } from '../data/types'

// Globaler Filter-Zustand: Zeitraum + Vergleichszeitraum, Rolle, Kostenträger, Team, Facetten, Suche.
// Alle Seiten leiten ihre Zahlen aus diesem Zustand ab.
export type Payer = 'ÖGK' | 'SVS' | 'BVAEB' | 'Privat'
export type Team = 'Ärzte' | 'Pflege' | 'Empfang' | 'Verwaltung'
export interface Range { from: Date; to: Date; label: string }

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
export const PRESETS: { key: string; label: string; make: () => Range }[] = [
  { key: 'week', label: 'Letzte 7 Tage', make: () => ({ from: addDays(DATA_AS_OF, -6), to: DATA_AS_OF, label: 'Letzte 7 Tage' }) },
  { key: 'month', label: 'Dieser Monat', make: () => ({ from: monthStart(DATA_AS_OF), to: DATA_AS_OF, label: 'Dieser Monat' }) },
  { key: 'lastmonth', label: 'Letzter Monat', make: () => ({ from: new Date(DATA_AS_OF.getFullYear(), DATA_AS_OF.getMonth() - 1, 1), to: addDays(monthStart(DATA_AS_OF), -1), label: 'Letzter Monat' }) },
  { key: '4w', label: 'Letzte 4 Wochen', make: () => ({ from: addDays(DATA_AS_OF, -27), to: DATA_AS_OF, label: 'Letzte 4 Wochen' }) },
  { key: 'qtd', label: 'Dieses Quartal', make: () => ({ from: QUARTER.start, to: DATA_AS_OF, label: `${QUARTER.label}` }) },
  { key: 'prevq', label: 'Letztes Quartal', make: () => ({ from: PREV_QUARTER.start, to: PREV_QUARTER.end, label: PREV_QUARTER.label }) },
  { key: 'year', label: 'Letzte 12 Monate', make: () => ({ from: new Date('2025-09-01'), to: DATA_AS_OF, label: 'Letzte 12 Monate' }) },
]
export const COMPARE: { key: string; label: string }[] = [
  { key: 'prev', label: 'Zeitraum davor' },
  { key: 'prevq', label: 'Vorquartal' },
  { key: 'none', label: 'Kein Vergleich' },
]

interface Filters {
  range: Range
  compare: string
  compareRange: Range | null
  role: Role | null
  payer: Payer | null
  team: Team | null
  query: string
  facets: Record<string, string | null>
  view: number
  location: string
}
interface Ctx extends Filters {
  setPreset: (key: string) => void
  setCustom: (from: Date, to: Date) => void
  setCompare: (key: string) => void
  setRole: (r: Role | null) => void
  setPayer: (p: Payer | null) => void
  setTeam: (t: Team | null) => void
  setQuery: (q: string) => void
  setFacet: (group: string, value: string | null) => void
  setView: (i: number) => void
  setLocation: (l: string) => void
  reset: () => void
  activeCount: number
}
const C = createContext<Ctx | null>(null)

function compareFor(range: Range, key: string): Range | null {
  if (key === 'none') return null
  if (key === 'prevq') return { from: PREV_QUARTER.start, to: PREV_QUARTER.end, label: PREV_QUARTER.label }
  const days = Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
  return { from: addDays(range.from, -days), to: addDays(range.from, -1), label: `${days} Tage davor` }
}

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<Range>(() => PRESETS[1].make())
  const [location, setLocation] = useState<string>('alle')
  const [compare, setCompareKey] = useState('prev')
  const [role, setRole] = useState<Role | null>(null)
  const [payer, setPayer] = useState<Payer | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [query, setQuery] = useState('')
  const [facets, setFacets] = useState<Record<string, string | null>>({})
  const [view, setView] = useState(0)
  const value = useMemo<Ctx>(() => {
    const compareRange = compareFor(range, compare)
    const activeCount = (role ? 1 : 0) + (payer ? 1 : 0) + (team ? 1 : 0) + Object.values(facets).filter(Boolean).length
    return {
      range, compare, compareRange, role, payer, team, query, facets, view, location, activeCount,
      setPreset: (key) => { const p = PRESETS.find((x) => x.key === key); if (p) setRange(p.make()) },
      setCustom: (from, to) => { if (from <= to) setRange({ from, to, label: 'Benutzerdefiniert' }) },
      setCompare: setCompareKey, setRole, setPayer, setTeam, setQuery, setView, setLocation,
      setFacet: (group, v) => setFacets((f) => ({ ...f, [group]: v })),
      reset: () => { setRole(null); setPayer(null); setTeam(null); setFacets({}); setQuery('') },
    }
  }, [range, compare, role, payer, team, query, facets, view, location])
  return <C.Provider value={value}>{children}</C.Provider>
}
export function useFilters() {
  const c = useContext(C)
  if (!c) throw new Error('FiltersProvider fehlt')
  return c
}
export const inRange = (dateIso: string, r: Range) => { const d = new Date(dateIso); return d >= new Date(r.from.toISOString().slice(0, 10)) && d <= new Date(r.to.toISOString().slice(0, 10)) }
