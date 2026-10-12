/**
 * Server-action guards: input whitelisting and atomic, tenant-scoped status
 * transitions. Server actions are public endpoints, so these assert what a
 * hostile caller can't do, not just the happy path.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const businessUpdate = vi.fn();
const receiptFindFirst = vi.fn();
const receiptUpdateMany = vi.fn();
const receiptCreate = vi.fn();

const prismaMock = {
  business: { update: businessUpdate },
  receipt: { findFirst: receiptFindFirst, updateMany: receiptUpdateMany, create: receiptCreate },
  $transaction: (fn: (tx: unknown) => unknown) => fn(prismaMock),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({
  requireBusinessContext: async () => ({
    user: { id: "user_A", clerkId: "clerk_A", email: "a@example.com" },
    business: {
      id: "biz_A",
      name: "A",
      slug: "a",
      brandColor: null,
      defaultCurrency: "NGN",
      profileComplete: true,
    },
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

beforeEach(() => {
  businessUpdate.mockReset();
  receiptFindFirst.mockReset();
  receiptUpdateMany.mockReset();
  receiptCreate.mockReset();
});

describe("settings actions", () => {
  it("rejects privileged fields smuggled into updateProfile", async () => {
    const { updateProfile } = await import("@/app/app/settings/actions");
    const res = await updateProfile({
      name: "Acme",
      slug: "acme",
      subscriptionStatus: "active",
    } as Parameters<typeof updateProfile>[0]);
    expect(res.ok).toBe(false);
    expect(businessUpdate).not.toHaveBeenCalled();
  });

  it("writes only whitelisted fields scoped to the caller's business", async () => {
    const { updateProfile } = await import("@/app/app/settings/actions");
    const res = await updateProfile({
      name: "Acme",
      slug: "Acme-Co",
      email: "",
      signatureUrl: null,
    });
    expect(res.ok).toBe(true);
    const args = businessUpdate.mock.calls[0]![0];
    expect(args.where).toEqual({ id: "biz_A" });
    expect(Object.keys(args.data).sort()).toEqual(
      ["address", "email", "name", "phone", "signatureUrl", "slug", "taxId"].sort(),
    );
    expect(args.data.slug).toBe("acme-co");
  });

  it("rejects non-image logo URLs and bad colours", async () => {
    const { updateBranding } = await import("@/app/app/settings/actions");
    expect((await updateBranding({ logoUrl: "javascript:alert(1)" })).ok).toBe(false);
    expect((await updateBranding({ brandColor: "red;}" })).ok).toBe(false);
    expect(businessUpdate).not.toHaveBeenCalled();
  });

  it("requires a sequence token in the number format", async () => {
    const { updateDefaults } = await import("@/app/app/settings/actions");
    const res = await updateDefaults({
      defaultCurrency: "NGN",
      defaultTaxRate: 7.5,
      numberFormat: "RCPT-{YYYY}",
    });
    expect(res.ok).toBe(false);
  });
});

describe("status transitions are guarded writes", () => {
  it("markPaid updates with businessId + expected status in the WHERE", async () => {
    receiptFindFirst.mockResolvedValue({ id: "r1", status: "ISSUED" });
    receiptUpdateMany.mockResolvedValue({ count: 1 });
    const { markPaid } = await import("@/app/app/receipts/actions");
    await markPaid("r1");
    expect(receiptUpdateMany.mock.calls[0]![0].where).toEqual({
      id: "r1",
      businessId: "biz_A",
      documentType: "RECEIPT",
      status: "ISSUED",
    });
  });

  it("markInvoicePaid creates no second receipt when it loses the race", async () => {
    receiptFindFirst
      .mockResolvedValueOnce({
        id: "inv1",
        status: "ISSUED",
        lineItems: [],
        generatedReceipt: null,
      })
      .mockResolvedValueOnce({ id: "rcpt_winner" });
    receiptUpdateMany.mockResolvedValue({ count: 0 });
    const { markInvoicePaid } = await import("@/app/app/invoices/actions");
    const res = await markInvoicePaid("inv1");
    expect(res).toEqual({ ok: true, receiptId: "rcpt_winner" });
    expect(receiptCreate).not.toHaveBeenCalled();
    expect(receiptUpdateMany.mock.calls[0]![0].where).toMatchObject({
      businessId: "biz_A",
      status: "ISSUED",
    });
  });
});

describe("document numbering", () => {
  it("uses the business timezone for year boundaries", async () => {
    const { yearMonthInTimeZone } = await import("@/lib/queries/receipt-number");
    // 23:30 UTC on 31 Dec is already 1 Jan in Lagos (UTC+1).
    expect(yearMonthInTimeZone(new Date("2026-12-31T23:30:00Z"), "Africa/Lagos")).toEqual({
      year: 2027,
      month: 1,
    });
  });
});
