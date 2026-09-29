import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// Erstkonfiguration durch den Haupt-Admin. In Produktion liegt das im
// verschlüsselten Store und ist im Audit-Log (wer, wann, welcher Modus, NDA).
export type AnalysisMode = 'team' | 'person'
export interface TychoConfig {
  analysisMode: AnalysisMode
  ndaAccepted: boolean
  configuredBy: string
  configuredAt: string
  kAnonymity: number
  modules: Record<string, boolean>
}

export type UiMode = 'simple' | 'advanced'
interface Ctx { config: TychoConfig | null; save: (c: TychoConfig) => void; reset: () => void; ui: UiMode; setUi: (m: UiMode) => void }
const C = createContext<Ctx | null>(null)
const KEY = 'tycho.config'

export const DEFAULT_MODULES: Record<string, boolean> = {
  billing: true, ordicall: true, diktara: true, tailwind: true, capacity: true, icd: true, zuweiser: true, verordnung: true, qm: true, nps: true, selfservice: true, wahlarzt: true,
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TychoConfig | null>(() => {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
  })
  const [ui, setUiState] = useState<UiMode>(() => { try { return (localStorage.getItem('tycho.ui') as UiMode) || 'simple' } catch { return 'simple' } })
  useEffect(() => { document.documentElement.setAttribute('data-ui', ui); try { localStorage.setItem('tycho.ui', ui) } catch { /* ignore */ } }, [ui])
  const value = useMemo<Ctx>(() => ({
    config,
    save: (c) => { setConfig(c); try { localStorage.setItem(KEY, JSON.stringify(c)) } catch { /* ignore */ } },
    reset: () => { setConfig(null); try { localStorage.removeItem(KEY) } catch { /* ignore */ } },
    ui, setUi: setUiState,
  }), [config, ui])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useConfig() {
  const c = useContext(C)
  if (!c) throw new Error('ConfigProvider fehlt')
  return c
}

/** true = Einzelpersonen dürfen ausgewertet werden (Pro-Person-Modus mit NDA) */
export function usePersonMode() {
  const { config } = useConfig()
  return config?.analysisMode === 'person' && config.ndaAccepted
}
