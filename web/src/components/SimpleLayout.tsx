import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Sun, Moon, LogOut, Sparkles, Search, Check } from 'lucide-react'
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

const MAIN = [
  { to: '/start', label: 'Start' }, { to: '/patienten', label: 'Patient:innen' }, { to: '/finanzen', label: 'Finanzen' }, { to: '/produktivitaet', label: 'Produktivität' },
  { to: '/ordicall', label: 'Ordicall', module: 'ordicall' }, { to: '/diktara', label: 'Diktara', module: 'diktara' }, { to: '/tailwind', label: 'Tailwind', module: 'tailwind' }, { to: '/hr', label: 'HR', module: 'tailwind' }, { to: '/tarife', label: 'Tarife' },
]
const MORE = [
  { to: '/station', label: 'Tycho Station (Cockpit)' }, { to: '/team', label: 'Personal & Effizienz' }, { to: '/prognose', label: 'Prognose' }, { to: '/digest', label: 'Tycho Digest' },
  { to: '/termine', label: 'Termine & Kapazität', module: 'capacity' }, { to: '/zuweiser', label: 'Zuweiser', module: 'zuweiser' }, { to: '/verordnungen', label: 'Verordnungen', module: 'verordnung' },
  { to: '/zufriedenheit', label: 'Zufriedenheit (NPS)', module: 'nps' }, { to: '/qm', label: 'QM & Fristen', module: 'qm' }, { to: '/landschaft', label: 'Landschaft & Regulatorik' },
  { to: '/mein-score', label: 'Mein Score', module: 'selfservice' }, { to: '/sicherheit', label: 'Sicherheit & Compliance' }, { to: '/einstellungen', label: 'Einstellungen' },
]

export default function SimpleLayout() {
  const { session, logout, theme, toggleTheme } = useAuth()
  const { config } = useConfig()
  const f = useFilters()
  const a = useAssistant()
  const nav = useNavigate()
  const loc = useLocation()
  const [more, setMore] = useState(false)
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState('')
  const moreRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const h = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMore(false); if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === '/' && !(e.target as HTMLElement).closest('input,textarea')) { e.preventDefault(); document.getElementById('global-search')?.focus() } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [])
  const leader = session ? isLeader(session.user) : false
  const on = (m?: string) => !m || (config?.modules?.[m] ?? true)
  const results = q.length >= 2 ? searchAll(q).slice(0, 8) : []

  return (
    <div className="min-h-full flex flex-col bg-surface-0">
      <header className="sticky top-0 z-40 bg-bar-0 border-b border-line-1 h-14 flex items-center px-4 gap-3">
        <span className="font-semibold text-[15px] tracking-tight pr-3 border-r border-line-1">Tycho</span>
        <span className="text-[14px] text-ink-1 hidden 2xl:inline whitespace-nowrap">{PRACTICE.name}</span>
        {leader && (
          <nav className="hidden lg:flex items-center gap-0 ml-1">
            {MAIN.filter((n) => on(n.module)).map((n) => <NavLink key={n.to} to={n.to} className={({ isActive }) => `px-2.5 py-1.5 rounded-lg text-[13.5px] whitespace-nowrap ${isActive ? 'bg-surface-2 text-ink-1 font-medium' : 'text-ink-2 hover:text-ink-1'}`}>{n.label}</NavLink>)}
            <div ref={moreRef} className="relative">
              <button onClick={() => setMore((o) => !o)} className={`px-3 py-1.5 rounded-lg text-[14px] inline-flex items-center gap-1 ${MORE.some((m) => loc.pathname.startsWith(m.to)) ? 'bg-surface-2 text-ink-1 font-medium' : 'text-ink-2 hover:text-ink-1'}`}>Mehr <ChevronDown size={13} /></button>
              {more && <div className="absolute left-0 mt-1 w-[260px] card p-1.5 z-50 text-[13px]">{MORE.filter((n) => on(n.module)).map((n) => <NavLink key={n.to} to={n.to} onClick={() => setMore(false)} className={({ isActive }) => `flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-2 ${isActive ? 'font-semibold' : ''}`}>{n.label}</NavLink>)}</div>}
            </div>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {leader && (
            <div className="relative hidden xl:block">
              <label className="bp-input flex items-center gap-2 w-[190px] py-1.5"><Search size={14} className="text-ink-3" /><input id="global-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen …  ( / )" className="bg-transparent outline-none flex-1 text-[13px]" /></label>
              {results.length > 0 && <div className="absolute right-0 mt-1 w-[360px] card p-1.5 z-50 text-[13px]">{results.map((r) => <button key={r.to + r.title} onClick={() => { nav(r.to); setQ('') }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-2"><div className="flex justify-between"><span className="text-ink-1">{r.title}</span><span className="label">{r.kind}</span></div><div className="text-[11.5px] text-ink-3 truncate">{r.sub}</div></button>)}</div>}
            </div>
          )}
          {leader && <><span className="hidden xl:block"><LocationPicker /></span><PeriodPicker /></>}
          <button onClick={() => a.setOpen(!a.open)} className={`bp-btn ${a.open ? 'active' : ''}`} title="Assistent"><Sparkles size={14} /><span className="hidden md:inline">Assistent</span></button>
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenu((o) => !o)} className="rounded-full">{session && <Avatar name={session.user.name} hue={session.user.avatarHue} size={32} />}</button>
            {menu && session && (
              <div className="absolute right-0 mt-1 w-[260px] card p-1.5 z-50 text-[13px]">
                <div className="px-2 py-1.5"><div className="font-medium">{session.user.name}</div><div className="text-[11.5px] text-ink-3">{session.user.upn}</div></div>
                <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2">{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} {theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}</button>
                <NavLink to="/einstellungen" onClick={() => setMenu(false)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2"><Check size={14} className="opacity-0" /> Einstellungen</NavLink>
                <button onClick={() => { logout(); nav('/login') }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2"><LogOut size={14} /> Abmelden</button>
              </div>
            )}
          </div>
        </div>
      </header>
      {f.activeCount > 0 && (
        <div className="px-4 pt-3 flex items-center gap-2 text-[12.5px] text-ink-2 max-w-[1600px] mx-auto w-full">
          <span>Filter:</span>{f.role && <span className="bp-btn py-0.5">{f.role}</span>}{f.payer && <span className="bp-btn py-0.5">{f.payer}</span>}{f.team && <span className="bp-btn py-0.5">{f.team}</span>}
          <button onClick={f.reset} className="text-accent">Zurücksetzen</button>
        </div>
      )}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4 flex gap-4 items-start">
        <main className="flex-1 min-w-0"><Outlet /></main>
        <Assistant variant="panel" />
      </div>
      <footer className="px-4 pb-3 text-[11.5px] text-ink-3 max-w-[1600px] mx-auto w-full flex flex-wrap gap-x-4">
        <span>Datenstand {fmt.date(DATA_AS_OF)} {fmt.time(DATA_AS_OF)}</span><span>Read-only · 0 Schreibvorgänge</span><span>AES-256-GCM · TPM</span>{config && <span>Modus: {config.analysisMode === 'person' ? 'Pro Person (NDA)' : 'Team-basiert'}</span>}
      </footer>
    </div>
  )
}
