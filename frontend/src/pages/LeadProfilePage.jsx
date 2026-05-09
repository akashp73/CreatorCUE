import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, BookOpen, Activity, User, Calendar, Plus, Check, Flame, Thermometer, Snowflake, MessageCircle, Send, FileText, Upload, Trash2, IndianRupee, Bell, UserPlus, RefreshCw, StickyNote, Zap, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi, notesApi, tasksApi, commsApi, emailTplApi, waTplApi, paymentsApi, callsApi } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const STATUSES = ['NEW','CONTACTED','APPLIED','QUALIFIED','ENROLLED','LOST']
const CALL_TYPES = ['OUTGOING','INCOMING','MISSED']
const CALL_OUTCOMES = ['CONNECTED','INTERESTED','NOT_INTERESTED','CALLBACK','NO_ANSWER']

function LogCallModal({ lead, onClose, onLogged }) {
  const [form, setForm] = useState({ call_type:'OUTGOING', duration:'', outcome:'CONNECTED', notes:'' })
  const [saving, setSaving] = useState(false)
  const save = async () => {
    setSaving(true)
    try { await callsApi.log({ lead_id: lead.id, ...form, duration: parseInt(form.duration)||0 }); toast.success('Call logged!'); onLogged(); onClose() }
    catch (err) { toast.error(err.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Phone size={16} className="text-indigo-600"/> Log Call — {lead.name}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Call Type</label>
            <div className="flex gap-2">
              {CALL_TYPES.map(t=><button key={t} onClick={()=>setForm({...form,call_type:t})} className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${form.call_type===t?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{t}</button>)}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Duration (minutes)</label>
            <input type="number" min="0" max="999" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="0" className="input"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {CALL_OUTCOMES.map(o=><button key={o} onClick={()=>setForm({...form,outcome:o})} className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${form.outcome===o?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{o.replace(/_/g,' ')}</button>)}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Call notes…" rows={2} className="input resize-none"/>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-all" style={{backgroundColor:'#4f46e5'}}>{saving?'Saving…':'Log Call'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleCallModal({ lead, onClose }) {
  const [dateTime, setDateTime] = useState('')
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!dateTime) return toast.error('Pick a date and time')
    setSaving(true)
    try { await tasksApi.create({ lead_id: lead.id, title: `Call ${lead.name}`, due_at: new Date(dateTime).toISOString() }); toast.success('Call scheduled!'); onClose() }
    catch { toast.error('Failed to schedule') }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar size={16} className="text-indigo-600"/> Schedule Call</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Date & Time *</label>
            <input type="datetime-local" value={dateTime} onChange={e=>setDateTime(e.target.value)} className="input"/>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-all" style={{backgroundColor:'#4f46e5'}}>{saving?'Saving…':'Schedule'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
const PAY_STATUS = { PENDING:'bg-yellow-100 text-yellow-700', PAID:'bg-green-100 text-green-700', FAILED:'bg-red-100 text-red-600', REFUNDED:'bg-gray-100 text-gray-600' }

// ── Helpers ────────────────────────────────────────────────────────────────
function activityIcon(type) {
  if (type === 'form_fill') return { Icon: UserPlus, color: '#4f46e5', bg: '#eef2ff' }
  if (type === 'score_decay') return { Icon: TrendingDown, color: '#E53E3E', bg: '#FEE2E2' }
  if (type.includes('email')) return { Icon: Mail, color: '#3B82F6', bg: '#EFF6FF' }
  if (type.includes('whatsapp')) return { Icon: MessageCircle, color: '#25D366', bg: '#F0FDF4' }
  if (type.includes('payment')) return { Icon: IndianRupee, color: '#10B981', bg: '#D1FAE5' }
  if (type.includes('status')) return { Icon: RefreshCw, color: '#F59E0B', bg: '#FEF3C7' }
  if (type.includes('video') || type.includes('module') || type.includes('webinar')) return { Icon: Activity, color: '#8B5CF6', bg: '#EDE9FE' }
  return { Icon: Zap, color: '#4f46e5', bg: '#EEF2FF' }
}

function channelIcon(channel) {
  if (channel === 'WHATSAPP') return { Icon: MessageCircle, color: '#25D366', bg: '#F0FDF4', label: 'WhatsApp sent' }
  if (channel === 'EMAIL') return { Icon: Mail, color: '#3B82F6', bg: '#EFF6FF', label: 'Email sent' }
  if (channel === 'PHONE') return { Icon: Phone, color: '#10B981', bg: '#D1FAE5', label: 'Called' }
  return { Icon: Send, color: '#6B7280', bg: '#F3F4F6', label: 'Message sent' }
}

function buildTimeline(lead, notes, comms, payments) {
  const events = []

  // Lead creation
  events.push({
    id: 'created', ts: new Date(lead.created_at),
    Icon: UserPlus, color: '#4f46e5', bg: '#eef2ff',
    title: `Lead captured from ${lead.source}`,
    desc: lead.assignee ? `Assigned to ${lead.assignee.name}` : 'Unassigned',
  })

  // Activity logs
  ;(lead.activityLogs || []).forEach(log => {
    const { Icon, color, bg } = activityIcon(log.activity_type)
    const clean = (log.description || '').replace(/\[key:[^\]]*\]/g, '').trim()
    events.push({
      id: `act-${log.id}`, ts: new Date(log.created_at),
      Icon, color, bg,
      title: log.activity_type.replace(/_/g, ' '),
      desc: clean,
      badge: log.points_added !== 0 ? `${log.points_added > 0 ? '+' : ''}${log.points_added} pts` : null,
      badgeColor: log.points_added >= 0 ? '#10B981' : '#E53E3E',
    })
  })

  // Notes
  ;(notes || []).forEach(note => {
    const isDup = note.content.startsWith('Also came from')
    events.push({
      id: `note-${note.id}`, ts: new Date(note.created_at),
      Icon: StickyNote || FileText, color: isDup ? '#F59E0B' : '#6B7280', bg: isDup ? '#FEF9C3' : '#F9FAFB',
      title: isDup ? note.content : `Note by ${note.author?.name || 'team'}`,
      desc: isDup ? '' : note.content.slice(0, 100) + (note.content.length > 100 ? '…' : ''),
    })
  })

  // Comm logs
  ;(comms || []).forEach(comm => {
    const { Icon, color, bg, label } = channelIcon(comm.channel)
    events.push({
      id: `comm-${comm.id}`, ts: new Date(comm.sent_at),
      Icon, color, bg,
      title: label,
      desc: (comm.content || '').slice(0, 80) + ((comm.content || '').length > 80 ? '…' : ''),
    })
  })

  // Payments
  ;(payments || []).forEach(pay => {
    const isPaid = pay.status === 'PAID'
    events.push({
      id: `pay-${pay.id}`, ts: new Date(pay.paid_at || pay.created_at),
      Icon: IndianRupee, color: isPaid ? '#10B981' : '#F59E0B', bg: isPaid ? '#D1FAE5' : '#FEF3C7',
      title: `Payment ${pay.status.toLowerCase()}: ₹${pay.amount.toLocaleString('en-IN')}`,
      desc: pay.payment_type,
    })
  })

  // Call logs
  const CALL_COLORS = { OUTGOING:{color:'#4f46e5',bg:'#eef2ff'}, INCOMING:{color:'#10B981',bg:'#d1fae5'}, MISSED:{color:'#E53E3E',bg:'#fee2e2'} }
  const OUTCOME_LABELS = { INTERESTED:'✅ Interested', NOT_INTERESTED:'❌ Not interested', CALLBACK:'📅 Callback', NO_ANSWER:'📵 No answer', CONNECTED:'✅ Connected' }
  ;(calls || []).forEach(call => {
    const { color, bg } = CALL_COLORS[call.call_type] || CALL_COLORS.OUTGOING
    events.push({
      id: `call-${call.id}`, ts: new Date(call.called_at),
      Icon: Phone, color, bg,
      title: `${call.call_type.toLowerCase()} call${call.duration > 0 ? ` · ${call.duration}min` : ''}`,
      desc: [OUTCOME_LABELS[call.outcome] || call.outcome, call.notes].filter(Boolean).join(' · '),
    })
  })

  return events.sort((a, b) => b.ts - a.ts)
}

function LeadTimeline({ lead, notes, comms, payments, calls }) {
  const events = useMemo(() => buildTimeline(lead, notes, comms, payments, calls), [lead, notes, comms, payments, calls])
  if (!events.length) return <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-4 bottom-0 w-px bg-gray-100" />
      <div className="space-y-4">
        {events.map((ev, i) => {
          const Icon = ev.Icon || Zap
          return (
            <div key={ev.id} className="flex gap-3 relative">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ backgroundColor: ev.bg }}>
                <Icon size={13} style={{ color: ev.color }} />
              </div>
              <div className="flex-1 pb-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 leading-snug capitalize">{ev.title}</p>
                  {ev.badge && (
                    <span className="text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full" style={{ color: ev.badgeColor, backgroundColor: ev.badgeColor + '18' }}>
                      {ev.badge}
                    </span>
                  )}
                </div>
                {ev.desc && <p className="text-xs text-gray-500 mt-0.5">{ev.desc}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{ev.ts.toLocaleString()}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active ? 'text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
      style={active ? { borderColor: '#4f46e5' } : {}}>
      {children}
    </button>
  )
}

export default function LeadProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState('timeline')
  const [noteText, setNoteText] = useState('')
  const [taskForm, setTaskForm] = useState({ title:'', due_at:'' })
  const [savingStatus, setSavingStatus] = useState(false)
  const [showLogCall, setShowLogCall] = useState(false)
  const [showScheduleCall, setShowScheduleCall] = useState(false)

  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.getById(id).then(r => r.data) })
  const { data: tasks = [] } = useQuery({ queryKey: ['lead-tasks', id], queryFn: () => leadsApi.getTasks(id).then(r => r.data) })
  const { data: notes = [] } = useQuery({ queryKey: ['lead-notes', id], queryFn: () => leadsApi.getNotes(id).then(r => r.data) })
  const { data: comms = [] } = useQuery({ queryKey: ['lead-comms', id], queryFn: () => leadsApi.getComms(id).then(r => r.data) })
  const { data: payments = [] } = useQuery({ queryKey: ['lead-payments', id], queryFn: () => leadsApi.getPayments(id).then(r => r.data) })
  const { data: docs = [] } = useQuery({ queryKey: ['lead-docs', id], queryFn: () => leadsApi.getDocs(id).then(r => r.data) })
  const { data: calls = [] } = useQuery({ queryKey: ['lead-calls', id], queryFn: () => callsApi.getLeadCalls(id).then(r => r.data), retry: false })
  const { data: actLog = [] } = useQuery({ queryKey: ['lead-activity', id], queryFn: () => leadsApi.getById(id).then(r => r.data.activityLogs || []) })

  const updateStatus = async (status) => {
    setSavingStatus(true)
    try { await leadsApi.update(id, { status }); qc.invalidateQueries(['lead', id]); toast.success('Status updated') }
    catch { toast.error('Failed') } finally { setSavingStatus(false) }
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
      setTaskForm({ title:'', due_at:'' }); toast.success('Task created'); qc.invalidateQueries(['lead-tasks', id])
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
  if (!lead) return <div className="text-center py-12 text-gray-400">Lead not found</div>

  const score = lead.activity_score
  const label = lead.score_label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const scoreColor = label === 'HOT' ? '#E53E3E' : label === 'WARM' ? '#f59e0b' : '#3182CE'
  const ScoreIcon = label === 'HOT' ? Flame : label === 'WARM' ? Thermometer : Snowflake

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {showLogCall && <LogCallModal lead={lead} onClose={()=>setShowLogCall(false)} onLogged={()=>qc.invalidateQueries(['lead-calls',id])} />}
      {showScheduleCall && <ScheduleCallModal lead={lead} onClose={()=>setShowScheduleCall(false)} />}

      <div className="flex items-center gap-3">
        <button onClick={()=>navigate('/leads')} className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-600"><ArrowLeft size={16}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{lead.name}</h1>
          <p className="text-xs text-gray-400">Lead ID: {lead.id.slice(0,8)}…</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`tel:${lead.phone}`} className="btn-outline text-xs px-3 py-1.5"><Phone size={13}/> Call</a>
          {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{backgroundColor:'#25D366'}}><MessageCircle size={13}/> WhatsApp</a>}
          <button onClick={()=>setShowLogCall(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all"><Phone size={13}/> Log Call</button>
          <button onClick={()=>setShowScheduleCall(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 border-amber-200 text-amber-700 hover:bg-amber-50 transition-all"><Calendar size={13}/> Schedule Call</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="space-y-4">
          {/* Score */}
          <div className="card flex flex-col items-center py-6">
            <div className="w-28 h-28 rounded-full border-8 flex items-center justify-center mb-3" style={{borderColor: scoreColor+'33'}}>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{color:scoreColor}}>{score}</p>
                <div className="flex items-center gap-1 justify-center mt-0.5">
                  <ScoreIcon size={12} style={{color:scoreColor}}/>
                  <span className="text-xs font-semibold" style={{color:scoreColor}}>{label}</span>
                </div>
              </div>
            </div>
            <div className="w-full mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Activity Score</span><span>{Math.min(score,100)}%</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${Math.min(score,100)}%`, backgroundColor:scoreColor}}/>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Lead Details</h3>
            {lead.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-gray-400 flex-shrink-0"/>{lead.phone}</div>}
            {lead.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={14} className="text-gray-400 flex-shrink-0"/><span className="truncate">{lead.email}</span></div>}
            {lead.city && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={14} className="text-gray-400 flex-shrink-0"/>{lead.city}</div>}
            {lead.course_interested && <div className="flex items-center gap-2 text-sm text-gray-600"><BookOpen size={14} className="text-gray-400 flex-shrink-0"/>{lead.course_interested}</div>}
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Activity size={14} className="text-gray-400 flex-shrink-0 mt-0.5"/>
              <div>
                <span>Source: <span className="font-medium">{lead.source}</span></span>
                {(() => {
                  const extra = (notes || []).filter(n => n.content.startsWith('Also came from'))
                    .map(n => { const m = n.content.match(/Also came from (\w+)/); return m?.[1] })
                    .filter(Boolean)
                  return extra.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extra.map((src, i) => (
                        <span key={i} className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">+{src}</span>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600"><User size={14} className="text-gray-400 flex-shrink-0"/>Assigned: <span className="font-medium">{lead.assignee?.name || 'Unassigned'}</span></div>
            <div className="pt-2 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
              <select value={lead.status} onChange={e=>updateStatus(e.target.value)} disabled={savingStatus} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText size={15}/> Documents</h3>
              <label className="cursor-pointer text-xs text-saffron font-medium flex items-center gap-1" style={{color:'#4f46e5'}}>
                <Upload size={12}/> Upload <input type="file" className="hidden" onChange={uploadDoc}/>
              </label>
            </div>
            {docs.length === 0 ? <p className="text-xs text-gray-400 text-center py-3">No documents</p> : docs.map(doc=>(
              <div key={doc.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <FileText size={13} className="text-blue-400 flex-shrink-0"/>
                <a href={`http://localhost:5001${doc.file_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate flex-1">{doc.file_name}</a>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 rounded">{doc.document_type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: tabs */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
            {['timeline','calls','notes','tasks','communications','payments'].map(t => (
              <TabBtn key={t} active={tab===t} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</TabBtn>
            ))}
          </div>

          <div className="p-5 overflow-y-auto max-h-[600px]">
            {/* Timeline */}
            {tab === 'timeline' && <LeadTimeline lead={lead} notes={notes} comms={comms} payments={payments} calls={calls} />}

            {tab === 'calls' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-500">{calls.length} call{calls.length !== 1 ? 's' : ''} logged</p>
                  <button onClick={()=>setShowLogCall(true)} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"><Phone size={12}/> Log Call</button>
                </div>
                {calls.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No calls logged yet</p>}
                {calls.map(call => {
                  const colors = { OUTGOING:'#4f46e5', INCOMING:'#10B981', MISSED:'#E53E3E' }
                  const color = colors[call.call_type] || '#4f46e5'
                  const outLabels = { INTERESTED:'✅ Interested', NOT_INTERESTED:'❌ Not interested', CALLBACK:'📅 Callback', NO_ANSWER:'📵 No answer', CONNECTED:'✅ Connected' }
                  return (
                    <div key={call.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: color+'18'}}>
                        <Phone size={14} style={{color}}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{backgroundColor:color+'18',color}}>{call.call_type}</span>
                          {call.duration > 0 && <span className="text-xs text-gray-500">{call.duration} min</span>}
                          <span className="text-xs text-gray-600">{outLabels[call.outcome] || call.outcome}</span>
                        </div>
                        {call.notes && <p className="text-xs text-gray-500 mt-1">{call.notes}</p>}
                        <p className="text-xs text-gray-400 mt-1">{call.user?.name} · {new Date(call.called_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Notes */}
            {tab === 'notes' && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Write a note..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none resize-none"/>
                  <button onClick={addNote} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{backgroundColor:'#4f46e5'}}>Add Note</button>
                </div>
                {notes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No notes yet</p>}
                {notes.map(note => (
                  <div key={note.id} className="border border-gray-100 rounded-xl p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center text-white text-xs" style={{backgroundColor:'#0f172a'}}>{note.author?.name?.[0]}</div>
                      <p className="text-xs text-gray-500">{note.author?.name} · {new Date(note.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tasks */}
            {tab === 'tasks' && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <input value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})} placeholder="Task title..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/>
                  <div className="flex gap-2">
                    <input type="datetime-local" value={taskForm.due_at} onChange={e=>setTaskForm({...taskForm,due_at:e.target.value})} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/>
                    <button onClick={addTask} className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-1" style={{backgroundColor:'#4f46e5'}}><Plus size={14}/> Add</button>
                  </div>
                </div>
                {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No tasks yet</p>}
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border ${task.is_completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'border-gray-200'}`}>
                    <button onClick={()=>!task.is_completed && completeTask(task.id)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${task.is_completed ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-green-500'}`}>
                      {task.is_completed && <Check size={11} className="text-white"/>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                      <div className="flex items-center gap-1 mt-0.5"><Calendar size={11} className="text-gray-400"/><p className="text-xs text-gray-500">{new Date(task.due_at).toLocaleString()}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Communications */}
            {tab === 'communications' && (
              <div className="space-y-3">
                {comms.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No messages sent yet</p>}
                {comms.map(log => (
                  <div key={log.id} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: log.channel === 'EMAIL' ? '#DBEAFE' : '#DCFCE7'}}>
                      {log.channel === 'EMAIL' ? <Mail size={14} className="text-blue-500"/> : <MessageCircle size={14} className="text-green-500"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{log.channel}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${log.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{log.status}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{log.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(log.sent_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payments */}
            {tab === 'payments' && (
              <div className="space-y-3">
                {payments.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No payments yet</p>}
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">₹{p.amount.toLocaleString('en-IN')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_STATUS[p.status]}`}>{p.status}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 rounded">{p.payment_type}</span>
                      </div>
                      {p.due_date && <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(p.due_date).toLocaleDateString()}</p>}
                    </div>
                    {p.payment_link && <a href={p.payment_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Pay link</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
