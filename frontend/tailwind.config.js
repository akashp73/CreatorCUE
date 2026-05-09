/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#0f172a',
        charcoal:'#1e293b',
        saffron: '#6366f1',
        accent:  '#6366f1',
        hot:     '#ef4444',
        warm:    '#f59e0b',
        cold:    '#3b82f6',
        success: '#10b981',
        bg:      '#0f172a',
        surface: 'rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        '20px': '20px',
      },
    },
  },
  plugins: [],
}
