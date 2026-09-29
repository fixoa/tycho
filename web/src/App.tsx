import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './state/auth'
import Login from './pages/Login'
import Station from './pages/Station'
import Team from './pages/Team'
import Person from './pages/Person'
import Leistungen from './pages/Leistungen'
import Prognose from './pages/Prognose'
import Ordicall from './pages/Ordicall'
import Diktara from './pages/Diktara'
import Digest from './pages/Digest'
import Sicherheit from './pages/Sicherheit'
import Einstellungen from './pages/Einstellungen'
import Termine from './pages/Termine'

function Protected({ children }: { children: React.ReactElement }) {
  const { session } = useAuth()
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Navigate to="/station" replace />} />
        <Route path="/station" element={<Station />} />
        <Route path="/prognose" element={<Prognose />} />
        <Route path="/digest" element={<Digest />} />
        <Route path="/team" element={<Team />} />
        <Route path="/team/:id" element={<Person />} />
        <Route path="/leistungen" element={<Leistungen />} />
        <Route path="/termine" element={<Termine />} />
        <Route path="/ordicall" element={<Ordicall />} />
        <Route path="/diktara" element={<Diktara />} />
        <Route path="/sicherheit" element={<Sicherheit />} />
        <Route path="/einstellungen" element={<Einstellungen />} />
      </Route>
      <Route path="*" element={<Navigate to="/station" replace />} />
    </Routes>
  )
}
