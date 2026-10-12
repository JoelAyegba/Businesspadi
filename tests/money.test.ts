import { describe, it, expect } from "vitest";
import { computeTotals } from "@/lib/money";

describe("computeTotals (Decimal, half-up to 2dp)", () => {
  it("avoids float drift: 3 × 0.1 is exactly 0.30", () => {
    const t = computeTotals({
      lineItems: [{ quantity: 3, unitPrice: 0.1 }],
      discount: 0,
      taxRate: 0,
    });
    expect(t.subtotal.toFixed(2)).toBe("0.30");
    expect(t.total.toFixed(2)).toBe("0.30");
  });

  it("rounds tax half-up", () => {
    // 444.47 × 7.5% = 33.33525 → 33.34
    const t = computeTotals({
      lineItems: [{ quantity: 1, unitPrice: 444.47 }],
      discount: 0,
      taxRate: 7.5,
    });
    expect(t.taxTotal.toFixed(2)).toBe("33.34");
    expect(t.total.toFixed(2)).toBe("477.81");
  });

  it("rounds each line subtotal half-up", () => {
    const t = computeTotals({
      lineItems: [{ quantity: 1.5, unitPrice: 1.01 }],
      discount: 0,
      taxRate: 0,
    });
    // 1.515 → 1.52
    expect(t.lineSubtotals[0]!.toFixed(2)).toBe("1.52");
  });

  it("applies the flat discount before tax and never goes negative", () => {
    const t = computeTotals({
      lineItems: [
        { quantity: 2, unitPrice: 1000 },
        { quantity: 1, unitPrice: 500 },
      ],
      discount: 500,
      taxRate: 10,
    });
    expect(t.subtotal.toFixed(2)).toBe("2500.00");
    expect(t.taxTotal.toFixed(2)).toBe("200.00");
    expect(t.total.toFixed(2)).toBe("2200.00");

    const over = computeTotals({
      lineItems: [{ quantity: 1, unitPrice: 100 }],
      discount: 1000,
      taxRate: 10,
    });
    expect(over.total.toFixed(2)).toBe("0.00");
  });
});
