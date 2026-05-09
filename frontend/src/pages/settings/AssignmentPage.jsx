import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Sliders, Trash2, Plus, Info, ArrowRight, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { assignmentApi, teamApi } from '../../services/api'
import Spinner from '../../components/Spinner'

const RULE_TYPES = ['COURSE', 'CITY']

function ModeToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
      {['MANUAL', 'AUTOMATIC'].map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            value === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {m === 'MANUAL' ? '✋ Manual' : '⚡ Automatic'}
        </button>
      ))}
    </div>
  )
}

export default function AssignmentPage() {
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [addingRule, setAddingRule] = useState(false)
  const [newRule, setNewRule] = useState({ rule_type: 'COURSE', match_value: '', assigned_to: '' })

  const { data: config, isLoading: cl } = useQuery({ queryKey: ['assignment-config'], queryFn: () => assignmentApi.getConfig().then(r => r.data) })
  const { data: rules = [], isLoading: rl } = useQuery({ queryKey: ['assignment-rules'], queryFn: () => assignmentApi.getRules().then(r => r.data) })
  const { data: users = [] } = useQuery({ queryKey: ['team'], queryFn: () => teamApi.getAll().then(r => r.data) })

  const [mode, setMode] = useState(null)
  const [counsellors, setCounsellors] = useState(null)

  // Initialise local state from fetched config
  const displayMode = mode ?? config?.mode ?? 'MANUAL'
  const displayCounsellors = counsellors ?? config?.counsellors ?? []

  const totalRatio = displayCounsellors.reduce((s, c) => s + (Number(c.ratio) || 0), 0)

  const nextAssignee = useMemo(() => {
    if (displayMode !== 'AUTOMATIC' || !displayCounsellors.length) return null
    const active = displayCounsellors.filter(c => c.ratio > 0)
    if (!active.length) return null
    let pool = active.filter(c => (c.remaining || 0) > 0)
    if (!pool.length) pool = active
    pool = [...pool].sort((a, b) => (b.remaining || 0) - (a.remaining || 0))
    const uid = pool[0]?.user_id
    return displayCounsellors.find(c => c.user_id === uid)
  }, [displayMode, displayCounsellors])

  const setEqualDistribution = () => {
    setCounsellors(prev => (prev ?? config?.counsellors ?? []).map(c => ({ ...c, ratio: 1, remaining: 1 })))
  }

  const updateRatio = (user_id, ratio) => {
    const val = Math.max(0, parseInt(ratio) || 0)
    setCounsellors(prev => (prev ?? config?.counsellors ?? []).map(c =>
      c.user_id === user_id ? { ...c, ratio: val, remaining: val } : c
    ))
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      await assignmentApi.updateConfig({ mode: displayMode, counsellors: displayCounsellors })
      toast.success('Assignment config saved!')
      qc.invalidateQueries(['assignment-config'])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally { setSaving(false) }
  }

  const deleteRule = async (id) => {
    try {
      await assignmentApi.deleteRule(id)
      toast.success('Rule deleted')
      qc.invalidateQueries(['assignment-rules'])
    } catch { toast.error('Failed to delete rule') }
  }

  const createRule = async () => {
    if (!newRule.match_value.trim() || !newRule.assigned_to) return toast.error('Fill all fields')
    try {
      await assignmentApi.addRule(newRule)
      toast.success('Rule added!')
      setNewRule({ rule_type: 'COURSE', match_value: '', assigned_to: '' })
      setAddingRule(false)
      qc.invalidateQueries(['assignment-rules'])
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  if (cl) return <Spinner />

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
          <UserCheck size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lead Assignment</h1>
          <p className="text-sm text-gray-500">Control how incoming leads are assigned to counsellors</p>
        </div>
      </div>

      {/* Mode + counsellors */}
      <div className="card space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-3">Assignment Mode</p>
          <ModeToggle value={displayMode} onChange={v => setMode(v)} />
          {displayMode === 'MANUAL' && (
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
              <Info size={12} /> Leads from webhooks will be unassigned. Counsellors are assigned manually from the lead profile.
            </p>
          )}
        </div>

        {displayMode === 'AUTOMATIC' && (
          <>
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">Counsellor Ratios</p>
                <button onClick={setEqualDistribution} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  <RefreshCw size={12} /> Equal distribution
                </button>
              </div>

              {displayCounsellors.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No active counsellors found</p>
              ) : (
                <div className="space-y-3">
                  {displayCounsellors.map(c => {
                    const pct = totalRatio > 0 ? Math.round((Number(c.ratio) / totalRatio) * 100) : 0
                    return (
                      <div key={c.user_id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#4f46e5' }}>
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 bg-gray-100 rounded-full flex-1 overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right tabular-nums">{pct}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                          <span className="text-xs text-gray-500">Ratio</span>
                          <input
                            type="number" min="0" max="99"
                            value={c.ratio}
                            onChange={e => updateRatio(c.user_id, e.target.value)}
                            className="w-10 text-center text-sm font-semibold bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Preview */}
            {nextAssignee && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                <ArrowRight size={14} className="text-indigo-500 flex-shrink-0" />
                <p className="text-sm text-indigo-700">
                  Next lead goes to: <span className="font-bold">{nextAssignee.name}</span>
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-1">
          <button onClick={saveConfig} disabled={saving} className="btn-gold text-sm">
            {saving ? 'Saving…' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Rules section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Assignment Rules</p>
            <p className="text-xs text-gray-500 mt-0.5">Rules take priority over round-robin when mode is Automatic</p>
          </div>
          <button onClick={() => setAddingRule(v => !v)} className="btn-outline text-xs py-1.5 px-3">
            <Plus size={13} /> Add Rule
          </button>
        </div>

        {/* Add rule form */}
        {addingRule && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                <select value={newRule.rule_type} onChange={e => setNewRule({ ...newRule, rule_type: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white">
                  {RULE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {newRule.rule_type === 'COURSE' ? 'Course contains' : 'City equals'}
                </label>
                <input value={newRule.match_value} onChange={e => setNewRule({ ...newRule, match_value: e.target.value })} placeholder={newRule.rule_type === 'COURSE' ? 'MBA, B.Tech…' : 'Mumbai'} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Assign to</label>
                <select value={newRule.assigned_to} onChange={e => setNewRule({ ...newRule, assigned_to: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white">
                  <option value="">Select…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddingRule(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
              <button onClick={createRule} className="btn-gold text-xs py-1.5 px-4">Add Rule</button>
            </div>
          </div>
        )}

        {/* Rules list */}
        {rl ? <Spinner size={5} /> : rules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No rules yet — round-robin handles all leads</p>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${rule.rule_type === 'COURSE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {rule.rule_type}
                </div>
                <p className="text-sm text-gray-700 flex-1">
                  {rule.rule_type === 'COURSE' ? 'Course contains' : 'City is'}{' '}
                  <span className="font-semibold">"{rule.match_value}"</span>
                  {' → '}
                  <span className="font-semibold text-indigo-700">{rule.assignee?.name}</span>
                </p>
                <button onClick={() => deleteRule(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
