import { cn } from "@/lib/utils";

/**
 * Skeleton loader with shimmer animation.
 *
 * Design decisions:
 * - Uses custom shimmer animation (gradient sweep) instead of simple pulse
 * - Rounded corners match the component being loaded
 * - Subtle background for low-contrast, non-jarring loading state
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-shimmer rounded-md", className)} {...props} />;
}

export { Skeleton };
