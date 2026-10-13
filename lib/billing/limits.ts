/**
 * Free-tier limits (PRD §6.4 / Phase 2).
 *
 * Counts are per-business and use the business's configured timezone — the
 * server's UTC clock would unfairly cut off users near month boundaries.
 *
 * Treat `past_due` as still-Pro (matches lib/billing/index.ts isPro grace).
 * Drafts don't burn quota; only issued/paid count.
 */
import { prisma } from "@/lib/db";
import { isPro as isProStatus, PLAN_LIMITS } from "@/lib/billing";

export const FREE_RECEIPTS_PER_MONTH = PLAN_LIMITS.free.receiptsPerMonth;

export function startOfMonthInTimeZone(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);

  // Find the UTC instant where the wall clock in `timeZone` reads
  // year-month-01 00:00:00. Two-step: guess UTC midnight, measure the
  // resulting wall clock, subtract the offset.
  const guessUtc = Date.UTC(year, month - 1, 1, 0, 0, 0);
  const wall = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(guessUtc));
  const wY = Number(wall.find((p) => p.type === "year")!.value);
  const wM = Number(wall.find((p) => p.type === "month")!.value);
  const wD = Number(wall.find((p) => p.type === "day")!.value);
  const wH = Number(wall.find((p) => p.type === "hour")!.value);
  const wMin = Number(wall.find((p) => p.type === "minute")!.value);
  const wS = Number(wall.find((p) => p.type === "second")!.value);
  const wallAsUtc = Date.UTC(wY, wM - 1, wD, wH, wMin, wS);
  const offset = wallAsUtc - guessUtc;
  return new Date(guessUtc - offset);
}

export type FreeTierUsage = {
  isPro: boolean;
  used: number;
  limit: number;
  remaining: number;
  monthStart: Date;
};

export async function getFreeTierUsage(
  businessId: string,
  now: Date = new Date(),
): Promise<FreeTierUsage> {
  const biz = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { subscriptionStatus: true, timezone: true },
  });

  const isPro = isProStatus(biz.subscriptionStatus);
  const monthStart = startOfMonthInTimeZone(now, biz.timezone);

  if (isPro) {
    return { isPro, used: 0, limit: Infinity, remaining: Infinity, monthStart };
  }

  // Count issued documents (receipts + invoices) toward the monthly cap, but
  // exclude the receipt auto-generated when an invoice is marked paid — that
  // conversion shouldn't double-charge quota against the invoice.
  const used = await prisma.receipt.count({
    where: {
      businessId,
      status: { in: ["ISSUED", "PAID"] },
      createdAt: { gte: monthStart },
      sourceInvoiceId: null,
    },
  });

  return {
    isPro: false,
    used,
    limit: FREE_RECEIPTS_PER_MONTH,
    remaining: Math.max(0, FREE_RECEIPTS_PER_MONTH - used),
    monthStart,
  };
}
