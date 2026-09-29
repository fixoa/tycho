import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Lock, ShieldCheck, Server, Eye } from 'lucide-react'
import { useAuth } from '../state/auth'
import { PRACTICE } from '../data/mock'

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
    else setError('Konto nicht in der AD-Gruppe G_Tycho_Leitung – Zugriff verweigert (Versuch protokolliert).')
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
    <div className="min-h-full flex items-center justify-center p-6 bg-surface-0">
      <div className="w-full max-w-4xl grid md:grid-cols-[1.1fr_1fr] gap-6">
        <div className="flex flex-col justify-between py-2">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-accent" />
              </span>
              <div>
                <div className="text-xl font-semibold tracking-wide">TYCHO</div>
                <div className="text-xs text-ink-3">Kontrollinstanz für die Ordinationsleitung</div>
              </div>
            </div>
            <h1 className="text-2xl font-semibold leading-snug mb-3">Volle Sicht auf die Ordination.<br />Ohne eine einzige Schreiboperation.</h1>
            <p className="text-sm text-ink-2 max-w-md">
              Tycho liest PVS, Ordicall, Diktara und Active Directory ausschließlich lesend, analysiert während der Betriebszeit lokal auf dem Server
              und liefert am Folgetag Efficacy Score, Abrechnungslücken und die Prognose bis zum Quartalsende.
            </p>
          </div>
          <ul className="mt-8 space-y-2 text-xs text-ink-2">
            <li className="flex items-center gap-2"><Eye size={14} className="text-accent" /> Nur Leserechte – wie ein Benutzer, der zuschaut</li>
            <li className="flex items-center gap-2"><Lock size={14} className="text-accent" /> AES-256-GCM, Schlüssel im TPM · keine Cloud</li>
            <li className="flex items-center gap-2"><Server size={14} className="text-accent" /> Läuft auf {PRACTICE.server}</li>
            <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-accent" /> Zugriff nur für AD-Gruppe G_Tycho_Leitung · jede Sitzung protokolliert</li>
          </ul>
        </div>

        <div className="card p-6">
          <div className="text-sm font-semibold mb-1">Anmelden</div>
          <div className="text-xs text-ink-3 mb-5">Domäne {PRACTICE.domain}</div>
          <button onClick={sso} disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-accent text-white py-2.5 text-sm font-medium hover:brightness-110 disabled:opacity-60">
            <KeyRound size={16} /> {busy ? 'Kerberos-Ticket wird geprüft …' : 'Mit Windows-Konto anmelden (SSO)'}
          </button>
          <div className="flex items-center gap-3 my-4 text-[11px] text-ink-3"><span className="flex-1 h-px bg-line-1" />oder AD-Konto<span className="flex-1 h-px bg-line-1" /></div>
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-xs text-ink-2">
              Benutzername
              <input value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username"
                className="mt-1 w-full rounded-md bg-surface-2 border border-line-2 px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-accent" />
            </label>
            <label className="block text-xs text-ink-2">
              Passwort
              <input type="password" defaultValue="••••••••••" autoComplete="current-password"
                className="mt-1 w-full rounded-md bg-surface-2 border border-line-2 px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-accent" />
            </label>
            {error && <div className="text-xs text-status-critical">{error}</div>}
            <button className="w-full rounded-md border border-line-2 py-2 text-sm text-ink-1 hover:bg-surface-2">Anmelden</button>
          </form>
          <div className="mt-5 text-[11px] text-ink-3 leading-relaxed">
            Demo-Konten: <code className="text-ink-2">a.berger</code> (Ärztliche Leitung), <code className="text-ink-2">k.bauer</code> (Ordinationsmanagement).
            Andere AD-Konten, z. B. <code className="text-ink-2">l.gruber</code>, werden abgewiesen.
          </div>
        </div>
      </div>
    </div>
  )
}
