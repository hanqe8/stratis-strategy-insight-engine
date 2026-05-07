/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--stratis-ink)",
        "ink-2": "var(--stratis-ink-2)",
        paper: "var(--stratis-paper)",
        surface: "var(--stratis-surface)",
        "surface-soft": "var(--stratis-surface-soft)",
        line: "var(--stratis-line)",
        muted: "var(--stratis-muted)",
        moss: "var(--stratis-muted)",
        rust: "var(--stratis-danger)",
        gold: "var(--stratis-gold)",
        "gold-soft": "var(--stratis-gold-soft)",
        teal: "var(--stratis-teal)",
        "teal-2": "var(--stratis-teal-2)",
        "teal-soft": "var(--stratis-teal-soft)",
        blue: "var(--stratis-blue)",
        "blue-soft": "var(--stratis-blue-soft)",
        danger: "var(--stratis-danger)",
        "danger-soft": "var(--stratis-danger-soft)",
        warning: "var(--stratis-warning)",
        "warning-soft": "var(--stratis-warning-soft)",
        success: "var(--stratis-success)",
        "success-soft": "var(--stratis-success-soft)"
      },
      boxShadow: {
        panel: "var(--stratis-shadow-panel)",
        modal: "var(--stratis-shadow-modal)"
      }
    }
  },
  plugins: []
};
