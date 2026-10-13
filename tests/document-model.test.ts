import { describe, it, expect } from "vitest";
import { buildDocModel } from "@/lib/document-model";
import { getTemplate, resolvePalette, contrastRatio, TEMPLATES } from "@/lib/templates";
import { sampleBusiness, sampleInvoice, sampleReceipt } from "@/lib/dev/sample-documents";

describe("buildDocModel", () => {
  it("shows discount and tax rows, and labels a paid receipt's total", () => {
    const m = buildDocModel(sampleReceipt, sampleBusiness, "classic");
    expect(m.breakdown.map((r) => r.label)).toEqual(["Subtotal", "Discount", "Tax (7.5%)"]);
    expect(m.breakdown[1]!.value).toMatch(/^-/);
    expect(m.total.label).toBe("Amount paid");
    expect(m.amountInWords).toBe("Five hundred and eighty thousand, five hundred naira only");
  });

  it("omits discount and tax rows when they are zero", () => {
    const m = buildDocModel({ ...sampleReceipt, discountValue: 0, taxRate: 0 }, sampleBusiness);
    expect(m.breakdown.map((r) => r.label)).toEqual(["Subtotal"]);
  });

  it("stamps PAID and VOID, nothing for issued or draft", () => {
    expect(buildDocModel(sampleReceipt, sampleBusiness).stamp).toBe("PAID");
    expect(buildDocModel({ ...sampleReceipt, status: "VOID" }, sampleBusiness).stamp).toBe("VOID");
    expect(buildDocModel({ ...sampleReceipt, status: "ISSUED" }, sampleBusiness).stamp).toBeNull();
    expect(buildDocModel({ ...sampleReceipt, status: "DRAFT" }, sampleBusiness).statusLabel).toBe(
      "Draft",
    );
  });

  it("an unpaid invoice is 'Amount due' with due date and terms", () => {
    const m = buildDocModel(sampleInvoice, sampleBusiness);
    expect(m.title).toBe("Invoice");
    expect(m.statusLabel).toBe("Unpaid");
    expect(m.total.label).toBe("Amount due");
    expect(m.meta.map((r) => r.label)).toEqual(["Issued", "Due", "Terms"]);
  });

  it("prints Pay to on invoices only, and only with bank details", () => {
    expect(buildDocModel(sampleInvoice, sampleBusiness).payTo).toEqual({
      bankName: "Guaranty Trust Bank",
      accountName: "Adunni Studio Ltd",
      accountNumber: "0123456789",
    });
    expect(buildDocModel(sampleReceipt, sampleBusiness).payTo).toBeNull();
    expect(
      buildDocModel(sampleInvoice, { ...sampleBusiness, bankAccountNumber: null }).payTo,
    ).toBeNull();
  });

  it("formats dates without timezone drift", () => {
    const m = buildDocModel({ ...sampleReceipt, issueDate: "2026-01-01" }, sampleBusiness);
    expect(m.meta[0]).toEqual({ label: "Issued", value: "1 Jan 2026" });
  });

  it("falls back to Classic for unknown template ids", () => {
    expect(buildDocModel(sampleReceipt, sampleBusiness, "does-not-exist").template.id).toBe(
      "classic",
    );
  });
});

describe("templates", () => {
  it("keeps every persisted template id", () => {
    expect(TEMPLATES.map((t) => t.id).sort()).toEqual(
      [
        "classic",
        "executive",
        "forest",
        "lavender",
        "minimal",
        "modern",
        "mono",
        "neon",
        "ocean",
        "sunset",
      ].sort(),
    );
  });

  it("Classic follows the brand colour, darkened until legible on paper", () => {
    const classic = getTemplate("classic");
    expect(resolvePalette(classic, "#0E7C66").accent).toBe("#0E7C66");
    const pale = resolvePalette(classic, "#FDE68A"); // pale yellow
    expect(contrastRatio(pale.accent, pale.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("every template's ink, accent and band text are legible", () => {
    for (const t of TEMPLATES) {
      const p = t.palette;
      expect(contrastRatio(p.ink, p.paper), `${t.id} ink`).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(p.accent, p.paper), `${t.id} accent`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(p.bandInk, p.band), `${t.id} band`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(p.muted, p.paper), `${t.id} muted`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
