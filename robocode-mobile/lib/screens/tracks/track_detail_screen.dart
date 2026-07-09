import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../api/tracks_api.dart';
import '../../models/tracks.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// A single track's roadmap: header + progress, an ordered checklist of
/// course/challenge steps (all tappable — soft sequencing, not a hard gate),
/// and a celebration banner with the certificate once every step is done.
class TrackDetailScreen extends StatefulWidget {
  final String slug;
  const TrackDetailScreen({super.key, required this.slug});

  @override
  State<TrackDetailScreen> createState() => _TrackDetailScreenState();
}

class _TrackDetailScreenState extends State<TrackDetailScreen> {
  late Future<TrackDetail> _future;

  @override
  void initState() {
    super.initState();
    _future = TracksApi.instance.detail(widget.slug);
  }

  void _reload() => setState(() => _future = TracksApi.instance.detail(widget.slug));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Track')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            AsyncView<TrackDetail>(
              future: _future,
              onRetry: _reload,
              builder: (context, track) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _header(context, track),
                    if (track.isComplete && track.certificate != null) ...[
                      const SizedBox(height: 16),
                      _certificateBanner(context, track),
                    ],
                    const SizedBox(height: 20),
                    const Text('Roadmap', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    if (track.items.isEmpty)
                      const EmptyState(
                        icon: Icons.checklist_rtl_rounded,
                        message: 'This track has no steps yet — check back soon.',
                      )
                    else
                      Card(
                        margin: EdgeInsets.zero,
                        child: Column(
                          children: [
                            for (final (i, item) in track.items.indexed) ...[
                              if (i > 0) const Divider(height: 1),
                              _ItemRow(item: item, index: i),
                            ],
                          ],
                        ),
                      ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _header(BuildContext context, TrackDetail track) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        gradient: RoboTheme.brandGradient,
        borderRadius: BorderRadius.all(Radius.circular(20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 52,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: track.icon != null && track.icon!.isNotEmpty
                    ? Text(track.icon!, style: const TextStyle(fontSize: 26))
                    : const Icon(Icons.route_rounded, color: Colors.white),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(track.title,
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _headerChip(_cap(track.level)),
                        if (track.language != null) _headerChip(_languageLabel(track.language!)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (track.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(track.description, style: TextStyle(color: Colors.white.withValues(alpha: 0.9))),
          ],
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Progress', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              Text(
                '${track.progress.done}/${track.progress.total} · ${track.progress.percent}%',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.85)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: track.progress.total == 0 ? 0.0 : (track.progress.done / track.progress.total).clamp(0, 1),
              minHeight: 8,
              backgroundColor: Colors.white.withValues(alpha: 0.25),
              valueColor: const AlwaysStoppedAnimation(Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _headerChip(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.16),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
      );

  Widget _certificateBanner(BuildContext context, TrackDetail track) {
    final cert = track.certificate!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RoboTheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: RoboTheme.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            alignment: Alignment.center,
            decoration: const BoxDecoration(gradient: RoboTheme.brandGradient, shape: BoxShape.circle),
            child: const Text('🎓', style: TextStyle(fontSize: 22)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Track complete!', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(
                  'You finished every step of ${track.title}. Your certificate is ready.',
                  style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Share certificate',
            icon: const Icon(Icons.share_rounded, color: RoboTheme.primary),
            onPressed: () =>
                SharePlus.instance.share(ShareParams(text: 'https://robocode.africa/cert/${cert.code}')),
          ),
        ],
      ),
    );
  }
}

class _ItemRow extends StatelessWidget {
  final TrackItem item;
  final int index;
  const _ItemRow({required this.item, required this.index});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: _leadingIcon(context),
      title: Text(
        item.title,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: item.done ? Theme.of(context).hintColor : null,
          decoration: item.done ? TextDecoration.lineThrough : null,
        ),
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            MiniChip(
              icon: item.isCourse ? Icons.menu_book_rounded : Icons.flag_rounded,
              label: item.isCourse ? 'Course' : 'Challenge',
            ),
            if (item.isCourse && item.level != null && item.level!.isNotEmpty)
              MiniChip(icon: Icons.bar_chart_rounded, label: _cap(item.level!), color: _levelColor(item.level!)),
            if (!item.isCourse && item.difficulty != null && item.difficulty!.isNotEmpty)
              MiniChip(
                  icon: Icons.bar_chart_rounded, label: _cap(item.difficulty!), color: _levelColor(item.difficulty!)),
            if (item.language != null && item.language!.isNotEmpty)
              MiniChip(icon: Icons.code_rounded, label: _languageLabel(item.language!), color: Colors.purple),
          ],
        ),
      ),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => item.isCourse ? context.push('/learn/${item.slug}') : context.push('/challenges/${item.slug}'),
    );
  }

  Widget _leadingIcon(BuildContext context) {
    const size = 36.0;
    if (item.done) {
      return Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.35),
          shape: BoxShape.circle,
        ),
        child: Icon(Icons.check_rounded, color: Theme.of(context).hintColor),
      );
    }
    if (item.current) {
      return Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: const BoxDecoration(gradient: RoboTheme.brandGradient, shape: BoxShape.circle),
        child: const Icon(Icons.play_arrow_rounded, color: Colors.white),
      );
    }
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Text(
        '${index + 1}',
        style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).hintColor),
      ),
    );
  }
}

Color _levelColor(String level) {
  switch (level.toLowerCase()) {
    case 'easy':
    case 'beginner':
      return RoboTheme.secondary;
    case 'medium':
    case 'intermediate':
      return RoboTheme.accent;
    case 'hard':
    case 'advanced':
    case 'expert':
      return Colors.redAccent;
    default:
      return RoboTheme.primary;
  }
}

String _cap(String s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';

/// The frozen 12 gamification languages' display labels — mirrors
/// `screens/leaderboards/leaderboards_screen.dart`'s `_languageLabels`
/// (kept local here to avoid coupling two unrelated screens together).
const Map<String, String> _languageLabelOverrides = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'html': 'HTML',
  'css': 'CSS',
  'cpp': 'C++',
  'csharp': 'C#',
  'sql': 'SQL',
  'micropython': 'MicroPython',
};

String _languageLabel(String lang) => _languageLabelOverrides[lang] ?? _cap(lang);
