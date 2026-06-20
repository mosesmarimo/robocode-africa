import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Browse all courses, grouped by track, with overall learning stats.
class LearnScreen extends StatefulWidget {
  const LearnScreen({super.key});
  @override
  State<LearnScreen> createState() => _LearnScreenState();
}

class _LearnScreenState extends State<LearnScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/learn/courses');

  void _reload() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final stats = (data['stats'] as Map?) ?? const {};
            final grouped = (data['grouped'] as Map?) ?? const {};
            final enrollMap = (data['enrollMap'] as Map?) ?? const {};
            final trackOrder = (data['trackOrder'] as List?) ?? const [];
            final allCourses = (data['courses'] as List?) ?? const [];

            // Build the track ordering, falling back to whatever appears in grouped.
            final tracks = <String>[
              for (final t in trackOrder) t.toString(),
            ];
            for (final k in grouped.keys) {
              if (!tracks.contains(k.toString())) tracks.add(k.toString());
            }

            return ListView(
              children: [
                const BrandHeader(
                  title: 'Learn',
                  subtitle: 'Courses, lessons & tracks',
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GridView.count(
                        crossAxisCount: 3,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.95,
                        children: [
                          StatTile(
                            icon: Icons.menu_book_rounded,
                            label: 'Courses',
                            value: '${(stats['totalCourses'] as num?)?.toInt() ?? allCourses.length}',
                            color: RoboTheme.primary,
                          ),
                          StatTile(
                            icon: Icons.school_rounded,
                            label: 'Enrolled',
                            value: '${(stats['enrolledCount'] as num?)?.toInt() ?? 0}',
                            color: RoboTheme.secondary,
                          ),
                          StatTile(
                            icon: Icons.verified_rounded,
                            label: 'Completed',
                            value: '${(stats['completedCount'] as num?)?.toInt() ?? 0}',
                            color: RoboTheme.accent,
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      if (allCourses.isEmpty)
                        const EmptyState(
                          icon: Icons.menu_book_outlined,
                          message: 'No courses available yet. Check back soon!',
                        )
                      else
                        for (final track in tracks)
                          _trackSection(
                            context,
                            track,
                            (grouped[track] as List?) ?? const [],
                            enrollMap,
                          ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _trackSection(
    BuildContext context,
    String track,
    List<dynamic> courses,
    Map enrollMap,
  ) {
    if (courses.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 4, bottom: 10),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: RoboTheme.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _prettyTrack(track),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 8),
              Text(
                '${courses.length}',
                style: TextStyle(fontSize: 13, color: Theme.of(context).hintColor),
              ),
            ],
          ),
        ),
        ...courses.map((c) {
          final course = (c as Map?) ?? const {};
          final slug = course['slug']?.toString();
          final id = course['id']?.toString();
          final count = (course['_count'] as Map?) ?? const {};
          final lessons = (count['lessons'] as num?)?.toInt() ?? 0;
          final desc = course['description']?.toString();
          final pctNum = id == null ? null : (enrollMap[id] as num?);
          final pct = pctNum?.toDouble();

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: slug == null ? null : () => context.push('/learn/$slug'),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: RoboTheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.auto_stories_rounded,
                              color: RoboTheme.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                course['title']?.toString() ?? 'Course',
                                style: const TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '$lessons lesson${lessons == 1 ? '' : 's'}',
                                style: TextStyle(
                                    fontSize: 12,
                                    color: Theme.of(context).hintColor),
                              ),
                            ],
                          ),
                        ),
                        if (pct != null)
                          _pctChip(pct)
                        else
                          const Icon(Icons.chevron_right),
                      ],
                    ),
                    if (desc != null && desc.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        desc,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            fontSize: 13, color: Theme.of(context).hintColor),
                      ),
                    ],
                    if (pct != null) ...[
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: (pct / 100).clamp(0, 1),
                          minHeight: 6,
                          backgroundColor:
                              RoboTheme.primary.withValues(alpha: 0.12),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _pctChip(double pct) {
    final done = pct >= 100;
    final color = done ? RoboTheme.secondary : RoboTheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        done ? 'Done' : '${pct.round()}%',
        style: TextStyle(
            color: color, fontWeight: FontWeight.w700, fontSize: 12),
      ),
    );
  }

  String _prettyTrack(String t) {
    if (t.isEmpty) return 'Courses';
    return t
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .split(' ')
        .where((w) => w.isNotEmpty)
        .map((w) => '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}')
        .join(' ');
  }
}
