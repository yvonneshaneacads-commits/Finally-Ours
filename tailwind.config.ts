import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sage: {
          DEFAULT: "hsl(var(--sage))",
          soft: "hsl(var(--sage-soft))",
        },
        butter: {
          DEFAULT: "hsl(var(--butter))",
          soft: "hsl(var(--butter-soft))",
        },
        peach: {
          DEFAULT: "hsl(var(--peach))",
          soft: "hsl(var(--peach-soft))",
        },
        powder: {
          DEFAULT: "hsl(var(--powder))",
          soft: "hsl(var(--powder-soft))",
        },
        blush: "hsl(var(--blush))",
        lilac: "hsl(var(--lilac))",
        coral: "hsl(var(--coral))",
        ink: {
          DEFAULT: "hsl(var(--ink))",
          soft: "hsl(var(--ink-soft))",
        },
        paper: {
          DEFAULT: "hsl(var(--paper))",
          deep: "hsl(var(--paper-deep))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
        },
      },
      fontFamily: {
        sans: ['"Quicksand"', "ui-rounded", '"Segoe UI"', "sans-serif"],
        hand: ['"Caveat"', '"Quicksand"', "cursive"],
        read: ['"Nunito"', '"Quicksand"', "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        note: "var(--shadow-note)",
        lift: "var(--shadow-lift)",
      },
      backgroundImage: {
        "sun-wash":
          "radial-gradient(120% 90% at 8% 0%, hsl(var(--butter-soft)) 0%, transparent 55%), radial-gradient(100% 80% at 98% 6%, hsl(var(--powder-soft)) 0%, transparent 58%), radial-gradient(90% 70% at 50% 100%, hsl(var(--peach-soft)) 0%, transparent 60%)",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.33, 1, 0.68, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        swim: {
          "0%, 100%": { transform: "translateX(-4px) translateY(0)" },
          "50%": { transform: "translateX(4px) translateY(-3px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(-0.6deg)" },
          "50%": { transform: "translateY(-4px) rotate(0.8deg)" },
        },
        hop: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "35%": { transform: "translateY(-7px) scale(1.03, 0.97)" },
          "60%": { transform: "translateY(0) scale(0.98, 1.02)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "heart-beat": {
          "0%, 100%": { transform: "scale(1)" },
          "18%": { transform: "scale(1.16)" },
          "32%": { transform: "scale(1)" },
          "46%": { transform: "scale(1.1)" },
        },
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-160% 0" },
          "100%": { backgroundPosition: "260% 0" },
        },
        "swim-x": {
          "0%, 100%": { transform: "translateX(-3px) rotate(-1deg)" },
          "50%": { transform: "translateX(5px) rotate(1.5deg)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.035)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 7s ease-in-out infinite",
        sway: "sway 9s ease-in-out infinite",
        swim: "swim 5s ease-in-out infinite",
        twinkle: "twinkle 4s ease-in-out infinite",
        "pop-in": "pop-in 0.35s cubic-bezier(0.33, 1, 0.68, 1) both",
        bob: "bob 5.5s ease-in-out infinite",
        hop: "hop 4.6s ease-in-out infinite",
        wiggle: "wiggle 3.4s ease-in-out infinite",
        "heart-beat": "heart-beat 2.8s ease-in-out infinite",
        "page-in": "page-in 0.45s cubic-bezier(0.33, 1, 0.68, 1) both",
        shimmer: "shimmer 3.2s linear infinite",
        "swim-x": "swim-x 6s ease-in-out infinite",
        breathe: "breathe 13s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
