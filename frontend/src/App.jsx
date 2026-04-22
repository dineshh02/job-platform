import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import JobList from './pages/JobList'
import HRDashboard from './pages/HRDashboard'
import Profile from './pages/Profile'

function ProtectedRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

function RootRedirect() {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={role === 'hr' ? '/dashboard' : '/jobs'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
