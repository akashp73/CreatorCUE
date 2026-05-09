import React, { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Upload, Download, Filter, ChevronLeft, ChevronRight, Phone, X, ShieldCheck, Shield, Clock, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const SOURCES = ['FACEBOOK', 'GOOGLE', 'WEBSITE', 'REFERRAL', 'WALK_IN', 'OTHER']
const STATUSES = ['NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED', 'LOST']
const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED']
const STAGE_COLORS = { NEW: '#6366f1', COUNSELLING: '#f59e0b', APPLIED: '#3b82f6', PAYMENT_PENDING: '#f97316', ENROLLED: '#10b981' }
const STAGE_LABELS = { NEW: 'New', COUNSELLING: 'Counselling', APPLIED: 'Applied', PAYMENT_PENDING: 'Pmt Pending', ENROLLED: 'Enrolled' }
const TAG_COLORS = { HOT: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' }, WARM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' }, COLD: { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)' } }

// Smart filter presets
const SMART_FILTERS = [
  { key: 'all', label: 'All Leads', filters: {} },
  { key: 'new', label: 'New (not called)', filters: { never_called: 'true' } },
  { key: 'followup', label: 'Follow-up Today', filters: { follow_up_today: 'true' } },
  { key: 'hot', label: 'Hot', filters: { lead_tag: 'HOT' } },
  { key: 'enrolled', label: 'Enrolled', filters: { enrollment_stage: 'ENROLLED' } },
]

function timeAgo(date) {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function AddLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', course_interested: '', source: 'OTHER', status: 'NEW' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try { await leadsApi.create(form); toast.success('Lead created!'); onCreated(); onClose() }
    catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Add New Lead</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Phone *</label><input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" /></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input" /></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Course</label><input value={form.course_interested} onChange={e => setForm({ ...form, course_interested: e.target.value })} className="input" /></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Source</label><select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="input">{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-2.5 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 justify-center">{loading ? 'Creating...' : 'Create Lead'}</button>
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
  const [smartFilter, setSmartFilter] = useState('all')
  const [filters, setFilters] = useState({
    search: '', status: '', source: '', score_min: '', score_max: '',
    enrollment_stage: '', is_verified: '', lead_tag: '',
  })

  const activeSmartFilters = SMART_FILTERS.find(f => f.key === smartFilter)?.filters || {}
  const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), ...activeSmartFilters }
  const { data, isLoading } = useQuery({ queryKey: ['leads', params], queryFn: () => leadsApi.getAll(params).then(r => r.data) })

  const leads = data?.data || data?.leads || []
  const pagination = data?.pagination || {}

  const setFilter = useCallback((key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }, [])
  const selectSmartFilter = (key) => { setSmartFilter(key); setPage(1) }

  const handleImport = async e => {
    const file = e.target.files[0]; if (!file) return
    try { const r = await leadsApi.bulkImport(file); toast.success(`Imported ${r.data.created} leads`); qc.invalidateQueries(['leads']) }
    catch { toast.error('Import failed') }
    e.target.value = ''
  }

  const handleExport = async () => {
    try {
      const r = await leadsApi.exportCsv(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)))
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  return (
    <div className="space-y-4">
      {showModal && <AddLeadModal onClose={() => setShowModal(false)} onCreated={() => qc.invalidateQueries(['leads'])} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Leads</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{pagination.total || leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-outline text-sm"><Download size={14} /> Export</button>
          <label className="btn-outline text-sm cursor-pointer"><Upload size={14} /> Import <input type="file" accept=".csv" className="hidden" onChange={handleImport} /></label>
          <button onClick={() => setShowModal(true)} className="btn-gold text-sm"><Plus size={15} /> Add Lead</button>
        </div>
      </div>

      {/* Smart Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {SMART_FILTERS.map(f => (
          <button key={f.key} onClick={() => selectSmartFilter(f.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={smartFilter === f.key
              ? { background: '#6366f1', color: 'white', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }
              : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search + Advanced Filters */}
      <div className="card space-y-3 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Search name, phone, email, city, course..." className="input" style={{ paddingLeft: 36 }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-outline text-sm">
            <Filter size={14} /> Filters {Object.values(filters).some(v => v) ? '•' : ''}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="input text-xs">
              <option value="">All Statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.enrollment_stage} onChange={e => setFilter('enrollment_stage', e.target.value)} className="input text-xs">
              <option value="">All Stages</option>{STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
            <select value={filters.lead_tag} onChange={e => setFilter('lead_tag', e.target.value)} className="input text-xs">
              <option value="">All Tags</option><option value="HOT">Hot</option><option value="WARM">Warm</option><option value="COLD">Cold</option>
            </select>
            <select value={filters.is_verified} onChange={e => setFilter('is_verified', e.target.value)} className="input text-xs">
              <option value="">Verified/Unverified</option><option value="true">Verified</option><option value="false">Unverified</option>
            </select>
            <input value={filters.source} onChange={e => setFilter('source', e.target.value)} placeholder="Source" className="input text-xs" />
            <input type="number" value={filters.score_min} onChange={e => setFilter('score_min', e.target.value)} placeholder="Score min" className="input text-xs" />
            <input type="number" value={filters.score_max} onChange={e => setFilter('score_max', e.target.value)} placeholder="Score max" className="input text-xs" />
            <button onClick={() => { setFilters({ search: '', status: '', source: '', score_min: '', score_max: '', enrollment_stage: '', is_verified: '', lead_tag: '' }); setPage(1) }} className="text-sm text-left" style={{ color: '#ef4444' }}>Clear all filters</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Course</th><th>Source</th>
                <th>Score</th><th>Tag</th><th>Stage</th><th>Verified</th>
                <th>Status</th><th>Counsellor</th><th>Last Activity</th><th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={12} className="text-center py-12"><Spinner size={6} /></td></tr>}
              {!isLoading && leads.length === 0 && <tr><td colSpan={12} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No leads found</td></tr>}
              {!isLoading && leads.map(lead => {
                const stageColor = STAGE_COLORS[lead.enrollment_stage] || '#6366f1'
                const tagC = TAG_COLORS[lead.lead_tag] || TAG_COLORS.COLD
                return (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                    <td><span className="font-semibold hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{lead.name}</span></td>
                    <td><a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="hover:underline" style={{ color: 'var(--text-secondary)' }}>{lead.phone}</a></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{lead.course_interested || '—'}</td>
                    <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>{lead.source}</span></td>
                    <td><ScoreBadge score={lead.activity_score} label={lead.score_label} /></td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: tagC.bg, color: tagC.color, border: `1px solid ${tagC.border}` }}>
                        {lead.lead_tag || 'COLD'}
                      </span>
                    </td>
                    <td><span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stageColor}15`, color: stageColor, border: `1px solid ${stageColor}30` }}>{STAGE_LABELS[lead.enrollment_stage] || 'New'}</span></td>
                    <td>{lead.is_verified ? <ShieldCheck size={14} style={{ color: '#10b981' }} /> : <Shield size={14} style={{ color: 'var(--text-muted)' }} />}</td>
                    <td><span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>{lead.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{lead.assignee?.name || 'Unassigned'}</td>
                    <td><span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}><Clock size={11} />{timeAgo(lead.last_activity_at)}</span></td>
                    <td style={{ color: lead.follow_up_date ? '#f59e0b' : 'var(--text-muted)', fontSize: 12 }}>{lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline p-1.5 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <span className="text-xs px-2" style={{ color: 'var(--text-secondary)' }}>{page}/{pagination.pages}</span>
              <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-outline p-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
