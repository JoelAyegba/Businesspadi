import type { MockReceipt, MockBusiness } from "@/lib/mock";
import { buildDocModel } from "@/lib/document-model";
import { BannerLayout } from "./layouts/banner";
import { EditorialLayout } from "./layouts/editorial";
import { LetterheadLayout } from "./layouts/letterhead";
import { SidebarLayout } from "./layouts/sidebar";

/**
 * Receipt / invoice document — the artifact customers see.
 *
 * WHAT it says comes from buildDocModel (shared with the PDF); HOW it looks
 * comes from the template's layout family (lib/templates.ts). The PDF mirrors
 * these layouts in lib/pdf/layouts — change both together.
 */
export function ReceiptDocument({
  receipt,
  business,
  templateId,
}: {
  receipt: MockReceipt;
  business: MockBusiness;
  templateId?: string;
}) {
  const model = buildDocModel(receipt, business, templateId);
  switch (model.template.layout) {
    case "banner":
      return <BannerLayout model={model} />;
    case "editorial":
      return <EditorialLayout model={model} />;
    case "sidebar":
      return <SidebarLayout model={model} />;
    case "letterhead":
    default:
      return <LetterheadLayout model={model} />;
  }
}
