import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import Alerts from './pages/Alerts'
import Reports from './pages/Reports'

export default function App() {
  return (
    <div className="flex min-h-screen bg-cyber-bg">
      <Sidebar />
      <main className="flex-1 ml-60 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}
