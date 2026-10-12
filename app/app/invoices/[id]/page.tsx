import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { ReceiptDocument } from "@/components/receipt/receipt-document";
import { StatusBadge } from "@/components/receipt/status-badge";
import { ReceiptActionsMenu } from "@/components/receipt/receipt-actions-menu";
import { requireBusinessContext } from "@/lib/auth";
import { getInvoice } from "@/lib/queries/invoices";
import { prisma } from "@/lib/db";
import { toBusinessView } from "@/lib/queries/business-view";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { business } = await requireBusinessContext();
  const [invoice, biz, docMeta] = await Promise.all([
    getInvoice(business.id, params.id),
    prisma.business.findUniqueOrThrow({ where: { id: business.id } }),
    prisma.receipt.findFirst({
      where: { id: params.id, businessId: business.id, documentType: "INVOICE" },
      select: { businessSnapshot: true },
    }),
  ]);
  if (!invoice) notFound();

  const businessView = toBusinessView(biz, docMeta?.businessSnapshot ?? null);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/app/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All invoices
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate font-mono text-lg font-semibold sm:text-xl">{invoice.number}</h1>
            <StatusBadge status={invoice.status} documentType="INVOICE" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.client?.name ?? "Walk-in customer"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ReceiptActionsMenu receiptId={invoice.id} status={invoice.status} documentType="INVOICE" />
        </div>
      </header>

      {invoice.status === "PAID" && invoice.generatedReceiptId && (
        <Link
          href={`/app/receipts/${invoice.generatedReceiptId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
        >
          <ReceiptText className="h-4 w-4" />
          Paid — view generated receipt {invoice.generatedReceiptNumber}
        </Link>
      )}

      <ReceiptDocument receipt={invoice} business={businessView} templateId={invoice.templateId} />
    </div>
  );
}
