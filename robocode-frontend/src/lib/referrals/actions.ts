"use server";

import { apiGet } from "@/lib/api/client";

/** GET /referrals/me response — mirrors the backend's `ReferralStats`. */
export interface ReferralStats {
  code: string;
  url: string;
  totalReferred: number;
  rewardedCount: number;
  pointsEarned: number;
  nextBadgeAt: number | null;
}

/** GET /referrals/leaderboard row — mirrors the backend's `ReferralLeaderboardRow`. */
export interface ReferralLeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarSeed: string;
  rewardedCount: number;
}

export type ReferralLeaderboardScope = "platform" | "tenant";

/** The caller's referral code, share link, and progress toward the next recruiter badge. */
export async function getReferralStats(): Promise<ReferralStats> {
  return apiGet<ReferralStats>("/referrals/me");
}

/** Top referrers — platform-wide by default, or scoped to the caller's own school. */
export async function getReferralLeaderboard(scope: ReferralLeaderboardScope = "platform"): Promise<ReferralLeaderboardRow[]> {
  return apiGet<ReferralLeaderboardRow[]>(`/referrals/leaderboard?scope=${scope}`);
}
