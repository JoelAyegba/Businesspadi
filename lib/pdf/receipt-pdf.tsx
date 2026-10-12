/**
 * react-pdf component tree for a Receipt.
 *
 * Lives in lib/pdf/ (not components/) because react-pdf primitives are not
 * HTML — they share data shape with components/receipt/receipt-document.tsx
 * but not JSX. The shared contract is the input shape (PdfReceiptInput).
 */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

export type PdfReceiptInput = {
  number: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "VOID";
  issueDate: string; // YYYY-MM-DD
  paidAt: string | null;
  currency: string;
  taxRate: number;
  subtotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  client: { name: string; email: string | null } | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  business: {
    name: string;
    address: string | null;
    phone: string | null;
    taxId: string | null;
    logoUrl: string | null;
    brandColor: string;
  };
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0F172A",
    paddingTop: 0,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 36,
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#FFFFFF",
  },
  brandName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  headerMeta: { fontSize: 9, opacity: 0.85, marginTop: 4 },
  receiptLabel: { fontSize: 8, letterSpacing: 1.5, opacity: 0.8 },
  receiptNumber: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 2 },
  logo: { width: 56, height: 56, objectFit: "contain" },

  body: { paddingHorizontal: 36, paddingTop: 20 },

  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  col: { flexDirection: "column", maxWidth: "48%" },
  colRight: { flexDirection: "column", maxWidth: "48%", alignItems: "flex-end" },
  fieldLabel: {
    fontSize: 7.5,
    letterSpacing: 1,
    color: "#64748B",
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  fieldValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0F172A" },
  fieldSub: { fontSize: 9, color: "#64748B", marginTop: 2 },

  table: { marginTop: 8 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingBottom: 6,
    marginBottom: 4,
  },
  th: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    letterSpacing: 1,
  },
  thDesc: { flex: 4 },
  thQty: { flex: 1, textAlign: "right" },
  thUnit: { flex: 1.5, textAlign: "right" },
  thAmt: { flex: 1.5, textAlign: "right" },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  cell: { fontSize: 10 },
  cellDesc: { flex: 4 },
  cellQty: { flex: 1, textAlign: "right", color: "#475569" },
  cellUnit: { flex: 1.5, textAlign: "right", color: "#475569" },
  cellAmt: { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold" },

  totals: {
    marginTop: 16,
    marginLeft: "auto",
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: { color: "#64748B" },
  totalValue: { fontFamily: "Helvetica-Bold" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: "#0F172A",
  },
  grandTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 13, fontFamily: "Helvetica-Bold" },

  notes: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
  },

  footer: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#94A3B8",
  },
});

function statusLabel(status: PdfReceiptInput["status"], paidAt: string | null) {
  if (status === "PAID" && paidAt) return `Paid · ${formatDate(paidAt)}`;
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function ReceiptPdfDocument({ data }: { data: PdfReceiptInput }) {
  const { business } = data;
  return (
    <Document
      title={`Receipt ${data.number}`}
      author={business.name}
      subject={`Receipt ${data.number} from ${business.name}`}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={[styles.header, { backgroundColor: business.brandColor }]} fixed>
          <View>
            <Text style={styles.brandName}>{business.name}</Text>
            <Text style={styles.headerMeta}>Issued {formatDate(data.issueDate)}</Text>
            {business.address && <Text style={styles.headerMeta}>{business.address}</Text>}
            {(business.phone || business.taxId) && (
              <Text style={styles.headerMeta}>
                {[business.phone, business.taxId && `Tax ID ${business.taxId}`]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not HTML img */}
            {business.logoUrl && <Image style={styles.logo} src={business.logoUrl} />}
            <Text style={[styles.receiptLabel, { marginTop: business.logoUrl ? 6 : 0 }]}>
              RECEIPT
            </Text>
            <Text style={styles.receiptNumber}>{data.number}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>BILLED TO</Text>
              <Text style={styles.fieldValue}>{data.client?.name ?? "Walk-in customer"}</Text>
              {data.client?.email && <Text style={styles.fieldSub}>{data.client.email}</Text>}
            </View>
            <View style={styles.colRight}>
              <Text style={styles.fieldLabel}>STATUS</Text>
              <Text style={styles.fieldValue}>{statusLabel(data.status, data.paidAt)}</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHead} fixed>
              <Text style={[styles.th, styles.thDesc]}>DESCRIPTION</Text>
              <Text style={[styles.th, styles.thQty]}>QTY</Text>
              <Text style={[styles.th, styles.thUnit]}>UNIT PRICE</Text>
              <Text style={[styles.th, styles.thAmt]}>AMOUNT</Text>
            </View>
            {data.lineItems.map((li, i) => (
              <View key={i} style={styles.row} wrap={false}>
                <Text style={[styles.cell, styles.cellDesc]}>{li.description}</Text>
                <Text style={[styles.cell, styles.cellQty]}>{li.quantity}</Text>
                <Text style={[styles.cell, styles.cellUnit]}>
                  {formatMoney(li.unitPrice, data.currency)}
                </Text>
                <Text style={[styles.cell, styles.cellAmt]}>
                  {formatMoney(li.subtotal, data.currency)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatMoney(data.subtotal, data.currency)}</Text>
            </View>
            {data.taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({data.taxRate}%)</Text>
                <Text style={styles.totalValue}>{formatMoney(data.taxTotal, data.currency)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatMoney(data.total, data.currency)}</Text>
            </View>
          </View>

          {data.notes && <Text style={styles.notes}>{data.notes}</Text>}
        </View>

        <View style={styles.footer} fixed>
          <Text>Thank you for your business · {business.name}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ""
            }
          />
        </View>
      </Page>
    </Document>
  );
}
