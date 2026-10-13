import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  LayoutTemplate,
  Calculator,
  Play,
  ArrowRight,
  CheckCircle2,
  Check,
  FileText,
  Mail,
  Lock,
} from "lucide-react";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Businesspadi
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <Link href="#features" className="transition-colors hover:text-blue-600">
            Features
          </Link>
          <Link href="#preview" className="transition-colors hover:text-blue-600">
            How it Works
          </Link>
          <Link href="#pricing" className="transition-colors hover:text-blue-600">
            Pricing
          </Link>
          <Link href="#faq" className="transition-colors hover:text-blue-600">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/sign-in"
            className="font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Sign In
          </Link>
          <Button
            asChild
            className="rounded-full bg-blue-600 px-6 font-semibold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)]"
          >
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-32 pt-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background dark:from-blue-950/20" />

      <div className="container relative z-10 grid items-center gap-16 lg:grid-cols-2 lg:gap-8">
        <div className="max-w-2xl text-center lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-sm font-medium text-blue-600 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            Businesspadi 2.0 is now live
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-7xl">
            Invoicing so fast, it feels like{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              magic.
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 lg:mx-0">
            Generate, send, and track professional invoices and receipts in seconds. Stop wrestling
            with spreadsheets and start getting paid faster with our ultra-clean, automated
            platform.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Button
              size="lg"
              asChild
              className="w-full rounded-full bg-blue-600 px-8 text-base font-semibold shadow-[0_4px_14px_0_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 sm:w-auto"
            >
              <Link href="/sign-up">
                Generate First Invoice (Free) <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="group w-full rounded-full border-slate-200 px-8 text-base font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 sm:w-auto"
            >
              <Play className="mr-2 h-4 w-4 text-blue-600 transition-transform group-hover:scale-110" />{" "}
              Watch Demo
            </Button>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">
            No credit card required. Free forever plan available.
          </p>
        </div>

        {/* Hero Interactive Mockup */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          {/* Abstract Glow */}
          <div className="absolute -inset-x-4 -inset-y-4 z-0 scale-105 rounded-full bg-gradient-to-tr from-blue-400/20 to-violet-400/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-0 rounded-2xl border border-slate-200/60 bg-white/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
            {/* App Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white shadow-inner">
                  A
                </div>
                <div>
                  <div className="mb-1 h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-16 rounded-full bg-slate-100 dark:bg-slate-800/50" />
                </div>
              </div>
              <div className="rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Paid
              </div>
            </div>

            {/* App Content */}
            <div className="space-y-6 px-6 py-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Invoice To
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">Acme Corp</p>
                  <p className="text-sm text-slate-500">billing@acme.com</p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Amount Due
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    $4,250.00
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-1 dark:border-slate-800/60 dark:bg-slate-900/20">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border-b border-slate-100 p-3 transition-colors last:border-0 hover:bg-white dark:border-slate-800/60 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                          {i === 1 ? "Brand Redesign" : "Frontend Development"}
                        </p>
                        <p className="text-xs text-slate-500">Qty: 1</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                      {i === 1 ? "$2,000.00" : "$2,250.00"}
                    </p>
                  </div>
                ))}
              </div>

              <Button className="w-full rounded-xl bg-slate-900 text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                <Mail className="mr-2 h-4 w-4" /> Send Invoice
              </Button>
            </div>
          </div>

          {/* Floating Badge */}
          <div className="absolute -right-4 top-12 z-20 flex animate-[bounce_3s_ease-in-out_infinite] items-center gap-2 rounded-full border border-slate-200/60 bg-white/90 px-4 py-2 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              PDF Generated
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-border/40 bg-slate-50/50 py-10 dark:bg-slate-900/20">
      <div className="container text-center">
        <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Trusted by modern teams and freelancers
        </p>
        <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale transition-all duration-500 hover:grayscale-0 md:gap-16">
          {["ACME CORP", "GLOBAL TECH", "STUDIO.IO", "NEXTGEN", "CREATIVES"].map((name) => (
            <div key={name} className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-slate-400 dark:bg-slate-600" />
              <span className="font-bold tracking-tight text-slate-800 dark:text-slate-300">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Zap,
      title: "Instant PDF Generation",
      description:
        "Stop messing with layout engines. Type your items, hit save, and get a pixel-perfect PDF receipt instantly.",
    },
    {
      icon: LayoutTemplate,
      title: "Custom Branding & Templates",
      description:
        "Upload your logo, pick your brand colors, and generate beautiful documents that elevate your brand's professionalism.",
    },
    {
      icon: Calculator,
      title: "Automated Tax & Math",
      description:
        "Never miscalculate again. Set global or line-item tax rates, apply discounts, and let Businesspadi do the heavy lifting.",
    },
  ];

  return (
    <section id="features" className="relative py-24">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            We stripped away the clutter of traditional accounting software to give you exactly what
            you need to look professional and get paid.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/50"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-900/10" />
              <div className="relative">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/30 dark:text-blue-400">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InteractivePreview() {
  return (
    <section id="preview" className="relative overflow-hidden bg-slate-900 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="container relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
              From draft to inbox in 3 clicks.
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-slate-400">
              Experience the smoothest workflow ever designed for invoicing. Our intuitive editor
              lets you create beautiful documents without ever leaving the page.
            </p>
            <ul className="space-y-6">
              {[
                "Add your client details or pick from saved contacts.",
                "Type line items naturally. Math is done automatically.",
                "Hit send. Your client gets a beautiful email with a PDF attached.",
              ].map((text, i) => (
                <li key={i} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 font-bold text-blue-400">
                    {i + 1}
                  </div>
                  <p className="pt-1 text-slate-300">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Glassmorphic visual representation */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-r from-blue-500 to-violet-500 opacity-20 blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-2xl">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#0f172a]">
                {/* Simulated Editor UI */}
                <div className="absolute inset-x-8 bottom-8 top-8 flex flex-col gap-4">
                  <div className="h-8 w-1/3 rounded-lg bg-white/10" />
                  <div className="flex flex-1 flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="h-4 w-24 rounded bg-white/20" />
                      <div className="h-4 w-16 rounded bg-white/10" />
                    </div>
                    <div className="mt-2 h-10 w-full rounded-lg border border-blue-500/30 bg-blue-500/20" />
                    <div className="h-10 w-full rounded-lg bg-white/5" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <div className="h-10 w-24 rounded-lg bg-white/10" />
                    <div className="h-10 w-32 rounded-lg bg-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Simple, transparent pricing.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Start for free, upgrade when you need to. No hidden fees or surprises.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Free Tier */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Starter</h3>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
              <span className="font-medium text-slate-500">/month</span>
            </div>
            <p className="mb-8 h-12 text-slate-600 dark:text-slate-400">
              Perfect for freelancers and side-hustlers just getting started.
            </p>
            <ul className="mb-8 space-y-4">
              {[
                "Up to 20 documents/month",
                "Basic PDF templates",
                "Email support",
                "Client management",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Check className="h-5 w-5 shrink-0 text-emerald-500" /> {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="h-12 w-full rounded-full text-base font-semibold">
              Get Started Free
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-3xl border-2 border-blue-600 bg-blue-50/30 p-8 shadow-xl dark:bg-blue-900/10">
            <div className="absolute right-8 top-0 -translate-y-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Most Popular
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$9</span>
              <span className="font-medium text-slate-500">/month</span>
            </div>
            <p className="mb-8 h-12 text-slate-600 dark:text-slate-400">
              For growing businesses that need volume and brand control.
            </p>
            <ul className="mb-8 space-y-4">
              {[
                "Unlimited documents",
                "Premium custom templates",
                "Remove Businesspadi branding",
                "Priority support",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Check className="h-5 w-5 shrink-0 text-blue-600" /> {feature}
                </li>
              ))}
            </ul>
            <Button className="h-12 w-full rounded-full bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 bg-slate-50 pb-8 pt-16 dark:bg-slate-950">
      <div className="container">
        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Zap className="h-3 w-3 fill-current" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Businesspadi
              </span>
            </div>
            <p className="mb-6 max-w-xs text-sm text-slate-500">
              Making billing beautiful, simple, and lightning fast for modern professionals.
            </p>
            <div className="flex gap-4 text-slate-400">
              <a href="#" aria-label="Twitter" className="transition-colors hover:text-blue-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="transition-colors hover:text-blue-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">Product</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <Link href="#" className="transition-colors hover:text-blue-600">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-blue-600">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-blue-600">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">Resources</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <Link href="#" className="transition-colors hover:text-blue-600">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-blue-600">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-blue-600">
                  Invoice Templates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <Link href="#" className="transition-colors hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-blue-600">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-slate-800/60 md:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Businesspadi Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Lock className="h-4 w-4" /> Secure SSL Encryption
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background selection:bg-blue-500/30 selection:text-white">
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <InteractivePreview />
      <Pricing />
      <Footer />
    </main>
  );
}
