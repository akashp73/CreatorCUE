import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { IndianRupee, Plus, Bell, Check, AlertTriangle, Clock, TrendingUp, Download, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentsApi, leadsApi } from '../services/api'
import Spinner from '../components/Spinner'

const STATUS_STYLE = {
  PENDING: { background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' },
  PAID: { background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' },
  FAILED: { background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' },
  REFUNDED: { background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)' },
}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Create Payment</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Select Lead *</label>
            {selectedLead ? (
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="flex-1"><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedLead.name}</p><p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selectedLead.phone}</p></div>
                <button onClick={()=>{setSelectedLead(null);setLeads([])}} style={{ color: 'var(--text-muted)' }}><X size={14}/></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}/>
                <input value={leadSearch} onChange={e=>{setLeadSearch(e.target.value);searchLeads(e.target.value)}} placeholder="Search lead by name or phone..." className="input" style={{ paddingLeft: 36 }}/>
                {leads.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {leads.map(l => <button key={l.id} type="button" onClick={()=>{setSelectedLead(l);setLeads([]);setLeadSearch('')}} className="w-full text-left px-4 py-2.5 text-sm" style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background='var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background=''}><p className="font-medium">{l.name}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.phone}</p></button>)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Amount (₹) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="50000" className="input"/></div>
            <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Type</label><select value={form.payment_type} onChange={e=>setForm({...form,payment_type:e.target.value})} className="input">{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="input"/></div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1 py-2 justify-center">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2 justify-center">{saving?'Creating...':'Generate Link'}</button>
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

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <IndianRupee size={20} style={{ color: '#10b981' }}/>
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Payments</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{payments.length} records</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-outline text-sm"><Download size={14}/> Export</button>
          <button onClick={()=>setShowModal(true)} className="btn-primary text-sm"><Plus size={15}/> Create Payment</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: 'Total Collected', value: `₹${(summary.total_collected||0).toLocaleString('en-IN')}`, color: '#10b981' },
          { icon: Clock, label: 'Pending Amount', value: `₹${(summary.total_pending||0).toLocaleString('en-IN')}`, color: '#f59e0b' },
          { icon: AlertTriangle, label: 'Overdue', value: summary.overdue_count||0, color: '#ef4444' }
        ].map(c => (
          <div key={c.label} className="card flex items-start gap-3 p-4">
            <div className="p-2 rounded-xl" style={{ background: c.color + '18' }}><c.icon size={18} style={{ color: c.color }}/></div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} className="input" style={{ width: 'auto' }}>
          <option value="">All Statuses</option>
          {['PENDING','PAID','FAILED','REFUNDED'].map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={filters.payment_type} onChange={e=>setFilters({...filters,payment_type:e.target.value})} className="input" style={{ width: 'auto' }}>
          <option value="">All Types</option>
          {TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="py-8 text-center"><Spinner size={6}/></td></tr>}
              {!isLoading && payments.length===0 && <tr><td colSpan={6} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>No payments found</td></tr>}
              {!isLoading && payments.map(p => {
                const isOverdue = p.status==='PENDING' && p.due_date && new Date(p.due_date)<new Date()
                return (
                  <tr key={p.id} style={isOverdue ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                    <td>
                      <Link to={`/leads/${p.lead?.id}`} className="font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>{p.lead?.name}</Link>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.lead?.phone}</p>
                    </td>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {p.payment_type}
                      </span>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={isOverdue ? { background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' } : (STATUS_STYLE[p.status] || STATUS_STYLE.PENDING)}>
                        {isOverdue ? '⚠ OVERDUE' : p.status}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.due_date?new Date(p.due_date).toLocaleDateString():'—'}</td>
                    <td>
                      {p.status==='PENDING' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>remind(p.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}><Bell size={11}/> Remind</button>
                          <button onClick={()=>markPaid(p.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.2)' }}><Check size={11}/> Paid</button>
                        </div>
                      )}
                      {p.status==='PAID' && <span className="text-xs" style={{ color: '#10b981' }}>Paid {p.paid_at?new Date(p.paid_at).toLocaleDateString():''}</span>}
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
