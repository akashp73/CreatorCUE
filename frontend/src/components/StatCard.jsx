import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

const GLOW_COLORS = {
  blue:  { glow: 'rgba(99,102,241,0.2)',  border: 'rgba(99,102,241,0.25)', bg: 'rgba(99,102,241,0.1)' },
  green: { glow: 'rgba(16,185,129,0.2)',  border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.1)' },
  red:   { glow: 'rgba(239,68,68,0.2)',   border: 'rgba(239,68,68,0.25)',  bg: 'rgba(239,68,68,0.1)' },
  gold:  { glow: 'rgba(245,158,11,0.2)',  border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.1)' },
  purple:{ glow: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.25)', bg: 'rgba(139,92,246,0.1)' },
}

export default function StatCard({ icon: Icon, label, value, color, sub, glow = 'blue', to }) {
  const g = GLOW_COLORS[glow] || GLOW_COLORS.blue

  const inner = (
    <div
      className="rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${g.border}`,
        boxShadow: `0 0 20px ${g.glow}, var(--card-shadow)`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: g.bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        <TrendingUp size={14} style={{ color, opacity: 0.4 }} />
      </div>
      <p className="text-3xl font-black tabular-nums" style={{ color }}>{value ?? '—'}</p>
      <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )

  return to ? <Link to={to} className="block">{inner}</Link> : inner
}
