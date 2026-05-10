import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: BASE, timeout: 15000 })

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('educrm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        const refresh = localStorage.getItem('educrm_refresh')
        if (!refresh) throw new Error('no refresh')
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: refresh })
        localStorage.setItem('educrm_token', data.access_token)
        orig.headers.Authorization = `Bearer ${data.access_token}`
        return api(orig)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (d) => api.post('/auth/login', d),
  refresh: (r) => api.post('/auth/refresh', { refresh_token: r }),
  logout: (r) => api.post('/auth/logout', { refresh_token: r }),
}

// ── Leads ─────────────────────────────────────────────────────
export const leadsApi = {
  getAll: (p) => api.get('/leads', { params: p }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (d) => api.post('/leads', d),
  update: (id, d) => api.put(`/leads/${id}`, d),
  delete: (id) => api.delete(`/leads/${id}`),
  assign: (id, uid) => api.put(`/leads/${id}/assign`, { assigned_to: uid }),
  setEnrollmentStage: (id, stage) => api.put(`/leads/${id}/enrollment-stage`, { stage }),
  toggleVerify: (id) => api.put(`/leads/${id}/verify`),
  dispose: (id, d) => api.patch(`/leads/${id}/dispose`, d),
  bulkImport: (leads) => api.post('/leads/bulk-import', { leads }),
  bulkImportFile: (file) => { const f = new FormData(); f.append('file', file); return api.post('/leads/bulk-import', f) },
  exportCsv: (p) => api.get('/leads/export', { params: p, responseType: 'blob' }),
  inviteToPortal: (id) => api.post(`/leads/${id}/invite-to-portal`),
  getTasks: (id) => api.get(`/leads/${id}/tasks`),
  getNotes: (id) => api.get(`/leads/${id}/notes`),
  getComms: (id) => api.get(`/leads/${id}/communications`),
  getPayments: (id) => api.get(`/leads/${id}/payments`),
  getDocs: (id) => api.get(`/leads/${id}/documents`),
  uploadDoc: (id, file, type) => { const f = new FormData(); f.append('file', file); f.append('document_type', type); return api.post(`/leads/${id}/documents`, f) },
}

// ── Tasks ─────────────────────────────────────────────────────
export const tasksApi = {
  getMyTasks: () => api.get('/tasks/my-tasks'),
  create: (d) => api.post('/tasks', d),
  complete: (id) => api.put(`/tasks/${id}/complete`),
}

// ── Notes ─────────────────────────────────────────────────────
export const notesApi = {
  create: (d) => api.post('/notes', d),
}

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getHotLeads: () => api.get('/dashboard/hot-leads'),
  getReengagement: () => api.get('/dashboard/reengagement'),
  getPipelineLeads: (stage) => api.get('/dashboard/pipeline', { params: stage ? { stage } : {} }),
  getTeamLeaderboard: (period) => api.get('/dashboard/team-leaderboard', { params: { period } }),
  getTodayTasks: () => api.get('/dashboard/today-tasks'),
}

// ── Communications ────────────────────────────────────────────
export const commsApi = {
  sendEmail: (d) => api.post('/communications/email/send', d),
  sendWhatsApp: (d) => api.post('/communications/whatsapp/send', d),
}

// ── Templates ─────────────────────────────────────────────────
export const emailTplApi = {
  getAll: () => api.get('/email-templates'),
  create: (d) => api.post('/email-templates', d),
  update: (id, d) => api.put(`/email-templates/${id}`, d),
  delete: (id) => api.delete(`/email-templates/${id}`),
}
export const waTplApi = {
  getAll: () => api.get('/whatsapp-templates'),
  create: (d) => api.post('/whatsapp-templates', d),
  update: (id, d) => api.put(`/whatsapp-templates/${id}`, d),
}

// ── Campaigns ─────────────────────────────────────────────────
export const campaignsApi = {
  getAll: () => api.get('/campaigns'),
  create: (d) => api.post('/campaigns', d),
  launch: (id) => api.post(`/campaigns/${id}/launch`),
  previewAudience: (f) => api.post('/campaigns/preview-audience', { target_filter: f }),
}

// ── Workflows ─────────────────────────────────────────────────
export const workflowsApi = {
  getAll: () => api.get('/workflows'),
  create: (d) => api.post('/workflows', d),
  update: (id, d) => api.put(`/workflows/${id}`, d),
  toggle: (id) => api.put(`/workflows/${id}/toggle`),
}

// ── Payments ──────────────────────────────────────────────────
export const paymentsApi = {
  getAll: (p) => api.get('/payments', { params: p }),
  create: (d) => api.post('/payments', d),
  updateStatus: (id, d) => api.put(`/payments/${id}/status`, d),
  remind: (id, type) => api.post(`/payments/${id}/remind`, { type }),
  exportCsv: (p) => api.get('/payments/export', { params: p, responseType: 'blob' }),
}

// ── Score Rules ───────────────────────────────────────────────
export const scoreRulesApi = {
  getAll: () => api.get('/score-rules'),
  create: (d) => api.post('/score-rules', d),
  update: (id, d) => api.put(`/score-rules/${id}`, d),
}

// ── Reports ───────────────────────────────────────────────────
export const reportsApi = {
  overview: (p) => api.get('/reports/overview', { params: p }),
  agentPerf: (p) => api.get('/reports/agent-performance', { params: p }),
  funnel: (p) => api.get('/reports/funnel', { params: p }),
  sourceRoi: (p) => api.get('/reports/source-roi', { params: p }),
  forecast: () => api.get('/reports/forecast'),
  export: (p) => api.get('/reports/export', { params: p, responseType: 'blob' }),
}

// ── Calls ─────────────────────────────────────────────────────
export const callsApi = {
  log: (d) => api.post('/calls/log', d),
  today: () => api.get('/calls/today'),
  getLeadCalls: (id) => api.get(`/calls/lead/${id}`),
  sync: (calls) => api.post('/calls/sync', { calls }),
}

// ── Assignment ────────────────────────────────────────────────
export const assignmentApi = {
  getConfig: () => api.get('/assignment/config'),
  updateConfig: (d) => api.put('/assignment/config', d),
  getRules: () => api.get('/assignment/rules'),
  addRule: (d) => api.post('/assignment/rules', d),
  deleteRule: (id) => api.delete(`/assignment/rules/${id}`),
}

// ── Billing ───────────────────────────────────────────────────
export const billingApi = {
  getPlans: () => api.get('/billing/plans'),
  getCurrent: () => api.get('/billing/current'),
  upgrade: (plan) => api.post('/billing/upgrade', { plan_name: plan }),
}

// ── Team ──────────────────────────────────────────────────────
export const teamApi = {
  getAll: () => api.get('/team'),
  create: (d) => api.post('/institution/team', d),
  update: (id, d) => api.put(`/institution/team/${id}`, d),
  updateStatus: (id, status) => api.put(`/team/${id}/status`, { status }),
  getBreaks: (id) => api.get(`/team/${id}/breaks`),
}

// ── Branding ──────────────────────────────────────────────────
export const brandingApi = {
  get: (sub) => api.get(`/institution/branding${sub ? `?subdomain=${sub}` : ''}`),
  update: (d) => api.put('/institution/branding', d),
  uploadLogo: (file) => { const f = new FormData(); f.append('logo', file); return api.post('/institution/upload-logo', f) },
}

// ── Institution ───────────────────────────────────────────────
export const institutionApi = {
  getApiKey: () => api.get('/institution/api-key'),
}

// ── Webhooks (api-key authenticated) ─────────────────────────
export const webhooksApi = {
  testLead: (apiKey) => axios.post(`${BASE}/webhooks/lead`, {
    name: 'Test Lead (EduCRM)', phone: '9999999999', email: 'test@educrm.io',
    source: 'WEBSITE', city: 'Demo City', course_interested: 'MBA',
  }, { headers: { 'X-API-Key': apiKey }, timeout: 10000 }),
  testActivity: (apiKey, leadId) => axios.post(`${BASE}/webhooks/activity`, {
    lead_id: leadId, activity_type: 'page_view',
  }, { headers: { 'X-API-Key': apiKey }, timeout: 10000 }),
}

// ── Super Admin ───────────────────────────────────────────────
const saApi = axios.create({ baseURL: BASE, timeout: 15000 })
saApi.interceptors.request.use((c) => { const t = localStorage.getItem('sa_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c })
export const superApi = {
  login: (d) => saApi.post('/super/auth/login', d),
  listInstitutions: () => saApi.get('/super/institutions'),
  createInstitution: (d) => saApi.post('/super/institutions', d),
  updateInstitution: (id, d) => saApi.put(`/super/institutions/${id}`, d),
  getUsage: (id) => saApi.get(`/super/institutions/${id}/usage`),
  getRevenue: () => saApi.get('/super/revenue'),
}

// ── Portal ────────────────────────────────────────────────────
const portalApi2 = axios.create({ baseURL: BASE, timeout: 15000 })
portalApi2.interceptors.request.use((c) => { const t = localStorage.getItem('portal_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c })
export const portalApi = {
  login: (d) => portalApi2.post('/portal/auth/login', d),
  validateInvite: (token) => portalApi2.get(`/portal/invite/${token}`),
  register: (d) => portalApi2.post('/portal/register', d),
  getApp: () => portalApi2.get('/portal/my-application'),
  getPayments: () => portalApi2.get('/portal/my-payments'),
  getDocs: () => portalApi2.get('/portal/my-documents'),
  uploadDoc: (file, type) => { const f = new FormData(); f.append('file', file); f.append('document_type', type); return portalApi2.post('/portal/my-documents', f) },
}

// ── Devices ───────────────────────────────────────────────────
export const devicesApi = {
  register: (d) => api.post('/devices/register', d),
}

export default api
