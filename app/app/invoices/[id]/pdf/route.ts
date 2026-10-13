import { requireBusinessContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderReceiptPdf, pdfFilename } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Invoice PDF download — mirrors app/app/receipts/[id]/pdf. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { business } = await requireBusinessContext();

  const invoice = await prisma.receipt.findFirst({
    where: { id: params.id, businessId: business.id, documentType: "INVOICE" },
    select: { id: true, number: true },
  });
  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = await renderReceiptPdf({
    receiptId: invoice.id,
    businessId: business.id,
    documentType: "INVOICE",
  });
  const filename = pdfFilename(business.slug, invoice.number);

  return new Response(Buffer.from(bytes) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
