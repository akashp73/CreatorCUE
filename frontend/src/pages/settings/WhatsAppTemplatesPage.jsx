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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{isEdit?'Edit':'New'} WhatsApp Template</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Template Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/></div>
          <div>
            <div className="flex items-center justify-between mb-1"><label className="text-xs font-medium text-gray-600">Message Body</label><span className="text-xs text-gray-400 font-mono">{form.message_body.length}/1024</span></div>
            <textarea value={form.message_body} onChange={e=>setForm({...form,message_body:e.target.value})} rows={5} maxLength={1024} placeholder="Hi {first_name}! ..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none resize-none"/>
            {detected.length>0 && <div className="flex gap-1 mt-1 flex-wrap">{detected.map(v=><span key={v} className="text-xs px-1.5 py-0.5 rounded font-mono bg-yellow-100 text-yellow-800">{`{${v}}`}</span>)}</div>}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{backgroundColor:'#25D366'}}>{saving?'Saving...':isEdit?'Update':'Create'}</button>
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
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><MessageCircle size={20} className="text-green-600"/></div><h1 className="text-xl font-bold text-gray-800">WhatsApp Templates</h1></div>
        <button onClick={()=>setModal({})} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{backgroundColor:'#25D366'}}><Plus size={15}/> New</button>
      </div>
      {isLoading?<Spinner/>:templates.length===0?<div className="text-center py-12 text-gray-400"><MessageCircle size={36} className="mx-auto mb-3 opacity-30"/><p>No templates yet.</p></div>:(
        <div className="space-y-3">{templates.map(t=>(
          <div key={t.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><MessageCircle size={16} className="text-green-600"/></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  {t.variables?.length>0&&<div className="flex gap-1 mt-1 flex-wrap">{t.variables.map(v=><span key={v} className="text-xs px-1.5 py-0.5 rounded font-mono bg-yellow-100 text-yellow-800">{`{${v}}`}</span>)}</div>}
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{t.message_body}</p>
                </div>
              </div>
              <button onClick={()=>setModal(t)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0"><Edit3 size={14}/></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}
