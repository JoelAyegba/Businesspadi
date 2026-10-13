/**
 * react-pdf building blocks shared by the four PDF layouts — the paper twin
 * of components/receipt/layouts/parts.tsx. Same DocModel, same palette hex
 * values; change both together.
 *
 * react-pdf constraints that shape this file:
 * - Only registered faces exist (lib/pdf/fonts.ts): no italics.
 * - Money is always Inter (the heading fonts lack ₦).
 * - No WebP decoding: images that aren't PNG/JPEG are skipped, not fatal.
 * - No double borders: the stamp nests two bordered Views.
 */
import type { ReactNode } from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { DocModel } from "@/lib/document-model";
import { PDF_FONT } from "@/lib/pdf/fonts";

export const PAGE_PAD = 40;

export function headingFamily(model: DocModel): string {
  return PDF_FONT[model.template.font];
}

/** react-pdf decodes PNG/JPEG only; anything else would throw mid-render. */
export function pdfImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  if (/^data:image\/(png|jpe?g);base64,/i.test(src)) return src;
  if (/^https:\/\/.+\.(png|jpe?g)(\?.*)?$/i.test(src)) return src;
  return null;
}

export const label = (color: string): Style => ({
  fontSize: 7,
  fontWeight: 600,
  letterSpacing: 1,
  textTransform: "uppercase",
  color,
});

export function Label({
  children,
  color,
  style,
}: {
  children: ReactNode;
  color: string;
  style?: Style;
}) {
  return <Text style={[label(color), style ?? {}]}>{children}</Text>;
}

export function Logo({
  model,
  onBand = false,
  height = 34,
}: {
  model: DocModel;
  onBand?: boolean;
  height?: number;
}) {
  const src = pdfImageSrc(model.business.logoUrl);
  if (!src) return null;
  const img = <Image src={src} style={{ height, maxWidth: 140, objectFit: "contain" }} />;
  if (!onBand) return img;
  return (
    <View
      style={{ backgroundColor: "#FFFFFF", padding: 4, borderRadius: 4, alignSelf: "flex-start" }}
    >
      {img}
    </View>
  );
}

export function ContactLines({
  lines,
  color,
  size = 8.5,
}: {
  lines: string[];
  color: string;
  size?: number;
}) {
  if (!lines.length) return null;
  return (
    <View style={{ marginTop: 3 }}>
      {lines.map((l) => (
        <Text key={l} style={{ fontSize: size, color, lineHeight: 1.4 }}>
          {l}
        </Text>
      ))}
    </View>
  );
}

export function StatusChip({ model, onBand = false }: { model: DocModel; onBand?: boolean }) {
  if (!model.statusLabel) return null;
  const p = model.palette;
  const color = onBand ? p.bandInk : model.statusLabel === "Unpaid" ? p.accent : p.muted;
  const border = onBand ? p.bandMuted : model.statusLabel === "Unpaid" ? p.accent : p.line;
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderWidth: 0.75,
        borderColor: border,
        borderRadius: 8,
        paddingVertical: 2,
        paddingHorizontal: 7,
        marginTop: 4,
      }}
    >
      <Text
        style={{
          fontSize: 7,
          fontWeight: 600,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color,
        }}
      >
        {model.statusLabel}
      </Text>
    </View>
  );
}

export function Stamp({ model }: { model: DocModel }) {
  if (!model.stamp) return null;
  const color = model.stamp === "PAID" ? model.palette.paid : model.palette.void;
  return (
    <View
      style={{
        alignSelf: "flex-start",
        transform: "rotate(-8deg)",
        marginTop: 6,
        marginBottom: 10,
        marginLeft: 6,
        opacity: 0.85,
      }}
    >
      <View style={{ borderWidth: 2, borderColor: color, borderRadius: 5, padding: 2 }}>
        <View
          style={{
            borderWidth: 0.75,
            borderColor: color,
            borderRadius: 3,
            paddingVertical: 3,
            paddingHorizontal: 12,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 4,
              color,
              textTransform: "uppercase",
            }}
          >
            {model.stamp === "PAID" ? "Paid" : "Void"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function MetaList({
  model,
  onBand = false,
  align = "left",
}: {
  model: DocModel;
  onBand?: boolean;
  align?: "left" | "right";
}) {
  const p = model.palette;
  return (
    <View style={{ alignSelf: align === "right" ? "flex-end" : "flex-start" }}>
      {model.meta.map((row) => (
        <View key={row.label} style={{ flexDirection: "row", marginBottom: 3 }}>
          <Text style={{ width: 46, fontSize: 8.5, color: onBand ? p.bandMuted : p.muted }}>
            {row.label}
          </Text>
          <Text style={{ fontSize: 8.5, fontWeight: 600, color: onBand ? p.bandInk : p.ink }}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function BilledTo({ model, onBand = false }: { model: DocModel; onBand?: boolean }) {
  const p = model.palette;
  return (
    <View>
      <Label color={onBand ? p.bandAccent : p.muted}>Billed to</Label>
      <Text
        style={{ marginTop: 4, fontSize: 10, fontWeight: 600, color: onBand ? p.bandInk : p.ink }}
      >
        {model.client.name}
      </Text>
      <ContactLines lines={model.client.contact} color={onBand ? p.bandMuted : p.muted} />
    </View>
  );
}

type TableVariant = "filled" | "ruled" | "minimal";

const COL = { qty: 40, unit: 82, amount: 86 };

export function ItemsTable({ model, variant }: { model: DocModel; variant: TableVariant }) {
  const p = model.palette;
  const headColor = variant === "filled" ? p.accent : variant === "ruled" ? p.ink : p.muted;
  const inset = variant === "filled" ? 8 : 0;
  const head: Style = { ...label(headColor), fontSize: 7 };
  return (
    <View>
      <View
        fixed
        style={{
          flexDirection: "row",
          paddingVertical: 6,
          paddingHorizontal: inset,
          backgroundColor: variant === "filled" ? p.accentSoft : undefined,
          borderRadius: variant === "filled" ? 3 : 0,
          borderBottomWidth: variant === "ruled" ? 1.5 : variant === "minimal" ? 0.75 : 0,
          borderBottomColor: variant === "ruled" ? p.ink : p.line,
        }}
      >
        <Text style={[head, { flex: 1 }]}>Description</Text>
        <Text style={[head, { width: COL.qty, textAlign: "right" }]}>Qty</Text>
        <Text style={[head, { width: COL.unit, textAlign: "right" }]}>Unit price</Text>
        <Text style={[head, { width: COL.amount, textAlign: "right" }]}>Amount</Text>
      </View>
      {model.items.map((it, i) => (
        <View
          key={i}
          wrap={false}
          style={{
            flexDirection: "row",
            paddingVertical: 8,
            paddingHorizontal: inset,
            borderBottomWidth: 0.75,
            borderBottomColor: p.line,
          }}
        >
          <Text style={{ flex: 1, paddingRight: 10, fontSize: 9.5, fontWeight: 600, color: p.ink }}>
            {it.description}
          </Text>
          <Text style={{ width: COL.qty, textAlign: "right", fontSize: 9.5, color: p.muted }}>
            {it.quantity}
          </Text>
          <Text style={{ width: COL.unit, textAlign: "right", fontSize: 9.5, color: p.muted }}>
            {it.unitPrice}
          </Text>
          <Text
            style={{
              width: COL.amount,
              textAlign: "right",
              fontSize: 9.5,
              fontWeight: 600,
              color: p.ink,
            }}
          >
            {it.amount}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function Totals({ model, boxed }: { model: DocModel; boxed: boolean }) {
  const p = model.palette;
  return (
    <View
      wrap={false}
      style={boxed ? { backgroundColor: p.accentSoft, borderRadius: 6, padding: 12 } : {}}
    >
      {model.breakdown.map((row) => (
        <View
          key={row.label}
          style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}
        >
          <Text style={{ fontSize: 9, color: p.muted }}>{row.label}</Text>
          <Text style={{ fontSize: 9, fontWeight: 600, color: p.ink }}>{row.value}</Text>
        </View>
      ))}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 4,
          paddingTop: 7,
          borderTopWidth: 0.75,
          borderTopColor: p.line,
        }}
      >
        <Text style={{ fontSize: 9.5, fontWeight: 600, color: p.ink }}>{model.total.label}</Text>
        <Text style={{ fontSize: 16, fontWeight: 700, color: p.accent }}>{model.total.value}</Text>
      </View>
      <Text
        style={{ marginTop: 5, fontSize: 7.5, lineHeight: 1.4, color: p.muted, textAlign: "right" }}
      >
        {model.amountInWords}
      </Text>
    </View>
  );
}

export function Notes({ model }: { model: DocModel }) {
  if (!model.notes) return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <Label color={model.palette.muted}>Notes</Label>
      <Text style={{ marginTop: 4, fontSize: 9, lineHeight: 1.5, color: model.palette.ink }}>
        {model.notes}
      </Text>
    </View>
  );
}

export function PayTo({ model, onBand = false }: { model: DocModel; onBand?: boolean }) {
  if (!model.payTo) return null;
  const p = model.palette;
  const { bankName, accountName, accountNumber } = model.payTo;
  return (
    <View
      wrap={false}
      style={onBand ? {} : { borderWidth: 0.75, borderColor: p.line, borderRadius: 6, padding: 10 }}
    >
      <Label color={onBand ? p.bandAccent : p.muted}>Pay to</Label>
      <Text
        style={{ marginTop: 4, fontSize: 10, fontWeight: 600, color: onBand ? p.bandInk : p.ink }}
      >
        {bankName}
      </Text>
      {accountName && (
        <Text style={{ marginTop: 1, fontSize: 8.5, color: onBand ? p.bandMuted : p.muted }}>
          {accountName}
        </Text>
      )}
      <Text
        style={{
          marginTop: 3,
          fontFamily: PDF_FONT.mono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          color: onBand ? p.bandInk : p.ink,
        }}
      >
        {accountNumber}
      </Text>
    </View>
  );
}

/** Notes + pay-to + stamp left, totals right. */
export function SummaryRow({
  model,
  boxed,
  showPayTo = true,
}: {
  model: DocModel;
  boxed: boolean;
  showPayTo?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", marginTop: 18, gap: 24 }}>
      <View style={{ flex: 1 }}>
        <Stamp model={model} />
        <Notes model={model} />
        {showPayTo && <PayTo model={model} />}
      </View>
      <View style={{ width: 210 }}>
        <Totals model={model} boxed={boxed} />
      </View>
    </View>
  );
}

export function DocFooter({ model, showTaxId = true }: { model: DocModel; showTaxId?: boolean }) {
  const p = model.palette;
  const signature = pdfImageSrc(model.business.signatureUrl);
  return (
    <View
      wrap={false}
      style={{
        marginTop: 28,
        paddingTop: 12,
        borderTopWidth: 0.75,
        borderTopColor: p.line,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}
    >
      <View>
        <Text style={{ fontSize: 8, color: p.muted }}>{model.footer}</Text>
        {showTaxId && model.business.taxId && (
          <Text style={{ marginTop: 2, fontSize: 8, color: p.muted }}>
            Tax ID {model.business.taxId}
          </Text>
        )}
      </View>
      {signature && (
        <View style={{ width: 130 }}>
          {/* Signatures are dark ink; on dark paper put them on a white card. */}
          <View
            style={
              model.darkPaper ? { backgroundColor: "#FFFFFF", borderRadius: 3, padding: 3 } : {}
            }
          >
            <Image
              src={signature}
              style={{ height: 34, objectFit: "contain", objectPosition: "left" }}
            />
          </View>
          <Text
            style={{
              marginTop: 3,
              paddingTop: 3,
              borderTopWidth: 0.75,
              borderTopColor: p.line,
              fontSize: 7,
              color: p.muted,
            }}
          >
            Authorised signature
          </Text>
        </View>
      )}
    </View>
  );
}

/** "Page 1 of 2", only when the document runs to more than one page. */
export function PageNumber({ color }: { color: string }) {
  return (
    <Text
      fixed
      style={{ position: "absolute", bottom: 18, right: PAGE_PAD, fontSize: 7, color }}
      render={({ pageNumber, totalPages }) =>
        totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ""
      }
    />
  );
}
