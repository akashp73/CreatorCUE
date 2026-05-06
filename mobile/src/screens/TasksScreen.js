import React, { useState } from 'react'
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  RefreshControl, Animated,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tasksApi } from '../services/api'

const NAVY = '#1B2B4B', SAFFRON = '#F6AD2B'

function TaskItem({ task, onComplete, navigation }) {
  const isOverdue = new Date(task.due_at) < new Date()
  return (
    <View style={[s.taskCard, isOverdue && s.taskOverdue]}>
      <TouchableOpacity style={[s.checkbox, task.is_completed && s.checkboxDone]} onPress={() => !task.is_completed && onComplete(task.id)}>
        {task.is_completed && <MaterialCommunityIcons name="check" size={14} color="white" />}
      </TouchableOpacity>
      <View style={s.taskBody}>
        <TouchableOpacity onPress={() => navigation.navigate('LeadDetail', { leadId: task.lead?.id, leadName: task.lead?.name })}>
          <Text style={s.leadName}>{task.lead?.name}</Text>
        </TouchableOpacity>
        <Text style={[s.taskTitle, task.is_completed && s.taskDone]}>{task.title}</Text>
        <View style={s.taskMeta}>
          <MaterialCommunityIcons name="clock-outline" size={12} color="#9CA3AF" />
          <Text style={s.taskTime}>{new Date(task.due_at).toLocaleString()}</Text>
          {isOverdue && !task.is_completed && <View style={s.overdueBadge}><Text style={s.overdueText}>OVERDUE</Text></View>}
        </View>
      </View>
    </View>
  )
}

export default function TasksScreen({ navigation }) {
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mob-tasks'],
    queryFn: () => tasksApi.getMyTasks().then(r => r.data),
  })

  const complete = async (id) => {
    try { await tasksApi.complete(id); qc.invalidateQueries(['mob-tasks']) }
    catch {}
  }

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false) }

  const sections = [
    { title: '⚠️ Overdue', data: data?.overdue || [], color: '#E53E3E' },
    { title: '📅 Due Today', data: data?.due_today || [], color: SAFFRON },
    { title: '🔵 Upcoming', data: data?.upcoming || [], color: '#3182CE' },
  ].filter(s => s.data.length > 0)

  const total = (data?.overdue?.length || 0) + (data?.due_today?.length || 0) + (data?.upcoming?.length || 0)

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Tasks</Text>
        <Text style={s.headerSub}>{total} pending</Text>
      </View>

      {total === 0 && !isLoading ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>✅</Text>
          <Text style={s.emptyTitle}>All caught up!</Text>
          <Text style={s.emptySub}>No pending tasks right now.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={t => t.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SAFFRON} />}
          renderSectionHeader={({ section }) => (
            <View style={[s.sectionHeader, { borderLeftColor: section.color, borderLeftWidth: 3 }]}>
              <Text style={[s.sectionTitle, { color: section.color }]}>{section.title}</Text>
              <View style={[s.badge, { backgroundColor: section.color + '20' }]}>
                <Text style={[s.badgeText, { color: section.color }]}>{section.data.length}</Text>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  header: { backgroundColor: NAVY, padding: 16, paddingTop: 50 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingVertical: 8, backgroundColor: 'transparent', marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  taskCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
  taskOverdue: { backgroundColor: '#FFF5F5' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  checkboxDone: { backgroundColor: '#38A169', borderColor: '#38A169' },
  taskBody: { flex: 1 },
  leadName: { fontSize: 12, fontWeight: '600', color: NAVY, marginBottom: 3 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: '#1F2937', lineHeight: 20 },
  taskDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  taskTime: { fontSize: 11, color: '#9CA3AF', flex: 1 },
  overdueBadge: { backgroundColor: '#FED7D7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  overdueText: { fontSize: 9, fontWeight: '700', color: '#C53030' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
})
