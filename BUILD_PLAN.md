# RoboCode.Africa — Build Plan & Progress

Legend: ✅ done · 🟡 in progress · ⬜ pending

## Wave 0 — Foundation ✅
- ✅ Next.js 16 + TS + Tailwind v4 scaffold
- ✅ Prisma schema (full entity set) + SQLite + client
- ✅ Design system (vibrant tokens, fonts, utilities) + 22-component UI kit
- ✅ Domain catalogs: roles/RBAC, constants/points, boards (UNO/ESP32/Pico), components (35)
- ✅ Libs: prisma, session (jose), current-user, tenant resolver, notify, points
- ✅ Builds clean

## Wave 1 — Identity, shell & navigation ✅
- ✅ zod validation + auth server actions (signup direct/school, login, logout)
- ✅ Signup (student/school tabs) + login + pending-approval + parental-consent pages
- ✅ proxy (middleware): tenant resolution + route protection
- ✅ Seed: platform + demo school tenants, all roles, courses/lessons/tasks, badges, teams, competition, sample projects
- ✅ App shell: role-aware sidebar + topbar (points/level, notifications, profile) + mobile nav
- ✅ Role dashboards (student + staff) — verified live via Playwright (login→dashboard)

## Wave 2 — RoboCode Studio (centerpiece) 🟡
- ✅ Canvas (pan/zoom, place/move/rotate/delete, select, undo/redo, keyboard shortcuts)
- ✅ Component palette (search, categories) + click-to-add
- ✅ Board + component rendering via @wokwi/elements (verified: UNO + servo)
- ✅ Monaco code editor + serial monitor + board selector
- ✅ Custom breadboard + pin-to-pin wiring interactions (click pin → click pin)
- ✅ Save/load (diagram.json) + create project + share link
- ✅ Wiring electrical net resolution (breadboard columns + resistor passthrough)
- ✅ Simulation engine: RVM Arduino-subset interpreter (lexer→parser→generator interpreter) — verified headless + in browser
- ✅ Component drivers: LED (on/PWM brightness), buzzer (WebAudio tone), servo (angle), relay, board LED13
- ✅ Run/stop, interactive inputs (pot/sensor sliders, button/PIR press, ultrasonic distance), serial monitor, RoboPoints on run
- ✅ Drivers: LED, LCD text, buzzer, servo, relay, RGB, NeoPixel (Adafruit_NeoPixel), 7-segment, LED bar
- 🟡 OLED graphics + accurate-mode avr8js (future)

## Wave 3 — Learning, Teams, Competitions, Gamification ✅
- ✅ Courses/lessons/tasks + auto-grader (headless RVM) + progress tracking
- ✅ Teams (create/join/leave) + moderated chat (profanity/PII filter → moderation cases)
- ✅ Competitions + entries + standings
- ✅ Leaderboards (individual/team/school) + badges + RoboPoints

## Wave 4 — Administration & white-label ✅
- ✅ Super-admin: approvals, schools/tenants, users, moderation, content, system KPIs (+ audit log)
- ✅ School-admin: student approvals, members, branding editor, domain guide, reports
- ✅ Teacher: classes, assignments, grading
- ✅ White-label branding editor with live preview + custom-domain config UI

## Wave 5 — Marketing, a11y, polish, verification 🟡
- ✅ Marketing site (landing, features, for-schools, pricing, safety, about) — static prerendered
- ✅ Notifications center, profile, settings (with African-language options)
- ✅ Full production build passes; key pages verified via Playwright
- ✅ LCD text output driver (verified) + RGB colour + board LED13
- ✅ End-to-end flow verified (signup → approval-gated → admin approve → login → solve challenge → points): 5/5 Playwright checks pass
- ✅ Block-based coding mode (visual blocks → Arduino code) for younger students
- ✅ i18n foundation + language switcher (8 locales incl. African languages) + RTL support
- ✅ "Open in Studio" from a challenge preloads its starter circuit + code
- ✅ Hardened all pages against stale sessions (getPageUser → redirect)
- 🟡 Accessibility deep pass (WCAG 2.2 AA), full i18n string coverage, OLED graphics driver
