import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, Alert,
  Modal, TextInput, StatusBar,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import apiDefault, { dashboardApi, leadsApi, callsApi } from '../services/api'
import useAuthStore from '../store/authStore'

const BG      = '#0f172a'
const SURFACE = 'rgba(255,255,255,0.06)'
const BORDER  = 'rgba(255,255,255,0.1)'
const ACCENT  = '#6366f1'
const SUCCESS = '#10b981'
const DANGER  = '#ef4444'
const GOLD    = '#f59e0b'
const TEXT    = '#f1f5f9'
const MUTED   = '#94a3b8'

function AddLeadModal({ visible, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', phone: '', course_interested: '', source: 'WEBSITE' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) return Alert.alert('Error', 'Name and phone are required')
    setSaving(true)
    try {
      await apiDefault.post('/leads', form)
      onAdded()
      onClose()
      setForm({ name: '', phone: '', course_interested: '', source: 'WEBSITE' })
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create lead')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={m.root}>
        <View style={m.header}>
          <Text style={m.title}>New Lead</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={MUTED} /></TouchableOpacity>
        </View>
        <ScrollView style={m.body} contentContainerStyle={{ gap: 14 }}>
          {[
            { label: 'Full Name *', key: 'name', placeholder: 'Rahul Sharma' },
            { label: 'Phone *', key: 'phone', placeholder: '9876543210', keyboardType: 'phone-pad' },
            { label: 'Course Interested', key: 'course_interested', placeholder: 'MBA, B.Tech...' },
          ].map(f => (
            <View key={f.key}>
              <Text style={m.label}>{f.label}</Text>
              <TextInput
                style={m.input}
                value={form[f.key]}
                onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                placeholder={f.placeholder}
                placeholderTextColor="#475569"
                keyboardType={f.keyboardType || 'default'}
              />
            </View>
          ))}
        </ScrollView>
        <View style={m.footer}>
          <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
            <Text style={m.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={m.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={m.saveText}>Add Lead</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

function BigStat({ icon, value, label, color, glow, loading, badge }) {
  return (
    <View style={[bs.card, { borderColor: color + '40', shadowColor: color, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8 }]}>
      <View style={[bs.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      {loading
        ? <ActivityIndicator size="large" color={color} style={{ marginVertical: 8 }} />
        : <Text style={[bs.value, { color }]}>{value ?? '—'}</Text>
      }
      <Text style={bs.label}>{label}</Text>
      {badge && (
        <View style={[bs.badge, { backgroundColor: DANGER + '20' }]}>
          <Text style={[bs.badgeText, { color: DANGER }]}>{badge}</Text>
        </View>
      )}
    </View>
  )
}

function QuickActionBtn({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[qa.btn, { backgroundColor: color + '18', borderColor: color + '30' }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[qa.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  )
}

function RecentLeadRow({ lead, onPress }) {
  const scoreColor = lead.score_label === 'HOT' ? DANGER : lead.score_label === 'WARM' ? GOLD : ACCENT
  const stageColors = { NEW: ACCENT, COUNSELLING: GOLD, APPLIED: '#3b82f6', PAYMENT_PENDING: '#f97316', ENROLLED: SUCCESS }
  const stageColor = stageColors[lead.enrollment_stage] || ACCENT
  return (
    <TouchableOpacity style={s.recentRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.avatar, { backgroundColor: ACCENT + '18' }]}>
        <Text style={[s.avatarText, { color: ACCENT }]}>{lead.name?.[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.recentName} numberOfLines={1}>{lead.name}</Text>
        <Text style={s.recentSub} numberOfLines={1}>{lead.course_interested || lead.source}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <View style={[s.scorePill, { backgroundColor: scoreColor + '18' }]}>
          <Text style={[s.scoreText, { color: scoreColor }]}>{lead.activity_score}</Text>
        </View>
        <Text style={{ fontSize: 9, color: stageColor, fontWeight: '700' }}>{lead.enrollment_stage || 'NEW'}</Text>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL(`tel:${lead.phone}`)} style={s.callMini}>
        <Ionicons name="call-outline" size={16} color={SUCCESS} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default function DashboardScreen({ navigation }) {
  const user = useAuthStore(s => s.user)
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [showAddLead, setShowAddLead] = useState(false)

  const { data: stats, isLoading: sl, refetch: rs } = useQuery({
    queryKey: ['mob-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
  })
  const { data: recentData, isLoading: rl, refetch: rr } = useQuery({
    queryKey: ['mob-recent-leads'],
    queryFn: () => leadsApi.getAll({ page: 1, limit: 6 }).then(r => r.data),
  })
  const { data: todayReport } = useQuery({
    queryKey: ['mob-today-calls'],
    queryFn: () => callsApi.today().then(r => r.data),
  })

  const recentLeads = recentData?.leads || recentData?.data || []
  const overdueCount = (todayReport?.pending_calls || 0)

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([rs(), rr()])
    setRefreshing(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <AddLeadModal
        visible={showAddLead}
        onClose={() => setShowAddLead(false)}
        onAdded={() => { qc.invalidateQueries(['mob-recent-leads']); qc.invalidateQueries(['mob-stats']) }}
      />

      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.logoMark}>
              <Ionicons name="school-outline" size={16} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greeting}, {firstName}</Text>
              <Text style={s.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CallSettings')} style={s.headerBtn}>
              <Ionicons name="settings-outline" size={18} color={MUTED} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3 BIG NUMBERS */}
        <View style={s.bigStatsGrid}>
          <BigStat
            icon="call-outline"
            value={stats?.tasks_due_today ?? '—'}
            label="Pending Calls"
            color={overdueCount > 0 ? DANGER : ACCENT}
            loading={sl}
            badge={overdueCount > 0 ? `${overdueCount} overdue` : null}
          />
          <BigStat
            icon="people-outline"
            value={stats?.new_leads_today ?? '—'}
            label="Leads to Contact"
            color="#3b82f6"
            loading={sl}
          />
          <BigStat
            icon="trophy-outline"
            value={stats?.enrolled_this_month ?? '—'}
            label="My Conversions"
            color={SUCCESS}
            loading={sl}
          />
        </View>

        {/* Quick Actions */}
        <View style={s.quickActions}>
          <QuickActionBtn icon="person-add-outline" label="New Lead" color={ACCENT} onPress={() => setShowAddLead(true)} />
          <QuickActionBtn icon="call-outline" label="My Leads" color="#3b82f6" onPress={() => navigation.navigate('My Leads')} />
          <QuickActionBtn icon="flame-outline" label="Hot Leads" color={DANGER} onPress={() => navigation.navigate('Hot Leads')} />
          <QuickActionBtn icon="document-text-outline" label="My Report" color={GOLD} onPress={() => navigation.navigate('DailyReport')} />
        </View>

        {/* Recent Leads */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Leads</Text>
            <TouchableOpacity onPress={() => navigation.navigate('My Leads')}>
              <Text style={s.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {rl ? (
            <ActivityIndicator size="small" color={ACCENT} style={{ paddingVertical: 20 }} />
          ) : recentLeads.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="people-outline" size={36} color="#334155" />
              <Text style={s.emptyText}>No leads yet</Text>
            </View>
          ) : (
            <View style={s.card}>
              {recentLeads.map((lead, i) => (
                <View key={lead.id} style={i > 0 ? s.rowDivider : null}>
                  <RecentLeadRow
                    lead={lead}
                    onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id, leadName: lead.name })}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// Styles
const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  content:       { paddingBottom: 32 },
  header:        { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)' },
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoMark:      { width: 32, height: 32, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  greeting:      { fontSize: 20, fontWeight: '800', color: TEXT },
  date:          { fontSize: 12, color: MUTED, marginTop: 1 },
  headerBtn:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  bigStatsGrid:  { flexDirection: 'row', paddingHorizontal: 16, marginTop: 20, gap: 10 },
  quickActions:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  section:       { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: TEXT },
  sectionLink:   { fontSize: 13, color: ACCENT, fontWeight: '600' },
  card:          { backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  recentRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rowDivider:    { borderTopWidth: 1, borderTopColor: BORDER },
  avatar:        { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:    { fontSize: 15, fontWeight: '700' },
  recentName:    { fontSize: 14, fontWeight: '600', color: TEXT },
  recentSub:     { fontSize: 12, color: MUTED, marginTop: 1 },
  scorePill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  scoreText:     { fontSize: 12, fontWeight: '800' },
  callMini:      { padding: 6 },
  emptyBox:      { backgroundColor: SURFACE, borderRadius: 16, alignItems: 'center', paddingVertical: 32, borderWidth: 1, borderColor: BORDER },
  emptyText:     { fontSize: 14, color: MUTED, marginTop: 8 },
})

const bs = StyleSheet.create({
  card:   { flex: 1, borderRadius: 20, padding: 14, alignItems: 'center', backgroundColor: SURFACE, borderWidth: 1, minHeight: 140 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  value:  { fontSize: 32, fontWeight: '900', marginBottom: 4 },
  label:  { fontSize: 10, color: MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  badge:  { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700' },
})

const qa = StyleSheet.create({
  btn:   { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  label: { fontSize: 13, fontWeight: '700' },
})

const m = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#1e293b' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  title:     { fontSize: 17, fontWeight: '700', color: TEXT },
  body:      { flex: 1, padding: 20 },
  label:     { fontSize: 11, fontWeight: '700', color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:     { borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: TEXT, backgroundColor: SURFACE },
  footer:    { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: BORDER },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  cancelText:{ fontSize: 14, fontWeight: '600', color: MUTED },
  saveBtn:   { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' },
  saveText:  { fontSize: 14, fontWeight: '700', color: '#ffffff' },
})
