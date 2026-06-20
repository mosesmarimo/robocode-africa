import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

class TeamsScreen extends StatefulWidget {
  const TeamsScreen({super.key});
  @override
  State<TeamsScreen> createState() => _TeamsScreenState();
}

class _TeamsScreenState extends State<TeamsScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/teams');

  void _reload() => setState(() => _future = _load());

  Future<void> _join(String teamId) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await ApiClient.instance
          .post<Map<String, dynamic>>('/teams/$teamId/join', body: {});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You have joined the team!')),
      );
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not reach the server. Check your connection.')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _createTeam() async {
    final result = await showDialog<_NewTeam>(
      context: context,
      builder: (_) => const _CreateTeamDialog(),
    );
    if (result == null || !mounted) return;

    setState(() => _busy = true);
    try {
      final body = <String, dynamic>{'name': result.name};
      if (result.description != null && result.description!.trim().isNotEmpty) {
        body['description'] = result.description!.trim();
      }
      final res =
          await ApiClient.instance.post<Map<String, dynamic>>('/teams', body: body);
      if (!mounted) return;
      final teamId = res['teamId']?.toString();
      if (teamId == null || teamId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not create team.')),
        );
        return;
      }
      context.push('/teams/$teamId');
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not reach the server. Check your connection.')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final myMemberships = (data['myMemberships'] as List?) ?? const [];
            final browseTeams = (data['browseTeams'] as List?) ?? const [];
            final totalPoints = (data['totalPoints'] as num?)?.toInt() ?? 0;

            return ListView(
              children: [
                BrandHeader(
                  title: 'Teams',
                  subtitle: 'Build robots together, earn RoboPoints',
                  trailing: _pointsBadge(totalPoints),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _sectionTitle('My teams'),
                      const SizedBox(height: 10),
                      if (myMemberships.isEmpty)
                        const EmptyState(
                          icon: Icons.groups_2_outlined,
                          message: "You aren't on a team yet. Join or create one below!",
                        )
                      else
                        ...myMemberships.map((m) {
                          final membership = (m as Map).cast<String, dynamic>();
                          final role = membership['role']?.toString();
                          final team = (membership['team'] as Map?)?.cast<String, dynamic>() ??
                              const {};
                          return _myTeamCard(context, team, role);
                        }),
                      const SizedBox(height: 24),
                      _sectionTitle('Browse teams'),
                      const SizedBox(height: 10),
                      if (browseTeams.isEmpty)
                        const EmptyState(
                          icon: Icons.travel_explore_rounded,
                          message: 'No other teams to join right now.',
                        )
                      else
                        ...browseTeams.map((t) => _browseTeamCard(
                            context, (t as Map).cast<String, dynamic>())),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _busy ? null : _createTeam,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Create team'),
      ),
    );
  }

  Widget _pointsBadge(int points) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text('$points',
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          const Text('pts',
              style: TextStyle(color: Colors.white, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _myTeamCard(
      BuildContext context, Map<String, dynamic> team, String? role) {
    final id = team['id']?.toString() ?? '';
    final name = team['name']?.toString() ?? 'Team';
    final points = (team['roboPoints'] as num?)?.toInt() ?? 0;
    final count = (team['_count'] as Map?) ?? const {};
    final members = (count['members'] as num?)?.toInt() ?? 0;
    final captain = (team['captain'] as Map?) ?? const {};
    final captainName = captain['displayName']?.toString();

    return Card(
      child: InkWell(
        onTap: id.isEmpty ? null : () => context.push('/teams/$id'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              SeedAvatar(seed: name, name: name, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                        if (role != null && role.trim().isNotEmpty) ...[
                          const SizedBox(width: 8),
                          _roleChip(role),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    _metaRow(context, points, members, captainName),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.chevron_right_rounded,
                  color: Theme.of(context).hintColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _browseTeamCard(BuildContext context, Map<String, dynamic> team) {
    final id = team['id']?.toString() ?? '';
    final name = team['name']?.toString() ?? 'Team';
    final points = (team['roboPoints'] as num?)?.toInt() ?? 0;
    final count = (team['_count'] as Map?) ?? const {};
    final members = (count['members'] as num?)?.toInt() ?? 0;
    final captain = (team['captain'] as Map?) ?? const {};
    final captainName = captain['displayName']?.toString();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            SeedAvatar(seed: name, name: name, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  _metaRow(context, points, members, captainName),
                ],
              ),
            ),
            const SizedBox(width: 8),
            FilledButton.tonal(
              onPressed: _busy || id.isEmpty ? null : () => _join(id),
              child: const Text('Join'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metaRow(
      BuildContext context, int points, int members, String? captainName) {
    final hint = Theme.of(context).hintColor;
    return Wrap(
      spacing: 14,
      runSpacing: 4,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.bolt_rounded, size: 15, color: RoboTheme.accent),
            const SizedBox(width: 3),
            Text('$points pts',
                style: TextStyle(fontSize: 13, color: hint)),
          ],
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.group_rounded, size: 15, color: hint),
            const SizedBox(width: 3),
            Text('$members ${members == 1 ? 'member' : 'members'}',
                style: TextStyle(fontSize: 13, color: hint)),
          ],
        ),
        if (captainName != null && captainName.trim().isNotEmpty)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.star_rounded, size: 15, color: hint),
              const SizedBox(width: 3),
              Text(captainName,
                  style: TextStyle(fontSize: 13, color: hint)),
            ],
          ),
      ],
    );
  }

  Widget _roleChip(String role) {
    final label = role.replaceAll('_', ' ').toLowerCase().replaceFirstMapped(
        RegExp(r'^.'), (m) => m.group(0)!.toUpperCase());
    final isCaptain = role.toUpperCase() == 'CAPTAIN';
    final color = isCaptain ? RoboTheme.accent : RoboTheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }

  Widget _sectionTitle(String title) =>
      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold));
}

class _NewTeam {
  final String name;
  final String? description;
  const _NewTeam(this.name, this.description);
}

class _CreateTeamDialog extends StatefulWidget {
  const _CreateTeamDialog();
  @override
  State<_CreateTeamDialog> createState() => _CreateTeamDialogState();
}

class _CreateTeamDialogState extends State<_CreateTeamDialog> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Please enter a team name.');
      return;
    }
    Navigator.of(context).pop(_NewTeam(name, _descCtrl.text));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Create team'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameCtrl,
            autofocus: true,
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(
              labelText: 'Team name',
              errorText: _error,
            ),
            onChanged: (_) {
              if (_error != null) setState(() => _error = null);
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descCtrl,
            maxLines: 3,
            minLines: 2,
            decoration: const InputDecoration(
              labelText: 'Description (optional)',
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _submit,
          child: const Text('Create'),
        ),
      ],
    );
  }
}
