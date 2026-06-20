import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

class CompetitionsScreen extends StatefulWidget {
  const CompetitionsScreen({super.key});
  @override
  State<CompetitionsScreen> createState() => _CompetitionsScreenState();
}

class _CompetitionsScreenState extends State<CompetitionsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/competitions');

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
            final liveCount = (data['liveCount'] as num?)?.toInt() ?? 0;
            final upcomingCount = (data['upcomingCount'] as num?)?.toInt() ?? 0;
            final totalEntrants = (data['totalEntrants'] as num?)?.toInt() ?? 0;
            final grouped = (data['grouped'] as Map?) ?? const {};
            final allCompetitions = (data['competitions'] as List?) ?? const [];

            return ListView(
              children: [
                const BrandHeader(
                  title: 'Competitions',
                  subtitle: 'Compete, climb the standings, win glory',
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
                            icon: Icons.sensors_rounded,
                            label: 'Live',
                            value: '$liveCount',
                            color: RoboTheme.secondary,
                          ),
                          StatTile(
                            icon: Icons.schedule_rounded,
                            label: 'Upcoming',
                            value: '$upcomingCount',
                            color: RoboTheme.accent,
                          ),
                          StatTile(
                            icon: Icons.groups_rounded,
                            label: 'Entrants',
                            value: '$totalEntrants',
                            color: RoboTheme.primary,
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      if (allCompetitions.isEmpty)
                        const EmptyState(
                          icon: Icons.emoji_events_outlined,
                          message: 'No competitions yet. Check back soon!',
                        )
                      else
                        ..._groups(context, grouped, allCompetitions),
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

  List<Widget> _groups(
    BuildContext context,
    Map grouped,
    List allCompetitions,
  ) {
    // Preferred status ordering; any extra statuses are appended after.
    const order = ['LIVE', 'UPCOMING', 'COMPLETED', 'ARCHIVED'];
    final keys = grouped.keys.map((k) => k.toString()).toList();
    keys.sort((a, b) {
      final ia = order.indexOf(a.toUpperCase());
      final ib = order.indexOf(b.toUpperCase());
      final ra = ia == -1 ? order.length : ia;
      final rb = ib == -1 ? order.length : ib;
      if (ra != rb) return ra.compareTo(rb);
      return a.compareTo(b);
    });

    final widgets = <Widget>[];
    for (final status in keys) {
      final list = (grouped[status] as List?) ?? const [];
      if (list.isEmpty) continue;
      widgets.add(Padding(
        padding: const EdgeInsets.only(bottom: 10, top: 4),
        child: Text(
          _statusLabel(status),
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
        ),
      ));
      for (final c in list) {
        widgets.add(_competitionCard(context, c as Map<String, dynamic>));
      }
      widgets.add(const SizedBox(height: 16));
    }
    return widgets;
  }

  Widget _competitionCard(BuildContext context, Map<String, dynamic> c) {
    final slug = c['slug']?.toString() ?? '';
    final title = c['title']?.toString() ?? 'Competition';
    final description = c['description']?.toString();
    final status = c['status']?.toString() ?? '';
    final count = (c['_count'] as Map?) ?? const {};
    final entries = (count['entries'] as num?)?.toInt() ?? 0;
    final startsAt = c['startsAt']?.toString();
    final endsAt = c['endsAt']?.toString();

    return Card(
      child: InkWell(
        onTap: slug.isEmpty ? null : () => context.push('/competitions/$slug'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusChip(status: status),
                ],
              ),
              if (description != null && description.trim().isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Theme.of(context).hintColor),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.groups_rounded,
                      size: 16, color: Theme.of(context).hintColor),
                  const SizedBox(width: 4),
                  Text(
                    '$entries ${entries == 1 ? 'entry' : 'entries'}',
                    style: TextStyle(
                        fontSize: 13, color: Theme.of(context).hintColor),
                  ),
                  const Spacer(),
                  if (_scheduleLabel(startsAt, endsAt) != null) ...[
                    Icon(Icons.event_rounded,
                        size: 16, color: Theme.of(context).hintColor),
                    const SizedBox(width: 4),
                    Text(
                      _scheduleLabel(startsAt, endsAt)!,
                      style: TextStyle(
                          fontSize: 13, color: Theme.of(context).hintColor),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _scheduleLabel(String? startsAt, String? endsAt) {
    final start = _tryDate(startsAt);
    final end = _tryDate(endsAt);
    if (start != null) return 'Starts ${DateFormat.yMMMd().format(start)}';
    if (end != null) return 'Ends ${DateFormat.yMMMd().format(end)}';
    return null;
  }

  DateTime? _tryDate(String? s) {
    if (s == null || s.isEmpty) return null;
    return DateTime.tryParse(s);
  }

  String _statusLabel(String status) {
    final s = status.replaceAll('_', ' ').toLowerCase();
    if (s.isEmpty) return 'Other';
    return s[0].toUpperCase() + s.substring(1);
  }
}

/// Coloured pill that reflects a competition status.
class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final upper = status.toUpperCase();
    Color color;
    switch (upper) {
      case 'LIVE':
        color = RoboTheme.secondary;
        break;
      case 'UPCOMING':
        color = RoboTheme.accent;
        break;
      case 'COMPLETED':
        color = RoboTheme.primary;
        break;
      default:
        color = Colors.grey;
    }
    final label = status.isEmpty
        ? 'Unknown'
        : status.replaceAll('_', ' ').toLowerCase().replaceFirstMapped(
            RegExp(r'^.'), (m) => m.group(0)!.toUpperCase());
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
            color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}
