import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  BookOpen,
  Trophy,
  ShieldCheck,
  Zap,
  Play,
  Code2,
  CircuitBoard,
  Wifi,
  BarChart3,
  Users,
  Award,
  Bell,
  FileText,
  Layers,
  Globe,
  Lock,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore everything RoboCode.Africa offers — interactive simulation, guided courses, gamification, teams, competitions, and built-in child safety.",
};

/* ─── Section: Studio & Simulation ─────────────────────────────────────── */
const STUDIO_FEATURES = [
  {
    icon: CircuitBoard,
    title: "Visual circuit builder",
    desc: "Drag-and-drop electronic components onto a realistic breadboard. Connect wires, add sensors, motors, LCDs and more with a click.",
  },
  {
    icon: Play,
    title: "One-click simulation",
    desc: "Hit Run and watch your circuit behave in real-time. Serial monitor output, LED state changes and sensor readings all update live.",
  },
  {
    icon: Code2,
    title: "Built-in code editor",
    desc: "Write Arduino C++ or MicroPython with syntax highlighting, auto-complete and inline error hints — all in the browser.",
  },
  {
    icon: Layers,
    title: "Component library",
    desc: "LEDs, resistors, capacitors, servo motors, DHT22 sensors, OLED displays, buttons, buzzers and growing — accurate, ready-to-wire components.",
  },
  {
    icon: Wifi,
    title: "Serial monitor",
    desc: "Real-time serial output panel lets students debug their sketches just like with a physical board.",
  },
  {
    icon: Globe,
    title: "Share & remix",
    desc: "Make projects public or school-only. Copy a classmate&apos;s circuit as a starting point and build on it.",
  },
] as const;

/* ─── Boards ─────────────────────────────────────────────────────────────── */
const BOARDS = [
  {
    name: "Arduino UNO",
    chip: "ATmega328P",
    runtime: "avr-libc",
    desc: "The world's most popular beginner board. Students write Arduino C++ sketches for digital/analog I/O, PWM, I2C and SPI.",
    badgeLabel: "Most popular",
    badgeVariant: "default" as const,
  },
  {
    name: "ESP32",
    chip: "Xtensa LX6 dual-core",
    runtime: "Arduino-ESP32",
    desc: "Wi-Fi and Bluetooth onboard. Perfect for IoT, home automation and data-logging projects without extra shields.",
    badgeLabel: "IoT & connected",
    badgeVariant: "secondary" as const,
  },
  {
    name: "Raspberry Pi Pico",
    chip: "RP2040",
    runtime: "rp2040js / MicroPython",
    desc: "ARM Cortex-M0+ power. Supports MicroPython for AI-on-the-edge experiments and high-speed signal processing.",
    badgeLabel: "AI & edge",
    badgeVariant: "accent" as const,
  },
] as const;

/* ─── Learning features ──────────────────────────────────────────────────── */
const LEARN_FEATURES = [
  {
    icon: BookOpen,
    title: "Structured courses",
    desc: "Tracks for Robotics, Coding and AI — each broken into bite-sized lessons designed for primary (Grade 4–7) and high school (Grade 8–12) learners.",
  },
  {
    icon: Layers,
    title: "Beginner → Advanced",
    desc: "Three difficulty tiers ensure every student is challenged at the right level from their very first circuit to complex IoT builds.",
  },
  {
    icon: FileText,
    title: "Embedded tasks & auto-grading",
    desc: "Each lesson ends with a hands-on task. Our engine auto-checks circuit wiring and code outputs so teachers get instant results.",
  },
  {
    icon: BarChart3,
    title: "Progress tracking",
    desc: "Students see their course completion percentage; teachers see a live class dashboard of who&apos;s keeping up.",
  },
] as const;

/* ─── Gamification features ─────────────────────────────────────────────── */
const GAMIFICATION_FEATURES = [
  {
    icon: Zap,
    title: "RoboPoints",
    desc: "Earn points for completing tasks, lessons, daily streaks and competitions. Points feed an XP level system.",
    tone: "bg-accent/18 text-accent-foreground",
  },
  {
    icon: Award,
    title: "Badges",
    desc: "Unlock digital badges for milestones: First Simulation, 10-Day Streak, Competition Winner and more.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: Trophy,
    title: "Competitions",
    desc: "Intra-school, inter-school and national competitions with real prizes — hosted entirely on the platform.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    icon: Users,
    title: "Teams",
    desc: "Form school teams, collaborate on shared projects, and compete for team trophies alongside individual glory.",
    tone: "bg-success/15 text-success",
  },
] as const;

/* ─── Safety features ───────────────────────────────────────────────────── */
const SAFETY_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Mandatory approvals",
    desc: "Every student account must be approved by a teacher or school admin before access is granted.",
  },
  {
    icon: Bell,
    title: "Parental consent for minors",
    desc: "Students under 13 trigger an automatic guardian-consent email. Access blocked until consent received.",
  },
  {
    icon: MessageSquare,
    title: "Moderated chat",
    desc: "Team chat runs through our content filter. Flagged messages are held for review before delivery.",
  },
  {
    icon: Eye,
    title: "Audit trail",
    desc: "Every action is logged. Platform staff and school admins can inspect any event for compliance.",
  },
  {
    icon: Lock,
    title: "Data minimisation",
    desc: "We collect only what&apos;s needed. No ads, no tracking pixels, no third-party data sharing for minors.",
  },
  {
    icon: Globe,
    title: "Multi-jurisdictional compliance",
    desc: "Designed to meet COPPA (USA), GDPR-K (EU), POPIA (South Africa) and the Zimbabwe Data Protection Act.",
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="space-y-0">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-grid px-6 pb-16 pt-20 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-15 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Badge variant="default" className="mb-4">Platform features</Badge>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Everything a student needs to{" "}
            <span className="text-gradient">become a maker</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            RoboCode.Africa bundles a professional simulator, guided curriculum, competitive play and child-safe infrastructure into one cohesive platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/signup">Get started free <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/for-schools">For schools</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Studio section ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary">
              <Cpu className="size-7" />
            </span>
            <Badge variant="default">Studio & Simulation</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">The RoboCode Studio</h2>
            <p className="max-w-xl text-muted-foreground">
              A professional-grade electronics simulator that runs entirely in the browser — no installs, no drivers, no hardware required.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STUDIO_FEATURES.map((f) => (
              <Card key={f.title} className="group p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>

          <Separator className="my-14" />

          {/* Boards sub-section */}
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">Supported boards</Badge>
            <h3 className="font-display text-2xl font-bold">Simulate real microcontrollers</h3>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Our simulator faithfully emulates real microcontrollers, so students master the exact chips they will graduate to using.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {BOARDS.map((b) => (
              <Card key={b.name} className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant={b.badgeVariant}>{b.badgeLabel}</Badge>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{b.runtime}</span>
                  </div>
                  <CardTitle>{b.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">{b.chip}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning section ── */}
      <section className="bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-secondary/15 text-secondary">
              <BookOpen className="size-7" />
            </span>
            <Badge variant="secondary">Curriculum</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Guided learning paths</h2>
            <p className="max-w-xl text-muted-foreground">
              Structured courses that take students from complete beginner to confident maker — aligned with Africa-context STEM outcomes.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {LEARN_FEATURES.map((f) => (
              <Card key={f.title} className="flex gap-4 p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gamification section ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent/18 text-accent-foreground">
              <Trophy className="size-7" />
            </span>
            <Badge variant="accent">Engagement</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Gamified from day one</h2>
            <p className="max-w-xl text-muted-foreground">
              RoboPoints, badges, leaderboards and competitions keep students motivated and coming back every day.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GAMIFICATION_FEATURES.map((f) => (
              <Card key={f.title} className="p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <span className={`mx-auto mb-4 grid size-12 place-items-center rounded-xl ${f.tone}`}>
                  <f.icon className="size-6" />
                </span>
                <h3 className="font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Safety section ── */}
      <section className="relative overflow-hidden bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-success/15 text-success">
              <ShieldCheck className="size-7" />
            </span>
            <Badge variant="success">Child safety</Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Safe <em className="not-italic text-gradient">by design</em>
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Every feature is designed with the safety of minors front-of-mind. Not bolted on — built in from the start.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SAFETY_FEATURES.map((f) => (
              <Card key={f.title} className="flex gap-4 p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link href="/safety">Read our full safety commitment <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Try every feature — free
          </h2>
          <p className="mt-3 text-muted-foreground">
            Students get full access to the Studio, all beginner courses, and the first competition tier at no cost. Forever.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/signup">Create free account <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
