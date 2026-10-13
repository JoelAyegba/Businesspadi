/**
 * Building blocks shared by the four document layouts.
 *
 * Styling rules (mirrored in lib/pdf/layouts):
 * - Colours come only from the template palette (`doc-*` Tailwind colours →
 *   CSS variables set on <DocFrame>). Documents are paper: no `dark:` here.
 * - Money is always sans + tabular figures (heading fonts lack ₦).
 * - Responsive by CONTAINER width (`@md:` etc.), not viewport — the same
 *   document renders in the narrow builder preview and the wide detail page.
 */
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DocModel } from "@/lib/document-model";
import type { DocPalette } from "@/lib/templates";

export function paletteVars(p: DocPalette): CSSProperties {
  return {
    "--doc-paper": p.paper,
    "--doc-ink": p.ink,
    "--doc-muted": p.muted,
    "--doc-line": p.line,
    "--doc-accent": p.accent,
    "--doc-accent-soft": p.accentSoft,
    "--doc-accent-ink": p.accentInk,
    "--doc-band": p.band,
    "--doc-band-ink": p.bandInk,
    "--doc-band-muted": p.bandMuted,
    "--doc-band-accent": p.bandAccent,
    "--doc-paid": p.paid,
    "--doc-void": p.void,
  } as CSSProperties;
}

/** Tailwind class for the template's heading font. */
export function headingFont(model: DocModel): string {
  if (model.template.font === "serif") return "font-doc-serif";
  if (model.template.font === "mono") return "font-doc-mono";
  return "";
}

export function DocFrame({ model, children }: { model: DocModel; children: ReactNode }) {
  return (
    <article
      aria-label={`${model.title} ${model.number}`}
      style={paletteVars(model.palette)}
      className="relative overflow-hidden rounded-2xl bg-doc-paper font-sans text-doc-ink antialiased shadow-[0_1px_2px_rgba(15,23,42,0.06),0_16px_40px_-16px_rgba(15,23,42,0.22)] ring-1 ring-black/5 @container print:rounded-none print:shadow-none print:ring-0"
    >
      {children}
    </article>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.12em] text-doc-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Logo({
  model,
  onBand = false,
  className,
}: {
  model: DocModel;
  onBand?: boolean;
  className?: string;
}) {
  if (!model.business.logoUrl) return null;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- data URLs / arbitrary hosts; next/image adds nothing here
    <img
      src={model.business.logoUrl}
      alt={model.business.name}
      className={cn("h-11 w-auto max-w-[160px] object-contain", className)}
    />
  );
  // Logos are designed for white backgrounds; give them a white tile on a band.
  return onBand ? <div className="inline-flex shrink-0 rounded-lg bg-white p-1.5">{img}</div> : img;
}

export function ContactLines({ lines, className }: { lines: string[]; className?: string }) {
  if (!lines.length) return null;
  return (
    <div className={cn("mt-1 space-y-0.5 text-sm leading-snug", className)}>
      {lines.map((l) => (
        <p key={l} className="break-words">
          {l}
        </p>
      ))}
    </div>
  );
}

export function StatusChip({ model, onBand = false }: { model: DocModel; onBand?: boolean }) {
  if (!model.statusLabel) return null;
  const unpaid = model.statusLabel === "Unpaid";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        onBand
          ? "border-doc-band-muted text-doc-band-ink"
          : unpaid
            ? "border-doc-accent text-doc-accent"
            : "border-doc-line text-doc-muted",
      )}
    >
      {model.statusLabel}
    </span>
  );
}

/** Rubber-stamp PAID / VOID mark. In normal flow so it never covers figures. */
export function Stamp({ model, className }: { model: DocModel; className?: string }) {
  if (!model.stamp) return null;
  const paid = model.stamp === "PAID";
  return (
    <div
      role="img"
      aria-label={paid ? "Paid" : "Void"}
      className={cn(
        "pointer-events-none inline-block -rotate-[8deg] select-none rounded-md border-[5px] border-double px-4 py-1 text-2xl font-extrabold uppercase tracking-[0.3em] opacity-80",
        paid ? "border-doc-paid text-doc-paid" : "border-doc-void text-doc-void",
        className,
      )}
    >
      {paid ? "Paid" : "Void"}
    </div>
  );
}

export function MetaList({
  model,
  onBand = false,
  className,
}: {
  model: DocModel;
  onBand?: boolean;
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm", className)}>
      {model.meta.map((row) => (
        <div key={row.label} className="contents">
          <dt className={onBand ? "text-doc-band-muted" : "text-doc-muted"}>{row.label}</dt>
          <dd className="font-medium tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BilledTo({ model, onBand = false }: { model: DocModel; onBand?: boolean }) {
  return (
    <div className="min-w-0">
      <Label className={onBand ? "text-doc-band-accent" : undefined}>Billed to</Label>
      <p className="mt-1.5 font-semibold">{model.client.name}</p>
      <ContactLines
        lines={model.client.contact}
        className={onBand ? "text-doc-band-muted" : "text-doc-muted"}
      />
    </div>
  );
}

type TableVariant = "filled" | "ruled" | "minimal";

export function ItemsTable({
  model,
  variant,
  className,
}: {
  model: DocModel;
  variant: TableVariant;
  className?: string;
}) {
  const headCell = "py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]";
  return (
    <section className={className} aria-label="Line items">
      {/* Narrow: stacked rows */}
      <ul className="divide-y divide-doc-line border-y border-doc-line @lg:hidden">
        {model.items.map((it, i) => (
          <li key={i} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="break-words font-medium">{it.description}</p>
              <p className="mt-0.5 text-xs tabular-nums text-doc-muted">
                {it.quantity} × {it.unitPrice}
              </p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums">{it.amount}</p>
          </li>
        ))}
      </ul>

      {/* Wide: table */}
      <table className="hidden w-full text-sm @lg:table">
        <thead
          className={cn(
            variant === "filled" && "bg-doc-accent-soft text-doc-accent",
            variant === "ruled" && "border-b-2 border-doc-ink text-doc-ink",
            variant === "minimal" && "border-b border-doc-line text-doc-muted",
          )}
        >
          <tr>
            <th
              scope="col"
              className={cn(headCell, "pl-3 text-left", variant !== "filled" && "pl-0")}
            >
              Description
            </th>
            {/* Numeric columns shrink to content so the description gets the room. */}
            <th scope="col" className={cn(headCell, "w-px whitespace-nowrap pl-4 text-right")}>
              Qty
            </th>
            <th scope="col" className={cn(headCell, "w-px whitespace-nowrap pl-6 text-right")}>
              Unit price
            </th>
            <th
              scope="col"
              className={cn(
                headCell,
                "w-px whitespace-nowrap pl-6 pr-3 text-right",
                variant !== "filled" && "pr-0",
              )}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-doc-line border-b border-doc-line">
          {model.items.map((it, i) => (
            <tr key={i} className="align-top">
              <td
                className={cn(
                  "break-words py-3.5 font-medium",
                  variant === "filled" ? "pl-3" : "pl-0",
                )}
              >
                {it.description}
              </td>
              <td className="whitespace-nowrap py-3.5 pl-4 text-right tabular-nums text-doc-muted">
                {it.quantity}
              </td>
              <td className="whitespace-nowrap py-3.5 pl-6 text-right tabular-nums text-doc-muted">
                {it.unitPrice}
              </td>
              <td
                className={cn(
                  "whitespace-nowrap py-3.5 pl-6 text-right font-semibold tabular-nums",
                  variant === "filled" ? "pr-3" : "pr-0",
                )}
              >
                {it.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function Totals({ model, boxed }: { model: DocModel; boxed: boolean }) {
  return (
    <div className={cn(boxed && "rounded-xl bg-doc-accent-soft p-5")}>
      <dl className="space-y-2 text-sm">
        {model.breakdown.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-doc-muted">{row.label}</dt>
            <dd className="font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-doc-line pt-3">
        <span className="text-sm font-semibold">{model.total.label}</span>
        <span className="text-2xl font-bold tabular-nums tracking-tight text-doc-accent">
          {model.total.value}
        </span>
      </div>
      <p className="mt-2 text-right text-xs leading-relaxed text-doc-muted">
        {model.amountInWords}
      </p>
    </div>
  );
}

export function Notes({ model }: { model: DocModel }) {
  if (!model.notes) return null;
  return (
    <div>
      <Label>Notes</Label>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{model.notes}</p>
    </div>
  );
}

export function PayTo({ model, onBand = false }: { model: DocModel; onBand?: boolean }) {
  if (!model.payTo) return null;
  const { bankName, accountName, accountNumber } = model.payTo;
  return (
    <div className={cn(!onBand && "rounded-xl border border-doc-line p-4")}>
      <Label className={onBand ? "text-doc-band-accent" : undefined}>Pay to</Label>
      <p className="mt-1.5 font-semibold">{bankName}</p>
      {accountName && (
        <p className={cn("text-sm", onBand ? "text-doc-band-muted" : "text-doc-muted")}>
          {accountName}
        </p>
      )}
      <p className="mt-1 font-doc-mono text-base font-bold tracking-wider">{accountNumber}</p>
    </div>
  );
}

/** Notes + pay-to + stamp on the left, totals on the right (stacked when narrow). */
export function SummaryRow({
  model,
  boxed,
  showPayTo = true,
  className,
}: {
  model: DocModel;
  boxed: boolean;
  showPayTo?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-8 @lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] @lg:items-start",
        className,
      )}
    >
      <div className="order-2 space-y-5 @lg:order-1">
        <Stamp model={model} className="mt-2" />
        <Notes model={model} />
        {showPayTo && <PayTo model={model} />}
      </div>
      <div className="order-1 @lg:order-2">
        <Totals model={model} boxed={boxed} />
      </div>
    </div>
  );
}

export function DocFooter({
  model,
  className,
  showTaxId = true,
}: {
  model: DocModel;
  className?: string;
  showTaxId?: boolean;
}) {
  return (
    <footer
      className={cn(
        "flex flex-col gap-6 border-t border-doc-line pt-6 @lg:flex-row @lg:items-end @lg:justify-between",
        className,
      )}
    >
      <div className="space-y-1 text-xs text-doc-muted">
        <p>{model.footer}</p>
        {showTaxId && model.business.taxId && <p>Tax ID {model.business.taxId}</p>}
      </div>
      {model.business.signatureUrl && (
        <div className="w-44">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL signature */}
          <img
            src={model.business.signatureUrl}
            alt="Authorised signature"
            className={cn(
              "h-12 w-auto object-contain",
              model.darkPaper ? "invert" : "mix-blend-multiply",
            )}
          />
          <p className="mt-1 border-t border-doc-line pt-1 text-[11px] text-doc-muted">
            Authorised signature
          </p>
        </div>
      )}
    </footer>
  );
}
