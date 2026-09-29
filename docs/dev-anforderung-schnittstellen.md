# Developer-Anforderung: Schnittstellen Diktara, Ordicall und Planery → Tycho

Version 1.0 · Stand 29.09.2026 · Empfänger: Entwicklungsteams Diktara, Ordicall; Integrationsteam Planery
Kontakt Produkt: Tycho-Produktverantwortung

## 0. Zweck und Grundregeln

Tycho ist eine **rein lesende** Kontrollinstanz auf dem Ordinationsserver. Sie liest Statistiken aus Diktara und Ordicall, um (a) Effizienz-Kennzahlen, (b) die **Abrechnungs-Kreuzprüfung** (Leistung dokumentiert vs. verrechnet) und (c) Termin-/Telefon-Auswertungen zu berechnen. Für Tailwind (HR-Modul) liest Tycho zusätzlich Zeit- und Abwesenheitsdaten aus Planery.

Nicht verhandelbare Regeln für alle drei Schnittstellen:

1. **Nur lesen.** Tycho ruft ausschließlich `GET`-Endpunkte auf bzw. liest Exportdateien. Es gibt keinen Endpunkt, über den Tycho etwas schreibt. Das liefernde System darf Tycho keine Schreibrechte einräumen.
2. **Keine Patientendaten.** Keine Namen, Geburtsdaten, SVNR, Telefonnummern, Adressen, Freitexte, Diagnosen im Klartext, Audio, Transkripte. Patient:innen werden vom liefernden System **pseudonymisiert** (HMAC-SHA-256 über die PVS-Patienten-ID mit einem **ordinationslokalen Salt**, siehe 4.1), damit Tycho Datensätze aus PVS, Diktara und Ordicall demselben Fall zuordnen kann, ohne die Person zu kennen.
3. **Lokal.** Daten verlassen die Ordination nicht. Schnittstellen laufen auf `localhost` bzw. über freigegebene Ordner auf dem Ordinationsserver. Kein Cloud-Relay.
4. **Signiert und versioniert.** Jeder Export bzw. jede Antwort trägt `schemaVersion`, `generatedAt`, `producer` und eine Signatur (Ed25519 über den kanonischen JSON-Body). Tycho verwirft unsignierte oder manipulierte Daten und protokolliert das.
5. **Vollständig und idempotent.** Exporte je Kalendertag, jederzeit erneut abrufbar (Nachlieferung bei Ausfall). Gleicher Tag → identischer Inhalt, sofern sich die Quelle nicht geändert hat.
6. **Zeitstempel** immer ISO 8601 mit Zeitzone (`2026-08-24T14:32:10+02:00`). IDs stabil über die Lebensdauer des Datensatzes.
7. **Mitarbeiter-Identität** ausschließlich über das AD-Konto (`sAMAccountName`, z. B. `m.hofer`) – nicht über Namen. Diktara und Ordicall müssen daher AD-Konten der Nutzer:innen kennen (SSO oder Zuordnungstabelle).

---

## 1. Diktara → Tycho

### 1.1 Transport

- Lokale HTTP-API des Diktara-Dienstes auf `https://127.0.0.1:7411` (internes Zertifikat) **oder** täglicher signierter JSON-Export in `\\<Server>\diktara-stats\YYYY-MM-DD.json`. Bevorzugt: API, Export als Fallback.
- Authentifizierung: Bearer-Token, das nur den Scope `stats:read` hat. Token wird bei der Installation erzeugt und von Tycho im TPM/DPAPI-NG gespeichert.
- Endpunkte:
  - `GET /v1/stats/sessions?date=YYYY-MM-DD` – alle Aufnahme-Sessions des Tages
  - `GET /v1/stats/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` – Tagesaggregate
  - `GET /v1/meta` – Version, Schema, Signatur-Public-Key

### 1.2 Datensatz `Session` (je Aufnahme/Konsultation)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `sessionId` | string (UUID) | ja | Stabile ID der Aufnahme |
| `userAccount` | string | ja | AD-Konto der Ärzt:in (`sAMAccountName`) |
| `patientPseudo` | string (hex, 32) | ja | HMAC-SHA-256(PVS-Patienten-ID, Salt), siehe 4.1 |
| `encounterRef` | string | nein | PVS-Fall-/Kontakt-ID, falls Diktara sie kennt (für exakte Zuordnung zum Leistungsblatt) |
| `startedAt` / `endedAt` | datetime | ja | Aufnahmezeitraum |
| `recordedSeconds` | int | ja | Netto-Aufnahmedauer |
| `processingSeconds` | int | ja | Zeit bis Zusammenfassung fertig |
| `summaryAcceptedAt` | datetime | nein | Zeitpunkt der Übernahme in die Kartei |
| `acceptance` | enum `unchanged` / `edited` / `rejected` | ja | Wurde die Zusammenfassung 1:1 übernommen? |
| `editCount` | int | ja | Anzahl Änderungen vor Übernahme |
| `editedCharsRatio` | float 0–1 | nein | Anteil geänderter Zeichen |
| `estimatedSavedSeconds` | int | ja | Diktara-Schätzung der gesparten Dokumentationszeit (Methode in `/v1/meta` dokumentieren) |
| `encounterType` | enum `inPerson` / `video` / `phone` / `homeVisit` | ja | Art der Konsultation |
| `detectedServices[]` | array | ja | Erkannte abrechenbare Leistungen (siehe 1.3) |
| `icd10Suggested[]` | array of string | nein | Vorgeschlagene ICD-10-Codes (nur Codes, kein Text) |
| `icd10Confirmed` | bool | nein | Hat die Ärzt:in einen ICD-10-Code bestätigt? |
| `docCompleteness` | float 0–1 | nein | Diktara-interne Vollständigkeitsbewertung (Anamnese, Befund, Prozedere, Leistungen) |
| `language` | string | nein | z. B. `de-AT` |

### 1.3 Datensatz `DetectedService` (Kern der Kreuzprüfung)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `code` | string | ja | Positionsnummer laut hinterlegter Honorarordnung (z. B. `EL10`, ÖGK-Wien-Code) – **nicht** Freitext |
| `catalog` | string | ja | Katalog-Kennung, z. B. `OEGK-W-AM-2026`, `SVS-2026`, `PRIVAT` |
| `confidence` | float 0–1 | ja | Erkennungssicherheit |
| `evidenceSpan` | object `{startSec, endSec}` | nein | Wo in der Aufnahme die Leistung erwähnt wurde (nur Zeitfenster, kein Text) |
| `quantity` | int | ja | Anzahl |
| `performedBy` | enum `physician` / `nurse` / `assistant` | nein | Für delegierte Leistungen (DGKP) |
| `confirmedByUser` | bool | nein | Hat die Ärzt:in die Leistung im Diktara-UI bestätigt? |

Anforderung: Diktara muss die Leistungserkennung gegen den **konfigurierten Leistungskatalog** der Ordination mappen. Tycho liefert den Katalog als JSON (`code`, `name`, `category`, `tarif`, `limit`, `rules`) über einen gemeinsamen Ordner; Diktara liest ihn ein. Nicht mappbare Erkennungen werden als `code: "UNMAPPED"` mit `category` gemeldet, nie als Freitext.

### 1.4 Tagesaggregat `DaySummary`

`date`, `userAccount`, `sessions`, `recordedSeconds`, `savedSecondsEstimated`, `acceptanceUnchangedRate`, `avgEditCount`, `detectedServicesCount`, `icd10ConfirmedRate`, `byEncounterType{}`.

### 1.5 Was Diktara **nicht** liefern darf

Audio, Transkript, Zusammenfassungstext, Patientenname, SVNR, Freitext-Diagnosen, Notizen. Ein Endpunkt, der so etwas ausgibt, darf für das Tycho-Token nicht erreichbar sein (Scope-Trennung).

### 1.6 Abnahmekriterien

- [ ] `GET /v1/stats/sessions` liefert für einen Testtag alle Sessions mit gültiger Signatur; Manipulation eines Bytes → Tycho lehnt ab.
- [ ] Jede Session mit `encounterType = video` in Diktara erscheint in Tycho als Video-Kontakt (Grundlage TM01/TM02-Plausibilität).
- [ ] Testfall „EKG dokumentiert“: Session mit `detectedServices[].code = EL10`, PVS ohne EL10 → Tycho erzeugt Finding „dokumentiert, nicht verrechnet“.
- [ ] `patientPseudo` für denselben Patienten stimmt mit dem Pseudonym aus dem PVS-Adapter überein (gleicher Salt, gleiche Eingabe-Normalisierung).
- [ ] Token mit Scope `stats:read` kann keinen anderen Diktara-Endpunkt aufrufen (401/403).
- [ ] Export eines Tages ist nach 30 Tagen erneut abrufbar und byte-identisch.

---

## 2. Ordicall → Tycho

### 2.1 Transport

- Täglicher signierter JSON-Export `\\<Server>\ordicall-stats\YYYY-MM-DD.json` (Ordicall schreibt, Tycho liest) **und/oder** lokale API `https://127.0.0.1:7412/v1/stats/...` analog zu Diktara. Da Ordicall teilweise in der Cloud läuft: Der Export wird von der Ordicall-Instanz erzeugt und über einen **ausgehenden** Kanal der Ordination (Ordicall-Client auf dem Server holt ab) abgelegt. Tycho selbst baut keine Verbindung nach außen auf.
- Zusätzlich für die Vorher-Baseline: einmaliger CDR-Import der alten Telefonanlage (CSV) – Format wird von Tycho toleriert.

### 2.2 Datensatz `Call`

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `callId` | string | ja | Stabile ID |
| `startedAt` / `endedAt` | datetime | ja | |
| `direction` | enum `inbound` / `outbound` | ja | Outbound = Erinnerungs-/Recall-Anrufe |
| `businessHours` | bool | ja | Innerhalb der konfigurierten Öffnungszeiten? |
| `outcome` | enum `aiResolved` / `transferred` / `voicemail` / `missed` / `abandoned` / `callback` | ja | |
| `waitSeconds` | int | ja | Bis Annahme (KI oder Mensch) |
| `aiSeconds` / `humanSeconds` | int | ja | Gesprächsanteile |
| `transferredToAccount` | string | nein | AD-Konto der Person, die übernommen hat (für Empfangs-Restlast) |
| `intent` | enum | ja | `appointment` / `prescription` / `result` / `referral` / `sickNote` / `info` / `other` |
| `intentConfidence` | float | ja | |
| `patientPseudo` | string | nein | Wenn Patient:in identifiziert wurde (HMAC, siehe 4.1); sonst leer |
| `appointment` | object | nein | Siehe 2.3 – wenn ein Termin gebucht/geändert/storniert wurde |
| `reminder` | object | nein | Bei Outbound: `{appointmentRef, result: reached/noAnswer/confirmed/cancelled}` |
| `satisfaction` | int 1–5 | nein | Antwort auf die SMS-Umfrage nach dem Anruf, falls vorhanden (für NPS-Modul) |
| `escalation` | bool | ja | Wurde an das Management eskaliert? |

### 2.3 Objekt `AppointmentAction`

| Feld | Typ | Beschreibung |
|---|---|---|
| `action` | enum `booked` / `rescheduled` / `cancelled` / `requestedCallback` | |
| `appointmentRef` | string | ID des PVS-Termins, falls Ordicall in den PVS-Kalender schreibt |
| `appointmentType` | enum `inPerson` / `video` / `phone` / `homeVisit` / `lab` / `vaccination` / `checkup` | **Pflicht** – Grundlage der TM01/TM02-Plausibilität |
| `providerAccount` | string | AD-Konto der Ärzt:in, bei der gebucht wurde |
| `scheduledAt` | datetime | |
| `leadTimeHours` | int | Vorlaufzeit Buchung → Termin (No-Show-Risiko) |

### 2.4 Tagesaggregat `DaySummary`

`date`, `total`, `byOutcome{}`, `byIntent{}`, `byHour[24]`, `afterHours`, `avgWaitSeconds`, `p90WaitSeconds`, `bookings`, `bookingsByType{}`, `remindersSent`, `remindersReached`, `escalations`, `aiHandledSeconds`.

### 2.5 Nicht liefern

Audio, Transkripte, Telefonnummern, Namen, Freitext des Anliegens. `intent` ist eine Kategorie, keine Zusammenfassung.

### 2.6 Abnahmekriterien

- [ ] Ein Anruf mit `appointment.action = booked, appointmentType = video` führt in Tycho zu einem erwarteten TM01 beim Termin; wird TM02 verrechnet → Finding.
- [ ] `transferredToAccount` ist für jeden `transferred`-Anruf befüllt (Restlast je Assistenz).
- [ ] Outbound-Erinnerungen mit `reminder.result` sind vollständig, damit Tycho die No-Show-Wirkung messen kann.
- [ ] Export enthält `byHour` und `afterHours` konsistent mit Einzeldatensätzen (Tycho prüft Summen).
- [ ] Signatur, Versionierung, Nachlieferung wie unter 0.

---

## 3. Planery → Tycho (Tailwind HR) – hochsicherheitskritisch

### 3.1 Transport und Rechte

- Planery-API mit einem **dedizierten, nur lesenden** Token, Scope exakt: `times:read`, `absences:read`, `balances:read`. Kein Zugriff auf Gehälter, Verträge, Dokumente, Notizen, Krankheitsgründe.
- Token wird im TPM/DPAPI-NG des Ordinationsservers abgelegt; Rotation alle 90 Tage; Widerruf in Planery muss den Zugriff sofort beenden.
- Tycho ruft die API einmal täglich nach Betriebsschluss ab, ausschließlich für Konten der eigenen Ordination (Mandant), und speichert die Daten in einem **eigenen verschlüsselten Store** (separater Schlüssel, separates Audit-Log, Aufbewahrung 12 Monate).
- Sichtbarkeit in Tycho: nur AD-Gruppe `G_Tailwind_HR` (plus Leitung im Pro-Person-Modus). Im Team-Modus nur Gruppensummen und namenlose Frühwarnungen.

### 3.1a Zusätzlicher Scope für die HR-Plattform: `shifts:read`

Tailwind HR misst Effizienz und Kosten je Person bzw. Gruppe. Dafür braucht Tycho zusätzlich zum Ist (Zeiterfassung) das **Soll aus dem Dienstplan**: `shifts[] {date, plannedStart, plannedEnd, role, location, breakMinutes}` je Mitarbeiter:in. Daraus berechnet Tycho Soll-Stunden, Überstunden (Ist − Soll, Zuschlag konfigurierbar), Besetzung je Wochentag × Stunde (gegen Patientenaufkommen aus dem Aufrufsystem) und Personalkostenquote (Kosten aus der Lohnverrechnung, nicht aus Planery). Planery liefert **keine** Gehaltsdaten an Tycho.

### 3.2 Benötigte Felder je Mitarbeiter:in und Monat

`employeeRef` (muss auf AD-Konto mappbar sein – Planery-Feld für `sAMAccountName` oder E-Mail = UPN), `period`, `targetHours`, `actualHours`, `overtimeBalanceHours`, `overtimeDeltaHours`, `vacationEntitlementDays`, `vacationTakenDays`, `vacationPlannedDays`, `sickDays` (nur Anzahl, keine Diagnose), `absences[] {from, to, type: vacation/training/timeOff/sick/other}`, `shifts[] {date, plannedStart, plannedEnd}` (für Besetzungslücken-Prüfung gegen Terminkalender und AD-Logon).

### 3.3 Abnahmekriterien

- [ ] Token mit obigem Scope kann keine Gehalts- oder Dokumentendaten abrufen (403).
- [ ] Widerruf des Tokens in Planery → nächster Tycho-Abruf schlägt fehl und wird im Audit-Log als `denied` protokolliert.
- [ ] Kein Datensatz enthält Freitext.
- [ ] Mapping `employeeRef → AD-Konto` ist für 100 % der aktiven Mitarbeiter:innen eindeutig.

---

## 4. Gemeinsame Bausteine

### 4.1 Pseudonymisierung

`patientPseudo = hex(HMAC-SHA-256(key = OrdinationSalt, message = normalize(PVS-Patienten-ID)))`
- `OrdinationSalt`: 32 Byte, erzeugt bei der Tycho-Installation, im TPM/DPAPI-NG gespeichert, an Diktara und Ordicall **einmalig** über einen geschützten Kanal (Installations-Wizard, Admin-Bestätigung) übergeben. Der Salt verlässt die Ordination nie.
- `normalize`: Trim, Großschreibung, ohne führende Nullen. Beide Seiten nutzen dieselbe Bibliotheksfunktion (Referenzimplementierung wird von Tycho bereitgestellt: TypeScript und C#).
- Rotation des Salts nur mit Neuberechnung aller Pseudonyme (Tycho-Admin-Funktion, protokolliert).

### 4.2 Signatur

Ed25519 über die kanonische JSON-Serialisierung (RFC 8785). Public Key des Produzenten wird bei der Installation in Tycho hinterlegt und über `/v1/meta` bzw. `meta.json` im Exportordner verifizierbar gemacht. Feldnamen: `signature`, `signatureKeyId`.

### 4.3 Umschlag (Envelope) für alle Exporte

```json
{
  "schemaVersion": "1.0",
  "producer": "diktara" | "ordicall" | "planery-adapter",
  "producerVersion": "3.4.1",
  "tenant": "ordination.local",
  "date": "2026-08-24",
  "generatedAt": "2026-08-24T19:05:52+02:00",
  "records": [ ... ],
  "summary": { ... },
  "signatureKeyId": "diktara-2026-01",
  "signature": "base64..."
}
```

### 4.4 Fehler- und Ausfallverhalten

- Fehlt ein Tagesexport, meldet Tycho die Quelle als „Hinweis“ und rechnet mit dem letzten vollständigen Stand; Nachlieferung wird beim nächsten Lauf automatisch verarbeitet.
- Schemaänderungen nur mit neuer `schemaVersion`; Tycho unterstützt die jeweils letzten zwei Versionen.

### 4.5 Testdaten

Beide Teams liefern einen anonymen Beispieltag (≥ 100 Datensätze) als signierte Datei, inklusive der Testfälle aus 1.6 und 2.6. Tycho stellt einen Validator (`tycho-validate <datei>`) bereit, der Schema und Signatur prüft.

---

## 5. Zeitplan (Vorschlag)

| Meilenstein | Diktara | Ordicall | Planery |
|---|---|---|---|
| Schema-Review, Rückfragen | KW 41 | KW 41 | KW 41 |
| Beispieltag signiert | KW 44 | KW 44 | KW 45 |
| Katalog-Mapping (1.3) produktiv | KW 47 | – | – |
| Terminart im Export (2.3) produktiv | – | KW 46 | – |
| Pilot in der eigenen Ordination | KW 49 | KW 49 | KW 50 |
