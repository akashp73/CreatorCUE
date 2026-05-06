import React from 'react'

const MAP = {
  HOT:  { bg: 'bg-red-100',    text: 'text-red-700',    dot: '#E53E3E' },
  WARM: { bg: 'bg-orange-100', text: 'text-orange-700', dot: '#DD6B20' },
  COLD: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: '#3182CE' },
}

export default function ScoreBadge({ score, label }) {
  const resolvedLabel = label || (score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD')
  const s = MAP[resolvedLabel] || MAP.COLD
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {score !== undefined ? score : ''} {resolvedLabel}
    </span>
  )
}
