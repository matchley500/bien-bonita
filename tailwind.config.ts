import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#F5EDD6',
        terracotta: {
          50:  '#fdf3ec',
          100: '#fae3d0',
          200: '#f4c09a',
          300: '#eb9763',
          400: '#df7338',
          500: '#C4622D',
          600: '#a84e22',
          700: '#8a3d1a',
          800: '#6e2f14',
          900: '#3d1908',
        },
        teal: {
          50:  '#edf4f4',
          100: '#d0e5e4',
          200: '#a3cbca',
          300: '#74adab',
          400: '#5C9896',
          500: '#4A8280',
          600: '#3a6b69',
          700: '#2d5453',
          800: '#213f3e',
          900: '#142726',
        },
        mustard: {
          50:  '#fdf8e7',
          100: '#faefc5',
          200: '#f5da87',
          300: '#efc24a',
          400: '#E3A827',
          500: '#C89010',
          600: '#a67208',
          700: '#825705',
          800: '#5e3e03',
          900: '#3a2602',
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
        sand:     '#D4B896',
        darkbrown:'#2C1A0E',
        cream:    '#F5EDD6',
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
