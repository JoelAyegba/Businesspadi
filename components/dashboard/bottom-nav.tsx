"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

/**
 * Mobile bottom tab bar.
 *
 * Design decisions:
 * - Glassmorphism background for depth
 * - Active tab gets a filled dot indicator above the icon
 * - Smooth color transitions on tap
 * - Safe area padding for notched devices
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/30 bg-background/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:shadow-[0_-8px_40px_rgba(0,0,0,0.6)] lg:hidden"
    >
      <ul className="flex h-16 w-full items-center justify-around px-2 sm:px-6">
        {navItems.filter(item => item.label !== "Billing").map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="group flex flex-col items-center justify-center gap-1 h-full py-1"
                aria-current={active ? "page" : undefined}
              >
                <div
                  className={cn(
                    "flex h-[28px] w-[44px] items-center justify-center rounded-full transition-all duration-300",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:bg-secondary/50 group-hover:text-foreground",
                  )}
                >
                  <Icon strokeWidth={1.5} className={cn("h-[17px] w-[17px] transition-transform duration-300", active && "scale-[1.15]")} aria-hidden />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-medium transition-all duration-300",
                    active ? "text-primary opacity-100" : "text-muted-foreground opacity-70 group-hover:opacity-100",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
