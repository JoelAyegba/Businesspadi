import { requireBusinessContext } from "@/lib/auth";
import { listAllProducts } from "@/lib/queries/products";
import { ProductsPageClient } from "@/components/products/products-page-client";

/**
 * Products catalog management page.
 *
 * Design decisions:
 * - Server component fetches products, delegates rendering to the client component
 * - Grid/list view with search and category filtering
 * - Inline editing via modal for quick updates
 * - Active/inactive toggle for soft-deletion
 */
export default async function ProductsPage() {
  const { business } = await requireBusinessContext();
  const products = await listAllProducts(business.id);
  const currency = business.defaultCurrency;

  return <ProductsPageClient initialProducts={products} currency={currency} />;
}
