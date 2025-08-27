/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'peer-checked:bg-primary-600',
    'peer-checked:after:translate-x-full',
    'peer-checked:after:border-white',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f9f9e6',
          100: '#f5f6cc',
          200: '#eef099',
          300: '#e7ea66',
          400: '#e0e433',
          500: '#d3d800',
          600: '#a8ad00',
          700: '#7d8200',
          800: '#535700',
          900: '#292c00',
        },
        secondary: {
          50: '#e6e6e6',
          100: '#cccccc',
          200: '#999999',
          300: '#666666',
          400: '#333333',
          500: '#1d1d1b',
          600: '#171715',
          700: '#11110f',
          800: '#0a0a0a',
          900: '#050505',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}