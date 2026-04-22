import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, saveProfile } from '../api'
import styles from './Profile.module.css'

export default function Profile() {
  const [form, setForm] = useState({ full_name: '', experience: '', skills: '' })
  const [yearsOfExperience, setYearsOfExperience] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getProfile().then(res => {
      const { full_name, experience, skills, years_of_experience } = res.data
      setForm({ full_name: full_name || '', experience: experience || '', skills: skills || '' })
      setYearsOfExperience(years_of_experience ?? null)
    }).catch(() => {})
  }, [])

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
      const { full_name, skills, experience, years_of_experience } = res.data
      setForm(prev => ({
        full_name: full_name || prev.full_name,
        skills: skills || prev.skills,
        experience: experience || prev.experience,
      }))
      setYearsOfExperience(years_of_experience ?? null)
    } catch {
      setError('Resume parsing failed. You can still fill in details manually.')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')
    const fd = new FormData()
    fd.append('full_name', form.full_name)
    fd.append('experience', form.experience)
    fd.append('skills', form.skills)
    try {
      await saveProfile(fd)
      setSuccess('Profile saved.')
    } catch (err) {
      const errors = err.response?.data
      setError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Save failed.')
    }
  }

  const set = f => e => setForm({ ...form, [f]: e.target.value })
  const inputTextarea = `${styles.input} ${styles.textarea}`

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.wordmark}>JobMatch</span>
        <button type="button" onClick={() => navigate('/jobs')} className={styles.navBtn}>← Back to Jobs</button>
      </nav>

      <div className={styles.content}>
        <h1 className={styles.pageTitle}>My Profile</h1>
        <p className={styles.pageSubtitle}>Your details are used to match you with relevant jobs</p>

        {/* Resume Upload */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Resume</p>
          <p className={styles.hint}>Upload a PDF — we'll auto-fill your details using AI.</p>
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
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label className={styles.label}>Full Name</label>
              <input
                value={form.full_name}
                onChange={set('full_name')}
                className={styles.input}
                placeholder="Jane Doe"
                disabled={parsing}
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
