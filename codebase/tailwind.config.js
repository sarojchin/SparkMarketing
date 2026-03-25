/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Silkscreen"', 'cursive'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        sim: {
          bg: '#f5f3ef',
          surface: '#ffffff',
          border: '#d4cfc7',
          wallTop: '#b8b2a6',
          text: '#2d2a24',
          textDim: '#8a847a',
          green: '#16a34a',
          red: '#dc2626',
          blue: '#2563eb',
          yellow: '#ca8a04',
          purple: '#7c3aed',
          pink: '#db2777',
        },
      },
    },
  },
  plugins: [],
}
