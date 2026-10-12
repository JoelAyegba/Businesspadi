import { describe, it, expect } from "vitest";
import { escapeHtml, receiptEmail } from "@/lib/email/templates";

describe("receipt email template", () => {
  it("escapes HTML metacharacters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });

  it("escapes tenant-controlled fields so they can't inject markup", () => {
    const { html } = receiptEmail({
      businessName: `<a href="https://evil.example">Click</a>`,
      brandColor: `red;"><script>alert(1)</script>`,
      receiptNumber: "<b>R-1</b>",
      amountLabel: "₦1,000.00",
      receiptUrl: "https://app.example/r/abc",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain(`<a href="https://evil.example">`);
    expect(html).not.toContain("<b>R-1</b>");
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
    // Invalid colour falls back to a safe default.
    expect(html).toContain("background-color: #000000");
  });

  it("keeps a valid hex brand colour", () => {
    const { html } = receiptEmail({
      businessName: "Adunni Studio",
      brandColor: "#1B4F8A",
      receiptNumber: "RCPT-2026-0001",
      amountLabel: "₦1,000.00",
      receiptUrl: "https://app.example/r/abc",
    });
    expect(html).toContain("background-color: #1B4F8A");
  });
});
