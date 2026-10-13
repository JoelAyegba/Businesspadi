/**
 * Display model for a receipt / invoice — the single place that decides WHAT
 * a document says. Both renderers (web layouts, PDF layouts) only decide HOW
 * it looks. Keeps labels, totals rows, stamp rules and optional sections
 * identical on screen and on paper.
 */
import { formatMoney } from "@/lib/utils";
import { amountInWords } from "@/lib/amount-in-words";
import {
  contrastRatio,
  getTemplate,
  resolvePalette,
  type DocPalette,
  type DocTemplate,
} from "@/lib/templates";
import type { MockBusiness, MockReceipt } from "@/lib/mock";

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const qtyFmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 3 });

/** YYYY-MM-DD → "13 Oct 2026". Parsed as UTC so the day never shifts. */
export function formatDocDate(iso: string): string {
  return dateFmt.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

export type DocStamp = "PAID" | "VOID" | null;

export type DocMetaRow = { label: string; value: string };
export type DocMoneyRow = { label: string; value: string };

export type DocModel = {
  template: DocTemplate;
  palette: DocPalette;
  /** Dark paper (Neon): dark-on-light assets like signatures must invert. */
  darkPaper: boolean;
  isInvoice: boolean;
  /** "Receipt" | "Invoice" */
  title: string;
  number: string;
  /** Short status chip text, or null when the stamp / title already says it. */
  statusLabel: string | null;
  stamp: DocStamp;
  business: {
    name: string;
    logoUrl: string | null;
    /** Address, email, phone — in print order, empties removed. */
    contact: string[];
    taxId: string | null;
    signatureUrl: string | null;
  };
  client: { name: string; contact: string[] };
  /** Issued / Due / Paid / Terms / Method — only the ones that apply. */
  meta: DocMetaRow[];
  items: { description: string; quantity: string; unitPrice: string; amount: string }[];
  /** Subtotal, discount, tax — the rows above the grand total. */
  breakdown: DocMoneyRow[];
  total: { label: string; value: string };
  amountInWords: string;
  notes: string | null;
  payTo: { bankName: string; accountName: string | null; accountNumber: string } | null;
  footer: string;
};

export function buildDocModel(
  receipt: MockReceipt,
  business: MockBusiness,
  templateId?: string | null,
): DocModel {
  const template = getTemplate(templateId ?? receipt.templateId);
  const palette = resolvePalette(template, business.brandColor);
  const isInvoice = receipt.documentType === "INVOICE";
  const money = (n: number) => formatMoney(n, receipt.currency);
  const isPaid = receipt.status === "PAID";

  const stamp: DocStamp = receipt.status === "VOID" ? "VOID" : isPaid ? "PAID" : null;
  const statusLabel =
    receipt.status === "DRAFT"
      ? "Draft"
      : isInvoice && receipt.status === "ISSUED"
        ? "Unpaid"
        : null;

  const meta: DocMetaRow[] = [{ label: "Issued", value: formatDocDate(receipt.issueDate) }];
  if (isInvoice && receipt.dueDate)
    meta.push({ label: "Due", value: formatDocDate(receipt.dueDate) });
  if (isInvoice && receipt.paymentTerms) meta.push({ label: "Terms", value: receipt.paymentTerms });
  if (isPaid && receipt.paidAt) meta.push({ label: "Paid", value: formatDocDate(receipt.paidAt) });
  if (isPaid && receipt.paymentMethod) meta.push({ label: "Method", value: receipt.paymentMethod });

  const discount = receipt.discountValue ?? 0;
  const breakdown: DocMoneyRow[] = [{ label: "Subtotal", value: money(receipt.subtotal) }];
  if (discount > 0) breakdown.push({ label: "Discount", value: `-${money(discount)}` });
  if (receipt.taxRate > 0)
    breakdown.push({ label: `Tax (${receipt.taxRate}%)`, value: money(receipt.taxTotal) });

  const totalLabel = isPaid ? "Amount paid" : isInvoice ? "Amount due" : "Total";

  const payTo =
    isInvoice && business.bankName && business.bankAccountNumber
      ? {
          bankName: business.bankName,
          accountName: business.bankAccountName ?? null,
          accountNumber: business.bankAccountNumber,
        }
      : null;

  return {
    template,
    palette,
    darkPaper: contrastRatio("#FFFFFF", palette.paper) > 7,
    isInvoice,
    title: isInvoice ? "Invoice" : "Receipt",
    number: receipt.number,
    statusLabel,
    stamp,
    business: {
      name: business.name,
      logoUrl: business.logoUrl,
      contact: [business.address, business.email, business.phone].filter((v): v is string =>
        Boolean(v),
      ),
      taxId: business.taxId ?? null,
      signatureUrl: business.signatureUrl ?? null,
    },
    client: {
      name: receipt.client?.name ?? "Walk-in customer",
      contact: [receipt.client?.email, receipt.client?.phone].filter((v): v is string =>
        Boolean(v),
      ),
    },
    meta,
    items: receipt.lineItems.map((li) => ({
      description: li.description,
      quantity: qtyFmt.format(li.quantity),
      unitPrice: money(li.unitPrice),
      amount: money(li.subtotal),
    })),
    breakdown,
    total: { label: totalLabel, value: money(receipt.total) },
    amountInWords: amountInWords(receipt.total, receipt.currency),
    notes: receipt.notes?.trim() || null,
    payTo,
    footer: isInvoice
      ? "Thank you. Please include the invoice number with your payment."
      : "Thank you for your business.",
  };
}
