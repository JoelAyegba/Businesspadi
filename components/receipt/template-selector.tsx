"use client";

import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LAYOUT_LABELS,
  TEMPLATES,
  resolvePalette,
  type DocPalette,
  type DocTemplate,
  type LayoutFamily,
} from "@/lib/templates";

/**
 * Template picker. Templates are grouped by layout family; each card is a
 * miniature of the real layout drawn in the template's own palette (and the
 * business brand colour for brand-colour templates), so what you pick is
 * what you get. Horizontal scroll on mobile, grid from `sm`.
 */
export function TemplateSelector({
  value,
  onChange,
  brandColor,
}: {
  value: string;
  onChange: (id: string) => void;
  brandColor?: string | null;
}) {
  const families = Object.keys(LAYOUT_LABELS) as LayoutFamily[];

  return (
    <div className="flex flex-col gap-5">
      {families.map((family) => {
        const templates = TEMPLATES.filter((t) => t.layout === family);
        return (
          <section key={family} aria-label={`${LAYOUT_LABELS[family]} templates`}>
            <h3 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {LAYOUT_LABELS[family]}
            </h3>
            <div
              role="radiogroup"
              className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-5"
            >
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  palette={resolvePalette(t, brandColor)}
                  selected={t.id === value}
                  onSelect={() => onChange(t.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TemplateCard({
  template,
  palette,
  selected,
  onSelect,
}: {
  template: DocTemplate;
  palette: DocPalette;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex w-[132px] shrink-0 snap-start flex-col rounded-xl border p-1.5 text-left transition-all duration-200 active:scale-[0.98] sm:w-auto",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected
          ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
      )}
    >
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-lg ring-1 ring-black/5"
        style={{ backgroundColor: palette.paper }}
        aria-hidden
      >
        <Sketch layout={template.layout} p={palette} />
        {selected && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <span className="px-1 pb-0.5 pt-2">
        <span
          className={cn(
            "block text-xs font-semibold",
            selected ? "text-primary" : "text-slate-800 dark:text-slate-200",
          )}
        >
          {template.name}
        </span>
        <span className="mt-0.5 hidden text-[10px] leading-snug text-slate-500 sm:block">
          {template.description}
        </span>
      </span>
    </button>
  );
}

/** Schematic of each layout family, proportioned like the real document. */
function Sketch({ layout, p }: { layout: LayoutFamily; p: DocPalette }) {
  const bar = (w: string, h: number, color: string, extra?: CSSProperties) => (
    <div style={{ width: w, height: h, backgroundColor: color, borderRadius: 2, ...extra }} />
  );
  const rows = (color: string) => (
    <div className="flex flex-col gap-[5px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex justify-between">
          {bar(i === 1 ? "48%" : "60%", 3, color)}
          {bar("18%", 3, color)}
        </div>
      ))}
    </div>
  );

  if (layout === "banner") {
    return (
      <div className="flex h-full flex-col">
        <div
          className="flex flex-col gap-1.5 p-2.5"
          style={{ backgroundColor: p.band, height: "42%" }}
        >
          {bar("40%", 3, p.bandMuted)}
          <div className="mt-auto flex flex-col gap-1">
            {bar("30%", 2, p.bandMuted)}
            {bar("62%", 7, p.bandInk)}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-2.5">
          {bar("100%", 1.5, p.ink, { opacity: 0.8 })}
          {rows(p.line)}
          <div className="mt-auto self-end">{bar("44%", 4, p.accent, { width: 36 })}</div>
        </div>
      </div>
    );
  }

  if (layout === "editorial") {
    return (
      <div className="flex h-full flex-col gap-2.5 p-3">
        {bar("36%", 2.5, p.muted, { opacity: 0.6 })}
        <div className="mt-2 flex flex-col gap-1.5">
          {bar("70%", 9, p.ink)}
          {bar("12px", 1.5, p.accent)}
        </div>
        <div className="mt-1 flex flex-col gap-[6px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ borderBottom: `1px solid ${p.line}`, paddingBottom: 4 }}
              className="flex justify-between"
            >
              {bar(i === 1 ? "44%" : "56%", 2.5, p.muted, { opacity: 0.5 })}
              {bar("16%", 2.5, p.muted, { opacity: 0.5 })}
            </div>
          ))}
        </div>
        <div className="mt-auto self-end">{bar("36px", 5, p.accent)}</div>
      </div>
    );
  }

  if (layout === "sidebar") {
    return (
      <div className="flex h-full">
        <div className="flex w-[36%] flex-col gap-2 p-2" style={{ backgroundColor: p.band }}>
          {bar("70%", 3, p.bandInk)}
          {bar("50%", 2, p.bandMuted)}
          <div className="mt-2 flex flex-col gap-1.5">
            {bar("40%", 2, p.bandAccent)}
            {bar("80%", 2, p.bandMuted)}
            {bar("60%", 2, p.bandMuted)}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-2.5">
          {bar("58%", 6, p.ink)}
          {bar("100%", 1.5, p.ink, { opacity: 0.8 })}
          {rows(p.line)}
          <div className="mt-auto rounded p-1.5" style={{ backgroundColor: p.accentSoft }}>
            {bar("60%", 4, p.accent, { marginLeft: "auto" })}
          </div>
        </div>
      </div>
    );
  }

  // letterhead
  return (
    <div className="flex h-full flex-col">
      {bar("100%", 3, p.accent, { borderRadius: 0 })}
      <div className="flex flex-1 flex-col gap-2.5 p-2.5">
        <div className="flex justify-between">
          <div className="flex w-1/2 flex-col gap-1">
            {bar("80%", 3, p.ink)}
            {bar("60%", 2, p.muted, { opacity: 0.5 })}
          </div>
          {bar("34%", 6, p.accent)}
        </div>
        <div className="rounded-sm" style={{ backgroundColor: p.accentSoft, height: 6 }} />
        {rows(p.line)}
        <div
          className="mt-auto self-end rounded p-1.5"
          style={{ backgroundColor: p.accentSoft, width: "52%" }}
        >
          {bar("70%", 4, p.accent, { marginLeft: "auto" })}
        </div>
      </div>
    </div>
  );
}
