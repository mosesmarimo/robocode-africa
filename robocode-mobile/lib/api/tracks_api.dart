import '../models/tracks.dart';
import 'api_client.dart';

/// Typed wrapper over [ApiClient] for the backend `tracks` module — curated
/// course+challenge learning paths with derived progress and certificates.
/// Every method throws [ApiException] on a non-2xx response (including 404
/// for an unknown track slug), exactly like the rest of the app.
class TracksApi {
  TracksApi._();
  static final TracksApi instance = TracksApi._();

  final ApiClient _api = ApiClient.instance;

  /// `GET /tracks` — all published tracks with progress + certificate.
  Future<List<TrackSummary>> list() async {
    final res = await _api.get<Map<String, dynamic>>('/tracks');
    return (res['tracks'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => TrackSummary.fromJson(e.cast<String, dynamic>()))
        .toList(growable: false);
  }

  /// `GET /tracks/:slug` — a single track's roadmap. Throws [ApiException]
  /// with status 404 for an unknown/unpublished slug.
  Future<TrackDetail> detail(String slug) async {
    final res = await _api.get<Map<String, dynamic>>('/tracks/$slug');
    return TrackDetail.fromJson(res);
  }

  /// `GET /certificates` — the current user's earned certificates.
  Future<List<CertificateModel>> myCertificates() async {
    final res = await _api.get<Map<String, dynamic>>('/certificates');
    return (res['certificates'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => CertificateModel.fromJson(e.cast<String, dynamic>()))
        .toList(growable: false);
  }
}
