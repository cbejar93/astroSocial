/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  colors: {
    // my other colours
    transparent: 'transparent',
  },
  theme: {
    extend: {
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
  ],
};
