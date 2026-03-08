import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MusicDNAPage } from './pages/MusicDNAPage'
import { ReceiptPage } from './pages/ReceiptPage'
import { RequireAuth } from './components/RequireAuth'

export default function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('tunlytics_token', token)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard/short"
        element={
          <RequireAuth>
            <DashboardPage term="short_term" />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/medium"
        element={
          <RequireAuth>
            <DashboardPage term="medium_term" />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/long"
        element={
          <RequireAuth>
            <DashboardPage term="long_term" />
          </RequireAuth>
        }
      />
      <Route
        path="/music-dna"
        element={
          <RequireAuth>
            <MusicDNAPage />
          </RequireAuth>
        }
      />
      <Route
        path="/receipt"
        element={
          <RequireAuth>
            <ReceiptPage />
          </RequireAuth>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/dashboard/short" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}