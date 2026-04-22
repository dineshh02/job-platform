import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, saveProfile } from '../api'

export default function Profile() {
  const [form, setForm] = useState({ full_name: '', experience: '', skills: '' })
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getProfile().then(res => {
      const { full_name, experience, skills, resume_text } = res.data
      setForm({ full_name, experience, skills })
      setResumeText(resume_text || '')
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')
    const fd = new FormData()
    fd.append('full_name', form.full_name)
    fd.append('experience', form.experience)
    fd.append('skills', form.skills)
    if (resumeFile) fd.append('resume_file', resumeFile)

    try {
      const res = await saveProfile(fd)
      setResumeText(res.data.resume_text || '')
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

      {error && <p style={s.error}>{error}</p>}
      {success && <p style={s.success}>{success}</p>}

      <form onSubmit={handleSubmit} style={s.form}>
        <label style={s.label}>Full Name</label>
        <input value={form.full_name} onChange={set('full_name')} style={s.input} placeholder="Jane Doe" />

        <label style={s.label}>Skills</label>
        <input value={form.skills} onChange={set('skills')} style={s.input} placeholder="Python, React, SQL" />

        <label style={s.label}>Experience</label>
        <textarea value={form.experience} onChange={set('experience')} style={{ ...s.input, height: 100, resize: 'vertical' }}
          placeholder="Describe your experience..." />

        <label style={s.label}>Resume (PDF)</label>
        <input type="file" accept=".pdf" onChange={e => setResumeFile(e.target.files[0])} style={s.input} />

        <button type="submit" style={s.btn}>Save Profile</button>
      </form>

      {resumeText && (
        <div style={s.resumeBox}>
          <h4 style={{ margin: '0 0 8px' }}>Extracted Resume Text</h4>
          <pre style={s.resumePre}>{resumeText}</pre>
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: '1.5rem' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  btn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  backBtn: { padding: '6px 12px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  resumeBox: { marginTop: '2rem', border: '1px solid #e5e7eb', borderRadius: 6, padding: '1rem' },
  resumePre: { fontSize: 12, whiteSpace: 'pre-wrap', color: '#374151', maxHeight: 300, overflowY: 'auto' },
  success: { color: '#16a34a', fontSize: 13 },
  error: { color: 'red', fontSize: 13 },
}
