# Tycho Web (Demo)

Statisches Frontend der Tycho-Demo. Alle Daten sind deterministische Demo-Daten im Browser – es wird nichts gelesen oder geschrieben.

```bash
npm install
npm run dev        # Entwicklung: http://127.0.0.1:5173
npm run build      # erzeugt dist/ (statische Dateien)
npm run preview    # dist/ lokal ausliefern: http://127.0.0.1:4173
```

Für den Terminalserver: `dist/` auf den Server kopieren und über IIS, nginx oder `npm run preview` auf `127.0.0.1` ausliefern. Die App verwendet Hash-Routing, daher sind keine Rewrite-Regeln nötig.

Demo-Konten: `a.berger` (Ärztliche Leitung), `k.bauer` (Ordinationsmanagement). Andere AD-Konten werden abgewiesen, weil sie nicht in `G_Tycho_Leitung` sind.
