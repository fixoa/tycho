import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tycho Demo – statisches Frontend. Läuft lokal (z. B. Terminalserver) ohne
// externe Abhängigkeiten zur Laufzeit; alle Daten sind Demo-Daten im Browser.
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
  build: { outDir: 'dist', sourcemap: false },
})
