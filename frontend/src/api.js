import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const signup = (data) => api.post('/api/auth/signup/', data)
export const login = (data) => api.post('/api/auth/login/', data)
export const getJobs = () => api.get('/api/jobs/')
export const createJob = (data) => api.post('/api/jobs/create/', data)
export const applyToJob = (jobId) => api.post('/api/applications/', { job: jobId })
export const getApplications = () => api.get('/api/applications/')
export const getApplicationsHR = () => api.get('/api/applications/list/')
export const getProfile = () => api.get('/api/auth/profile/')
export const saveProfile = (formData) => api.patch('/api/auth/profile/', formData)

export default api
