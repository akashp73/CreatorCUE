import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, TextInput, ActivityIndicator, Modal, AppState,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { leadsApi, notesApi, tasksApi, callsApi } from '../services/api'
import { useCallStore } from '../store/callStore'

const NAVY = '#0f172a', INDIGO = '#4f46e5', SAFFRON = '#f59e0b'

const CALL_TYPES    = ['OUTGOING', 'INCOMING', 'MISSED']
const CALL_OUTCOMES = ['CONNECTED', 'INTERESTED', 'NOT_INTERESTED', 'CALLBACK', 'NO_ANSWER']
const OUTCOME_ICONS = { CONNECTED:'phone-check', INTERESTED:'thumb-up', NOT_INTERESTED:'thumb-down', CALLBACK:'phone-return', NO_ANSWER:'phone-off' }
const OUTCOME_LABELS = { CONNECTED:'Connected', INTERESTED:'Interested', NOT_INTERESTED:'Not interested', CALLBACK:'Callback', NO_ANSWER:'No answer' }

// ── Log Call Modal ─────────────────────────────────────────────
function LogCallModal({ visible, lead, onClose, onSaved, prefillType }) {
  const [callType, setCallType] = useState(prefillType || 'OUTGOING')
  const [duration, setDuration] = useState('')
  const [outcome, setOutcome] = useState('CONNECTED')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (visible) { setCallType(prefillType || 'OUTGOING'); setDuration(''); setOutcome('CONNECTED'); setNotes('') } }, [visible, prefillType])

  const save = async () => {
    setSaving(true)
    try {
      await callsApi.log({ lead_id: lead.id, call_type: callType, duration: parseInt(duration) || 0, outcome, notes: notes.trim() || undefined })
      onSaved()
      onClose()
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to log call')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={ms.root}>
        <View style={ms.header}>
          <Text style={ms.title}>Log Call — {lead?.name}</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={ms.body} contentContainerStyle={{ gap: 20 }}>
          {/* Call Type */}
          <View>
            <Text style={ms.label}>Call Type</Text>
            <View style={ms.segRow}>
              {CALL_TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => setCallType(t)} style={[ms.seg, callType === t && ms.segActive]}>
                  <Text style={[ms.segText, callType === t && ms.segTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration */}
          <View>
            <Text style={ms.label}>Duration (minutes)</Text>
            <TextInput style={ms.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" />
          </View>

          {/* Outcome */}
          <View>
            <Text style={ms.label}>Outcome</Text>
            <View style={ms.outcomeGrid}>
              {CALL_OUTCOMES.map(o => (
                <TouchableOpacity key={o} onPress={() => setOutcome(o)} style={[ms.outcomeChip, outcome === o && ms.outcomeChipActive]}>
                  <MaterialCommunityIcons name={OUTCOME_ICONS[o]} size={14} color={outcome === o ? INDIGO : '#6B7280'} />
                  <Text style={[ms.outcomeText, outcome === o && ms.outcomeTextActive]}>{OUTCOME_LABELS[o]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View>
            <Text style={ms.label}>Notes (optional)</Text>
            <TextInput style={[ms.input, ms.multiline]} value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="Call notes…" placeholderTextColor="#9CA3AF" textAlignVertical="top" />
          </View>
        </ScrollView>

        <View style={ms.footer}>
          <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
            <Text style={ms.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={ms.saveText}>Log Call</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Schedule Call Modal ────────────────────────────────────────
function ScheduleCallModal({ visible, lead, onClose }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!date) return Alert.alert('Error', 'Enter a date (YYYY-MM-DD)')
    const due_at = new Date(`${date}T${time}:00`)
    if (isNaN(due_at.getTime())) return Alert.alert('Error', 'Invalid date/time')
    setSaving(true)
    try {
      await tasksApi.create({ lead_id: lead.id, title: `Call ${lead.name}`, due_at: due_at.toISOString() })
      Alert.alert('Scheduled ✅', `Call set for ${due_at.toLocaleString()}`)
      onClose()
    } catch { Alert.alert('Error', 'Failed to schedule') }
    finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={ms.root}>
        <View style={ms.header}>
          <Text style={ms.title}>Schedule Call</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={[ms.body, { gap: 16 }]}>
          <View>
            <Text style={ms.label}>Date (YYYY-MM-DD)</Text>
            <TextInput style={ms.input} value={date} onChangeText={setDate} placeholder="2026-01-15" placeholderTextColor="#9CA3AF" />
          </View>
          <View>
            <Text style={ms.label}>Time (HH:MM)</Text>
            <TextInput style={ms.input} value={time} onChangeText={setTime} placeholder="09:00" placeholderTextColor="#9CA3AF" />
          </View>
        </View>
        <View style={ms.footer}>
          <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
            <Text style={ms.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={ms.saveText}>Schedule</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Main Screen ────────────────────────────────────────────────
function TabBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.tabBtn, active && s.tabBtnActive]}>
      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

export default function LeadDetailScreen({ route }) {
  const { leadId, leadName } = route.params
  const qc = useQueryClient()
  const [tab, setTab] = useState('timeline')
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [showLogCall, setShowLogCall] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [pendingCallType, setPendingCallType] = useState('OUTGOING')

  const { autoWhatsApp, whatsappTemplate, isOnCooldown, recordCooldown, setPendingCall, clearPendingCall } = useCallStore()
  const appStateRef = useRef(AppState.currentState)
  const callInitiatedRef = useRef(false)

  const { data: lead, isLoading } = useQuery({
    queryKey: ['mob-lead', leadId],
    queryFn: () => leadsApi.getById(leadId).then(r => r.data),
  })
  const { data: tasks = [] } = useQuery({ queryKey: ['mob-lead-tasks', leadId], queryFn: () => leadsApi.getTasks(leadId).then(r => r.data) })
  const { data: notes = [] } = useQuery({ queryKey: ['mob-lead-notes', leadId], queryFn: () => leadsApi.getNotes(leadId).then(r => r.data) })
  const { data: calls = [] } = useQuery({ queryKey: ['mob-lead-calls', leadId], queryFn: () => callsApi.getLeadCalls(leadId).then(r => r.data), retry: false })

  // AppState listener: detect when user returns from a call
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active' && callInitiatedRef.current) {
        callInitiatedRef.current = false
        // Show log call modal
        setPendingCallType('OUTGOING')
        setShowLogCall(true)
        // Auto-WhatsApp prompt
        if (autoWhatsApp && lead && !isOnCooldown(lead.phone)) {
          const msg = whatsappTemplate
            .replace(/{name}/g, lead.name)
            .replace(/{course}/g, lead.course_interested || '')
            .replace(/{phone}/g, lead.phone || '')
          setTimeout(() => {
            Alert.alert(
              'Send WhatsApp Follow-up?',
              `Send a follow-up to ${lead.name}?`,
              [
                { text: 'Skip', style: 'cancel' },
                {
                  text: 'Send',
                  onPress: () => {
                    recordCooldown(lead.phone)
                    Linking.openURL(`whatsapp://send?phone=${(lead.phone || '').replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`)
                  },
                },
              ]
            )
          }, 800)
        }
      }
      appStateRef.current = nextState
    })
    return () => sub.remove()
  }, [autoWhatsApp, lead, whatsappTemplate])

  const handleCall = useCallback(() => {
    if (!lead?.phone) return
    callInitiatedRef.current = true
    Linking.openURL(`tel:${lead.phone}`)
  }, [lead])

  const handleWhatsApp = useCallback(() => {
    if (!lead?.phone) return
    Linking.openURL(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)
  }, [lead])

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

  const onCallLogged = useCallback(() => {
    qc.invalidateQueries(['mob-lead-calls', leadId])
    qc.invalidateQueries(['mob-daily-report'])
  }, [leadId])

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color={INDIGO} /></View>
  if (!lead) return <View style={s.center}><Text>Lead not found</Text></View>

  const score = lead?.activity_score ?? 0
  const label = lead?.score_label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const scoreColor = label === 'HOT' ? '#E53E3E' : label === 'WARM' ? SAFFRON : '#3182CE'
  const actLogs = lead.activityLogs || []

  return (
    <View style={{ flex: 1 }}>
      <LogCallModal visible={showLogCall} lead={lead} prefillType={pendingCallType} onClose={() => setShowLogCall(false)} onSaved={onCallLogged} />
      <ScheduleCallModal visible={showSchedule} lead={lead} onClose={() => setShowSchedule(false)} />

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

        {/* Primary actions row */}
        <View style={s.actions}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#38A169' }]} onPress={handleCall}>
            <MaterialCommunityIcons name="phone" size={20} color="white" />
            <Text style={s.actionText}>CALL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
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

        {/* Secondary actions row */}
        <View style={s.secondaryActions}>
          <TouchableOpacity style={[s.secBtn, { borderColor: INDIGO + '40' }]} onPress={() => { setPendingCallType('OUTGOING'); setShowLogCall(true) }}>
            <MaterialCommunityIcons name="phone-plus" size={16} color={INDIGO} />
            <Text style={[s.secText, { color: INDIGO }]}>Log Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secBtn, { borderColor: SAFFRON + '60' }]} onPress={() => setShowSchedule(true)}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={SAFFRON} />
            <Text style={[s.secText, { color: SAFFRON }]}>Schedule Call</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>
          {['timeline', 'calls', 'notes', 'tasks'].map(t => (
            <TabBtn key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onPress={() => setTab(t)} />
          ))}
        </ScrollView>

        {/* Tab content */}
        <View style={s.tabContent}>
          {/* Timeline */}
          {tab === 'timeline' && (
            actLogs.length === 0
              ? <Text style={s.empty}>No activity yet</Text>
              : actLogs.map(log => {
                  const positive = log.points_added >= 0
                  return (
                    <View key={log.id} style={s.actItem}>
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
                })
          )}

          {/* Calls tab */}
          {tab === 'calls' && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{calls.length} calls logged</Text>
                <TouchableOpacity onPress={() => setShowLogCall(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="phone-plus" size={14} color={INDIGO} />
                  <Text style={{ fontSize: 12, color: INDIGO, fontWeight: '700' }}>Log Call</Text>
                </TouchableOpacity>
              </View>
              {calls.length === 0 ? <Text style={s.empty}>No calls logged yet</Text> : calls.map(call => {
                const colors = { OUTGOING: INDIGO, INCOMING: '#10B981', MISSED: '#E53E3E' }
                const color = colors[call.call_type] || INDIGO
                return (
                  <View key={call.id} style={s.callItem}>
                    <View style={[s.callIcon, { backgroundColor: color + '18' }]}>
                      <MaterialCommunityIcons name="phone" size={16} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <View style={[s.callTypeBadge, { backgroundColor: color + '18' }]}>
                          <Text style={[s.callTypeText, { color }]}>{call.call_type}</Text>
                        </View>
                        {call.duration > 0 && <Text style={s.callMeta}>{call.duration} min</Text>}
                        <Text style={s.callMeta}>{OUTCOME_LABELS[call.outcome] || call.outcome}</Text>
                      </View>
                      {call.notes ? <Text style={s.callNotes}>{call.notes}</Text> : null}
                      <Text style={s.callTime}>{call.user?.name} · {new Date(call.called_at).toLocaleString()}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <View>
              <View style={s.noteInput}>
                <TextInput style={s.noteField} value={noteText} onChangeText={setNoteText} placeholder="Write a note..." placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />
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

          {/* Tasks */}
          {tab === 'tasks' && (
            tasks.length === 0
              ? <Text style={s.empty}>No tasks</Text>
              : tasks.map(task => (
                <View key={task.id} style={s.taskItem}>
                  <TouchableOpacity style={[s.taskCheck, task.is_completed && s.taskCheckDone]} onPress={() => !task.is_completed && completeTask(task.id)}>
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
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoCard: { backgroundColor: 'white', margin: 12, borderRadius: 16, padding: 16, elevation: 2 },
  leadName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  infoItem: { fontSize: 13, color: '#4B5563', flex: 1 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 12, fontWeight: '600', color: INDIGO },
  scoreCard: { margin: 12, marginTop: 0, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, elevation: 2 },
  scoreNum: { fontSize: 48, fontWeight: 'bold', lineHeight: 56 },
  scoreLabel: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  scoreCaption: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  actions: { flexDirection: 'row', marginHorizontal: 12, gap: 8, marginBottom: 8 },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 4 },
  actionText: { fontSize: 10, fontWeight: '700', color: 'white' },
  secondaryActions: { flexDirection: 'row', marginHorizontal: 12, gap: 8, marginBottom: 12 },
  secBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 2, paddingVertical: 10, backgroundColor: 'white' },
  secText: { fontSize: 12, fontWeight: '700' },
  tabsScroll: { marginHorizontal: 12, marginBottom: 4 },
  tabs: { backgroundColor: 'white', borderRadius: 12, padding: 4, gap: 4, elevation: 1 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', borderRadius: 8 },
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
  callItem: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  callIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  callTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  callTypeText: { fontSize: 11, fontWeight: '700' },
  callMeta: { fontSize: 12, color: '#6B7280' },
  callNotes: { fontSize: 12, color: '#374151', marginTop: 4 },
  callTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
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

// ── Modal styles ───────────────────────────────────────────────
const ms = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: 'white' },
  title: { fontSize: 17, fontWeight: '700', color: NAVY },
  closeBtn: { padding: 4 },
  body: { flex: 1, padding: 20 },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' },
  label: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: NAVY, backgroundColor: 'white' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center' },
  segActive: { borderColor: INDIGO, backgroundColor: '#EEF2FF' },
  segText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  segTextActive: { color: INDIGO },
  outcomeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  outcomeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB' },
  outcomeChipActive: { borderColor: INDIGO, backgroundColor: '#EEF2FF' },
  outcomeText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  outcomeTextActive: { color: INDIGO },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: INDIGO, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '700', color: 'white' },
})
