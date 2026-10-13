"use client";

import { useState, useTransition } from "react";
import { Landmark, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updatePaymentDetails } from "@/app/app/settings/actions";

type PaymentDetails = { bankName: string; bankAccountName: string; bankAccountNumber: string };

export function PaymentDetailsForm({ initialData }: { initialData: PaymentDetails }) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updatePaymentDetails(data);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const set = (key: keyof PaymentDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [key]: e.target.value }));

  return (
    <Card className="animate-fade-in-delay-3">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <CardTitle>Payment details</CardTitle>
            <CardDescription>
              Printed as &ldquo;Pay to&rdquo; on your invoices so clients can pay by transfer.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bankName">Bank name</Label>
            <Input
              id="bankName"
              value={data.bankName}
              onChange={set("bankName")}
              placeholder="e.g. GTBank"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bankAccountNumber">Account number</Label>
            <Input
              id="bankAccountNumber"
              value={data.bankAccountNumber}
              onChange={set("bankAccountNumber")}
              inputMode="numeric"
              className="font-mono tracking-wider"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bankAccountName">Account name</Label>
          <Input
            id="bankAccountName"
            value={data.bankAccountName}
            onChange={set("bankAccountName")}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Leave every field empty to remove payment details from invoices.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end border-t border-border/60 pt-4">
          <Button className="gap-2 shadow-sm" onClick={handleSave} disabled={isPending || saved}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {saved ? "Saved!" : "Save payment details"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
