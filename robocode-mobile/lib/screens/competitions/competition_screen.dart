import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import 'competitions_screen.dart' show StatusChip;

class CompetitionScreen extends StatefulWidget {
  final String slug;
  const CompetitionScreen({super.key, required this.slug});
  @override
  State<CompetitionScreen> createState() => _CompetitionScreenState();
}

class _CompetitionScreenState extends State<CompetitionScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _entering = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/competitions/${widget.slug}');

  void _reload() => setState(() => _future = _load());

  Future<void> _enter(String competitionId) async {
    setState(() => _entering = true);
    try {
      await ApiClient.instance
          .post<Map<String, dynamic>>('/competitions/$competitionId/enter', body: {});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You have entered the competition!')),
      );
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _entering = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Competition')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final competition = (data['competition'] as Map?) ?? const {};
            final hasEntered = data['hasEntered'] == true;
            final canEnter = data['canEnter'] == true;

            final id = competition['id']?.toString() ?? '';
            final title = competition['title']?.toString() ?? 'Competition';
            final status = competition['status']?.toString() ?? '';
            final description = competition['description']?.toString();
            final rounds = (competition['rounds'] as List?) ?? const [];
            final entries = (competition['entries'] as List?) ?? const [];

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _header(context, title, status, hasEntered, canEnter, id),
                if (description != null && description.trim().isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Text(description,
                      style: TextStyle(
                          fontSize: 15,
                          height: 1.45,
                          color: Theme.of(context).textTheme.bodyLarge?.color)),
                ],
                const SizedBox(height: 24),
                _sectionTitle('Rounds'),
                const SizedBox(height: 10),
                if (rounds.isEmpty)
                  _hint('No rounds have been scheduled yet.')
                else
                  ...rounds.map((r) => _roundCard(context, r as Map<String, dynamic>)),
                const SizedBox(height: 24),
                _sectionTitle('Standings'),
                const SizedBox(height: 10),
                if (entries.isEmpty)
                  _hint('No entries yet. Be the first to compete!')
                else
                  ..._standings(context, entries),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _header(BuildContext context, String title, String status,
      bool hasEntered, bool canEnter, String id) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
      decoration: BoxDecoration(
        gradient: RoboTheme.brandGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.emoji_events_rounded, color: Colors.white, size: 28),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              StatusChip(status: status),
              const Spacer(),
              if (hasEntered)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_rounded,
                          color: Colors.white, size: 18),
                      SizedBox(width: 6),
                      Text('Entered',
                          style: TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w600)),
                    ],
                  ),
                )
              else if (canEnter)
                FilledButton.icon(
                  onPressed:
                      _entering || id.isEmpty ? null : () => _enter(id),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: RoboTheme.primary,
                  ),
                  icon: _entering
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.flag_rounded, size: 18),
                  label: const Text('Enter competition'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _roundCard(BuildContext context, Map<String, dynamic> r) {
    final name = r['name']?.toString() ??
        r['title']?.toString() ??
        (r['order'] != null ? 'Round ${r['order']}' : 'Round');
    final description = r['description']?.toString();
    final startsAt = DateTime.tryParse(r['startsAt']?.toString() ?? '');
    final endsAt = DateTime.tryParse(r['endsAt']?.toString() ?? '');
    final schedule = <String>[];
    if (startsAt != null) schedule.add(DateFormat.yMMMd().format(startsAt));
    if (endsAt != null) schedule.add(DateFormat.yMMMd().format(endsAt));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.flag_circle_rounded, color: RoboTheme.secondary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  if (description != null && description.trim().isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(description,
                        style: TextStyle(color: Theme.of(context).hintColor)),
                  ],
                  if (schedule.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(schedule.join('  →  '),
                        style: TextStyle(
                            fontSize: 12, color: Theme.of(context).hintColor)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _standings(BuildContext context, List entries) {
    final sorted = List<Map<String, dynamic>>.from(
      entries.map((e) => (e as Map).cast<String, dynamic>()),
    );
    sorted.sort((a, b) {
      final sa = (a['totalScore'] as num?)?.toDouble() ?? 0;
      final sb = (b['totalScore'] as num?)?.toDouble() ?? 0;
      return sb.compareTo(sa);
    });

    return [
      Card(
        child: Column(
          children: [
            for (var i = 0; i < sorted.length; i++)
              _standingRow(context, i + 1, sorted[i],
                  isLast: i == sorted.length - 1),
          ],
        ),
      ),
    ];
  }

  Widget _standingRow(BuildContext context, int rank, Map<String, dynamic> entry,
      {required bool isLast}) {
    final team = (entry['team'] as Map?) ?? const {};
    final teamName = team['name']?.toString() ?? 'Team';
    final avatarSeed = team['avatarSeed']?.toString();
    final score = (entry['totalScore'] as num?)?.toDouble() ?? 0;

    return Column(
      children: [
        ListTile(
          leading: _rankBadge(rank),
          title: Row(
            children: [
              SeedAvatar(seed: avatarSeed, name: teamName, size: 28),
              const SizedBox(width: 10),
              Expanded(
                child: Text(teamName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          trailing: Text(
            _fmtScore(score),
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: RoboTheme.primary),
          ),
        ),
        if (!isLast)
          Divider(
              height: 1,
              indent: 16,
              endIndent: 16,
              color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
      ],
    );
  }

  Widget _rankBadge(int rank) {
    Color color;
    switch (rank) {
      case 1:
        color = RoboTheme.accent;
        break;
      case 2:
        color = Colors.blueGrey;
        break;
      case 3:
        color = const Color(0xFFCD7F32); // bronze
        break;
      default:
        color = RoboTheme.primary;
    }
    return Container(
      width: 34,
      height: 34,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        shape: BoxShape.circle,
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text('$rank',
          style: TextStyle(color: color, fontWeight: FontWeight.bold)),
    );
  }

  String _fmtScore(double score) {
    if (score == score.roundToDouble()) return score.toInt().toString();
    return score.toStringAsFixed(1);
  }

  Widget _sectionTitle(String title) =>
      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold));

  Widget _hint(String text) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(text, style: TextStyle(color: Theme.of(context).hintColor)),
        ),
      );
}
