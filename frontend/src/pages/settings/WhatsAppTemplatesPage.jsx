import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Plus, Edit3, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { waTplApi } from '../../services/api'
import Spinner from '../../components/Spinner'

function Modal({ tpl, onClose, onSaved }) {
  const isEdit = !!tpl?.id
  const [form, setForm] = useState({ name:tpl?.name||'', message_body:tpl?.message_body||'' })
  const [saving, setSaving] = useState(false)
  const detected = [...new Set((form.message_body.match(/\{[\w_]+\}/g)||[]).map(v=>v.slice(1,-1)))]
  const save = async () => {
    if(!form.name||!form.message_body) return toast.error('All fields required')
    setSaving(true)
    try { const payload={...form,variables:detected}; isEdit?await waTplApi.update(tpl.id,payload):await waTplApi.create(payload); toast.success(isEdit?'Updated!':'Created!'); onSaved(); onClose() }
    catch(err) { toast.error(err.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-lg rounded-2xl" style={{ background: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{isEdit?'Edit':'New'} WhatsApp Template</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Template Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full"/></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Message Body</label>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{form.message_body.length}/1024</span>
            </div>
            <textarea value={form.message_body} onChange={e=>setForm({...form,message_body:e.target.value})} rows={5} maxLength={1024} placeholder="Hi {first_name}! ..." className="input w-full resize-none"/>
            {detected.length>0 && <div className="flex gap-1 mt-1 flex-wrap">{detected.map(v=><span key={v} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(234,179,8,0.1)', color: '#92400e' }}>{`{${v}}`}</span>)}</div>}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onClose} className="btn-outline flex-1 py-2">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2 justify-center" style={{ opacity: saving ? 0.6 : 1 }}>{saving?'Saving...':isEdit?'Update':'Create'}</button>
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppTemplatesPage() {
  const qc = useQueryClient()
  const { data: templates = [], isLoading } = useQuery({ queryKey:['wa-tpls'], queryFn:()=>waTplApi.getAll().then(r=>r.data) })
  const [modal, setModal] = useState(null)
  return (
    <div className="space-y-5 max-w-3xl">
      {modal!==null&&<Modal tpl={modal||undefined} onClose={()=>setModal(null)} onSaved={()=>qc.invalidateQueries(['wa-tpls'])}/>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.1)' }}><MessageCircle size={20} style={{ color: '#16a34a' }}/></div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>WhatsApp Templates</h1>
        </div>
        <button onClick={()=>setModal({})} className="btn-primary text-sm"><Plus size={15}/> New</button>
      </div>
      {isLoading?<Spinner/>:templates.length===0?(
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}><MessageCircle size={36} className="mx-auto mb-3 opacity-30"/><p>No templates yet.</p></div>
      ):(
        <div className="space-y-3">{templates.map(t=>(
          <div key={t.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(37,211,102,0.08)' }}><MessageCircle size={16} style={{ color: '#16a34a' }}/></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                  {t.variables?.length>0&&<div className="flex gap-1 mt-1 flex-wrap">{t.variables.map(v=><span key={v} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(234,179,8,0.1)', color: '#92400e' }}>{`{${v}}`}</span>)}</div>}
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{t.message_body}</p>
                </div>
              </div>
              <button onClick={()=>setModal(t)} className="p-2 rounded-lg transition-colors flex-shrink-0" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Edit3 size={14}/></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}
