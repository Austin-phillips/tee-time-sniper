/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#16a34a",
        "primary-foreground": "#ffffff",
        destructive: "#dc2626",
        muted: "#f5f5f4",
        "muted-foreground": "#78716c",
        border: "#e7e5e4",
      },
    },
  },
  plugins: [],
};
