/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    container: {
      padding: '0.75rem',
      screens: {
        sm: '540px',
        md: '720px',
        lg: '960px',
        xl: '1140px',
        xxl: '1320px',
      },
    },
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      xxl: '1400px',
    },
    extend: {
      fontFamily: {
        sans: ['Noto Sans TC', ...defaultTheme.fontFamily.sans],
        mantou: ['Mantou', 'sans-serif'],
      },
      colors: {
        product: {
          primary: '#D4009B',
          'text-primary': '#334155',
          'text-secondary': '#64748B',
          bg: '#E9ECEF',
          hover: '#F8F9FA',
          line: '#DEE2E6',
        },
        role: {
          1: '#8082FF',
          2: '#F4A76F',
          3: '#57D2A9',
        },
        gray: {
          100: '#F8F9FA',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          800: '#343A40',
        },
      },
    },
  },
  plugins: [],
};
