import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Tahoma", "Arial", "sans-serif"],
      },
      colors: {
        surface: {
          light: "#ffffff",
          dark: "#0b1220",
        },
      },
    },
  },
  plugins: [],
};

export default config;
