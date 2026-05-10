import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Sliders, Trash2, Plus, Info, ArrowRight, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { assignmentApi, teamApi } from '../../services/api'
import Spinner from '../../components/Spinner'

const RULE_TYPES = ['COURSE', 'CITY']

function ModeToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-xl p-1 w-fit" style={{ background: '#f3f4f6' }}>
      {['MANUAL', 'AUTOMATIC'].map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
          style={value === m
            ? { background: '#ffffff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
            : { color: 'var(--text-secondary)' }}
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
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,70,229,0.1)' }}>
          <UserCheck size={20} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Lead Assignment</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Control how incoming leads are assigned to counsellors</p>
        </div>
      </div>

      {/* Mode + counsellors */}
      <div className="card space-y-5">
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>Assignment Mode</h3>
          <ModeToggle value={displayMode} onChange={v => setMode(v)} />
          {displayMode === 'MANUAL' && (
            <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Info size={12} /> Leads from webhooks will be unassigned. Counsellors are assigned manually from the lead profile.
            </p>
          )}
        </div>

        {displayMode === 'AUTOMATIC' && (
          <>
            <div className="pt-5" style={{ borderTop: '1px solid #f3f4f6' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Counsellor Ratios</h3>
                <button onClick={setEqualDistribution} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#4f46e5' }}>
                  <RefreshCw size={12} /> Equal distribution
                </button>
              </div>

              {displayCounsellors.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No active counsellors found</p>
              ) : (
                <div className="space-y-3">
                  {displayCounsellors.map(c => {
                    const pct = totalRatio > 0 ? Math.round((Number(c.ratio) / totalRatio) * 100) : 0
                    return (
                      <div key={c.user_id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#111827' }}>
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 rounded-full flex-1 overflow-hidden" style={{ background: '#f3f4f6' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#4f46e5' }} />
                            </div>
                            <span className="text-xs w-8 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg px-2 py-1.5" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ratio</span>
                          <input
                            type="number" min="0" max="99"
                            value={c.ratio}
                            onChange={e => updateRatio(c.user_id, e.target.value)}
                            className="w-10 text-center text-sm font-semibold bg-transparent focus:outline-none"
                            style={{ color: 'var(--text-primary)' }}
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
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.2)' }}>
                <ArrowRight size={14} style={{ color: '#4f46e5', flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#4f46e5' }}>
                  Next lead goes to: <span className="font-bold">{nextAssignee.name}</span>
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-1">
          <button onClick={saveConfig} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Rules section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Assignment Rules</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Rules take priority over round-robin when mode is Automatic</p>
          </div>
          <button onClick={() => setAddingRule(v => !v)} className="btn-outline text-xs py-1.5 px-3">
            <Plus size={13} /> Add Rule
          </button>
        </div>

        {/* Add rule form */}
        {addingRule && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select value={newRule.rule_type} onChange={e => setNewRule({ ...newRule, rule_type: e.target.value })} className="input w-full">
                  {RULE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  {newRule.rule_type === 'COURSE' ? 'Course contains' : 'City equals'}
                </label>
                <input value={newRule.match_value} onChange={e => setNewRule({ ...newRule, match_value: e.target.value })} placeholder={newRule.rule_type === 'COURSE' ? 'MBA, B.Tech…' : 'Mumbai'} className="input w-full" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Assign to</label>
                <select value={newRule.assigned_to} onChange={e => setNewRule({ ...newRule, assigned_to: e.target.value })} className="input w-full">
                  <option value="">Select…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddingRule(false)} className="text-sm px-3 py-1.5" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={createRule} className="btn-primary text-xs py-1.5 px-4">Add Rule</button>
            </div>
          </div>
        )}

        {/* Rules list */}
        {rl ? <Spinner size={5} /> : rules.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No rules yet — round-robin handles all leads</p>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: '1px solid #f3f4f6', background: '#fafafa' }}>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full`}
                  style={rule.rule_type === 'COURSE'
                    ? { background: 'rgba(37,99,235,0.1)', color: '#1d4ed8' }
                    : { background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
                  {rule.rule_type}
                </div>
                <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                  {rule.rule_type === 'COURSE' ? 'Course contains' : 'City is'}{' '}
                  <span className="font-semibold">"{rule.match_value}"</span>
                  {' → '}
                  <span className="font-semibold" style={{ color: '#4f46e5' }}>{rule.assignee?.name}</span>
                </p>
                <button onClick={() => deleteRule(rule.id)} className="p-1 transition-colors" style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
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
