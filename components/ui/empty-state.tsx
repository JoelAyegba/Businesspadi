import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Empty state with illustrated icon plate.
 *
 * Design decisions:
 * - Tinted icon plate with a soft glow ring for visual weight
 * - Dashed border conveys "nothing here yet" without being blank
 * - Clear title + description + action pattern for discoverability
 * - Centered layout with constrained max-width for readability
 * - Animation on icon for visual interest
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border/70 bg-card/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/5 blur-xl" />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/10" />
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </div>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
