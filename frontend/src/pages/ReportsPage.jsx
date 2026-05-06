import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Users, TrendingUp, IndianRupee, Target, Medal } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportsApi } from '../services/api'
import Spinner from '../components/Spinner'

const NAVY='#1B2B4B', SAFFRON='#F6AD2B'
const COLORS=['#1B2B4B','#F6AD2B','#3182CE','#38A169','#E53E3E','#D69E2E']

function TabBtn({ active, onClick, children }) {
  return <button onClick={onClick} className={`px-5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${active?'text-gray-800':'border-transparent text-gray-500 hover:text-gray-700'}`} style={active?{borderColor:SAFFRON}:{}}>{children}</button>
}
function ConvBadge({ rate }) {
  const color = rate>=20?'#38A169':rate>=10?'#DD6B20':'#E53E3E'
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{backgroundColor:color+'18',color}}>{rate}%</span>
}

export default function ReportsPage() {
  const [tab, setTab] = useState('overview')
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now()-30*86400000).toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo)
  const [dateTo, setDateTo] = useState(today)
  const params = { date_from:dateFrom, date_to:dateTo }

  const { data: overview, isLoading: ol } = useQuery({ queryKey:['rep-overview',params], queryFn:()=>reportsApi.overview(params).then(r=>r.data), enabled: tab==='overview' })
  const { data: agents=[], isLoading: al } = useQuery({ queryKey:['rep-agents',params], queryFn:()=>reportsApi.agentPerf(params).then(r=>r.data), enabled: tab==='agents' })
  const { data: funnel, isLoading: fl } = useQuery({ queryKey:['rep-funnel',params], queryFn:()=>reportsApi.funnel(params).then(r=>r.data), enabled: tab==='funnel' })
  const { data: sourceRoi=[], isLoading: rl } = useQuery({ queryKey:['rep-roi',params], queryFn:()=>reportsApi.sourceRoi(params).then(r=>r.data), enabled: tab==='roi' })

  const exportCsv = async (type) => {
    try { const r = await reportsApi.export({...params,type}); const url=URL.createObjectURL(r.data); const a=document.createElement('a'); a.href=url; a.download=`${type}.csv`; a.click(); URL.revokeObjectURL(url) }
    catch { toast.error('Export failed') }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-gray-800">Reports</h1><p className="text-sm text-gray-500">Analytics and performance insights</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/>
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/>
          <button onClick={()=>exportCsv(tab==='overview'?'leads':'payments')} className="btn-outline text-sm"><Download size={14}/> Export CSV</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
          {[['overview','Overview'],['agents','Agent Performance'],['funnel','Funnel'],['roi','Source ROI']].map(([k,l])=>(
            <TabBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</TabBtn>
          ))}
        </div>
        <div className="p-5">
          {/* Overview */}
          {tab==='overview' && (ol ? <Spinner/> : overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[{icon:Users,label:'Total Leads',value:overview.total_leads,color:NAVY},{icon:Target,label:'Conversion Rate',value:`${overview.conversion_rate}%`,color:'#38A169',sub:`${overview.enrolled_leads} enrolled`},{icon:IndianRupee,label:'Revenue',value:`₹${(overview.total_revenue||0).toLocaleString('en-IN')}`,color:SAFFRON},{icon:TrendingUp,label:'Avg Score',value:overview.avg_score,color:'#8B5CF6'}].map(c=>(
                  <div key={c.label} className="card flex items-start gap-3 p-4">
                    <div className="p-2 rounded-xl" style={{backgroundColor:c.color+'18'}}><c.icon size={18} style={{color:c.color}}/></div>
                    <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-800 mt-0.5">{c.value}</p>{c.sub&&<p className="text-xs text-gray-400">{c.sub}</p>}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Source</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={overview.leads_by_source}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/>
                      <Bar dataKey="value" fill={SAFFRON} radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Status</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart><Pie data={overview.leads_by_status} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                      {(overview.leads_by_status||[]).map((_,i)=><Cell key={i} fill={COLORS[i%6]}/>)}
                    </Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}

          {/* Agents */}
          {tab==='agents' && (al ? <Spinner/> : (
            <div className="space-y-5">
              {agents.slice(0,3).length>0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Medal size={16} style={{color:SAFFRON}}/> Top Performers</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {agents.slice(0,3).map((a,i)=>(
                      <div key={a.id} className="rounded-xl p-4 text-center border" style={{borderColor:i===0?SAFFRON:'#E5E7EB',backgroundColor:i===0?'#FFFBEB':'#FAFAFA'}}>
                        <p className="text-2xl">{['🥇','🥈','🥉'][i]}</p>
                        <p className="font-semibold text-gray-800 text-sm mt-1">{a.name}</p>
                        <p className="text-xl font-bold mt-2" style={{color:i===0?SAFFRON:NAVY}}>{a.conversion_rate}%</p>
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
                    {agents.map(a=>(
                      <tr key={a.id} className="border-b border-gray-50">
                        <td className="px-5 py-3"><p className="font-medium text-gray-800">{a.name}</p><p className="text-xs text-gray-400">{a.role}</p></td>
                        <td className="px-5 py-3 text-gray-600">{a.leads_assigned}</td>
                        <td className="px-5 py-3 text-gray-600">{a.tasks_completed}</td>
                        <td className="px-5 py-3 text-gray-600">{a.leads_converted}</td>
                        <td className="px-5 py-3"><ConvBadge rate={parseFloat(a.conversion_rate)}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Funnel */}
          {tab==='funnel' && (fl ? <Spinner/> : funnel && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-6">Conversion Funnel</h3>
              <div className="space-y-4 max-w-2xl mx-auto">
                {funnel.stages.map((s,i)=>{
                  const pct = parseFloat(s.pct); const color = COLORS[i%6]
                  return (
                    <div key={s.stage}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-700">{s.stage}</span>
                        <div className="flex items-center gap-3">
                          {s.drop_off!==null && i>0 && <span className="text-red-400">↓ {s.drop_off}% drop-off</span>}
                          <span className="font-bold text-gray-800">{s.count} <span className="text-gray-400 font-normal">({s.pct}%)</span></span>
                        </div>
                      </div>
                      <div className="h-9 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="h-full rounded-lg flex items-center justify-center text-white text-xs font-bold transition-all" style={{width:`${Math.max(pct,2)}%`,backgroundColor:color,minWidth:s.count>0?40:0}}>{s.count>0&&s.count}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Source ROI */}
          {tab==='roi' && (rl ? <Spinner/> : (
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
                  {sourceRoi.length===0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No data for this period</td></tr>}
                  {sourceRoi.map((r,i)=>(
                    <tr key={r.source} className="border-b border-gray-50">
                      <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:COLORS[i%6]}}/><span className="font-medium text-gray-800">{r.source}</span></div></td>
                      <td className="px-5 py-3 text-gray-600">{r.total_leads}</td>
                      <td className="px-5 py-3 text-gray-600">{r.qualified_leads}</td>
                      <td className="px-5 py-3 text-gray-600">{r.enrolled_leads}</td>
                      <td className="px-5 py-3 font-semibold text-gray-800">₹{(r.total_revenue||0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
