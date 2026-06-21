/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080c14',
          card: '#0d1421',
          border: '#1a2744',
          cyan: '#00d4ff',
          'cyan-dim': '#00d4ff22',
          green: '#10b981',
          red: '#ef4444',
          amber: '#f59e0b',
          purple: '#8b5cf6',
          orange: '#f97316',
          'text-primary': '#e2e8f0',
          'text-muted': '#64748b',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 5px #00d4ff33' },
          to: { boxShadow: '0 0 20px #00d4ff66, 0 0 40px #00d4ff22' },
        },
      },
    },
  },
  plugins: [],
}
