"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { requireBusinessContext } from "@/lib/auth";
import { generateDocumentNumber } from "@/lib/queries/receipt-number";
import { SNAPSHOT_SELECT } from "@/lib/queries/business-view";
import { getFreeTierUsage } from "@/lib/billing/limits";
import { computeTotals } from "@/lib/money";

const lineItem = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.number().nonnegative().max(1_000_000),
  unitPrice: z.number().nonnegative().max(1_000_000_000),
});

const draft = z.object({
  documentType: z.enum(["RECEIPT", "INVOICE"]).default("RECEIPT"),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .nullable()
    .default(null),
  paymentTerms: z.string().nullable().default(null),
  clientId: z.string().nullable(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  currency: z.string().length(3),
  taxRate: z.number().nonnegative().max(100, "Tax rate can't exceed 100%"),
  discount: z.number().nonnegative().max(1_000_000_000),
  notes: z.string().nullable(),
  templateId: z.string().default("classic"),
  lineItems: z.array(lineItem).min(1, "Add at least one line item"),
  status: z.enum(["DRAFT", "ISSUED"]),
});

/** "/app/receipts" | "/app/invoices" — the list/detail base for a doc type. */
function basePathFor(documentType: "RECEIPT" | "INVOICE"): string {
  return documentType === "INVOICE" ? "/app/invoices" : "/app/receipts";
}

/** Lowercase noun for user-facing messages. */
function nounFor(documentType: "RECEIPT" | "INVOICE"): string {
  return documentType === "INVOICE" ? "invoice" : "receipt";
}

/** Decimal(12,2) ceiling. */
const MAX_AMOUNT = 10_000_000_000;

export type SaveReceiptInput = z.input<typeof draft>;
export type SaveReceiptResult =
  | { ok: true; id: string }
  | { ok: false; error: string; code?: "FREE_TIER_LIMIT" };

const draftUpdate = draft.extend({
  id: z.string(),
});
export type UpdateReceiptInput = z.infer<typeof draftUpdate>;

export async function saveReceipt(input: SaveReceiptInput): Promise<SaveReceiptResult> {
  const { business } = await requireBusinessContext();

  const parsed = draft.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // Free-tier monthly cap. Drafts are unlimited; only count toward quota
  // when the user actually issues. Pro users (active or past_due) are
  // unaffected. See lib/billing/limits.ts.
  if (data.status === "ISSUED") {
    const usage = await getFreeTierUsage(business.id);
    if (!usage.isPro && usage.remaining <= 0) {
      return {
        ok: false,
        code: "FREE_TIER_LIMIT",
        error: `Free plan limit of ${usage.limit} documents/month reached. Upgrade to keep issuing.`,
      };
    }
  }

  let finalClientId = data.clientId;

  if (data.clientName) {
    const newClient = await prisma.client.create({
      data: {
        businessId: business.id,
        name: data.clientName,
        email: data.clientEmail || null,
        phone: data.clientPhone || null,
      },
    });
    finalClientId = newClient.id;
  } else if (data.clientId) {
    // Validate clientId belongs to this business (multi-tenant guard).
    const c = await prisma.client.findFirst({
      where: { id: data.clientId, businessId: business.id },
      select: { id: true },
    });
    if (!c) return { ok: false, error: "Client not found" };
  }

  const totals = computeTotals(data);
  if (totals.total.gte(MAX_AMOUNT)) return { ok: false, error: "Total is too large" };

  const biz = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    select: SNAPSHOT_SELECT,
  });

  try {
    // Counter increment + document insert in one transaction so the number
    // is reserved atomically. Concurrent saves serialize on the counter row.
    const receipt = await prisma.$transaction(async (tx) => {
      const number = await generateDocumentNumber(tx, business.id, data.documentType);
      return tx.receipt.create({
        data: {
          businessId: business.id,
          clientId: finalClientId,
          number,
          documentType: data.documentType,
          status: data.status,
          issueDate: new Date(data.issueDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          paymentTerms: data.paymentTerms,
          currency: data.currency,
          taxRate: data.taxRate.toString(),
          discountType: "FLAT",
          discountValue: data.discount.toString(),
          notes: data.notes,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          templateId: data.templateId,
          businessSnapshot: biz as object,
          lineItems: {
            create: data.lineItems.map((li, position) => ({
              description: li.description,
              quantity: li.quantity.toString(),
              unitPrice: li.unitPrice.toFixed(2),
              subtotal: totals.lineSubtotals[position]!,
              position,
            })),
          },
        },
        select: { id: true },
      });
    });

    revalidatePath("/app/dashboard");
    revalidatePath(basePathFor(data.documentType));
    revalidateTag(`receipts-${business.id}`);
    revalidatePath("/app/clients");
    return { ok: true, id: receipt.id };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return { ok: false, error: `${nounFor(data.documentType)} number collision — please try again` };
    }
    throw err;
  }
}

export async function updateReceipt(input: UpdateReceiptInput): Promise<SaveReceiptResult> {
  const { business } = await requireBusinessContext();

  const parsed = draftUpdate.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await prisma.receipt.findFirst({
    where: { id: data.id, businessId: business.id, documentType: data.documentType },
  });

  if (!existing) return { ok: false, error: `${nounFor(data.documentType)} not found` };
  if (existing.status !== "DRAFT")
    return { ok: false, error: `Only draft ${nounFor(data.documentType)}s can be edited` };

  if (data.status === "ISSUED") {
    const usage = await getFreeTierUsage(business.id);
    if (!usage.isPro && usage.remaining <= 0) {
      return {
        ok: false,
        code: "FREE_TIER_LIMIT",
        error: `Free plan limit of ${usage.limit} documents/month reached. Upgrade to keep issuing.`,
      };
    }
  }

  let finalClientId = data.clientId;

  if (data.clientName) {
    const newClient = await prisma.client.create({
      data: {
        businessId: business.id,
        name: data.clientName,
        email: data.clientEmail || null,
        phone: data.clientPhone || null,
      },
    });
    finalClientId = newClient.id;
  } else if (data.clientId) {
    const c = await prisma.client.findFirst({
      where: { id: data.clientId, businessId: business.id },
      select: { id: true },
    });
    if (!c) return { ok: false, error: "Client not found" };
  }

  const totals = computeTotals(data);
  if (totals.total.gte(MAX_AMOUNT)) return { ok: false, error: "Total is too large" };

  const biz = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    select: SNAPSHOT_SELECT,
  });

  // Re-check DRAFT inside the write (guarded updateMany) so a concurrent
  // issue/void between the read above and this write can't be clobbered.
  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.receipt.updateMany({
      where: { id: data.id, businessId: business.id, documentType: data.documentType, status: "DRAFT" },
      data: {
        clientId: finalClientId,
        status: data.status,
        issueDate: new Date(data.issueDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paymentTerms: data.paymentTerms,
        currency: data.currency,
        taxRate: data.taxRate.toString(),
        discountType: "FLAT",
        discountValue: data.discount.toString(),
        notes: data.notes,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        templateId: data.templateId,
        businessSnapshot: biz as object,
      },
    });
    if (count === 0) return false;

    await tx.receiptLineItem.deleteMany({ where: { receiptId: data.id } });
    await tx.receiptLineItem.createMany({
      data: data.lineItems.map((li, position) => ({
        receiptId: data.id,
        description: li.description,
        quantity: li.quantity.toString(),
        unitPrice: li.unitPrice.toFixed(2),
        subtotal: totals.lineSubtotals[position]!,
        position,
      })),
    });
    return true;
  });
  if (!updated) return { ok: false, error: `Only draft ${nounFor(data.documentType)}s can be edited` };

  const base = basePathFor(data.documentType);
  revalidatePath("/app/dashboard");
  revalidatePath(base);
  revalidatePath(`${base}/${data.id}`);
  revalidateTag(`receipts-${business.id}`);
  revalidatePath("/app/clients");
  return { ok: true, id: data.id };
}

export async function saveReceiptAndRedirect(input: SaveReceiptInput) {
  const result = await saveReceipt(input);
  if (!result.ok) return result;
  redirect(`${basePathFor(input.documentType ?? "RECEIPT")}/${result.id}`);
}

type ActionResult = { ok: true } | { ok: false; error: string };

async function getReceiptOwned(receiptId: string, businessId: string) {
  return prisma.receipt.findFirst({
    where: { id: receiptId, businessId, documentType: "RECEIPT" },
    select: { id: true, status: true },
  });
}

/** Mark an Issued receipt as Paid (Phase 3 §7.3). Idempotent on PAID. */
export async function markPaid(receiptId: string, paymentMethod?: string): Promise<ActionResult> {
  const { business } = await requireBusinessContext();
  const r = await getReceiptOwned(receiptId, business.id);
  if (!r) return { ok: false, error: "Receipt not found" };
  if (r.status === "PAID") return { ok: true };
  if (r.status !== "ISSUED") return { ok: false, error: "Only issued receipts can be marked paid" };

  // Status guard in the WHERE makes the transition atomic under double-submit.
  await prisma.receipt.updateMany({
    where: { id: receiptId, businessId: business.id, documentType: "RECEIPT", status: "ISSUED" },
    data: { status: "PAID", paidAt: new Date(), paymentMethod: paymentMethod ?? null },
  });
  revalidatePath(`/app/receipts/${receiptId}`);
  revalidatePath("/app/receipts");
  revalidatePath("/app/dashboard");
  revalidateTag(`receipts-${business.id}`);
  return { ok: true };
}

/** Void a receipt — non-destructive, audit-trail per §7.3. */
export async function voidReceipt(receiptId: string): Promise<ActionResult> {
  const { business } = await requireBusinessContext();
  const r = await getReceiptOwned(receiptId, business.id);
  if (!r) return { ok: false, error: "Receipt not found" };
  if (r.status === "VOID") return { ok: true };

  await prisma.receipt.updateMany({
    where: { id: receiptId, businessId: business.id, documentType: "RECEIPT" },
    data: { status: "VOID" },
  });
  revalidatePath(`/app/receipts/${receiptId}`);
  revalidatePath("/app/receipts");
  revalidatePath("/app/dashboard");
  revalidateTag(`receipts-${business.id}`);
  return { ok: true };
}

/**
 * Duplicate a receipt as a fresh DRAFT (§7.3). Copies line items, client,
 * currency, tax rate, notes, template. Gets a new number; no shareId.
 */
export async function duplicateReceipt(receiptId: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { business } = await requireBusinessContext();

  const source = await prisma.receipt.findFirst({
    where: { id: receiptId, businessId: business.id, documentType: "RECEIPT" },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!source) return { ok: false, error: "Receipt not found" };

  const biz = await prisma.business.findUniqueOrThrow({
    where: { id: business.id },
    select: SNAPSHOT_SELECT,
  });

  const created = await prisma.$transaction(async (tx) => {
    const number = await generateDocumentNumber(tx, business.id, "RECEIPT");
    return tx.receipt.create({
      data: {
        businessId: business.id,
        clientId: source.clientId,
        number,
        documentType: "RECEIPT",
        status: "DRAFT",
        issueDate: new Date(),
        currency: source.currency,
        taxRate: source.taxRate,
        discountType: source.discountType,
        discountValue: source.discountValue,
        notes: source.notes,
        subtotal: source.subtotal,
        taxTotal: source.taxTotal,
        total: source.total,
        templateId: source.templateId,
        businessSnapshot: biz as object,
        lineItems: {
          create: source.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            subtotal: li.subtotal,
            position: li.position,
          })),
        },
      },
      select: { id: true },
    });
  });

  revalidatePath("/app/receipts");
  revalidateTag(`receipts-${business.id}`);
  return { ok: true, id: created.id };
}

/**
 * Generate a public shareId on first call, or return the existing one.
 * The shareId is the only public handle on a receipt — never expose `id`.
 * Idempotent: safe to call from multiple share buttons / retries.
 */
export async function ensureShareId(receiptId: string): Promise<{ ok: true; shareId: string } | { ok: false; error: string }> {
  const { business } = await requireBusinessContext();

  const existing = await prisma.receipt.findFirst({
    where: { id: receiptId, businessId: business.id, documentType: "RECEIPT" },
    select: { shareId: true, status: true },
  });
  if (!existing) return { ok: false, error: "Receipt not found" };
  if (existing.status === "DRAFT") {
    return { ok: false, error: "Issue the receipt before sharing" };
  }
  if (existing.shareId) return { ok: true, shareId: existing.shareId };

  // 12 chars of nanoid is ~1e21 — collision risk is negligible at our scale,
  // and the unique index on shareId catches the rare clash.
  for (let attempt = 0; attempt < 3; attempt++) {
    const shareId = nanoid(12);
    try {
      // Only set if still unset — two concurrent share clicks must not
      // mint two links (the first one may already have been sent out).
      const { count } = await prisma.receipt.updateMany({
        where: { id: receiptId, businessId: business.id, shareId: null },
        data: { shareId },
      });
      if (count === 0) {
        const current = await prisma.receipt.findFirst({
          where: { id: receiptId, businessId: business.id },
          select: { shareId: true },
        });
        if (current?.shareId) return { ok: true, shareId: current.shareId };
        return { ok: false, error: "Receipt not found" };
      }
      revalidatePath(`/app/receipts/${receiptId}`);
      return { ok: true, shareId };
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && err.code === "P2002") continue;
      throw err;
    }
  }
  return { ok: false, error: "Could not generate share link, try again" };
}
