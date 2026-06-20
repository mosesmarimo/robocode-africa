"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateProfile } from "@/lib/account/actions";

const LOCALE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "sn", label: "Shona" },
  { value: "nd", label: "Ndebele" },
  { value: "sw", label: "Swahili" },
  { value: "zu", label: "Zulu" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
] as const;

interface SettingsFormProps {
  displayName: string;
  locale: string;
  avatarSeed: string;
  email: string;
  role: string;
  schoolName: string | null;
}

export function SettingsForm({
  displayName: initialDisplayName,
  locale: initialLocale,
  avatarSeed: initialAvatarSeed,
  email,
  role,
  schoolName,
}: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [locale, setLocale] = useState(initialLocale);
  const [avatarSeed, setAvatarSeed] = useState(initialAvatarSeed);

  // Accessibility toggles — visual state only (no backend persistence needed for these)
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({ displayName, locale, avatarSeed });
      if (result.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile fields */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and language preference.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={64}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarSeed">Avatar seed</Label>
            <Input
              id="avatarSeed"
              value={avatarSeed}
              onChange={(e) => setAvatarSeed(e.target.value)}
              placeholder="e.g. robo, spark, circuit"
              maxLength={32}
            />
            <p className="text-xs text-muted-foreground">A short word used to generate your avatar initials style.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="language" className="w-full sm:w-64">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LOCALE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button variant="gradient" onClick={handleSave} disabled={isPending}>
              <Save className="size-4" />
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>Adjust visual and motion settings to suit your needs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="reduceMotion" className="cursor-pointer">Reduce motion</Label>
              <p className="text-xs text-muted-foreground">Minimise animations and transitions.</p>
            </div>
            <Switch
              id="reduceMotion"
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
              aria-label="Toggle reduce motion"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="dyslexiaFont" className="cursor-pointer">Dyslexia-friendly font</Label>
              <p className="text-xs text-muted-foreground">Switch to a font designed for easier reading.</p>
            </div>
            <Switch
              id="dyslexiaFont"
              checked={dyslexiaFont}
              onCheckedChange={setDyslexiaFont}
              aria-label="Toggle dyslexia-friendly font"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="highContrast" className="cursor-pointer">High contrast</Label>
              <p className="text-xs text-muted-foreground">Increase colour contrast for better visibility.</p>
            </div>
            <Switch
              id="highContrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
              aria-label="Toggle high contrast"
            />
          </div>
        </CardContent>
      </Card>

      {/* Read-only account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account information</CardTitle>
          <CardDescription>These details are managed by your school or platform admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
              <p className="text-sm font-medium capitalize">{role.replace(/_/g, " ")}</p>
            </div>
            {schoolName && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">School</p>
                <p className="text-sm font-medium">{schoolName}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium">Sign out</p>
            <p className="mt-1 text-xs text-muted-foreground">
              To sign out of your account, click the user menu in the top-right corner of any page and choose{" "}
              <strong>Sign out</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
