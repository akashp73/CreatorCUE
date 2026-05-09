/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#0f172a',
        charcoal:'#1e293b',
        saffron: '#4f46e5',
        accent:  '#4f46e5',
        hot:     '#E53E3E',
        warm:    '#f59e0b',
        cold:    '#3182CE',
        success: '#38A169',
        bg:      '#f8fafc',
      },
    },
  },
  plugins: [],
}
