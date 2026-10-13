import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { ReceiptDocument } from "@/components/receipt/receipt-document";
import { getPublicReceipt } from "@/lib/queries/public-receipt";
import { formatMoney } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: { shareId: string };
}): Promise<Metadata> {
  const data = await getPublicReceipt(params.shareId);
  if (!data) return { title: "Receipt not found" };
  const { receipt, business } = data;
  const title = `Receipt ${receipt.number} · ${business.name}`;
  const description = `${formatMoney(receipt.total, receipt.currency)} · ${receipt.client?.name ?? "Walk-in customer"}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
    robots: { index: false, follow: false },
  };
}

export default async function PublicReceiptPage({ params }: { params: { shareId: string } }) {
  const data = await getPublicReceipt(params.shareId);
  if (!data) notFound();
  const { receipt, business } = data;

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:py-10">
        <header className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Shared by {business.name}</span>
          <span className="font-mono">{receipt.number}</span>
        </header>
        <ReceiptDocument receipt={receipt} business={business} templateId={receipt.templateId} />
        <div className="flex justify-center">
          <a
            href={`/r/${params.shareId}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-secondary"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
        <footer className="pt-2 text-center text-xs text-muted-foreground">
          Powered by <span className="font-medium text-foreground">Businesspadi</span>
        </footer>
      </div>
    </main>
  );
}
