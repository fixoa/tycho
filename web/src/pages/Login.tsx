import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, Compass, Triangle, ChevronRight } from 'lucide-react'
import { useAuth } from '../state/auth'
import { PRACTICE } from '../data/mock'
import Globe from '../components/Globe'

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

      {/* Kopfzeile */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center px-4 lg:px-6">
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
      <div className="absolute left-4 right-12 bottom-[36%] lg:bottom-[44%] hidden md:flex justify-end gap-6 text-[11.5px] uppercase tracking-[0.02em] text-[#e6e8ea] leading-snug">
        {['Sie betreten<br/>die<br/>Kontrollinstanz', 'Zeit: 3 Min<br/>zum<br/>Erkunden', 'Das Betriebssystem<br/>für Entscheidungen<br/>in der Ordination', '© 2026<br/>Tycho<br/>Demo'].map((c, i) => (
          <span key={i} className="border-l border-[#9aa1a9] pl-3 max-w-[180px]" dangerouslySetInnerHTML={{ __html: c }} />
        ))}
      </div>
      <div className="absolute left-2 lg:left-10 bottom-0 leading-[0.8] font-display font-normal tracking-[-0.05em] text-[#e6e8ea] pointer-events-none whitespace-nowrap z-10" style={{ fontSize: 'clamp(150px, 33vw, 620px)', transform: 'translateY(0.2em)' }}>Tycho</div>
    </div>
  )
}
