import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { Users, Flame, CheckSquare, TrendingUp, Phone, ArrowUpRight } from 'lucide-react'
import { dashboardApi, reportsApi } from '../services/api'
import useAuthStore from '../store/authStore'
import StatCard from '../components/StatCard'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const STATUS_COLORS = { NEW:'#3182CE', CONTACTED:'#38A169', APPLIED:'#6366f1', QUALIFIED:'#4f46e5', ENROLLED:'#38A169', LOST:'#E53E3E' }
const SOURCE_COLORS = ['#0f172a','#4f46e5','#3182CE','#38A169','#E53E3E','#6366f1']

export default function DashboardPage() {
  const isManager = useAuthStore(s => s.isManagerOrAdmin())
  const { data: stats, isLoading: sl } = useQuery({ queryKey: ['dash-stats'], queryFn: () => dashboardApi.getStats().then(r => r.data) })
  const { data: hotLeads = [], isLoading: hl } = useQuery({ queryKey: ['hot-leads'], queryFn: () => dashboardApi.getHotLeads().then(r => r.data) })
  const { data: agents = [] } = useQuery({ queryKey: ['agent-perf'], queryFn: () => reportsApi.agentPerf({}).then(r => r.data), enabled: isManager })

  if (sl) return <Spinner />

  const bySource = stats?.leads_by_source ? Object.entries(stats.leads_by_source).map(([name, value]) => ({ name, value })) : []
  const byStatus = stats?.leads_by_status ? Object.entries(stats.leads_by_status).map(([name, value]) => ({ name, value })) : []

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={stats?.total_leads} color="#4f46e5" to="/leads" />
        <StatCard icon={Flame} label="Hot Leads" value={stats?.hot_leads} color="#E53E3E" sub="Score > 80" to="/hot-leads" />
        <StatCard icon={CheckSquare} label="Tasks Due Today" value={stats?.tasks_due_today} color="#f59e0b" to="/tasks" />
        <StatCard icon={TrendingUp} label="Enrolled This Month" value={stats?.enrolled_this_month} color="#38A169" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Source <span className="text-xs font-normal text-gray-400">(Last 30 days)</span></h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                {byStatus.map((e, i) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || SOURCE_COLORS[i % 6]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hot leads table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">🔥 Top Hot Leads</h3>
          <Link to="/hot-leads" className="text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#4f46e5' }}>
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {hl ? <Spinner size={6} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2.5 font-medium">Name</th>
                  <th className="text-left py-2.5 font-medium">Score</th>
                  <th className="text-left py-2.5 font-medium">Course</th>
                  <th className="text-left py-2.5 font-medium">Phone</th>
                  <th className="text-left py-2.5 font-medium">Call</th>
                </tr>
              </thead>
              <tbody>
                {hotLeads.slice(0, 5).map(lead => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5">
                      <Link to={`/leads/${lead.id}`} className="font-medium text-gray-800 hover:text-indigo-600 transition-colors">{lead.name}</Link>
                    </td>
                    <td className="py-2.5"><ScoreBadge score={lead.activity_score} label={lead.score_label} /></td>
                    <td className="py-2.5 text-gray-500 text-xs">{lead.course_interested || '—'}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{lead.phone}</td>
                    <td className="py-2.5">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                        <Phone size={12} /> Call
                      </a>
                    </td>
                  </tr>
                ))}
                {hotLeads.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No hot leads yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Agent leaderboard (ADMIN/MANAGER only) */}
      {isManager && agents.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🏆 Agent Leaderboard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {agents.slice(0, 3).map((a, i) => (
              <div
                key={a.id}
                className="rounded-xl p-4 text-center border transition-shadow hover:shadow-sm"
                style={{
                  borderColor: i === 0 ? '#4f46e5' : '#E5E7EB',
                  backgroundColor: i === 0 ? '#eef2ff' : '#FAFAFA',
                }}
              >
                <p className="text-2xl mb-1">{['🥇', '🥈', '🥉'][i]}</p>
                <p className="font-semibold text-gray-800 text-sm">{a.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.leads_assigned} leads</p>
                <p className="text-xl font-bold mt-2" style={{ color: i === 0 ? '#4f46e5' : '#0f172a' }}>{a.conversion_rate}%</p>
                <p className="text-xs text-gray-400">conversion</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
