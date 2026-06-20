import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

class TeamScreen extends StatefulWidget {
  final String teamId;
  const TeamScreen({super.key, required this.teamId});
  @override
  State<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends State<TeamScreen> {
  late Future<Map<String, dynamic>> _future;
  final _messageCtrl = TextEditingController();
  bool _posting = false;
  bool _leaving = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/teams/${widget.teamId}');

  void _reload() => setState(() => _future = _load());

  Future<void> _postMessage() async {
    final body = _messageCtrl.text.trim();
    if (body.isEmpty || _posting) return;
    setState(() => _posting = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>(
        '/teams/${widget.teamId}/messages',
        body: {'body': body},
      );
      if (!mounted) return;
      _messageCtrl.clear();
      FocusScope.of(context).unfocus();
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
      if (mounted) setState(() => _posting = false);
    }
  }

  Future<void> _leaveTeam() async {
    if (_leaving) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave team?'),
        content: const Text('You will lose access to this team\'s chat and shared projects.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _leaving = true);
    try {
      await ApiClient.instance
          .post<Map<String, dynamic>>('/teams/${widget.teamId}/leave', body: {});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You have left the team.')),
      );
      context.pop();
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
      if (mounted) setState(() => _leaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Team')),
      body: AsyncView<Map<String, dynamic>>(
        future: _future,
        onRetry: _reload,
        builder: (context, data) {
          final team = (data['team'] as Map?)?.cast<String, dynamic>() ?? const {};
          final isMember = data['isMember'] == true;
          final members = (team['members'] as List?) ?? const [];
          final projects = (data['projects'] as List?) ?? const [];
          final chatMessages = (data['chatMessages'] as List?) ?? const [];

          final name = team['name']?.toString() ?? 'Team';
          final description = team['description']?.toString();
          final points = (team['roboPoints'] as num?)?.toInt() ?? 0;
          final captain = (team['captain'] as Map?)?.cast<String, dynamic>() ?? const {};
          final captainName = captain['displayName']?.toString();

          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _header(context, name, points, members.length, captainName),
                if (description != null && description.trim().isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(description,
                      style: TextStyle(
                          fontSize: 15,
                          height: 1.45,
                          color: Theme.of(context).textTheme.bodyLarge?.color)),
                ],
                if (isMember) ...[
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerRight,
                    child: OutlinedButton.icon(
                      onPressed: _leaving ? null : _leaveTeam,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade600,
                        side: BorderSide(color: Colors.red.shade200),
                      ),
                      icon: _leaving
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.logout_rounded, size: 18),
                      label: const Text('Leave team'),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                _sectionTitle('Members'),
                const SizedBox(height: 10),
                if (members.isEmpty)
                  _hint('No members yet.')
                else
                  Card(
                    child: Column(
                      children: [
                        for (var i = 0; i < members.length; i++)
                          _memberRow(
                            context,
                            (members[i] as Map).cast<String, dynamic>(),
                            isLast: i == members.length - 1,
                          ),
                      ],
                    ),
                  ),
                const SizedBox(height: 24),
                _sectionTitle('Shared projects'),
                const SizedBox(height: 10),
                if (projects.isEmpty)
                  _hint('No shared projects yet.')
                else
                  ...projects.map((p) =>
                      _projectCard(context, (p as Map).cast<String, dynamic>())),
                const SizedBox(height: 24),
                _sectionTitle('Team chat'),
                const SizedBox(height: 10),
                if (chatMessages.isEmpty)
                  _hint('No messages yet. Say hi!')
                else
                  ...chatMessages.map((m) =>
                      _chatBubble(context, (m as Map).cast<String, dynamic>())),
                if (isMember) ...[
                  const SizedBox(height: 12),
                  _chatComposer(context),
                ],
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _header(BuildContext context, String name, int points, int memberCount,
      String? captainName) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
      decoration: BoxDecoration(
        gradient: RoboTheme.brandGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SeedAvatar(seed: name, name: name, size: 48),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold)),
                    if (captainName != null && captainName.trim().isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text('Captain: $captainName',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontSize: 13)),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _headerStat(Icons.bolt_rounded, '$points', 'RoboPoints'),
              const SizedBox(width: 12),
              _headerStat(Icons.group_rounded, '$memberCount',
                  memberCount == 1 ? 'member' : 'members'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _headerStat(IconData icon, String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text(value,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85), fontSize: 12)),
        ],
      ),
    );
  }

  Widget _memberRow(BuildContext context, Map<String, dynamic> member,
      {required bool isLast}) {
    final role = member['role']?.toString();
    final user = (member['user'] as Map?)?.cast<String, dynamic>() ?? const {};
    final displayName = user['displayName']?.toString() ?? 'Member';
    final avatarSeed = user['avatarSeed']?.toString();
    final isCaptain = (role ?? '').toUpperCase() == 'CAPTAIN';

    return Column(
      children: [
        ListTile(
          leading: SeedAvatar(seed: avatarSeed, name: displayName, size: 38),
          title: Text(displayName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w600)),
          trailing: (role != null && role.trim().isNotEmpty)
              ? Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: (isCaptain ? RoboTheme.accent : RoboTheme.primary)
                        .withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    role.replaceAll('_', ' ').toLowerCase().replaceFirstMapped(
                        RegExp(r'^.'), (m) => m.group(0)!.toUpperCase()),
                    style: TextStyle(
                        color: isCaptain ? RoboTheme.accent : RoboTheme.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600),
                  ),
                )
              : null,
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

  Widget _projectCard(BuildContext context, Map<String, dynamic> project) {
    final id = project['id']?.toString() ?? '';
    final title = project['title']?.toString() ??
        project['name']?.toString() ??
        'Project';
    final board = project['board']?.toString();

    return Card(
      child: InkWell(
        onTap: id.isEmpty ? null : () => context.push('/studio/$id'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: RoboTheme.secondary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.memory_rounded,
                    color: RoboTheme.secondary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    if (board != null && board.trim().isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(board,
                          style: TextStyle(
                              fontSize: 12, color: Theme.of(context).hintColor)),
                    ],
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded,
                  color: Theme.of(context).hintColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chatBubble(BuildContext context, Map<String, dynamic> message) {
    final body = message['body']?.toString() ?? '';
    final createdAt = DateTime.tryParse(message['createdAt']?.toString() ?? '');
    final user = (message['user'] as Map?)?.cast<String, dynamic>() ?? const {};
    final displayName = user['displayName']?.toString() ?? 'Member';
    final avatarSeed = user['avatarSeed']?.toString();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SeedAvatar(seed: avatarSeed, name: displayName, size: 32),
          const SizedBox(width: 10),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest
                    .withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 13)),
                      ),
                      if (createdAt != null)
                        Text(_relative(createdAt),
                            style: TextStyle(
                                fontSize: 11,
                                color: Theme.of(context).hintColor)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(body, style: const TextStyle(fontSize: 14, height: 1.35)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chatComposer(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: TextField(
            controller: _messageCtrl,
            minLines: 1,
            maxLines: 4,
            textInputAction: TextInputAction.send,
            decoration: const InputDecoration(
              hintText: 'Message your team…',
            ),
            onSubmitted: (_) => _postMessage(),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          height: 50,
          child: FilledButton(
            onPressed: _posting ? null : _postMessage,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            child: _posting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.send_rounded),
          ),
        ),
      ],
    );
  }

  String _relative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat.yMMMd().format(dt);
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
