import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { readFileSync } from "node:fs";
import { introRobotics, codingArduino, aiFoundations, LANG_MODULES, ROBOTICS_MODULES, AI_MODULES, TUTORIAL_MODULES } from "./content";
import { type Block } from "./content/types";
import { mergeBakedDiagrams } from "./baked-diagrams";
import { syncLearningTracks } from "./content/sync-tracks";
import { ALL_LANGUAGES } from "../src/domain/constants";
import { ROBOTICS_TEMPLATES, blinkDiagram, BLINK_CODE } from "./robotics-templates";

const prisma = new PrismaClient();
const PW = bcrypt.hashSync("password123", 10);

// ---- AI-generated project descriptions (DeepSeek, same key as the app) ----
let _dsKey: string | null | undefined;
function deepseekKey(): string | null {
  if (_dsKey !== undefined) return _dsKey;
  if (process.env.DEEPSEEK_API_KEY) return (_dsKey = process.env.DEEPSEEK_API_KEY);
  try {
    const env = readFileSync(".env", "utf8");
    const m = env.match(/^DEEPSEEK_API_KEY=(.*)$/m);
    _dsKey = m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    _dsKey = null;
  }
  return _dsKey || null;
}
/* eslint-disable @typescript-eslint/no-explicit-any */
async function aiDescribe(title: string, board: string, diagram: any, code: string, fallback: string): Promise<string> {
  const key = deepseekKey();
  if (!key) return fallback;
  try {
    const comps = (diagram.parts || [])
      .filter((p: any) => p.id !== "mcu" && !String(p.type).startsWith("__board__"))
      .map((p: any) => p.type);
    const conns = (diagram.wires || []).map((w: any) => `${w.from} -> ${w.to}`).join("\n");
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-pro",
        stream: false,
        messages: [
          { role: "system", content: "You write ONE short, friendly sentence (max 22 words) for a kids' electronics project card subtitle, based on the circuit. No markdown, no quotes, no trailing period needed." },
          { role: "user", content: `Project: ${title}\nBoard: ${board}\nComponents: ${comps.join(", ")}\nConnections:\n${conns}\n\nCode:\n${code.slice(0, 1400)}` },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const data: any = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    return text ? text.replace(/^["']|["']$/g, "").slice(0, 200) : fallback;
  } catch {
    return fallback;
  }
}

type AnyJson = Record<string, unknown>;

// Demo wires use the Studio's automatic orthogonal "bus" routing (no baked bend
// points), so every wire connects cleanly to the real component pins and the
// connected pins are colour-matched to their wire.
function routed(d: AnyJson): AnyJson {
  for (const w of d.wires as AnyJson[]) delete w.points;
  return d;
}

// Baked AI wiring diagrams: mergeBakedDiagrams is shared with seed-content.ts
// (the non-destructive prod content seeder). See ./baked-diagrams.ts.

// Wokwi-imported example diagrams (Digital Alarm Clock / Keypad Door Lock), the
// Blink diagram/code, and the LCD/NeoPixel/ESP32 template diagrams+code all moved
// to ./robotics-templates.ts (shared with the idempotent prod seeder). Only
// ultrasonicDiagram/ULTRASONIC_CODE stay here — they back a sample project + a
// course task below, not a template.
function ultrasonicDiagram(): any {
  return routed({
    board: "arduino-uno",
    parts: [
      { id: "mcu", type: "__board__:arduino-uno", x: 48, y: 200, rotation: 0 },
      { id: "u1", type: "ultrasonic", x: 456, y: 72, rotation: 0 },
      { id: "buz1", type: "buzzer", x: 456, y: 360, rotation: 0 },
    ],
    wires: [
      { id: "w1", from: "mcu:5V", to: "u1:VCC", color: "#ef4444" },
      { id: "w2", from: "mcu:GND.1", to: "u1:GND", color: "#000000" },
      { id: "w3", from: "mcu:9", to: "u1:TRIG", color: "#2563ff" },
      { id: "w4", from: "mcu:10", to: "u1:ECHO", color: "#f59e0b" },
      { id: "w5", from: "mcu:8", to: "buz1:1", color: "#16a34a" },
      { id: "w6", from: "buz1:2", to: "mcu:GND.2", color: "#000000" },
    ],
  });
}

const ULTRASONIC_CODE = `const int TRIG = 9, ECHO = 10, BUZZER = 8;
void setup() {
  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT); pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
}
void loop() {
  digitalWrite(TRIG, LOW); delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10); digitalWrite(TRIG, LOW);
  long d = pulseIn(ECHO, HIGH) * 0.034 / 2;
  Serial.print("Distance: "); Serial.println(d);
  if (d < 15) tone(BUZZER, 1000); else noTone(BUZZER);
  delay(200);
}`;

async function reset() {
  // Order respects FKs; cascades handle most children.
  const tables = [
    "auditLog", "moderationCase", "chatMessage", "announcement", "notification",
    "userBadge", "roboPointLedger", "badge", "score", "round", "competitionEntry",
    "competition", "teamMember", "team", "assignment", "classMember", "class",
    "submission", "lessonProgress", "enrollment", "task", "lesson", "course",
    "projectVersion", "simulationRun", "codeFile", "project", "boardDefinition",
    "approvalRequest", "consentRecord", "user", "domain", "subscription", "plan", "tenant",
  ] as const;
  // Child-first delete order (above) keeps FK constraints satisfied on Postgres.
  for (const t of tables) {
    // @ts-expect-error dynamic delegate access
    await prisma[t].deleteMany({});
  }
}

async function main() {
  await reset();

  const schoolPlan = await prisma.plan.create({
    data: { name: "School", seats: 300, priceCents: 9900, features: { competitions: true, whitelabel: true } },
  });
  await prisma.plan.create({ data: { name: "Free", seats: 30, priceCents: 0, features: {} } });

  // Tenants
  const platform = await prisma.tenant.create({
    data: {
      slug: "robocode",
      name: "RoboCode.Africa",
      isPlatform: true,
      status: "active",
      branding: { primary: "#2f6bff", secondary: "#12c8a0", accent: "#ffb020", tagline: "Learn Robotics, Coding & AI" },
      policies: { autoApprove: false },
    },
  });
  const springfield = await prisma.tenant.create({
    data: {
      slug: "springfield",
      name: "Springfield STEM Academy",
      status: "active",
      branding: { primary: "#7c3aed", secondary: "#06b6d4", accent: "#f59e0b", tagline: "Springfield STEM · innovate fearlessly" },
      policies: { autoApprove: false },
    },
  });
  await prisma.domain.create({
    data: { tenantId: springfield.id, hostname: "springfield.localhost:3000", type: "subdomain", verified: true, sslStatus: "active" },
  });
  await prisma.subscription.create({
    data: { tenantId: springfield.id, planId: schoolPlan.id, status: "active", seatsUsed: 6 },
  });

  // Helper to make users
  let pts = 0;
  async function makeUser(
    tenantId: string,
    email: string,
    displayName: string,
    role: string,
    status = "active",
    roboPoints = 0,
    isMinor = role === "student",
  ) {
    return prisma.user.create({
      data: {
        tenantId, email, displayName, role, status, isMinor,
        passwordHash: PW, avatarSeed: nanoid(8), roboPoints,
        level: 1 + Math.floor(roboPoints / 300),
        birthYear: isMinor ? 2013 : 1990,
      },
    });
  }

  // Platform staff + direct students
  const superAdmin = await makeUser(platform.id, "super@robocode.africa", "Amara Okonkwo", "super_admin", "active", 0, false);
  await makeUser(platform.id, "mod@robocode.africa", "Lebo Dlamini", "moderator", "active", 0, false);
  const ada = await makeUser(platform.id, "ada@robocode.africa", "Ada Mensah", "student", "active", 540);
  const pendingDirect = await makeUser(platform.id, "newbie@robocode.africa", "Kofi Asante", "student", "pending", 0);

  // School users
  const schoolAdmin = await makeUser(springfield.id, "admin@springfield.robocode.africa", "Grace Banda", "school_admin", "active", 0, false);
  const teacher = await makeUser(springfield.id, "curie@springfield.robocode.africa", "Marie Curie", "teacher", "active", 0, false);
  const tariro = await makeUser(springfield.id, "tariro@springfield.robocode.africa", "Tariro Moyo", "student", "active", 820);
  const kuda = await makeUser(springfield.id, "kuda@springfield.robocode.africa", "Kuda Nyathi", "student", "active", 610);
  const chipo = await makeUser(springfield.id, "chipo@springfield.robocode.africa", "Chipo Dube", "student", "active", 430);
  const farai = await makeUser(springfield.id, "farai@springfield.robocode.africa", "Farai Sibanda", "student", "active", 350);
  await makeUser(springfield.id, "blessing@springfield.robocode.africa", "Blessing Phiri", "student", "pending", 0);
  await makeUser(springfield.id, "tinashe@springfield.robocode.africa", "Tinashe Ncube", "student", "pending", 0);

  // Approval requests for pending users
  for (const u of [pendingDirect]) {
    await prisma.approvalRequest.create({ data: { userId: u.id, tenantId: platform.id, type: "student_direct" } });
    await prisma.notification.create({
      data: { userId: superAdmin.id, type: "approval", title: "New signup awaiting approval", body: `${u.displayName} requested a student account.` },
    });
  }
  for (const email of ["blessing@springfield.robocode.africa", "tinashe@springfield.robocode.africa"]) {
    const u = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: springfield.id, email } } });
    if (u) {
      await prisma.approvalRequest.create({ data: { userId: u.id, tenantId: springfield.id, type: "student_school" } });
      await prisma.notification.create({
        data: { userId: schoolAdmin.id, type: "approval", title: "New student awaiting approval", body: `${u.displayName} requested to join Springfield STEM.` },
      });
    }
  }

  // Badges
  // Frozen 12 gamification languages (10 coding + 2 robotics) — imported
  // straight from src/domain/constants.ts ALL_LANGUAGES (the single source of
  // truth) rather than hand-duplicated here.
  const GAMIFICATION_LANGUAGES: readonly string[] = ALL_LANGUAGES;
  const LANGUAGE_BADGE_TIERS: { suffix: string; label: string }[] = [
    { suffix: "novice", label: "Novice" },
    { suffix: "adept", label: "Adept" },
    { suffix: "master", label: "Master" },
  ];
  const badges = [
    { code: "first-steps", name: "First Steps", description: "Created your first project.", icon: "sparkles" },
    { code: "blink-master", name: "Blink Master", description: "Ran your first simulation.", icon: "lightbulb" },
    { code: "sensor-sleuth", name: "Sensor Sleuth", description: "Used a sensor in a project.", icon: "radar" },
    { code: "team-player", name: "Team Player", description: "Joined a team.", icon: "users" },
    { code: "top-of-class", name: "Top of the Class", description: "Reached #1 on a leaderboard.", icon: "crown" },
    { code: "ai-explorer", name: "AI Explorer", description: "Completed an AI lesson.", icon: "brain" },
    { code: "streak-7", name: "7-Day Streak", description: "Built 7 days in a row.", icon: "flame" },
    { code: "competitor", name: "Competitor", description: "Entered a competition.", icon: "trophy" },
    // Referral program (viral growth loop) — recruiter badges by rewarded-referral count.
    { code: "recruiter_bronze", name: "Bronze Recruiter", description: "Referred 1 friend who joined RoboCode.", icon: "user-plus" },
    { code: "recruiter_silver", name: "Silver Recruiter", description: "Referred 5 friends who joined RoboCode.", icon: "users" },
    { code: "recruiter_gold", name: "Gold Recruiter", description: "Referred 25 friends who joined RoboCode.", icon: "crown" },
    // Gamification funnel (GamificationService.completeTask) — generic badges.
    { code: "first_run", name: "First Run", description: "Ran your first try-it example.", icon: "play" },
    { code: "ten_exercises", name: "Ten Exercises", description: "Completed 10 practice exercises.", icon: "check-circle" },
    // Gamification funnel — per-language XP-threshold badges (novice/adept/master).
    ...GAMIFICATION_LANGUAGES.flatMap((lang) =>
      LANGUAGE_BADGE_TIERS.map((tier) => ({
        code: `${lang}_${tier.suffix}`,
        name: `${lang[0].toUpperCase()}${lang.slice(1)} ${tier.label}`,
        description: `Earned ${tier.label.toLowerCase()}-level XP in ${lang}.`,
        icon: "award",
      })),
    ),
  ];
  for (const b of badges) await prisma.badge.create({ data: b });
  async function award(userId: string, code: string) {
    const badge = await prisma.badge.findUnique({ where: { code } });
    if (badge) await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  }
  await award(tariro.id, "first-steps");
  await award(tariro.id, "blink-master");
  await award(tariro.id, "sensor-sleuth");
  await award(tariro.id, "team-player");
  await award(kuda.id, "first-steps");
  await award(ada.id, "first-steps");
  await award(ada.id, "ai-explorer");

  // Courses + lessons + tasks
  async function course(data: AnyJson, lessons: AnyJson[], tasks: AnyJson[]) {
    const c = await prisma.course.create({ data: data as never });
    const courseSlug = String((data as { slug?: string }).slug ?? "");
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i] as { slug?: string; body?: { blocks?: Block[] } };
      const lessonSlug = String(lesson.slug ?? "");
      const blocks = lesson.body?.blocks ?? [];
      const mergedBody = { ...(lesson.body ?? { blocks: [] }), blocks: mergeBakedDiagrams(courseSlug, lessonSlug, blocks) };
      await prisma.lesson.create({ data: { ...(lesson as object), body: mergedBody, courseId: c.id, order: i } as never });
    }
    for (const t of tasks) {
      await prisma.task.create({ data: { ...(t as object), courseId: c.id } as never });
    }
    return c;
  }

  // --- Demo courses: meta + lessons come from content modules; tasks stay here
  //     because they reference BLINK_CODE/blinkDiagram() (imported above) and
  //     ULTRASONIC_CODE/ultrasonicDiagram() (defined above).
  const robotics = await course(
    introRobotics.meta as AnyJson,
    introRobotics.lessons as AnyJson[],
    [
      { title: "Blink an LED", slug: "blink-led", description: "Make the on-board LED blink once per second.", track: "robotics", difficulty: "beginner", points: 50, boardType: "arduino-uno", starterCode: BLINK_CODE, starterDiagram: blinkDiagram(), checks: { rules: [{ type: "pin_toggles", pin: 13 }, { type: "serial_contains", value: "ready" }] } },
      { title: "Distance alarm", slug: "distance-alarm", description: "Sound the buzzer when an object is closer than 15 cm.", track: "robotics", difficulty: "intermediate", points: 100, boardType: "arduino-uno", starterCode: ULTRASONIC_CODE, starterDiagram: ultrasonicDiagram(), checks: { rules: [{ type: "serial_contains", value: "Distance" }] } },
    ],
  );

  await course(
    codingArduino.meta as AnyJson,
    codingArduino.lessons as AnyJson[],
    [
      { title: "Countdown timer", slug: "countdown", description: "Print a countdown from 10 to 0 on the serial monitor.", track: "coding", difficulty: "beginner", points: 50, boardType: "arduino-uno", checks: { rules: [{ type: "serial_contains", value: "0" }] } },
    ],
  );

  await course(
    aiFoundations.meta as AnyJson,
    aiFoundations.lessons as AnyJson[],
    [
      { title: "Gesture light", slug: "gesture-light", description: "Turn an LED on when a sensor detects something near.", track: "ai", difficulty: "intermediate", points: 100, boardType: "arduino-uno", checks: { rules: [{ type: "pin_toggles", pin: 13 }] } },
    ],
  );

  // Language tutorial courses (added by Tasks 11-22; no-op while LANG_MODULES is empty)
  for (const m of LANG_MODULES) {
    await course(m.meta as AnyJson, m.lessons as AnyJson[], (m.tasks ?? []) as AnyJson[]);
  }

  // Robotics deep-dive courses (ESP32, Sensors, Pico, Raspberry Pi, integration)
  for (const m of ROBOTICS_MODULES) {
    await course(m.meta as AnyJson, m.lessons as AnyJson[], (m.tasks ?? []) as AnyJson[]);
  }

  // AI deep-dive courses (Know Your Models, AI Appreciation for Junior School)
  for (const m of AI_MODULES) {
    await course(m.meta as AnyJson, m.lessons as AnyJson[], (m.tasks ?? []) as AnyJson[]);
  }

  // W3Schools-style language tutorial courses (Python, JS, TS, SQL, HTML, CSS, Go, Rust, C/C++, C#, Arduino, MicroPython)
  for (const m of TUTORIAL_MODULES) {
    await course(m.meta as AnyJson, m.lessons as AnyJson[], (m.tasks ?? []) as AnyJson[]);
  }

  // Curated Learning Tracks — run after all courses/tasks above so every item
  // slug in prisma/content/tracks.ts resolves.
  await syncLearningTracks(prisma);

  // Enrollments + progress
  for (const u of [tariro, kuda, chipo, farai, ada]) {
    await prisma.enrollment.create({ data: { userId: u.id, courseId: robotics.id, progress: { percent: 60 } } });
  }

  // Sample projects
  const proj1 = await prisma.project.create({
    data: { ownerId: tariro.id, tenantId: springfield.id, title: "My Blinking LED", description: await aiDescribe("My Blinking LED", "arduino-uno", blinkDiagram(), BLINK_CODE, "An Arduino UNO blinks an LED through a resistor — the perfect first circuit."), boardType: "arduino-uno", diagram: blinkDiagram(), visibility: "tenant" },
  });
  await prisma.codeFile.create({ data: { projectId: proj1.id, authorId: tariro.id, filename: "sketch.ino", language: "arduino", content: BLINK_CODE } });

  const proj2 = await prisma.project.create({
    data: { ownerId: tariro.id, tenantId: springfield.id, title: "Distance Alarm Robot", description: await aiDescribe("Distance Alarm Robot", "arduino-uno", ultrasonicDiagram(), ULTRASONIC_CODE, "An ultrasonic sensor measures distance and sounds the buzzer when something gets too close."), boardType: "arduino-uno", diagram: ultrasonicDiagram(), visibility: "tenant" },
  });
  await prisma.codeFile.create({ data: { projectId: proj2.id, authorId: tariro.id, filename: "sketch.ino", language: "arduino", content: ULTRASONIC_CODE } });

  // Robotics starter templates — 5 per board (Arduino UNO, ESP32, Raspberry Pi
  // Pico). Definitions (title/description/diagram/code) are shared with the
  // idempotent prod seeder — see ./robotics-templates.ts — so there is exactly
  // one place that owns each template's content. Static descriptions (no
  // aiDescribe round-trip) so this stays fast and deterministic for 15 templates.
  for (const t of ROBOTICS_TEMPLATES) {
    const p = await prisma.project.create({
      data: {
        ownerId: teacher.id,
        tenantId: springfield.id,
        title: t.title,
        description: t.description,
        boardType: t.boardType,
        diagram: t.diagram as Prisma.InputJsonValue,
        visibility: "public",
        isTemplate: true,
      },
    });
    await prisma.codeFile.createMany({
      data: t.files.map((f) => ({ projectId: p.id, filename: f.name, language: f.language, content: f.content })),
    });
  }

  // Teams
  const teamA = await prisma.team.create({
    data: { tenantId: springfield.id, name: "Circuit Breakers", kind: "intra_school", captainId: tariro.id, roboPoints: 1430, avatarSeed: "circuit", description: "We make sparks fly." },
  });
  await prisma.teamMember.createMany({
    data: [
      { teamId: teamA.id, userId: tariro.id, role: "captain", status: "active" },
      { teamId: teamA.id, userId: kuda.id, role: "member", status: "active" },
      { teamId: teamA.id, userId: chipo.id, role: "member", status: "active" },
    ],
  });
  const teamB = await prisma.team.create({
    data: { tenantId: springfield.id, name: "Voltage", kind: "intra_school", captainId: farai.id, roboPoints: 350, avatarSeed: "voltage", description: "High energy builders." },
  });
  await prisma.teamMember.create({ data: { teamId: teamB.id, userId: farai.id, role: "captain", status: "active" } });
  await prisma.chatMessage.create({ data: { teamId: teamA.id, userId: tariro.id, body: "Great work on the distance alarm everyone!", status: "approved" } });

  // Competition
  const comp = await prisma.competition.create({
    data: {
      tenantId: springfield.id, title: "Spring Robotics Cup", slug: "spring-robotics-cup", type: "robotics", scope: "intra_school",
      status: "live", description: "Build the smartest obstacle-avoiding robot.",
      startsAt: new Date(Date.now() - 2 * 864e5), endsAt: new Date(Date.now() + 5 * 864e5),
      rules: { judging: "auto+rubric" },
    },
  });
  const round1 = await prisma.round.create({ data: { competitionId: comp.id, name: "Qualifier", order: 0 } });
  const e1 = await prisma.competitionEntry.create({ data: { competitionId: comp.id, teamId: teamA.id, totalScore: 280 } });
  const e2 = await prisma.competitionEntry.create({ data: { competitionId: comp.id, teamId: teamB.id, totalScore: 190 } });
  await prisma.score.create({ data: { competitionId: comp.id, roundId: round1.id, entryId: e1.id, points: 280 } });
  await prisma.score.create({ data: { competitionId: comp.id, roundId: round1.id, entryId: e2.id, points: 190 } });

  // Points ledger (mirrors roboPoints totals roughly) for leaderboard history
  const ledger = [
    { userId: tariro.id, delta: 100, reason: "Completed Distance alarm" },
    { userId: tariro.id, delta: 50, reason: "Completed Blink an LED" },
    { userId: kuda.id, delta: 100, reason: "Completed Distance alarm" },
    { userId: ada.id, delta: 100, reason: "Completed AI task" },
    { userId: chipo.id, delta: 50, reason: "Completed Blink an LED" },
  ];
  for (const l of ledger) await prisma.roboPointLedger.create({ data: { ...l, refType: "task" } });

  // Announcements
  await prisma.announcement.create({
    data: { tenantId: springfield.id, authorId: schoolAdmin.id, title: "Welcome to RoboCode!", body: "Start with Intro to Robotics and earn your first badge.", audience: "all" },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete.\n  Super admin: super@robocode.africa / password123\n  School admin: admin@springfield.robocode.africa / password123\n  Teacher: curie@springfield.robocode.africa / password123\n  Student: tariro@springfield.robocode.africa / password123");
  void pts;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
