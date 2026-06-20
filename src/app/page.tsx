import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  BookOpen,
  Trophy,
  ShieldCheck,
  Building2,
  Wifi,
  Zap,
  Code2,
  CircuitBoard,
  Users,
  Sparkles,
  CheckCircle2,
  Star,
  Globe,
  GraduationCap,
  Rocket,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

/* ─── Hero mock visual ─────────────────────────────────────────────────── */
function StudioMockVisual() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute -inset-8 rounded-3xl bg-brand-gradient opacity-15 blur-3xl" />

      {/* Browser chrome */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <span className="size-3 rounded-full bg-destructive/70" />
          <span className="size-3 rounded-full bg-warning/70" />
          <span className="size-3 rounded-full bg-success/70" />
          <span className="ml-2 text-xs text-muted-foreground">RoboCode Studio — Arduino UNO · Blink LED</span>
        </div>

        {/* Studio body */}
        <div className="flex h-64 sm:h-80">
          {/* Board canvas */}
          <div className="relative flex-1 overflow-hidden bg-grid">
            {/* Fake board */}
            <div className="absolute left-8 top-6 flex flex-col gap-0.5">
              <div className="h-24 w-44 rounded-lg border-2 border-primary/50 bg-card p-2 shadow-lg">
                <div className="mb-1 text-[10px] font-bold text-primary">Arduino UNO</div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="h-2 w-2 rounded-sm bg-primary/30" />
                  ))}
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1">
                  <div className="h-5 w-full rounded bg-secondary/25" />
                  <div className="h-5 w-full rounded bg-primary/25" />
                </div>
              </div>
            </div>

            {/* Fake LED component */}
            <div className="absolute right-14 top-10">
              <div className="size-8 rounded-full border-2 border-accent/60 bg-accent/20 shadow-md" style={{ boxShadow: "0 0 16px 4px var(--brand-accent)" }} />
              <div className="mx-auto mt-1 h-8 w-0.5 bg-foreground/20" />
            </div>

            {/* Animated wire */}
            <svg className="absolute inset-0 size-full" viewBox="0 0 300 200" preserveAspectRatio="none">
              <path
                d="M 165 50 C 210 50 200 80 240 80"
                fill="none"
                stroke="var(--brand-secondary)"
                strokeWidth="2"
                strokeDasharray="5 3"
                opacity="0.8"
              />
              <path
                d="M 165 70 C 215 70 210 95 240 95"
                fill="none"
                stroke="var(--brand-primary)"
                strokeWidth="2"
                strokeDasharray="5 3"
                opacity="0.8"
              />
            </svg>

            {/* Badge overlay */}
            <div className="absolute bottom-4 left-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                <CheckCircle2 className="size-3.5" /> Simulation running
              </span>
            </div>
          </div>

          {/* Code panel */}
          <div className="w-48 shrink-0 border-l border-border bg-muted/30 p-3 font-mono text-[10px] sm:w-56">
            <div className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Code</div>
            {[
              { c: "text-primary", t: "void " },
              { c: "text-secondary", t: "setup() {" },
              { c: "text-muted-foreground", t: "  pinMode(13, OUTPUT);" },
              { c: "text-muted-foreground", t: "}" },
              { c: "", t: "" },
              { c: "text-primary", t: "void " },
              { c: "text-secondary", t: "loop() {" },
              { c: "text-accent-foreground", t: "  digitalWrite(13, HIGH);" },
              { c: "text-muted-foreground", t: "  delay(1000);" },
              { c: "text-muted-foreground", t: "  digitalWrite(13, LOW);" },
              { c: "text-muted-foreground", t: "  delay(1000);" },
              { c: "text-muted-foreground", t: "}" },
            ].map((line, i) => (
              <div key={i} className={`leading-5 ${line.c || "text-foreground"}`}>
                {line.t || " "}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature highlights ────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Cpu,
    title: "Interactive simulator",
    desc: "Wire real components on a virtual breadboard and run code live — no hardware required.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: BookOpen,
    title: "Guided courses",
    desc: "Step-by-step Robotics, Coding and AI lessons built for primary and high-school students.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    icon: Trophy,
    title: "Teams & competitions",
    desc: "Earn RoboPoints, climb leaderboards, and compete in intra-school and national events.",
    tone: "bg-accent/18 text-accent-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Safe & moderated",
    desc: "Every account approved by a guardian or teacher. All chat monitored. Zero spam.",
    tone: "bg-success/15 text-success",
  },
  {
    icon: Building2,
    title: "White-label for schools",
    desc: "Custom domain, your brand colours, and a full admin console for teachers.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: Wifi,
    title: "Works offline-friendly",
    desc: "Optimised for low-bandwidth connections — most content loads once and runs locally.",
    tone: "bg-secondary/15 text-secondary",
  },
] as const;

/* ─── Boards section ────────────────────────────────────────────────────── */
const BOARDS = [
  {
    name: "Arduino UNO",
    desc: "The classic 8-bit microcontroller. Perfect for first circuits, LEDs, sensors and motors.",
    chip: "ATmega328P",
    color: "from-primary/20 to-primary/5",
    border: "border-primary/30",
    badge: "Most popular",
    badgeVariant: "default" as const,
  },
  {
    name: "ESP32",
    desc: "Wi-Fi + Bluetooth built-in. Ideal for IoT projects, smart home builds and data logging.",
    chip: "Xtensa LX6",
    color: "from-secondary/20 to-secondary/5",
    border: "border-secondary/30",
    badge: "IoT ready",
    badgeVariant: "secondary" as const,
  },
  {
    name: "Raspberry Pi Pico",
    desc: "MicroPython powered ARM board. Great for AI on the edge and advanced projects.",
    chip: "RP2040",
    color: "from-accent/20 to-accent/5",
    border: "border-accent/30",
    badge: "AI projects",
    badgeVariant: "accent" as const,
  },
] as const;

/* ─── How it works ──────────────────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    icon: GraduationCap,
    title: "Sign up (free)",
    desc: "Create your account, get guardian approval if you're under 13, and pick your learning track.",
  },
  {
    num: "02",
    icon: CircuitBoard,
    title: "Build & simulate",
    desc: "Drag components onto the board, write code in the built-in editor, and hit Run — watch it come alive.",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Compete & grow",
    desc: "Complete courses, earn RoboPoints, unlock badges, and join competitions with students across Africa.",
  },
] as const;

/* ─── Stats / testimonials ──────────────────────────────────────────────── */
const STATS = [
  { value: "20 000+", label: "Active students" },
  { value: "500+", label: "Schools onboarded" },
  { value: "3", label: "Boards simulated" },
  { value: "12", label: "Countries reached" },
] as const;

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-grid px-6 pb-20 pt-24 text-center">
          {/* Radial glow */}
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-15 blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-4xl">
            {/* Trust pill */}
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-4 text-primary" />
              Africa&apos;s #1 safe STEM platform for schools
            </span>

            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Build real robots{" "}
              <span className="text-gradient">in the browser.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              RoboCode.Africa is the safe, gamified studio where primary and high-school students wire up
              sensors, write code, and watch their circuits come alive in an interactive simulator —
              no hardware, no hassle.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="gradient" asChild>
                <Link href="/signup">
                  Get started free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/studio/new">
                  <Play className="size-4" /> Open Studio
                </Link>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
              {[
                "Approved & moderated",
                "Works on low-end devices",
                "COPPA / GDPR-K aligned",
                "Free for students",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-success" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative z-10 mx-auto mt-16 max-w-2xl px-4">
            <StudioMockVisual />
          </div>
        </section>

        {/* ── Features grid ── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <Badge variant="default" className="mb-3">Everything you need</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                One platform, endless possibilities
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                From your first LED blink to competing in national robotics championships — RoboCode grows with every student.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card
                  key={f.title}
                  className="group p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className={`mb-4 grid size-12 place-items-center rounded-xl ${f.tone}`}>
                    <f.icon className="size-6" />
                  </span>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3 Boards ── */}
        <section className="bg-muted/40 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <Badge variant="secondary" className="mb-3">Simulation engine</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Simulate <span className="text-gradient">real boards</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Powered by rp2040js and Wokwi&apos;s open board definitions — the same chips your students will one day hold in their hands.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {BOARDS.map((b) => (
                <Card
                  key={b.name}
                  className={`group overflow-hidden border ${b.border} transition-all hover:-translate-y-0.5 hover:shadow-lg`}
                >
                  <div className={`bg-gradient-to-br ${b.color} px-6 pt-6`}>
                    <div className="mb-3 flex items-start justify-between">
                      <Badge variant={b.badgeVariant}>{b.badge}</Badge>
                      <span className="rounded-md bg-card/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {b.chip}
                      </span>
                    </div>
                    {/* Mini board visual */}
                    <div className="mx-auto mb-4 h-20 w-36 rounded-lg border-2 border-current/20 bg-card/70 p-2 shadow-inner">
                      <div className="mb-1.5 text-[9px] font-bold text-foreground/70">{b.name}</div>
                      <div className="grid grid-cols-8 gap-0.5">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="h-1.5 w-1.5 rounded-sm bg-foreground/20" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-display text-lg font-semibold">{b.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <Badge variant="outline" className="mb-3">Simple by design</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">From zero to robot in 3 steps</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-1/2 top-6 hidden h-0.5 w-full -translate-y-1/2 bg-border md:block" style={{ left: "75%" }} />
                  )}
                  <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-lg relative z-10">
                    <step.icon className="size-6" />
                  </span>
                  <span className="mb-1 font-mono text-xs font-bold text-primary">{step.num}</span>
                  <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats band ── */}
        <section className="relative overflow-hidden bg-brand-gradient px-6 py-16 text-white">
          <div className="pointer-events-none absolute -left-20 top-1/2 size-72 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-0 size-72 rounded-full bg-black/10 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <p className="font-display text-2xl font-bold sm:text-3xl">
                Trusted by schools across Africa
              </p>
              <p className="mt-2 text-white/80">Growing fast, growing safe.</p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-4xl font-bold sm:text-5xl">{s.value}</p>
                  <p className="mt-1 text-sm text-white/80">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Mini testimonials */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                {
                  quote: "My students built their first robot in week one. Their excitement was incredible.",
                  author: "Ms Chinyere O.",
                  role: "Science teacher, Lagos",
                },
                {
                  quote: "The safety features give me peace of mind. Parents can see exactly what their children do.",
                  author: "Mr Takudzwa M.",
                  role: "School admin, Harare",
                },
                {
                  quote: "I won my school competition and I&apos;ve never even touched real hardware before.",
                  author: "Amahle, 14",
                  role: "Student, Cape Town",
                },
              ].map((t) => (
                <div key={t.author} className="rounded-xl bg-white/10 p-5 backdrop-blur">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-white text-white" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-white/90">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-3">
                    <p className="text-sm font-semibold">{t.author}</p>
                    <p className="text-xs text-white/70">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-2xl">
            <span className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg">
              <Zap className="size-8" />
            </span>
            <h2 className="font-display mt-5 text-4xl font-bold sm:text-5xl">
              Ready to start building?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
              Join 20 000+ students already learning robotics, coding and AI safely on RoboCode.Africa.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="gradient" asChild>
                <Link href="/signup">
                  Create free account <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/for-schools">
                  <Globe className="size-4" /> Register your school
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Free for students forever · Schools from $0/mo ·{" "}
              <Link href="/safety" className="text-primary underline-offset-2 hover:underline">
                Child-safe by design
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
