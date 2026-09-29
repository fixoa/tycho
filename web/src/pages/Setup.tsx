import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserSearch, ShieldAlert, CheckCircle2, Lock } from 'lucide-react'
import { useAuth, isAdmin } from '../state/auth'
import { useConfig, DEFAULT_MODULES, type AnalysisMode } from '../state/config'
import { Badge } from '../components/ui'

export default function Setup() {
  const { session } = useAuth()
  const { config, save } = useConfig()
  const nav = useNavigate()
  const [mode, setMode] = useState<AnalysisMode>(config?.analysisMode ?? 'team')
  const [nda, setNda] = useState(config?.ndaAccepted ?? false)
  const [confirm, setConfirm] = useState('')
  const admin = session ? isAdmin(session.user) : false
  const canSave = admin && (mode === 'team' || (nda && confirm.trim().toUpperCase() === 'PRO PERSON'))

  const submit = () => {
    if (!canSave || !session) return
    save({ analysisMode: mode, ndaAccepted: mode === 'person' ? nda : false, configuredBy: session.user.account, configuredAt: new Date().toISOString(), kAnonymity: config?.kAnonymity ?? 5, modules: config?.modules ?? DEFAULT_MODULES })
    nav('/station')
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-surface-0">
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <div className="text-xs text-ink-3 uppercase tracking-wider mb-1">Erstkonfiguration · Schritt 1 von 1</div>
          <h1 className="text-2xl font-semibold">Wie soll Tycho das Personal analysieren?</h1>
          <p className="text-sm text-ink-2 mt-1 max-w-2xl">Diese Entscheidung trifft der Haupt-Admin einmalig. Sie wird im Audit-Log festgehalten und kann später nur in den Einstellungen mit erneuter Bestätigung geändert werden.</p>
        </div>

        {!admin && (
          <div className="card p-4 flex items-center gap-3 text-sm text-ink-2"><Lock size={16} className="text-status-warning" /> Nur Mitglieder der AD-Gruppe G_Tycho_Admin können die Erstkonfiguration abschließen. Angemeldet: {session?.user.name}.</div>
        )}

        {/* Switch */}
        <div className="grid md:grid-cols-2 gap-4">
          <button onClick={() => setMode('team')} className={`card text-left p-5 border-2 transition ${mode === 'team' ? 'border-accent' : 'border-line-1 hover:border-line-2'}`}>
            <div className="flex items-center gap-2 mb-2"><Users size={18} className="text-accent" /><span className="font-semibold">Team-basiert</span>{mode === 'team' && <Badge tone="info">gewählt</Badge>}</div>
            <p className="text-sm text-ink-2 leading-relaxed">Tycho analysiert nach Gruppen: Ärztegruppe, Assistenzgruppe, Pflege-/Laborgruppe, Verwaltung. Es gibt keine Einzelwerte, keine Rankings und keinen persönlichen Score – nur Gruppenkennzahlen mit k-Anonymität (mindestens 5 Personen je Gruppe, kleinere Gruppen werden zusammengefasst).</p>
            <ul className="text-xs text-ink-3 mt-3 space-y-1">
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-status-good" /> Keine Einzelzustimmung nach § 10 AVRAG nötig</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-status-good" /> Kein Hochrisiko-System im Sinne des AI Act</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-status-good" /> DSFA mit geringerem Umfang</li>
            </ul>
          </button>

          <button onClick={() => setMode('person')} className={`card text-left p-5 border-2 transition ${mode === 'person' ? 'border-status-critical' : 'border-line-1 hover:border-line-2'}`}>
            <div className="flex items-center gap-2 mb-2"><UserSearch size={18} className="text-status-critical" /><span className="font-semibold">Pro Person</span>{mode === 'person' && <Badge tone="critical">gewählt</Badge>}</div>
            <p className="text-sm text-ink-2 leading-relaxed">Tycho berechnet für jede Mitarbeiterin und jeden Mitarbeiter einen eigenen Efficacy Score mit vollständiger Aufschlüsselung, Kosten, Ertrag, Rangliste und Verlauf.</p>
            <div className="mt-3 rounded border border-status-critical/40 bg-status-critical/10 p-3 text-xs text-ink-1 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-status-critical mb-1"><ShieldAlert size={14} /> ACHTUNG</div>
              Erfordert eine unterzeichnete NDA und beabsichtigt die volle Kontrolle über das Personal – auf eigene Gefahr. Sie sind als Ordinationsinhaber:in dafür verantwortlich, dass jede betroffene Person eine freiwillige, widerrufbare Zustimmung erteilt hat (§ 10 AVRAG, § 96 Abs 1 Z 3 ArbVG), eine DSFA vorliegt und kein Betriebsrat übergangen wird. Tycho deaktiviert den Einzelscore automatisch, sobald eine Zustimmung fehlt oder widerrufen wird.
            </div>
          </button>
        </div>

        {mode === 'person' && (
          <div className="card p-5 space-y-3">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} className="mt-1 accent-[var(--accent)]" />
              <span className="text-ink-2">Ich habe die NDA und den Hinweis zur Verantwortung gelesen und akzeptiere sie im Namen der Ordination. Ich weiß, dass diese Wahl im Audit-Log mit meinem AD-Konto protokolliert wird.</span>
            </label>
            <label className="block text-sm text-ink-2">
              Zur Bestätigung <span className="font-mono text-ink-1">PRO PERSON</span> eingeben
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full max-w-xs rounded bg-surface-2 border border-line-2 px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-status-critical" />
            </label>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-ink-3">Angemeldet als {session?.user.name} ({session?.user.account}) {admin ? '· G_Tycho_Admin' : ''}</div>
          <button onClick={submit} disabled={!canSave} className={`px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-40 ${mode === 'person' ? 'bg-status-critical' : 'bg-accent'}`}>
            {mode === 'person' ? 'Pro-Person-Analyse aktivieren' : 'Team-basierte Analyse aktivieren'}
          </button>
        </div>
      </div>
    </div>
  )
}
