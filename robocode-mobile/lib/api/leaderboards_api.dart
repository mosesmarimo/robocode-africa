import '../models/leaderboards.dart';
import 'api_client.dart';

/// Typed wrapper over [ApiClient] for the backend `leaderboards` module —
/// per-language and per-track XP rankings (top 50 + the caller's own rank).
/// Every method throws [ApiException] on a non-2xx response, exactly like the
/// rest of the app.
class LeaderboardsApi {
  LeaderboardsApi._();
  static final LeaderboardsApi instance = LeaderboardsApi._();

  final ApiClient _api = ApiClient.instance;

  /// `GET /leaderboards/language/:language?scope=all|week`. [language] must
  /// be one of the frozen 12 (see `screens/leaderboards/leaderboards_screen.dart`);
  /// the backend 400s otherwise.
  Future<LeaderboardResult> languageBoard(String language, {String scope = 'all'}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/leaderboards/language/$language',
      query: {'scope': scope},
    );
    return LeaderboardResult.fromJson(res);
  }

  /// `GET /leaderboards/track/:track?scope=all|week`. [track] must be
  /// `coding` or `robotics`; the backend 400s otherwise.
  Future<LeaderboardResult> trackBoard(String track, {String scope = 'all'}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/leaderboards/track/$track',
      query: {'scope': scope},
    );
    return LeaderboardResult.fromJson(res);
  }
}
