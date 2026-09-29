import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUp, History, X, ArrowRight, Cpu, Trash2 } from 'lucide-react'
import { useAssistant } from '../state/assistant'
import { useData } from '../data/aggregate'
import { usePersonMode } from '../state/config'
import { useFilters } from '../state/filters'
import { answer, SUGGESTIONS } from '../data/agent'

export const MODEL = { name: 'Llama 3.1 8B', where: 'lokal · TS-ORD-01', tag: 'AT' }

export function Orb({ size = 40 }: { size?: number }) { return <span className="ai-orb inline-block shrink-0" style={{ width: size, height: size }} aria-hidden /> }

/** Assistent als rechtes Panel (Simple) oder Drawer (Advanced) */
export default function Assistant({ variant = 'panel' }: { variant?: 'panel' | 'drawer' }) {
  const a = useAssistant()
  const data = useData()
  const personMode = usePersonMode()
  const { setPreset } = useFilters()
  const nav = useNavigate()
  const loc = useLocation()
  const [q, setQ] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const suggestions = SUGGESTIONS[loc.pathname] ?? SUGGESTIONS.default

  const run = (text: string) => {
    if (!text.trim()) return
    a.push({ role: 'user', text, at: new Date() })
    setThinking(true)
    setTimeout(() => {
      if (/woche/i.test(text)) setPreset('week')
      const ans = answer(text, data, personMode)
      a.push({ role: 'assistant', text: ans.text, answer: ans, at: new Date() })
      setThinking(false)
    }, 600 + Math.random() * 500)
  }
  useEffect(() => { const p = a.consume(); if (p) run(p) }, [a.pending]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [a.messages.length, thinking])
  const submit = (e: FormEvent) => { e.preventDefault(); run(q); setQ('') }
  const go = (to: string) => { if (to.startsWith('?q=')) run(decodeURIComponent(to.slice(3))); else nav(to) }

  if (!a.open) return null
  return (
    <aside className={variant === 'panel' ? 'card flex flex-col w-full lg:w-[380px] xl:w-[420px] shrink-0 h-[calc(100vh-96px)] sticky top-4' : 'fixed right-0 top-14 bottom-0 w-[420px] max-w-full bg-surface-1 border-l border-line-1 flex flex-col z-40'}>
      <header className="flex items-center gap-2 px-4 h-12 border-b border-line-1">
        <Orb size={20} /><span className="font-semibold text-[14px]">Assistent</span>
        <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-[11px] text-ink-3 whitespace-nowrap" title={MODEL.where}><Cpu size={11} /> {MODEL.name} · lokal</span>
        <div className="ml-auto flex items-center gap-1 text-ink-3">
          <button title="Verlauf löschen" onClick={a.clear} className="p-1.5 hover:text-ink-1"><Trash2 size={15} /></button>
          <button title="Verlauf" className="p-1.5 hover:text-ink-1"><History size={15} /></button>
          <button title="Schließen" onClick={() => a.setOpen(false)} className="p-1.5 hover:text-ink-1"><X size={16} /></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {a.messages.length === 0 && (
          <div className="pt-[30%]">
            <Orb size={44} />
            <div className="mt-5 font-semibold text-[15px]">Was möchten Sie wissen?</div>
            <p className="text-[13px] text-ink-2 mt-1 leading-relaxed">Der Assistent beantwortet Fragen zu Umsatz, Leistungen, Patient:innen, Anrufen, Honorarnoten und Team – ausschließlich aus den lokalen Tycho-Daten.</p>
            <ul className="mt-4 space-y-2.5">
              {suggestions.map((s) => <li key={s}><button onClick={() => run(s)} className="flex items-start gap-2 text-left text-[13px] text-ink-2 hover:text-ink-1"><ArrowRight size={14} className="mt-0.5 shrink-0 text-ink-3" />{s}</button></li>)}
            </ul>
          </div>
        )}
        {a.messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            {m.role === 'user' ? <div className="bg-surface-2 rounded-2xl px-3.5 py-2 text-[13px] max-w-[85%]">{m.text}</div> : (
              <div className="flex gap-2.5">
                <Orb size={22} />
                <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-1">
                  <p>{m.text}</p>
                  {m.answer?.table && (
                    <div className="mt-2 overflow-x-auto rounded-lg border border-line-1"><table className="w-full text-[12px]"><thead><tr>{m.answer.table.head.map((h) => <th key={h} className="label text-left px-2 py-1.5 border-b border-line-1">{h}</th>)}</tr></thead><tbody>{m.answer.table.rows.map((r, ri) => <tr key={ri} className="border-b border-line-1 last:border-0">{r.map((c, ci) => <td key={ci} className={`px-2 py-1.5 ${ci > 0 && typeof c !== 'string' ? 'text-right tabular' : ''}`}>{c}</td>)}</tr>)}</tbody></table></div>
                  )}
                  {m.answer?.chips && <div className="mt-2 flex flex-wrap gap-1.5">{m.answer.chips.map((c) => <button key={c.label} onClick={() => go(c.to)} className="bp-btn text-[12px] py-1">{c.label} <ArrowRight size={12} /></button>)}</div>}
                </div>
              </div>
            )}
          </div>
        ))}
        {thinking && <div className="flex gap-2.5 items-center text-[12px] text-ink-3"><Orb size={22} /><span className="pulse-dot">Denkt nach … (lokal, {MODEL.name})</span></div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="p-3 border-t border-line-1">
        <div className="card flex items-end gap-2 px-3 py-2" style={{ boxShadow: 'none' }}>
          <textarea value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e) } }} rows={2} placeholder="Frage stellen …" className="flex-1 bg-transparent resize-none outline-none text-[13px] placeholder:text-ink-3" />
          <button type="submit" className="w-8 h-8 rounded-full bg-accent-strong text-surface-1 flex items-center justify-center shrink-0" title="Senden"><ArrowUp size={15} /></button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink-3"><span>Antworten stammen nur aus lokalen Daten. Keine Cloud.</span><label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={a.persist} onChange={(e) => a.setPersist(e.target.checked)} className="accent-[var(--accent)]" /> Dauerhaft speichern</label></div>
      </form>
    </aside>
  )
}

/** Große Eingabe auf der Startseite (Simple Mode) */
export function AssistantPrompt() {
  const a = useAssistant()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) { a.ask(q.trim()); setQ('') } }
  return (
    <form onSubmit={submit} className="card w-full max-w-3xl mx-auto px-6 pt-5 pb-4">
      <textarea value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e) } }} rows={2} placeholder="Fragen Sie alles zu Ihren Ordinationsdaten – z. B. welche Leistungen am meisten Umsatz bringen …" className="w-full bg-transparent resize-none outline-none text-[15px] placeholder:text-ink-3" />
      <div className="mt-4 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-[13px] text-ink-2 cursor-pointer"><span className={`w-9 h-5 rounded-full relative transition ${a.persist ? 'bg-accent-strong' : 'bg-line-2'}`} onClick={() => a.setPersist(!a.persist)}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface-1 transition ${a.persist ? 'left-[18px]' : 'left-0.5'}`} /></span> Dauerhaft speichern</label>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2"><Cpu size={14} /> {MODEL.name} <span className="text-accent font-medium">{MODEL.tag}</span></span>
          <button type="submit" className="w-10 h-10 rounded-full bg-accent-strong text-surface-1 flex items-center justify-center" title="Senden"><ArrowUp size={17} /></button>
        </div>
      </div>
    </form>
  )
}
