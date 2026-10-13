/**
 * Local fixtures used by UI screens until real Prisma queries land.
 * Shapes mirror prisma/schema.prisma so swapping to real data is a
 * find-and-replace of the importer, not a rewrite of the components.
 *
 * Drop this whole module once Phase 1 wires queries through getServerContext().
 */

export type ReceiptStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID";
export type DocumentType = "RECEIPT" | "INVOICE";

export type MockBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  defaultCurrency: string;
  subscriptionStatus: "free" | "active" | "past_due" | "canceled";
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  signatureUrl?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
};

export type MockClient = {
  id: string;
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type MockLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type MockReceipt = {
  id: string;
  businessId: string;
  clientId: string | null;
  number: string;
  documentType?: DocumentType;
  status: ReceiptStatus;
  issueDate: string;
  paidAt: string | null;
  paymentMethod?: string | null;
  // Invoice-only.
  dueDate?: string | null;
  paymentTerms?: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxTotal: number;
  total: number;
  discountValue?: number;
  notes?: string | null;
  /** Visual template id (see lib/templates.ts). Defaults to "classic". */
  templateId?: string;
  client: Pick<MockClient, "id" | "name" | "email" | "phone"> | null;
  lineItems: MockLineItem[];
  // Invoice → Receipt cross-links (populated on detail views).
  sourceInvoiceId?: string | null;
  sourceInvoiceNumber?: string | null;
  generatedReceiptId?: string | null;
  generatedReceiptNumber?: string | null;
};

export const mockBusiness: MockBusiness = {
  id: "biz_1",
  name: "Adunni Studio",
  slug: "adunni-studio",
  logoUrl: null,
  brandColor: "#2563EB" /* Updated to Royal Blue brand color */,
  defaultCurrency: "NGN",
  subscriptionStatus: "free",
};

export const mockClients: MockClient[] = [
  {
    id: "cli_1",
    businessId: "biz_1",
    name: "Bola Tinubu Ventures",
    email: "accounts@btv.ng",
    phone: "+234 803 111 2222",
  },
  {
    id: "cli_2",
    businessId: "biz_1",
    name: "Chiamaka Okeke",
    email: "chiamaka@gmail.com",
    phone: "+234 805 222 3333",
  },
  {
    id: "cli_3",
    businessId: "biz_1",
    name: "Lagos Tech Hub",
    email: "finance@lth.io",
    phone: null,
  },
  {
    id: "cli_4",
    businessId: "biz_1",
    name: "Emeka Logistics Ltd",
    email: null,
    phone: "+234 802 444 5555",
  },
  {
    id: "cli_5",
    businessId: "biz_1",
    name: "Ngozi & Sons",
    email: "ngozi@nsons.ng",
    phone: "+234 807 555 6666",
  },
];

const findClient = (id: string) => {
  const c = mockClients.find((x) => x.id === id);
  return c ? { id: c.id, name: c.name, email: c.email, phone: c.phone } : null;
};

export const mockReceipts: MockReceipt[] = [
  {
    id: "rcp_1",
    businessId: "biz_1",
    clientId: "cli_1",
    number: "RCPT-2026-0042",
    status: "PAID",
    issueDate: "2026-05-02",
    paidAt: "2026-05-03",
    currency: "NGN",
    subtotal: 450000,
    taxRate: 7.5,
    taxTotal: 33750,
    total: 483750,
    client: findClient("cli_1"),
    lineItems: [
      {
        id: "li_1",
        description: "Brand identity package",
        quantity: 1,
        unitPrice: 350000,
        subtotal: 350000,
      },
      {
        id: "li_2",
        description: "Logo revisions",
        quantity: 2,
        unitPrice: 50000,
        subtotal: 100000,
      },
    ],
  },
  {
    id: "rcp_2",
    businessId: "biz_1",
    clientId: "cli_2",
    number: "RCPT-2026-0041",
    status: "ISSUED",
    issueDate: "2026-04-29",
    paidAt: null,
    currency: "NGN",
    subtotal: 120000,
    taxRate: 7.5,
    taxTotal: 9000,
    total: 129000,
    client: findClient("cli_2"),
    lineItems: [
      {
        id: "li_3",
        description: "Wedding photography — half day",
        quantity: 1,
        unitPrice: 120000,
        subtotal: 120000,
      },
    ],
  },
  {
    id: "rcp_3",
    businessId: "biz_1",
    clientId: "cli_3",
    number: "RCPT-2026-0040",
    status: "ISSUED",
    issueDate: "2026-04-27",
    paidAt: null,
    currency: "NGN",
    subtotal: 800000,
    taxRate: 7.5,
    taxTotal: 60000,
    total: 860000,
    client: findClient("cli_3"),
    lineItems: [
      {
        id: "li_4",
        description: "Workshop facilitation (2 days)",
        quantity: 2,
        unitPrice: 400000,
        subtotal: 800000,
      },
    ],
  },
  {
    id: "rcp_4",
    businessId: "biz_1",
    clientId: "cli_4",
    number: "RCPT-2026-0039",
    status: "PAID",
    issueDate: "2026-04-22",
    paidAt: "2026-04-25",
    currency: "NGN",
    subtotal: 75000,
    taxRate: 0,
    taxTotal: 0,
    total: 75000,
    client: findClient("cli_4"),
    lineItems: [
      {
        id: "li_5",
        description: "Last-mile delivery — April batch",
        quantity: 15,
        unitPrice: 5000,
        subtotal: 75000,
      },
    ],
  },
  {
    id: "rcp_5",
    businessId: "biz_1",
    clientId: "cli_5",
    number: "RCPT-2026-0038",
    status: "DRAFT",
    issueDate: "2026-04-20",
    paidAt: null,
    currency: "NGN",
    subtotal: 250000,
    taxRate: 7.5,
    taxTotal: 18750,
    total: 268750,
    client: findClient("cli_5"),
    lineItems: [
      {
        id: "li_6",
        description: "Consulting retainer — May",
        quantity: 1,
        unitPrice: 250000,
        subtotal: 250000,
      },
    ],
  },
  {
    id: "rcp_6",
    businessId: "biz_1",
    clientId: "cli_1",
    number: "RCPT-2026-0037",
    status: "VOID",
    issueDate: "2026-04-15",
    paidAt: null,
    currency: "NGN",
    subtotal: 60000,
    taxRate: 7.5,
    taxTotal: 4500,
    total: 64500,
    client: findClient("cli_1"),
    lineItems: [
      {
        id: "li_7",
        description: "Print proofs (cancelled)",
        quantity: 1,
        unitPrice: 60000,
        subtotal: 60000,
      },
    ],
  },
  {
    id: "rcp_7",
    businessId: "biz_1",
    clientId: null,
    number: "RCPT-2026-0036",
    status: "PAID",
    issueDate: "2026-04-12",
    paidAt: "2026-04-12",
    currency: "NGN",
    subtotal: 15000,
    taxRate: 0,
    taxTotal: 0,
    total: 15000,
    client: null,
    lineItems: [
      {
        id: "li_8",
        description: "Walk-in: poster print",
        quantity: 1,
        unitPrice: 15000,
        subtotal: 15000,
      },
    ],
  },
  {
    id: "rcp_8",
    businessId: "biz_1",
    clientId: "cli_3",
    number: "RCPT-2026-0035",
    status: "PAID",
    issueDate: "2026-04-08",
    paidAt: "2026-04-09",
    currency: "NGN",
    subtotal: 200000,
    taxRate: 7.5,
    taxTotal: 15000,
    total: 215000,
    client: findClient("cli_3"),
    lineItems: [
      {
        id: "li_9",
        description: "Talk: design systems",
        quantity: 1,
        unitPrice: 200000,
        subtotal: 200000,
      },
    ],
  },
];

export type DashboardKpis = {
  paidThisMonth: number;
  outstanding: number;
  receiptsIssued: number;
  draftCount: number;
  currency: string;
};

export function getDashboardKpis(): DashboardKpis {
  const now = new Date("2026-05-04");
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let paidThisMonth = 0;
  let outstanding = 0;
  let receiptsIssued = 0;
  let draftCount = 0;

  for (const r of mockReceipts) {
    if (r.status === "PAID" && r.paidAt && new Date(r.paidAt) >= monthStart) {
      paidThisMonth += r.total;
    }
    if (r.status === "ISSUED") outstanding += r.total;
    if (r.status === "ISSUED" || r.status === "PAID") receiptsIssued += 1;
    if (r.status === "DRAFT") draftCount += 1;
  }

  return {
    paidThisMonth,
    outstanding,
    receiptsIssued,
    draftCount,
    currency: mockBusiness.defaultCurrency,
  };
}
