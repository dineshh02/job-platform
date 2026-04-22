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
 * Absolute URL for opening media in the browser (iframes, links).
 * With dev proxy, paths stay relative so they load from the same origin as the app.
 */
export function resolveMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const { pathname, search } = new URL(pathOrUrl)
      if (!API_BASE_URL) return `${pathname}${search}`
      return `${API_BASE_URL}${pathname}${search}`
    } catch {
      return pathOrUrl
    }
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  if (!API_BASE_URL) return path
  return `${API_BASE_URL}${path}`
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
