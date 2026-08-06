/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#ffa201',
          50: '#fffbe6',
          100: '#fff3bf',
          200: '#ffe98f',
          300: '#ffdd59',
          400: '#ffcf2e',
          500: '#ffa201',
          600: '#e08a00',
          700: '#b86e00',
          800: '#8f5300',
          900: '#734200',
        },
        royal: {
          DEFAULT: '#a3e635',
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
        },
        night: {
          DEFAULT: '#0d0d0d',
          800: '#121212',
          700: '#1a1a1a',
          600: '#222222',
          500: '#2c2c2c',
          400: '#3a3a3a',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35)',
        card: '0 6px 24px rgba(0, 0, 0, 0.08)',
        'card-dark': '0 6px 24px rgba(0, 0, 0, 0.5)',
        glow: '0 0 40px rgba(255, 162, 1, 0.35)',
        'glow-royal': '0 0 45px rgba(163, 230, 53, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg, #ffdd59 0%, #ffa201 45%, #e08a00 100%)',
        'royal-gradient':
          'linear-gradient(135deg, #d9f99d 0%, #a3e635 45%, #65a30d 100%)',
        'royal-hero':
          'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 55%, #0d0d0d 100%)',
        'hero-gradient':
          'linear-gradient(180deg, rgba(13,13,13,0.88) 0%, rgba(34,34,34,0.6) 50%, rgba(13,13,13,0.94) 100%)',
      },
    },
  },
  plugins: [],
};
