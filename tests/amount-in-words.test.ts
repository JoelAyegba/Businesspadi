import { describe, it, expect } from "vitest";
import { amountInWords, integerToWords } from "@/lib/amount-in-words";

describe("integerToWords", () => {
  it.each([
    [0, "zero"],
    [7, "seven"],
    [15, "fifteen"],
    [42, "forty-two"],
    [100, "one hundred"],
    [105, "one hundred and five"],
    [1005, "one thousand and five"],
    [1250, "one thousand, two hundred and fifty"],
    [53750, "fifty-three thousand, seven hundred and fifty"],
    [1_000_000, "one million"],
    [2_000_045, "two million and forty-five"],
    [1_234_567, "one million, two hundred and thirty-four thousand, five hundred and sixty-seven"],
    [3_000_000_000, "three billion"],
  ])("%i → %s", (n, words) => {
    expect(integerToWords(n)).toBe(words);
  });
});

describe("amountInWords", () => {
  it("naira, whole amount", () => {
    expect(amountInWords(53750, "NGN")).toBe(
      "Fifty-three thousand, seven hundred and fifty naira only",
    );
  });

  it("naira with kobo", () => {
    expect(amountInWords(12.5, "NGN")).toBe("Twelve naira and fifty kobo only");
  });

  it("only minor units", () => {
    expect(amountInWords(0.5, "NGN")).toBe("Fifty kobo only");
  });

  it("zero", () => {
    expect(amountInWords(0, "NGN")).toBe("Zero naira only");
  });

  it("is immune to float noise", () => {
    // 0.1 + 0.2 = 0.30000000000000004
    expect(amountInWords(0.1 + 0.2, "USD")).toBe("Thirty cents only");
    expect(amountInWords(1_000_000.05, "NGN")).toBe("One million naira and five kobo only");
  });

  it.each([
    [1, "GHS", "One Ghana cedi only"],
    [2.01, "GHS", "Two Ghana cedis and one pesewa only"],
    [1500, "KES", "One thousand, five hundred Kenyan shillings only"],
    [99.99, "ZAR", "Ninety-nine rand and ninety-nine cents only"],
    [1, "USD", "One US dollar only"],
    [10.01, "GBP", "Ten pounds and one penny only"],
    [3.5, "EUR", "Three euros and fifty cents only"],
  ])("%d %s", (amount, currency, words) => {
    expect(amountInWords(amount, currency)).toBe(words);
  });

  it("falls back to the currency code for unknown currencies", () => {
    expect(amountInWords(250, "XOF")).toBe("Two hundred and fifty XOF only");
    expect(amountInWords(250.75, "XOF")).toBe("Two hundred and fifty and 75/100 XOF only");
  });
});
