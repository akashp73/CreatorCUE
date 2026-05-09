import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import {
  Users, Flame, Phone, IndianRupee, ArrowUpRight, CheckSquare,
  TrendingUp, Clock, Award, ChevronRight, AlertTriangle,
} from 'lucide-react'
import { dashboardApi, reportsApi } from '../services/api'
import useAuthStore from '../store/authStore'
import StatCard from '../components/StatCard'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED']
const STAGE_LABELS = { NEW: 'New', COUNSELLING: 'Counselling', APPLIED: 'Applied', PAYMENT_PENDING: 'Pmt Pending', ENROLLED: 'Enrolled' }
const STAGE_COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#f97316', '#10b981']

function PipelineFunnel({ pipeline, onStageClick }) {
  const total = Object.values(pipeline).reduce((s, v) => s + v, 0) || 1
  return (
    <div className="space-y-2">
      {STAGES.map((stage, i) => {
        const count = pipeline[stage] || 0
        const pct = Math.round((count / total) * 100)
        const color = STAGE_COLORS[i]
        return (
          <button
            key={stage}
            onClick={() => onStageClick(stage)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color }}>{STAGE_LABELS[stage]}</span>
              <span className="text-xs font-bold" style={{ color: '#f1f5f9' }}>{count}</span>
            </div>
            <div className="h-7 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full rounded-lg transition-all duration-500 flex items-center px-3"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  background: `linear-gradient(90deg, ${color}40, ${color}80)`,
                  border: `1px solid ${color}40`,
                }}
              >
                <span className="text-xs font-semibold text-white">{pct}%</span>
              </div>
              <div className="absolute inset-y-0 right-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={12} style={{ color }} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function TaskFeedItem({ task }) {
  const isOverdue = new Date(task.due_at) < new Date()
  return (
    <Link to={`/leads/${task.lead?.id}`} className="flex items-start gap-3 py-2.5 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)', color: isOverdue ? '#f87171' : '#a5b4fc' }}>
        {task.lead?.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>{task.title}</p>
        <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{task.lead?.name}</p>
      </div>
      <span className={`text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded-full ${isOverdue ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
        {isOverdue ? 'Overdue' : new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </Link>
  )
}

function LeaderboardRow({ user, rank, period }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <span className="text-base w-6 text-center flex-shrink-0">{medals[rank] || `#${rank + 1}`}</span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
        {user.name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>{user.name}</p>
        <p className="text-xs" style={{ color: '#94a3b8' }}>{user.call_count} calls · {user.talk_time}min</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-base font-black" style={{ color: '#10b981' }}>{user.conversions}</p>
        <p className="text-xs" style={{ color: '#475569' }}>converted</p>
      </div>
    </div>
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
  const { data: pipelineLeads = [] } = useQuery({ queryKey: ['pipeline-leads', pipelineStage], queryFn: () => dashboardApi.getPipelineLeads(pipelineStage).then(r => r.data), enabled: !!pipelineStage, retry: false })

  if (sl) return <Spinner />

  const pipeline = stats?.pipeline || {}
  const bySource = stats?.leads_by_source ? Object.entries(stats.leads_by_source).map(([name, value]) => ({ name, value })) : []

  const sectionTitle = (text) => (
    <h3 className="text-sm font-bold mb-4" style={{ color: '#f1f5f9' }}>{text}</h3>
  )

  return (
    <div className="space-y-6">
      {/* Top Row — Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="New Leads Today" value={stats?.new_leads_today} color="#6366f1" glow="blue" to="/leads" />
        <StatCard icon={Phone} label="Calls Made Today" value={stats?.calls_today} color="#10b981" glow="green" />
        <StatCard icon={Flame} label="Hot Leads" value={stats?.hot_leads} color="#ef4444" glow="red" to="/hot-leads" />
        <StatCard icon={IndianRupee} label="Enrolled This Month" value={stats?.enrolled_this_month} color="#f59e0b" glow="gold" />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Pipeline Funnel */}
        <div className="lg:col-span-2 card">
          {sectionTitle('Active Enrollment Pipeline')}
          <PipelineFunnel pipeline={pipeline} onStageClick={s => setPipelineStage(s === pipelineStage ? null : s)} />

          {/* Pipeline drill-down */}
          {pipelineStage && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>
                  {STAGE_LABELS[pipelineStage]} — {pipelineLeads.length} leads
                </p>
                <button onClick={() => setPipelineStage(null)} className="text-xs" style={{ color: '#6366f1' }}>Clear</button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {pipelineLeads.map(lead => (
                  <Link key={lead.id} to={`/leads/${lead.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                      {lead.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm flex-1 truncate" style={{ color: '#f1f5f9' }}>{lead.name}</span>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{lead.course_interested || lead.source}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — Task Feed */}
        <div className="card">
          {sectionTitle('Today\'s Tasks')}
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare size={32} style={{ color: '#334155', margin: '0 auto 8px' }} />
              <p className="text-sm" style={{ color: '#475569' }}>All clear for today</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {todayTasks.map(task => <TaskFeedItem key={task.id} task={task} />)}
            </div>
          )}
          <Link to="/tasks" className="flex items-center justify-center gap-1 mt-4 text-xs font-semibold py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#6366f1' }}>
            View all tasks <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>

      {/* Charts + Hot Leads Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Leads by Source Chart */}
        <div className="lg:col-span-2 card">
          {sectionTitle('Leads by Source')}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bySource} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#f1f5f9' }}
                cursor={{ fill: 'rgba(99,102,241,0.05)' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Hot Leads */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            {sectionTitle('Hot Leads')}
            <Link to="/hot-leads" className="text-xs font-semibold flex items-center gap-1 -mt-4" style={{ color: '#6366f1' }}>
              All <ArrowUpRight size={10} />
            </Link>
          </div>
          {hl ? <Spinner size={5} /> : (
            <div className="space-y-2">
              {hotLeads.slice(0, 5).map(lead => (
                <Link key={lead.id} to={`/leads/${lead.id}`}
                  className="flex items-center gap-2 py-2 hover:bg-white/5 -mx-1 px-1 rounded-lg transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                    {lead.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>{lead.name}</p>
                    <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{lead.course_interested || '—'}</p>
                  </div>
                  <ScoreBadge score={lead.activity_score} label={lead.score_label} />
                </Link>
              ))}
              {hotLeads.length === 0 && <p className="text-sm text-center py-4" style={{ color: '#475569' }}>No hot leads</p>}
            </div>
          )}
        </div>
      </div>

      {/* Re-engagement alert */}
      {stats?.reengagement_leads > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
              {stats.reengagement_leads} lead{stats.reengagement_leads > 1 ? 's' : ''} need re-engagement
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>No activity in 7+ days.</p>
          </div>
          <Link to="/tasks" className="text-xs font-bold flex-shrink-0 underline" style={{ color: '#f59e0b' }}>View Tasks</Link>
        </div>
      )}

      {/* Team Leaderboard (ADMIN/MANAGER only) */}
      {isManager && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: '#f1f5f9' }}>
              <Award size={15} className="inline mr-2" style={{ color: '#f59e0b' }} />
              Team Leaderboard
            </h3>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {['today', 'week', 'month'].map(p => (
                <button
                  key={p}
                  onClick={() => setLbPeriod(p)}
                  className="px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all"
                  style={lbPeriod === p
                    ? { background: '#6366f1', color: 'white' }
                    : { color: '#94a3b8' }
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#475569' }}>No data for this period</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {leaderboard.slice(0, 6).map((user, i) => (
                <div key={user.id} className="rounded-xl p-4 transition-all"
                  style={{
                    background: i === 0 ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{user.name}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>{user.role}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <p className="text-lg font-black" style={{ color: '#10b981' }}>{user.conversions}</p>
                      <p className="text-xs" style={{ color: '#475569' }}>Converted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black" style={{ color: '#6366f1' }}>{user.call_count}</p>
                      <p className="text-xs" style={{ color: '#475569' }}>Calls</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black" style={{ color: '#f59e0b' }}>{user.talk_time}m</p>
                      <p className="text-xs" style={{ color: '#475569' }}>Talk Time</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
