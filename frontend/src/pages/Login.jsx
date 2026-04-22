import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await login({ email, password })
      localStorage.setItem('token', data.access)
      localStorage.setItem('role', data.role)
      navigate(data.role === 'hr' ? '/dashboard' : '/jobs')
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid credentials.')
    }
  }

  return (
    <div style={s.wrap}>
      <h2>Login</h2>
      {error && <p style={s.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={s.form}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={s.input} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={s.input} required />
        <button type="submit" style={s.btn}>Login</button>
      </form>
      <p>No account? <Link to="/signup">Sign up</Link></p>
    </div>
  )
}

const s = {
  wrap: { maxWidth: 380, margin: '80px auto', fontFamily: 'sans-serif', padding: '0 1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  btn: { padding: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  error: { color: 'red', fontSize: 13 },
}
