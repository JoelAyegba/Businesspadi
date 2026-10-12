import { ReceiptBuilder } from "@/components/receipt/receipt-builder";
import { requireBusinessContext } from "@/lib/auth";
import { listClients } from "@/lib/queries/clients";
import { listActiveProducts } from "@/lib/queries/products";
import { prisma } from "@/lib/db";
import type { MockBusiness } from "@/lib/mock";

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  const { business } = await requireBusinessContext();
  const [clients, products, biz] = await Promise.all([
    listClients(business.id),
    listActiveProducts(business.id),
    prisma.business.findUniqueOrThrow({ where: { id: business.id } }),
  ]);

  const businessView: MockBusiness = {
    id: biz.id,
    name: biz.name,
    slug: biz.slug,
    logoUrl: biz.logoUrl,
    brandColor: biz.brandColor ?? "#1B4F8A",
    defaultCurrency: biz.defaultCurrency,
    subscriptionStatus: biz.subscriptionStatus as MockBusiness["subscriptionStatus"],
    phone: biz.phone,
    email: biz.email,
    address: biz.address,
    taxId: biz.taxId,
    signatureUrl: biz.signatureUrl,
  };

  return (
    <ReceiptBuilder
      business={businessView}
      clients={clients}
      products={products}
      defaultClientId={searchParams.clientId ?? null}
    />
  );
}
