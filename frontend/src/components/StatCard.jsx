import React from 'react'
import { Link } from 'react-router-dom'

const GLOW = {
  purple: { circle: 'rgba(124,58,237,0.12)', color: '#7c3aed' },
  blue:   { circle: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  green:  { circle: 'rgba(16,185,129,0.12)', color: '#10b981' },
  orange: { circle: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  red:    { circle: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}

export default function StatCard({ icon: Icon, label, value, glow = 'blue', to, sub }) {
  const g = GLOW[glow] || GLOW.blue

  const inner = (
    <div className="card flex items-center gap-4 cursor-pointer transition-shadow hover:shadow-md">
      <div className="stat-icon" style={{ background: g.circle }}>
        <Icon size={20} style={{ color: g.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 700, color: g.color, margin: 0, lineHeight: 1, letterSpacing: '-0.5px' }}>
          {value ?? '—'}
        </p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )

  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}
