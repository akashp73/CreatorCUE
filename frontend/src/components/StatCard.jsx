import React from 'react'
import { Link } from 'react-router-dom'

export default function StatCard({ icon: Icon, label, value, color, sub, iconBg, to }) {
  const inner = (
    <div
      className={`card flex items-start gap-4 transition-all duration-200 ${
        to ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-100' : ''
      }`}
    >
      <div
        className="p-3 rounded-xl flex-shrink-0"
        style={{ backgroundColor: iconBg || color + '18' }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold mt-0.5 text-gray-800 tabular-nums">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )

  return to ? <Link to={to} className="block">{inner}</Link> : inner
}
