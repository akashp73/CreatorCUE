import { create } from 'zustand'

// Load from localStorage on init
const saved = (() => {
  try {
    return {
      name: localStorage.getItem('brandingName') || null,
      logo_url: localStorage.getItem('brandingLogo') || null,
    }
  } catch { return { name: null, logo_url: null } }
})()

const useBrandingStore = create((set) => ({
  name: saved.name,
  logo_url: saved.logo_url,
  loading: false,
  setBranding: (data) => {
    if (data.name) localStorage.setItem('brandingName', data.name)
    if (data.logo_url) localStorage.setItem('brandingLogo', data.logo_url)
    set({ name: data.name || null, logo_url: data.logo_url || null, loading: false })
  },
  clearBranding: () => {
    localStorage.removeItem('brandingName')
    localStorage.removeItem('brandingLogo')
    set({ name: null, logo_url: null })
  },
}))

export default useBrandingStore
