import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // Receipt/invoice paper palette — set per template as CSS variables on
        // the document root (components/receipt/layouts/parts.tsx). Fixed
        // colours: documents are paper and ignore the app's dark mode.
        doc: {
          paper: "var(--doc-paper)",
          ink: "var(--doc-ink)",
          muted: "var(--doc-muted)",
          line: "var(--doc-line)",
          accent: "var(--doc-accent)",
          "accent-soft": "var(--doc-accent-soft)",
          "accent-ink": "var(--doc-accent-ink)",
          band: "var(--doc-band)",
          "band-ink": "var(--doc-band-ink)",
          "band-muted": "var(--doc-band-muted)",
          "band-accent": "var(--doc-band-accent)",
          paid: "var(--doc-paid)",
          void: "var(--doc-void)",
        },
        // Semantic tokens — wired to CSS variables defined in globals.css.
        // Do NOT use raw hex in components; reach for these instead.
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        surface: "hsl(var(--surface))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Document headings only (lib/templates.ts). These fonts lack the ₦
        // glyph, so money always stays in sans.
        "doc-serif": ["var(--font-doc-serif)", "Georgia", "serif"],
        "doc-mono": ["var(--font-doc-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/container-queries")],
};

export default config;
