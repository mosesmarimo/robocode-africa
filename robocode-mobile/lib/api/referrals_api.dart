import '../models/referrals.dart';
import 'api_client.dart';

/// Typed wrapper over [ApiClient] for the backend `referrals` module — the
/// invite hub (code, share link, progress) and the top-referrers leaderboard.
/// Every method throws [ApiException] on a non-2xx response, exactly like the
/// rest of the app.
class ReferralsApi {
  ReferralsApi._();
  static final ReferralsApi instance = ReferralsApi._();

  final ApiClient _api = ApiClient.instance;

  /// `GET /referrals/me` — the caller's code, share link, and progress.
  Future<ReferralStats> stats() async =>
      ReferralStats.fromJson(await _api.get<Map<String, dynamic>>('/referrals/me'));

  /// `GET /referrals/leaderboard?scope=platform|tenant` — top referrers by
  /// rewarded-referral count. Defaults to the platform-wide scope, matching
  /// the backend default.
  Future<List<ReferralLeaderboardRow>> leaderboard({String scope = 'platform'}) async {
    final res = await _api
        .get<List<dynamic>>('/referrals/leaderboard', query: {'scope': scope});
    return res
        .whereType<Map>()
        .map((e) => ReferralLeaderboardRow.fromJson(e.cast<String, dynamic>()))
        .toList(growable: false);
  }
}
