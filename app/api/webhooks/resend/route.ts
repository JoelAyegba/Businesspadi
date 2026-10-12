import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";

/**
 * Resend webhook for email delivery / bounce / complaint signals.
 * Phase 4 will use this to surface delivery state on the receipt detail view.
 *
 * Resend signs with Svix — same verification + idempotency pattern as the
 * Clerk handler. This route is public (middleware allowlist), so until
 * RESEND_WEBHOOK_SECRET is configured it 404s rather than accepting
 * unauthenticated writes.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let evt: { type?: string };
  try {
    evt = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type?: string };
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const seen = await prisma.webhookEvent.findUnique({ where: { id: svixId } });
  if (seen) return NextResponse.json({ status: "duplicate", id: svixId });

  // Phase 0 stub: just record the verified event so we can inspect the shape later.
  await prisma.webhookEvent.create({
    data: { id: svixId, provider: "resend", type: evt.type ?? "unknown", payload: evt as object },
  });

  return NextResponse.json({ status: "ok" });
}
