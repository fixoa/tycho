import { Info, Lock, ShieldCheck } from 'lucide-react'
import { Avatar, Card, ScoreRing, Bar as MiniBar, StatTile, Badge } from '../components/ui'
import { useAuth, isLeader } from '../state/auth'
import { usePersonMode } from '../state/config'
import { staffScores, componentPct, roleAverage } from '../data/score'
import { ROLE_LABEL } from '../data/staff'
import { hrById } from '../data/tailwind'
import { fmt } from '../lib/format'

export default function MeinScore() {
  const { session } = useAuth()
  const personMode = usePersonMode()
  if (!session) return null
  const me = session.user
  const s = staffScores().find((x) => x.staff.id === me.id)!
  const avg = roleAverage(me.role)
  const hr = hrById(me.id)
  const consent = me.consent === 'erteilt'
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Avatar name={me.name} hue={me.avatarHue} size={56} />
        <div className="flex-1">
          <h1 className="text-[15px] font-semibold text-ink-1">Mein Score</h1>
          <p className="text-[11.5px] text-ink-3 mt-0.5">{me.name} · {me.title} · Self-Service: Diese Ansicht sieht nur {me.name.split(' ').slice(-1)[0]} selbst{isLeader(me) ? ' (und die Leitung, sofern Pro-Person-Modus)' : ''}.</p>
        </div>
        {personMode && consent && <ScoreRing score={s.score} prev={s.prevScore} size={104} stroke={9} label="Score" />}
      </div>

      <div className="card px-4 py-3 flex items-center gap-3 text-xs text-ink-2">
        <ShieldCheck size={14} className="text-status-good shrink-0" />
        <span>Transparenz: Du siehst hier exakt die Werte, die Tycho über dich berechnet – und im Team-Modus nur Gruppenwerte. Zustimmungsstatus: <Badge tone={consent ? 'good' : 'neutral'}>{me.consent}</Badge> Du kannst die Zustimmung jederzeit bei der Ordinationsleitung widerrufen; der persönliche Score wird dann sofort deaktiviert.</span>
      </div>

      {!personMode ? (
        <Card title="Team-Modus aktiv">
          <div className="flex gap-3 items-start text-sm text-ink-2">
            <Lock size={18} className="text-accent shrink-0 mt-0.5" />
            <div>Die Ordination wertet nach Gruppen aus. Deine Gruppe <span className="text-ink-1">{ROLE_LABEL[me.role]}</span> hat aktuell einen Ø Score von <span className="text-ink-1 font-medium">{avg.score}</span>. Persönliche Kennzahlen werden nicht berechnet oder gespeichert. Deine eigenen Rohwerte (Kontakte, Anrufe, Dokumentation) kannst du unten trotzdem sehen – sie verlassen diese Seite nicht.</div>
          </div>
        </Card>
      ) : !consent ? (
        <Card title="Kein persönlicher Score">
          <div className="text-sm text-ink-2">Für dich liegt nur die Zustimmung zur aggregierten Auswertung vor. Deine Gruppe {ROLE_LABEL[me.role]}: Ø {avg.score}.</div>
        </Card>
      ) : (
        <Card title="Score-Aufschlüsselung" subtitle={`Ø deiner Gruppe (${ROLE_LABEL[me.role]}): ${avg.score}`}>
          <div className="space-y-3">
            {s.components.map((c) => {
              const pct = componentPct(c)
              const show = (v: number) => c.unit === '' ? fmt.pct1(v) : c.unit === '×' ? `${fmt.num1(v)}×` : `${fmt.num1(v)} ${c.unit}`
              return (
                <div key={c.key}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-ink-1 inline-flex items-center gap-1" title={c.hint}>{c.label} <Info size={10} className="text-ink-3" /></span><span className="text-ink-3 tabular">{show(c.value)} / {c.invert ? '≤ ' : ''}{show(c.target)} · <span className="text-ink-1">{pct} %</span></span></div>
                  <MiniBar value={pct} max={100} tone={pct >= 90 ? '#4fb3a8' : pct >= 70 ? '#b9bb5f' : '#d9834a'} height={5} />
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Präsenz (4 Wo.)" value={`${fmt.num(s.kpis.presenceH)} h`} deltaLabel="AD-Logon → Logoff" />
        <StatTile label="Kontakte" value={fmt.num(s.kpis.contacts)} deltaLabel={`${fmt.num1(s.kpis.contactsPerHour)} je Stunde`} />
        {me.role === 'arzt' && <StatTile label="Diktara-Nutzung" value={fmt.pct(s.kpis.diktaraShare)} deltaLabel={`${fmt.minutes(s.kpis.savedMin)} gespart`} />}
        {me.role === 'assistenz' && <StatTile label="Anrufe manuell" value={fmt.num(s.kpis.calls)} deltaLabel="nach Ordicall" />}
        {hr && <StatTile label="Überstundensaldo" value={`${hr.overtimeBalanceH} h`} deltaLabel={`Urlaubsrest ${hr.vacationDays - hr.vacationTaken} Tage · Planery`} />}
      </div>
    </div>
  )
}
