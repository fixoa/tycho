import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Answer } from '../data/agent'

export interface Msg { role: 'user' | 'assistant'; text: string; answer?: Answer; at: Date }
interface Ctx { open: boolean; setOpen: (o: boolean) => void; messages: Msg[]; push: (m: Msg) => void; clear: () => void; pending: string | null; ask: (q: string) => void; consume: () => string | null; persist: boolean; setPersist: (p: boolean) => void }
const C = createContext<Ctx | null>(null)

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [pending, setPending] = useState<string | null>(null)
  const [persist, setPersist] = useState(false)
  const value = useMemo<Ctx>(() => ({
    open, setOpen, messages, push: (m) => setMessages((ms) => [...ms, m]), clear: () => setMessages([]),
    pending, ask: (q) => { setPending(q); setOpen(true) }, consume: () => { const p = pending; setPending(null); return p },
    persist, setPersist,
  }), [open, messages, pending, persist])
  return <C.Provider value={value}>{children}</C.Provider>
}
export function useAssistant() {
  const c = useContext(C)
  if (!c) throw new Error('AssistantProvider fehlt')
  return c
}
