/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          black: '#0B0F14',
          ink: '#0F172A',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(29,185,84,0.35), 0 10px 40px rgba(29,185,84,0.12)',
      },
      backgroundImage: {
        'radial-spot': 'radial-gradient(600px circle at var(--x, 50%) var(--y, 0%), rgba(29,185,84,0.18), transparent 40%)',
      },
    },
  },
  plugins: [],
}

