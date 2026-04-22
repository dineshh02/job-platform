import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getCandidateForHR, resolveMediaUrl } from '../api'
import styles from './CandidateDetail.module.css'

export default function CandidateDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromJob = location.state?.fromJob
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getCandidateForHR(userId)
      .then(res => setData(res.data))
      .catch(() => setError('Candidate not found or you do not have access.'))
  }, [userId])

  const goBack = () => {
    if (fromJob) navigate(`/dashboard/jobs/${fromJob}`)
    else navigate('/dashboard')
  }

  if (error) {
    return (
      <div className={styles.page}>
        <nav className={styles.nav}>
          <span className={styles.wordmark}>JobMatch</span>
          <button type="button" className={styles.navBtn} onClick={goBack}>← Back</button>
        </nav>
        <p className={styles.centerMsg}>{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <nav className={styles.nav}>
          <span className={styles.wordmark}>JobMatch</span>
        </nav>
        <p className={styles.centerMsg}>Loading…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.wordmark}>JobMatch</span>
        <div className={styles.navRight}>
          <button type="button" className={styles.navBtn} onClick={() => navigate('/profile')}>My Profile</button>
          <button type="button" className={styles.navBtn} onClick={() => { localStorage.clear(); navigate('/login') }}>Logout</button>
        </div>
      </nav>

      <div className={styles.content}>
        <button type="button" className={styles.back} onClick={goBack}>← Back</button>
        <h1 className={styles.title}>{data.full_name || 'Candidate'}</h1>
        <p className={styles.email}>{data.email}</p>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Profile</h2>
            <dl className={styles.dl}>
              <dt>Skills</dt>
              <dd>{data.skills || '—'}</dd>
              <dt>Years of experience</dt>
              <dd>{data.years_of_experience != null ? `${data.years_of_experience} yrs` : '—'}</dd>
            </dl>
            <h3 className={styles.subTitle}>Experience</h3>
            <p className={styles.body}>{data.experience || '—'}</p>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Resume</h2>
            {data.resume_url ? (
              <>
                <a
                  href={resolveMediaUrl(data.resume_url)}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  Open resume in new tab
                </a>
                <iframe title="Resume" className={styles.frame} src={resolveMediaUrl(data.resume_url)} />
              </>
            ) : (
              <p className={styles.muted}>No resume uploaded.</p>
            )}
            {data.resume_text ? (
              <>
                <h3 className={styles.subTitle}>Extracted text</h3>
                <pre className={styles.pre}>{data.resume_text}</pre>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
