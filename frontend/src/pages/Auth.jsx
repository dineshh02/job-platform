import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, signup } from '../api'

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
      navigate(data.role === 'hr' ? '/dashboard' : '/jobs')
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
      navigate(data.role === 'hr' ? '/dashboard' : '/jobs')
    } catch (err) {
      const errors = err.response?.data
      setSError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Signup failed.')
    } finally {
      setSLoading(false)
    }
  }

  return (
    <div style={s.page}>

      {/* ── LOGIN PANEL ── */}
      <div
        style={mode === 'login' ? s.panelActive : s.panelDim}
        onClick={mode !== 'login' ? () => setMode('login') : undefined}
      >
        {mode === 'login' ? (
          <div style={s.formWrap}>
            <p style={s.wordmark}>JobMatch</p>
            <h1 style={s.heading}>Welcome back</h1>
            <p style={s.subheading}>Sign in to your account</p>

            {lError && <p style={s.error}>{lError}</p>}

            <form onSubmit={handleLogin} style={s.form}>
              <input
                style={s.input}
                type="email"
                placeholder="Email address"
                value={lEmail}
                onChange={e => setLEmail(e.target.value)}
                required
                autoFocus
              />
              <div style={s.pwRow}>
                <input
                  style={{ ...s.input, paddingRight: 56 }}
                  type={showLPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={lPw}
                  onChange={e => setLPw(e.target.value)}
                  required
                />
                <button type="button" style={s.eye} onClick={() => setShowLPw(v => !v)}>
                  {showLPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <button type="submit" style={s.submitBtn} disabled={lLoading}>
                {lLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p style={s.switchHint}>
              New here?{' '}
              <button style={s.switchLink} onClick={() => setMode('signup')}>Create an account →</button>
            </p>
          </div>
        ) : (
          <div style={s.dimContent}>
            <p style={s.dimLabel}>Login</p>
            <p style={s.dimSub}>Already have an account?</p>
            <p style={s.dimCta}>← Click to sign in</p>
          </div>
        )}
      </div>

      <div style={s.divider} />

      {/* ── SIGNUP PANEL ── */}
      <div
        style={mode === 'signup' ? s.panelActive : s.panelDim}
        onClick={mode !== 'signup' ? () => setMode('signup') : undefined}
      >
        {mode === 'signup' ? (
          <div style={s.formWrap}>
            <p style={s.wordmark}>JobMatch</p>
            <h1 style={s.heading}>Create account</h1>
            <p style={s.subheading}>Start your journey today</p>

            {sError && <p style={s.error}>{sError}</p>}

            <form onSubmit={handleSignup} style={s.form}>
              <input
                style={s.input}
                type="email"
                placeholder="Email address"
                value={sEmail}
                onChange={e => setSEmail(e.target.value)}
                required
              />
              <div style={s.pwRow}>
                <input
                  style={{ ...s.input, paddingRight: 56 }}
                  type={showSPw ? 'text' : 'password'}
                  placeholder="Password (min 8 chars)"
                  value={sPw}
                  onChange={e => setSPw(e.target.value)}
                  required
                />
                <button type="button" style={s.eye} onClick={() => setShowSPw(v => !v)}>
                  {showSPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={s.pwRow}>
                <input
                  style={{ ...s.input, paddingRight: 56 }}
                  type={showSC ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={sConfirm}
                  onChange={e => setSConfirm(e.target.value)}
                  required
                />
                <button type="button" style={s.eye} onClick={() => setShowSC(v => !v)}>
                  {showSC ? 'Hide' : 'Show'}
                </button>
              </div>

              <div>
                <p style={s.roleLabel}>I am a</p>
                <div style={s.chipRow}>
                  {[
                    { value: 'candidate', label: 'Candidate' },
                    { value: 'hr', label: 'HR' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      style={sRole === value ? s.chipActive : s.chip}
                      onClick={() => setSRole(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" style={s.submitBtn} disabled={sLoading}>
                {sLoading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p style={s.switchHint}>
              Have an account?{' '}
              <button style={s.switchLink} onClick={() => setMode('login')}>Sign in →</button>
            </p>
          </div>
        ) : (
          <div style={s.dimContent}>
            <p style={s.dimLabel}>Sign Up</p>
            <p style={s.dimSub}>New to JobMatch?</p>
            <p style={s.dimCta}>Click to register →</p>
          </div>
        )}
      </div>

    </div>
  )
}

const s = {
  page: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    background: '#0a0a0a',
  },

  panelActive: {
    flex: 1,
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'flex 0.35s ease, background 0.35s ease',
    minWidth: 0,
  },

  panelDim: {
    flex: '0 0 200px',
    background: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'flex 0.35s ease, background 0.35s ease',
    minWidth: 0,
  },

  divider: {
    width: 1,
    background: '#222',
    flexShrink: 0,
  },

  // Active form content
  formWrap: {
    width: '100%',
    maxWidth: 360,
    padding: '0 2rem',
  },

  wordmark: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#000',
    margin: '0 0 36px',
  },

  heading: {
    fontSize: 26,
    fontWeight: 700,
    color: '#0a0a0a',
    margin: '0 0 6px',
    letterSpacing: '-0.02em',
  },

  subheading: {
    fontSize: 14,
    color: '#888',
    margin: '0 0 28px',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    border: '1.5px solid #e8e8e8',
    borderRadius: 8,
    outline: 'none',
    color: '#0a0a0a',
    background: '#fafafa',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },

  pwRow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  eye: {
    position: 'absolute',
    right: 12,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    color: '#888',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: 0,
  },

  submitBtn: {
    width: '100%',
    padding: '13px',
    background: '#0a0a0a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
    letterSpacing: '0.01em',
  },

  roleLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '0 0 8px',
  },

  chipRow: {
    display: 'flex',
    gap: 8,
  },

  chip: {
    flex: 1,
    padding: '10px 0',
    background: '#fff',
    border: '1.5px solid #e0e0e0',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#555',
    transition: 'all 0.15s',
  },

  chipActive: {
    flex: 1,
    padding: '10px 0',
    background: '#0a0a0a',
    border: '1.5px solid #0a0a0a',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    transition: 'all 0.15s',
  },

  error: {
    fontSize: 13,
    color: '#dc2626',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    padding: '8px 12px',
    margin: '-4px 0 8px',
  },

  switchHint: {
    marginTop: 20,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },

  switchLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    color: '#0a0a0a',
    fontWeight: 600,
    padding: 0,
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },

  // Dim panel
  dimContent: {
    textAlign: 'center',
    padding: '0 1.5rem',
    userSelect: 'none',
  },

  dimLabel: {
    fontSize: 20,
    fontWeight: 700,
    color: '#555',
    margin: '0 0 8px',
    letterSpacing: '-0.01em',
  },

  dimSub: {
    fontSize: 12,
    color: '#3a3a3a',
    margin: '0 0 12px',
  },

  dimCta: {
    fontSize: 11,
    color: '#444',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    margin: 0,
  },
}
