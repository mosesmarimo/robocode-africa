import 'package:flutter/material.dart';

import '../../api/social_api.dart';
import '../../models/social.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import '../../widgets/social_widgets.dart';

/// A group's page: gradient header, members list with admin moderation, and the
/// group wall with a composer for members/admins who can post.
class GroupDetailScreen extends StatefulWidget {
  final String groupId;
  const GroupDetailScreen({super.key, required this.groupId});
  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  late Future<GroupDetail> _future;

  // Wall state (loaded after the detail resolves).
  final List<Post> _posts = [];
  String? _wallCursor;
  bool _wallLoading = false;
  bool _wallLoadedOnce = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _loadDetail();
  }

  Future<GroupDetail> _loadDetail() async {
    final detail = await SocialApi.instance.group(widget.groupId);
    // Kick off the wall load if the viewer is allowed to see it.
    if (detail.me.canViewWall) {
      _loadWall(reset: true);
    }
    return detail;
  }

  void _reload() {
    _wallLoadedOnce = false;
    _posts.clear();
    _wallCursor = null;
    setState(() => _future = _loadDetail());
  }

  Future<void> _loadWall({bool reset = false}) async {
    if (_wallLoading) return;
    if (!reset && _wallCursor == null) return; // no more pages — avoid re-loading page 1
    setState(() => _wallLoading = true);
    try {
      final wall = await SocialApi.instance.wall('group', widget.groupId, cursor: reset ? null : _wallCursor);
      if (!mounted) return;
      setState(() {
        if (reset) _posts.clear();
        _posts.addAll(wall.posts);
        _wallCursor = wall.nextCursor;
        _wallLoadedOnce = true;
        _wallLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _wallLoading = false);
      showSocialError(context, e);
    }
  }

  Future<void> _join(GroupDetail d) => _run(
        () => SocialApi.instance.joinGroup(d.group.id),
        'Request sent — an admin will review it.',
      );

  Future<void> _leave(GroupDetail d) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave group?'),
        content: const Text('You will lose access to this group\'s wall.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Leave')),
        ],
      ),
    );
    if (confirmed != true) return;
    await _run(() => SocialApi.instance.leaveGroup(d.group.id), 'You left the group.');
  }

  Future<void> _run(Future<void> Function() op, String done) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await op();
      if (!mounted) return;
      showSocialMessage(context, done);
      _reload();
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _editGroup(GroupDetail d) async {
    final result = await showDialog<_EditGroup>(
      context: context,
      builder: (_) => _EditGroupDialog(initial: d.group),
    );
    if (result == null) return;
    await _run(
      () => SocialApi.instance.updateGroup(
        d.group.id,
        name: result.name,
        description: result.description,
        visibility: result.visibility,
      ),
      'Group updated.',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Group')),
      body: AsyncView<GroupDetail>(
        future: _future,
        onRetry: _reload,
        builder: (context, d) {
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _header(context, d),
                const SizedBox(height: 16),
                _actions(context, d),
                if (d.followPreview.followerCount > 0) ...[
                  const SizedBox(height: 12),
                  FollowPreviewRow(
                    targetType: 'group',
                    targetId: d.group.id,
                    preview: d.followPreview,
                  ),
                ],
                const SizedBox(height: 24),
                _membersSection(context, d),
                const SizedBox(height: 24),
                _wallSection(context, d),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _header(BuildContext context, GroupDetail d) {
    final g = d.group;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: RoboTheme.brandGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SeedAvatar(seed: g.avatarSeed ?? g.name, name: g.name, size: 52),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(g.name,
                        style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                    Text('${d.activeMemberCount} ${d.activeMemberCount == 1 ? 'member' : 'members'}  ·  ${d.followerCount} following',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13)),
                  ],
                ),
              ),
              if (d.me.isAdmin)
                IconButton(
                  tooltip: 'Edit group',
                  onPressed: _busy ? null : () => _editGroup(d),
                  icon: const Icon(Icons.edit_outlined, color: Colors.white),
                ),
            ],
          ),
          if (g.description != null && g.description!.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(g.description!,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.92), fontSize: 14, height: 1.4)),
          ],
        ],
      ),
    );
  }

  Widget _actions(BuildContext context, GroupDetail d) {
    final me = d.me;
    final children = <Widget>[];

    if (!me.isMember && me.status != 'pending') {
      children.add(Expanded(
        child: FilledButton.icon(
          onPressed: _busy ? null : () => _join(d),
          icon: const Icon(Icons.group_add_rounded, size: 18),
          label: const Text('Request to join'),
        ),
      ));
    } else if (me.status == 'pending') {
      children.add(const Expanded(
        child: Center(
          child: MiniChip(icon: Icons.schedule_rounded, label: 'Request pending', color: RoboTheme.accent),
        ),
      ));
    } else if (me.isMember) {
      children.add(Expanded(
        child: OutlinedButton.icon(
          onPressed: _busy ? null : () => _leave(d),
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.red.shade600,
            side: BorderSide(color: Colors.red.shade200),
          ),
          icon: const Icon(Icons.logout_rounded, size: 18),
          label: const Text('Leave group'),
        ),
      ));
    }

    children.add(const SizedBox(width: 10));
    children.add(IconButton(
      tooltip: 'Report group',
      onPressed: () => reportContent(context, targetType: 'group', targetId: d.group.id),
      icon: Icon(Icons.flag_outlined, color: Theme.of(context).hintColor),
    ));

    return Row(children: children);
  }

  Widget _membersSection(BuildContext context, GroupDetail d) {
    final pending = d.members.where((m) => m.isPending).toList();
    final active = d.members.where((m) => !m.isPending).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Pending approvals (admins only — server only returns these to admins).
        if (d.me.canModerate && pending.isNotEmpty) ...[
          Row(
            children: [
              const SectionTitle('Pending approvals'),
              const SizedBox(width: 8),
              MiniChip(icon: Icons.schedule_rounded, label: '${pending.length}', color: RoboTheme.accent),
            ],
          ),
          const SizedBox(height: 10),
          Card(
            child: Column(
              children: [
                for (var i = 0; i < pending.length; i++)
                  _pendingRow(context, d, pending[i], isLast: i == pending.length - 1),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
        const SectionTitle('Members'),
        const SizedBox(height: 10),
        if (active.isEmpty)
          const HintCard('No members yet.')
        else
          Card(
            child: Column(
              children: [
                for (var i = 0; i < active.length; i++)
                  _memberRow(context, d, active[i], isLast: i == active.length - 1),
              ],
            ),
          ),
      ],
    );
  }

  Widget _pendingRow(BuildContext context, GroupDetail d, GroupMemberCard m, {required bool isLast}) {
    return Column(
      children: [
        ListTile(
          leading: SeedAvatar(seed: m.user.avatarSeed, name: m.user.displayName, size: 38),
          title: Text(m.user.displayName,
              maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('Level ${m.user.level}'),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton.filledTonal(
                tooltip: 'Approve',
                icon: const Icon(Icons.check_rounded),
                onPressed: _busy
                    ? null
                    : () => _run(() => SocialApi.instance.approveMember(d.group.id, m.user.id),
                        '${m.user.displayName} approved.'),
              ),
              const SizedBox(width: 6),
              IconButton(
                tooltip: 'Decline',
                icon: const Icon(Icons.close_rounded),
                onPressed: _busy
                    ? null
                    : () => _run(() => SocialApi.instance.declineMember(d.group.id, m.user.id),
                        'Request declined.'),
              ),
            ],
          ),
        ),
        if (!isLast) const Divider(height: 1, indent: 16, endIndent: 16),
      ],
    );
  }

  Widget _memberRow(BuildContext context, GroupDetail d, GroupMemberCard m, {required bool isLast}) {
    final canModerate = d.me.canModerate && m.user.id != d.owner?.id;
    return Column(
      children: [
        ListTile(
          leading: SeedAvatar(seed: m.user.avatarSeed, name: m.user.displayName, size: 38),
          title: Text(m.user.displayName,
              maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('Level ${m.user.level}'),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (m.isAdmin)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: RoboTheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(m.user.id == d.owner?.id ? 'Owner' : 'Admin',
                      style: const TextStyle(color: RoboTheme.primary, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              if (canModerate)
                PopupMenuButton<String>(
                  icon: Icon(Icons.more_horiz_rounded, color: Theme.of(context).hintColor),
                  onSelected: (v) {
                    switch (v) {
                      case 'make_admin':
                        _run(() => SocialApi.instance.setMemberRole(d.group.id, m.user.id, 'admin'),
                            '${m.user.displayName} is now an admin.');
                        break;
                      case 'make_member':
                        _run(() => SocialApi.instance.setMemberRole(d.group.id, m.user.id, 'member'),
                            '${m.user.displayName} is now a member.');
                        break;
                      case 'remove':
                        _run(() => SocialApi.instance.removeMember(d.group.id, m.user.id),
                            '${m.user.displayName} removed.');
                        break;
                    }
                  },
                  itemBuilder: (_) => [
                    if (!m.isAdmin)
                      const PopupMenuItem(value: 'make_admin', child: Text('Make admin'))
                    else
                      const PopupMenuItem(value: 'make_member', child: Text('Make member')),
                    const PopupMenuItem(value: 'remove', child: Text('Remove from group')),
                  ],
                ),
            ],
          ),
        ),
        if (!isLast) const Divider(height: 1, indent: 16, endIndent: 16),
      ],
    );
  }

  Widget _wallSection(BuildContext context, GroupDetail d) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionTitle('Wall'),
        const SizedBox(height: 10),
        if (!d.me.canViewWall)
          const HintCard('Join this group to see its wall.')
        else ...[
          if (d.me.canPost) ...[
            PostComposer(
              targetType: 'group',
              targetId: d.group.id,
              hintText: 'Share with the group…',
              onPosted: () => _loadWall(reset: true),
            ),
            const SizedBox(height: 12),
          ],
          if (!_wallLoadedOnce && _wallLoading)
            const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()))
          else if (_posts.isEmpty)
            const HintCard('No posts yet. Be the first to share!')
          else ...[
            ..._posts.map((p) => PostCard(
                  key: ValueKey(p.id),
                  post: p,
                  onArchived: () => setState(() => _posts.removeWhere((x) => x.id == p.id)),
                )),
            if (_wallCursor != null)
              Center(
                child: _wallLoading
                    ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator())
                    : TextButton(onPressed: () => _loadWall(), child: const Text('Load more')),
              ),
          ],
        ],
      ],
    );
  }
}

class _EditGroup {
  final String name;
  final String description;
  final String visibility;
  const _EditGroup(this.name, this.description, this.visibility);
}

class _EditGroupDialog extends StatefulWidget {
  final GroupSummary initial;
  const _EditGroupDialog({required this.initial});
  @override
  State<_EditGroupDialog> createState() => _EditGroupDialogState();
}

class _EditGroupDialogState extends State<_EditGroupDialog> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  late String _visibility;
  String? _error;

  static const _visibilityOptions = <String, String>{
    'discoverable': 'Discoverable — anyone can find and request to join',
    'private': 'Private — invite or request only',
  };

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initial.name);
    _descCtrl = TextEditingController(text: widget.initial.description ?? '');
    _visibility = _visibilityOptions.containsKey(widget.initial.visibility) ? widget.initial.visibility : 'discoverable';
  }

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
    Navigator.of(context).pop(_EditGroup(name, _descCtrl.text.trim(), _visibility));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit group'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nameCtrl,
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
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _visibility,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Visibility'),
              items: _visibilityOptions.entries
                  .map((e) => DropdownMenuItem(
                        value: e.key,
                        child: Text(e.value, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
                      ))
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _visibility = v);
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
        FilledButton(onPressed: _submit, child: const Text('Save')),
      ],
    );
  }
}
