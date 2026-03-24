/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#00A884', dark: '#007A63' },
        secondary: '#1A1A2E',
        accent: '#FFD700',
        bg: '#F0F2F5',
        'bg-card': '#FFFFFF',
        'text-primary': '#111B21',
        'text-secondary': '#667781',
        success: '#25D366',
        warning: '#FFA500',
        danger: '#FF4444',
        border: '#E9EDEF'
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
