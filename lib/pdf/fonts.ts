/**
 * Embedded PDF fonts.
 *
 * The built-in PDF fonts (Helvetica etc.) use WinAnsi encoding, which has no
 * ₦ or ₵ glyph — naira amounts rendered as "50,000.00" or a stray mark. We
 * embed full static TTFs (Google Fonts, OFL; licences alongside) instead.
 *
 * Glyph coverage rule: only Inter has ₦/₵. Playfair Display and JetBrains Mono
 * do NOT — use them for headings / document numbers only, never for money.
 */
import path from "node:path";
import { Font } from "@react-pdf/renderer";

export const PDF_FONT = {
  sans: "Inter",
  serif: "Playfair Display",
  mono: "JetBrains Mono",
} as const;

const dir = path.join(process.cwd(), "lib", "pdf", "fonts");
const file = (name: string) => path.join(dir, name);

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: PDF_FONT.sans,
    fonts: [
      { src: file("Inter-Regular.ttf"), fontWeight: 400 },
      { src: file("Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: file("Inter-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: PDF_FONT.serif,
    fonts: [
      { src: file("PlayfairDisplay-SemiBold.ttf"), fontWeight: 600 },
      { src: file("PlayfairDisplay-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: PDF_FONT.mono,
    fonts: [
      { src: file("JetBrainsMono-Regular.ttf"), fontWeight: 400 },
      { src: file("JetBrainsMono-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // Don't hyphenate words across lines (react-pdf's default splits names).
  Font.registerHyphenationCallback((word) => [word]);
}
