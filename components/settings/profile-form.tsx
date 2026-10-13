"use client";

import { useState, useTransition, useRef } from "react";
import { Building2, Check, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/app/app/settings/actions";
import { resizeImageFile } from "@/lib/image-utils";

type ProfileProps = {
  initialData: {
    name: string;
    slug: string;
    phone: string | null;
    email: string | null;
    taxId: string | null;
    address: string | null;
    signatureUrl: string | null;
  };
};

export function ProfileForm({ initialData }: ProfileProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState(initialData);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateProfile(data);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await resizeImageFile(file, 600, 300);
      setData(prev => ({ ...prev, signatureUrl: b64 }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="animate-fade-in-delay-1">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Shown on every receipt you issue.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settingsName">Business name</Label>
          <Input id="settingsName" value={data.name} disabled className="opacity-70 cursor-not-allowed bg-muted/50" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settingsSlug">URL slug</Label>
          <Input id="settingsSlug" value={data.slug} onChange={e => setData(d => ({ ...d, slug: e.target.value }))} />
          <p className="text-xs text-muted-foreground">
            Used in downloaded PDF file names, e.g. <span className="font-mono text-foreground/70">{data.slug}-RCPT-0001.pdf</span>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settingsPhone">Phone</Label>
            <Input id="settingsPhone" type="tel" placeholder="+234 ..." value={data.phone || ""} onChange={e => setData(d => ({ ...d, phone: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settingsEmail">Business email</Label>
            <Input id="settingsEmail" type="email" placeholder="hello@yourbusiness.com" value={data.email || ""} onChange={e => setData(d => ({ ...d, email: e.target.value }))} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settingsTaxId">Tax ID</Label>
            <Input id="settingsTaxId" placeholder="Optional" value={data.taxId || ""} onChange={e => setData(d => ({ ...d, taxId: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settingsAddress">Address</Label>
            <Input id="settingsAddress" placeholder="Lagos, Nigeria" value={data.address || ""} onChange={e => setData(d => ({ ...d, address: e.target.value }))} />
          </div>
        </div>

        {/* Signature upload */}
        <div className="flex flex-col gap-1.5">
          <Label>Signature</Label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {data.signatureUrl ? (
              <div className="rounded-xl border border-border/60 bg-surface/30 p-3 relative group">
                <img src={data.signatureUrl} alt="Business signature" className="h-16 w-auto dark:invert" />
                <button
                  type="button"
                  onClick={() => setData(d => ({ ...d, signatureUrl: null }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove signature"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="gap-2 sm:w-auto text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload signature image
              </Button>
            )}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleSignatureUpload} />
          </div>
          <p className="text-xs text-muted-foreground">Keep it transparent for best results.</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end border-t border-border/60 pt-4">
          <Button className="gap-2 shadow-sm" onClick={handleSave} disabled={isPending || saved}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saved ? "Saved!" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
