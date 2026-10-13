/**
 * Sidebar — a coloured side column carries who / when / how to pay, leaving
 * the main column for the title, line items and totals. Collapses to a top
 * panel when the document is narrow.
 * Templates: Executive, Neon.
 */
import { cn } from "@/lib/utils";
import type { DocModel } from "@/lib/document-model";
import {
  BilledTo,
  ContactLines,
  DocFooter,
  DocFrame,
  ItemsTable,
  Logo,
  MetaList,
  PayTo,
  StatusChip,
  SummaryRow,
  headingFont,
} from "./parts";

export function SidebarLayout({ model }: { model: DocModel }) {
  const h = headingFont(model);
  return (
    <DocFrame model={model}>
      <div className="grid @xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="space-y-8 bg-doc-band px-6 py-8 text-doc-band-ink @md:px-8">
          <div className="space-y-3">
            <Logo model={model} onBand className="h-9" />
            <div>
              <p className={cn("text-lg font-semibold leading-tight", h)}>{model.business.name}</p>
              <ContactLines
                lines={model.business.contact}
                className="text-xs text-doc-band-muted"
              />
            </div>
          </div>
          <BilledTo model={model} onBand />
          <MetaList model={model} onBand />
          <PayTo model={model} onBand />
          {model.business.taxId && (
            <p className="text-xs text-doc-band-muted">Tax ID {model.business.taxId}</p>
          )}
        </aside>

        {/* Own container: the table/totals respond to this column's width. */}
        <div className="min-w-0 p-6 @container @md:p-10">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className={cn("text-4xl font-semibold tracking-tight", h)}>{model.title}</h1>
              <p className="mt-1.5 font-doc-mono text-sm text-doc-muted">{model.number}</p>
            </div>
            <StatusChip model={model} />
          </header>

          <ItemsTable model={model} variant="ruled" className="mt-8" />
          <SummaryRow model={model} boxed showPayTo={false} className="mt-8" />
          <DocFooter model={model} showTaxId={false} className="mt-10" />
        </div>
      </div>
    </DocFrame>
  );
}
