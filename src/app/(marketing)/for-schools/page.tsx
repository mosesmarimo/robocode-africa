import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Globe,
  Palette,
  Users,
  UserCheck,
  BarChart3,
  ShieldCheck,
  Trophy,
  Layers,
  Settings,
  CheckCircle2,
  BookOpen,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "For Schools",
  description:
    "White-label RoboCode.Africa for your school. Custom domain, your branding, full admin controls, parent approvals and competition hosting — all included.",
};

const SCHOOL_FEATURES = [
  {
    icon: Palette,
    title: "White-label branding",
    desc: "Upload your school logo, set your primary colour, add a custom tagline. Students see your brand on every page.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: Globe,
    title: "Custom domain",
    desc: "Host on yourstem.school or robotics.yourschool.com — SSL included, zero server management.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    icon: UserCheck,
    title: "Student approvals workflow",
    desc: "Admins review and approve every student registration before they access any content. Full audit trail.",
    tone: "bg-success/15 text-success",
  },
  {
    icon: Users,
    title: "Class & teacher management",
    desc: "Create classes, assign teachers, manage class rolls and share join codes — all from one admin console.",
    tone: "bg-accent/18 text-accent-foreground",
  },
  {
    icon: BarChart3,
    title: "Reports & analytics",
    desc: "Engagement dashboards, completion rates, leaderboards and submission exports for compliance and reporting.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: Trophy,
    title: "Private competitions",
    desc: "Host intra-school coding and robotics competitions with your own rules, prizes and judging criteria.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    icon: ShieldCheck,
    title: "Guardian consent management",
    desc: "Automated consent emails to parents, consent status dashboard, and access blocked until consent received.",
    tone: "bg-success/15 text-success",
  },
  {
    icon: Settings,
    title: "Admin console",
    desc: "A full suite of admin tools: user management, approval queues, announcement publisher, branding settings.",
    tone: "bg-accent/18 text-accent-foreground",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    desc: "Broadcast announcements to students, teachers or parents — segmented by audience and class.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: Layers,
    title: "Seat management",
    desc: "Track how many of your purchased seats are in use. Upgrade instantly as your programme grows.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    icon: BookOpen,
    title: "Content assignment",
    desc: "Teachers assign specific courses and tasks to classes, set due dates and get auto-grading results.",
    tone: "bg-success/15 text-success",
  },
  {
    icon: Building2,
    title: "Multi-school district",
    desc: "District plan supports multiple school sub-tenants under one umbrella admin. Ideal for circuits and clusters.",
    tone: "bg-accent/18 text-accent-foreground",
  },
] as const;

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Register your school",
    desc: "Fill in the school registration form with your name, domain preference and number of students. Approval takes less than 24 hours.",
  },
  {
    num: "02",
    title: "Set up your tenant",
    desc: "Add your logo, colours and tagline via the admin branding page. Configure your domain or use our sub-domain.",
  },
  {
    num: "03",
    title: "Invite teachers & create classes",
    desc: "Send teacher invitation emails from the admin console. Teachers create classes and share join codes with students.",
  },
  {
    num: "04",
    title: "Students join & learn",
    desc: "Students register with their join code. Admin approves them. Guardians of minors receive consent emails. Learning begins.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "Setup took one afternoon. Our branding looked great on day one and teachers were immediately comfortable with the dashboard.",
    name: "Mrs Rudo Musoni",
    role: "ICT Head, Harare Academy",
  },
  {
    quote: "The approval workflow means I know exactly who is on the platform. No unwanted accounts, no surprises.",
    name: "Mr Samuel Adeyemi",
    role: "Principal, Lagos STEM School",
  },
  {
    quote: "Hosting our own robotics competition on RoboCode was straightforward. Students loved seeing their school&apos;s name on the trophies.",
    name: "Ms Lindiwe Dube",
    role: "Science Coordinator, Johannesburg",
  },
] as const;

export default function ForSchoolsPage() {
  return (
    <div className="space-y-0">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-grid px-6 pb-16 pt-20">
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-brand-gradient opacity-15 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="default" className="mb-4">For schools & districts</Badge>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                Your school.<br />
                <span className="text-gradient">Your brand.</span><br />
                Your robotics lab.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground leading-relaxed">
                RoboCode.Africa gives every school a fully white-labelled STEM platform — custom domain, your logo, admin approvals, class management and competition hosting — all under your control.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="gradient" asChild>
                  <Link href="/signup">Register your school <ArrowRight className="size-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">View school pricing</Link>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {[
                  "Setup in one afternoon",
                  "No servers to manage",
                  "POPIA & GDPR-K compliant",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-success" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual: admin panel mockup */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-brand-gradient opacity-10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
                  <span className="size-3 rounded-full bg-destructive/60" />
                  <span className="size-3 rounded-full bg-warning/60" />
                  <span className="size-3 rounded-full bg-success/60" />
                  <span className="ml-3 text-xs text-muted-foreground">Admin Console · Harare Academy</span>
                </div>
                <div className="bg-card p-5">
                  {/* Fake brand bar */}
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-gradient p-3 text-white">
                    <div className="grid size-8 place-items-center rounded-lg bg-white/20">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Harare Academy STEM</p>
                      <p className="text-xs text-white/80">harare-academy.robocode.africa</p>
                    </div>
                  </div>
                  {/* Fake stats row */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "Students", v: "248" },
                      { label: "Pending", v: "3" },
                      { label: "Classes", v: "12" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                        <p className="font-display text-xl font-bold">{s.v}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Fake approval queue */}
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approval queue</p>
                  {["Chiedza M.", "Takudzwa B.", "Farai N."].map((name, i) => (
                    <div key={name} className="mb-2 flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="grid size-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {name[0]}
                        </div>
                        <span className="text-sm">{name}</span>
                      </div>
                      <Badge variant={i === 0 ? "success" : "warning"} className="text-[10px]">
                        {i === 0 ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3">Admin capabilities</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything a school needs</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              One platform replaces a patchwork of tools. From onboarding students to hosting competitions, it&apos;s all here.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SCHOOL_FEATURES.map((f) => (
              <Card key={f.title} className="group p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <span className={`mb-3 grid size-11 place-items-center rounded-xl ${f.tone}`}>
                  <f.icon className="size-5" />
                </span>
                <h3 className="font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Onboarding</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Up and running in an afternoon</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-[75%] top-6 hidden h-0.5 w-full bg-border md:block" />
                )}
                <div className="relative z-10 mb-4 grid size-12 place-items-center rounded-2xl bg-brand-gradient text-white font-display font-bold text-sm shadow-md">
                  {step.num}
                </div>
                <h3 className="font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Loved by school administrators</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-brand-gradient px-6 py-20 text-center text-white">
        <div className="pointer-events-none absolute -left-10 top-0 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to bring robotics to your school?</h2>
          <p className="mt-3 text-white/80">
            Register today and get your school tenant set up within 24 hours — with free onboarding support.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link href="/signup">Register your school <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-white/70">
            Free pilot for up to 30 students · No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}
