import Link from "next/link";
import { ChevronRight, FileText, ArrowUpDown } from "lucide-react";
import { StatusBadge } from "@/components/receipt/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import type { MockReceipt } from "@/lib/mock";

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Receipt list — dual-presentation component.
 *
 * Design decisions:
 * - Mobile: card-based layout with tap-friendly targets and hover shadow lift
 * - Desktop: dense table with alternating row shading and sortable column headers
 * - Row hover highlight on desktop for scanability
 * - Receipt number is primary link (monospaced, brand-colored)
 * - Status badges use color-coded pills for instant recognition
 * - Empty state uses illustrated placeholder with clear CTA
 */
export function ReceiptList({
  receipts,
  basePath = "/app/receipts",
  noun = "receipt",
  showType = false,
}: {
  receipts: MockReceipt[];
  basePath?: string;
  noun?: string;
  showType?: boolean;
}) {
  /** Resolve the correct detail path per row when showing mixed types. */
  const rowPath = (r: MockReceipt) =>
    showType
      ? `${r.documentType === "INVOICE" ? "/app/invoices" : "/app/receipts"}/${r.id}`
      : `${basePath}/${r.id}`;
  if (receipts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={`No ${noun}s yet`}
        description={`Issue your first ${noun} to start tracking what's been billed and paid.`}
        action={
          <Button asChild>
            <Link href={`${basePath}/new`}>Create {noun}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      {/* ─── Mobile Cards ──────────────────────────────────────── */}
      <ul className="flex flex-col gap-3 md:hidden">
        {receipts.map((r) => (
          <li key={r.id}>
            <Link
              href={rowPath(r)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300/80 hover:shadow-md active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold text-slate-900 dark:text-white">
                    {r.client?.name ?? "Walk-in"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {showType && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          r.documentType === "INVOICE"
                            ? "border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400"
                            : "border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                        }`}
                      >
                        {r.documentType === "INVOICE" ? "Invoice" : "Receipt"}
                      </span>
                    )}
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="truncate font-mono text-xs font-medium text-blue-600 dark:text-blue-400">
                    {r.number}
                  </span>
                  <span className="font-medium tabular-nums">
                    {dateFmt.format(new Date(r.issueDate))}
                  </span>
                </div>
                <p className="mt-3 text-lg font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {formatMoney(r.total, r.currency)}
                </p>
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>

      {/* ─── Desktop Table ─────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/50 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
              <th scope="col" className="px-6 py-4 text-left">
                <button className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  Number <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <button className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  Client <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              {showType && (
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
                >
                  Type
                </th>
              )}
              <th scope="col" className="px-6 py-4 text-left">
                <button className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  Date <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
              >
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                <button className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  Total <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r, i) => (
              <tr
                key={r.id}
                className={`group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-900/50 ${i % 2 === 1 ? "bg-slate-50/30 dark:bg-slate-900/10" : ""}`}
              >
                <td className="px-6 py-4">
                  <Link
                    href={rowPath(r)}
                    className="font-mono text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {r.number}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {r.client?.name ?? <span className="font-normal text-slate-500">Walk-in</span>}
                  </span>
                </td>
                {showType && (
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        r.documentType === "INVOICE"
                          ? "border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400"
                          : "border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                      }`}
                    >
                      {r.documentType === "INVOICE" ? "Invoice" : "Receipt"}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 font-medium tabular-nums text-slate-500 dark:text-slate-400">
                  {dateFmt.format(new Date(r.issueDate))}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-6 py-4 text-right font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {formatMoney(r.total, r.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
