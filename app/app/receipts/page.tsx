import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptFilters } from "@/components/receipt/receipt-filters";
import { requireBusinessContext } from "@/lib/auth";
import { listReceipts } from "@/lib/queries/receipts";

/**
 * Receipt List / History page.
 *
 * Design decisions:
 * - Page header with receipt count and sorting indicator
 * - Prominent "New receipt" CTA with shadow for depth
 * - ReceiptFilters component handles search + status filtering
 * - Staggered fade-in for smooth page load
 */
export default async function ReceiptsPage() {
  const { business } = await requireBusinessContext();
  const receipts = await listReceipts(business.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="animate-fade-in flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px] sm:leading-tight">
              Receipts
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
              {receipts.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all your receipts · sorted by issue date
          </p>
        </div>
        <Button asChild className="w-full gap-2 shadow-lg shadow-primary/20 sm:w-auto">
          <Link href="/app/receipts/new">
            <Plus className="h-4 w-4" /> New receipt
          </Link>
        </Button>
      </header>

      <div className="animate-fade-in-delay-1">
        <ReceiptFilters receipts={receipts} />
      </div>
    </div>
  );
}
