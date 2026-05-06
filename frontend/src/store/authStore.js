import { create } from 'zustand'
import { authApi } from '../services/api'

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  init() {
    const token = localStorage.getItem('educrm_token')
    const user = localStorage.getItem('educrm_user')
    if (token && user) {
      set({ token, user: JSON.parse(user), loading: false })
    } else {
      set({ loading: false })
    }
  },

  async login(email, password) {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('educrm_token', data.access_token)
    localStorage.setItem('educrm_refresh', data.refresh_token)
    localStorage.setItem('educrm_user', JSON.stringify(data.user))
    set({ token: data.access_token, user: data.user })
    return data.user
  },

  async logout() {
    const refresh = localStorage.getItem('educrm_refresh')
    try { await authApi.logout(refresh) } catch {}
    localStorage.removeItem('educrm_token')
    localStorage.removeItem('educrm_refresh')
    localStorage.removeItem('educrm_user')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.role === 'ADMIN',
  isManagerOrAdmin: () => ['ADMIN','MANAGER'].includes(get().user?.role),
}))

export default useAuthStore
