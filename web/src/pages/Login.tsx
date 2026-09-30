import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass as Search, List as Menu, Compass, Triangle, CaretRight as ChevronRight, Lock, ShieldCheck, HardDrives as Server } from '@phosphor-icons/react'
import { useAuth } from '../state/auth'
import { PRACTICE } from '../data/mock'
import Globe from '../components/Globe'
import { useConfig } from '../state/config'
import Brand from '../components/Brand'

// Optionaler lokaler Video-Loop (Higgsfield-Render, liegt gebündelt unter public/login/).
// Fehlt die Datei, bleibt die Canvas-Erdkugel sichtbar – kein Netzwerkzugriff, kein Streaming.
const HERO_VIDEO = 'login/hero.mp4'
const HERO_POSTER = 'login/hero.jpg'

function HeroMedia({ palette }: { palette: 'dark' | 'light' }) {
  const [video, setVideo] = useState<'loading' | 'ok' | 'none'>(palette === 'dark' ? 'loading' : 'none')
  const [settled, setSettled] = useState(false)
  useEffect(() => { if (video === 'ok') { const t = setTimeout(() => setSettled(true), 1800); return () => clearTimeout(t) } }, [video])
  return (
    <>
      {!settled && <Globe className="absolute inset-0 w-full h-full" palette={palette} />}
      {video !== 'none' && (
        <video className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1600ms] ${video === 'ok' ? 'opacity-100' : 'opacity-0'}`}
          autoPlay muted loop playsInline preload="auto" poster={HERO_POSTER} src={HERO_VIDEO}
          onCanPlay={() => setVideo('ok')} onError={() => setVideo('none')} aria-hidden />
      )}
    </>
  )
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i) }, [])
  return now
}

const TELEMETRY = ['TS-ORD-01', 'KERBEROS / LDAPS', 'AES-256-GCM · TPM', 'READ-ONLY · 0 SCHREIBVORGÄNGE', 'LOKAL · KEIN CLOUD-ZUGRIFF']

function SimpleLogin({ account, setAccount, error, busy, sso, submit, dark }: { account: string; setAccount: (v: string) => void; error: string | null; busy: boolean; sso: () => void; submit: (e: FormEvent) => void; dark: boolean }) {
  const now = useClock()
  return (
    <div className="relative min-h-full overflow-hidden bg-surface-0">
      <div className="absolute inset-0 opacity-70"><Globe className="w-full h-full" palette={dark ? 'dark' : 'light'} parallax={false} /></div>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 50% 42%, var(--surface-0) 0%, color-mix(in srgb, var(--surface-0) 70%, transparent) 55%, transparent 100%)' }} />
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center px-5 rise" style={{ animationDelay: '.1s' }}>
        <Brand size="sm" />
        <span className="ml-auto mono text-[10.5px] text-ink-3 tabular hidden sm:inline">{now.toLocaleTimeString('de-AT')} · {PRACTICE.server.split(' ')[0]}</span>
      </div>
      <div className="relative min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 rise" style={{ animationDelay: '.15s' }}>
            <div className="flex justify-center"><Brand size="lg" /></div>
            <div className="text-[13px] text-ink-2 mt-1">{PRACTICE.name} · Ordinations-Kontrollinstanz</div>
          </div>
          <div className="card p-6 rise backdrop-blur-sm" style={{ animationDelay: '.3s', background: 'color-mix(in srgb, var(--surface-1) 88%, transparent)' }}>
            <button onClick={sso} disabled={busy} className="relative overflow-hidden w-full h-10 rounded-xl bg-accent-strong text-surface-1 text-[14px] font-medium hover:opacity-90 disabled:opacity-80">
              {busy ? 'Kerberos-Ticket wird geprüft …' : 'Mit Windows-Konto anmelden'}
              {busy && <span className="absolute left-0 right-0 bottom-0 h-0.5 progress-sweep" />}
            </button>
            <div className="flex items-center gap-3 my-4 text-[12px] text-ink-3"><span className="flex-1 h-px bg-line-1" />oder<span className="flex-1 h-px bg-line-1" /></div>
            <form onSubmit={submit} className="space-y-3">
              <label className="block text-[12.5px] text-ink-2">AD-Konto<input value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username" className="bp-input mt-1 w-full" /></label>
              <label className="block text-[12.5px] text-ink-2">Passwort<input type="password" defaultValue="••••••••••" autoComplete="current-password" className="bp-input mt-1 w-full" /></label>
              {error && <div className="text-[12.5px] text-status-critical">{error}</div>}
              <button className="bp-btn w-full justify-center h-10">Anmelden</button>
            </form>
          </div>
          <div className="mt-5 flex justify-center gap-4 text-[11px] text-ink-3 rise" style={{ animationDelay: '.5s' }}>
            <span className="inline-flex items-center gap-1"><Lock size={11} /> AES-256-GCM</span><span className="inline-flex items-center gap-1"><ShieldCheck size={11} /> read-only</span><span className="inline-flex items-center gap-1"><Server size={11} /> lokal · {PRACTICE.server.split(' ')[0]}</span>
          </div>
          <div className="mt-3 text-center text-[12px] text-ink-3 leading-relaxed rise" style={{ animationDelay: '.6s' }}>Demo: <span className="text-ink-2">a.berger</span> (Leitung, Admin) · <span className="text-ink-2">k.bauer</span> · andere Konten sehen nur „Mein Score“.<br />Domäne {PRACTICE.domain} · Kerberos / LDAPS</div>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const { login, theme } = useAuth()
  const { ui } = useConfig()
  const nav = useNavigate()
  const now = useClock()
  const [open, setOpen] = useState(true)
  const [account, setAccount] = useState('a.berger')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = (e: FormEvent) => { e.preventDefault(); setError(null); if (login(account, 'manual')) nav('/'); else setError('Konto nicht im Active Directory gefunden (Versuch protokolliert).') }
  const sso = () => { setBusy(true); setTimeout(() => { login('a.berger', 'sso'); nav('/') }, 900) }
  if (ui !== 'advanced') return <SimpleLogin account={account} setAccount={setAccount} error={error} busy={busy} sso={sso} submit={submit} dark={theme === 'dark'} />

  return (
    <div className="relative h-full overflow-hidden bg-[#1F2D3B] text-white select-none fade-in">
      <HeroMedia palette="dark" />
      <div className="hud-scan" aria-hidden />
      {/* HUD-Ecken */}
      <span className="hud-corner left-3 top-[58px] border-l border-t rise" style={{ animationDelay: '.9s' }} aria-hidden />
      <span className="hud-corner right-3 top-[58px] border-r border-t rise" style={{ animationDelay: '.95s' }} aria-hidden />
      <span className="hud-corner left-3 bottom-3 border-l border-b rise" style={{ animationDelay: '1s' }} aria-hidden />
      <span className="hud-corner right-3 bottom-3 border-r border-b rise" style={{ animationDelay: '1.05s' }} aria-hidden />

      {/* Kopfzeile */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center px-4 lg:px-6 rise" style={{ animationDelay: '.2s' }}>
        <Brand size="sm" tone="dark" />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setOpen((o) => !o)} className="h-8 px-10 border border-[#9aa1a9] text-[12.5px] hover:bg-white/5 transition-colors">Anmelden</button>
          <span className="flex border border-[#9aa1a9]"><button className="w-8 h-8 flex items-center justify-center hover:bg-white/5"><Search size={14} /></button><button className="w-8 h-8 flex items-center justify-center border-l border-[#9aa1a9] hover:bg-white/5"><Menu size={14} /></button></span>
        </div>
      </div>
      {/* Telemetrie-Zeile */}
      <div className="absolute top-14 left-8 lg:left-10 right-8 lg:right-10 h-7 flex items-center gap-5 mono text-[10px] tracking-[0.08em] text-[#6b737c] whitespace-nowrap overflow-hidden">
        {TELEMETRY.map((t, i) => <span key={t} className="inline-flex items-center gap-1.5 rise" style={{ animationDelay: `${0.5 + i * 0.12}s` }}><span className="w-1 h-1 bg-[#4fb3a8] pulse-dot" />{t}</span>)}
        <span className="ml-auto tabular rise" style={{ animationDelay: '1.1s' }}>{now.toLocaleDateString('de-AT')} · {now.toLocaleTimeString('de-AT')}</span>
      </div>

      {/* Login-Karte */}
      {open && (
        <div className="absolute top-[88px] right-4 lg:right-6 w-[340px] glass p-5 rise" style={{ animationDelay: '.35s' }}>
          <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#8b9097]">Domäne {PRACTICE.domain} · Kerberos / LDAPS</div>
          <button onClick={sso} disabled={busy} className="relative overflow-hidden mt-3 w-full h-9 bg-[#e6e8ea] text-black text-[12.5px] font-medium hover:bg-white disabled:opacity-80 transition-colors">
            {busy ? 'Kerberos-Ticket wird geprüft …' : 'Mit Windows-Konto anmelden'}
            {busy && <span className="absolute left-0 right-0 bottom-0 h-0.5 progress-sweep" />}
          </button>
          <form onSubmit={submit} className="mt-3 space-y-2">
            <input value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username" className="w-full h-9 bg-[#2A3B4C] border border-white/10 px-3 text-[12.5px] focus:outline-none focus:border-[#9aa1a9] focus:shadow-[0_0_0_3px_rgba(154,161,169,0.15)] transition-shadow" placeholder="AD-Konto" />
            <input type="password" defaultValue="••••••••••" autoComplete="current-password" className="w-full h-9 bg-[#2A3B4C] border border-white/10 px-3 text-[12.5px] focus:outline-none focus:border-[#9aa1a9] focus:shadow-[0_0_0_3px_rgba(154,161,169,0.15)] transition-shadow" />
            {error && <div className="text-[11.5px] text-[#FB7185]">{error}</div>}
            <button className="w-full h-9 border border-[#9aa1a9] text-[12.5px] hover:bg-white/5 flex items-center justify-center gap-1 transition-colors">Anmelden <ChevronRight size={13} /></button>
          </form>
          <div className="mt-3 text-[10.5px] text-[#6b737c] leading-relaxed">Demo: <span className="text-[#9aa1a9]">a.berger</span> (Leitung, Admin) · <span className="text-[#9aa1a9]">k.bauer</span> · andere Konten sehen nur „Mein Score“.</div>
        </div>
      )}

      {/* Kompass rechts */}
      <div className="absolute right-5 top-[430px] hidden lg:flex flex-col items-center gap-3 text-[10.5px] text-[#9aa1a9] rise" style={{ animationDelay: '.8s' }}>
        <Compass size={16} /><span>353°</span><Triangle size={12} className="rotate-180" /><span>25°</span>
        <span className="mt-2 h-24 w-px bg-white/15" />
      </div>

      {/* Caption-Zeile + Wortmarke */}
      <div className="absolute left-4 right-12 bottom-[36%] lg:bottom-[44%] hidden md:flex justify-end gap-6 text-[11.5px] uppercase tracking-[0.02em] text-[#e6e8ea] leading-snug">
        {['Sie betreten<br/>die<br/>Kontrollinstanz', 'Zeit: 3 Min<br/>zum<br/>Erkunden', 'Das Betriebssystem<br/>für Entscheidungen<br/>in der Ordination', '© 2026<br/>Tycho<br/>Demo'].map((c, i) => (
          <span key={i} className="border-l border-[#9aa1a9] pl-3 max-w-[180px] rise" style={{ animationDelay: `${0.6 + i * 0.12}s` }} dangerouslySetInnerHTML={{ __html: c }} />
        ))}
      </div>
      <div className="absolute left-2 lg:left-10 bottom-0 pointer-events-none z-10 wordmark"><Brand size="hero" tone="dark" style={{ height: 'clamp(120px, 22vw, 400px)', marginBottom: '6vh' }} fallback={<span className="block leading-[0.8] font-display font-normal tracking-[-0.05em] text-white whitespace-nowrap" style={{ fontSize: 'clamp(150px, 33vw, 620px)', transform: 'translateY(0.2em)' }}>Tycho</span>} /></div>
    </div>
  )
}
