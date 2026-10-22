import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        palette: {
          forest: "#09251c",
          dark: "#09251c",
          amber: "#a55704",
          sand: "#f3d2af",
          cream: "#f8eadc",
        },
        sirkula: {
          forest: "#09251c",
          dark: "#09251c",
          amber: "#a55704",
          sand: "#f3d2af",
          cream: "#f8eadc",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
