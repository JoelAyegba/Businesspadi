"use client";

import { useState, useTransition, useRef } from "react";
import { Palette, Upload, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateBranding } from "@/app/app/settings/actions";
import { resizeImageFile } from "@/lib/image-utils";

export function BrandingForm({ initialColor, initialLogoUrl }: { initialColor: string; initialLogoUrl: string | null }) {
  const [color, setColor] = useState(initialColor || "#2E75B6");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateBranding({ brandColor: color, logoUrl: logoUrl || "" });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await resizeImageFile(file, 400, 400);
      setLogoUrl(b64);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="animate-fade-in-delay-2">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <Palette className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Logo and brand color appear on every receipt.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Logo upload */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {logoUrl ? (
            <div className="relative group flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-surface/50">
              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full rounded-lg object-contain p-2" />
              <button
                type="button"
                onClick={() => setLogoUrl(null)}
                className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove logo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          ) : (
            <div
              className="group flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/50 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
              role="button"
              aria-label="Upload logo"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-1 text-muted-foreground transition-colors group-hover:text-primary">
                <Upload className="h-5 w-5" />
                <span className="text-[10px] font-medium">Upload</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> {logoUrl ? "Change logo" : "Choose file"}
            </Button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or SVG · Max 2 MB · Recommended 400×400px
            </p>
          </div>
        </div>

        {/* Brand color */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settingsBrandColor">Brand color</Label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className="block h-10 w-10 shrink-0 rounded-lg border border-border shadow-inner"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 h-10 w-10 cursor-pointer opacity-0"
                aria-label="Pick brand color"
              />
            </div>
            <Input
              id="settingsBrandColor"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="max-w-[140px] font-mono uppercase"
              maxLength={7}
            />
            <div className="hidden items-center gap-2 sm:flex">
              {["#1B4F8A", "#2E75B6", "#059669", "#D97706", "#DC2626"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="h-7 w-7 rounded-md border border-border/60 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: preset }}
                  onClick={() => setColor(preset)}
                  aria-label={`Select color ${preset}`}
                />
              ))}
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end border-t border-border/60 pt-4">
          <Button className="gap-2 shadow-sm" onClick={handleSave} disabled={isPending || saved}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saved ? "Saved!" : "Save branding"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
