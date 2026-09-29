import type { StaffMember } from './types'

// Personalstamm – in Produktion aus Microsoft Active Directory (LDAP, read-only):
// sAMAccountName, userPrincipalName, displayName, title, department, memberOf.
// Kosten/FTE kommen aus dem Dienstplan bzw. der Lohnverrechnung (Import, read-only).
export const STAFF: StaffMember[] = [
  { id: 'a.berger', account: 'a.berger', upn: 'a.berger@ordination.local', name: 'Dr. Anna Berger', title: 'Ärztliche Leitung · Allgemeinmedizin', role: 'arzt', department: 'Ärzte', fte: 1, costPerMonth: 14500, adGroups: ['G_Aerzte', 'G_Diktara', 'G_Tycho_Leitung'], consent: 'erteilt', avatarHue: 210, since: '2014-03-01' },
  { id: 'm.hofer', account: 'm.hofer', upn: 'm.hofer@ordination.local', name: 'Dr. Markus Hofer', title: 'Allgemeinmedizin', role: 'arzt', department: 'Ärzte', fte: 1, costPerMonth: 12800, adGroups: ['G_Aerzte', 'G_Diktara'], consent: 'erteilt', avatarHue: 20, since: '2017-09-01' },
  { id: 's.lindner', account: 's.lindner', upn: 's.lindner@ordination.local', name: 'Dr. Sarah Lindner', title: 'Allgemeinmedizin · Teilzeit', role: 'arzt', department: 'Ärzte', fte: 0.6, costPerMonth: 7900, adGroups: ['G_Aerzte', 'G_Diktara'], consent: 'erteilt', avatarHue: 160, since: '2021-01-11' },
  { id: 't.novak', account: 't.novak', upn: 't.novak@ordination.local', name: 'Dr. Tomas Novak', title: 'Allgemeinmedizin · seit 03/2026', role: 'arzt', department: 'Ärzte', fte: 0.8, costPerMonth: 10200, adGroups: ['G_Aerzte', 'G_Diktara'], consent: 'erteilt', avatarHue: 40, since: '2026-03-02' },
  { id: 'm.steiner', account: 'm.steiner', upn: 'm.steiner@ordination.local', name: 'Maria Steiner', title: 'DGKP · Pflegeleitung', role: 'dgkp', department: 'Pflege', fte: 1, costPerMonth: 5600, adGroups: ['G_Pflege'], consent: 'erteilt', avatarHue: 330, since: '2016-05-02' },
  { id: 'j.pichler', account: 'j.pichler', upn: 'j.pichler@ordination.local', name: 'Jonas Pichler', title: 'DGKP', role: 'dgkp', department: 'Pflege', fte: 0.75, costPerMonth: 4300, adGroups: ['G_Pflege'], consent: 'erteilt', avatarHue: 120, since: '2023-10-02' },
  { id: 'p.maier', account: 'p.maier', upn: 'p.maier@ordination.local', name: 'Petra Maier', title: 'Ordinationsassistenz · Leitung', role: 'assistenz', department: 'Empfang', fte: 1, costPerMonth: 4100, adGroups: ['G_Empfang', 'G_Ordicall_Admin'], consent: 'erteilt', avatarHue: 260, since: '2012-02-01' },
  { id: 'l.gruber', account: 'l.gruber', upn: 'l.gruber@ordination.local', name: 'Lena Gruber', title: 'Ordinationsassistenz', role: 'assistenz', department: 'Empfang', fte: 1, costPerMonth: 3700, adGroups: ['G_Empfang'], consent: 'erteilt', avatarHue: 0, since: '2019-06-03' },
  { id: 's.yilmaz', account: 's.yilmaz', upn: 's.yilmaz@ordination.local', name: 'Selin Yilmaz', title: 'Ordinationsassistenz · Teilzeit', role: 'assistenz', department: 'Empfang', fte: 0.5, costPerMonth: 1900, adGroups: ['G_Empfang'], consent: 'nur-aggregiert', avatarHue: 190, since: '2024-09-02' },
  { id: 'c.wolf', account: 'c.wolf', upn: 'c.wolf@ordination.local', name: 'Claudia Wolf', title: 'Ordinationsassistenz', role: 'assistenz', department: 'Empfang', fte: 1, costPerMonth: 3750, adGroups: ['G_Empfang'], consent: 'erteilt', avatarHue: 80, since: '2018-11-05' },
  { id: 'k.bauer', account: 'k.bauer', upn: 'k.bauer@ordination.local', name: 'Kevin Bauer', title: 'Ordinationsmanagement', role: 'management', department: 'Verwaltung', fte: 1, costPerMonth: 5200, adGroups: ['G_Verwaltung', 'G_Tycho_Leitung'], consent: 'erteilt', avatarHue: 300, since: '2020-04-01' },
]

export const ROLE_LABEL: Record<StaffMember['role'], string> = {
  arzt: 'Ärzt:in',
  dgkp: 'DGKP',
  assistenz: 'Ordinationsassistenz',
  management: 'Management',
}

export const staffById = (id: string) => STAFF.find((s) => s.id === id)
