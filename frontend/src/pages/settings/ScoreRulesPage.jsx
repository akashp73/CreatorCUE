import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, Check, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { scoreRulesApi } from '../../services/api'
import Spinner from '../../components/Spinner'

function RuleRow({ rule, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [pts, setPts] = useState(rule.points)
  const save = async () => {
    try { await scoreRulesApi.update(rule.id,{points:parseInt(pts)}); onUpdated(); toast.success('Updated'); setEditing(false) }
    catch { toast.error('Failed') }
  }
  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
      <td className="px-5 py-4">
        <span className="font-mono text-sm px-2 py-0.5 rounded" style={{ background: '#f3f4f6', color: 'var(--text-primary)' }}>{rule.activity_type}</span>
      </td>
      <td className="px-5 py-4">{editing ? (
        <div className="flex items-center gap-2">
          <input type="number" value={pts} onChange={e=>setPts(e.target.value)} className="w-20 px-2 py-1 rounded-lg text-sm text-center input" autoFocus/>
          <button onClick={save} className="p-1.5 rounded-lg text-white bg-green-500"><Check size={13}/></button>
          <button onClick={()=>{setPts(rule.points);setEditing(false)}} className="p-1.5 rounded-lg" style={{ background: '#f3f4f6', color: 'var(--text-secondary)' }}><X size={13}/></button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5' }}>+{rule.points} pts</span>
          <button onClick={()=>setEditing(true)} style={{ color: 'var(--text-muted)' }} className="hover:text-gray-600"><Edit3 size={14}/></button>
        </div>
      )}</td>
      <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(rule.created_at).toLocaleDateString()}</td>
    </tr>
  )
}

export default function ScoreRulesPage() {
  const qc = useQueryClient()
  const { data: rules = [], isLoading } = useQuery({ queryKey:['score-rules'], queryFn:()=>scoreRulesApi.getAll().then(r=>r.data) })
  const [newRule, setNewRule] = useState({ activity_type:'', points:'' })
  const add = async e => {
    e.preventDefault(); if(!newRule.activity_type||!newRule.points) return toast.error('Both fields required')
    try { await scoreRulesApi.create(newRule); setNewRule({activity_type:'',points:''}); qc.invalidateQueries(['score-rules']); toast.success('Rule added!') }
    catch { toast.error('Failed') }
  }
  if (isLoading) return <Spinner/>
  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Score Rules</h1>
      <form onSubmit={add} className="card p-4 flex gap-3">
        <input value={newRule.activity_type} onChange={e=>setNewRule({...newRule,activity_type:e.target.value})} placeholder="activity_type (e.g. video_watched)" className="input flex-1"/>
        <input type="number" value={newRule.points} onChange={e=>setNewRule({...newRule,points:e.target.value})} placeholder="Points" className="input w-24"/>
        <button type="submit" className="btn-primary flex items-center gap-1.5"><Plus size={14}/> Add</button>
      </form>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
            <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>Activity Type</th>
            <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>Points</th>
            <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>Created</th>
          </tr></thead>
          <tbody>{rules.map(r => <RuleRow key={r.id} rule={r} onUpdated={()=>qc.invalidateQueries(['score-rules'])}/>)}</tbody>
        </table>
      </div>
    </div>
  )
}
