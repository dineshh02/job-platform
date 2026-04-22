import axios from 'axios'

/** Base URL for API + media; must match where the browser can reach Django (see docker-compose). */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/$/, '')

const api = axios.create({ baseURL: API_BASE_URL })

/** Turn a relative /media/... path or any URL into a browser-loadable absolute URL for iframes/links. */
export function resolveMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const { pathname, search } = new URL(pathOrUrl)
      return `${API_BASE_URL}${pathname}${search}`
    } catch {
      return pathOrUrl
    }
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
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
