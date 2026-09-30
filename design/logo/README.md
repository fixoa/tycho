# Logo

Bitte die Logodateien aus dem Design-Ordner hier ablegen (und nach `web/public/brand/` kopieren):

| Datei | Verwendung |
|---|---|
| `logo-light.svg` | auf hellen Flächen (Light Mode) |
| `logo-dark.svg` | auf dunklen Flächen (Dark Mode, Login-Hero) |
| `logo.png` (2×) | Fallback / Office-Dokumente |

Die App liest `web/public/brand/logo-light.svg` und `logo-dark.svg` (`web/src/components/Brand.tsx`).
Solange die Dateien fehlen, steht an allen Stellen die Wortmarke „Tycho“.
