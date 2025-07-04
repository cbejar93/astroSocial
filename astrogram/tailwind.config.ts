

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    "bg-gray-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ],
};
