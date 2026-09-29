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

/** Marke: Fadenkreuz im Quadrat – Kontrollinstanz, nicht Konsumprodukt. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" className="shrink-0" aria-hidden>
      <rect x="0.5" y="0.5" width="25" height="25" fill="none" stroke="var(--accent)" strokeOpacity="0.7" />
      <circle cx="13" cy="13" r="6.5" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
      <path d="M13 3v5M13 18v5M3 13h5M18 13h5" stroke="var(--accent)" strokeWidth="1.2" />
      <circle cx="13" cy="13" r="1.8" fill="var(--accent)" />
    </svg>
  )
}

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
      <aside className="w-56 shrink-0 border-r border-line-1 bg-surface-1 flex flex-col">
        <div className="px-4 h-12 border-b border-line-1 flex items-center">
          <div className="flex items-center gap-2.5">
            <Mark />
            <div>
              <div className="font-semibold tracking-[0.22em] text-ink-1 leading-none text-[13px]">TYCHO</div>
              <div className="label mt-1">Kontrollinstanz</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map((g) => (
            <div key={g} className="mb-2">
              <div className="px-4 pt-2 pb-1 label">{g}</div>
              {items.filter((n) => n.group === g).map((n) => (
                <NavLink key={n.to} to={n.to}
                  className={({ isActive }) => `flex items-center gap-2.5 pl-3 pr-3 py-[5px] text-[12.5px] border-l-2 ${isActive ? 'border-accent bg-accent/10 text-ink-1 font-medium' : 'border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink-1'}`}>
                  <n.icon size={14} strokeWidth={1.8} className={undefined} />
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-line-1 font-mono text-[10px] text-ink-3 space-y-1.5 uppercase tracking-[0.06em]">
          <div className="flex items-center gap-1.5"><Lock size={10} /> AES-256-GCM · TPM</div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-status-good pulse-dot" /> Read-only · 0 Writes</div>
          {config && <div className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 ${config.analysisMode === 'person' ? 'bg-status-critical' : 'bg-accent'}`} /> Modus: {config.analysisMode === 'person' ? 'Pro Person' : 'Team'}</div>}
          <div className="normal-case tracking-normal text-ink-3/80">{PRACTICE.server}</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-12 shrink-0 border-b border-line-1 bg-surface-1 px-5 flex items-center gap-4">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-ink-1 truncate leading-tight">{PRACTICE.name}</div>
            <div className="label truncate">{PRACTICE.type} · {PRACTICE.location}</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
              <span className="inline-flex items-center gap-1.5 border border-line-2 px-2 py-1 whitespace-nowrap"><span className="w-1.5 h-1.5 bg-status-good pulse-dot" /> Stand {fmt.dateShort(DATA_AS_OF)} {fmt.time(DATA_AS_OF)}</span>
              <span className="inline-flex items-center gap-1.5 border border-line-2 px-2 py-1 whitespace-nowrap">{QUARTER.label} · T{dayOfQ}/{QUARTER.days}</span>
              <span className="inline-flex items-center gap-1.5 border border-line-2 px-2 py-1 whitespace-nowrap">Run {fmt.dateShort(DEMO_TODAY)} 05:41</span>
            </div>
            <button onClick={toggleTheme} className="p-1.5 border border-line-2 hover:bg-surface-2 text-ink-2" title="Design wechseln">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {session && (
              <div className="flex items-center gap-2 pl-3 border-l border-line-1">
                <Avatar name={session.user.name} hue={session.user.avatarHue} size={26} />
                <div className="hidden sm:block leading-tight">
                  <div className="text-ink-1 text-[12px] font-medium">{session.user.name}</div>
                  <div className="font-mono text-[10px] text-ink-3">{session.user.account} · {session.method === 'sso' ? 'kerberos' : 'ldaps'}</div>
                </div>
                <button onClick={() => { logout(); nav('/login') }} className="p-1.5 border border-line-2 hover:bg-surface-2 text-ink-2" title="Abmelden"><LogOut size={14} /></button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto plane">
          <div className="max-w-[1440px] mx-auto px-5 py-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
