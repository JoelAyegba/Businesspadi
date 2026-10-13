import { requireBusinessContext } from "@/lib/auth";
import { getFreeTierUsage } from "@/lib/billing/limits";
import { upgradeToProAction, createBillingPortalAction } from "@/app/app/billing/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default async function BillingSettingsPage() {
  const { business } = await requireBusinessContext();
  const usage = await getFreeTierUsage(business.id);

  return (
    <div className="flex max-w-4xl flex-col gap-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription, recurring payments, and view your usage.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Current Plan</CardTitle>
            <CardDescription>
              {usage.isPro
                ? "You are currently on the Pro plan."
                : "You are currently on the Free Starter plan."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!usage.isPro ? (
              <div className="animate-in fade-in flex flex-col gap-2 rounded-xl bg-muted/50 p-4 border border-border">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Monthly Receipts Issued</span>
                  <span>{usage.used} / {usage.limit}</span>
                </div>
                <Progress value={(usage.used / usage.limit) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Resets on {new Date(usage.monthStart).toLocaleDateString()}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                  <ShieldCheck className="h-6 w-6" />
                  <span>Unlimited Processing Unlocked</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade / Manage Action Card */}
        <Card className="flex flex-col border-primary/20 shadow-xl overflow-hidden relative">
          {!usage.isPro && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          )}
          <CardHeader>
            <CardTitle className="text-xl">
              {usage.isPro ? "Subscription Portal" : "Upgrade to Pro"}
            </CardTitle>
            <CardDescription>
              {usage.isPro
                ? "Update your payment methods or download your past receipts."
                : "Unlock unlimited document creation and premium features instantly."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col grow gap-4">
            {!usage.isPro && (
              <ul className="flex flex-col gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Unlimited Receipts & Invoices</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated Email Delivery</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Secure Shareable Links</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Remove Platform Branding</li>
              </ul>
            )}
          </CardContent>
          <CardFooter className="pt-4 border-t bg-slate-50 dark:bg-slate-900/50">
            {usage.isPro ? (
              <form action={createBillingPortalAction} className="w-full">
                <Button type="submit" variant="secondary" className="w-full shadow-sm">
                  Manage Subscription
                </Button>
              </form>
            ) : (
              <form action={upgradeToProAction} className="w-full">
                <Button type="submit" className="w-full shadow-lg gap-2 text-md h-12 bg-blue-600 hover:bg-blue-700 text-white">
                  <Zap className="h-4 w-4 fill-white" /> Upgrade Now — ₦3,000 / mo
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
