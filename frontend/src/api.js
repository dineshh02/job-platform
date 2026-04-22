import axios from 'axios'

/**
 * API + media base URL.
 * - If VITE_API_URL is set (non-empty), use it (direct calls to Django).
 * - In dev with no VITE_API_URL, use '' so requests hit the Vite dev server and
 *   vite.config.js proxies /api and /media to Django (same origin as the page → iframes work).
 * - Production build without VITE_API_URL: same host as the page, port 8000 (adjust or set env).
 */
function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '')
  }
  if (import.meta.env.DEV) {
    return ''
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:8000`
  }
  return 'http://localhost:8000'
}

export const API_BASE_URL = getApiBaseUrl()

const api = axios.create({ baseURL: API_BASE_URL })

/**
 * Return pathname + search for a media (or any) string from the API.
 * APIs often return absolute URLs using the *server* host (localhost, 127.0.0.1,
 * Docker service name "backend", etc.). The browser cannot open those in an iframe
 * when the app is served on another host/port (e.g. Vite on :5173) — you get
 * "connection refused" or an unreachable host. Same-origin /media/... is proxied
 * in dev; always prefer that for embeds.
 */
function toPathnameSearch(pathOrUrl) {
  if (!pathOrUrl) return null
  const s = String(pathOrUrl).trim()
  if (s.startsWith('//')) {
    try {
      const u = new URL(`https:${s}`)
      return u.pathname + u.search
    } catch {
      return s.startsWith('/') ? s : `/${s}`
    }
  }
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s)
      return u.pathname + u.search
    } catch {
      return s
    }
  }
  return s.startsWith('/') ? s : `/${s}`
}

/**
 * URL for iframes / links to user-uploaded media. Uses same document origin
 * (e.g. :5173 with Vite proxy to Django) so embeds are not hard-coded to
 * localhost:8000 or an internal Docker hostname.
 */
export function resolveMediaUrl(pathOrUrl) {
  const p = toPathnameSearch(pathOrUrl)
  if (p == null) return null
  if (p.startsWith('/media/') || p.startsWith('/static/')) {
    if (typeof window !== 'undefined') {
      return p
    }
  }
  if (!API_BASE_URL) return p
  if (p.startsWith('/')) return `${API_BASE_URL.replace(/\/$/, '')}${p}`
  return `${API_BASE_URL.replace(/\/$/, '')}/${p}`
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const signup = (data) => api.post('/api/auth/signup/', data)
export const login = (data) => api.post('/api/auth/login/', data)
export const getJobs = (sort) => api.get('/api/jobs/' + (sort ? `?sort=${sort}` : ''))
export const getMyJobs = () => api.get('/api/jobs/mine/')
export const getJobApplicants = (jobId) => api.get(`/api/jobs/${jobId}/applicants/`)
export const createJob = (data) => api.post('/api/jobs/create/', data)
export const updateApplicationStatus = (applicationId, status) =>
  api.patch(`/api/applications/${applicationId}/`, { status })
export const getCandidateForHR = (userId) => api.get(`/api/auth/candidates/${userId}/`)
export const applyToJob = (jobId) => api.post('/api/applications/', { job: jobId })
export const getApplications = () => api.get('/api/applications/')
export const getApplicationsHR = () => api.get('/api/applications/list/')
export const getProfile = () => api.get('/api/auth/profile/')
export const saveProfile = (data) => api.patch('/api/auth/profile/', data)

export default api
