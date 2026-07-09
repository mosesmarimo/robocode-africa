import 'package:flutter/material.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/atom-one-dark.dart';

import '../../api/api_client.dart';
import '../../api/solutions_api.dart';
import '../../models/solutions.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Display labels for the frozen gamification languages (see
/// robocode-backend/src/domain/constants.ts `ALL_LANGUAGES`) — mirrors the
/// map in `screens/leaderboards/leaderboards_screen.dart`.
const Map<String, String> _languageLabels = {
  'python': 'Python',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'html': 'HTML',
  'css': 'CSS',
  'go': 'Go',
  'rust': 'Rust',
  'cpp': 'C++',
  'csharp': 'C#',
  'sql': 'SQL',
  'arduino': 'Arduino',
  'micropython': 'MicroPython',
};

/// Maps a gamification language id to a highlight.js language id — mirrors
/// `_hlLang` in `widgets/rich_content.dart`.
const Map<String, String> _hlLang = {
  'python': 'python',
  'javascript': 'javascript',
  'typescript': 'typescript',
  'html': 'xml',
  'css': 'css',
  'go': 'go',
  'rust': 'rust',
  'cpp': 'cpp',
  'csharp': 'cs',
  'sql': 'sql',
  'arduino': 'cpp',
  'micropython': 'python',
};

/// Opens the post-solve solutions gallery for [taskId] as a modal bottom
/// sheet — other students' anonymized accepted solutions, read-only, with a
/// like toggle. Only meaningful to open once the caller has passed the task;
/// the backend still gates the read itself, so an early/direct call just
/// renders the "solve it first" locked state instead of erroring.
Future<void> showSolutionsGallery(BuildContext context, {required String taskId, String? taskTitle}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _SolutionsGallerySheet(taskId: taskId, taskTitle: taskTitle),
  );
}

class _SolutionsGallerySheet extends StatefulWidget {
  final String taskId;
  final String? taskTitle;
  const _SolutionsGallerySheet({required this.taskId, this.taskTitle});

  @override
  State<_SolutionsGallerySheet> createState() => _SolutionsGallerySheetState();
}

class _SolutionsGallerySheetState extends State<_SolutionsGallerySheet> {
  late Future<SolutionsResult> _future;

  @override
  void initState() {
    super.initState();
    _future = SolutionsApi.instance.solutions(widget.taskId);
  }

  void _reload() => setState(() => _future = SolutionsApi.instance.solutions(widget.taskId));

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.85,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Row(
              children: [
                const Icon(Icons.groups_rounded, color: RoboTheme.primary),
                const SizedBox(width: 8),
                const Expanded(child: SectionTitle('Solutions gallery')),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: AsyncView<SolutionsResult>(
              future: _future,
              onRetry: _reload,
              builder: (context, result) {
                if (result.locked) {
                  return EmptyState(
                    icon: Icons.lock_outline_rounded,
                    message: result.lockedMessage ?? 'Solve it first to see other solutions.',
                  );
                }
                final solutions = result.gallery.solutions;
                if (solutions.isEmpty) {
                  return const EmptyState(
                    icon: Icons.groups_outlined,
                    message: 'No other solutions yet — check back soon!',
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  itemCount: solutions.length,
                  itemBuilder: (context, i) => _SolutionCard(entry: solutions[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// A single read-only, anonymized solution card: language + exemplar badges,
/// syntax-highlighted code (horizontally scrollable for long lines), and a
/// like button toggled optimistically against the backend — mirrors
/// `_PostCardState._toggleLike` in `widgets/social_widgets.dart`.
class _SolutionCard extends StatefulWidget {
  final SolutionEntry entry;
  const _SolutionCard({required this.entry});

  @override
  State<_SolutionCard> createState() => _SolutionCardState();
}

class _SolutionCardState extends State<_SolutionCard> {
  late bool _liked;
  late int _likeCount;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _liked = widget.entry.likedByMe;
    _likeCount = widget.entry.likeCount;
  }

  Future<void> _toggleLike() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      // Optimistic flip.
      _liked = !_liked;
      _likeCount += _liked ? 1 : -1;
    });
    try {
      final res = await SolutionsApi.instance.likeSolution(widget.entry.submissionId);
      if (!mounted) return;
      setState(() {
        _liked = res['liked'] == true;
        _likeCount = (res['likeCount'] as num?)?.toInt() ?? _likeCount;
      });
    } catch (e) {
      if (!mounted) return;
      // Roll back the optimistic update.
      setState(() {
        _liked = !_liked;
        _likeCount += _liked ? 1 : -1;
      });
      final msg = e is ApiException ? e.message : 'Could not reach the server. Check your connection.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.entry;
    final hlLang = _hlLang[e.language] ?? 'plaintext';
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF282C34),
          borderRadius: BorderRadius.circular(12),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
              child: Row(
                children: [
                  MiniChip(
                    icon: Icons.code_rounded,
                    label: _languageLabels[e.language] ?? e.language,
                    color: RoboTheme.secondary,
                  ),
                  if (e.exemplar) ...[
                    const SizedBox(width: 6),
                    const MiniChip(
                      icon: Icons.workspace_premium_rounded,
                      label: 'Exemplar',
                      color: RoboTheme.accent,
                    ),
                  ],
                  const Spacer(),
                  _likeButton(),
                ],
              ),
            ),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: HighlightView(
                e.code,
                language: hlLang,
                theme: atomOneDarkTheme,
                padding: const EdgeInsets.all(12),
                textStyle: const TextStyle(fontFamily: 'monospace', fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _likeButton() {
    final color = _liked ? Colors.red.shade400 : Colors.white70;
    return InkWell(
      onTap: _busy ? null : _toggleLike,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(_liked ? Icons.favorite_rounded : Icons.favorite_border_rounded, size: 18, color: color),
            const SizedBox(width: 4),
            Text('$_likeCount', style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
