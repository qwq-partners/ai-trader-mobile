/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0b0b14",
        surface: "#12121e",
        elevated: "#1a1a2e",
        "border-subtle": "rgba(255,255,255,0.07)",
        foreground: "#e2e8f0",
        muted: "#94a3b8",
        primary: "#6366f1",
        "primary-light": "#818cf8",
        success: "#34d399",
        error: "#f87171",
        warning: "#fbbf24",
        info: "#60a5fa",
        profit: "#34d399",
        loss: "#f87171",
      },
    },
  },
  plugins: [],
};
