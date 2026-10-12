"use server";

import { redirect } from "next/navigation";
import { requireBusinessContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { billingProvider } from "@/lib/billing";

export async function upgradeToProAction() {
  const { business, user } = await requireBusinessContext();

  const bizInfo = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    select: { email: true },
  });

  const customerEmail = bizInfo.email || user.email;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { url } = await billingProvider.createCheckoutSession({
    businessId: business.id,
    customerEmail,
    successUrl: `${appUrl}/app/settings/billing?success=true`,
    cancelUrl: `${appUrl}/app/settings/billing?canceled=true`,
  });

  redirect(url);
}

export async function createBillingPortalAction() {
  const { business } = await requireBusinessContext();

  const bizInfo = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    select: { paystackSubscriptionCode: true },
  });

  if (!bizInfo.paystackSubscriptionCode) {
    throw new Error("No active subscription found to manage.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { url } = await billingProvider.createBillingPortalSession({
    customerId: bizInfo.paystackSubscriptionCode,
    returnUrl: `${appUrl}/app/settings/billing`,
  });

  redirect(url);
}
