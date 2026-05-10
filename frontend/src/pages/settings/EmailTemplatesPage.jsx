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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl" style={{ background: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{isEdit?'Edit':'New'} Email Template</h2>
          <div className="flex items-center gap-2">
            <button onClick={()=>setPreview(!preview)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-outline"><Eye size={14}/> {preview?'Edit':'Preview'}</button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {preview ? (
            <div>
              <div className="mb-3 p-3 rounded-lg text-sm" style={{ background: '#f9fafb' }}><span style={{ color: 'var(--text-secondary)' }}>Subject: </span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{form.subject}</span></div>
              <div className="rounded-lg p-4 prose max-w-none" style={{ border: '1px solid #e5e7eb' }} dangerouslySetInnerHTML={{__html:form.html_body}}/>
            </div>
          ) : (
            <>
              <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Template Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Welcome Email" className="input w-full"/></div>
              <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Subject Line</label><input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="e.g. Welcome to {course_name}!" className="input w-full"/></div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>HTML Body</label>
                  <div className="flex gap-1">{VARS.map(v=><button key={v} onClick={()=>setForm({...form,html_body:form.html_body+v})} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#f3f4f6', color: 'var(--text-secondary)' }}>{v}</button>)}</div>
                </div>
                <textarea value={form.html_body} onChange={e=>setForm({...form,html_body:e.target.value})} rows={10} className="input w-full font-mono resize-none"/>
              </div>
            </>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onClose} className="btn-outline flex-1 py-2">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2 justify-center" style={{ opacity: saving ? 0.6 : 1 }}>{saving?'Saving...':isEdit?'Update':'Create'}</button>
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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.1)' }}><Mail size={20} style={{ color: '#2563eb' }}/></div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Email Templates</h1>
        </div>
        <button onClick={()=>setModal({})} className="btn-primary text-sm"><Plus size={15}/> New Template</button>
      </div>
      {isLoading ? <Spinner/> : templates.length===0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}><Mail size={36} className="mx-auto mb-3 opacity-30"/><p>No templates yet.</p></div>
      ) : (
        <div className="space-y-3">{templates.map(t=>(
          <div key={t.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(37,99,235,0.08)' }}><Mail size={18} style={{ color: '#2563eb' }}/></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>Subject: {t.subject}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>setModal(t)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Edit3 size={14}/></button>
              <button onClick={()=>del(t.id)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}
