import { ArrowRight, TrendUp as TrendingUp, Receipt as ReceiptText, CalendarCheck, Users, Stethoscope, FileText } from '@phosphor-icons/react'
import { useAuth } from '../state/auth'
import { useAssistant } from '../state/assistant'
import { AssistantPrompt, Orb } from '../components/Assistant'
import { DATA_AS_OF } from '../data/mock'

export default function Start() {
  const { session } = useAuth()
  const a = useAssistant()
  const first = session?.user.name ?? ''
  const hour = new Date().getHours()
  const greet = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'
  const items = [
    { icon: TrendingUp, q: 'Umsatz dieser Woche zusammenfassen' },
    { icon: ReceiptText, q: 'Offene Rechnungen prüfen' },
    { icon: CalendarCheck, q: 'Auslastung für nächsten Monat planen' },
  ]
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-10">
      <div className="flex items-center gap-4 mb-10"><Orb size={40} /><h1 className="text-[32px] font-semibold tracking-tight">{greet}, {first}</h1></div>
      <AssistantPrompt />
      <ul className="mt-8 space-y-3 w-full max-w-3xl px-6">
        {items.map((i) => <li key={i.q}><button onClick={() => a.ask(i.q)} className="flex items-center gap-3 text-[15px] text-ink-1 hover:text-accent"><i.icon size={18} className="text-ink-3" /> {i.q}</button></li>)}
      </ul>
      <div className="mt-16 card flex items-center gap-4 px-4 py-3 max-w-xl w-full">
        <div className="w-40 h-20 rounded-xl flex items-center justify-center gap-2 shrink-0" style={{ background: 'var(--ai)' }}>
          {[Users, Stethoscope, FileText].map((I, i) => <span key={i} className="w-9 h-9 rounded-lg bg-surface-1 flex items-center justify-center text-accent"><I size={16} /></span>)}
        </div>
        <div>
          <div className="font-semibold text-[15px]">Ihre Daten sind aktuell</div>
          <div className="text-[13px] text-ink-2">Stand {DATA_AS_OF.toLocaleDateString('de-AT')} 19:00 · nächster Abgleich heute 19:00 · alles read-only</div>
        </div>
        <ArrowRight size={16} className="ml-auto text-ink-3" />
      </div>
    </div>
  )
}
