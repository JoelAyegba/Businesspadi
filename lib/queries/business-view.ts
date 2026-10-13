/**
 * Business identity as shown ON a document.
 *
 * `Receipt.businessSnapshot` freezes the issuer's branding when the document
 * is saved, so later logo/name/address edits never rewrite history. Every
 * surface that renders a document (in-app detail, public /r/ page, PDF) must
 * overlay the snapshot on the live row via this helper — never render the
 * live row directly.
 */
import type { Business, Prisma } from "@prisma/client";
import type { MockBusiness } from "@/lib/mock";

export const DEFAULT_BRAND_COLOR = "#1B4F8A";

/** Keys frozen into `businessSnapshot` by the save actions. */
export const SNAPSHOT_SELECT = {
  name: true,
  address: true,
  phone: true,
  taxId: true,
  logoUrl: true,
  brandColor: true,
  bankName: true,
  bankAccountName: true,
  bankAccountNumber: true,
} as const satisfies Prisma.BusinessSelect;

type SnapshotFields = Pick<Business, keyof typeof SNAPSHOT_SELECT>;

/** Live values, with any non-null snapshotted value taking precedence. */
export function applySnapshot<T extends SnapshotFields>(
  live: T,
  snapshot: Prisma.JsonValue | null,
): T {
  const snap = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {};
  const out = { ...live };
  for (const key of Object.keys(SNAPSHOT_SELECT) as (keyof SnapshotFields)[]) {
    const v = snap[key];
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

/** Full view for ReceiptDocument: live business row + document snapshot. */
export function toBusinessView(live: Business, snapshot: Prisma.JsonValue | null): MockBusiness {
  const b = applySnapshot(live, snapshot);
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl,
    brandColor: b.brandColor ?? DEFAULT_BRAND_COLOR,
    defaultCurrency: b.defaultCurrency,
    subscriptionStatus: b.subscriptionStatus as MockBusiness["subscriptionStatus"],
    phone: b.phone,
    email: b.email,
    address: b.address,
    taxId: b.taxId,
    signatureUrl: b.signatureUrl,
    bankName: b.bankName,
    bankAccountName: b.bankAccountName,
    bankAccountNumber: b.bankAccountNumber,
  };
}
