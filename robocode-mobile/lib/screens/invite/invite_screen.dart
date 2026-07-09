import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../api/referrals_api.dart';
import '../../models/referrals.dart';
import '../../state/auth.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// The invite hub: the caller's referral code + share link, progress toward
/// the next recruiter badge, and the top-referrers leaderboard. Reachable
/// from the dashboard promo card and the profile screen.
class InviteScreen extends StatefulWidget {
  const InviteScreen({super.key});
  @override
  State<InviteScreen> createState() => _InviteScreenState();
}

class _InviteScreenState extends State<InviteScreen> {
  late Future<ReferralStats> _statsFuture;
  late Future<List<ReferralLeaderboardRow>> _leaderboardFuture;
  String _scope = 'platform';

  @override
  void initState() {
    super.initState();
    _statsFuture = ReferralsApi.instance.stats();
    _leaderboardFuture = ReferralsApi.instance.leaderboard(scope: _scope);
  }

  void _reloadAll() {
    setState(() {
      _statsFuture = ReferralsApi.instance.stats();
      _leaderboardFuture = ReferralsApi.instance.leaderboard(scope: _scope);
    });
  }

  void _changeScope(String scope) {
    if (scope == _scope) return;
    setState(() {
      _scope = scope;
      _leaderboardFuture = ReferralsApi.instance.leaderboard(scope: scope);
    });
  }

  Future<void> _share(ReferralStats stats) async {
    await SharePlus.instance.share(ShareParams(
      text: 'Join me on RoboCode.Africa and start building robots, code & AI! 🤖\n${stats.url}',
      subject: 'Join me on RoboCode.Africa',
    ));
  }

  Future<void> _copyLink(ReferralStats stats) async {
    await Clipboard.setData(ClipboardData(text: stats.url));
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Invite link copied')));
  }

  @override
  Widget build(BuildContext context) {
    final myId = context.watch<AuthState>().user?.id;
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reloadAll(),
        child: ListView(
          children: [
            const BrandHeader(
              title: 'Invite friends',
              subtitle: 'Earn RoboPoints & badges for every friend who joins',
              trailing: Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 28),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: AsyncView<ReferralStats>(
                future: _statsFuture,
                onRetry: _reloadAll,
                builder: (context, stats) => _StatsSection(
                  stats: stats,
                  onShare: () => _share(stats),
                  onCopy: () => _copyLink(stats),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: SectionTitle('Top referrers'),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'platform', label: Text('Platform')),
                  ButtonSegment(value: 'tenant', label: Text('My school')),
                ],
                selected: {_scope},
                onSelectionChanged: (s) => _changeScope(s.first),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
              child: AsyncView<List<ReferralLeaderboardRow>>(
                future: _leaderboardFuture,
                onRetry: _reloadAll,
                builder: (context, rows) {
                  if (rows.isEmpty) {
                    return const HintCard('No referrers yet — be the first to invite a friend!');
                  }
                  return Column(
                    children: rows.map((r) => _LeaderboardRow(row: r, isMe: r.userId == myId)).toList(),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatsSection extends StatelessWidget {
  final ReferralStats stats;
  final VoidCallback onShare;
  final VoidCallback onCopy;
  const _StatsSection({required this.stats, required this.onShare, required this.onCopy});

  @override
  Widget build(BuildContext context) {
    final nextBadgeAt = stats.nextBadgeAt;
    final progress =
        (nextBadgeAt == null || nextBadgeAt <= 0) ? 1.0 : (stats.rewardedCount / nextBadgeAt).clamp(0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Your invite code', style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: RoboTheme.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: RoboTheme.primary.withValues(alpha: 0.24)),
                        ),
                        child: Text(
                          stats.code,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 2),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton.filledTonal(
                      onPressed: onCopy,
                      icon: const Icon(Icons.copy_rounded),
                      tooltip: 'Copy invite link',
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  stats.url,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 13, color: Theme.of(context).hintColor),
                ),
                const SizedBox(height: 14),
                FilledButton.icon(
                  onPressed: onShare,
                  icon: const Icon(Icons.ios_share_rounded),
                  label: const Text('Share invite link'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.05,
          children: [
            StatTile(
              icon: Icons.person_add_alt_1_rounded,
              label: 'Invited',
              value: '${stats.totalReferred}',
              color: RoboTheme.primary,
            ),
            StatTile(
              icon: Icons.check_circle_outline_rounded,
              label: 'Rewarded',
              value: '${stats.rewardedCount}',
              color: RoboTheme.secondary,
            ),
            StatTile(
              icon: Icons.bolt,
              label: 'Points',
              value: '${stats.pointsEarned}',
              color: RoboTheme.accent,
            ),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  nextBadgeAt == null
                      ? 'All recruiter badges earned! 🎉'
                      : 'Next recruiter badge at $nextBadgeAt rewarded ${nextBadgeAt == 1 ? 'referral' : 'referrals'}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 10,
                    backgroundColor: RoboTheme.primary.withValues(alpha: 0.10),
                    valueColor: const AlwaysStoppedAnimation(RoboTheme.secondary),
                  ),
                ),
                if (nextBadgeAt != null) ...[
                  const SizedBox(height: 6),
                  Text('${stats.rewardedCount} / $nextBadgeAt',
                      style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  final ReferralLeaderboardRow row;
  final bool isMe;
  const _LeaderboardRow({required this.row, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isMe ? RoboTheme.primary.withValues(alpha: 0.10) : Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isMe
              ? RoboTheme.primary.withValues(alpha: 0.45)
              : Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.6),
          width: isMe ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 34,
            child: Text(
              '#${row.rank}',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).hintColor),
            ),
          ),
          const SizedBox(width: 8),
          SeedAvatar(seed: row.avatarSeed, name: row.displayName, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    row.displayName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(color: RoboTheme.primary, borderRadius: BorderRadius.circular(6)),
                    child: const Text('You',
                        style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${row.rewardedCount}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: RoboTheme.primary)),
              Text('joined', style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor)),
            ],
          ),
        ],
      ),
    );
  }
}
