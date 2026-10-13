/**
 * Dashboard KPIs for receipts AND invoices from a single grouped query.
 *
 * One `groupBy (documentType, status)` replaces seven separate aggregate/count
 * queries. With the DB a long round trip away and a 5-connection pool, those
 * seven ran in two waves; this is one round trip. Scoped by businessId like
 * every other query (DECISIONS.md 0001); documentType is split in memory.
 */
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type DashboardKpis = {
  revenue: number;
  receiptsIssued: number;
  draftCount: number;
  currency: string;
};

export type InvoiceKpis = {
  outstanding: number;
  draftCount: number;
  invoiceCount: number;
  unpaidCount: number;
  currency: string;
};

export type DocumentKpis = { receipts: DashboardKpis; invoices: InvoiceKpis };

const toNumber = (d: Prisma.Decimal | null) => (d ? d.toNumber() : 0);

export function getDocumentKpis(businessId: string, currency: string): Promise<DocumentKpis> {
  return unstable_cache(
    async () => {
      const groups = await prisma.receipt.groupBy({
        by: ["documentType", "status"],
        where: { businessId },
        _sum: { total: true },
        _count: { _all: true },
      });

      const pick = (documentType: "RECEIPT" | "INVOICE", statuses: string[]) =>
        groups.filter((g) => g.documentType === documentType && statuses.includes(g.status));
      const count = (rows: typeof groups) => rows.reduce((n, g) => n + g._count._all, 0);
      const sum = (rows: typeof groups) => rows.reduce((n, g) => n + toNumber(g._sum.total), 0);

      const issuedReceipts = pick("RECEIPT", ["ISSUED", "PAID"]);
      const openInvoices = pick("INVOICE", ["ISSUED"]);

      return {
        receipts: {
          revenue: sum(issuedReceipts),
          receiptsIssued: count(issuedReceipts),
          draftCount: count(pick("RECEIPT", ["DRAFT"])),
          currency,
        },
        invoices: {
          outstanding: sum(openInvoices),
          draftCount: count(pick("INVOICE", ["DRAFT"])),
          invoiceCount: count(pick("INVOICE", ["ISSUED", "PAID"])),
          unpaidCount: count(openInvoices),
          currency,
        },
      };
    },
    ["document-kpis", businessId, currency],
    { revalidate: 60, tags: [`receipts-${businessId}`] },
  )();
}
