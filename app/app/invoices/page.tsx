import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptFilters } from "@/components/receipt/receipt-filters";
import { requireBusinessContext } from "@/lib/auth";
import { listInvoices } from "@/lib/queries/invoices";

/**
 * Invoice list / history page. Mirrors the receipts list but scoped to
 * INVOICE documents; reuses ReceiptFilters/ReceiptList parameterized by
 * basePath + noun.
 */
export default async function InvoicesPage() {
  const { business } = await requireBusinessContext();
  const invoices = await listInvoices(business.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="animate-fade-in flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px] sm:leading-tight">
              Invoices
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
              {invoices.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all your invoices · sorted by issue date
          </p>
        </div>
        <Button asChild className="w-full gap-2 shadow-lg shadow-primary/20 sm:w-auto">
          <Link href="/app/invoices/new">
            <Plus className="h-4 w-4" /> New invoice
          </Link>
        </Button>
      </header>

      <div className="animate-fade-in-delay-1">
        <ReceiptFilters receipts={invoices} basePath="/app/invoices" noun="invoice" />
      </div>
    </div>
  );
}
