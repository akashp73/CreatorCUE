import React, { useState } from 'react'
import { superApi } from '../../services/api'
import { Shield, Building2, BarChart2, LogOut, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

function SuperLogin({ onLogin }) {
  const [form, setForm] = useState({ email:'superadmin@educrm.com', password:'' })
  const [loading, setLoading] = useState(false)
  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try { const r = await superApi.login(form); localStorage.setItem('sa_token',r.data.token); onLogin() }
    catch { toast.error('Invalid credentials') }
    finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8"><div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{backgroundColor:'#F6AD2B'}}><Shield size={28} className="text-white"/></div><h1 className="text-2xl font-bold text-white">Super Admin</h1><p className="text-gray-400 text-sm mt-1">EduCRM Platform Console</p></div>
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <form onSubmit={submit} className="space-y-4">
            <div><label className="text-xs font-medium text-gray-400 mb-1 block">Email</label><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none"/></div>
            <div><label className="text-xs font-medium text-gray-400 mb-1 block">Password</label><input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="SuperAdmin@123" className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none"/></div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{backgroundColor:'#F6AD2B'}}>{loading?'Signing in...':'Sign In'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', subdomain:'', admin_email:'', admin_password:'', plan_name:'STARTER' })
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if(!form.name||!form.subdomain||!form.admin_email||!form.admin_password) return toast.error('All fields required')
    setSaving(true)
    try { await superApi.createInstitution(form); toast.success('Institution created!'); onCreated(); onClose() }
    catch(err) { toast.error(err.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }
  const inp = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none'
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700"><h2 className="font-semibold text-white">Create Institution</h2><button onClick={onClose}><X size={18} className="text-gray-400"/></button></div>
        <div className="p-6 space-y-3">
          {[['name','Institution Name'],['subdomain','Subdomain'],['admin_email','Admin Email'],['admin_password','Admin Password']].map(([k,l])=>(
            <div key={k}><label className="text-xs font-medium text-gray-400 mb-1 block">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} type={k.includes('password')?'password':'text'} className={inp}/></div>
          ))}
          <div><label className="text-xs font-medium text-gray-400 mb-1 block">Plan</label>
            <select value={form.plan_name} onChange={e=>setForm({...form,plan_name:e.target.value})} className={inp+' bg-gray-700'}>{['STARTER','PRO','ENTERPRISE'].map(p=><option key={p}>{p}</option>)}</select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-700">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{backgroundColor:'#F6AD2B'}}>{saving?'Creating...':'Create'}</button>
        </div>
      </div>
    </div>
  )
}

function InstitutionsPage() {
  const qc = useQueryClient()
  const { data: institutions = [] } = useQuery({ queryKey:['sa-insts'], queryFn:()=>superApi.listInstitutions().then(r=>r.data) })
  const [showCreate, setShowCreate] = useState(false)
  const toggle = async (id, is_active) => { try { await superApi.updateInstitution(id,{is_active:!is_active}); toast.success(is_active?'Suspended':'Activated'); qc.invalidateQueries(['sa-insts']) } catch { toast.error('Failed') } }
  return (
    <div className="space-y-5">
      {showCreate&&<CreateModal onClose={()=>setShowCreate(false)} onCreated={()=>qc.invalidateQueries(['sa-insts'])}/>}
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-white">Institutions</h1><p className="text-sm text-gray-400">{institutions.length} total</p></div>
        <button onClick={()=>setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{backgroundColor:'#F6AD2B'}}><Plus size={15}/> Create</button>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700 text-xs text-gray-400">
            <th className="text-left px-5 py-3 font-medium">Institution</th>
            <th className="text-left px-5 py-3 font-medium">Plan</th>
            <th className="text-left px-5 py-3 font-medium">Leads</th>
            <th className="text-left px-5 py-3 font-medium">Users</th>
            <th className="text-left px-5 py-3 font-medium">Status</th>
            <th className="text-left px-5 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>{institutions.map(inst=>(
            <tr key={inst.id} className="border-b border-gray-700 hover:bg-gray-750">
              <td className="px-5 py-3"><p className="font-medium text-white">{inst.name}</p><p className="text-xs text-gray-400">{inst.subdomain}</p></td>
              <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded" style={{backgroundColor:'#F6AD2B20',color:'#F6AD2B'}}>{inst.plan?.name||inst.plan_id}</span></td>
              <td className="px-5 py-3 text-gray-300">{inst.lead_count||inst._count?.leads||0}</td>
              <td className="px-5 py-3 text-gray-300">{inst.user_count||inst._count?.users||0}</td>
              <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inst.is_active?'bg-green-900 text-green-300':'bg-red-900 text-red-300'}`}>{inst.is_active?'Active':'Suspended'}</span></td>
              <td className="px-5 py-3"><button onClick={()=>toggle(inst.id,inst.is_active)} className={`text-xs px-2 py-1 rounded border ${inst.is_active?'border-red-700 text-red-400 hover:bg-red-900/30':'border-green-700 text-green-400 hover:bg-green-900/30'}`}>{inst.is_active?'Suspend':'Activate'}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

function RevenuePage() {
  const { data: rev } = useQuery({ queryKey:['sa-rev'], queryFn:()=>superApi.getRevenue().then(r=>r.data) })
  if(!rev) return null
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Revenue Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {[{label:'MRR',value:`₹${(rev.mrr||0).toLocaleString('en-IN')}`,color:'#38A169'},{label:'Active Subs',value:rev.active_subscriptions,color:'#F6AD2B'},{label:'Churned This Month',value:rev.churned_this_month,color:'#E53E3E'}].map(c=>(
          <div key={c.label} className="bg-gray-800 rounded-xl border border-gray-700 p-5"><p className="text-xs text-gray-400">{c.label}</p><p className="text-2xl font-bold mt-1" style={{color:c.color}}>{c.value}</p></div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700"><h3 className="text-sm font-semibold text-gray-300">Recent Subscriptions</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-gray-400 border-b border-gray-700"><th className="text-left px-5 py-3 font-medium">Institution</th><th className="text-left px-5 py-3 font-medium">Plan</th><th className="text-left px-5 py-3 font-medium">Amount</th><th className="text-left px-5 py-3 font-medium">Expires</th></tr></thead>
          <tbody>{(rev.recent_subscriptions||[]).map((s,i)=><tr key={i} className="border-b border-gray-700"><td className="px-5 py-3 text-white font-medium">{s.institution}</td><td className="px-5 py-3 text-gray-300">{s.plan}</td><td className="px-5 py-3 text-gray-300">₹{(s.amount||0).toLocaleString('en-IN')}</td><td className="px-5 py-3 text-xs text-gray-400">{s.expires_at?new Date(s.expires_at).toLocaleDateString():'—'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

const NAV = [{ key:'institutions', icon:Building2, label:'Institutions' }, { key:'revenue', icon:BarChart2, label:'Revenue' }]

export default function SuperAdminApp() {
  const [logged, setLogged] = useState(!!localStorage.getItem('sa_token'))
  const [page, setPage] = useState('institutions')
  const logout = () => { localStorage.removeItem('sa_token'); setLogged(false) }
  if(!logged) return <SuperLogin onLogin={()=>setLogged(true)}/>
  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <div className="w-56 flex flex-col border-r border-gray-700 bg-gray-800">
        <div className="px-5 py-5 border-b border-gray-700 flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor:'#F6AD2B'}}><Shield size={16} className="text-white"/></div><div><p className="text-white font-bold text-sm">EduCRM</p><p className="text-yellow-500 text-xs">Super Admin</p></div></div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({key,icon:Icon,label})=><button key={key} onClick={()=>setPage(key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left ${page===key?'text-white':'text-gray-400 hover:text-white hover:bg-gray-700'}`} style={page===key?{backgroundColor:'#F6AD2B'}:{}}><Icon size={16}/>{label}</button>)}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700"><button onClick={logout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400"><LogOut size={14}/> Logout</button></div>
      </div>
      <main className="flex-1 overflow-y-auto p-6">
        {page==='institutions' && <InstitutionsPage/>}
        {page==='revenue' && <RevenuePage/>}
      </main>
    </div>
  )
}
