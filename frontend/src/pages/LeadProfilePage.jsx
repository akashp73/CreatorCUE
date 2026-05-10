import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Phone, Mail, MapPin, BookOpen, Activity, User, Calendar,
  Plus, Check, Flame, Thermometer, Snowflake, MessageCircle, FileText,
  Upload, IndianRupee, UserPlus, RefreshCw, StickyNote, Zap, TrendingDown,
  ShieldCheck, Shield, ChevronRight, X, Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi, notesApi, tasksApi, callsApi } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED']
const STAGE_LABELS = { NEW: 'New', COUNSELLING: 'Counselling', APPLIED: 'Applied', PAYMENT_PENDING: 'Pmt Pending', ENROLLED: 'Enrolled' }
const STAGE_COLORS = { NEW: '#7c3aed', COUNSELLING: '#3b82f6', APPLIED: '#f59e0b', PAYMENT_PENDING: '#ef4444', ENROLLED: '#10b981' }
const STATUSES = ['NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED', 'LOST']
const LEAD_TAGS = ['HOT', 'WARM', 'COLD']
const TAG_COLORS = {
  HOT:  { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  WARM: { bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  COLD: { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb' },
}
const OUTCOMES = ['INTERESTED', 'NOT_INTERESTED', 'BUSY', 'NO_ANSWER', 'CALLBACK', 'CONVERTED']
const OUTCOME_LABELS = { INTERESTED: 'Interested', NOT_INTERESTED: 'Not Interested', BUSY: 'Busy', NO_ANSWER: 'No Answer', CALLBACK: 'Callback', CONVERTED: 'Converted' }
const OUTCOME_COLORS = { INTERESTED: '#10b981', NOT_INTERESTED: '#ef4444', BUSY: '#f59e0b', NO_ANSWER: '#9ca3af', CALLBACK: '#7c3aed', CONVERTED: '#10b981' }

function EnrollmentBar({ current, onStageClick }) {
  const currentIdx = STAGES.indexOf(current)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {STAGES.map((stage, i) => {
        const done = i <= currentIdx; const color = STAGE_COLORS[stage]
        return (
          <button key={stage} onClick={() => onStageClick(stage)} style={{ flex: 1, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }} title={STAGE_LABELS[stage]}>
            <div style={{ height: 6, borderRadius: 3, background: done ? color : '#e5e7eb', transition: 'background 0.2s' }} />
            <p style={{ fontSize: 9, fontWeight: 600, textAlign: 'center', marginTop: 4, color: done ? color : '#9ca3af' }}>{STAGE_LABELS[stage]}</p>
          </button>
        )
      })}
    </div>
  )
}

function DisposeLeadTab({ lead, onSaved }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    outcome: lead.last_call_outcome || '', notes: '',
    follow_up_date: lead.follow_up_date ? new Date(lead.follow_up_date).toISOString().split('T')[0] : '',
    status: lead.status, lead_tag: lead.lead_tag || 'COLD',
    enrollment_stage: lead.enrollment_stage || 'NEW', call_duration: '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.outcome) return toast.error('Select an outcome before saving')
    setSaving(true)
    try {
      await leadsApi.dispose(lead.id, { ...form, follow_up_date: form.follow_up_date ? new Date(form.follow_up_date).toISOString() : null })
      toast.success('Disposition saved!')
      qc.invalidateQueries(['lead', lead.id]); qc.invalidateQueries(['lead-calls', lead.id])
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Call Outcome *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {OUTCOMES.map(o => (
            <button key={o} onClick={() => setForm(f => ({ ...f, outcome: o }))}
              style={{
                padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${form.outcome === o ? OUTCOME_COLORS[o] : '#e5e7eb'}`,
                background: form.outcome === o ? `${OUTCOME_COLORS[o]}12` : '#ffffff',
                color: form.outcome === o ? OUTCOME_COLORS[o] : '#6b7280',
              }}>
              {OUTCOME_LABELS[o]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Lead Tag</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {LEAD_TAGS.map(tag => {
            const c = TAG_COLORS[tag]; const active = form.lead_tag === tag
            return (
              <button key={tag} onClick={() => setForm(f => ({ ...f, lead_tag: tag }))}
                style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${active ? c.color : '#e5e7eb'}`, background: active ? c.bg : '#fff', color: c.color }}>
                {tag}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>Next Follow-up</label><input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} className="input" /></div>
        <div><label style={labelStyle}>Duration (min)</label><input type="number" min="0" value={form.call_duration} onChange={e => setForm(f => ({ ...f, call_duration: e.target.value }))} className="input" placeholder="0" /></div>
        <div><label style={labelStyle}>Update Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label style={labelStyle}>Move to Stage</label><select value={form.enrollment_stage} onChange={e => setForm(f => ({ ...f, enrollment_stage: e.target.value }))} className="input">{STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}</select></div>
      </div>
      <div><label style={labelStyle}>Remarks</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4} className="input" style={{ resize: 'vertical' }} placeholder="Call notes..." /></div>
      <button onClick={save} disabled={saving || !form.outcome} className="btn-primary" style={{ padding: '12px', fontSize: 14, justifyContent: 'center', opacity: saving || !form.outcome ? 0.5 : 1 }}>
        {saving ? 'Saving...' : 'Save Disposition'}
      </button>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }

function buildTimeline(lead, notes, comms, payments, calls) {
  const events = []
  events.push({ id: 'created', ts: new Date(lead.created_at), icon: UserPlus, color: '#7c3aed', title: `Lead from ${lead.source}`, desc: lead.assignee ? `Assigned to ${lead.assignee.name}` : 'Unassigned' })
  ;(lead.activityLogs || []).forEach(log => {
    let color = '#7c3aed', Icon = Zap
    if (log.activity_type.includes('email')) { Icon = Mail; color = '#3b82f6' }
    if (log.activity_type.includes('whatsapp')) { Icon = MessageCircle; color = '#25D366' }
    if (log.activity_type.includes('payment')) { Icon = IndianRupee; color = '#10b981' }
    if (log.activity_type === 'score_decay') { Icon = TrendingDown; color = '#ef4444' }
    events.push({ id: `act-${log.id}`, ts: new Date(log.created_at), icon: Icon, color, title: log.activity_type.replace(/_/g, ' '), desc: (log.description || '').replace(/\[key:[^\]]*\]/g, '').trim(), badge: log.points_added !== 0 ? `${log.points_added > 0 ? '+' : ''}${log.points_added}pts` : null, badgeColor: log.points_added >= 0 ? '#10b981' : '#ef4444' })
  })
  ;(notes || []).forEach(note => events.push({ id: `note-${note.id}`, ts: new Date(note.created_at), icon: StickyNote || FileText, color: '#f59e0b', title: `Note by ${note.author?.name || 'team'}`, desc: note.content.slice(0, 100) }))
  ;(comms || []).forEach(comm => { const isWA = comm.channel === 'WHATSAPP'; events.push({ id: `comm-${comm.id}`, ts: new Date(comm.sent_at), icon: isWA ? MessageCircle : Mail, color: isWA ? '#25D366' : '#3b82f6', title: isWA ? 'WhatsApp sent' : 'Email sent', desc: (comm.content || '').slice(0, 80) }) })
  ;(payments || []).forEach(pay => events.push({ id: `pay-${pay.id}`, ts: new Date(pay.paid_at || pay.created_at), icon: IndianRupee, color: pay.status === 'PAID' ? '#10b981' : '#f59e0b', title: `Payment ${pay.status.toLowerCase()}: ₹${pay.amount.toLocaleString('en-IN')}`, desc: pay.payment_type }))
  ;(calls || []).forEach(call => { const COLORS = { OUTGOING: '#7c3aed', INCOMING: '#10b981', MISSED: '#ef4444' }; events.push({ id: `call-${call.id}`, ts: new Date(call.called_at), icon: Phone, color: COLORS[call.call_type] || '#7c3aed', title: `${call.call_type.toLowerCase()} call${call.duration > 0 ? ` · ${call.duration}min` : ''}`, desc: [OUTCOME_LABELS[call.outcome] || call.outcome, call.notes].filter(Boolean).join(' · ') }) })
  return events.sort((a, b) => b.ts - a.ts)
}

export default function LeadProfilePage() {
  const { id } = useParams(); const navigate = useNavigate(); const qc = useQueryClient()
  const [tab, setTab] = useState('details')
  const [noteText, setNoteText] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', due_at: '' })
  const [savingStage, setSavingStage] = useState(false)
  const [savingVerify, setSavingVerify] = useState(false)

  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.getById(id).then(r => r.data) })
  const { data: tasks = [] } = useQuery({ queryKey: ['lead-tasks', id], queryFn: () => leadsApi.getTasks(id).then(r => r.data) })
  const { data: notes = [] } = useQuery({ queryKey: ['lead-notes', id], queryFn: () => leadsApi.getNotes(id).then(r => r.data) })
  const { data: comms = [] } = useQuery({ queryKey: ['lead-comms', id], queryFn: () => leadsApi.getComms(id).then(r => r.data) })
  const { data: payments = [] } = useQuery({ queryKey: ['lead-payments', id], queryFn: () => leadsApi.getPayments(id).then(r => r.data) })
  const { data: docs = [] } = useQuery({ queryKey: ['lead-docs', id], queryFn: () => leadsApi.getDocs(id).then(r => r.data) })
  const { data: calls = [] } = useQuery({ queryKey: ['lead-calls', id], queryFn: () => callsApi.getLeadCalls(id).then(r => r.data), retry: false })

  // ── Hooks must always run — never place useMemo/useCallback after early returns ──
  const timeline = useMemo(
    () => lead ? buildTimeline(lead, notes, comms, payments, calls) : [],
    [lead, notes, comms, payments, calls]
  )

  const updateStage = async (stage) => { setSavingStage(true); try { await leadsApi.setEnrollmentStage(id, stage); qc.invalidateQueries(['lead', id]); toast.success(`→ ${STAGE_LABELS[stage]}`) } catch { toast.error('Failed') } finally { setSavingStage(false) } }
  const toggleVerify = async () => { setSavingVerify(true); try { await leadsApi.toggleVerify(id); qc.invalidateQueries(['lead', id]); toast.success(lead?.is_verified ? 'Unverified' : 'Verified!') } catch { toast.error('Failed') } finally { setSavingVerify(false) } }
  const addNote = async () => { if (!noteText.trim()) return toast.error('Enter a note'); try { await notesApi.create({ lead_id: id, content: noteText }); setNoteText(''); toast.success('Note added'); qc.invalidateQueries(['lead-notes', id]) } catch (err) { toast.error(err.response?.data?.error || 'Failed') } }
  const addTask = async () => { if (!taskForm.title || !taskForm.due_at) return toast.error('Fill all task fields'); try { await tasksApi.create({ lead_id: id, title: taskForm.title, due_at: taskForm.due_at }); setTaskForm({ title: '', due_at: '' }); toast.success('Task created'); qc.invalidateQueries(['lead-tasks', id]) } catch (err) { toast.error(err.response?.data?.error || 'Failed') } }
  const completeTask = async (tid) => { try { await tasksApi.complete(tid); toast.success('Done!'); qc.invalidateQueries(['lead-tasks', id]) } catch { toast.error('Failed') } }
  const uploadDoc = async (e) => { const file = e.target.files[0]; if (!file) return; try { await leadsApi.uploadDoc(id, file, 'OTHER'); toast.success('Uploaded'); qc.invalidateQueries(['lead-docs', id]) } catch { toast.error('Upload failed') } e.target.value = '' }

  // ── Early returns AFTER all hooks ──────────────────────────────────────────
  if (isLoading) return <Spinner />
  if (!lead) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      <p style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Lead not found</p>
      <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>This lead may have been deleted or you don't have access.</p>
      <button onClick={() => navigate('/leads')} className="btn-primary" style={{ marginTop: 20, fontSize: 13 }}>← Back to Leads</button>
    </div>
  )

  const score = lead.activity_score
  const scoreLabel = lead.score_label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const tag = lead.lead_tag || 'COLD'; const tagC = TAG_COLORS[tag] || TAG_COLORS.COLD

  const TABS = [
    { key: 'details', label: 'Lead Details' }, { key: 'dispose', label: 'Dispose Lead' },
    { key: 'timeline', label: 'Timeline' }, { key: 'notes', label: 'Notes' },
    { key: 'calls', label: 'Calls' }, { key: 'payments', label: 'Payments' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/leads')} className="btn-outline" style={{ padding: '8px 10px', lineHeight: 1 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{lead.name}</h1>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: tagC.bg, color: tagC.color }}>{tag}</span>
            {lead.is_verified
              ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}><ShieldCheck size={10} /> Verified</span>
              : <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={10} /> Unverified</span>
            }
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>ID: {lead.id.slice(0, 8)}… · Source: {lead.source}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={`tel:${lead.phone}`} className="btn-primary" style={{ fontSize: 13, textDecoration: 'none' }}><Phone size={13} /> Call</a>
          {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}><MessageCircle size={13} /> WhatsApp</a>}
          <button onClick={() => setTab('dispose')} className="btn-outline" style={{ fontSize: 13 }}><FileText size={13} /> Log Call</button>
          <button onClick={toggleVerify} disabled={savingVerify} className="btn-outline" style={{ fontSize: 13 }}><ShieldCheck size={13} /> {lead.is_verified ? 'Verified' : 'Verify'}</button>
        </div>
      </div>

      {/* Stage bar + score */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${scoreLabel === 'HOT' ? '#ef4444' : scoreLabel === 'WARM' ? '#f59e0b' : '#7c3aed'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: scoreLabel === 'HOT' ? '#dc2626' : scoreLabel === 'WARM' ? '#d97706' : '#7c3aed', margin: 0 }}>{score}</p>
            </div>
            <ScoreBadge score={score} label={scoreLabel} />
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Enrollment Stage</p>
            <EnrollmentBar current={lead.enrollment_stage || 'NEW'} onStageClick={updateStage} />
          </div>
          {lead.follow_up_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Calendar size={13} style={{ color: '#d97706' }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#d97706', margin: 0 }}>Follow-up</p>
                <p style={{ fontSize: 12, color: '#d97706', margin: 0 }}>{new Date(lead.follow_up_date).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 12px', borderBottom: '1px solid var(--border)', gap: 2 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? '#111827' : '#6b7280', borderBottom: `2px solid ${tab === t.key ? '#000000' : 'transparent'}`,
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20, maxHeight: 580, overflowY: 'auto' }}>
          {/* Lead Details */}
          {tab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <p style={labelStyle}>Contact Info</p>
                {[{ icon: Phone, val: lead.phone, color: '#7c3aed' }, { icon: Mail, val: lead.email, color: '#3b82f6' }, { icon: MapPin, val: lead.city, color: '#f59e0b' }, { icon: BookOpen, val: lead.course_interested, color: '#10b981' }, { icon: Activity, val: `Source: ${lead.source}`, color: '#6b7280' }, { icon: User, val: `Assigned: ${lead.assignee?.name || 'Unassigned'}`, color: '#6b7280' }].filter(r => r.val).map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                    <row.icon size={14} style={{ color: row.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={labelStyle}>Documents</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <label className="btn-outline" style={{ fontSize: 12, cursor: 'pointer', padding: '5px 10px' }}>
                    <Upload size={12} /> Upload <input type="file" className="hidden" onChange={uploadDoc} />
                  </label>
                </div>
                {docs.length === 0 ? <p style={{ fontSize: 13, color: '#9ca3af' }}>No documents</p>
                  : docs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
                      <FileText size={12} style={{ color: '#7c3aed' }} />
                      <a href={`http://localhost:5001${doc.file_url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</a>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Dispose */}
          {tab === 'dispose' && <DisposeLeadTab lead={lead} onSaved={() => qc.invalidateQueries(['lead', id])} />}

          {/* Timeline */}
          {tab === 'timeline' && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 13, top: 14, bottom: 0, width: 1, background: '#e5e7eb' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {timeline.map(ev => {
                  const Icon = ev.icon || Zap
                  return (
                    <div key={ev.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ev.color}12`, border: `1.5px solid ${ev.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                        <Icon size={12} style={{ color: ev.color }} />
                      </div>
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>{ev.title}</p>
                          {ev.badge && <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: `${ev.badgeColor}12`, color: ev.badgeColor, flexShrink: 0 }}>{ev.badge}</span>}
                        </div>
                        {ev.desc && <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{ev.desc}</p>}
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>{ev.ts.toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
                {timeline.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0' }}>No activity yet</p>}
              </div>
            </div>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: '#fafafa', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write a note..." rows={3} className="input" style={{ resize: 'none' }} />
                <button onClick={addNote} className="btn-primary" style={{ fontSize: 13, width: 'fit-content' }}>Add Note</button>
              </div>
              {notes.map(note => (
                <div key={note.id} style={{ padding: 14, background: '#ffffff', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{note.author?.name} · {new Date(note.created_at).toLocaleString()}</p>
                </div>
              ))}
              {notes.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No notes yet</p>}
            </div>
          )}

          {/* Calls */}
          {tab === 'calls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => setTab('dispose')} className="btn-outline" style={{ fontSize: 12 }}>+ Log Call</button></div>
              {calls.map(call => {
                const COLORS = { OUTGOING: '#7c3aed', INCOMING: '#10b981', MISSED: '#ef4444' }; const color = COLORS[call.call_type] || '#7c3aed'
                return (
                  <div key={call.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#fafafa', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={14} style={{ color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: `${color}12`, color }}>{call.call_type}</span>
                        {call.duration > 0 && <span style={{ fontSize: 12, color: '#6b7280' }}>{call.duration}min</span>}
                        <span style={{ fontSize: 12, fontWeight: 500, color: OUTCOME_COLORS[call.outcome] || '#6b7280' }}>{OUTCOME_LABELS[call.outcome] || call.outcome}</span>
                      </div>
                      {call.notes && <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{call.notes}</p>}
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{call.user?.name} · {new Date(call.called_at).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
              {calls.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>No calls logged</p>}
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#fafafa', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>₹{p.amount.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: p.status === 'PAID' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: p.status === 'PAID' ? '#059669' : '#d97706' }}>{p.status}</span>
                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: '#f3f4f6', color: '#6b7280' }}>{p.payment_type}</span>
                    </div>
                    {p.due_date && <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Due: {new Date(p.due_date).toLocaleDateString()}</p>}
                  </div>
                  {p.payment_link && <a href={p.payment_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>Pay link →</a>}
                </div>
              ))}
              {payments.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>No payments yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
