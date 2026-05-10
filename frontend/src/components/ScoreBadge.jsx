import React from 'react'

const MAP = {
  HOT:  { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
  WARM: { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', border: 'rgba(245,158,11,0.2)' },
  COLD: { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb', border: 'rgba(59,130,246,0.2)' },
}

export default function ScoreBadge({ score, label }) {
  const resolvedLabel = label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const s = MAP[resolvedLabel] || MAP.COLD
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {score !== undefined ? score : ''} {resolvedLabel}
    </span>
  )
}
