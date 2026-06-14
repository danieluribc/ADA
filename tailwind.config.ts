import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        background: "#f9f9f9",
        "on-primary": "#ffffff",
        "on-surface-variant": "#4c4546",
        outline: "#7e7576",
        error: "#ba1a1a",
        "neon-lime": "#DFFF00",
        "on-background": "#1a1c1c",
        "on-surface": "#1a1c1c",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f4",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "secondary-fixed": "#d2f000",
        "secondary-container": "#d0ed00",
      },
      spacing: {
        unit: "4px",
        "section-gap": "120px",
        "element-gap": "16px",
        gutter: "24px",
        "container-margin": "64px",
      },
      fontFamily: {
        inter: ["var(--font-inter)", "Inter", "sans-serif"],
        "noto-serif": ["var(--font-noto-serif)", "Noto Serif", "serif"],
      },
      borderRadius: {
        DEFAULT: "0rem",
        lg: "0rem",
        xl: "0rem",
        full: "9999px",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".font-body-md": {
          fontFamily: "var(--font-inter)",
          fontSize: "15px",
          lineHeight: "1.6",
          fontWeight: "400",
        },
        ".font-body-lg": {
          fontFamily: "var(--font-inter)",
          fontSize: "18px",
          lineHeight: "1.6",
          letterSpacing: "-0.01em",
        },
        ".font-display-xl": {
          fontFamily: "var(--font-noto-serif)",
          fontSize: "80px",
          lineHeight: "1.1",
          letterSpacing: "-0.02em",
          fontWeight: "300",
        },
        ".font-headline-lg": {
          fontFamily: "var(--font-noto-serif)",
          fontSize: "40px",
          lineHeight: "1.2",
          letterSpacing: "-0.01em",
          fontWeight: "400",
        },
        ".font-headline-md": {
          fontFamily: "var(--font-noto-serif)",
          fontSize: "24px",
          lineHeight: "1.4",
          fontWeight: "400",
        },
        ".font-label-caps": {
          fontFamily: "var(--font-inter)",
          fontSize: "12px",
          lineHeight: "1",
          letterSpacing: "0.1em",
          fontWeight: "600",
          textTransform: "uppercase",
        },
        ".font-link-sm": {
          fontFamily: "var(--font-inter)",
          fontSize: "13px",
          lineHeight: "1",
          fontWeight: "500",
        },
      });
    }),
  ],
};

export default config;
