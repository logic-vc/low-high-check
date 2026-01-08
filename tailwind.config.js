/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': {
          50: '#e6f7ff',
          100: '#b3e5ff',
          200: '#80d4ff',
          300: '#4dc2ff',
          400: '#1ab1ff',
          500: '#00ccff', // Main neon blue
          600: '#00a3cc',
          700: '#007a99',
          800: '#005266',
          900: '#002933',
          950: '#001a33', // Dark background
        }
      }
    },
  },
  plugins: [],
}
