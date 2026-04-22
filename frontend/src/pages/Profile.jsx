import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getProfile, saveProfile } from '../api'
import styles from './Profile.module.css'

export default function Profile() {
  const isHr = localStorage.getItem('role') === 'hr'
  const [searchParams] = useSearchParams()
  const onboarding = searchParams.get('onboarding') === '1'

  const [hrForm, setHrForm] = useState({ full_name: '', company_name: '' })
  const [form, setForm] = useState({ full_name: '', experience: '', skills: '' })
  const [yearsOfExperience, setYearsOfExperience] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [wasIncomplete, setWasIncomplete] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getProfile().then(res => {
      if (isHr) {
        setHrForm({
          full_name: res.data.full_name || '',
          company_name: res.data.company_name || '',
        })
      } else {
        const { full_name, experience, skills, years_of_experience } = res.data
        setForm({
          full_name: full_name || '',
          experience: experience || '',
          skills: skills || '',
        })
        setYearsOfExperience(years_of_experience ?? null)
      }
      setWasIncomplete(!res.data.is_complete)
      localStorage.setItem('is_complete', res.data.is_complete ? 'true' : 'false')
    }).catch(() => {})
  }, [isHr])

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setParsing(true)
    setSuccess('')
    setError('')
    const fd = new FormData()
    fd.append('resume_file', file)
    try {
      const res = await saveProfile(fd)
      const { full_name, skills, experience, years_of_experience, is_complete } = res.data
      setForm(prev => ({
        full_name: full_name || prev.full_name,
        skills: skills || prev.skills,
        experience: experience || prev.experience,
      }))
      setYearsOfExperience(years_of_experience ?? null)
      localStorage.setItem('is_complete', is_complete ? 'true' : 'false')
    } catch {
      setError('Resume parsing failed. You can still fill in details manually.')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmitCandidate = async (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')
    const fd = new FormData()
    fd.append('full_name', form.full_name)
    fd.append('experience', form.experience)
    fd.append('skills', form.skills)
    try {
      const res = await saveProfile(fd)
      localStorage.setItem('is_complete', res.data.is_complete ? 'true' : 'false')
      setSuccess('Profile saved.')
      if (wasIncomplete && res.data.is_complete) {
        navigate('/jobs', { replace: true })
      }
    } catch (err) {
      const errors = err.response?.data
      setError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Save failed.')
    }
  }

  const handleSubmitHr = async (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')
    try {
      const res = await saveProfile({
        full_name: hrForm.full_name,
        company_name: hrForm.company_name,
      })
      localStorage.setItem('is_complete', res.data.is_complete ? 'true' : 'false')
      setSuccess('Profile saved.')
      if (wasIncomplete && res.data.is_complete) {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const errors = err.response?.data
      setError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Save failed.')
    }
  }

  const set = f => e => setForm({ ...form, [f]: e.target.value })
  const setHr = f => e => setHrForm({ ...hrForm, [f]: e.target.value })
  const inputTextarea = `${styles.input} ${styles.textarea}`

  const backTarget = () => (isHr ? '/dashboard' : '/jobs')
  const backLabel = () => (isHr ? '← Back to Dashboard' : '← Back to Jobs')

  if (isHr) {
    return (
      <div className={styles.page}>
        <nav className={styles.nav}>
          <span className={styles.wordmark}>JobMatch</span>
          <button type="button" onClick={() => navigate(backTarget())} className={styles.navBtn}>{backLabel()}</button>
        </nav>

        <div className={styles.content}>
          <h1 className={styles.pageTitle}>HR profile</h1>
          <p className={styles.pageSubtitle}>Company name is used automatically on every job you post</p>

          {onboarding && (
            <div className={styles.onboardingBanner}>
              Complete your profile to continue using the platform.
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.successMsg}>{success}</p>}

          <div className={styles.card}>
            <p className={styles.sectionLabel}>Your details</p>
            <form onSubmit={handleSubmitHr} className={styles.form}>
              <div>
                <label className={styles.label}>Full name</label>
                <input
                  value={hrForm.full_name}
                  onChange={setHr('full_name')}
                  className={styles.input}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Company name</label>
                <input
                  value={hrForm.company_name}
                  onChange={setHr('company_name')}
                  className={styles.input}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <button type="submit" className={styles.btn}>Save profile</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.wordmark}>JobMatch</span>
        <button type="button" onClick={() => navigate(backTarget())} className={styles.navBtn}>{backLabel()}</button>
      </nav>

      <div className={styles.content}>
        <h1 className={styles.pageTitle}>My Profile</h1>
        <p className={styles.pageSubtitle}>Your details are used to match you with relevant jobs</p>

        {onboarding && (
          <div className={styles.onboardingBanner}>
            Complete your profile to continue using the platform.
          </div>
        )}

        {/* Resume Upload */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Resume</p>
          <p className={styles.hint}>Upload a PDF — we&apos;ll auto-fill your details using AI.</p>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className={styles.fileInput}
            disabled={parsing}
          />
          {parsing && (
            <div className={styles.loaderWrap}>
              <div className={styles.spinner} />
              <span className={styles.loaderText}>Parsing your resume, filling in details…</span>
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.successMsg}>{success}</p>}

        {/* Profile Form */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Details</p>
          <form onSubmit={handleSubmitCandidate} className={styles.form}>
            <div>
              <label className={styles.label}>Full Name</label>
              <input
                value={form.full_name}
                onChange={set('full_name')}
                className={styles.input}
                placeholder="Jane Doe"
                disabled={parsing}
                required
              />
            </div>
            <div>
              <label className={styles.label}>Skills</label>
              <input
                value={form.skills}
                onChange={set('skills')}
                className={styles.input}
                placeholder="Python, React, SQL"
                disabled={parsing}
                required
              />
            </div>

            {yearsOfExperience !== null && (
              <div className={styles.parsedRow}>
                <span className={styles.parsedLabel}>Years of experience</span>
                <span className={styles.parsedVal}>{yearsOfExperience} yrs</span>
              </div>
            )}

            <div>
              <label className={styles.label}>Experience</label>
              <textarea
                value={form.experience}
                onChange={set('experience')}
                className={inputTextarea}
                placeholder="Describe your experience..."
                disabled={parsing}
              />
            </div>

            <button
              type="submit"
              className={styles.btn}
              disabled={parsing}
            >
              Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
