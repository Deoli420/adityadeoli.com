/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  safelist: [
    // Dynamic color classes used via template literals in components
    'text-cyber-violet',
    'text-cyber-cyan',
    'text-cyber-pink',
    'text-cyber-violet/60',
    'text-cyber-cyan/60',
    'text-cyber-pink/60',
    'bg-cyber-violet/10',
    'bg-cyber-cyan/10',
    'bg-cyber-pink/10',
    'border-cyber-violet/20',
    'border-cyber-cyan/20',
    'border-cyber-pink/20',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      colors: {
        cyber: {
          black: '#0f0f23',
          violet: '#8e44ec',
          cyan: '#00fff7',
          purple: '#b026ff',
          pink: '#ff2a6d',
          yellow: '#f1fa8c',
        },
      },
      keyframes: {
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
            opacity: '1',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
            opacity: '0.4',
          },
        },
      },
      animation: {
        glitch: 'glitch 0.3s ease-in-out infinite',
        flicker: 'flicker 2s linear infinite',
      },
    },
  },
  plugins: [],
};