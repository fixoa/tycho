import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Lock, ShieldCheck, Server, Eye } from 'lucide-react'
import { useAuth } from '../state/auth'
import { PRACTICE } from '../data/mock'
import { Mark } from '../components/Layout'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [account, setAccount] = useState('a.berger')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (login(account, 'manual')) nav('/station')
    else setError('Konto nicht im Active Directory der Ordination gefunden (Versuch protokolliert).')
  }
  const sso = () => {
    setBusy(true)
    setTimeout(() => {
      // Demo: Windows-SSO liefert das angemeldete Terminalserver-Konto.
      login('a.berger', 'sso')
      nav('/station')
    }, 700)
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 plane">
      <div className="w-full max-w-4xl grid md:grid-cols-[1.1fr_1fr] gap-6">
        <div className="flex flex-col justify-between py-2">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Mark size={40} />
              <div>
                <div className="text-2xl font-bold tracking-[0.2em] leading-none">TYCHO</div>
                <div className="label mt-1.5">Ordinations-Kontrollinstanz · v0.2 Demo</div>
              </div>
            </div>
            <h1 className="text-[26px] font-semibold leading-snug mb-3 tracking-tight" style={{ textWrap: 'balance' }}>Volle Sicht auf die Ordination.<br />Ohne eine einzige Schreiboperation.</h1>
            <p className="text-[13px] text-ink-2 max-w-md leading-relaxed">
              Tycho liest PVS, Ordicall, Diktara und Active Directory ausschließlich lesend, analysiert während der Betriebszeit lokal auf dem Server
              und liefert am Folgetag Efficacy Score, Abrechnungslücken und die Prognose bis zum Quartalsende.
            </p>
          </div>
          <ul className="mt-8 space-y-2 text-[12px] text-ink-2">
            <li className="flex items-center gap-2"><Eye size={14} className="text-accent" /> Nur Leserechte – wie ein Benutzer, der zuschaut</li>
            <li className="flex items-center gap-2"><Lock size={14} className="text-accent" /> AES-256-GCM, Schlüssel im TPM · keine Cloud</li>
            <li className="flex items-center gap-2"><Server size={14} className="text-accent" /> Läuft auf {PRACTICE.server}</li>
            <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-accent" /> Leitungsansichten nur für AD-Gruppe G_Tycho_Leitung · jede Sitzung protokolliert</li>
          </ul>
        </div>

        <div className="card p-6">
          <div className="text-[13px] font-semibold mb-1">Anmelden</div>
          <div className="label mb-5">Domäne {PRACTICE.domain} · Kerberos / LDAPS</div>
          <button onClick={sso} disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded bg-accent-strong text-white py-2.5 text-[13px] font-medium hover:bg-accent disabled:opacity-60">
            <KeyRound size={16} /> {busy ? 'Kerberos-Ticket wird geprüft …' : 'Mit Windows-Konto anmelden (SSO)'}
          </button>
          <div className="flex items-center gap-3 my-4 label"><span className="flex-1 h-px bg-line-1" />oder AD-Konto<span className="flex-1 h-px bg-line-1" /></div>
          <form onSubmit={submit} className="space-y-3">
            <label className="block label">
              Benutzername
              <input value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username"
                className="bp-input mt-1 w-full normal-case tracking-normal" />
            </label>
            <label className="block label">
              Passwort
              <input type="password" defaultValue="••••••••••" autoComplete="current-password"
                className="bp-input mt-1 w-full normal-case tracking-normal" />
            </label>
            {error && <div className="text-xs text-status-critical">{error}</div>}
            <button className="bp-btn w-full justify-center py-2">Anmelden</button>
          </form>
          <div className="mt-5 text-[11px] text-ink-3 leading-relaxed">
            Demo-Konten: <code className="text-ink-2">a.berger</code> (Ärztliche Leitung, Haupt-Admin), <code className="text-ink-2">k.bauer</code> (Ordinationsmanagement).
            Alle anderen AD-Konten, z. B. <code className="text-ink-2">l.gruber</code> oder <code className="text-ink-2">m.hofer</code>, sehen nur den Self-Service „Mein Score“.
          </div>
        </div>
      </div>
    </div>
  )
}
