import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getJobApplicants, updateApplicationStatus, resolveMediaUrl } from '../api'
import styles from './JobDetail.module.css'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
]

export default function JobDetail() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError('')
    getJobApplicants(jobId)
      .then(res => {
        setJob(res.data.job)
        setApplicants(res.data.applicants || [])
        setSelectedId(prev => {
          const list = res.data.applicants || []
          if (prev && list.some(a => a.application_id === prev)) return prev
          return list[0]?.application_id ?? null
        })
      })
      .catch(() => {
        setError('Could not load job or applicants.')
        setJob(null)
        setApplicants([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [jobId])

  const filtered = useMemo(() => {
    if (filter === 'all') return applicants
    return applicants.filter(a => a.status === filter)
  }, [applicants, filter])

  const selected = useMemo(
    () => applicants.find(a => a.application_id === selectedId) || null,
    [applicants, selectedId],
  )

  const setStatus = async (applicationId, nextStatus) => {
    const prev = applicants.map(a => ({ ...a }))
    setApplicants(cur =>
      cur.map(a => (a.application_id === applicationId ? { ...a, status: nextStatus } : a)),
    )
    try {
      await updateApplicationStatus(applicationId, nextStatus)
    } catch {
      setApplicants(prev)
      setError('Could not update status.')
    }
  }

  if (loading && !job) {
    return (
      <div className={styles.page}>
        <nav className={styles.nav}>
          <span className={styles.wordmark}>JobMatch</span>
        </nav>
        <p className={styles.centerMsg}>Loading…</p>
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className={styles.page}>
        <nav className={styles.nav}>
          <span className={styles.wordmark}>JobMatch</span>
          <button type="button" className={styles.navBtn} onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
        </nav>
        <p className={styles.centerMsg}>{error}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.wordmark}>JobMatch</span>
        <div className={styles.navRight}>
          <button type="button" className={styles.navBtn} onClick={() => navigate('/profile')}>
            My Profile
          </button>
          <button type="button" className={styles.navBtn} onClick={() => { localStorage.clear(); navigate('/login') }}>
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.header}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/dashboard')}>
          ← All jobs
        </button>
        <h1 className={styles.title}>{job?.title}</h1>
        <p className={styles.meta}>
          <span className={styles.company}>{job?.company}</span>
          <span className={styles.dot}>·</span>
          <span>{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
        </p>
      </div>

      {error && <p className={styles.bannerError}>{error}</p>}

      <div className={styles.filters}>
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={filter === key ? styles.filterActive : styles.filterBtn}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.split}>
        <aside className={styles.listPane}>
          <p className={styles.listLabel}>Candidates</p>
          <div className={styles.listScroll}>
            {filtered.length === 0 ? (
              <p className={styles.empty}>No candidates in this filter.</p>
            ) : (
              filtered.map(a => (
                <button
                  key={a.application_id}
                  type="button"
                  className={`${styles.row} ${selectedId === a.application_id ? styles.rowActive : ''}`}
                  onClick={() => setSelectedId(a.application_id)}
                >
                  <div className={styles.rowTop}>
                    <span className={styles.rowName}>{a.full_name || a.email}</span>
                    <span className={`${styles.pill} ${styles[`pill_${a.status}`]}`}>{a.status}</span>
                  </div>
                  <span className={styles.rowEmail}>{a.email}</span>
                  {a.skills ? (
                    <p className={styles.rowSkills}>{a.skills}</p>
                  ) : null}
                  {a.years_of_experience != null ? (
                    <p className={styles.rowExp}>{a.years_of_experience} yrs experience</p>
                  ) : null}
                  <div className={styles.rowActions} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.btnAccept}
                      disabled={a.status === 'accepted'}
                      onClick={() => setStatus(a.application_id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className={styles.btnReject}
                      disabled={a.status === 'rejected'}
                      onClick={() => setStatus(a.application_id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className={styles.previewPane}>
          {!selected ? (
            <div className={styles.previewEmpty}>Select a candidate to preview their resume.</div>
          ) : (
            <>
              <div className={styles.previewHeader}>
                <div>
                  <h2 className={styles.previewName}>{selected.full_name || selected.email}</h2>
                  <p className={styles.previewEmail}>{selected.email}</p>
                </div>
                <Link
                  className={styles.profileLink}
                  to={`/dashboard/candidates/${selected.user_id}`}
                  state={{ fromJob: jobId }}
                >
                  View full profile →
                </Link>
              </div>
              {selected.resume_url ? (
                <iframe
                  title="Resume"
                  className={styles.resumeFrame}
                  src={resolveMediaUrl(selected.resume_url)}
                />
              ) : (
                <div className={styles.previewEmpty}>No resume on file for this candidate.</div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
