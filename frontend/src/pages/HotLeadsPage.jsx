import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Flame, Phone, MessageCircle } from 'lucide-react'
import { dashboardApi } from '../services/api'
import Spinner from '../components/Spinner'

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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100"><Flame size={20} className="text-red-500"/></div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Hot Leads</h1>
          <p className="text-sm text-gray-500">{filtered.length} leads with score &gt; 80</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={sort} onChange={e=>setSort(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="score">Sort: Score</option>
          <option value="activity">Sort: Recent Activity</option>
        </select>
        <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All Courses</option>
          {courses.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCity} onChange={e=>setFilterCity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400"><Flame size={48} className="mx-auto mb-3 opacity-20"/><p>No hot leads right now 🎯</p></div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(lead => (
          <div key={lead.id} className="bg-white rounded-xl border-l-4 border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow" style={{borderLeftColor:'#E53E3E'}}>
            <Link to={`/leads/${lead.id}`} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-gray-800 text-base">{lead.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{lead.course_interested} · {lead.city}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-600">{lead.activity_score}</p>
                <div className="flex items-center gap-0.5 justify-center"><Flame size={11} className="text-red-500"/><span className="text-xs font-bold text-red-500">HOT</span></div>
              </div>
            </Link>
            <div className="text-xs text-gray-500">📅 Last active: {lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString() : '—'}</div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity" style={{backgroundColor:'#4f46e5'}}>
                <Phone size={12}/> Call
              </a>
              <a href={`https://wa.me/${lead.phone?.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white" style={{backgroundColor:'#25D366'}}>
                <MessageCircle size={12}/> WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
