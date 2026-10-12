"use server";

import { z } from "zod";
import { requireBusinessContext } from "@/lib/auth";
import { getReceipt } from "@/lib/queries/receipts";
import { getResend, FROM_ADDRESS } from "@/lib/email/client";
import { receiptEmail } from "@/lib/email/templates";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { ensureShareId } from "@/app/app/receipts/actions";

const recipient = z.string().trim().email().max(254);

export async function sendReceiptEmail(receiptId: string, toEmail: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { business } = await requireBusinessContext();

  const to = recipient.safeParse(toEmail);
  if (!to.success) return { ok: false, error: "Enter a valid email address" };

  const [receipt, biz] = await Promise.all([
    getReceipt(business.id, receiptId),
    prisma.business.findUniqueOrThrow({
      where: { id: business.id },
      select: { name: true, brandColor: true },
    }),
  ]);

  if (!receipt) return { ok: false, error: "Receipt not found" };
  if (receipt.status === "DRAFT") return { ok: false, error: "Cannot send a draft receipt" };

  let resend;
  try {
    resend = getResend();
  } catch (err) {
    // In local development, if RESEND_API_KEY is not configured, we gracefully fail
    console.error("Resend configuration error:", err);
    return { ok: false, error: "Email service is not configured. Please add RESEND_API_KEY." };
  }

  const shareResult = await ensureShareId(receipt.id);
  if (!shareResult.ok) {
    return { ok: false, error: shareResult.error };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { subject, html } = receiptEmail({
    businessName: biz.name,
    brandColor: biz.brandColor,
    receiptNumber: receipt.number,
    amountLabel: formatMoney(receipt.total, receipt.currency),
    receiptUrl: `${appUrl}/r/${shareResult.shareId}`,
  });

  try {
    const { error } = await resend.emails.send({ from: FROM_ADDRESS, to: to.data, subject, html });

    if (error) {
      console.error("Resend API error:", error);
      return { ok: false, error: "Failed to send email. Please try again." };
    }

    return { ok: true };
  } catch (err) {
    console.error("Failed to send email:", err);
    return { ok: false, error: "An unexpected error occurred while sending email" };
  }
}
