"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireBusinessContext } from "@/lib/auth";
import { z } from "zod";
import { nanoid } from "nanoid";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(500).optional(),
  unitPrice: z.number().min(0, "Price must be 0 or more"),
});

export type ProductFormData = z.infer<typeof productSchema>;

export async function createProduct(data: ProductFormData) {
  const { business } = await requireBusinessContext();

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      sku: `PRD-${nanoid(6).toUpperCase()}`,
      category: null,
      unitPrice: parsed.data.unitPrice,
    },
  });

  revalidatePath("/app/products");
  revalidatePath("/app/receipts", "layout");
  revalidatePath("/app/invoices", "layout");

  return { ok: true as const, id: product.id };
}

export async function updateProduct(id: string, data: ProductFormData) {
  const { business } = await requireBusinessContext();

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  // Scope to businessId for tenant isolation
  await prisma.product.updateMany({
    where: { id, businessId: business.id },
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      unitPrice: parsed.data.unitPrice,
    },
  });

  revalidatePath("/app/products");
  revalidatePath("/app/receipts", "layout");
  revalidatePath("/app/invoices", "layout");

  return { ok: true as const };
}

export async function toggleProductActive(id: string, active: boolean) {
  const { business } = await requireBusinessContext();

  await prisma.product.updateMany({
    where: { id, businessId: business.id },
    data: { active },
  });

  revalidatePath("/app/products");
  revalidatePath("/app/receipts", "layout");
  revalidatePath("/app/invoices", "layout");

  return { ok: true as const };
}

export async function deleteProduct(id: string) {
  const { business } = await requireBusinessContext();

  await prisma.product.deleteMany({
    where: { id, businessId: business.id },
  });

  revalidatePath("/app/products");
  revalidatePath("/app/receipts", "layout");
  revalidatePath("/app/invoices", "layout");

  return { ok: true as const };
}
