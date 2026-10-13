# Architectural Decisions Log

A running log of meaningful technical decisions. New entries go at the top. Each entry: context, decision, alternatives considered, consequences.

Format inspired by [ADR](https://adr.github.io/), but lighter.

---

## 0007 — Paystack is the live v1 billing provider (supersedes 0003)

**Date:** 2026-10-12 · **Phase:** 4 · **Status:** Accepted

**Context.** 0003 chose Stripe for v1, but the target market is West Africa, where Paystack is the common card/bank rail. The upgrade flow was built on Paystack; Stripe remained only as a stubbed webhook.

**Decision.** Paystack ([lib/billing/paystack.ts](lib/billing/paystack.ts)) is the active `BillingProvider`, exported as `billingProvider` from [lib/billing/index.ts](lib/billing/index.ts). Consumers import `billingProvider`, never a concrete provider. State flows in via `/api/webhooks/paystack`: `charge.success` (carries our `metadata.businessId`) marks the business Pro and stores `paystackCustomerCode`; `subscription.create` stores `paystackSubscriptionCode` (joined on customer code — it carries no metadata), which the billing-portal link requires; `invoice.payment_failed` → `past_due`; `subscription.disable` → `free`. Events are deduped through `WebhookEvent` inside the same transaction as their side effects.

**Consequences.** `stripe.ts` and `/api/webhooks/billing` remain as an unwired alternative implementation. Switching back is a one-line change in `lib/billing/index.ts` plus webhook work. Plan state lives in `Business.subscriptionStatus`; `isPro()` keeps `past_due` as Pro during the grace period.

---

## 0006 — Invoices as a discriminated variant of `Receipt`, converting to a receipt on payment

**Date:** 2026-07-16 · **Phase:** 3 · **Status:** Accepted

**Context.** Businesspadi needed to generate **invoices** (requests for payment) in addition to receipts (proof of payment). The two share ~90% of their structure — line items, client, branding snapshot, tax/discount, totals, numbering, and the visual document. Options: (a) a separate `Invoice`/`InvoiceLineItem` model, or (b) a `documentType` discriminator on the existing `Receipt` table.

**Decision.** Option (b). `Receipt.documentType` (`RECEIPT` | `INVOICE`, default `RECEIPT`) discriminates the row. Invoices add `dueDate` + `paymentTerms`. Marking an issued invoice **paid generates a linked receipt** (`Receipt.sourceInvoiceId`, unique self-relation), reusing the invoice's frozen `businessSnapshot` and copying its money fields + line items. Numbering is per-`(businessId, type, year)` with an independent format (`Business.invoiceNumberFormat`, default `INV-{YYYY}-{NNNN}`), so the INV and RCPT series never collide (`@@unique([businessId, documentType, number])`).

**Why not a separate table.** A parallel model would duplicate the numbering, PDF, query, and view-mapping layers (~2× the code) and double the surface for the multi-tenant `businessId`-scoping invariant to be violated. The discriminator reuses `toView`, `receiptInclude`, `ReceiptDocument`, `ReceiptBuilder`, `ReceiptList`, and the actions with minimal churn.

**Consequences.**
- **Cross-count risk (load-bearing):** every `prisma.receipt` query on receipt surfaces must now filter `documentType: "RECEIPT"`, or invoices pollute receipt KPIs/lists/limits/client-stats. All existing call sites were updated in the same change; `tests/multi-tenant.test.ts` guards them.
- **Free tier:** issued invoices count toward the 20/month cap; the conversion receipt is excluded (`sourceInvoiceId != null`) so payment doesn't double-charge quota.
- **v1 scope:** invoices are viewable/printable in-app only — no invoice PDF, public `/i/[shareId]` share, or email yet (the post-payment receipt remains fully shareable). Deferred items are structured to drop in (parameterize `receipt-pdf.tsx`, add the public route to `middleware.ts`). Overdue auto-status and partial payments are also deferred.

**Implementation.** schema models `Receipt`/`ReceiptCounter`/`Business`, migration `20260716120000_add_document_type_invoices`, [lib/queries/receipt-number.ts](lib/queries/receipt-number.ts) (`generateDocumentNumber`), [app/app/invoices/actions.ts](app/app/invoices/actions.ts) (`markInvoicePaid`), [lib/queries/invoices.ts](lib/queries/invoices.ts), the `app/app/invoices/*` route tree, and the parameterized `components/receipt/*`.

---

## 0005 — Receipt-numbering via per-business counter row + transactional row lock

**Date:** 2026-05-06 · **Phase:** 2 (resolved) · **Status:** Accepted

**Context.** Receipt numbers must be sequential per business with no gaps or duplicates under concurrent issuance (Phase 2 acceptance §6.5). Three options were considered: (a) Postgres advisory lock keyed by businessId, (b) a Postgres sequence per business, (c) a counter row updated inside the same transaction that creates the Receipt.

**Decision.** Option (c). A `ReceiptCounter(businessId, year)` row is `upsert`-ed with `lastNumber: { increment: 1 }` inside the same transaction as the Receipt insert. The row-level lock taken by the update serializes concurrent issues; the unique `(businessId, number)` index is the second line of defense.

**Why not the alternatives.** Advisory locks live outside the transaction's normal lifecycle and are easy to leak in error paths. Per-business sequences would require dynamic DDL (`CREATE SEQUENCE`) on every onboarding — operationally painful and Prisma-unfriendly.

**Consequences.** Concurrent issuance for the *same* business serializes briefly on the counter row. That's fine — a single business issuing two receipts in the same millisecond is not a hot path. Year is part of the primary key so each new year starts at `1` automatically. Implementation: [lib/queries/receipt-number.ts](lib/queries/receipt-number.ts), schema model `ReceiptCounter`, migration `20260506075606_add_receipt_counter`.

---

## 0004 — `@react-pdf/renderer` for PDF generation

**Date:** 2026-05-10 · **Phase:** 1 (spike resolved) · **Status:** Accepted

**Context.** Phase 1 §5.4 mandated a 1-day spike comparing jsPDF / react-to-pdf vs `@react-pdf/renderer` against a realistic receipt: 12 line items (forces a page break), Cloudinary logo, custom font, NGN/USD/GBP currency formatting, long client names and item descriptions (text wrapping).

**Decision.** `@react-pdf/renderer` (server-side rendering via `renderToBuffer`).

**Why.**
- Native page-break support (`<View wrap={false}>`, `fixed` headers) — jsPDF requires manual cursor math that breaks the moment line items overflow.
- Programmable layout via React component tree — easy to keep visually consistent with the on-screen `ReceiptDocument`, which is the brand-first principle from the implementation plan.
- Server-side generation keeps PDF rendering off the user's device — important for low-end Android phones in our target market and for future email-attachment / public-share-link flows that need bytes server-side anyway.
- Snapshot rendering: the PDF reads from `Receipt.businessSnapshot`, so retroactive branding edits never rewrite history.

**Trade-offs.**
- Two parallel renderers: HTML `ReceiptDocument` (screen) and `ReceiptPdfDocument` (PDF). The implementation plan called for "single source of truth"; in practice with `@react-pdf/renderer`'s primitives that's not literally achievable. Mitigation: both consume the same `PdfReceiptInput` shape — the data contract is the source of truth, not the JSX.
- Bundle weight: pulled in ~58 transitive packages. Acceptable since rendering runs only on the Node runtime (`runtime = "nodejs"` on the route), not the edge.
- Custom font support exists via `Font.register()`; deferred to Phase 5 polish — Helvetica looks fine for v1.

**Implementation.** [lib/pdf.ts](lib/pdf.ts) (boundary), [lib/pdf/receipt-pdf.tsx](lib/pdf/receipt-pdf.tsx) (component tree), [app/app/receipts/[id]/pdf/route.ts](app/app/receipts/%5Bid%5D/pdf/route.ts) (download).

---

## 0003 — Stripe as v1 billing provider

**Date:** 2026-05-04 · **Phase:** 0 · **Status:** Superseded by 0007

**Context.** Plan calls for a single billing provider in v1, deferring the second until traction justifies the integration cost. Choices were Stripe vs Paystack.

**Decision.** Stripe. Better DX, hosted customer portal saves us building plan-management UI, Stripe CLI for local webhook testing, broadest community examples.

**Trade-off.** Stripe in Nigeria has cross-border friction (FX fees, payout delays). Paystack would be the better local choice. Mitigation: revisit when MRR > $1k. Add Paystack as a second provider implementing the same `BillingProvider` interface (`lib/billing/index.ts`) — no consumer changes needed.

---

## 0002 — Single Next.js app, deployed to Vercel

**Date:** 2026-05-04 · **Phase:** 0 · **Status:** Accepted

**Context.** PRD listed React + Vite as frontend AND Next.js API routes as backend, with Vercel + Railway hosting. Two deployments, two build configs, CORS to manage.

**Decision.** Single Next.js 14 App Router app on Vercel. Drop Vite and Railway entirely.

**Why.** Removes CORS, halves env-var management surface, Clerk middleware is built for this. Server Components mean we lift most data-fetching out of the browser anyway. Cost stays at $0 until traction justifies upgrades.

**Trade-off.** Tight coupling to Vercel's runtime. Mitigation: stick to standard Next.js APIs, avoid Vercel-specific primitives where alternatives exist. Migration to self-hosted Next.js or other platforms remains possible.

---

## 0001 — Multi-tenancy via `getServerContext()` + business-scoped queries

**Date:** 2026-05-04 · **Phase:** 0 · **Status:** Accepted

**Context.** Every business-owned row must be scoped by `businessId`. Forgetting to scope a query is the #1 way to leak another tenant's data.

**Decision.** Single helper `lib/auth.ts:getServerContext()` resolves `(user, business)` from the Clerk session. Every server component, server action, and route handler under `/app` calls it first. Every Prisma query against business-owned tables passes `businessId` in its `WHERE`.

**Alternatives considered.**
- Postgres Row Level Security: stronger guarantee, but harder to debug and not all of our queries flow through Postgres-aware connection logic.
- Per-tenant database (schema-per-tenant): heavy at our scale.

**Consequences.** Discipline-based, not enforced by the database. Mitigation: integration tests that explicitly try cross-tenant access in Phase 1, plus a lint rule (Phase 5) that flags Prisma calls without a `businessId` filter.

---

## Backlog of decisions to make in upcoming phases

- **0006 (Phase 3):** Search implementation (Postgres `tsvector` vs Meilisearch vs Algolia).
- **0007 (Phase 4):** Customer portal: Stripe-hosted vs custom UI.
