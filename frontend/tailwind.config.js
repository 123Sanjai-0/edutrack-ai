/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
          light: "#e0e7ff",
          dark: "#3730a3"
        },
        secondary: {
          DEFAULT: "#0ea5e9",
          hover: "#0284c7",
          light: "#e0f2fe"
        },
        success: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
          dark: "#047857"
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
          dark: "#b45309"
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#fee2e2",
          dark: "#b91c1c"
        },
        purple: {
          DEFAULT: "#8b5cf6",
          light: "#ede9fe"
        },
        slate: {
          850: "#151e2e",
          950: "#0b0f19"
        }
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(79, 70, 229, 0.3)',
        'glow-danger': '0 0 20px -5px rgba(239, 68, 68, 0.3)',
        'glow-success': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
