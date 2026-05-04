/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14212b",
        paper: "#f3f6f8",
        line: "#d7e0e6",
        moss: "#5c6b76",
        rust: "#b14d3a",
        gold: "#9f741f",
        teal: "#18716f"
      },
      boxShadow: {
        panel: "0 10px 28px rgba(20, 33, 43, 0.08)"
      }
    }
  },
  plugins: []
};
