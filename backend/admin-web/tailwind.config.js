/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2BE2FA',
          dark: '#1FCCE0',
          light: '#E0F9FD',
        },
        secondary: '#10B981',
      },
    },
  },
  plugins: [],
}
