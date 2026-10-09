import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#176B61", dark: "#0F4A44", light: "#E6F1EC" },
        gold: { DEFAULT: "#E8C58D", soft: "#F6E8CF" },
        cream: "#F7F5EF",
        mint: "#E6F1EC",
        blush: "#F5DCE2"
      },
      fontFamily: {
        sans: ["Tajawal", "IBM Plex Sans Arabic", "system-ui", "sans-serif"]
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        card: "0 4px 24px rgba(23,107,97,.08)",
        pop: "0 12px 40px rgba(23,107,97,.16)"
      }
    }
  },
  plugins: []
};
export default config;
