import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Globe,
  Lightbulb,
  Users,
  Rocket,
  ShieldCheck,
  Zap,
  MapPin,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "RoboCode.Africa's mission: democratise access to world-class robotics and STEM education for every African student, safely and affordably.",
};

const VALUES = [
  {
    icon: Globe,
    title: "African by design",
    desc: "Built with African classrooms in mind — low-bandwidth optimised, locally relevant context, and priced for African school budgets.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Child safety above all",
    desc: "Every feature is reviewed through a child-safety lens first. We meet COPPA, GDPR-K, POPIA and the Zimbabwe Data Protection Act.",
    tone: "bg-success/15 text-success",
  },
  {
    icon: Heart,
    title: "Inclusive access",
    desc: "Students get the full Studio and beginner courses free, forever. We refuse to gate foundational learning behind a paywall.",
    tone: "bg-destructive/12 text-destructive",
  },
  {
    icon: Lightbulb,
    title: "Hands-on over passive",
    desc: "We believe the best way to learn electronics is to build something. Every lesson ends with a circuit to wire and code to run.",
    tone: "bg-accent/18 text-accent-foreground",
  },
  {
    icon: Users,
    title: "Community over competition",
    desc: "While we love a good leaderboard, we foster collaboration — team projects, shared galleries, and peer learning are core to the experience.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    icon: Rocket,
    title: "Ambitious for Africa",
    desc: "We believe the next generation of hardware engineers, AI researchers and robotics inventors are sitting in classrooms across our continent right now.",
    tone: "bg-primary/12 text-primary",
  },
] as const;

const TIMELINE = [
  {
    year: "2022",
    title: "Idea born in a Harare classroom",
    desc: "A teacher with one Raspberry Pi and 30 curious students — and zero affordable simulation tools. The problem was clear.",
  },
  {
    year: "2023",
    title: "First prototype & pilot",
    desc: "A rough browser simulator built over a weekend. 3 schools, 120 students, 6 months of feedback. The concept was validated.",
  },
  {
    year: "2024",
    title: "Platform rebuilt for scale",
    desc: "Full-stack rewrite with safety infrastructure, white-labelling, and a proper gamification engine. 50 schools onboarded.",
  },
  {
    year: "2025",
    title: "National competitions & growth",
    desc: "First national Zimbabwe robotics competition hosted on the platform. 500+ schools across 12 African countries.",
  },
  {
    year: "2026",
    title: "Today — and beyond",
    desc: "20 000+ active students. Expanding hardware kits programme. On a mission to reach 1 million students by 2028.",
  },
] as const;

const TEAM_HIGHLIGHTS = [
  {
    initial: "T",
    name: "Takudzwa Moyo",
    role: "Co-founder & CEO",
    location: "Harare, Zimbabwe",
  },
  {
    initial: "A",
    name: "Amara Osei",
    role: "Co-founder & CTO",
    location: "Accra, Ghana",
  },
  {
    initial: "N",
    name: "Nomvula Dlamini",
    role: "Head of Education",
    location: "Johannesburg, South Africa",
  },
  {
    initial: "K",
    name: "Kwame Asante",
    role: "Head of Safety & Trust",
    location: "Lagos, Nigeria",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-0">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-grid px-6 pb-16 pt-20 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-15 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Badge variant="default" className="mb-4">Our mission</Badge>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Every African student deserves{" "}
            <span className="text-gradient">world-class STEM education.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            RoboCode.Africa was founded by African educators and engineers who believe the continent&apos;s next wave of innovators are already sitting in school classrooms — they just need the tools.
          </p>
        </div>
      </section>

      {/* ── Mission statement ── */}
      <section className="relative overflow-hidden bg-brand-gradient px-6 py-16 text-white">
        <div className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl font-bold leading-relaxed sm:text-3xl">
            &ldquo;To democratise access to robotics and STEM education for every student in Africa — safely, affordably and joyfully.&rdquo;
          </p>
          <p className="mt-5 text-white/80">— The RoboCode.Africa founding team</p>
        </div>
      </section>

      {/* ── The problem we solve ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="default" className="mb-4">The problem</Badge>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Great STEM education should not require expensive hardware
              </h2>
              <div className="mt-5 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Across Africa, talented students want to learn electronics, robotics and AI. But real hardware kits cost $50–$200 per student — out of reach for most school budgets. Existing simulation tools are designed for wealthy markets: expensive licensing, high-bandwidth requirements, English-only interfaces, and zero child-safety infrastructure.
                </p>
                <p>
                  At the same time, platform-level child safety — mandatory approvals, parental consent workflows, moderated communication — is treated as optional, even though our users are primarily minors.
                </p>
                <p>
                  We built RoboCode.Africa to solve all of this in one place.
                </p>
              </div>
            </div>
            <div>
              <Badge variant="secondary" className="mb-4">Our solution</Badge>
              <div className="space-y-4">
                {[
                  { icon: Zap, label: "Zero hardware needed — simulate real chips in the browser" },
                  { icon: Globe, label: "Optimised for low-bandwidth connections across the continent" },
                  { icon: ShieldCheck, label: "Child-safety infrastructure built into every feature" },
                  { icon: BookOpen, label: "Guided curriculum aligned to African STEM outcomes" },
                  { icon: Heart, label: "Free for individual students, always" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                      <item.icon className="size-4.5" />
                    </span>
                    <p className="pt-1.5 text-sm leading-snug text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3">What we stand for</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Our values</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <Card key={v.title} className="group p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <span className={`mb-4 grid size-11 place-items-center rounded-xl ${v.tone}`}>
                  <v.icon className="size-5" />
                </span>
                <h3 className="font-display text-base font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Our journey</Badge>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">From one classroom to 12 countries</h2>
          </div>
          <div className="relative space-y-8 pl-8">
            {/* Vertical line */}
            <div className="absolute left-3 top-2 h-[calc(100%-1rem)] w-0.5 bg-border" />
            {TIMELINE.map((item) => (
              <div key={item.year} className="relative">
                {/* Dot */}
                <div className="absolute -left-5 top-1.5 size-3 rounded-full border-2 border-primary bg-background" />
                <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md">
                  <span className="font-display text-xs font-bold text-primary">{item.year}</span>
                  <h3 className="mt-0.5 font-display text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <Badge variant="default" className="mb-3">The team</Badge>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Built by Africans, for Africa</h2>
            <p className="mt-2 text-muted-foreground">
              Our small, distributed team is spread across the continent — each member bringing lived experience of African education.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {TEAM_HIGHLIGHTS.map((member) => (
              <Card key={member.name} className="flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-xl font-bold text-white shadow-md">
                  {member.initial}
                </div>
                <div>
                  <p className="font-display font-semibold">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/70">
                    <MapPin className="size-3" /> {member.location}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            We&apos;re hiring educators, engineers and community builders.{" "}
            <Link href="mailto:careers@robocode.africa" className="text-primary underline-offset-2 hover:underline">
              See open roles
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Join the mission
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Whether you&apos;re a student, teacher, school or partner — there&apos;s a place for you in the RoboCode community.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/signup">Get started free <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/for-schools">Register your school</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Want to partner, sponsor or donate?{" "}
            <Link href="mailto:hello@robocode.africa" className="text-primary underline-offset-2 hover:underline">
              Let&apos;s talk
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
