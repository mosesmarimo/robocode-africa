"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play, ChevronLeft, ChevronRight, Cpu, Lightbulb, Trophy, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Slide = {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  background: string;
  icon: LucideIcon;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

// Vibrant brand-gradient "image" panels with inspirational copy. Colours come
// from the live --brand-* tokens so they track the active theme.
const SLIDES: Slide[] = [
  {
    eyebrow: "Robotics · Coding · AI",
    title: "Build real robots",
    accent: "in the browser.",
    subtitle:
      "Wire up sensors, write code, and watch your circuits come alive in an interactive simulator — no hardware, no limits.",
    background:
      "linear-gradient(120deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-secondary) 65%, var(--brand-primary)) 100%)",
    icon: Cpu,
    primary: { label: "Get started free", href: "/signup" },
    secondary: { label: "Open Studio", href: "/studio/new" },
  },
  {
    eyebrow: "For every curious mind",
    title: "Every child can be",
    accent: "an inventor.",
    subtitle:
      "From a first blinking LED to AI on the edge — guided lessons turn big ideas into real, working projects.",
    background:
      "linear-gradient(135deg, var(--brand-secondary) 0%, var(--brand-primary) 95%)",
    icon: Lightbulb,
    primary: { label: "Start learning", href: "/signup" },
    secondary: { label: "Explore courses", href: "/features" },
  },
  {
    eyebrow: "Teams · Leaderboards · Events",
    title: "Code. Simulate.",
    accent: "Compete.",
    subtitle:
      "Earn RoboPoints, unlock badges, and go head-to-head with students across Africa in live competitions.",
    background:
      "linear-gradient(120deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-secondary) 80%, white) 60%, var(--brand-accent) 100%)",
    icon: Trophy,
    primary: { label: "Join the arena", href: "/signup" },
    secondary: { label: "See competitions", href: "/features" },
  },
  {
    eyebrow: "Safe by design",
    title: "STEM that schools",
    accent: "can trust.",
    subtitle:
      "Guardian-approved accounts, moderated by default, and white-label ready for your school. Building Africa's next generation of innovators.",
    background:
      "linear-gradient(160deg, var(--brand-primary) 0%, #0a1f3f 100%)",
    icon: ShieldCheck,
    primary: { label: "Register your school", href: "/for-schools" },
    secondary: { label: "Our safety promise", href: "/safety" },
  },
];

const INTERVAL = 6000;

export function HeroCarousel() {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = SLIDES.length;

  const go = React.useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  React.useEffect(() => {
    if (paused) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(t);
  }, [paused, count]);

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label="Why RoboCode.Africa"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative overflow-hidden">
        {/* Track */}
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={s.title}
              className="relative w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
            >
              {/* Background panel */}
              <div className="relative min-h-[32rem] overflow-hidden text-white sm:min-h-[36rem]" style={{ background: s.background }}>
                {/* depth + texture */}
                <div className="pointer-events-none absolute -left-24 top-1/3 size-96 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -right-16 -top-10 size-80 rounded-full bg-black/15 blur-3xl" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "26px 26px",
                  }}
                />
                {/* giant motif */}
                <s.icon className="pointer-events-none absolute -bottom-10 right-2 size-[22rem] text-white/10 sm:right-16" strokeWidth={1} />

                {/* content */}
                <div className="relative z-10 mx-auto flex min-h-[32rem] max-w-7xl flex-col justify-center px-6 py-20 sm:min-h-[36rem]">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
                      {s.eyebrow}
                    </span>
                    <h1 className="mt-5 font-display text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
                      {s.title}{" "}
                      <span className="text-white/85">{s.accent}</span>
                    </h1>
                    <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90">{s.subtitle}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Button
                        size="lg"
                        asChild
                        className="bg-white text-[color:var(--brand-primary)] hover:bg-white/90"
                      >
                        <Link href={s.primary.href}>
                          {s.primary.label} <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        asChild
                        className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                      >
                        <Link href={s.secondary.href}>
                          <Play className="size-4" /> {s.secondary.label}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Arrows */}
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/20 p-2 text-white backdrop-blur transition-colors hover:bg-black/40 sm:grid"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/20 p-2 text-white backdrop-blur transition-colors hover:bg-black/40 sm:grid"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={
                "h-2 rounded-full transition-all " +
                (i === index ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80")
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
