"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Copy, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markPaid, voidReceipt, duplicateReceipt } from "@/app/app/receipts/actions";
import { markInvoicePaid, voidInvoice, duplicateInvoice } from "@/app/app/invoices/actions";
import type { DocumentType } from "@/lib/mock";

type Props = {
  receiptId: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "VOID";
  documentType?: DocumentType;
};

/**
 * Detail-page actions menu — Edit (drafts only), Duplicate, Mark Paid (issued
 * only), Void. Works for both receipts and invoices; the invoice variant
 * calls the invoice actions and, on Mark-paid, routes to the receipt that
 * gets generated. Server actions enforce business scoping; this is a thin
 * wrapper with router.refresh() to re-render the page.
 */
export function ReceiptActionsMenu({ receiptId, status, documentType = "RECEIPT" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isInvoice = documentType === "INVOICE";
  const basePath = isInvoice ? "/app/invoices" : "/app/receipts";
  const noun = isInvoice ? "invoice" : "receipt";

  const run = (fn: () => Promise<{ ok: boolean; error?: string; id?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        alert(r.error ?? "Action failed");
        return;
      }
      if ("id" in r && r.id) {
        router.push(`${basePath}/${r.id}`);
        return;
      }
      router.refresh();
    });

  // Mark-paid: receipts flip in place; invoices generate a linked receipt and
  // we navigate to it.
  const handleMarkPaid = () =>
    startTransition(async () => {
      if (isInvoice) {
        const r = await markInvoicePaid(receiptId);
        if (!r.ok) {
          alert(r.error ?? "Action failed");
          return;
        }
        router.push(`/app/receipts/${r.receiptId}`);
        return;
      }
      const r = await markPaid(receiptId);
      if (!r.ok) {
        alert(r.error ?? "Action failed");
        return;
      }
      router.refresh();
    });

  const canEdit = status === "DRAFT";
  const canMarkPaid = status === "ISSUED";
  // Receipts can be voided even when paid (refund/correction); paid invoices
  // are locked because they've already spawned a receipt.
  const canVoid = status !== "VOID" && !(isInvoice && status === "PAID");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-label="More actions"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          <span className="sm:sr-only">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canEdit && (
          <DropdownMenuItem onSelect={() => router.push(`${basePath}/${receiptId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
        {canMarkPaid && (
          <DropdownMenuItem onSelect={handleMarkPaid}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as paid
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() =>
            run(() => (isInvoice ? duplicateInvoice(receiptId) : duplicateReceipt(receiptId)))
          }
        >
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </DropdownMenuItem>
        {canVoid && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => {
                if (confirm(`Void this ${noun}? It will be kept for audit but marked as void.`)) {
                  run(() => (isInvoice ? voidInvoice(receiptId) : voidReceipt(receiptId)));
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Void
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
