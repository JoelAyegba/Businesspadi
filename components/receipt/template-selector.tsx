"use client";

import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/lib/templates";
import { Check } from "lucide-react";

/**
 * Template Selector — mobile-first horizontal scrollable picker.
 *
 * Design: Each template is shown as a mini preview card with its
 * color scheme. Selected template gets a vivid ring + check badge.
 * Scrolls horizontally on mobile, wraps into a grid on desktop.
 */
export function TemplateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
      {TEMPLATES.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "group relative flex-shrink-0 snap-start flex flex-col rounded-2xl border-2 p-1 transition-all duration-300 w-[120px] sm:w-auto",
              selected
                ? "border-blue-600 shadow-[0_0_0_3px_rgba(37,99,235,0.15)] dark:border-blue-500 dark:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
            )}
          >
            {/* Mini preview */}
            <div className="relative overflow-hidden rounded-xl aspect-[3/4]">
              {/* Accent bar */}
              <div className="h-1" style={{ backgroundColor: t.preview.accentBg }} />
              {/* Header */}
              <div className="h-[35%]" style={{ backgroundColor: t.preview.headerBg }}>
                <div className="p-2">
                  <div className="h-1 w-6 rounded-full bg-white/40" />
                  <div className="mt-1 h-1 w-10 rounded-full bg-white/20" />
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 p-2" style={{ backgroundColor: t.preview.bodyBg }}>
                <div className="space-y-1">
                  <div className="h-1 w-full rounded-full" style={{ backgroundColor: `${t.preview.accentBg}30` }} />
                  <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: `${t.preview.accentBg}20` }} />
                  <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: `${t.preview.accentBg}15` }} />
                </div>
              </div>
              {/* Selected overlay */}
              {selected && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10 dark:bg-blue-500/10">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>
            {/* Label */}
            <div className="px-1.5 py-2 text-center">
              <p className={cn(
                "text-xs font-bold transition-colors",
                selected ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
              )}>
                {t.name}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-500 hidden sm:block">
                {t.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
