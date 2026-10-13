import type { BillingProvider, CheckoutSessionInput, BillingPortalInput } from "./index";

export const paystackProvider: BillingProvider = {
  name: "paystack",

  async createCheckoutSession(input: CheckoutSessionInput) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const planCode = process.env.PAYSTACK_PRO_PLAN_CODE;

    if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY not set");
    if (!planCode) throw new Error("PAYSTACK_PRO_PLAN_CODE not set");

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.customerEmail,
        amount: 300000 /* 3,000 NGN or equivalent dummy amount, the Plan actually overrides this */,
        plan: planCode,
        callback_url: input.successUrl,
        metadata: {
          businessId: input.businessId,
          cancel_action: input.cancelUrl,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Paystack Initialize Failed:", err);
      throw new Error("Failed to initialize Paystack transaction");
    }

    const data = await response.json();
    return { url: data.data.authorization_url };
  },

  async createBillingPortalSession(input: BillingPortalInput) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY not set");

    // For Paystack, the input.customerId will be the paystackSubscriptionCode
    const response = await fetch(
      `https://api.paystack.co/subscription/${input.customerId}/manage/link`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to generate Paystack manage subscription link");
    }

    const data = await response.json();
    return { url: data.data.link };
  },
};
