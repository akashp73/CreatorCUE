import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Edit3, X, Phone, TrendingUp, Clock, Coffee, Video, Wifi, WifiOff, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { teamApi } from '../../services/api'
import Spinner from '../../components/Spinner'

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',      color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: Wifi },
  ON_BREAK:  { label: 'On Break',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Coffee },
  IN_MEETING:{ label: 'In Meeting',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: Video },
  OFFLINE:   { label: 'Offline',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)',  icon: WifiOff },
}

const ROLE_COLORS = {
  ADMIN:     { color: '#4f46e5', bg: 'rgba(99,102,241,0.1)' },
  MANAGER:   { color: '#0284c7', bg: 'rgba(56,189,248,0.1)' },
  COUNSELLOR:{ color: '#059669', bg: 'rgba(16,185,129,0.1)' },
}

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user?.id
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '', role: user?.role || 'COUNSELLOR', is_active: user?.is_active !== false })
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!form.name || (!isEdit && (!form.email || !form.password))) return toast.error('Fill required fields')
    setSaving(true)
    try {
      isEdit ? await teamApi.update(user.id, form) : await teamApi.create(form)
      toast.success(isEdit ? 'Updated!' : 'Member added!')
      onSaved(); onClose()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{isEdit ? 'Edit Member' : 'Add Team Member'}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
          {!isEdit && <>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" /></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Password *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" /></div>
          </>}
          <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input">
              <option value="COUNSELLOR">Counsellor</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {isEdit && <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="is_active" className="text-sm" style={{ color: 'var(--text-primary)' }}>Active</label>
          </div>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1 py-2.5 justify-center">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2.5 justify-center">{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Member'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserCard({ user, onEdit, onStatusChange }) {
  const roleC = ROLE_COLORS[user.role] || ROLE_COLORS.COUNSELLOR
  const breakMins = user.break_start ? Math.floor((Date.now() - new Date(user.break_start).getTime()) / 60000) : null

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base relative"
            style={{ background: '#111827', color: 'white' }}>
            {user.name?.[0]?.toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: STATUS_CONFIG[user.status]?.color || '#6b7280', borderColor: '#ffffff' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
        </div>
        <button onClick={() => onEdit(user)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Edit3 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: roleC.bg, color: roleC.color }}>{user.role}</span>
        <StatusDot status={user.status} />
        {breakMins !== null && <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>{breakMins}min break</span>}
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid #f3f4f6' }}>
        <div className="text-center">
          <p className="text-lg font-black" style={{ color: '#4f46e5' }}>{user.calls_today || 0}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Calls</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black" style={{ color: '#2563eb' }}>{user.leads_contacted || 0}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Leads</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black" style={{ color: '#059669' }}>{user.conversions || 0}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Converted</p>
        </div>
      </div>

      {/* Status Quick Change */}
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon
          const isCurrent = user.status === status
          return (
            <button key={status} onClick={() => !isCurrent && onStatusChange(user.id, status)}
              disabled={isCurrent}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={isCurrent
                ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, cursor: 'default' }
                : { background: '#f9fafb', color: 'var(--text-secondary)', border: '1px solid #e5e7eb' }
              }>
              <Icon size={11} /> {cfg.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [editUser, setEditUser] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: () => teamApi.getAll().then(r => r.data),
    refetchInterval: 30000,
  })

  const handleStatusChange = async (userId, status) => {
    try {
      await teamApi.updateStatus(userId, status)
      qc.invalidateQueries(['team-users'])
      toast.success('Status updated')
    } catch { toast.error('Failed') }
  }

  if (isLoading) return <Spinner />

  const totalActive = users.filter(u => u.status === 'ACTIVE').length
  const onBreak = users.filter(u => u.status === 'ON_BREAK').length
  const totalCalls = users.reduce((s, u) => s + (u.calls_today || 0), 0)
  const totalConversions = users.reduce((s, u) => s + (u.conversions || 0), 0)

  return (
    <div className="space-y-6">
      {(showModal || editUser) && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null) }}
          onSaved={() => qc.invalidateQueries(['team-users'])}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Users size={20} /> Team Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{users.length} members · {totalActive} active</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Add Member</button>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Online Now', value: totalActive, color: '#059669' },
          { label: 'On Break', value: onBreak, color: '#d97706' },
          { label: 'Calls Today', value: totalCalls, color: '#4f46e5' },
          { label: 'Converted Today', value: totalConversions, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={u => setEditUser(u)}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {users.length === 0 && (
        <div className="card p-12 text-center">
          <Users size={40} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No team members yet</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">Add First Member</button>
        </div>
      )}
    </div>
  )
}
