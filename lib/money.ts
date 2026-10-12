/**
 * Document totals in exact decimal arithmetic.
 *
 * Money columns are Decimal(12,2) — never compute them with JS floats
 * (0.1 * 3 !== 0.3). Inputs arrive as numbers from the form; they're
 * converted to Decimal via their string form before any arithmetic.
 * Rounding is half-up to 2dp at each stored value (line subtotal, tax, total).
 */
import { Prisma } from "@prisma/client";

const D = Prisma.Decimal;
type Decimal = Prisma.Decimal;

const round2 = (d: Decimal) => d.toDecimalPlaces(2, D.ROUND_HALF_UP);
const dec = (n: number) => new D(n.toString());

export type TotalsInput = {
  lineItems: { quantity: number; unitPrice: number }[];
  /** Flat discount, applied before tax. */
  discount: number;
  /** Percent, e.g. 7.5 */
  taxRate: number;
};

export type Totals = {
  lineSubtotals: Decimal[];
  subtotal: Decimal;
  taxTotal: Decimal;
  total: Decimal;
};

export function computeTotals({ lineItems, discount, taxRate }: TotalsInput): Totals {
  const lineSubtotals = lineItems.map((li) => round2(dec(li.quantity).mul(dec(li.unitPrice))));
  const subtotal = lineSubtotals.reduce((a, b) => a.add(b), new D(0));
  const taxable = D.max(subtotal.sub(dec(discount)), 0);
  const taxTotal = round2(taxable.mul(dec(taxRate)).div(100));
  const total = round2(taxable.add(taxTotal));
  return { lineSubtotals, subtotal, taxTotal, total };
}
