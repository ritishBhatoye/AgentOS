/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          dark: '#5b21b6',
        },
        surface: {
          DEFAULT: '#0f0f14',
          card: '#16161e',
          elevated: '#1e1e2a',
          input: '#1a1a24',
        },
        accent: {
          blue: '#3b82f6',
          green: '#22c55e',
          red: '#ef4444',
          yellow: '#eab308',
          cyan: '#06b6d4',
          purple: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
};
