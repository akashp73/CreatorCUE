import { create } from 'zustand'

const saved = localStorage.getItem('educrm_theme')

const useThemeStore = create((set) => ({
  isDark: saved !== 'light',
  toggle: () => set((s) => {
    const next = !s.isDark
    localStorage.setItem('educrm_theme', next ? 'dark' : 'light')
    return { isDark: next }
  }),
  setDark: (v) => {
    localStorage.setItem('educrm_theme', v ? 'dark' : 'light')
    set({ isDark: v })
  },
}))

export default useThemeStore
