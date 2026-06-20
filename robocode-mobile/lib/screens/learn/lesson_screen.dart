import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// A single lesson: rendered body, completion action and prev/next navigation.
class LessonScreen extends StatefulWidget {
  final String slug;
  final String lessonSlug;
  const LessonScreen({super.key, required this.slug, required this.lessonSlug});
  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _completing = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() => ApiClient.instance
      .get<Map<String, dynamic>>(
          '/learn/courses/${widget.slug}/lessons/${widget.lessonSlug}');

  void _reload() => setState(() => _future = _load());

  Future<void> _complete(String lessonId, String courseId, Map? nextLesson) async {
    if (_completing) return;
    setState(() => _completing = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>(
        '/learn/complete-lesson',
        body: {'lessonId': lessonId, 'courseId': courseId},
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lesson complete! Nice work.')),
      );
      final nextSlug = nextLesson?['slug']?.toString();
      if (nextSlug != null) {
        context.push('/learn/${widget.slug}/$nextSlug');
      } else {
        _reload();
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _completing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lesson')),
      body: AsyncView<Map<String, dynamic>>(
        future: _future,
        onRetry: _reload,
        builder: (context, data) {
          final course = (data['course'] as Map?) ?? const {};
          final lesson = (data['lesson'] as Map?) ?? const {};
          final lessonIndex = (data['lessonIndex'] as num?)?.toInt();
          final prevLesson = (data['prevLesson'] as Map?);
          final nextLesson = (data['nextLesson'] as Map?);
          final isEnrolled = data['isEnrolled'] == true;
          final isCompleted = data['isCompleted'] == true;
          final est = (lesson['estMinutes'] as num?)?.toInt();
          final lessonId = lesson['id']?.toString();
          final courseId = course['id']?.toString();
          final body = lesson['body']?.toString() ?? '';

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              final cs = course['slug']?.toString() ?? widget.slug;
                              if (context.canPop()) {
                                context.pop();
                              } else {
                                context.push('/learn/$cs');
                              }
                            },
                            child: Text(
                              course['title']?.toString() ?? 'Course',
                              style: const TextStyle(
                                color: RoboTheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        if (isCompleted)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(Icons.check_circle_rounded,
                                  color: RoboTheme.secondary, size: 18),
                              SizedBox(width: 4),
                              Text('Completed',
                                  style: TextStyle(
                                      color: RoboTheme.secondary,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13)),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      lesson['title']?.toString() ?? 'Lesson',
                      style: const TextStyle(
                          fontSize: 26, fontWeight: FontWeight.bold, height: 1.2),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (lessonIndex != null) ...[
                          Icon(Icons.bookmark_border_rounded,
                              size: 16, color: Theme.of(context).hintColor),
                          const SizedBox(width: 4),
                          Text('Lesson ${lessonIndex + 1}',
                              style: TextStyle(
                                  color: Theme.of(context).hintColor,
                                  fontSize: 13)),
                          const SizedBox(width: 16),
                        ],
                        if (est != null) ...[
                          Icon(Icons.schedule_rounded,
                              size: 16, color: Theme.of(context).hintColor),
                          const SizedBox(width: 4),
                          Text('$est min',
                              style: TextStyle(
                                  color: Theme.of(context).hintColor,
                                  fontSize: 13)),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Divider(height: 28),
                    ..._renderBody(context, body),
                  ],
                ),
              ),
              _bottomBar(
                context,
                isEnrolled: isEnrolled,
                isCompleted: isCompleted,
                lessonId: lessonId,
                courseId: courseId,
                prevLesson: prevLesson,
                nextLesson: nextLesson,
              ),
            ],
          );
        },
      ),
    );
  }

  /// Render the markdown-ish body as readable paragraphs. Splits on blank lines
  /// and gives light treatment to heading-style and bullet lines.
  List<Widget> _renderBody(BuildContext context, String body) {
    if (body.trim().isEmpty) {
      return const [
        EmptyState(
          icon: Icons.article_outlined,
          message: 'This lesson has no content yet.',
        ),
      ];
    }
    final blocks = body
        .replaceAll('\r\n', '\n')
        .split(RegExp(r'\n\s*\n'))
        .map((b) => b.trim())
        .where((b) => b.isNotEmpty)
        .toList();

    final widgets = <Widget>[];
    for (final block in blocks) {
      final heading = RegExp(r'^#{1,6}\s+').firstMatch(block);
      final isBullet = block.startsWith('- ') ||
          block.startsWith('* ') ||
          block.startsWith('• ');
      if (heading != null) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 8),
          child: Text(
            block.substring(heading.end).trim(),
            style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold),
          ),
        ));
      } else if (isBullet) {
        for (final line in block.split('\n')) {
          final t = line.replaceFirst(RegExp(r'^[-*•]\s*'), '').trim();
          if (t.isEmpty) continue;
          widgets.add(Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 7, right: 10),
                  child: Icon(Icons.circle, size: 6, color: RoboTheme.primary),
                ),
                Expanded(
                  child: Text(t,
                      style: const TextStyle(fontSize: 15.5, height: 1.5)),
                ),
              ],
            ),
          ));
        }
      } else {
        widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Text(
            block,
            style: const TextStyle(fontSize: 15.5, height: 1.6),
          ),
        ));
      }
    }
    return widgets;
  }

  Widget _bottomBar(
    BuildContext context, {
    required bool isEnrolled,
    required bool isCompleted,
    required String? lessonId,
    required String? courseId,
    required Map? prevLesson,
    required Map? nextLesson,
  }) {
    final prevSlug = prevLesson?['slug']?.toString();
    final nextSlug = nextLesson?['slug']?.toString();

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          border: Border(
            top: BorderSide(
              color: Theme.of(context)
                  .colorScheme
                  .outlineVariant
                  .withValues(alpha: 0.6),
            ),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isEnrolled && lessonId != null && courseId != null)
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: isCompleted
                      ? FilledButton.styleFrom(
                          backgroundColor: RoboTheme.secondary)
                      : null,
                  onPressed: _completing
                      ? null
                      : () => _complete(lessonId, courseId, nextLesson),
                  icon: _completing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : Icon(isCompleted
                          ? Icons.check_circle_rounded
                          : Icons.check_circle_outline),
                  label: Text(_completing
                      ? 'Saving…'
                      : isCompleted
                          ? (nextSlug != null
                              ? 'Completed — next lesson'
                              : 'Completed')
                          : 'Mark complete'),
                ),
              ),
            if (prevSlug != null || nextSlug != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: prevSlug == null
                          ? null
                          : () => context
                              .push('/learn/${widget.slug}/$prevSlug'),
                      icon: const Icon(Icons.arrow_back_rounded, size: 18),
                      label: const Text('Prev'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: nextSlug == null
                          ? null
                          : () => context
                              .push('/learn/${widget.slug}/$nextSlug'),
                      icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                      label: const Text('Next'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
