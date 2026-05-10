import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Plus, Play, Mail, MessageCircle, Smartphone, X, ChevronRight, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { campaignsApi, emailTplApi, waTplApi } from '../services/api'
import Spinner from '../components/Spinner'

const STATUS_STYLE = {
  DRAFT: { background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)' },
  RUNNING: { background: 'rgba(59,130,246,0.1)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.2)' },
  COMPLETED: { background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' },
}
const CH_ICON = {
  EMAIL: <Mail size={16} style={{ color: '#3b82f6' }} />,
  WHATSAPP: <MessageCircle size={16} style={{ color: '#25D366' }} />,
  SMS: <Smartphone size={16} style={{ color: '#7c3aed' }} />,
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Campaign</h2>
            <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }}/></button>
          </div>
          <div className="flex gap-1">
            {['Details','Template','Audience','Review'].map((l,i) => (
              <div key={l} className="flex-1 h-1.5 rounded-full" style={{ background: i+1 <= step ? '#111827' : 'var(--border)' }}/>
            ))}
          </div>
        </div>
        <div className="p-6 min-h-[200px]">
          {step===1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Campaign Name *</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. MBA Welcome Campaign" className="input"/>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {['EMAIL','WHATSAPP','SMS'].map(ch => (
                    <button key={ch} onClick={()=>setForm({...form,channel:ch,template_id:''})}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                      style={form.channel===ch
                        ? { border: '2px solid #111827', color: 'var(--text-primary)', background: 'var(--surface-hover)' }
                        : { border: '2px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }
                      }>
                      {CH_ICON[ch]} {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step===2 && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Select Template</label>
              {templates.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No templates for {form.channel}. Create one in Settings first.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {templates.map(t => (
                    <button key={t.id} onClick={()=>setForm({...form,template_id:t.id})}
                      className="w-full text-left p-3 rounded-xl transition-all"
                      style={form.template_id===t.id
                        ? { border: '2px solid #111827', background: 'var(--surface-hover)' }
                        : { border: '2px solid var(--border)', background: 'var(--surface)' }
                      }>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.subject || t.message_body}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {step===3 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Audience Filters</p>
              {[['source','Source'],['status','Status'],['score_min','Min Score'],['score_max','Max Score']].map(([key,label]) => (
                <div key={key}>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input value={form.target_filter[key]||''} onChange={e=>setForm({...form,target_filter:{...form.target_filter,[key]:e.target.value||undefined}})} placeholder={`Filter by ${label.toLowerCase()}`} className="input"/>
                </div>
              ))}
              <button onClick={previewAudience} className="w-full py-2 rounded-xl text-sm flex items-center justify-center gap-2" style={{ border: '2px dashed var(--border)', color: 'var(--text-secondary)' }}>
                <Users size={14}/> Preview Audience
              </button>
              {audience && (
                <div className="text-center py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>
                  {audience.count} leads match
                </div>
              )}
            </div>
          )}
          {step===4 && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Name</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{form.name}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Channel</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{form.channel}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Template</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{form.template_id ? 'Selected' : 'None'}</span></div>
                {audience && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Estimated reach</span>
                    <span className="font-bold" style={{ color: '#7c3aed' }}>{audience.count}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          {step > 1 && <button onClick={()=>setStep(s=>s-1)} className="btn-outline px-4 py-2">Back</button>}
          {step < 4 && (
            <button onClick={()=>setStep(s=>s+1)} className="btn-primary flex-1 py-2 justify-center">
              Next <ChevronRight size={14}/>
            </button>
          )}
          {step===4 && (
            <>
              <button onClick={()=>handleCreate(false)} disabled={launching} className="btn-outline flex-1 py-2 justify-center">Save Draft</button>
              <button onClick={()=>handleCreate(true)} disabled={launching} className="btn-primary flex-1 py-2 justify-center">
                <Play size={13}/> {launching?'Launching...':'Launch Now'}
              </button>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Megaphone size={20} style={{ color: '#f59e0b' }}/>
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Campaigns</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{campaigns.length} campaigns</p>
          </div>
        </div>
        <button onClick={()=>setShowModal(true)} className="btn-primary text-sm"><Plus size={15}/> New Campaign</button>
      </div>

      {isLoading ? <Spinner/> : campaigns.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <Megaphone size={40} className="mx-auto mb-3 opacity-30"/>
          <p>No campaigns yet. Launch your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                {CH_ICON[c.channel]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={STATUS_STYLE[c.status] || STATUS_STYLE.DRAFT}>{c.status}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.channel} · Sent: {c.sent_count} · {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              {c.status === 'DRAFT' && (
                <button onClick={()=>launch(c.id)} className="btn-primary text-xs px-3 py-1.5">
                  <Play size={12}/> Launch
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
