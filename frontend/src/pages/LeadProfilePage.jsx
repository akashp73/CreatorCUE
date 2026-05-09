import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Phone, Mail, MapPin, BookOpen, Activity, User, Calendar,
  Plus, Check, Flame, Thermometer, Snowflake, MessageCircle, Send, FileText,
  Upload, IndianRupee, Bell, UserPlus, RefreshCw, StickyNote, Zap, TrendingDown,
  ShieldCheck, Shield, ChevronRight, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi, notesApi, tasksApi, callsApi } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED']
const STAGE_LABELS = { NEW: 'New', COUNSELLING: 'Counselling', APPLIED: 'Applied', PAYMENT_PENDING: 'Payment Pending', ENROLLED: 'Enrolled' }
const STAGE_COLORS = { NEW: '#6366f1', COUNSELLING: '#f59e0b', APPLIED: '#3b82f6', PAYMENT_PENDING: '#f97316', ENROLLED: '#10b981' }
const STATUSES = ['NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED', 'LOST']
const CALL_OUTCOMES = ['INTERESTED', 'NOT_INTERESTED', 'BUSY', 'NO_ANSWER', 'CALLBACK', 'CONVERTED']
const OUTCOME_LABELS = { INTERESTED: 'Interested', NOT_INTERESTED: 'Not Interested', BUSY: 'Busy', NO_ANSWER: 'No Answer', CALLBACK: 'Callback', CONVERTED: 'Converted' }
const OUTCOME_COLORS = {
  INTERESTED: '#10b981', NOT_INTERESTED: '#ef4444', BUSY: '#f59e0b',
  NO_ANSWER: '#94a3b8', CALLBACK: '#6366f1', CONVERTED: '#10b981',
}

// ── Disposition Modal ─────────────────────────────────────────
function DispositionModal({ lead, onClose, onLogged }) {
  const [form, setForm] = useState({ call_type: 'OUTGOING', duration: '', outcome: '', notes: '', follow_up_date: '' })
  const [saving, setSaving] = useState(false)
  const qc = useQueryClient()

  const save = async () => {
    if (!form.outcome) return toast.error('Select an outcome')
    setSaving(true)
    try {
      await callsApi.log({ lead_id: lead.id, call_type: form.call_type, duration: parseInt(form.duration) || 0, outcome: form.outcome, notes: form.notes })
      if (form.follow_up_date) {
        await leadsApi.update(lead.id, { follow_up_date: new Date(form.follow_up_date).toISOString() })
      }
      toast.success('Call logged!')
      qc.invalidateQueries(['lead-calls', lead.id])
      qc.invalidateQueries(['lead', lead.id])
      onLogged?.()
      onClose()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Phone size={16} style={{ color: '#6366f1' }} /> Log Call — {lead.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#94a3b8' }}>Outcome *</label>
            <div className="grid grid-cols-3 gap-2">
              {CALL_OUTCOMES.map(o => (
                <button key={o} onClick={() => setForm({ ...form, outcome: o })}
                  className="py-2 px-1 rounded-xl text-xs font-semibold transition-all text-center"
                  style={form.outcome === o
                    ? { background: `${OUTCOME_COLORS[o]}20`, color: OUTCOME_COLORS[o], border: `1px solid ${OUTCOME_COLORS[o]}50` }
                    : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }
                  }>
                  {OUTCOME_LABELS[o]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Duration (min)</label>
              <input type="number" min="0" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="0" className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Follow-up Date</label>
              <input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} className="input" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Call notes..." rows={3} className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-outline flex-1 py-2.5 justify-center">Cancel</button>
            <button onClick={save} disabled={saving || !form.outcome} className="btn-primary flex-1 py-2.5 justify-center">
              {saving ? 'Saving...' : 'Log Call'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Enrollment Stage Bar ──────────────────────────────────────
function EnrollmentFunnel({ current, onStageClick, loading }) {
  const currentIdx = STAGES.indexOf(current)
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {STAGES.map((stage, i) => {
          const done = i <= currentIdx
          const color = STAGE_COLORS[stage]
          return (
            <button key={stage} onClick={() => !loading && onStageClick(stage)}
              className="flex-1 transition-all duration-300"
              title={STAGE_LABELS[stage]}
            >
              <div className="h-2 rounded-full transition-all duration-300"
                style={{ background: done ? color : 'rgba(255,255,255,0.08)' }} />
              <p className="text-xs mt-1 text-center font-medium truncate"
                style={{ color: done ? color : '#475569', fontSize: '9px' }}>
                {STAGE_LABELS[stage]}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Activity helpers ──────────────────────────────────────────
function activityIcon(type) {
  if (type === 'form_fill') return { Icon: UserPlus, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' }
  if (type === 'score_decay') return { Icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  if (type.includes('email')) return { Icon: Mail, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' }
  if (type.includes('whatsapp')) return { Icon: MessageCircle, color: '#25D366', bg: 'rgba(37,211,102,0.1)' }
  if (type.includes('payment')) return { Icon: IndianRupee, color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
  if (type.includes('status')) return { Icon: RefreshCw, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
  return { Icon: Zap, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' }
}

function buildTimeline(lead, notes, comms, payments, calls) {
  const events = []
  events.push({
    id: 'created', ts: new Date(lead.created_at),
    Icon: UserPlus, color: '#6366f1', bg: 'rgba(99,102,241,0.1)',
    title: `Lead captured from ${lead.source}`,
    desc: lead.assignee ? `Assigned to ${lead.assignee.name}` : 'Unassigned',
  })
  ;(lead.activityLogs || []).forEach(log => {
    const { Icon, color, bg } = activityIcon(log.activity_type)
    events.push({
      id: `act-${log.id}`, ts: new Date(log.created_at), Icon, color, bg,
      title: log.activity_type.replace(/_/g, ' '),
      desc: (log.description || '').replace(/\[key:[^\]]*\]/g, '').trim(),
      badge: log.points_added !== 0 ? `${log.points_added > 0 ? '+' : ''}${log.points_added} pts` : null,
      badgeColor: log.points_added >= 0 ? '#10b981' : '#ef4444',
    })
  })
  ;(notes || []).forEach(note => {
    events.push({
      id: `note-${note.id}`, ts: new Date(note.created_at),
      Icon: StickyNote || FileText, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
      title: `Note by ${note.author?.name || 'team'}`,
      desc: note.content.slice(0, 100) + (note.content.length > 100 ? '…' : ''),
    })
  })
  ;(comms || []).forEach(comm => {
    const isWA = comm.channel === 'WHATSAPP'
    events.push({
      id: `comm-${comm.id}`, ts: new Date(comm.sent_at),
      Icon: isWA ? MessageCircle : Mail,
      color: isWA ? '#25D366' : '#3b82f6',
      bg: isWA ? 'rgba(37,211,102,0.1)' : 'rgba(59,130,246,0.1)',
      title: isWA ? 'WhatsApp sent' : 'Email sent',
      desc: (comm.content || '').slice(0, 80),
    })
  })
  ;(payments || []).forEach(pay => {
    events.push({
      id: `pay-${pay.id}`, ts: new Date(pay.paid_at || pay.created_at),
      Icon: IndianRupee, color: pay.status === 'PAID' ? '#10b981' : '#f59e0b',
      bg: pay.status === 'PAID' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
      title: `Payment ${pay.status.toLowerCase()}: ₹${pay.amount.toLocaleString('en-IN')}`,
      desc: pay.payment_type,
    })
  })
  const CALL_COLORS = { OUTGOING: '#6366f1', INCOMING: '#10b981', MISSED: '#ef4444' }
  ;(calls || []).forEach(call => {
    const color = CALL_COLORS[call.call_type] || '#6366f1'
    events.push({
      id: `call-${call.id}`, ts: new Date(call.called_at),
      Icon: Phone, color, bg: `${color}18`,
      title: `${call.call_type.toLowerCase()} call${call.duration > 0 ? ` · ${call.duration}min` : ''}`,
      desc: [OUTCOME_LABELS[call.outcome] || call.outcome, call.notes].filter(Boolean).join(' · '),
    })
  })
  return events.sort((a, b) => b.ts - a.ts)
}

// ── Main Component ────────────────────────────────────────────
export default function LeadProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState('timeline')
  const [noteText, setNoteText] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', due_at: '' })
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingStage, setSavingStage] = useState(false)
  const [savingVerify, setSavingVerify] = useState(false)
  const [showDisposition, setShowDisposition] = useState(false)

  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.getById(id).then(r => r.data) })
  const { data: tasks = [] } = useQuery({ queryKey: ['lead-tasks', id], queryFn: () => leadsApi.getTasks(id).then(r => r.data) })
  const { data: notes = [] } = useQuery({ queryKey: ['lead-notes', id], queryFn: () => leadsApi.getNotes(id).then(r => r.data) })
  const { data: comms = [] } = useQuery({ queryKey: ['lead-comms', id], queryFn: () => leadsApi.getComms(id).then(r => r.data) })
  const { data: payments = [] } = useQuery({ queryKey: ['lead-payments', id], queryFn: () => leadsApi.getPayments(id).then(r => r.data) })
  const { data: docs = [] } = useQuery({ queryKey: ['lead-docs', id], queryFn: () => leadsApi.getDocs(id).then(r => r.data) })
  const { data: calls = [] } = useQuery({ queryKey: ['lead-calls', id], queryFn: () => callsApi.getLeadCalls(id).then(r => r.data), retry: false })

  const updateStatus = async (status) => {
    setSavingStatus(true)
    try { await leadsApi.update(id, { status }); qc.invalidateQueries(['lead', id]); toast.success('Status updated') }
    catch { toast.error('Failed') } finally { setSavingStatus(false) }
  }

  const updateStage = async (stage) => {
    setSavingStage(true)
    try { await leadsApi.setEnrollmentStage(id, stage); qc.invalidateQueries(['lead', id]); toast.success(`Moved to ${STAGE_LABELS[stage]}`) }
    catch { toast.error('Failed to update stage') } finally { setSavingStage(false) }
  }

  const toggleVerify = async () => {
    setSavingVerify(true)
    try { await leadsApi.toggleVerify(id); qc.invalidateQueries(['lead', id]); toast.success(lead.is_verified ? 'Unverified' : 'Verified!') }
    catch { toast.error('Failed') } finally { setSavingVerify(false) }
  }

  const addNote = async () => {
    if (!noteText.trim()) return toast.error('Enter a note')
    try {
      await notesApi.create({ lead_id: id, content: noteText })
      setNoteText(''); toast.success('Note added'); qc.invalidateQueries(['lead-notes', id])
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const addTask = async () => {
    if (!taskForm.title || !taskForm.due_at) return toast.error('Fill all task fields')
    try {
      await tasksApi.create({ lead_id: id, title: taskForm.title, due_at: taskForm.due_at })
      setTaskForm({ title: '', due_at: '' }); toast.success('Task created'); qc.invalidateQueries(['lead-tasks', id])
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const completeTask = async (tid) => {
    try { await tasksApi.complete(tid); toast.success('Done!'); qc.invalidateQueries(['lead-tasks', id]) }
    catch { toast.error('Failed') }
  }

  const uploadDoc = async (e) => {
    const file = e.target.files[0]; if (!file) return
    try { await leadsApi.uploadDoc(id, file, 'OTHER'); toast.success('Uploaded'); qc.invalidateQueries(['lead-docs', id]) }
    catch { toast.error('Upload failed') }
    e.target.value = ''
  }

  if (isLoading) return <Spinner />
  if (!lead) return <div className="text-center py-12" style={{ color: '#94a3b8' }}>Lead not found</div>

  const score = lead.activity_score
  const label = lead.score_label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const scoreColor = label === 'HOT' ? '#ef4444' : label === 'WARM' ? '#f59e0b' : '#6366f1'
  const ScoreIcon = label === 'HOT' ? Flame : label === 'WARM' ? Thermometer : Snowflake
  const timeline = buildTimeline(lead, notes, comms, payments, calls)

  const glassBg = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {showDisposition && <DispositionModal lead={lead} onClose={() => setShowDisposition(false)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/leads')} className="p-2 rounded-xl transition-colors hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{lead.name}</h1>
            {lead.is_verified
              ? <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <ShieldCheck size={11} /> Verified
                </span>
              : <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Shield size={11} /> Unverified
                </span>
            }
          </div>
          <p className="text-xs" style={{ color: '#475569' }}>ID: {lead.id.slice(0, 8)}…</p>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Lead Info */}
        <div className="lg:col-span-3 space-y-4">
          {/* Score Card */}
          <div className="rounded-2xl p-5 text-center" style={{ ...glassBg, boxShadow: `0 0 30px ${scoreColor}20` }}>
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: `${scoreColor}15`, border: `3px solid ${scoreColor}40` }}>
              <div>
                <p className="text-2xl font-black" style={{ color: scoreColor }}>{score}</p>
                <div className="flex items-center justify-center gap-1">
                  <ScoreIcon size={10} style={{ color: scoreColor }} />
                  <span className="text-xs font-bold" style={{ color: scoreColor }}>{label}</span>
                </div>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(score, 100)}%`, background: scoreColor }} />
            </div>
          </div>

          {/* Lead Details */}
          <div className="rounded-2xl p-5 space-y-3" style={glassBg}>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Lead Info</h3>
            {lead.phone && <div className="flex items-center gap-2 text-sm" style={{ color: '#f1f5f9' }}><Phone size={13} style={{ color: '#6366f1' }} />{lead.phone}</div>}
            {lead.email && <div className="flex items-center gap-2 text-sm" style={{ color: '#f1f5f9' }}><Mail size={13} style={{ color: '#6366f1' }} /><span className="truncate">{lead.email}</span></div>}
            {lead.city && <div className="flex items-center gap-2 text-sm" style={{ color: '#f1f5f9' }}><MapPin size={13} style={{ color: '#6366f1' }} />{lead.city}</div>}
            {lead.course_interested && <div className="flex items-center gap-2 text-sm" style={{ color: '#f1f5f9' }}><BookOpen size={13} style={{ color: '#6366f1' }} />{lead.course_interested}</div>}
            <div className="flex items-center gap-2 text-sm" style={{ color: '#f1f5f9' }}><Activity size={13} style={{ color: '#6366f1' }} />Source: <span className="font-medium">{lead.source}</span></div>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#f1f5f9' }}><User size={13} style={{ color: '#6366f1' }} />Assigned: <span className="font-medium">{lead.assignee?.name || 'Unassigned'}</span></div>
            {lead.follow_up_date && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#f59e0b' }}><Calendar size={13} />Follow-up: {new Date(lead.follow_up_date).toLocaleDateString()}</div>
            )}
            <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Status</label>
              <select value={lead.status} onChange={e => updateStatus(e.target.value)} disabled={savingStatus} className="input text-xs">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Enrollment Stage */}
          <div className="rounded-2xl p-5" style={glassBg}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>Enrollment Stage</h3>
            <EnrollmentFunnel current={lead.enrollment_stage || 'NEW'} onStageClick={updateStage} loading={savingStage} />
          </div>

          {/* Documents */}
          <div className="rounded-2xl p-5" style={glassBg}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Documents</h3>
              <label className="cursor-pointer text-xs font-semibold flex items-center gap-1" style={{ color: '#6366f1' }}>
                <Upload size={11} /> Upload <input type="file" className="hidden" onChange={uploadDoc} />
              </label>
            </div>
            {docs.length === 0 ? <p className="text-xs text-center py-2" style={{ color: '#475569' }}>No documents</p> : docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <FileText size={12} style={{ color: '#6366f1', flexShrink: 0 }} />
                <a href={`http://localhost:5001${doc.file_url}`} target="_blank" rel="noopener noreferrer" className="text-xs truncate flex-1 hover:underline" style={{ color: '#60a5fa' }}>{doc.file_name}</a>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE: Activity Timeline */}
        <div className="lg:col-span-5 rounded-2xl overflow-hidden" style={glassBg}>
          {/* Tabs */}
          <div className="flex px-2 pt-2 gap-0.5 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['timeline', 'calls', 'notes', 'tasks', 'payments'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-all capitalize"
                style={tab === t
                  ? { color: '#6366f1', borderBottom: '2px solid #6366f1', background: 'rgba(99,102,241,0.08)' }
                  : { color: '#475569' }
                }>
                {t}
              </button>
            ))}
          </div>

          <div className="p-5 overflow-y-auto" style={{ maxHeight: 600 }}>
            {/* Timeline */}
            {tab === 'timeline' && (
              <div className="relative">
                <div className="absolute left-3 top-4 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="space-y-4">
                  {timeline.map(ev => {
                    const Icon = ev.Icon || Zap
                    return (
                      <div key={ev.id} className="flex gap-3 relative">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ background: ev.bg }}>
                          <Icon size={12} style={{ color: ev.color }} />
                        </div>
                        <div className="flex-1 pb-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium capitalize" style={{ color: '#f1f5f9' }}>{ev.title}</p>
                            {ev.badge && <span className="text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full" style={{ color: ev.badgeColor, background: `${ev.badgeColor}18` }}>{ev.badge}</span>}
                          </div>
                          {ev.desc && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{ev.desc}</p>}
                          <p className="text-xs mt-0.5" style={{ color: '#334155' }}>{ev.ts.toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                  {timeline.length === 0 && <p className="text-sm text-center py-8" style={{ color: '#475569' }}>No activity yet</p>}
                </div>
              </div>
            )}

            {/* Calls */}
            {tab === 'calls' && (
              <div className="space-y-3">
                {calls.length === 0 && <p className="text-sm text-center py-8" style={{ color: '#475569' }}>No calls logged</p>}
                {calls.map(call => {
                  const COLORS = { OUTGOING: '#6366f1', INCOMING: '#10b981', MISSED: '#ef4444' }
                  const color = COLORS[call.call_type] || '#6366f1'
                  return (
                    <div key={call.id} className="flex gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                        <Phone size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{call.call_type}</span>
                          {call.duration > 0 && <span className="text-xs" style={{ color: '#94a3b8' }}>{call.duration}min</span>}
                          <span className="text-xs" style={{ color: OUTCOME_COLORS[call.outcome] || '#94a3b8' }}>{OUTCOME_LABELS[call.outcome] || call.outcome}</span>
                        </div>
                        {call.notes && <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{call.notes}</p>}
                        <p className="text-xs mt-1" style={{ color: '#334155' }}>{call.user?.name} · {new Date(call.called_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Notes */}
            {tab === 'notes' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write a note..." rows={3} className="input resize-none" />
                  <button onClick={addNote} className="btn-primary text-xs px-4 py-2">Add Note</button>
                </div>
                {notes.map(note => (
                  <div key={note.id} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#f1f5f9' }}>{note.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#6366f1' }}>{note.author?.name?.[0]}</div>
                      <p className="text-xs" style={{ color: '#475569' }}>{note.author?.name} · {new Date(note.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-sm text-center py-4" style={{ color: '#475569' }}>No notes yet</p>}
              </div>
            )}

            {/* Tasks */}
            {tab === 'tasks' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title..." className="input" />
                  <div className="flex gap-2">
                    <input type="datetime-local" value={taskForm.due_at} onChange={e => setTaskForm({ ...taskForm, due_at: e.target.value })} className="input flex-1" />
                    <button onClick={addTask} className="btn-primary px-4 py-2 text-xs"><Plus size={13} /> Add</button>
                  </div>
                </div>
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${task.is_completed ? 'opacity-50' : ''}`}
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: task.is_completed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)' }}>
                    <button onClick={() => !task.is_completed && completeTask(task.id)}
                      className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: task.is_completed ? '#10b981' : 'rgba(255,255,255,0.2)', background: task.is_completed ? '#10b981' : 'transparent' }}>
                      {task.is_completed && <Check size={10} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.is_completed ? 'line-through' : ''}`} style={{ color: task.is_completed ? '#475569' : '#f1f5f9' }}>{task.title}</p>
                      <div className="flex items-center gap-1 mt-0.5"><Calendar size={10} style={{ color: '#475569' }} /><p className="text-xs" style={{ color: '#475569' }}>{new Date(task.due_at).toLocaleString()}</p></div>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-sm text-center py-4" style={{ color: '#475569' }}>No tasks yet</p>}
              </div>
            )}

            {/* Payments */}
            {tab === 'payments' && (
              <div className="space-y-3">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">₹{p.amount.toLocaleString('en-IN')}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={p.status === 'PAID' ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' } : { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{p.status}</span>
                        <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{p.payment_type}</span>
                      </div>
                      {p.due_date && <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Due: {new Date(p.due_date).toLocaleDateString()}</p>}
                    </div>
                    {p.payment_link && <a href={p.payment_link} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#6366f1' }}>Pay link</a>}
                  </div>
                ))}
                {payments.length === 0 && <p className="text-sm text-center py-8" style={{ color: '#475569' }}>No payments yet</p>}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl p-5" style={glassBg}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#94a3b8' }}>Quick Actions</h3>
            <div className="space-y-2.5">
              {/* Call */}
              <a href={`tel:${lead.phone}`}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                <Phone size={16} style={{ color: '#6366f1' }} />
                <span>Call {lead.phone}</span>
              </a>

              {/* WhatsApp */}
              {lead.phone && (
                <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                  style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#4ade80' }}>
                  <MessageCircle size={16} style={{ color: '#25D366' }} />
                  <span>Open WhatsApp</span>
                </a>
              )}

              {/* Log Call */}
              <button onClick={() => setShowDisposition(true)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                <FileText size={16} style={{ color: '#f59e0b' }} />
                <span>Log Call + Disposition</span>
              </button>

              {/* Verify */}
              <button onClick={toggleVerify} disabled={savingVerify}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                style={lead.is_verified
                  ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }
                }>
                <ShieldCheck size={16} style={{ color: lead.is_verified ? '#10b981' : '#475569' }} />
                <span>{lead.is_verified ? 'Verified Lead' : 'Mark as Verified'}</span>
              </button>

              {/* Schedule follow-up */}
              <button onClick={() => setTab('tasks')}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                <Calendar size={16} style={{ color: '#6366f1' }} />
                <span>Schedule Follow-up</span>
              </button>

              {/* Send Email */}
              {lead.email && (
                <a href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                  <Mail size={16} style={{ color: '#3b82f6' }} />
                  <span>Send Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Pipeline Move Panel */}
          <div className="rounded-2xl p-5" style={glassBg}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>Move to Stage</h3>
            <div className="space-y-2">
              {STAGES.map((stage, i) => {
                const isCurrent = lead.enrollment_stage === stage
                const color = STAGE_COLORS[stage]
                return (
                  <button key={stage} onClick={() => !isCurrent && updateStage(stage)}
                    disabled={isCurrent || savingStage}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
                    style={isCurrent
                      ? { background: `${color}15`, border: `1px solid ${color}40`, color, cursor: 'default' }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8' }
                    }>
                    <span>{STAGE_LABELS[stage]}</span>
                    {isCurrent ? <span className="text-xs font-semibold">Current</span> : <ChevronRight size={14} style={{ opacity: 0.4 }} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
