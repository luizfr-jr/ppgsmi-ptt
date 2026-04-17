/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ninma: {
          teal: '#5fc3ad',
          'teal-dark': '#4aaa94',
          'teal-light': '#d4f0ea',
          purple: '#756fb3',
          'purple-dark': '#5d5896',
          'purple-light': '#e8e7f4',
          orange: '#f9a870',
          'orange-dark': '#e8895a',
          'orange-light': '#fde8d6',
          pink: '#f05a72',
          'pink-dark': '#d94460',
          'pink-light': '#fde0e5',
          dark: '#1e1e2e',
          'dark-2': '#2d2d44',
          gray: '#6b7280',
          'gray-light': '#f8fafc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
