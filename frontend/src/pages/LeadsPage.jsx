import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Upload, Download, Filter, ChevronLeft, ChevronRight, Phone, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const SOURCES = ['FACEBOOK','GOOGLE','WEBSITE','REFERRAL','WALK_IN','OTHER']
const STATUSES = ['NEW','CONTACTED','APPLIED','QUALIFIED','ENROLLED','LOST']

function AddLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', city:'', course_interested:'', source:'OTHER', status:'NEW' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try { await leadsApi.create(form); toast.success('Lead created!'); onCreated(); onClose() }
    catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }
  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Add New Lead</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Full Name *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Lead name" className={inp}/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Phone *</label><input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="9XXXXXXXXX" className={inp}/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com" className={inp}/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">City</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Mumbai" className={inp}/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Course</label><input value={form.course_interested} onChange={e=>setForm({...form,course_interested:e.target.value})} placeholder="MBA, B.Tech..." className={inp}/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Source</label><select value={form.source} onChange={e=>setForm({...form,source:e.target.value})} className={inp}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-all" style={{backgroundColor:'#4f46e5'}}>{loading?'Creating...':'Create Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ search:'', status:'', source:'', score_min:'', score_max:'' })

  const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)) }
  const { data, isLoading } = useQuery({ queryKey: ['leads', params], queryFn: () => leadsApi.getAll(params).then(r => r.data) })

  const leads = data?.leads || data?.data || []
  const pagination = data?.pagination || {}

  const handleImport = async e => {
    const file = e.target.files[0]; if (!file) return
    try { const r = await leadsApi.bulkImport(file); toast.success(`Imported ${r.data.created} leads`); qc.invalidateQueries(['leads']) }
    catch { toast.error('Import failed') }
    e.target.value = ''
  }

  const handleExport = async () => {
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      const r = await leadsApi.exportCsv(activeFilters)
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  return (
    <div className="space-y-4">
      {showModal && <AddLeadModal onClose={()=>setShowModal(false)} onCreated={()=>qc.invalidateQueries(['leads'])} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Leads</h1>
          <p className="text-sm text-gray-500">{pagination.total || leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-outline text-sm"><Download size={14}/> Export CSV</button>
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
            <Upload size={14}/> Import CSV <input type="file" accept=".csv" className="hidden" onChange={handleImport}/>
          </label>
          <button onClick={()=>setShowModal(true)} className="btn-gold text-sm"><Plus size={15}/> Add Lead</button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card space-y-3 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})} placeholder="Search name, phone, email..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/>
          </div>
          <button onClick={()=>setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Filter size={14}/> Filters
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">All Statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
            <select value={filters.source} onChange={e=>setFilters({...filters,source:e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">All Sources</option>{SOURCES.map(s=><option key={s}>{s}</option>)}</select>
            <input type="number" value={filters.score_min} onChange={e=>setFilters({...filters,score_min:e.target.value})} placeholder="Score min" className="px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            <input type="number" value={filters.score_max} onChange={e=>setFilters({...filters,score_max:e.target.value})} placeholder="Score max" className="px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            <button onClick={()=>setFilters({search:'',status:'',source:'',score_min:'',score_max:''})} className="col-span-full text-sm text-red-500 hover:text-red-700 text-left">Clear filters</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Score</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-12"><Spinner size={6}/></td></tr>}
              {!isLoading && leads.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No leads found</td></tr>}
              {!isLoading && leads.map(lead => (
                <tr key={lead.id} onClick={()=>navigate(`/leads/${lead.id}`)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{lead.name}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.course_interested || '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{lead.source}</span></td>
                  <td className="px-4 py-3"><ScoreBadge score={lead.activity_score} label={lead.score_label}/></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{lead.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{lead.assignee?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Showing {(page-1)*20+1}–{Math.min(page*20, pagination.total)} of {pagination.total}</p>
            <div className="flex items-center gap-1">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="p-1.5 rounded border border-gray-200 disabled:opacity-40"><ChevronLeft size={14}/></button>
              <span className="text-xs px-2">{page}/{pagination.pages}</span>
              <button disabled={page===pagination.pages} onClick={()=>setPage(p=>p+1)} className="p-1.5 rounded border border-gray-200 disabled:opacity-40"><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
