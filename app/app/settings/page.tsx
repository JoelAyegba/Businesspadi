import {
  Building2,
  Palette,
  Receipt as ReceiptIcon,
  CreditCard,
  Upload,
  Sparkles,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandingForm } from "@/components/settings/branding-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { DefaultsForm } from "@/components/settings/defaults-form";
import { PaymentDetailsForm } from "@/components/settings/payment-details-form";
import { requireBusinessContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Settings page — business profile, branding, receipt defaults, billing.
 *
 * Design decisions:
 * - Cards stack vertically for consistent single-column form pattern
 * - Each card has an icon badge + title for quick scanning
 * - Logo upload area with drag-and-drop visual affordance
 * - Brand color picker with live swatch preview
 * - Save button on profile card, sticky action for long forms
 * - Receipt defaults section with token documentation
 * - Plan & billing card with upgrade CTA and feature highlights
 * - Max-width 672px (2xl) keeps forms readable
 * - Staggered fade-in animations for polish
 */
export default async function SettingsPage() {
  const { business: authBusiness } = await requireBusinessContext();
  const b = await prisma.business.findUniqueOrThrow({
    where: { id: authBusiness.id },
  });

  const isPro = b.subscriptionStatus === "active";

  return (
    <div className="flex flex-col gap-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px] sm:leading-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your business profile, branding, and billing preferences.
        </p>
      </header>

      <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
        {/* ─── Business Profile ──────────────────────────────────── */}
        <ProfileForm initialData={{
          name: b.name,
          slug: b.slug,
          phone: b.phone,
          email: b.email,
          taxId: b.taxId,
          address: b.address,
          signatureUrl: b.signatureUrl
        }} />

        {/* ─── Branding ─────────────────────────────────────────── */}
        <BrandingForm initialColor={b.brandColor || "#2E75B6"} initialLogoUrl={b.logoUrl} />

        {/* ─── Receipt Defaults ──────────────────────────────────── */}
        <DefaultsForm initialData={{
          defaultCurrency: b.defaultCurrency,
          defaultTaxRate: b.defaultTaxRate.toString(),
          numberFormat: b.numberFormat,
          invoiceNumberFormat: b.invoiceNumberFormat
        }} />

        {/* ─── Payment details (invoice "Pay to") ─────────────────── */}
        <PaymentDetailsForm initialData={{
          bankName: b.bankName ?? "",
          bankAccountName: b.bankAccountName ?? "",
          bankAccountNumber: b.bankAccountNumber ?? "",
        }} />

        {/* ─── Plan & Billing ───────────────────────────────────── */}
        <Card className="overflow-hidden">
          <CardHeader className="relative">
            {isPro && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" aria-hidden />
            )}
            <div className="relative flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CreditCard className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle>Plan &amp; billing</CardTitle>
                  <Badge variant={isPro ? "success" : "muted"} className="font-semibold">
                    {isPro ? "Pro" : "Free"}
                  </Badge>
                </div>
                <CardDescription>
                  {isPro
                    ? "Unlimited receipts, email delivery, shareable links."
                    : "Up to 20 receipts/month. Upgrade to unlock all features."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!isPro && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Upgrade to Pro</p>
                    <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" /> Unlimited receipts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" /> Email delivery to clients
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" /> Shareable receipt links
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" /> Custom branding
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary" /> Priority support
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {isPro ? (
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                Manage subscription
              </Button>
            ) : (
              <Button className="w-full gap-2 shadow-lg shadow-primary/20 sm:w-auto">
                <Sparkles className="h-4 w-4" /> Upgrade to Pro
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
