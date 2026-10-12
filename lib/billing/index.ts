/**
 * Provider-agnostic billing surface.
 * v1 ships with Paystack (./paystack.ts); ./stripe.ts implements the same
 * interface but is not wired up. Consumers import `billingProvider` from here
 * and never a concrete provider.
 */
import { paystackProvider } from "./paystack";

export type Plan = "free" | "pro";

export interface CheckoutSessionInput {
  businessId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface BillingPortalInput {
  customerId: string;
  returnUrl: string;
}

export interface BillingProvider {
  name: "stripe" | "paystack";
  /** Create a hosted checkout session for upgrading Free → Pro. */
  createCheckoutSession(input: CheckoutSessionInput): Promise<{ url: string }>;
  /** Open the provider-hosted customer portal for plan/payment management. */
  createBillingPortalSession(input: BillingPortalInput): Promise<{ url: string }>;
}

/** The active provider. Swap here to change billing backends. */
export const billingProvider: BillingProvider = paystackProvider;

export const PLAN_LIMITS = {
  free: {
    receiptsPerMonth: 20,
    historyDays: 30,
    emailDelivery: false,
    shareableLinks: false,
    clientDirectory: false,
  },
  pro: {
    receiptsPerMonth: Infinity,
    historyDays: Infinity,
    emailDelivery: true,
    shareableLinks: true,
    clientDirectory: true,
  },
} as const satisfies Record<Plan, unknown>;

export function isPro(subscriptionStatus: string): boolean {
  return subscriptionStatus === "active" || subscriptionStatus === "past_due";
}
