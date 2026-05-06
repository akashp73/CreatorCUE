/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#1B2B4B',
        charcoal:'#2D3748',
        saffron: '#F6AD2B',
        hot:     '#E53E3E',
        warm:    '#DD6B20',
        cold:    '#3182CE',
        success: '#38A169',
        bg:      '#F7F8FC',
      },
    },
  },
  plugins: [],
}
