import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import 'challenges_screen.dart';

class ChallengeScreen extends StatefulWidget {
  final String slug;
  const ChallengeScreen({super.key, required this.slug});
  @override
  State<ChallengeScreen> createState() => _ChallengeScreenState();
}

class _ChallengeScreenState extends State<ChallengeScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/challenges/${widget.slug}');

  void _reload() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Challenge')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final task = (data['task'] as Map?) ?? {};
            final submissions = (data['submissions'] as List?) ?? [];
            final isPassed = data['isPassed'] == true;
            final best = (data['bestSubmission'] as Map?);

            final title = task['title']?.toString() ?? 'Challenge';
            final description = (task['prompt'] ?? task['description'])?.toString() ?? '';
            final difficulty = task['difficulty']?.toString() ?? '';
            final track = task['track']?.toString() ?? '';
            final points = (task['points'] as num?)?.toInt() ?? 0;

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if (difficulty.isNotEmpty) DifficultyChip(difficulty: difficulty),
                    PointsChip(points: points),
                    if (track.isNotEmpty) TrackChip(track: track),
                  ],
                ),
                const SizedBox(height: 16),
                _banner(isPassed, best),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('About this challenge', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text(description, style: const TextStyle(height: 1.4)),
                        ],
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                _studioNote(),
                const SizedBox(height: 20),
                const Text('Submission history', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (submissions.isEmpty)
                  const EmptyState(icon: Icons.history_rounded, message: 'No submissions yet.')
                else
                  ...submissions.map((s) => _submissionTile(context, (s as Map?) ?? {})),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _banner(bool isPassed, Map? best) {
    if (!isPassed) return const SizedBox.shrink();
    final score = (best?['score'] as num?);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RoboTheme.secondary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: RoboTheme.secondary.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          const Icon(Icons.emoji_events_rounded, color: RoboTheme.secondary, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Challenge passed!', style: TextStyle(fontWeight: FontWeight.bold, color: RoboTheme.secondary)),
                if (score != null) Text('Best score: ${_fmtScore(score)}', style: const TextStyle(fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _studioNote() {
    return Card(
      color: RoboTheme.primary.withValues(alpha: 0.06),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.computer_rounded, color: RoboTheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Solve on the web', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    'There is no code editor on mobile. Solve and submit challenges in the RoboCode Studio on the web. Your submissions appear here.',
                    style: TextStyle(fontSize: 13, color: Theme.of(context).hintColor, height: 1.35),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _submissionTile(BuildContext context, Map sub) {
    final status = sub['status']?.toString();
    final score = (sub['score'] as num?);
    final created = sub['createdAt']?.toString();
    final info = statusInfo(status);
    return Card(
      child: ListTile(
        leading: Icon(info.icon, color: info.color),
        title: Text(info.label, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(_fmtDate(created)),
        trailing: score == null
            ? null
            : Text(_fmtScore(score), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
    );
  }

  String _fmtScore(num score) {
    final d = score.toDouble();
    return d == d.roundToDouble() ? d.toInt().toString() : d.toStringAsFixed(1);
  }

  String _fmtDate(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    return DateFormat.yMMMd().add_jm().format(dt.toLocal());
  }
}
