import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, signup } from '../api'
import styles from './Auth.module.css'

export default function Auth() {
  const location = useLocation()
  const [mode, setMode] = useState(location.pathname === '/signup' ? 'signup' : 'login')
  const navigate = useNavigate()

  // login state
  const [lEmail, setLEmail] = useState('')
  const [lPw, setLPw] = useState('')
  const [showLPw, setShowLPw] = useState(false)
  const [lError, setLError] = useState('')
  const [lLoading, setLLoading] = useState(false)

  // signup state
  const [sEmail, setSEmail] = useState('')
  const [sPw, setSPw] = useState('')
  const [sConfirm, setSConfirm] = useState('')
  const [sRole, setSRole] = useState('candidate')
  const [showSPw, setShowSPw] = useState(false)
  const [showSC, setShowSC] = useState(false)
  const [sError, setSError] = useState('')
  const [sLoading, setSLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLError('')
    setLLoading(true)
    try {
      const { data } = await login({ email: lEmail, password: lPw })
      localStorage.setItem('token', data.access)
      localStorage.setItem('role', data.role)
      localStorage.setItem('is_complete', data.is_complete ? 'true' : 'false')
      if (!data.is_complete) {
        navigate('/profile?onboarding=1')
      } else {
        navigate(data.role === 'hr' ? '/dashboard' : '/jobs')
      }
    } catch (err) {
      setLError(err.response?.data?.non_field_errors?.[0] || 'Invalid credentials.')
    } finally {
      setLLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setSError('')
    if (sPw !== sConfirm) { setSError('Passwords do not match.'); return }
    setSLoading(true)
    try {
      const { data } = await signup({ email: sEmail, password: sPw, role: sRole })
      localStorage.setItem('token', data.access)
      localStorage.setItem('role', data.role)
      localStorage.setItem('is_complete', data.is_complete ? 'true' : 'false')
      if (!data.is_complete) {
        navigate('/profile?onboarding=1')
      } else {
        navigate(data.role === 'hr' ? '/dashboard' : '/jobs')
      }
    } catch (err) {
      const errors = err.response?.data
      setSError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Signup failed.')
    } finally {
      setSLoading(false)
    }
  }

  const inputPw = `${styles.input} ${styles.pwInput}`

  return (
    <div className={styles.page}>

      {/* ── LOGIN PANEL ── */}
      <div
        className={mode === 'login' ? styles.panelActive : styles.panelDim}
        onClick={mode !== 'login' ? () => setMode('login') : undefined}
      >
        {mode === 'login' ? (
          <div className={styles.formWrap}>
            <p className={styles.wordmark}>JobMatch</p>
            <h1 className={styles.heading}>Welcome back</h1>
            <p className={styles.subheading}>Sign in to your account</p>

            {lError && <p className={styles.error}>{lError}</p>}

            <form onSubmit={handleLogin} className={styles.form}>
              <input
                className={styles.input}
                type="email"
                placeholder="Email address"
                value={lEmail}
                onChange={e => setLEmail(e.target.value)}
                required
                autoFocus
              />
              <div className={styles.pwRow}>
                <input
                  className={inputPw}
                  type={showLPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={lPw}
                  onChange={e => setLPw(e.target.value)}
                  required
                />
                <button type="button" className={styles.eye} onClick={() => setShowLPw(v => !v)}>
                  {showLPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={lLoading}>
                {lLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className={styles.switchHint}>
              New here?{' '}
              <button type="button" className={styles.switchLink} onClick={() => setMode('signup')}>Create an account →</button>
            </p>
          </div>
        ) : (
          <div className={styles.dimContent}>
            <p className={styles.dimLabel}>Login</p>
            <p className={styles.dimSub}>Already have an account?</p>
            <p className={styles.dimCta}>← Click to sign in</p>
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* ── SIGNUP PANEL ── */}
      <div
        className={mode === 'signup' ? styles.panelActive : styles.panelDim}
        onClick={mode !== 'signup' ? () => setMode('signup') : undefined}
      >
        {mode === 'signup' ? (
          <div className={styles.formWrap}>
            <p className={styles.wordmark}>JobMatch</p>
            <h1 className={styles.heading}>Create account</h1>
            <p className={styles.subheading}>Start your journey today</p>

            {sError && <p className={styles.error}>{sError}</p>}

            <form onSubmit={handleSignup} className={styles.form}>
              <input
                className={styles.input}
                type="email"
                placeholder="Email address"
                value={sEmail}
                onChange={e => setSEmail(e.target.value)}
                required
              />
              <div className={styles.pwRow}>
                <input
                  className={inputPw}
                  type={showSPw ? 'text' : 'password'}
                  placeholder="Password (min 8 chars)"
                  value={sPw}
                  onChange={e => setSPw(e.target.value)}
                  required
                />
                <button type="button" className={styles.eye} onClick={() => setShowSPw(v => !v)}>
                  {showSPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className={styles.pwRow}>
                <input
                  className={inputPw}
                  type={showSC ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={sConfirm}
                  onChange={e => setSConfirm(e.target.value)}
                  required
                />
                <button type="button" className={styles.eye} onClick={() => setShowSC(v => !v)}>
                  {showSC ? 'Hide' : 'Show'}
                </button>
              </div>

              <div>
                <p className={styles.roleLabel}>I am a</p>
                <div className={styles.chipRow}>
                  {[
                    { value: 'candidate', label: 'Candidate' },
                    { value: 'hr', label: 'HR' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={sRole === value ? styles.chipActive : styles.chip}
                      onClick={() => setSRole(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={sLoading}>
                {sLoading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className={styles.switchHint}>
              Have an account?{' '}
              <button type="button" className={styles.switchLink} onClick={() => setMode('login')}>Sign in →</button>
            </p>
          </div>
        ) : (
          <div className={styles.dimContent}>
            <p className={styles.dimLabel}>Sign Up</p>
            <p className={styles.dimSub}>New to JobMatch?</p>
            <p className={styles.dimCta}>Click to register →</p>
          </div>
        )}
      </div>

    </div>
  )
}
