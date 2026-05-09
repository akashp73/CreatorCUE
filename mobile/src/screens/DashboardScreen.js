import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, Alert,
  Modal, TextInput, StatusBar, Animated,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import apiDefault, { dashboardApi, leadsApi, callsApi } from '../services/api'
import useAuthStore from '../store/authStore'
import { useCallStore } from '../store/callStore'
import DrawerMenu, { HamburgerBtn } from '../components/DrawerMenu'

// NeoDove color palette — light theme
const PURPLE  = '#4a1a8a'
const PURPLE_L = '#6d28d9'
const BG      = '#f0f0f6'
const WHITE   = '#ffffff'
const TEXT    = '#1a1a2e'
const MUTED   = '#6b7280'
const ACCENT  = '#4a1a8a'

const STATUS_OPTIONS = [
  { key: 'ACTIVE',     label: 'Active',      icon: 'radio-button-on',  color: '#10b981' },
  { key: 'ON_BREAK',   label: 'On Break',    icon: 'cafe-outline',     color: '#f59e0b' },
  { key: 'IN_MEETING', label: 'In Meeting',  icon: 'people-outline',   color: '#6366f1' },
  { key: 'OFFLINE',    label: 'Offline',     icon: 'power-outline',    color: '#ef4444' },
]

// Colored tile config (NeoDove grid)
const TILES = [
  { key: 'campaigns',  label: 'My Campaigns',  icon: 'megaphone-outline',  color: '#3b82f6', bg: '#eff6ff', screen: 'Campaigns' },
  { key: 'leads',      label: 'My Leads',       icon: 'people-outline',     color: '#f97316', bg: '#fff7ed', screen: 'My Leads' },
  { key: 'tasks',      label: 'My Tasks',       icon: 'checkbox-outline',   color: '#ec4899', bg: '#fdf2f8', screen: 'Tasks' },
  { key: 'report',     label: 'My Report',      icon: 'bar-chart-outline',  color: '#10b981', bg: '#f0fdf4', screen: 'DailyReport' },
  { key: 'calls',      label: 'Call Logs',      icon: 'call-outline',       color: PURPLE,    bg: '#f5f3ff', screen: 'CallLogs' },
  { key: 'walkin',     label: 'Walk-in Leads',  icon: 'walk-outline',       color: '#06b6d4', bg: '#ecfeff', screen: 'My Leads' },
]

function BreakTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startTime) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(startTime)) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startTime])
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return <Text style={t.breakTimer}>{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</Text>
}

function StatusModal({ visible, current, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={sm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={sm.sheet}>
          <Text style={sm.title}>Set Status</Text>
          {STATUS_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} style={[sm.option, current === opt.key && { backgroundColor: opt.color + '15' }]} onPress={() => onSelect(opt.key)}>
              <View style={[sm.dot, { backgroundColor: opt.color }]} />
              <Text style={[sm.optLabel, { color: current === opt.key ? opt.color : TEXT }]}>{opt.label}</Text>
              {current === opt.key && <Ionicons name="checkmark" size={16} color={opt.color} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

function AddLeadModal({ visible, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', phone: '', course_interested: '', source: 'WEBSITE' })
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) return Alert.alert('Error', 'Name and phone required')
    setSaving(true)
    try { await apiDefault.post('/leads', form); onAdded(); onClose(); setForm({ name: '', phone: '', course_interested: '', source: 'WEBSITE' }) }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={m.root}>
        <View style={m.header}><Text style={m.title}>New Lead</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={MUTED} /></TouchableOpacity></View>
        <ScrollView style={m.body} contentContainerStyle={{ gap: 14 }}>
          {[{ label: 'Full Name *', key: 'name' }, { label: 'Phone *', key: 'phone', keyboardType: 'phone-pad' }, { label: 'Course', key: 'course_interested' }].map(f => (
            <View key={f.key}>
              <Text style={m.label}>{f.label}</Text>
              <TextInput style={m.input} value={form[f.key]} onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))} keyboardType={f.keyboardType || 'default'} placeholderTextColor={MUTED} />
            </View>
          ))}
        </ScrollView>
        <View style={m.footer}>
          <TouchableOpacity style={m.cancelBtn} onPress={onClose}><Text style={m.cancelText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={m.saveBtn} onPress={save} disabled={saving}>{saving ? <ActivityIndicator size="small" color="white" /> : <Text style={m.saveText}>Add Lead</Text>}</TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default function DashboardScreen({ navigation }) {
  const user = useAuthStore(s => s.user)
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [showAddLead, setShowAddLead] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [userStatus, setUserStatus] = useState('ACTIVE')
  const [breakStart, setBreakStart] = useState(null)

  const { data: stats, isLoading: sl, refetch: rs } = useQuery({ queryKey: ['mob-stats'], queryFn: () => dashboardApi.getStats().then(r => r.data) })
  const { data: recentData, isLoading: rl, refetch: rr } = useQuery({ queryKey: ['mob-recent-leads'], queryFn: () => leadsApi.getAll({ page: 1, limit: 5 }).then(r => r.data) })

  const recentLeads = recentData?.leads || recentData?.data || []
  const onRefresh = async () => { setRefreshing(true); await Promise.all([rs(), rr()]); setRefreshing(false) }

  const handleStatusSelect = (status) => {
    setUserStatus(status)
    setShowStatus(false)
    if (status === 'ON_BREAK') setBreakStart(new Date().toISOString())
    else setBreakStart(null)
    apiDefault.put(`/team/${user?.id}/status`, { status }).catch(() => {})
  }

  const currentStatus = STATUS_OPTIONS.find(o => o.key === userStatus) || STATUS_OPTIONS[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      <StatusModal visible={showStatus} current={userStatus} onSelect={handleStatusSelect} onClose={() => setShowStatus(false)} />
      <AddLeadModal visible={showAddLead} onClose={() => setShowAddLead(false)} onAdded={() => { qc.invalidateQueries(['mob-recent-leads']); qc.invalidateQueries(['mob-stats']) }} />
      <DrawerMenu visible={showDrawer} onClose={() => setShowDrawer(false)} navigation={navigation} currentScreen="Dashboard" />

      <ScrollView style={s.root} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}>
        {/* NeoDove-style header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <HamburgerBtn onPress={() => setShowDrawer(true)} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.greeting}>{greeting},</Text>
              <Text style={s.userName}>{user?.name?.split(' ')[0] || 'Counsellor'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CallSettings')} style={s.headerIcon}>
              <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerIcon}>
              <Ionicons name="notifications-outline" size={18} color="rgba(255,255,255,0.8)" />
              <View style={s.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Break status bar */}
          <TouchableOpacity style={s.statusBar} onPress={() => setShowStatus(true)} activeOpacity={0.85}>
            <View style={[s.statusDot, { backgroundColor: currentStatus.color }]} />
            <Text style={s.statusLabel}>{currentStatus.label}</Text>
            {userStatus === 'ON_BREAK' && breakStart && <BreakTimer startTime={breakStart} />}
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* 3 key stats */}
          <View style={s.miniStats}>
            {[
              { label: 'Total Leads', val: stats?.total_leads ?? '—', icon: 'people-outline' },
              { label: 'Tasks Today', val: stats?.tasks_due_today ?? '—', icon: 'checkbox-outline' },
              { label: 'Enrolled',    val: stats?.enrolled_this_month ?? '—', icon: 'trophy-outline' },
            ].map((stat, i) => (
              <View key={i} style={[s.miniStat, i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
                {sl ? <ActivityIndicator size="small" color="white" /> : <Text style={s.miniVal}>{stat.val}</Text>}
                <Text style={s.miniLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 2×3 colored tile grid ─────────────────────────── */}
        <View style={s.tilesGrid}>
          {TILES.map(tile => (
            <TouchableOpacity key={tile.key} style={[s.tile, { backgroundColor: tile.bg }]} onPress={() => navigation.navigate(tile.screen)} activeOpacity={0.8}>
              <View style={[s.tileIcon, { backgroundColor: tile.color + '20' }]}>
                <Ionicons name={tile.icon} size={22} color={tile.color} />
              </View>
              <Text style={[s.tileLabel, { color: tile.color }]}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent leads */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Recent Leads</Text>
            <TouchableOpacity onPress={() => navigation.navigate('My Leads')}><Text style={s.viewAll}>View all</Text></TouchableOpacity>
          </View>
          {rl ? <ActivityIndicator size="small" color={PURPLE} style={{ paddingVertical: 20 }} /> : (
            <View style={s.card}>
              {recentLeads.length === 0 && <Text style={s.emptyText}>No leads yet</Text>}
              {recentLeads.map((lead, i) => {
                const scoreColor = lead.score_label === 'HOT' ? '#ef4444' : lead.score_label === 'WARM' ? '#f59e0b' : PURPLE
                return (
                  <TouchableOpacity key={lead.id} style={[s.leadRow, i > 0 && s.divider]} onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id, leadName: lead.name })} activeOpacity={0.7}>
                    <View style={[s.avatar, { backgroundColor: PURPLE + '15' }]}>
                      <Text style={[s.avatarText, { color: PURPLE }]}>{lead.name?.[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.leadName} numberOfLines={1}>{lead.name}</Text>
                      <Text style={s.leadSub} numberOfLines={1}>{lead.course_interested || lead.source}</Text>
                    </View>
                    <View style={[s.scorePill, { backgroundColor: scoreColor + '15' }]}>
                      <Text style={[s.scoreText, { color: scoreColor }]}>{lead.activity_score}</Text>
                    </View>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${lead.phone}`)} style={s.callBtn}>
                      <Ionicons name="call-outline" size={15} color="#10b981" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Start Calling FAB */}
      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('My Leads')} activeOpacity={0.9}>
        <Ionicons name="call" size={20} color="white" />
        <Text style={s.fabText}>Start Calling</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  header:       { backgroundColor: PURPLE, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  headerTop:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  greeting:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  userName:     { fontSize: 22, fontWeight: '800', color: WHITE },
  headerIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  notifDot:     { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: PURPLE },
  statusBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusLabel:  { fontSize: 13, fontWeight: '700', color: WHITE, flex: 1 },
  miniStats:    { flexDirection: 'row' },
  miniStat:     { flex: 1, alignItems: 'center', paddingVertical: 8 },
  miniVal:      { fontSize: 22, fontWeight: '900', color: WHITE },
  miniLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  tilesGrid:    { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  tile:         { width: '47%', borderRadius: 16, padding: 16, alignItems: 'flex-start', gap: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  tileIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel:    { fontSize: 13, fontWeight: '700' },
  section:      { paddingHorizontal: 16, marginBottom: 100 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: TEXT },
  viewAll:      { fontSize: 13, color: PURPLE, fontWeight: '600' },
  card:         { backgroundColor: WHITE, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  leadRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  divider:      { borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  avatar:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 15, fontWeight: '800' },
  leadName:     { fontSize: 14, fontWeight: '600', color: TEXT },
  leadSub:      { fontSize: 12, color: MUTED, marginTop: 1 },
  scorePill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  scoreText:    { fontSize: 12, fontWeight: '800' },
  callBtn:      { padding: 6 },
  emptyText:    { fontSize: 14, color: MUTED, textAlign: 'center', padding: 24 },
  fab:          { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: PURPLE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, elevation: 8, shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  fabText:      { color: WHITE, fontSize: 15, fontWeight: '800' },
})

const t = StyleSheet.create({
  breakTimer: { fontSize: 12, fontWeight: '800', color: '#f59e0b' },
})

const sm = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  title:    { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 16 },
  option:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6 },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  optLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
})

const m = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#fafafa' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: WHITE },
  title:     { fontSize: 17, fontWeight: '700', color: TEXT },
  body:      { flex: 1, padding: 20 },
  label:     { fontSize: 11, fontWeight: '700', color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:     { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: TEXT, backgroundColor: WHITE },
  footer:    { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: WHITE },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelText:{ fontSize: 14, fontWeight: '600', color: MUTED },
  saveBtn:   { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: PURPLE, alignItems: 'center' },
  saveText:  { fontSize: 14, fontWeight: '700', color: WHITE },
})
