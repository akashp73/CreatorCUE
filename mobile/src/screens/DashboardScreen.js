import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, Alert,
  Modal, TextInput,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import apiDefault, { dashboardApi, leadsApi } from '../services/api'
import useAuthStore from '../store/authStore'

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'
const BG     = '#f8fafc'

// ── Quick Add Lead Modal ───────────────────────────────────────
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
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
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
                placeholderTextColor="#94a3b8"
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

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ iconName, label, value, color, loading }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[s.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={iconName} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.statLabel}>{label}</Text>
        {loading
          ? <ActivityIndicator size="small" color={color} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
          : <Text style={[s.statValue, { color }]}>{value ?? '—'}</Text>
        }
      </View>
    </View>
  )
}

// ── Recent Lead Row ───────────────────────────────────────────
function RecentLeadRow({ lead, onPress }) {
  const scoreColor = lead.score_label === 'HOT' ? '#ef4444' : lead.score_label === 'WARM' ? '#f59e0b' : '#3b82f6'
  return (
    <TouchableOpacity style={s.recentRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.avatar, { backgroundColor: ACCENT + '18' }]}>
        <Text style={[s.avatarText, { color: ACCENT }]}>{lead.name?.[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.recentName} numberOfLines={1}>{lead.name}</Text>
        <Text style={s.recentSub} numberOfLines={1}>{lead.course_interested || lead.source} · {lead.status}</Text>
      </View>
      <View style={[s.scorePill, { backgroundColor: scoreColor + '18' }]}>
        <Text style={[s.scoreText, { color: scoreColor }]}>{lead.activity_score}</Text>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL(`tel:${lead.phone}`)} style={s.callMini}>
        <Ionicons name="call-outline" size={16} color={ACCENT} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ── Main Screen ───────────────────────────────────────────────
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

  const recentLeads = recentData?.leads || recentData?.data || []

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([rs(), rr()])
    setRefreshing(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  const STATS = [
    { iconName: 'people-outline',    label: 'Total Leads',    value: stats?.total_leads,         color: ACCENT },
    { iconName: 'flame-outline',     label: 'Hot Leads',      value: stats?.hot_leads,            color: '#ef4444' },
    { iconName: 'checkmark-circle-outline', label: 'Tasks Today', value: stats?.tasks_due_today, color: '#f59e0b' },
    { iconName: 'trending-up-outline', label: 'Enrolled',     value: stats?.enrolled_this_month, color: '#10b981' },
  ]

  return (
    <View style={{ flex: 1 }}>
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
          <View style={s.headerLogoRow}>
            <View style={s.logoMark}>
              <Ionicons name="school-outline" size={18} color="#ffffff" />
            </View>
            <Text style={s.headerBrand}>EduCRM</Text>
          </View>
          <Text style={s.greeting}>{greeting}, {firstName}</Text>
          <Text style={s.headerDate}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          {STATS.map(c => (
            <StatCard key={c.label} {...c} loading={sl} />
          ))}
        </View>

        {/* Quick actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: ACCENT }]} onPress={() => setShowAddLead(true)} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={18} color="white" />
            <Text style={s.actionBtnText}>New Lead</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: NAVY }]} onPress={() => navigation.navigate('My Leads')} activeOpacity={0.85}>
            <Ionicons name="call-outline" size={18} color="white" />
            <Text style={s.actionBtnText}>My Leads</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => navigation.navigate('Hot Leads')} activeOpacity={0.85}>
            <Ionicons name="flame-outline" size={18} color="white" />
            <Text style={s.actionBtnText}>Hot Leads</Text>
          </TouchableOpacity>
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
              <Ionicons name="people-outline" size={36} color="#cbd5e1" />
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

// ── Styles ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  content:       { paddingBottom: 24 },
  header:        { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 24 },
  headerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  logoMark:      { width: 28, height: 28, borderRadius: 8, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  headerBrand:   { fontSize: 14, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  greeting:      { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headerDate:    { fontSize: 13, color: '#64748b', marginTop: 2 },
  statsGrid:     { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  statCard:      { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  statIcon:      { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel:     { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  statValue:     { fontSize: 24, fontWeight: '800', marginTop: 2 },
  actionsRow:    { flexDirection: 'row', paddingHorizontal: 16, marginTop: 14, gap: 8 },
  actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
  actionBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  section:       { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: NAVY },
  sectionLink:   { fontSize: 13, color: ACCENT, fontWeight: '600' },
  card:          { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  recentRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rowDivider:    { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  avatar:        { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:    { fontSize: 15, fontWeight: '700' },
  recentName:    { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  recentSub:     { fontSize: 12, color: '#64748b', marginTop: 1 },
  scorePill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  scoreText:     { fontSize: 12, fontWeight: '800' },
  callMini:      { padding: 6 },
  emptyBox:      { backgroundColor: '#ffffff', borderRadius: 16, alignItems: 'center', paddingVertical: 32, elevation: 1 },
  emptyText:     { fontSize: 14, color: '#94a3b8', marginTop: 8 },
})

const m = StyleSheet.create({
  root:      { flex: 1, backgroundColor: BG },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  title:     { fontSize: 17, fontWeight: '700', color: NAVY },
  body:      { flex: 1, padding: 20 },
  label:     { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:     { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: NAVY, backgroundColor: '#ffffff' },
  footer:    { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#ffffff' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  cancelText:{ fontSize: 14, fontWeight: '600', color: '#64748b' },
  saveBtn:   { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' },
  saveText:  { fontSize: 14, fontWeight: '700', color: '#ffffff' },
})
