import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#fdf3ed',
          100: '#fae3d3',
          200: '#f4c4a5',
          300: '#ec9e6f',
          400: '#e37a42',
          500: '#C2703E',
          600: '#a65a2e',
          700: '#8a4626',
          800: '#6e3820',
          900: '#5a2f1c',
        },
        sage: {
          50: '#f4f7f2',
          100: '#e6ede2',
          200: '#cddbc5',
          300: '#adc49f',
          400: '#9CAF88',
          500: '#7a9466',
          600: '#607750',
          700: '#4d5f41',
          800: '#404d37',
          900: '#36412f',
        },
        sand: {
          50: '#fdfaf5',
          100: '#f8f0e3',
          200: '#E8D5B7',
          300: '#dcc49a',
          400: '#ccab75',
          500: '#c09558',
          600: '#a87a45',
          700: '#8c613a',
          800: '#734f34',
          900: '#5f422d',
        },
        warmwhite: '#FDF8F4',
        darkbrown: '#3D2B1F',
        gold: '#C9A96E',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-lato)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
