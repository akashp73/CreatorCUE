import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const STORAGE_KEY = 'educrm_call_settings'

const defaults = {
  autoWhatsApp: false,
  cooldownDays: 7,
  whatsappTemplate: 'Hi {name}! Following up from our call. Let me know if you have any questions about {course}.',
  cooldowns: {},      // { [phone]: timestamp }
  pendingCall: null,  // { phone, leadId, leadName, course, startTime }
}

export const useCallStore = create((set, get) => ({
  ...defaults,

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY)
      if (raw) set(JSON.parse(raw))
    } catch {}
  },

  _persist: async () => {
    const s = get()
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({
        autoWhatsApp: s.autoWhatsApp,
        cooldownDays: s.cooldownDays,
        whatsappTemplate: s.whatsappTemplate,
        cooldowns: s.cooldowns,
      }))
    } catch {}
  },

  setAutoWhatsApp: (v) => { set({ autoWhatsApp: v }); get()._persist() },
  setCooldownDays: (v) => { set({ cooldownDays: v }); get()._persist() },
  setTemplate: (v) => { set({ whatsappTemplate: v }); get()._persist() },

  setPendingCall: (call) => set({ pendingCall: call }),
  clearPendingCall: () => set({ pendingCall: null }),

  isOnCooldown: (phone) => {
    const { cooldowns, cooldownDays } = get()
    const ts = cooldowns[phone]
    return ts ? Date.now() - ts < cooldownDays * 86400000 : false
  },

  recordCooldown: (phone) => {
    const cooldowns = { ...get().cooldowns, [phone]: Date.now() }
    set({ cooldowns })
    get()._persist()
  },
}))
