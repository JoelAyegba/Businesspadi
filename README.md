# Businesspadi

Cloud-based SaaS for issuing branded, professional receipts. Built for freelancers, SMEs, agencies, and accountants — primarily in the West African market.

This repository is at **Phase 0 — Foundation**. No feature code yet; the goal of Phase 0 is that scaffolding is fully in place so Phase 1 can be pure feature work.

## What's in here

| Area                                           | Status     |
| ---------------------------------------------- | ---------- |
| Next.js 14 App Router + TypeScript strict      | ✅         |
| Tailwind + design tokens (CSS variables)       | ✅         |
| shadcn/ui-style primitives (Button)            | ✅ Starter |
| Clerk auth (middleware + sign-in/up + webhook) | ✅         |
| Prisma schema + Neon Postgres + seed           | ✅         |
| Cloudinary signed-upload helper                | ✅         |
| Resend email client wrapper                    | ✅         |
| Stripe billing (provider-agnostic interface)   | ✅         |
| Sentry instrumentation (client/server/edge)    | ✅         |
| GitHub Actions CI (lint/typecheck/build)       | ✅         |
| Husky + lint-staged pre-commit                 | ✅         |
| Phase 1+ features                              | ⏳         |

## Getting started

Phase 0 is a runnable scaffold but **requires you to create accounts** on the third-party services first. Follow [`SETUP.md`](./SETUP.md) end-to-end.

Once you have keys:

```bash
npm install
cp .env.example .env.local           # then fill in values
npx prisma migrate dev --name init   # creates the DB schema on Neon
npm run db:seed                       # optional: insert demo data
npm run dev
```

Visit http://localhost:3000.

## Folder structure

```
app/
  (auth)/                     sign-in, sign-up (Clerk-hosted)
  app/                        protected app (middleware-gated)
  r/[shareId]/                public receipt view (Phase 4)
  api/
    health/                   readiness probe (DB + 200)
    webhooks/{clerk,billing,resend}
components/
  ui/                         design-system primitives
lib/
  auth.ts                     getServerContext — multi-tenant guard
  db.ts                       Prisma singleton
  billing/                    Stripe + provider-agnostic interface
  cloudinary.ts               signed upload helper
  email/                      Resend client + templates
  pdf.ts                      Phase 1 PDF stub
prisma/
  schema.prisma
scripts/
  seed.ts
.github/workflows/ci.yml      lint, typecheck, prisma validate, build
```

## Scripts

| Command              | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Local dev server on :3000                       |
| `npm run build`      | Production build (runs `prisma generate` first) |
| `npm run lint`       | ESLint                                          |
| `npm run typecheck`  | `tsc --noEmit`                                  |
| `npm run format`     | Prettier write                                  |
| `npm run db:migrate` | Create + apply a Prisma migration locally       |
| `npm run db:deploy`  | Apply pending migrations (used in CI / prod)    |
| `npm run db:seed`    | Seed demo data                                  |
| `npm run db:studio`  | Open Prisma Studio                              |

## Where to read next

- [`SETUP.md`](./SETUP.md) — account checklist and where each key goes
- [`DECISIONS.md`](./DECISIONS.md) — architectural decisions log
- The `ReceiptFlow_Implementation_Plan.docx` in the parent folder — the multi-phase build plan this repo is executing

## Working agreement (from the plan)

- Trunk-based development; short-lived branches off `main`
- Every PR has a description and at least one review approval
- Migration PRs reviewed extra carefully; never merged on Friday afternoons
- End of each phase: 30-minute retro
