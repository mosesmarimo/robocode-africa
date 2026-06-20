import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

class ChallengesScreen extends StatefulWidget {
  const ChallengesScreen({super.key});
  @override
  State<ChallengesScreen> createState() => _ChallengesScreenState();
}

class _ChallengesScreenState extends State<ChallengesScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.get<Map<String, dynamic>>('/challenges');
  }

  void _reload() => setState(() => _future = ApiClient.instance.get<Map<String, dynamic>>('/challenges'));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final tasks = (data['tasks'] as List?) ?? [];
            final bestStatus = (data['bestStatus'] as Map?) ?? {};
            final passed = (data['passedCount'] as num?)?.toInt() ?? 0;
            final total = (data['totalCount'] as num?)?.toInt() ?? tasks.length;
            return ListView(
              children: [
                BrandHeader(
                  title: 'Challenges',
                  subtitle: '$passed of $total solved',
                  trailing: const Icon(Icons.flag_rounded, color: Colors.white, size: 32),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _progress(context, passed, total),
                      const SizedBox(height: 20),
                      if (tasks.isEmpty)
                        const EmptyState(icon: Icons.flag_outlined, message: 'No challenges available yet.')
                      else
                        ...tasks.map((t) {
                          final task = (t as Map?) ?? {};
                          final status = bestStatus[task['id']?.toString()]?.toString() ??
                              bestStatus[task['id']]?.toString();
                          return _taskCard(context, task, status);
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

  Widget _progress(BuildContext context, int passed, int total) {
    final pct = total == 0 ? 0.0 : passed / total;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Your progress', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('$passed / $total', style: const TextStyle(fontWeight: FontWeight.bold, color: RoboTheme.secondary)),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(value: pct.clamp(0, 1), minHeight: 10),
            ),
          ],
        ),
      ),
    );
  }

  Widget _taskCard(BuildContext context, Map task, String? status) {
    final slug = task['slug']?.toString() ?? '';
    final title = task['title']?.toString() ?? 'Challenge';
    final difficulty = task['difficulty']?.toString() ?? '';
    final track = task['track']?.toString() ?? '';
    final points = (task['points'] as num?)?.toInt() ?? 0;
    final s = statusInfo(status);
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: s.color.withValues(alpha: 0.12),
          child: Icon(s.icon, color: s.color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (difficulty.isNotEmpty) DifficultyChip(difficulty: difficulty),
              PointsChip(points: points),
              if (track.isNotEmpty) TrackChip(track: track),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: slug.isEmpty ? null : () => context.push('/challenges/$slug'),
      ),
    );
  }
}

/// Maps a bestStatus value (passed / attempted / null) to an icon + colour.
class StatusInfo {
  final IconData icon;
  final Color color;
  final String label;
  const StatusInfo(this.icon, this.color, this.label);
}

StatusInfo statusInfo(String? status) {
  switch (status?.toLowerCase()) {
    case 'passed':
    case 'pass':
    case 'accepted':
    case 'solved':
      return const StatusInfo(Icons.check_circle, RoboTheme.secondary, 'Passed');
    case 'attempted':
    case 'failed':
    case 'fail':
    case 'partial':
      return const StatusInfo(Icons.timelapse, RoboTheme.accent, 'Attempted');
    default:
      return const StatusInfo(Icons.radio_button_unchecked, Colors.grey, 'Not started');
  }
}

class DifficultyChip extends StatelessWidget {
  final String difficulty;
  const DifficultyChip({super.key, required this.difficulty});

  @override
  Widget build(BuildContext context) {
    Color c;
    switch (difficulty.toLowerCase()) {
      case 'easy':
      case 'beginner':
        c = RoboTheme.secondary;
        break;
      case 'medium':
      case 'intermediate':
        c = RoboTheme.accent;
        break;
      case 'hard':
      case 'advanced':
      case 'expert':
        c = Colors.redAccent;
        break;
      default:
        c = RoboTheme.primary;
    }
    return _MiniChip(icon: Icons.bar_chart_rounded, label: _cap(difficulty), color: c);
  }
}

class PointsChip extends StatelessWidget {
  final int points;
  const PointsChip({super.key, required this.points});
  @override
  Widget build(BuildContext context) =>
      _MiniChip(icon: Icons.bolt, label: '$points pts', color: RoboTheme.primary);
}

class TrackChip extends StatelessWidget {
  final String track;
  const TrackChip({super.key, required this.track});
  @override
  Widget build(BuildContext context) =>
      _MiniChip(icon: Icons.route_rounded, label: _cap(track), color: Colors.purple);
}

class _MiniChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _MiniChip({required this.icon, required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.20)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}

String _cap(String s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';
