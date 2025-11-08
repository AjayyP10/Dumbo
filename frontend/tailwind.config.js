module.exports = {
  darkMode: "class", // enable dark mode via .dark class on <html>
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f46e5", // indigo-600
          light: "#6366f1",
          dark: "#4338ca",
        },
        accent: {
          DEFAULT: "#ec4899", // pink-500
          light: "#f472b6",
          dark: "#db2777",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        progressBar: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out both",
        "slide-up": "slideUp 0.4s ease-out both",
        progress: "progressBar 2s ease-in-out forwards",
      },
      boxShadow: {
        card: "0 4px 8px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};