# Research: Abrechnungskontext Österreich, Rechtslage, Sicherheitsarchitektur

Stand: September 2026. Viele österreichische Quellen (ÖGK, RIS, Ärztekammern) waren nur über Suchauszüge erreichbar; unsichere Punkte sind markiert.

## A) Abrechnung in Österreich – was Tycho verstehen muss

- **Fall** = eine im Quartal behandelte Person. Honorar = Grundleistung/Fallpauschale (ausgelöst durch erste e-card-Konsultation im Quartal) + Einzelleistungen mit Positionsnummern. Honorarordnungen sind **je Bundesland und Träger** verschieden (ÖGK-Landesstellen, SVS mit eigenem Gesamtvertrag ab 01.01.2026, BVAEB).
- **Limitierungen/Degression:** viele Positionen „1× je Fall und Quartal“; Fallzahl-Staffeln bei der Grundleistung; Erstordination nur 1× je Schein/Quartal.
- **Fristen:** ÖGK quartalsweise (Einreichung bis 7./10. des Folgemonats), BVAEB monatlich (bis 10.).
- **Telemedizin:** seit 2021/2022 gesamtvertraglich; Kennzeichnungspositionen PERS / TELE / VIDEO, 8a–8i bzw. 8aT–8iT; gleiche Honorierung wie in der Ordination, ausdrückliche Patienteneinwilligung nötig; ÖGK-Videosystem „visit-e“.
- **ELGA/e-card:** seit 01/2026 Pflicht zur Nutzung inkl. e-Medikation und e-Befund; jeder ELGA-Zugriff wird protokolliert.
- **ICD-10:** ab **01.07.2026** kodierte Diagnose- und Leistungsdokumentation verpflichtend (auch Wahlärzt:innen).
- **Wahlärzt:innen:** ab 2026 e-card/ELGA-Pflicht; ab 300 Patient:innen/Jahr elektronische Honorarnotenübermittlung via WAHonline; Kostenerstattung = 80 % des Kassentarifs.
- **2024–2026:** PVE-Gesamtvertrag, mehr Kassenstellen, ÖÄK-Leistungskatalog (~150 Seiten) in Verhandlung, Gesundheitsreformfonds (~500 Mio €/Jahr bis 2030). Einen „Ärztefonds“ gibt es nicht (Wohlfahrtsfonds ≠ Honorar).

### PVS-Landschaft (Datenbanken)

| PVS | Basis | Bemerkung |
|---|---|---|
| INNOMED / INNOMED NEXT (CGM) | neu MS SQL Server; Altbasis Pervasive/Btrieve (Branchenkenntnis) | laut Hersteller meistgenutzt in AT; Migration wegen gesetzlicher Pflicht ab 2026 |
| MEDSTAR (wis.at) | MS SQL Server | belegt |
| CGM MedXPert | Client/Server | DB nicht belegt |
| Latido, Care01 | Cloud | kein lokaler DB-Zugriff, nur Export/API |
| ganyMED, EosWin, EasyOrdi, eMedicus, CGM Maxx, Mobimed, docsy | unbekannt | ÖÄK listet ~100 zertifizierte Hersteller |

## B) Rechtslage – das Hochrisiko-Feature ist der Personen-Score

- **§ 96 Abs 1 Z 3 ArbVG:** Kontrollmaßnahmen/technische Kontrollsysteme, die die Menschenwürde berühren, brauchen zwingend Betriebsratszustimmung. Systematische Leistungsüberwachung einzelner Personen berührt regelmäßig die Menschenwürde (OGH). Maßgeblich ist die objektive Eignung, nicht die Absicht.
- **§ 96a ArbVG:** Personaldaten- und Personalbeurteilungssysteme zustimmungspflichtig (durch Schlichtungsstelle ersetzbar).
- **§ 10 AVRAG (ohne Betriebsrat – typische Ordination):** nur mit **individueller, freiwilliger, informierter, widerrufbarer Zustimmung** jeder/jedes Beschäftigten. Widerruf muss den Score technisch abschalten.
- **EU AI Act:** KI zur Leistungsbewertung/Überwachung Beschäftigter ist **Hochrisiko** (Anhang III Nr. 4). Deployer-Pflichten Art. 26: menschliche Aufsicht, Information der Beschäftigten, Logs. Anwendung ab 02.08.2026, nach Digital-Omnibus voraussichtlich 02.12.2027.
- **DSGVO:** Art. 9 (Gesundheitsdaten – Zweckänderung für Mitarbeiterkennzahlen begründen, Art. 6 Abs 4); **DSFA-V Z 1** nennt ausdrücklich Bewertung/Prognose der Arbeitsleistung → DSFA praktisch **verpflichtend**; Whitelist DSFA-AV A12 (Einzelärzt:innen Patientenverwaltung) greift **nicht** für Gruppenpraxen und nicht für Mitarbeiter-Scoring; Art. 22 (keine ausschließlich automatisierte Entscheidung; EuGH SCHUFA: Score, der faktisch determiniert, genügt); § 6 DSG Datengeheimnis; Bildaufnahmen zur Mitarbeiterkontrolle verboten (§ 12 Abs 4 Z 2 DSG).
- **§ 54 ÄrzteG:** Verschwiegenheit; Hersteller mit Zugriff = Auftragsverarbeiter (Art. 28-Vertrag).
- **Praxis-Mitigationen aus Betriebsvereinbarungen:** aggregierte Auswertung erst ab **k ≥ 5–7 Personen**, keine Rückverfolgung, Zurückhaltung bei Rankings und dauerhaften Profilen, Zweckbindung, Löschfristen, Transparenz.

### Das muss Tycho beachten (in der Demo umgesetzt)

- Personen-Score nur bei erteilter Zustimmung; Status „nur aggregiert“ → kein Einzelwert (Seite Personal & Effizienz, Sicherheit & Compliance).
- Score als Empfehlung mit Human-Review, keine automatischen Konsequenzen; Erklärbarkeit jeder Komponente (Seite Person).
- k-Anonymität konfigurierbar (Einstellungen).
- Keine Patientendaten in Tycho: nur Aggregate, Leistungscodes, pseudonymisierte Fall-IDs; Diktara liefert nur Metadaten.
- DSFA-Vorlage, Verarbeitungsverzeichnis, Muster-Zustimmung, Transparenzbericht als Produktbestandteil.
- Abrechnungsmodell je Bundesland/Träger konfigurierbar; Telemedizin als eigene Kategorie; Wahlarzt-Modus als Modul.

## C) Sicherheitsbausteine (belegt)

- **SQL Server:** `db_datareader` + `db_denydatawriter`, kein `db_owner`; `ApplicationIntent=ReadOnly`; Database Snapshots für konsistente Read-only-Sicht; Ledger-Tabellen (append-only, Hash-Kette) für Audit.
- **Firebird:** nur `GRANT SELECT`. **Btrieve/Pervasive:** kein Rollenmodell → Lesen von Backup-/VSS-Kopie.
- **Schlüssel:** DPAPI-NG (Protection Descriptors für Maschine/SID), TPM-gebundene Key Storage Provider (nicht exportierbar), Master-Key wickelt Datenschlüssel.
- **Identität:** gMSA (30-Tage-Rotation, AES-only Kerberos), RBAC über AD-Gruppen, Entra-Kerberos für hybride Umgebungen.
- **Audit:** append-only Log mit SHA-256-Hash-Kette, Windows Event Forwarding.

## Quellen (Auswahl)

- ÖGK Honorare: https://www.oegk.at/cdscontent/?contentid=10007.880092 · Limitierung: https://www.oegk.at/cdscontent/?contentid=10007.880134&portal=oegkvpportal
- Telemedizin: https://www.aekwien.at/documents/263869/411179/2021-12-09_FAQ+Telemedizin+O%CC%88GK+ab+1.1.2022.pdf · https://www.aekstmk.or.at/652?articleId=9510
- Wahlärzt:innen 2026: https://latido.at/e-card-elga-verpflichtung-fuer-wahlaerzte/ · WAHonline: https://www.oegk.at/cdscontent/?contentid=10007.880165&portal=oegkvpportal
- ICD-10: https://primaerversorgung.gv.at/neuigkeiten/ambulante-diagnosencodierung-ab-juli-2026-verpflichtend
- PVE: https://primaerversorgung.gv.at/pve-vertraege · ÖÄK Leistungskatalog: https://www.aerztekammer.at/home/-/asset_publisher/topnews/content/pk-moderner-leistungskatalog/261766
- INNOMED: https://www.innomed.at/ · MEDSTAR: https://www.wis.at/media/files/info/die-arztsoftware-medstar.pdf · Marktüberblick: https://www.medmedia.at/digitaldoctor/arztsoftware-viele-anbieter-viele-features-viel-kopfweh/
- § 96 ArbVG: https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008329&Paragraf=96 · § 96a: https://www.jusline.at/gesetz/arbvg/paragraf/96a
- OGH 9 ObA 60/22x: https://rechtsanwalt-arbeitsrecht-wien.at/betriebsvereinbarung-zutrittssystem-oesterreich-ogh-9oba60-22x/
- § 10 AVRAG / KI: https://www.bruckmueller-law.at/news/blog/ki-im-arbeitsverhaeltnis-kontrolle-datenschutz-und-schulungspflichten-
- DSFA-V: https://www.ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_2018_II_278/BGBLA_2018_II_278.html · Erläuterungen: https://dsb.gv.at/sites/site0344/media/downloads/erlaeuterungen_zur_dsfa-v.pdf · DSFA-AV: https://www.ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_2018_II_108/BGBLA_2018_II_108.html
- Art. 22 / EuGH SCHUFA: https://www.tapausconsulting.de/regulatorydatabase/eugh-07.12.2023-%E2%80%93-automatisierte-entscheidungen-und-art.-22-dsgvo
- AI Act Beschäftigung: https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act
- § 54 ÄrzteG: https://www.jusline.at/gesetz/aerzteg/paragraf/54
- Aggregationsschwellen: https://datenschutzlab.de/statistische-auswertung-von-leistungsdaten/
- SQL Server ReadOnly-Intent: https://techcommunity.microsoft.com/blog/sqlserversupport/connect-to-sql-server-using-application-intent-read-only/317758 · Snapshots: https://learn.microsoft.com/en-us/sql/relational-databases/databases/database-snapshots-sql-server · Ledger: https://learn.microsoft.com/en-us/sql/relational-databases/security/ledger/ledger-overview
- Firebird: https://www.firebirdsql.org/file/documentation/chunk/en/refdocs/fblangref30/fblangref30-security-granting.html
- CNG DPAPI: https://learn.microsoft.com/en-us/windows/win32/seccng/cng-dpapi · gMSA: https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview
