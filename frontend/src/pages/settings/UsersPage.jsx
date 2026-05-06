import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Edit3, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { teamApi } from '../../services/api'
import Spinner from '../../components/Spinner'

const ROLE_BADGE = { ADMIN:'bg-purple-100 text-purple-700', MANAGER:'bg-blue-100 text-blue-700', COUNSELLOR:'bg-green-100 text-green-700' }

function Modal({ user, onClose, onSaved }) {
  const isEdit = !!user?.id
  const [form, setForm] = useState({ name:user?.name||'', email:user?.email||'', password:'', role:user?.role||'COUNSELLOR', is_active:user?.is_active!==false })
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if(!form.name||(!isEdit&&(!form.email||!form.password))) return toast.error('Fill required fields')
    setSaving(true)
    try { isEdit?await teamApi.update(user.id,form):await teamApi.create(form); toast.success(isEdit?'Updated!':'Added!'); onSaved(); onClose() }
    catch(err) { toast.error(err.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }
  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{isEdit?'Edit Member':'Add Team Member'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Full Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp}/></div>
          {!isEdit&&<div><label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={inp}/></div>}
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">{isEdit?'New Password (leave blank to keep)':'Password *'}</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className={inp}/></div>
          <div><label className="text-xs font-medium text-gray-600 mb-2 block">Role *</label>
            <div className="grid grid-cols-3 gap-2">{['ADMIN','MANAGER','COUNSELLOR'].map(r=><button key={r} onClick={()=>setForm({...form,role:r})} className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${form.role===r?'text-white':'border-gray-200 text-gray-500'}`} style={form.role===r?{backgroundColor:r==='ADMIN'?'#8B5CF6':r==='MANAGER'?'#3182CE':'#38A169',borderColor:'transparent'}:{}}>{r}</button>)}</div>
          </div>
          {isEdit&&<label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/><span className="text-sm text-gray-700">Active account</span></label>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{backgroundColor:'#F6AD2B'}}>{saving?'Saving...':isEdit?'Update':'Add'}</button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({ queryKey:['team'], queryFn:()=>teamApi.getAll().then(r=>r.data) })
  const [modal, setModal] = useState(null)
  return (
    <div className="space-y-5 max-w-3xl">
      {modal!==null&&<Modal user={modal||undefined} onClose={()=>setModal(null)} onSaved={()=>qc.invalidateQueries(['team'])}/>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center"><Users size={20} className="text-blue-600"/></div><div><h1 className="text-xl font-bold text-gray-800">Team Members</h1><p className="text-sm text-gray-500">{users.filter(u=>u.is_active).length} active</p></div></div>
        <button onClick={()=>setModal({})} className="btn-gold text-sm"><Plus size={15}/> Add Member</button>
      </div>
      {isLoading?<Spinner/>:(
        <div className="space-y-3">{users.map(u=>(
          <div key={u.id} className={`card flex items-center gap-4 ${!u.is_active?'opacity-60':''}`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm" style={{backgroundColor:u.role==='ADMIN'?'#8B5CF6':u.role==='MANAGER'?'#3182CE':'#38A169'}}>{u.name?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{u.name}</p>{!u.is_active&&<span className="text-xs bg-red-100 text-red-600 px-1.5 rounded">Inactive</span>}</div>
              <p className="text-xs text-gray-400">{u.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${ROLE_BADGE[u.role]||''}`}>{u.role}</span>
            </div>
            <button onClick={()=>setModal(u)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Edit3 size={14}/></button>
          </div>
        ))}</div>
      )}
    </div>
  )
}
