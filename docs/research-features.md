# Feature-Research: Praxis-Analytics (DACH & US)

Stand: September 2026. Recherche über Wettbewerber-Dashboards (Jupitec, medheads, systolics, effizienz-praxis, CGM Benchmarks, medatixx, Medipulse, Doctolib, Tebra, athenahealth, Elation, MGMA) und Fachartikel. Bewertung: **NB** = Nobrainer, **NTH** = Nice-to-have. Spalte „Demo“: in der Web-Demo bereits umgesetzt.

| # | Feature | Was es tut | Warum Inhaber:innen es wollen | Quelle(n) | Wert | Demo |
|---|---|---|---|---|---|---|
| 1 | **Abrechnungs-Lückenfinder** | Vergleicht Kartei/Diktara-Leistungserkennung/Termine mit dem Leistungsblatt und listet nicht verrechnete Positionen | Direkt honorarwirksam; Kernversprechen von medheads, systolics Optimizer, medatixx | PVS + Diktara | NB | ✅ |
| 2 | **Limit-/Deckelungs-Ampel** | Ausschöpfung limitierter Positionen im laufenden Quartal, Degressionsprognose | Vermeidet Kürzungen; österreichisches Spezifikum | PVS + Honorarordnung | NB | ✅ |
| 3 | **Quartalsende-Prognose** | Hochrechnung Honorar/Fallzahl/Fallwert mit Konfidenzband, Vorquartals- und Vorjahresvergleich | ÖGK-Bescheid kommt Monate später | PVS | NB | ✅ |
| 4 | **ICD-10-Codierqualität** | Anteil Kontakte mit spezifischem ICD-10-Code je Ärzt:in | Pflicht seit 01.07.2026 (Kassen- und Wahlärzt:innen); Regressrisiko | PVS | NB | ✅ (Kennzahl) |
| 5 | **No-Show-Analyse** | Ausfallquote nach Wochentag, Uhrzeit, Terminart, Ärzt:in; Kosten in Euro | 10–20 % Ausfälle üblich; Standard bei Doctolib, Elation, Tebra | PVS Termine | NB | ✅ |
| 6 | **No-Show-Risiko-Score (KI)** | Vorhersage je Termin mit Handlungsvorschlag (Extra-Erinnerung via Ordicall) | Gut belegt (RF/XGBoost), reduziert Ausfälle | PVS + Ordicall | NTH | ⬜ |
| 7 | **Slot-Auslastung & Kapazitäts-Heatmap** | Belegte vs. verfügbare Slots je Ärzt:in, Wochentag × Stunde | Zeigt verschenkte Kapazität; Top-KPI in US-Dashboards | PVS | NB | ✅ |
| 8 | **Wartezeit-Analytics** | Check-in → Aufruf → Ende je Ärzt:in und Tageszeit, Median/P90 | Unzufriedenheit ab ~20 min; direkte Stellschraube für Bewertungen | Patientenaufrufsystem | NB | ✅ |
| 9 | **Telefon-Erreichbarkeit & Anliegen-Mix** | Volumen nach Stunde, Annahmequote, KI-Quote, Anliegen | 20–30 % verpasste Anrufe typisch; Ordicall-Daten sind Alleinstellungsmerkmal | Ordicall | NB | ✅ |
| 10 | **Telefon → Termin-Konversion** | Anteil Anrufe mit Terminwunsch, die zu gebuchten Terminen wurden; Leakage | Umsatzverlust durch nie erfolgte Rückrufe | Ordicall + PVS | NB | ✅ (Kennzahl) |
| 11 | **Dokumentations-Effizienz** | Diktara-Adoption je Ärzt:in, gesparte Zeit, Akzeptanz-/Korrekturquote | AI-Scribes sparen ~16 min Doku je 8 h; Adoption sichtbar machen | Diktara | NB | ✅ |
| 12 | **Arztbrief-Durchlaufzeit** | Konsultation → versendeter Brief; überfällige Briefe | Zuweiser-/Patientenzufriedenheit (Elation „unsigned notes“) | Diktara + PVS | NB | ✅ (Kennzahl) |
| 13 | **Effizienz-Score je Rolle** | Kombinierter, erklärbarer Index je Ärzt:in/DGKP/Assistenz | Tycho-Kern; Vorbild MGMA Encounters/FTE. Rechtlich sensibel (siehe Recht) | alle | NB | ✅ |
| 14 | **Team-Auslastung & Überstunden-Frühwarnung** | AD-Logon vs. Patientenaufkommen, Über-/Unterbesetzung je Tag | Personalkosten 22–28 % Umsatz; Zeiterfassungspflicht | AD + PVS + Dienstplan | NTH | ⬜ |
| 15 | **Recall-/Vorsorge-Cockpit** | Fällige VU, Impfungen, Chroniker-Kontrollen; Recall-Antwortquote | Patientenbindung + Auslastung; VU ist ÖGK-relevant | PVS | NB | ✅ (Kennzahl) |
| 16 | **Patienten-Churn & Aktiv-Patienten** | Ohne Kontakt > 12/18 Monate, Neu vs. Bestand, Netto-Wachstum | Grundlage für Wachstum/Nachfolge | PVS | NB | ✅ (Kennzahl) |
| 17 | **Umsatz-Mix & Fallwert-Benchmark** | Kassen vs. Privat, Umsatz je Fall/Ärzt:in, Vergleich Fachgruppe | Meistzitierte Kennzahl im DACH-Controlling | PVS (+ extern) | NB | ✅ (ohne extern) |
| 18 | **Offene Posten Wahlarzt** | Offene/überfällige Honorarnoten, Zahlungsdauer, WAHonline-Status | Wahlärzt:innen +148 % seit 2000; Liquidität | PVS | NB (Wahlarzt) | ⬜ (Modul vorgesehen) |
| 19 | **Verordnungs-/Ökonomie-Monitor** | Verordnungskosten je Patient:in, Generika-Quote, Ausreißer (ÖKO-Tool) | Wirtschaftlichkeitsprüfung | PVS | NTH | ⬜ |
| 20 | **Zuweiser-Analyse** | Top-Zuweiser, Entwicklung, abgesprungene Zuweiser | Wichtig für Fachärzt:innen | PVS | NTH (Facharzt: NB) | ⬜ |
| 21 | **Patientenzufriedenheit / NPS** | Import Google-Bewertungen/Umfragen, Korrelation mit Wartezeit | Reputation treibt Neupatienten | extern | NTH | ⬜ |
| 22 | **QM-/Hygiene-Fristenampel** | Geräteprüfungen, Schulungen, Hygieneplan | Gesetzliche Pflicht | manuell | NTH | ⬜ (Modul vorgesehen) |
| 23 | **Anomalie-Alerts mit Klartext** | Ausreißer (Umsatzeinbruch, Telefonspitzen, No-Show ↑) mit Erklärung im Digest | Inhaber:innen wollen wenige Zahlen mit Erklärung, nicht Rohdaten | alle | NB | ✅ (Tycho-Einschätzung) |
| 24 | **Ziele & Zielwert-Tracking** | Inhaber:in setzt Ziele; Digest zeigt Ist/Soll/Trend | systolics Praxis-Radar, athena Insights | alle | NB | ✅ (Praxis-Radar) |
| 25 | **Impf-/Lagerbestand** | Bestand, Ablaufdaten, Verbrauch vs. Termine | Verschwendung vermeiden | extern | NTH | ⬜ (Modul vorgesehen) |

## Meistgezeigte KPIs bei Wettbewerbern

1. Umsatz/Honorar je Periode (Kasse/Privat getrennt), Vergleich Vorjahresquartal
2. Fallzahl (Patient × Quartal)
3. Fallwert (Honorar ÷ Fälle), Vergleich Fachgruppe
4. Umsatzrendite / Kostenquote
5. Personalkostenquote (Richtwert 22–28 %)
6. No-Show-Rate (Ziel < 5 %)
7. Slot-/Behandlerauslastung
8. Neupatienten & Retention/Churn
9. Wartezeit (Median/P90) und Tage bis zum nächsten freien Termin
10. Patienten je Arztstunde / Encounters je FTE (MGMA)
11. Offene Posten & Zahlungsdauer
12. Kürzungs-/Ablehnungsquote der Kasse
13. Leistungsverteilung, Top-Positionen, Limit-Ausschöpfung
14. Telefon-KPIs (Volumen, Annahmequote, Wartezeit in der Leitung)
15. Dokumentations-KPIs (unsignierte Notizen, Zeit bis Arztbrief, Adoption AI-Scribe)

**Beobachtung:** DACH-Tools fokussieren Abrechnung/Fallwert/BWA/Benchmark, US-Tools Revenue Cycle/No-Show/Utilization. Kein Wettbewerber verbindet Telefon-KI- und Diktat-Daten mit dem PVS – das ist Tychos Lücke. Wichtigster Wunsch der Inhaber:innen laut Fachartikeln: **wenige Kennzahlen, automatisch, mit Zielwert und Vorjahresvergleich**.

## Quellen (Auswahl)

- https://jupitec.de/aktuelles/praxis-controlling-arzt-dashboard-kennzahlen
- https://medheads.de/it-fuer-praxen/arzt-dashboard/
- https://systolics.de/portfolios/praxis-radar/ · https://systolics.de/portfolios/optimizer/
- https://effizienz-praxis.de/features/praxis-auswertung
- https://medatixx.de/blog/detail/kennzahlen-arztpraxis-bedeutung-arten-auswertung
- https://www.medipulse.de/blog/praxiskennzahlen-arztpraxis · https://www.medipulse.de/tools/praxis-benchmark
- https://www.virchowbund.de/praxis-knowhow/abrechnung-finanzen/controlling
- https://www.tebra.com/theintake/practice-operations/rcm-and-claims/key-performance-indicators-for-the-revenue-cycle
- https://www.athenahealth.com/resources/blog/athenaone-rcm-metrics
- https://www.elationhealth.com/practice-success/technology/analytics/
- https://doctolib.zendesk.com/hc/de/articles/204016165-Statistiken-einsehen-und-exportieren
- https://www.mgma.com/provider-comp-productivity-benchmarks
- https://www.aapc.com/blog/93112-can-machine-learning-predict-patient-no-shows/
- https://dr-flex.de/ressourcen/blog/no-show-rate-in-arztpraxen
- https://physiciansangels.com/learning-center/the-complete-guide-to-medical-call-analytics-12-kpis-every-healthcare-practice-should-track-in-2026/
- https://www.statnews.com/2026/04/01/ai-ambient-scribes-modest-time-savings-clinical-documentation/
- https://primaerversorgung.gv.at/neuigkeiten/ambulante-diagnosencodierung-ab-juli-2026-verpflichtend
- https://medizinio.de/blog/recall-system-arztpraxis
- https://kontrast.at/kassenarzt-wahlarzt-oesterreich/
- https://www.paul-solutions.de/qm-fuer-arztpraxen-und-mvz
