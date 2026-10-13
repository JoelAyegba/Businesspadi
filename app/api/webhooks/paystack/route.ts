import { NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Paystack → Businesspadi subscription state.
 *
 * Flow: checkout (lib/billing/paystack.ts) passes `metadata.businessId`.
 *   charge.success        → mark Pro, store paystackCustomerCode
 *   subscription.create   → store paystackSubscriptionCode (needed for the billing portal)
 *   invoice.payment_failed → past_due (still Pro during grace, see isPro())
 *   subscription.disable  → back to free
 *
 * Idempotency: every event is recorded in WebhookEvent inside the same
 * transaction as its side effects; a replay short-circuits.
 */

type PaystackEvent = {
  event: string;
  data: {
    id?: number | string;
    reference?: string;
    subscription_code?: string;
    customer?: { customer_code?: string };
    plan?: { plan_code?: string } | null;
    metadata?: { businessId?: string } | null;
  };
};

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(crypto.createHmac("sha512", secret).update(rawBody).digest("hex"), "utf8");
  const received = Buffer.from(signature, "utf8");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

/** Stable id for dedupe — Paystack has no top-level event id. */
function eventId(evt: PaystackEvent): string {
  const ref = evt.data.id ?? evt.data.reference ?? evt.data.subscription_code;
  if (ref !== undefined) return `paystack:${evt.event}:${ref}`;
  return `paystack:${crypto.createHash("sha256").update(JSON.stringify(evt)).digest("hex")}`;
}

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Missing secret" }, { status: 500 });

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let evt: PaystackEvent;
  try {
    evt = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = eventId(evt);
  const proPlanCode = process.env.PAYSTACK_PRO_PLAN_CODE;
  const customerCode = evt.data.customer?.customer_code;

  try {
    await prisma.$transaction(async (tx) => {
      // Insert first: a duplicate id throws P2002 and rolls the whole thing back.
      await tx.webhookEvent.create({
        data: { id, provider: "paystack", type: evt.event, payload: evt as object },
      });

      switch (evt.event) {
        case "charge.success": {
          const businessId = evt.data.metadata?.businessId;
          if (businessId && evt.data.plan?.plan_code && evt.data.plan.plan_code === proPlanCode) {
            await tx.business.update({
              where: { id: businessId },
              data: {
                subscriptionStatus: "active",
                paystackCustomerCode: customerCode ?? undefined,
                paystackPlanCode: evt.data.plan.plan_code,
              },
            });
          }
          break;
        }
        case "subscription.create": {
          // subscription.create carries no metadata — join on the customer
          // code stored by charge.success.
          if (customerCode && evt.data.subscription_code) {
            await tx.business.updateMany({
              where: { paystackCustomerCode: customerCode },
              data: { subscriptionStatus: "active", paystackSubscriptionCode: evt.data.subscription_code },
            });
          }
          break;
        }
        case "invoice.payment_failed": {
          if (customerCode) {
            await tx.business.updateMany({
              where: { paystackCustomerCode: customerCode },
              data: { subscriptionStatus: "past_due" },
            });
          }
          break;
        }
        case "subscription.disable": {
          if (customerCode) {
            await tx.business.updateMany({
              where: { paystackCustomerCode: customerCode },
              data: { subscriptionStatus: "free", paystackSubscriptionCode: null },
            });
          }
          break;
        }
        default:
          break;
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ status: "duplicate", id });
    }
    console.error("Paystack webhook error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
