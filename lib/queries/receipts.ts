/**
 * Business-scoped receipt queries.
 *
 * Every function here REQUIRES a businessId from getServerContext() and
 * passes it to Prisma's WHERE. Don't add a function here that doesn't.
 *
 * Decimal/Date values from Prisma are converted to plain number/string at
 * this layer so the rest of the app (server components, components) sees
 * the same shape it sees from lib/mock. That keeps the UI swap zero-cost.
 */
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { DocumentType, MockReceipt, ReceiptStatus } from "@/lib/mock";

export const receiptInclude = {
  client: { select: { id: true, name: true, email: true, phone: true } },
  lineItems: { orderBy: { position: "asc" as const } },
  sourceInvoice: { select: { id: true, number: true } },
  generatedReceipt: { select: { id: true, number: true } },
};

type ReceiptWithRelations = Prisma.ReceiptGetPayload<{ include: typeof receiptInclude }>;

function toNumber(d: Prisma.Decimal | number | string): number {
  if (typeof d === "number") return d;
  if (typeof d === "string") return parseFloat(d);
  return d.toNumber();
}

function toIsoDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export function toView(r: ReceiptWithRelations): MockReceipt {
  return {
    id: r.id,
    businessId: r.businessId,
    clientId: r.clientId,
    number: r.number,
    documentType: r.documentType as DocumentType,
    status: r.status as ReceiptStatus,
    issueDate: toIsoDate(r.issueDate)!,
    paidAt: toIsoDate(r.paidAt),
    paymentMethod: r.paymentMethod,
    dueDate: toIsoDate(r.dueDate),
    paymentTerms: r.paymentTerms,
    currency: r.currency,
    subtotal: toNumber(r.subtotal),
    taxRate: toNumber(r.taxRate),
    taxTotal: toNumber(r.taxTotal),
    total: toNumber(r.total),
    discountValue: toNumber(r.discountValue),
    notes: r.notes,
    templateId: r.templateId,
    client: r.client
      ? { id: r.client.id, name: r.client.name, email: r.client.email, phone: r.client.phone }
      : null,
    lineItems: r.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: toNumber(li.quantity),
      unitPrice: toNumber(li.unitPrice),
      subtotal: toNumber(li.subtotal),
    })),
    sourceInvoiceId: r.sourceInvoiceId,
    sourceInvoiceNumber: r.sourceInvoice?.number ?? null,
    generatedReceiptId: r.generatedReceipt?.id ?? null,
    generatedReceiptNumber: r.generatedReceipt?.number ?? null,
  };
}

export function listReceipts(businessId: string, opts?: { take?: number }): Promise<MockReceipt[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.receipt.findMany({
        where: { businessId, documentType: "RECEIPT" },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        include: receiptInclude,
        take: opts?.take,
      });
      return rows.map(toView);
    },
    ["receipts", businessId, String(opts?.take ?? "all")],
    { revalidate: 30, tags: [`receipts-${businessId}`] },
  )();
}

/** Fetches the most-recent N documents across BOTH receipts and invoices. */
export function listRecents(businessId: string, opts?: { take?: number }): Promise<MockReceipt[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.receipt.findMany({
        where: { businessId },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        include: receiptInclude,
        take: opts?.take ?? 8,
      });
      return rows.map(toView);
    },
    ["recents", businessId, String(opts?.take ?? 8)],
    { revalidate: 30, tags: [`receipts-${businessId}`] },
  )();
}

export async function getReceipt(businessId: string, id: string): Promise<MockReceipt | null> {
  const r = await prisma.receipt.findFirst({
    where: { id, businessId, documentType: "RECEIPT" },
    include: receiptInclude,
  });
  return r ? toView(r) : null;
}
