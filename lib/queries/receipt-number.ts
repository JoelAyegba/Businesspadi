/**
 * Atomic receipt number generation.
 *
 * Called inside the same Prisma transaction that creates a Receipt. The
 * counter row's update acquires a Postgres row lock; concurrent issues
 * serialize on it and get sequential numbers. See DECISIONS.md 0005.
 *
 * Format tokens (configured per-business via `Business.numberFormat`):
 *   {YYYY}  full year, e.g. 2026
 *   {YY}    2-digit year, e.g. 26
 *   {MM}    2-digit month
 *   {N}     sequence, no padding
 *   {NN}    sequence, padded to 2
 *   {NNN}   padded to 3
 *   {NNNN}  padded to 4 (default)
 *   {NNNNN} padded to 5
 */
import type { DocumentType, Prisma } from "@prisma/client";

export function formatReceiptNumber(
  format: string,
  year: number,
  n: number,
  month: number,
): string {
  return format
    .replace(/\{YYYY\}/g, String(year))
    .replace(/\{YY\}/g, String(year).slice(-2))
    .replace(/\{MM\}/g, String(month).padStart(2, "0"))
    .replace(/\{NNNNN\}/g, String(n).padStart(5, "0"))
    .replace(/\{NNNN\}/g, String(n).padStart(4, "0"))
    .replace(/\{NNN\}/g, String(n).padStart(3, "0"))
    .replace(/\{NN\}/g, String(n).padStart(2, "0"))
    .replace(/\{N\}/g, String(n));
}

export function yearMonthInTimeZone(now: Date, timeZone: string): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value),
  };
}

/**
 * Type-aware document numbering. Receipts and invoices share the Receipt
 * table but keep independent sequences (a per-(business, type, year) counter)
 * and independent formats (`numberFormat` vs `invoiceNumberFormat`), so both
 * series can be at #0001 without colliding.
 */
export async function generateDocumentNumber(
  tx: Prisma.TransactionClient,
  businessId: string,
  type: DocumentType = "RECEIPT",
  now: Date = new Date(),
): Promise<string> {
  const business = await tx.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { numberFormat: true, invoiceNumberFormat: true, timezone: true },
  });
  // Year/month in the business's timezone, not the server's (UTC on Vercel) —
  // otherwise a Lagos receipt issued at 00:30 on 1 Jan gets last year's number.
  const { year, month } = yearMonthInTimeZone(now, business.timezone);
  const format = type === "INVOICE" ? business.invoiceNumberFormat : business.numberFormat;

  const counter = await tx.receiptCounter.upsert({
    where: { businessId_type_year: { businessId, type, year } },
    update: { lastNumber: { increment: 1 } },
    create: { businessId, type, year, lastNumber: 1 },
    select: { lastNumber: true },
  });

  return formatReceiptNumber(format, year, counter.lastNumber, month);
}

/** Back-compat alias for receipt callers. */
export function generateReceiptNumber(
  tx: Prisma.TransactionClient,
  businessId: string,
  now: Date = new Date(),
): Promise<string> {
  return generateDocumentNumber(tx, businessId, "RECEIPT", now);
}
