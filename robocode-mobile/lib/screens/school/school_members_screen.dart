import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// School-admin members: students + teachers with status and actions.
class SchoolMembersScreen extends StatefulWidget {
  const SchoolMembersScreen({super.key});
  @override
  State<SchoolMembersScreen> createState() => _SchoolMembersScreenState();
}

class _SchoolMembersScreenState extends State<SchoolMembersScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/school/members');

  void _reload() => setState(() => _future = _load());

  Future<void> _studentAction(String userId, String action) async {
    setState(() => _busy = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/school/students/$userId/$action');
      if (!mounted) return;
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resetPassword(String userId, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reset password for $name?'),
        content: const Text('A temporary password will be generated.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Reset')),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      final res = await ApiClient.instance
          .post<Map<String, dynamic>>('/school/members/$userId/reset-password');
      if (!mounted) return;
      final temp = res['temporaryPassword']?.toString();
      if (temp != null && temp.isNotEmpty) {
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Temporary password'),
            content: SelectableText(temp, style: const TextStyle(fontFamily: 'monospace', fontSize: 18)),
            actions: [TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Done'))],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password reset.')));
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Members')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final students = (data['students'] as List?) ?? const [];
            final teachers = (data['teachers'] as List?) ?? const [];
            // Flatten header + the two (unbounded) member sections into a single
            // list of builders so rows are built lazily as they scroll on.
            final items = <Widget Function()>[
              () => Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Row(
                      children: [
                        Expanded(child: StatTile(icon: Icons.check_circle_outline, label: 'Active', value: '${data['activeCount'] ?? 0}')),
                        const SizedBox(width: 8),
                        Expanded(child: StatTile(icon: Icons.hourglass_empty, label: 'Pending', value: '${data['pendingCount'] ?? 0}')),
                        const SizedBox(width: 8),
                        Expanded(child: StatTile(icon: Icons.block, label: 'Suspended', value: '${data['suspendedCount'] ?? 0}')),
                      ],
                    ),
                  ),
              () => SectionTitle('Students (${students.length})'),
              () => const SizedBox(height: 8),
              if (students.isEmpty)
                () => const HintCard('No students yet.')
              else
                for (final s in students) () => _studentTile(s as Map),
              () => const SizedBox(height: 24),
              () => SectionTitle('Teachers (${teachers.length})'),
              () => const SizedBox(height: 8),
              if (teachers.isEmpty)
                () => const HintCard('No teachers yet.')
              else
                for (final t in teachers) () => _teacherTile(t as Map),
              () => const SizedBox(height: 24),
            ];
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (context, i) => items[i](),
            );
          },
        ),
      ),
    );
  }

  Widget _studentTile(Map s) {
    final id = s['id']?.toString();
    final name = s['displayName']?.toString() ?? 'Student';
    final status = s['status']?.toString() ?? '';
    final suspended = status == 'suspended';
    return Card(
      child: ListTile(
        leading: SeedAvatar(seed: s['avatarSeed']?.toString(), name: name, size: 38),
        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(status),
        trailing: id == null
            ? null
            : PopupMenuButton<String>(
                enabled: !_busy,
                onSelected: (v) {
                  if (v == 'suspend') _studentAction(id, 'suspend');
                  if (v == 'reinstate') _studentAction(id, 'reinstate');
                  if (v == 'reset') _resetPassword(id, name);
                },
                itemBuilder: (_) => [
                  if (suspended)
                    const PopupMenuItem(value: 'reinstate', child: Text('Reinstate'))
                  else
                    const PopupMenuItem(value: 'suspend', child: Text('Suspend')),
                  const PopupMenuItem(value: 'reset', child: Text('Reset password')),
                ],
              ),
      ),
    );
  }

  Widget _teacherTile(Map t) {
    final id = t['id']?.toString();
    final name = t['displayName']?.toString() ?? 'Teacher';
    return Card(
      child: ListTile(
        leading: SeedAvatar(seed: t['avatarSeed']?.toString(), name: name, size: 38),
        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(t['email']?.toString() ?? ''),
        trailing: id == null
            ? null
            : TextButton(onPressed: _busy ? null : () => _resetPassword(id, name), child: const Text('Reset')),
      ),
    );
  }
}
