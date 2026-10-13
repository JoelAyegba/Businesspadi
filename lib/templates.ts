/**
 * Receipt / invoice templates.
 *
 * A template is DATA — layout family + heading font + hex palette — consumed
 * by both renderers: the web document (components/receipt/layouts/*) maps the
 * palette to CSS variables, the PDF (lib/pdf/layouts/*) uses the same hex
 * values. One source of truth, so screen and PDF can't drift.
 *
 * Ids are persisted on Receipt.templateId — never rename or remove one.
 * Documents are paper: palettes are fixed and ignore the app's dark mode.
 */

export type LayoutFamily = "letterhead" | "banner" | "editorial" | "sidebar";

/** Heading font. Money ALWAYS renders in sans (only Inter has ₦/₵). */
export type TemplateFont = "sans" | "serif" | "mono";

export type DocPalette = {
  /** Page background. */
  paper: string;
  /** Primary text. */
  ink: string;
  /** Secondary text, labels. */
  muted: string;
  /** Hairlines and table rules. */
  line: string;
  /** The template's single accent colour. */
  accent: string;
  /** Tinted fill (totals box, row tint), derived from the accent. */
  accentSoft: string;
  /** Text on a solid accent fill. */
  accentInk: string;
  /** Header band (banner) / side column (sidebar). */
  band: string;
  /** Text on the band. */
  bandInk: string;
  /** Secondary text on the band. */
  bandMuted: string;
  /** Labels / highlights on the band. */
  bandAccent: string;
  /** PAID stamp. */
  paid: string;
  /** VOID stamp. */
  void: string;
};

export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  layout: LayoutFamily;
  font: TemplateFont;
  /** Accent (and band) follow the business brand colour. */
  useBrandColor?: boolean;
  palette: DocPalette;
}

const LIGHT = {
  paper: "#FFFFFF",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  accentInk: "#FFFFFF",
  bandInk: "#FFFFFF",
  paid: "#15803D",
  void: "#B91C1C",
} as const;

export const TEMPLATES: DocTemplate[] = [
  // ── Letterhead ──────────────────────────────────────────────────────────
  {
    id: "classic",
    name: "Classic",
    description: "Letterhead in your brand colour",
    layout: "letterhead",
    font: "sans",
    useBrandColor: true,
    palette: {
      ...LIGHT,
      accent: "#1D4ED8",
      accentSoft: "#EFF4FF",
      band: "#1D4ED8",
      bandMuted: "#BFD3FE",
      bandAccent: "#FFFFFF",
    },
  },
  {
    id: "mono",
    name: "Monochrome",
    description: "Grayscale letterhead, prints anywhere",
    layout: "letterhead",
    font: "mono",
    palette: {
      ...LIGHT,
      ink: "#18181B",
      muted: "#71717A",
      line: "#E4E4E7",
      accent: "#18181B",
      accentSoft: "#F4F4F5",
      band: "#18181B",
      bandMuted: "#A1A1AA",
      bandAccent: "#FFFFFF",
      paid: "#18181B",
      void: "#18181B",
    },
  },

  // ── Banner ──────────────────────────────────────────────────────────────
  {
    id: "modern",
    name: "Modern",
    description: "Dark banner with the amount up front",
    layout: "banner",
    font: "sans",
    palette: {
      ...LIGHT,
      accent: "#4338CA",
      accentSoft: "#EEF2FF",
      band: "#0F172A",
      bandMuted: "#94A3B8",
      bandAccent: "#A5B4FC",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm terracotta banner",
    layout: "banner",
    font: "sans",
    palette: {
      ...LIGHT,
      ink: "#1C1917",
      muted: "#78716C",
      line: "#E7E5E4",
      accent: "#C2410C",
      accentSoft: "#FFF4EC",
      band: "#9A3412",
      bandMuted: "#FDBA8C",
      bandAccent: "#FED7AA",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep teal banner",
    layout: "banner",
    font: "sans",
    palette: {
      ...LIGHT,
      accent: "#0F766E",
      accentSoft: "#EEFBF8",
      band: "#134E4A",
      bandMuted: "#99D5CC",
      bandAccent: "#5EEAD4",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Evergreen banner, calm and trustworthy",
    layout: "banner",
    font: "sans",
    palette: {
      ...LIGHT,
      ink: "#14201A",
      muted: "#5B6B62",
      line: "#E2E8E4",
      accent: "#166534",
      accentSoft: "#EFF8F1",
      band: "#14532D",
      bandMuted: "#A7D3B5",
      bandAccent: "#86EFAC",
    },
  },

  // ── Editorial ───────────────────────────────────────────────────────────
  {
    id: "minimal",
    name: "Minimal",
    description: "Editorial whitespace, serif headings",
    layout: "editorial",
    font: "serif",
    palette: {
      ...LIGHT,
      ink: "#111827",
      muted: "#6B7280",
      line: "#E5E7EB",
      accent: "#111827",
      accentSoft: "#F9FAFB",
      band: "#111827",
      bandMuted: "#9CA3AF",
      bandAccent: "#FFFFFF",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Editorial with a soft violet accent",
    layout: "editorial",
    font: "serif",
    palette: {
      ...LIGHT,
      ink: "#1E1B2E",
      muted: "#6E6A80",
      line: "#E9E5F5",
      accent: "#6D28D9",
      accentSoft: "#F6F3FE",
      band: "#6D28D9",
      bandMuted: "#DDD6FE",
      bandAccent: "#FFFFFF",
    },
  },

  // ── Sidebar ─────────────────────────────────────────────────────────────
  {
    id: "executive",
    name: "Executive",
    description: "Slate side column with gold details",
    layout: "sidebar",
    font: "serif",
    palette: {
      ...LIGHT,
      accent: "#A16207",
      accentSoft: "#FEF9EC",
      band: "#1E293B",
      bandMuted: "#94A3B8",
      bandAccent: "#F2C46B",
    },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Dark paper, terminal green, monospace",
    layout: "sidebar",
    font: "mono",
    palette: {
      paper: "#0B1120",
      ink: "#E2E8F0",
      muted: "#8B9BB4",
      line: "#1E293B",
      accent: "#4ADE80",
      accentSoft: "#0F1F1A",
      accentInk: "#052E16",
      band: "#020617",
      bandInk: "#E2E8F0",
      bandMuted: "#8B9BB4",
      bandAccent: "#4ADE80",
      paid: "#4ADE80",
      void: "#F87171",
    },
  },
];

export const DEFAULT_TEMPLATE_ID = "classic";

export const LAYOUT_LABELS: Record<LayoutFamily, string> = {
  letterhead: "Letterhead",
  banner: "Banner",
  editorial: "Editorial",
  sidebar: "Sidebar",
};

export function getTemplate(id: string | null | undefined): DocTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}

// ── Colour helpers ────────────────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1]!;
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

const toHex = (rgb: number[]) =>
  "#" +
  rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();

/** Blend `hex` toward `toward` by `amount` (0 = hex, 1 = toward). */
export function mixHex(hex: string, toward: string, amount: number): string {
  const a = parseHex(hex);
  const b = parseHex(toward);
  if (!a || !b) return hex;
  return toHex(a.map((v, i) => v + (b[i]! - v) * amount));
}

function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Final palette for a document. For brand-colour templates the accent and
 * band follow the business colour; pale brand colours are darkened until
 * they reach 4.5:1 on paper so labels and totals stay legible in print.
 */
export function resolvePalette(template: DocTemplate, brandColor?: string | null): DocPalette {
  const p = template.palette;
  if (!template.useBrandColor || !brandColor || !parseHex(brandColor)) return p;

  let accent = toHex(parseHex(brandColor)!);
  for (let i = 0; i < 10 && contrastRatio(accent, p.paper) < 4.5; i++) {
    accent = mixHex(accent, "#000000", 0.15);
  }
  return {
    ...p,
    accent,
    accentSoft: mixHex(accent, p.paper, 0.93),
    band: accent,
    bandMuted: mixHex(accent, "#FFFFFF", 0.7),
    accentInk: contrastRatio("#FFFFFF", accent) >= 4.5 ? "#FFFFFF" : p.ink,
    bandInk: contrastRatio("#FFFFFF", accent) >= 4.5 ? "#FFFFFF" : p.ink,
  };
}
