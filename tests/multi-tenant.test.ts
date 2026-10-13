/**
 * Cross-tenant isolation tests (Phase 1 acceptance §5.5).
 *
 * Multi-tenancy is discipline-based (DECISIONS.md 0001), so every business-
 * scoped query MUST include `businessId` in its WHERE. These tests assert
 * that contract by spying on the Prisma client and inspecting the args
 * passed to each method. They do not hit a real database — they catch the
 * one mistake we care about: someone forgets the WHERE.
 *
 * If you add a new query function on a business-owned table, add a case
 * here so the lint-rule-we-don't-have-yet has a backstop.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findManyMock = vi.fn();
const findFirstMock = vi.fn();
const aggregateMock = vi.fn();
const countMock = vi.fn();
const updateMock = vi.fn();
const findUniqueMock = vi.fn();
const groupByMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    receipt: {
      findMany: findManyMock,
      findFirst: findFirstMock,
      aggregate: aggregateMock,
      count: countMock,
      update: updateMock,
      groupBy: groupByMock,
    },
    business: {
      findUniqueOrThrow: findUniqueMock,
    },
  },
}));

// next/cache is a no-op in tests — unstable_cache wraps a function and
// returns the same function with a wrapper signature; we just unwrap.
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

beforeEach(() => {
  findManyMock.mockReset();
  findFirstMock.mockReset();
  aggregateMock.mockReset();
  countMock.mockReset();
  updateMock.mockReset();
  findUniqueMock.mockReset();
  groupByMock.mockReset();
});

describe("business-scoped query layer", () => {
  it("listReceipts filters by businessId", async () => {
    findManyMock.mockResolvedValue([]);
    const { listReceipts } = await import("@/lib/queries/receipts");
    await listReceipts("biz_A");
    expect(findManyMock).toHaveBeenCalledOnce();
    const args = findManyMock.mock.calls[0]![0];
    expect(args.where.businessId).toBe("biz_A");
  });

  it("getReceipt filters by both id and businessId", async () => {
    findFirstMock.mockResolvedValue(null);
    const { getReceipt } = await import("@/lib/queries/receipts");
    await getReceipt("biz_A", "receipt_owned_by_B");
    expect(findFirstMock).toHaveBeenCalledOnce();
    const args = findFirstMock.mock.calls[0]![0];
    expect(args.where.businessId).toBe("biz_A");
    expect(args.where.id).toBe("receipt_owned_by_B");
  });

  it("getReceipt returns null for cross-tenant access (mocks return null)", async () => {
    findFirstMock.mockResolvedValue(null);
    const { getReceipt } = await import("@/lib/queries/receipts");
    const r = await getReceipt("biz_A", "receipt_owned_by_B");
    expect(r).toBeNull();
  });

  it("getDocumentKpis scopes its single grouped query to businessId", async () => {
    groupByMock.mockResolvedValue([]);
    const { getDocumentKpis } = await import("@/lib/queries/kpis");
    await getDocumentKpis("biz_A", "NGN");
    expect(groupByMock).toHaveBeenCalledOnce();
    expect(groupByMock.mock.calls[0]![0].where.businessId).toBe("biz_A");
  });

  it("getDocumentKpis keeps receipt and invoice figures separate", async () => {
    const dec = (n: number) => ({ toNumber: () => n });
    groupByMock.mockResolvedValue([
      { documentType: "RECEIPT", status: "PAID", _sum: { total: dec(100) }, _count: { _all: 2 } },
      { documentType: "RECEIPT", status: "ISSUED", _sum: { total: dec(50) }, _count: { _all: 1 } },
      { documentType: "RECEIPT", status: "DRAFT", _sum: { total: dec(999) }, _count: { _all: 4 } },
      { documentType: "INVOICE", status: "ISSUED", _sum: { total: dec(300) }, _count: { _all: 3 } },
      { documentType: "INVOICE", status: "PAID", _sum: { total: dec(70) }, _count: { _all: 1 } },
      { documentType: "INVOICE", status: "DRAFT", _sum: { total: dec(5) }, _count: { _all: 2 } },
    ]);
    const { getDocumentKpis } = await import("@/lib/queries/kpis");
    const { receipts, invoices } = await getDocumentKpis("biz_A", "NGN");
    expect(receipts).toEqual({ revenue: 150, receiptsIssued: 3, draftCount: 4, currency: "NGN" });
    expect(invoices).toEqual({
      outstanding: 300,
      draftCount: 2,
      invoiceCount: 4,
      unpaidCount: 3,
      currency: "NGN",
    });
  });

  it("listReceipts filters to documentType RECEIPT (invoices excluded)", async () => {
    findManyMock.mockResolvedValue([]);
    const { listReceipts } = await import("@/lib/queries/receipts");
    await listReceipts("biz_A");
    expect(findManyMock.mock.calls[0]![0].where.documentType).toBe("RECEIPT");
  });

  it("listInvoices filters by businessId AND documentType INVOICE", async () => {
    findManyMock.mockResolvedValue([]);
    const { listInvoices } = await import("@/lib/queries/invoices");
    await listInvoices("biz_A");
    expect(findManyMock).toHaveBeenCalledOnce();
    const args = findManyMock.mock.calls[0]![0];
    expect(args.where.businessId).toBe("biz_A");
    expect(args.where.documentType).toBe("INVOICE");
  });

  it("getInvoice filters by id, businessId, and documentType INVOICE", async () => {
    findFirstMock.mockResolvedValue(null);
    const { getInvoice } = await import("@/lib/queries/invoices");
    await getInvoice("biz_A", "inv_owned_by_B");
    const args = findFirstMock.mock.calls[0]![0];
    expect(args.where.businessId).toBe("biz_A");
    expect(args.where.id).toBe("inv_owned_by_B");
    expect(args.where.documentType).toBe("INVOICE");
  });

  it("free-tier usage check scopes by businessId", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionStatus: "free",
      timezone: "Africa/Lagos",
    });
    countMock.mockResolvedValue(0);
    const { getFreeTierUsage } = await import("@/lib/billing/limits");
    await getFreeTierUsage("biz_A");
    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(findUniqueMock.mock.calls[0]![0].where.id).toBe("biz_A");
    expect(countMock).toHaveBeenCalledOnce();
    expect(countMock.mock.calls[0]![0].where.businessId).toBe("biz_A");
  });

  it("free-tier usage excludes invoice-generated receipts (sourceInvoiceId null)", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionStatus: "free",
      timezone: "Africa/Lagos",
    });
    countMock.mockResolvedValue(0);
    const { getFreeTierUsage } = await import("@/lib/billing/limits");
    await getFreeTierUsage("biz_A");
    expect(countMock.mock.calls[0]![0].where.sourceInvoiceId).toBeNull();
  });
});

describe("free-tier limits", () => {
  it("treats past_due as still Pro (grace period)", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionStatus: "past_due",
      timezone: "Africa/Lagos",
    });
    const { getFreeTierUsage } = await import("@/lib/billing/limits");
    const usage = await getFreeTierUsage("biz_A");
    expect(usage.isPro).toBe(true);
    expect(usage.remaining).toBe(Infinity);
    // Pro check should not even reach the count query.
    expect(countMock).not.toHaveBeenCalled();
  });

  it("computes month start in the business timezone (Africa/Lagos)", async () => {
    const { startOfMonthInTimeZone } = await import("@/lib/billing/limits");
    // 2026-05-15 12:00 UTC → in Lagos (UTC+1) the month started
    // 2026-04-30 23:00 UTC = 2026-05-01 00:00 Lagos.
    const monthStart = startOfMonthInTimeZone(new Date("2026-05-15T12:00:00Z"), "Africa/Lagos");
    expect(monthStart.toISOString()).toBe("2026-04-30T23:00:00.000Z");
  });
});
