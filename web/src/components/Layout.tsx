import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, type ComponentType } from 'react'
import {
  Activity, Phone, Mic, Users, ClipboardList, TrendingUp, Mail, ShieldCheck, Settings, LogOut, Sun, Moon, CalendarClock,
  Wind, Share2, Pill, ClipboardCheck, Smile, UserCircle, Search, ChevronDown, ChevronsLeft, ChevronsRight, Plus, Upload, Download, Bell,
  LayoutGrid, Table2, BarChart3, Clock, List, SlidersHorizontal,
} from 'lucide-react'
import { useAuth, isLeader } from '../state/auth'
import { useConfig } from '../state/config'
import { DATA_AS_OF, PRACTICE, QUARTER } from '../data/mock'
import { fmt } from '../lib/format'
import { Avatar } from './ui'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

// Modulleiste (Gotham: Home · Browser · Graph · Map · … · Metrics)
const MODULES: { to: string; label: string; icon: Icon; leader: boolean; module?: string }[] = [
  { to: '/station', label: 'Station', icon: Activity, leader: true },
  { to: '/prognose', label: 'Prognose', icon: TrendingUp, leader: true },
  { to: '/team', label: 'Personal', icon: Users, leader: true },
  { to: '/leistungen', label: 'Abrechnung', icon: ClipboardList, leader: true, module: 'billing' },
  { to: '/termine', label: 'Termine', icon: CalendarClock, leader: true, module: 'capacity' },
  { to: '/zuweiser', label: 'Zuweiser', icon: Share2, leader: true, module: 'zuweiser' },
  { to: '/verordnungen', label: 'Verordnung', icon: Pill, leader: true, module: 'verordnung' },
  { to: '/zufriedenheit', label: 'NPS', icon: Smile, leader: true, module: 'nps' },
  { to: '/qm', label: 'QM', icon: ClipboardCheck, leader: true, module: 'qm' },
  { to: '/ordicall', label: 'Ordicall', icon: Phone, leader: true, module: 'ordicall' },
  { to: '/diktara', label: 'Diktara', icon: Mic, leader: true, module: 'diktara' },
  { to: '/tailwind', label: 'Tailwind', icon: Wind, leader: true, module: 'tailwind' },
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
  '/leistungen': { title: 'Leistungen & Abrechnung', tabs: [{ label: 'Übersicht', icon: LayoutGrid }, { label: 'Positionen', icon: Table2 }, { label: 'Findings', icon: List }], facets: STATION_FACETS.slice(1) },
  '/termine': { title: 'Termine & Kapazität', tabs: [{ label: 'Charts', icon: BarChart3 }, { label: 'Heatmap', icon: LayoutGrid }], facets: STATION_FACETS.slice(1) },
  '/tailwind': { title: 'Tailwind Station', tabs: [{ label: 'Inkasso', icon: List }, { label: 'HR', icon: Users }], facets: [{ group: 'Typen', facets: [{ title: '', rows: [{ label: 'Honorarnoten', count: 420 }, { label: 'Mitarbeiter:innen', count: 11 }] }] }, { group: 'Eigenschaften', facets: [{ title: 'Status', rows: [{ label: 'bezahlt', count: 295 }, { label: 'überfällig', count: 63 }, { label: 'offen', count: 12 }, { label: 'Ratenzahlung', count: 9 }] }, { title: 'Leistungsart', rows: [{ label: 'Physiotherapie', count: 118 }, { label: 'Impfung', count: 92 }, { label: 'TCM / Akupunktur', count: 71 }, { label: 'Wahlarzt-Ordination', count: 67 }] }] }] },
}
const DEFAULT_CHROME: Chrome = { title: '', tabs: [{ label: 'Übersicht', icon: LayoutGrid }], facets: STATION_FACETS.slice(1, 2) }

function FacetPanel({ facets, onCollapse }: { facets: Chrome['facets']; onCollapse: () => void }) {
  const [active, setActive] = useState<string | null>(null)
  return (
    <aside className="w-60 shrink-0 bg-bar-1 border-r border-black/20 overflow-y-auto">
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
                  const on = active === key
                  return (
                    <button key={r.label} onClick={() => setActive(on ? null : key)} className={`w-full grid grid-cols-[1fr_auto_64px] items-center gap-2 py-[3px] px-1 -mx-1 text-left rounded ${on ? 'bg-surface-2 text-ink-1' : 'text-ink-2 hover:bg-white/5'}`}>
                      <span className="truncate text-[12px]">{r.label}</span>
                      <span className="tabular text-[11px] text-ink-3">{fmt.num(r.count)}</span>
                      <span className="h-2 bg-black/20 rounded-sm overflow-hidden"><span className="block h-full" style={{ width: `${Math.max(3, (r.count / max) * 100)}%`, background: on ? 'var(--accent)' : 'var(--bp-g1)' }} /></span>
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

export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" className="shrink-0" aria-hidden>
      <circle cx="13" cy="13" r="6.5" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
      <path d="M13 3v5M13 18v5M3 13h5M18 13h5" stroke="var(--accent)" strokeWidth="1.4" />
      <circle cx="13" cy="13" r="1.8" fill="var(--accent)" />
    </svg>
  )
}

export default function Layout() {
  const { session, logout, theme, toggleTheme } = useAuth()
  const { config } = useConfig()
  const nav = useNavigate()
  const loc = useLocation()
  const [facetsOpen, setFacetsOpen] = useState(true)
  const [tab, setTab] = useState(0)
  const leader = session ? isLeader(session.user) : false
  const items = MODULES.filter((n) => (leader || !n.leader) && (!n.module || (config?.modules?.[n.module] ?? true)))
  const base = '/' + loc.pathname.split('/')[1]
  const chrome = CHROME[base] ?? DEFAULT_CHROME
  const dayOfQ = Math.round((DATA_AS_OF.getTime() - QUARTER.start.getTime()) / 86400000) + 1
  const showFacets = leader && chrome.facets.length > 0

  return (
    <div className="h-full flex flex-col bg-surface-0">
      {/* Modulleiste */}
      <header className="h-14 shrink-0 bg-bar-0 flex items-center px-2 gap-1 border-b border-black/30">
        <div className="flex items-center gap-2 pl-2 pr-3 mr-1 border-r border-white/10 h-9"><Mark size={22} /><span className="font-semibold tracking-[0.18em] text-[12px] text-ink-1">TYCHO</span></div>
        <nav className="flex items-stretch gap-0.5 overflow-x-auto">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setTab(0)}
              className={({ isActive }) => `flex flex-col items-center justify-center w-[58px] h-11 rounded ${isActive ? 'text-accent' : 'text-ink-3 hover:text-ink-1 hover:bg-white/5'}`}>
              <n.icon size={17} strokeWidth={1.7} />
              <span className="text-[9.5px] mt-1 leading-none whitespace-nowrap">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 pr-1">
          <div className="hidden xl:flex items-center gap-0.5 pr-2 mr-1 border-r border-white/10">
            {[Plus, Upload, SlidersHorizontal].map((I, i) => <button key={i} className="p-1.5 text-ink-3 hover:text-ink-1 hover:bg-white/5 rounded"><I size={15} /></button>)}
          </div>
          <div className="hidden xl:flex items-center gap-0.5 pr-2 mr-1 border-r border-white/10">
            {[Download, Upload].map((I, i) => <button key={i} className="p-1.5 text-ink-3 hover:text-ink-1 hover:bg-white/5 rounded"><I size={15} className={i === 1 ? 'rotate-180' : ''} /></button>)}
          </div>
          <div className="hidden md:flex items-center">
            <input className="bp-input w-56 lg:w-72 rounded-r-none" placeholder="Suche: Person, Position, Honorarnote…" />
            <button className="bp-btn rounded-l-none border-l-0 px-2"><ChevronDown size={14} /></button>
            <button className="bp-btn ml-1 px-2.5"><Search size={14} /></button>
          </div>
          <button className="p-1.5 text-ink-3 hover:text-ink-1 rounded"><List size={16} /></button>
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
      <div className="h-11 shrink-0 bg-bar-1 flex items-center px-4 gap-4 border-b border-black/20">
        <div className="text-[17px] font-bold text-ink-1 tracking-tight whitespace-nowrap">{chrome.title || PRACTICE.name}</div>
        <div className="flex items-center gap-1 ml-2">
          {chrome.tabs.map((t, i) => (
            <button key={t.label} onClick={() => setTab(i)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12.5px] ${tab === i ? 'bg-surface-2 text-ink-1 font-semibold' : 'text-ink-2 hover:text-ink-1'}`}><t.icon size={14} /> {t.label}</button>
          ))}
        </div>
        <div className="ml-auto hidden lg:flex items-center gap-3 text-[12px] text-ink-2">
          {[['Rolle', 'Alle'], ['Kostenträger', 'Alle'], ['Team', 'Alle']].map(([k, v]) => (
            <button key={k} className="inline-flex items-center gap-1 hover:text-ink-1">{k}: <span className="text-ink-1 font-semibold">{v}</span> <ChevronDown size={12} /></button>
          ))}
          <span className="h-5 w-px bg-white/10" />
          <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-ink-3" /><input className="bp-input w-[92px] py-[3px] text-center tabular" defaultValue={QUARTER.start.toISOString().slice(0, 10)} readOnly /><input className="bp-input w-[92px] py-[3px] text-center tabular" defaultValue={DATA_AS_OF.toISOString().slice(0, 10)} readOnly /></span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {showFacets && (facetsOpen ? <FacetPanel facets={chrome.facets} onCollapse={() => setFacetsOpen(false)} /> : (
          <button onClick={() => setFacetsOpen(true)} className="w-7 shrink-0 bg-bar-1 border-r border-black/20 text-ink-3 hover:text-ink-1 flex items-start justify-center pt-2" title="Facetten ausklappen"><ChevronsRight size={14} /></button>
        ))}
        <main className="flex-1 min-w-0 overflow-y-auto plane">
          <div className="px-5 py-4">
            <Outlet />
          </div>
          <div className="px-5 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-ink-3">
            <span>Datenstand {fmt.date(DATA_AS_OF)} {fmt.time(DATA_AS_OF)}</span><span>{QUARTER.label} · Tag {dayOfQ}/{QUARTER.days}</span><span>Read-only · 0 Schreibvorgänge</span><span>AES-256-GCM · TPM</span>
            {config && <span>Modus: {config.analysisMode === 'person' ? 'Pro Person (NDA)' : 'Team-basiert'}</span>}<span>{PRACTICE.server}</span>
          </div>
        </main>
      </div>
    </div>
  )
}
