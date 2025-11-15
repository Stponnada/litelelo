// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'], 
        // --- ADDED RUBIK GLITCH FONT UTILITY ---
        'rubik-glitch': ['"Rubik Glitch"', 'cursive'],
      },
      colors: {
        'brand-green': 'rgb(var(--color-brand-green) / <alpha-value>)',
        'brand-green-darker': 'rgb(var(--color-brand-green-darker) / <alpha-value>)',
        
        // Backgrounds
        'primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'secondary': 'rgb(var(--color-secondary) / <alpha-value>)',
        'tertiary': 'rgb(var(--color-tertiary) / <alpha-value>)',

        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
        'secondary-light': 'rgb(var(--color-secondary-light) / <alpha-value>)',
        'tertiary-light': 'rgb(var(--color-tertiary-light) / <alpha-value>)',

        // Text
        'text-main': 'rgb(var(--color-text-main) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',

        'text-main-light': 'rgb(var(--color-text-main-light) / <alpha-value>)',
        'text-secondary-light': 'rgb(var(--color-text-secondary-light) / <alpha-value>)',
        'text-tertiary-light': 'rgb(var(--color-text-tertiary-light) / <alpha-value>)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}