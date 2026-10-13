/**
 * Letterhead — the traditional business document. Accent rule across the top,
 * identity left, document title right, tinted table header and totals box.
 * Templates: Classic (brand colour), Monochrome.
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
  StatusChip,
  SummaryRow,
  headingFont,
} from "./parts";

export function LetterheadLayout({ model }: { model: DocModel }) {
  const h = headingFont(model);
  return (
    <DocFrame model={model}>
      <div className="h-1.5 bg-doc-accent" />
      <div className="p-6 @md:p-10">
        <header className="flex flex-col gap-6 @lg:flex-row @lg:items-start @lg:justify-between">
          <div className="min-w-0 space-y-3">
            <Logo model={model} />
            <div>
              <p className={cn("text-lg font-semibold leading-tight", h)}>{model.business.name}</p>
              <ContactLines lines={model.business.contact} className="text-doc-muted" />
            </div>
          </div>
          <div className="space-y-1.5 @lg:text-right">
            <h1 className={cn("text-3xl font-semibold tracking-tight text-doc-accent", h)}>
              {model.title}
            </h1>
            <p className="font-doc-mono text-sm text-doc-muted">{model.number}</p>
            <StatusChip model={model} />
          </div>
        </header>

        <div className="mt-8 grid gap-6 border-y border-doc-line py-6 @lg:grid-cols-2">
          <BilledTo model={model} />
          <MetaList model={model} className="self-start @lg:justify-self-end" />
        </div>

        <ItemsTable model={model} variant="filled" className="mt-8" />
        <SummaryRow model={model} boxed className="mt-8" />
        <DocFooter model={model} className="mt-10" />
      </div>
    </DocFrame>
  );
}
