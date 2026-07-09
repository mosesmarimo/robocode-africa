// Data models for the backend `leaderboards` module (`GET
// /leaderboards/language/:language`, `GET /leaderboards/track/:track`). See
// robocode-backend src/modules/leaderboard/dto.ts for the source shapes.

/// A single ranked row — display-safe (no email).
class LeaderboardRow {
  final int rank;
  final String userId;
  final String displayName;
  final String avatarSeed;
  final int xp;

  LeaderboardRow({
    required this.rank,
    required this.userId,
    required this.displayName,
    required this.avatarSeed,
    required this.xp,
  });

  factory LeaderboardRow.fromJson(Map<String, dynamic> j) => LeaderboardRow(
        rank: (j['rank'] as num?)?.toInt() ?? 0,
        userId: j['userId']?.toString() ?? '',
        displayName: j['displayName']?.toString() ?? 'User',
        avatarSeed: j['avatarSeed']?.toString() ?? 'robo',
        xp: (j['xp'] as num?)?.toInt() ?? 0,
      );
}

/// The caller's own rank + xp within the full (not just top-50) ranking —
/// null when they have no XP tagged for this language/track/scope at all.
class LeaderboardMe {
  final int rank;
  final int xp;

  LeaderboardMe({required this.rank, required this.xp});

  factory LeaderboardMe.fromJson(Map<String, dynamic> j) => LeaderboardMe(
        rank: (j['rank'] as num?)?.toInt() ?? 0,
        xp: (j['xp'] as num?)?.toInt() ?? 0,
      );
}

/// Wrapper for both `GET /leaderboards/language/:language` and `GET
/// /leaderboards/track/:track` — identical response shape.
class LeaderboardResult {
  final List<LeaderboardRow> rows;
  final LeaderboardMe? me;

  LeaderboardResult({required this.rows, required this.me});

  factory LeaderboardResult.fromJson(Map<String, dynamic> j) => LeaderboardResult(
        rows: (j['rows'] as List? ?? const [])
            .whereType<Map>()
            .map((e) => LeaderboardRow.fromJson(e.cast<String, dynamic>()))
            .toList(growable: false),
        me: j['me'] is Map ? LeaderboardMe.fromJson((j['me'] as Map).cast<String, dynamic>()) : null,
      );
}
