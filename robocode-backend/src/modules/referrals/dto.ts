/** Leaderboard scope: platform-wide (all tenants) or restricted to the caller's tenant. */
export const REFERRAL_LEADERBOARD_SCOPES = ["platform", "tenant"] as const;
export type ReferralLeaderboardScope = (typeof REFERRAL_LEADERBOARD_SCOPES)[number];

/** Anything other than the literal "tenant" is treated as the (default) platform scope. */
export function parseLeaderboardScope(raw: unknown): ReferralLeaderboardScope {
  return raw === "tenant" ? "tenant" : "platform";
}

/** GET /referrals/me response — the caller's code, share link and progress. */
export type ReferralStats = {
  code: string;
  url: string;
  totalReferred: number;
  rewardedCount: number;
  pointsEarned: number;
  nextBadgeAt: number | null;
};

/** GET /referrals/leaderboard row — display-safe (no email). */
export type ReferralLeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  avatarSeed: string;
  rewardedCount: number;
};
