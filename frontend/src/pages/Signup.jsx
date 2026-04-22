import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api'

export default function Signup() {
  const [form, setForm] = useState({ email: '', password: '', role: 'candidate' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await signup(form)
      localStorage.setItem('token', data.access)
      localStorage.setItem('role', data.role)
      navigate(data.role === 'hr' ? '/dashboard' : '/jobs')
    } catch (err) {
      const errors = err.response?.data
      setError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Signup failed.')
    }
  }

  const set = f => e => setForm({ ...form, [f]: e.target.value })

  return (
    <div style={s.wrap}>
      <h2>Create Account</h2>
      {error && <p style={s.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={s.form}>
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} style={s.input} required />
        <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={set('password')} style={s.input} required />
        <select value={form.role} onChange={set('role')} style={s.input}>
          <option value="candidate">Candidate</option>
          <option value="hr">HR</option>
        </select>
        <button type="submit" style={s.btn}>Sign Up</button>
      </form>
      <p>Have an account? <Link to="/login">Login</Link></p>
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
