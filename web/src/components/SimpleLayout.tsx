import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Sun, Moon, LogOut, Sparkles, Search, PanelLeft, ChevronsUpDown, X, ChevronRight } from 'lucide-react'
import { useAuth, isLeader } from '../state/auth'
import { useConfig } from '../state/config'
import { useFilters } from '../state/filters'
import { useAssistant } from '../state/assistant'
import { PRACTICE, DATA_AS_OF } from '../data/mock'
import { Avatar } from './ui'
import Assistant from './Assistant'
import { PeriodPicker, LocationPicker } from './Period'
import { searchAll } from '../data/search'
import { fmt } from '../lib/format'
import { visibleNav, SETTINGS, groupOf, itemOf, type NavGroup } from '../nav'

/*
 * Simple-Oberfläche nach Apple HIG (macOS/iPadOS):
 *  – Seitenleiste mit 5 Bereichen (2 Ebenen), alle Seiten sichtbar, kein „Mehr“
 *  – Toolbar: Ort in der Hierarchie, Suche, Standort, Zeitraum, Assistent (Aktionen, keine Navigation)
 *  – Seitenleiste ein-/ausblendbar (Rail mit Symbolen), nie standardmäßig versteckt
 */

function Sidebar({ groups, collapsed, onToggle, onNavigate, leader }: { groups: NavGroup[]; collapsed: boolean; onToggle: () => void; onNavigate?: () => void; leader: boolean }) {
  const { session, logout, theme, toggleTheme } = useAuth()
  const nav = useNavigate()
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  const link = (to: string, label: string, Icon: NavGroup['items'][number]['icon'], hint?: string) => (
    <NavLink key={to} to={to} onClick={onNavigate} title={collapsed ? (hint ?? label) : hint}
      className={({ isActive }) => `flex items-center gap-2.5 h-8 rounded-lg text-[13px] transition-colors ${collapsed ? 'justify-center px-0' : 'px-2'} ${isActive ? 'bg-accent/10 text-accent font-medium' : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1'}`}>
      <Icon size={16} strokeWidth={1.8} className="shrink-0" />{!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
  return (
    <div className="h-full flex flex-col">
      <div className={`h-14 flex items-center shrink-0 ${collapsed ? 'justify-center' : 'px-4 gap-2'}`}>
        <span className="font-semibold text-[15px] tracking-tight">{collapsed ? 'T' : 'Tycho'}</span>
        {!collapsed && <span className="text-[11.5px] text-ink-3 truncate" title={PRACTICE.name}>{PRACTICE.name}</span>}
        {!collapsed && <button onClick={onToggle} className="ml-auto p-1 rounded-md text-ink-3 hover:text-ink-1 hover:bg-surface-2 hidden lg:block" title="Seitenleiste einklappen"><PanelLeft size={15} /></button>}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
        {groups.map((g) => (
          <div key={g.key}>
            {collapsed ? <div className="mx-2 mb-1.5 h-px bg-line-1" /> : <div className="px-2 pt-1 pb-1 text-[11px] font-semibold text-ink-3">{g.label}</div>}
            <div className="space-y-0.5">{g.items.map((i) => link(i.to, i.label, i.icon, i.hint))}</div>
          </div>
        ))}
      </nav>
      <div className="p-2 border-t border-line-1 space-y-0.5 shrink-0">
        {leader && link(SETTINGS.to, SETTINGS.label, SETTINGS.icon)}
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenu((o) => !o)} className={`w-full flex items-center gap-2 h-11 rounded-lg hover:bg-surface-2 ${collapsed ? 'justify-center' : 'px-2'}`}>
            {session && <Avatar name={session.user.name} hue={session.user.avatarHue} size={28} />}
            {!collapsed && session && <span className="min-w-0 text-left"><span className="block text-[13px] leading-tight truncate">{session.user.name}</span><span className="block text-[11px] text-ink-3 leading-tight truncate">{session.user.title}</span></span>}
            {!collapsed && <ChevronsUpDown size={14} className="ml-auto text-ink-3 shrink-0" />}
          </button>
          {menu && session && (
            <div className="absolute bottom-12 left-0 w-[240px] card p-1.5 z-50 text-[13px]">
              <div className="px-2 py-1.5"><div className="font-medium">{session.user.name}</div><div className="text-[11.5px] text-ink-3">{session.user.upn}</div></div>
              <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2">{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} {theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}</button>
              <button onClick={() => { logout(); nav('/login') }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2"><LogOut size={14} /> Abmelden</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SimpleLayout() {
  const { session } = useAuth()
  const { config } = useConfig()
  const f = useFilters()
  const a = useAssistant()
  const nav = useNavigate()
  const loc = useLocation()
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('tycho.sidebar') === 'collapsed' } catch { return false } })
  const [drawer, setDrawer] = useState(false)
  const [q, setQ] = useState('')
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem('tycho.sidebar', c ? 'open' : 'collapsed') } catch { /* ignore */ } return !c })
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === '/' && !(e.target as HTMLElement).closest('input,textarea')) { e.preventDefault(); document.getElementById('global-search')?.focus() } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [])
  useEffect(() => { setDrawer(false) }, [loc.pathname])
  const leader = session ? isLeader(session.user) : false
  const groups = visibleNav(leader, config?.modules)
  const group = groupOf(loc.pathname)
  const item = itemOf(loc.pathname)
  const crumb = loc.pathname.startsWith('/team/') ? 'Person' : item?.label ?? (loc.pathname === SETTINGS.to ? SETTINGS.label : '')
  const results = q.length >= 2 ? searchAll(q).slice(0, 8) : []

  return (
    <div className="min-h-full flex bg-surface-0">
      <aside className={`hidden lg:block sticky top-0 h-screen shrink-0 border-r border-line-1 bg-bar-0 transition-[width] duration-200 ${collapsed ? 'w-[64px]' : 'w-[236px]'}`}>
        <Sidebar groups={groups} collapsed={collapsed} onToggle={toggle} leader={leader} />
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 h-full w-[260px] bg-bar-0 border-r border-line-1 shadow-xl rise">
            <button onClick={() => setDrawer(false)} className="absolute right-2 top-4 p-1 text-ink-3 hover:text-ink-1"><X size={16} /></button>
            <Sidebar groups={groups} collapsed={false} onToggle={() => setDrawer(false)} onNavigate={() => setDrawer(false)} leader={leader} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-bar-0/90 backdrop-blur border-b border-line-1 h-14 flex items-center px-4 gap-2">
          <button onClick={() => (window.innerWidth < 1024 ? setDrawer(true) : toggle())} className={`p-1.5 rounded-lg text-ink-3 hover:text-ink-1 hover:bg-surface-2 ${collapsed ? '' : 'lg:hidden'}`} title="Seitenleiste ein-/ausblenden"><PanelLeft size={17} /></button>
          <div className="flex items-center gap-1 min-w-0 text-[13px]">
            {group && group.label !== crumb && <><span className="text-ink-3 hidden sm:inline">{group.label}</span><ChevronRight size={13} className="text-ink-3 hidden sm:inline" /></>}
            <span className="font-medium text-ink-1 truncate">{crumb}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {leader && (
              <div className="relative hidden xl:block">
                <label className="bp-input flex items-center gap-2 w-[200px] py-1.5"><Search size={14} className="text-ink-3" /><input id="global-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen … ( / )" className="bg-transparent outline-none flex-1 text-[13px]" /></label>
                {results.length > 0 && <div className="absolute right-0 mt-1 w-[360px] card p-1.5 z-50 text-[13px]">{results.map((r) => <button key={r.to + r.title} onClick={() => { nav(r.to); setQ('') }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-2"><div className="flex justify-between"><span className="text-ink-1">{r.title}</span><span className="label">{r.kind}</span></div><div className="text-[11.5px] text-ink-3 truncate">{r.sub}</div></button>)}</div>}
              </div>
            )}
            {leader && <><span className="hidden xl:block"><LocationPicker /></span><PeriodPicker /></>}
            <button onClick={() => a.setOpen(!a.open)} className={`bp-btn ${a.open ? 'active' : ''}`} title="Assistent"><Sparkles size={14} /><span className="hidden md:inline">Assistent</span></button>
          </div>
        </header>
        {f.activeCount > 0 && (
          <div className="px-4 pt-3 flex items-center gap-2 text-[12.5px] text-ink-2 max-w-[1600px] w-full">
            <span>Filter:</span>{f.role && <span className="bp-btn py-0.5">{f.role}</span>}{f.payer && <span className="bp-btn py-0.5">{f.payer}</span>}{f.team && <span className="bp-btn py-0.5">{f.team}</span>}
            <button onClick={f.reset} className="text-accent">Zurücksetzen</button>
          </div>
        )}
        <div className="flex-1 max-w-[1600px] w-full px-4 py-4 flex gap-4 items-start">
          <main className="flex-1 min-w-0"><div key={loc.pathname} className="page-enter"><Outlet /></div></main>
          <Assistant variant="panel" />
        </div>
        <footer className="px-4 pb-3 text-[11.5px] text-ink-3 max-w-[1600px] w-full flex flex-wrap gap-x-4">
          <span>Datenstand {fmt.date(DATA_AS_OF)} {fmt.time(DATA_AS_OF)}</span><span>Read-only · 0 Schreibvorgänge</span><span>AES-256-GCM · TPM</span>{config && <span>Modus: {config.analysisMode === 'person' ? 'Pro Person (NDA)' : 'Team-basiert'}</span>}
        </footer>
      </div>
    </div>
  )
}
