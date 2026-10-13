import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { prisma, withDbRetry } from "@/lib/db";

/**
 * The single point of truth for "who is calling, on behalf of which business?"
 *
 * Every server component, server action, and route handler under /app must
 * begin by calling this. Every Prisma query that touches business-owned data
 * must pass `businessId` from this context as a WHERE clause. Forgetting to
 * do so is the #1 multi-tenant data leak path.
 *
 * If a Clerk user is authenticated but has no DB row yet (race with the
 * Clerk webhook, or local dev without ngrok), we bootstrap User + Business +
 * Membership inline. This makes the webhook a "nice to have" for production
 * promptness rather than a hard dependency.
 */
export type ServerContext = {
  user: { id: string; clerkId: string; email: string } | null;
  business: {
    id: string;
    name: string;
    slug: string;
    brandColor: string | null;
    defaultCurrency: string;
    profileComplete: boolean;
  } | null;
};

const CONTEXT_BUSINESS_SELECT = {
  id: true,
  name: true,
  slug: true,
  brandColor: true,
  defaultCurrency: true,
  profileComplete: true,
} as const satisfies Prisma.BusinessSelect;

export const getServerContext = cache(async function getServerContext(): Promise<ServerContext> {
  const { userId: clerkId } = auth();
  if (!clerkId) return { user: null, business: null };

  // One round trip: runs on every /app page before anything renders, and the
  // DB is far from dev machines. "join" loads the relations via LATERAL joins
  // instead of one sequential query each. Select only what the context
  // returns — the full Business row carries base64 logo/signature images.
  const existing = await prisma.user.findUnique({
    relationLoadStrategy: "join",
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      memberships: {
        select: { business: { select: CONTEXT_BUSINESS_SELECT } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (existing && existing.memberships[0]) {
    const m = existing.memberships[0];
    return {
      user: { id: existing.id, clerkId: existing.clerkId, email: existing.email },
      business: {
        id: m.business.id,
        name: m.business.name,
        slug: m.business.slug,
        brandColor: m.business.brandColor,
        defaultCurrency: m.business.defaultCurrency,
        profileComplete: m.business.profileComplete,
      },
    };
  }

  // First-touch bootstrap: pull email from Clerk and create the rows.
  const cu = await currentUser();
  const email =
    cu?.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
    cu?.emailAddresses?.[0]?.emailAddress;
  if (!email) return { user: null, business: null };

  const { user, business } = await withDbRetry(() =>
    prisma.$transaction((tx) => ensureUserAndBusiness(tx, clerkId, email)),
  );

  return {
    user: { id: user.id, clerkId: user.clerkId, email: user.email },
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      brandColor: business.brandColor,
      defaultCurrency: business.defaultCurrency,
      profileComplete: business.profileComplete,
    },
  };
});

/**
 * Idempotently ensure a User row and its first Business + owner Membership.
 * Shared by the inline bootstrap above and the Clerk `user.created` webhook —
 * whichever runs second finds the existing membership and creates nothing.
 */
export async function ensureUserAndBusiness(
  tx: Prisma.TransactionClient,
  clerkId: string,
  email: string,
) {
  const user = await tx.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });

  const existingMembership = await tx.membership.findFirst({
    where: { userId: user.id },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });
  if (existingMembership) {
    return { user, business: existingMembership.business };
  }

  // Full cuid suffix (not a prefix) — cuid prefixes are timestamp-based and
  // collide for users created close together.
  const slug = `biz-${user.id}`.toLowerCase();
  const business = await tx.business.create({
    data: { name: "My Business", slug },
  });
  await tx.membership.create({
    data: { userId: user.id, businessId: business.id, role: "owner" },
  });
  return { user, business };
}

/**
 * Strict variant — throws if no business is resolved. Use inside protected
 * routes and server actions where the absence of a business is a bug.
 */
export async function requireBusinessContext() {
  const ctx = await getServerContext();
  if (!ctx.user) throw new Error("UNAUTHENTICATED");
  if (!ctx.business) throw new Error("NO_ACTIVE_BUSINESS");
  return { user: ctx.user, business: ctx.business };
}
