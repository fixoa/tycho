import type { ComponentType } from 'react'
import {
  Home, Mail, TrendingUp, Users, Stethoscope, CalendarClock, Share2, Pill, ClipboardCheck, Smile, Wallet, ClipboardList, Wind,
  Gauge, UserCircle, Phone, Mic, Landmark, ShieldCheck, Activity, Settings, Briefcase, Cpu, LayoutGrid,
} from 'lucide-react'

export type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
export interface NavItem { to: string; label: string; icon: Icon; module?: string; leader?: boolean; hint?: string }
export interface NavGroup { key: string; label: string; icon: Icon; items: NavItem[] }

/*
 * Navigationsmodell nach Apple Human Interface Guidelines (Sidebars / Tab Bars / Toolbars):
 *  – wenige, klar benannte Bereiche (5), jede Seite genau einmal, kein „Mehr“-Menü
 *  – höchstens zwei Ebenen (Bereich → Seite), knappe Gruppentitel, vertraute Symbole
 *  – Navigation getrennt von Aktionen (Aktionen liegen in der Toolbar)
 *  – nichts wird versteckt oder deaktiviert; abgeschaltete Module fehlen ganz
 */
export const NAV: NavGroup[] = [
  { key: 'ueberblick', label: 'Überblick', icon: Home, items: [
    { to: '/start', label: 'Start', icon: Home, leader: true },
    { to: '/station', label: 'Cockpit', icon: Activity, leader: true, hint: 'Tycho Station' },
    { to: '/prognose', label: 'Prognose', icon: TrendingUp, leader: true },
    { to: '/digest', label: 'Digest', icon: Mail, leader: true },
  ] },
  { key: 'praxis', label: 'Praxis', icon: Stethoscope, items: [
    { to: '/patienten', label: 'Patient:innen', icon: Stethoscope, leader: true },
    { to: '/termine', label: 'Termine', icon: CalendarClock, leader: true, module: 'capacity' },
    { to: '/zuweiser', label: 'Zuweiser', icon: Share2, leader: true, module: 'zuweiser' },
    { to: '/verordnungen', label: 'Verordnungen', icon: Pill, leader: true, module: 'verordnung' },
    { to: '/qm', label: 'Qualität', icon: ClipboardCheck, leader: true, module: 'qm', hint: 'QM & Fristen' },
    { to: '/zufriedenheit', label: 'Zufriedenheit', icon: Smile, leader: true, module: 'nps' },
  ] },
  { key: 'finanzen', label: 'Finanzen', icon: Wallet, items: [
    { to: '/finanzen', label: 'Finanzen', icon: Wallet, leader: true },
    { to: '/tarife', label: 'Tarife', icon: ClipboardList, leader: true, module: 'billing', hint: 'Honorarkatalog & Findings' },
    { to: '/tailwind', label: 'Tailwind', icon: Wind, leader: true, module: 'tailwind', hint: 'Honorarnoten & Inkasso' },
  ] },
  { key: 'team', label: 'Team', icon: Users, items: [
    { to: '/produktivitaet', label: 'Produktivität', icon: Gauge, leader: true },
    { to: '/team', label: 'Personal', icon: Users, leader: true, hint: 'Personal & Effizienz' },
    { to: '/hr', label: 'HR', icon: Briefcase, leader: true, module: 'tailwind', hint: 'Dienstplan, Kosten, Effizienz' },
    { to: '/mein-score', label: 'Mein Score', icon: UserCircle, module: 'selfservice' },
  ] },
  { key: 'systeme', label: 'Systeme', icon: Cpu, items: [
    { to: '/ordicall', label: 'Ordicall', icon: Phone, leader: true, module: 'ordicall' },
    { to: '/diktara', label: 'Diktara', icon: Mic, leader: true, module: 'diktara' },
    { to: '/landschaft', label: 'Landschaft', icon: Landmark, leader: true, hint: 'Regulatorik & Kostenträger' },
    { to: '/sicherheit', label: 'Sicherheit', icon: ShieldCheck, leader: true },
  ] },
]
export const SETTINGS: NavItem = { to: '/einstellungen', label: 'Einstellungen', icon: Settings, leader: true }
export const ALL_ITEMS: NavItem[] = [...NAV.flatMap((g) => g.items), SETTINGS]
export const GRID_ICON = LayoutGrid

/** Sichtbare Bereiche/Seiten für eine Session (Leitung ja/nein, Module an/aus) */
export function visibleNav(leader: boolean, modules?: Record<string, boolean>): NavGroup[] {
  const on = (i: NavItem) => (leader || !i.leader) && (!i.module || (modules?.[i.module] ?? true))
  return NAV.map((g) => ({ ...g, items: g.items.filter(on) })).filter((g) => g.items.length > 0)
}
export function groupOf(pathname: string): NavGroup | undefined {
  const base = '/' + pathname.split('/')[1]
  return NAV.find((g) => g.items.some((i) => i.to === base)) ?? (base === SETTINGS.to ? undefined : undefined)
}
export function itemOf(pathname: string): NavItem | undefined {
  const base = '/' + pathname.split('/')[1]
  return ALL_ITEMS.find((i) => i.to === base)
}
/** Knapper Fenstertitel (HIG: kurz, nicht der App-Name) */
export function titleOf(pathname: string): string {
  const it = itemOf(pathname)
  if (pathname.startsWith('/team/')) return 'Person'
  return it?.hint && it.hint.length <= 24 ? it.hint : it?.label ?? ''
}
