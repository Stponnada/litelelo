/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-poppins)', 'sans-serif'],
                raleway: ['var(--font-raleway)', 'sans-serif'],
                'rubik-glitch': ['var(--font-rubik-glitch)', 'cursive'],
            },
            colors: {
                'brand-green': 'rgb(var(--color-brand-green) / <alpha-value>)',
                'brand-green-darker': 'rgb(var(--color-brand-green-darker) / <alpha-value>)',
                'primary': 'rgb(var(--color-primary) / <alpha-value>)',
                'secondary': 'rgb(var(--color-secondary) / <alpha-value>)',
                'tertiary': 'rgb(var(--color-tertiary) / <alpha-value>)',
                'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
                'secondary-light': 'rgb(var(--color-secondary-light) / <alpha-value>)',
                'tertiary-light': 'rgb(var(--color-tertiary-light) / <alpha-value>)',
                'text-main': 'rgb(var(--color-text-main) / <alpha-value>)',
                'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
                'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
                'text-main-light': 'rgb(var(--color-text-main-light) / <alpha-value>)',
                'text-secondary-light': 'rgb(var(--color-text-secondary-light) / <alpha-value>)',
                'text-tertiary-light': 'rgb(var(--color-text-tertiary-light) / <alpha-value>)',
                'accent-red': 'rgb(var(--color-accent-red) / <alpha-value>)',
                'accent-orange': 'rgb(var(--color-accent-orange) / <alpha-value>)',
                'accent-yellow': 'rgb(var(--color-accent-yellow) / <alpha-value>)',
                'accent-emerald': 'rgb(var(--color-accent-emerald) / <alpha-value>)',
                'accent-teal': 'rgb(var(--color-accent-teal) / <alpha-value>)',
                'accent-sky': 'rgb(var(--color-accent-sky) / <alpha-value>)',
                'accent-blue': 'rgb(var(--color-accent-blue) / <alpha-value>)',
                'accent-indigo': 'rgb(var(--color-accent-indigo) / <alpha-value>)',
                'accent-purple': 'rgb(var(--color-accent-purple) / <alpha-value>)',
                'accent-gray': 'rgb(var(--color-accent-gray) / <alpha-value>)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/aspect-ratio'),
    ],
};
export default config;
