import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, TextInput, ActivityIndicator, StatusBar, Modal,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { leadsApi, notesApi, tasksApi, callsApi } from '../services/api'
import apiDefault from '../services/api'

const PURPLE = '#4a1a8a'
const BG     = '#f0f0f6'
const WHITE  = '#ffffff'
const TEXT   = '#1a1a2e'
const MUTED  = '#6b7280'
const SUCCESS= '#10b981'
const DANGER = '#ef4444'
const GOLD   = '#f59e0b'
const WA     = '#25D366'

const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED']
const STAGE_LABELS = { NEW: 'New', COUNSELLING: 'Counselling', APPLIED: 'Applied', PAYMENT_PENDING: 'Pmt Pending', ENROLLED: 'Enrolled' }
const STAGE_COLORS = { NEW: PURPLE, COUNSELLING: GOLD, APPLIED: '#3b82f6', PAYMENT_PENDING: '#f97316', ENROLLED: SUCCESS }
const TAG_LABELS = ['HOT', 'WARM', 'COLD']
const TAG_COLORS = { HOT: DANGER, WARM: GOLD, COLD: PURPLE }
const OUTCOMES = ['INTERESTED', 'NOT_INTERESTED', 'BUSY', 'NO_ANSWER', 'CALLBACK', 'CONVERTED']
const OUTCOME_LABELS = { INTERESTED: 'Interested', NOT_INTERESTED: 'Not Interested', BUSY: 'Busy', NO_ANSWER: 'No Answer', CALLBACK: 'Callback', CONVERTED: 'Converted' }
const OUTCOME_COLORS = { INTERESTED: SUCCESS, NOT_INTERESTED: DANGER, BUSY: GOLD, NO_ANSWER: MUTED, CALLBACK: PURPLE, CONVERTED: SUCCESS }
const STATUSES = ['NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED', 'LOST']

// ── Enrollment Stage Bar ──────────────────────────────────────
function StageBar({ current }) {
  const idx = STAGES.indexOf(current)
  return (
    <View style={sb.wrap}>
      {STAGES.map((stage, i) => {
        const done = i <= idx
        const color = STAGE_COLORS[stage]
        return (
          <View key={stage} style={{ flex: 1, alignItems: 'center' }}>
            <View style={[sb.bar, { backgroundColor: done ? color : '#e5e7eb' }]} />
            <Text style={[sb.label, { color: done ? color : '#9ca3af' }]} numberOfLines={1}>{STAGE_LABELS[stage]}</Text>
          </View>
        )
      })}
    </View>
  )
}

// ── Dispose Lead Tab ──────────────────────────────────────────
function DisposeTab({ lead, onSaved }) {
  const qc = useQueryClient()
  const [outcome, setOutcome] = useState(lead.last_call_outcome || '')
  const [tag, setTag] = useState(lead.lead_tag || 'COLD')
  const [status, setStatus] = useState(lead.status || 'NEW')
  const [stage, setStage] = useState(lead.enrollment_stage || 'NEW')
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState(lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!outcome) return Alert.alert('Required', 'Select an outcome before saving')
    setSaving(true)
    try {
      await leadsApi.dispose(lead.id, {
        outcome, notes: notes || undefined, follow_up_date: followUp ? new Date(followUp).toISOString() : null,
        status, lead_tag: tag, enrollment_stage: stage, call_duration: parseInt(duration) || 0,
      })
      qc.invalidateQueries(['mob-lead', lead.id])
      qc.invalidateQueries(['mob-lead-calls', lead.id])
      Alert.alert('Saved', 'Disposition saved successfully')
      onSaved?.()
    } catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      {/* Outcome */}
      <View>
        <Text style={dt.sectionLabel}>Call Outcome *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {OUTCOMES.map(o => (
            <TouchableOpacity key={o} onPress={() => setOutcome(o)}
              style={[dt.outcomePill, outcome === o && { backgroundColor: OUTCOME_COLORS[o] + '20', borderColor: OUTCOME_COLORS[o] + '60' }]}>
              <Text style={[dt.outcomePillText, { color: outcome === o ? OUTCOME_COLORS[o] : MUTED }]}>{OUTCOME_LABELS[o]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tag */}
      <View>
        <Text style={dt.sectionLabel}>Lead Tag</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TAG_LABELS.map(t => (
            <TouchableOpacity key={t} onPress={() => setTag(t)} style={[dt.tagPill, { flex: 1, backgroundColor: TAG_COLORS[t] + (tag === t ? '20' : '08'), borderColor: TAG_COLORS[t] + (tag === t ? '60' : '20') }]}>
              <Text style={[dt.tagText, { color: TAG_COLORS[t] }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Next actions */}
      <View style={dt.row}>
        <View style={{ flex: 1 }}>
          <Text style={dt.sectionLabel}>Update State</Text>
          <View style={dt.select}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {STATUSES.map(s => (
                <TouchableOpacity key={s} onPress={() => setStatus(s)} style={[dt.chip, status === s && { backgroundColor: PURPLE, borderColor: PURPLE }]}>
                  <Text style={[dt.chipText, status === s && { color: WHITE }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={dt.row}>
        <View style={{ flex: 1 }}>
          <Text style={dt.sectionLabel}>Move Stage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {STAGES.map(st => (
              <TouchableOpacity key={st} onPress={() => setStage(st)} style={[dt.chip, stage === st && { backgroundColor: STAGE_COLORS[st], borderColor: STAGE_COLORS[st] }]}>
                <Text style={[dt.chipText, stage === st && { color: WHITE }]}>{STAGE_LABELS[st]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={dt.row}>
        <View style={{ flex: 1 }}>
          <Text style={dt.sectionLabel}>Follow-up Date (YYYY-MM-DD)</Text>
          <TextInput style={dt.input} value={followUp} onChangeText={setFollowUp} placeholder="2024-12-31" placeholderTextColor={MUTED} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={dt.sectionLabel}>Duration (min)</Text>
          <TextInput style={dt.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="0" placeholderTextColor={MUTED} />
        </View>
      </View>

      {/* Remarks */}
      <View>
        <Text style={dt.sectionLabel}>Remarks</Text>
        <TextInput style={[dt.input, { height: 90, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Call notes and remarks..." placeholderTextColor={MUTED} multiline />
      </View>

      <TouchableOpacity style={[dt.saveBtn, !outcome && { opacity: 0.5 }]} onPress={save} disabled={saving || !outcome}>
        {saving ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={dt.saveBtnText}>Save Disposition</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── Lead Info Tab ─────────────────────────────────────────────
function InfoTab({ lead }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {[
        { icon: 'call-outline', label: 'Phone', value: lead.phone, color: PURPLE },
        { icon: 'mail-outline', label: 'Email', value: lead.email, color: '#3b82f6' },
        { icon: 'location-outline', label: 'City', value: lead.city, color: GOLD },
        { icon: 'book-outline', label: 'Course', value: lead.course_interested, color: SUCCESS },
        { icon: 'globe-outline', label: 'Source', value: lead.source, color: MUTED },
        { icon: 'person-outline', label: 'Assigned to', value: lead.assignee?.name || 'Unassigned', color: MUTED },
        { icon: 'flag-outline', label: 'Status', value: lead.status, color: MUTED },
        { icon: 'calendar-outline', label: 'Follow-up', value: lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString('en-IN') : null, color: GOLD },
        { icon: 'call-outline', label: 'Last Call', value: lead.last_call_date ? `${new Date(lead.last_call_date).toLocaleDateString('en-IN')} · ${lead.last_call_outcome || ''}` : null, color: MUTED },
      ].filter(r => r.value).map((row, i) => (
        <View key={i} style={inf.row}>
          <View style={[inf.iconWrap, { backgroundColor: row.color + '15' }]}>
            <Ionicons name={row.icon} size={15} color={row.color} />
          </View>
          <View>
            <Text style={inf.label}>{row.label}</Text>
            <Text style={inf.value}>{row.value}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

// ── Timeline Tab ──────────────────────────────────────────────
function TimelineTab({ lead, calls }) {
  const events = [
    { id: 'created', ts: new Date(lead.created_at), icon: 'person-add-outline', color: PURPLE, title: `Lead from ${lead.source}`, desc: lead.assignee ? `Assigned to ${lead.assignee.name}` : 'Unassigned' },
    ...(lead.activityLogs || []).map(l => ({ id: l.id, ts: new Date(l.created_at), icon: 'flash-outline', color: '#6366f1', title: l.activity_type.replace(/_/g, ' '), desc: l.description })),
    ...(calls || []).map(c => ({ id: c.id, ts: new Date(c.called_at), icon: 'call-outline', color: c.call_type === 'MISSING' ? DANGER : c.call_type === 'INCOMING' ? SUCCESS : PURPLE, title: `${c.call_type} · ${OUTCOME_LABELS[c.outcome] || c.outcome}${c.duration > 0 ? ` · ${c.duration}min` : ''}`, desc: c.notes })),
  ].sort((a, b) => b.ts - a.ts)

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ position: 'relative' }}>
        <View style={{ position: 'absolute', left: 14, top: 0, bottom: 0, width: 1, backgroundColor: '#e5e7eb' }} />
        {events.map((ev, i) => (
          <View key={ev.id} style={tl.row}>
            <View style={[tl.dot, { backgroundColor: ev.color + '20' }]}>
              <Ionicons name={ev.icon} size={12} color={ev.color} />
            </View>
            <View style={tl.content}>
              <Text style={tl.title} numberOfLines={2}>{ev.title}</Text>
              {ev.desc ? <Text style={tl.desc} numberOfLines={2}>{ev.desc}</Text> : null}
              <Text style={tl.time}>{ev.ts.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        ))}
        {events.length === 0 && <Text style={{ color: MUTED, textAlign: 'center', paddingVertical: 24 }}>No activity yet</Text>}
      </View>
    </ScrollView>
  )
}

// ── Notes Tab ─────────────────────────────────────────────────
function NotesTab({ leadId }) {
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const { data: notes = [], isLoading } = useQuery({ queryKey: ['mob-lead-notes', leadId], queryFn: () => leadsApi.getNotes(leadId).then(r => r.data) })

  const addNote = async () => {
    if (!text.trim()) return
    try { await notesApi.create({ lead_id: leadId, content: text }); setText(''); qc.invalidateQueries(['mob-lead-notes', leadId]) }
    catch { Alert.alert('Error', 'Failed to add note') }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={nt.inputRow}>
        <TextInput style={nt.input} value={text} onChangeText={setText} placeholder="Write a note..." placeholderTextColor={MUTED} multiline />
        <TouchableOpacity onPress={addNote} style={nt.sendBtn}>
          <Ionicons name="send" size={16} color={WHITE} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {isLoading ? <ActivityIndicator size="small" color={PURPLE} /> : notes.map(note => (
          <View key={note.id} style={nt.noteCard}>
            <Text style={nt.noteContent}>{note.content}</Text>
            <Text style={nt.noteAuthor}>{note.author?.name} · {new Date(note.created_at).toLocaleDateString('en-IN')}</Text>
          </View>
        ))}
        {notes.length === 0 && !isLoading && <Text style={{ color: MUTED, textAlign: 'center', paddingVertical: 20 }}>No notes yet</Text>}
      </ScrollView>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────
export default function LeadDetailScreen({ route, navigation }) {
  const { leadId, leadName } = route.params
  const qc = useQueryClient()
  const [tab, setTab] = useState('info')
  const [stageSaving, setStageSaving] = useState(false)

  const { data: lead, isLoading } = useQuery({ queryKey: ['mob-lead', leadId], queryFn: () => leadsApi.getById(leadId).then(r => r.data) })
  const { data: calls = [] } = useQuery({ queryKey: ['mob-lead-calls', leadId], queryFn: () => callsApi.getLeadCalls(leadId).then(r => r.data), retry: false })

  const updateStage = async (stage) => {
    setStageSaving(true)
    try { await leadsApi.setEnrollmentStage(leadId, stage); qc.invalidateQueries(['mob-lead', leadId]) }
    catch { Alert.alert('Error', 'Failed') }
    finally { setStageSaving(false) }
  }

  if (isLoading || !lead) return (
    <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={PURPLE} />
    </View>
  )

  const scoreColor = lead.score_label === 'HOT' ? DANGER : lead.score_label === 'WARM' ? GOLD : PURPLE
  const tagColor = TAG_COLORS[lead.lead_tag] || PURPLE

  const TABS = [
    { key: 'info', label: 'Lead Info' },
    { key: 'dispose', label: 'Dispose Lead' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{lead.name}</Text>
          <Text style={s.phone}>{lead.phone}</Text>
        </View>
        <View style={[s.scorePill, { backgroundColor: scoreColor + '30' }]}>
          <Text style={[s.scoreText, { color: scoreColor }]}>{lead.activity_score}</Text>
        </View>
        <View style={[s.scorePill, { backgroundColor: tagColor + '25', marginLeft: 6 }]}>
          <Text style={[s.scoreText, { color: tagColor }]}>{lead.lead_tag || 'COLD'}</Text>
        </View>
      </View>

      {/* Stage bar */}
      <View style={s.stageWrap}>
        <StageBar current={lead.enrollment_stage || 'NEW'} />
      </View>

      {/* Action row */}
      <View style={s.actionRow}>
        {[
          { icon: 'call', color: PURPLE, bg: PURPLE + '15', onPress: () => Linking.openURL(`tel:${lead.phone}`) },
          { icon: 'logo-whatsapp', color: WA, bg: WA + '15', onPress: () => Linking.openURL(`whatsapp://send?phone=${lead.phone.replace(/\D/g, '')}`) },
          { icon: 'mail-outline', color: '#3b82f6', bg: '#3b82f6' + '15', onPress: () => lead.email && Linking.openURL(`mailto:${lead.email}`) },
          { icon: 'document-text-outline', color: GOLD, bg: GOLD + '15', onPress: () => setTab('dispose'), label: 'Dispose' },
        ].map((a, i) => (
          <TouchableOpacity key={i} style={[s.actionBtn, { backgroundColor: a.bg }]} onPress={a.onPress}>
            <Ionicons name={a.icon} size={18} color={a.color} />
            {a.label && <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[s.tabBtn, tab === t.key && s.tabBtnActive]}>
            <Text style={[s.tabText, { color: tab === t.key ? PURPLE : MUTED }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tab === 'info' && <InfoTab lead={lead} />}
        {tab === 'dispose' && <DisposeTab lead={lead} onSaved={() => setTab('info')} />}
        {tab === 'timeline' && <TimelineTab lead={lead} calls={calls} />}
        {tab === 'notes' && <NotesTab leadId={leadId} />}
      </View>

      {/* Call Now FAB */}
      <TouchableOpacity style={s.fab} onPress={() => Linking.openURL(`tel:${lead.phone}`)}>
        <Ionicons name="call" size={18} color={WHITE} />
        <Text style={s.fabText}>Call Now</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  header:      { backgroundColor: PURPLE, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  name:        { fontSize: 18, fontWeight: '800', color: WHITE },
  phone:       { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  scorePill:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  scoreText:   { fontSize: 13, fontWeight: '900' },
  stageWrap:   { backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  actionRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  actionBtn:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 2 },
  actionLabel: { fontSize: 10, fontWeight: '700' },
  tabs:        { flexDirection: 'row', backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tabBtn:      { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:{ borderBottomWidth: 2, borderBottomColor: PURPLE },
  tabText:     { fontSize: 11, fontWeight: '700' },
  fab:         { position: 'absolute', bottom: 20, right: 20, backgroundColor: PURPLE, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, elevation: 8, shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  fabText:     { color: WHITE, fontSize: 13, fontWeight: '800' },
})

const sb = StyleSheet.create({
  wrap:  { flexDirection: 'row', gap: 4 },
  bar:   { width: '100%', height: 4, borderRadius: 2 },
  label: { fontSize: 8, fontWeight: '700', marginTop: 3, textAlign: 'center' },
})

const dt = StyleSheet.create({
  sectionLabel: { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  outcomePill:  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: WHITE },
  outcomePillText: { fontSize: 12, fontWeight: '700' },
  tagPill:      { paddingVertical: 8, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  tagText:      { fontSize: 12, fontWeight: '800' },
  row:          { flexDirection: 'row', gap: 10 },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  chipText:     { fontSize: 11, fontWeight: '600', color: TEXT },
  input:        { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: TEXT, backgroundColor: WHITE },
  select:       { overflow: 'hidden' },
  saveBtn:      { backgroundColor: PURPLE, paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 4, shadowColor: PURPLE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
  saveBtnText:  { color: WHITE, fontSize: 15, fontWeight: '800' },
})

const inf = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: WHITE, borderRadius: 12 },
  iconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, color: MUTED, fontWeight: '600' },
  value:   { fontSize: 14, fontWeight: '600', color: TEXT, marginTop: 2 },
})

const tl = StyleSheet.create({
  row:     { flexDirection: 'row', gap: 10, marginBottom: 14 },
  dot:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1, paddingTop: 2 },
  title:   { fontSize: 13, fontWeight: '600', color: TEXT },
  desc:    { fontSize: 12, color: MUTED, marginTop: 2 },
  time:    { fontSize: 11, color: '#9ca3af', marginTop: 3 },
})

const nt = StyleSheet.create({
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  input:    { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: TEXT, backgroundColor: WHITE, minHeight: 48 },
  sendBtn:  { width: 44, height: 44, borderRadius: 12, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  noteCard: { backgroundColor: WHITE, borderRadius: 12, padding: 14, marginBottom: 10 },
  noteContent: { fontSize: 14, color: TEXT },
  noteAuthor:  { fontSize: 11, color: MUTED, marginTop: 6 },
})
