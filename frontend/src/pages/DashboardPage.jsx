import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import {
  Users, Flame, Phone, IndianRupee, ArrowUpRight, CheckSquare, Award, AlertTriangle,
} from 'lucide-react'
import { dashboardApi, reportsApi } from '../services/api'
import useAuthStore from '../store/authStore'
import StatCard from '../components/StatCard'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

// ── Meritto-style enrollment pipeline tree ─────────────────
function PipelineTree({ pipeline, onNodeClick }) {
  const TREE = [
    { key: 'total', label: 'Total Applications', color: '#6366f1', level: 0 },
    { key: 'NEW', label: 'New Enquiries', color: '#3b82f6', level: 1, parent: 'total' },
    { key: 'COUNSELLING', label: 'In Counselling', color: '#f59e0b', level: 1, parent: 'total' },
    { key: 'APPLIED', label: 'Applied', color: '#8b5cf6', level: 2, parent: 'COUNSELLING' },
    { key: 'PAYMENT_PENDING', label: 'Payment Pending', color: '#f97316', level: 2, parent: 'APPLIED' },
    { key: 'ENROLLED', label: 'Enrolled', color: '#10b981', level: 2, parent: 'APPLIED' },
  ]

  const total = Object.values(pipeline).reduce((s, v) => s + v, 0)
  const getCount = (key) => key === 'total' ? total : (pipeline[key] || 0)

  const getPct = (key) => {
    if (!total) return 0
    return Math.round((getCount(key) / total) * 100)
  }

  return (
    <div className="space-y-3">
      {/* Root node */}
      <button onClick={() => onNodeClick(null)}
        className="w-full px-5 py-4 rounded-2xl text-left transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '2px solid rgba(99,102,241,0.4)' }}>
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ color: '#a5b4fc' }}>Total Applications</span>
          <span className="text-2xl font-black" style={{ color: '#6366f1' }}>{total}</span>
        </div>
      </button>

      {/* Level 1 — two columns */}
      <div className="grid grid-cols-2 gap-3 pl-4">
        {[
          { key: 'NEW', label: 'New Enquiries', color: '#3b82f6', accent: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
          { key: 'COUNSELLING', label: 'In Counselling', color: '#f59e0b', accent: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
        ].map(node => (
          <button key={node.key} onClick={() => onNodeClick(node.key)}
            className="px-4 py-3 rounded-xl text-left transition-all hover:opacity-90 relative"
            style={{ background: node.accent, border: `1px solid ${node.border}` }}>
            <div className="text-xs font-semibold mb-1" style={{ color: node.color }}>{node.label}</div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black" style={{ color: node.color }}>{getCount(node.key)}</span>
              <span className="text-xs font-medium" style={{ color: node.color }}>{getPct(node.key)}%</span>
            </div>
          </button>
        ))}
      </div>

      {/* Connector line visual */}
      <div className="flex justify-center">
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
      </div>

      {/* Level 2 — three columns */}
      <div className="grid grid-cols-3 gap-2 pl-8">
        {[
          { key: 'APPLIED', label: 'Applied', color: '#8b5cf6', accent: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
          { key: 'PAYMENT_PENDING', label: 'Pmt Pending', color: '#f97316', accent: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' },
          { key: 'ENROLLED', label: 'Enrolled', color: '#10b981', accent: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
        ].map(node => (
          <button key={node.key} onClick={() => onNodeClick(node.key)}
            className="px-3 py-3 rounded-xl text-left transition-all hover:opacity-90"
            style={{ background: node.accent, border: `1px solid ${node.border}` }}>
            <div className="text-xs font-semibold mb-1" style={{ color: node.color, fontSize: 10 }}>{node.label}</div>
            <div className="text-xl font-black" style={{ color: node.color }}>{getCount(node.key)}</div>
            <div className="text-xs" style={{ color: node.color, opacity: 0.7 }}>{getPct(node.key)}%</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function TaskFeedItem({ task }) {
  const isOverdue = new Date(task.due_at) < new Date()
  return (
    <Link to={`/leads/${task.lead?.id}`} className="flex items-start gap-3 py-2.5 rounded-lg px-2 transition-colors"
      style={{ ':hover': { background: 'var(--surface-hover)' } }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)', color: isOverdue ? '#ef4444' : '#6366f1' }}>
        {task.lead?.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{task.lead?.name}</p>
      </div>
      <span className="text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded-full"
        style={isOverdue
          ? { color: '#ef4444', background: 'rgba(239,68,68,0.1)' }
          : { color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }
        }>
        {isOverdue ? 'Overdue' : new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </Link>
  )
}

export default function DashboardPage() {
  const isManager = useAuthStore(s => s.isManagerOrAdmin())
  const [lbPeriod, setLbPeriod] = useState('today')
  const [pipelineStage, setPipelineStage] = useState(null)

  const { data: stats, isLoading: sl } = useQuery({ queryKey: ['dash-stats'], queryFn: () => dashboardApi.getStats().then(r => r.data) })
  const { data: hotLeads = [], isLoading: hl } = useQuery({ queryKey: ['hot-leads'], queryFn: () => dashboardApi.getHotLeads().then(r => r.data) })
  const { data: todayTasks = [] } = useQuery({ queryKey: ['today-tasks'], queryFn: () => dashboardApi.getTodayTasks().then(r => r.data), retry: false })
  const { data: leaderboard = [] } = useQuery({ queryKey: ['leaderboard', lbPeriod], queryFn: () => dashboardApi.getTeamLeaderboard(lbPeriod).then(r => r.data), enabled: isManager, retry: false })
  const { data: pipelineLeads = [] } = useQuery({ queryKey: ['pipeline-leads', pipelineStage], queryFn: () => dashboardApi.getPipelineLeads(pipelineStage).then(r => r.data), enabled: pipelineStage !== undefined && pipelineStage !== null, retry: false })

  if (sl) return <Spinner />

  const pipeline = stats?.pipeline || {}
  const bySource = stats?.leads_by_source ? Object.entries(stats.leads_by_source).map(([name, value]) => ({ name, value })) : []

  const S = (text) => (
    <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{text}</h3>
  )

  return (
    <div className="space-y-6">
      {/* Top Row — 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="New Leads Today" value={stats?.new_leads_today} color="#6366f1" glow="blue" to="/leads" />
        <StatCard icon={Phone} label="Calls Made Today" value={stats?.calls_today} color="#10b981" glow="green" />
        <StatCard icon={Flame} label="Hot Leads" value={stats?.hot_leads} color="#ef4444" glow="red" to="/hot-leads" />
        <StatCard icon={IndianRupee} label="Enrolled This Month" value={stats?.enrolled_this_month} color="#f59e0b" glow="gold" />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Meritto Pipeline Tree */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            {S('Enrollment Pipeline')}
          </div>
          <PipelineTree pipeline={pipeline} onNodeClick={s => setPipelineStage(prev => prev === s ? null : s)} />

          {/* Drill-down */}
          {pipelineStage !== null && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {pipelineStage ? `${pipelineStage} — ` : 'All leads — '}{pipelineLeads.length} results
                </p>
                <button onClick={() => setPipelineStage(null)} className="text-xs" style={{ color: '#6366f1' }}>Clear</button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {pipelineLeads.map(lead => (
                  <Link key={lead.id} to={`/leads/${lead.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                    style={{ ':hover': { background: 'var(--surface-hover)' } }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                      {lead.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{lead.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{lead.course_interested || lead.source}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Today Tasks + Team Status */}
        <div className="space-y-4">
          <div className="card">
            {S("Today's Tasks")}
            {todayTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckSquare size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All clear!</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {todayTasks.map(task => <TaskFeedItem key={task.id} task={task} />)}
              </div>
            )}
            <Link to="/tasks" className="flex items-center justify-center gap-1 mt-3 text-xs font-semibold py-2 rounded-lg"
              style={{ color: '#6366f1', background: 'rgba(99,102,241,0.07)' }}>
              View all tasks <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leads by Source Chart */}
        <div className="card">
          {S('Leads by Source')}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bySource} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' }} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hot Leads */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            {S('Top Hot Leads')}
            <Link to="/hot-leads" className="text-xs font-semibold flex items-center gap-1 -mt-4" style={{ color: '#6366f1' }}>
              All <ArrowUpRight size={10} />
            </Link>
          </div>
          {hl ? <Spinner size={5} /> : (
            <div className="space-y-2">
              {hotLeads.slice(0, 5).map(lead => (
                <Link key={lead.id} to={`/leads/${lead.id}`}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg transition-colors hover:bg-opacity-5"
                  style={{ ':hover': { background: 'var(--surface-hover)' } }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                    {lead.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{lead.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{lead.course_interested || '—'}</p>
                  </div>
                  <ScoreBadge score={lead.activity_score} label={lead.score_label} />
                </Link>
              ))}
              {hotLeads.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No hot leads</p>}
            </div>
          )}
        </div>
      </div>

      {/* Re-engagement alert */}
      {stats?.reengagement_leads > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
              {stats.reengagement_leads} lead{stats.reengagement_leads > 1 ? 's' : ''} need re-engagement
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>No activity in 7+ days.</p>
          </div>
          <Link to="/tasks" className="text-xs font-bold flex-shrink-0 underline" style={{ color: '#f59e0b' }}>View Tasks</Link>
        </div>
      )}

      {/* Team Leaderboard */}
      {isManager && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Award size={15} style={{ color: '#f59e0b' }} /> Team Leaderboard
            </h3>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--surface)' }}>
              {['today', 'week', 'month'].map(p => (
                <button key={p} onClick={() => setLbPeriod(p)}
                  className="px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all"
                  style={lbPeriod === p ? { background: '#6366f1', color: 'white' } : { color: 'var(--text-secondary)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {leaderboard.length === 0
            ? <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No data for this period</p>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leaderboard.slice(0, 6).map((user, i) => (
                  <div key={user.id} className="rounded-xl p-4 transition-all"
                    style={{
                      background: i === 0 ? 'rgba(99,102,241,0.08)' : 'var(--surface)',
                      border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                    }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>{user.role}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ v: user.conversions, l: 'Converted', c: '#10b981' }, { v: user.call_count, l: 'Calls', c: '#6366f1' }, { v: `${user.talk_time}m`, l: 'Talk', c: '#f59e0b' }].map(s => (
                        <div key={s.l} className="text-center">
                          <p className="text-lg font-black" style={{ color: s.c }}>{s.v}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}
