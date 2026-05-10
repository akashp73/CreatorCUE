import React, { useRef, useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions, ScrollView, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useAuthStore from '../store/authStore'
import apiDefault from '../services/api'

const PURPLE  = '#4a1a8a'
const BG      = '#f0f0f6'
const WHITE   = '#ffffff'
const TEXT    = '#1a1a2e'
const MUTED   = '#6b7280'
const W       = Dimensions.get('window').width

const NAV_ITEMS = [
  { key: 'Dashboard',    label: 'Dashboard',         icon: 'grid-outline' },
  { key: 'My Leads',     label: 'My Leads',           icon: 'people-outline' },
  { key: 'Hot Leads',    label: 'Hot Leads',          icon: 'flame-outline',   activeColor: '#ef4444' },
  { key: 'Tasks',        label: 'Tasks',              icon: 'checkbox-outline' },
  { key: 'Campaigns',    label: 'Campaigns',          icon: 'megaphone-outline' },
  { key: 'CallLogs',     label: 'Call Logs',          icon: 'call-outline' },
  { key: 'DailyReport',  label: 'My Report',          icon: 'bar-chart-outline' },
]

const SETTING_ITEMS = [
  { key: 'CallSettings', label: 'Auto WhatsApp Settings', icon: 'logo-whatsapp', color: '#25D366' },
]

export default function DrawerMenu({ visible, onClose, navigation, currentScreen }) {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const slideAnim = useRef(new Animated.Value(-W * 0.75)).current
  const [institutionName, setInstitutionName] = useState(null)

  useEffect(() => {
    apiDefault.get('/institution/branding')
      .then(r => setInstitutionName(r.data?.name || null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -W * 0.75,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start()
  }, [visible])

  const navigate = (screen) => {
    onClose()
    setTimeout(() => navigation.navigate(screen), 150)
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          onClose()
          await logout()
        },
      },
    ])
  }

  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Drawer panel */}
      <Animated.View style={[s.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Profile section */}
        <View style={s.profile}>
          <View style={s.brandRow}>
            <View style={s.logoBox}>
              <Ionicons name="school-outline" size={18} color="#ffffff" />
            </View>
            <Text style={s.brandName}>{institutionName || 'EduCRM'}</Text>
          </View>
          <View style={[s.avatar, { marginTop: 16 }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName} numberOfLines={1}>{user?.name || 'Counsellor'}</Text>
            <Text style={s.profileRole}>{user?.role || 'COUNSELLOR'}</Text>
            {(institutionName || user?.institution?.name) && (
              <Text style={s.profileInst} numberOfLines={1}>{institutionName || user.institution.name}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.nav} showsVerticalScrollIndicator={false}>
          {/* Main nav items */}
          {NAV_ITEMS.map(item => {
            const isActive = currentScreen === item.key
            const color = item.activeColor || PURPLE
            return (
              <TouchableOpacity key={item.key} style={[s.navItem, isActive && { backgroundColor: PURPLE + '12' }]} onPress={() => navigate(item.key)} activeOpacity={0.7}>
                <View style={[s.navIcon, { backgroundColor: (isActive ? color : MUTED) + '15' }]}>
                  <Ionicons name={item.icon} size={18} color={isActive ? color : MUTED} />
                </View>
                <Text style={[s.navLabel, isActive && { color, fontWeight: '700' }]}>{item.label}</Text>
                {isActive && <View style={[s.activeBar, { backgroundColor: color }]} />}
              </TouchableOpacity>
            )
          })}

          {/* Divider */}
          <View style={s.divider} />

          {/* Settings items */}
          {SETTING_ITEMS.map(item => (
            <TouchableOpacity key={item.key} style={s.navItem} onPress={() => navigate(item.key)} activeOpacity={0.7}>
              <View style={[s.navIcon, { backgroundColor: (item.color || MUTED) + '15' }]}>
                <Ionicons name={item.icon} size={18} color={item.color || MUTED} />
              </View>
              <Text style={s.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={s.divider} />

          {/* Logout */}
          <TouchableOpacity style={s.navItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[s.navIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            </View>
            <Text style={[s.navLabel, { color: '#ef4444' }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>EduCRM · v2.0</Text>
        </View>
      </Animated.View>
    </Modal>
  )
}

export function HamburgerBtn({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={hb.btn} activeOpacity={0.8}>
      <Ionicons name="menu" size={20} color="rgba(255,255,255,0.9)" />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', height: '100%' },
  drawer:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: W * 0.78, maxWidth: 300, backgroundColor: WHITE, elevation: 24, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.25, shadowRadius: 16 },
  profile:  { backgroundColor: PURPLE, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
  logoBox:  { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  brandName:{ fontSize: 16, fontWeight: '800', color: WHITE, flex: 1 },
  avatar:   { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:{ fontSize: 18, fontWeight: '800', color: WHITE },
  profileName: { fontSize: 16, fontWeight: '800', color: WHITE },
  profileRole: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  profileInst: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  nav:      { flex: 1, paddingVertical: 12 },
  navItem:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, marginHorizontal: 10, marginBottom: 2, position: 'relative' },
  navIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  navLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },
  activeBar:{ position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2 },
  divider:  { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16, marginVertical: 10 },
  footer:   { padding: 20, paddingBottom: 32, alignItems: 'center' },
  footerText:{ fontSize: 12, color: '#9ca3af' },
})

const hb = StyleSheet.create({
  btn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
})
