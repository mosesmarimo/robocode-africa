import { BadRequestException } from "@nestjs/common";
import { ALL_LANGUAGES, GAMIFICATION_TRACKS, type GamificationLanguage, type GamificationTrack } from "../../domain/constants";

/** All-time (every ledger row ever tagged) or this-calendar-week (UTC Monday 00:00 to now). */
export const LEADERBOARD_SCOPES = ["all", "week"] as const;
export type LeaderboardScope = (typeof LEADERBOARD_SCOPES)[number];

/** Anything other than the literal "week" is treated as the (default) all-time scope. */
export function parseScope(raw: unknown): LeaderboardScope {
  return raw === "week" ? "week" : "all";
}

/** Validates the `:language` route param against the frozen 12 — 400s otherwise. */
export function parseLanguageParam(raw: string): GamificationLanguage {
  if (!(ALL_LANGUAGES as readonly string[]).includes(raw)) {
    throw new BadRequestException({
      message: `Unknown language "${raw}". Must be one of: ${ALL_LANGUAGES.join(", ")}`,
    });
  }
  return raw as GamificationLanguage;
}

/** Validates the `:track` route param against {coding, robotics} — 400s otherwise. */
export function parseTrackParam(raw: string): GamificationTrack {
  if (!(GAMIFICATION_TRACKS as readonly string[]).includes(raw)) {
    throw new BadRequestException({
      message: `Unknown track "${raw}". Must be one of: ${GAMIFICATION_TRACKS.join(", ")}`,
    });
  }
  return raw as GamificationTrack;
}

/** A single leaderboard row — display-safe (no email). */
export type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  avatarSeed: string;
  xp: number;
};

/** GET /leaderboards/language/:language and /leaderboards/track/:track response. */
export type LeaderboardResult = {
  rows: LeaderboardRow[];
  me: { rank: number; xp: number } | null;
};
