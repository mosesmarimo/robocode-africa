# RoboCode.Africa

A safe, vibrant, gamified platform where primary and high-school students learn **Robotics, Coding and AI** by building real circuits in an interactive in-browser simulator — **RoboCode Studio**.

> Full specification lives in [`docs/`](./docs) (User Requirements + System Specification, `.docx` + `.pdf`). Implementation decisions are in [`DECISIONS.md`](./DECISIONS.md); progress in [`BUILD_PLAN.md`](./BUILD_PLAN.md).

## Quick start

```bash
pnpm install
pnpm db:reset      # create the SQLite db + seed demo data
pnpm dev           # http://localhost:3000
```

**Demo logins** (password `password123`):

| Role | Email |
|------|-------|
| Student | `tariro@springfield.robocode.africa` |
| Teacher | `curie@springfield.robocode.africa` |
| School admin | `admin@springfield.robocode.africa` |
| Platform admin | `super@robocode.africa` |

## What's inside

- **RoboCode Studio** — drag-drop canvas with real [Wokwi](https://github.com/wokwi) components (Arduino UNO, ESP32, Raspberry Pi Pico + 35 components), breadboard + pin-to-pin jumper wiring, Monaco editor, serial monitor.
- **Live simulation (RVM)** — an in-browser Arduino-subset interpreter (`src/lib/sim`) drives components: LEDs (PWM brightness), **LCD text**, buzzer tones (WebAudio), servos, relays, RGB, with interactive sensor inputs (pot/ultrasonic/buttons). Headless auto-grader for challenges.
- **Safety-first identity** — student/school signup, approval-gated activation, parental consent, RBAC, session auth.
- **Multi-tenant white-label** — host→tenant routing + per-tenant branding (live editor) + custom-domain guide.
- **Learning** (courses → lessons → graded challenges), **Teams** (+ moderated chat), **Competitions**, **Leaderboards**, **Badges**, **Notifications**.
- **Admin suites** — Platform, School, and Teacher consoles.
- **Marketing site** — landing + features/for-schools/pricing/safety/about.

## Stack

Next.js 16 (App Router, React 19) · TypeScript · Tailwind CSS v4 + Radix UI · Prisma + SQLite (Postgres-portable) · jose/bcrypt auth · Three.js / @wokwi/elements / avr8js / rp2040js · Monaco · Zustand · Zod.

## Scripts

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm db:seed      # seed data
pnpm db:reset     # reset + seed
node scripts/e2e.mjs   # end-to-end browser checks (dev server must be running)
```

## Project layout

```
src/
  app/                 # routes: (auth), (marketing), app/** (dashboard, studio area), studio/[id]
  components/
    ui/                # design-system primitives (shadcn-style)
    studio/            # canvas, palette, wiring, code editor, sim overlays
    app/ marketing/ …  # shell, nav, feature UIs
  lib/
    sim/               # RVM: lexer, parser, interpreter, machine, netlist, engine, grader
    domain/            # boards, components, roles, constants, diagram schema
    auth/ studio/ learn/ teams/ …   # server actions + helpers
prisma/                # schema + seed
docs/                  # specification (docx/pdf)
```
