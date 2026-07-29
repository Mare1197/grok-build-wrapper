/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07080c",
          900: "#0c0e14",
          800: "#12151e",
          700: "#1a1f2c",
          600: "#252b3b",
        },
        accent: {
          DEFAULT: "#6d7cff",
          soft: "#8b96ff",
          dim: "#3d4acc",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(109, 124, 255, 0.15)",
      },
    },
  },
  plugins: [],
};
