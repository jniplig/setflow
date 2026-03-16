/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Setflow dark DJ booth palette
        surface: {
          900: '#0a0a0b',
          800: '#111114',
          700: '#1a1a1f',
          600: '#242429',
        },
        accent: {
          DEFAULT: '#f97316', // orange — EQ meter / active state
          dim: '#7c3010',
        },
        muted: '#4a4a55',
      },
      fontFamily: {
        display: ['"DM Mono"', 'monospace'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
