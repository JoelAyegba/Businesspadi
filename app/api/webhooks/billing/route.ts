import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/billing/stripe";

/**
 * Stripe webhook → Businesspadi subscription state.
 * Phase 0 wires the verification + idempotency. Phase 4 fills in
 * subscriptionStatus updates, downgrade behaviour, and Pro-only feature gates.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  const sig = headers().get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  // Idempotency: short-circuit on replay.
  const seen = await prisma.webhookEvent.findUnique({ where: { id: event.id } });
  if (seen) return NextResponse.json({ status: "duplicate", id: event.id });

  await prisma.webhookEvent.create({
    data: { id: event.id, provider: "stripe", type: event.type, payload: event as object },
  });

  // Phase 4: handle customer.subscription.{created,updated,deleted},
  // invoice.payment_failed, etc. For now we just record and ack.
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.payment_failed":
      // TODO(phase-4): map customer → Business and update subscriptionStatus.
      break;
    default:
      // Ignore other event types.
      break;
  }

  return NextResponse.json({ status: "ok" });
}
