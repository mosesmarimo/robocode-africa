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
  });

  bool get isStaff => const ['super_admin', 'moderator', 'school_admin', 'teacher'].contains(role);
  bool get isActive => status == 'active';
  String get firstName => displayName.split(' ').first;

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
