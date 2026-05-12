/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#FF4DA6',
          purple: '#7B3FF2',
          blue: '#00D1FF',
        },
        bg: {
          DEFAULT: '#0A0A12',
          surface: '#12121A',
          card: '#1C1C28',
          border: '#2A2A38',
        },
        ink: {
          DEFAULT: '#FFFFFF',
          secondary: '#B8B8CC',
          disabled: '#6B6B80',
        },
        status: {
          success: '#00C853',
          error: '#FF5252',
        },
        glass: {
          surface: 'rgba(20,20,32,0.55)',
          'surface-light': 'rgba(28,28,44,0.45)',
          border: 'rgba(255,255,255,0.10)',
          'border-strong': 'rgba(255,255,255,0.18)',
          highlight: 'rgba(255,255,255,0.04)',
        },
      },
      borderRadius: {
        xl2: '14px',
        '2xl': '18px',
        '3xl': '22px',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
};
