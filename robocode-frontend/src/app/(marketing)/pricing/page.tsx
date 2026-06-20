import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Zap, Building2, Globe, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "RoboCode.Africa is free for students. Schools and districts get affordable plans with white-labelling, admin controls, and competition hosting.",
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Zap,
    price: "$0",
    period: "forever",
    tagline: "For individual students and curious learners",
    badgeLabel: null,
    badgeVariant: null,
    ctaLabel: "Get started free",
    ctaHref: "/signup",
    ctaVariant: "outline" as const,
    features: [
      "Full RoboCode Studio (Arduino UNO + ESP32 + Pi Pico)",
      "All beginner courses (Robotics, Coding, AI)",
      "Personal project gallery (up to 5 projects)",
      "RoboPoints & level system",
      "Badges & achievements",
      "Public competition participation",
      "Community leaderboard",
      "Serial monitor & code editor",
      "Low-bandwidth optimised",
    ],
    notIncluded: [
      "Class / school administration",
      "White-label branding",
      "Custom domain",
      "Private school competitions",
      "Teacher dashboards",
      "Admin reports",
    ],
    highlight: false,
  },
  {
    id: "school",
    name: "School",
    icon: Building2,
    price: "$49",
    period: "per month",
    tagline: "For schools with up to 500 students",
    badgeLabel: "Most popular",
    badgeVariant: "default" as const,
    ctaLabel: "Register your school",
    ctaHref: "/signup",
    ctaVariant: "gradient" as const,
    features: [
      "Everything in Free",
      "Up to 500 student seats",
      "White-label branding (logo, colours, tagline)",
      "Custom subdomain (yourschool.robocode.africa)",
      "Full admin console",
      "Class & teacher management",
      "Student approval workflow",
      "Guardian consent management",
      "Teacher assignment & grading tools",
      "Private school competitions",
      "Engagement reports & exports",
      "Announcement publisher",
      "Priority email support",
    ],
    notIncluded: [
      "Multiple school sub-tenants",
      "Custom apex domain (yourdomain.com)",
      "Dedicated account manager",
    ],
    highlight: true,
  },
  {
    id: "district",
    name: "District",
    icon: Globe,
    price: "$199",
    period: "per month",
    tagline: "For districts, circuits & multi-school clusters",
    badgeLabel: "Best value per school",
    badgeVariant: "secondary" as const,
    ctaLabel: "Contact us",
    ctaHref: "mailto:schools@robocode.africa",
    ctaVariant: "outline" as const,
    features: [
      "Everything in School",
      "Up to 5 000 student seats across all schools",
      "Multiple school sub-tenants under one umbrella",
      "Custom apex domain (yourdomain.com) with SSL",
      "District-wide leaderboard & competitions",
      "District admin + per-school admin roles",
      "Dedicated account manager",
      "Onboarding workshop (virtual)",
      "Custom SLA & data residency options",
      "Annual billing discount available",
    ],
    notIncluded: [],
    highlight: false,
  },
] as const;

const FAQS = [
  {
    q: "Is the free plan really free forever?",
    a: "Yes. Students always get the Studio and beginner courses at no cost. We will never put core learning features behind a paywall for individuals.",
  },
  {
    q: "What counts as a seat?",
    a: "A seat is one active student account in your school tenant. Teacher and admin accounts do not count toward your seat limit.",
  },
  {
    q: "Can we trial the School plan before paying?",
    a: "Yes — every new school gets a free 30-day trial with up to 30 students. No credit card required to start.",
  },
  {
    q: "We are in a country with limited card infrastructure. How do we pay?",
    a: "We support mobile money (EcoCash, MTN MoMo), bank transfer and local invoicing for African institutions. Contact schools@robocode.africa.",
  },
  {
    q: "Does the platform work on cheap Android devices?",
    a: "We build for the lowest common denominator. The Studio runs in Chrome/Firefox on devices with 1 GB RAM. Most content is cached for offline use.",
  },
  {
    q: "How does data privacy work for students?",
    a: "We collect only what is needed for learning. No ad profiling, no third-party data sharing. For full details see our Safety & Privacy page.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="space-y-0">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-grid px-6 pb-16 pt-20 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-15 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Badge variant="default" className="mb-4">Pricing</Badge>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Simple pricing.<br />
            <span className="text-gradient">Free for students. Always.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Individual learners pay nothing. Schools get an affordable plan with everything they need to run a professional robotics programme.
          </p>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={[
                  "relative flex flex-col transition-all",
                  plan.highlight
                    ? "border-primary/60 shadow-xl ring-2 ring-primary/20 hover:-translate-y-1 hover:shadow-2xl"
                    : "hover:-translate-y-0.5 hover:shadow-lg",
                ].join(" ")}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-md">Most popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={[
                      "grid size-10 place-items-center rounded-xl",
                      plan.highlight ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
                    ].join(" ")}>
                      <plan.icon className="size-5" />
                    </span>
                    {plan.badgeLabel && !plan.highlight && (
                      <Badge variant={plan.badgeVariant ?? "default"}>{plan.badgeLabel}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.tagline}</CardDescription>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="mb-1 text-sm text-muted-foreground">/ {plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notIncluded.length > 0 && (
                    <div className="mt-5">
                      <Separator className="mb-4" />
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Not included:</p>
                      <ul className="space-y-2">
                        {plan.notIncluded.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/70">
                            <span className="mt-0.5 size-4 shrink-0 text-center leading-none text-muted-foreground/40">–</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    variant={plan.ctaVariant}
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <Link href={plan.ctaHref}>
                      {plan.ctaLabel} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            All prices in USD. Mobile money & bank transfer available for African schools.{" "}
            <Link href="mailto:schools@robocode.africa" className="text-primary underline-offset-2 hover:underline">
              Contact us
            </Link>{" "}
            for custom quotes or grant-funded programmes.
          </p>
        </div>
      </section>

      {/* ── Comparison callout ── */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">Why schools love us</Badge>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Replace 4 tools with one platform
          </h2>
          <p className="mt-3 text-muted-foreground">
            RoboCode replaces your LMS integration, separate simulator, competition platform and communication tool — at a fraction of the cost.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { old: "Separate simulator subscription", new: "Included in every plan" },
              { old: "Manual spreadsheet approval tracking", new: "Built-in approval queue & audit log" },
              { old: "Third-party competition platform", new: "Native competition hosting" },
              { old: "Generic LMS without robotics context", new: "Purpose-built for electronics & coding" },
            ].map((row) => (
              <Card key={row.old} className="p-4 text-left">
                <p className="text-xs font-medium text-muted-foreground line-through">{row.old}</p>
                <p className="mt-1 text-sm font-medium text-success flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0" /> {row.new}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <span className="mb-4 inline-grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              <HelpCircle className="size-6" />
            </span>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <Card key={faq.q} className="p-5">
                <p className="font-display text-sm font-semibold">{faq.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Still have questions?{" "}
              <Link href="mailto:hello@robocode.africa" className="text-primary underline-offset-2 hover:underline">
                Email us
              </Link>{" "}
              or{" "}
              <Link href="/for-schools" className="text-primary underline-offset-2 hover:underline">
                read the schools guide
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-brand-gradient px-6 py-16 text-center text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Start today — completely free</h2>
          <p className="mt-3 text-white/80">
            No credit card. No commitment. Get your school running on RoboCode.Africa in under an hour.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link href="/signup">Get started free <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/for-schools">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
