/**
 * Public PDF download for shared receipts (Phase 4 §8.2).
 *
 * Auth model: the opaque shareId IS the access token. We never accept
 * `businessId` from the caller — it's resolved internally. Voided receipts
 * are 404, matching the public page behavior.
 */
import { prisma } from "@/lib/db";
import { renderReceiptPdf, pdfFilename } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { shareId: string } },
) {
  const r = await prisma.receipt.findUnique({
    where: { shareId: params.shareId },
    select: {
      id: true,
      businessId: true,
      number: true,
      status: true,
      business: { select: { slug: true } },
    },
  });
  if (!r || r.status === "VOID") {
    return new Response("Not found", { status: 404 });
  }

  const bytes = await renderReceiptPdf({ receiptId: r.id, businessId: r.businessId });
  const filename = pdfFilename(r.business.slug, r.number);

  return new Response(Buffer.from(bytes) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      // Public link — short cache so re-issues / status changes propagate.
      "Cache-Control": "public, max-age=60, must-revalidate",
    },
  });
}
