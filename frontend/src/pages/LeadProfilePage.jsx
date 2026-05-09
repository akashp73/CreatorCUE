import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, BookOpen, Activity, User, Calendar, Plus, Check, Flame, Thermometer, Snowflake, MessageCircle, Send, FileText, Upload, Trash2, IndianRupee, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi, notesApi, tasksApi, commsApi, emailTplApi, waTplApi, paymentsApi } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const STATUSES = ['NEW','CONTACTED','APPLIED','QUALIFIED','ENROLLED','LOST']
const PAY_STATUS = { PENDING:'bg-yellow-100 text-yellow-700', PAID:'bg-green-100 text-green-700', FAILED:'bg-red-100 text-red-600', REFUNDED:'bg-gray-100 text-gray-600' }

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

  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.getById(id).then(r => r.data) })
  const { data: tasks = [] } = useQuery({ queryKey: ['lead-tasks', id], queryFn: () => leadsApi.getTasks(id).then(r => r.data) })
  const { data: notes = [] } = useQuery({ queryKey: ['lead-notes', id], queryFn: () => leadsApi.getNotes(id).then(r => r.data) })
  const { data: comms = [] } = useQuery({ queryKey: ['lead-comms', id], queryFn: () => leadsApi.getComms(id).then(r => r.data) })
  const { data: payments = [] } = useQuery({ queryKey: ['lead-payments', id], queryFn: () => leadsApi.getPayments(id).then(r => r.data) })
  const { data: docs = [] } = useQuery({ queryKey: ['lead-docs', id], queryFn: () => leadsApi.getDocs(id).then(r => r.data) })
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
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate('/leads')} className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-600"><ArrowLeft size={16}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{lead.name}</h1>
          <p className="text-xs text-gray-400">Lead ID: {lead.id.slice(0,8)}…</p>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${lead.phone}`} className="btn-outline text-xs px-3 py-1.5"><Phone size={13}/> Call</a>
          {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{backgroundColor:'#25D366'}}><MessageCircle size={13}/> WhatsApp</a>}
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
            <div className="flex items-center gap-2 text-sm text-gray-600"><Activity size={14} className="text-gray-400 flex-shrink-0"/>Source: <span className="font-medium">{lead.source}</span></div>
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
            {['timeline','notes','tasks','communications','payments'].map(t => (
              <TabBtn key={t} active={tab===t} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</TabBtn>
            ))}
          </div>

          <div className="p-5 overflow-y-auto max-h-[600px]">
            {/* Timeline */}
            {tab === 'timeline' && (
              <div className="space-y-3">
                {actLog.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>}
                {actLog.map(log => (
                  <div key={log.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{backgroundColor: log.points_added > 0 ? '#DCFCE7' : '#FEE2E2'}}>
                      <Activity size={13} style={{color: log.points_added > 0 ? '#16A34A' : '#DC2626'}}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">{log.activity_type.replace(/_/g,' ')}</p>
                        <span className={`text-xs font-semibold ${log.points_added >= 0 ? 'text-green-600' : 'text-red-500'}`}>{log.points_added >= 0 ? '+' : ''}{log.points_added}</span>
                      </div>
                      <p className="text-xs text-gray-500">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
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
