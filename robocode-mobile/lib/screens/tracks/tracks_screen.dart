import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/tracks_api.dart';
import '../../models/tracks.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Display order + label for the `track` field — same vocabulary as
/// Task/Course (robocode-backend/src/domain/constants.ts `TRACKS`).
const List<String> _trackOrder = ['robotics', 'coding', 'ai'];
const Map<String, String> _trackLabels = {
  'robotics': 'Robotics',
  'coding': 'Coding',
  'ai': 'AI',
};

/// Browse curated learning tracks — grouped by Robotics/Coding/AI — each a
/// path of courses + challenges that ends in a certificate.
class TracksScreen extends StatefulWidget {
  const TracksScreen({super.key});
  @override
  State<TracksScreen> createState() => _TracksScreenState();
}

class _TracksScreenState extends State<TracksScreen> {
  late Future<List<TrackSummary>> _future;

  @override
  void initState() {
    super.initState();
    _future = TracksApi.instance.list();
  }

  void _reload() => setState(() => _future = TracksApi.instance.list());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: ListView(
          children: [
            const BrandHeader(
              title: 'Learning Tracks',
              subtitle: 'Curated paths that end in a certificate',
              trailing: Icon(Icons.route_rounded, color: Colors.white, size: 28),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: AsyncView<List<TrackSummary>>(
                future: _future,
                onRetry: _reload,
                builder: (context, tracks) {
                  if (tracks.isEmpty) {
                    return const EmptyState(
                      icon: Icons.route_outlined,
                      message: 'No tracks available yet. Check back soon!',
                    );
                  }
                  final grouped = <String, List<TrackSummary>>{
                    for (final t in _trackOrder) t: [],
                  };
                  for (final t in tracks) {
                    (grouped[t.track] ??= []).add(t);
                  }
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final key in _trackOrder)
                        if ((grouped[key] ?? const []).isNotEmpty)
                          _trackSection(context, key, grouped[key]!),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _trackSection(BuildContext context, String track, List<TrackSummary> items) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 10),
            child: Row(
              children: [
                Container(
                  width: 4,
                  height: 18,
                  decoration: BoxDecoration(color: RoboTheme.primary, borderRadius: BorderRadius.circular(2)),
                ),
                const SizedBox(width: 8),
                Text(_trackLabels[track] ?? track, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          ...items.map((t) => _TrackCard(track: t)),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _TrackCard extends StatelessWidget {
  final TrackSummary track;
  const _TrackCard({required this.track});

  @override
  Widget build(BuildContext context) {
    final certified = track.certificate != null;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/tracks/${track.slug}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: RoboTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: track.icon != null && track.icon!.isNotEmpty
                        ? Text(track.icon!, style: const TextStyle(fontSize: 22))
                        : const Icon(Icons.route_rounded, color: RoboTheme.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(track.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 2),
                        Text(
                          track.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 13, color: Theme.of(context).hintColor),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(value: track.percent, minHeight: 8),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Text(
                    '${track.doneCount}/${track.itemCount} complete',
                    style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor),
                  ),
                  const Spacer(),
                  if (certified) const _CertifiedChip(),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// "🎓 Certified" pill shown on a track card once its certificate is earned.
class _CertifiedChip extends StatelessWidget {
  const _CertifiedChip();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: RoboTheme.primary.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: RoboTheme.primary.withValues(alpha: 0.20)),
      ),
      child: const Text(
        '🎓 Certified',
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: RoboTheme.primary),
      ),
    );
  }
}
