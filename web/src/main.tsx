import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './state/auth'
import { ConfigProvider } from './state/config'
import { FiltersProvider } from './state/filters'
import { AssistantProvider } from './state/assistant'

// HashRouter: läuft auch als statische Dateien (file:// oder IIS ohne Rewrite-Regeln) auf dem Terminalserver.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <ConfigProvider>
          <FiltersProvider>
            <AssistantProvider>
              <App />
            </AssistantProvider>
          </FiltersProvider>
        </ConfigProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
