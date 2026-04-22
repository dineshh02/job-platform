import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Auth from './pages/Auth'
import JobList from './pages/JobList'
import HRDashboard from './pages/HRDashboard'
import JobDetail from './pages/JobDetail'
import CandidateDetail from './pages/CandidateDetail'
import Profile from './pages/Profile'
import { getProfile } from './api'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  const location = useLocation()
  const [gate, setGate] = useState({ ready: !token, allowed: true })

  useEffect(() => {
    if (!token) {
      setGate({ ready: true, allowed: true })
      return
    }
    if (location.pathname === '/profile') {
      setGate({ ready: true, allowed: true })
      return
    }
    getProfile()
      .then(res => {
        const complete = !!res.data.is_complete
        localStorage.setItem('is_complete', complete ? 'true' : 'false')
        setGate({ ready: true, allowed: complete })
      })
      .catch(() => setGate({ ready: true, allowed: true }))
  }, [token, location.pathname])

  if (!token) return <Navigate to="/login" replace />
  if (!gate.ready) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        Loading…
      </div>
    )
  }
  if (!gate.allowed) return <Navigate to="/profile?onboarding=1" replace />
  return children
}

function RootRedirect() {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />
  const complete = localStorage.getItem('is_complete')
  if (complete === 'false') return <Navigate to="/profile?onboarding=1" replace />
  return <Navigate to={role === 'hr' ? '/dashboard' : '/jobs'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
        <Route path="/dashboard/jobs/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
        <Route path="/dashboard/candidates/:userId" element={<ProtectedRoute><CandidateDetail /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
