export const TRACKS = ["robotics", "coding", "ai"] as const;
export type Track = (typeof TRACKS)[number];

export const TRACK_LABELS: Record<Track, string> = {
  robotics: "Robotics",
  coding: "Coding",
  ai: "AI",
};

export const LEVELS = ["primary", "high"] as const;
export type Level = (typeof LEVELS)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const USER_STATUS = ["pending", "active", "suspended", "rejected"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const PROJECT_VISIBILITY = ["private", "tenant", "public"] as const;

// RoboPoints earning rules.
export const POINTS = {
  TASK_BEGINNER: 50,
  TASK_INTERMEDIATE: 100,
  TASK_ADVANCED: 200,
  LESSON_COMPLETE: 20,
  PROJECT_CREATE: 10,
  PROJECT_SHARE: 15,
  PROJECT_REMIX_AUTHOR: 10, // paid to the ORIGINAL author when someone remixes their shared project
  DAILY_STREAK: 25,
  COMPETITION_WIN: 500,
  COMPETITION_PARTICIPATE: 75,
  FIRST_SIMULATION: 30,
  FRIEND_CONNECT: 15,
  FIRST_POST: 10,
  GROUP_CREATE: 20,
  REFERRAL_REFERRER: 150,
  REFERRAL_WELCOME: 50,
} as const;

// Per-user daily cap on tryit/exercise XP-awarding completions via
// POST /learn/complete-task — a backstop against XP farming on top of
// LearnService.completeTask's refId-to-real-block validation (defense in
// depth: even a bug in that validation can only be farmed up to this much
// XP per user per UTC day). Resets at UTC midnight (see startOfTodayUtc in
// learn.service.ts).
export const INTERACTIVE_TASK_DAILY_CAP = 100;

// Referral program (viral growth loop) tuning.
// Per-referrer cap on rewarded (paid-out) referrals per UTC day — blocks
// sign-up-farming without penalizing genuinely popular referrers (they just
// roll over to the next day).
export const REFERRAL_DAILY_REWARD_CAP = 20;

// "Recruiter" badges, awarded (idempotently) as a referrer's rewardedCount
// crosses each threshold. Badge rows for these codes must exist in the Badge
// table (see prisma/seed.ts) or PointsService.awardBadge silently no-ops.
export const RECRUITER_BADGES = [
  { threshold: 1, code: "recruiter_bronze" },
  { threshold: 5, code: "recruiter_silver" },
  { threshold: 25, code: "recruiter_gold" },
] as const;

// XP needed scales per level: level n needs n*250 cumulative bands.
export function levelForPoints(points: number): number {
  let level = 1;
  let need = 250;
  let acc = 0;
  while (points >= acc + need) {
    acc += need;
    level += 1;
    need = Math.round(need * 1.35);
  }
  return level;
}

export function levelProgress(points: number): { level: number; into: number; span: number; pct: number } {
  let level = 1;
  let need = 250;
  let acc = 0;
  while (points >= acc + need) {
    acc += need;
    level += 1;
    need = Math.round(need * 1.35);
  }
  const into = points - acc;
  return { level, into, span: need, pct: Math.min(100, Math.round((into / need) * 100)) };
}

// ----------------------------------------------------------------------------
// Gamification: frozen language/track set, XP table, completeTask helpers.
//
// FROZEN SET (12) — do not add or remove languages here. Coding (10) mirrors
// modules/ai/dto.ts CODE_LANGUAGES 1:1 (kept as a separate literal so this
// domain-layer file has no dependency on a feature module); robotics (2) is
// {arduino, micropython}. Keep both lists in sync by hand if either changes —
// which, per product decision, should be never.
// ----------------------------------------------------------------------------
export const CODING_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "html",
  "css",
  "go",
  "rust",
  "cpp",
  "csharp",
  "sql",
] as const;
export type CodingLanguage = (typeof CODING_LANGUAGES)[number];

export const ROBOTICS_LANGUAGES = ["arduino", "micropython"] as const;
export type RoboticsLanguage = (typeof ROBOTICS_LANGUAGES)[number];

/** The frozen 12: 10 coding languages + 2 robotics languages. */
export const ALL_LANGUAGES = [...CODING_LANGUAGES, ...ROBOTICS_LANGUAGES] as const;
export type GamificationLanguage = (typeof ALL_LANGUAGES)[number];

export type GamificationTrack = "coding" | "robotics";
export const GAMIFICATION_TRACKS = ["coding", "robotics"] as const;

/** `track` for a given language — robotics for {arduino,micropython}, coding for the 10 coding languages, null for anything else (e.g. no language / unrecognized). */
export function trackForLanguage(language?: string | null): GamificationTrack | null {
  if (!language) return null;
  if ((ROBOTICS_LANGUAGES as readonly string[]).includes(language)) return "robotics";
  if ((CODING_LANGUAGES as readonly string[]).includes(language)) return "coding";
  return null;
}

/** Every completion type GamificationService.completeTask funnels. */
export const TASK_TYPES = [
  "lesson",
  "tutorial-lesson",
  "tryit",
  "exercise",
  "challenge",
  "course-complete",
  "track-complete",
] as const;
export type GamificationTaskType = (typeof TASK_TYPES)[number];

/**
 * XP table (verbatim from the gamification plan). `challenge` is deliberately
 * absent — its XP varies by Task.difficulty, so callers must resolve it via
 * `challengeXp(difficulty)` and pass the result as `completeTask`'s
 * `xpOverride` rather than relying on a flat per-type constant.
 */
export const GAMIFICATION_XP: Record<Exclude<GamificationTaskType, "challenge">, number> = {
  lesson: 20,
  "tutorial-lesson": 15,
  tryit: 5,
  exercise: 25,
  "course-complete": 100,
  // Server-emitted only — the client POST /learn/complete-task path only
  // resolves tryit/exercise blocks, so this type is unreachable from clients.
  "track-complete": 150,
};

export const CHALLENGE_XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  beginner: 50,
  intermediate: 100,
  advanced: 150,
};

/** challenge-pass XP for a given Task.difficulty (50/100/150). */
export function challengeXp(difficulty: string): number {
  return (
    CHALLENGE_XP_BY_DIFFICULTY[difficulty as Difficulty] ?? CHALLENGE_XP_BY_DIFFICULTY.beginner
  );
}

/**
 * Per-language XP-threshold badges (`<language>_novice/adept/master`, badge
 * rows seeded in prisma/seed.ts) — checked against the user's all-time XP sum
 * tagged with that language every time completeTask records a new (non-repeat)
 * award for it.
 */
export const LANGUAGE_BADGE_THRESHOLDS = [
  { threshold: 50, suffix: "novice" },
  { threshold: 200, suffix: "adept" },
  { threshold: 500, suffix: "master" },
] as const;

export const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";
export const APP_NAME = process.env.APP_NAME ?? "RoboCode.Africa";

// Unlike ROOT_DOMAIN above (a bare hostname used to build tenant subdomains,
// e.g. `${slug}.${ROOT_DOMAIN}`), FRONTEND_ORIGIN carries a scheme (e.g.
// "https://robocode.africa") and no trailing slash. Use this whenever
// building an absolute, clickable URL for users (share links, emails, etc).
// FRONTEND_ORIGIN may be a comma-separated CORS allow-list (see main.ts) —
// take the first entry as the canonical public origin.
export const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")[0]
  .trim()
  .replace(/\/+$/, "");
