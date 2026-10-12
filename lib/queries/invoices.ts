/**
 * Business-scoped invoice queries.
 *
 * Invoices live in the same table as receipts, discriminated by
 * `documentType`. Every query here MUST filter `documentType: "INVOICE"` in
 * addition to `businessId`, or receipts would leak into invoice surfaces.
 *
 * Shares the row→view mapper (`toView`) and `receiptInclude` with
 * lib/queries/receipts.ts. Reuses the `receipts-${businessId}` cache tag (one
 * table, one invalidation) but with distinct cache-key arrays.
 */
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { MockReceipt } from "@/lib/mock";
import { receiptInclude, toView } from "@/lib/queries/receipts";

function toNumber(d: { toNumber: () => number } | number | string | null | undefined): number {
  if (d == null) return 0;
  if (typeof d === "number") return d;
  if (typeof d === "string") return parseFloat(d);
  return d.toNumber();
}

export function listInvoices(businessId: string, opts?: { take?: number }): Promise<MockReceipt[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.receipt.findMany({
        where: { businessId, documentType: "INVOICE" },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        include: receiptInclude,
        take: opts?.take,
      });
      return rows.map(toView);
    },
    ["invoices", businessId, String(opts?.take ?? "all")],
    { revalidate: 30, tags: [`receipts-${businessId}`] }
  )();
}

export async function getInvoice(businessId: string, id: string): Promise<MockReceipt | null> {
  const r = await prisma.receipt.findFirst({
    where: { id, businessId, documentType: "INVOICE" },
    include: receiptInclude,
  });
  return r ? toView(r) : null;
}

export type InvoiceKpis = {
  outstanding: number;
  draftCount: number;
  invoiceCount: number;
  unpaidCount: number;
  currency: string;
};

export function getInvoiceKpis(businessId: string, currency: string): Promise<InvoiceKpis> {
  return unstable_cache(
    async () => {
      const [outstandingAgg, draftCount, invoiceCount, unpaidCount] = await Promise.all([
        prisma.receipt.aggregate({
          where: { businessId, documentType: "INVOICE", status: "ISSUED" },
          _sum: { total: true },
        }),
        prisma.receipt.count({ where: { businessId, documentType: "INVOICE", status: "DRAFT" } }),
        prisma.receipt.count({
          where: { businessId, documentType: "INVOICE", status: { in: ["ISSUED", "PAID"] } },
        }),
        prisma.receipt.count({ where: { businessId, documentType: "INVOICE", status: "ISSUED" } }),
      ]);

      return {
        outstanding: toNumber(outstandingAgg._sum.total),
        draftCount,
        invoiceCount,
        unpaidCount,
        currency,
      };
    },
    ["invoice-kpis", businessId, currency],
    { revalidate: 60, tags: [`receipts-${businessId}`] }
  )();
}

export function getOverdueInvoices(businessId: string): Promise<MockReceipt[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.receipt.findMany({
        where: {
          businessId,
          documentType: "INVOICE",
          status: "ISSUED",
          dueDate: { lt: new Date() },
        },
        orderBy: { dueDate: "asc" },
        include: receiptInclude,
      });
      return rows.map(toView);
    },
    ["overdue-invoices", businessId],
    { revalidate: 60, tags: [`receipts-${businessId}`] }
  )();
}
