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
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="px-5 py-4 font-mono text-sm text-purple-700 bg-purple-50 rounded-lg mr-2">{rule.activity_type}</td>
      <td className="px-5 py-4">{editing ? (
        <div className="flex items-center gap-2">
          <input type="number" value={pts} onChange={e=>setPts(e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none" autoFocus/>
          <button onClick={save} className="p-1.5 rounded-lg text-white bg-green-500"><Check size={13}/></button>
          <button onClick={()=>{setPts(rule.points);setEditing(false)}} className="p-1.5 rounded-lg bg-gray-200 text-gray-600"><X size={13}/></button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold" style={{backgroundColor:'#F6AD2B20',color:'#F6AD2B'}}>+{rule.points} pts</span>
          <button onClick={()=>setEditing(true)} className="text-gray-400 hover:text-gray-600"><Edit3 size={14}/></button>
        </div>
      )}</td>
      <td className="px-5 py-4 text-xs text-gray-400">{new Date(rule.created_at).toLocaleDateString()}</td>
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
      <h1 className="text-xl font-bold text-gray-800">Score Rules</h1>
      <form onSubmit={add} className="card p-4 flex gap-3">
        <input value={newRule.activity_type} onChange={e=>setNewRule({...newRule,activity_type:e.target.value})} placeholder="activity_type (e.g. video_watched)" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/>
        <input type="number" value={newRule.points} onChange={e=>setNewRule({...newRule,points:e.target.value})} placeholder="Points" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"/>
        <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{backgroundColor:'#F6AD2B'}}><Plus size={14}/> Add</button>
      </form>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
            <th className="text-left px-5 py-3 font-medium">Activity Type</th>
            <th className="text-left px-5 py-3 font-medium">Points</th>
            <th className="text-left px-5 py-3 font-medium">Created</th>
          </tr></thead>
          <tbody>{rules.map(r => <RuleRow key={r.id} rule={r} onUpdated={()=>qc.invalidateQueries(['score-rules'])}/>)}</tbody>
        </table>
      </div>
    </div>
  )
}
