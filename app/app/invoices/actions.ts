"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireBusinessContext } from "@/lib/auth";
import { generateDocumentNumber } from "@/lib/queries/receipt-number";
import { SNAPSHOT_SELECT } from "@/lib/queries/business-view";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Mark an ISSUED invoice as PAID and generate a linked RECEIPT (proof of
 * payment). Idempotent: if the invoice is already PAID, returns the id of the
 * receipt already generated from it.
 *
 * The generated receipt reuses the invoice's frozen `businessSnapshot` (not a
 * fresh live read) so the proof-of-payment always matches the invoice it
 * proves, and copies the invoice's money fields + line items verbatim.
 */
export async function markInvoicePaid(
  invoiceId: string,
  paymentMethod?: string,
): Promise<{ ok: true; receiptId: string } | { ok: false; error: string }> {
  const { business } = await requireBusinessContext();

  const invoice = await prisma.receipt.findFirst({
    where: { id: invoiceId, businessId: business.id, documentType: "INVOICE" },
    include: {
      lineItems: { orderBy: { position: "asc" } },
      generatedReceipt: { select: { id: true } },
    },
  });
  if (!invoice) return { ok: false, error: "Invoice not found" };
  if (invoice.status === "PAID") {
    if (invoice.generatedReceipt) return { ok: true, receiptId: invoice.generatedReceipt.id };
    return { ok: false, error: "Invoice is already paid" };
  }
  if (invoice.status !== "ISSUED") {
    return { ok: false, error: "Only issued invoices can be marked paid" };
  }

  const now = new Date();

  const receipt = await prisma.$transaction(async (tx) => {
    // Claim the ISSUED → PAID transition first. A concurrent double-submit
    // finds count === 0 here and creates no second receipt.
    const { count } = await tx.receipt.updateMany({
      where: { id: invoice.id, businessId: business.id, documentType: "INVOICE", status: "ISSUED" },
      data: { status: "PAID", paidAt: now, paymentMethod: paymentMethod ?? null },
    });
    if (count === 0) return null;

    const number = await generateDocumentNumber(tx, business.id, "RECEIPT", now);
    const created = await tx.receipt.create({
      data: {
        businessId: business.id,
        clientId: invoice.clientId,
        number,
        documentType: "RECEIPT",
        status: "PAID",
        issueDate: invoice.issueDate,
        paidAt: now,
        paymentMethod: paymentMethod ?? null,
        sourceInvoiceId: invoice.id,
        currency: invoice.currency,
        taxRate: invoice.taxRate,
        discountType: invoice.discountType,
        discountValue: invoice.discountValue,
        notes: invoice.notes,
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
        total: invoice.total,
        // Reuse the invoice's frozen identity — do NOT re-read live branding.
        businessSnapshot: invoice.businessSnapshot as object,
        lineItems: {
          create: invoice.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            subtotal: li.subtotal,
            position: li.position,
          })),
        },
      },
      select: { id: true },
    });

    return created;
  });

  if (!receipt) {
    const winner = await prisma.receipt.findFirst({
      where: { sourceInvoiceId: invoice.id, businessId: business.id, documentType: "RECEIPT" },
      select: { id: true },
    });
    return winner ? { ok: true, receiptId: winner.id } : { ok: false, error: "Invoice is no longer open" };
  }

  revalidatePath("/app/invoices");
  revalidatePath(`/app/invoices/${invoiceId}`);
  revalidatePath("/app/receipts");
  revalidatePath(`/app/receipts/${receipt.id}`);
  revalidatePath("/app/dashboard");
  revalidateTag(`receipts-${business.id}`);
  return { ok: true, receiptId: receipt.id };
}

/** Void an invoice — non-destructive, mirrors voidReceipt. Idempotent on VOID. */
export async function voidInvoice(invoiceId: string): Promise<ActionResult> {
  const { business } = await requireBusinessContext();
  const invoice = await prisma.receipt.findFirst({
    where: { id: invoiceId, businessId: business.id, documentType: "INVOICE" },
    select: { id: true, status: true },
  });
  if (!invoice) return { ok: false, error: "Invoice not found" };
  if (invoice.status === "VOID") return { ok: true };
  if (invoice.status === "PAID") return { ok: false, error: "Paid invoices cannot be voided" };

  await prisma.receipt.updateMany({
    where: { id: invoiceId, businessId: business.id, documentType: "INVOICE", status: { in: ["DRAFT", "ISSUED"] } },
    data: { status: "VOID" },
  });
  revalidatePath(`/app/invoices/${invoiceId}`);
  revalidatePath("/app/invoices");
  revalidatePath("/app/dashboard");
  revalidateTag(`receipts-${business.id}`);
  return { ok: true };
}

/** Duplicate an invoice as a fresh DRAFT with a new invoice number. */
export async function duplicateInvoice(
  invoiceId: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { business } = await requireBusinessContext();

  const source = await prisma.receipt.findFirst({
    where: { id: invoiceId, businessId: business.id, documentType: "INVOICE" },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!source) return { ok: false, error: "Invoice not found" };

  const biz = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    select: SNAPSHOT_SELECT,
  });

  const created = await prisma.$transaction(async (tx) => {
    const number = await generateDocumentNumber(tx, business.id, "INVOICE");
    return tx.receipt.create({
      data: {
        businessId: business.id,
        clientId: source.clientId,
        number,
        documentType: "INVOICE",
        status: "DRAFT",
        issueDate: new Date(),
        paymentTerms: source.paymentTerms,
        currency: source.currency,
        taxRate: source.taxRate,
        discountType: source.discountType,
        discountValue: source.discountValue,
        notes: source.notes,
        subtotal: source.subtotal,
        taxTotal: source.taxTotal,
        total: source.total,
        businessSnapshot: biz as object,
        lineItems: {
          create: source.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            subtotal: li.subtotal,
            position: li.position,
          })),
        },
      },
      select: { id: true },
    });
  });

  revalidatePath("/app/invoices");
  revalidateTag(`receipts-${business.id}`);
  return { ok: true, id: created.id };
}
