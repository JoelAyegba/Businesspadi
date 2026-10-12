import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { getServerContext } from "@/lib/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { hexToHsl } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Suspense } from "react";
import { NotificationBell } from "@/components/dashboard/notification-bell";

/**
 * Protected layout for /app/*.
 *
 * Design decisions:
 * - Fixed sidebar (240px) with brand identity at the top, plan info at the bottom
 * - Header uses glassmorphism for a modern, layered feel
 * - Content constrained to 1200px for optimal readability
 * - Subtle gradient accent line on sidebar for brand reinforcement
 * - Mobile: header + bottom tab bar pattern for thumb-reach navigation
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getServerContext();
  const needsOnboarding = ctx.business && !ctx.business.profileComplete;

  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      {/* ─── Onboarding Wizard (for new users) ─────────────────────── */}
      {needsOnboarding && <OnboardingWizard />}
      {/* ─── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary-foreground">
              <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" fill="currentColor" opacity="0.2" />
              <path d="M5 6h6M5 8.5h4M5 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <Link href="/app/dashboard" className="text-base font-semibold tracking-tight text-foreground">
            ReceiptFlow
          </Link>
        </div>

        {/* Navigation */}
        <SidebarNav />

        {/* Plan info */}
        <div className="mt-auto border-t border-border px-4 py-4">
          <div className="rounded-lg bg-primary/5 px-3 py-3">
            <p className="truncate text-xs font-semibold text-foreground">{ctx.business?.name ?? "No business"}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Free plan · <span className="text-primary font-medium cursor-pointer hover:underline">Upgrade</span></p>
          </div>
        </div>
      </aside>

      {/* ─── Main Column ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border/30 bg-background/60 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            {/* Mobile brand */}
            <Link href="/app/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-primary-foreground">
                  <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" fill="currentColor" opacity="0.2" />
                  <path d="M5 6h6M5 8.5h4M5 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">ReceiptFlow</span>
            </Link>

            {/* Desktop: business name */}
            <span className="hidden truncate text-sm font-medium text-foreground lg:inline">
              {ctx.business?.name ?? "No business"}
            </span>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <button
                type="button"
                aria-label="Search"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Search className="h-4 w-4" />
              </button>

              <ThemeToggle />

              {/* Notifications */}
              {ctx.business ? (
                <Suspense
                  fallback={
                    <button
                      type="button"
                      aria-label="Notifications loading"
                      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                  }
                >
                  <NotificationBell businessId={ctx.business.id} />
                </Suspense>
              ) : (
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Bell className="h-4 w-4" />
                </button>
              )}

              {/* Divider */}
              <div className="mx-2 hidden h-5 w-px bg-border/50 sm:block" aria-hidden />

              {/* User */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>

      {/* ─── Mobile Bottom Nav ──────────────────────────────────────── */}
      <BottomNav />
    </div>
  );
}
