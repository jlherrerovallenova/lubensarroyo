/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Norviq PropTech Palette
        canvas: '#f0f3f7',
        obsidian: {
          900: '#0e131b',
          950: '#090d13',
        },
        emerald: {
          brand: '#15a870',
          hover: '#128f5f',
          active: '#0d6b47',
          light: '#effaf5',
          dark: '#0c271c',
          text: '#7ce3b6',
        },
        // Mapeo armonizado de altavik al verde esmeralda y menta de Norviq
        altavik: {
          50: '#effaf5',
          100: '#d7f4e7',
          200: '#b0e8cf',
          300: '#7ce3b6',
          400: '#3cd295',
          500: '#15a870', // Primario Norviq
          600: '#128f5f',
          700: '#0f754e',
          800: '#0c5c3e',
          900: '#0c271c',
        },
        brand: {
          light: '#f0f3f7',
          primary: '#15a870',
          dark: '#0e131b',
        },
        slate: {
          850: '#151b24', 
          950: '#0e131b', 
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.25rem', // 20px - Estándar Norviq
      }
    },
  },
  plugins: [],
};