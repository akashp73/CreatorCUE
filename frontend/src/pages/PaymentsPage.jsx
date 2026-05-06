import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { IndianRupee, Plus, Bell, Check, AlertTriangle, Clock, TrendingUp, Download, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentsApi, leadsApi } from '../services/api'
import Spinner from '../components/Spinner'

const STATUS_STYLE = { PENDING:'bg-yellow-100 text-yellow-700', PAID:'bg-green-100 text-green-700', FAILED:'bg-red-100 text-red-600', REFUNDED:'bg-gray-100 text-gray-600' }
const TYPES = ['REGISTRATION','TUITION','INSTALMENT']

function CreateModal({ onClose, onCreated }) {
  const [leadSearch, setLeadSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [form, setForm] = useState({ amount:'', payment_type:'REGISTRATION', due_date:'' })
  const [saving, setSaving] = useState(false)
  const [leads, setLeads] = useState([])

  const searchLeads = async q => {
    if(q.length<2) return setLeads([])
    const r = await leadsApi.getAll({search:q,limit:8}); setLeads(r.data?.leads||r.data?.data||[])
  }

  const save = async () => {
    if(!selectedLead||!form.amount) return toast.error('Select a lead and enter amount')
    setSaving(true)
    try { await paymentsApi.create({lead_id:selectedLead.id,...form,amount:parseInt(form.amount)}); toast.success('Payment created!'); onCreated(); onClose() }
    catch(err) { toast.error(err.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Create Payment</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Select Lead *</label>
            {selectedLead ? (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1"><p className="text-sm font-medium text-gray-800">{selectedLead.name}</p><p className="text-xs text-gray-500">{selectedLead.phone}</p></div>
                <button onClick={()=>{setSelectedLead(null);setLeads([])}} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={leadSearch} onChange={e=>{setLeadSearch(e.target.value);searchLeads(e.target.value)}} placeholder="Search lead by name or phone..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/>
                {leads.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {leads.map(l => <button key={l.id} type="button" onClick={()=>{setSelectedLead(l);setLeads([]);setLeadSearch('')}} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"><p className="font-medium text-gray-800">{l.name}</p><p className="text-xs text-gray-400">{l.phone}</p></button>)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Amount (₹) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="50000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Type</label><select value={form.payment_type} onChange={e=>setForm({...form,payment_type:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white">{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/></div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{backgroundColor:'#F6AD2B'}}>{saving?'Creating...':'Generate Link'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({ status:'', payment_type:'' })
  const { data, isLoading } = useQuery({ queryKey:['payments',filters], queryFn:()=>paymentsApi.getAll(filters).then(r=>r.data) })
  const payments = data?.payments || []
  const summary = data?.summary || {}

  const markPaid = async id => {
    try { await paymentsApi.updateStatus(id,{status:'PAID'}); toast.success('Marked as paid'); qc.invalidateQueries(['payments']) }
    catch { toast.error('Failed') }
  }
  const remind = async id => {
    try { await paymentsApi.remind(id,'WHATSAPP'); toast.success('Reminder sent!') }
    catch(err) { toast.error(err.response?.data?.error||'Failed') }
  }
  const exportCsv = async () => {
    try { const r = await paymentsApi.exportCsv(filters); const url=URL.createObjectURL(r.data); const a=document.createElement('a'); a.href=url; a.download='payments.csv'; a.click(); URL.revokeObjectURL(url) }
    catch { toast.error('Export failed') }
  }

  return (
    <div className="space-y-5">
      {showModal && <CreateModal onClose={()=>setShowModal(false)} onCreated={()=>qc.invalidateQueries(['payments'])}/>}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><IndianRupee size={20} className="text-green-600"/></div>
          <div><h1 className="text-xl font-bold text-gray-800">Payments</h1><p className="text-sm text-gray-500">{payments.length} records</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-outline text-sm"><Download size={14}/> Export</button>
          <button onClick={()=>setShowModal(true)} className="btn-gold text-sm"><Plus size={15}/> Create Payment</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{icon:TrendingUp,label:'Total Collected',value:`₹${(summary.total_collected||0).toLocaleString('en-IN')}`,color:'#38A169'},{icon:Clock,label:'Pending Amount',value:`₹${(summary.total_pending||0).toLocaleString('en-IN')}`,color:'#DD6B20'},{icon:AlertTriangle,label:'Overdue',value:summary.overdue_count||0,color:'#E53E3E'}].map(c => (
          <div key={c.label} className="card flex items-start gap-3 p-4">
            <div className="p-2 rounded-xl" style={{backgroundColor:c.color+'18'}}><c.icon size={18} style={{color:c.color}}/></div>
            <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-lg font-bold text-gray-800 mt-0.5">{c.value}</p></div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"><option value="">All Statuses</option>{['PENDING','PAID','FAILED','REFUNDED'].map(s=><option key={s}>{s}</option>)}</select>
        <select value={filters.payment_type} onChange={e=>setFilters({...filters,payment_type:e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"><option value="">All Types</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              <th className="text-left px-5 py-3 font-medium">Lead</th>
              <th className="text-left px-5 py-3 font-medium">Amount</th>
              <th className="text-left px-5 py-3 font-medium">Type</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Due Date</th>
              <th className="text-left px-5 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="py-8"><Spinner size={6}/></td></tr>}
              {!isLoading && payments.length===0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No payments found</td></tr>}
              {!isLoading && payments.map(p => {
                const isOverdue = p.status==='PENDING' && p.due_date && new Date(p.due_date)<new Date()
                return (
                  <tr key={p.id} className={`border-b border-gray-50 ${isOverdue?'bg-red-50':''}`}>
                    <td className="px-5 py-3"><Link to={`/leads/${p.lead?.id}`} className="font-medium text-gray-800 hover:underline">{p.lead?.name}</Link><p className="text-xs text-gray-400">{p.lead?.phone}</p></td>
                    <td className="px-5 py-3 font-semibold text-gray-800">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{p.payment_type}</span></td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status]||''}`}>{isOverdue?'⚠ OVERDUE':p.status}</span></td>
                    <td className="px-5 py-3 text-xs text-gray-500">{p.due_date?new Date(p.due_date).toLocaleDateString():'—'}</td>
                    <td className="px-5 py-3">
                      {p.status==='PENDING' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>remind(p.id)} className="flex items-center gap-1 px-2 py-1 rounded border border-green-200 text-green-700 text-xs hover:bg-green-50"><Bell size={11}/> Remind</button>
                          <button onClick={()=>markPaid(p.id)} className="flex items-center gap-1 px-2 py-1 rounded border border-blue-200 text-blue-700 text-xs hover:bg-blue-50"><Check size={11}/> Paid</button>
                        </div>
                      )}
                      {p.status==='PAID' && <span className="text-xs text-green-600">Paid {p.paid_at?new Date(p.paid_at).toLocaleDateString():''}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
