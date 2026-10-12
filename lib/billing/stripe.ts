import Stripe from "stripe";
import type { BillingProvider, CheckoutSessionInput, BillingPortalInput } from "./index";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _stripe;
}

export const stripeProvider: BillingProvider = {
  name: "stripe",

  async createCheckoutSession(input: CheckoutSessionInput) {
    const stripe = getStripe();
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) throw new Error("STRIPE_PRO_PRICE_ID not set");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: input.customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      // Carry our businessId through so the webhook can find the row.
      client_reference_id: input.businessId,
      metadata: { businessId: input.businessId },
      subscription_data: { metadata: { businessId: input.businessId } },
    });

    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return { url: session.url };
  },

  async createBillingPortalSession(input: BillingPortalInput) {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  },
};
