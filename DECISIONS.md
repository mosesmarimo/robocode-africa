# RoboCode.Africa — Implementation Decisions (autonomous build)

The specification (see `docs/`) describes a cloud microservice topology. To deliver a **single,
runnable, fully functional platform**, these pragmatic decisions were made autonomously. They
preserve every *feature* in the spec while making it buildable and demonstrable in one codebase.

## Stack
- **Next.js 15 (App Router) + React 19 + TypeScript** — one deployable full-stack app (UI + API
  routes + server actions) instead of separate NestJS microservices. Modules are organised by
  domain to mirror the spec's service boundaries.
- **Tailwind CSS v4 + shadcn/ui (Radix) + Framer Motion + lucide-react** — beautiful, vibrant,
  accessible UI with smooth animation.
- **Prisma ORM + SQLite (dev)** — zero external infra so the platform runs immediately. Schema is
  written to be Postgres-portable (the spec's production DB); switching is a provider change.
- **Custom session auth (jose JWT in httpOnly cookie + bcrypt)** — full control over the
  multi-role RBAC, the signup→approval state machine, parental consent, and tenant scoping.
- **Zustand** for Studio/client state; **zod** for validation; **TanStack Query** where needed.
- **Simulator:** `three` + `@react-three/fiber` + `@react-three/drei` (3D), `@wokwi/elements`
  (2D component rendering), `avr8js` (Arduino UNO / ATmega328P), `rp2040js` (Raspberry Pi Pico),
  and an ESP32 behavioural core. `@monaco-editor/react` for the code editor.
- **Multi-tenancy / white-label:** tenant resolved by subdomain (`school.localhost` in dev) with a
  cookie/path fallback; branding applied via per-tenant CSS variables.

## Defaults chosen (no user input per the autonomous directive)
- Primary brand: vibrant electric-blue + circuit-green on deep ink, with warm amber accents.
- Dev superuser + demo tenants/seed data are created by `prisma/seed.ts` for instant exploration.
- Email/SMS/payments/DNS-ACME are abstracted behind interfaces with working local stubs (console
  + DB), so flows are end-to-end functional without external accounts.
- Block-based coding and the AI hint assistant ship as guided, rule-based helpers (no external LLM
  key required); the interface allows plugging a real provider later.

## Build approach
Foundation (schema, design system, auth, tenancy, shared types) is built first and kept compiling.
Feature modules are then implemented in waves and verified with typecheck/build (and Playwright for
key flows). Progress is tracked in `BUILD_PLAN.md`.
