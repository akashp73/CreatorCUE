import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Users, TrendingUp, IndianRupee, Target, Medal, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportsApi } from '../services/api'
import Spinner from '../components/Spinner'

const NAVY = '#0f172a', SAFFRON = '#4f46e5'
const COLORS = ['#0f172a', '#4f46e5', '#3182CE', '#38A169', '#E53E3E', '#6366f1']
const STAGE_COLORS = { NEW: '#64748b', CONTACTED: '#3B82F6', APPLIED: '#F59E0B', QUALIFIED: '#4f46e5', ENROLLED: '#10B981' }
const CONFIDENCE_STYLES = {
  HIGH: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'High Confidence' },
  MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium Confidence' },
  LOW: { bg: 'bg-red-100', text: 'text-red-700', label: 'Low Confidence' },
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${active ? 'text-gray-900 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`} style={active ? { borderColor: SAFFRON } : {}}>
      {children}
    </button>
  )
}
function ConvBadge({ rate }) {
  const color = rate >= 20 ? '#38A169' : rate >= 10 ? '#f59e0b' : '#E53E3E'
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '18', color }}>{rate}%</span>
}

// Visual funnel bar
function FunnelStage({ stage, count, pctOfMax, pctOfTotal, dropOff, color }) {
  return (
    <div className="group">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-gray-700 uppercase tracking-wide">{stage}</span>
        <div className="flex items-center gap-3">
          {dropOff !== null && <span className="text-red-400 text-xs">↓ {dropOff}% drop</span>}
          <span className="font-bold text-gray-800 tabular-nums">{count.toLocaleString()} <span className="text-gray-400 font-normal">({pctOfTotal}%)</span></span>
        </div>
      </div>
      <div className="h-10 bg-gray-100 rounded-xl overflow-hidden flex items-center">
        <div
          className="h-full rounded-xl flex items-center justify-center text-white text-xs font-bold transition-all duration-500 min-w-[2rem]"
          style={{ width: `${Math.max(parseFloat(pctOfMax), 4)}%`, backgroundColor: color }}
        >
          {count > 0 && count}
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

  const exportCsv = async (type) => {
    try {
      const r = await reportsApi.export({ ...params, type })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = `${type}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const stageColors = ['#64748b', '#3B82F6', '#F59E0B', '#4f46e5', '#10B981']

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-gray-900">Reports</h1><p className="text-sm text-gray-500">Analytics and performance insights</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          <button onClick={() => exportCsv(tab === 'overview' ? 'leads' : 'payments')} className="btn-outline text-sm"><Download size={14} /> Export CSV</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
          {[['overview', 'Overview'], ['agents', 'Agent Performance'], ['funnel', 'Funnel'], ['roi', 'Source ROI'], ['forecast', '📈 Forecast']].map(([k, l]) => (
            <TabBtn key={k} active={tab === k} onClick={() => setTab(k)}>{l}</TabBtn>
          ))}
        </div>

        <div className="p-5">
          {/* Overview */}
          {tab === 'overview' && (ol ? <Spinner /> : overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Users, label: 'Total Leads', value: overview.total_leads, color: NAVY },
                  { icon: Target, label: 'Conversion Rate', value: `${overview.conversion_rate}%`, color: '#38A169', sub: `${overview.enrolled_leads} enrolled` },
                  { icon: IndianRupee, label: 'Revenue', value: `₹${(overview.total_revenue || 0).toLocaleString('en-IN')}`, color: SAFFRON },
                  { icon: TrendingUp, label: 'Avg Score', value: overview.avg_score, color: '#8B5CF6' },
                ].map(c => (
                  <div key={c.label} className="card flex items-start gap-3 p-4">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: c.color + '18' }}><c.icon size={18} style={{ color: c.color }} /></div>
                    <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-800 mt-0.5 tabular-nums">{c.value}</p>{c.sub && <p className="text-xs text-gray-400">{c.sub}</p>}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Source</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={overview.leads_by_source}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                      <Bar dataKey="value" fill={SAFFRON} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Status</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart><Pie data={overview.leads_by_status} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                      {(overview.leads_by_status || []).map((_, i) => <Cell key={i} fill={COLORS[i % 6]} />)}
                    </Pie><Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} /></PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}

          {/* Agents */}
          {tab === 'agents' && (al ? <Spinner /> : (
            <div className="space-y-5">
              {agents.slice(0, 3).length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Medal size={16} style={{ color: SAFFRON }} /> Top Performers</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {agents.slice(0, 3).map((a, i) => (
                      <div key={a.id} className="rounded-xl p-4 text-center border" style={{ borderColor: i === 0 ? SAFFRON : '#E5E7EB', backgroundColor: i === 0 ? '#eef2ff' : '#FAFAFA' }}>
                        <p className="text-2xl">{['🥇', '🥈', '🥉'][i]}</p>
                        <p className="font-semibold text-gray-800 text-sm mt-1">{a.name}</p>
                        <p className="text-xl font-bold mt-2" style={{ color: i === 0 ? SAFFRON : NAVY }}>{a.conversion_rate}%</p>
                        <p className="text-xs text-gray-400">conversion</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b text-xs text-gray-500">
                    <th className="text-left px-5 py-3 font-medium">Counsellor</th>
                    <th className="text-left px-5 py-3 font-medium">Assigned</th>
                    <th className="text-left px-5 py-3 font-medium">Tasks Done</th>
                    <th className="text-left px-5 py-3 font-medium">Converted</th>
                    <th className="text-left px-5 py-3 font-medium">Rate</th>
                  </tr></thead>
                  <tbody>
                    {agents.map(a => (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3"><p className="font-medium text-gray-800">{a.name}</p><p className="text-xs text-gray-400">{a.role}</p></td>
                        <td className="px-5 py-3 text-gray-600 tabular-nums">{a.leads_assigned}</td>
                        <td className="px-5 py-3 text-gray-600 tabular-nums">{a.tasks_completed}</td>
                        <td className="px-5 py-3 text-gray-600 tabular-nums">{a.leads_converted}</td>
                        <td className="px-5 py-3"><ConvBadge rate={parseFloat(a.conversion_rate)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Funnel — visual */}
          {tab === 'funnel' && (fl ? <Spinner /> : funnel && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Conversion Funnel</h3>
                <span className="text-xs text-gray-400">{funnel.total_leads} leads total</span>
              </div>
              <div className="space-y-3">
                {funnel.stages.map((s, i) => (
                  <FunnelStage
                    key={s.stage}
                    stage={s.stage}
                    count={s.count}
                    pctOfMax={parseFloat(s.pct_of_max || s.pct)}
                    pctOfTotal={s.pct_of_total || s.pct}
                    dropOff={s.drop_off}
                    color={stageColors[i]}
                  />
                ))}
              </div>
              {/* Stage-to-stage conversion summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                {funnel.stages.slice(1).map((s, i) => {
                  const prev = funnel.stages[i]
                  const rate = prev.count > 0 ? ((s.count / prev.count) * 100).toFixed(0) : 0
                  return (
                    <div key={s.stage} className="text-center">
                      <p className="text-xs text-gray-400">{prev.stage} → {s.stage}</p>
                      <p className="text-lg font-bold tabular-nums" style={{ color: parseInt(rate) >= 50 ? '#10B981' : parseInt(rate) >= 25 ? '#F59E0B' : '#E53E3E' }}>{rate}%</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Source ROI */}
          {tab === 'roi' && (rl ? <Spinner /> : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b text-xs text-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Source</th>
                  <th className="text-left px-5 py-3 font-medium">Total</th>
                  <th className="text-left px-5 py-3 font-medium">Qualified</th>
                  <th className="text-left px-5 py-3 font-medium">Enrolled</th>
                  <th className="text-left px-5 py-3 font-medium">Revenue</th>
                </tr></thead>
                <tbody>
                  {sourceRoi.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No data for this period</td></tr>}
                  {sourceRoi.map((r, i) => (
                    <tr key={r.source} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % 6] }} /><span className="font-medium text-gray-800">{r.source}</span></div></td>
                      <td className="px-5 py-3 text-gray-600 tabular-nums">{r.total_leads}</td>
                      <td className="px-5 py-3 text-gray-600 tabular-nums">{r.qualified_leads}</td>
                      <td className="px-5 py-3 text-gray-600 tabular-nums">{r.enrolled_leads}</td>
                      <td className="px-5 py-3 font-semibold text-gray-800 tabular-nums">₹{(r.total_revenue || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Revenue Forecast */}
          {tab === 'forecast' && (fcl ? <Spinner /> : forecast && (
            <div className="space-y-6 max-w-2xl">
              {/* Main forecast card */}
              <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Predicted Next Month Revenue</p>
                    <p className="text-4xl font-black text-indigo-700 mt-2 tabular-nums">₹{(forecast.predicted_revenue || 0).toLocaleString('en-IN')}</p>
                  </div>
                  {forecast.confidence && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full mt-1 ${CONFIDENCE_STYLES[forecast.confidence]?.bg} ${CONFIDENCE_STYLES[forecast.confidence]?.text}`}>
                      {CONFIDENCE_STYLES[forecast.confidence]?.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-500 mt-3">Based on {forecast.total_data_points} total leads and {forecast.enrolled_leads} enrolled</p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Pipeline Leads', value: forecast.pipeline_leads, sub: 'Applied + Qualified', color: '#4f46e5' },
                  { label: 'Avg Fee Paid', value: `₹${(forecast.avg_fee || 0).toLocaleString('en-IN')}`, sub: 'per enrolled lead', color: '#10B981' },
                  { label: 'Historical Rate', value: `${forecast.historical_conversion_rate}%`, sub: 'pipeline → enrolled', color: '#F59E0B' },
                ].map(c => (
                  <div key={c.label} className="card p-4 text-center">
                    <p className="text-xs text-gray-500">{c.label}</p>
                    <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: c.color }}>{c.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                Formula: <span className="font-mono text-gray-600">{forecast.pipeline_leads} leads × {forecast.historical_conversion_rate}% rate × ₹{(forecast.avg_fee || 0).toLocaleString('en-IN')} avg fee</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
