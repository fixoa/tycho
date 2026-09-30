import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STAFF } from '../data/staff'
import type { StaffMember } from '../data/types'

// Demo-Anmeldung. In Produktion: Windows-SSO (Kerberos/Negotiate) gegen das AD,
// Berechtigung über AD-Gruppe G_Tycho_Leitung. Kein eigenes Passwort in Tycho.
export type Session = { user: StaffMember; method: 'sso' | 'manual'; loginAt: Date }

export const LEADER_GROUP = 'G_Tycho_Leitung'
export const ADMIN_GROUP = 'G_Tycho_Admin'
export const isLeader = (u: StaffMember) => u.adGroups.includes(LEADER_GROUP)
export const isAdmin = (u: StaffMember) => u.adGroups.includes(ADMIN_GROUP)

interface AuthCtx {
  session: Session | null
  login: (accountOrId: string, method: Session['method']) => boolean
  logout: () => void
  theme: 'dark' | 'light'
  themeMode: 'dark' | 'light' | 'system'
  setTheme: (m: 'dark' | 'light' | 'system') => void
  toggleTheme: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = sessionStorage.getItem('tycho.session')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const user = STAFF.find((s) => s.id === parsed.id)
      return user ? { user, method: parsed.method, loginAt: new Date(parsed.loginAt) } : null
    } catch {
      return null
    }
  })
  // Design folgt der Systemeinstellung (prefers-color-scheme), solange nichts explizit gewählt wurde
  const systemTheme = (): 'dark' | 'light' => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(() => {
    try { const s = localStorage.getItem('tycho.theme'); return s === 'dark' || s === 'light' ? s : 'system' } catch { return 'system' }
  })
  const [sys, setSys] = useState<'dark' | 'light'>(systemTheme)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const h = () => setSys(systemTheme())
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const theme = themeMode === 'system' ? sys : themeMode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { if (themeMode === 'system') localStorage.removeItem('tycho.theme'); else localStorage.setItem('tycho.theme', themeMode) } catch { /* ignore */ }
  }, [theme, themeMode])

  const value = useMemo<AuthCtx>(() => ({
    session,
    login: (account, method) => {
      // Jedes AD-Konto der Ordination darf sich anmelden (Self-Service „Mein Score“);
      // Leitungsansichten erfordern G_Tycho_Leitung, die Erstkonfiguration G_Tycho_Admin.
      const user = STAFF.find((s) => s.account === account.toLowerCase() || s.upn === account.toLowerCase())
      if (!user) return false
      const s: Session = { user, method, loginAt: new Date() }
      setSession(s)
      try { sessionStorage.setItem('tycho.session', JSON.stringify({ id: user.id, method, loginAt: s.loginAt })) } catch { /* ignore */ }
      return true
    },
    logout: () => {
      setSession(null)
      try { sessionStorage.removeItem('tycho.session') } catch { /* ignore */ }
    },
    theme,
    themeMode,
    setTheme: setThemeMode,
    toggleTheme: () => setThemeMode(theme === 'dark' ? 'light' : 'dark'),
  }), [session, theme, themeMode])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AuthProvider fehlt')
  return ctx
}
