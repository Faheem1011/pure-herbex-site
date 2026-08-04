/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sun: {
          yellow: '#F5B014',
          'yellow-light': '#FFDE6A',
          'yellow-bright': '#FFC107',
          sand: '#FAF5EB',
          'sand-dark': '#F2E9D8',
          cream: '#FFFDF9',
          dark: '#2C1E14',
          brown: '#4A3525',
          teal: '#009688',
          coral: '#FF6B52',
          green: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        handwriting: ['Caveat', 'cursive', 'sans-serif']
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px #2C1E14',
        'retro-lg': '6px 6px 0px 0px #2C1E14',
        'retro-sm': '2px 2px 0px 0px #2C1E14',
        'sun-glow': '0 10px 30px -5px rgba(245, 176, 20, 0.4)'
      }
    },
  },
  plugins: [],
}
