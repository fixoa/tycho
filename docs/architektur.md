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
│                                ┌──────▼────────┐    ┌──────▼──────┐  │
│                                │ Audit-Log     │    │ Digest      │  │
│                                │ append-only   │    │ S/MIME →    │  │
│                                └───────────────┘    │ SMTP-Relay  │  │
│                                                     └─────────────┘  │
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

## PVS-Adapter (Österreich)

| PVS | Basis | Adapter |
|---|---|---|
| INNOMED NEXT | MS SQL Server | Snapshot + ReadOnly-Intent |
| MEDSTAR | MS SQL Server | Snapshot + ReadOnly-Intent |
| Innomed (alt) | Pervasive/Btrieve | VSS-Kopie, Btrieve-Reader |
| Latido, Care01 (Cloud) | Web | nur Export/API, kein DB-Zugriff |
| CGM MedXPert u. a. | je nach Version | Analyse im Onboarding |

## Tech-Stack (Vorschlag Produkt)

- Collector: .NET 8 Worker Service (Windows-Dienst, gMSA, TPM/DPAPI-NG-APIs nativ verfügbar)
- Store: SQLite verschlüsselt
- UI: React (dieses Repo) als statische Dateien, ausgeliefert vom Collector über Kestrel auf `127.0.0.1` mit Negotiate-Auth
- Digest: HTML/PDF-Rendering im Collector, S/MIME, lokaler SMTP-Relay
