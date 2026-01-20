export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0e27',
        'dark-secondary': '#1a1f3a',
        'accent-blue': '#3b82f6',
        'accent-cyan': '#06b6d4',
      },
      backdropBlur: {
        'xl': '20px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
