/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // Define a small "brand" palette for purple buttons
      colors: {
        transparent: 'transparent',
        brand: {
          light: '#a78bfa',
          DEFAULT: '#7c3aed',
          dark: '#6d28d9',
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    "bg-gray-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
      "bg-brand",
    "bg-brand-light",
    "bg-brand-dark",
    "hover:bg-brand-dark",
  ],
};
