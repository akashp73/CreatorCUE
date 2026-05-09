import { create } from 'zustand'

const useBrandingStore = create((set) => ({
  name: null,
  logo_url: null,
  primary_color: '#6366f1',
  loading: true,
  setBranding: (data) => set({ ...data, loading: false }),
  setLoading: (v) => set({ loading: v }),
}))

export default useBrandingStore
