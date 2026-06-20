"use client";

import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** The currently-active locale (pass from a server component). */
  current?: Locale;
  className?: string;
}

export function LanguageSwitcher({ current = "en", className }: LanguageSwitcherProps) {
  function handleChange(code: string) {
    document.cookie = `rc_locale=${code};path=/;max-age=31536000;SameSite=Lax`;
    location.reload();
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger
          className="h-7 w-auto min-w-[7rem] gap-1 border-border/60 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted hover:text-foreground focus:ring-1"
          aria-label="Select language"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {LOCALES.map((locale) => (
            <SelectItem key={locale.code} value={locale.code} className="text-xs">
              <span className="mr-1.5" aria-hidden="true">
                {locale.flag}
              </span>
              {locale.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
