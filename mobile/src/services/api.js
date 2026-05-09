import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api'

const api = axios.create({ baseURL: BASE, timeout: 15000 })

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('educrm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      try {
        const refresh = await SecureStore.getItemAsync('educrm_refresh')
        if (!refresh) throw new Error('no refresh')
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: refresh })
        await SecureStore.setItemAsync('educrm_token', data.access_token)
        err.config.headers.Authorization = `Bearer ${data.access_token}`
        return api(err.config)
      } catch {
        await SecureStore.deleteItemAsync('educrm_token')
        await SecureStore.deleteItemAsync('educrm_refresh')
        await SecureStore.deleteItemAsync('educrm_user')
      }
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (d) => api.post('/auth/login', d),
  logout: (refresh) => api.post('/auth/logout', { refresh_token: refresh }),
}

export const leadsApi = {
  getAll: (p) => api.get('/leads', { params: p }),
  getById: (id) => api.get(`/leads/${id}`),
  update: (id, d) => api.put(`/leads/${id}`, d),
  setEnrollmentStage: (id, stage) => api.put(`/leads/${id}/enrollment-stage`, { stage }),
  toggleVerify: (id) => api.put(`/leads/${id}/verify`),
  getTasks: (id) => api.get(`/leads/${id}/tasks`),
  getNotes: (id) => api.get(`/leads/${id}/notes`),
}

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getHotLeads: () => api.get('/dashboard/hot-leads'),
}

export const tasksApi = {
  getMyTasks: () => api.get('/tasks/my-tasks'),
  create: (d) => api.post('/tasks', d),
  complete: (id) => api.put(`/tasks/${id}/complete`),
}

export const notesApi = {
  create: (d) => api.post('/notes', d),
}

export const devicesApi = {
  register: (d) => api.post('/devices/register', d),
}

export const callsApi = {
  log: (d) => api.post('/calls/log', d),
  today: () => api.get('/calls/today'),
  getLeadCalls: (id) => api.get(`/calls/lead/${id}`),
  sync: (calls) => api.post('/calls/sync', { calls }),
}

export default api
