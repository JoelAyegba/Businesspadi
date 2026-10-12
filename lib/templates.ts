/**
 * Invoice/Receipt Template System
 *
 * Each template defines a complete visual identity via CSS class tokens.
 * The ReceiptDocument component reads these tokens to render differently.
 */

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  /** Mini-preview colors for the selector card */
  preview: { headerBg: string; accentBg: string; bodyBg: string };
  /** Actual styling tokens applied to the document */
  styles: {
    wrapper: string;
    accentBar: string;
    headerBg: string;
    headerTitle: string;
    headerMeta: string;
    badge: (status: string, isInvoice: boolean) => string;
    sectionBorder: string;
    sectionLabel: string;
    sectionValue: string;
    lineItemCard: string;
    lineItemTitle: string;
    lineItemMeta: string;
    lineItemAmount: string;
    tableHeader: string;
    tableRow: string;
    tableDivider: string;
    totalLabel: string;
    totalValue: string;
    totalBorder: string;
    footerBg: string;
    footerText: string;
  };
}

const badgeBase = "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase border";

function makeBadge(paid: string, unpaid: string, voided: string, draft: string) {
  return (status: string, isInvoice: boolean) => {
    if (status === "PAID") return `${badgeBase} ${paid}`;
    if (status === "VOID") return `${badgeBase} ${voided}`;
    if (status === "ISSUED" && isInvoice) return `${badgeBase} ${unpaid}`;
    return `${badgeBase} ${draft}`;
  };
}

export const TEMPLATES: InvoiceTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean and professional",
    preview: { headerBg: "#ffffff", accentBg: "#2563eb", bodyBg: "#f8fafc" },
    styles: {
      wrapper: "bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800",
      accentBar: "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600",
      headerBg: "px-6 py-8",
      headerTitle: "text-slate-900 dark:text-white",
      headerMeta: "text-slate-400 dark:text-slate-500",
      badge: makeBadge(
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
      ),
      sectionBorder: "border-slate-200 dark:border-slate-800",
      sectionLabel: "text-slate-400 dark:text-slate-500",
      sectionValue: "text-slate-900 dark:text-white",
      lineItemCard: "bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800",
      lineItemTitle: "text-slate-900 dark:text-white",
      lineItemMeta: "text-slate-500 dark:text-slate-400",
      lineItemAmount: "text-slate-900 dark:text-white",
      tableHeader: "text-slate-400 border-slate-200 dark:text-slate-500 dark:border-slate-800",
      tableRow: "text-slate-900 dark:text-white",
      tableDivider: "divide-slate-100 dark:divide-slate-800",
      totalLabel: "text-slate-500 dark:text-slate-400",
      totalValue: "text-slate-900 dark:text-white",
      totalBorder: "border-slate-200 dark:border-slate-700",
      footerBg: "bg-slate-50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800",
      footerText: "text-slate-500 dark:text-slate-400",
    },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold dark header",
    preview: { headerBg: "#0f172a", accentBg: "#6366f1", bodyBg: "#ffffff" },
    styles: {
      wrapper: "bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800",
      accentBar: "bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600",
      headerBg: "px-6 py-8 bg-slate-900 dark:bg-slate-950 text-white",
      headerTitle: "text-white",
      headerMeta: "text-slate-400",
      badge: makeBadge(
        "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        "bg-amber-500/20 text-amber-300 border-amber-500/30",
        "bg-red-500/20 text-red-300 border-red-500/30",
        "bg-slate-700 text-slate-300 border-slate-600"
      ),
      sectionBorder: "border-slate-200 dark:border-slate-800",
      sectionLabel: "text-slate-400 dark:text-slate-500",
      sectionValue: "text-slate-900 dark:text-white",
      lineItemCard: "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/10",
      lineItemTitle: "text-slate-900 dark:text-white",
      lineItemMeta: "text-slate-500 dark:text-slate-400",
      lineItemAmount: "text-indigo-700 dark:text-indigo-400",
      tableHeader: "text-slate-400 border-slate-200 dark:text-slate-500 dark:border-slate-800",
      tableRow: "text-slate-900 dark:text-white",
      tableDivider: "divide-slate-100 dark:divide-slate-800",
      totalLabel: "text-slate-500 dark:text-slate-400",
      totalValue: "text-indigo-700 dark:text-indigo-400",
      totalBorder: "border-indigo-200 dark:border-indigo-500/20",
      footerBg: "bg-slate-900 border-slate-800 dark:bg-slate-950 dark:border-slate-800",
      footerText: "text-slate-400",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean simplicity",
    preview: { headerBg: "#ffffff", accentBg: "#d1d5db", bodyBg: "#ffffff" },
    styles: {
      wrapper: "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-900",
      accentBar: "bg-slate-300 dark:bg-slate-700 h-px",
      headerBg: "px-6 py-10",
      headerTitle: "text-slate-800 dark:text-slate-200",
      headerMeta: "text-slate-400 dark:text-slate-600",
      badge: makeBadge(
        "bg-transparent text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-600",
        "bg-transparent text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-600",
        "bg-transparent text-red-600 border-red-300 dark:text-red-400 dark:border-red-600",
        "bg-transparent text-slate-500 border-slate-300 dark:text-slate-400 dark:border-slate-600"
      ),
      sectionBorder: "border-slate-100 dark:border-slate-900",
      sectionLabel: "text-slate-400 dark:text-slate-600",
      sectionValue: "text-slate-700 dark:text-slate-300",
      lineItemCard: "bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-900",
      lineItemTitle: "text-slate-700 dark:text-slate-300",
      lineItemMeta: "text-slate-400 dark:text-slate-600",
      lineItemAmount: "text-slate-700 dark:text-slate-300",
      tableHeader: "text-slate-300 border-slate-100 dark:text-slate-700 dark:border-slate-900",
      tableRow: "text-slate-700 dark:text-slate-300",
      tableDivider: "divide-slate-50 dark:divide-slate-900",
      totalLabel: "text-slate-400 dark:text-slate-600",
      totalValue: "text-slate-800 dark:text-slate-200",
      totalBorder: "border-slate-100 dark:border-slate-900",
      footerBg: "bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-900",
      footerText: "text-slate-400 dark:text-slate-600",
    },
  },
  {
    id: "executive",
    name: "Executive",
    description: "Rich & prestigious",
    preview: { headerBg: "#1e293b", accentBg: "#f59e0b", bodyBg: "#fefce8" },
    styles: {
      wrapper: "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800",
      accentBar: "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500",
      headerBg: "px-6 py-8 bg-slate-800 dark:bg-slate-900",
      headerTitle: "text-white",
      headerMeta: "text-amber-300/70",
      badge: makeBadge(
        "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        "bg-amber-500/20 text-amber-200 border-amber-500/30",
        "bg-red-500/20 text-red-300 border-red-500/30",
        "bg-slate-700 text-slate-300 border-slate-600"
      ),
      sectionBorder: "border-slate-200 dark:border-slate-800",
      sectionLabel: "text-amber-600 dark:text-amber-500",
      sectionValue: "text-slate-900 dark:text-white",
      lineItemCard: "bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10",
      lineItemTitle: "text-slate-900 dark:text-white",
      lineItemMeta: "text-slate-500 dark:text-slate-400",
      lineItemAmount: "text-amber-700 dark:text-amber-400",
      tableHeader: "text-amber-600/70 border-amber-200 dark:text-amber-500/50 dark:border-amber-500/10",
      tableRow: "text-slate-900 dark:text-white",
      tableDivider: "divide-amber-100/50 dark:divide-amber-500/10",
      totalLabel: "text-slate-500 dark:text-slate-400",
      totalValue: "text-amber-700 dark:text-amber-400",
      totalBorder: "border-amber-200 dark:border-amber-500/20",
      footerBg: "bg-slate-800 border-slate-700 dark:bg-slate-900 dark:border-slate-800",
      footerText: "text-amber-300/70",
    },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Vibrant & techy",
    preview: { headerBg: "#020617", accentBg: "#22c55e", bodyBg: "#0f172a" },
    styles: {
      wrapper: "bg-slate-950 border-slate-800 text-white",
      accentBar: "bg-gradient-to-r from-green-500 via-emerald-400 to-green-500",
      headerBg: "px-6 py-8 bg-slate-950",
      headerTitle: "text-green-400",
      headerMeta: "text-slate-500",
      badge: makeBadge(
        "bg-green-500/20 text-green-400 border-green-500/30",
        "bg-amber-500/20 text-amber-400 border-amber-500/30",
        "bg-red-500/20 text-red-400 border-red-500/30",
        "bg-slate-800 text-slate-400 border-slate-700"
      ),
      sectionBorder: "border-slate-800",
      sectionLabel: "text-green-500/70",
      sectionValue: "text-white",
      lineItemCard: "bg-slate-900 border-slate-800",
      lineItemTitle: "text-white",
      lineItemMeta: "text-slate-500",
      lineItemAmount: "text-green-400",
      tableHeader: "text-green-500/50 border-slate-800",
      tableRow: "text-white",
      tableDivider: "divide-slate-800",
      totalLabel: "text-slate-500",
      totalValue: "text-green-400",
      totalBorder: "border-green-500/20",
      footerBg: "bg-slate-900 border-slate-800",
      footerText: "text-slate-500",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm gradient tones",
    preview: { headerBg: "#7c2d12", accentBg: "#f97316", bodyBg: "#fff7ed" },
    styles: {
      wrapper: "bg-white dark:bg-slate-950 border-orange-200/60 dark:border-slate-800",
      accentBar: "bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500",
      headerBg: "px-6 py-8 bg-gradient-to-br from-orange-600 to-rose-600",
      headerTitle: "text-white",
      headerMeta: "text-orange-200/70",
      badge: makeBadge(
        "bg-white/20 text-white border-white/30",
        "bg-white/20 text-white border-white/30",
        "bg-white/20 text-white border-white/30",
        "bg-white/20 text-white border-white/30"
      ),
      sectionBorder: "border-orange-100 dark:border-slate-800",
      sectionLabel: "text-orange-400 dark:text-orange-500",
      sectionValue: "text-slate-900 dark:text-white",
      lineItemCard: "bg-orange-50/50 border-orange-100 dark:bg-orange-500/5 dark:border-orange-500/10",
      lineItemTitle: "text-slate-900 dark:text-white",
      lineItemMeta: "text-slate-500 dark:text-slate-400",
      lineItemAmount: "text-orange-700 dark:text-orange-400",
      tableHeader: "text-orange-400 border-orange-200 dark:text-orange-500 dark:border-orange-500/10",
      tableRow: "text-slate-900 dark:text-white",
      tableDivider: "divide-orange-100 dark:divide-orange-500/10",
      totalLabel: "text-slate-500 dark:text-slate-400",
      totalValue: "text-orange-700 dark:text-orange-400",
      totalBorder: "border-orange-200 dark:border-orange-500/20",
      footerBg: "bg-orange-50 border-orange-100 dark:bg-slate-900/30 dark:border-slate-800",
      footerText: "text-orange-600/70 dark:text-orange-400/50",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool teal vibes",
    preview: { headerBg: "#134e4a", accentBg: "#14b8a6", bodyBg: "#f0fdfa" },
    styles: {
      wrapper: "bg-white dark:bg-slate-950 border-teal-200/60 dark:border-slate-800",
      accentBar: "bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500",
      headerBg: "px-6 py-8 bg-teal-800 dark:bg-teal-950",
      headerTitle: "text-white",
      headerMeta: "text-teal-300/70",
      badge: makeBadge(
        "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        "bg-amber-500/20 text-amber-300 border-amber-500/30",
        "bg-red-500/20 text-red-300 border-red-500/30",
        "bg-teal-700 text-teal-300 border-teal-600"
      ),
      sectionBorder: "border-teal-100 dark:border-slate-800",
      sectionLabel: "text-teal-500 dark:text-teal-600",
      sectionValue: "text-slate-900 dark:text-white",
      lineItemCard: "bg-teal-50/50 border-teal-100 dark:bg-teal-500/5 dark:border-teal-500/10",
      lineItemTitle: "text-slate-900 dark:text-white",
      lineItemMeta: "text-slate-500 dark:text-slate-400",
      lineItemAmount: "text-teal-700 dark:text-teal-400",
      tableHeader: "text-teal-500/70 border-teal-200 dark:text-teal-600 dark:border-teal-500/10",
      tableRow: "text-slate-900 dark:text-white",
      tableDivider: "divide-teal-100 dark:divide-teal-500/10",
      totalLabel: "text-slate-500 dark:text-slate-400",
      totalValue: "text-teal-700 dark:text-teal-400",
      totalBorder: "border-teal-200 dark:border-teal-500/20",
      footerBg: "bg-teal-800 border-teal-700 dark:bg-teal-950 dark:border-slate-800",
      footerText: "text-teal-300/70",
    },
  },
  {
    id: "mono",
    name: "Monochrome",
    description: "Elegant grayscale",
    preview: { headerBg: "#18181b", accentBg: "#71717a", bodyBg: "#fafafa" },
    styles: {
      wrapper: "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800",
      accentBar: "bg-zinc-800 dark:bg-zinc-200 h-[3px]",
      headerBg: "px-6 py-8",
      headerTitle: "text-zinc-900 dark:text-zinc-100",
      headerMeta: "text-zinc-400 dark:text-zinc-600",
      badge: makeBadge(
        "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700"
      ),
      sectionBorder: "border-zinc-200 dark:border-zinc-800",
      sectionLabel: "text-zinc-400 dark:text-zinc-600",
      sectionValue: "text-zinc-900 dark:text-zinc-100",
      lineItemCard: "bg-zinc-50 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800",
      lineItemTitle: "text-zinc-900 dark:text-zinc-100",
      lineItemMeta: "text-zinc-500 dark:text-zinc-500",
      lineItemAmount: "text-zinc-900 dark:text-zinc-100",
      tableHeader: "text-zinc-400 border-zinc-200 dark:text-zinc-600 dark:border-zinc-800",
      tableRow: "text-zinc-900 dark:text-zinc-100",
      tableDivider: "divide-zinc-100 dark:divide-zinc-800",
      totalLabel: "text-zinc-500 dark:text-zinc-500",
      totalValue: "text-zinc-900 dark:text-zinc-100",
      totalBorder: "border-zinc-300 dark:border-zinc-700",
      footerBg: "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800",
      footerText: "text-zinc-500 dark:text-zinc-500",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Soft & elegant",
    preview: { headerBg: "#ede9fe", accentBg: "#8b5cf6", bodyBg: "#faf5ff" },
    styles: {
      wrapper: "bg-white dark:bg-slate-950 border-violet-200/60 dark:border-slate-800",
      accentBar: "bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-500",
      headerBg: "px-6 py-8 bg-violet-50 dark:bg-violet-950/30",
      headerTitle: "text-violet-900 dark:text-violet-300",
      headerMeta: "text-violet-400 dark:text-violet-500",
      badge: makeBadge(
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        "bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20"
      ),
      sectionBorder: "border-violet-100 dark:border-slate-800",
      sectionLabel: "text-violet-400 dark:text-violet-500",
      sectionValue: "text-slate-900 dark:text-white",
      lineItemCard: "bg-violet-50/50 border-violet-100 dark:bg-violet-500/5 dark:border-violet-500/10",
      lineItemTitle: "text-slate-900 dark:text-white",
      lineItemMeta: "text-slate-500 dark:text-slate-400",
      lineItemAmount: "text-violet-700 dark:text-violet-400",
      tableHeader: "text-violet-400 border-violet-200 dark:text-violet-500 dark:border-violet-500/10",
      tableRow: "text-slate-900 dark:text-white",
      tableDivider: "divide-violet-100 dark:divide-violet-500/10",
      totalLabel: "text-slate-500 dark:text-slate-400",
      totalValue: "text-violet-700 dark:text-violet-400",
      totalBorder: "border-violet-200 dark:border-violet-500/20",
      footerBg: "bg-violet-50 border-violet-100 dark:bg-violet-950/20 dark:border-slate-800",
      footerText: "text-violet-500 dark:text-violet-400/50",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Natural & trustworthy",
    preview: { headerBg: "#14532d", accentBg: "#22c55e", bodyBg: "#f0fdf4" },
    styles: {
      wrapper: "bg-white dark:bg-slate-950 border-green-200/60 dark:border-slate-800",
      accentBar: "bg-gradient-to-r from-green-700 via-emerald-500 to-green-700",
      headerBg: "px-6 py-8 bg-green-900 dark:bg-green-950",
      headerTitle: "text-white",
      headerMeta: "text-green-300/70",
      badge: makeBadge(
        "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        "bg-amber-500/20 text-amber-300 border-amber-500/30",
        "bg-red-500/20 text-red-300 border-red-500/30",
        "bg-green-800 text-green-300 border-green-700"
      ),
      sectionBorder: "border-green-100 dark:border-slate-800",
      sectionLabel: "text-green-600 dark:text-green-600",
      sectionValue: "text-slate-900 dark:text-white",
      lineItemCard: "bg-green-50/50 border-green-100 dark:bg-green-500/5 dark:border-green-500/10",
      lineItemTitle: "text-slate-900 dark:text-white",
      lineItemMeta: "text-slate-500 dark:text-slate-400",
      lineItemAmount: "text-green-700 dark:text-green-400",
      tableHeader: "text-green-500/70 border-green-200 dark:text-green-600 dark:border-green-500/10",
      tableRow: "text-slate-900 dark:text-white",
      tableDivider: "divide-green-100 dark:divide-green-500/10",
      totalLabel: "text-slate-500 dark:text-slate-400",
      totalValue: "text-green-700 dark:text-green-400",
      totalBorder: "border-green-200 dark:border-green-500/20",
      footerBg: "bg-green-900 border-green-800 dark:bg-green-950 dark:border-slate-800",
      footerText: "text-green-300/70",
    },
  },
];

export const DEFAULT_TEMPLATE_ID = "classic";

export function getTemplate(id: string): InvoiceTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}
