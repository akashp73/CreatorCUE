import React from 'react'

export default function Spinner({ size = 8 }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`animate-spin rounded-full h-${size} w-${size} border-2`}
        style={{
          borderColor: 'rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1',
          boxShadow: '0 0 10px rgba(99,102,241,0.3)',
        }}
      />
    </div>
  )
}
