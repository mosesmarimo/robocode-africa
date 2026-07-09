class TenantSummary {
  final String id;
  final String slug;
  final String name;
  final bool isPlatform;

  TenantSummary({required this.id, required this.slug, required this.name, required this.isPlatform});

  factory TenantSummary.fromJson(Map<String, dynamic> j) => TenantSummary(
        id: j['id']?.toString() ?? '',
        slug: j['slug']?.toString() ?? '',
        name: j['name']?.toString() ?? 'RoboCode.Africa',
        isPlatform: j['isPlatform'] == true,
      );
}

class AppUser {
  final String id;
  final String email;
  final String displayName;
  final String role;
  final String status;
  final String tenantId;
  final bool isMinor;
  final String? avatarSeed;
  final int roboPoints;
  final int level;
  final String? locale;
  final TenantSummary? tenant;
  // Daily-active streak day count (see backend StreakService). Null when the
  // response predates the `streak` field — treated the same as 0.
  final int? streakCount;
  // Forgiving-streak "embers" (0..3) — each absorbs a single missed day.
  // Additive/null-safe: defaults to 0 on older responses. See StreakService.
  final int streakEmbers;
  // Rarer milestone freeze: absorbs a multi-day gap while active. Null when
  // no freeze is currently granted.
  final DateTime? streakFrozenUntil;

  AppUser({
    required this.id,
    required this.email,
    required this.displayName,
    required this.role,
    required this.status,
    required this.tenantId,
    required this.isMinor,
    required this.avatarSeed,
    required this.roboPoints,
    required this.level,
    required this.locale,
    required this.tenant,
    this.streakCount,
    this.streakEmbers = 0,
    this.streakFrozenUntil,
  });

  bool get isStaff => const ['super_admin', 'moderator', 'school_admin', 'teacher'].contains(role);
  bool get isActive => status == 'active';
  String get firstName => displayName.split(' ').first;
  // Small flame indicator only earns its place in the UI once a streak is
  // actually building — a 1-day "streak" isn't worth celebrating.
  bool get hasVisibleStreak => (streakCount ?? 0) >= 2;
  // A freeze is only worth showing while it's still active (future date).
  bool get hasActiveFreeze => streakFrozenUntil != null && streakFrozenUntil!.isAfter(DateTime.now());

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id']?.toString() ?? '',
        email: j['email']?.toString() ?? '',
        displayName: j['displayName']?.toString() ?? '',
        role: j['role']?.toString() ?? 'student',
        status: j['status']?.toString() ?? 'pending',
        tenantId: j['tenantId']?.toString() ?? '',
        isMinor: j['isMinor'] == true,
        avatarSeed: j['avatarSeed']?.toString(),
        roboPoints: (j['roboPoints'] as num?)?.toInt() ?? 0,
        level: (j['level'] as num?)?.toInt() ?? 1,
        locale: j['locale']?.toString(),
        tenant: j['tenant'] is Map<String, dynamic> ? TenantSummary.fromJson(j['tenant']) : null,
        streakCount: (j['streak'] is Map) ? (j['streak']['count'] as num?)?.toInt() : null,
        streakEmbers: (j['streak'] is Map) ? ((j['streak']['embers'] as num?)?.toInt() ?? 0) : 0,
        streakFrozenUntil: (j['streak'] is Map) ? DateTime.tryParse(j['streak']['frozenUntil']?.toString() ?? '') : null,
      );

  static const roleLabels = {
    'super_admin': 'Platform Admin',
    'moderator': 'Moderator',
    'school_admin': 'School Admin',
    'teacher': 'Teacher',
    'student': 'Student',
    'parent': 'Parent / Guardian',
  };

  String get roleLabel => roleLabels[role] ?? role;
}
