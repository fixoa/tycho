import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../state/auth'
import { PRACTICE, DATA_AS_OF } from '../data/mock'
import Globe from '../components/Globe'

const FEED = [
  'PVS SNAPSHOT  · 19:04:11 · 1.284.311 rows · READ-ONLY',
  'ORDICALL      · 19:05:40 · 9.810 calls · signed',
  'DIKTARA       · 19:05:52 · 6.233 sessions · metadata only',
  'AD LDAPS      · 19:06:03 · 11 principals · G_Tycho_Leitung',
  'PLANERY       · 19:06:30 · 11 employees · scope: times/absences',
  'BANK CAMT.053 · 19:07:02 · 2.940 transactions',
  'WRITE PROBE   · 05:41:07 · INSERT → DENIED ✓',
  'STORE         · 05:40:58 · AES-256-GCM · key: TPM 2.0',
  'ANALYSIS RUN  · 05:41:02 · score 74 · forecast € 435.084',
]

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [account, setAccount] = useState('a.berger')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => { const i = setInterval(() => setTick((t) => t + 1), 1400); return () => clearInterval(i) }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault(); setError(null)
    if (login(account, 'manual')) nav('/station')
    else setError('Konto nicht im Active Directory der Ordination gefunden (Versuch protokolliert).')
  }
  const sso = () => { setBusy(true); setTimeout(() => { login('a.berger', 'sso'); nav('/station') }, 700) }
  const lines = FEED.slice(0, 1 + (tick % FEED.length))

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: 'radial-gradient(ellipse at 40% 50%, #1c2a36 0%, #121a20 55%, #0b1014 100%)' }}>
      <Globe className="absolute inset-0 w-full h-full opacity-70 lg:opacity-100" />
      {/* HUD-Rahmen */}
      <div className="pointer-events-none absolute inset-4 border border-white/5" />
      {[['top-4 left-4', 'border-t border-l'], ['top-4 right-4', 'border-t border-r'], ['bottom-4 left-4', 'border-b border-l'], ['bottom-4 right-4', 'border-b border-r']].map(([pos, b]) => (
        <span key={pos} className={`pointer-events-none absolute ${pos} w-6 h-6 ${b} border-accent/70`} />
      ))}
      <div className="pointer-events-none absolute top-7 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-ink-3/70 uppercase whitespace-nowrap hidden lg:block">Ordinations-Kontrollinstanz · Read-only · Local · Encrypted</div>

      <div className="relative min-h-full grid lg:grid-cols-[1fr_400px] gap-8 items-center px-8 lg:px-16 py-16">
        {/* Links: Wortmarke + Feed */}
        <div className="flex flex-col justify-between h-full py-6 max-w-xl">
          <div>
            <div className="text-[44px] lg:text-[72px] font-bold tracking-[0.28em] leading-none text-ink-1" style={{ textShadow: '0 0 40px rgba(72,175,240,0.35)' }}>TYCHO</div>
            <div className="font-mono text-[11px] tracking-[0.22em] text-accent mt-3 uppercase">Volle Sicht. Null Schreibzugriff.</div>
            <p className="text-[14px] text-ink-2 mt-6 max-w-md leading-relaxed">
              Tycho beobachtet die gesamte Ordination – PVS, Telefon-KI, Dokumentations-KI, Personal, Honorare – ausschließlich lesend, lokal auf dem eigenen Server, und liefert jeden Morgen die Lage: Efficacy Score, Abrechnungslücken, Prognose bis Quartalsende.
            </p>
          </div>
          <div className="mt-10 font-mono text-[10.5px] text-ink-3 space-y-1">
            <div className="text-ink-2 tracking-[0.2em] uppercase mb-2">Letzter Lauf · {DATA_AS_OF.toLocaleDateString('de-AT')}</div>
            {lines.map((l, i) => <div key={l} className={i === lines.length - 1 ? 'text-accent' : ''}>› {l}</div>)}
            <div className="text-accent pulse-dot">█</div>
          </div>
        </div>

        {/* Rechts: Login-Karte */}
        <div className="card p-6 backdrop-blur-sm" style={{ background: 'rgba(48,64,77,0.82)' }}>
          <div className="text-[13px] font-semibold">Anmelden</div>
          <div className="label mb-5">Domäne {PRACTICE.domain} · Kerberos / LDAPS</div>
          <button onClick={sso} disabled={busy} className="w-full flex items-center justify-center gap-2 rounded bg-accent-strong text-white py-2.5 text-[13px] font-medium hover:bg-accent disabled:opacity-60">
            <KeyRound size={16} /> {busy ? 'Kerberos-Ticket wird geprüft …' : 'Mit Windows-Konto anmelden (SSO)'}
          </button>
          <div className="flex items-center gap-3 my-4 label"><span className="flex-1 h-px bg-white/10" />oder AD-Konto<span className="flex-1 h-px bg-white/10" /></div>
          <form onSubmit={submit} className="space-y-3">
            <label className="block label">Benutzername
              <input value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username" className="bp-input mt-1 w-full normal-case tracking-normal" />
            </label>
            <label className="block label">Passwort
              <input type="password" defaultValue="••••••••••" autoComplete="current-password" className="bp-input mt-1 w-full normal-case tracking-normal" />
            </label>
            {error && <div className="text-xs text-status-critical">{error}</div>}
            <button className="bp-btn w-full justify-center py-2">Anmelden</button>
          </form>
          <div className="mt-5 text-[11px] text-ink-3 leading-relaxed">
            Demo-Konten: <code className="text-ink-2">a.berger</code> (Ärztliche Leitung, Haupt-Admin), <code className="text-ink-2">k.bauer</code> (Ordinationsmanagement). Andere AD-Konten, z. B. <code className="text-ink-2">l.gruber</code>, sehen nur „Mein Score“.
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 font-mono text-[10px] text-ink-3 flex justify-between"><span>{PRACTICE.server}</span><span className="text-status-good">● READ-ONLY</span></div>
        </div>
      </div>
    </div>
  )
}
