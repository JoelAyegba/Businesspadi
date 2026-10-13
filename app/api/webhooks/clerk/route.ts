import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUserAndBusiness } from "@/lib/auth";

/**
 * Clerk → Businesspadi sync.
 *
 * On user.created: create a User row + a default Business (the user is the
 * Owner via Membership). This is the single place where new tenants come into
 * existence — every other server path assumes both rows exist.
 *
 * Idempotency: deduplicated via the WebhookEvent table on Svix message id.
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: ClerkEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Dedupe: short-circuit if we've seen this event id before.
  const seen = await prisma.webhookEvent.findUnique({ where: { id: svixId } });
  if (seen) {
    return NextResponse.json({ status: "duplicate", id: svixId });
  }

  await prisma.$transaction(async (tx) => {
    await tx.webhookEvent.create({
      data: { id: svixId, provider: "clerk", type: evt.type, payload: evt as object },
    });

    if (evt.type === "user.created") {
      const email = evt.data.email_addresses?.[0]?.email_address;
      if (!email) throw new Error("Clerk user has no email address");

      // Idempotent: the user may already have been bootstrapped inline by
      // getServerContext() if they hit the app before this webhook arrived.
      await ensureUserAndBusiness(tx, evt.data.id, email);
    }

    if (evt.type === "user.deleted") {
      // Soft-delete by removing the User row; Memberships cascade.
      await tx.user.deleteMany({ where: { clerkId: evt.data.id } });
    }
  });

  return NextResponse.json({ status: "ok" });
}

// Minimal Clerk event shape — full types live in @clerk/nextjs/server but
// we only consume a tiny subset here.
type ClerkEvent =
  | {
      type: "user.created" | "user.updated";
      data: { id: string; email_addresses?: { email_address: string }[] };
    }
  | { type: "user.deleted"; data: { id: string } };
