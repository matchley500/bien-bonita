import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Seasonal accent families — actual RGB values live in globals.css
        // as CSS variables and change with the data-season attribute.
        parchment: 'rgb(var(--parchment) / <alpha-value>)',
        terracotta: {
          50:  'rgb(var(--terracotta-50) / <alpha-value>)',
          100: 'rgb(var(--terracotta-100) / <alpha-value>)',
          200: 'rgb(var(--terracotta-200) / <alpha-value>)',
          300: 'rgb(var(--terracotta-300) / <alpha-value>)',
          400: 'rgb(var(--terracotta-400) / <alpha-value>)',
          500: 'rgb(var(--terracotta-500) / <alpha-value>)',
          600: 'rgb(var(--terracotta-600) / <alpha-value>)',
          700: 'rgb(var(--terracotta-700) / <alpha-value>)',
          800: 'rgb(var(--terracotta-800) / <alpha-value>)',
          900: 'rgb(var(--terracotta-900) / <alpha-value>)',
        },
        teal: {
          50:  'rgb(var(--teal-50) / <alpha-value>)',
          100: 'rgb(var(--teal-100) / <alpha-value>)',
          200: 'rgb(var(--teal-200) / <alpha-value>)',
          300: 'rgb(var(--teal-300) / <alpha-value>)',
          400: 'rgb(var(--teal-400) / <alpha-value>)',
          500: 'rgb(var(--teal-500) / <alpha-value>)',
          600: 'rgb(var(--teal-600) / <alpha-value>)',
          700: 'rgb(var(--teal-700) / <alpha-value>)',
          800: 'rgb(var(--teal-800) / <alpha-value>)',
          900: 'rgb(var(--teal-900) / <alpha-value>)',
        },
        mustard: {
          50:  'rgb(var(--mustard-50) / <alpha-value>)',
          100: 'rgb(var(--mustard-100) / <alpha-value>)',
          200: 'rgb(var(--mustard-200) / <alpha-value>)',
          300: 'rgb(var(--mustard-300) / <alpha-value>)',
          400: 'rgb(var(--mustard-400) / <alpha-value>)',
          500: 'rgb(var(--mustard-500) / <alpha-value>)',
          600: 'rgb(var(--mustard-600) / <alpha-value>)',
          700: 'rgb(var(--mustard-700) / <alpha-value>)',
          800: 'rgb(var(--mustard-800) / <alpha-value>)',
          900: 'rgb(var(--mustard-900) / <alpha-value>)',
        },
        forest: {
          50:  '#edf4ed',
          100: '#d0e4d0',
          200: '#a3cba3',
          300: '#72ad72',
          400: '#4d9150',
          500: '#3D6B3D',
          600: '#30562f',
          700: '#254224',
          800: '#1a2e1a',
          900: '#0f1b0f',
        },
        sand:      'rgb(var(--sand) / <alpha-value>)',
        darkbrown: 'rgb(var(--darkbrown) / <alpha-value>)',
        cream:     'rgb(var(--cream) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-alfa)',     'serif'],
        script:  ['var(--font-pacifico)', 'cursive'],
        sub:     ['var(--font-playfair)', 'serif'],
        body:    ['var(--font-josefin)',  'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
