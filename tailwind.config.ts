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
        cream: {
          50: "#FFFDFB",
          100: "#FFF8F3", // Sfondo principale da brief
          200: "#FBEFE6",
          300: "#F5E4D5",
          400: "#EED7C2",
        },
        plum: {
          900: "#2D2838",
          800: "#4A4458", // Testo principale da brief
          700: "#5D566E",
          600: "#756D89",
          500: "#928BA4",
          400: "#B4ADC2",
          200: "#E2DEE9",
          100: "#F2F0F6",
        },
        pastel: {
          pink: "#FFD6E0",
          peach: "#FFE5D0",
          mint: "#D4F1E4",
          lavender: "#E4DAFF",
          sky: "#D6ECFF",
          butter: "#FFF3C4",
        },
        cosmo: {
          alien: "#4F75FF",
          accent: "#7C96FF",
          light: "#E9EEFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito", "sans-serif"],
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(74, 68, 88, 0.08)",
        card: "0 2px 12px -1px rgba(74, 68, 88, 0.05), 0 1px 3px 0 rgba(74, 68, 88, 0.03)",
        floating: "0 10px 30px -4px rgba(74, 68, 88, 0.15)",
        insetCute: "inset 0 2px 4px 0 rgba(74, 68, 88, 0.04)",
      },
      animation: {
        "pop-in": "popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "bounce-gentle": "bounceGentle 2s infinite ease-in-out",
        "wiggle": "wiggle 1s ease-in-out infinite",
      },
      keyframes: {
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
