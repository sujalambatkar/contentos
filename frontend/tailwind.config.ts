import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f1117",
        surface: "#161b27",
        "surface-2": "#1e2535",
        primary: "#6366f1",
        "primary-hover": "#818cf8",
        "primary-dim": "#6366f120",
        warm: "#f8f7f4",
        muted: "#6b7280",
        border: "#2a3040",
        // Platform brand colors
        twitter: "#1d9bf0",
        linkedin: "#0a66c2",
        instagram: "#e1306c",
        newsletter: "#f59e0b",
        youtube: "#ff0000",
      },
      fontFamily: {
        heading: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      backgroundImage: {
        "grid-texture":
          "radial-gradient(circle, #2a3040 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-sm": "24px 24px",
      },
      animation: {
        "fade-slide": "fadeSlide 0.4s ease-out forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeSlide: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
