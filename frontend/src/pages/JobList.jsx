import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, applyToJob, getApplications } from '../api'
import styles from './JobList.module.css'

function matchBadgeVariant(score) {
  if (score >= 70) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

const badgeVariantClass = {
  high: styles.badgeHigh,
  mid: styles.badgeMid,
  low: styles.badgeLow,
}

export default function JobList() {
  const isCandidate = localStorage.getItem('role') === 'candidate'
  const [jobs, setJobs] = useState([])
  const [applied, setApplied] = useState({})
  const [errors, setErrors] = useState({})
  const [sortRelevance, setSortRelevance] = useState(false)
  const navigate = useNavigate()

  const loadJobs = (sort) => {
    const sortParam = sort ? 'relevance' : undefined
    Promise.all([getJobs(sortParam), isCandidate ? getApplications() : Promise.resolve({ data: [] })])
      .then(([jobsRes, appsRes]) => {
        setJobs(jobsRes.data)
        const alreadyApplied = {}
        appsRes.data.forEach(app => { alreadyApplied[app.job] = true })
        setApplied(alreadyApplied)
      })
      .catch(() => { localStorage.clear(); navigate('/login') })
  }

  useEffect(() => { loadJobs(false) }, [])

  const toggleSort = () => {
    const next = !sortRelevance
    setSortRelevance(next)
    loadJobs(next)
  }

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
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.wordmark}>JobMatch</span>
        <div className={styles.navRight}>
          {isCandidate && (
            <button type="button" onClick={toggleSort} className={sortRelevance ? styles.navBtnActive : styles.navBtn}>
              {sortRelevance ? '✓ Best Match' : 'Sort by Match'}
            </button>
          )}
          {isCandidate && (
            <button type="button" onClick={() => navigate('/profile')} className={styles.navBtn}>My Profile</button>
          )}
          <button type="button" onClick={() => { localStorage.clear(); navigate('/login') }} className={styles.navBtn}>
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Available Jobs</h1>
        <p className={styles.pageSubtitle}>{jobs.length} position{jobs.length !== 1 ? 's' : ''} open</p>

        {jobs.length === 0 && (
          <div className={styles.empty}>No jobs available yet.</div>
        )}

        {jobs.map(job => {
          const variant = job.match_score !== null && job.match_score !== undefined
            ? matchBadgeVariant(job.match_score)
            : null
          return (
            <div key={job.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h2 className={styles.jobTitle}>{job.title}</h2>
                  <p className={styles.company}>{job.company}</p>
                </div>
                {variant && (
                  <span className={`${styles.badge} ${badgeVariantClass[variant]}`}>
                    {job.match_score}% match
                  </span>
                )}
              </div>
              <p className={styles.desc}>{job.description}</p>
              <div className={styles.cardFooter}>
                {applied[job.id]
                  ? <span className={styles.appliedTag}>✓ Applied</span>
                  : isCandidate && (
                    <button type="button" onClick={() => handleApply(job.id)} className={styles.applyBtn}>Apply</button>
                  )
                }
                {errors[job.id] && <p className={styles.error}>{errors[job.id]}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
