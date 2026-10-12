import { notFound, redirect } from "next/navigation";
import { ReceiptBuilder } from "@/components/receipt/receipt-builder";
import { requireBusinessContext } from "@/lib/auth";
import { listClients } from "@/lib/queries/clients";
import { getInvoice } from "@/lib/queries/invoices";
import { listActiveProducts } from "@/lib/queries/products";
import { prisma } from "@/lib/db";
import type { MockBusiness } from "@/lib/mock";

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const { business } = await requireBusinessContext();

  const [invoice, clients, products, biz] = await Promise.all([
    getInvoice(business.id, params.id),
    listClients(business.id),
    listActiveProducts(business.id),
    prisma.business.findUniqueOrThrow({ where: { id: business.id } }),
  ]);

  if (!invoice) {
    notFound();
  }

  // Only drafts can be edited.
  if (invoice.status !== "DRAFT") {
    redirect(`/app/invoices/${invoice.id}`);
  }

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
      defaultClientId={invoice.clientId ?? null}
      initialReceipt={invoice}
      documentType="INVOICE"
    />
  );
}
