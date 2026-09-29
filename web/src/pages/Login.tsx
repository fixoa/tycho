import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, Crosshair, Layers, BookOpen, Info, Database, SlidersHorizontal, Compass, Triangle, X, ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react'
import { useAuth } from '../state/auth'
import { PRACTICE, BILLING_FINDINGS } from '../data/mock'
import Globe from '../components/Globe'
import { fmt } from '../lib/format'

const BOARD = BILLING_FINDINGS.slice(0, 7).map((f, i) => ({
  id: f.id, title: f.title.split(':')[0].split(' (')[0], kind: f.type === 'limit' ? 'Limit' : f.type === 'nicht-verrechnet' ? 'Nicht verrechnet' : f.type === 'doppelt' ? 'Doppelt' : f.type === 'dokumentation' ? 'Dokumentation' : 'Plausibilität',
  prio: `P${Math.min(3, i + 1)}`, warn: f.severity === 'critical' || f.severity === 'serious', value: f.valueEur, src: f.source.toUpperCase(),
}))

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(true)
  const [account, setAccount] = useState('a.berger')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = (e: FormEvent) => { e.preventDefault(); setError(null); if (login(account, 'manual')) nav('/station'); else setError('Konto nicht im Active Directory gefunden (Versuch protokolliert).') }
  const sso = () => { setBusy(true); setTimeout(() => { login('a.berger', 'sso'); nav('/station') }, 700) }

  return (
    <div className="relative h-full overflow-hidden bg-[#070a0d] text-[#e6e8ea] select-none">
      <Globe className="absolute inset-0 w-full h-full" />

      {/* Linke Icon-Leiste */}
      <div className="absolute left-0 top-0 bottom-0 w-9 bg-[#0b0e11]/90 border-r border-white/5 hidden lg:flex flex-col items-center py-3 gap-4 text-[#6b737c]">
        {[Crosshair, Layers, BookOpen].map((I, i) => <I key={i} size={15} className={i === 0 ? 'text-[#e6e8ea]' : ''} />)}
        <div className="mt-auto flex flex-col gap-4">{[Search, Info, Database, SlidersHorizontal].map((I, i) => <I key={i} size={15} />)}</div>
      </div>

      {/* Lagebild-Panel (Target Board) */}
      <aside className="absolute left-9 top-0 bottom-0 w-[380px] bg-[#0f1216]/85 backdrop-blur-[2px] border-r border-white/5 hidden lg:flex flex-col">
        <div className="flex items-center justify-between px-3 h-8 text-[10.5px] uppercase tracking-[0.08em] text-[#8b9097]"><span>Lagebild</span><span>1 Board · +</span></div>
        <div className="px-3 flex items-center gap-2 text-[12px]"><span className="text-[#8b9097]">Board:</span><span className="flex-1 bg-[#171b20] border border-white/5 px-2 py-1 flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 bg-[#d64545]" />Q3 2026 · ABRECHNUNG</span><X size={12} className="text-[#6b737c]" /></span></div>
        <div className="px-3 mt-2 flex items-center gap-2"><span className="flex-1 bg-[#171b20] border border-white/5 px-2 py-1.5 text-[12px] text-[#6b737c] flex items-center gap-2"><Search size={12} /> Findings durchsuchen…</span><span className="w-7 h-7 bg-[#b9bb5f] flex items-center justify-center text-black"><SlidersHorizontal size={12} /></span></div>
        <div className="px-3 mt-2 flex items-center gap-4 text-[11.5px] text-[#8b9097]"><span>◆ Stufe</span><span>Status</span><span>Bereich</span><span className="ml-auto">≡</span></div>
        <div className="mx-3 mt-2 bg-[#171b20] border border-white/5 px-2 py-1.5 text-[12px] flex items-center justify-between"><span className="flex items-center gap-2 text-[#8abbff]"><Compass size={13} /> Maßnahmen empfehlen</span><ArrowRight size={13} className="text-[#6b737c]" /></div>
        <div className="mt-2 px-3 space-y-2 overflow-hidden">
          {BOARD.map((b) => (
            <div key={b.id} className="bg-[#14181c] border border-white/5 px-2.5 py-2">
              <div className="flex items-center gap-2 text-[12px]"><span className="w-4 h-4 rounded-full border border-[#d64545] flex items-center justify-center"><span className="w-1.5 h-1.5 bg-[#d64545] rounded-full" /></span><span className="text-[#8b9097] font-mono">{b.id}</span><span className="text-[#e6e8ea] font-medium truncate">/ {b.kind}</span><span className="ml-auto text-[#6b737c]">{b.prio}</span></div>
              <div className="pl-6 text-[12px] text-[#8b9097] truncate">{b.title}{b.warn && <span className="ml-2 text-[#d64545] inline-flex items-center gap-1"><AlertTriangle size={11} /> Handlungsbedarf</span>}</div>
              <div className="pl-6 mt-1 flex items-center text-[10px] text-[#6b737c] uppercase tracking-[0.06em]"><span>Q3 2026 · Abrechnung</span><span className="mx-2">◆ {fmt.eur(b.value)}</span><span className="ml-auto">{b.src}//RO//TPM</span></div>
            </div>
          ))}
        </div>
      </aside>

      {/* Kopfzeile */}
      <div className="absolute top-0 left-0 lg:left-[416px] right-0 h-14 flex items-center px-4 lg:px-6">
        <span className="text-[15px] font-medium tracking-tight">Tycho</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setOpen((o) => !o)} className="h-8 px-10 border border-[#9aa1a9] text-[12.5px] hover:bg-white/5">Anmelden</button>
          <span className="flex border border-[#9aa1a9]"><button className="w-8 h-8 flex items-center justify-center hover:bg-white/5"><Search size={14} /></button><button className="w-8 h-8 flex items-center justify-center border-l border-[#9aa1a9] hover:bg-white/5"><Menu size={14} /></button></span>
        </div>
      </div>

      {/* Login-Karte */}
      {open && (
        <div className="absolute top-14 right-4 lg:right-6 w-[340px] bg-[#0f1216]/95 border border-white/10 p-5 backdrop-blur">
          <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#8b9097]">Domäne {PRACTICE.domain} · Kerberos / LDAPS</div>
          <button onClick={sso} disabled={busy} className="mt-3 w-full h-9 bg-[#e6e8ea] text-black text-[12.5px] font-medium hover:bg-white disabled:opacity-60">{busy ? 'Kerberos-Ticket wird geprüft …' : 'Mit Windows-Konto anmelden'}</button>
          <form onSubmit={submit} className="mt-3 space-y-2">
            <input value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username" className="w-full h-9 bg-[#171b20] border border-white/10 px-3 text-[12.5px] focus:outline-none focus:border-[#9aa1a9]" placeholder="AD-Konto" />
            <input type="password" defaultValue="••••••••••" autoComplete="current-password" className="w-full h-9 bg-[#171b20] border border-white/10 px-3 text-[12.5px] focus:outline-none focus:border-[#9aa1a9]" />
            {error && <div className="text-[11.5px] text-[#d64545]">{error}</div>}
            <button className="w-full h-9 border border-[#9aa1a9] text-[12.5px] hover:bg-white/5 flex items-center justify-center gap-1">Anmelden <ChevronRight size={13} /></button>
          </form>
          <div className="mt-3 text-[10.5px] text-[#6b737c] leading-relaxed">Demo: <span className="text-[#9aa1a9]">a.berger</span> (Leitung, Admin) · <span className="text-[#9aa1a9]">k.bauer</span> · andere Konten sehen nur „Mein Score“.</div>
        </div>
      )}

      {/* Kompass rechts */}
      <div className="absolute right-5 top-[400px] hidden lg:flex flex-col items-center gap-3 text-[10.5px] text-[#9aa1a9]">
        <Compass size={16} /><span>353°</span><Triangle size={12} className="rotate-180" /><span>25°</span>
        <span className="mt-2 h-24 w-px bg-white/15" />
      </div>

      {/* Caption-Zeile + Wortmarke */}
      <div className="absolute left-4 lg:left-[420px] right-12 bottom-[36%] lg:bottom-[44%] hidden md:flex justify-end gap-6 text-[11.5px] uppercase tracking-[0.02em] text-[#e6e8ea] leading-snug">
        {['Sie betreten<br/>die<br/>Kontrollinstanz', 'Zeit: 3 Min<br/>zum<br/>Erkunden', 'Das Betriebssystem<br/>für Entscheidungen<br/>in der Ordination', '© 2026<br/>Tycho<br/>Demo'].map((c, i) => (
          <span key={i} className="border-l border-[#9aa1a9] pl-3 max-w-[180px]" dangerouslySetInnerHTML={{ __html: c }} />
        ))}
      </div>
      <div className="absolute left-2 lg:left-10 bottom-0 leading-[0.8] font-display font-normal tracking-[-0.05em] text-[#e6e8ea] pointer-events-none whitespace-nowrap z-10" style={{ fontSize: 'clamp(150px, 33vw, 620px)', transform: 'translateY(0.2em)' }}>Tycho</div>
    </div>
  )
}
