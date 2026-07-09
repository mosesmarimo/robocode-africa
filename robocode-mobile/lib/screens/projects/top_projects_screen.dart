import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/project_api.dart';
import '../../models/project.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// AI-ranked projects leaderboard.
class TopProjectsScreen extends StatefulWidget {
  const TopProjectsScreen({super.key});
  @override
  State<TopProjectsScreen> createState() => _TopProjectsScreenState();
}

class _TopProjectsScreenState extends State<TopProjectsScreen> {
  late Future<List<ProjectSummary>> _future;

  @override
  void initState() {
    super.initState();
    _future = ProjectApi.instance.top();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Top Projects')),
      body: AsyncView<List<ProjectSummary>>(
        future: _future,
        onRetry: () => setState(() => _future = ProjectApi.instance.top()),
        builder: (context, items) {
          if (items.isEmpty) {
            return const EmptyState(icon: Icons.emoji_events_outlined, message: 'No ranked projects yet.');
          }
          return RefreshIndicator(
            onRefresh: () async => setState(() => _future = ProjectApi.instance.top()),
            child: TopProjectsList(items: items),
          );
        },
      ),
    );
  }
}

/// Hermetic, data-driven ranked list (testable without network).
class TopProjectsList extends StatelessWidget {
  final List<ProjectSummary> items;
  const TopProjectsList({super.key, required this.items});

  static const _medals = [Color(0xFFFFB020), Color(0xFF9AA7BD), Color(0xFFCD7F32)];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, i) => _RankCard(rank: i + 1, item: items[i], medal: i < 3 ? _medals[i] : null),
    );
  }
}

class _RankCard extends StatelessWidget {
  final int rank;
  final ProjectSummary item;
  final Color? medal;
  const _RankCard({required this.rank, required this.item, this.medal});

  @override
  Widget build(BuildContext context) {
    final isCoding = (item.kind ?? '') == 'coding';
    final hint = Theme.of(context).hintColor;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: (medal ?? RoboTheme.primary).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text('$rank',
                      style: TextStyle(fontWeight: FontWeight.bold, color: medal ?? RoboTheme.primary)),
                ),
                const SizedBox(width: 12),
                Icon(isCoding ? Icons.code_rounded : Icons.memory_rounded, size: 20, color: hint),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(item.title,
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
                if (item.aiScore != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: RoboTheme.secondary.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('${item.aiScore}',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: RoboTheme.secondary)),
                  ),
              ],
            ),
            if (item.ownerName != null && item.ownerName!.isNotEmpty) ...[
              const SizedBox(height: 10),
              InkWell(
                onTap: item.ownerId == null ? null : () => context.push('/social/users/${item.ownerId}'),
                child: Row(
                  children: [
                    SeedAvatar(seed: item.ownerSeed, name: item.ownerName!, size: 22),
                    const SizedBox(width: 8),
                    Text(item.ownerName!, style: TextStyle(fontSize: 13, color: hint)),
                  ],
                ),
              ),
            ],
            if (item.aiScoreData != null) ...[
              const SizedBox(height: 12),
              _ScoreBreakdown(data: item.aiScoreData!),
            ],
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => context.push('/studio/${item.id}'),
                icon: const Icon(Icons.open_in_new_rounded, size: 16),
                label: const Text('Open in Studio'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScoreBreakdown extends StatelessWidget {
  final AiScoreData data;
  const _ScoreBreakdown({required this.data});

  @override
  Widget build(BuildContext context) {
    final dims = <(String, int)>[
      ('Useful', data.usefulness),
      ('Innovation', data.innovation),
      ('Original', data.originality),
      ('Complexity', data.complexity),
    ];
    return Row(
      children: [
        for (final (label, value) in dims)
          Expanded(
            child: Column(
              children: [
                Text('$value', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(label, style: TextStyle(fontSize: 10.5, color: Theme.of(context).hintColor)),
              ],
            ),
          ),
      ],
    );
  }
}
