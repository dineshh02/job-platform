import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'
import styles from './SimpleAuth.module.css'

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
    <div className={styles.wrap}>
      <h2 className={styles.title}>Login</h2>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} required />
        <button type="submit" className={styles.btn}>Login</button>
      </form>
      <p className={styles.footer}>No account? <Link to="/signup">Sign up</Link></p>
    </div>
  )
}
