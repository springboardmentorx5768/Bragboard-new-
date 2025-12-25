/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brag-primary': '#0D9488',
        'brag-secondary': '#14B8A6', 
        'brag-bg': '#F0FDF4',
        'brag-text': '#1F2937',
      },
    },
  },
  plugins: [],
}