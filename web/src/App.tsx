import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import SimpleLayout from './components/SimpleLayout'
import { useAuth, isLeader } from './state/auth'
import { useConfig } from './state/config'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Start from './pages/Start'
import Patienten from './pages/Patienten'
import Finanzen from './pages/Finanzen'
import Produktivitaet from './pages/Produktivitaet'
import Tarife from './pages/Tarife'
import Landschaft from './pages/Landschaft'
import Station from './pages/Station'
import Team from './pages/Team'
import Person from './pages/Person'
import Prognose from './pages/Prognose'
import Ordicall from './pages/Ordicall'
import Diktara from './pages/Diktara'
import Tailwind from './pages/Tailwind'
import Digest from './pages/Digest'
import Sicherheit from './pages/Sicherheit'
import Einstellungen from './pages/Einstellungen'
import Termine from './pages/Termine'
import Zuweiser from './pages/Zuweiser'
import Verordnungen from './pages/Verordnungen'
import QMPage from './pages/QM'
import Zufriedenheit from './pages/Zufriedenheit'
import MeinScore from './pages/MeinScore'

function Protected({ children, leader = true }: { children: React.ReactElement; leader?: boolean }) {
  const { session } = useAuth()
  const { config } = useConfig()
  if (!session) return <Navigate to="/login" replace />
  if (leader && !isLeader(session.user)) return <Navigate to="/mein-score" replace />
  if (leader && !config) return <Navigate to="/setup" replace />
  return children
}

export default function App() {
  const { ui } = useConfig()
  const Shell = ui === 'advanced' ? Layout : SimpleLayout
  const home = ui === 'advanced' ? '/station' : '/start'
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Protected leader={false}><Setup /></Protected>} />
      <Route element={<Protected leader={false}><Shell /></Protected>}>
        <Route path="/mein-score" element={<MeinScore />} />
      </Route>
      <Route element={<Protected><Shell /></Protected>}>
        <Route index element={<Navigate to={home} replace />} />
        <Route path="/start" element={<Start />} />
        <Route path="/patienten" element={<Patienten />} />
        <Route path="/finanzen" element={<Finanzen />} />
        <Route path="/produktivitaet" element={<Produktivitaet />} />
        <Route path="/tarife" element={<Tarife />} />
        <Route path="/leistungen" element={<Navigate to="/tarife" replace />} />
        <Route path="/landschaft" element={<Landschaft />} />
        <Route path="/station" element={<Station />} />
        <Route path="/prognose" element={<Prognose />} />
        <Route path="/digest" element={<Digest />} />
        <Route path="/team" element={<Team />} />
        <Route path="/team/:id" element={<Person />} />
        <Route path="/termine" element={<Termine />} />
        <Route path="/zuweiser" element={<Zuweiser />} />
        <Route path="/verordnungen" element={<Verordnungen />} />
        <Route path="/qm" element={<QMPage />} />
        <Route path="/zufriedenheit" element={<Zufriedenheit />} />
        <Route path="/ordicall" element={<Ordicall />} />
        <Route path="/diktara" element={<Diktara />} />
        <Route path="/tailwind" element={<Tailwind />} />
        <Route path="/sicherheit" element={<Sicherheit />} />
        <Route path="/einstellungen" element={<Einstellungen />} />
      </Route>
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  )
}
