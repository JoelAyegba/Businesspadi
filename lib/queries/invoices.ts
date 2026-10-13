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
    { revalidate: 30, tags: [`receipts-${businessId}`] },
  )();
}

export async function getInvoice(businessId: string, id: string): Promise<MockReceipt | null> {
  const r = await prisma.receipt.findFirst({
    where: { id, businessId, documentType: "INVOICE" },
    include: receiptInclude,
  });
  return r ? toView(r) : null;
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
    { revalidate: 60, tags: [`receipts-${businessId}`] },
  )();
}
