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
          bg: '#0b0c10',
          surface: '#12131a',
          border: '#2a2d3a',
          wallTop: '#353849',
          text: '#c8cad6',
          textDim: '#5a5d6e',
          green: '#4ade80',
          red: '#ef4444',
          blue: '#60a5fa',
          yellow: '#fbbf24',
          purple: '#a78bfa',
          pink: '#f472b6',
        },
      },
    },
  },
  plugins: [],
}
