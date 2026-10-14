/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dock: {
          bg: "#0f1117",
          card: "#161922",
          border: "#262b3a",
          hover: "#1e2230",
          accent: "#6366f1",
          text: "#f3f4f6",
          muted: "#9ca3af",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      }
    },
  },
  plugins: [],
}
