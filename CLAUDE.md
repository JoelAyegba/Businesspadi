# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Businesspadi — Next.js 14 (App Router) SaaS for branded receipts and invoices, targeted at the West African market. Built through Phase 4: receipts, invoices, clients, products, onboarding, PDF, public share links, email delivery, and Paystack billing.

The repo lives inside `receiptflow/`; the parent folder also contains `ReceiptFlow_Implementation_Plan.docx`, the multi-phase build plan that sequences future work.

## Commands

All commands run from `receiptflow/`.

| Command                                    | Purpose                                                     |
| ------------------------------------------ | ----------------------------------------------------------- |
| `npm run dev`                              | Local dev server on :3000                                   |
| `npm run build`                            | Production build — runs `prisma generate` first             |
| `npm run lint`                             | ESLint (Next config)                                        |
| `npm run typecheck`                        | `tsc --noEmit` — strict mode                                |
| `npm run format` / `format:check`          | Prettier                                                    |
| `npm test`                                 | Vitest unit tests                                           |
| `npx vitest run path/to/file.test.ts`      | Run a single unit test file                                 |
| `npm run test:e2e`                         | Playwright E2E                                              |
| `npx playwright test path/to/file.spec.ts` | Run a single E2E spec                                       |
| `npm run db:migrate`                       | Create + apply a Prisma migration locally (Neon dev branch) |
| `npm run db:deploy`                        | Apply pending migrations (CI / prod)                        |
| `npm run db:seed`                          | `tsx scripts/seed.ts` — demo data                           |
| `npm run db:studio`                        | Prisma Studio                                               |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, `prisma validate`, and build on every PR. Husky + lint-staged run prettier + eslint --fix on staged files pre-commit.

Local development requires API keys from seven services (Clerk, Neon, Cloudinary, Resend, Paystack, Sentry, Vercel). The full setup walkthrough is [SETUP.md](SETUP.md). Webhooks need ngrok to reach localhost.

## Architecture

### Multi-tenancy — the load-bearing invariant

Every business-owned row carries `businessId`. Tenant isolation is **discipline-based, not enforced by the database** (decision 0001 in [DECISIONS.md](DECISIONS.md)).

The single rule:

1. Every server component, server action, and route handler under `/app` starts with [`getServerContext()`](lib/auth.ts) (or `requireBusinessContext()` when auth is mandatory).
2. Every Prisma query against a business-owned table (`Receipt`, `Client`, `ReceiptLineItem`, `Membership`) **must** include `businessId` in its `WHERE`.

Forgetting this is the #1 way to leak another tenant's data. Phase 1 will add cross-tenant integration tests; Phase 5 plans a lint rule to flag unscoped Prisma calls. Until then: review every new query.

`getServerContext()` resolves `(user, business)` from the Clerk session by looking up the `User` by `clerkId` and taking the first `Membership` (multi-business per user is a v2 concern; see the `role` field on `Membership`).

### Server actions are public endpoints

TS parameter types are not enforced at runtime. Every action parses its input with zod (`.strict()` where it writes to `Business`) and writes only whitelisted fields — never spread caller input into `prisma.*.update({ data })`. State transitions (pay, void, edit-draft, share) use `updateMany` with `businessId` **and** the expected current status in the `WHERE`, so double-submits are atomic. Tenant-controlled strings in email HTML go through `escapeHtml` ([lib/email/templates.ts](lib/email/templates.ts)).

### Auth flow

[`middleware.ts`](middleware.ts) uses `clerkMiddleware` with an explicit **public** allowlist (`/`, `/sign-in`, `/sign-up`, `/r/[shareId]`, `/api/webhooks/*`, `/api/health`). Everything else is gated. New public routes must be added to `isPublicRoute` in middleware — don't try to gate at the page level.

User → Business linkage happens in the Clerk `user.created` webhook (`/api/webhooks/clerk`), which creates `User`, `Business`, and `Membership` rows. Every webhook records its provider event id in `WebhookEvent` for replay-safety.

### Routing layout

- `app/(marketing)/` — public landing
- `app/(auth)/` — Clerk-hosted sign-in / sign-up
- `app/app/` — protected app (middleware-gated, dashboard etc.); `app/app/receipts/*` and `app/app/invoices/*` are the two document trees
- `app/r/[shareId]/` — public receipt view (Phase 4; opaque `nanoid` stored on `Receipt.shareId`)
- `app/api/health/` — readiness probe (DB + 200)
- `app/api/webhooks/{clerk,paystack,billing,resend}/` — inbound webhook handlers (`billing` is the unwired Stripe stub; `resend` 404s until `RESEND_WEBHOOK_SECRET` is set)

### Data model highlights ([prisma/schema.prisma](prisma/schema.prisma))

- `Receipt.documentType` (`RECEIPT` | `INVOICE`, decision 0006) discriminates the shared table. **Every `prisma.receipt` query on receipt surfaces must filter `documentType: "RECEIPT"`** (and invoice surfaces `"INVOICE"`) — omitting it cross-counts invoices into receipt KPIs/lists/limits. Invoices carry `dueDate`/`paymentTerms`; marking one paid creates a receipt linked via `sourceInvoiceId`. Numbering is per-`(businessId, documentType, year)`.
- `Receipt.businessSnapshot` (Json) freezes the issuing business's branding at issue time so retroactive logo/name/address changes don't rewrite historical receipts. Render documents via `toBusinessView` / `applySnapshot` in [lib/queries/business-view.ts](lib/queries/business-view.ts) — never from the live `Business` row.
- Totals are computed with `computeTotals` in [lib/money.ts](lib/money.ts) (Prisma.Decimal, half-up 2dp).
- `Receipt.number` is unique per `(businessId, documentType, number)`, issued from a per-`(business, type, year)` counter row (decision 0005); year/month come from the business `timezone`.
- Money uses `Decimal(12,2)`; tax rates `Decimal(5,2)`. Don't introduce floats.
- `Receipt.shareId` is the only field exposed in public URLs — never leak `id`.
- `WebhookEvent` is the idempotency log keyed by the provider's event id.

### Billing — provider-agnostic interface

[`lib/billing/index.ts`](lib/billing/index.ts) defines a `BillingProvider` interface and exports the active one as `billingProvider` — Paystack ([`lib/billing/paystack.ts`](lib/billing/paystack.ts), decision 0007); [`lib/billing/stripe.ts`](lib/billing/stripe.ts) is an unwired alternative. Consumers depend only on `billingProvider`, never on a concrete provider. Plan limits live in `PLAN_LIMITS`; `isPro()` treats `past_due` as still-pro to avoid yanking access mid-grace-period.

### Document templates (decision 0008)

A receipt/invoice is rendered twice, from one source: `buildDocModel` ([lib/document-model.ts](lib/document-model.ts)) decides **what** it says (labels, totals rows, amount in words, PAID/VOID stamp, pay-to). The template ([lib/templates.ts](lib/templates.ts)) decides **how**: one of 4 layout families + a hex palette.

- Web: `components/receipt/layouts/*` (palette → `doc-*` Tailwind colours via CSS variables; container queries `@md:` etc.). PDF: `lib/pdf/layouts/*`, same palette hex. **Change a layout in both places.**
- Template ids are persisted on `Receipt.templateId`; never rename/remove one.
- Documents are paper: no `dark:` classes in layouts.
- **Money is always Inter.** Playfair Display / JetBrains Mono (headings, numbers) have no ₦ glyph. PDF fonts are embedded TTFs in `lib/pdf/fonts/` (built-in Helvetica can't draw ₦); keep `outputFileTracingIncludes` in `next.config.mjs` in sync with PDF routes.
- react-pdf decodes PNG/JPEG only (`pdfImageSrc` skips others); uploads are stored as PNG.
- Preview every template with sample data at `/dev/templates` (dev only; `?doc=invoice`, `?width=380`).

### Other infrastructure

- `lib/db.ts` — Prisma singleton (avoid hot-reload connection storms in dev)
- `lib/cloudinary.ts` — signed-upload helper; logos use the `logos` preset (signed, 2 MB, eager 400×400), receipts use `receipts` (Phase 4)
- `lib/email/` — Resend client + templates
- `lib/pdf.ts` — PDF entry point (`renderReceiptPdf`, receipts and invoices); react-pdf (decision 0004)
- Sentry is wired across client/server/edge but no-ops when `NEXT_PUBLIC_SENTRY_DSN` is unset, so local dev doesn't need it.

## Working agreement

- Trunk-based; short-lived branches off `main`.
- **Migration PRs reviewed extra carefully; never merged Friday afternoon.**
- Engines: Node ≥ 22 (CI runs 22 LTS).
- TypeScript strict; don't loosen `tsconfig.json` to silence errors.
- Decisions worth recording (architecture, library choices, trade-offs) get a new entry at the top of [DECISIONS.md](DECISIONS.md), ADR-style.
