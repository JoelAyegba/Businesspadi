import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReceiptList } from "@/components/receipt/receipt-list";
import { listRecents } from "@/lib/queries/receipts";
import { prisma } from "@/lib/db";

export async function RecentSection({ businessId }: { businessId: string }) {
  const [recents, totalCount] = await Promise.all([
    listRecents(businessId, { take: 8 }),
    prisma.receipt.count({ where: { businessId } }),
  ]);

  return (
    <section className="animate-fade-in-delay-3 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Recents</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/receipts"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Receipts
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/app/invoices"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Invoices
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <ReceiptList receipts={recents} showType />
    </section>
  );
}
