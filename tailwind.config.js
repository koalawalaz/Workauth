/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Work Auth blue, sampled from the logo (#005AFD).
        brand: { 50: '#eef4ff', 100: '#d9e6ff', 200: '#b3ccff', 500: '#005afd', 600: '#004cd6', 700: '#003db0', 800: '#002e85', 900: '#001d57' },
        ink: '#14201c',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
