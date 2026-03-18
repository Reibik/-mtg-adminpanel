/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#7c6ff7', light: '#9b8fff', dark: '#5a4fd4' },
        accent: { DEFAULT: '#38bdf8', light: '#7dd3fc', dark: '#0ea5e9' },
        success: '#34d399',
        danger: '#fb7185',
        warning: '#fbbf24',
        surface: { DEFAULT: '#1a1a3e', light: '#232350', dark: '#0f0f23' },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
