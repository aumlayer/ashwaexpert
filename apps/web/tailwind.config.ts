import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "#FFFFFF",
        },
        mint: "var(--mint)",
        background: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        foreground: {
          DEFAULT: "var(--text)",
          muted: "var(--text-2)",
        },
        border: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
      },
      fontFamily: {
        heading: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display": ["44px", { lineHeight: "52px", fontWeight: "700" }],
        "h1": ["44px", { lineHeight: "52px", fontWeight: "700" }],
        "h2": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "h3": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "h4": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body": ["16px", { lineHeight: "26px", fontWeight: "400" }],
        "small": ["14px", { lineHeight: "22px", fontWeight: "400" }],
        "caption": ["12px", { lineHeight: "18px", fontWeight: "400" }],
      },
      borderRadius: {
        card: "16px",
        btn: "14px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(2,6,23,.08)",
        md: "0 10px 20px rgba(2,6,23,.10)",
        lg: "0 24px 60px rgba(2,6,23,.16)",
      },
      spacing: {
        18: "72px",
        12: "48px",
      },
      maxWidth: {
        container: "1200px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        micro: "120ms",
        standard: "220ms",
        hero: "400ms",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
