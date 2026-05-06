import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Zap, Plus, ToggleLeft, ToggleRight, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowsApi } from '../services/api'
import Spinner from '../components/Spinner'

const TRIGGERS = [{ value:'lead.created',label:'Lead Created'},{value:'lead.score_changed',label:'Score Changed'},{value:'lead.status_changed',label:'Status Changed'},{value:'payment.completed',label:'Payment Completed'}]
const STEP_TYPES = [{ value:'send_email',label:'Send Email',color:'#3B82F6'},{value:'send_whatsapp',label:'Send WhatsApp',color:'#25D366'},{value:'add_task',label:'Add Task',color:'#F6AD2B'},{value:'change_status',label:'Change Status',color:'#8B5CF6'},{value:'assign_counsellor',label:'Assign Counsellor',color:'#EC4899'}]

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-800">New Workflow</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Workflow Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Facebook Lead Nurture" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Trigger Event</label>
            <select value={form.trigger_event} onChange={e=>setForm({...form,trigger_event:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white">
              {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Conditions (JSON)</label>
            <textarea value={JSON.stringify(form.trigger_conditions,null,2)} onChange={e=>{try{setForm({...form,trigger_conditions:JSON.parse(e.target.value)})}catch{}}} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none resize-none" placeholder='e.g. {"source":"FACEBOOK"}'/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Steps</label>
              <button onClick={addStep} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-white" style={{backgroundColor:'#1B2B4B'}}><Plus size={12}/> Add Step</button>
            </div>
            {form.steps.length === 0 && <p className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">No steps yet. Add one above.</p>}
            {form.steps.map((step,i) => {
              const def = STEP_TYPES.find(s=>s.value===step.type)||STEP_TYPES[0]
              return (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:def.color}}>{i+1}</div>
                    {i<form.steps.length-1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1"/>}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 mb-1">
                    <div className="flex items-center gap-2 mb-2">
                      <select value={step.type} onChange={e=>updateStep(i,{...step,type:e.target.value})} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none">
                        {STEP_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <button onClick={()=>removeStep(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">Delay:</span>
                      <input type="number" min="0" value={step.delay_minutes||0} onChange={e=>updateStep(i,{...step,delay_minutes:parseInt(e.target.value)||0})} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none text-center"/>
                      <span className="text-xs text-gray-400">minutes</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{backgroundColor:'#F6AD2B'}}>{saving?'Saving...':'Create Workflow'}</button>
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
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center"><Zap size={20} className="text-purple-600"/></div>
          <div><h1 className="text-xl font-bold text-gray-800">Automations</h1><p className="text-sm text-gray-500">{workflows.length} workflows · {workflows.filter(w=>w.is_active).length} active</p></div>
        </div>
        <button onClick={()=>setShowModal(true)} className="btn-gold text-sm"><Plus size={15}/> New Workflow</button>
      </div>
      {isLoading ? <Spinner/> : workflows.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Zap size={40} className="mx-auto mb-3 opacity-30"/><p>No workflows yet. Create your first automation!</p></div>
      ) : (
        <div className="space-y-3">
          {workflows.map(w => (
            <div key={w.id} className="card flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{w.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{w.is_active?'Active':'Paused'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Trigger: <span className="font-medium">{TRIGGERS.find(t=>t.value===w.trigger_event)?.label||w.trigger_event}</span> · {(w.steps||[]).length} steps</p>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {(w.steps||[]).map((step,i) => {
                    const def = STEP_TYPES.find(s=>s.value===step.type)
                    return (
                      <React.Fragment key={i}>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{backgroundColor:def?.color||'#6B7280'}}>{def?.label||step.type}</span>
                        {i<(w.steps||[]).length-1 && <span className="text-gray-300 text-xs">→</span>}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
              <button onClick={()=>toggle(w.id)} className="text-gray-400 hover:text-gray-700 flex-shrink-0 mt-1">
                {w.is_active ? <ToggleRight size={28} className="text-green-500"/> : <ToggleLeft size={28} className="text-gray-300"/>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
