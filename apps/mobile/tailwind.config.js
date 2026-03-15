/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: {
          DEFAULT: '#121826',
          card: '#121826',
          elevated: '#1F2937',
          input: '#121826',
        },
        primary: '#0EA5E9',
        secondary: '#22D3EE',
        accent: '#00FF9C',
        text: {
          DEFAULT: '#E5E7EB',
          muted: '#6B7280',
        },
        border: '#1F2937',
      },
    },
  },
  plugins: [],
};
