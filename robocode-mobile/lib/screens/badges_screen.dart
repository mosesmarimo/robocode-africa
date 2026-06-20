import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../api/api_client.dart';
import '../theme.dart';
import '../widgets/common.dart';

class BadgesScreen extends StatefulWidget {
  const BadgesScreen({super.key});
  @override
  State<BadgesScreen> createState() => _BadgesScreenState();
}

class _BadgesScreenState extends State<BadgesScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/badges');

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
            final allBadges = (data['allBadges'] as List?) ?? [];
            final earnedRecords = (data['earnedRecords'] as List?) ?? [];
            final earnedCount = (data['earnedCount'] as num?)?.toInt() ?? earnedRecords.length;
            final totalCount = (data['totalCount'] as num?)?.toInt() ?? allBadges.length;

            // Map earned badge id -> awardedAt (ISO string).
            final earnedAt = <String, String?>{};
            for (final r in earnedRecords) {
              if (r is! Map) continue;
              final badge = r['badge'];
              if (badge is! Map) continue;
              final bid = badge['id']?.toString();
              if (bid != null) earnedAt[bid] = r['awardedAt']?.toString();
            }

            final progress = totalCount == 0 ? 0.0 : earnedCount / totalCount;

            return ListView(
              children: [
                BrandHeader(
                  title: 'Badges',
                  subtitle: 'Collect them all as you learn',
                  trailing: const Icon(Icons.military_tech_rounded, color: Colors.white, size: 28),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.emoji_events_rounded,
                                      color: RoboTheme.accent, size: 28),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('$earnedCount / $totalCount earned',
                                            style: const TextStyle(
                                                fontSize: 18, fontWeight: FontWeight.bold)),
                                        Text(
                                          totalCount == 0
                                              ? 'No badges available yet'
                                              : '${(progress * 100).round()}% complete',
                                          style: TextStyle(
                                              fontSize: 12, color: Theme.of(context).hintColor),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: LinearProgressIndicator(
                                  value: progress,
                                  minHeight: 8,
                                  backgroundColor:
                                      RoboTheme.primary.withValues(alpha: 0.10),
                                  valueColor:
                                      const AlwaysStoppedAnimation(RoboTheme.secondary),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (allBadges.isEmpty)
                        const EmptyState(
                          icon: Icons.military_tech_outlined,
                          message: 'No badges available right now.',
                        )
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.78,
                          ),
                          itemCount: allBadges.length,
                          itemBuilder: (context, i) {
                            final b = allBadges[i] as Map<String, dynamic>;
                            final id = b['id']?.toString();
                            final earned = id != null && earnedAt.containsKey(id);
                            return _BadgeTile(
                              badge: b,
                              earned: earned,
                              awardedAt: earned ? earnedAt[id] : null,
                            );
                          },
                        ),
                      const SizedBox(height: 80),
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
}

class _BadgeTile extends StatelessWidget {
  final Map<String, dynamic> badge;
  final bool earned;
  final String? awardedAt;
  const _BadgeTile({required this.badge, required this.earned, this.awardedAt});

  @override
  Widget build(BuildContext context) {
    final name = badge['name']?.toString() ?? 'Badge';
    final description = badge['description']?.toString() ?? '';
    final icon = badge['icon']?.toString();

    return GestureDetector(
      onTap: () => _showDetail(context, name, description, earned, awardedAt),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: earned
              ? RoboTheme.accent.withValues(alpha: 0.10)
              : Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: earned
                ? RoboTheme.accent.withValues(alpha: 0.40)
                : Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.5),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                Opacity(
                  opacity: earned ? 1.0 : 0.35,
                  child: Container(
                    width: 52,
                    height: 52,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: earned ? RoboTheme.brandGradient : null,
                      color: earned ? null : Colors.grey,
                    ),
                    child: _badgeGlyph(icon),
                  ),
                ),
                if (!earned)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.lock_rounded,
                          size: 14, color: Theme.of(context).hintColor),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: earned ? null : Theme.of(context).hintColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _badgeGlyph(String? icon) {
    if (icon != null && icon.trim().isNotEmpty && icon.runes.length <= 2) {
      // Treat short strings (e.g. emoji) as a glyph.
      return Text(icon, style: const TextStyle(fontSize: 24));
    }
    return Icon(
      earned ? Icons.military_tech_rounded : Icons.military_tech_outlined,
      color: earned ? Colors.white : Colors.white70,
      size: 28,
    );
  }

  void _showDetail(
      BuildContext context, String name, String description, bool earned, String? awardedAt) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        String? awardedLabel;
        if (earned && awardedAt != null && awardedAt.isNotEmpty) {
          final dt = DateTime.tryParse(awardedAt);
          if (dt != null) {
            awardedLabel = 'Earned ${DateFormat.yMMMd().format(dt.toLocal())}';
          }
        }
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: earned ? RoboTheme.brandGradient : null,
                  color: earned ? null : Colors.grey.withValues(alpha: 0.4),
                ),
                child: Icon(
                  earned ? Icons.military_tech_rounded : Icons.lock_rounded,
                  color: Colors.white,
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              Text(name,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(description,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Theme.of(context).hintColor)),
              ],
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: (earned ? RoboTheme.secondary : Theme.of(context).hintColor)
                      .withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(earned ? Icons.check_circle_rounded : Icons.lock_outline_rounded,
                        size: 16,
                        color: earned ? RoboTheme.secondary : Theme.of(context).hintColor),
                    const SizedBox(width: 6),
                    Text(
                      earned ? (awardedLabel ?? 'Earned') : 'Locked',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: earned ? RoboTheme.secondary : Theme.of(context).hintColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
