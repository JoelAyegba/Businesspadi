/**
 * PDF generation entry point.
 *
 * Library: @react-pdf/renderer (DECISIONS.md 0004). The component tree lives
 * in lib/pdf/receipt-pdf.tsx; this module is the boundary the rest of the
 * app depends on — callers get bytes, not React.
 *
 * Server-rendered: routes call renderReceiptPdf() and stream the result.
 */
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { prisma } from "@/lib/db";
import { ReceiptPdfDocument, type PdfReceiptInput } from "@/lib/pdf/receipt-pdf";
import { applySnapshot, DEFAULT_BRAND_COLOR, SNAPSHOT_SELECT } from "@/lib/queries/business-view";

// renderToBuffer is typed for ReactElement<DocumentProps>; our component
// returns a <Document> at runtime but TS only sees the prop shape, hence
// this cast at the boundary.
type DocumentElement = ReactElement<DocumentProps>;

export type ReceiptPdfInput = { receiptId: string; businessId: string };

/**
 * Load the receipt + (snapshot) business profile and render to PDF bytes.
 * Always scopes by `businessId` — never trust the caller to have done so.
 */
export async function renderReceiptPdf({ receiptId, businessId }: ReceiptPdfInput): Promise<Uint8Array> {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, businessId, documentType: "RECEIPT" },
    include: { client: true, lineItems: { orderBy: { position: "asc" } } },
  });
  if (!receipt) throw new Error("Receipt not found");

  // Prefer the snapshot frozen at issue time so retroactive branding edits
  // never rewrite history. Fall back to live business for legacy rows.
  const live = await prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: SNAPSHOT_SELECT });
  const biz = applySnapshot(live, receipt.businessSnapshot);

  const data: PdfReceiptInput = {
    number: receipt.number,
    status: receipt.status,
    issueDate: receipt.issueDate.toISOString().slice(0, 10),
    paidAt: receipt.paidAt ? receipt.paidAt.toISOString().slice(0, 10) : null,
    currency: receipt.currency,
    taxRate: Number(receipt.taxRate),
    subtotal: Number(receipt.subtotal),
    taxTotal: Number(receipt.taxTotal),
    total: Number(receipt.total),
    notes: receipt.notes,
    client: receipt.client
      ? { name: receipt.client.name, email: receipt.client.email }
      : null,
    lineItems: receipt.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      subtotal: Number(li.subtotal),
    })),
    business: { ...biz, brandColor: biz.brandColor ?? DEFAULT_BRAND_COLOR },
  };

  const element = createElement(ReceiptPdfDocument, { data }) as DocumentElement;
  const buffer = await renderToBuffer(element);
  return new Uint8Array(buffer);
}

/** Filename per spec (Phase 2 §6.3): <business-slug>-<receipt-number>.pdf */
export function pdfFilename(businessSlug: string, receiptNumber: string) {
  const safe = receiptNumber.replace(/[^A-Za-z0-9._-]/g, "_");
  return `${businessSlug}-${safe}.pdf`;
}
