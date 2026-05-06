import React from 'react'

export default function StatCard({ icon: Icon, label, value, color, sub, iconBg }) {
  return (
    <div className="card flex items-start gap-4">
      <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: iconBg || color + '18' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold mt-0.5 text-gray-800">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
