/**
 * Banner — a full-width colour band that leads with the amount, the thing a
 * customer looks for first. Clean white body below.
 * Templates: Modern, Sunset, Ocean, Forest.
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

export function BannerLayout({ model }: { model: DocModel }) {
  const h = headingFont(model);
  return (
    <DocFrame model={model}>
      <header className="bg-doc-band px-6 py-7 text-doc-band-ink @md:px-10 @md:py-9">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-3">
            <Logo model={model} onBand className="h-9" />
            <div className="min-w-0">
              <p className={cn("text-base font-semibold leading-tight", h)}>
                {model.business.name}
              </p>
              <ContactLines
                lines={model.business.contact}
                className="text-xs text-doc-band-muted"
              />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-doc-band-accent">
              {model.title}
            </p>
            <p className="mt-1 font-doc-mono text-sm">{model.number}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 @lg:flex-row @lg:items-end @lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-doc-band-muted">{model.total.label}</p>
            <p className="mt-1 break-words text-4xl font-semibold tabular-nums tracking-tight @xl:text-5xl">
              {model.total.value}
            </p>
          </div>
          <MetaList model={model} onBand className="self-start @lg:self-end" />
        </div>
      </header>

      <div className="p-6 @md:p-10">
        <div className="flex items-start justify-between gap-4">
          <BilledTo model={model} />
          <StatusChip model={model} />
        </div>

        <ItemsTable model={model} variant="ruled" className="mt-8" />
        <SummaryRow model={model} boxed={false} className="mt-8" />
        <DocFooter model={model} className="mt-10" />
      </div>
    </DocFrame>
  );
}
