// Data models for the backend `tracks` module (`GET /tracks`, `GET
// /tracks/:slug`, `GET /certificates`). See
// robocode-backend/src/modules/tracks/tracks.service.ts for the source
// shapes.

/// The `{ code, issuedAt }` certificate reference embedded in a track summary
/// or detail response — present once the track is fully completed.
class TrackCertificateRef {
  final String code;
  final DateTime issuedAt;

  TrackCertificateRef({required this.code, required this.issuedAt});

  factory TrackCertificateRef.fromJson(Map<String, dynamic> j) => TrackCertificateRef(
        code: j['code']?.toString() ?? '',
        issuedAt: DateTime.tryParse(j['issuedAt']?.toString() ?? '') ?? DateTime.now(),
      );
}

/// A row from `GET /tracks` — a published learning track with derived
/// progress and (if earned) its certificate.
class TrackSummary {
  final String slug;
  final String title;
  final String description;
  final String track; // "robotics" | "coding" | "ai"
  final String? language;
  final String level;
  final String? icon;
  final int itemCount;
  final int doneCount;
  final TrackCertificateRef? certificate;

  TrackSummary({
    required this.slug,
    required this.title,
    required this.description,
    required this.track,
    required this.language,
    required this.level,
    required this.icon,
    required this.itemCount,
    required this.doneCount,
    required this.certificate,
  });

  double get percent => itemCount == 0 ? 0.0 : (doneCount / itemCount).clamp(0, 1).toDouble();

  factory TrackSummary.fromJson(Map<String, dynamic> j) => TrackSummary(
        slug: j['slug']?.toString() ?? '',
        title: j['title']?.toString() ?? '',
        description: j['description']?.toString() ?? '',
        track: j['track']?.toString() ?? 'coding',
        language: j['language']?.toString(),
        level: j['level']?.toString() ?? 'beginner',
        icon: j['icon']?.toString(),
        itemCount: (j['itemCount'] as num?)?.toInt() ?? 0,
        doneCount: (j['doneCount'] as num?)?.toInt() ?? 0,
        certificate: j['certificate'] is Map
            ? TrackCertificateRef.fromJson((j['certificate'] as Map).cast<String, dynamic>())
            : null,
      );
}

/// One step in a track's roadmap — either a course or a challenge, with its
/// done/current state derived server-side.
class TrackItem {
  final String type; // "course" | "challenge"
  final String slug;
  final String title;
  final String? language;
  final String? level; // course only
  final String? difficulty; // challenge only
  final bool done;
  final bool current;

  TrackItem({
    required this.type,
    required this.slug,
    required this.title,
    required this.language,
    required this.level,
    required this.difficulty,
    required this.done,
    required this.current,
  });

  bool get isCourse => type == 'course';

  factory TrackItem.fromJson(Map<String, dynamic> j) => TrackItem(
        type: j['type']?.toString() ?? 'course',
        slug: j['slug']?.toString() ?? '',
        title: j['title']?.toString() ?? '',
        language: j['language']?.toString(),
        level: j['level']?.toString(),
        difficulty: j['difficulty']?.toString(),
        done: j['done'] == true,
        current: j['current'] == true,
      );
}

/// `{ done, total, percent }` progress summary within `GET /tracks/:slug`.
class TrackProgress {
  final int done;
  final int total;
  final int percent;

  TrackProgress({required this.done, required this.total, required this.percent});

  factory TrackProgress.fromJson(Map<String, dynamic> j) => TrackProgress(
        done: (j['done'] as num?)?.toInt() ?? 0,
        total: (j['total'] as num?)?.toInt() ?? 0,
        percent: (j['percent'] as num?)?.toInt() ?? 0,
      );
}

/// `GET /tracks/:slug` — a single track's items with per-item done/current
/// state, plus overall progress and certificate (if earned).
class TrackDetail {
  final String slug;
  final String title;
  final String description;
  final String track;
  final String? language;
  final String level;
  final String? icon;
  final TrackProgress progress;
  final TrackCertificateRef? certificate;
  final List<TrackItem> items;

  TrackDetail({
    required this.slug,
    required this.title,
    required this.description,
    required this.track,
    required this.language,
    required this.level,
    required this.icon,
    required this.progress,
    required this.certificate,
    required this.items,
  });

  bool get isComplete => progress.total > 0 && progress.done == progress.total;

  factory TrackDetail.fromJson(Map<String, dynamic> j) => TrackDetail(
        slug: j['slug']?.toString() ?? '',
        title: j['title']?.toString() ?? '',
        description: j['description']?.toString() ?? '',
        track: j['track']?.toString() ?? 'coding',
        language: j['language']?.toString(),
        level: j['level']?.toString() ?? 'beginner',
        icon: j['icon']?.toString(),
        progress: j['progress'] is Map
            ? TrackProgress.fromJson((j['progress'] as Map).cast<String, dynamic>())
            : TrackProgress(done: 0, total: 0, percent: 0),
        certificate: j['certificate'] is Map
            ? TrackCertificateRef.fromJson((j['certificate'] as Map).cast<String, dynamic>())
            : null,
        items: (j['items'] as List? ?? const [])
            .whereType<Map>()
            .map((e) => TrackItem.fromJson(e.cast<String, dynamic>()))
            .toList(growable: false),
      );
}

/// A row from `GET /certificates` — one of the current user's earned
/// certificates (track-completion, for now).
class CertificateModel {
  final String code;
  final String title;
  final String kind;
  final String? trackSlug;
  final DateTime issuedAt;

  CertificateModel({
    required this.code,
    required this.title,
    required this.kind,
    required this.trackSlug,
    required this.issuedAt,
  });

  /// Public share URL — see robocode-backend `/cert/:code` verify page.
  String get shareUrl => 'https://robocode.africa/cert/$code';

  factory CertificateModel.fromJson(Map<String, dynamic> j) => CertificateModel(
        code: j['code']?.toString() ?? '',
        title: j['title']?.toString() ?? 'Certificate',
        kind: j['kind']?.toString() ?? 'track',
        trackSlug: j['trackSlug']?.toString(),
        issuedAt: DateTime.tryParse(j['issuedAt']?.toString() ?? '') ?? DateTime.now(),
      );
}
