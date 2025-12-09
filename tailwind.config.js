/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}", // Esto cubre main.tsx en la raíz
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}