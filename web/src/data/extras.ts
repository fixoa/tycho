// Zusatzmodule: Zuweiser, Verordnungen, QM-Fristen, NPS – Demo-Daten (read-only aus PVS bzw. Import)

export interface Referrer { name: string; type: 'Facharzt' | 'Spital' | 'PVE' | 'Physio' | 'Sonstige'; q3: number; q2: number; q3prev: number; abc: 'A' | 'B' | 'C'; lastReferral: string; value: number }
export const REFERRERS: Referrer[] = [
  { name: 'Dr. Weiss, Orthopädie', type: 'Facharzt', q3: 41, q2: 70, q3prev: 62, abc: 'A', lastReferral: '2026-08-21', value: 3120 },
  { name: 'Klinik Floridsdorf, Ambulanz', type: 'Spital', q3: 37, q2: 83, q3prev: 77, abc: 'A', lastReferral: '2026-08-19', value: 2890 },
  { name: 'PVE Donaustadt', type: 'PVE', q3: 29, q2: 34, q3prev: 19, abc: 'A', lastReferral: '2026-08-24', value: 2240 },
  { name: 'Dr. Kern, Gynäkologie', type: 'Facharzt', q3: 22, q2: 38, q3prev: 32, abc: 'B', lastReferral: '2026-08-18', value: 1610 },
  { name: 'Physio Mag. Reiter', type: 'Physio', q3: 18, q2: 27, q3prev: 14, abc: 'B', lastReferral: '2026-08-22', value: 980 },
  { name: 'Dr. Aigner, Dermatologie', type: 'Facharzt', q3: 14, q2: 30, q3prev: 34, abc: 'B', lastReferral: '2026-08-05', value: 1030 },
  { name: 'Dr. Lang, Innere Medizin', type: 'Facharzt', q3: 3, q2: 26, q3prev: 29, abc: 'C', lastReferral: '2026-07-09', value: 240 },
  { name: 'Dr. Petrovic, HNO', type: 'Facharzt', q3: 9, q2: 13, q3prev: 16, abc: 'C', lastReferral: '2026-08-12', value: 660 },
  { name: 'Betriebsarzt ÖBB Werkstätte', type: 'Sonstige', q3: 11, q2: 10, q3prev: 0, abc: 'C', lastReferral: '2026-08-20', value: 790 },
]

export interface PrescribingRow { staffId: string; costPerPatient: number; peer: number; genericRate: number; peerGeneric: number; outliers: number; topAtc: string }
export const PRESCRIBING: PrescribingRow[] = [
  { staffId: 'a.berger', costPerPatient: 38.4, peer: 41.2, genericRate: 0.83, peerGeneric: 0.79, outliers: 1, topAtc: 'C09 (RAS-Hemmer)' },
  { staffId: 'm.hofer', costPerPatient: 52.7, peer: 41.2, genericRate: 0.68, peerGeneric: 0.79, outliers: 6, topAtc: 'A10 (Antidiabetika)' },
  { staffId: 's.lindner', costPerPatient: 36.1, peer: 41.2, genericRate: 0.86, peerGeneric: 0.79, outliers: 0, topAtc: 'N06 (Antidepressiva)' },
  { staffId: 't.novak', costPerPatient: 44.9, peer: 41.2, genericRate: 0.74, peerGeneric: 0.79, outliers: 3, topAtc: 'M01 (NSAR)' },
]
export const PRESCRIBING_OUTLIERS = [
  { staffId: 'm.hofer', drug: 'Originalpräparat DPP-4-Hemmer statt Generikum', n: 14, saving: 612 },
  { staffId: 'm.hofer', drug: 'PPI-Dauerverordnung > 8 Wochen ohne Indikationscode', n: 9, saving: 180 },
  { staffId: 't.novak', drug: 'NSAR ohne Magenschutz bei > 65 J.', n: 3, saving: 0 },
  { staffId: 'a.berger', drug: 'Statin: Wechsel auf ÖKO-Tool-Empfehlung möglich', n: 5, saving: 95 },
]

export interface QmItem { item: string; category: 'Geräteprüfung' | 'Schulung' | 'Hygiene' | 'Dokument' | 'Meldung'; due: string; responsible: string; status: 'ok' | 'bald' | 'ueberfaellig' }
export const QM: QmItem[] = [
  { item: 'Sicherheitstechnische Kontrolle EKG-Gerät', category: 'Geräteprüfung', due: '2026-09-02', responsible: 'm.steiner', status: 'bald' },
  { item: 'Defibrillator (AED) Funktionsprüfung', category: 'Geräteprüfung', due: '2026-08-15', responsible: 'm.steiner', status: 'ueberfaellig' },
  { item: 'Kühlschrank-Temperaturprotokoll Impfstoffe', category: 'Hygiene', due: '2026-08-31', responsible: 'l.gruber', status: 'bald' },
  { item: 'Erste-Hilfe-Auffrischung Team', category: 'Schulung', due: '2026-11-30', responsible: 'k.bauer', status: 'ok' },
  { item: 'Datenschutz-Schulung (jährlich)', category: 'Schulung', due: '2026-10-15', responsible: 'k.bauer', status: 'ok' },
  { item: 'Hygieneplan Review', category: 'Hygiene', due: '2026-09-30', responsible: 'm.steiner', status: 'bald' },
  { item: 'Spirometer Kalibrierung', category: 'Geräteprüfung', due: '2026-12-01', responsible: 'j.pichler', status: 'ok' },
  { item: 'Verarbeitungsverzeichnis aktualisieren (Tycho, Tailwind)', category: 'Dokument', due: '2026-09-15', responsible: 'k.bauer', status: 'bald' },
  { item: 'Röntgen-Strahlenschutz (n. a. – kein Gerät)', category: 'Meldung', due: '2027-01-01', responsible: 'a.berger', status: 'ok' },
  { item: 'Arbeitsplatzevaluierung', category: 'Dokument', due: '2026-07-31', responsible: 'k.bauer', status: 'ueberfaellig' },
]

export const NPS = {
  score: 62, prev: 54, responses: 318, promoters: 0.71, passives: 0.2, detractors: 0.09,
  sources: [{ name: 'Google Rezensionen', n: 141, avg: 4.6 }, { name: 'Umfrage nach Termin (Ordicall SMS)', n: 177, avg: 4.4 }],
  monthly: [{ m: 'Mär', nps: 48 }, { m: 'Apr', nps: 51 }, { m: 'Mai', nps: 54 }, { m: 'Jun', nps: 58 }, { m: 'Jul', nps: 60 }, { m: 'Aug', nps: 62 }],
  themes: [
    { theme: 'Telefonische Erreichbarkeit', sentiment: 0.81, n: 96, delta: 0.34 },
    { theme: 'Wartezeit in der Ordination', sentiment: 0.42, n: 74, delta: 0.05 },
    { theme: 'Freundlichkeit Empfang', sentiment: 0.88, n: 61, delta: 0.02 },
    { theme: 'Ärztliche Zeit im Gespräch', sentiment: 0.77, n: 58, delta: 0.09 },
    { theme: 'Terminverfügbarkeit', sentiment: 0.55, n: 43, delta: 0.12 },
  ],
  quotes: [
    { text: 'Endlich geht jemand ans Telefon, auch am Abend. Termin in 2 Minuten erledigt.', rating: 5, source: 'Google' },
    { text: 'Ärztin nimmt sich Zeit, aber 40 Minuten Wartezeit am Montag sind zu viel.', rating: 3, source: 'Umfrage' },
    { text: 'Videotermin hat perfekt funktioniert, Rezept war sofort in der Apotheke.', rating: 5, source: 'Umfrage' },
  ],
}
