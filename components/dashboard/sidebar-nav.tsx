"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

/**
 * Desktop sidebar navigation.
 *
 * Design decisions:
 * - Active state uses a filled pill with primary color tint + left accent bar
 * - Icons are slightly larger (18px) for better visual weight
 * - Hover state transitions smoothly with background fill
 * - Active indicator slides using a pseudo-element for micro-interaction feel
 */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Main navigation">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary/10 text-primary shadow-[inset_3px_0_0_hsl(var(--primary))]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                !active && "group-hover:scale-110",
              )}
              aria-hidden
            />
            <span>{item.label}</span>
            {active && (
              <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" aria-hidden />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
