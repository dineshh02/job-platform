import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob, getApplications } from '../api'

export default function HRDashboard() {
  const [form, setForm] = useState({ title: '', description: '', company: '' })
  const [applications, setApplications] = useState([])
  const [jobError, setJobError] = useState('')
  const [jobSuccess, setJobSuccess] = useState('')
  const navigate = useNavigate()

  const loadApplications = () => {
    getApplications().then(res => setApplications(res.data)).catch(() => {})
  }

  useEffect(loadApplications, [])

  const handleCreateJob = async (e) => {
    e.preventDefault()
    setJobError('')
    setJobSuccess('')
    try {
      await createJob(form)
      setForm({ title: '', description: '', company: '' })
      setJobSuccess('Job posted!')
      loadApplications()
    } catch (err) {
      const errors = err.response?.data
      setJobError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Failed to post job.')
    }
  }

  const set = f => e => setForm({ ...form, [f]: e.target.value })

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h2>HR Dashboard</h2>
        <button onClick={() => { localStorage.clear(); navigate('/login') }} style={s.logout}>Logout</button>
      </div>

      <div style={s.section}>
        <h3>Post a Job</h3>
        {jobError && <p style={s.error}>{jobError}</p>}
        {jobSuccess && <p style={s.success}>{jobSuccess}</p>}
        <form onSubmit={handleCreateJob} style={s.form}>
          <input placeholder="Job Title" value={form.title} onChange={set('title')} style={s.input} required />
          <input placeholder="Company" value={form.company} onChange={set('company')} style={s.input} required />
          <textarea placeholder="Description" value={form.description} onChange={set('description')} style={{ ...s.input, height: 80, resize: 'vertical' }} required />
          <button type="submit" style={s.btn}>Post Job</button>
        </form>
      </div>

      <div style={s.section}>
        <h3>Applicants ({applications.length})</h3>
        {applications.length === 0
          ? <p style={{ color: '#6b7280' }}>No applications yet.</p>
          : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Candidate</th>
                  <th style={s.th}>Job</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td style={s.td}>{app.candidate_email}</td>
                    <td style={s.td}>{app.job_title}</td>
                    <td style={s.td}>{app.status}</td>
                    <td style={s.td}>{new Date(app.applied_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}

const s = {
  wrap: { maxWidth: 800, margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  section: { border: '1px solid #e5e7eb', borderRadius: 6, padding: '1.5rem', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 },
  btn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start' },
  logout: { padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  error: { color: 'red', fontSize: 13 },
  success: { color: '#16a34a', fontSize: 13 },
}
