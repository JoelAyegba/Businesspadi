/**
 * react-pdf document for a receipt or invoice.
 *
 * Takes the same DocModel as the web document (lib/document-model.ts) and
 * renders the template's layout family from lib/pdf/layouts — the paper twin
 * of components/receipt/layouts.
 */
import { Document } from "@react-pdf/renderer";
import type { DocModel } from "@/lib/document-model";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { BannerPdf, EditorialPdf, LetterheadPdf, SidebarPdf } from "./layouts";

export function ReceiptPdfDocument({ model }: { model: DocModel }) {
  registerPdfFonts();
  const title = `${model.title} ${model.number}`;
  return (
    <Document
      title={title}
      author={model.business.name}
      creator="Businesspadi"
      producer="Businesspadi"
    >
      {model.template.layout === "banner" ? (
        <BannerPdf model={model} />
      ) : model.template.layout === "editorial" ? (
        <EditorialPdf model={model} />
      ) : model.template.layout === "sidebar" ? (
        <SidebarPdf model={model} />
      ) : (
        <LetterheadPdf model={model} />
      )}
    </Document>
  );
}
