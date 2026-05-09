import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Plus, Play, Mail, MessageCircle, Smartphone, X, ChevronRight, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { campaignsApi, emailTplApi, waTplApi } from '../services/api'
import Spinner from '../components/Spinner'

const STATUS_STYLE = { DRAFT:'bg-gray-100 text-gray-600', RUNNING:'bg-blue-100 text-blue-700', COMPLETED:'bg-green-100 text-green-700' }
const CH_ICON = { EMAIL:<Mail size={16} className="text-blue-500"/>, WHATSAPP:<MessageCircle size={16} className="text-green-500"/>, SMS:<Smartphone size={16} className="text-purple-500"/> }

function CreateModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name:'', channel:'EMAIL', template_id:'', target_filter:{} })
  const [audience, setAudience] = useState(null)
  const [launching, setLaunching] = useState(false)
  const { data: emailTpls = [] } = useQuery({ queryKey:['email-tpls'], queryFn:()=>emailTplApi.getAll().then(r=>r.data) })
  const { data: waTpls = [] } = useQuery({ queryKey:['wa-tpls'], queryFn:()=>waTplApi.getAll().then(r=>r.data) })
  const templates = form.channel === 'EMAIL' ? emailTpls : waTpls

  const previewAudience = async () => {
    const r = await campaignsApi.previewAudience(form.target_filter); setAudience(r.data)
  }

  const handleCreate = async (launch = false) => {
    setLaunching(true)
    try {
      const r = await campaignsApi.create(form)
      if (launch) await campaignsApi.launch(r.data.id)
      toast.success(launch ? 'Campaign launched!' : 'Campaign saved as draft')
      onCreated(); onClose()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLaunching(false) }
  }

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">New Campaign</h2>
            <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
          </div>
          <div className="flex gap-1">
            {['Details','Template','Audience','Review'].map((l,i) => (
              <div key={l} className="flex-1 h-1.5 rounded-full" style={{backgroundColor: i+1 <= step ? '#4f46e5' : '#E5E7EB'}}/>
            ))}
          </div>
        </div>
        <div className="p-6 min-h-[200px]">
          {step===1 && (
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Campaign Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. MBA Welcome Campaign" className={inp}/></div>
              <div><label className="text-xs font-medium text-gray-600 mb-2 block">Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {['EMAIL','WHATSAPP','SMS'].map(ch => (
                    <button key={ch} onClick={()=>setForm({...form,channel:ch,template_id:''})} className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${form.channel===ch ? 'text-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`} style={form.channel===ch?{borderColor:'#4f46e5'}:{}}>{CH_ICON[ch]} {ch}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step===2 && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Select Template</label>
              {templates.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No templates for {form.channel}. Create one in Settings first.</p> : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {templates.map(t => (
                    <button key={t.id} onClick={()=>setForm({...form,template_id:t.id})} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${form.template_id===t.id ? 'bg-indigo-50' : 'border-gray-200'}`} style={form.template_id===t.id?{borderColor:'#4f46e5'}:{}}>
                      <p className="text-sm font-medium text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{t.subject || t.message_body}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {step===3 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Audience Filters</p>
              {[['source','Source'],['status','Status'],['score_min','Min Score'],['score_max','Max Score']].map(([key,label]) => (
                <div key={key}><label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input value={form.target_filter[key]||''} onChange={e=>setForm({...form,target_filter:{...form.target_filter,[key]:e.target.value||undefined}})} placeholder={`Filter by ${label.toLowerCase()}`} className={inp}/>
                </div>
              ))}
              <button onClick={previewAudience} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 flex items-center justify-center gap-2"><Users size={14}/> Preview Audience</button>
              {audience && <div className="text-center py-2 rounded-xl text-sm font-semibold" style={{backgroundColor:'#4f46e520',color:'#4f46e5'}}>{audience.count} leads match</div>}
            </div>
          )}
          {step===4 && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-medium">{form.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Channel</span><span className="font-medium">{form.channel}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Template</span><span className="font-medium">{form.template_id ? 'Selected' : 'None'}</span></div>
                {audience && <div className="flex justify-between text-sm"><span className="text-gray-500">Estimated reach</span><span className="font-bold" style={{color:'#4f46e5'}}>{audience.count}</span></div>}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          {step > 1 && <button onClick={()=>setStep(s=>s-1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Back</button>}
          {step < 4 && <button onClick={()=>setStep(s=>s+1)} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1" style={{backgroundColor:'#0f172a'}}>Next <ChevronRight size={14}/></button>}
          {step===4 && (
            <>
              <button onClick={()=>handleCreate(false)} disabled={launching} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Save Draft</button>
              <button onClick={()=>handleCreate(true)} disabled={launching} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60" style={{backgroundColor:'#4f46e5'}}><Play size={13}/> {launching?'Launching...':'Launch Now'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const { data: campaigns = [], isLoading } = useQuery({ queryKey:['campaigns'], queryFn:()=>campaignsApi.getAll().then(r=>r.data) })

  const launch = async (id) => {
    try { await campaignsApi.launch(id); toast.success('Launched!'); qc.invalidateQueries(['campaigns']) }
    catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  return (
    <div className="space-y-5">
      {showModal && <CreateModal onClose={()=>setShowModal(false)} onCreated={()=>qc.invalidateQueries(['campaigns'])}/>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center"><Megaphone size={20} className="text-yellow-600"/></div>
          <div><h1 className="text-xl font-bold text-gray-800">Campaigns</h1><p className="text-sm text-gray-500">{campaigns.length} campaigns</p></div>
        </div>
        <button onClick={()=>setShowModal(true)} className="btn-gold text-sm"><Plus size={15}/> New Campaign</button>
      </div>
      {isLoading ? <Spinner/> : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Megaphone size={40} className="mx-auto mb-3 opacity-30"/><p>No campaigns yet. Launch your first one!</p></div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">{CH_ICON[c.channel]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[c.status]||'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{c.channel} · Sent: {c.sent_count} · {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              {c.status === 'DRAFT' && <button onClick={()=>launch(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{backgroundColor:'#4f46e5'}}><Play size={12}/> Launch</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
