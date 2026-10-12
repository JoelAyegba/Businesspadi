/**
 * Business-scoped client queries.
 * Same multi-tenant rule as lib/queries/receipts.ts.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MockClient } from "@/lib/mock";

function toNumber(d: Prisma.Decimal | number | null): number {
  if (d === null) return 0;
  if (typeof d === "number") return d;
  return d.toNumber();
}

export async function listClients(businessId: string): Promise<MockClient[]> {
  const rows = await prisma.client.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
  });
  return rows.map((c) => ({
    id: c.id,
    businessId: c.businessId,
    name: c.name,
    email: c.email,
    phone: c.phone,
  }));
}

export type ClientRow = MockClient & {
  taxId: string | null;
  notes: string | null;
  receiptCount: number;
  totalBilled: number;
  lastIssueDate: string | null;
};

/**
 * Clients with derived stats — total billed (PAID + ISSUED), receipt count,
 * last issue date. One round-trip via groupBy + a second for last-issue.
 */
export async function listClientsWithStats(businessId: string): Promise<ClientRow[]> {
  const [clients, totals, lasts] = await Promise.all([
    prisma.client.findMany({ where: { businessId } }),
    prisma.receipt.groupBy({
      by: ["clientId"],
      where: {
        businessId,
        documentType: "RECEIPT",
        status: { in: ["PAID", "ISSUED"] },
        clientId: { not: null },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.receipt.groupBy({
      by: ["clientId"],
      where: { businessId, documentType: "RECEIPT", clientId: { not: null } },
      _max: { issueDate: true },
    }),
  ]);

  const totalsByClient = new Map(totals.map((t) => [t.clientId, t]));
  const lastsByClient = new Map(lasts.map((l) => [l.clientId, l._max.issueDate]));

  const rows: ClientRow[] = clients.map((c) => {
    const t = totalsByClient.get(c.id);
    const last = lastsByClient.get(c.id);
    return {
      id: c.id,
      businessId: c.businessId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      taxId: c.taxId,
      notes: c.notes,
      receiptCount: t?._count._all ?? 0,
      totalBilled: t?._sum.total ? toNumber(t._sum.total) : 0,
      lastIssueDate: last ? last.toISOString().slice(0, 10) : null,
    };
  });

  rows.sort((a, b) => b.totalBilled - a.totalBilled);
  return rows;
}
