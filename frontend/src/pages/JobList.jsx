import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, applyToJob } from '../api'

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [applied, setApplied] = useState({})
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    getJobs()
      .then(res => setJobs(res.data))
      .catch(() => { localStorage.clear(); navigate('/login') })
  }, [])

  const handleApply = async (jobId) => {
    try {
      await applyToJob(jobId)
      setApplied(prev => ({ ...prev, [jobId]: true }))
      setErrors(prev => ({ ...prev, [jobId]: '' }))
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.[0]
        || 'Apply failed.'
      setErrors(prev => ({ ...prev, [jobId]: msg }))
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h2>Available Jobs</h2>
        <button onClick={() => { localStorage.clear(); navigate('/login') }} style={s.logout}>Logout</button>
      </div>
      {jobs.length === 0 && <p>No jobs available yet.</p>}
      {jobs.map(job => (
        <div key={job.id} style={s.card}>
          <h3 style={{ margin: '0 0 4px' }}>{job.title}</h3>
          <p style={s.company}>{job.company}</p>
          <p style={s.desc}>{job.description}</p>
          {applied[job.id]
            ? <span style={s.success}>✓ Applied</span>
            : <button onClick={() => handleApply(job.id)} style={s.applyBtn}>Apply</button>
          }
          {errors[job.id] && <p style={s.error}>{errors[job.id]}</p>}
        </div>
      ))}
    </div>
  )
}

const s = {
  wrap: { maxWidth: 680, margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { border: '1px solid #e5e7eb', borderRadius: 6, padding: '1rem', marginBottom: '1rem' },
  company: { color: '#2563eb', margin: '0 0 8px', fontWeight: 500 },
  desc: { color: '#6b7280', fontSize: 14, margin: '0 0 12px' },
  applyBtn: { padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  logout: { padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  success: { color: '#16a34a', fontWeight: 600 },
  error: { color: 'red', fontSize: 13, marginTop: 4 },
}
