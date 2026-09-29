# Offene Entscheidungen

Diese Punkte brauchen eine Entscheidung der Produktverantwortung, bevor aus der Demo ein Produkt wird.

## Features – was rein soll

| # | Vorschlag | Empfehlung | Aufwand |
|---|---|---|---|
| 1 | **No-Show-Risiko-Score je Termin** mit Ordicall-Erinnerungsanruf als Aktion | Ja, starke Verzahnung Tycho ↔ Ordicall | mittel |
| 2 | **Wahlarzt-Modus** (offene Honorarnoten, WAHonline, 80 %-Logik) | Ja, wenn Wahlärzt:innen Zielgruppe sind | mittel |
| 3 | **Team-Auslastung & Überstunden-Frühwarnung** (AD-Logon vs. Aufkommen, Dienstplan) | Ja, aber nur aggregiert per Default | klein |
| 4 | **Anonymer Peer-Benchmark** zwischen Tycho-Ordinationen | Nur opt-in, weil er die „keine ausgehende Verbindung“-Regel bricht | groß |
| 5 | **Zuweiser-Analyse** | Für Fachärzt:innen Pflicht, für Allgemeinmedizin optional | klein |
| 6 | **Verordnungs-/Ökonomie-Monitor** (ÖKO-Tool) | Später | mittel |
| 7 | **QM-/Hygiene-Fristen, Lagerbestand** | Später; braucht manuelle Pflege, passt nicht zur „nur lesen“-Reinheit | klein |
| 8 | **Patientenzufriedenheit / NPS-Import** | Später; externe Quelle | klein |
| 9 | **Self-Service-Ansicht** „mein eigener Score“ für jede:n Mitarbeiter:in | Ja, stärkt Akzeptanz und Rechtssicherheit | klein |
| 10 | **Digest-Varianten** (Quartalsreport, Steuerberater-Export) | Ja | klein |

## Produktentscheidungen

1. **Name:** „Tycho“ (Arbeitstitel). Markenprüfung nötig (es gibt Tycho-Software-Produkte in anderen Branchen).
2. **Efficacy-Score-Gewichte und Zielwerte:** Demo-Werte in `web/src/data/score.ts`. Sollen Ordinationen sie selbst ändern dürfen, oder liefert Tycho fachgruppenspezifische Presets?
3. **Kosten je Person:** aus Lohnverrechnung (CSV) oder manuell? Sichtbar für wen?
4. **Rankings:** Die Demo zeigt eine sortierte Liste. Rechtlich sicherer wäre: keine Rangfolge, nur Einzelwert + Team-Ø.
5. **Diktara-Schnittstelle:** Liefert Diktara heute schon erkannte Leistungscodes als Metadaten? Wenn nicht, ist das die wichtigste Schnittstellenarbeit (Kreuzprüfung hängt daran).
6. **Ordicall-Export:** Terminarten (Video/Telefon/vor Ort) müssen im Export stehen, damit die TM01/TM02-Plausibilität funktioniert.
7. **PVS-Adapter-Reihenfolge:** INNOMED NEXT (SQL Server) zuerst? Welche PVS laufen im eigenen Zentrum und bei den ersten Kund:innen?
8. **Tech-Stack Collector:** .NET 8 Worker Service (empfohlen, native DPAPI-NG/TPM/Kerberos) vs. Node.
9. **Lizenzmodell:** Tycho Station als Basis, Ordicall/Diktara Station als Paket-Abhängigkeit (so in der Demo umgesetzt).
