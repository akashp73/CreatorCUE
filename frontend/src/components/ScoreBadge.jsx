import React from 'react'

const MAP = {
  HOT:  { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)',   dot: '#ef4444' },
  WARM: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  COLD: { bg: 'rgba(99,102,241,0.15)',  color: '#a5b4fc', border: 'rgba(99,102,241,0.3)',  dot: '#6366f1' },
}

export default function ScoreBadge({ score, label }) {
  const resolvedLabel = label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const s = MAP[resolvedLabel] || MAP.COLD
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {score !== undefined ? score : ''} {resolvedLabel}
    </span>
  )
}
