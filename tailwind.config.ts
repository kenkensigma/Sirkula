import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

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
        premium: {
          dark: "#04261C",
          primary: "#0A4D3C",
          accent: "#106950",
          surface: "#FFFFFF",
          soft: "#F4F8F5",
          border: "#DDE7E2",
          muted: "#4A6359",
        },
        palette: {
          forest: "#04261C",
          dark: "#04261C",
          amber: "#a55704",
          sand: "#f3d2af",
          cream: "#f8eadc",
        },
        sirkula: {
          forest: "#04261C",
          dark: "#04261C",
          green: "#0A4D3C",
          accent: "#106950",
          amber: "#a55704",
          sand: "#f3d2af",
          cream: "#f8eadc",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [animate],
};
export default config;
