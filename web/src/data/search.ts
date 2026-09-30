import { STAFF, ROLE_LABEL } from './staff'
import { demo, BILLING_FINDINGS } from './mock'
import { invoices } from './tailwind'
import { REFERRERS } from './extras'
import { ALL_ITEMS } from '../nav'

export interface Hit { kind: string; title: string; sub: string; to: string }
export function searchAll(q: string): Hit[] {
  const t = q.toLowerCase()
  const hits: Hit[] = []
  for (const s of STAFF) if (`${s.name} ${s.account} ${s.title}`.toLowerCase().includes(t)) hits.push({ kind: ROLE_LABEL[s.role], title: s.name, sub: `${s.title} · ${s.account}`, to: `/team/${s.id}` })
  for (const p of demo().services) if (`${p.code} ${p.name}`.toLowerCase().includes(t)) hits.push({ kind: 'Position', title: `${p.code} · ${p.name}`, sub: p.rule || p.category, to: '/tarife' })
  for (const f of BILLING_FINDINGS) if (`${f.id} ${f.title}`.toLowerCase().includes(t)) hits.push({ kind: 'Finding', title: f.title, sub: `${f.id} · ${f.source}`, to: '/tarife' })
  for (const i of invoices().slice(0, 200)) if (`${i.id} ${i.patientPseudo} ${i.kind}`.toLowerCase().includes(t)) hits.push({ kind: 'Honorarnote', title: `${i.id} · ${i.kind}`, sub: `${i.patientPseudo} · ${i.status}`, to: '/tailwind' })
  for (const r of REFERRERS) if (r.name.toLowerCase().includes(t)) hits.push({ kind: 'Zuweiser', title: r.name, sub: r.type, to: '/zuweiser' })
  for (const i of ALL_ITEMS) if (`${i.label} ${i.hint ?? ''}`.toLowerCase().includes(t)) hits.push({ kind: 'Seite', title: i.label, sub: i.hint ?? i.to, to: i.to })
  return hits
}
