import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STAFF } from '../data/staff'
import type { StaffMember } from '../data/types'

// Demo-Anmeldung. In Produktion: Windows-SSO (Kerberos/Negotiate) gegen das AD,
// Berechtigung über AD-Gruppe G_Tycho_Leitung. Kein eigenes Passwort in Tycho.
export type Session = { user: StaffMember; method: 'sso' | 'manual'; loginAt: Date }

interface AuthCtx {
  session: Session | null
  login: (accountOrId: string, method: Session['method']) => boolean
  logout: () => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

const Ctx = createContext<AuthCtx | null>(null)
const ALLOWED_GROUP = 'G_Tycho_Leitung'

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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('tycho.theme') as 'dark' | 'light') || 'dark'
    } catch {
      return 'dark'
    }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('tycho.theme', theme) } catch { /* ignore */ }
  }, [theme])

  const value = useMemo<AuthCtx>(() => ({
    session,
    login: (account, method) => {
      const user = STAFF.find((s) => s.account === account.toLowerCase() || s.upn === account.toLowerCase())
      if (!user || !user.adGroups.includes(ALLOWED_GROUP)) return false
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
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
  }), [session, theme])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AuthProvider fehlt')
  return ctx
}
