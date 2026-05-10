import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Users, TrendingUp, IndianRupee, Target, Medal, Phone, MessageCircle, Copy, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportsApi, callsApi } from '../services/api'
import Spinner from '../components/Spinner'

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280']
const STAGE_COLORS = ['#7c3aed', '#3b82f6', '#f59e0b', '#ef4444', '#10b981']
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }

const TABS = [
  { key: 'overview',  label: 'Overview' },
  { key: 'agents',    label: 'Agent Performance' },
  { key: 'funnel',    label: 'Funnel' },
  { key: 'roi',       label: 'Source ROI' },
  { key: 'forecast',  label: 'Forecast' },
  { key: 'myreport',  label: 'My Report' },
]

function PillTab({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: active ? 600 : 400,
        background: active ? '#000000' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-secondary)',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}>
      {children}
    </button>
  )
}

function OverviewStatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{value ?? '—'}</p>
      </div>
    </div>
  )
}

function FunnelBar({ stage, count, pctOfMax, pctOfTotal, dropOff, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{stage}</span>
        <span style={{ display: 'flex', gap: 12, color: 'var(--text-secondary)' }}>
          {dropOff !== null && <span style={{ color: '#ef4444' }}>↓ {dropOff}% drop</span>}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{count.toLocaleString()} ({pctOfTotal}%)</span>
        </span>
      </div>
      <div style={{ height: 36, background: 'var(--bg)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.max(parseFloat(pctOfMax || 4), 4)}%`, height: '100%',
          background: color, borderRadius: 8,
          display: 'flex', alignItems: 'center', paddingLeft: 10,
          transition: 'width 0.5s', minWidth: 40,
        }}>
          {count > 0 && <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{count}</span>}
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [tab, setTab] = useState('overview')
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo)
  const [dateTo, setDateTo] = useState(today)
  const params = { date_from: dateFrom, date_to: dateTo }

  const { data: overview, isLoading: ol } = useQuery({ queryKey: ['rep-overview', params], queryFn: () => reportsApi.overview(params).then(r => r.data), enabled: tab === 'overview' })
  const { data: agents = [], isLoading: al } = useQuery({ queryKey: ['rep-agents', params], queryFn: () => reportsApi.agentPerf(params).then(r => r.data), enabled: tab === 'agents' })
  const { data: funnel, isLoading: fl } = useQuery({ queryKey: ['rep-funnel', params], queryFn: () => reportsApi.funnel(params).then(r => r.data), enabled: tab === 'funnel' })
  const { data: sourceRoi = [], isLoading: rl } = useQuery({ queryKey: ['rep-roi', params], queryFn: () => reportsApi.sourceRoi(params).then(r => r.data), enabled: tab === 'roi' })
  const { data: forecast, isLoading: fcl } = useQuery({ queryKey: ['rep-forecast'], queryFn: () => reportsApi.forecast().then(r => r.data), enabled: tab === 'forecast' })
  const { data: myReport, isLoading: mrl } = useQuery({ queryKey: ['rep-my-report'], queryFn: () => callsApi.today().then(r => r.data), enabled: tab === 'myreport', refetchInterval: tab === 'myreport' ? 60000 : false })

  const exportCsv = async () => {
    try {
      const r = await reportsApi.export({ ...params, type: 'leads' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = 'report.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Reports</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', background: 'transparent', cursor: 'pointer' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', background: 'transparent', cursor: 'pointer' }} />
          </div>
          <button onClick={exportCsv} className="btn-primary" style={{ fontSize: 13 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Pill tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, width: 'fit-content', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(t => <PillTab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</PillTab>)}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (ol ? <Spinner /> : overview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <OverviewStatCard icon={Users}       label="Total Leads"      value={overview.total_leads}                   color="#7c3aed" />
            <OverviewStatCard icon={TrendingUp}  label="Conversion Rate"  value={`${overview.conversion_rate}%`}         color="#10b981" />
            <OverviewStatCard icon={IndianRupee} label="Revenue"          value={`₹${(overview.total_revenue || 0).toLocaleString('en-IN')}`} color="#f59e0b" />
            <OverviewStatCard icon={Target}      label="Avg Score"        value={overview.avg_score}                     color="#3b82f6" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>Monthly Enrollments</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={overview.leads_by_source} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>Source ROI</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={overview.leads_by_status} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={2}>
                    {(overview.leads_by_status || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 6]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ))}

      {/* ── Agents ── */}
      {tab === 'agents' && (al ? <Spinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {agents.slice(0, 3).length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Medal size={16} style={{ color: '#f59e0b' }} /> Top Performers
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {agents.slice(0, 3).map((a, i) => (
                  <div key={a.id} style={{ textAlign: 'center', padding: '16px', borderRadius: 10, background: i === 0 ? '#000000' : 'var(--bg)', border: `1px solid ${i === 0 ? '#000' : 'var(--border)'}` }}>
                    <p style={{ fontSize: 22, margin: '0 0 6px' }}>{['🥇', '🥈', '🥉'][i]}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? '#fff' : 'var(--text-primary)', margin: '0 0 4px' }}>{a.name}</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: i === 0 ? '#a78bfa' : '#7c3aed', margin: 0 }}>{a.conversion_rate}%</p>
                    <p style={{ fontSize: 11, color: i === 0 ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', margin: 0 }}>conversion</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead><tr>
                <th>Counsellor</th><th>Assigned</th><th>Tasks Done</th><th>Converted</th><th>Rate</th>
              </tr></thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id}>
                    <td><p style={{ fontWeight: 500 }}>{a.name}</p><p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{a.role}</p></td>
                    <td>{a.leads_assigned}</td><td>{a.tasks_completed}</td><td>{a.leads_converted}</td>
                    <td><span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: parseFloat(a.conversion_rate) >= 20 ? 'rgba(16,185,129,0.1)' : parseFloat(a.conversion_rate) >= 10 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: parseFloat(a.conversion_rate) >= 20 ? '#059669' : parseFloat(a.conversion_rate) >= 10 ? '#d97706' : '#dc2626' }}>{a.conversion_rate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── Funnel ── */}
      {tab === 'funnel' && (fl ? <Spinner /> : funnel && (
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Conversion Funnel</span>
              <span>{funnel.total_leads} leads total</span>
            </div>
            {funnel.stages?.map((s, i) => (
              <FunnelBar key={s.stage} stage={s.stage} count={s.count} pctOfMax={s.pct_of_max || s.pct} pctOfTotal={s.pct_of_total || s.pct} dropOff={s.drop_off} color={STAGE_COLORS[i % STAGE_COLORS.length]} />
            ))}
          </div>
          {funnel.stages && (
            <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {funnel.stages.slice(1).map((s, i) => {
                const prev = funnel.stages[i]; const rate = prev.count > 0 ? ((s.count / prev.count) * 100).toFixed(0) : 0
                return (
                  <div key={s.stage} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>{prev.stage} → {s.stage}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: parseInt(rate) >= 50 ? '#10b981' : parseInt(rate) >= 25 ? '#f59e0b' : '#ef4444' }}>{rate}%</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* ── Source ROI ── */}
      {tab === 'roi' && (rl ? <Spinner /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Source</th><th>Total</th><th>Qualified</th><th>Enrolled</th><th>Revenue</th></tr></thead>
            <tbody>
              {sourceRoi.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No data for this period</td></tr>}
              {sourceRoi.map((r, i) => (
                <tr key={r.source}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % 6] }} /><span style={{ fontWeight: 500 }}>{r.source}</span></div></td>
                  <td>{r.total_leads}</td><td>{r.qualified_leads}</td><td>{r.enrolled_leads}</td>
                  <td style={{ fontWeight: 600 }}>₹{(r.total_revenue || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* ── Forecast ── */}
      {tab === 'forecast' && (fcl ? <Spinner /> : forecast && (
        <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '24px', borderRadius: 12, background: '#000000' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 8px' }}>Predicted Next Month Revenue</p>
            <p style={{ fontSize: 40, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-1px' }}>₹{(forecast.predicted_revenue || 0).toLocaleString('en-IN')}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0' }}>Based on {forecast.total_data_points} total leads · {forecast.enrolled_leads} enrolled</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Pipeline Leads', value: forecast.pipeline_leads, color: '#7c3aed' },
              { label: 'Avg Fee', value: `₹${(forecast.avg_fee || 0).toLocaleString('en-IN')}`, color: '#10b981' },
              { label: 'Historical Rate', value: `${forecast.historical_conversion_rate}%`, color: '#f59e0b' },
            ].map(c => (
              <div key={c.label} className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{c.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── My Report ── */}
      {tab === 'myreport' && (mrl ? <Spinner /> : myReport && (() => {
        const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        const reportText = `📊 My Daily Report — ${todayStr}\n\n📞 Calls\n• Total: ${myReport.total_calls}\n• Connected: ${myReport.connected_calls}\n• Missed: ${myReport.missed_calls}\n• Duration: ${myReport.total_duration} min\n\n💼 Leads\n• Converted: ${myReport.leads_converted}\n• New Added: ${myReport.new_leads}\n\n— via EduCRM`
        return (
          <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { navigator.clipboard.writeText(reportText); toast.success('Copied!') }} className="btn-outline" style={{ fontSize: 13 }}><Copy size={13} /> Copy</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(reportText)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#25D366', color: '#fff', fontWeight: 500, fontSize: 13, textDecoration: 'none' }}>
                <MessageCircle size={14} /> Send via WhatsApp
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { label: 'Total Calls', value: myReport.total_calls, icon: Phone, color: '#7c3aed' },
                { label: 'Connected', value: myReport.connected_calls, icon: Phone, color: '#10b981' },
                { label: 'Missed', value: myReport.missed_calls, icon: Phone, color: '#ef4444' },
                { label: 'Duration (min)', value: myReport.total_duration, icon: Target, color: '#f59e0b' },
                { label: 'Converted', value: myReport.leads_converted, icon: TrendingUp, color: '#10b981' },
                { label: 'New Leads', value: myReport.new_leads, icon: Users, color: '#7c3aed' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px', borderRadius: 10, background: '#000000' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report Preview</p>
              <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{reportText}</pre>
            </div>
          </div>
        )
      })())}
    </div>
  )
}
