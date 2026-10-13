"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Phone,
  Mail,
  FileText,
  Pen,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sparkles,
  BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/onboarding/signature-pad";
import { completeOnboarding, type OnboardingFormData } from "@/app/app/onboarding/actions";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    id: "business",
    title: "Business Details",
    icon: Building2,
    description: "Tell us about your business",
  },
  { id: "contact", title: "Contact Info", icon: Phone, description: "How can clients reach you?" },
  {
    id: "preferences",
    title: "Preferences",
    icon: BadgeDollarSign,
    description: "Configure your defaults",
  },
  { id: "signature", title: "Signature", icon: Pen, description: "Add your official signature" },
] as const;

const CURRENCIES = [
  { code: "NGN", label: "₦ Nigerian Naira", flag: "🇳🇬" },
  { code: "USD", label: "$ US Dollar", flag: "🇺🇸" },
  { code: "GBP", label: "£ British Pound", flag: "🇬🇧" },
  { code: "EUR", label: "€ Euro", flag: "🇪🇺" },
  { code: "GHS", label: "₵ Ghanaian Cedi", flag: "🇬🇭" },
  { code: "KES", label: "KSh Kenyan Shilling", flag: "🇰🇪" },
  { code: "ZAR", label: "R South African Rand", flag: "🇿🇦" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("NGN");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");

  const currentStep = STEPS[step] ?? STEPS[0];

  // Step validation
  const validateStep = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    switch (step) {
      case 0: // Business details
        if (!name.trim() || name.trim().length < 2)
          newErrors.name = ["Business name must be at least 2 characters"];
        if (!address.trim() || address.trim().length < 3)
          newErrors.address = ["Address is required"];
        break;
      case 1: // Contact
        if (!phone.trim() || phone.trim().length < 6)
          newErrors.phone = ["A valid phone number is required"];
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          newErrors.email = ["A valid email is required"];
        break;
      case 2: // Preferences
        break;
      case 3: // Signature
        if (!signatureDataUrl) newErrors.signatureDataUrl = ["Please draw your signature"];
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    if (!validateStep()) return;

    startTransition(async () => {
      setServerError("");
      const formData: OnboardingFormData = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        taxId: taxId.trim() || undefined,
        defaultCurrency,
        signatureDataUrl,
      };

      const result = await completeOnboarding(formData);
      if (result.ok) {
        router.refresh();
      } else if (result.errors) {
        setErrors(result.errors as Record<string, string[]>);
        setServerError("Please fix the errors above and try again.");
      }
    });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="animate-scale-in relative mx-4 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl">
        {/* ─── Header with gradient accent ─────────────────────── */}
        <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background px-6 pb-5 pt-6">
          {/* Decorative glow */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-4 top-8 h-20 w-20 rounded-full bg-primary/5 blur-2xl"
            aria-hidden
          />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Set Up Your Business</h2>
              <p className="text-sm text-muted-foreground">
                Complete your profile to start creating professional receipts
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {step + 1}/{STEPS.length}
            </span>
          </div>

          {/* Step indicators */}
          <div className="mt-4 flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-all duration-300 ${
                  i === step
                    ? "bg-primary/10 text-primary"
                    : i < step
                      ? "text-primary/60"
                      : "text-muted-foreground/40"
                }`}
                onClick={() => {
                  // Only allow clicking completed steps
                  if (i < step) {
                    setStep(i);
                    setErrors({});
                  }
                }}
                disabled={i > step}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground/50"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden text-[11px] font-medium sm:inline">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Step Content ─────────────────────────────────────── */}
        <div className="flex flex-col gap-5 px-6 py-6" style={{ minHeight: "320px" }}>
          <div className="flex items-center gap-2">
            <currentStep.icon className="h-4 w-4 text-primary" strokeWidth={2} />
            <h3 className="text-sm font-semibold">{currentStep.title}</h3>
            <span className="ml-auto text-xs text-muted-foreground">{currentStep.description}</span>
          </div>

          {/* Step 0: Business Details */}
          {step === 0 && (
            <div className="animate-fade-in flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="onb-name">
                  Business name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="onb-name"
                  placeholder="e.g. Adex Fashion House"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="onb-address">
                  Business address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="onb-address"
                  placeholder="e.g. 15 Broad Street, Lagos Island, Lagos"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address[0]}</p>}
              </div>
            </div>
          )}

          {/* Step 1: Contact Info */}
          {step === 1 && (
            <div className="animate-fade-in flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="onb-phone">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone number{" "}
                    <span className="text-destructive">*</span>
                  </span>
                </Label>
                <Input
                  id="onb-phone"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone[0]}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="onb-email">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Business email{" "}
                    <span className="text-destructive">*</span>
                  </span>
                </Label>
                <Input
                  id="onb-email"
                  type="email"
                  placeholder="hello@yourbusiness.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="onb-taxid">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Tax ID / RC Number
                  </span>
                </Label>
                <Input
                  id="onb-taxid"
                  placeholder="Optional"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Shown on receipts if provided</p>
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="animate-fade-in flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Default currency</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                        defaultCurrency === c.code
                          ? "border-primary bg-primary/5 text-foreground shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-surface/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                      }`}
                      onClick={() => setDefaultCurrency(c.code)}
                    >
                      <span className="text-base">{c.flag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold">{c.code}</p>
                      </div>
                      {defaultCurrency === c.code && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">💡 Tip:</span> You can change your
                  currency and other defaults later in Settings. The currency you pick here will be
                  the default for all new receipts and invoices.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Signature */}
          {step === 3 && (
            <div className="animate-fade-in flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your signature will appear on receipts and invoices. Draw it below using your mouse,
                trackpad, or finger on a touchscreen.
              </p>
              <SignaturePad
                onSignatureChange={setSignatureDataUrl}
                initialValue={signatureDataUrl}
              />
              {errors.signatureDataUrl && (
                <p className="text-xs text-destructive">{errors.signatureDataUrl[0]}</p>
              )}
            </div>
          )}
        </div>

        {/* ─── Footer ──────────────────────────────────────────── */}
        <div className="border-t border-border/40 px-6 py-4">
          {serverError && <p className="mb-3 text-xs text-destructive">{serverError}</p>}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={handleBack}
              disabled={step === 0 || isPending}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                className="gap-1.5 shadow-lg shadow-primary/15"
                onClick={handleNext}
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="gap-1.5 shadow-lg shadow-primary/15"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
