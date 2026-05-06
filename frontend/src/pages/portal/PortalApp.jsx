import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { portalApi } from '../../services/api'
import { GraduationCap, Loader2, IndianRupee, FileText, Upload, LogOut, Check } from 'lucide-react'
import toast from 'react-hot-toast'

function PortalLogin({ onLogin }) {
  const [form, setForm] = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try { const r = await portalApi.login(form); localStorage.setItem('portal_token',r.data.token); localStorage.setItem('portal_inst',JSON.stringify(r.data.institution)); onLogin() }
    catch { toast.error('Invalid credentials') }
    finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8"><div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{backgroundColor:'#1B2B4B'}}><GraduationCap size={28} className="text-white"/></div><h1 className="text-2xl font-bold text-gray-800">Applicant Portal</h1><p className="text-gray-500 text-sm mt-1">Track your application status</p></div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={submit} className="space-y-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Email</label><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none"/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Password</label><input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none"/></div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{backgroundColor:'#F6AD2B'}}>
              {loading&&<Loader2 size={14} className="animate-spin"/>}{loading?'Signing in...':'Sign In'}
            </button>
          </form>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500"><p>Demo: <span className="font-mono">arjun@test.com</span> — set password via portal invite</p></div>
        </div>
      </div>
    </div>
  )
}

function PortalDashboard({ onLogout }) {
  const token = localStorage.getItem('portal_token')
  const { data: app } = useQuery({ queryKey:['portal-app'], queryFn:()=>portalApi.getMyApplication().then(r=>r.data) })
  const { data: payments=[] } = useQuery({ queryKey:['portal-payments'], queryFn:()=>portalApi.getMyPayments().then(r=>r.data) })
  const { data: docs=[] } = useQuery({ queryKey:['portal-docs'], queryFn:()=>portalApi.getMyDocuments().then(r=>r.data) })

  const uploadDoc = async e => {
    const file=e.target.files[0]; if(!file) return
    try { await portalApi.uploadDoc(file,'OTHER'); toast.success('Uploaded!') }
    catch { toast.error('Upload failed') }
    e.target.value=''
  }

  const STATUS_BG = { NEW:'#DBEAFE', CONTACTED:'#FEF9C3', APPLIED:'#EDE9FE', QUALIFIED:'#FEF3C7', ENROLLED:'#DCFCE7', LOST:'#FEE2E2' }
  const STATUS_TEXT = { NEW:'#1D4ED8', CONTACTED:'#92400E', APPLIED:'#5B21B6', QUALIFIED:'#B45309', ENROLLED:'#166534', LOST:'#991B1B' }
  const status = app?.status || 'NEW'

  const milestones = [
    {label:'Application Received',done:true},
    {label:'Documents Submitted',done:docs.length>0},
    {label:'Payment Received',done:payments.some(p=>p.status==='PAID')},
    {label:'Enrolled',done:status==='ENROLLED'},
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <GraduationCap size={20} style={{color:'#1B2B4B'}}/>
        <p className="font-semibold text-gray-800 text-sm flex-1">{app?.name || 'Applicant Portal'}</p>
        <button onClick={onLogout} className="text-gray-400 hover:text-red-500"><LogOut size={16}/></button>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="rounded-2xl p-6" style={{backgroundColor:STATUS_BG[status]||'#DBEAFE'}}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{color:STATUS_TEXT[status]||'#1D4ED8'}}>Application Status</p>
          <p className="text-2xl font-bold mt-1" style={{color:STATUS_TEXT[status]||'#1D4ED8'}}>{status}</p>
          {app?.course_interested&&<p className="text-sm mt-1 opacity-80" style={{color:STATUS_TEXT[status]}}>Course: {app.course_interested}</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Progress</p>
          <div className="space-y-3">{milestones.map((m,i)=>(
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${m.done?'bg-green-500':'bg-gray-200'}`}><Check size={12} className={m.done?'text-white':'text-gray-400'}/></div>
              <p className={`text-sm ${m.done?'font-medium text-gray-800':'text-gray-400'}`}>{m.label}</p>
            </div>
          ))}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100"><IndianRupee size={16} className="text-green-600"/><h3 className="text-sm font-semibold text-gray-700">Payments</h3></div>
          {payments.length===0?<p className="text-sm text-gray-400 text-center py-6">No payments yet</p>:payments.map(p=>(
            <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <div><p className="text-sm font-medium text-gray-800">{p.payment_type}</p><p className="text-xs text-gray-400">{p.due_date?`Due: ${new Date(p.due_date).toLocaleDateString()}`:''}</p></div>
              <div className="flex items-center gap-3"><span className="font-semibold text-gray-800">₹{p.amount.toLocaleString('en-IN')}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status==='PAID'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2"><FileText size={16} className="text-blue-500"/><h3 className="text-sm font-semibold text-gray-700">Documents</h3></div>
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{backgroundColor:'#1B2B4B'}}><Upload size={12}/> Upload<input type="file" className="hidden" onChange={uploadDoc}/></label>
          </div>
          {docs.length===0?<p className="text-sm text-gray-400 text-center py-6">No documents uploaded</p>:docs.map(d=>(
            <div key={d.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
              <FileText size={14} className="text-blue-400 flex-shrink-0"/>
              <p className="text-sm text-gray-800 flex-1 truncate">{d.file_name}</p>
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 rounded">{d.document_type}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function PortalApp() {
  const [logged, setLogged] = useState(!!localStorage.getItem('portal_token'))
  const logout = () => { localStorage.removeItem('portal_token'); localStorage.removeItem('portal_inst'); setLogged(false) }
  return logged ? <PortalDashboard onLogout={logout}/> : <PortalLogin onLogin={()=>setLogged(true)}/>
}
