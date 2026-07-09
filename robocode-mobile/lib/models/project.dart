int _int(dynamic v) => v is int ? v : (v is num ? v.toInt() : int.tryParse('$v') ?? 0);
String _s(dynamic v) => v?.toString() ?? '';

class AiScoreData {
  final int usefulness, innovation, originality, complexity, overall;
  final String summary;
  const AiScoreData({required this.usefulness, required this.innovation, required this.originality, required this.complexity, required this.overall, required this.summary});
  factory AiScoreData.fromJson(Map j) => AiScoreData(
        usefulness: _int(j['usefulness']), innovation: _int(j['innovation']),
        originality: _int(j['originality']), complexity: _int(j['complexity']),
        overall: _int(j['overall']), summary: _s(j['summary']));
}

class ProjectDetail {
  final String id, title, boardType;
  final String? kind, description, thumbnail, ownerId;
  const ProjectDetail({required this.id, required this.title, required this.boardType, this.kind, this.description, this.thumbnail, this.ownerId});
  factory ProjectDetail.fromJson(Map j) {
    final p = (j['project'] is Map) ? j['project'] as Map : j;
    return ProjectDetail(
      id: _s(p['id']), title: _s(p['title']), boardType: _s(p['boardType']),
      kind: p['kind']?.toString(), description: p['description']?.toString(),
      thumbnail: p['thumbnail']?.toString(), ownerId: p['ownerId']?.toString());
  }
}

class ProjectSummary {
  final String id, title;
  final String? description, kind, boardType, ownerId, ownerName, ownerSeed;
  final int? aiScore;
  final AiScoreData? aiScoreData;
  const ProjectSummary({required this.id, required this.title, this.description, this.kind, this.boardType, this.ownerId, this.ownerName, this.ownerSeed, this.aiScore, this.aiScoreData});
  factory ProjectSummary.fromJson(Map j) {
    final owner = (j['owner'] is Map) ? j['owner'] as Map : const {};
    return ProjectSummary(
      id: _s(j['id']), title: _s(j['title']),
      description: j['description']?.toString(), kind: j['kind']?.toString(),
      boardType: j['boardType']?.toString(),
      ownerId: owner['id']?.toString(), ownerName: owner['displayName']?.toString(),
      ownerSeed: owner['avatarSeed']?.toString(),
      aiScore: j['aiScore'] == null ? null : _int(j['aiScore']),
      aiScoreData: (j['aiScoreData'] is Map) ? AiScoreData.fromJson(j['aiScoreData'] as Map) : null);
  }
  static List<ProjectSummary> listFromTop(dynamic body) {
    if (body is! Map || body['projects'] is! List) return const [];
    return [for (final p in (body['projects'] as List)) if (p is Map) ProjectSummary.fromJson(p)];
  }
}
