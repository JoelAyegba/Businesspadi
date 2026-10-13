# SETUP.md — Phase 0 Account Checklist

The code in this repo is fully written, but it needs API keys from seven services to actually run. Work through this checklist **in order**. Each step says exactly which `.env.local` variable to populate. Total time on a fresh setup: ~60–90 minutes (the Resend domain step is the longest because DNS propagation can take a few hours).

> Tip: open `.env.example`, copy it to `.env.local`, and fill values in as you go.

---

## 1. GitHub repo + Vercel project (10 min)

1. Create a new GitHub repository (private to start) and push this code to it.
2. Sign up at [vercel.com](https://vercel.com) and import the repo.
3. In the Vercel project: **Settings → Environment Variables** — leave empty for now, you'll add keys per service below.
4. Note the deployed URL (e.g. `businesspadi-xyz.vercel.app`). You'll use it for webhook URLs.

---

## 2. Neon Postgres (5 min)

1. Sign up at [neon.tech](https://neon.tech) (free tier is plenty for v1).
2. Create a project named `businesspadi`.
3. Create two branches: `main` (production) and `dev`.
4. From each branch, copy:
   - **Pooled** connection string → `DATABASE_URL`
   - **Direct** connection string → `DIRECT_DATABASE_URL`
5. **Local:** put dev branch URLs in `.env.local`.
   **Production:** put main branch URLs in Vercel env settings.
6. Install the [Vercel ↔ Neon integration](https://vercel.com/integrations/neon) so each PR preview deploy gets its own ephemeral DB branch automatically.

Test it works:
```bash
npx prisma migrate dev --name init
```

---

## 3. Clerk (10 min)

1. Sign up at [clerk.com](https://clerk.com).
2. Create application `Businesspadi`. Enable: Email/password + Google OAuth. Disable everything else for v1.
3. From **API Keys**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Set redirect URLs (Clerk dashboard → Paths):
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/app/dashboard`
   - After sign-up: `/app/dashboard`
5. **Webhooks** → Endpoints → Add endpoint:
   - URL: `https://YOUR-VERCEL-URL/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.deleted`
   - Copy the signing secret → `CLERK_WEBHOOK_SECRET`
6. For local development, install [ngrok](https://ngrok.com) or use the Clerk dev tunnel so the webhook can reach your laptop.

---

## 4. Cloudinary (5 min)

1. Sign up at [cloudinary.com](https://cloudinary.com) — free tier 25 GB.
2. Dashboard → **Account Details**:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. **Settings → Upload → Upload presets** → Add new:
   - Name: `logos`
   - Mode: **Signed**
   - Folder: `businesspadi/logos`
   - Allowed formats: png, jpg, webp, svg
   - Max file size: 2 MB
   - Eager transformation: `c_fill,w_400,h_400,f_auto`
4. Repeat for a `receipts` preset (10 MB, allow PDF) — used in Phase 4.

---

## 5. Resend (15 min + DNS wait)

1. Sign up at [resend.com](https://resend.com).
2. **API Keys** → Create → `RESEND_API_KEY`
3. **Domains** → Add Domain (e.g. `mail.businesspadi.app`).
4. Add the four DNS records Resend gives you (SPF, DKIM x2, DMARC) at your DNS provider. **Wait for verified status** — this can take minutes to hours.
5. Set `RESEND_FROM` to e.g. `Businesspadi <noreply@mail.businesspadi.app>`.
6. **Webhooks** → Add `https://YOUR-VERCEL-URL/api/webhooks/resend`. (Phase 4 will start consuming these events.)

---

## 6. Stripe (15 min)

1. Sign up at [stripe.com](https://stripe.com). Stay in **test mode** for now (toggle top-right).
2. **Developers → API keys**:
   - `STRIPE_SECRET_KEY` (test mode)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test mode)
3. **Products → Add product** → "Businesspadi Pro", $9.00/month recurring.
   - Copy the **Price ID** (starts with `price_…`) → `STRIPE_PRO_PRICE_ID`
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-VERCEL-URL/api/webhooks/billing`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `checkout.session.completed`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`
5. For local dev, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/billing`

---

## 7. Sentry (5 min — optional but recommended)

1. Sign up at [sentry.io](https://sentry.io). Create a project (Next.js platform).
2. Copy the DSN → `NEXT_PUBLIC_SENTRY_DSN`
3. From **Settings → Account → API → Auth Tokens**, create a token with `project:releases` and `org:read`. → `SENTRY_AUTH_TOKEN`
4. Note your `SENTRY_ORG` slug and `SENTRY_PROJECT` slug.

You can leave Sentry empty for local dev — the Next config skips Sentry wiring when DSN is unset.

---

## 8. Final wiring

1. Confirm `.env.local` has every value populated (no placeholders).
2. Run:
   ```bash
   npm install
   npx prisma migrate dev --name init
   npm run db:seed
   npm run dev
   ```
3. Visit http://localhost:3000 → sign up. After verification you should land on `/app/dashboard` and see your seeded business name in the header.
4. Visit http://localhost:3000/api/health → expect `{"status":"ok","db":"ok",…}`.
5. **Production:** mirror every variable from `.env.local` into Vercel project settings (use the production set of keys for Clerk, Stripe live mode, Neon main branch, etc. — switch later when launching).

## Phase 0 acceptance criteria

A foundation week is "done" when all of these are true. Tick them off:

- [ ] A pushed commit triggers GitHub Actions, all jobs green, and Vercel produces a preview URL
- [ ] The preview URL renders the marketing landing page (the one in `app/page.tsx`)
- [ ] `npx prisma migrate dev` runs cleanly against your Neon dev branch
- [ ] All API keys live in Vercel env settings — none in the repo, none in Slack, none in DMs
- [ ] Sentry captures a deliberately-thrown test error in production (throw something from a server action)
- [ ] A new sign-up creates a User + Business + Membership row (verify with `npx prisma studio`)
- [ ] A second sign-up creates an isolated Business and cannot see the first user's data

Once every box is ticked, Phase 0 is complete and you may start Phase 1.
