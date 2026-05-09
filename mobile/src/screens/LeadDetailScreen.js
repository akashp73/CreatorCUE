import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, TextInput, ActivityIndicator, Modal, AppState,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { leadsApi, notesApi, tasksApi, callsApi } from '../services/api'
import { useCallStore } from '../store/callStore'

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'
const BG     = '#f8fafc'

const CALL_TYPES    = ['OUTGOING', 'INCOMING', 'MISSED']
const CALL_OUTCOMES = ['CONNECTED', 'INTERESTED', 'NOT_INTERESTED', 'CALLBACK', 'NO_ANSWER']
const OUTCOME_LABELS = {
  CONNECTED: 'Connected', INTERESTED: 'Interested',
  NOT_INTERESTED: 'Not Interested', CALLBACK: 'Callback', NO_ANSWER: 'No Answer',
}

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED', 'LOST']

// ── Log Call Modal ─────────────────────────────────────────────
function LogCallModal({ visible, lead, onClose, onSaved, prefillType = 'OUTGOING' }) {
  const [callType, setCallType] = useState(prefillType)
  const [duration, setDuration] = useState('')
  const [outcome, setOutcome]   = useState('CONNECTED')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (visible) { setCallType(prefillType); setDuration(''); setOutcome('CONNECTED'); setNotes('') }
  }, [visible, prefillType])

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
      <View style={lm.root}>
        <View style={lm.header}>
          <Text style={lm.title}>Log Call — {lead?.name}</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
        </View>
        <ScrollView style={lm.body} contentContainerStyle={{ gap: 18 }}>
          <View>
            <Text style={lm.label}>Call Type</Text>
            <View style={lm.segRow}>
              {CALL_TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => setCallType(t)} style={[lm.seg, callType === t && lm.segActive]}>
                  <Text style={[lm.segText, callType === t && lm.segTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={lm.label}>Duration (minutes)</Text>
            <TextInput style={lm.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
          </View>
          <View>
            <Text style={lm.label}>Outcome</Text>
            <View style={lm.outcomeGrid}>
              {CALL_OUTCOMES.map(o => (
                <TouchableOpacity key={o} onPress={() => setOutcome(o)} style={[lm.outChip, outcome === o && lm.outChipActive]}>
                  <Text style={[lm.outChipText, outcome === o && lm.outChipTextActive]}>{OUTCOME_LABELS[o]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={lm.label}>Notes</Text>
            <TextInput style={[lm.input, lm.multiline]} value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="Call notes..." placeholderTextColor="#94a3b8" textAlignVertical="top" />
          </View>
        </ScrollView>
        <View style={lm.footer}>
          <TouchableOpacity style={lm.cancelBtn} onPress={onClose}><Text style={lm.cancelText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={lm.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={lm.saveText}>Log Call</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Schedule Call Modal ────────────────────────────────────────
function ScheduleCallModal({ visible, lead, onClose }) {
  const [date, setDate]   = useState('')
  const [time, setTime]   = useState('09:00')
  const [saving, setSav]  = useState(false)

  const save = async () => {
    if (!date.trim()) return Alert.alert('Error', 'Enter a date (YYYY-MM-DD)')
    const due_at = new Date(`${date}T${time}:00`)
    if (isNaN(due_at)) return Alert.alert('Error', 'Invalid date/time')
    setSav(true)
    try {
      await tasksApi.create({ lead_id: lead.id, title: `Call ${lead.name}`, due_at: due_at.toISOString() })
      Alert.alert('Scheduled', due_at.toLocaleString())
      onClose()
    } catch { Alert.alert('Error', 'Failed to schedule') }
    finally { setSav(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={lm.root}>
        <View style={lm.header}>
          <Text style={lm.title}>Schedule Call</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
        </View>
        <View style={[lm.body, { gap: 16 }]}>
          <View>
            <Text style={lm.label}>Date (YYYY-MM-DD)</Text>
            <TextInput style={lm.input} value={date} onChangeText={setDate} placeholder="2026-01-15" placeholderTextColor="#94a3b8" />
          </View>
          <View>
            <Text style={lm.label}>Time (HH:MM)</Text>
            <TextInput style={lm.input} value={time} onChangeText={setTime} placeholder="09:00" placeholderTextColor="#94a3b8" />
          </View>
        </View>
        <View style={lm.footer}>
          <TouchableOpacity style={lm.cancelBtn} onPress={onClose}><Text style={lm.cancelText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={lm.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={lm.saveText}>Schedule</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Status Picker Modal ────────────────────────────────────────
function StatusModal({ visible, current, onSelect, onClose }) {
  const STATUS_COLOR = { NEW:'#64748b', CONTACTED:'#3b82f6', APPLIED:'#f59e0b', QUALIFIED:ACCENT, ENROLLED:'#10b981', LOST:'#ef4444' }
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={sm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={sm.sheet}>
          <Text style={sm.title}>Update Status</Text>
          {STATUS_OPTIONS.map(s => (
            <TouchableOpacity key={s} style={[sm.option, current === s && sm.optionActive]} onPress={() => { onSelect(s); onClose() }}>
              <View style={[sm.dot, { backgroundColor: STATUS_COLOR[s] || '#64748b' }]} />
              <Text style={[sm.optionText, current === s && sm.optionTextActive]}>{s}</Text>
              {current === s && <Ionicons name="checkmark" size={16} color={ACCENT} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Tab button ─────────────────────────────────────────────────
function TabBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.tabBtn, active && s.tabBtnActive]}>
      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── Main Screen ────────────────────────────────────────────────
export default function LeadDetailScreen({ route }) {
  const { leadId, leadName } = route.params
  const qc = useQueryClient()
  const [tab, setTab]               = useState('activity')
  const [noteText, setNoteText]     = useState('')
  const [addingNote, setAddNote]    = useState(false)
  const [showLogCall, setShowLog]   = useState(false)
  const [showSchedule, setShowSch]  = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [pendingCallType, setPCT]   = useState('OUTGOING')

  const { autoWhatsApp, whatsappTemplate, isOnCooldown, recordCooldown } = useCallStore()
  const appStateRef      = useRef(AppState.currentState)
  const callInitiatedRef = useRef(false)

  const { data: lead, isLoading } = useQuery({ queryKey: ['mob-lead', leadId], queryFn: () => leadsApi.getById(leadId).then(r => r.data) })
  const { data: tasks = [] }      = useQuery({ queryKey: ['mob-lead-tasks', leadId], queryFn: () => leadsApi.getTasks(leadId).then(r => r.data) })
  const { data: notes = [] }      = useQuery({ queryKey: ['mob-lead-notes', leadId], queryFn: () => leadsApi.getNotes(leadId).then(r => r.data) })
  const { data: calls = [] }      = useQuery({ queryKey: ['mob-lead-calls', leadId], queryFn: () => callsApi.getLeadCalls(leadId).then(r => r.data), retry: false })

  // AppState: detect return from phone call
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active' && callInitiatedRef.current) {
        callInitiatedRef.current = false
        setPCT('OUTGOING')
        setShowLog(true)
        if (autoWhatsApp && lead && !isOnCooldown(lead.phone)) {
          const msg = whatsappTemplate
            .replace(/{name}/g, lead.name)
            .replace(/{course}/g, lead.course_interested || '')
            .replace(/{phone}/g, lead.phone || '')
          setTimeout(() => {
            Alert.alert('Send WhatsApp?', `Follow up with ${lead.name}?`, [
              { text: 'Skip', style: 'cancel' },
              { text: 'Send', onPress: () => { recordCooldown(lead.phone); Linking.openURL(`whatsapp://send?phone=${(lead.phone || '').replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`) } },
            ])
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

  const addNote = async () => {
    if (!noteText.trim()) return Alert.alert('Error', 'Enter a note')
    setAddNote(true)
    try { await notesApi.create({ lead_id: leadId, content: noteText }); setNoteText(''); qc.invalidateQueries(['mob-lead-notes', leadId]) }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed') }
    finally { setAddNote(false) }
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

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color={ACCENT} /></View>
  if (!lead) return <View style={s.center}><Text style={{ color: '#94a3b8' }}>Lead not found</Text></View>

  const score = lead.activity_score ?? 0
  const label = lead.score_label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const scoreColor = label === 'HOT' ? '#ef4444' : label === 'WARM' ? '#f59e0b' : '#3b82f6'
  const actLogs = lead.activityLogs || []

  const CALL_COLORS = { OUTGOING: ACCENT, INCOMING: '#10b981', MISSED: '#ef4444' }

  return (
    <View style={{ flex: 1 }}>
      <LogCallModal visible={showLogCall} lead={lead} prefillType={pendingCallType} onClose={() => setShowLog(false)} onSaved={onCallLogged} />
      <ScheduleCallModal visible={showSchedule} lead={lead} onClose={() => setShowSch(false)} />
      <StatusModal visible={showStatus} current={lead.status} onSelect={updateStatus} onClose={() => setShowStatus(false)} />

      <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Lead header card */}
        <View style={s.infoCard}>
          <View style={s.infoTop}>
            <View style={s.nameAvatar}>
              <Text style={s.nameAvatarText}>{lead.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.leadName}>{lead.name}</Text>
              <TouchableOpacity onPress={handleCall}>
                <Text style={s.phone}>{lead.phone}</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.scorePill, { borderColor: scoreColor + '40' }]}>
              <Text style={[s.scoreNum, { color: scoreColor }]}>{score}</Text>
              <Text style={[s.scoreLabel, { color: scoreColor }]}>{label}</Text>
            </View>
          </View>

          <View style={s.infoChips}>
            {lead.course_interested ? <View style={s.chip}><Ionicons name="book-outline" size={11} color="#64748b" /><Text style={s.chipText}>{lead.course_interested}</Text></View> : null}
            {lead.city ? <View style={s.chip}><Ionicons name="location-outline" size={11} color="#64748b" /><Text style={s.chipText}>{lead.city}</Text></View> : null}
            <View style={s.chip}><Text style={s.chipText}>{lead.source}</Text></View>
          </View>

          <TouchableOpacity style={s.statusRow} onPress={() => setShowStatus(true)}>
            <Text style={s.statusLabel}>Status</Text>
            <View style={s.statusBadge}><Text style={s.statusText}>{lead.status}</Text></View>
            <Ionicons name="chevron-down" size={14} color="#64748b" />
          </TouchableOpacity>

          {lead.assignee && (
            <View style={s.assigneeRow}>
              <Ionicons name="person-circle-outline" size={14} color="#64748b" />
              <Text style={s.assigneeText}>Assigned to {lead.assignee.name}</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={s.primaryActions}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#10b981' }]} onPress={handleCall}>
            <Ionicons name="call-outline" size={18} color="white" />
            <Text style={s.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#25D366' }]} onPress={() => Linking.openURL(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`)}>
            <Ionicons name="logo-whatsapp" size={18} color="white" />
            <Text style={s.actionText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: ACCENT }]} onPress={() => { setPCT('OUTGOING'); setShowLog(true) }}>
            <Ionicons name="call" size={18} color="white" />
            <Text style={s.actionText}>Log Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => setShowSch(true)}>
            <Ionicons name="calendar-outline" size={18} color="white" />
            <Text style={s.actionText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {['activity', 'calls', 'notes', 'tasks'].map(t => (
            <TabBtn key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onPress={() => setTab(t)} />
          ))}
        </ScrollView>

        {/* Tab content */}
        <View style={s.tabContent}>

          {/* Activity */}
          {tab === 'activity' && (
            actLogs.length === 0
              ? <Text style={s.empty}>No activity yet</Text>
              : actLogs.map(log => {
                const positive = log.points_added >= 0
                return (
                  <View key={log.id} style={s.actItem}>
                    <View style={[s.actDot, { backgroundColor: positive ? '#dcfce7' : '#fee2e2' }]}>
                      <Ionicons name={positive ? 'trending-up-outline' : 'trending-down-outline'} size={13} color={positive ? '#16a34a' : '#dc2626'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.actType}>{log.activity_type?.replace(/_/g, ' ')}</Text>
                      <Text style={s.actDesc} numberOfLines={2}>{(log.description || '').replace(/\[key:[^\]]*\]/g, '').trim()}</Text>
                      <Text style={s.actTime}>{new Date(log.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={[s.actPts, { color: positive ? '#16a34a' : '#dc2626' }]}>
                      {positive ? '+' : ''}{log.points_added}
                    </Text>
                  </View>
                )
              })
          )}

          {/* Calls */}
          {tab === 'calls' && (
            <View>
              <View style={s.tabTopRow}>
                <Text style={s.tabTopLabel}>{calls.length} calls logged</Text>
                <TouchableOpacity onPress={() => setShowLog(true)} style={s.tabTopBtn}>
                  <Ionicons name="add-circle-outline" size={14} color={ACCENT} />
                  <Text style={s.tabTopBtnText}>Log Call</Text>
                </TouchableOpacity>
              </View>
              {calls.length === 0
                ? <Text style={s.empty}>No calls logged yet</Text>
                : calls.map(call => {
                  const color = CALL_COLORS[call.call_type] || ACCENT
                  return (
                    <View key={call.id} style={s.callRow}>
                      <View style={[s.callDot, { backgroundColor: color + '18' }]}>
                        <Ionicons name="call-outline" size={14} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={s.callMetaRow}>
                          <View style={[s.callTypeBadge, { backgroundColor: color + '15' }]}>
                            <Text style={[s.callTypeText, { color }]}>{call.call_type}</Text>
                          </View>
                          {call.duration > 0 && <Text style={s.callMeta}>{call.duration} min</Text>}
                          <Text style={s.callMeta}>{OUTCOME_LABELS[call.outcome] || call.outcome}</Text>
                        </View>
                        {call.notes ? <Text style={s.callNotes}>{call.notes}</Text> : null}
                        <Text style={s.callTime}>{new Date(call.called_at).toLocaleString()}</Text>
                      </View>
                    </View>
                  )
                })
              }
            </View>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <View>
              <View style={s.noteInputRow}>
                <TextInput style={s.noteInput} value={noteText} onChangeText={setNoteText} placeholder="Write a note..." placeholderTextColor="#94a3b8" multiline numberOfLines={2} />
                <TouchableOpacity style={s.noteSend} onPress={addNote} disabled={addingNote}>
                  {addingNote ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={15} color="white" />}
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
              : tasks.map(task => {
                const overdue = !task.is_completed && new Date(task.due_at) < new Date()
                return (
                  <View key={task.id} style={[s.taskItem, overdue && s.taskOverdue]}>
                    <TouchableOpacity style={[s.taskCheck, task.is_completed && s.taskDone]} onPress={() => !task.is_completed && completeTask(task.id)}>
                      {task.is_completed && <Ionicons name="checkmark" size={13} color="white" />}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.taskTitle, task.is_completed && s.taskDoneText]}>{task.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="time-outline" size={11} color="#94a3b8" />
                        <Text style={s.taskTime}>{new Date(task.due_at).toLocaleString()}</Text>
                        {overdue && <View style={s.overduePill}><Text style={s.overdueText}>OVERDUE</Text></View>}
                      </View>
                    </View>
                  </View>
                )
              })
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: BG },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoCard:       { backgroundColor: '#ffffff', margin: 12, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  infoTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  nameAvatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nameAvatarText: { fontSize: 18, fontWeight: '700', color: ACCENT },
  leadName:       { fontSize: 18, fontWeight: '800', color: NAVY },
  phone:          { fontSize: 14, color: ACCENT, marginTop: 2, fontFamily: 'monospace', textDecorationLine: 'underline' },
  scorePill:      { alignItems: 'center', borderWidth: 2, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  scoreNum:       { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  scoreLabel:     { fontSize: 10, fontWeight: '700', marginTop: 1 },
  infoChips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f1f5f9' },
  chipText:       { fontSize: 12, fontWeight: '600', color: '#475569' },
  statusRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', marginBottom: 6 },
  statusLabel:    { fontSize: 12, fontWeight: '600', color: '#64748b' },
  statusBadge:    { flex: 1, backgroundColor: ACCENT + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText:     { fontSize: 13, fontWeight: '700', color: ACCENT },
  assigneeRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assigneeText:   { fontSize: 12, color: '#64748b' },
  primaryActions: { flexDirection: 'row', marginHorizontal: 12, gap: 8, marginBottom: 10 },
  actionBtn:      { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 11, gap: 4 },
  actionText:     { fontSize: 10, fontWeight: '700', color: '#ffffff' },
  tabsRow:        { paddingHorizontal: 12, paddingBottom: 4, gap: 6 },
  tabBtn:         { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  tabBtnActive:   { backgroundColor: NAVY, borderColor: NAVY },
  tabText:        { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive:  { color: '#ffffff' },
  tabContent:     { margin: 12, backgroundColor: '#ffffff', borderRadius: 16, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  empty:          { textAlign: 'center', color: '#94a3b8', paddingVertical: 24, fontSize: 14 },
  tabTopRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tabTopLabel:    { fontSize: 12, color: '#64748b' },
  tabTopBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabTopBtnText:  { fontSize: 12, color: ACCENT, fontWeight: '700' },
  actItem:        { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actDot:         { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actType:        { fontSize: 13, fontWeight: '600', color: '#0f172a', textTransform: 'capitalize' },
  actDesc:        { fontSize: 11, color: '#64748b', marginTop: 2 },
  actTime:        { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  actPts:         { fontSize: 13, fontWeight: '700' },
  callRow:        { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  callDot:        { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  callMetaRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  callTypeBadge:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  callTypeText:   { fontSize: 11, fontWeight: '700' },
  callMeta:       { fontSize: 12, color: '#64748b' },
  callNotes:      { fontSize: 12, color: '#374151', marginTop: 4 },
  callTime:       { fontSize: 10, color: '#94a3b8', marginTop: 3 },
  noteInputRow:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  noteInput:      { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 13, color: '#0f172a', minHeight: 60, textAlignVertical: 'top', backgroundColor: '#f8fafc' },
  noteSend:       { width: 44, height: 44, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  noteCard:       { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 8 },
  noteText:       { fontSize: 13, color: '#0f172a', lineHeight: 20 },
  noteMeta:       { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  taskItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  taskOverdue:    { backgroundColor: '#fff5f5', borderRadius: 8, paddingHorizontal: 4 },
  taskCheck:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  taskDone:       { backgroundColor: '#10b981', borderColor: '#10b981' },
  taskTitle:      { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  taskDoneText:   { textDecorationLine: 'line-through', color: '#94a3b8' },
  taskTime:       { fontSize: 11, color: '#94a3b8' },
  overduePill:    { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  overdueText:    { fontSize: 9, fontWeight: '700', color: '#dc2626' },
})

const lm = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  title:        { fontSize: 16, fontWeight: '700', color: NAVY },
  body:         { flex: 1, padding: 20 },
  footer:       { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#ffffff' },
  label:        { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:        { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: NAVY, backgroundColor: '#f8fafc' },
  multiline:    { minHeight: 80, textAlignVertical: 'top' },
  segRow:       { flexDirection: 'row', gap: 8 },
  seg:          { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
  segActive:    { borderColor: ACCENT, backgroundColor: '#eef2ff' },
  segText:      { fontSize: 12, fontWeight: '700', color: '#64748b' },
  segTextActive:{ color: ACCENT },
  outcomeGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  outChip:      { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0' },
  outChipActive:{ borderColor: ACCENT, backgroundColor: '#eef2ff' },
  outChipText:  { fontSize: 12, fontWeight: '600', color: '#64748b' },
  outChipTextActive: { color: ACCENT },
  cancelBtn:    { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  cancelText:   { fontSize: 14, fontWeight: '600', color: '#64748b' },
  saveBtn:      { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' },
  saveText:     { fontSize: 14, fontWeight: '700', color: '#ffffff' },
})

const sm = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  title:           { fontSize: 16, fontWeight: '700', color: NAVY, marginBottom: 16 },
  option:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  optionActive:    { backgroundColor: '#eef2ff', marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 8 },
  dot:             { width: 8, height: 8, borderRadius: 4 },
  optionText:      { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  optionTextActive:{ color: ACCENT },
})
