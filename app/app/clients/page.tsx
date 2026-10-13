import Link from "next/link";
import { Plus, Mail, Phone, Users, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientActions } from "@/components/clients/client-actions";
import { AddClientButton } from "@/components/clients/add-client-button";
import { formatMoney, cn } from "@/lib/utils";
import { requireBusinessContext } from "@/lib/auth";
import { listClientsWithStats } from "@/lib/queries/clients";
import { prisma } from "@/lib/db";

/**
 * Client Directory page.
 *
 * Design decisions:
 * - Client avatar with colored initials for quick visual identification
 * - Color palette is deterministic based on client ID (consistent across views)
 * - Desktop: clean data table with sortable column headers, hover actions
 * - Mobile: card-based layout with all info visible
 * - "New Receipt" action on each row appears on hover (desktop) or always (mobile)
 * - Search bar at top for quick client lookup
 * - Empty state with illustrated placeholder and clear CTA
 */

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const palette = [
  "bg-primary/10 text-primary",
  "bg-emerald-500/10 text-emerald-700",
  "bg-amber-500/10 text-amber-700",
  "bg-rose-500/10 text-rose-700",
  "bg-violet-500/10 text-violet-700",
  "bg-cyan-500/10 text-cyan-700",
];

function avatarColor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default async function ClientsPage() {
  const { business } = await requireBusinessContext();
  const [rows, biz] = await Promise.all([
    listClientsWithStats(business.id),
    prisma.business.findUniqueOrThrow({
      where: { id: business.id },
      select: { defaultCurrency: true },
    }),
  ]);
  const currency = biz.defaultCurrency;

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="animate-fade-in flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px] sm:leading-tight">
              Clients
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
              {rows.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your client directory · sorted by total billed
          </p>
        </div>
        <AddClientButton />
      </header>

      {/* ─── Search ─────────────────────────────────────────────── */}
      <div className="animate-fade-in-delay-1 relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search clients..."
          className="pl-10"
          aria-label="Search clients"
        />
      </div>

      {/* ─── Content ────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Save a client once and their info auto-fills on every future receipt."
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add your first client
            </Button>
          }
        />
      ) : (
        <div className="animate-fade-in-delay-2">
          {/* Mobile cards */}
          <ul className="flex flex-col gap-2.5 md:hidden">
            {rows.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      avatarColor(c.id),
                    )}
                  >
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/app/clients/${c.id}`}
                      className="block truncate text-base font-semibold hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.email ?? c.phone ?? "No contact info"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-bold tabular-nums">
                        {formatMoney(c.totalBilled, currency)}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                        {c.receiptCount} receipts
                      </span>
                    </div>
                  </div>
                </div>
                <ClientActions client={c} isMobile={true} />
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_1px_3px_rgba(15,23,42,0.04)] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-surface/50">
                  <th scope="col" className="px-5 py-3.5 text-left">
                    <button className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                      Client <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Contact
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    <button className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                      Receipts <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    <button className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                      Total billed <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Last receipt
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`group border-b border-border/40 transition-colors last:border-0 hover:bg-primary/[0.03] ${i % 2 === 1 ? "bg-surface/30" : ""}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            avatarColor(c.id),
                          )}
                        >
                          {initials(c.name)}
                        </div>
                        <Link
                          href={`/app/clients/${c.id}`}
                          className="font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {c.email && (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <Mail className="h-3 w-3" /> {c.email}
                          </span>
                        )}
                        {c.phone && (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </span>
                        )}
                        {!c.email && !c.phone && <span className="text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {c.receiptCount}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold tabular-nums">
                      {formatMoney(c.totalBilled, currency)}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                      {c.lastIssueDate ? dateFmt.format(new Date(c.lastIssueDate)) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <ClientActions client={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
