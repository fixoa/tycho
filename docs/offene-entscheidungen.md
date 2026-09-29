# Offene Entscheidungen

## Entschieden (29.09.2026)

| Thema | Entscheidung |
|---|---|
| Tailwind | Neues Produkt/Station: Wahlarzt-/Privathonorare (Physio, TCM, Impfungen …) als Controlling- und Inkasso-Abteilung mit KI-Empfehlungen; plus HR (Überstunden-Frühwarnung, Urlaubsübersicht) aus **Planery**, hochsicherheitskritisch |
| Zusatzmodule | Zuweiser-Analyse, Verordnungs-Monitor, QM-Fristen, NPS-Import, Self-Service „Mein Score“ – alle rein |
| Peer-Benchmark | **Nein** (kein Modul, keine ausgehende Verbindung) |
| Rankings pro Person | Ja, aber nur im Modus **Pro Person**, den der Haupt-Admin bei der Erstkonfiguration per Switch wählt (Team-basiert vs. Pro Person mit NDA-Warnung „volle Kontrolle auf eigene Gefahr“) |
| Diktara / Ordicall | Liefern die nötigen Metadaten; Anforderung in `docs/dev-anforderung-schnittstellen.md` |
| PVS | CGM MedXPert (eigenes Zentrum) als erster Adapter |
| Collector-Stack | .NET 8 Worker Service (Empfehlung übernommen) |

## Noch offen

1. **MedXPert-Datenbasis:** Welche Datenbank/Version läuft im Zentrum (SQL Server? Firebird? proprietär)? Bestimmt, ob Snapshot/ReadOnly-Intent oder VSS-Kopie. → Onboarding-Termin mit CGM-Betreuung.
2. **Planery-API:** Gibt es einen Read-only-Scope für Zeiten/Abwesenheiten/Salden und ein Feld für das AD-Konto? Falls nein: CSV-Export als Zwischenlösung. → Anforderung Abschnitt 3 an Planery senden.
3. **Bankumsätze:** CAMT.053 der Hausbank verfügbar? Alternativ Kontoauszug-CSV.
4. **NDA-Text und Zustimmungsformular** für den Pro-Person-Modus: juristisch prüfen lassen (Arbeitsrecht + Datenschutz), Vorlage wird mitgeliefert.
5. **Namen „Tycho“ / „Tailwind“:** Markenprüfung (Tailwind kollidiert mit dem CSS-Framework „Tailwind CSS“ – im Medizinbereich vermutlich unproblematisch, aber prüfen).
6. **Zielwerte je Score-Komponente:** Presets je Fachgruppe oder frei konfigurierbar?
7. **Kosten je Person:** aus Lohnverrechnung (CSV) – wer darf sie sehen (nur Admin? Leitung?).
