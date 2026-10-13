/**
 * Editorial — typography does the work: a large serif title, hairline rules,
 * generous whitespace, no filled blocks. A single short accent rule.
 * Templates: Minimal, Lavender.
 */
import { cn } from "@/lib/utils";
import type { DocModel } from "@/lib/document-model";
import {
  BilledTo,
  ContactLines,
  DocFooter,
  DocFrame,
  ItemsTable,
  Label,
  Logo,
  MetaList,
  StatusChip,
  SummaryRow,
  headingFont,
} from "./parts";

export function EditorialLayout({ model }: { model: DocModel }) {
  const h = headingFont(model);
  return (
    <DocFrame model={model}>
      <div className="p-7 @md:p-12">
        <header className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{model.business.name}</p>
            <ContactLines lines={model.business.contact} className="text-xs text-doc-muted" />
          </div>
          <Logo model={model} className="h-10" />
        </header>

        <div className="mt-12 @md:mt-16">
          <h1
            className={cn("text-5xl font-semibold leading-[1.05] tracking-tight @md:text-6xl", h)}
          >
            {model.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-doc-mono text-sm text-doc-muted">{model.number}</span>
            <StatusChip model={model} />
          </div>
          <div className="mt-6 h-0.5 w-12 bg-doc-accent" />
        </div>

        <div className="mt-10 grid gap-8 @lg:grid-cols-3">
          <BilledTo model={model} />
          <MetaList model={model} className="self-start" />
          <div className="@lg:text-right">
            <Label>{model.total.label}</Label>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-doc-accent">
              {model.total.value}
            </p>
          </div>
        </div>

        <ItemsTable model={model} variant="minimal" className="mt-12" />
        <SummaryRow model={model} boxed={false} className="mt-8" />
        <DocFooter model={model} className="mt-12" />
      </div>
    </DocFrame>
  );
}
