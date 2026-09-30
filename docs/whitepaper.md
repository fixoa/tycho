# Tycho – Whitepaper

**Die lokale Kontrollinstanz für Ordinationen. Liest nur. Verlässt nie das Haus.**

Version 1.0 · September 2026 · Tycho Demo

---

## Zusammenfassung

Tycho ist eine Analyse- und Kontrollplattform für Arztpraxen und Primärversorgungseinheiten in Österreich. Sie liest die Daten, die in einer Ordination ohnehin entstehen (Praxisverwaltungssystem, Telefon-KI, Diktat-KI, Terminkalender, Dienstplan, Zahlungseingänge), verdichtet sie zu wenigen belastbaren Kennzahlen und beantwortet Fragen der Leitung in natürlicher Sprache. Drei Eigenschaften unterscheiden Tycho von Cloud-Analytik:

1. **Lokal und abgekapselt.** Tycho läuft vollständig auf dem Ordinationsserver. Es gibt keine ausgehende Verbindung, keinen Cloud-Dienst, keinen Telemetrie-Kanal. Auch das Sprachmodell des Assistenten läuft lokal.
2. **Nur lesend.** Tycho schreibt in kein Quellsystem. Datenbank-Logins sind auf `SELECT` beschränkt, gelesen wird von Snapshots statt aus der Produktivdatenbank, und ein täglicher Schreib-Selbsttest muss scheitern. Für die Quellsysteme ist Tycho ein weiterer Benutzer mit Leserechten, nicht mehr.
3. **Verschlüsselt und nachvollziehbar.** Alle Ergebnisse liegen AES-256-GCM-verschlüsselt mit Schlüsseln im TPM. Jeder Zugriff steht in einer append-only-Audit-Kette.

Der Nutzen für die Ordination: der **Efficacy Score** als eine Zahl für den Zustand des Betriebs, eine **Quartalsprognose** auf Basis der laufenden Abrechnung, die **Kreuzprüfung** von Leistungsziffern gegen Dokumentation und Anrufe (liegengelassene Honorare), ein **HR-Bild** aus Dienstplan und Ertrag je Stunde, und ein wöchentlicher **Digest** für die Leitung.

---

## 1. Ausgangslage

Eine Ordination erzeugt jeden Tag Daten in sechs bis acht getrennten Systemen. Das PVS kennt Leistungen und Termine, die Telefon-KI kennt Anrufe und Anliegen, die Diktat-KI kennt Dokumentationszeiten, der Dienstplan kennt Anwesenheiten, die Bank kennt Zahlungseingänge. Niemand sieht das Ganze. Fragen wie „Wie liegen wir im Quartal?“, „Was haben wir nicht abgerechnet?“ oder „Wer ist überlastet?“ werden mit Gefühl oder mit Excel beantwortet, meist Wochen zu spät.

Cloud-Analytik löst das technisch, scheitert aber an der Realität der Ordination: Gesundheitsdaten nach Art. 9 DSGVO, ärztliche Verschwiegenheit nach § 54 ÄrzteG, Personaldaten unter § 96 ArbVG, und ein Berufsstand, der zu Recht keine Kopie seiner Kartei bei einem Anbieter haben will.

Tycho setzt deshalb einen anderen Rahmen: **Die Daten bleiben, wo sie sind. Die Auswertung kommt zu den Daten.**

## 2. Was Tycho leistet

| Bereich | Was Tycho beantwortet | Quelle |
|---|---|---|
| **Station** | Efficacy Score, KPIs, Handlungsbedarf, Zeitachse | alle |
| **Finanzen & Tarife** | Umsatz je Kostenträger, Honorarkatalog (ÖGK-HO-Logik), Limits (z. B. Pos. 39), Kennzeichnungen 8a–8i/T, Fristen | PVS, e-card |
| **Kreuzprüfung** | Konsultationen ohne Grundleistung, Diktate mit erkannter Leistung ohne Position, Telemedizin ohne T-Kennzeichnung | PVS × Diktara × Ordicall |
| **Prognose** | Quartalsende mit 90-%-Band, Vergleich Vorquartal, Kostenträger-Mix | PVS, Historie |
| **Produktivität & Personal** | Kontakte, Umsatz, Dokuzeit je Rolle oder Person; Team- oder Pro-Person-Modus | PVS, Diktara, AD |
| **Tailwind** | Honorarnoten, Inkasso-KI (Erinnerung, Ratenzahlung), Zahlungsabgleich | PVS, Bank |
| **Tailwind HR** | Personalkosten, Kostenquote, Umsatz je Arztstunde gegen Richtwert 120 €/h, Überstunden, Frühwarnungen | Planery, Lohnverrechnung |
| **Ordicall / Diktara** | Anrufe nach Ergebnis und Anliegen, KI-Quote, Stoßzeiten; Dokuzeit, Akzeptanz, ICD-10-Quote | Exporte / Metadaten |
| **Termine, Zuweiser, Verordnungen, QM, NPS** | Auslastung, No-Shows, Zuweiserbindung, Verordnungs-Ausreißer, Fristen, Zufriedenheit | PVS, Import |
| **Digest** | Montags 06:00 als signierte Mail an die Leitung | Store |
| **Assistent** | Fragen in natürlicher Sprache, Antworten mit Tabellen und Sprüngen in die passende Ansicht | Store, lokales LLM |

### Der Efficacy Score

Der Score verdichtet je Rolle sechs bis sieben Komponenten auf 0–100: Durchsatz, Ertrag, Dokumentation, Diktara-Nutzung, Telemedizin, No-Show-Quote, Abrechnungsqualität. Gewichte und Zielwerte sind je Rolle hinterlegt und in der Oberfläche sichtbar. Der Score ist zeitraumbezogen: Er gilt für den gewählten Zeitraum und wird gegen den Vergleichszeitraum ausgewiesen. Es gibt keinen Peer-Vergleich zwischen Ordinationen.

### Team-basiert oder pro Person

Bei der Erstkonfiguration entscheidet der Haupt-Admin zwischen **Team-basiert** (nur Gruppenkennzahlen, k-Anonymität ≥ 5, keine Rankings) und **Pro Person** (Einzelwerte, nur mit NDA und dokumentierter Zustimmung). Die Entscheidung steht im Audit-Log und ist nur durch den Admin umkehrbar.

## 3. Architektur

```
Quellen (nur lesend)           Tycho-Kern (TS-ORD-01)            Oberfläche
──────────────────────         ──────────────────────────         ───────────────────
PVS (CGM MedXPert)   ─SELECT─► Collector (gMSA-Dienst)   ──►   Tycho Station (HTTPS 127.0.0.1)
e-card / ELGA (via PVS)        · Adapter · Pseudonymisierung     Simple- und Advanced-Modus
Ordicall (JSON-Export)         · Aggregation · Scoring           Kerberos-SSO, AD-Gruppen
Diktara (Metadaten-API)        · Kreuzprüfung · Prognose
Active Directory (LDAPS)               │
Planery (API, read-only)               ▼
Bank (CAMT.053)                Verschlüsselter Store             Lokaler Agent (llama.cpp)
Lohnverrechnung (CSV)          AES-256-GCM · TPM                 Tools nur lesend
                               Audit-Kette (SHA-256)             Digest (S/MIME, intern)
```

**Ablauf eines Tages.** Während der Sprechstunde liest Tycho nichts aus der Produktivdatenbank. Um 19:00 entsteht ein Datenbank-Snapshot, um 05:10 läuft der Collector (29 Minuten): Lesen, Pseudonymisieren, Aggregieren, Scoren, Kreuzprüfen, Prognose. Um 05:41 liegt der neue Stand verschlüsselt im Store, der Snapshot wird verworfen. Montags um 06:00 geht der Digest.

**Adapter.** Jede Quelle hat einen Adapter mit genau einer Fähigkeit: lesen. Schreib-APIs existieren im Code nicht; eine Lint-Regel verhindert, dass sie entstehen. Für CGM MedXPert nutzt Tycho einen Leselogin (`db_datareader` + `db_denydatawriter`) auf der Snapshot-Kopie. Ordicall und Diktara liefern Exporte bzw. Metadaten ohne Audio und ohne Transkripte. Planery wird über einen Read-only-Token angesprochen, der im TPM liegt.

**Assistent.** Das Sprachmodell (Llama 3.1 8B, quantisiert) läuft über llama.cpp auf dem Server. Es hat keine Netzwerkverbindung. Seine einzigen Werkzeuge sind lesende Funktionen auf den Store; Patientendaten kommen nie in den Prompt, weil der Store keine enthält.

## 4. Datenmodell

Gespeichert werden ausschließlich pseudonymisierte, aggregierte oder metadatenbezogene Werte:

- **Fall** (HMAC-Pseudonym mit lokalem Salt), Quartal, Kostenträger, Erstkontakt, Kennzeichnung
- **Kontakt**: Datum, Art (persönlich, Video, Telefon), Ärzt:in, ICD-10 ja/nein
- **Leistung**: Position, Anzahl, Tarif, Regelprüfung
- **Termin**: Slot, Terminart, No-Show, Wartezeit
- **Anruf**: Ergebnis, Anliegen, Dauer, Übergabe
- **Diktat**: Dauer, Akzeptanz, erkannte Positionen
- **Honorarnote**: Betrag, Status, WAHonline, Zahlungseingang
- **Person**: AD-Konto, Rolle, FTE, Kostensatz, Zustimmung
- **HR-Periode**: Soll/Ist, Überstunden, Urlaub, Abwesenheiten
- **Finding**: Typ, Wert, Quelle, Status

**Nicht gespeichert:** Patientennamen, Sozialversicherungsnummern, Diagnosen im Klartext, Kartei-Freitexte, Audio, Transkripte, Befunde.

Aufbewahrung: Aggregate 36 Monate, Personenwerte 24 Monate, Audit-Log 10 Jahre.

## 5. Sicherheit

### Grundsatz: abgekapselt

Der Tycho-Dienst hat keine ausgehende Netzwerkverbindung. Das ist keine Konfiguration, sondern eine Firewall-Regel auf Host-Ebene, die im Onboarding gesetzt und im Audit-Log dokumentiert wird. Es gibt keinen Update-Kanal, keine Telemetrie, keine Lizenzprüfung gegen einen Server. Updates werden als signiertes Paket eingespielt. Einzige optionale Ausnahme ist der interne SMTP-Relay für den Digest.

### Beweisführung „nur lesend“

| Ebene | Maßnahme |
|---|---|
| Datenbank-Login | eigener Login `tycho_ro`: `db_datareader` + `db_denydatawriter`, keine DDL |
| Verbindung | `ApplicationIntent=ReadOnly`; Firebird nur `GRANT SELECT`; Btrieve/Pervasive nur Backup-Kopie |
| Quelle | Snapshot statt Produktivdatenbank, nach dem Lauf verworfen |
| Code | Adapter kennen nur `SELECT`; Schreib-APIs existieren nicht (Lint-Regel, Review) |
| Selbsttest | täglicher Schreibversuch (`INSERT`) muss scheitern; Ergebnis im Audit-Log und in der Oberfläche |
| Netzwerk | keine ausgehenden Verbindungen (Host-Firewall) |

### Verschlüsselung und Identität

- Store: AES-256-GCM, Schlüssel im TPM 2.0, an die Maschine gebunden
- Personaldaten (Tailwind HR): eigener Schlüssel, eigenes Audit-Log
- Transport: HTTPS nur auf 127.0.0.1 des Terminalservers, Kerberos/Negotiate-SSO, Fallback LDAPS
- Dienstkonto: gMSA mit automatischer Passwortrotation, Kerberos AES-only
- Rollen: `G_Tycho_Leitung`, `G_Tycho_Admin`, `G_Tycho_Self`; optional `G_Tycho_Audit`

### Audit

Jeder Lesezugriff, jede Anmeldung, jeder abgewiesene Versuch und jede Konfigurationsänderung wird als Ereignis in eine SHA-256-verkettete, append-only Datei geschrieben. Die Kette wird stündlich geprüft. Der Audit-Log ist in der Oberfläche einsehbar (Sicherheit & Compliance) und exportierbar.

### Bedrohungsmodell (Auszug)

| Bedrohung | Antwort |
|---|---|
| Datenabfluss an Dritte | keine ausgehende Verbindung; nichts verlässt den Server |
| Kompromittierung des Servers | Store nur mit TPM-Schlüssel dieser Maschine lesbar; keine Klartext-Patientendaten vorhanden |
| Manipulation der Quellsysteme durch Tycho | technisch ausgeschlossen (Leselogin, Snapshot, Selbsttest) |
| Missbrauch von Personendaten | Team-Modus als Standard; Pro-Person nur mit NDA, Zustimmung, k-Anonymität, Audit |
| Prompt-Injection über Daten | Assistent hat nur lesende Tools und keinen Netzwerkzugang; Antworten sind auf Store-Daten begrenzt |
| Insider mit Leitungsrechten | vollständiges Audit; Pro-Person-Modus nur durch Admin mit protokollierter Entscheidung |

## 6. Recht und Regulatorik (Österreich)

- **DSGVO**: Art. 9 (Gesundheitsdaten), Art. 35 Datenschutz-Folgenabschätzung (DSFA-V Z 1: Leistungsbewertung von Beschäftigten), Art. 22 (keine automatisierte Entscheidung), Art. 28 (Hersteller als Auftragsverarbeiter nur für Wartung, ohne Datenzugriff)
- **ÄrzteG § 54** Verschwiegenheit, **§ 51** Dokumentation und Aufbewahrung
- **ArbVG § 96 Abs 1 Z 3 / § 96a**: Kontrollmaßnahmen und Personaldaten-Systeme; ohne Betriebsrat **§ 10 AVRAG** (Einzelzustimmung). Tycho unterstützt das durch Team-Modus, Zustimmungsverwaltung und Audit.
- **EU AI Act** Anhang III (Beschäftigung): Hochrisiko-Anwendung bei Personenbewertung; Tycho liefert menschliche Aufsicht (keine automatischen Entscheidungen), Information (Mein Score für jede Person) und Protokollierung.
- **Abrechnung**: ASVG §§ 338 ff., Gesamtverträge ÖGK/SVS/BVAEB, Honorarordnungen mit Limits und Kennzeichnungen; Einreichfristen im QM-Modul
- **Dokumentation**: ELGA, e-Medikation, e-Befund; ICD-10 ambulant seit 01.07.2026; WAHonline für Wahlärzt:innen

## 7. Betrieb

- **Voraussetzungen**: Windows Server 2019 oder neuer, 8 GB RAM für den Dienst, 16 GB für den lokalen Assistenten, TPM 2.0, SQL Server oder Firebird als PVS-Datenbank, Active Directory
- **Onboarding** (ein Tag): Leselogin und Snapshot-Job einrichten, Firewall-Regel setzen, gMSA anlegen, AD-Gruppen zuordnen, Erstkonfiguration (Team/Pro Person), Schreib-Selbsttest ausführen
- **Aktualisierung**: signiertes Paket, manuell eingespielt; Changelog im Audit-Log
- **Support**: Wartung ohne Datenzugriff; Fernzugriff nur auf Einladung, protokolliert

## 8. Roadmap

| Zeitraum | Meilenstein |
|---|---|
| Q4 2026 | Pilot in einer Primärversorgungseinheit in Wien (CGM MedXPert), Diktara- und Ordicall-Schnittstellen nach Entwickleranforderung |
| Q1 2027 | Planery-Anbindung produktiv, Tailwind Inkasso-KI, Digest per S/MIME |
| Q2 2027 | Weitere PVS-Adapter, Mehrstandort-Betrieb, DSFA-Vorlage und Betriebsvereinbarungs-Muster |
| Q3 2027 | Wahlarzt-Edition (WAHonline, Honorarnoten-Fokus), Assistent mit Sprachdiktat lokal |
| 2028 | Zertifizierung, Ausschreibungsfähigkeit für Ärztezentren und Träger |

## 9. Fazit

Tycho gibt der Ordinationsleitung das, was bisher gefehlt hat: ein tägliches, belastbares Bild des Betriebs, ohne dass eine einzige Patienteninformation das Haus verlässt und ohne dass ein einziger Datensatz in einem Quellsystem verändert wird. Die Kontrollinstanz kontrolliert nur durch Lesen.

---

*Kontakt und Demo: siehe Landingpage. Dieses Dokument beschreibt den Stand der Demo-Version; Tarife und Kennzahlen darin sind Beispieldaten.*
