import React, { useState } from 'react'
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { tasksApi } from '../services/api'

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'
const BG     = '#f8fafc'

const SECTIONS_META = [
  { key: 'overdue',   title: 'Overdue',   icon: 'alert-circle-outline',     color: '#ef4444' },
  { key: 'due_today', title: 'Due Today', icon: 'today-outline',            color: '#f59e0b' },
  { key: 'upcoming',  title: 'Upcoming',  icon: 'calendar-outline',         color: ACCENT },
]

function TaskItem({ task, onComplete, navigation }) {
  const isOverdue = !task.is_completed && new Date(task.due_at) < new Date()

  return (
    <View style={[ts.taskCard, isOverdue && ts.taskOverdue]}>
      <TouchableOpacity
        style={[ts.checkbox, task.is_completed && ts.checkboxDone]}
        onPress={() => !task.is_completed && onComplete(task.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {task.is_completed && <Ionicons name="checkmark" size={13} color="white" />}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        {task.lead && (
          <TouchableOpacity onPress={() => navigation.navigate('LeadDetail', { leadId: task.lead.id, leadName: task.lead.name })}>
            <Text style={ts.leadName}>{task.lead.name}</Text>
          </TouchableOpacity>
        )}
        <Text style={[ts.taskTitle, task.is_completed && ts.taskDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={ts.metaRow}>
          <Ionicons name="time-outline" size={12} color="#94a3b8" />
          <Text style={ts.timeText}>{new Date(task.due_at).toLocaleString()}</Text>
          {isOverdue && (
            <View style={ts.overduePill}>
              <Text style={ts.overdueText}>OVERDUE</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default function TasksScreen({ navigation }) {
  const qc = useQueryClient()
  const [refreshing, setRef] = useState(false)
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['mob-tasks'],
    queryFn: () => tasksApi.getMyTasks().then(r => r.data),
  })

  const complete = async (id) => {
    try { await tasksApi.complete(id); qc.invalidateQueries(['mob-tasks']) }
    catch {}
  }

  const onRefresh = async () => { setRef(true); await refetch(); setRef(false) }

  const sections = SECTIONS_META
    .map(m => ({ ...m, data: data?.[m.key] || [] }))
    .filter(s => s.data.length > 0)

  const total = SECTIONS_META.reduce((sum, m) => sum + (data?.[m.key]?.length || 0), 0)

  return (
    <View style={ts.root}>
      {/* Header */}
      <View style={ts.header}>
        <Text style={ts.headerTitle}>My Tasks</Text>
        <Text style={ts.headerSub}>{total} pending</Text>
      </View>

      {isLoading ? (
        <View style={ts.center}><ActivityIndicator size="large" color={ACCENT} /></View>
      ) : error ? (
        <View style={ts.center}>
          <Ionicons name="warning-outline" size={40} color="#ef4444" />
          <Text style={ts.errorText}>Failed to load tasks</Text>
          <TouchableOpacity style={ts.retryBtn} onPress={refetch}>
            <Text style={ts.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : total === 0 ? (
        <View style={ts.center}>
          <View style={ts.doneCircle}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text style={ts.doneTitle}>All done!</Text>
          <Text style={ts.doneSub}>No pending tasks right now.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={t => t.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={[ts.sectionHeader, { backgroundColor: section.color + '12' }]}>
              <Ionicons name={section.icon} size={15} color={section.color} />
              <Text style={[ts.sectionTitle, { color: section.color }]}>{section.title}</Text>
              <View style={[ts.sectionBadge, { backgroundColor: section.color + '20' }]}>
                <Text style={[ts.sectionCount, { color: section.color }]}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <TaskItem task={item} onComplete={complete} navigation={navigation} />
          )}
        />
      )}
    </View>
  )
}

const ts = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  header:        { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  headerSub:     { fontSize: 12, color: '#64748b', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 8, marginTop: 4 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', flex: 1, textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  sectionCount:  { fontSize: 12, fontWeight: '700' },
  taskCard:      { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  taskOverdue:   { backgroundColor: '#fff5f5', borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  checkbox:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  checkboxDone:  { backgroundColor: '#10b981', borderColor: '#10b981' },
  leadName:      { fontSize: 11, fontWeight: '700', color: ACCENT, marginBottom: 3, textDecorationLine: 'underline' },
  taskTitle:     { fontSize: 14, fontWeight: '500', color: '#0f172a', lineHeight: 20 },
  taskDone:      { textDecorationLine: 'line-through', color: '#94a3b8' },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  timeText:      { fontSize: 11, color: '#94a3b8', flex: 1 },
  overduePill:   { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  overdueText:   { fontSize: 9, fontWeight: '800', color: '#dc2626', letterSpacing: 0.3 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  doneCircle:    { marginBottom: 12 },
  doneTitle:     { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  doneSub:       { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  errorText:     { fontSize: 14, color: '#ef4444', marginTop: 10 },
  retryBtn:      { marginTop: 12, backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:     { color: '#ffffff', fontWeight: '700' },
})
