import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, TextInput, ActivityIndicator,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { leadsApi, notesApi, tasksApi } from '../services/api'

const NAVY = '#1B2B4B', SAFFRON = '#F6AD2B'

function TabBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.tabBtn, active && s.tabBtnActive]}>
      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

function ActivityItem({ log }) {
  const positive = log.points_added >= 0
  return (
    <View style={s.actItem}>
      <View style={[s.actIcon, { backgroundColor: positive ? '#DCFCE7' : '#FEE2E2' }]}>
        <MaterialCommunityIcons name="chart-line" size={14} color={positive ? '#16A34A' : '#DC2626'} />
      </View>
      <View style={s.actContent}>
        <Text style={s.actType}>{log.activity_type?.replace(/_/g, ' ')}</Text>
        <Text style={s.actDesc} numberOfLines={2}>{log.description}</Text>
        <Text style={s.actTime}>{new Date(log.created_at).toLocaleString()}</Text>
      </View>
      <Text style={[s.actPoints, { color: positive ? '#16A34A' : '#DC2626' }]}>
        {positive ? '+' : ''}{log.points_added}
      </Text>
    </View>
  )
}

export default function LeadDetailScreen({ route }) {
  const { leadId, leadName } = route.params
  const qc = useQueryClient()
  const [tab, setTab] = useState('timeline')
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const { data: lead, isLoading } = useQuery({
    queryKey: ['mob-lead', leadId],
    queryFn: () => leadsApi.getById(leadId).then(r => r.data),
  })
  const { data: tasks = [] } = useQuery({ queryKey: ['mob-lead-tasks', leadId], queryFn: () => leadsApi.getTasks(leadId).then(r => r.data) })
  const { data: notes = [] } = useQuery({ queryKey: ['mob-lead-notes', leadId], queryFn: () => leadsApi.getNotes(leadId).then(r => r.data) })

  const score = lead?.activity_score ?? 0
  const label = lead?.score_label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const scoreColor = label === 'HOT' ? '#E53E3E' : label === 'WARM' ? '#DD6B20' : '#3182CE'

  const addNote = async () => {
    if (!noteText.trim()) return Alert.alert('Error', 'Enter a note')
    setAddingNote(true)
    try {
      await notesApi.create({ lead_id: leadId, content: noteText })
      setNoteText('')
      qc.invalidateQueries(['mob-lead-notes', leadId])
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add note')
    } finally { setAddingNote(false) }
  }

  const completeTask = async (tid) => {
    try { await tasksApi.complete(tid); qc.invalidateQueries(['mob-lead-tasks', leadId]) }
    catch { Alert.alert('Error', 'Failed') }
  }

  const updateStatus = async (status) => {
    try { await leadsApi.update(leadId, { status }); qc.invalidateQueries(['mob-lead', leadId]) }
    catch { Alert.alert('Error', 'Failed') }
  }

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color={NAVY} /></View>
  if (!lead) return <View style={s.center}><Text>Lead not found</Text></View>

  const actLogs = lead.activityLogs || []

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Lead info */}
      <View style={s.infoCard}>
        <Text style={s.leadName}>{lead.name}</Text>
        <View style={s.infoRow}>
          {lead.phone && <Text style={s.infoItem}>📞 {lead.phone}</Text>}
          {lead.email && <Text style={s.infoItem} numberOfLines={1}>✉️ {lead.email}</Text>}
        </View>
        <View style={s.infoRow}>
          {lead.city && <Text style={s.infoItem}>📍 {lead.city}</Text>}
          {lead.course_interested && <Text style={s.infoItem}>📚 {lead.course_interested}</Text>}
        </View>
        <View style={s.infoRow}>
          <View style={s.chip}><Text style={s.chipText}>{lead.source}</Text></View>
          <View style={[s.chip, { backgroundColor: '#F0FFF4' }]}><Text style={[s.chipText, { color: '#276749' }]}>{lead.status}</Text></View>
        </View>
      </View>

      {/* Score */}
      <View style={[s.scoreCard, { borderColor: scoreColor + '40' }]}>
        <Text style={[s.scoreNum, { color: scoreColor }]}>{score}</Text>
        <Text style={[s.scoreLabel, { color: scoreColor }]}>{label}</Text>
        <Text style={s.scoreCaption}>Activity Score</Text>
      </View>

      {/* 4 action buttons */}
      <View style={s.actions}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#38A169' }]} onPress={() => Linking.openURL(`tel:${lead.phone}`)}>
          <MaterialCommunityIcons name="phone" size={20} color="white" />
          <Text style={s.actionText}>CALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#25D366' }]} onPress={() => Linking.openURL(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`)}>
          <MaterialCommunityIcons name="whatsapp" size={20} color="white" />
          <Text style={s.actionText}>WA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: SAFFRON }]} onPress={() => setTab('notes')}>
          <MaterialCommunityIcons name="note-text" size={20} color="white" />
          <Text style={s.actionText}>NOTE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: NAVY }]} onPress={() => setTab('tasks')}>
          <MaterialCommunityIcons name="checkbox-marked" size={20} color="white" />
          <Text style={s.actionText}>TASK</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {['timeline', 'notes', 'tasks'].map(t => (
          <TabBtn key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onPress={() => setTab(t)} />
        ))}
      </View>

      {/* Tab content */}
      <View style={s.tabContent}>
        {tab === 'timeline' && (
          actLogs.length === 0
            ? <Text style={s.empty}>No activity yet</Text>
            : actLogs.map(log => <ActivityItem key={log.id} log={log} />)
        )}

        {tab === 'notes' && (
          <View>
            <View style={s.noteInput}>
              <TextInput
                style={s.noteField}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Write a note..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={s.noteSend} onPress={addNote} disabled={addingNote}>
                {addingNote ? <ActivityIndicator size="small" color="white" /> : <MaterialCommunityIcons name="send" size={16} color="white" />}
              </TouchableOpacity>
            </View>
            {notes.length === 0 ? <Text style={s.empty}>No notes yet</Text> : notes.map(note => (
              <View key={note.id} style={s.noteCard}>
                <Text style={s.noteText}>{note.content}</Text>
                <Text style={s.noteMeta}>{note.author?.name} · {new Date(note.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'tasks' && (
          tasks.length === 0
            ? <Text style={s.empty}>No tasks</Text>
            : tasks.map(task => (
              <View key={task.id} style={s.taskItem}>
                <TouchableOpacity
                  style={[s.taskCheck, task.is_completed && s.taskCheckDone]}
                  onPress={() => !task.is_completed && completeTask(task.id)}
                >
                  {task.is_completed && <MaterialCommunityIcons name="check" size={14} color="white" />}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[s.taskTitle, task.is_completed && s.taskDone]}>{task.title}</Text>
                  <Text style={s.taskDue}>📅 {new Date(task.due_at).toLocaleString()}</Text>
                </View>
              </View>
            ))
        )}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoCard: { backgroundColor: 'white', margin: 12, borderRadius: 16, padding: 16, elevation: 2 },
  leadName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  infoItem: { fontSize: 13, color: '#4B5563', flex: 1 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
  scoreCard: { margin: 12, marginTop: 0, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, elevation: 2 },
  scoreNum: { fontSize: 48, fontWeight: 'black', lineHeight: 56 },
  scoreLabel: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  scoreCaption: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  actions: { flexDirection: 'row', marginHorizontal: 12, gap: 8, marginBottom: 12 },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 4 },
  actionText: { fontSize: 10, fontWeight: '700', color: 'white' },
  tabs: { flexDirection: 'row', marginHorizontal: 12, backgroundColor: 'white', borderRadius: 12, padding: 4, gap: 4, elevation: 1 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: NAVY },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: 'white' },
  tabContent: { margin: 12, backgroundColor: 'white', borderRadius: 16, padding: 14, elevation: 2 },
  empty: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 24 },
  actItem: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  actIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  actContent: { flex: 1 },
  actType: { fontSize: 13, fontWeight: '600', color: '#1F2937', textTransform: 'capitalize' },
  actDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  actTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  actPoints: { fontSize: 13, fontWeight: '700' },
  noteInput: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  noteField: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1F2937', minHeight: 70, textAlignVertical: 'top' },
  noteSend: { width: 44, height: 44, borderRadius: 12, backgroundColor: SAFFRON, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  noteCard: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8 },
  noteText: { fontSize: 13, color: '#1F2937', lineHeight: 20 },
  noteMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  taskItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  taskCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  taskCheckDone: { backgroundColor: '#38A169', borderColor: '#38A169' },
  taskTitle: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  taskDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskDue: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
})
