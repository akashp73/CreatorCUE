import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Phone, Mail, MapPin, BookOpen, Activity, User, Calendar,
  Plus, Check, Flame, Thermometer, Snowflake, MessageCircle, Send, FileText,
  Upload, IndianRupee, UserPlus, RefreshCw, StickyNote, Zap, TrendingDown,
  ShieldCheck, Shield, ChevronRight, X, Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi, notesApi, tasksApi, callsApi } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED']
const STAGE_LABELS = { NEW: 'New', COUNSELLING: 'Counselling', APPLIED: 'Applied', PAYMENT_PENDING: 'Pmt Pending', ENROLLED: 'Enrolled' }
const STAGE_COLORS = { NEW: '#6366f1', COUNSELLING: '#f59e0b', APPLIED: '#3b82f6', PAYMENT_PENDING: '#f97316', ENROLLED: '#10b981' }
const STATUSES = ['NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED', 'LOST']
const LEAD_TAGS = ['HOT', 'WARM', 'COLD']
const TAG_COLORS = { HOT: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' }, WARM: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' }, COLD: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1', border: 'rgba(99,102,241,0.3)' } }

const OUTCOMES = ['INTERESTED', 'NOT_INTERESTED', 'BUSY', 'NO_ANSWER', 'CALLBACK', 'CONVERTED']
const OUTCOME_LABELS = { INTERESTED: 'Interested', NOT_INTERESTED: 'Not Interested', BUSY: 'Busy', NO_ANSWER: 'No Answer', CALLBACK: 'Callback', CONVERTED: 'Converted' }
const OUTCOME_COLORS = { INTERESTED: '#10b981', NOT_INTERESTED: '#ef4444', BUSY: '#f59e0b', NO_ANSWER: '#94a3b8', CALLBACK: '#6366f1', CONVERTED: '#10b981' }

// ── Enrollment Stage Bar ──────────────────────────────────────
function EnrollmentBar({ current, onStageClick, loading }) {
  const currentIdx = STAGES.indexOf(current)
  return (
    <div className="flex gap-1.5">
      {STAGES.map((stage, i) => {
        const done = i <= currentIdx
        const color = STAGE_COLORS[stage]
        return (
          <button key={stage} onClick={() => !loading && onStageClick(stage)}
            className="flex-1 transition-all" title={STAGE_LABELS[stage]}>
            <div className="h-2.5 rounded-full transition-all duration-300"
              style={{ background: done ? color : 'var(--border)' }} />
            <p className="text-center mt-1.5 font-semibold leading-none"
              style={{ color: done ? color : 'var(--text-muted)', fontSize: 9 }}>
              {STAGE_LABELS[stage]}
            </p>
          </button>
        )
      })}
    </div>
  )
}

// ── Disposition / Dispose Lead Form ───────────────────────────
function DisposeLeadTab({ lead, onSaved }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    outcome: lead.last_call_outcome || '',
    notes: '',
    follow_up_date: lead.follow_up_date ? new Date(lead.follow_up_date).toISOString().split('T')[0] : '',
    status: lead.status,
    lead_tag: lead.lead_tag || 'COLD',
    enrollment_stage: lead.enrollment_stage || 'NEW',
    reassign_to: '',
    call_duration: '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.outcome) return toast.error('Select an outcome before saving')
    setSaving(true)
    try {
      await leadsApi.dispose(lead.id, {
        ...form,
        follow_up_date: form.follow_up_date ? new Date(form.follow_up_date).toISOString() : null,
      })
      toast.success('Disposition saved!')
      qc.invalidateQueries(['lead', lead.id])
      qc.invalidateQueries(['lead-calls', lead.id])
      onSaved?.()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      {/* Outcome */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-secondary)' }}>
          Call Outcome * (required)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {OUTCOMES.map(o => (
            <button key={o} onClick={() => setForm(f => ({ ...f, outcome: o }))}
              className="py-2 px-2 rounded-xl text-xs font-semibold transition-all text-center"
              style={form.outcome === o
                ? { background: `${OUTCOME_COLORS[o]}20`, color: OUTCOME_COLORS[o], border: `1px solid ${OUTCOME_COLORS[o]}50` }
                : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }>
              {OUTCOME_LABELS[o]}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Tag */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-secondary)' }}>Lead Tag</label>
        <div className="flex gap-2">
          {LEAD_TAGS.map(tag => {
            const c = TAG_COLORS[tag]
            return (
              <button key={tag} onClick={() => setForm(f => ({ ...f, lead_tag: tag }))}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={form.lead_tag === tag
                  ? { background: c.bg, color: c.color, border: `1px solid ${c.border}` }
                  : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                }>
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Next Actions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>Next Follow-up</label>
          <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>Duration (min)</label>
          <input type="number" min="0" value={form.call_duration} onChange={e => setForm(f => ({ ...f, call_duration: e.target.value }))} className="input" placeholder="0" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>Update Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>Move to Stage</label>
          <select value={form.enrollment_stage} onChange={e => setForm(f => ({ ...f, enrollment_stage: e.target.value }))} className="input">
            {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-secondary)' }}>Remarks</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4} className="input resize-none" placeholder="Call notes and remarks..." />
      </div>

      <button onClick={save} disabled={saving || !form.outcome}
        className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
        style={{ background: form.outcome ? '#6366f1' : 'var(--border)', boxShadow: form.outcome ? '0 0 20px rgba(99,102,241,0.3)' : 'none' }}>
        {saving ? 'Saving...' : 'Save Disposition'}
      </button>
    </div>
  )
}

// ── Activity helpers ──────────────────────────────────────────
function activityIcon(type) {
  if (type === 'form_fill') return { Icon: UserPlus, color: '#6366f1' }
  if (type === 'score_decay') return { Icon: TrendingDown, color: '#ef4444' }
  if (type.includes('email')) return { Icon: Mail, color: '#3b82f6' }
  if (type.includes('whatsapp')) return { Icon: MessageCircle, color: '#25D366' }
  if (type.includes('payment')) return { Icon: IndianRupee, color: '#10b981' }
  if (type.includes('status')) return { Icon: RefreshCw, color: '#f59e0b' }
  return { Icon: Zap, color: '#6366f1' }
}

function buildTimeline(lead, notes, comms, payments, calls) {
  const events = []
  events.push({ id: 'created', ts: new Date(lead.created_at), Icon: UserPlus, color: '#6366f1', title: `Lead captured from ${lead.source}`, desc: lead.assignee ? `Assigned to ${lead.assignee.name}` : 'Unassigned' })
  ;(lead.activityLogs || []).forEach(log => {
    const { Icon, color } = activityIcon(log.activity_type)
    events.push({ id: `act-${log.id}`, ts: new Date(log.created_at), Icon, color, title: log.activity_type.replace(/_/g, ' '), desc: (log.description || '').replace(/\[key:[^\]]*\]/g, '').trim(), badge: log.points_added !== 0 ? `${log.points_added > 0 ? '+' : ''}${log.points_added} pts` : null, badgeColor: log.points_added >= 0 ? '#10b981' : '#ef4444' })
  })
  ;(notes || []).forEach(note => events.push({ id: `note-${note.id}`, ts: new Date(note.created_at), Icon: StickyNote || FileText, color: '#f59e0b', title: `Note by ${note.author?.name || 'team'}`, desc: note.content.slice(0, 100) }))
  ;(comms || []).forEach(comm => {
    const isWA = comm.channel === 'WHATSAPP'
    events.push({ id: `comm-${comm.id}`, ts: new Date(comm.sent_at), Icon: isWA ? MessageCircle : Mail, color: isWA ? '#25D366' : '#3b82f6', title: isWA ? 'WhatsApp sent' : 'Email sent', desc: (comm.content || '').slice(0, 80) })
  })
  ;(payments || []).forEach(pay => events.push({ id: `pay-${pay.id}`, ts: new Date(pay.paid_at || pay.created_at), Icon: IndianRupee, color: pay.status === 'PAID' ? '#10b981' : '#f59e0b', title: `Payment ${pay.status.toLowerCase()}: ₹${pay.amount.toLocaleString('en-IN')}`, desc: pay.payment_type }))
  const CALL_COLORS = { OUTGOING: '#6366f1', INCOMING: '#10b981', MISSED: '#ef4444' }
  ;(calls || []).forEach(call => events.push({ id: `call-${call.id}`, ts: new Date(call.called_at), Icon: Phone, color: CALL_COLORS[call.call_type] || '#6366f1', title: `${call.call_type.toLowerCase()} call${call.duration > 0 ? ` · ${call.duration}min` : ''}`, desc: [OUTCOME_LABELS[call.outcome] || call.outcome, call.notes].filter(Boolean).join(' · ') }))
  return events.sort((a, b) => b.ts - a.ts)
}

// ── Main Component ────────────────────────────────────────────
export default function LeadProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState('details')
  const [noteText, setNoteText] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', due_at: '' })
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingStage, setSavingStage] = useState(false)
  const [savingVerify, setSavingVerify] = useState(false)

  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.getById(id).then(r => r.data) })
  const { data: tasks = [] } = useQuery({ queryKey: ['lead-tasks', id], queryFn: () => leadsApi.getTasks(id).then(r => r.data) })
  const { data: notes = [] } = useQuery({ queryKey: ['lead-notes', id], queryFn: () => leadsApi.getNotes(id).then(r => r.data) })
  const { data: comms = [] } = useQuery({ queryKey: ['lead-comms', id], queryFn: () => leadsApi.getComms(id).then(r => r.data) })
  const { data: payments = [] } = useQuery({ queryKey: ['lead-payments', id], queryFn: () => leadsApi.getPayments(id).then(r => r.data) })
  const { data: docs = [] } = useQuery({ queryKey: ['lead-docs', id], queryFn: () => leadsApi.getDocs(id).then(r => r.data) })
  const { data: calls = [] } = useQuery({ queryKey: ['lead-calls', id], queryFn: () => callsApi.getLeadCalls(id).then(r => r.data), retry: false })

  const updateStatus = async (status) => { setSavingStatus(true); try { await leadsApi.update(id, { status }); qc.invalidateQueries(['lead', id]); toast.success('Status updated') } catch { toast.error('Failed') } finally { setSavingStatus(false) } }
  const updateStage = async (stage) => { setSavingStage(true); try { await leadsApi.setEnrollmentStage(id, stage); qc.invalidateQueries(['lead', id]); toast.success(`Moved to ${STAGE_LABELS[stage]}`) } catch { toast.error('Failed') } finally { setSavingStage(false) } }
  const toggleVerify = async () => { setSavingVerify(true); try { await leadsApi.toggleVerify(id); qc.invalidateQueries(['lead', id]); toast.success(lead.is_verified ? 'Unverified' : 'Verified!') } catch { toast.error('Failed') } finally { setSavingVerify(false) } }
  const addNote = async () => { if (!noteText.trim()) return toast.error('Enter a note'); try { await notesApi.create({ lead_id: id, content: noteText }); setNoteText(''); toast.success('Note added'); qc.invalidateQueries(['lead-notes', id]) } catch (err) { toast.error(err.response?.data?.error || 'Failed') } }
  const addTask = async () => { if (!taskForm.title || !taskForm.due_at) return toast.error('Fill all task fields'); try { await tasksApi.create({ lead_id: id, title: taskForm.title, due_at: taskForm.due_at }); setTaskForm({ title: '', due_at: '' }); toast.success('Task created'); qc.invalidateQueries(['lead-tasks', id]) } catch (err) { toast.error(err.response?.data?.error || 'Failed') } }
  const completeTask = async (tid) => { try { await tasksApi.complete(tid); toast.success('Done!'); qc.invalidateQueries(['lead-tasks', id]) } catch { toast.error('Failed') } }
  const uploadDoc = async (e) => { const file = e.target.files[0]; if (!file) return; try { await leadsApi.uploadDoc(id, file, 'OTHER'); toast.success('Uploaded'); qc.invalidateQueries(['lead-docs', id]) } catch { toast.error('Upload failed') } e.target.value = '' }

  if (isLoading) return <Spinner />
  if (!lead) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Lead not found</div>

  const score = lead.activity_score
  const scoreLabel = lead.score_label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const scoreColor = scoreLabel === 'HOT' ? '#ef4444' : scoreLabel === 'WARM' ? '#f59e0b' : '#6366f1'
  const tag = lead.lead_tag || 'COLD'
  const tagC = TAG_COLORS[tag] || TAG_COLORS.COLD
  const timeline = useMemo(() => buildTimeline(lead, notes, comms, payments, calls), [lead, notes, comms, payments, calls])

  const TABS = [
    { key: 'details', label: 'Lead Details' },
    { key: 'dispose', label: 'Dispose Lead' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'notes', label: 'Notes' },
    { key: 'calls', label: 'Calls' },
    { key: 'payments', label: 'Payments' },
  ]

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/leads')} className="p-2 rounded-xl transition-colors hover:bg-opacity-10"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{lead.name}</h1>
            {/* Lead tag */}
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: tagC.bg, color: tagC.color, border: `1px solid ${tagC.border}` }}>
              <Tag size={9} /> {tag}
            </span>
            {lead.is_verified
              ? <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}><ShieldCheck size={10} /> Verified</span>
              : <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}><Shield size={10} /> Unverified</span>
            }
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ID: {lead.id.slice(0, 8)}… · Source: {lead.source}</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: '#6366f1' }}><Phone size={12} /> Call</a>
          {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: '#25D366' }}><MessageCircle size={12} /> WhatsApp</a>}
          {lead.email && <a href={`mailto:${lead.email}`} className="btn-outline text-xs px-3 py-1.5"><Mail size={12} /> Email</a>}
          <button onClick={() => setTab('dispose')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}><FileText size={12} /> Log Call</button>
          <button onClick={toggleVerify} disabled={savingVerify} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={lead.is_verified ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' } : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <ShieldCheck size={12} /> {lead.is_verified ? 'Verified' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Score + Stage summary bar */}
      <div className="card">
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base" style={{ background: `${scoreColor}15`, color: scoreColor, border: `2px solid ${scoreColor}40` }}>{score}</div>
            <div>
              <p className="text-xs font-bold" style={{ color: scoreColor }}>{scoreLabel} Lead</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Activity Score</p>
            </div>
          </div>
          <div className="flex-1" style={{ minWidth: 200 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Enrollment Stage</p>
            <EnrollmentBar current={lead.enrollment_stage || 'NEW'} onStageClick={updateStage} loading={savingStage} />
          </div>
          {lead.follow_up_date && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Calendar size={13} style={{ color: '#f59e0b' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: '#f59e0b' }}>Follow-up</p>
                <p className="text-xs" style={{ color: '#f59e0b' }}>{new Date(lead.follow_up_date).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content with tabs */}
      <div className="card p-0 overflow-hidden">
        {/* Tab nav */}
        <div className="flex overflow-x-auto px-2 pt-2 gap-0.5" style={{ borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-5 py-3 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-all"
              style={tab === t.key
                ? { color: '#6366f1', borderBottom: '2px solid #6366f1', background: 'rgba(99,102,241,0.06)' }
                : { color: 'var(--text-muted)' }
              }>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5" style={{ maxHeight: 620, overflowY: 'auto' }}>
          {/* Lead Details */}
          {tab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Contact Info</h3>
                {[
                  { icon: Phone, val: lead.phone, color: '#6366f1' },
                  { icon: Mail, val: lead.email, color: '#3b82f6' },
                  { icon: MapPin, val: lead.city, color: '#f59e0b' },
                  { icon: BookOpen, val: lead.course_interested, color: '#10b981' },
                  { icon: Activity, val: `Source: ${lead.source}`, color: '#6366f1' },
                  { icon: User, val: `Assigned: ${lead.assignee?.name || 'Unassigned'}`, color: '#6366f1' },
                ].filter(r => r.val).map((row, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <row.icon size={14} style={{ color: row.color, flexShrink: 0 }} />
                    <span>{row.val}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>CRM Data</h3>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Status</label>
                  <select value={lead.status} onChange={e => updateStatus(e.target.value)} disabled={savingStatus} className="input">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                {lead.last_call_date && <div className="text-sm" style={{ color: 'var(--text-primary)' }}>Last call: {new Date(lead.last_call_date).toLocaleDateString()} · {lead.last_call_outcome || '—'}</div>}
                {/* Documents */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Documents</span>
                    <label className="cursor-pointer text-xs font-semibold flex items-center gap-1" style={{ color: '#6366f1' }}>
                      <Upload size={11} /> Upload <input type="file" className="hidden" onChange={uploadDoc} />
                    </label>
                  </div>
                  {docs.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No documents</p>
                    : docs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                        <FileText size={12} style={{ color: '#6366f1' }} />
                        <a href={`http://localhost:5001${doc.file_url}`} target="_blank" rel="noopener noreferrer" className="text-xs truncate flex-1 hover:underline" style={{ color: '#60a5fa' }}>{doc.file_name}</a>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Dispose Lead */}
          {tab === 'dispose' && <DisposeLeadTab lead={lead} onSaved={() => qc.invalidateQueries(['lead', id])} />}

          {/* Timeline */}
          {tab === 'timeline' && (
            <div className="relative">
              <div className="absolute left-3 top-4 bottom-0 w-px" style={{ background: 'var(--border)' }} />
              <div className="space-y-4">
                {timeline.map(ev => {
                  const Icon = ev.Icon || Zap
                  return (
                    <div key={ev.id} className="flex gap-3 relative">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ background: `${ev.color}18` }}>
                        <Icon size={12} style={{ color: ev.color }} />
                      </div>
                      <div className="flex-1 pb-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{ev.title}</p>
                          {ev.badge && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: ev.badgeColor, background: `${ev.badgeColor}18` }}>{ev.badge}</span>}
                        </div>
                        {ev.desc && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{ev.desc}</p>}
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{ev.ts.toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
                {timeline.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No activity yet</p>}
              </div>
            </div>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write a note..." rows={3} className="input resize-none" />
                <button onClick={addNote} className="btn-primary text-xs px-4 py-2">Add Note</button>
              </div>
              {notes.map(note => (
                <div key={note.id} className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{note.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#6366f1' }}>{note.author?.name?.[0]}</div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{note.author?.name} · {new Date(note.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No notes yet</p>}
            </div>
          )}

          {/* Calls */}
          {tab === 'calls' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{calls.length} call{calls.length !== 1 ? 's' : ''} logged</p>
                <button onClick={() => setTab('dispose')} className="text-xs font-medium" style={{ color: '#6366f1' }}>+ Log Call</button>
              </div>
              {calls.map(call => {
                const COLORS = { OUTGOING: '#6366f1', INCOMING: '#10b981', MISSED: '#ef4444' }
                const color = COLORS[call.call_type] || '#6366f1'
                return (
                  <div key={call.id} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                      <Phone size={14} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{call.call_type}</span>
                        {call.duration > 0 && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{call.duration}min</span>}
                        <span className="text-xs font-semibold" style={{ color: OUTCOME_COLORS[call.outcome] || 'var(--text-secondary)' }}>{OUTCOME_LABELS[call.outcome] || call.outcome}</span>
                      </div>
                      {call.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{call.notes}</p>}
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{call.user?.name} · {new Date(call.called_at).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
              {calls.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No calls logged</p>}
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{p.amount.toLocaleString('en-IN')}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={p.status === 'PAID' ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' } : { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{p.status}</span>
                      <span className="text-xs px-1.5 rounded" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>{p.payment_type}</span>
                    </div>
                    {p.due_date && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Due: {new Date(p.due_date).toLocaleDateString()}</p>}
                  </div>
                  {p.payment_link && <a href={p.payment_link} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#6366f1' }}>Pay link</a>}
                </div>
              ))}
              {payments.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No payments yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
