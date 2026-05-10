import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Zap, Plus, ToggleLeft, ToggleRight, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowsApi } from '../services/api'
import Spinner from '../components/Spinner'

const TRIGGERS = [{ value:'lead.created',label:'Lead Created'},{value:'lead.score_changed',label:'Score Changed'},{value:'lead.status_changed',label:'Status Changed'},{value:'payment.completed',label:'Payment Completed'}]
const STEP_TYPES = [{ value:'send_email',label:'Send Email',color:'#2563eb'},{value:'send_whatsapp',label:'Send WhatsApp',color:'#16a34a'},{value:'add_task',label:'Add Task',color:'#4f46e5'},{value:'change_status',label:'Change Status',color:'#7c3aed'},{value:'assign_counsellor',label:'Assign Counsellor',color:'#db2777'}]

function WorkflowModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', trigger_event:'lead.created', trigger_conditions:{}, steps:[] })
  const [saving, setSaving] = useState(false)

  const addStep = () => setForm({...form, steps:[...form.steps,{type:'send_whatsapp',delay_minutes:0}]})
  const updateStep = (i,s) => { const steps=[...form.steps]; steps[i]=s; setForm({...form,steps}) }
  const removeStep = (i) => setForm({...form,steps:form.steps.filter((_,idx)=>idx!==i)})

  const save = async () => {
    if(!form.name) return toast.error('Name required')
    setSaving(true)
    try { await workflowsApi.create(form); toast.success('Workflow created!'); onSaved(); onClose() }
    catch(err) { toast.error(err.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl" style={{ background: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Workflow</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Workflow Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Facebook Lead Nurture" className="input w-full"/></div>
          <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Trigger Event</label>
            <select value={form.trigger_event} onChange={e=>setForm({...form,trigger_event:e.target.value})} className="input w-full">
              {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Conditions (JSON)</label>
            <textarea value={JSON.stringify(form.trigger_conditions,null,2)} onChange={e=>{try{setForm({...form,trigger_conditions:JSON.parse(e.target.value)})}catch{}}} rows={2} className="input w-full font-mono resize-none text-xs" placeholder='e.g. {"source":"FACEBOOK"}'/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Steps</label>
              <button onClick={addStep} className="btn-primary flex items-center gap-1 text-xs px-2 py-1"><Plus size={12}/> Add Step</button>
            </div>
            {form.steps.length === 0 && (
              <p className="text-xs text-center py-4 rounded-xl" style={{ color: 'var(--text-muted)', border: '2px dashed #e5e7eb' }}>No steps yet. Add one above.</p>
            )}
            {form.steps.map((step,i) => {
              const def = STEP_TYPES.find(s=>s.value===step.type)||STEP_TYPES[0]
              return (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background: def.color}}>{i+1}</div>
                    {i<form.steps.length-1 && <div className="w-0.5 flex-1 mt-1" style={{ background: '#e5e7eb' }}/>}
                  </div>
                  <div className="flex-1 rounded-xl p-3 mb-1" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <select value={step.type} onChange={e=>updateStep(i,{...step,type:e.target.value})} className="input flex-1 text-xs">
                        {STEP_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <button onClick={()=>removeStep(i)} style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><Trash2 size={13}/></button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Delay:</span>
                      <input type="number" min="0" value={step.delay_minutes||0} onChange={e=>updateStep(i,{...step,delay_minutes:parseInt(e.target.value)||0})} className="input w-16 text-xs text-center"/>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>minutes</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onClose} className="btn-outline flex-1 py-2">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2 justify-center" style={{ opacity: saving ? 0.6 : 1 }}>{saving?'Saving...':'Create Workflow'}</button>
        </div>
      </div>
    </div>
  )
}

export default function AutomationsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const { data: workflows = [], isLoading } = useQuery({ queryKey:['workflows'], queryFn:()=>workflowsApi.getAll().then(r=>r.data) })

  const toggle = async (id) => {
    try { const r = await workflowsApi.toggle(id); toast.success(r.data.is_active?'Activated':'Paused'); qc.invalidateQueries(['workflows']) }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-5">
      {showModal && <WorkflowModal onClose={()=>setShowModal(false)} onSaved={()=>qc.invalidateQueries(['workflows'])}/>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}><Zap size={20} style={{ color: '#7c3aed' }}/></div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Automations</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{workflows.length} workflows · {workflows.filter(w=>w.is_active).length} active</p>
          </div>
        </div>
        <button onClick={()=>setShowModal(true)} className="btn-primary text-sm"><Plus size={15}/> New Workflow</button>
      </div>
      {isLoading ? <Spinner/> : workflows.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}><Zap size={40} className="mx-auto mb-3 opacity-30"/><p>No workflows yet. Create your first automation!</p></div>
      ) : (
        <div className="space-y-3">
          {workflows.map(w => (
            <div key={w.id} className="card flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{w.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={w.is_active
                      ? { background: 'rgba(5,150,105,0.1)', color: '#059669' }
                      : { background: '#f3f4f6', color: 'var(--text-muted)' }}>
                    {w.is_active?'Active':'Paused'}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Trigger: <span className="font-medium">{TRIGGERS.find(t=>t.value===w.trigger_event)?.label||w.trigger_event}</span> · {(w.steps||[]).length} steps</p>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {(w.steps||[]).map((step,i) => {
                    const def = STEP_TYPES.find(s=>s.value===step.type)
                    return (
                      <React.Fragment key={i}>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{background:def?.color||'#6b7280'}}>{def?.label||step.type}</span>
                        {i<(w.steps||[]).length-1 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→</span>}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
              <button onClick={()=>toggle(w.id)} className="flex-shrink-0 mt-1">
                {w.is_active ? <ToggleRight size={28} style={{ color: '#059669' }}/> : <ToggleLeft size={28} style={{ color: '#d1d5db' }}/>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
