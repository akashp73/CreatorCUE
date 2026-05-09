import React, { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Upload, Download, Filter, ChevronLeft, ChevronRight, Phone, X, ShieldCheck, Shield, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi } from '../services/api'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const SOURCES = ['FACEBOOK', 'GOOGLE', 'WEBSITE', 'REFERRAL', 'WALK_IN', 'OTHER']
const STATUSES = ['NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED', 'LOST']
const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED']
const STAGE_COLORS = { NEW: '#6366f1', COUNSELLING: '#f59e0b', APPLIED: '#3b82f6', PAYMENT_PENDING: '#f97316', ENROLLED: '#10b981' }
const STAGE_LABELS = { NEW: 'New', COUNSELLING: 'Counselling', APPLIED: 'Applied', PAYMENT_PENDING: 'Pmt Pending', ENROLLED: 'Enrolled' }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white">Add New Lead</h2>
          <button onClick={onClose} style={{ color: '#94a3b8' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Full Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Lead name" className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Phone *</label>
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9XXXXXXXXX" className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Course</label>
              <input value={form.course_interested} onChange={e => setForm({ ...form, course_interested: e.target.value })} placeholder="MBA, B.Tech..." className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Source</label>
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="input">{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
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
  const [filters, setFilters] = useState({
    search: '', status: '', source: '', score_min: '', score_max: '',
    enrollment_stage: '', is_verified: '', assigned_to: '',
  })

  const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
  const { data, isLoading } = useQuery({ queryKey: ['leads', params], queryFn: () => leadsApi.getAll(params).then(r => r.data) })

  const leads = data?.data || data?.leads || []
  const pagination = data?.pagination || {}

  const setFilter = useCallback((key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }, [])

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

  const glassBg = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div className="space-y-4">
      {showModal && <AddLeadModal onClose={() => setShowModal(false)} onCreated={() => qc.invalidateQueries(['leads'])} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Leads</h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>{pagination.total || leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-outline text-sm"><Download size={14} /> Export</button>
          <label className="btn-outline text-sm cursor-pointer">
            <Upload size={14} /> Import <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => setShowModal(true)} className="btn-gold text-sm"><Plus size={15} /> Add Lead</button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="rounded-2xl p-4 space-y-3" style={glassBg}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
            <input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search name, phone, email, city, course..."
              style={{ ...inputStyle, width: '100%', paddingLeft: 36 }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-outline text-sm">
            <Filter size={14} /> Filters {Object.values(filters).some(v => v) ? '•' : ''}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={inputStyle}>
              <option value="">All Statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.enrollment_stage} onChange={e => setFilter('enrollment_stage', e.target.value)} style={inputStyle}>
              <option value="">All Stages</option>{STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
            <select value={filters.is_verified} onChange={e => setFilter('is_verified', e.target.value)} style={inputStyle}>
              <option value="">Verified / Unverified</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
            </select>
            <input
              value={filters.source}
              onChange={e => setFilter('source', e.target.value)}
              placeholder="Source (e.g. FACEBOOK)"
              style={inputStyle}
            />
            <input type="number" value={filters.score_min} onChange={e => setFilter('score_min', e.target.value)} placeholder="Score min" style={inputStyle} />
            <input type="number" value={filters.score_max} onChange={e => setFilter('score_max', e.target.value)} placeholder="Score max" style={inputStyle} />
            <button
              onClick={() => { setFilters({ search: '', status: '', source: '', score_min: '', score_max: '', enrollment_stage: '', is_verified: '', assigned_to: '' }); setPage(1) }}
              className="col-span-2 text-sm text-left"
              style={{ color: '#ef4444' }}>
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={glassBg}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Source</th>
                <th>Score</th>
                <th>Stage</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Last Activity</th>
                <th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={11} className="text-center py-12"><Spinner size={6} /></td></tr>}
              {!isLoading && leads.length === 0 && (
                <tr><td colSpan={11} className="text-center py-12" style={{ color: '#475569' }}>No leads found</td></tr>
              )}
              {!isLoading && leads.map(lead => {
                const stageColor = STAGE_COLORS[lead.enrollment_stage] || '#6366f1'
                return (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className="font-semibold text-white hover:text-indigo-400 transition-colors">{lead.name}</span>
                    </td>
                    <td>
                      <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="hover:underline" style={{ color: '#94a3b8' }}>{lead.phone}</a>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{lead.course_interested || '—'}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{lead.source}</span>
                    </td>
                    <td><ScoreBadge score={lead.activity_score} label={lead.score_label} /></td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stageColor}15`, color: stageColor, border: `1px solid ${stageColor}30` }}>
                        {STAGE_LABELS[lead.enrollment_stage] || lead.enrollment_stage || 'New'}
                      </span>
                    </td>
                    <td>
                      {lead.is_verified
                        ? <ShieldCheck size={14} style={{ color: '#10b981' }} />
                        : <Shield size={14} style={{ color: '#334155' }} />
                      }
                    </td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{lead.status}</span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{lead.assignee?.name || 'Unassigned'}</td>
                    <td>
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                        <Clock size={11} />
                        {timeAgo(lead.last_activity_at)}
                      </span>
                    </td>
                    <td style={{ color: lead.follow_up_date ? '#f59e0b' : '#334155', fontSize: 12 }}>
                      {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color: '#475569' }}>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline p-1.5 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <span className="text-xs px-2" style={{ color: '#94a3b8' }}>{page}/{pagination.pages}</span>
              <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-outline p-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
