import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob, getMyJobs } from '../api'
import styles from './HRDashboard.module.css'

export default function HRDashboard() {
  const [jobs, setJobs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [jobError, setJobError] = useState('')
  const [jobSuccess, setJobSuccess] = useState('')
  const navigate = useNavigate()

  const loadJobs = () => {
    getMyJobs().then(res => setJobs(res.data)).catch(() => {})
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const handleCreateJob = async (e) => {
    e.preventDefault()
    setJobError('')
    setJobSuccess('')
    try {
      await createJob(form)
      setForm({ title: '', description: '' })
      setJobSuccess('Job posted successfully.')
      setModalOpen(false)
      loadJobs()
    } catch (err) {
      const d = err.response?.data
      const msg = d?.detail || (typeof d === 'object' ? Object.values(d).flat()[0] : null) || 'Failed to post job.'
      setJobError(msg)
    }
  }

  const set = f => e => setForm({ ...form, [f]: e.target.value })

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.wordmark}>JobMatch</span>
        <div className={styles.navRight}>
          <button type="button" onClick={() => navigate('/profile')} className={styles.navBtn}>
            My Profile
          </button>
          <button type="button" onClick={() => { localStorage.clear(); navigate('/login') }} className={styles.navBtn}>
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Your job postings</h1>
            <p className={styles.pageSubtitle}>Open a job to review applicants and resumes side by side</p>
          </div>
          <button type="button" className={styles.btnPrimary} onClick={() => { setJobError(''); setJobSuccess(''); setModalOpen(true) }}>
            + New job
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className={styles.card}>
            <p className={styles.empty}>You have not posted any jobs yet. Create one to start receiving applications.</p>
            <button type="button" className={styles.btn} onClick={() => setModalOpen(true)}>Post your first job</button>
          </div>
        ) : (
          <ul className={styles.jobGrid}>
            {jobs.map(job => (
              <li key={job.id}>
                <button
                  type="button"
                  className={styles.jobCard}
                  onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                >
                  <div className={styles.jobCardTop}>
                    <h2 className={styles.jobTitle}>{job.title}</h2>
                    <span className={styles.badge}>{job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}</span>
                  </div>
                  <p className={styles.company}>{job.company}</p>
                  <p className={styles.date}>Posted {new Date(job.created_at).toLocaleDateString()}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => setModalOpen(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="new-job-title" onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h2 id="new-job-title" className={styles.modalTitle}>Post a job</h2>
              <button type="button" className={styles.modalClose} onClick={() => setModalOpen(false)} aria-label="Close">×</button>
            </div>
            <p className={styles.modalHint}>Company name is taken from your HR profile.</p>
            {jobError && <p className={styles.error}>{jobError}</p>}
            {jobSuccess && <p className={styles.success}>{jobSuccess}</p>}
            <form onSubmit={handleCreateJob} className={styles.form}>
              <div>
                <label className={styles.label}>Job title</label>
                <input
                  placeholder="e.g. Backend Engineer"
                  value={form.title}
                  onChange={set('title')}
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
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btn}>Post job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
