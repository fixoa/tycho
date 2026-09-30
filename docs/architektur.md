# Tycho – Zielarchitektur

## Komponenten (alle lokal auf dem Terminalserver / Hauptserver)

```
┌──────────────────────────────────────────────────────────────────────┐
│  TS-ORD-01 (Windows Server, Terminalserver)                          │
│                                                                      │
│  ┌──────────────┐  read-only  ┌────────────────┐    ┌─────────────┐  │
│  │ PVS-DB       │────────────►│                │    │ Tycho Store │  │
│  │ (Snapshot)   │             │  Tycho         │───►│ AES-256-GCM │  │
│  ├──────────────┤  read-only  │  Collector     │    │ (SQLite     │  │
│  │ Ordicall     │────────────►│  (gMSA-Dienst) │    │  verschl.)  │  │
│  │ Export JSON  │             │                │    └──────┬──────┘  │
│  ├──────────────┤  read-only  │  ● Adapter     │           │         │
│  │ Diktara      │────────────►│  ● Pseudonym.  │    ┌──────▼──────┐  │
│  │ Metadaten-API│             │  ● Aggregation │    │ Tycho UI    │  │
│  ├──────────────┤  LDAPS      │  ● Scoring     │    │ HTTPS       │  │
│  │ Active Dir.  │────────────►│  ● Forecast    │    │ 127.0.0.1   │  │
│  ├──────────────┤  read-only  │  ● Kreuzprüf.  │    │ Kerberos    │  │
│  │ Dienstplan   │────────────►│                │    └──────┬──────┘  │
│  │ CSV          │             └───────┬────────┘           │         │
│  └──────────────┘                     │ SHA-256-Kette      │         │
│                                ┌──────▼────────┐    │ SMTP-Relay  │  │
│                                │ Audit-Log     │    └─────────────┘  │
│                                │ append-only   │                     │
│                                └───────────────┘                     │
└──────────────────────────────────────────────────────────────────────┘
```

## Ablauf eines Tages

1. **Betriebszeit (07:30–18:00):** Der Collector liest nichts aus der Produktivdatenbank. Er darf ausschließlich Exporte (Ordicall JSON, Diktara-Metadaten) und AD lesen – Systeme, die dafür gebaut sind.
2. **Nach Betriebsschluss (19:00):** Datenbank-Snapshot (SQL Server `CREATE DATABASE … AS SNAPSHOT OF`) bzw. VSS-Kopie für Btrieve/Firebird-Altbestände. Der Collector liest vom Snapshot mit `ApplicationIntent=ReadOnly`.
3. **Nacht (05:00 Folgetag):** Aggregation, Pseudonymisierung, Scoring, Kreuzprüfung, Prognose. Ergebnis wird verschlüsselt gespeichert. Selbsttest: ein `INSERT` auf die PVS-DB muss mit „permission denied“ scheitern, sonst Alarm.
4. **Morgen:** Tycho Station zeigt den Datenstand von gestern. Montags 06:00 geht der Digest raus.

## No-write-path (Beweisführung)

| Ebene | Maßnahme |
|---|---|
| DB-Login | eigener Login `tycho_ro`, Rollen `db_datareader` + `db_denydatawriter`, keine DDL, kein `db_owner` |
| Verbindung | `ApplicationIntent=ReadOnly`; bei Firebird nur `GRANT SELECT`; bei Btrieve/Pervasive keine Live-Datei, nur Backup-/VSS-Kopie |
| Quelle | Snapshot statt Produktivdatenbank; Snapshot wird nach dem Lauf verworfen |
| Code | Adapter-Schicht kennt nur `SELECT`; Schreib-APIs existieren im Code nicht (Review-Regel, Lint-Regel) |
| Selbsttest | täglicher negativer Test (Schreibversuch muss scheitern), Ergebnis im Audit-Log und in Sicherheit & Compliance |
| Netzwerk | keine ausgehenden Verbindungen; Firewall-Regel auf Host-Ebene; einzige Ausnahme optional lokaler SMTP-Relay |

## Was gespeichert wird – und was nicht

- **Ja:** Aggregate je Tag/Person/Position, Leistungscodes, Zeitstempel, Termin-Metadaten, pseudonymisierte Fall-IDs (HMAC mit lokalem Salt), Score-Komponenten, Prognosepfad, Findings.
- **Nein:** Patientennamen, Diagnosen im Freitext, Kartei-Texte, Audio, Transkripte, Befunde. Diktara liefert Tycho nur Metadaten (Dauer, Akzeptanz, erkannte Leistungscodes).

## Identität & Rechte

- Dienst läuft als **gMSA** (automatische Passwort-Rotation, Kerberos AES-only).
- Anmeldung im UI per **Kerberos/Negotiate** (Windows-SSO). Fallback: LDAPS-Bind.
- Rollen über AD-Gruppen: `G_Tycho_Leitung` (alles), `G_Tycho_Self` (jede:r sieht nur sich), optional `G_Tycho_Audit` (nur Audit-Log).
- Personen-Scores nur bei erteilter Zustimmung; „nur aggregiert“ → keine Einzelwerte, Beitrag zu Teamkennzahlen mit k ≥ 5.

## Kryptografie

- Store: SQLite mit AES-256-GCM (z. B. SQLCipher-Äquivalent), Datenschlüssel pro Datei.
- Schlüsselhierarchie: Master-Key im TPM 2.0 (Platform Crypto Provider, nicht exportierbar) → wickelt Datenschlüssel; Datenschlüssel zusätzlich per DPAPI-NG an Maschine + gMSA-SID gebunden.
- Backups des Stores bleiben verschlüsselt; Wiederherstellung nur auf derselben Maschine oder mit Recovery-Key (offline, Tresor).
- UI: HTTPS mit internem Zertifikat, gebunden an `127.0.0.1` bzw. RDP-Sitzung. HSTS, keine externen Assets.

## Efficacy Score – Berechnung

Je Rolle eine feste Komponentenliste (siehe `web/src/data/score.ts`): Istwert, Zielwert, Gewicht. Erreichung = min(Ist/Ziel, 125 %) / 125 %. Score = gewichtetes Mittel × 100. Ordinationsscore = kostengewichtetes Mittel der Personenscores. Zielwerte sind konfigurierbar. Der Score ist eine Empfehlung, es gibt keine automatischen Konsequenzen (Art. 22 DSGVO, AI Act Art. 26 Human Oversight).

## Analysemodus (Erstkonfiguration)

Der Haupt-Admin (AD-Gruppe `G_Tycho_Admin`) entscheidet beim ersten Start per Switch:

| | Team-basiert (links) | Pro Person (rechts) |
|---|---|---|
| Auswertung | Ärztegruppe, Pflege-/Laborgruppe, Assistenzgruppe, Verwaltung; k-Anonymität ≥ 5 | Efficacy Score, Kosten/Ertrag, Rangliste, HR-Werte je Person |
| Voraussetzung | keine Einzelzustimmung, kein AI-Act-Hochrisiko | **NDA**, Einzelzustimmungen (§ 10 AVRAG / § 96 ArbVG), DSFA, Human-Review; „volle Kontrolle auf eigene Gefahr“ |
| Bestätigung | Klick | NDA-Checkbox + Eingabe `PRO PERSON` |
| Protokoll | Audit-Log (Konto, Zeit, Modus) | Audit-Log (Konto, Zeit, Modus, NDA) |

Der Modus wirkt global: Team-, Personen-, Tailwind-HR-, Verordnungs- und Digest-Ansichten blenden Einzelwerte im Team-Modus aus. Widerruf einer Zustimmung deaktiviert den Einzelscore der Person auch im Pro-Person-Modus. Jede Person sieht unter „Mein Score“ ihre eigenen Werte (Self-Service), unabhängig vom Modus.

## Tailwind (Controlling, Inkasso, HR)

- **Honorarnoten:** aus dem PVS-Honorarnotenmodul (read-only) mit Bankumsatz-Abgleich (CAMT.053-Import, read-only) und WAHonline-Übermittlungsstatus. Tailwind berechnet Aging, DSO, Zahlungswahrscheinlichkeit und eine **KI-Empfehlung je Honorarnote** (Erinnerung, Mahnstufe, Ratenzahlung, Inkasso, Abschreibung, Stornoprüfung) mit Begründung. Es versendet nichts und schreibt nichts – es erzeugt Texte und Übergabelisten für Menschen.
- **HR-Plattform (Tailwind HR):** Personalkosten (Ist-Stunden × Stundensatz aus Lohnverrechnung + 25 % Überstundenzuschlag), Personalkostenquote je Monat (Richtwert 22–28 %), Ertrag je Personalstunde, Effizienz je Person/Gruppe (Output je Stunde ÷ Rollenziel: Ärzt:innen und DGKP Umsatz/h, Assistenz Kontakte + Anrufe/h), Besetzung laut Dienstplan gegen Patientenaufkommen (Wochentag × Stunde), Krankenstandsquote, Frühwarnungen, Abwesenheiten. Seite `/hr`, Daten in `web/src/data/tailwind.ts` (`hrRows`, `hrGroups`, `hrMonthly`, `STAFFING`).
- **HR aus Planery:** dedizierter Read-only-Token (Scope Zeiten/Abwesenheiten/Salden), Token im TPM, eigener Verschlüsselungsschlüssel, eigenes Audit-Log, Aufbewahrung 12 Monate, Sichtbarkeit nur `G_Tailwind_HR` (+ Leitung im Pro-Person-Modus). Frühwarnregeln: Überstundensaldo > 60 h, Urlaubsrest > 15 Tage im Q4, 3 Monate steigender Trend, > 5 Krankenstandstage / 8 Wochen, Besetzungslücke (Dienstplan × Terminkalender × AD-Logon).

## PVS-Adapter (Österreich)

| PVS | Basis | Adapter |
|---|---|---|
| **CGM MedXPert** (eigenes Zentrum, erster Adapter) | Client/Server; DB-Basis wird im Onboarding verifiziert | Nächtliche VSS-Kopie + Leselogin; Honorarnoten-, Termin- und Leistungstabellen im Onboarding gemappt |
| INNOMED NEXT | MS SQL Server | Snapshot + ReadOnly-Intent |
| MEDSTAR | MS SQL Server | Snapshot + ReadOnly-Intent |
| Innomed (alt) | Pervasive/Btrieve | VSS-Kopie, Btrieve-Reader |
| Latido, Care01 (Cloud) | Web | nur Export/API, kein DB-Zugriff |
| CGM MedXPert u. a. | je nach Version | Analyse im Onboarding |

## Tech-Stack (entschieden)

- Collector: **.NET 8 Worker Service** (Windows-Dienst, gMSA, TPM/DPAPI-NG/Kerberos-APIs nativ, ein Binary, kein Node-Runtime auf dem Server)
- Store: SQLite verschlüsselt
- UI: React (dieses Repo) als statische Dateien, ausgeliefert vom Collector über Kestrel auf `127.0.0.1` mit Negotiate-Auth
- Digest: HTML/PDF-Rendering im Collector, S/MIME, lokaler SMTP-Relay


## Oberflächen-Modi und Assistent (Stand 29.09.2026)

- **Simple**: helle, ruhige Oberfläche (Seitenleiste mit fünf Bereichen nach Apple HIG, Toolbar mit Ort/Suche/Zeitraum/Standort, KPI-Karten, Assistent-Panel). Standard für die Leitung.
- **Advanced**: Gotham-Stil (Modulleiste mit denselben fünf Bereichen, Seiten-Tabs, Facetten, KPI-Leiste, Donuts, Zeitachse). Für Analyse.
- **Login**: Canvas-Erdkugel (Orbits, Radar-Sweep, Parallaxe) plus optionaler, lokal gebündelter Video-Loop (`web/public/login/`, Higgsfield-Render). Schriften liegen gebündelt bei (`@fontsource`), zur Laufzeit gibt es keinen Netzwerkzugriff.
- Beide Modi teilen Routen, Filterzustand (`web/src/state/filters.tsx`) und Datenzugriff (`web/src/data/aggregate.ts` → `useData()`), nur die Shell und die Design-Tokens (`data-ui`, `data-theme`) unterscheiden sich.
- **Assistent**: `web/src/components/Assistant.tsx` + `web/src/data/agent.ts`. Produktiv: llama.cpp-Server auf TS-ORD-01 (GPU optional), Modell lokal (Llama 3.1 8B Instruct oder Mistral 7B), Tool-Calling auf Read-only-Funktionen (Summaries, Positionen, Honorarnoten, HR, Score, Prognose). System-Prompt ohne Patientendaten; Antworten werden mit den Rohwerten zitiert. Verlauf nur bei „Dauerhaft speichern“ im verschlüsselten Store.
