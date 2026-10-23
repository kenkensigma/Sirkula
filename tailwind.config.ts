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
        premium: {
          dark: "#04261C",     // Deep luxury forest dark (text / dark badges)
          primary: "#0A4D3C",  // Signature British Racing / Rolex pine green (CTA / brand)
          accent: "#106950",   // Vibrant jewel emerald (hover / highlight)
          surface: "#FFFFFF",  // Pure white
          soft: "#F4F8F5",     // Soft luxury tinted cream-white
          border: "#DDE7E2",   // Crisp subtle green-tinted border
          muted: "#4A6359",    // Accessible 4.8:1+ secondary text
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
  plugins: [],
};
export default config;
