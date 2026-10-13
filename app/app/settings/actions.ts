"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBusinessContext } from "@/lib/auth";

/**
 * Server actions are public POST endpoints — TS types are not enforced at
 * runtime. Every action here parses input with a strict zod schema and writes
 * ONLY whitelisted fields, so a caller can't smuggle in e.g.
 * `subscriptionStatus: "active"`.
 */

export type SettingsActionResult = { ok: true } | { ok: false; error: string };

// Logos/signatures are resized client-side and stored as data URLs; also
// accept https URLs (Cloudinary). Anything else (javascript:, http:) is rejected.
const imageUrl = z
  .string()
  .max(3_000_000, "Image is too large")
  .refine(
    (v) =>
      v === "" ||
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ||
      /^https:\/\//.test(v),
    "Invalid image",
  );

const optionalText = (max: number) => z.string().trim().max(max).nullish();

const brandingSchema = z
  .object({
    brandColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Brand color must be a hex value like #1B4F8A")
      .optional(),
    logoUrl: imageUrl.optional(),
  })
  .strict();

const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Business name must be at least 2 characters").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain letters, numbers and dashes")
      .max(64),
    phone: optionalText(40),
    email: z.string().trim().email("Invalid email").or(z.literal("")).nullish(),
    taxId: optionalText(60),
    address: optionalText(300),
    signatureUrl: imageUrl.nullish(),
  })
  .strict();

const defaultsSchema = z
  .object({
    defaultCurrency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code"),
    defaultTaxRate: z
      .number()
      .min(0, "Tax rate can't be negative")
      .max(100, "Tax rate can't exceed 100%"),
    numberFormat: z
      .string()
      .trim()
      .max(40)
      .regex(/\{N{1,5}\}/, "Number format must include a sequence token like {NNNN}"),
  })
  .strict();

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

function revalidateBusiness(businessId: string) {
  revalidatePath("/app/settings");
  revalidatePath("/app/receipts");
  revalidatePath("/app/invoices");
  revalidatePath("/app/dashboard");
  revalidateTag(`receipts-${businessId}`);
}

export async function updateBranding(input: {
  brandColor?: string;
  logoUrl?: string;
}): Promise<SettingsActionResult> {
  const { business } = await requireBusinessContext();

  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { brandColor, logoUrl } = parsed.data;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      ...(brandColor !== undefined && { brandColor }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
    },
  });

  revalidateBusiness(business.id);
  return { ok: true };
}

export async function updateProfile(input: {
  name: string;
  slug: string;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
  address?: string | null;
  signatureUrl?: string | null;
}): Promise<SettingsActionResult> {
  const { business } = await requireBusinessContext();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const d = parsed.data;

  try {
    await prisma.business.update({
      where: { id: business.id },
      data: {
        name: d.name,
        slug: d.slug,
        phone: d.phone || null,
        email: d.email || null,
        taxId: d.taxId || null,
        address: d.address || null,
        signatureUrl: d.signatureUrl || null,
      },
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return { ok: false, error: "That URL slug is already taken" };
    }
    throw err;
  }

  revalidateBusiness(business.id);
  return { ok: true };
}

export async function updateDefaults(input: {
  defaultCurrency: string;
  defaultTaxRate: number;
  numberFormat: string;
}): Promise<SettingsActionResult> {
  const { business } = await requireBusinessContext();

  const parsed = defaultsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const d = parsed.data;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      defaultCurrency: d.defaultCurrency,
      defaultTaxRate: d.defaultTaxRate.toString(),
      numberFormat: d.numberFormat,
    },
  });

  revalidateBusiness(business.id);
  return { ok: true };
}

const paymentDetailsSchema = z
  .object({
    bankName: z.string().trim().max(80),
    bankAccountName: z.string().trim().max(120),
    // NUBAN (10 digits) or longer international formats (IBAN up to 34).
    bankAccountNumber: z
      .string()
      .trim()
      .regex(/^$|^[A-Za-z0-9 -]{6,34}$/, "Account number should be 6 to 34 letters or digits"),
  })
  .strict()
  .refine((d) => !d.bankAccountNumber || d.bankName, {
    message: "Add the bank name for this account",
  })
  .refine((d) => !d.bankName || d.bankAccountNumber, {
    message: "Add the account number",
  });

/** Bank details printed as "Pay to" on invoices. All empty clears them. */
export async function updatePaymentDetails(input: {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
}): Promise<SettingsActionResult> {
  const { business } = await requireBusinessContext();

  const parsed = paymentDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const d = parsed.data;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      bankName: d.bankName || null,
      bankAccountName: d.bankAccountName || null,
      bankAccountNumber: d.bankAccountNumber || null,
    },
  });

  revalidateBusiness(business.id);
  return { ok: true };
}
