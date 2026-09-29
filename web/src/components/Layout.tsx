import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, type ComponentType } from 'react'
import {
  Activity, Phone, Mic, Users, ClipboardList, TrendingUp, Mail, ShieldCheck, Settings, LogOut, Sun, Moon, CalendarClock,
  Wind, Share2, Pill, ClipboardCheck, Smile, UserCircle, Search, ChevronDown, ChevronsLeft, ChevronsRight, Upload, Download, Bell,
  LayoutGrid, Table2, BarChart3, Clock, List, SlidersHorizontal,
} from 'lucide-react'
import { useAuth, isLeader } from '../state/auth'
import { useConfig } from '../state/config'
import { useFilters } from '../state/filters'
import { useAssistant } from '../state/assistant'
import Assistant from './Assistant'
import { PeriodPicker, Choice, ROLE_OPTS, PAYER_OPTS, TEAM_OPTS } from './Period'
import { searchAll } from '../data/search'
import { Sparkles } from 'lucide-react'
import { DATA_AS_OF, PRACTICE, QUARTER } from '../data/mock'
import { fmt } from '../lib/format'
import { Avatar } from './ui'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

// Modulleiste (Gotham: Home · Browser · Graph · Map · … · Metrics)
const MODULES: { to: string; label: string; icon: Icon; leader: boolean; module?: string }[] = [
  { to: '/station', label: 'Station', icon: Activity, leader: true },
  { to: '/start', label: 'Start', icon: UserCircle, leader: true },
  { to: '/finanzen', label: 'Finanzen', icon: TrendingUp, leader: true },
  { to: '/prognose', label: 'Prognose', icon: TrendingUp, leader: true },
  { to: '/team', label: 'Personal', icon: Users, leader: true },
  { to: '/tarife', label: 'Tarife', icon: ClipboardList, leader: true, module: 'billing' },
  { to: '/landschaft', label: 'Landschaft', icon: Share2, leader: true },
  { to: '/termine', label: 'Termine', icon: CalendarClock, leader: true, module: 'capacity' },
  { to: '/zuweiser', label: 'Zuweiser', icon: Share2, leader: true, module: 'zuweiser' },
  { to: '/verordnungen', label: 'Verordnung', icon: Pill, leader: true, module: 'verordnung' },
  { to: '/zufriedenheit', label: 'NPS', icon: Smile, leader: true, module: 'nps' },
  { to: '/qm', label: 'QM', icon: ClipboardCheck, leader: true, module: 'qm' },
  { to: '/ordicall', label: 'Ordicall', icon: Phone, leader: true, module: 'ordicall' },
  { to: '/diktara', label: 'Diktara', icon: Mic, leader: true, module: 'diktara' },
  { to: '/tailwind', label: 'Tailwind', icon: Wind, leader: true, module: 'tailwind' },
  { to: '/hr', label: 'HR', icon: Users, leader: true, module: 'tailwind' },
  { to: '/digest', label: 'Digest', icon: Mail, leader: true },
  { to: '/mein-score', label: 'Mein Score', icon: UserCircle, leader: false, module: 'selfservice' },
  { to: '/sicherheit', label: 'Sicherheit', icon: ShieldCheck, leader: true },
  { to: '/einstellungen', label: 'Admin', icon: Settings, leader: true },
]

// Seiten-Chrome: Titel, Ansichts-Tabs, Facetten (Gotham: Types / Properties mit Balken)
interface Facet { title: string; rows: { label: string; count: number }[]; sortable?: boolean }
interface Chrome { title: string; tabs: { label: string; icon: Icon }[]; facets: { group: string; facets: Facet[] }[] }

const STATION_FACETS: Chrome['facets'] = [
  { group: 'Typen', facets: [{ title: '', rows: [{ label: 'Patientenkontakte', count: 5421 }, { label: 'Leistungen', count: 16784 }, { label: 'Anrufe', count: 2875 }, { label: 'Diktate', count: 1775 }, { label: 'Honorarnoten', count: 420 }] }] },
  { group: 'Eigenschaften', facets: [
    { title: 'Rolle', rows: [{ label: 'Ärzt:in', count: 4 }, { label: 'Ordinationsassistenz', count: 4 }, { label: 'DGKP', count: 2 }, { label: 'Management', count: 1 }] },
    { title: 'Kostenträger', rows: [{ label: 'ÖGK', count: 2751 }, { label: 'SVS', count: 428 }, { label: 'BVAEB', count: 349 }, { label: 'Privat / Wahlarzt', count: 352 }] },
    { title: 'Leistungsgruppe', sortable: true, rows: [{ label: 'Grundleistung', count: 7731 }, { label: 'Einzelleistung', count: 3985 }, { label: 'Labor', count: 3114 }, { label: 'Telemedizin', count: 794 }, { label: 'Vorsorge', count: 344 }] },
    { title: 'Terminart', rows: [{ label: 'Akut', count: 1980 }, { label: 'Kontrolle', count: 1420 }, { label: 'Blutabnahme', count: 980 }, { label: 'Video', count: 340 }, { label: 'Vorsorge (VU)', count: 210 }] },
    { title: 'Datum', rows: [{ label: 'August 2026', count: 2019 }, { label: 'Juli 2026', count: 2340 }, { label: 'Juni 2026', count: 2190 }] },
    { title: 'Standort', rows: [{ label: 'Ordination Donaufeld', count: 5421 }] },
  ] },
]
const CHROME: Record<string, Chrome> = {
  '/station': { title: 'Tycho Station', tabs: [{ label: 'Übersicht', icon: LayoutGrid }, { label: 'Tabelle', icon: Table2 }, { label: 'Charts', icon: BarChart3 }, { label: 'Zeitachse', icon: Clock }], facets: STATION_FACETS },
  '/prognose': { title: 'Prognose', tabs: [{ label: 'Charts', icon: BarChart3 }, { label: 'Tabelle', icon: Table2 }], facets: STATION_FACETS.slice(1) },
  '/team': { title: 'Personal & Effizienz', tabs: [{ label: 'Übersicht', icon: LayoutGrid }, { label: 'Tabelle', icon: Table2 }], facets: [{ group: 'Typen', facets: [{ title: '', rows: [{ label: 'Ärzt:in', count: 4 }, { label: 'Ordinationsassistenz', count: 4 }, { label: 'DGKP', count: 2 }, { label: 'Management', count: 1 }] }] }, { group: 'Eigenschaften', facets: [{ title: 'Zustimmung', rows: [{ label: 'erteilt', count: 10 }, { label: 'nur aggregiert', count: 1 }] }, { title: 'FTE', rows: [{ label: '100 %', count: 7 }, { label: '< 100 %', count: 4 }] }, { title: 'AD-Gruppe', rows: [{ label: 'G_Aerzte', count: 4 }, { label: 'G_Empfang', count: 4 }, { label: 'G_Pflege', count: 2 }, { label: 'G_Diktara', count: 4 }] }] }] },
  '/tarife': { title: 'Tarife & Abrechnung', tabs: [{ label: 'Übersicht', icon: LayoutGrid }, { label: 'Positionen', icon: Table2 }, { label: 'Findings', icon: List }], facets: STATION_FACETS.slice(1) },
  '/termine': { title: 'Termine & Kapazität', tabs: [{ label: 'Charts', icon: BarChart3 }, { label: 'Heatmap', icon: LayoutGrid }], facets: STATION_FACETS.slice(1) },
  '/tailwind': { title: 'Tailwind Station', tabs: [{ label: 'Inkasso', icon: List }, { label: 'HR', icon: Users }], facets: [{ group: 'Typen', facets: [{ title: '', rows: [{ label: 'Honorarnoten', count: 420 }, { label: 'Mitarbeiter:innen', count: 11 }] }] }, { group: 'Eigenschaften', facets: [{ title: 'Status', rows: [{ label: 'bezahlt', count: 295 }, { label: 'überfällig', count: 63 }, { label: 'offen', count: 12 }, { label: 'Ratenzahlung', count: 9 }] }, { title: 'Leistungsart', rows: [{ label: 'Physiotherapie', count: 118 }, { label: 'Impfung', count: 92 }, { label: 'TCM / Akupunktur', count: 71 }, { label: 'Wahlarzt-Ordination', count: 67 }] }] }] },
}
const DEFAULT_CHROME: Chrome = { title: '', tabs: [{ label: 'Übersicht', icon: LayoutGrid }], facets: STATION_FACETS.slice(1, 2) }

const FACET_MAP: Record<string, { key: 'role' | 'payer' | 'team'; map: Record<string, string> }> = {
  Rolle: { key: 'role', map: { 'Ärzt:in': 'arzt', Ordinationsassistenz: 'assistenz', DGKP: 'dgkp', Management: 'management' } },
  Kostenträger: { key: 'payer', map: { 'ÖGK': 'ÖGK', SVS: 'SVS', BVAEB: 'BVAEB', 'Privat / Wahlarzt': 'Privat' } },
}
function FacetPanel({ facets, onCollapse }: { facets: Chrome['facets']; onCollapse: () => void }) {
  const f = useFilters()
  const active = (() => { const out: string[] = []; if (f.role) out.push(`Rolle:${Object.entries(FACET_MAP.Rolle.map).find(([, v]) => v === f.role)?.[0]}`); if (f.payer) out.push(`Kostenträger:${Object.entries(FACET_MAP.Kostenträger.map).find(([, v]) => v === f.payer)?.[0]}`); for (const [g, v] of Object.entries(f.facets)) if (v) out.push(`${g}:${v}`); return out })()
  const setActive = (key: string | null, group: string, label: string) => {
    const m = FACET_MAP[group]
    if (m) { const v = key ? (m.map[label] as never) : null; if (m.key === 'role') f.setRole(v); else if (m.key === 'payer') f.setPayer(v) }
    else f.setFacet(group, key ? label : null)
  }
  return (
    <aside className="w-60 shrink-0 bg-bar-1 border-r border-line-1 overflow-y-auto">
      <div className="flex items-center justify-end px-2 pt-2"><button onClick={onCollapse} className="text-ink-3 hover:text-ink-1 p-1" title="Facetten einklappen"><ChevronsLeft size={14} /></button></div>
      {facets.map((g) => (
        <div key={g.group} className="px-3 pb-3">
          <div className="label mb-1.5">{g.group}</div>
          {g.facets.map((f) => {
            const max = Math.max(...f.rows.map((r) => r.count))
            return (
              <div key={f.title || g.group} className="mb-3">
                {f.title && <div className="flex justify-between items-center text-[11px] text-ink-3 mb-1"><span>{f.title}</span>{f.sortable && <span className="underline decoration-dotted cursor-pointer">Sort</span>}</div>}
                {f.rows.map((r) => {
                  const key = `${f.title}:${r.label}`
                  const on = active.includes(key)
                  return (
                    <button key={r.label} onClick={() => setActive(on ? null : key, f.title, r.label)} className={`w-full grid grid-cols-[1fr_auto_64px] items-center gap-2 py-[3px] px-1 -mx-1 text-left rounded ${on ? 'bg-surface-2 text-ink-1' : 'text-ink-2 hover:bg-surface-2'}`}>
                      <span className="truncate text-[12px]">{r.label}</span>
                      <span className="tabular text-[11px] text-ink-3">{fmt.num(r.count)}</span>
                      <span className="h-2 bg-black/20 rounded-sm overflow-hidden"><span className="block h-full" style={{ width: `${Math.max(3, (r.count / max) * 100)}%`, background: on ? 'var(--ink-1)' : 'var(--bp-g1)' }} /></span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      ))}
    </aside>
  )
}

export default function Layout() {
  const { session, logout, theme, toggleTheme } = useAuth()
  const { config } = useConfig()
  const nav = useNavigate()
  const loc = useLocation()
  const [facetsOpen, setFacetsOpen] = useState(true)
  const [tab, setTab] = useState(0)
  const filters = useFilters()
  const assistant = useAssistant()
  const [q, setQ] = useState('')
  const results = q.length >= 2 ? searchAll(q).slice(0, 8) : []
  const leader = session ? isLeader(session.user) : false
  const items = MODULES.filter((n) => (leader || !n.leader) && (!n.module || (config?.modules?.[n.module] ?? true)))
  const base = '/' + loc.pathname.split('/')[1]
  const chrome = CHROME[base] ?? DEFAULT_CHROME
  const dayOfQ = Math.round((DATA_AS_OF.getTime() - QUARTER.start.getTime()) / 86400000) + 1
  const showFacets = leader && chrome.facets.length > 0

  return (
    <div className="h-full flex flex-col bg-surface-0">
      {/* Modulleiste */}
      <header className="h-14 shrink-0 bg-bar-0 flex items-center px-2 gap-1 border-b border-line-1">
        <div className="flex items-center pl-3 pr-4 mr-1 border-r border-line-1 h-9"><span className="font-medium tracking-tight text-[15px] text-ink-1">Tycho</span></div>
        <nav className="flex items-stretch gap-0.5 overflow-x-auto">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setTab(0)}
              className={({ isActive }) => `flex flex-col items-center justify-center w-[58px] h-11 rounded ${isActive ? 'text-ink-1 bg-surface-2' : 'text-ink-3 hover:text-ink-1 hover:bg-surface-2'}`}>
              <n.icon size={17} strokeWidth={1.7} />
              <span className="text-[9.5px] mt-1 leading-none whitespace-nowrap">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 pr-1">
          <div className="hidden xl:flex items-center gap-0.5 pr-2 mr-1 border-r border-line-1">
            <button title="Digest öffnen" onClick={() => nav('/digest')} className="p-1.5 text-ink-3 hover:text-ink-1 hover:bg-surface-2 rounded"><Upload size={15} /></button>
            <button title="Einstellungen" onClick={() => nav('/einstellungen')} className="p-1.5 text-ink-3 hover:text-ink-1 hover:bg-surface-2 rounded"><SlidersHorizontal size={15} /></button>
            <button title="Export CSV (aktuelle Ansicht)" onClick={() => window.dispatchEvent(new CustomEvent('tycho:export'))} className="p-1.5 text-ink-3 hover:text-ink-1 hover:bg-surface-2 rounded"><Download size={15} /></button>
          </div>
          <div className="hidden md:flex items-center relative">
            <input id="global-search" value={q} onChange={(e) => setQ(e.target.value)} className="bp-input w-56 lg:w-72 rounded-r-none" placeholder="Suche: Person, Position, Honorarnote…" />
            <button className="bp-btn rounded-l-none border-l-0 px-2" onClick={() => setQ('')}><ChevronDown size={14} /></button>
            <button className="bp-btn ml-1 px-2.5"><Search size={14} /></button>
            {results.length > 0 && <div className="absolute right-0 top-9 w-[380px] card p-1.5 z-50 text-[12.5px]">{results.map((r) => <button key={r.to + r.title} onClick={() => { nav(r.to); setQ('') }} className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-2"><div className="flex justify-between"><span className="text-ink-1">{r.title}</span><span className="label">{r.kind}</span></div><div className="text-[11px] text-ink-3 truncate">{r.sub}</div></button>)}</div>}
          </div>
          <button onClick={() => assistant.setOpen(!assistant.open)} className={`p-1.5 rounded ${assistant.open ? 'text-ink-1 bg-surface-3' : 'text-ink-3 hover:text-ink-1'}`} title="Assistent"><Sparkles size={16} /></button>
          <button onClick={toggleTheme} className="p-1.5 text-ink-3 hover:text-ink-1 rounded" title="Design wechseln">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
          {session && (
            <div className="flex items-center gap-1.5 pl-2">
              <span className="relative"><Avatar name={session.user.name} hue={session.user.avatarHue} size={26} /><span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-status-critical text-[8px] text-white flex items-center justify-center"><Bell size={8} /></span></span>
              <button onClick={() => { logout(); nav('/login') }} className="p-1.5 text-ink-3 hover:text-ink-1 rounded" title="Abmelden"><LogOut size={15} /></button>
            </div>
          )}
        </div>
      </header>

      {/* Sub-Header: Titel · Ansichts-Tabs · Filter · Zeitraum */}
      <div className="h-11 shrink-0 bg-bar-1 flex items-center px-4 gap-4 border-b border-line-1">
        <div className="text-[17px] font-bold text-ink-1 tracking-tight whitespace-nowrap">{chrome.title || PRACTICE.name}</div>
        <div className="flex items-center gap-1 ml-2">
          {chrome.tabs.map((t, i) => (
            <button key={t.label} onClick={() => { setTab(i); filters.setView(i) }} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12.5px] ${tab === i ? 'bg-surface-2 text-ink-1 font-semibold' : 'text-ink-2 hover:text-ink-1'}`}><t.icon size={14} /> {t.label}</button>
          ))}
        </div>
        <div className="ml-auto hidden lg:flex items-center gap-3 text-[12px] text-ink-2">
          <Choice label="Rolle" value={filters.role} options={[...ROLE_OPTS]} onChange={filters.setRole} />
          <Choice label="Kostenträger" value={filters.payer} options={[...PAYER_OPTS]} onChange={filters.setPayer} />
          <Choice label="Team" value={filters.team} options={[...TEAM_OPTS]} onChange={filters.setTeam} />
          {filters.activeCount > 0 && <button onClick={filters.reset} className="text-accent">Zurücksetzen</button>}
          <span className="h-5 w-px bg-surface-3" />
          <PeriodPicker compact />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {showFacets && (facetsOpen ? <FacetPanel facets={chrome.facets} onCollapse={() => setFacetsOpen(false)} /> : (
          <button onClick={() => setFacetsOpen(true)} className="w-7 shrink-0 bg-bar-1 border-r border-line-1 text-ink-3 hover:text-ink-1 flex items-start justify-center pt-2" title="Facetten ausklappen"><ChevronsRight size={14} /></button>
        ))}
        <main className="flex-1 min-w-0 overflow-y-auto plane">
          <div className="px-5 py-4">
            <Outlet />
          </div>
          <Assistant variant="drawer" />
          <div className="px-5 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-ink-3">
            <span>Datenstand {fmt.date(DATA_AS_OF)} {fmt.time(DATA_AS_OF)}</span><span>{QUARTER.label} · Tag {dayOfQ}/{QUARTER.days}</span><span>Read-only · 0 Schreibvorgänge</span><span>AES-256-GCM · TPM</span>
            {config && <span>Modus: {config.analysisMode === 'person' ? 'Pro Person (NDA)' : 'Team-basiert'}</span>}<span>{PRACTICE.server}</span>
          </div>
        </main>
      </div>
    </div>
  )
}
