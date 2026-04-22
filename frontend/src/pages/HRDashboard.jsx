import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob, getApplicationsHR } from '../api'
import styles from './HRDashboard.module.css'

export default function HRDashboard() {
  const [form, setForm] = useState({ title: '', description: '', company: '' })
  const [applications, setApplications] = useState([])
  const [jobError, setJobError] = useState('')
  const [jobSuccess, setJobSuccess] = useState('')
  const navigate = useNavigate()

  const loadApplications = () => {
    getApplicationsHR().then(res => setApplications(res.data)).catch(() => {})
  }

  useEffect(loadApplications, [])

  const handleCreateJob = async (e) => {
    e.preventDefault()
    setJobError('')
    setJobSuccess('')
    try {
      await createJob(form)
      setForm({ title: '', description: '', company: '' })
      setJobSuccess('Job posted successfully.')
      loadApplications()
    } catch (err) {
      const errors = err.response?.data
      setJobError(typeof errors === 'object' ? Object.values(errors).flat()[0] : 'Failed to post job.')
    }
  }

  const set = f => e => setForm({ ...form, [f]: e.target.value })

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.wordmark}>JobMatch</span>
        <button type="button" onClick={() => { localStorage.clear(); navigate('/login') }} className={styles.navBtn}>
          Logout
        </button>
      </nav>

      <div className={styles.content}>
        <h1 className={styles.pageTitle}>HR Dashboard</h1>
        <p className={styles.pageSubtitle}>Manage job postings and review applicants</p>

        {/* Post a Job */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Post a Job</p>
          {jobError && <p className={styles.error}>{jobError}</p>}
          {jobSuccess && <p className={styles.success}>{jobSuccess}</p>}
          <form onSubmit={handleCreateJob} className={styles.form}>
            <div>
              <label className={styles.label}>Job Title</label>
              <input
                placeholder="e.g. Backend Engineer"
                value={form.title}
                onChange={set('title')}
                className={styles.input}
                required
              />
            </div>
            <div>
              <label className={styles.label}>Company</label>
              <input
                placeholder="e.g. Acme Corp"
                value={form.company}
                onChange={set('company')}
                className={styles.input}
                required
              />
            </div>
            <div>
              <label className={styles.label}>Description</label>
              <textarea
                placeholder="Describe the role, responsibilities, and requirements..."
                value={form.description}
                onChange={set('description')}
                className={`${styles.input} ${styles.textarea}`}
                required
              />
            </div>
            <button type="submit" className={styles.btn}>Post Job</button>
          </form>
        </div>

        {/* Applicants */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Applicants ({applications.length})</p>
          {applications.length === 0 ? (
            <p className={styles.empty}>No applications received yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Candidate</th>
                  <th className={styles.th}>Job</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td className={styles.td}>{app.candidate_email}</td>
                    <td className={styles.td}>{app.job_title}</td>
                    <td className={styles.td}>
                      <span className={styles.statusTag}>{app.status}</span>
                    </td>
                    <td className={styles.td}>{new Date(app.applied_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
