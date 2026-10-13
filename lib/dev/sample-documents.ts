/**
 * Realistic sample documents for previewing templates (dev-only page
 * /dev/templates). Not used by any production path.
 */
import type { MockBusiness, MockReceipt } from "@/lib/mock";

export const sampleBusiness: MockBusiness = {
  id: "sample-business",
  name: "Adunni Studio",
  slug: "adunni-studio",
  logoUrl: null,
  brandColor: "#0E7C66",
  defaultCurrency: "NGN",
  subscriptionStatus: "active",
  address: "14 Admiralty Way, Lekki Phase 1, Lagos",
  email: "hello@adunni.studio",
  phone: "+234 803 412 7790",
  taxId: "21845530-0001",
  signatureUrl: null,
  bankName: "Guaranty Trust Bank",
  bankAccountName: "Adunni Studio Ltd",
  bankAccountNumber: "0123456789",
};

const base = {
  businessId: "sample-business",
  clientId: "sample-client",
  currency: "NGN",
  issueDate: "2026-10-13",
  subtotal: 560000,
  taxRate: 7.5,
  discountValue: 20000,
  taxTotal: 40500,
  total: 580500,
  client: {
    id: "sample-client",
    name: "Chiamaka Okeke Ventures",
    email: "accounts@okekeventures.ng",
    phone: "+234 805 222 3333",
  },
  lineItems: [
    {
      id: "1",
      description: "Brand identity design (logo, colour, type)",
      quantity: 1,
      unitPrice: 350000,
      subtotal: 350000,
    },
    {
      id: "2",
      description: "Business card design and print-ready files",
      quantity: 2,
      unitPrice: 45000,
      subtotal: 90000,
    },
    {
      id: "3",
      description: "Social media launch kit",
      quantity: 1,
      unitPrice: 120000,
      subtotal: 120000,
    },
  ],
};

export const sampleReceipt: MockReceipt = {
  ...base,
  id: "sample-receipt",
  number: "RCPT-2026-0042",
  documentType: "RECEIPT",
  status: "PAID",
  paidAt: "2026-10-13",
  paymentMethod: "Bank transfer",
  notes: "Thank you for choosing Adunni Studio. Files delivered via Google Drive.",
};

export const sampleInvoice: MockReceipt = {
  ...base,
  id: "sample-invoice",
  number: "INV-2026-0017",
  documentType: "INVOICE",
  status: "ISSUED",
  paidAt: null,
  dueDate: "2026-10-27",
  paymentTerms: "Net 14",
  notes: null,
};
