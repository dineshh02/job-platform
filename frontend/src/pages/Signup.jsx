import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api'
import styles from './SimpleAuth.module.css'

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
    <div className={styles.wrap}>
      <h2 className={styles.title}>Create Account</h2>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} className={styles.input} required />
        <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={set('password')} className={styles.input} required />
        <select value={form.role} onChange={set('role')} className={styles.input}>
          <option value="candidate">Candidate</option>
          <option value="hr">HR</option>
        </select>
        <button type="submit" className={styles.btn}>Sign Up</button>
      </form>
      <p className={styles.footer}>Have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}
