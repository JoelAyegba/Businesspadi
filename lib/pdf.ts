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
import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildDocModel, type DocModel } from "@/lib/document-model";
import { ReceiptPdfDocument } from "@/lib/pdf/receipt-pdf";
import { toBusinessView } from "@/lib/queries/business-view";
import { receiptInclude, toView } from "@/lib/queries/receipts";

// renderToBuffer is typed for ReactElement<DocumentProps>; our component
// returns a <Document> at runtime but TS only sees the prop shape, hence
// this cast at the boundary.
type DocumentElement = ReactElement<DocumentProps>;

export type ReceiptPdfInput = {
  receiptId: string;
  businessId: string;
  documentType?: DocumentType;
};

/** Render an already-built document model (also used by the template preview script). */
export async function renderDocModelPdf(model: DocModel): Promise<Uint8Array> {
  const element = createElement(ReceiptPdfDocument, { model }) as DocumentElement;
  return new Uint8Array(await renderToBuffer(element));
}

/**
 * Load the receipt/invoice + (snapshot) business profile and render to PDF
 * bytes in the document's chosen template. Always scopes by `businessId` and
 * `documentType` — never trust the caller to have done so.
 */
export async function renderReceiptPdf({
  receiptId,
  businessId,
  documentType = "RECEIPT",
}: ReceiptPdfInput): Promise<Uint8Array> {
  const [receipt, live] = await Promise.all([
    prisma.receipt.findFirst({
      where: { id: receiptId, businessId, documentType },
      include: receiptInclude,
    }),
    prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
  ]);
  if (!receipt) throw new Error("Document not found");

  // Snapshot overlay: the branding the document was issued with, not today's.
  const business = toBusinessView(live, receipt.businessSnapshot);
  return renderDocModelPdf(buildDocModel(toView(receipt), business));
}

/** Filename per spec (Phase 2 §6.3): <business-slug>-<receipt-number>.pdf */
export function pdfFilename(businessSlug: string, receiptNumber: string) {
  const safe = receiptNumber.replace(/[^A-Za-z0-9._-]/g, "_");
  return `${businessSlug}-${safe}.pdf`;
}
