import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Flame, Phone, MessageCircle } from 'lucide-react'
import { dashboardApi } from '../services/api'
import Spinner from '../components/Spinner'
import ScoreBadge from '../components/ScoreBadge'

export default function HotLeadsPage() {
  const [sort, setSort] = useState('score')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterCity, setFilterCity] = useState('')

  const { data: leads = [], isLoading } = useQuery({ queryKey: ['hot-leads'], queryFn: () => dashboardApi.getHotLeads().then(r => r.data) })

  const courses = [...new Set(leads.map(l => l.course_interested).filter(Boolean))]
  const cities = [...new Set(leads.map(l => l.city).filter(Boolean))]

  const filtered = leads
    .filter(l => !filterCourse || l.course_interested === filterCourse)
    .filter(l => !filterCity || l.city === filterCity)
    .sort((a, b) => sort === 'score' ? b.activity_score - a.activity_score : new Date(b.last_activity_at) - new Date(a.last_activity_at))

  if (isLoading) return <Spinner />

  const sel = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <Flame size={20} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Hot Leads</h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>{filtered.length} leads with score &gt; 80</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={sort} onChange={e => setSort(e.target.value)} style={sel}>
          <option value="score">Sort: Score</option>
          <option value="activity">Sort: Recent Activity</option>
        </select>
        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={sel}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={sel}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20" style={{ color: '#475569' }}>
          <Flame size={48} className="mx-auto mb-3 opacity-20" />
          <p>No hot leads right now</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(lead => (
          <div key={lead.id} className="rounded-2xl p-5 flex flex-col gap-4 transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}>
            <Link to={`/leads/${lead.id}`} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white text-base">{lead.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{lead.course_interested} · {lead.city}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black" style={{ color: '#ef4444' }}>{lead.activity_score}</p>
                <div className="flex items-center gap-0.5 justify-center">
                  <Flame size={11} style={{ color: '#ef4444' }} />
                  <span className="text-xs font-bold" style={{ color: '#ef4444' }}>HOT</span>
                </div>
              </div>
            </Link>
            <p className="text-xs" style={{ color: '#475569' }}>Last active: {lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString() : '—'}</p>
            <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <a href={`tel:${lead.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: '#6366f1' }}>
                <Phone size={12} /> Call
              </a>
              <a href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: '#25D366' }}>
                <MessageCircle size={12} /> WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
