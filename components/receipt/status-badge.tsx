import { Badge } from "@/components/ui/badge";
import type { DocumentType, ReceiptStatus } from "@/lib/mock";

/**
 * Status badge — color-coded pills for receipt states.
 *
 * Design:
 * - DRAFT: neutral gray — not yet finalized
 * - ISSUED: blue (primary) — sent/awaiting payment
 * - PAID: green — successfully collected
 * - VOID: red — cancelled/voided
 */
const config: Record<
  ReceiptStatus,
  { label: string; variant: "success" | "warning" | "muted" | "destructive" | "default" }
> = {
  PAID: { label: "Paid", variant: "success" },
  ISSUED: { label: "Issued", variant: "default" },
  DRAFT: { label: "Draft", variant: "muted" },
  VOID: { label: "Void", variant: "destructive" },
};

export function StatusBadge({
  status,
  documentType = "RECEIPT",
}: {
  status: ReceiptStatus;
  documentType?: DocumentType;
}) {
  const c = config[status];
  // An issued invoice reads as "Unpaid" (awaiting payment) rather than "Issued".
  const label = documentType === "INVOICE" && status === "ISSUED" ? "Unpaid" : c.label;
  return <Badge variant={c.variant}>{label}</Badge>;
}
