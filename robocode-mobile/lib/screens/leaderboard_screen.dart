import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../theme.dart';
import '../widgets/common.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});
  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/leaderboard');

  Future<void> _reload() async => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AsyncView<Map<String, dynamic>>(
        future: _future,
        onRetry: _reload,
        builder: (context, data) {
          final students = (data['students'] as List?) ?? [];
          final teams = (data['teams'] as List?) ?? [];
          final schools = (data['schools'] as List?) ?? [];
          final currentUserId = data['currentUserId']?.toString();
          final currentTenantId = data['currentTenantId']?.toString();
          final userStudentRank = (data['userStudentRank'] as num?)?.toInt();
          final userSchoolRank = (data['userSchoolRank'] as num?)?.toInt();
          final totalStudents = (data['totalStudents'] as num?)?.toInt() ?? students.length;

          return DefaultTabController(
            length: 3,
            child: NestedScrollView(
              headerSliverBuilder: (context, _) => [
                SliverToBoxAdapter(
                  child: BrandHeader(
                    title: 'Leaderboard',
                    subtitle: '$totalStudents ${totalStudents == 1 ? 'learner' : 'learners'} competing',
                    trailing: const Icon(Icons.emoji_events_rounded, color: Colors.white, size: 28),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                    child: Row(
                      children: [
                        Expanded(
                          child: StatTile(
                            icon: Icons.person_rounded,
                            label: 'Your rank',
                            value: userStudentRank != null ? '#$userStudentRank' : '—',
                            color: RoboTheme.primary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatTile(
                            icon: Icons.school_rounded,
                            label: 'School rank',
                            value: userSchoolRank != null ? '#$userSchoolRank' : '—',
                            color: RoboTheme.secondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: TabBar(
                    labelColor: RoboTheme.primary,
                    indicatorColor: RoboTheme.primary,
                    tabs: [
                      Tab(text: 'Students'),
                      Tab(text: 'Teams'),
                      Tab(text: 'Schools'),
                    ],
                  ),
                ),
              ],
              body: TabBarView(
                children: [
                  _StudentsTab(students: students, currentUserId: currentUserId, onRetry: _reload),
                  _TeamsTab(teams: teams, onRetry: _reload),
                  _SchoolsTab(
                    schools: schools,
                    currentTenantId: currentTenantId,
                    onRetry: _reload,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _StudentsTab extends StatelessWidget {
  final List<dynamic> students;
  final String? currentUserId;
  final Future<void> Function() onRetry;
  const _StudentsTab({required this.students, required this.currentUserId, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    if (students.isEmpty) {
      return const EmptyState(
        icon: Icons.leaderboard_outlined,
        message: 'No students on the leaderboard yet.',
      );
    }
    return RefreshIndicator(
      onRefresh: onRetry,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        itemCount: students.length,
        itemBuilder: (context, i) {
          final s = students[i] as Map<String, dynamic>;
          final id = s['id']?.toString();
          final name = s['displayName']?.toString() ?? 'Student';
          final points = (s['roboPoints'] as num?)?.toInt() ?? 0;
          final level = (s['computedLevel'] as num?)?.toInt() ??
              (s['level'] as num?)?.toInt() ??
              1;
          final isMe = id != null && id == currentUserId;
          return _RankRow(
            rank: i + 1,
            highlight: isMe,
            leading: SeedAvatar(seed: id, name: name, size: 40),
            title: name,
            subtitle: 'Level $level',
            trailing: _PointsBadge(points: points),
          );
        },
      ),
    );
  }
}

class _TeamsTab extends StatelessWidget {
  final List<dynamic> teams;
  final Future<void> Function() onRetry;
  const _TeamsTab({required this.teams, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    if (teams.isEmpty) {
      return const EmptyState(
        icon: Icons.groups_outlined,
        message: 'No teams on the leaderboard yet.',
      );
    }
    return RefreshIndicator(
      onRefresh: onRetry,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        itemCount: teams.length,
        itemBuilder: (context, i) {
          final t = teams[i] as Map<String, dynamic>;
          final name = t['name']?.toString() ?? 'Team';
          final points = (t['roboPoints'] as num?)?.toInt() ?? 0;
          final count = t['_count'] is Map
              ? ((t['_count'] as Map)['members'] as num?)?.toInt() ?? 0
              : 0;
          return _RankRow(
            rank: i + 1,
            highlight: false,
            leading: _TeamIcon(name: name),
            title: name,
            subtitle: '$count ${count == 1 ? 'member' : 'members'}',
            trailing: _PointsBadge(points: points),
          );
        },
      ),
    );
  }
}

class _SchoolsTab extends StatelessWidget {
  final List<dynamic> schools;
  final String? currentTenantId;
  final Future<void> Function() onRetry;
  const _SchoolsTab({required this.schools, required this.currentTenantId, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    if (schools.isEmpty) {
      return const EmptyState(
        icon: Icons.account_balance_outlined,
        message: 'No schools on the leaderboard yet.',
      );
    }
    return RefreshIndicator(
      onRefresh: onRetry,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        itemCount: schools.length,
        itemBuilder: (context, i) {
          final s = schools[i] as Map<String, dynamic>;
          final tenantId = s['tenantId']?.toString();
          final name = s['name']?.toString() ?? 'School';
          final points = (s['totalPoints'] as num?)?.toInt() ?? 0;
          final studentCount = (s['studentCount'] as num?)?.toInt() ?? 0;
          final isMine = tenantId != null && tenantId == currentTenantId;
          return _RankRow(
            rank: i + 1,
            highlight: isMine,
            leading: _SchoolIcon(name: name),
            title: name,
            subtitle: '$studentCount ${studentCount == 1 ? 'student' : 'students'}',
            trailing: _PointsBadge(points: points),
          );
        },
      ),
    );
  }
}

/// Medal color for ranks 1-3, otherwise null.
Color? _medalColor(int rank) {
  switch (rank) {
    case 1:
      return const Color(0xFFFFC107); // gold
    case 2:
      return const Color(0xFFB0BEC5); // silver
    case 3:
      return const Color(0xFFCD7F32); // bronze
    default:
      return null;
  }
}

class _RankRow extends StatelessWidget {
  final int rank;
  final bool highlight;
  final Widget leading;
  final String title;
  final String subtitle;
  final Widget trailing;
  const _RankRow({
    required this.rank,
    required this.highlight,
    required this.leading,
    required this.title,
    required this.subtitle,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final medal = _medalColor(rank);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: highlight
            ? RoboTheme.primary.withValues(alpha: 0.10)
            : Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: highlight
              ? RoboTheme.primary.withValues(alpha: 0.45)
              : Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.6),
          width: highlight ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 34,
            child: medal != null
                ? Icon(Icons.workspace_premium_rounded, color: medal, size: 26)
                : Text(
                    '#$rank',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).hintColor,
                    ),
                  ),
          ),
          const SizedBox(width: 8),
          leading,
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    if (highlight) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: RoboTheme.primary,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('You',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          trailing,
        ],
      ),
    );
  }
}

class _PointsBadge extends StatelessWidget {
  final int points;
  const _PointsBadge({required this.points});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text('$points',
            style: const TextStyle(
                fontWeight: FontWeight.bold, fontSize: 16, color: RoboTheme.primary)),
        Text('pts', style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor)),
      ],
    );
  }
}

class _TeamIcon extends StatelessWidget {
  final String name;
  const _TeamIcon({required this.name});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: RoboTheme.secondary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(Icons.groups_rounded, color: RoboTheme.secondary),
    );
  }
}

class _SchoolIcon extends StatelessWidget {
  final String name;
  const _SchoolIcon({required this.name});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: RoboTheme.accent.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(Icons.account_balance_rounded, color: RoboTheme.accent),
    );
  }
}
