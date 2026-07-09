// Data models for the backend `referrals` module (`GET /referrals/me`,
// `GET /referrals/leaderboard`). See robocode-backend
// src/modules/referrals/dto.ts for the source shapes.

/// Wrapper for `GET /referrals/me` — the caller's stable referral code, share
/// link, and progress toward the next recruiter badge.
class ReferralStats {
  final String code;
  final String url;
  final int totalReferred;
  final int rewardedCount;
  final int pointsEarned;
  final int? nextBadgeAt;

  ReferralStats({
    required this.code,
    required this.url,
    required this.totalReferred,
    required this.rewardedCount,
    required this.pointsEarned,
    required this.nextBadgeAt,
  });

  factory ReferralStats.fromJson(Map<String, dynamic> j) => ReferralStats(
        code: j['code']?.toString() ?? '',
        url: j['url']?.toString() ?? '',
        totalReferred: (j['totalReferred'] as num?)?.toInt() ?? 0,
        rewardedCount: (j['rewardedCount'] as num?)?.toInt() ?? 0,
        pointsEarned: (j['pointsEarned'] as num?)?.toInt() ?? 0,
        nextBadgeAt: (j['nextBadgeAt'] as num?)?.toInt(),
      );
}

/// A single row in `GET /referrals/leaderboard` — display-safe (no email).
class ReferralLeaderboardRow {
  final int rank;
  final String userId;
  final String displayName;
  final String avatarSeed;
  final int rewardedCount;

  ReferralLeaderboardRow({
    required this.rank,
    required this.userId,
    required this.displayName,
    required this.avatarSeed,
    required this.rewardedCount,
  });

  factory ReferralLeaderboardRow.fromJson(Map<String, dynamic> j) => ReferralLeaderboardRow(
        rank: (j['rank'] as num?)?.toInt() ?? 0,
        userId: j['userId']?.toString() ?? '',
        displayName: j['displayName']?.toString() ?? 'User',
        avatarSeed: j['avatarSeed']?.toString() ?? 'robo',
        rewardedCount: (j['rewardedCount'] as num?)?.toInt() ?? 0,
      );
}
