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
        navy: "#08376B",
        skyBlue: "#35C0ED",
        mintGreen: "#9AEBA6",
        teal: "#2F90B0",
        offWhite: "#F5F7FA",
        paleGray: "#E8ECF0",
        charcoal: "#1C2733",
        success: "#2E7D4F",
        warning: "#D4940A",
        error: "#C53030",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "16px",
      },
      fontFamily: {
        heading: ['"Tenor Sans"', "sans-serif"],
        body: ["Montserrat", "sans-serif"],
      },
      fontSize: {
        display: "36px",
        h1: "28px",
        h2: "22px",
        h3: "16px",
        body: "14px",
        caption: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
