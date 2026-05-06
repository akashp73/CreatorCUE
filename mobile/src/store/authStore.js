import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { authApi } from '../services/api'

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  async init() {
    try {
      const token = await SecureStore.getItemAsync('educrm_token')
      const userStr = await SecureStore.getItemAsync('educrm_user')
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  async login(email, password) {
    const { data } = await authApi.login({ email, password })
    await SecureStore.setItemAsync('educrm_token', data.access_token)
    await SecureStore.setItemAsync('educrm_refresh', data.refresh_token)
    await SecureStore.setItemAsync('educrm_user', JSON.stringify(data.user))
    set({ token: data.access_token, user: data.user })
    return data.user
  },

  async logout() {
    try {
      const refresh = await SecureStore.getItemAsync('educrm_refresh')
      if (refresh) await authApi.logout(refresh)
    } catch {}
    await SecureStore.deleteItemAsync('educrm_token')
    await SecureStore.deleteItemAsync('educrm_refresh')
    await SecureStore.deleteItemAsync('educrm_user')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
