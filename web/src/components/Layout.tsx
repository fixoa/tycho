import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity, Phone, Mic, Users, ClipboardList, TrendingUp, Mail, ShieldCheck, Settings, LogOut, Sun, Moon, Lock, CalendarClock,
  Wind, Share2, Pill, ClipboardCheck, Smile, UserCircle,
} from 'lucide-react'
import { useAuth, isLeader } from '../state/auth'
import { useConfig } from '../state/config'
import { DATA_AS_OF, DEMO_TODAY, PRACTICE, QUARTER } from '../data/mock'
import { fmt } from '../lib/format'
import { Avatar } from './ui'

const NAV = [
  { to: '/station', label: 'Tycho Station', icon: Activity, group: 'Übersicht', leader: true },
  { to: '/prognose', label: 'Prognose', icon: TrendingUp, group: 'Übersicht', leader: true },
  { to: '/digest', label: 'Tycho Digest', icon: Mail, group: 'Übersicht', leader: true },
  { to: '/mein-score', label: 'Mein Score', icon: UserCircle, group: 'Übersicht', leader: false, module: 'selfservice' },
  { to: '/team', label: 'Personal & Effizienz', icon: Users, group: 'Analyse', leader: true },
  { to: '/leistungen', label: 'Leistungen & Abrechnung', icon: ClipboardList, group: 'Analyse', leader: true, module: 'billing' },
  { to: '/termine', label: 'Termine & Kapazität', icon: CalendarClock, group: 'Analyse', leader: true, module: 'capacity' },
  { to: '/zuweiser', label: 'Zuweiser', icon: Share2, group: 'Analyse', leader: true, module: 'zuweiser' },
  { to: '/verordnungen', label: 'Verordnungen', icon: Pill, group: 'Analyse', leader: true, module: 'verordnung' },
  { to: '/zufriedenheit', label: 'Zufriedenheit (NPS)', icon: Smile, group: 'Analyse', leader: true, module: 'nps' },
  { to: '/qm', label: 'QM & Fristen', icon: ClipboardCheck, group: 'Analyse', leader: true, module: 'qm' },
  { to: '/ordicall', label: 'Ordicall Station', icon: Phone, group: 'Produkte', leader: true, module: 'ordicall' },
  { to: '/diktara', label: 'Diktara Station', icon: Mic, group: 'Produkte', leader: true, module: 'diktara' },
  { to: '/tailwind', label: 'Tailwind Station', icon: Wind, group: 'Produkte', leader: true, module: 'tailwind' },
  { to: '/sicherheit', label: 'Sicherheit & Compliance', icon: ShieldCheck, group: 'System', leader: true },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings, group: 'System', leader: true },
]

export default function Layout() {
  const { session, logout, theme, toggleTheme } = useAuth()
  const { config } = useConfig()
  const nav = useNavigate()
  const leader = session ? isLeader(session.user) : false
  const items = NAV.filter((n) => (leader || !n.leader) && (!n.module || (config?.modules?.[n.module] ?? true)))
  const groups = [...new Set(items.map((n) => n.group))]
  const dayOfQ = Math.round((DATA_AS_OF.getTime() - QUARTER.start.getTime()) / 86400000) + 1
  return (
    <div className="h-full flex bg-surface-0">
      <aside className="w-60 shrink-0 border-r border-line-1 bg-surface-1 flex flex-col">
        <div className="px-4 py-4 border-b border-line-1">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            </span>
            <div>
              <div className="font-semibold tracking-wide text-ink-1 leading-none">TYCHO</div>
              <div className="text-[10px] text-ink-3 mt-0.5">Ordinations-Kontrollinstanz</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {groups.map((g) => (
            <div key={g} className="mb-3">
              <div className="px-4 pb-1 text-[10px] uppercase tracking-wider text-ink-3">{g}</div>
              {items.filter((n) => n.group === g).map((n) => (
                <NavLink key={n.to} to={n.to}
                  className={({ isActive }) => `flex items-center gap-2.5 mx-2 px-2.5 py-1.5 rounded-md text-sm ${isActive ? 'bg-accent/15 text-ink-1 font-medium' : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1'}`}>
                  <n.icon size={16} strokeWidth={1.8} />
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-line-1 text-[11px] text-ink-3 space-y-1">
          <div className="flex items-center gap-1.5"><Lock size={11} /> AES-256-GCM · Schlüssel im TPM</div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-status-good pulse-dot" /> Read-only · 0 Schreibvorgänge</div>
          {config && <div className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${config.analysisMode === 'person' ? 'bg-status-critical' : 'bg-accent'}`} /> Modus: {config.analysisMode === 'person' ? 'Pro Person (NDA)' : 'Team-basiert'}</div>}
          <div>{PRACTICE.server}</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 border-b border-line-1 bg-surface-1/80 backdrop-blur px-6 flex items-center gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink-1 truncate">{PRACTICE.name}</div>
            <div className="text-[11px] text-ink-3 truncate">{PRACTICE.type} · {PRACTICE.location}</div>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-ink-3">
            <div className="hidden md:block text-right">
              <div>Datenstand <span className="text-ink-2">{fmt.date(DATA_AS_OF)}, {fmt.time(DATA_AS_OF)}</span></div>
              <div>{QUARTER.label} · Tag {dayOfQ}/{QUARTER.days} · Analyse {fmt.dateShort(DEMO_TODAY)} 05:41</div>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-surface-2 text-ink-2" title="Design wechseln">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {session && (
              <div className="flex items-center gap-2 pl-3 border-l border-line-1">
                <Avatar name={session.user.name} hue={session.user.avatarHue} size={28} />
                <div className="hidden sm:block leading-tight">
                  <div className="text-ink-1 text-xs font-medium">{session.user.name}</div>
                  <div className="text-[10px] text-ink-3">{session.user.upn} · {session.method === 'sso' ? 'Windows SSO' : 'AD-Login'}</div>
                </div>
                <button onClick={() => { logout(); nav('/login') }} className="p-2 rounded-md hover:bg-surface-2 text-ink-2" title="Abmelden"><LogOut size={16} /></button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
