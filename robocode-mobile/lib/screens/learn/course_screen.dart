import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// A single course: header, progress, lesson list and enrol action.
class CourseScreen extends StatefulWidget {
  final String slug;
  const CourseScreen({super.key, required this.slug});
  @override
  State<CourseScreen> createState() => _CourseScreenState();
}

class _CourseScreenState extends State<CourseScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _enrolling = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() => ApiClient.instance
      .get<Map<String, dynamic>>('/learn/courses/${widget.slug}');

  void _reload() => setState(() => _future = _load());

  Future<void> _enroll(String courseId) async {
    if (_enrolling) return;
    setState(() => _enrolling = true);
    try {
      await ApiClient.instance
          .post<Map<String, dynamic>>('/learn/enroll', body: {'courseId': courseId});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enrolled! Time to start learning.')),
      );
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _enrolling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Course')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final course = (data['course'] as Map?) ?? const {};
            final lessons = (course['lessons'] as List?) ?? const [];
            final enrollment = data['enrollment'];
            final isEnrolled = enrollment != null;
            final pct = (data['enrolledPercent'] as num?)?.toDouble() ?? 0;
            final stats = (data['stats'] as Map?) ?? const {};
            final completedIds = ((data['completedLessonIds'] as List?) ?? const [])
                .map((e) => e.toString())
                .toSet();
            final nextLesson = (data['nextLesson'] as Map?);
            final courseId = course['id']?.toString();

            return ListView(
              padding: EdgeInsets.zero,
              children: [
                _header(context, course, isEnrolled, pct, stats),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!isEnrolled && courseId != null) ...[
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed:
                                _enrolling ? null : () => _enroll(courseId),
                            icon: _enrolling
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2, color: Colors.white),
                                  )
                                : const Icon(Icons.add_circle_outline),
                            label: Text(_enrolling ? 'Enrolling…' : 'Enroll'),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ] else if (isEnrolled && nextLesson != null) ...[
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () {
                              final ls = nextLesson['slug']?.toString();
                              if (ls != null) {
                                context.push('/learn/${widget.slug}/$ls');
                              }
                            },
                            icon: const Icon(Icons.play_arrow_rounded),
                            label: Text(
                              pct > 0 ? 'Continue learning' : 'Start course',
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      Text(
                        'Lessons',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      if (lessons.isEmpty)
                        const EmptyState(
                          icon: Icons.list_alt_rounded,
                          message: 'No lessons in this course yet.',
                        )
                      else
                        ...lessons.asMap().entries.map((entry) {
                          final i = entry.key;
                          final lesson = (entry.value as Map?) ?? const {};
                          final id = lesson['id']?.toString();
                          final ls = lesson['slug']?.toString();
                          final done =
                              id != null && completedIds.contains(id);
                          final est = (lesson['estMinutes'] as num?)?.toInt();
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              leading: _lessonLeading(done, i + 1),
                              title: Text(
                                lesson['title']?.toString() ??
                                    'Lesson ${i + 1}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  decoration: done
                                      ? TextDecoration.lineThrough
                                      : null,
                                  color: done
                                      ? Theme.of(context).hintColor
                                      : null,
                                ),
                              ),
                              subtitle: est != null
                                  ? Text('$est min read')
                                  : null,
                              trailing: const Icon(Icons.chevron_right),
                              onTap: ls == null
                                  ? null
                                  : () => context
                                      .push('/learn/${widget.slug}/$ls'),
                            ),
                          );
                        }),
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

  Widget _lessonLeading(bool done, int number) {
    if (done) {
      return Container(
        width: 36,
        height: 36,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: RoboTheme.secondary.withValues(alpha: 0.15),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check_rounded,
            color: RoboTheme.secondary, size: 20),
      );
    }
    return Container(
      width: 36,
      height: 36,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: RoboTheme.primary.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Text(
        '$number',
        style: const TextStyle(
            color: RoboTheme.primary, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _header(
    BuildContext context,
    Map course,
    bool isEnrolled,
    double pct,
    Map stats,
  ) {
    final total = (stats['totalLessons'] as num?)?.toInt() ?? 0;
    final completed = (stats['completedLessons'] as num?)?.toInt() ?? 0;
    final minutes = (stats['totalMinutes'] as num?)?.toInt() ?? 0;
    final track = course['track']?.toString();
    final desc = course['description']?.toString();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
      decoration: const BoxDecoration(
        gradient: RoboTheme.brandGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (track != null && track.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                track.toUpperCase(),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5),
              ),
            ),
          const SizedBox(height: 12),
          Text(
            course['title']?.toString() ?? 'Course',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold),
          ),
          if (desc != null && desc.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              desc,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              _metaPill(Icons.list_alt_rounded, '$total lessons'),
              const SizedBox(width: 10),
              if (minutes > 0)
                _metaPill(Icons.schedule_rounded, '$minutes min'),
            ],
          ),
          if (isEnrolled) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Progress',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
                ),
                Text(
                  '$completed / $total  •  ${pct.round()}%',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: (pct / 100).clamp(0, 1),
                minHeight: 8,
                backgroundColor: Colors.white.withValues(alpha: 0.25),
                valueColor:
                    const AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metaPill(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 15),
          const SizedBox(width: 6),
          Text(label,
              style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }
}
