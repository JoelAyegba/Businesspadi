/**
 * The four PDF layout families — paper twins of
 * components/receipt/layouts/{letterhead,banner,editorial,sidebar}.tsx.
 * A4, 40pt margins. Bands/sidebars that must repeat on continuation pages
 * are drawn as `fixed` absolutely-positioned backgrounds.
 */
import { Page, Text, View } from "@react-pdf/renderer";
import type { DocModel } from "@/lib/document-model";
import { PDF_FONT } from "@/lib/pdf/fonts";
import {
  BilledTo,
  ContactLines,
  DocFooter,
  ItemsTable,
  Label,
  Logo,
  MetaList,
  PAGE_PAD,
  PageNumber,
  PayTo,
  StatusChip,
  SummaryRow,
  headingFamily,
} from "./parts";

function pageStyle(model: DocModel) {
  return {
    backgroundColor: model.palette.paper,
    color: model.palette.ink,
    fontFamily: PDF_FONT.sans,
    fontSize: 9.5,
    paddingBottom: 44,
  } as const;
}

export function LetterheadPdf({ model }: { model: DocModel }) {
  const p = model.palette;
  return (
    <Page size="A4" style={{ ...pageStyle(model), paddingTop: 0 }}>
      <View fixed style={{ height: 5, backgroundColor: p.accent }} />
      <View style={{ paddingHorizontal: PAGE_PAD, paddingTop: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ maxWidth: "55%" }}>
            <Logo model={model} />
            <Text
              style={{
                marginTop: model.business.logoUrl ? 10 : 0,
                fontFamily: headingFamily(model),
                fontSize: 13,
                fontWeight: 700,
                color: p.ink,
              }}
            >
              {model.business.name}
            </Text>
            <ContactLines lines={model.business.contact} color={p.muted} />
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontFamily: headingFamily(model),
                fontSize: 24,
                fontWeight: 600,
                color: p.accent,
              }}
            >
              {model.title}
            </Text>
            <Text style={{ marginTop: 3, fontFamily: PDF_FONT.mono, fontSize: 9, color: p.muted }}>
              {model.number}
            </Text>
            <StatusChip model={model} />
          </View>
        </View>

        <View
          style={{
            marginTop: 22,
            paddingVertical: 14,
            borderTopWidth: 0.75,
            borderBottomWidth: 0.75,
            borderColor: p.line,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <BilledTo model={model} />
          <MetaList model={model} align="right" />
        </View>

        <View style={{ marginTop: 20 }}>
          <ItemsTable model={model} variant="filled" />
        </View>
        <SummaryRow model={model} boxed />
        <DocFooter model={model} />
      </View>
      <PageNumber color={p.muted} />
    </Page>
  );
}

export function BannerPdf({ model }: { model: DocModel }) {
  const p = model.palette;
  return (
    <Page size="A4" style={{ ...pageStyle(model), paddingTop: 0 }}>
      <View
        style={{
          backgroundColor: p.band,
          paddingHorizontal: PAGE_PAD,
          paddingTop: 30,
          paddingBottom: 26,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", gap: 10, maxWidth: "65%" }}>
            <Logo model={model} onBand height={28} />
            <View>
              <Text
                style={{
                  fontFamily: headingFamily(model),
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: p.bandInk,
                }}
              >
                {model.business.name}
              </Text>
              <ContactLines lines={model.business.contact} color={p.bandMuted} size={8} />
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Label color={p.bandAccent}>{model.title}</Label>
            <Text
              style={{ marginTop: 3, fontFamily: PDF_FONT.mono, fontSize: 9, color: p.bandInk }}
            >
              {model.number}
            </Text>
          </View>
        </View>
        <View
          style={{
            marginTop: 26,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <Text style={{ fontSize: 9, color: p.bandMuted }}>{model.total.label}</Text>
            <Text style={{ marginTop: 3, fontSize: 30, fontWeight: 600, color: p.bandInk }}>
              {model.total.value}
            </Text>
          </View>
          <MetaList model={model} onBand align="right" />
        </View>
      </View>

      <View style={{ paddingHorizontal: PAGE_PAD, paddingTop: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <BilledTo model={model} />
          <StatusChip model={model} />
        </View>
        <View style={{ marginTop: 20 }}>
          <ItemsTable model={model} variant="ruled" />
        </View>
        <SummaryRow model={model} boxed={false} />
        <DocFooter model={model} />
      </View>
      <PageNumber color={p.muted} />
    </Page>
  );
}

export function EditorialPdf({ model }: { model: DocModel }) {
  const p = model.palette;
  return (
    <Page
      size="A4"
      style={{ ...pageStyle(model), paddingTop: 44, paddingHorizontal: PAGE_PAD + 8 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ maxWidth: "60%" }}>
          <Text style={{ fontSize: 9.5, fontWeight: 600, color: p.ink }}>
            {model.business.name}
          </Text>
          <ContactLines lines={model.business.contact} color={p.muted} size={8} />
        </View>
        <Logo model={model} height={30} />
      </View>

      <View style={{ marginTop: 40 }}>
        <Text
          style={{
            fontFamily: headingFamily(model),
            fontSize: 42,
            fontWeight: 600,
            color: p.ink,
            lineHeight: 1.05,
          }}
        >
          {model.title}
        </Text>
        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontFamily: PDF_FONT.mono, fontSize: 9, color: p.muted }}>
            {model.number}
          </Text>
          <StatusChip model={model} />
        </View>
        <View style={{ marginTop: 14, height: 1.5, width: 34, backgroundColor: p.accent }} />
      </View>

      <View style={{ marginTop: 26, flexDirection: "row", gap: 20 }}>
        <View style={{ flex: 1 }}>
          <BilledTo model={model} />
        </View>
        <View style={{ flex: 1 }}>
          <MetaList model={model} />
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Label color={p.muted}>{model.total.label}</Label>
          <Text style={{ marginTop: 4, fontSize: 17, fontWeight: 600, color: p.accent }}>
            {model.total.value}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 30 }}>
        <ItemsTable model={model} variant="minimal" />
      </View>
      <SummaryRow model={model} boxed={false} />
      <DocFooter model={model} />
      <PageNumber color={p.muted} />
    </Page>
  );
}

const SIDEBAR_W = 170;

export function SidebarPdf({ model }: { model: DocModel }) {
  const p = model.palette;
  return (
    <Page size="A4" style={{ ...pageStyle(model), paddingTop: 0 }}>
      {/* Repeats on every page so continuation pages keep the column. */}
      <View
        fixed
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_W,
          backgroundColor: p.band,
        }}
      />
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: SIDEBAR_W, paddingHorizontal: 22, paddingTop: 34, gap: 22 }}>
          <View>
            <Logo model={model} onBand height={28} />
            <Text
              style={{
                marginTop: model.business.logoUrl ? 10 : 0,
                fontFamily: headingFamily(model),
                fontSize: 12.5,
                fontWeight: 700,
                color: p.bandInk,
              }}
            >
              {model.business.name}
            </Text>
            <ContactLines lines={model.business.contact} color={p.bandMuted} size={8} />
          </View>
          <BilledTo model={model} onBand />
          <MetaList model={model} onBand />
          <PayTo model={model} onBand />
          {model.business.taxId && (
            <Text style={{ fontSize: 8, color: p.bandMuted }}>Tax ID {model.business.taxId}</Text>
          )}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 34 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text
                style={{
                  fontFamily: headingFamily(model),
                  fontSize: 28,
                  fontWeight: 600,
                  color: p.ink,
                }}
              >
                {model.title}
              </Text>
              <Text
                style={{ marginTop: 3, fontFamily: PDF_FONT.mono, fontSize: 9, color: p.muted }}
              >
                {model.number}
              </Text>
            </View>
            <StatusChip model={model} />
          </View>
          <View style={{ marginTop: 22 }}>
            <ItemsTable model={model} variant="ruled" />
          </View>
          <SummaryRow model={model} boxed showPayTo={false} />
          <DocFooter model={model} showTaxId={false} />
        </View>
      </View>
      <PageNumber color={p.muted} />
    </Page>
  );
}
