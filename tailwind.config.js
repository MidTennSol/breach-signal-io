/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A8A',
        },
        accent: {
          DEFAULT: '#2DD4BF',
        },
        textdark: {
          DEFAULT: '#1E293B',
        },
        background: {
          DEFAULT: '#F1F5F9',
        },
        highlight: {
          DEFAULT: '#F87171',
        },
      },
    },
  },
  plugins: [],
} 