"use client";

import { useMemo, useState } from "react";
import { Search, X, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ReceiptList } from "@/components/receipt/receipt-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MockReceipt, ReceiptStatus } from "@/lib/mock";

type FilterValue = "ALL" | ReceiptStatus;

const filters: { value: FilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ISSUED", label: "Issued" },
  { value: "PAID", label: "Paid" },
  { value: "VOID", label: "Void" },
];

/**
 * Receipt filters — search + status filter pills.
 *
 * Design decisions:
 * - Search input with icon prefix for affordance
 * - Clear button appears only when search has content
 * - Status filter pills with count badges
 * - Active pill uses primary color fill
 * - Smooth transition between filter states
 * - Empty state with reset action for discoverability
 */
export function ReceiptFilters({
  receipts,
  basePath = "/app/receipts",
  noun = "receipt",
}: {
  receipts: MockReceipt[];
  basePath?: string;
  noun?: string;
}) {
  const [status, setStatus] = useState<FilterValue>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return receipts.filter((r) => {
      if (status !== "ALL" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.number.toLowerCase().includes(q) ||
        r.client?.name.toLowerCase().includes(q) ||
        false
      );
    });
  }, [receipts, status, query]);

  const counts = useMemo(() => {
    const c: Record<FilterValue, number> = { ALL: receipts.length, DRAFT: 0, ISSUED: 0, PAID: 0, VOID: 0 };
    for (const r of receipts) c[r.status]++;
    return c;
  }, [receipts]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          inputMode="search"
          placeholder="Search by number or client name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          aria-label={`Search ${noun}s`}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status pills */}
      <div
        role="tablist"
        aria-label="Filter by status"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {filters.map((f) => {
          const active = status === f.value;
          return (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatus(f.value)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "border-border bg-background text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>{f.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {counts[f.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matches"
          description="Try a different search term or clear the status filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("ALL");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <ReceiptList receipts={filtered} basePath={basePath} noun={noun} />
      )}
    </div>
  );
}
