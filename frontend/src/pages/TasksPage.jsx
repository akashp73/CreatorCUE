import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Calendar, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { tasksApi } from '../services/api'
import Spinner from '../components/Spinner'

function TaskItem({ task, onComplete }) {
  const isOverdue = new Date(task.due_at) < new Date()
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl transition-all"
      style={{
        background: isOverdue ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <div className="flex-1 min-w-0">
        <Link to={`/leads/${task.lead?.id}`} className="text-xs font-semibold hover:underline" style={{ color: '#6366f1' }}>{task.lead?.name}</Link>
        <p className="text-sm font-medium mt-0.5" style={{ color: '#f1f5f9' }}>{task.title}</p>
        <div className="flex items-center gap-1 mt-1">
          <Calendar size={11} style={{ color: '#475569' }} />
          <p className="text-xs" style={{ color: '#94a3b8' }}>{new Date(task.due_at).toLocaleString()}</p>
          {isOverdue && (
            <span className="text-xs font-semibold flex items-center gap-0.5 ml-2" style={{ color: '#ef4444' }}>
              <AlertTriangle size={11} /> Overdue
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onComplete(task.id)}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#6366f1' }}>
        <Check size={12} /> Done
      </button>
    </div>
  )
}

function Section({ title, icon: Icon, tasks, color, onComplete }) {
  if (!tasks.length) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color }} />
        <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: color + '20', color }}>{tasks.length}</span>
      </div>
      <div className="space-y-2">{tasks.map(t => <TaskItem key={t.id} task={t} onComplete={onComplete} />)}</div>
    </div>
  )
}

export default function TasksPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['my-tasks'], queryFn: () => tasksApi.getMyTasks().then(r => r.data) })

  const complete = async (id) => {
    try { await tasksApi.complete(id); toast.success('Task completed!'); qc.invalidateQueries(['my-tasks']) }
    catch { toast.error('Failed') }
  }

  if (isLoading) return <Spinner />

  const { overdue = [], due_today = [], upcoming = [] } = data || {}
  const total = overdue.length + due_today.length + upcoming.length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <Check size={20} style={{ color: '#6366f1' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">My Tasks</h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>{total} pending tasks</p>
        </div>
      </div>

      {total === 0 && (
        <div className="text-center py-20" style={{ color: '#475569' }}>
          <Check size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">All caught up! No pending tasks.</p>
        </div>
      )}

      <Section title="Overdue" icon={AlertTriangle} tasks={overdue} color="#ef4444" onComplete={complete} />
      <Section title="Due Today" icon={Clock} tasks={due_today} color="#f59e0b" onComplete={complete} />
      <Section title="Upcoming" icon={Calendar} tasks={upcoming} color="#6366f1" onComplete={complete} />
    </div>
  )
}
