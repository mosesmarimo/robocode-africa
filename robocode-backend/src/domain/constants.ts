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
  DAILY_STREAK: 25,
  COMPETITION_WIN: 500,
  COMPETITION_PARTICIPATE: 75,
  FIRST_SIMULATION: 30,
} as const;

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

export const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";
export const APP_NAME = process.env.APP_NAME ?? "RoboCode.Africa";
