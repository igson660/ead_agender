import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ieptec: {
          50: "#eef5ff",
          100: "#dbeaff",
          200: "#b5d2ff",
          300: "#83b3f2",
          400: "#4f8bdc",
          500: "#0d59aa",
          600: "#084b95",
          700: "#063f84",
          800: "#06346d",
          900: "#062a58",
          950: "#031b3b",
          gold: "#f1cf3a"
        }
      },
      boxShadow: {
        float: "0 18px 45px -28px rgba(6, 63, 132, 0.42)",
        card: "0 10px 30px -20px rgba(6, 52, 109, 0.28)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
