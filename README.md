# TYCHO – Kontrollinstanz für die Ordinationsleitung

> Arbeitstitel, inspiriert von Tycho Station. „Palantir für Ärzt:innen“: Tycho bündelt die Daten aus PVS, Ordicall (Telefon-KI), Diktara (KI-Dokumentation), Patientenaufrufsystem und Active Directory zu **einem Efficacy Score**, einer **Prognose bis Quartalsende** und einem **wöchentlichen Digest** – ausschließlich lesend, lokal, verschlüsselt.

## Die vier Regeln

| Regel | Umsetzung |
|---|---|
| **Nur lesen.** Tycho schreibt nie in eine Datenbank. | Eigener DB-Login mit `db_datareader` + `db_denydatawriter`, `ApplicationIntent=ReadOnly`, Lesen von Datenbank-Snapshots/VSS-Kopien, täglicher Selbsttest, der einen Schreibversuch nachweislich scheitern lässt. |
| **Nicht bemerkbar.** Kein Eingriff in den Betrieb. | Analyse nach Betriebsschluss auf Snapshot-Daten, kein Zugriff auf die Produktivdatenbank während der Sprechstunde, keine Plugins im PVS, keine Agenten auf Arbeitsplätzen. |
| **Wie ein Benutzer.** Tycho ist eine Kontrollinstanz mit Benutzerrechten, nicht mehr. | Dienstkonto (gMSA) mit denselben Leserechten wie ein Auswertungs-Benutzer, Anmeldung per Windows-SSO, Berechtigung über AD-Gruppe `G_Tycho_Leitung`. |
| **100 % verschlüsselt und sicher.** | AES-256-GCM für den lokalen Store, Schlüssel per DPAPI-NG an die Maschine gebunden, Master-Key im TPM 2.0, HTTPS auf `127.0.0.1`, kein Cloud-Upload, keine Telemetrie, SHA-256-verkettetes Audit-Log. |

## Was in der Demo drin ist

| Bereich | Inhalt |
|---|---|
| **Tycho Station** | Efficacy Score der Ordination (kostengewichtet, je Rolle), Prognose-Kacheln, Praxis-Radar (Telemedizin, No-Show, Wartezeit, Doku-Zeit, manuelle Anrufe, ICD-10-Codierquote), Team-Übersicht, Handlungsbedarf, Wochentrends, Tycho-Einschätzung in Klartext |
| **Prognose** | Kumulierter Umsatz mit 90 %-Band bis Quartalsende, Scheine/Fallwert, Monatsverlauf, Kostenträger (ÖGK/SVS/BVAEB/Privat), Was-wäre-wenn-Szenarien, Methodik |
| **Tycho Digest** | Montags-Mail als Vorschau (S/MIME), Versandplan, Archiv |
| **Personal & Effizienz** | Personalstamm aus AD, Score je Person mit transparenter Aufschlüsselung (Istwert, Ziel, Gewicht), Kosten vs. Ertrag, Deckungsbeitrag, Zustimmungsstatus; Personen mit „nur aggregiert“ werden nicht einzeln bewertet |
| **Leistungen & Abrechnung** | Positionen mit Tarif, Anzahl, Hochrechnung, Limit-Ampel; **Kreuzprüfung** PVS × Diktara × Ordicall × e-card: nicht verrechnete Leistungen, Limits/Degression, Plausibilität, Doppelverrechnung |
| **Termine & Kapazität** | Auslastungs-Heatmap Wochentag × Stunde, No-Show nach Terminart, Wartezeit, Recall/Vorsorge-Potenzial, Patientenbindung, Arztbrief-Durchlaufzeit |
| **Tailwind Station** | Honorarnoten-Controlling & Inkasso für Wahlarzt-/Privathonorare (Physio, TCM, Impfungen, Gutachten, Labor privat): Aging, DSO, Zahlungswahrscheinlichkeit, **KI-Maßnahmenplan** je Honorarnote mit Begründung, WAHonline-Status; **HR aus Planery**: Überstunden-Frühwarnung, Urlaubsübersicht, Abwesenheiten, Krankenstände (hochsicherheitskritisch, eigene Rolle) |
| **Zuweiser** | ABC-Analyse, Trend, abgesprungene und neue Zuweiser mit Handlungsempfehlung |
| **Verordnungen** | Verordnungskosten je Patient:in, Generika-Quote, ÖKO-Tool-Ausreißer mit Einsparpotenzial |
| **Zufriedenheit (NPS)** | NPS aus Google-Rezensionen und Ordicall-SMS-Umfrage, Themenanalyse, Korrelation mit Wartezeit |
| **QM & Fristen** | Geräteprüfungen, Schulungen, Hygieneplan, Dokumente mit Ampel |
| **Mein Score** | Self-Service: jede:r Mitarbeiter:in sieht nur die eigenen Werte (auch ohne Leitungsrechte) |
| **Erstkonfiguration** | Switch **Team-basiert** (Gruppen, k-Anonymität) vs. **Pro Person** (NDA, Einzelzustimmungen, „volle Kontrolle auf eigene Gefahr“); wirkt global auf alle Ansichten |
| **Ordicall Station** | Anrufe je Ergebnis (KI erledigt / übergeben / verpasst), Uhrzeitprofil, Anliegen mit KI-Quote, Außerhalb-Öffnungszeiten, Wirkung auf den Empfang |
| **Diktara Station** | Nutzung je Ärzt:in, gesparte Dokuzeit, Akzeptanz, erkannte Leistungen, Datenschutz-Grenze (nur Metadaten) |
| **Sicherheit & Compliance** | Read-only-Beweise, Datenquellen mit Zugriffsweg, Zustimmungen (§ 10 AVRAG / § 96 ArbVG), DSFA-Status, AI-Act-Hinweis, Audit-Log |
| **Einstellungen** | Module an/aus (inkl. Wahlarzt-Modus, Peer-Benchmark, QM-Fristen, Lager), Datenquellen, Digest-Plan, k-Anonymität |

## Starten

```bash
cd web
npm install
npm run dev          # http://127.0.0.1:5173
# oder produktiv auf dem Terminalserver:
npm run build && npm run preview   # http://127.0.0.1:4173, statische Dateien in web/dist
```

Anmeldung: Button „Mit Windows-Konto anmelden (SSO)“ (= `a.berger`, Haupt-Admin) oder AD-Konto `a.berger` / `k.bauer` (Leitung, beliebiges Passwort). Beim ersten Start erscheint die **Erstkonfiguration** (Team-basiert vs. Pro Person). Jedes andere AD-Konto, z. B. `l.gruber` oder `m.hofer`, sieht nur den Self-Service „Mein Score“. Die Konfiguration liegt im Browser (localStorage) und lässt sich in den Einstellungen zurücksetzen.

## Repository

```
web/     Vite + React + TypeScript + Tailwind + Recharts – die Demo-Web-App
docs/    Architektur, Research (Features, Recht, Sicherheit), offene Entscheidungen
```

- [docs/architektur.md](docs/architektur.md) – Zielarchitektur des Produkts (Collector, Store, UI, Digest) und der „No-write-path“
- [docs/research-features.md](docs/research-features.md) – Feature-Research: was Wettbewerber zeigen, was Praxisinhaber:innen wollen
- [docs/research-recht-sicherheit.md](docs/research-recht-sicherheit.md) – Abrechnungskontext Österreich, ArbVG/DSGVO/AI Act, Sicherheitsbausteine
- [docs/dev-anforderung-schnittstellen.md](docs/dev-anforderung-schnittstellen.md) – **Developer-Anforderung** für Diktara, Ordicall und Planery (Datenverträge, Pseudonymisierung, Signatur, Abnahmekriterien) – zum Weitersenden
- [docs/offene-entscheidungen.md](docs/offene-entscheidungen.md) – Entschieden / noch offen

## Demo-Daten

Alle Zahlen sind deterministisch erzeugte Demo-Daten (Seed im Code) für eine fiktive Gruppenpraxis Allgemeinmedizin in Wien (PVS: CGM MedXPert) mit 4 Ärzt:innen, 2 DGKP, 4 Ordinationsassistentinnen und 1 Ordinationsmanager. Positionen und Tarife sind an eine ÖGK-Honorarordnung angelehnt, aber keine echten Tarife. Datenstand ist auf den 24.08.2026 fixiert (Q3 2026, Tag 56 von 92), damit die Prognose sichtbar bleibt.

## Screenshots

| Tycho Station | Personen-Score |
|---|---|
| ![Tycho Station](docs/screenshots/tycho-station.png) | ![Score-Aufschlüsselung](docs/screenshots/person-score.png) |

| Leistungen & Kreuzprüfung | Sicherheit & Compliance |
|---|---|
| ![Leistungen](docs/screenshots/leistungen-kreuzpruefung.png) | ![Sicherheit](docs/screenshots/sicherheit-compliance.png) |

| Erstkonfiguration (Switch) | Tailwind Station |
|---|---|
| ![Erstkonfiguration](docs/screenshots/erstkonfiguration-switch.png) | ![Tailwind](docs/screenshots/tailwind-station.png) |
