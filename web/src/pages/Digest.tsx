import { useState } from 'react'
import { Mail, Download, Lock, CalendarDays, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import { Badge, Card } from '../components/ui'
import { BILLING_FINDINGS, PREV_QUARTER, QUARTER, demo } from '../data/mock'
import { practiceScore, staffScores } from '../data/score'
import { compareWindows } from '../data/aggregate'
import { fmt } from '../lib/format'
import { ROLE_LABEL } from '../data/staff'
import { usePersonMode } from '../state/config'
import { roleAverage } from '../data/score'
import { tailwindSummary } from '../data/tailwind'

export default function Digest() {
  const { forecast } = demo()
  const ps = practiceScore()
  const personMode = usePersonMode()
  const tw = tailwindSummary()
  const { cur, prev } = compareWindows(5)
  const [sent, setSent] = useState(false)
  const top = staffScores().filter((s) => s.staff.role !== 'management').sort((a, b) => (b.score - b.prevScore) - (a.score - a.prevScore))
  const open = BILLING_FINDINGS.filter((f) => f.valueEur > 0).reduce((a, f) => a + f.valueEur, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[15px] font-semibold text-ink-1">Tycho Digest</h1>
          <p className="text-[11.5px] text-ink-3 mt-0.5">Wöchentliche Übersicht · jeden Montag 06:00 · verschlüsselt per S/MIME an die Leitung · Archiv im verschlüsselten Store</p>
        </div>
        <div className="flex gap-2">
          <button className="text-xs px-3 py-1.5 rounded border border-line-2 text-ink-1 hover:bg-surface-2 inline-flex items-center gap-1"><Download size={13} /> PDF</button>
          <button onClick={() => setSent(true)} className="text-xs px-3 py-1.5 rounded bg-accent text-white inline-flex items-center gap-1 hover:brightness-110"><Mail size={13} /> {sent ? 'Gesendet ✓' : 'Jetzt senden'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        {/* Email preview */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-line-1 text-xs text-ink-3 space-y-0.5">
            <div><span className="inline-block w-14">Von</span> <span className="text-ink-2">Tycho &lt;tycho@ordination.local&gt;</span></div>
            <div><span className="inline-block w-14">An</span> <span className="text-ink-2">leitung@ordination.local · a.berger · k.bauer</span></div>
            <div><span className="inline-block w-14">Betreff</span> <span className="text-ink-1">Tycho Digest KW 35 · {QUARTER.label} · Prognose {fmt.eur(forecast.projected)} · Score {ps.score}</span></div>
            <div className="flex items-center gap-1 pt-1"><Lock size={11} /> S/MIME-verschlüsselt · Anhang: digest-2026-KW35.pdf (verschlüsselt)</div>
          </div>
          <div className="p-6 space-y-5 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-3 mb-1">Montag, 24. August 2026</div>
              <h2 className="text-lg font-semibold">Guten Morgen, Dr. Berger.</h2>
              <p className="text-ink-2 mt-1">Die Woche in einem Satz: Die Ordination läuft {fmt.pct1((forecast.projected - PREV_QUARTER.revenue) / PREV_QUARTER.revenue)} über dem Vorquartal, der Score steigt auf {ps.score} – und {fmt.eur(open)} liegen noch unverrechnet im Leistungsblatt.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Efficacy Score', `${ps.score}`, `${fmt.signed(ps.score - ps.prev)} zur Vorwoche`],
                ['Prognose Quartal', fmt.eur(forecast.projected), `${fmt.eur(forecast.lower)} – ${fmt.eur(forecast.upper)}`],
                ['Kontakte KW 34', fmt.num(cur.contacts), `${fmt.signed(Math.round(((cur.contacts - prev.contacts) / prev.contacts) * 100))} % zur Vorwoche`],
                ['Telemedizin', fmt.pct1(cur.telemedShare), 'Ziel 15 %'],
              ].map(([l, v, s]) => (
                <div key={l} className="rounded bg-surface-2 px-3 py-2.5">
                  <div className="text-[11px] text-ink-3">{l}</div>
                  <div className="text-lg font-semibold">{v}</div>
                  <div className="text-[11px] text-ink-3">{s}</div>
                </div>
              ))}
            </div>

            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><CheckCircle2 size={15} className="text-status-good" /> Was gut lief</h3>
              <ul className="list-disc pl-5 text-ink-2 space-y-1">
                <li>Ordicall hat {fmt.pct(0.74)} aller Anrufe abschließend erledigt – Rekordwoche. Verpasste Anrufe: 2,6 %.</li>
                <li>Diktara sparte {fmt.minutes(cur.savedMin)} Dokumentationszeit; Dr. Lindner dokumentiert 97 % der Kontakte mit KI.</li>
                <li>No-Show-Rate {fmt.pct1(cur.noShowRate)} – niedrigster Wert seit Einführung der Erinnerungsanrufe.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><AlertTriangle size={15} className="text-status-serious" /> Bitte diese Woche erledigen</h3>
              <ul className="list-disc pl-5 text-ink-2 space-y-1">
                {BILLING_FINDINGS.slice(0, 4).map((f) => <li key={f.id}>{f.title} <span className="text-ink-3">({fmt.eur2(f.valueEur)})</span></li>)}
                <li>ÖGK-Quartalsabrechnung Q3: Einreichung bis 10. Oktober · BVAEB August bis 10. September.</li>
                <li>Tailwind: {fmt.eur(tw.overdueSum)} überfällige Privathonorare, {tw.wahonlineMissing} Honorarnoten ohne WAHonline-Übermittlung – Maßnahmenliste liegt bereit.</li>
                <li>Planery: 4 HR-Frühwarnungen (Überstunden, Urlaubsrest, Besetzungslücke Empfang ab 28.09.).</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><TrendingUp size={15} className="text-series-1" /> Team</h3>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-ink-2">
                {!personMode && (['arzt', 'dgkp', 'assistenz'] as const).map((r) => { const a = roleAverage(r); return <div key={r} className="flex justify-between"><span>{ROLE_LABEL[r]}</span><span className="tabular">{a.score} ({fmt.signed(a.score - a.prev)})</span></div> })}
                {personMode && top.map((s) => (
                  <div key={s.staff.id} className="flex justify-between"><span>{s.staff.name} <span className="text-ink-3">· {ROLE_LABEL[s.staff.role]}</span></span><span className="tabular">{s.staff.consent === 'nur-aggregiert' ? '–' : `${s.score} (${fmt.signed(s.score - s.prevScore)})`}</span></div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><CalendarDays size={15} className="text-series-7" /> Ausblick</h3>
              <p className="text-ink-2">Limit EL21 wird am 04.09. erreicht. Freie Kapazität Mo–Do 12–14 Uhr: 412 fällige Vorsorgeuntersuchungen könnten per Ordicall-Recall gefüllt werden (Potenzial ≈ {fmt.eur(412 * 71.8)}). Dr. Novak: Videokonsultationen als TM01 statt TM02 verrechnen (+9,10 € je Fall).</p>
            </section>

            <div className="pt-4 border-t border-line-1 text-[11px] text-ink-3">
              Erstellt am 24.08.2026 05:41 aus Datenstand 23.08.2026 · Alle Daten lesend erhoben, lokal auf TS-ORD-01 verarbeitet · Score ist Entscheidungshilfe, keine automatische Bewertung · Personen mit „nur aggregiert“ werden nicht einzeln ausgewiesen.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card title="Versandplan">
            <ul className="text-xs text-ink-2 space-y-2">
              <li className="flex justify-between"><span>Rhythmus</span><span className="text-ink-1">wöchentlich, Montag 06:00</span></li>
              <li className="flex justify-between"><span>Empfänger</span><span className="text-ink-1">AD-Gruppe G_Tycho_Leitung</span></li>
              <li className="flex justify-between"><span>Transport</span><span className="text-ink-1">lokaler SMTP-Relay, S/MIME</span></li>
              <li className="flex justify-between"><span>Quartalsreport</span><span className="text-ink-1">1. Werktag nach Quartalsende</span></li>
              <li className="flex justify-between"><span>Personen-Auszug</span><span className="text-ink-1">jede:r sieht nur sich selbst</span></li>
            </ul>
          </Card>
          <Card title="Archiv">
            <ul className="text-xs space-y-1.5">
              {['KW 34 · 17.08.', 'KW 33 · 10.08.', 'KW 32 · 03.08.', 'KW 31 · 27.07.', 'KW 30 · 20.07.', 'Q2 2026 · Quartalsreport'].map((d, i) => (
                <li key={d} className="flex items-center justify-between text-ink-2 hover:text-ink-1 cursor-pointer"><span>{d}</span>{i === 0 ? <Badge tone="good">gesendet</Badge> : <Lock size={11} className="text-ink-3" />}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
