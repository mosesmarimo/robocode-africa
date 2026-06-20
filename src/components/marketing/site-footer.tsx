import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getLocale } from "@/lib/i18n";

const LINKS = {
  Platform: [
    { label: "Features", href: "/features" },
    { label: "For Schools", href: "/for-schools" },
    { label: "Pricing", href: "/pricing" },
    { label: "Open Studio", href: "/studio/new" },
  ],
  Learn: [
    { label: "Robotics", href: "/app/learn" },
    { label: "Coding", href: "/app/learn" },
    { label: "AI & ML", href: "/app/learn" },
    { label: "Project gallery", href: "/app/projects" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Safety & privacy", href: "/safety" },
    { label: "Sign in", href: "/login" },
    { label: "Register", href: "/signup" },
  ],
  Legal: [
    { label: "Terms of service", href: "/terms" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Cookie policy", href: "/cookies" },
    { label: "COPPA / GDPR-K", href: "/safety#compliance" },
  ],
} as const;

export async function SiteFooter() {
  const locale = await getLocale();

  return (
    <footer className="border-t border-border bg-card/60 pb-8 pt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <BrandLogo href="/" name="RoboCode.Africa" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              A safe, gamified platform where African students learn robotics, coding and AI by building real circuits in an interactive simulator.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success" />
                COPPA / GDPR-K aligned
              </span>
            </div>
          </div>

          {/* Link columns */}
          {(Object.entries(LINKS) as [string, readonly { label: string; href: string }[]][]).map(([section, links]) => (
            <div key={section}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section}
              </p>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          {/* Copyright & safety */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} RoboCode.Africa. All rights reserved. Built in Africa, for Africa.</p>
            <p className="flex items-center gap-1">
              Designed for safe, inclusive STEM education
              <span aria-hidden="true"> ·</span>
              <Link href="/safety" className="underline-offset-2 hover:underline">
                Our safety commitment
              </Link>
            </p>
          </div>

          {/* Language switcher */}
          <LanguageSwitcher current={locale} />
        </div>
      </div>
    </footer>
  );
}
