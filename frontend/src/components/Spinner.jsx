import React from 'react'

export default function Spinner({ size = 8 }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`animate-spin rounded-full h-${size} w-${size} border-4 border-t-transparent`}
        style={{ borderColor: '#4f46e5', borderTopColor: 'transparent' }} />
    </div>
  )
}
