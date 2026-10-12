import { formatMoney, hexToHsl } from "@/lib/utils";
import { getTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import type { MockReceipt, MockBusiness } from "@/lib/mock";

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Receipt Document — the visual receipt/invoice artifact.
 *
 * Now template-aware: accepts a templateId prop and renders
 * using the corresponding template's styling tokens.
 * Mobile-first: card layout for line items on small screens,
 * table layout on sm+ breakpoints.
 */
export function ReceiptDocument({
  receipt,
  business,
  templateId = DEFAULT_TEMPLATE_ID,
}: {
  receipt: MockReceipt;
  business: MockBusiness;
  templateId?: string;
}) {
  const isInvoice = receipt.documentType === "INVOICE";
  const docLabel = isInvoice ? "Invoice" : "Receipt";
  const primaryHsl = business.brandColor ? hexToHsl(business.brandColor) : undefined;
  const t = getTemplate(templateId).styles;

  return (
    <article
      className={`overflow-hidden rounded-3xl border shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] ${t.wrapper}`}
      aria-label={`${docLabel} ${receipt.number}`}
      style={primaryHsl ? { "--primary": primaryHsl } as React.CSSProperties : undefined}
    >
      {/* ─── Accent Line ─────────────────────────────────────────── */}
      <div className={`h-1.5 w-full ${t.accentBar}`} />

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className={`${t.headerBg} relative`}>
        {/* 'Issued' Label at Top Right */}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-5 flex justify-end">
          <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-80 ${t.headerMeta}`}>
            Issued {dateFmt.format(new Date(receipt.issueDate))}
          </p>
        </div>

        {/* Logo (Top Center) */}
        {business.logoUrl ? (
          <div className="flex justify-center w-full mb-6">
            <div className="flex h-12 w-fit max-w-[120px] sm:h-16 sm:max-w-[200px] shrink-0 items-center justify-center rounded-xl bg-white p-2 sm:p-2.5 shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] ring-1 ring-slate-900/5">
              <img src={business.logoUrl} alt={business.name} className="h-full w-auto object-contain" />
            </div>
          </div>
        ) : null}

        <div className="flex flex-row items-start justify-between gap-3 sm:gap-4 relative sm:pt-0 pt-2">

          {/* Business Info (Left half) */}
          <div className="flex-1 flex flex-col items-start text-left min-w-0 break-words">
            <h1 className={`text-lg font-extrabold tracking-tight sm:text-2xl min-w-0 break-words ${t.headerTitle}`}>
              {business.name}
            </h1>
            {(business.email || business.phone || business.address || business.taxId) && (
              <div className={`mt-1.5 flex flex-col items-start gap-0.5 text-[10px] sm:text-sm font-medium opacity-90 ${t.headerMeta}`}>
                {business.address && <p>{business.address}</p>}
                {business.email && <p className="break-all">{business.email}</p>}
                {business.phone && <p>{business.phone}</p>}
                {business.taxId && <p>Tax ID: {business.taxId}</p>}
              </div>
            )}
          </div>

          {/* Receipt Info (Right half) */}
          <div className="flex-1 flex flex-col items-end text-right min-w-0 break-words">
            {!(!isInvoice && (receipt.status === "PAID" || receipt.status === "ISSUED")) && (
              <div className="mb-2 sm:mb-3">
                <span className={t.badge(receipt.status, isInvoice)}>
                  {receipt.status === "PAID" && receipt.paidAt
                    ? "Paid"
                    : isInvoice && receipt.status === "ISSUED"
                      ? "Unpaid"
                      : receipt.status.charAt(0) + receipt.status.slice(1).toLowerCase()}
                </span>
              </div>
            )}
            <div className="flex flex-col items-end gap-1">
              <h2 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${t.headerMeta}`}>
                {docLabel}
              </h2>
              <p className={`font-mono text-xs sm:text-base font-bold ${t.headerTitle}`}>
                {receipt.number}
              </p>
            </div>
          </div>

        </div>
      </header>

      {/* ─── Billing Details ────────────────────────────────────── */}
      <section className={`flex flex-col sm:flex-row gap-6 sm:items-start sm:justify-between border-t px-6 py-5 sm:py-6 ${t.sectionBorder}`}>
        <div className="flex flex-col gap-1">
          <h3 className={`text-[10px] font-bold uppercase tracking-widest ${t.sectionLabel}`}>Billed To</h3>
          <p className={`font-semibold ${t.sectionValue}`}>
            {receipt.client?.name ?? "Walk-in customer"}
          </p>
          {receipt.client?.email && (
            <p className={`text-sm ${t.lineItemMeta}`}>{receipt.client.email}</p>
          )}
          {receipt.client?.phone && (
            <p className={`text-sm ${t.lineItemMeta}`}>{receipt.client.phone}</p>
          )}
        </div>
        {isInvoice && receipt.dueDate && (
          <div className="flex flex-col gap-1 sm:items-end sm:text-right">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest ${t.sectionLabel}`}>Due Date</h3>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {dateFmt.format(new Date(receipt.dueDate))}
            </p>
          </div>
        )}
      </section>

      {/* ─── Line Items ─────────────────────────────────────────── */}
      <section className={`px-6 py-5 sm:py-6 border-t ${t.sectionBorder}`}>
        <h2 className="sr-only">Line items</h2>

        {/* Mobile card layout */}
        <ul className="flex flex-col gap-2.5 sm:hidden">
          {receipt.lineItems.map((li) => (
            <li key={li.id} className={`flex flex-col gap-1.5 rounded-xl p-3.5 border ${t.lineItemCard}`}>
              <p className={`font-semibold text-sm break-words ${t.lineItemTitle}`}>{li.description}</p>
              <div className="flex items-center justify-between text-xs gap-4">
                <span className={`tabular-nums break-words shrink block ${t.lineItemMeta}`}>
                  {li.quantity} × {formatMoney(li.unitPrice, receipt.currency)}
                </span>
                <span className={`font-bold tabular-nums break-all shrink-0 text-right ${t.lineItemAmount}`}>
                  {formatMoney(li.subtotal, receipt.currency)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop table layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b text-[10px] font-bold uppercase tracking-widest ${t.tableHeader}`}>
                <th scope="col" className="pb-3 text-left">Description</th>
                <th scope="col" className="pb-3 text-right pl-4">Qty</th>
                <th scope="col" className="pb-3 text-right pl-4">Price</th>
                <th scope="col" className="pb-3 text-right pl-4">Amount</th>
              </tr>
            </thead>
            <tbody className={t.tableDivider}>
              {receipt.lineItems.map((li) => (
                <tr key={li.id}>
                  <td className={`py-3 font-semibold break-words max-w-[200px] ${t.tableRow}`}>{li.description}</td>
                  <td className={`py-3 text-right tabular-nums break-words pl-4 ${t.lineItemMeta}`}>{li.quantity}</td>
                  <td className={`py-3 text-right tabular-nums break-all pl-4 ${t.lineItemMeta}`}>
                    {formatMoney(li.unitPrice, receipt.currency)}
                  </td>
                  <td className={`py-3 text-right font-bold tabular-nums break-all pl-4 ${t.lineItemAmount}`}>
                    {formatMoney(li.subtotal, receipt.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <dl className="mt-6 ml-auto flex flex-col gap-2 text-sm sm:w-auto sm:min-w-[280px] sm:max-w-md">
          <div className="flex items-start justify-between gap-4">
            <dt className={`shrink-0 ${t.totalLabel}`}>Subtotal</dt>
            <dd className={`font-semibold tabular-nums break-all text-right ${t.totalValue}`}>{formatMoney(receipt.subtotal, receipt.currency)}</dd>
          </div>
          {receipt.taxRate > 0 && (
            <div className="flex items-start justify-between gap-4">
              <dt className={`shrink-0 ${t.totalLabel}`}>Tax ({receipt.taxRate}%)</dt>
              <dd className={`font-semibold tabular-nums break-all text-right ${t.totalValue}`}>{formatMoney(receipt.taxTotal, receipt.currency)}</dd>
            </div>
          )}
          <div className={`mt-2 flex items-start justify-between border-t gap-4 pt-4 ${t.totalBorder}`}>
            <dt className={`text-xs font-bold uppercase tracking-widest shrink-0 mt-1 ${t.totalLabel}`}>Total</dt>
            <dd className={`text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl break-all text-right ${t.totalValue}`}>
              {formatMoney(receipt.total, receipt.currency)}
            </dd>
          </div>
        </dl>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className={`border-t px-6 py-5 text-center flex flex-col items-center gap-4 ${t.footerBg}`}>
        {business.signatureUrl && (
          <div className="flex flex-col items-center gap-1">
            <img src={business.signatureUrl} alt="Authorized Signature" className="h-12 w-auto object-contain dark:invert mix-blend-multiply dark:mix-blend-normal" />
            <span className={`text-[10px] uppercase tracking-widest opacity-60 ${t.headerMeta}`}>Authorized Signature</span>
          </div>
        )}
        <p className={`text-sm font-medium ${t.footerText}`}>
          Thank you for your business.
        </p>
      </footer>
    </article>
  );
}
