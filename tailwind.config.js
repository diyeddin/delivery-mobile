/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  // NOTE: Point this to where your files will be
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          100: '#F9F1D8',
          200: '#F0DEAA',
          300: '#E6CB7D',
          400: '#D4AF37', // The Classic Gold
          500: '#C5A028',
          600: '#A3841F',
          700: '#826919',
          800: '#614E12',
          900: '#40340C',
        },
        onyx: '#0F0F0F', // Deep Black
        creme: '#F5F5F0', // Light Background
      },
      fontFamily: {
        serif: ['PlayfairDisplay_400Regular'],
      },
    },
  },
  plugins: [],
}