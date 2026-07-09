import "server-only";

// Data + metadata for the leaderboards page (src/app/app/leaderboards) and the
// per-course "Top learners" widget. Plain `server-only` (not `"use server"`)
// because these are read-only lookups called exclusively from Server
// Components (the leaderboards page, the course detail page) — never from a
// "use client" component. Keep it that way: a client component importing
// this module at module scope would 500 (server-only import boundary).
import { apiGet } from "@/lib/api/client";

export type LeaderboardScope = "all" | "week";
export type LeaderboardTrack = "coding" | "robotics";

export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarSeed: string;
  xp: number;
}

export interface LeaderboardMe {
  rank: number;
  xp: number;
}

export interface LeaderboardResult {
  rows: LeaderboardRow[];
  me: LeaderboardMe | null;
}

/** The frozen 12 gamification languages, with display labels + their track —
 * mirrors robocode-backend/src/domain/constants.ts ALL_LANGUAGES exactly.
 * Labels match src/lib/studio/coding.ts CODE_LANGUAGES where they overlap
 * (kept as a separate list here so this feature has no dependency on the
 * Coding Studio module). DO NOT add or remove entries — frozen by product
 * decision. */
export interface LeaderboardLanguage {
  id: string;
  label: string;
  track: LeaderboardTrack;
}

export const LEADERBOARD_LANGUAGES: LeaderboardLanguage[] = [
  { id: "python", label: "Python", track: "coding" },
  { id: "javascript", label: "JavaScript", track: "coding" },
  { id: "typescript", label: "TypeScript", track: "coding" },
  { id: "html", label: "HTML", track: "coding" },
  { id: "css", label: "CSS", track: "coding" },
  { id: "go", label: "Go", track: "coding" },
  { id: "rust", label: "Rust", track: "coding" },
  { id: "cpp", label: "C/C++", track: "coding" },
  { id: "csharp", label: "C#", track: "coding" },
  { id: "sql", label: "SQL", track: "coding" },
  { id: "arduino", label: "Arduino", track: "robotics" },
  { id: "micropython", label: "MicroPython", track: "robotics" },
];

const LEADERBOARD_LANGUAGE_IDS = new Set(LEADERBOARD_LANGUAGES.map((l) => l.id));

/** True iff `id` is one of the frozen 12 — guards against passing an
 * arbitrary string through to the backend route param. */
export function isLeaderboardLanguage(id: string): boolean {
  return LEADERBOARD_LANGUAGE_IDS.has(id);
}

export function languageLabel(id: string): string {
  return LEADERBOARD_LANGUAGES.find((l) => l.id === id)?.label ?? id;
}

/** GET /leaderboards/language/:language?scope=all|week — top 50 + the
 * caller's own rank, tagged to a single frozen language. */
export async function getLanguageLeaderboard(
  language: string,
  scope: LeaderboardScope = "all",
): Promise<LeaderboardResult> {
  return apiGet<LeaderboardResult>(
    `/leaderboards/language/${encodeURIComponent(language)}?scope=${scope}`,
  );
}

/** GET /leaderboards/track/:track?scope=all|week — top 50 + the caller's own
 * rank, summed across every language in that track (coding|robotics). */
export async function getTrackLeaderboard(
  track: LeaderboardTrack,
  scope: LeaderboardScope = "all",
): Promise<LeaderboardResult> {
  return apiGet<LeaderboardResult>(`/leaderboards/track/${track}?scope=${scope}`);
}
