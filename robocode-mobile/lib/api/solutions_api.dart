import '../models/solutions.dart';
import 'api_client.dart';

/// Typed wrapper over [ApiClient] for the backend post-solve solutions
/// gallery. Mirrors `ChallengesController` in robocode-backend
/// src/modules/competitions/competitions.controller.ts. Every method throws
/// [ApiException] on an unexpected non-2xx response, exactly like the rest of
/// the app — except [solutions], which treats its documented 403 as data (see
/// below) rather than an error.
class SolutionsApi {
  SolutionsApi._();
  static final SolutionsApi instance = SolutionsApi._();

  final ApiClient _api = ApiClient.instance;

  /// `GET /challenges/:taskId/solutions` — up to 20 other students'
  /// anonymized accepted solutions, ordered by likes then recency. The
  /// backend 403s with a "solve it first" message until the caller has
  /// themselves passed [taskId]; that's an expected, common outcome (most
  /// visits to a challenge happen before it's solved), so it's surfaced as
  /// [SolutionsResult.locked] instead of propagating an [ApiException].
  Future<SolutionsResult> solutions(String taskId) async {
    try {
      final res = await _api.get<Map<String, dynamic>>('/challenges/$taskId/solutions');
      return SolutionsResult.unlocked(SolutionsGallery.fromJson(res));
    } on ApiException catch (e) {
      if (e.status == 403) return SolutionsResult.locked(e.message);
      rethrow;
    }
  }

  /// `POST /challenges/solutions/:submissionId/like` — idempotent toggle.
  /// Returns the raw `{liked, likeCount}` map so callers can reconcile their
  /// optimistic UI update against the server's authoritative count.
  Future<Map<String, dynamic>> likeSolution(String submissionId) => _api
      .post<Map<String, dynamic>>('/challenges/solutions/$submissionId/like', body: const {});
}
