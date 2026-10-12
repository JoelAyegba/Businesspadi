import { requireBusinessContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderReceiptPdf, pdfFilename } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { business } = await requireBusinessContext();

  const receipt = await prisma.receipt.findFirst({
    where: { id: params.id, businessId: business.id, documentType: "RECEIPT" },
    select: { id: true, number: true },
  });
  if (!receipt) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = await renderReceiptPdf({ receiptId: receipt.id, businessId: business.id });
  const filename = pdfFilename(business.slug, receipt.number);

  return new Response(Buffer.from(bytes) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
