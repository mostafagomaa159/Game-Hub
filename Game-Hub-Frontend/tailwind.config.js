/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // Use class-based dark mode toggling
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        primary: "#2563eb", // Blue-600
        secondary: "#64748b", // Slate-500
        background: "#f9fafb", // Light bg
        darkBackground: "#0f172a", // Dark bg
        darkCard: "#1e293b", // Dark card bg
        accent: "#3b82f6", // Blue-500
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-in-out",
      },
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.1)",
        cardHover: "0 6px 20px rgba(0, 0, 0, 0.15)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
