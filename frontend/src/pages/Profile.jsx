import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, saveProfile } from '../api'

export default function Profile() {
  const [form, setForm] = useState({ full_name: '', experience: '', skills: '' })
  const [yearsOfExperience, setYearsOfExperience] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getProfile().then(res => {
      const { full_name, experience, skills, resume_text, years_of_experience } = res.data
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
      const { full_name, skills, experience, resume_text, years_of_experience } = res.data
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
      setSuccess('Profile saved!')
    } catch (err) {
      const errors = err.response?.data
      setError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Save failed.')
    }
  }

  const set = f => e => setForm({ ...form, [f]: e.target.value })

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h2>My Profile</h2>
        <button onClick={() => navigate('/jobs')} style={s.backBtn}>← Back to Jobs</button>
      </div>

      <div style={s.uploadSection}>
        <label style={s.uploadLabel}>Upload Resume (PDF)</label>
        <p style={s.uploadHint}>We'll auto-fill your details from the resume.</p>
        <input type="file" accept=".pdf" onChange={handleFileSelect} style={s.input} disabled={parsing} />
        {parsing && (
          <div style={s.loaderWrap}>
            <div style={s.spinner} />
            <span style={s.loaderText}>Parsing your resume, filling in details...</span>
          </div>
        )}
      </div>

      {error && <p style={s.error}>{error}</p>}
      {success && <p style={s.success}>{success}</p>}

      <form onSubmit={handleSubmit} style={s.form}>
        <label style={s.label}>Full Name</label>
        <input value={form.full_name} onChange={set('full_name')} style={s.input} placeholder="Jane Doe" disabled={parsing} />

        <label style={s.label}>Skills</label>
        <input value={form.skills} onChange={set('skills')} style={s.input} placeholder="Python, React, SQL" disabled={parsing} />

        {yearsOfExperience !== null && (
          <div style={s.parsedBox}>
            <span style={s.label}>Years of Experience (auto-parsed)</span>
            <span style={s.parsedVal}>{yearsOfExperience}</span>
          </div>
        )}

        <label style={s.label}>Experience</label>
        <textarea value={form.experience} onChange={set('experience')} style={{ ...s.input, height: 100, resize: 'vertical' }}
          placeholder="Describe your experience..." disabled={parsing} />

        <button type="submit" style={{ ...s.btn, opacity: parsing ? 0.5 : 1 }} disabled={parsing}>
          Save Profile
        </button>
      </form>

    </div>
  )
}

const spin = `
@keyframes spin { to { transform: rotate(360deg); } }
`
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = spin
  document.head.appendChild(style)
}

const s = {
  wrap: { maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  uploadSection: { marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 },
  uploadLabel: { fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 4 },
  uploadHint: { fontSize: 12, color: '#64748b', margin: '0 0 10px' },
  loaderWrap: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6 },
  spinner: { width: 16, height: 16, border: '2px solid #bfdbfe', borderTop: '2px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 },
  loaderText: { fontSize: 13, color: '#1d4ed8', fontWeight: 500 },
  form: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: '1.5rem' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  btn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  backBtn: { padding: '6px 12px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  success: { color: '#16a34a', fontSize: 13 },
  error: { color: 'red', fontSize: 13 },
  parsedBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4 },
  parsedVal: { fontSize: 14, fontWeight: 600, color: '#15803d' },
}
