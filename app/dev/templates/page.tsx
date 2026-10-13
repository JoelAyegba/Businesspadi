import { notFound } from "next/navigation";
import { ReceiptDocument } from "@/components/receipt/receipt-document";
import { sampleBusiness, sampleInvoice, sampleReceipt } from "@/lib/dev/sample-documents";
import { LAYOUT_LABELS, TEMPLATES } from "@/lib/templates";

/**
 * Dev-only gallery of every template with sample data, for design work and
 * screenshot checks. 404s in production; public in dev (middleware.ts).
 *
 * ?doc=invoice switches to the invoice; ?width=380 renders narrow (builder
 * preview width) to check the container-query layouts.
 */
export default function TemplatesGalleryPage({
  searchParams,
}: {
  searchParams: { doc?: string; width?: string; only?: string };
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const doc = searchParams.doc === "invoice" ? sampleInvoice : sampleReceipt;
  const width = Number(searchParams.width) || 760;
  const templates = searchParams.only
    ? TEMPLATES.filter((t) => t.id === searchParams.only)
    : TEMPLATES;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex flex-col items-center gap-14">
        {templates.map((t) => (
          <section key={t.id} id={t.id} className="w-full" style={{ maxWidth: width }}>
            <h2 className="mb-3 text-sm font-semibold text-slate-600">
              {t.name} <span className="font-normal text-slate-400">{LAYOUT_LABELS[t.layout]}</span>
            </h2>
            <ReceiptDocument receipt={doc} business={sampleBusiness} templateId={t.id} />
          </section>
        ))}
      </div>
    </main>
  );
}
