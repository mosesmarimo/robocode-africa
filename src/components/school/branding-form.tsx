"use client";

import { useRef, useState, useTransition } from "react";
import { Palette, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateBranding } from "@/lib/school/actions";

type BrandingFormProps = {
  schoolName: string;
  initial: {
    primary: string;
    secondary: string;
    accent: string;
    tagline: string;
    logoUrl: string;
  };
};

export function BrandingForm({ schoolName, initial }: BrandingFormProps) {
  const [primary, setPrimary] = useState(initial.primary);
  const [secondary, setSecondary] = useState(initial.secondary);
  const [accent, setAccent] = useState(initial.accent);
  const [tagline, setTagline] = useState(initial.tagline);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateBranding({ primary, secondary, accent, tagline, logoUrl: logoUrl || undefined });
        toast.success("Branding saved! Changes are live across your school portal.");
      } catch {
        toast.error("Failed to save branding. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            Colour &amp; Identity
          </CardTitle>
          <CardDescription>
            Customise the look of your school portal. Changes apply immediately after saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSave} className="space-y-5">
            {/* Colour pickers */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="color-primary">Primary colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="color-primary"
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                    aria-label="Primary colour picker"
                  />
                  <Input
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                    aria-label="Primary colour hex value"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-secondary">Secondary colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="color-secondary"
                    type="color"
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                    aria-label="Secondary colour picker"
                  />
                  <Input
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                    aria-label="Secondary colour hex value"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-accent">Accent colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="color-accent"
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                    aria-label="Accent colour picker"
                  />
                  <Input
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                    aria-label="Accent colour hex value"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">School tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Building tomorrow's innovators today"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Shown beneath your school name in the portal header.
              </p>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <Input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Paste a public URL to your school logo (PNG or SVG recommended, min 200 × 60 px).
              </p>
            </div>

            <Button type="submit" variant="gradient" disabled={pending} className="w-full sm:w-auto">
              <Save className="size-4" />
              {pending ? "Saving…" : "Save branding"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Live preview */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>This is how your portal header will appear to students.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-5">
            {/* Mock header */}
            <div
              className="mx-5 overflow-hidden rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 60%, ${accent} 100%)`,
              }}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="School logo" className="h-8 object-contain" />
                  ) : (
                    <div
                      className="grid size-8 place-items-center rounded-lg text-sm font-bold"
                      style={{ background: accent, color: "#fff" }}
                    >
                      {schoolName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-display text-sm font-bold text-white">{schoolName}</p>
                    {tagline && <p className="text-xs text-white/75">{tagline}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-white/20" />
                  <div className="size-7 rounded-full bg-white/20" />
                </div>
              </div>

              <div className="flex gap-1 px-5 pb-3">
                {["Dashboard", "Projects", "Learn", "Compete"].map((nav) => (
                  <span
                    key={nav}
                    className="rounded-md px-3 py-1 text-xs font-medium text-white/80 first:bg-white/20 first:text-white"
                  >
                    {nav}
                  </span>
                ))}
              </div>
            </div>

            {/* Colour chips */}
            <div className="mx-5 mt-4 flex gap-2">
              {[
                { label: "Primary", color: primary },
                { label: "Secondary", color: secondary },
                { label: "Accent", color: accent },
              ].map((chip) => (
                <div key={chip.label} className="flex items-center gap-1.5">
                  <div
                    className="size-4 rounded-full border border-border"
                    style={{ background: chip.color }}
                  />
                  <span className="text-xs text-muted-foreground">{chip.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* White-label explainer */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex gap-3 pt-5">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">About white-labelling</p>
              <p className="text-muted-foreground">
                Your school gets its own branded portal at{" "}
                <span className="font-mono font-medium">your-school.robocode.africa</span>. Students
                and teachers see your colours, logo and tagline — powered by RoboCode.Africa behind
                the scenes. You can also connect a custom domain from the{" "}
                <span className="font-medium">Domain</span> settings page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
