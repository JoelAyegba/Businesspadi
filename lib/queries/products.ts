/**
 * Business-scoped product queries.
 * Same multi-tenant rule: every query filters by businessId.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function toNumber(d: Prisma.Decimal | number | null): number {
  if (d === null) return 0;
  if (typeof d === "number") return d;
  return d.toNumber();
}

export type ProductRow = {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  unitPrice: number;
  active: boolean;
  createdAt: string;
};

/**
 * List all active products for a business, ordered by name.
 * Used in the receipt/invoice builder product picker.
 */
export async function listActiveProducts(businessId: string): Promise<ProductRow[]> {
  const rows = await prisma.product.findMany({
    where: { businessId, active: true },
    orderBy: { name: "asc" },
  });
  return rows.map((p) => ({
    id: p.id,
    businessId: p.businessId,
    name: p.name,
    description: p.description,
    sku: p.sku,
    category: p.category,
    unitPrice: toNumber(p.unitPrice),
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  }));
}

/**
 * List all products (including inactive) for the products management page.
 */
export async function listAllProducts(businessId: string): Promise<ProductRow[]> {
  const rows = await prisma.product.findMany({
    where: { businessId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return rows.map((p) => ({
    id: p.id,
    businessId: p.businessId,
    name: p.name,
    description: p.description,
    sku: p.sku,
    category: p.category,
    unitPrice: toNumber(p.unitPrice),
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  }));
}

/**
 * Get distinct categories for a business's products.
 */
export async function listProductCategories(businessId: string): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { businessId, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category).filter(Boolean) as string[];
}
