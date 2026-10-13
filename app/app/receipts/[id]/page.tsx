import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptDocument } from "@/components/receipt/receipt-document";
import { StatusBadge } from "@/components/receipt/status-badge";
import { ShareMenu } from "@/components/receipt/share-menu";
import { ReceiptActionsMenu } from "@/components/receipt/receipt-actions-menu";
import { EmailSendButton } from "@/components/receipt/email-send-button";
import { requireBusinessContext } from "@/lib/auth";
import { getReceipt } from "@/lib/queries/receipts";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toBusinessView } from "@/lib/queries/business-view";

export default async function ReceiptDetailPage({ params }: { params: { id: string } }) {
  const { business } = await requireBusinessContext();
  const [receipt, biz, docMeta] = await Promise.all([
    getReceipt(business.id, params.id),
    prisma.business.findUniqueOrThrow({ where: { id: business.id } }),
    prisma.receipt.findFirst({
      where: { id: params.id, businessId: business.id, documentType: "RECEIPT" },
      select: { shareId: true, businessSnapshot: true },
    }),
  ]);
  if (!receipt) notFound();

  const businessView = toBusinessView(biz, docMeta?.businessSnapshot ?? null);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/app/receipts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All receipts
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate font-mono text-lg font-semibold sm:text-xl">
              {receipt.number}
            </h1>
            <StatusBadge status={receipt.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {receipt.client?.name ?? "Walk-in customer"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={`/app/receipts/${receipt.id}/pdf`} download>
              <Download className="h-4 w-4" /> PDF
            </a>
          </Button>
          <EmailSendButton
            receiptId={receipt.id}
            defaultEmail={receipt.client?.email}
            status={receipt.status}
          />
          <ShareMenu
            receiptId={receipt.id}
            receiptNumber={receipt.number}
            businessName={businessView.name}
            totalLabel={formatMoney(receipt.total, receipt.currency)}
            initialShareId={docMeta?.shareId ?? null}
          />
          <ReceiptActionsMenu receiptId={receipt.id} status={receipt.status} />
        </div>
      </header>

      {receipt.sourceInvoiceId && (
        <Link
          href={`/app/invoices/${receipt.sourceInvoiceId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <FileText className="h-4 w-4" />
          Generated from invoice {receipt.sourceInvoiceNumber}
        </Link>
      )}

      <ReceiptDocument receipt={receipt} business={businessView} templateId={receipt.templateId} />
    </div>
  );
}
