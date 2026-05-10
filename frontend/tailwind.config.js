/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#000000',
        charcoal:'#111827',
        saffron: '#7c3aed',
        accent:  '#7c3aed',
        hot:     '#ef4444',
        warm:    '#f59e0b',
        cold:    '#3b82f6',
        success: '#10b981',
        bg:      '#f5f5f5',
        surface: '#ffffff',
        purple:  '#7c3aed',
      },
    },
  },
  plugins: [],
}
