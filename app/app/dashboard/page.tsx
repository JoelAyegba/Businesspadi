import { Suspense } from "react";
import Link from "next/link";
import { Plus, FileText, Wallet, ArrowUpRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireBusinessContext } from "@/lib/auth";
import { KpiSection } from "./_components/kpi-section";
import { RecentSection } from "./_components/recent-section";

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

function RecentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  // This call is deduplicated by React.cache() — layout already called it,
  // so no extra DB roundtrip here.
  const { business } = await requireBusinessContext();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ─── Header — renders immediately ────────────────────────────── */}
      <header className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{greeting()}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">
            {business.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your business at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/app/invoices/new">
              <FileText className="h-4 w-4" /> New invoice
            </Link>
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20" asChild>
            <Link href="/app/receipts/new">
              <Plus className="h-4 w-4" /> New receipt
            </Link>
          </Button>
        </div>
      </header>

      {/* ─── KPI Grid — streams in ───────────────────────────────────── */}
      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection businessId={business.id} currency={business.defaultCurrency} />
      </Suspense>

      <section className="animate-fade-in-delay-2 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Link href="/app/receipts/new" className="group">
          <Card className="h-full border-slate-200/60 transition-all duration-500 hover:border-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] dark:border-slate-800 dark:hover:border-blue-500/30">
            <CardContent className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.3)] transition-transform duration-500 group-hover:scale-110 sm:h-12 sm:w-12">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Create receipt
                  </p>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-blue-600 opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 sm:h-4 sm:w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/invoices/new" className="group">
          <Card className="h-full border-slate-200/60 transition-all duration-500 hover:border-violet-500/40 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.15)] dark:border-slate-800 dark:hover:border-violet-500/30">
            <CardContent className="relative flex flex-col gap-3 overflow-hidden p-4 sm:gap-4 sm:p-6">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-500/5 p-8 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 transition-transform duration-500 group-hover:scale-110 dark:bg-violet-500/20 dark:text-violet-400 sm:h-12 sm:w-12">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="relative z-10 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Create invoice
                  </p>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-violet-600 opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 sm:h-4 sm:w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/products" className="group">
          <Card className="h-full border-slate-200/60 transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] dark:border-slate-800 dark:hover:border-emerald-500/30">
            <CardContent className="relative flex flex-col gap-3 overflow-hidden p-4 sm:gap-4 sm:p-6">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-500/5 p-8 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-transform duration-500 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400 sm:h-12 sm:w-12">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="relative z-10 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Add products
                  </p>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-emerald-600 opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 sm:h-4 sm:w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/settings" className="group">
          <Card className="h-full border-slate-200/60 transition-all duration-500 hover:border-slate-500/40 hover:shadow-[0_20px_40px_-15px_rgba(100,116,139,0.15)] dark:border-slate-800 dark:hover:border-slate-500/30">
            <CardContent className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-transform duration-500 group-hover:scale-110 dark:bg-slate-800 dark:text-slate-300 sm:h-12 sm:w-12">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Business settings
                  </p>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-600 opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-400 sm:h-4 sm:w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* ─── Recents — streams in ────────────────────────────────────── */}
      <Suspense fallback={<RecentSkeleton />}>
        <RecentSection businessId={business.id} />
      </Suspense>
    </div>
  );
}
