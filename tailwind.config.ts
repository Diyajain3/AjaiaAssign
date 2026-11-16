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
        canvas: {
          DEFAULT: "#f5f4ef",
          muted: "#eceae3",
          subtle: "#e3e0d6",
        },
        paper: {
          DEFAULT: "#faf9f6",
          elevated: "#fdfdfc",
        },
        border: {
          DEFAULT: "#dedbd2",
          strong: "#c5c1b5",
        },
        ink: {
          DEFAULT: "#232321",
          muted: "#66645d",
          faint: "#8e8b82",
        },
        accent: {
          DEFAULT: "#243242",
          hover: "#1a2532",
          subtle: "#eaedf0",
          border: "#b4c0cd",
        },
        danger: {
          DEFAULT: "#8f2d2d",
          subtle: "#fbeeed",
          border: "#e2b8b6",
        },
        success: {
          DEFAULT: "#2a5934",
          subtle: "#edf5ef",
          border: "#b8d9c0",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      boxShadow: {
        none: "none",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
