/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "rgb(15 17 21)",
          raised: "rgb(24 27 34)",
          border: "rgb(42 46 58)",
        },
      },
    },
  },
  plugins: [],
};
