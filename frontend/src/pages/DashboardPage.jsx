import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { Users, Phone, Flame, IndianRupee, Plus, Calendar, ChevronRight, CheckSquare, Award, AlertTriangle } from 'lucide-react'
import { dashboardApi } from '../services/api'
import useAuthStore from '../store/authStore'
import StatCard from '../components/StatCard'
import ScoreBadge from '../components/ScoreBadge'
import Spinner from '../components/Spinner'

// Pipeline stage config
const STAGES = [
  { key: 'NEW',             label: 'Enquiries',      color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  { key: 'COUNSELLING',     label: 'Counselling',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { key: 'APPLIED',         label: 'Applied',        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { key: 'PAYMENT_PENDING', label: 'Pmt Pending',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { key: 'ENROLLED',        label: 'Enrolled',       color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
]

// Page header utility
function PageHeader({ title, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
    </div>
  )
}

function PipelineSection({ pipeline, onStageClick, selectedStage }) {
  const counts = STAGES.map(s => pipeline[s.key] || 0)
  const total = counts.reduce((a, b) => a + b, 0) || 1

  return (
    <div>
      {/* Segmented progress bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 16 }}>
        {STAGES.map((stage, i) => {
          const pct = (counts[i] / total) * 100
          return (
            <div key={stage.key} style={{ flex: Math.max(pct, 2), background: stage.color, borderRadius: 4, transition: 'flex 0.4s' }} />
          )
        })}
      </div>

      {/* Stage boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {STAGES.map((stage, i) => {
          const count = counts[i]
          const isSelected = selectedStage === stage.key
          return (
            <button key={stage.key} onClick={() => onStageClick(stage.key)}
              style={{
                padding: '14px 10px', borderRadius: 10, border: `2px solid ${isSelected ? stage.color : 'transparent'}`,
                background: isSelected ? stage.color : stage.bg,
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
              }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: isSelected ? '#ffffff' : stage.color, margin: 0 }}>{count}</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.85)' : stage.color, marginTop: 4, lineHeight: 1.2 }}>{stage.label}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const isManager = useAuthStore(s => s.isManagerOrAdmin())
  const [lbPeriod, setLbPeriod] = useState('today')
  const [selectedStage, setSelectedStage] = useState(null)
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const { data: stats, isLoading: sl } = useQuery({ queryKey: ['dash-stats'], queryFn: () => dashboardApi.getStats().then(r => r.data) })
  const { data: hotLeads = [] } = useQuery({ queryKey: ['hot-leads'], queryFn: () => dashboardApi.getHotLeads().then(r => r.data) })
  const { data: todayTasks = [] } = useQuery({ queryKey: ['today-tasks'], queryFn: () => dashboardApi.getTodayTasks().then(r => r.data), retry: false })
  const { data: leaderboard = [] } = useQuery({ queryKey: ['leaderboard', lbPeriod], queryFn: () => dashboardApi.getTeamLeaderboard(lbPeriod).then(r => r.data), enabled: isManager, retry: false })
  const { data: pipelineLeads = [] } = useQuery({ queryKey: ['pipeline-leads', selectedStage], queryFn: () => dashboardApi.getPipelineLeads(selectedStage).then(r => r.data), enabled: !!selectedStage, retry: false })

  if (sl) return <Spinner />

  const pipeline = stats?.pipeline || {}
  const bySource = stats?.leads_by_source ? Object.entries(stats.leads_by_source).map(([name, value]) => ({ name, value })) : []
  const byStatus = stats?.leads_by_status ? Object.entries(stats.leads_by_status).map(([name, value]) => ({ name, value })) : []
  const STATUS_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280']

  const chartTooltipStyle = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#111827' }

  return (
    <div>
      <PageHeader title="Dashboard">
        <button className="btn-outline" style={{ fontSize: 13 }}>
          <Calendar size={14} /> {today}
        </button>
        <Link to="/leads" className="btn-primary" style={{ fontSize: 13, textDecoration: 'none' }}>
          <Plus size={14} /> Add Lead
        </Link>
      </PageHeader>

      {/* Row 1 — 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard icon={Users}       label="New leads today"     value={stats?.new_leads_today}      glow="purple" to="/leads" />
        <StatCard icon={Phone}       label="Calls made today"    value={stats?.calls_today}           glow="green" />
        <StatCard icon={Flame}       label="Hot leads"           value={stats?.hot_leads}             glow="orange" to="/hot-leads" />
        <StatCard icon={IndianRupee} label="Enrolled this month" value={stats?.enrolled_this_month}  glow="green" />
      </div>

      {/* Row 2 — Pipeline + Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 20 }}>
        {/* Pipeline */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Enrollment Pipeline</h3>
            {selectedStage && (
              <button onClick={() => setSelectedStage(null)} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            )}
          </div>
          <PipelineSection pipeline={pipeline} onStageClick={s => setSelectedStage(prev => prev === s ? null : s)} selectedStage={selectedStage} />

          {/* Drill-down */}
          {selectedStage && pipelineLeads.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{pipelineLeads.length} leads in this stage</p>
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pipelineLeads.map(lead => (
                  <Link key={lead.id} to={`/leads/${lead.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg)', transition: 'background 0.15s' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>
                      {lead.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{lead.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.course_interested || lead.source}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>Today's tasks</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckSquare size={28} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>All clear for today</p>
              </div>
            )}
            {todayTasks.map(task => {
              const isOverdue = new Date(task.due_at) < new Date()
              return (
                <Link key={task.id} to={`/leads/${task.lead?.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', textDecoration: 'none', transition: 'background 0.15s' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOverdue ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{task.lead?.name}</p>
                  </div>
                  {isOverdue && <span style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 20 }}>Overdue</span>}
                </Link>
              )
            })}
          </div>
          <Link to="/tasks" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, fontSize: 13, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>
            View all tasks <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Row 3 — Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 20 }}>
        {/* Leads by Source */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>Leads by source</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySource} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by Status */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>Leads by status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} cx="50%" cy="50%" innerRadius={52} outerRadius={78} dataKey="value" paddingAngle={2}>
                {byStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Re-engagement alert */}
      {stats?.reengagement_leads > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#92400e', flex: 1, margin: 0 }}>
            <strong>{stats.reengagement_leads} leads</strong> haven't been contacted in 7+ days.
          </p>
          <Link to="/tasks" style={{ fontSize: 13, color: '#d97706', fontWeight: 600, textDecoration: 'none' }}>View Tasks →</Link>
        </div>
      )}

      {/* Team Leaderboard */}
      {isManager && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={16} style={{ color: '#f59e0b' }} /> Team Leaderboard
            </h3>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
              {['today', 'week', 'month'].map(p => (
                <button key={p} onClick={() => setLbPeriod(p)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                    background: lbPeriod === p ? '#000000' : 'transparent',
                    color: lbPeriod === p ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {leaderboard.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No data for this period</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {leaderboard.slice(0, 6).map((user, i) => (
                <div key={user.id} style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: i === 0 ? '#000000' : 'var(--bg)',
                  border: `1px solid ${i === 0 ? '#000000' : 'var(--border)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? '#ffffff' : 'var(--text-primary)', margin: 0 }}>{user.name}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: 4 }}>
                    {[{ v: user.conversions, l: 'Conv', c: '#10b981' }, { v: user.call_count, l: 'Calls', c: i === 0 ? '#a78bfa' : '#7c3aed' }, { v: `${user.talk_time}m`, l: 'Talk', c: '#f59e0b' }].map(s => (
                      <div key={s.l}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: s.c, margin: 0 }}>{s.v}</p>
                        <p style={{ fontSize: 10, color: i === 0 ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', margin: 0 }}>{s.l}</p>
                      </div>
                    ))}
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
