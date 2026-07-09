import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/leaderboards_api.dart';
import '../../models/leaderboards.dart';
import '../../state/auth.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// The frozen 12 gamification languages, split by track — mirrors the
/// backend's `CODING_LANGUAGES`/`ROBOTICS_LANGUAGES`
/// (robocode-backend/src/domain/constants.ts). Do not add or remove entries
/// here without a matching backend change.
const List<String> _codingLanguages = [
  'python', 'javascript', 'typescript', 'html', 'css', 'go', 'rust', 'cpp', 'csharp', 'sql',
];
const List<String> _roboticsLanguages = ['arduino', 'micropython'];

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

/// Leaderboards for the tutorials-gamification XP system: a **Coding**/
/// **Robotics** track tab, a language picker within that track (or "Overall"
/// for the whole track), and an all-time/this-week scope toggle. Reachable
/// from the dashboard and profile screens.
class LeaderboardsScreen extends StatefulWidget {
  const LeaderboardsScreen({super.key});
  @override
  State<LeaderboardsScreen> createState() => _LeaderboardsScreenState();
}

class _LeaderboardsScreenState extends State<LeaderboardsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  int _lastTrackIndex = 0;
  String _scope = 'all';
  String? _language; // null == "Overall" (track board)
  late Future<LeaderboardResult> _future;

  static const _tracks = ['coding', 'robotics'];

  String get _track => _tracks[_tabController.index];
  List<String> get _languagesForTrack => _track == 'coding' ? _codingLanguages : _roboticsLanguages;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tracks.length, vsync: this)..addListener(_onTabChanged);
    _future = _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.index == _lastTrackIndex) return;
    _lastTrackIndex = _tabController.index;
    setState(() {
      _language = null;
      _future = _load();
    });
  }

  Future<LeaderboardResult> _load() {
    final lang = _language;
    return lang == null
        ? LeaderboardsApi.instance.trackBoard(_track, scope: _scope)
        : LeaderboardsApi.instance.languageBoard(lang, scope: _scope);
  }

  void _reload() => setState(() => _future = _load());

  void _selectLanguage(String? language) {
    if (language == _language) return;
    setState(() {
      _language = language;
      _future = _load();
    });
  }

  void _changeScope(String scope) {
    if (scope == _scope) return;
    setState(() {
      _scope = scope;
      _future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final myId = context.watch<AuthState>().user?.id;
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: ListView(
          children: [
            const BrandHeader(
              title: 'Leaderboards',
              subtitle: 'See how you stack up by language & track',
              trailing: Icon(Icons.leaderboard_rounded, color: Colors.white, size: 28),
            ),
            TabBar(
              controller: _tabController,
              labelColor: RoboTheme.primary,
              indicatorColor: RoboTheme.primary,
              tabs: const [
                Tab(text: 'Coding'),
                Tab(text: 'Robotics'),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _LanguageChip(label: 'Overall', selected: _language == null, onTap: () => _selectLanguage(null)),
                  for (final lang in _languagesForTrack)
                    _LanguageChip(
                      label: _languageLabels[lang] ?? lang,
                      selected: _language == lang,
                      onTap: () => _selectLanguage(lang),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
              child: SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'all', label: Text('All-time')),
                  ButtonSegment(value: 'week', label: Text('This week')),
                ],
                selected: {_scope},
                onSelectionChanged: (s) => _changeScope(s.first),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
              child: AsyncView<LeaderboardResult>(
                future: _future,
                onRetry: _reload,
                builder: (context, result) {
                  if (result.rows.isEmpty) {
                    return const HintCard('No rankings yet — be the first to earn XP here!');
                  }
                  final meInTop = result.me != null && result.rows.any((r) => r.userId == myId);
                  return Column(
                    children: [
                      if (result.me != null && !meInTop) _OwnRankBanner(me: result.me!),
                      if (result.me != null && !meInTop) const SizedBox(height: 12),
                      ...result.rows.map((r) => _LeaderboardRankRow(row: r, isMe: r.userId == myId)),
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
}

class _LanguageChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _LanguageChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: RoboTheme.primary.withValues(alpha: 0.16),
      labelStyle: TextStyle(
        color: selected ? RoboTheme.primary : Theme.of(context).textTheme.bodyMedium?.color,
        fontWeight: selected ? FontWeight.w700 : FontWeight.normal,
      ),
      side: BorderSide(
        color: selected
            ? RoboTheme.primary.withValues(alpha: 0.5)
            : Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.6),
      ),
    );
  }
}

/// Shown above the ranked list when the caller has XP for this board but
/// falls outside the top 50 — so their standing is never a mystery.
class _OwnRankBanner extends StatelessWidget {
  final LeaderboardMe me;
  const _OwnRankBanner({required this.me});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: RoboTheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: RoboTheme.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.person_pin_circle_rounded, color: RoboTheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text('Your rank: #${me.rank}', style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
          Text('${me.xp} XP', style: const TextStyle(fontWeight: FontWeight.bold, color: RoboTheme.primary)),
        ],
      ),
    );
  }
}

class _LeaderboardRankRow extends StatelessWidget {
  final LeaderboardRow row;
  final bool isMe;
  const _LeaderboardRankRow({required this.row, required this.isMe});

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
              Text('${row.xp}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: RoboTheme.primary)),
              Text('XP', style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor)),
            ],
          ),
        ],
      ),
    );
  }
}
