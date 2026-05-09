import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Plus, Edit3, Trash2, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { emailTplApi } from '../../services/api'
import Spinner from '../../components/Spinner'

const VARS = ['{first_name}','{course_name}','{phone}','{city}']

function TemplateModal({ tpl, onClose, onSaved }) {
  const isEdit = !!tpl?.id
  const [form, setForm] = useState({ name:tpl?.name||'', subject:tpl?.subject||'', html_body:tpl?.html_body||'<p>Hello {first_name},</p>' })
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if(!form.name||!form.subject||!form.html_body) return toast.error('All fields required')
    setSaving(true)
    try { isEdit ? await emailTplApi.update(tpl.id,form) : await emailTplApi.create(form); toast.success(isEdit?'Updated!':'Created!'); onSaved(); onClose() }
    catch(err) { toast.error(err.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-800">{isEdit?'Edit':'New'} Email Template</h2>
          <div className="flex items-center gap-2">
            <button onClick={()=>setPreview(!preview)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"><Eye size={14}/> {preview?'Edit':'Preview'}</button>
            <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {preview ? (
            <div>
              <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm"><span className="text-gray-500">Subject: </span><span className="font-medium">{form.subject}</span></div>
              <div className="border border-gray-200 rounded-lg p-4 prose max-w-none" dangerouslySetInnerHTML={{__html:form.html_body}}/>
            </div>
          ) : (
            <>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Template Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Welcome Email" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/></div>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Subject Line</label><input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="e.g. Welcome to {course_name}!" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/></div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">HTML Body</label>
                  <div className="flex gap-1">{VARS.map(v=><button key={v} onClick={()=>setForm({...form,html_body:form.html_body+v})} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 font-mono">{v}</button>)}</div>
                </div>
                <textarea value={form.html_body} onChange={e=>setForm({...form,html_body:e.target.value})} rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none resize-none"/>
              </div>
            </>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{backgroundColor:'#4f46e5'}}>{saving?'Saving...':isEdit?'Update':'Create'}</button>
        </div>
      </div>
    </div>
  )
}

export default function EmailTemplatesPage() {
  const qc = useQueryClient()
  const { data: templates = [], isLoading } = useQuery({ queryKey:['email-tpls'], queryFn:()=>emailTplApi.getAll().then(r=>r.data) })
  const [modal, setModal] = useState(null)
  const del = async id => { if(!window.confirm('Delete?')) return; try { await emailTplApi.delete(id); qc.invalidateQueries(['email-tpls']); toast.success('Deleted') } catch { toast.error('Failed') } }
  return (
    <div className="space-y-5 max-w-3xl">
      {modal !== null && <TemplateModal tpl={modal||undefined} onClose={()=>setModal(null)} onSaved={()=>qc.invalidateQueries(['email-tpls'])}/>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center"><Mail size={20} className="text-blue-600"/></div><h1 className="text-xl font-bold text-gray-800">Email Templates</h1></div>
        <button onClick={()=>setModal({})} className="btn-gold text-sm"><Plus size={15}/> New Template</button>
      </div>
      {isLoading ? <Spinner/> : templates.length===0 ? <div className="text-center py-12 text-gray-400"><Mail size={36} className="mx-auto mb-3 opacity-30"/><p>No templates yet.</p></div> : (
        <div className="space-y-3">{templates.map(t=>(
          <div key={t.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Mail size={18} className="text-blue-500"/></div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800">{t.name}</p><p className="text-xs text-gray-400 truncate mt-0.5">Subject: {t.subject}</p></div>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>setModal(t)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Edit3 size={14}/></button>
              <button onClick={()=>del(t.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}
