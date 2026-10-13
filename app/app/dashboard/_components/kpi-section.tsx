import { Wallet, Clock, FileText, FileClock } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getDocumentKpis } from "@/lib/queries/kpis";
import { formatMoney } from "@/lib/utils";

export async function KpiSection({ businessId, currency }: { businessId: string; currency: string }) {
  const { receipts: kpis, invoices: invoiceKpis } = await getDocumentKpis(businessId, currency);

  return (
    <section
      aria-label="Key metrics"
      className="animate-fade-in-delay-1 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <KpiCard
        label="Total Revenue"
        value={formatMoney(kpis.revenue, kpis.currency)}
        hint="All issued receipts"
        icon={Wallet}
        tone="success"
      />
      <KpiCard
        label="Outstanding"
        value={formatMoney(invoiceKpis.outstanding, invoiceKpis.currency)}
        hint="Unpaid invoices"
        icon={Clock}
        tone="warning"
      />
      <KpiCard
        label="Receipts issued"
        value={String(kpis.receiptsIssued)}
        hint={`${kpis.draftCount} draft${kpis.draftCount === 1 ? "" : "s"}`}
        icon={FileText}
      />
      <KpiCard
        label="Unpaid invoices"
        value={String(invoiceKpis.unpaidCount)}
        hint="Invoices awaiting payment"
        icon={FileClock}
      />
    </section>
  );
}
