import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/social_api.dart';
import '../../models/social.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import '../../widgets/social_widgets.dart';

/// Lists the user's groups and discoverable groups, with create + request-to-join.
class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});
  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> {
  late Future<GroupsList> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = SocialApi.instance.groups();
  }

  void _reload() => setState(() => _future = SocialApi.instance.groups());

  Future<void> _join(GroupSummary g) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await SocialApi.instance.joinGroup(g.id);
      if (!mounted) return;
      showSocialMessage(context, 'Request sent — an admin will review it.');
      _reload();
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _create() async {
    final result = await showDialog<_NewGroup>(
      context: context,
      builder: (_) => const _CreateGroupDialog(),
    );
    if (result == null || !mounted) return;
    setState(() => _busy = true);
    try {
      final id = await SocialApi.instance.createGroup(name: result.name, description: result.description);
      if (!mounted) return;
      if (id.isEmpty) {
        showSocialMessage(context, 'Could not create group.');
        return;
      }
      context.push('/social/groups/$id');
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<GroupsList>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            return ListView(
              children: [
                const BrandHeader(
                  title: 'Groups',
                  subtitle: 'Join a community of builders',
                  trailing: Icon(Icons.groups_2_rounded, color: Colors.white, size: 28),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionTitle('My groups'),
                      const SizedBox(height: 10),
                      if (data.myGroups.isEmpty)
                        const EmptyState(
                          icon: Icons.group_add_outlined,
                          message: "You're not in any groups yet. Join or create one below!",
                        )
                      else
                        ...data.myGroups.map((g) => _myGroupCard(context, g)),
                      const SizedBox(height: 24),
                      const SectionTitle('Discover'),
                      const SizedBox(height: 10),
                      if (data.discoverable.isEmpty)
                        const EmptyState(
                          icon: Icons.travel_explore_rounded,
                          message: 'No new groups to discover right now.',
                        )
                      else
                        ...data.discoverable.map((g) => _discoverCard(context, g)),
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
        onPressed: _busy ? null : _create,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Create group'),
      ),
    );
  }

  Widget _myGroupCard(BuildContext context, GroupSummary g) {
    final pending = g.myStatus == 'pending';
    return Card(
      child: InkWell(
        onTap: () => context.push('/social/groups/${g.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              SeedAvatar(seed: g.avatarSeed ?? g.name, name: g.name, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(g.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                        if (g.isAdmin) ...[
                          const SizedBox(width: 8),
                          const MiniChip(icon: Icons.shield_rounded, label: 'Admin', color: RoboTheme.primary),
                        ] else if (pending) ...[
                          const SizedBox(width: 8),
                          const MiniChip(icon: Icons.schedule_rounded, label: 'Pending', color: RoboTheme.accent),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    _memberLine(context, g.memberCount),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: Theme.of(context).hintColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _discoverCard(BuildContext context, GroupSummary g) {
    final pending = g.myStatus == 'pending';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            InkWell(
              onTap: () => context.push('/social/groups/${g.id}'),
              child: SeedAvatar(seed: g.avatarSeed ?? g.name, name: g.name, size: 44),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: InkWell(
                onTap: () => context.push('/social/groups/${g.id}'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(g.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    if (g.description != null && g.description!.trim().isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(g.description!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 13, color: Theme.of(context).hintColor)),
                    ],
                    const SizedBox(height: 4),
                    _memberLine(context, g.memberCount),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            if (pending)
              const MiniChip(icon: Icons.schedule_rounded, label: 'Pending', color: RoboTheme.accent)
            else
              FilledButton.tonal(
                onPressed: _busy ? null : () => _join(g),
                child: const Text('Join'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _memberLine(BuildContext context, int count) {
    final hint = Theme.of(context).hintColor;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.group_rounded, size: 15, color: hint),
        const SizedBox(width: 4),
        Text('$count ${count == 1 ? 'member' : 'members'}', style: TextStyle(fontSize: 13, color: hint)),
      ],
    );
  }
}

class _NewGroup {
  final String name;
  final String? description;
  const _NewGroup(this.name, this.description);
}

class _CreateGroupDialog extends StatefulWidget {
  const _CreateGroupDialog();
  @override
  State<_CreateGroupDialog> createState() => _CreateGroupDialogState();
}

class _CreateGroupDialogState extends State<_CreateGroupDialog> {
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
      setState(() => _error = 'Please enter a group name.');
      return;
    }
    Navigator.of(context).pop(_NewGroup(name, _descCtrl.text));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Create group'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameCtrl,
            autofocus: true,
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(labelText: 'Group name', errorText: _error),
            onChanged: (_) {
              if (_error != null) setState(() => _error = null);
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descCtrl,
            maxLines: 3,
            minLines: 2,
            decoration: const InputDecoration(labelText: 'Description (optional)'),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
        FilledButton(onPressed: _submit, child: const Text('Create')),
      ],
    );
  }
}
