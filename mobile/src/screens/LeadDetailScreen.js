import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, TextInput, ActivityIndicator, Modal, StatusBar,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { leadsApi, notesApi, tasksApi, callsApi } from '../services/api'

const BG      = '#0f172a'
const SURFACE = 'rgba(255,255,255,0.06)'
const BORDER  = 'rgba(255,255,255,0.1)'
const ACCENT  = '#6366f1'
const SUCCESS = '#10b981'
const DANGER  = '#ef4444'
const GOLD    = '#f59e0b'
const WA_GREEN= '#25D366'
const TEXT    = '#f1f5f9'
const MUTED   = '#94a3b8'

const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED']
const STAGE_LABELS = { NEW: 'New', COUNSELLING: 'Counselling', APPLIED: 'Applied', PAYMENT_PENDING: 'Pmt Pending', ENROLLED: 'Enrolled' }
const STAGE_COLORS = { NEW: ACCENT, COUNSELLING: GOLD, APPLIED: '#3b82f6', PAYMENT_PENDING: '#f97316', ENROLLED: SUCCESS }

const CALL_OUTCOMES = ['INTERESTED', 'NOT_INTERESTED', 'BUSY', 'NO_ANSWER', 'CALLBACK', 'CONVERTED']
const OUTCOME_LABELS = { INTERESTED: 'Interested', NOT_INTERESTED: 'Not Interested', BUSY: 'Busy', NO_ANSWER: 'No Answer', CALLBACK: 'Callback', CONVERTED: 'Converted' }
const OUTCOME_COLORS = { INTERESTED: SUCCESS, NOT_INTERESTED: DANGER, BUSY: GOLD, NO_ANSWER: MUTED, CALLBACK: ACCENT, CONVERTED: SUCCESS }

// ── Disposition Modal ─────────────────────────────────────────
function DispositionModal({ visible, lead, onClose, onSaved }) {
  const [outcome, setOutcome] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!outcome) return Alert.alert('Required', 'Please select an outcome')
    setSaving(true)
    try {
      await callsApi.log({ lead_id: lead.id, call_type: 'OUTGOING', duration: parseInt(duration) || 0, outcome, notes: notes.trim() || undefined })
      if (followUpDate) {
        await leadsApi.update(lead.id, { follow_up_date: new Date(followUpDate).toISOString() })
      }
      onSaved()
      onClose()
      setOutcome(''); setDuration(''); setNotes(''); setFollowUpDate('')
    } catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={dm.root}>
        <View style={dm.header}>
          <Text style={dm.title}>Log Call</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={MUTED} /></TouchableOpacity>
        </View>
        <ScrollView style={dm.body} contentContainerStyle={{ gap: 16 }}>
          <Text style={dm.sectionLabel}>Outcome *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CALL_OUTCOMES.map(o => (
              <TouchableOpacity key={o} onPress={() => setOutcome(o)}
                style={[dm.outcomeBtn, outcome === o && { backgroundColor: OUTCOME_COLORS[o] + '25', borderColor: OUTCOME_COLORS[o] + '70' }]}>
                <Text style={[dm.outcomeText, { color: outcome === o ? OUTCOME_COLORS[o] : MUTED }]}>{OUTCOME_LABELS[o]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View>
            <Text style={dm.sectionLabel}>Duration (minutes)</Text>
            <TextInput style={dm.input} value={duration} onChangeText={setDuration} placeholder="0" placeholderTextColor="#475569" keyboardType="numeric" />
          </View>
          <View>
            <Text style={dm.sectionLabel}>Follow-up Date (YYYY-MM-DD)</Text>
            <TextInput style={dm.input} value={followUpDate} onChangeText={setFollowUpDate} placeholder="2024-12-31" placeholderTextColor="#475569" />
          </View>
          <View>
            <Text style={dm.sectionLabel}>Notes</Text>
            <TextInput style={[dm.input, { height: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Call notes..." placeholderTextColor="#475569" multiline />
          </View>
        </ScrollView>
        <View style={dm.footer}>
          <TouchableOpacity style={dm.cancelBtn} onPress={onClose}><Text style={dm.cancelText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={[dm.saveBtn, !outcome && { opacity: 0.5 }]} onPress={save} disabled={saving || !outcome}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={dm.saveText}>Log Call</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Enrollment Funnel ─────────────────────────────────────────
function EnrollmentFunnel({ current, onStagePress, loading }) {
  const currentIdx = STAGES.indexOf(current)
  return (
    <View style={ef.wrap}>
      {STAGES.map((stage, i) => {
        const done = i <= currentIdx
        const color = STAGE_COLORS[stage]
        return (
          <TouchableOpacity key={stage} onPress={() => !loading && onStagePress(stage)} style={ef.stageWrap}>
            <View style={[ef.bar, { backgroundColor: done ? color : 'rgba(255,255,255,0.08)' }]} />
            <Text style={[ef.label, { color: done ? color : '#334155' }]} numberOfLines={1}>{STAGE_LABELS[stage]}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────
export default function LeadDetailScreen({ route, navigation }) {
  const { leadId, leadName } = route.params
  const qc = useQueryClient()
  const [tab, setTab] = useState('timeline')
  const [noteText, setNoteText] = useState('')
  const [showDisposition, setShowDisposition] = useState(false)
  const [stageSaving, setStageSaving] = useState(false)
  const [verifySaving, setVerifySaving] = useState(false)

  const { data: lead, isLoading } = useQuery({ queryKey: ['mob-lead', leadId], queryFn: () => leadsApi.getById(leadId).then(r => r.data) })
  const { data: calls = [] } = useQuery({ queryKey: ['mob-lead-calls', leadId], queryFn: () => callsApi.getLeadCalls(leadId).then(r => r.data), retry: false })
  const { data: notes = [] } = useQuery({ queryKey: ['mob-lead-notes', leadId], queryFn: () => leadsApi.getNotes(leadId).then(r => r.data) })

  const updateStage = async (stage) => {
    setStageSaving(true)
    try {
      await leadsApi.setEnrollmentStage(leadId, stage)
      qc.invalidateQueries(['mob-lead', leadId])
    } catch (err) { Alert.alert('Error', 'Failed to update stage') }
    finally { setStageSaving(false) }
  }

  const toggleVerify = async () => {
    setVerifySaving(true)
    try {
      await leadsApi.toggleVerify(leadId)
      qc.invalidateQueries(['mob-lead', leadId])
    } catch { Alert.alert('Error', 'Failed') }
    finally { setVerifySaving(false) }
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    try {
      await notesApi.create({ lead_id: leadId, content: noteText })
      setNoteText('')
      qc.invalidateQueries(['mob-lead-notes', leadId])
    } catch { Alert.alert('Error', 'Failed to add note') }
  }

  if (isLoading || !lead) return (
    <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={ACCENT} />
    </View>
  )

  const score = lead.activity_score
  const label = lead.score_label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const scoreColor = label === 'HOT' ? DANGER : label === 'WARM' ? GOLD : ACCENT

  const TABS = ['timeline', 'calls', 'notes']

  const allEvents = [
    ...( lead.activityLogs || []).map(l => ({ id: l.id, ts: new Date(l.created_at), icon: 'flash-outline', color: ACCENT, title: l.activity_type.replace(/_/g, ' '), desc: l.description })),
    ...(calls || []).map(c => ({ id: c.id, ts: new Date(c.called_at), icon: 'call-outline', color: c.call_type === 'INCOMING' ? SUCCESS : c.call_type === 'MISSED' ? DANGER : ACCENT, title: `${c.call_type.toLowerCase()} · ${OUTCOME_LABELS[c.outcome] || c.outcome}`, desc: c.notes })),
  ].sort((a, b) => b.ts - a.ts)

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <DispositionModal
        visible={showDisposition}
        lead={lead}
        onClose={() => setShowDisposition(false)}
        onSaved={() => { qc.invalidateQueries(['mob-lead-calls', leadId]); qc.invalidateQueries(['mob-lead', leadId]) }}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName} numberOfLines={1}>{lead.name}</Text>
          <Text style={s.headerSub}>{lead.phone}</Text>
        </View>
        <View style={[s.scoreChip, { backgroundColor: scoreColor + '20', borderColor: scoreColor + '50' }]}>
          <Text style={[s.scoreText, { color: scoreColor }]}>{score}</Text>
        </View>
      </View>

      <ScrollView style={s.root} contentContainerStyle={s.content}>
        {/* Verification + Status */}
        <View style={s.row}>
          <TouchableOpacity onPress={toggleVerify} disabled={verifySaving}
            style={[s.verifyBadge, { backgroundColor: lead.is_verified ? SUCCESS + '20' : 'rgba(255,255,255,0.05)', borderColor: lead.is_verified ? SUCCESS + '50' : BORDER }]}>
            <Ionicons name={lead.is_verified ? 'shield-checkmark' : 'shield-outline'} size={14} color={lead.is_verified ? SUCCESS : MUTED} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: lead.is_verified ? SUCCESS : MUTED, marginLeft: 4 }}>
              {lead.is_verified ? 'Verified' : 'Unverified'}
            </Text>
          </TouchableOpacity>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>{lead.status}</Text>
          </View>
          {lead.follow_up_date && (
            <View style={[s.statusBadge, { backgroundColor: GOLD + '20', borderColor: GOLD + '40' }]}>
              <Ionicons name="calendar-outline" size={11} color={GOLD} />
              <Text style={[s.statusText, { color: GOLD, marginLeft: 3 }]}>{new Date(lead.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
            </View>
          )}
        </View>

        {/* Enrollment Funnel */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Enrollment Stage</Text>
          <EnrollmentFunnel current={lead.enrollment_stage || 'NEW'} onStagePress={updateStage} loading={stageSaving} />
        </View>

        {/* Quick Actions */}
        <View style={s.actionsGrid}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '40' }]} onPress={() => Linking.openURL(`tel:${lead.phone}`)}>
            <Ionicons name="call" size={20} color={ACCENT} />
            <Text style={[s.actionLabel, { color: ACCENT }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: WA_GREEN + '18', borderColor: WA_GREEN + '40' }]} onPress={() => Linking.openURL(`whatsapp://send?phone=${lead.phone.replace(/\D/g, '')}`)}>
            <Ionicons name="logo-whatsapp" size={20} color={WA_GREEN} />
            <Text style={[s.actionLabel, { color: WA_GREEN }]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: GOLD + '18', borderColor: GOLD + '40' }]} onPress={() => setShowDisposition(true)}>
            <Ionicons name="document-text-outline" size={20} color={GOLD} />
            <Text style={[s.actionLabel, { color: GOLD }]}>Log Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: BORDER }]} onPress={() => setTab('notes')}>
            <Ionicons name="create-outline" size={20} color={MUTED} />
            <Text style={[s.actionLabel, { color: MUTED }]}>Note</Text>
          </TouchableOpacity>
        </View>

        {/* Lead Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Lead Info</Text>
          {[
            { icon: 'mail-outline', val: lead.email, color: '#3b82f6' },
            { icon: 'location-outline', val: lead.city, color: ACCENT },
            { icon: 'book-outline', val: lead.course_interested, color: GOLD },
            { icon: 'globe-outline', val: `Source: ${lead.source}`, color: MUTED },
            { icon: 'person-outline', val: `Assigned: ${lead.assignee?.name || 'Unassigned'}`, color: MUTED },
          ].filter(r => r.val).map((row, i) => (
            <View key={i} style={s.infoRow}>
              <Ionicons name={row.icon} size={14} color={row.color} />
              <Text style={s.infoText} numberOfLines={1}>{row.val}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tabBtn, tab === t && { borderBottomWidth: 2, borderBottomColor: ACCENT }]}>
              <Text style={[s.tabText, { color: tab === t ? ACCENT : MUTED }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timeline */}
        {tab === 'timeline' && (
          <View style={s.card}>
            {allEvents.length === 0 && <Text style={s.emptyText}>No activity yet</Text>}
            {allEvents.map((ev, i) => (
              <View key={ev.id} style={[s.timelineRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                <View style={[s.timelineDot, { backgroundColor: ev.color + '20' }]}>
                  <Ionicons name={ev.icon} size={12} color={ev.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.timelineTitle} numberOfLines={1}>{ev.title}</Text>
                  {ev.desc ? <Text style={s.timelineDesc} numberOfLines={2}>{ev.desc}</Text> : null}
                  <Text style={s.timelineTime}>{ev.ts.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Calls */}
        {tab === 'calls' && (
          <View style={s.card}>
            {calls.length === 0 && <Text style={s.emptyText}>No calls logged</Text>}
            {calls.map((call, i) => {
              const color = call.call_type === 'INCOMING' ? SUCCESS : call.call_type === 'MISSED' ? DANGER : ACCENT
              return (
                <View key={call.id} style={[s.timelineRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                  <View style={[s.timelineDot, { backgroundColor: color + '20' }]}>
                    <Ionicons name="call-outline" size={12} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.timelineTitle}>{call.call_type} · <Text style={{ color: OUTCOME_COLORS[call.outcome] || MUTED }}>{OUTCOME_LABELS[call.outcome] || call.outcome}</Text>{call.duration > 0 ? ` · ${call.duration}min` : ''}</Text>
                    {call.notes ? <Text style={s.timelineDesc}>{call.notes}</Text> : null}
                    <Text style={s.timelineTime}>{new Date(call.called_at).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              )
            })}
            <TouchableOpacity style={s.addBtn} onPress={() => setShowDisposition(true)}>
              <Ionicons name="add-circle-outline" size={16} color={ACCENT} />
              <Text style={[s.addBtnText, { color: ACCENT }]}>Log New Call</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        {tab === 'notes' && (
          <View style={s.card}>
            <View style={s.noteInput}>
              <TextInput
                style={s.noteTextInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Write a note..."
                placeholderTextColor="#475569"
                multiline
              />
              <TouchableOpacity onPress={addNote} style={s.noteSubmit}>
                <Ionicons name="send" size={16} color={ACCENT} />
              </TouchableOpacity>
            </View>
            {notes.map((note, i) => (
              <View key={note.id} style={[s.noteRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                <Text style={s.noteContent}>{note.content}</Text>
                <Text style={s.noteAuthor}>{note.author?.name} · {new Date(note.created_at).toLocaleDateString('en-IN')}</Text>
              </View>
            ))}
            {notes.length === 0 && <Text style={s.emptyText}>No notes yet</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  content:      { padding: 16, paddingBottom: 32, gap: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  backBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  headerName:   { fontSize: 17, fontWeight: '800', color: TEXT },
  headerSub:    { fontSize: 12, color: MUTED },
  scoreChip:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  scoreText:    { fontSize: 14, fontWeight: '900' },
  row:          { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  verifyBadge:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BORDER },
  statusText:   { fontSize: 12, fontWeight: '700', color: MUTED },
  card:         { backgroundColor: SURFACE, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER, gap: 10 },
  cardTitle:    { fontSize: 11, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionsGrid:  { flexDirection: 'row', gap: 8 },
  actionBtn:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
  actionLabel:  { fontSize: 11, fontWeight: '700' },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText:     { flex: 1, fontSize: 13, color: TEXT },
  tabs:         { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  tabBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabText:      { fontSize: 13, fontWeight: '700' },
  timelineRow:  { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  timelineDot:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  timelineTitle:{ fontSize: 13, fontWeight: '600', color: TEXT },
  timelineDesc: { fontSize: 12, color: MUTED, marginTop: 2 },
  timelineTime: { fontSize: 11, color: '#334155', marginTop: 2 },
  addBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER },
  addBtnText:   { fontSize: 13, fontWeight: '600' },
  emptyText:    { fontSize: 14, color: MUTED, textAlign: 'center', paddingVertical: 20 },
  noteInput:    { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  noteTextInput:{ flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: TEXT, backgroundColor: 'rgba(255,255,255,0.04)', minHeight: 42 },
  noteSubmit:   { width: 42, height: 42, borderRadius: 12, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ACCENT + '40' },
  noteRow:      { paddingVertical: 10, gap: 4 },
  noteContent:  { fontSize: 13, color: TEXT },
  noteAuthor:   { fontSize: 11, color: MUTED },
})

const ef = StyleSheet.create({
  wrap:      { flexDirection: 'row', gap: 4 },
  stageWrap: { flex: 1, alignItems: 'center' },
  bar:       { width: '100%', height: 4, borderRadius: 2 },
  label:     { fontSize: 9, fontWeight: '700', marginTop: 4, textAlign: 'center' },
})

const dm = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#1e293b' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  title:      { fontSize: 17, fontWeight: '700', color: TEXT },
  body:       { flex: 1, padding: 20 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  outcomeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE },
  outcomeText:{ fontSize: 12, fontWeight: '700' },
  input:      { borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: TEXT, backgroundColor: SURFACE },
  footer:     { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: BORDER },
  cancelBtn:  { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: MUTED },
  saveBtn:    { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' },
  saveText:   { fontSize: 14, fontWeight: '700', color: '#ffffff' },
})
