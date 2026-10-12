/**
 * Public receipt lookup by shareId.
 *
 * This is the ONE place in the app that does not scope by businessId.
 * The shareId is opaque (nanoid, 12 chars) and acts as the auth token.
 * Treat it as security-sensitive: never log it, never include it in
 * analytics events, and never accept it from anywhere except the URL.
 */
import { prisma } from "@/lib/db";
import type { MockReceipt, MockBusiness, ReceiptStatus } from "@/lib/mock";
import type { Prisma } from "@prisma/client";
import { toBusinessView } from "@/lib/queries/business-view";

function toNumber(d: Prisma.Decimal | number | string): number {
  if (typeof d === "number") return d;
  if (typeof d === "string") return parseFloat(d);
  return d.toNumber();
}

export type PublicReceiptView = {
  receipt: MockReceipt;
  business: MockBusiness;
};

export async function getPublicReceipt(shareId: string): Promise<PublicReceiptView | null> {
  const r = await prisma.receipt.findUnique({
    where: { shareId },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true } },
      lineItems: { orderBy: { position: "asc" } },
      business: true,
    },
  });
  if (!r) return null;

  // Only receipts are publicly shareable in v1 (invoices never get a shareId).
  if (r.documentType !== "RECEIPT") return null;

  // Voided receipts shouldn't be publicly viewable.
  if (r.status === "VOID") return null;

  return {
    receipt: {
      id: r.id,
      businessId: r.businessId,
      clientId: r.clientId,
      number: r.number,
      status: r.status as ReceiptStatus,
      issueDate: r.issueDate.toISOString().slice(0, 10),
      paidAt: r.paidAt ? r.paidAt.toISOString().slice(0, 10) : null,
      currency: r.currency,
      subtotal: toNumber(r.subtotal),
      taxRate: toNumber(r.taxRate),
      taxTotal: toNumber(r.taxTotal),
      total: toNumber(r.total),
      discountValue: toNumber(r.discountValue),
      notes: r.notes,
      templateId: r.templateId,
      client: r.client ? { id: r.client.id, name: r.client.name, email: r.client.email, phone: r.client.phone } : null,
      lineItems: r.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: toNumber(li.quantity),
        unitPrice: toNumber(li.unitPrice),
        subtotal: toNumber(li.subtotal),
      })),
    },
    // Snapshot overlay: show the branding the receipt was issued with.
    business: toBusinessView(r.business, r.businessSnapshot),
  };
}
