// Data models for the backend post-solve solutions gallery (`GET
// /challenges/:taskId/solutions`, `POST /challenges/solutions/:submissionId/like`).
// See robocode-backend src/modules/competitions/competitions.service.ts
// (getChallengeSolutions / toggleSolutionLike) for the source shapes.
//
// The gallery read 403s ("Solve it first to see other solutions.") until the
// caller has themselves passed the task — [SolutionsResult] models that as a
// locked state rather than an error so screens don't need special-case
// try/catch handling around a normal, expected outcome.

/// One other student's anonymized accepted solution for a challenge task.
/// Never carries author info — the backend itself never attaches any.
class SolutionEntry {
  final String submissionId;
  final String language;
  final String code;
  final int likeCount;
  final bool likedByMe;
  final bool exemplar;

  const SolutionEntry({
    required this.submissionId,
    required this.language,
    required this.code,
    required this.likeCount,
    required this.likedByMe,
    required this.exemplar,
  });

  factory SolutionEntry.fromJson(Map<String, dynamic> j) => SolutionEntry(
        submissionId: j['submissionId']?.toString() ?? '',
        language: j['language']?.toString() ?? '',
        code: j['code']?.toString() ?? '',
        likeCount: (j['likeCount'] as num?)?.toInt() ?? 0,
        likedByMe: j['likedByMe'] == true,
        exemplar: j['exemplar'] == true,
      );
}

/// Wrapper for the raw `{ solutions: [...] }` envelope.
class SolutionsGallery {
  final List<SolutionEntry> solutions;
  const SolutionsGallery(this.solutions);

  static const empty = SolutionsGallery([]);

  factory SolutionsGallery.fromJson(Map<String, dynamic> j) {
    final raw = j['solutions'];
    if (raw is! List) return SolutionsGallery.empty;
    return SolutionsGallery(
      raw
          .whereType<Map>()
          .map((e) => SolutionEntry.fromJson(e.cast<String, dynamic>()))
          .toList(growable: false),
    );
  }
}

/// Outcome of `SolutionsApi.solutions` — either the gallery (possibly empty)
/// or a locked state carrying the backend's "solve it first" message.
class SolutionsResult {
  final bool locked;
  final String? lockedMessage;
  final SolutionsGallery gallery;

  const SolutionsResult._({required this.locked, this.lockedMessage, required this.gallery});

  factory SolutionsResult.unlocked(SolutionsGallery gallery) =>
      SolutionsResult._(locked: false, gallery: gallery);

  factory SolutionsResult.locked([String? message]) => SolutionsResult._(
        locked: true,
        lockedMessage: message ?? 'Solve it first to see other solutions.',
        gallery: SolutionsGallery.empty,
      );
}
