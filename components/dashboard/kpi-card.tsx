import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * KPI metric card for dashboard.
 *
 * Design decisions:
 * - Hover-lift micro-interaction for perceived interactivity
 * - Icon sits in a tinted rounded container with subtle glow
 * - Value uses tabular-nums for alignment in grids
 * - Trend hint (optional) appears below the value in muted text
 * - Responsive: compact on mobile, spacious on desktop
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: _Icon, // unused, keep for backwards compatibility if needed
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <Card className="hover-lift group relative overflow-hidden transition-all duration-300 hover:border-slate-300/80 dark:hover:border-slate-700">
      <CardContent className="flex flex-col gap-2 p-5 sm:p-6">
        {/* Glow behind the text */}
        <div
          className={cn(
            "pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-[0.03] blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.08]",
            tone === "success" && "bg-emerald-500",
            tone === "warning" && "bg-amber-500",
            tone === "default" && "bg-blue-600",
          )}
          aria-hidden
        />

        {/* Label */}
        <p className="z-10 flex items-center gap-2 text-xs font-semibold tracking-tight text-slate-500 dark:text-slate-400">
          {label}
        </p>

        {/* Value and Hint */}
        <div className="z-10 mt-1">
          <p className="break-all text-xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            {value}
          </p>
          {hint && (
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
