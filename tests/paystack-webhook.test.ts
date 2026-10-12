/**
 * Paystack webhook: signature verification, idempotency, and the
 * subscription.create → paystackSubscriptionCode write the billing portal
 * depends on.
 */
import crypto from "crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const webhookCreate = vi.fn();
const businessUpdate = vi.fn();
const businessUpdateMany = vi.fn();
const tx = {
  webhookEvent: { create: webhookCreate },
  business: { update: businessUpdate, updateMany: businessUpdateMany },
};

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) },
}));

const SECRET = "sk_test_secret";

function signedRequest(payload: unknown, signature?: string) {
  const body = JSON.stringify(payload);
  const sig = signature ?? crypto.createHmac("sha512", SECRET).update(body).digest("hex");
  return new Request("http://localhost/api/webhooks/paystack", {
    method: "POST",
    headers: { "x-paystack-signature": sig },
    body,
  });
}

beforeEach(() => {
  process.env.PAYSTACK_SECRET_KEY = SECRET;
  process.env.PAYSTACK_PRO_PLAN_CODE = "PLN_pro";
  webhookCreate.mockReset();
  businessUpdate.mockReset();
  businessUpdateMany.mockReset();
});

describe("Paystack webhook", () => {
  it("rejects a bad signature with 401 and writes nothing", async () => {
    const { POST } = await import("@/app/api/webhooks/paystack/route");
    const res = await POST(signedRequest({ event: "charge.success", data: {} }, "deadbeef"));
    expect(res.status).toBe(401);
    expect(webhookCreate).not.toHaveBeenCalled();
  });

  it("stores the subscription code on subscription.create", async () => {
    const { POST } = await import("@/app/api/webhooks/paystack/route");
    const res = await POST(
      signedRequest({
        event: "subscription.create",
        data: { id: 1, subscription_code: "SUB_123", customer: { customer_code: "CUS_1" } },
      }),
    );
    expect(res.status).toBe(200);
    expect(businessUpdateMany).toHaveBeenCalledWith({
      where: { paystackCustomerCode: "CUS_1" },
      data: { subscriptionStatus: "active", paystackSubscriptionCode: "SUB_123" },
    });
  });

  it("treats a replayed event as a no-op duplicate", async () => {
    webhookCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const { POST } = await import("@/app/api/webhooks/paystack/route");
    const res = await POST(
      signedRequest({
        event: "charge.success",
        data: {
          id: 2,
          metadata: { businessId: "biz_A" },
          plan: { plan_code: "PLN_pro" },
          customer: { customer_code: "CUS_1" },
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "duplicate" });
    expect(businessUpdate).not.toHaveBeenCalled();
  });
});
