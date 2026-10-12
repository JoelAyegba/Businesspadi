"use client";

import { useState, useTransition } from "react";
import { Receipt as ReceiptIcon, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateDefaults } from "@/app/app/settings/actions";

type DefaultsProps = {
  initialData: {
    defaultCurrency: string;
    defaultTaxRate: string;
    numberFormat: string;
    invoiceNumberFormat: string;
  };
};

export function DefaultsForm({ initialData }: DefaultsProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateDefaults({
        defaultCurrency: data.defaultCurrency,
        defaultTaxRate: parseFloat(data.defaultTaxRate) || 0,
        numberFormat: data.numberFormat,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <Card className="animate-fade-in-delay-3">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ReceiptIcon className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <CardTitle>Receipt defaults</CardTitle>
            <CardDescription>Applied automatically to every new receipt.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settingsCurrency">Default currency</Label>
            <Input id="settingsCurrency" value={data.defaultCurrency} onChange={e => setData(d => ({ ...d, defaultCurrency: e.target.value }))} className="font-mono uppercase" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settingsTaxRate">Default tax rate (%)</Label>
            <Input id="settingsTaxRate" type="number" step="0.1" inputMode="decimal" value={data.defaultTaxRate} onChange={e => setData(d => ({ ...d, defaultTaxRate: e.target.value }))} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settingsNumberFormat">Receipt number format</Label>
          <Input id="settingsNumberFormat" value={data.numberFormat} onChange={e => setData(d => ({ ...d, numberFormat: e.target.value }))} className="font-mono" />
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[
              { token: "{YYYY}", desc: "Year" },
              { token: "{MM}", desc: "Month" },
              { token: "{NNNN}", desc: "Sequence" },
            ].map((t) => (
              <span
                key={t.token}
                className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 font-mono text-[11px] text-muted-foreground"
              >
                <code className="font-semibold text-foreground/70">{t.token}</code> {t.desc}
              </span>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end border-t border-border/60 pt-4">
          <Button className="gap-2 shadow-sm" onClick={handleSave} disabled={isPending || saved}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saved ? "Saved!" : "Save defaults"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
